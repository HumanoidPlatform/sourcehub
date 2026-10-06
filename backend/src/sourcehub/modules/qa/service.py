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
from typing import Any, NamedTuple

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
                "       c.reference_code AS contract_ref, o.name AS supplier_name, "
                # The same brief gate 1 now gets. A partner judging a bundle was
                # equally blind to what the client actually asked for.
                "       t.capture_spec, t.instructions AS task_instructions "
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
    return [{**dict(r), "capture_spec": r["capture_spec"] or {}} for r in rows]


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
                "SELECT q.id, q.gate, q.outcome, q.note, q.defects, q.reviewed_at, s.attempt_no, "
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
    """Every batch awaiting this supplier's verdict (db/340). A worker may have
    more than one in review at once; each is its own row and its own decision.

    Batches with captures their phone flagged as off-subject (a
    wrong_subject device check, kept anyway) come first, then oldest first:
    those are the ones most likely to need a rejection, and the reviewer
    should see the score the phone gave before the batch ages.
    """
    rows = (
        await session.execute(
            text(
                "SELECT b.id AS batch_id, b.batch_no, "
                "       a.id AS assignment_id, a.task_id, t.reference_code AS task_ref, "
                "       t.title AS task_title, t.target_unit, "
                # What the capture was supposed to satisfy. The reviewer was
                # judging frames against conditions they could not see: the
                # subject, the orientation, the tilt tolerance, the megapixel
                # floor. Selected here exactly as _assignment_dict already
                # selects them for the worker, so both ends read one brief.
                "       t.capture_spec, t.instructions AS task_instructions, "
                "       a.worker_user_id, coalesce(w.display_name, u.full_name) AS worker_name, "
                "       w.reference_code AS worker_ref, a.quantity, b.worker_note, b.submitted_at, "
                "       a.revoked_at, "
                "       coalesce(x.ready, 0) AS ready_assets, coalesce(x.off_subject, 0) AS off_subject, "
                "       coalesce(x.unscored, 0) AS unscored, "
                # what earlier batches of the same assignment already settled
                "       (SELECT count(*) FROM asset k JOIN capture_batch kb ON kb.id = k.batch_id "
                "         WHERE k.assignment_id = a.id AND kb.status = 'reviewed' "
                "           AND k.status = 'ready' AND k.deleted_at IS NULL) AS accepted_before "
                "FROM capture_batch b "
                "JOIN task_assignment a ON a.id = b.assignment_id "
                "JOIN task t ON t.id = a.task_id "
                "LEFT JOIN crowd_worker w ON w.user_id = a.worker_user_id "
                "LEFT JOIN app_user u ON u.id = a.worker_user_id "
                "LEFT JOIN LATERAL (SELECT count(*) AS ready, "
                "                          count(*) FILTER (WHERE s.check_results->'device' "
                "                                           @> '[{\"code\": \"wrong_subject\"}]') AS off_subject, "
                "                          count(*) FILTER (WHERE s.check_results->'device' "
                "                                           @> '[{\"code\": \"subject_unscored\"}]') AS unscored "
                "                   FROM asset s "
                "                   WHERE s.batch_id = b.id AND s.status = 'ready' "
                "                     AND s.deleted_at IS NULL) x ON true "
                "WHERE b.status = 'in_review' AND b.supplier_org_id = :me "
                "ORDER BY (coalesce(x.off_subject, 0) > 0) DESC, b.submitted_at"
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
            "accepted_before": int(r["accepted_before"]),
            # An older task may carry no spec at all; the console then shows
            # nothing rather than an empty panel.
            "capture_spec": r["capture_spec"] or {},
        }
        for r in rows
    ]


class MarkPlan(NamedTuple):
    """What the marks amount to, before anything is written."""

    # (asset_id, defect code, the reviewer's words about this frame)
    retake: list[tuple[uuid.UUID, str, str | None]]
    # captures sent back in an earlier round that the reviewer has since kept
    restore: list[uuid.UUID]
    # {defect code: how many}, written onto the verdict as qa_review.defects
    tally: dict[str, int]


def plan_marks(
    marks: list[dict[str, Any]],
    known: dict[uuid.UUID, str],
    live_codes: set[str],
) -> MarkPlan:
    """Read the reviewer's marks against the batch as it stands. Pure.

    `known` is {asset_id: status} for the batch's undeleted captures, and
    `live_codes` the defect codes this platform still offers. Everything that
    can be refused is refused here, before a single row is touched.
    """
    # Last word wins if the same capture is named twice in one request.
    by_id: dict[uuid.UUID, dict[str, Any]] = {m["asset_id"]: m for m in marks}

    # Blank is not an unknown code, it is a missing one: it belongs to the
    # "say why" refusal below, which names the real problem.
    unknown = sorted(
        c for c in {(m.get("reason") or "").strip() for m in by_id.values()}
        if c and c not in live_codes
    )
    if unknown:
        raise QaError(f"Not a reason this platform knows: {', '.join(unknown)}.")

    plan = MarkPlan(retake=[], restore=[], tally={})
    for asset_id, m in by_id.items():
        was = known.get(asset_id)
        if was is None:
            raise QaError("That capture is not in this batch.")
        # A pending upload or a quarantined file is not the reviewer's to judge:
        # it never became part of what the worker submitted.
        if was not in ("ready", "rejected"):
            raise QaError(f"A {was} capture cannot be marked.")

        if m["outcome"] == "retake":
            reason = (m.get("reason") or "").strip()
            if not reason:
                raise QaError(
                    "Say why a capture must be shot again — they cannot act on a blank mark."
                )
            plan.retake.append((asset_id, reason, (m.get("note") or "").strip() or None))
            plan.tally[reason] = plan.tally.get(reason, 0) + 1
        elif was == "rejected":
            # A reviewer may change their mind while the batch is still theirs.
            plan.restore.append(asset_id)
    return plan


async def _apply_marks(
    session: AsyncSession,
    claims: AccessClaims,
    batch_id: uuid.UUID,
    marks: list[dict[str, Any]],
) -> dict[str, int]:
    """Put each named capture where the reviewer put it, and count the reasons.

    'retake' is written as asset.status = 'rejected'. That value carries the
    whole consequence: ready_count stops counting it, so the worker owes a
    replacement before they can resubmit; attach_to_submission stops bundling
    it, so it never reaches the delivery partner; and every rollup that filters
    on 'ready' drops it without being told. See db/210_asset_review.sql.
    """
    if not marks:
        return {}

    known = {
        r["id"]: r["status"]
        for r in (
            await session.execute(
                text(
                    "SELECT id, status FROM asset "
                    "WHERE batch_id = :b AND deleted_at IS NULL"
                ),
                {"b": batch_id},
            )
        ).mappings().all()
    }
    wanted = sorted({str(m["reason"]).strip() for m in marks if (m.get("reason") or "").strip()})
    live = (
        set(
            (
                await session.execute(
                    text("SELECT code FROM defect_code WHERE active AND code = ANY(:c)"),
                    {"c": wanted},
                )
            ).scalars().all()
        )
        if wanted
        else set()
    )

    plan = plan_marks(marks, known, live)

    for asset_id, reason, note in plan.retake:
        await session.execute(
            text(
                "UPDATE asset SET status = 'rejected', review_reason = :r, "
                "       review_note = :n, reviewed_by = :me, reviewed_at = now(), "
                "       updated_at = now() WHERE id = :id"
            ),
            {"r": reason, "n": note, "me": claims.user_id, "id": asset_id},
        )
    for asset_id in plan.restore:
        await session.execute(
            text(
                "UPDATE asset SET status = 'ready', review_reason = NULL, "
                "       review_note = NULL, reviewed_by = NULL, reviewed_at = NULL, "
                "       updated_at = now() WHERE id = :id"
            ),
            {"id": asset_id},
        )
    return plan.tally


async def decide_gate1(
    session: AsyncSession,
    claims: AccessClaims,
    assignment_id: uuid.UUID,
    outcome: str,  # 'accept' | 'reject'
    note: str | None,
    marks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """The verdict addressed to an assignment, as before batches: it answers
    the assignment's oldest batch still in review (decide_batch)."""
    batch_id = (
        await session.execute(
            text(
                "SELECT id FROM capture_batch WHERE assignment_id = :a AND status = 'in_review' "
                "ORDER BY batch_no LIMIT 1"
            ),
            {"a": assignment_id},
        )
    ).scalar_one_or_none()
    if batch_id is None:
        exists = (
            await session.execute(
                text("SELECT 1 FROM task_assignment WHERE id = :a"), {"a": assignment_id}
            )
        ).scalar_one_or_none()
        if exists is None:
            raise LookupError("assignment not found")
        raise QaError("Nothing on this assignment is waiting for review.")
    return await decide_batch(session, claims, batch_id, outcome, note, marks)


async def decide_batch(
    session: AsyncSession,
    claims: AccessClaims,
    batch_id: uuid.UUID,
    outcome: str,  # 'accept' | 'reject'
    note: str | None,
    marks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Answer one batch, capture by capture.

    Every capture in it is accepted unless marked to be shot again. 'accept'
    means nothing is marked; 'reject' means something is — the marks carry the
    reasons, so a note is optional (qa_review's own CHECK gets the count when
    there is none). Accepted captures stay accepted: a later batch never puts
    them back in front of anyone. Then the assignment is settled
    (delivery.settle_assignment): accepted once its accepted captures reach its
    quantity, and on a reassigned one, rework moves to the worker who took over.
    """
    from sourcehub.modules.delivery import service as delivery

    if outcome not in ("accept", "reject"):
        raise QaError("Outcome must be accept or reject.")
    note = (note or "").strip() or None

    b = (
        await session.execute(
            text(
                "SELECT b.id, b.batch_no, b.status, b.assignment_id, a.task_id, a.contract_id, "
                "       a.supplier_org_id, a.worker_user_id, a.revoked_at, "
                "       t.reference_code AS task_ref, t.title "
                "FROM capture_batch b "
                "JOIN task_assignment a ON a.id = b.assignment_id "
                "JOIN task t ON t.id = a.task_id WHERE b.id = :b"
            ),
            {"b": batch_id},
        )
    ).mappings().one_or_none()
    if b is None:
        raise LookupError("batch not found")
    if b["supplier_org_id"] != claims.org_id:
        raise QaError("Only the supplier reviews at gate 1.")
    if b["status"] != "in_review":
        raise QaError(f"Batch {b['batch_no']} has already been answered.")
    assignment_id = b["assignment_id"]

    tally = await _apply_marks(session, claims, batch_id, marks or [])
    counts = (
        await session.execute(
            text(
                "SELECT count(*) FILTER (WHERE status = 'ready') AS kept, "
                "       count(*) FILTER (WHERE status = 'rejected') AS retake "
                "FROM asset WHERE batch_id = :b AND deleted_at IS NULL"
            ),
            {"b": batch_id},
        )
    ).mappings().one()
    kept, retake = int(counts["kept"]), int(counts["retake"])
    accepted = outcome == "accept"
    # The two halves of the verdict have to agree: accepting while something
    # is marked would send the worker nothing to act on, and sending back
    # with nothing marked would leave them guessing which frame.
    if accepted and retake:
        raise QaError(
            f"{retake} capture{'s' if retake != 1 else ''} here "
            f"{'are' if retake != 1 else 'is'} marked to be shot again. "
            "Send the batch back, or keep them."
        )
    if not accepted and not retake:
        raise QaError("Mark the captures to be shot again, and say why, before sending back.")

    review = QaReview(
        assignment_id=assignment_id,
        batch_id=batch_id,
        submission_id=None,
        gate="gate1_supplier",
        outcome="pass" if accepted else "fail",
        reviewer_org_id=claims.org_id,
        reviewer_user_id=claims.user_id,
        note=note or (None if accepted else f"{retake} to shoot again"),
        # which defects the verdict cited, countable per worker and per task;
        # the verdict row is append-only, so the tally rides on the INSERT
        defects=dict(sorted(tally.items())),
    )
    session.add(review)
    await session.flush()
    await session.execute(
        text(
            "UPDATE capture_batch SET status = 'reviewed', decided_at = now(), decided_by = :me, "
            "       decision_note = :note, accepted_count = :k, rework_count = :r WHERE id = :b"
        ),
        {"me": claims.user_id, "note": note, "k": kept, "r": retake, "b": batch_id},
    )
    # The assignment's last word is this one, for the screens that read it.
    await session.execute(
        text(
            "UPDATE task_assignment SET decided_at = now(), decided_by = :me, "
            "       decision_note = :note WHERE id = :a"
        ),
        {"me": claims.user_id, "note": note, "a": assignment_id},
    )
    settled = await delivery.settle_assignment(session, assignment_id)

    # A worker taken off the task has nothing left to act on.
    if b["revoked_at"] is None:
        await notifier.notify(
            session,
            claims.org_id,
            f"Batch {b['batch_no']} on {b['title']}: "
            + (
                f"all {kept} accepted."
                if accepted
                else f"{kept} accepted, {retake} to shoot again"
                + (f" — {note}" if note else ".")
            )
            + (" The assignment is complete." if settled["status"] == "accepted" else ""),
            "assignment",
            {"id": str(assignment_id)},
            user_id=b["worker_user_id"],
        )
    await audit.log(
        session,
        "review.recorded",
        f"{'Accepted' if accepted else 'Sent back part of'} batch {b['batch_no']} on "
        f"{b['task_ref']} at gate 1"
        + (f" — {note}" if note else ""),
        [assignment_id, b["task_id"], b["contract_id"], claims.org_id],
        {"gate": "gate1_supplier", "batch_id": str(batch_id), "kept": kept, "retake": retake,
         "moved": settled["moved"]},
    )
    return {
        "assignment_id": assignment_id,
        "batch_id": batch_id,
        "task_id": b["task_id"],
        "outcome": outcome,
        "assignment_status": settled["status"],
        "kept": kept,
        "retake": retake,
        "moved": settled["moved"],
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
