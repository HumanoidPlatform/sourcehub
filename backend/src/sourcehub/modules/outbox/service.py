"""outbox — every e-mail the platform sends, queued in the deciding transaction.

Business rules, and the ONLY public surface of this module.

A mail is never sent from inside a request. The transaction that decides to
mail — publishing an RFP, inviting a colleague, offering a task, answering a
quote request — writes a mail_outbox row (db/470, db/480) and commits; this
module's clock renders and sends the row a few seconds later. So a decision
that rolls back mails nobody, a slow mail server never holds a request, and one
table answers "did it go?" for operations (the Mail screen: today's counts,
the failures and why, a re-send). The same shape as push (modules/push).

Two ways in, both inside the caller's transaction:
  enqueue()     one mail per active user of each organisation (the RFP mails)
  enqueue_to()  one address: resets, invitations, offers, reminders, replies

The pass, every MAIL_OUTBOX_TICK_SECONDS:
  1. One uvicorn worker takes the advisory lock; the rest skip.
  2. mail_pending() settles rows older than 48 hours ('too old') and rows
     whose link has died ('link expired'), and returns the rest that are due:
     a person's mail before a fan-out, then oldest first, at most
     MAIL_OUTBOX_BATCH of them (db/490).
  3. Each row is rendered from its template and context
     (platform/mail/messages.build). A row that cannot become a mail — an
     unknown template, a context the builder refuses, or an address on a
     reserved domain while MAIL_OUTBOX_SKIP_RESERVED_DOMAINS is on — is
     marked failed with the reason.
  4. The rest go over one SMTP connection. The server's answer decides each
     row: a permanent refusal (5xx) fails it; a temporary one (4xx, Gmail's
     daily limit, a connection dropped mid-batch) defers it by the next step
     of RETRY_AFTER, and after the last step it fails. A connection or login
     failure before anything is sent leaves every row waiting for the next
     pass, until it is too old.
  5. mail_mark() writes the outcome onto the offer recipient or reminder the
     mail was about, and empties the context of a sent token mail.
Once an hour the pass also purges rows past their retention.

All of it runs in one transaction, so a second worker cannot pick up the same
rows while the first is still talking to the mail server.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from sourcehub.config import settings
from sourcehub.db.session import anonymous_session
from sourcehub.modules.audit import service as audit
from sourcehub.platform.mail import messages, smtp

if TYPE_CHECKING:
    import datetime as dt
    import uuid
    from contextlib import AbstractAsyncContextManager

    from sqlalchemy.ext.asyncio import AsyncSession

    from sourcehub.api.security import AccessClaims

    Opener = Callable[[], AbstractAsyncContextManager[AsyncSession]]

log = logging.getLogger(__name__)

FIRST_PASS_DELAY = 5  # seconds after start-up: a reset mail must not wait for a slow boot
PURGE_EVERY = 3600  # seconds between retention sweeps
REASON_CHARS = 300
# A temporary refusal is tried again after these many seconds, one step per
# refusal: 1 min, 5 min, 15 min, 1 h, 4 h — six tries over about 5.5 hours.
# mail_defer (db/490) fails the row sooner if the next try would pass its two
# days or the life of the link inside it.
RETRY_AFTER = (60, 300, 900, 3600, 14400)
# RFC 2606 / 6761 names and the Docker/mDNS suffix: a database seeded with
# demo accounts must never bounce off a real provider.
RESERVED_DOMAINS = (".example", ".test", ".invalid", ".localhost", ".local")
STATUSES = ("failed", "all", "waiting", "sent")

Sender = Callable[[Sequence[smtp.Message]], Awaitable[list[smtp.SendError | None]]]
Entity = tuple[str, "uuid.UUID"]  # (entity_type, entity_id): what a mail is about


class OutboxError(Exception):
    """A refusal the caller can act on (a re-send the database would not do)."""


# ---------------------------------------------------------------------------
# Writing: inside the deciding transaction
# ---------------------------------------------------------------------------


async def enqueue(
    session: AsyncSession,
    template: str,
    context: dict[str, Any],
    org_ids: Sequence[uuid.UUID],
    *,
    entity: Entity | None = None,
    label: str = "",
) -> int:
    """One mail per active user of each organisation, written in THIS
    transaction: it rolls back with the decision it announces. The recipients
    are found in the database (db/470 org_mail_recipients), never read into a
    client's session, which RLS would refuse. Returns how many were written."""
    if not org_ids:
        return 0
    n = (
        await session.execute(
            text(
                "SELECT mail_enqueue(:t, CAST(:c AS jsonb), CAST(:o AS uuid[]), "
                ":et, CAST(:ei AS uuid), :l)"
            ),
            {
                "t": template,
                "c": json.dumps(context, default=str),
                "o": list(org_ids),
                "et": entity[0] if entity else None,
                "ei": entity[1] if entity else None,
                "l": label,
            },
        )
    ).scalar_one()
    return int(n or 0)


