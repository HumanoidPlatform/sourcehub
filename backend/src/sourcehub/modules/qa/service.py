"""qa — rubrics, sampling plans, gold sets and the three review gates.

Business rules, and the ONLY public surface of this module.

Gate 1 (the supplier's own check of a crowd resource's batch) and gate 2 (partner QA
of a submission) are live; gate 3 exists in the schema. A review is one
APPEND-ONLY row — who caught a defect, at which gate, is what decides who
pays for the rework, so a verdict is never edited, only followed by another.
Gate 1 reviews a task_assignment; gates 2 and 3 review a submission.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.audit import service as audit
from sourcehub.modules.notify import service as notifier
from sourcehub.modules.qa.models import QaReview


class QaError(Exception):
    pass


async def review_queue(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    """Everything awaiting this partner's verdict. RLS already scopes the rows;
    the WHERE narrows to the queue itself."""
    rows = (
        await session.execute(
            text(
                "SELECT s.id AS submission_id, s.attempt_no, s.asset_count, s.supplier_note, "
                "       s.submitted_at, t.id AS task_id, t.reference_code AS task_ref, "
                "       t.title AS task_title, t.target, c.id AS contract_id, "
                "       c.reference_code AS contract_ref, o.name AS supplier_name "
                "FROM submission s "
                "JOIN task t ON t.id = s.task_id "
                "JOIN contract c ON c.id = t.contract_id "
                "JOIN organisation o ON o.id = s.supplier_org_id "
                "WHERE s.status IN ('submitted','under_review') "
                "  AND c.partner_org_id = :me "
                "ORDER BY s.submitted_at"
            ),
            {"me": claims.org_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def decide(
    session: AsyncSession,
    claims: AccessClaims,
    submission_id: uuid.UUID,
    outcome: str,  # 'pass' | 'fail'
    note: str | None,
    sample_size: int | None = None,
    sample_failed: int | None = None,
    attachments: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Record the gate-2 verdict. The prototype's rule holds, enforced twice —
    here and by a CHECK on qa_review: a failure without a note is refused,
    because the supplier cannot act on a blank rejection."""
    if outcome == "fail" and not (note and note.strip()):
        raise QaError("Say what must change — the supplier cannot act on a blank rejection.")

    sub = (
        await session.execute(
            text(
                "SELECT s.id, s.status, s.supplier_org_id, s.asset_count, s.attempt_no, "
                "       t.id AS task_id, t.reference_code AS task_ref, t.title, "
                "       c.id AS contract_id, c.partner_org_id "
                "FROM submission s JOIN task t ON t.id = s.task_id "
                "JOIN contract c ON c.id = t.contract_id WHERE s.id = :sid"
            ),
            {"sid": submission_id},
        )
    ).mappings().one_or_none()
    if sub is None:
        raise LookupError("submission not found")
    if sub["partner_org_id"] != claims.org_id:
        raise QaError("Only the delivering partner reviews at gate 2.")
    if sub["status"] not in ("submitted", "under_review"):
        raise QaError(f"A {sub['status']} submission has already been decided.")

    passed = outcome == "pass"
    review = QaReview(
            submission_id=submission_id,
            gate="gate2_partner",
            outcome=outcome,
            reviewer_org_id=claims.org_id,
            reviewer_user_id=claims.user_id,
            sample_size=sample_size,
            sample_failed=sample_failed,
            note=note,
    )
    session.add(review)
    # Flushed here because the evidence hangs off this row's id, and a
    # rejection is exactly where a screenshot earns its keep.
    await session.flush()
    await _attach_evidence(session, claims, review.id, attachments)
    await session.execute(
        text("UPDATE submission SET status = :st, closed_at = :now WHERE id = :sid"),
        {
            "st": "accepted" if passed else "rejected",
            "now": dt.datetime.now(dt.timezone.utc),
            "sid": submission_id,
        },
    )
    await session.execute(
        text("UPDATE task SET status = :st, completed_at = :done WHERE id = :tid"),
        {
            "st": "qa_passed" if passed else "qa_failed",
            "done": dt.datetime.now(dt.timezone.utc) if passed else None,
            "tid": sub["task_id"],
        },
    )

    await notifier.notify(
        session,
        sub["supplier_org_id"],
        f"{sub['title']} cleared QA." if passed else f"{sub['title']} was sent back: {note}",
        "tasks",
        {"id": str(sub["task_id"])},
    )
    await audit.log(
        session,
        "review.recorded",
        f"{'Passed' if passed else 'Failed'} QA on {sub['task_ref']}"
        + (f" — {note}" if note else ""),
        [sub["task_id"], sub["contract_id"], claims.org_id, sub["supplier_org_id"]],
    )
    return {
        "submission_id": submission_id,
        "task_id": sub["task_id"],
        "outcome": outcome,
        "task_status": "qa_passed" if passed else "qa_failed",
    }


