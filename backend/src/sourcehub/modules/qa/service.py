"""qa — rubrics, sampling plans, gold sets and the three review gates.

Business rules, and the ONLY public surface of this module.

Gate 2 (partner QA) is live; gates 1 and 3 exist in the schema and arrive with
the media plane. A review is one APPEND-ONLY row — who caught a defect, at
which gate, is what decides who pays for the rework, so a verdict is never
edited, only followed by another.
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
    session.add(
        QaReview(
            submission_id=submission_id,
            gate="gate2_partner",
            outcome=outcome,
            reviewer_org_id=claims.org_id,
            reviewer_user_id=claims.user_id,
            sample_size=sample_size,
            sample_failed=sample_failed,
            note=note,
        )
    )
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
    rows = (
        await session.execute(
            text(
                "SELECT q.id, q.gate, q.outcome, q.note, q.reviewed_at, s.attempt_no "
                "FROM qa_review q JOIN submission s ON s.id = q.submission_id "
                "WHERE s.task_id = :tid ORDER BY q.reviewed_at"
            ),
            {"tid": task_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
