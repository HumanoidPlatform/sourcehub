"""marketplace.sweep — the clock that notices a bidding window has closed.

A request's deadline is enforced the moment anyone tries to bid: submit and
withdraw compare proposals_close_at with the time and refuse (service.py). What
nobody would otherwise do is TELL anyone — the client that the window has
closed and its proposals are waiting, the bidders that the client is now
deciding, and the partners who have not responded that a day remains. That is
this pass. run_pass() finds the clients with a window due within a day, and
decides in plan() — which is pure — what each one needs.

    kind      when                                               repeats
    remind    24 h before proposals_close_at, once, and only     no
              if the window was ever more than a day long
    close     once proposals_close_at has passed                 no

Nothing is stored about the window's state except two stamps on the request:
bidding_reminder_sent_at and closed_at. Both are written with a conditional
UPDATE (… WHERE the stamp IS NULL … RETURNING id), so a second pass over the
same window, or two API workers whose timers fire together, send nothing
twice; the advisory lock in run_pass is a courtesy on top of that. Moving the
deadline later (service.change_bidding_deadline) clears the stamps, which is
what makes an extended window close again.

Same shape as modules/engage: a task inside the API process, one org session
per client, and `python -m sourcehub.modules.marketplace.sweep` for one pass
by hand.
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
from sourcehub.modules.audit import service as audit
from sourcehub.modules.marketplace.service import (
    REMIND_BEFORE,
    fmt_utc,
    notify_active_tenants,
)
from sourcehub.modules.notify import service as notifier

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger(__name__)

FIRST_PASS_DELAY = 30  # seconds after start-up, as the engagement clock


@dataclass(frozen=True, slots=True)
class Window:
    request_id: uuid.UUID
    proposals_close_at: dt.datetime
    closed_at: dt.datetime | None
    reminder_sent_at: dt.datetime | None
    published_at: dt.datetime | None


@dataclass(frozen=True, slots=True)
class Action:
    request_id: uuid.UUID
    # 'close': the window has passed and nobody has been told.
    # 'remind': a day is left and nobody has been told.
    # 'stamp': a day is left but the window was never longer than a day, so a
    #          reminder would follow the announcement within minutes; record
    #          it as handled and say nothing.
    kind: str


def plan(now: dt.datetime, windows: list[Window]) -> list[Action]:
    """What each window needs at `now`. Pure, so the rules are testable
    without a database."""
    out: list[Action] = []
    for w in windows:
        if w.proposals_close_at <= now:
            if w.closed_at is None:
                out.append(Action(w.request_id, "close"))
            continue
        if w.reminder_sent_at is not None or w.proposals_close_at - now > REMIND_BEFORE:
            continue
        long_enough = (
            w.published_at is not None and w.published_at < w.proposals_close_at - REMIND_BEFORE
        )
        out.append(Action(w.request_id, "remind" if long_enough else "stamp"))
    return out


async def _windows(session: AsyncSession, org_id: uuid.UUID, now: dt.datetime) -> list[Window]:
    # Every row this pass may touch is locked HERE, before the first audit
    # line. write_audit_event() takes a global chain lock and keeps it to
    # commit; change_bidding_deadline() and award() take the request row first
    # and that chain second. Locking a second row only after the first close
    # had been audited would take the two in the other order, and two windows
    # of one client plus one concurrent edit could deadlock. NO KEY, so a bid
    # arriving meanwhile (a FOR KEY SHARE on the foreign key) is not held up.
    rows = (
        (
            await session.execute(
                text(
                    "SELECT id, proposals_close_at, closed_at, "
                    "       bidding_reminder_sent_at, published_at "
                    "FROM request "
                    "WHERE client_org_id = :org AND status = 'published' AND deleted_at IS NULL "
                    "  AND proposals_close_at IS NOT NULL "
                    "  AND proposals_close_at <= :horizon "
                    "FOR NO KEY UPDATE"
                ),
                {"org": org_id, "horizon": now + REMIND_BEFORE},
            )
        )
        .mappings()
        .all()
    )
    return [
        Window(
            r["id"],
            r["proposals_close_at"],
            r["closed_at"],
            r["bidding_reminder_sent_at"],
            r["published_at"],
        )
        for r in rows
    ]


async def _bidders(session: AsyncSession, request_id: uuid.UUID) -> list[uuid.UUID]:
    """Partners with a live bid. Read under the client's session, which sees
    every proposal on its own request (proposal_select)."""
    return list(
        (
            await session.execute(
                text(
                    "SELECT partner_org_id FROM proposal "
                    "WHERE request_id = :id AND status = 'submitted' AND deleted_at IS NULL"
                ),
                {"id": request_id},
            )
        )
        .scalars()
        .all()
    )


async def _close(
    session: AsyncSession, org_id: uuid.UUID, request_id: uuid.UUID, now: dt.datetime
) -> bool:
    # Conditional, and RETURNING: no row back means the client moved the
    # deadline or awarded between the read and this write, and the notice
    # would be wrong. Only a row that was actually stamped is announced.
    row = (
        (
            await session.execute(
                text(
                    # The reminder stamp too: a window that shut before any pass
                    # reminded about it would otherwise keep its client in
                    # bidding_sweep_orgs() until the award, visited every tick.
                    "UPDATE request SET closed_at = :now, "
                    "    bidding_reminder_sent_at = coalesce(bidding_reminder_sent_at, :now) "
                    "WHERE id = :id AND status = 'published' AND closed_at IS NULL "
                    "  AND proposals_close_at <= :now "
                    "RETURNING reference_code, title, proposals_close_at"
                ),
                {"now": now, "id": request_id},
            )
        )
        .mappings()
        .one_or_none()
    )
    if row is None:
        return False
    bidders = await _bidders(session, request_id)
    n = len(bidders)
    what = "no proposals" if n == 0 else f"{n} proposal" if n == 1 else f"{n} proposals"
    await audit.log(
        session,
        "request.bidding_closed",
        f"Bidding on {row['reference_code']} closed "
        f"{fmt_utc(row['proposals_close_at'])} with {what}",
        [request_id, org_id],
        {"by": "clock", "proposals": n},
    )
    await notifier.notify(
        session,
        org_id,
        f"Bidding on {row['title']} has closed with {what}. "
        + (
            "Extend the deadline to reopen it, or let it lapse."
            if n == 0
            else "Review them and award."
        ),
        "requestDetail",
        {"id": str(request_id)},
    )
    for partner in bidders:
        await notifier.notify(
            session,
            partner,
            f"Bidding on {row['title']} has closed. The client is reviewing the proposals.",
            "requestDetail",
            {"id": str(request_id)},
        )
    return True


async def _remind(
    session: AsyncSession, request_id: uuid.UUID, now: dt.datetime, *, say: bool
) -> bool:
    row = (
        (
            await session.execute(
                text(
                    # Re-checked against the clock, as _close is: the client may
                    # have moved the window a week out since it was planned, and
                    # stamping THAT window would say "24 hours" of a date weeks
                    # away and silence the reminder it will actually deserve.
                    "UPDATE request SET bidding_reminder_sent_at = :now "
                    "WHERE id = :id AND status = 'published' AND bidding_reminder_sent_at IS NULL "
                    "  AND proposals_close_at > :now AND proposals_close_at <= :horizon "
                    "RETURNING title, proposals_close_at"
                ),
                {"now": now, "horizon": now + REMIND_BEFORE, "id": request_id},
            )
        )
        .mappings()
        .one_or_none()
    )
    if row is None or not say:
        return False
    # to the partners who have NOT responded; the bidders have nothing to do
    sent = await notify_active_tenants(
        session,
        f"Bidding on {row['title']} closes in 24 hours ({fmt_utc(row['proposals_close_at'])}).",
        request_id,
        except_orgs=await _bidders(session, request_id),
    )
    return sent > 0


async def _pass_client(
    session: AsyncSession, org_id: uuid.UUID, now: dt.datetime
) -> tuple[int, int]:
    closed = reminded = 0
    for action in plan(now, await _windows(session, org_id, now)):
        if action.kind == "close":
            closed += await _close(session, org_id, action.request_id, now)
        else:
            reminded += await _remind(session, action.request_id, now, say=action.kind == "remind")
    return closed, reminded


async def run_pass(now: dt.datetime | None = None) -> dict[str, int]:
    """One pass over every client with a window due. Returns counts for the
    log and the CLI. The advisory lock lives for the outer transaction, so a
    second API worker whose timer fires at the same moment finds it taken and
    skips."""
    now = now or dt.datetime.now(dt.UTC)
    counts = {"orgs": 0, "closed": 0, "reminded": 0, "failed_orgs": 0, "skipped": 0}
    async with anonymous_session() as lock:
        got = (
            await lock.execute(
                text("SELECT pg_try_advisory_xact_lock(hashtext('bidding_deadline'))")
            )
        ).scalar_one()
        if not got:
            counts["skipped"] = 1
            return counts
        org_ids = list((await lock.execute(text("SELECT bidding_sweep_orgs()"))).scalars().all())
        for org_id in org_ids:
            counts["orgs"] += 1
            try:
                async with org_session(org_id, "client") as s:
                    closed, reminded = await _pass_client(s, org_id, now)
                    counts["closed"] += closed
                    counts["reminded"] += reminded
            except Exception:
                counts["failed_orgs"] += 1
                log.exception("bidding sweep failed for client %s", org_id)
    if counts["closed"] or counts["reminded"] or counts["failed_orgs"]:
        log.info("bidding sweep: %s", counts)
    return counts


async def run_forever() -> None:
    """The loop the API starts at boot. Never raises: a failed pass is logged
    and the next one runs on schedule."""
    await asyncio.sleep(FIRST_PASS_DELAY)
    while True:
        try:
            await run_pass()
        except Exception:
            log.exception("bidding sweep failed")
        await asyncio.sleep(settings.bidding_sweep_tick_seconds)


if __name__ == "__main__":
    # One pass now, and say what it did:  python -m sourcehub.modules.marketplace.sweep
    logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
    print(asyncio.run(run_pass()))
