"""push — a worker's bell rows, sent to their phone.

Business rules, and the ONLY public surface of this module.

The bell (modules/notify) is written in the same transaction as the change it
announces, and the phone polls it while the app is open. This module gets the
same rows to a closed phone. It never sends from inside a request: run_pass()
reads rows that have already committed, so a decision that rolls back can
never have buzzed anyone's phone, and a slow Expo can never hold a request.

What gets pushed: every notification addressed to one user (user_id set)
whose user has a phone registered (app_user.push_token), within an hour of
being written, unless it was read in the bell first. Rows addressed to a
whole organisation never are: workers never see them. The bookkeeping lives
on notification itself (db/300): sent_at, or failed_at with a reason.

The pass, every PUSH_TICK_SECONDS:
  1. One uvicorn worker takes the advisory lock; the rest skip.
  2. push_pending() settles the rows that will never go ('too old',
     'already read', 'no push token') and returns the rest, oldest first.
  3. They go to Expo in batches of 100. Each ticket marks its row sent or
     failed; a DeviceNotRegistered ticket also forgets the token.
  4. A batch Expo refuses whole leaves its rows waiting for the next pass,
     until they are an hour old.

All of it runs in one transaction, so a second worker cannot pick up the same
rows while the first is still talking to Expo.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.config import PRODUCT, settings
from sourcehub.db.session import anonymous_session
from sourcehub.modules.push import expo

log = logging.getLogger(__name__)

FIRST_PASS_DELAY = 30  # seconds after start-up, as the other clocks
PER_PASS = 500
BODY_CHARS = 180  # what a notification shade shows before it cuts off
REASON_CHARS = 200
ANDROID_CHANNEL = "assignments"  # created by the app (mobile/src/notifications/push.ts)

Sender = Callable[[list[dict[str, Any]]], Awaitable[list[dict[str, Any]]]]


# ---------------------------------------------------------------------------
# The phone's own token
# ---------------------------------------------------------------------------

async def set_token(session: AsyncSession, token: str) -> None:
    """This phone now receives the signed-in user's notifications, and no
    one else's. The format is checked again in the database."""
    await session.execute(text("SELECT set_push_token(:t)"), {"t": token})


async def unset_token(session: AsyncSession, token: str) -> None:
    """Sign-out. A no-op unless the signed-in user still holds this token."""
    await session.execute(text("SELECT unset_push_token(:t)"), {"t": token})


# ---------------------------------------------------------------------------
# Pure: rows to messages, tickets to outcomes
# ---------------------------------------------------------------------------

def message(row: dict[str, Any]) -> dict[str, Any]:
    body = row["body"]
    if len(body) > BODY_CHARS:
        body = body[: BODY_CHARS - 1].rstrip() + "…"
    return {
        "to": row["token"],
        "title": PRODUCT,
        "body": body,
        # What the app needs to open the same screen the bell would, and to
        # mark this row read when the notification is tapped.
        "data": {
            "notification_id": str(row["id"]),
            "link_page": row["link_page"],
            "link_params": row["link_params"] or {},
        },
        "channelId": ANDROID_CHANNEL,
        "priority": "high",
        "sound": "default",
    }


@dataclass
class Outcome:
    sent: list[uuid.UUID] = field(default_factory=list)
    failed: dict[str, list[uuid.UUID]] = field(default_factory=dict)
    dead_tokens: set[str] = field(default_factory=set)


def settle(rows: list[dict[str, Any]], tickets: list[dict[str, Any]], into: Outcome) -> None:
    """One ticket per row, in order (expo.send guarantees the lengths match)."""
    for row, ticket in zip(rows, tickets, strict=True):
        if ticket.get("status") == "ok":
            into.sent.append(row["id"])
            continue
        error = (ticket.get("details") or {}).get("error") or ticket.get("message") or "unknown"
        reason = f"expo: {error}"[:REASON_CHARS]
        into.failed.setdefault(reason, []).append(row["id"])
        if error == "DeviceNotRegistered":
            into.dead_tokens.add(row["token"])


# ---------------------------------------------------------------------------
# The pass
# ---------------------------------------------------------------------------

async def _pending(session: AsyncSession, limit: int) -> list[dict[str, Any]]:
    rows = (
        await session.execute(text("SELECT * FROM push_pending(:n)"), {"n": limit})
    ).mappings().all()
    out = []
    for r in rows:
        params = r["link_params"]
        if isinstance(params, str):  # a driver without a jsonb codec
            params = json.loads(params)
        out.append({**r, "link_params": params})
    return out


async def _record(session: AsyncSession, outcome: Outcome) -> None:
    if outcome.sent:
        await session.execute(
            text("SELECT push_mark(CAST(:ids AS uuid[]), NULL)"),
            {"ids": list(outcome.sent)},
        )
    for reason, ids in outcome.failed.items():
        await session.execute(
            text("SELECT push_mark(CAST(:ids AS uuid[]), :r)"),
            {"ids": list(ids), "r": reason},
        )
    for token in outcome.dead_tokens:
        await session.execute(text("SELECT push_token_dead(:t)"), {"t": token})


async def run_pass(send: Sender = expo.send, open_session=anonymous_session) -> dict[str, int]:
    """One pass. Returns counts for the log and the CLI."""
    counts = {"sent": 0, "failed": 0, "waiting": 0, "skipped": 0}
    async with open_session() as session:
        got = (
            await session.execute(text("SELECT pg_try_advisory_xact_lock(hashtext('push'))"))
        ).scalar_one()
        if not got:
            counts["skipped"] = 1
            return counts
        rows = await _pending(session, PER_PASS)
        outcome = Outcome()
        for start in range(0, len(rows), expo.BATCH):
            batch = rows[start : start + expo.BATCH]
            try:
                tickets = await send([message(r) for r in batch])
            except expo.ExpoUnavailableError as exc:
                # Left waiting; the next pass tries again, until 'too old'.
                counts["waiting"] += len(rows) - start
                log.warning("push: Expo refused a batch, %d rows wait: %s",
                            len(rows) - start, exc)
                break
            settle(batch, tickets, outcome)
        await _record(session, outcome)
    counts["sent"] = len(outcome.sent)
    counts["failed"] = sum(len(ids) for ids in outcome.failed.values())
    if counts["sent"] or counts["failed"] or counts["waiting"]:
        log.info("push pass: %s", counts)
    return counts


async def run_forever() -> None:
    """The loop the API starts at boot. Never raises: a failed pass is logged
    and the next one runs on schedule."""
    await asyncio.sleep(FIRST_PASS_DELAY)
    while True:
        try:
            await run_pass()
        except Exception:
            log.exception("push pass failed")
        await asyncio.sleep(settings.push_tick_seconds)
