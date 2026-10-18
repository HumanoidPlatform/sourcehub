"""media.sweep — the clock that clears capture uploads that never finished.

A presign records a pending asset and, for a big file, opens a storage
session (db/530). A phone that is wiped, replaced, or never comes back online
leaves both behind. Google and Azure forget their side after seven days; S3
keeps an unfinished multipart upload — and bills for its parts — until someone
aborts it. This pass does the aborting: a pending capture with a session and
untouched for SESSION_STALE is aborted and soft-deleted; one without a session
(a single PUT that never came) is soft-deleted after PENDING_STALE. Confirmed
captures are never touched, and neither is anything a phone is still working
on: every status or part-URL call it makes moves updated_at.

Same shape as marketplace.sweep: a task inside the API process, one org
session per supplier (the asset policies are the supplier's), an advisory lock
so one API worker does the work, plan() pure, and
`python -m sourcehub.modules.media.sweep` for one pass by hand.
"""

from __future__ import annotations

import asyncio
import datetime as dt
import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING

from sqlalchemy import text

from sourcehub.config import settings
from sourcehub.db.session import anonymous_session, org_session
from sourcehub.modules.media import service as media
from sourcehub.modules.storage import service as storage_svc
from sourcehub.platform import storage

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger(__name__)

FIRST_PASS_DELAY = 30  # seconds after start-up, as the other clocks

# A day inside the providers' own seven: the abort lands while storage still
# knows the session, and a phone away for most of a week keeps its upload.
SESSION_STALE = dt.timedelta(days=6)
# A single PUT whose bytes never arrived has nothing to abort; it is only a
# row holding a place in the share (HELD_SQL stopped counting it after a day).
PENDING_STALE = dt.timedelta(days=7)
# upload_sweep_orgs() finds suppliers by the shorter of the two
BATCH = 200


@dataclass(frozen=True, slots=True)
class Stale:
    asset_id: uuid.UUID
    updated_at: dt.datetime
    has_session: bool


@dataclass(frozen=True, slots=True)
class Action:
    asset_id: uuid.UUID
    # 'abort': a session to close in storage, then the row goes.
    # 'drop':  nothing in storage to close; the row goes.
    kind: str


def plan(now: dt.datetime, rows: list[Stale]) -> list[Action]:
    """What each pending capture needs at `now`. Pure, so the rule is
    testable without a database."""
    out: list[Action] = []
    for r in rows:
        age = now - r.updated_at
        if r.has_session and age >= SESSION_STALE:
            out.append(Action(r.asset_id, "abort"))
        elif not r.has_session and age >= PENDING_STALE:
            out.append(Action(r.asset_id, "drop"))
    return out


async def _pass_supplier(
    session: AsyncSession, org_id: uuid.UUID, now: dt.datetime
) -> tuple[int, int]:
    rows = (
        (
            await session.execute(
                text(
                    "SELECT id, updated_at, storage_key, storage_target_id, upload_session "
                    "FROM asset "
                    "WHERE supplier_org_id = :org AND status = 'pending' AND deleted_at IS NULL "
                    "  AND updated_at < :cutoff "
                    "ORDER BY updated_at LIMIT :n FOR UPDATE SKIP LOCKED"
                ),
                {"org": org_id, "cutoff": now - SESSION_STALE, "n": BATCH},
            )
        )
        .mappings()
        .all()
    )
    by_id = {r["id"]: r for r in rows}
    stale = [Stale(r["id"], r["updated_at"], r["upload_session"] is not None) for r in rows]
    aborted = dropped = 0
    for action in plan(now, stale):
        r = by_id[action.asset_id]
        if action.kind == "abort":
            # Best effort: storage forgets the session on its own in a day,
            # and the row must go either way or the phone keeps a dead slot.
            try:
                target = await storage_svc.resolve_by_id(session, r["storage_target_id"])
                us = media.upload_session_from(r["upload_session"])
                if us is not None:
                    await storage.resumable_abort(target, r["storage_key"], us)
            except Exception:
                log.warning("could not abort the upload session of asset %s", r["id"])
            aborted += 1
        else:
            dropped += 1
        await session.execute(
            text(
                "UPDATE asset SET deleted_at = now(), updated_at = now(), upload_session = NULL "
                "WHERE id = :id"
            ),
            {"id": r["id"]},
        )
    return aborted, dropped


async def run_pass(now: dt.datetime | None = None) -> dict[str, int]:
    """One pass over every supplier with a stale upload. Returns counts for
    the log and the CLI. The advisory lock lives for the outer transaction, so
    a second API worker whose timer fires at the same moment skips."""
    now = now or dt.datetime.now(dt.UTC)
    counts = {"orgs": 0, "aborted": 0, "dropped": 0, "failed_orgs": 0, "skipped": 0}
    async with anonymous_session() as lock:
        got = (
            await lock.execute(text("SELECT pg_try_advisory_xact_lock(hashtext('upload_sweep'))"))
        ).scalar_one()
        if not got:
            counts["skipped"] = 1
            return counts
        org_ids = list((await lock.execute(text("SELECT upload_sweep_orgs()"))).scalars().all())
        for org_id in org_ids:
            counts["orgs"] += 1
            try:
                # The role only matters to policies that test for 'platform_admin'
                # or 'worker'; this session is neither, and asset's update policy
                # is the supplier's.
                async with org_session(org_id, "upload_sweep") as s:
                    aborted, dropped = await _pass_supplier(s, org_id, now)
                    counts["aborted"] += aborted
                    counts["dropped"] += dropped
            except Exception:
                counts["failed_orgs"] += 1
                log.exception("upload sweep failed for supplier %s", org_id)
    if counts["aborted"] or counts["dropped"] or counts["failed_orgs"]:
        log.info("upload sweep: %s", counts)
    return counts


async def run_forever() -> None:
    """The loop the API starts at boot. Never raises: a failed pass is logged
    and the next one runs on schedule."""
    await asyncio.sleep(FIRST_PASS_DELAY)
    while True:
        try:
            await run_pass()
        except Exception:
            log.exception("upload sweep failed")
        await asyncio.sleep(settings.upload_sweep_tick_seconds)


if __name__ == "__main__":
    # One pass now, and say what it did:  python -m sourcehub.modules.media.sweep
    logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
    print(asyncio.run(run_pass()))