async def reviews_for_task(session: AsyncSession, task_id: uuid.UUID) -> list[dict[str, Any]]:
    """Every verdict on a task, at every gate: gate-1 rows hang off an
    assignment, gate-2 rows off a submission."""
    rows = (
        await session.execute(
            text(
                "SELECT q.id, q.gate, q.outcome, q.note, q.reviewed_at, s.attempt_no, "
                "       q.assignment_id, coalesce(w.display_name, u.full_name) AS worker_name "
                "FROM qa_review q "
                "LEFT JOIN submission s ON s.id = q.submission_id "
                "LEFT JOIN task_assignment a ON a.id = q.assignment_id "
                "LEFT JOIN crowd_worker w ON w.user_id = a.worker_user_id "
                "LEFT JOIN app_user u ON u.id = a.worker_user_id "
                "WHERE coalesce(s.task_id, a.task_id) = :tid ORDER BY q.reviewed_at"
            ),
            {"tid": task_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Gate 1 — the supplier reviews its own crowd resource's batch
# ---------------------------------------------------------------------------

async def gate1_queue(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    """Every assignment awaiting this supplier's verdict.

    Batches with captures their phone flagged as off-subject (a
    wrong_subject device check, kept anyway) come first, then oldest first:
    those are the ones most likely to need a rejection, and the reviewer
    should see the score the phone gave before the batch ages.
    """
    rows = (
        await session.execute(
            text(
                "SELECT a.id AS assignment_id, a.task_id, t.reference_code AS task_ref, "
                "       t.title AS task_title, t.target_unit, "
                "       a.worker_user_id, coalesce(w.display_name, u.full_name) AS worker_name, "
                "       w.reference_code AS worker_ref, a.quantity, a.worker_note, a.submitted_at, "
                "       coalesce(x.ready, 0) AS ready_assets, coalesce(x.off_subject, 0) AS off_subject, "
                "       coalesce(x.unscored, 0) AS unscored "
                "FROM task_assignment a "
                "JOIN task t ON t.id = a.task_id "
                "LEFT JOIN crowd_worker w ON w.user_id = a.worker_user_id "
                "LEFT JOIN app_user u ON u.id = a.worker_user_id "
                "LEFT JOIN LATERAL (SELECT count(*) AS ready, "
                "                          count(*) FILTER (WHERE s.check_results->'device' "
                "                                           @> '[{\"code\": \"wrong_subject\"}]') AS off_subject, "
                "                          count(*) FILTER (WHERE s.check_results->'device' "
                "                                           @> '[{\"code\": \"subject_unscored\"}]') AS unscored "
                "                   FROM asset s "
                "                   WHERE s.assignment_id = a.id AND s.status = 'ready' "
                "                     AND s.deleted_at IS NULL) x ON true "
                "WHERE a.status = 'submitted' AND a.supplier_org_id = :me "
                "ORDER BY (coalesce(x.off_subject, 0) > 0) DESC, a.submitted_at"
            ),
            {"me": claims.org_id},
        )
    ).mappings().all()
    return [
        {
            **dict(r),
            "ready_assets": int(r["ready_assets"]),
            "off_subject": int(r["off_subject"]),
            "unscored": int(r["unscored"]),
        }
        for r in rows
    ]


async def decide_gate1(
    session: AsyncSession,
    claims: AccessClaims,
    assignment_id: uuid.UUID,
    outcome: str,  # 'accept' | 'reject'
    note: str | None,
) -> dict[str, Any]:
    """Record the gate-1 verdict on a batch. The same rule as gate 2,
    enforced here and by CHECKs on qa_review and task_assignment: a rejection
    without a note is refused, because they cannot act on one."""
    if outcome not in ("accept", "reject"):
        raise QaError("Outcome must be accept or reject.")
    if outcome == "reject" and not (note and note.strip()):
        raise QaError("Say what must change — they cannot act on a blank rejection.")

    a = (
        await session.execute(
            text(
                "SELECT a.id, a.status, a.task_id, a.contract_id, a.supplier_org_id, "
                "       a.worker_user_id, t.reference_code AS task_ref, t.title "
                "FROM task_assignment a JOIN task t ON t.id = a.task_id WHERE a.id = :a"
            ),
            {"a": assignment_id},
        )
    ).mappings().one_or_none()
    if a is None:
        raise LookupError("assignment not found")
    if a["supplier_org_id"] != claims.org_id:
        raise QaError("Only the supplier reviews at gate 1.")
    if a["status"] != "submitted":
        raise QaError(f"A {a['status'].replace('_', ' ')} assignment cannot be decided.")

    accepted = outcome == "accept"
    session.add(
        QaReview(
            assignment_id=assignment_id,
            submission_id=None,
            gate="gate1_supplier",
            outcome="pass" if accepted else "fail",
            reviewer_org_id=claims.org_id,
            reviewer_user_id=claims.user_id,
            note=note,
        )
    )
    await session.flush()
    await session.execute(
        text(
            "UPDATE task_assignment SET status = :st, decided_at = now(), decided_by = :me, "
            "       decision_note = :note WHERE id = :a"
        ),
        {
            "st": "accepted" if accepted else "rejected",
            "me": claims.user_id, "note": note, "a": assignment_id,
        },
    )

    await notifier.notify(
        session,
        claims.org_id,
        f"Your work on {a['title']} was accepted."
        if accepted
        else f"Your work on {a['title']} was sent back: {note}",
        "assignment",
        {"id": str(assignment_id)},
        user_id=a["worker_user_id"],
    )
    await audit.log(
        session,
        "review.recorded",
        f"{'Accepted' if accepted else 'Rejected'} a batch on {a['task_ref']} at gate 1"
        + (f" — {note}" if note else ""),
        [assignment_id, a["task_id"], a["contract_id"], claims.org_id],
        {"gate": "gate1_supplier"},
    )
    return {
        "assignment_id": assignment_id,
        "task_id": a["task_id"],
        "outcome": outcome,
        "assignment_status": "accepted" if accepted else "rejected",
    }


async def _attach_evidence(
    session: AsyncSession, claims: AccessClaims, review_id: uuid.UUID,
    items: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """Files behind a verdict — the frame that shows the defect.

    A rejection the supplier cannot act on is the failure this whole module
    exists to prevent, and "the third shelf is out of frame" is much easier to
    act on with the frame attached.
    """
    from sourcehub.modules.attachments import service as attachments

    if not items:
        return []
    if {i.get("slot") for i in items} - {"verdict"}:
        raise QaError("A QA review takes attachments on its verdict.")
    try:
        return await attachments.attach(
            session, claims, entity_type="qa_review", entity_id=review_id, items=items
        )
    except attachments.AttachmentError as e:
        raise QaError(str(e)) from None
