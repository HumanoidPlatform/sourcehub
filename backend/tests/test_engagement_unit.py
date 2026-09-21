"""The pure parts of the engagement clock: which reminder is due when, what
has already gone out, and the words. No database, no SMTP — the pass itself
is exercised by `python -m sourcehub.modules.engage` against a stack.

    pytest tests/test_engagement_unit.py
"""

from __future__ import annotations

import datetime as dt
import uuid

from sourcehub.modules.engage import service as engage

NOW = dt.datetime(2026, 9, 21, 12, 0, tzinfo=dt.timezone.utc)
H = dt.timedelta(hours=1)
D = dt.timedelta(days=1)
W = uuid.uuid4()


def offer(**over) -> engage.OfferSubject:
    base = dict(
        recipient_id=uuid.uuid4(), worker_user_id=W, sent_at=NOW - 3 * D, response=None,
        offer_created_at=NOW - 3 * D, respond_by=NOW + 3 * D, offer_status="open",
        accepted_count=0, worker_limit=2,
    )
    base.update(over)
    return engage.OfferSubject(**base)


def assignment(**over) -> engage.AssignmentSubject:
    base = dict(
        assignment_id=uuid.uuid4(), worker_user_id=W, status="assigned",
        assigned_at=NOW - 3 * D, decided_at=None, due_on=None,
    )
    base.update(over)
    return engage.AssignmentSubject(**base)


# --- offers -------------------------------------------------------------------

def test_nudge_half_way_through_the_window():
    o = offer(offer_created_at=NOW - 4 * D, respond_by=NOW + 4 * D)
    assert engage.offer_kind(NOW, o) == ("offer_nudge", 0)
    # a minute short of half-way: not yet
    assert engage.offer_kind(NOW - dt.timedelta(minutes=1), o) is None


def test_a_short_window_gets_neither_nudge_nor_last_call():
    o = offer(offer_created_at=NOW - 5 * H, respond_by=NOW + 5 * H)
    assert engage.offer_kind(NOW, o) is None
    # a 30 h window: the last call waits until the offer is 12 h old
    o = offer(offer_created_at=NOW - 11 * H, respond_by=NOW + 19 * H)
    assert engage.offer_kind(NOW, o) is None
    assert engage.offer_kind(NOW + H, o) == ("offer_closing", 0)


def test_closing_in_the_last_day_wins_over_nudge():
    o = offer(offer_created_at=NOW - 6 * D, respond_by=NOW + 20 * H)
    assert engage.offer_kind(NOW, o) == ("offer_closing", 0)


def test_offer_reminders_stop_when_nothing_can_come_of_them():
    assert engage.offer_kind(NOW, offer(response="declined")) is None
    assert engage.offer_kind(NOW, offer(sent_at=None)) is None
    assert engage.offer_kind(NOW, offer(offer_status="closed")) is None
    assert engage.offer_kind(NOW, offer(accepted_count=2)) is None
    assert engage.offer_kind(NOW, offer(respond_by=NOW - H)) is None


# --- assignments --------------------------------------------------------------

def test_start_after_two_days_then_every_two():
    assert engage.assignment_kind(NOW, assignment(assigned_at=NOW - D)) is None
    assert engage.assignment_kind(NOW, assignment(assigned_at=NOW - 2 * D)) == ("assignment_start", 1)
    assert engage.assignment_kind(NOW, assignment(assigned_at=NOW - 3 * D)) == ("assignment_start", 1)
    assert engage.assignment_kind(NOW, assignment(assigned_at=NOW - 4 * D)) == ("assignment_start", 2)


def test_rework_counts_from_the_verdict():
    a = assignment(status="rejected", assigned_at=NOW - 30 * D, decided_at=NOW - 2 * D)
    assert engage.assignment_kind(NOW, a) == ("assignment_rework", 1)
    assert engage.assignment_kind(NOW, assignment(status="rejected", decided_at=NOW - D)) is None