async def enqueue_to(
    session: AsyncSession,
    template: str,
    context: dict[str, Any],
    *,
    to_email: str,
    to_name: str = "",
    entity: Entity | None = None,
    label: str = "",
    reply_to: str | None = None,
    scrub: bool = False,
    resend_until: dt.datetime | None = None,
) -> uuid.UUID:
    """One mail to one address, written in THIS transaction (db/480
    mail_enqueue_to). `scrub` marks a mail that carries a link token: its
    context is emptied once sent, so the token lives only in the mailbox.
    `resend_until` is when that link dies; Ops cannot re-send past it. Works
    from an anonymous session too (a password reset has no organisation)."""
    row_id = (
        await session.execute(
            text(
                "SELECT mail_enqueue_to(:t, CAST(:c AS jsonb), CAST(:to AS citext), :name, "
                ":reply, :et, CAST(:ei AS uuid), :l, :scrub, :until)"
            ),
            {
                "t": template,
                "c": json.dumps(context, default=str),
                "to": to_email,
                "name": to_name,
                "reply": reply_to,
                "et": entity[0] if entity else None,
                "ei": entity[1] if entity else None,
                "l": label,
                "scrub": scrub,
                "until": resend_until,
            },
        )
    ).scalar_one()
    return row_id  # type: ignore[no-any-return]


# ---------------------------------------------------------------------------
# Pure: rows to messages, and when to purge
# ---------------------------------------------------------------------------


def is_reserved(email: str) -> bool:
    return email.strip().lower().rstrip(".").endswith(RESERVED_DOMAINS)


def purge_due(now: float, last: float | None, every: float = PURGE_EVERY) -> bool:
    """Whether a pass should also run the retention sweep."""
    return last is None or now - last >= every


def clip(head: str, tail: str = "") -> str:
    """A reason that fits the column with its ending kept: a long server answer
    is cut, never the "; gave up after 6 tries" that explains it."""
    return head[: REASON_CHARS - len(tail)] + tail


def retry_after(attempts: int) -> int | None:
    """Seconds until the next try for a row a temporary refusal has already
    deferred `attempts` times; None when the tries are spent."""
    return RETRY_AFTER[attempts] if 0 <= attempts < len(RETRY_AFTER) else None


@dataclass
class Outcome:
    sent: list[uuid.UUID] = field(default_factory=list)
    failed: dict[str, list[uuid.UUID]] = field(default_factory=dict)
    deferred: dict[tuple[str, int], list[uuid.UUID]] = field(default_factory=dict)
    # never offered: the server hung up earlier in the batch. Left as they were.
    untried: list[uuid.UUID] = field(default_factory=list)

    def fail(self, row_id: uuid.UUID, reason: str) -> None:
        self.failed.setdefault(reason[:REASON_CHARS], []).append(row_id)

    def defer(self, row_id: uuid.UUID, reason: str, seconds: int) -> None:
        self.deferred.setdefault((reason[:REASON_CHARS], seconds), []).append(row_id)

    def settle(self, row: dict[str, Any], err: smtp.SendError | None) -> None:
        """One row's answer from the server: sent, deferred or failed."""
        if err is None:
            self.sent.append(row["id"])
        elif not err.tried:
            self.untried.append(row["id"])
        elif not err.temporary:
            self.fail(row["id"], f"smtp: {err.text}")
        else:
            tried = int(row.get("attempts") or 0)
            wait = retry_after(tried)
            if wait is None:
                self.fail(
                    row["id"], clip(f"smtp: {err.text}", f"; gave up after {tried + 1} tries")
                )
            else:
                self.defer(row["id"], f"smtp: {err.text}", wait)


