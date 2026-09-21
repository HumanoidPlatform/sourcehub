"""engage — reminders that keep the crowd moving.

Business rules, and the ONLY public surface of this module.

An offer is mailed once (delivery.create_offer) and an assignment is a row the
worker may never open. This module is the clock the rest of the stack never
had: run_pass() looks at every supplier's open offers and live assignments,
decides in plan() — which is pure — who should hear from us now, and sends by
email plus the in-app bell the phone already polls. remind_offer() and
remind_assignment() are the same thing by hand, from the console.

The rules, all constants below (no per-organisation settings yet):

    kind                 when                                         repeats
    offer_nudge          half-way through the respond-by window       once
                         (a window under 12 h gets no nudge)
    offer_closing        24 h before respond_by, places left,         once
                         once the offer is 12 h old
    assignment_start     accepted, not started, after 2 days          every 2 days
    assignment_rework    rejected at gate 1, not restarted, 2 days    every 2 days
    assignment_due_soon  due within 2 days                            once
    assignment_overdue   the day after due_on                         every 3 days

One reminder per subject per pass — the most urgent applicable kind only
(overdue, due soon, rework, start; closing before nudge) — and none within
20 h of the last one of any kind, 6 h for offer_closing, which may follow a
nudge on a short window. The engagement_reminder table remembers what went
out; its partial unique indexes on (subject, kind, step) make a repeated pass
over the same state a no-op even if the advisory lock ever failed to
serialise two passes.
"""

from __future__ import annotations

import asyncio
import datetime as dt
import html
import logging
import math
import uuid
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims, new_opaque_token
from sourcehub.config import CAPTURE_APP, PRODUCT, settings
from sourcehub.db.session import anonymous_session, org_session
from sourcehub.modules.audit import service as audit
from sourcehub.modules.delivery import service as delivery
from sourcehub.modules.notify import service as notifier

log = logging.getLogger(__name__)

NUDGE_MIN_WINDOW = dt.timedelta(hours=12)
CLOSING_BEFORE = dt.timedelta(hours=24)
CLOSING_MIN_AGE = dt.timedelta(hours=12)  # a two-hour offer gets no last call
START_AFTER_DAYS = 2
DUE_SOON_DAYS = 2
OVERDUE_EVERY_DAYS = 3
COOLDOWN = dt.timedelta(hours=20)
CLOSING_COOLDOWN = dt.timedelta(hours=6)
MANUAL_COOLDOWN = dt.timedelta(hours=1)
FIRST_PASS_DELAY = 30  # seconds after start-up, so a deploy does not mail before it is healthy

LIVE_ASSIGNMENT = ("assigned", "in_progress", "rejected")


class EngageError(Exception):
    """A manual reminder that cannot be sent, in words for the console."""


# ---------------------------------------------------------------------------
# The planner — pure
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class OfferSubject:
    """One silent recipient of an offer, as the planner sees them."""

    recipient_id: uuid.UUID
    worker_user_id: uuid.UUID
    sent_at: dt.datetime | None
    response: str | None
    offer_created_at: dt.datetime
    respond_by: dt.datetime
    offer_status: str
    accepted_count: int
    worker_limit: int


@dataclass(frozen=True)
class AssignmentSubject:
    assignment_id: uuid.UUID
    worker_user_id: uuid.UUID
    status: str
    assigned_at: dt.datetime
    decided_at: dt.datetime | None
    due_on: dt.date | None


@dataclass(frozen=True)
class Sent:
    """A reminder already recorded, clock or manual."""

    subject_id: uuid.UUID
    kind: str
    step: int
    created_at: dt.datetime


@dataclass(frozen=True)
class Due:
    kind: str
    step: int
    subject_id: uuid.UUID
    worker_user_id: uuid.UUID


def offer_kind(now: dt.datetime, o: OfferSubject) -> tuple[str, int] | None:
    """The one offer reminder this recipient is due, if any."""
    if o.sent_at is None or o.response is not None or o.offer_status != "open":
        return None
    if o.accepted_count >= o.worker_limit or o.respond_by <= now:
        return None
    if o.respond_by - now <= CLOSING_BEFORE and now - o.offer_created_at >= CLOSING_MIN_AGE:
        return ("offer_closing", 0)
    window = o.respond_by - o.offer_created_at
    if window >= NUDGE_MIN_WINDOW and now >= o.offer_created_at + window / 2:
        return ("offer_nudge", 0)
    return None