def test_due_soon_then_overdue_every_three_days():
    today = NOW.date()
    assert engage.assignment_kind(NOW, assignment(due_on=today + dt.timedelta(days=3))) == ("assignment_start", 1)
    assert engage.assignment_kind(NOW, assignment(due_on=today + dt.timedelta(days=2))) == ("assignment_due_soon", 0)
    assert engage.assignment_kind(NOW, assignment(due_on=today)) == ("assignment_due_soon", 0)
    assert engage.assignment_kind(NOW, assignment(due_on=today - dt.timedelta(days=1))) == ("assignment_overdue", 0)
    assert engage.assignment_kind(NOW, assignment(due_on=today - dt.timedelta(days=3))) == ("assignment_overdue", 0)
    assert engage.assignment_kind(NOW, assignment(due_on=today - dt.timedelta(days=4))) == ("assignment_overdue", 1)


def test_in_progress_is_only_reminded_about_its_date():
    a = assignment(status="in_progress", assigned_at=NOW - 10 * D)
    assert engage.assignment_kind(NOW, a) is None
    assert engage.assignment_kind(NOW, assignment(status="submitted", due_on=NOW.date() - D)) is None


# --- the plan: what has gone out ---------------------------------------------

def test_plan_skips_sent_keys_and_respects_the_cooldown():
    o = offer(offer_created_at=NOW - 4 * D, respond_by=NOW + 4 * D)
    a = assignment(assigned_at=NOW - 2 * D)
    fresh = engage.plan(NOW, [o], [a], [])
    assert [(d.kind, d.step, d.subject_id) for d in fresh] == [
        ("offer_nudge", 0, o.recipient_id), ("assignment_start", 1, a.assignment_id),
    ]
    # the same state a pass later: both already recorded
    sent = [engage.Sent(o.recipient_id, "offer_nudge", 0, NOW - 5 * dt.timedelta(minutes=1)),
            engage.Sent(a.assignment_id, "assignment_start", 1, NOW - 5 * dt.timedelta(minutes=1))]
    assert engage.plan(NOW, [o], [a], sent) == []
    # two days on, step 2 is a new key — but a manual nudge an hour ago holds it
    later = NOW + 2 * D
    held = [*sent, engage.Sent(a.assignment_id, "assignment_start", 0, later - H)]
    assert engage.plan(later, [o], [a], held) == []
    assert [d.step for d in engage.plan(later, [], [a], sent)] == [2]


def test_closing_may_follow_a_nudge_after_six_hours():
    o = offer(offer_created_at=NOW - 2 * D, respond_by=NOW + 20 * H)
    nudged = [engage.Sent(o.recipient_id, "offer_nudge", 0, NOW - 7 * H)]
    assert [d.kind for d in engage.plan(NOW, [o], [], nudged)] == ["offer_closing"]
    assert engage.plan(NOW, [o], [], [engage.Sent(o.recipient_id, "offer_nudge", 0, NOW - 5 * H)]) == []


# --- the words ------------------------------------------------------------------

def test_offer_lead_counts_places_and_hours():
    assert engage.offer_lead("offer_nudge", NOW, NOW + 2 * D, 1, 3) == (
        "A reminder — you have not answered this offer yet, and 1 of 3 places still open."
    )
    assert engage.offer_lead("offer_closing", NOW, NOW + dt.timedelta(hours=17, minutes=30), 1, 1) == (
        "Last call — this offer closes in 18 hours, and 1 of 1 place still open."
    )


def kw(**over):
    base = dict(
        kind="assignment_start", worker_name="Asha", org_name="Field Co <north>",
        task_ref="TASK-042", task_title="Shelf & price tags", unit="photos", quantity=20,
        due_on=None, days=3, today=NOW.date(),
    )
    base.update(over)
    return engage.assignment_reminder_email(**base)


def test_assignment_mail_per_kind():
    subject, body, html, line = kw()
    assert subject == "Reminder: TASK-042 Shelf & price tags is waiting for you to start"
    assert "3 days ago" in line and line in body
    assert "Shelf &amp; price tags" in html and "Field Co &lt;north&gt;" in html
    assert "Cosarathi Capture" in body

    subject, *_ = kw(kind="assignment_rework", days=1)
    assert subject.endswith("needs rework")
    subject, _, _, line = kw(kind="assignment_due_soon", due_on=NOW.date() + D)
    assert subject.endswith("is due tomorrow") and "due tomorrow" in line
    subject, _, _, line = kw(kind="assignment_due_soon")
    assert subject.endswith("is waiting to be finished")
    subject, _, _, line = kw(kind="assignment_overdue", due_on=NOW.date() - D)
    assert subject == "Overdue: TASK-042 Shelf & price tags was due 2026-09-20"
    assert "tell Field Co <north> if you cannot" in line