def prepare(
    rows: list[dict[str, Any]], *, skip_reserved: bool, into: Outcome
) -> tuple[list[dict[str, Any]], list[smtp.Message]]:
    """The rows that can be sent, with their messages, in order. A row that
    cannot become a mail is failed in `into` with the reason, here, before any
    connection is opened."""
    ready: list[dict[str, Any]] = []
    msgs: list[smtp.Message] = []
    for r in rows:
        if skip_reserved and is_reserved(r["to_email"]):
            into.fail(r["id"], "reserved domain")
            continue
        try:
            subject, body, html = messages.build(r["template"], r["context"])
        except KeyError:
            into.fail(r["id"], f"unknown template {r['template']}")
            continue
        except Exception as e:  # a stored context the builder refuses
            into.fail(r["id"], f"render failed: {type(e).__name__}")
            continue
        ready.append(r)
        msgs.append((r["to_email"], subject, body, html, r.get("reply_to")))
    return ready, msgs


# ---------------------------------------------------------------------------
# The pass
# ---------------------------------------------------------------------------


async def _pending(session: AsyncSession, limit: int) -> list[dict[str, Any]]:
    rows = (
        (await session.execute(text("SELECT * FROM mail_pending(:n)"), {"n": limit}))
        .mappings()
        .all()
    )
    out = []
    for r in rows:
        ctx = r["context"]
        if isinstance(ctx, str):  # a driver without a jsonb codec
            ctx = json.loads(ctx)
        out.append({**r, "context": ctx or {}})
    return out


async def _record(session: AsyncSession, outcome: Outcome) -> None:
    if outcome.sent:
        await session.execute(
            text("SELECT mail_mark(CAST(:ids AS uuid[]), NULL)"),
            {"ids": list(outcome.sent)},
        )
    for reason, ids in outcome.failed.items():
        await session.execute(
            text("SELECT mail_mark(CAST(:ids AS uuid[]), :r)"),
            {"ids": list(ids), "r": reason},
        )
    for (reason, seconds), ids in outcome.deferred.items():
        # In a savepoint: the marks above record mail that has left the
        # machine, and must commit whatever happens here. A database not yet
        # at 0053 has no mail_defer; rolling the whole pass back would send
        # the delivered mail again on every tick. Failing these rows instead
        # is what 0052 did with a refusal.
        try:
            async with session.begin_nested():
                await session.execute(
                    text("SELECT mail_defer(CAST(:ids AS uuid[]), :r, make_interval(secs => :s))"),
                    {"ids": list(ids), "r": reason, "s": seconds},
                )
        except DBAPIError as exc:
            log.error(
                "outbox: could not defer %d rows (%s); failing them instead",
                len(ids),
                type(exc.orig).__name__,
            )
            await session.execute(
                text("SELECT mail_mark(CAST(:ids AS uuid[]), :r)"),
                {"ids": list(ids), "r": reason},
            )


async def run_pass(
    send: Sender = smtp.send_many, open_session: Opener = anonymous_session
) -> dict[str, int]:
    """One pass. Returns counts for the log and the CLI."""
    counts = {"sent": 0, "failed": 0, "deferred": 0, "waiting": 0, "skipped": 0}
    async with open_session() as session:
        got = (
            await session.execute(text("SELECT pg_try_advisory_xact_lock(hashtext('mail_outbox'))"))
        ).scalar_one()
        if not got:
            counts["skipped"] = 1
            return counts
        rows = await _pending(session, settings.mail_outbox_batch)
        outcome = Outcome()
        ready, msgs = prepare(
            rows, skip_reserved=settings.mail_outbox_skip_reserved_domains, into=outcome
        )
        if msgs:
            try:
                errors = await send(msgs)
            except OSError as exc:
                # Connection or login: nothing left the machine. Left waiting;
                # the next pass tries again, until 'too old'.
                counts["waiting"] = len(ready)
                log.warning("outbox: mail server unavailable, %d rows wait: %s", len(ready), exc)
            else:
                for r, err in zip(ready, errors, strict=True):
                    outcome.settle(r, err)
                counts["waiting"] = len(outcome.untried)
        await _record(session, outcome)
    counts["sent"] = len(outcome.sent)
    counts["failed"] = sum(len(ids) for ids in outcome.failed.values())
    counts["deferred"] = sum(len(ids) for ids in outcome.deferred.values())
    if counts["sent"] or counts["failed"] or counts["deferred"] or counts["waiting"]:
        log.info("outbox pass: %s", counts)
    return counts