def assignment_kind(now: dt.datetime, a: AssignmentSubject) -> tuple[str, int] | None:
    """The one assignment reminder due, most urgent first. The step counts
    repeats, so the same state on a later day is a new key."""
    if a.status not in LIVE_ASSIGNMENT:
        return None
    today = now.date()
    if a.due_on is not None:
        over = (today - a.due_on).days
        if over >= 1:
            return ("assignment_overdue", (over - 1) // OVERDUE_EVERY_DAYS)
        if -over <= DUE_SOON_DAYS:
            return ("assignment_due_soon", 0)
    if a.status == "rejected" and a.decided_at is not None:
        days = (now - a.decided_at).days
        if days >= START_AFTER_DAYS:
            return ("assignment_rework", days // START_AFTER_DAYS)
    if a.status == "assigned":
        days = (now - a.assigned_at).days
        if days >= START_AFTER_DAYS:
            return ("assignment_start", days // START_AFTER_DAYS)
    return None


def plan(
    now: dt.datetime,
    offers: list[OfferSubject],
    assignments: list[AssignmentSubject],
    sent: list[Sent],
) -> list[Due]:
    """Everything due now, given what has already gone out."""
    done = {(s.subject_id, s.kind, s.step) for s in sent}
    last: dict[uuid.UUID, dt.datetime] = {}
    for s in sent:
        if s.subject_id not in last or s.created_at > last[s.subject_id]:
            last[s.subject_id] = s.created_at

    def pick(subject_id: uuid.UUID, worker: uuid.UUID, kind: str, step: int) -> Due | None:
        if (subject_id, kind, step) in done:
            return None
        cool = CLOSING_COOLDOWN if kind == "offer_closing" else COOLDOWN
        if subject_id in last and now - last[subject_id] < cool:
            return None
        return Due(kind, step, subject_id, worker)

    out: list[Due] = []
    for o in offers:
        k = offer_kind(now, o)
        if k and (d := pick(o.recipient_id, o.worker_user_id, *k)):
            out.append(d)
    for a in assignments:
        k = assignment_kind(now, a)
        if k and (d := pick(a.assignment_id, a.worker_user_id, *k)):
            out.append(d)
    return out


# ---------------------------------------------------------------------------
# The words
# ---------------------------------------------------------------------------

def _due_phrase(due_on: dt.date, today: dt.date) -> str:
    n = (due_on - today).days
    if n <= 0:
        return "today"
    if n == 1:
        return "tomorrow"
    return f"in {n} days"


def offer_lead(
    kind: str, now: dt.datetime, respond_by: dt.datetime, places_left: int, worker_limit: int
) -> str:
    places = f"{places_left} of {worker_limit} place" + ("s" if worker_limit != 1 else "")
    if kind == "offer_closing":
        hours = max(1, math.ceil((respond_by - now) / dt.timedelta(hours=1)))
        return (
            f"Last call — this offer closes in {hours} hour{'s' if hours != 1 else ''}, "
            f"and {places} still open."
        )
    return f"A reminder — you have not answered this offer yet, and {places} still open."


def assignment_reminder_email(
    *,
    kind: str,
    worker_name: str,
    org_name: str,
    task_ref: str,
    task_title: str,
    unit: str,
    quantity: int,
    due_on: dt.date | None,
    days: int,
    today: dt.date,
) -> tuple[str, str, str, str]:
    """(subject, text, html, line). `line` is the one sentence that also goes
    on the phone's bell. No link: the work is in the app, not on a page."""
    title = f"{task_ref} {task_title}"
    due = due_on.isoformat() if due_on else "not set"
    if kind == "assignment_overdue":
        subject = f"Overdue: {title} was due {due}"
        line = (f"This task was due on {due} and has not been submitted. "
                f"Please finish it, or tell {org_name} if you cannot.")
        action = "finish and submit it"
    elif kind == "assignment_due_soon":
        if due_on:
            when = _due_phrase(due_on, today)
            subject = f"Reminder: {title} is due {when}"
            line = f"This task is due {when}. Capture and submit before then."
        else:
            subject = f"Reminder: {title} is waiting to be finished"
            line = "This task is still open. Capture and submit as soon as you can."
        action = "finish and submit it"
    elif kind == "assignment_rework":
        subject = f"Reminder: {title} needs rework"
        line = (f"The batch you submitted was sent back for rework {days} day"
                f"{'s' if days != 1 else ''} ago and has not been restarted.")
        action = "see what must change and start again"
    else:  # assignment_start
        subject = f"Reminder: {title} is waiting for you to start"
        line = (f"You accepted this task {days} day{'s' if days != 1 else ''} ago "
                "and have not started it yet.")
        action = "start it"

    text_body = (
        f"Hello {worker_name},\n\n"
        f"{line}\n\n"
        f"  Task:          {title}\n"
        f"  Your share:    {quantity} {unit}\n"
        f"  Due:           {due}\n\n"
        f"Open the {CAPTURE_APP} app to {action}.\n\n"
        f"{org_name} on {PRODUCT}"
    )
    e = html.escape
    rows = [("Task", e(title)), ("Your share", f"{quantity} {e(unit)}"), ("Due", e(due))]
    trs = "".join(
        f'<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap">{k}</td>'
        f'<td style="padding:4px 0">{v}</td></tr>'
        for k, v in rows
    )
    html_body = (
        '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'
        'font-size:15px;line-height:1.45;color:#1c1c1c;max-width:560px">'
        f"<p>Hello {e(worker_name)},</p>"
        f"<p><strong>{e(line)}</strong></p>"
        f'<table style="border-collapse:collapse;font-size:15px">{trs}</table>'
        f"<p>Open the {e(CAPTURE_APP)} app to {e(action)}.</p>"
        f'<p style="color:#666;font-size:13px">{e(org_name)} on {e(PRODUCT)}</p>'
        "</div>"
    )
    return subject, text_body, html_body, line


# ---------------------------------------------------------------------------
# Reading the live state under an organisation's context
# ---------------------------------------------------------------------------

# Silent recipients of open offers that can still be accepted: the task is
# still taking workers and the worker's grant is live, or the link would only
# tell them the offer is closed.
_OFFER_ROWS = (
    "SELECT r.id AS recipient_id, r.worker_user_id, r.email, r.sent_at, r.response, "
    "       o.id AS offer_id, o.created_at AS offer_created_at, o.respond_by, "
    "       o.status AS offer_status, o.accepted_count, o.worker_limit, o.quantity, "
    "       o.instructions, o.due_on, o.task_id, "
    "       t.reference_code AS task_ref, t.title AS task_title, t.target_unit, "
    "       coalesce(w.display_name, u.full_name) AS worker_name "
    "FROM task_offer o "
    "JOIN task_offer_recipient r ON r.offer_id = o.id "
    "JOIN task t ON t.id = o.task_id "
    "JOIN app_user u ON u.id = r.worker_user_id "
    "LEFT JOIN crowd_worker w ON w.user_id = r.worker_user_id "
    "                        AND w.aggregator_org_id = o.supplier_org_id AND w.deleted_at IS NULL "
    "WHERE o.status = 'open' AND o.respond_by > now() "
    "  AND r.response IS NULL AND r.sent_at IS NOT NULL "
    "  AND t.status IN ('assigned', 'in_progress', 'qa_failed') "
    "  AND u.status = 'active' "
    "  AND EXISTS (SELECT 1 FROM user_role_grant g JOIN role rl ON rl.id = g.role_id "
    "              WHERE g.user_id = r.worker_user_id AND g.org_id = o.supplier_org_id "
    "                AND rl.code = 'worker' AND g.revoked_at IS NULL) "
)

_ASSIGNMENT_ROWS = (
    "SELECT a.id AS assignment_id, a.worker_user_id, a.status, a.assigned_at, a.decided_at, "
    "       a.due_on, a.quantity, a.task_id, "
    "       t.reference_code AS task_ref, t.title AS task_title, t.target_unit, "
    "       coalesce(w.email, u.email) AS email, "
    "       coalesce(w.display_name, u.full_name) AS worker_name "
    "FROM task_assignment a "
    "JOIN task t ON t.id = a.task_id "
    "JOIN app_user u ON u.id = a.worker_user_id "
    "LEFT JOIN crowd_worker w ON w.user_id = a.worker_user_id "
    "                        AND w.aggregator_org_id = a.supplier_org_id AND w.deleted_at IS NULL "
    "WHERE a.status IN ('assigned', 'in_progress', 'rejected') AND u.status = 'active' "
)


async def _rows(
    session: AsyncSession, base: str, where: str, params: dict[str, Any]
) -> list[Mapping[str, Any]]:
    return list((await session.execute(text(base + "AND " + where), params)).mappings().all())


def _offer_subject(r: Mapping[str, Any]) -> OfferSubject:
    return OfferSubject(
        recipient_id=r["recipient_id"], worker_user_id=r["worker_user_id"],
        sent_at=r["sent_at"], response=r["response"],
        offer_created_at=r["offer_created_at"], respond_by=r["respond_by"],
        offer_status=r["offer_status"], accepted_count=r["accepted_count"],
        worker_limit=r["worker_limit"],
    )


def _assignment_subject(r: Mapping[str, Any]) -> AssignmentSubject:
    return AssignmentSubject(
        assignment_id=r["assignment_id"], worker_user_id=r["worker_user_id"],
        status=r["status"], assigned_at=r["assigned_at"], decided_at=r["decided_at"],
        due_on=r["due_on"],
    )


async def _sent(session: AsyncSession, subject_ids: list[uuid.UUID]) -> list[Sent]:
    if not subject_ids:
        return []
    rows = (
        await session.execute(
            text(
                "SELECT coalesce(offer_recipient_id, assignment_id) AS subject_id, "
                "       kind, step, created_at "
                "FROM engagement_reminder "
                "WHERE offer_recipient_id = ANY(:ids) OR assignment_id = ANY(:ids)"
            ),
            {"ids": subject_ids},
        )
    ).mappings().all()
    return [Sent(r["subject_id"], r["kind"], r["step"], r["created_at"]) for r in rows]


# ---------------------------------------------------------------------------
# Sending
# ---------------------------------------------------------------------------

async def _send(
    session: AsyncSession,
    org_id: uuid.UUID,
    now: dt.datetime,
    offers: dict[uuid.UUID, Mapping[str, Any]],
    assignments: dict[uuid.UUID, Mapping[str, Any]],
    dues: list[Due],
    manual_by: uuid.UUID | None,
) -> int:
    """Mail every due reminder over one connection, ring the bell, record
    the rows. Best-effort like the offer itself: a refused address is written
    against its row and the console shows it."""
    if not dues:
        return 0
    from sourcehub.platform.mail.smtp import send_many

    org_name = (
        await session.execute(text("SELECT name FROM organisation WHERE id = :o"), {"o": org_id})
    ).scalar_one()
    today = now.date()
    messages: list[tuple[str, str, str, str | None]] = []
    for d in dues:
        if d.kind.startswith("offer_"):
            r = offers[d.subject_id]
            # the link in the first mail may be in a folder nobody opens again;
            # a fresh token, as "Resend invite" does, and the old link dies
            raw, digest = new_opaque_token()
            await session.execute(
                text("UPDATE task_offer_recipient SET token_hash = :h WHERE id = :id"),
                {"h": digest, "id": r["recipient_id"]},
            )
            base = f"{settings.app_base_url}/offer?token={raw}"
            places_left = r["worker_limit"] - r["accepted_count"]
            lead = offer_lead(d.kind, now, r["respond_by"], places_left, r["worker_limit"])
            subject, body, html_body = delivery.offer_email(
                worker_name=r["worker_name"], org_name=org_name,
                task_ref=r["task_ref"], task_title=r["task_title"],
                unit=r["target_unit"] or "units", quantity=r["quantity"],
                worker_limit=r["worker_limit"], due_on=r["due_on"],
                respond_by=r["respond_by"], instructions=r["instructions"],
                accept_url=base + "&intent=accept", decline_url=base + "&intent=decline",
                lead=lead,
            )
            messages.append((r["email"], subject, body, html_body))
            await notifier.notify(
                session, org_id,
                f"{lead} {org_name} is offering {r['task_ref']} {r['task_title']} — "
                "use the links in your email to answer.",
                user_id=d.worker_user_id,
            )
        else:
            a = assignments[d.subject_id]
            since = a["decided_at"] if d.kind == "assignment_rework" else a["assigned_at"]
            subject, body, html_body, line = assignment_reminder_email(
                kind=d.kind, worker_name=a["worker_name"], org_name=org_name,
                task_ref=a["task_ref"], task_title=a["task_title"],
                unit=a["target_unit"] or "units", quantity=a["quantity"],
                due_on=a["due_on"], days=(now - (since or now)).days, today=today,
            )
            messages.append((a["email"], subject, body, html_body))
            await notifier.notify(
                session, org_id, f"{line} ({a['task_ref']})",
                "assignment", {"id": str(a["assignment_id"])}, user_id=d.worker_user_id,
            )
            if d.kind == "assignment_overdue" and d.step == 0:
                await notifier.notify(
                    session, org_id,
                    f"{a['worker_name']} is overdue on {a['task_ref']} {a['task_title']} "
                    f"(due {a['due_on'].isoformat()}).",
                    "tasks", {"id": str(a["task_id"])},
                )

    try:
        errors = await send_many(messages)
    except OSError as e:
        errors = [str(e)[:300]] * len(messages)
    sent_at = dt.datetime.now(dt.timezone.utc)
    for d, (to, *_), err in zip(dues, messages, errors, strict=True):
        await session.execute(
            text(
                "INSERT INTO engagement_reminder "
                "  (supplier_org_id, worker_user_id, kind, step, offer_recipient_id, "
                "   assignment_id, manual_by, email, sent_at, send_error) "
                "VALUES (:org, :w, CAST(:kind AS reminder_kind), :step, :r, :a, :m, :email, "
                "        :sent_at, :err)"
            ),
            {
                "org": org_id, "w": d.worker_user_id, "kind": d.kind, "step": d.step,
                "r": d.subject_id if d.kind.startswith("offer_") else None,
                "a": None if d.kind.startswith("offer_") else d.subject_id,
                "m": manual_by, "email": to,
                "sent_at": None if err else sent_at, "err": err,
            },
        )
    kinds = sorted({d.kind for d in dues})
    failed = sum(1 for e in errors if e)
    await audit.log(
        session, "engagement.reminded",
        f"Sent {len(dues)} reminder{'s' if len(dues) != 1 else ''} ({', '.join(kinds)})"
        + (f", {failed} not delivered" if failed else "")
        + (" by hand" if manual_by else ""),
        [org_id],
    )
    return len(dues)


# ---------------------------------------------------------------------------
# The clock
# ---------------------------------------------------------------------------

async def _pass_org(session: AsyncSession, org_id: uuid.UUID, now: dt.datetime) -> int:
    offers = {r["recipient_id"]: r for r in await _rows(session, _OFFER_ROWS, "true", {})}
    assignments = {
        r["assignment_id"]: r for r in await _rows(session, _ASSIGNMENT_ROWS, "true", {})
    }
    sent = await _sent(session, [*offers, *assignments])
    dues = plan(
        now,
        [_offer_subject(r) for r in offers.values()],
        [_assignment_subject(r) for r in assignments.values()],
        sent,
    )
    return await _send(session, org_id, now, offers, assignments, dues, manual_by=None)


async def run_pass(now: dt.datetime | None = None) -> dict[str, int]:
    """One pass over every supplier. Returns counts for the log and the CLI.
    The advisory lock lives for the outer transaction, so a second API
    worker whose timer fires at the same moment finds it taken and skips."""
    now = now or dt.datetime.now(dt.timezone.utc)
    counts = {"orgs": 0, "sent": 0, "failed_orgs": 0, "skipped": 0}
    async with anonymous_session() as lock:
        got = (
            await lock.execute(text("SELECT pg_try_advisory_xact_lock(hashtext('engagement'))"))
        ).scalar_one()
        if not got:
            counts["skipped"] = 1
            return counts
        org_ids = list((await lock.execute(text("SELECT engagement_orgs()"))).scalars().all())
        for org_id in org_ids:
            counts["orgs"] += 1
            try:
                async with org_session(org_id, "aggregator") as s:
                    counts["sent"] += await _pass_org(s, org_id, now)
            except Exception:
                counts["failed_orgs"] += 1
                log.exception("engagement pass failed for organisation %s", org_id)
    if counts["sent"] or counts["failed_orgs"]:
        log.info("engagement pass: %s", counts)
    return counts


async def run_forever() -> None:
    """The loop the API starts at boot. Never raises: a failed pass is logged
    and the next one runs on schedule."""
    await asyncio.sleep(FIRST_PASS_DELAY)
    while True:
        try:
            await run_pass()
        except Exception:
            log.exception("engagement pass failed")
        await asyncio.sleep(settings.engagement_tick_seconds)


# ---------------------------------------------------------------------------
# By hand, from the console
# ---------------------------------------------------------------------------

async def _last_reminded(
    session: AsyncSession, subject_ids: list[uuid.UUID]
) -> dict[uuid.UUID, dt.datetime]:
    rows = sorted(await _sent(session, subject_ids), key=lambda s: s.created_at)
    return {s.subject_id: s.created_at for s in rows}  # sorted, so the latest wins


def _too_soon(now: dt.datetime, last: dt.datetime | None) -> str | None:
    if last is None or now - last >= MANUAL_COOLDOWN:
        return None
    minutes = max(1, int((now - last).total_seconds() // 60))
    return f"reminded {minutes} minute{'s' if minutes != 1 else ''} ago"


async def remind_offer(
    session: AsyncSession,
    claims: AccessClaims,
    offer_id: uuid.UUID,
    recipient_ids: list[uuid.UUID] | None = None,
) -> dict[str, Any]:
    """Nudge everyone still silent on an open offer, or the chosen few.
    Refuses a closed, filled or expired offer and anyone reminded within
    the hour; returns the offer as the console lists it."""
    o = await delivery.offer_by_id(session, offer_id)  # LookupError → 404
    if o["effective_status"] != "open":
        raise EngageError(f"The offer is {o['effective_status']}; nobody can be reminded.")
    rows = {
        r["recipient_id"]: r
        for r in await _rows(session, _OFFER_ROWS, "o.id = :o", {"o": offer_id})
    }
    if recipient_ids is not None:
        wanted = set(recipient_ids)
        missing = wanted - set(rows)
        if missing:
            raise EngageError(
                f"{len(missing)} of the chosen workers cannot be reminded "
                "(already answered, never received the offer, or no longer a worker)."
            )
        rows = {k: v for k, v in rows.items() if k in wanted}
    if not rows:
        raise EngageError("Everybody has answered this offer.")

    now = dt.datetime.now(dt.timezone.utc)
    last = await _last_reminded(session, list(rows))
    for rid, r in rows.items():
        if soon := _too_soon(now, last.get(rid)):
            raise EngageError(f"{r['worker_name']} was {soon}.")
    dues = [Due("offer_nudge", 0, rid, r["worker_user_id"]) for rid, r in rows.items()]
    await _send(session, claims.org_id, now, rows, {}, dues, manual_by=claims.user_id)
    return await delivery.offer_by_id(session, offer_id)


async def remind_assignment(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID
) -> dict[str, Any]:
    """One nudge on a live assignment, worded for its state (waiting to
    start, rework, due soon, overdue). Refuses within the hour of the last."""
    a = await delivery.assignment_by_id(session, assignment_id)  # LookupError → 404
    if a["supplier_org_id"] != claims.org_id:
        raise EngageError("Only the supplier reminds its workers.")
    if a["status"] not in LIVE_ASSIGNMENT:
        raise EngageError(f"This assignment is {a['status'].replace('_', ' ')}; nothing to remind.")
    rows = {
        r["assignment_id"]: r
        for r in await _rows(session, _ASSIGNMENT_ROWS, "a.id = :a", {"a": assignment_id})
    }
    if not rows:
        raise EngageError("This worker is no longer active.")

    now = dt.datetime.now(dt.timezone.utc)
    last = await _last_reminded(session, [assignment_id])
    if soon := _too_soon(now, last.get(assignment_id)):
        raise EngageError(f"{a['worker_name']} was {soon}.")
    r = rows[assignment_id]
    k = assignment_kind(now, _assignment_subject(r))
    kind = k[0] if k else {
        "assigned": "assignment_start", "rejected": "assignment_rework",
    }.get(r["status"], "assignment_due_soon")
    dues = [Due(kind, 0, assignment_id, r["worker_user_id"])]
    await _send(session, claims.org_id, now, {}, rows, dues, manual_by=claims.user_id)
    return await delivery.assignment_by_id(session, assignment_id)