async def purge(open_session: Opener = anonymous_session) -> int:
    """Retention (db/480 mail_purge): sent rows after MAIL_OUTBOX_KEEP_SENT_DAYS,
    failed ones after MAIL_OUTBOX_KEEP_FAILED_DAYS. Returns how many went."""
    async with open_session() as session:
        n = (
            await session.execute(
                text("SELECT mail_purge(:s, :f)"),
                {
                    "s": settings.mail_outbox_keep_sent_days,
                    "f": settings.mail_outbox_keep_failed_days,
                },
            )
        ).scalar_one()
    if n:
        log.info("outbox purge: %d rows past retention removed", n)
    return int(n or 0)


async def run_forever() -> None:
    """The loop the API starts at boot. Never raises: a failed pass is logged
    and the next one runs on schedule."""
    await asyncio.sleep(FIRST_PASS_DELAY)
    last_purge: float | None = None
    while True:
        try:
            await run_pass()
            if purge_due(time.monotonic(), last_purge):
                await purge()
                last_purge = time.monotonic()
        except Exception:
            log.exception("outbox pass failed")
        await asyncio.sleep(settings.mail_outbox_tick_seconds)


# ---------------------------------------------------------------------------
# Operations: the Mail screen
# ---------------------------------------------------------------------------


def _reason(e: DBAPIError) -> str:
    """The database's own sentence, without the driver's framing
    ("<class 'asyncpg…RaiseError'>: ") or the function's name — what follows
    the function's prefix, as catalogue._reason does for its triggers."""
    msg = str(getattr(e, "orig", None) or e)
    for prefix in ("mail_resend: ", "mail_log: ", "mail_stats: "):
        at = msg.find(prefix)
        if at >= 0:
            return msg[at + len(prefix) :].split("\n", 1)[0].strip()[:REASON_CHARS]
    return "The database refused the change."


async def stats(session: AsyncSession) -> dict[str, Any]:
    """Today's counts (UTC), the waiting queue, the failures not yet re-sent
    and the last seven days — for the tiles and the chart."""
    raw = (await session.execute(text("SELECT mail_stats()"))).scalar_one()
    doc: dict[str, Any] = json.loads(raw) if isinstance(raw, str) else dict(raw or {})
    return doc


async def log_rows(
    session: AsyncSession, status: str, limit: int, before: dt.datetime | None
) -> list[dict[str, Any]]:
    """The log, newest first. `status` is one of STATUSES; `before` pages back."""
    if status not in STATUSES:
        raise OutboxError(f"status must be one of {', '.join(STATUSES)}")
    rows = (
        (
            await session.execute(
                text("SELECT * FROM mail_log(:s, :n, :b)"),
                {"s": status, "n": limit, "b": before},
            )
        )
        .mappings()
        .all()
    )
    return [dict(r) for r in rows]


async def resend(session: AsyncSession, claims: AccessClaims, mail_id: uuid.UUID) -> uuid.UUID:
    """Queue a failed mail again (db/480 mail_resend): a new row the next pass
    sends, linked to the failed one. LookupError when there is no such row;
    OutboxError with the database's reason when it will not be re-sent."""
    try:
        new_id = (
            await session.execute(text("SELECT mail_resend(:id)"), {"id": mail_id})
        ).scalar_one()
    except DBAPIError as e:
        reason = _reason(e)
        if "no such mail" in reason:
            raise LookupError("mail not found") from None
        raise OutboxError(reason) from None
    await audit.log(
        session,
        "mail.resent",
        f"{claims.full_name} re-sent a failed platform e-mail",
        [new_id, mail_id, claims.org_id],
    )
    return new_id  # type: ignore[no-any-return]
