"""delivery — contracts, tasks, submissions and assets.

Business rules, and the ONLY public surface of this module.

The prototype's task.assets integer and its overloaded note (supplier's note
overwritten by the QA verdict) become real submission rows here: one per
attempt, the supplier's account preserved, the QA trail separate (qa module).

Contract display status: 'in_qa' is DERIVED — stored status stays 'active'
while submissions sit in review, because the supplier who submits may not
update the contract row (RLS: only client and partner may), and deriving it
costs one EXISTS.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.audit import service as audit
from sourcehub.modules.delivery.models import Contract, Submission, Task, TaskAssignment
from sourcehub.modules.ledger import service as ledger
from sourcehub.modules.media import service as media
from sourcehub.modules.notify import service as notifier


class DeliveryError(Exception):
    pass


# ---------------------------------------------------------------------------
# Contracts
# ---------------------------------------------------------------------------

async def create_contract_from_award(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    request_id: uuid.UUID,
    request_ref: str,
    request_title: str,
    proposal_id: uuid.UUID,
    client_org_id: uuid.UUID,
    partner_org_id: uuid.UUID,
    value: Decimal,
    acceptance: str | None,
    compliance: str | None,
    storage_target_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    """Called by marketplace.award, in the same transaction. The rubric
    snapshot freezes the acceptance criteria at this moment — the blueprint's
    rule that disputes are arbitrated against what was agreed, not what the
    request says later."""
    ref = (
        await session.execute(text("SELECT next_reference_code('CTR','seq_ref_contract')"))
    ).scalar_one()
    c = Contract(
        reference_code=ref,
        request_id=request_id,
        proposal_id=proposal_id,
        client_org_id=client_org_id,
        partner_org_id=partner_org_id,
        value=value,
        rubric_snapshot={
            "acceptance": acceptance,
            "compliance": compliance,
            "frozen_at_award_of": request_ref,
        },
        # Pinned for the same reason as the rubric: the client may keep
        # editing the request, but work under way must not move.
        storage_target_id=storage_target_id,
        started_at=dt.datetime.now(dt.timezone.utc),
        created_by=claims.user_id,
    )
    session.add(c)
    await session.flush()

    await ledger.record_award(session, c.id, client_org_id, value, c.milestone_pct)

    return await _contract_row(session, c)


async def _derived_status(session: AsyncSession, c: Contract) -> str:
    if c.status != "active":
        return c.status
    in_review = (
        await session.execute(
            text(
                "SELECT EXISTS (SELECT 1 FROM submission s JOIN task t ON t.id = s.task_id "
                "WHERE t.contract_id = :cid AND s.status IN ('submitted','under_review'))"
            ),
            {"cid": c.id},
        )
    ).scalar_one()
    return "in_qa" if in_review else "active"


async def progress_of(session: AsyncSession, contract_id: uuid.UUID) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                "SELECT count(*) AS total, "
                "count(*) FILTER (WHERE status = 'qa_passed') AS done, "
                "coalesce(sum((SELECT coalesce(sum(s.asset_count),0) FROM submission s "
                "  WHERE s.task_id = task.id AND s.status = 'accepted')),0) AS assets "
                "FROM task WHERE contract_id = :cid AND deleted_at IS NULL"
            ),
            {"cid": contract_id},
        )
    ).mappings().one()
    total, done = row["total"], row["done"]
    return {
        "total": total,
        "done": done,
        "pct": round(100 * done / total) if total else 0,
        "assets_accepted": int(row["assets"]),
        "deliverable": total > 0 and done == total,
    }


async def _contract_row(session: AsyncSession, c: Contract) -> dict[str, Any]:
    names = (
        await session.execute(
            text(
                "SELECT r.title, r.reference_code AS request_ref, r.delivery_due_on, "
                "  (SELECT name FROM organisation WHERE id = :cl) AS client_name, "
                "  (SELECT name FROM organisation WHERE id = :pt) AS partner_name "
                "FROM request r WHERE r.id = :rid"
            ),
            {"rid": c.request_id, "cl": c.client_org_id, "pt": c.partner_org_id},
        )
    ).mappings().one_or_none() or {}
    return {
        "id": c.id,
        "reference_code": c.reference_code,
        "request_id": c.request_id,
        "request_ref": names.get("request_ref"),
        "title": names.get("title"),
        "client_org_id": c.client_org_id,
        "client_name": names.get("client_name"),
        "partner_org_id": c.partner_org_id,
        "partner_name": names.get("partner_name"),
        "value": c.value,
        "currency": c.currency,
        "status": await _derived_status(session, c),
        "milestone_pct": c.milestone_pct,
        "platform_fee_pct": c.platform_fee_pct,
        "rubric_snapshot": c.rubric_snapshot,
        "delivery_due_on": names.get("delivery_due_on"),
        "started_at": c.started_at,
        "delivered_at": c.delivered_at,
        "completed_at": c.completed_at,
        "progress": await progress_of(session, c.id),
    }


async def list_contracts(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(Contract).where(Contract.deleted_at.is_(None)).order_by(Contract.created_at.desc())
        )
    ).scalars().all()
    return [await _contract_row(session, c) for c in rows]


async def get_contract(
    session: AsyncSession, claims: AccessClaims, contract_id: uuid.UUID
) -> dict[str, Any] | None:
    c = (
        await session.execute(
            select(Contract).where(Contract.id == contract_id, Contract.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if c is None:
        return None
    out = await _contract_row(session, c)
    out["tasks"] = await list_tasks(session, claims, contract_id=contract_id)
    return out


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

async def _task_files(session: AsyncSession, task_id: uuid.UUID) -> list[dict[str, Any]]:
    """The shot list or map behind the instructions.

    Visible to whoever can see the task, which includes the worker holding an
    assignment on it — that is the whole point of putting a map here.
    """
    from sourcehub.modules.attachments import service as attachments

    grouped = await attachments.list_for(session, "task", [task_id])
    return grouped.get(task_id, [])


async def _task_row(session: AsyncSession, t: Task) -> dict[str, Any]:
    """The task as the console shows it. The two summaries roll up the worker
    assignments and the captures; a client, who may never see a roster, gets
    zeros for the first and real counts for the second (RLS decides)."""
    extra = (
        await session.execute(
            text(
                "SELECT o.name AS assignee_name, o.kind AS assignee_kind, "
                "  c.reference_code AS contract_ref, "
                "  (SELECT row_to_json(x) FROM ("
                "     SELECT s.id, s.attempt_no, s.status, s.supplier_note, s.asset_count, "
                "            s.submitted_at "
                "     FROM submission s WHERE s.task_id = :tid "
                "     ORDER BY s.attempt_no DESC LIMIT 1) x) AS last_submission, "
                "  (SELECT row_to_json(y) FROM ("
                "     SELECT count(*) AS total, "
                "            count(*) FILTER (WHERE a.status = 'assigned')    AS assigned, "
                "            count(*) FILTER (WHERE a.status = 'in_progress') AS in_progress, "
                "            count(*) FILTER (WHERE a.status = 'submitted')   AS submitted, "
                "            count(*) FILTER (WHERE a.status = 'accepted')    AS accepted, "
                "            count(*) FILTER (WHERE a.status = 'rejected')    AS rejected, "
                "            count(*) FILTER (WHERE a.status = 'cancelled')   AS cancelled, "
                "            coalesce(sum(a.quantity) FILTER (WHERE a.status <> 'cancelled'), 0) "
                "              AS quantity_assigned "
                "     FROM task_assignment a WHERE a.task_id = :tid) y) AS assignment_summary, "
                "  (SELECT row_to_json(z) FROM ("
                "     SELECT count(*) FILTER (WHERE s.status = 'pending')     AS pending, "
                "            count(*) FILTER (WHERE s.status = 'ready')       AS ready, "
                "            count(*) FILTER (WHERE s.status = 'quarantined') AS quarantined, "
                "            count(*) FILTER (WHERE s.status = 'ready' AND s.submission_id IS NOT NULL) "
                "              AS bundled "
                "     FROM asset s WHERE s.task_id = :tid AND s.deleted_at IS NULL) z) AS asset_summary "
                "FROM task tk "
                "JOIN organisation o ON o.id = tk.assignee_org_id "
                "JOIN contract c ON c.id = tk.contract_id "
                "WHERE tk.id = :tid"
            ),
            {"tid": t.id},
        )
    ).mappings().one_or_none() or {}
    return {
        "id": t.id,
        "reference_code": t.reference_code,
        "contract_id": t.contract_id,
        "contract_ref": extra.get("contract_ref"),
        "assignee_org_id": t.assignee_org_id,
        "assignee_name": extra.get("assignee_name"),
        "assignee_kind": extra.get("assignee_kind"),
        "title": t.title,
        "target": t.target,
        "target_quantity": t.target_quantity,
        "target_unit": t.target_unit,
        "instructions": t.instructions,
        "capture_spec": t.capture_spec or {},
        "status": t.status,
        "due_on": t.due_on,
        "attachments": (await _task_files(session, t.id)),
        "last_submission": extra.get("last_submission"),
        "assignment_summary": extra.get("assignment_summary"),
        "asset_summary": extra.get("asset_summary"),
        "created_at": t.created_at,
    }


async def list_tasks(
    session: AsyncSession,
    claims: AccessClaims,
    contract_id: uuid.UUID | None = None,
    mine_only: bool = False,
) -> list[dict[str, Any]]:
    stmt = select(Task).where(Task.deleted_at.is_(None)).order_by(Task.created_at)
    if contract_id:
        stmt = stmt.where(Task.contract_id == contract_id)
    if mine_only:
        stmt = stmt.where(Task.assignee_org_id == claims.org_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [await _task_row(session, t) for t in rows]


async def create_task(
    session: AsyncSession,
    claims: AccessClaims,
    contract_id: uuid.UUID,
    assignee_org_id: uuid.UUID,
    title: str,
    target: str | None,
    due_on: dt.date | None,
    *,
    target_quantity: int | None = None,
    target_unit: str | None = None,
    instructions: str | None = None,
    capture_spec: dict[str, Any] | None = None,
    attachments: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    c = (
        await session.execute(select(Contract).where(Contract.id == contract_id))
    ).scalar_one_or_none()
    if c is None:
        raise LookupError("contract not found")
    if c.partner_org_id != claims.org_id:
        raise DeliveryError("Only the delivering partner assigns tasks.")
    if c.status not in ("active",):
        raise DeliveryError(f"A {c.status} contract cannot take new tasks.")

    # A task due after the contract's own delivery date cannot be delivered on
    # time by definition, and the partner is the one who answers for the miss.
    if due_on is not None:
        contract_due = (
            await session.execute(
                text(
                    "SELECT r.delivery_due_on FROM contract c "
                    "JOIN request r ON r.id = c.request_id WHERE c.id = :cid"
                ),
                {"cid": contract_id},
            )
        ).scalar_one_or_none()
        if contract_due is not None and due_on > contract_due:
            raise DeliveryError(
                f"A task cannot be due after the contract's delivery date "
                f"({contract_due.isoformat()})."
            )

    # "Only partners in your own network appear here" — enforced, not hinted.
    ok = (
        await session.execute(
            text(
                "SELECT EXISTS (SELECT 1 FROM organisation WHERE id = :aid "
                "AND parent_org_id = :me AND status = 'active' "
                "AND kind IN ('aggregator','business'))"
            ),
            {"aid": assignee_org_id, "me": claims.org_id},
        )
    ).scalar_one()
    if not ok:
        raise DeliveryError("The assignee must be an active aggregator or business in your network.")

    ref = (
        await session.execute(text("SELECT next_reference_code('TSK','seq_ref_task')"))
    ).scalar_one()
    t = Task(
        reference_code=ref,
        contract_id=contract_id,
        assignee_org_id=assignee_org_id,
        title=title,
        target=target,
        target_quantity=target_quantity,
        target_unit=target_unit,
        instructions=instructions,
        capture_spec=capture_spec or {},
        due_on=due_on,
        created_by=claims.user_id,
    )
    session.add(t)
    await session.flush()
    await _attach_instructions(session, claims, t.id, attachments)
    await notifier.notify(
        session, assignee_org_id,
        f"New task: {title}. Due {due_on.isoformat() if due_on else 'as agreed'}.",
        "tasks", {"id": str(t.id)},
    )
    await audit.log(
        session, "task.assigned",
        f"Assigned {ref}, {title}",
        [t.id, contract_id, claims.org_id, assignee_org_id],
    )
    return await _task_row(session, t)


async def start_task(
    session: AsyncSession, claims: AccessClaims, task_id: uuid.UUID
) -> dict[str, Any]:
    t = await _get_task(session, task_id)
    if t.assignee_org_id != claims.org_id:
        raise DeliveryError("Only the assignee starts a task.")
    if t.status not in ("assigned", "qa_failed"):
        raise DeliveryError(f"A {t.status} task cannot be started.")
    t.status = "in_progress"
    t.started_at = t.started_at or dt.datetime.now(dt.timezone.utc)
    t.updated_by = claims.user_id
    await audit.log(session, "task.started", f"Started {t.reference_code}, {t.title}",
                    [t.id, t.contract_id, claims.org_id])
    return await _task_row(session, t)


async def submit_task(
    session: AsyncSession,
    claims: AccessClaims,
    task_id: uuid.UUID,
    asset_count: int | None,
    note: str | None,
) -> dict[str, Any]:
    """One attempt, one submission row. A resubmission after qa_failed gets the
    next attempt number; every earlier attempt survives untouched.

    Two paths, decided by whether the task was split among workers:
      * no assignments (a business partner, or a legacy task): the supplier
        states the asset count, exactly as before;
      * assignments: every one must be accepted at gate 1 (or cancelled), and
        the submission bundles the ready captures of the accepted ones. The
        count is derived, never typed. A resubmission after a gate-2 failure
        re-bundles the accepted material as it stands at that moment.
    """
    t = await _get_task(session, task_id)
    if t.assignee_org_id != claims.org_id:
        raise DeliveryError("Only the assignee submits a task.")
    if t.status not in ("in_progress", "assigned", "qa_failed"):
        raise DeliveryError(f"A {t.status} task cannot be submitted.")

    n_assign = (
        await session.execute(
            text(
                "SELECT count(*) FROM task_assignment "
                "WHERE task_id = :t AND status <> 'cancelled'"
            ),
            {"t": task_id},
        )
    ).scalar_one()
    if n_assign == 0:
        # A supplier with no crowd — a business partner — states the count
        # itself. Zero is not a delivery: the partner would open a submission
        # with nothing in it to review.
        if asset_count is None:
            raise DeliveryError("asset_count is required for a task with no worker assignments.")
        if asset_count < 1:
            raise DeliveryError("A submission needs at least one asset.")
    if n_assign:
        blockers = (
            await session.execute(
                text(
                    "SELECT status, count(*) AS n FROM task_assignment "
                    "WHERE task_id = :t AND status NOT IN ('accepted','cancelled') "
                    "GROUP BY status ORDER BY status"
                ),
                {"t": task_id},
            )
        ).all()
        if blockers:
            listed = ", ".join(f"{n} {st.replace('_', ' ')}" for st, n in blockers)
            raise DeliveryError(
                f"Not ready: {listed} assignment(s). Accept or cancel them at gate 1 first."
            )

    attempt = (
        await session.execute(
            select(func.coalesce(func.max(Submission.attempt_no), 0)).where(
                Submission.task_id == task_id
            )
        )
    ).scalar_one() + 1

    now = dt.datetime.now(dt.timezone.utc)
    s = Submission(
        task_id=task_id,
        attempt_no=attempt,
        supplier_org_id=claims.org_id,
        status="submitted",
        supplier_note=note,
        asset_count=asset_count or 0,
        submitted_at=now,
        created_by=claims.user_id,
    )
    session.add(s)
    t.status = "submitted"
    t.updated_by = claims.user_id
    await session.flush()

    if n_assign:
        s.asset_count = await media.attach_to_submission(session, task_id, s.id)
        await session.flush()
    asset_count = s.asset_count

    partner = (
        await session.execute(
            select(Contract.partner_org_id).where(Contract.id == t.contract_id)
        )
    ).scalar_one()
    await notifier.notify(
        session, partner,
        f"{t.title}: {asset_count} assets submitted for QA (attempt {attempt}).",
        "qa", {"task_id": str(t.id)},
    )
    await audit.log(
        session, "submission.received",
        f"Submitted {asset_count} assets on {t.reference_code} (attempt {attempt})",
        [t.id, t.contract_id, claims.org_id, partner],
    )
    return await _task_row(session, t)


async def _get_task(session: AsyncSession, task_id: uuid.UUID) -> Task:
    t = (
        await session.execute(
            select(Task).where(Task.id == task_id, Task.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if t is None:
        raise LookupError("task not found")
    return t


# ---------------------------------------------------------------------------
# Assignments — the aggregator → person hop
#
#   assigned --worker start--> in_progress --worker submit--> submitted
#   submitted --accept--> accepted | --reject (note)--> rejected --start--> in_progress
#   accepted --reopen (task qa_failed)--> in_progress
#   assigned | in_progress | rejected --cancel--> cancelled
#
# A worker's session runs under the aggregator's org with role 'worker'; RLS
# narrows it to their own rows, so every query below joins nothing a worker
# cannot see (crowd_worker and app_user are the worker's own; task is theirs
# through worker_holds_assignment()).
# ---------------------------------------------------------------------------

_ASSIGNMENT_ROWS = (
    "SELECT a.id, a.task_id, a.contract_id, a.supplier_org_id, a.worker_user_id, a.quantity, "
    "       a.status, a.instructions, a.due_on, a.worker_note, a.decision_note, "
    "       a.assigned_at, a.started_at, a.submitted_at, a.decided_at, "
    "       coalesce(w.display_name, u.full_name) AS worker_name, w.reference_code AS worker_ref, "
    "       t.reference_code AS task_ref, t.title AS task_title, "
    "       t.instructions AS task_instructions, t.capture_spec, t.target_unit, "
    "       t.due_on AS task_due_on, t.status AS task_status, "
    "       coalesce(x.pending, 0) AS pending, coalesce(x.ready, 0) AS ready, "
    "       coalesce(x.quarantined, 0) AS quarantined, coalesce(x.total, 0) AS total "
    "FROM task_assignment a "
    "JOIN task t ON t.id = a.task_id "
    "LEFT JOIN crowd_worker w ON w.user_id = a.worker_user_id "
    "LEFT JOIN app_user u ON u.id = a.worker_user_id "
    "LEFT JOIN LATERAL (SELECT count(*) FILTER (WHERE s.status = 'pending')     AS pending, "
    "                          count(*) FILTER (WHERE s.status = 'ready')       AS ready, "
    "                          count(*) FILTER (WHERE s.status = 'quarantined') AS quarantined, "
    "                          count(*) AS total "
    "                   FROM asset s WHERE s.assignment_id = a.id AND s.deleted_at IS NULL) x "
    "          ON true "
)


def _assignment_dict(r: Any) -> dict[str, Any]:
    return {
        "id": r["id"],
        "task_id": r["task_id"],
        "contract_id": r["contract_id"],
        "supplier_org_id": r["supplier_org_id"],
        "worker_user_id": r["worker_user_id"],
        "worker_name": r["worker_name"],
        "worker_ref": r["worker_ref"],
        "quantity": r["quantity"],
        "status": r["status"],
        "instructions": r["instructions"],
        "due_on": r["due_on"],
        "worker_note": r["worker_note"],
        "decision_note": r["decision_note"],
        "assigned_at": r["assigned_at"],
        "started_at": r["started_at"],
        "submitted_at": r["submitted_at"],
        "decided_at": r["decided_at"],
        "assets": {
            "pending": int(r["pending"]), "ready": int(r["ready"]),
            "quarantined": int(r["quarantined"]), "total": int(r["total"]),
        },
        "task": {
            "id": r["task_id"],
            "reference_code": r["task_ref"],
            "title": r["task_title"],
            "instructions": r["task_instructions"],
            "capture_spec": r["capture_spec"] or {},
            "target_unit": r["target_unit"],
            "due_on": r["task_due_on"],
            "status": r["task_status"],
        },
    }


async def _assignments(
    session: AsyncSession, where: str, params: dict[str, Any], order: str = "a.assigned_at"
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(text(_ASSIGNMENT_ROWS + "WHERE " + where + " ORDER BY " + order), params)
    ).mappings().all()
    return [_assignment_dict(r) for r in rows]


async def _assignment_by_id(session: AsyncSession, assignment_id: uuid.UUID) -> dict[str, Any]:
    rows = await _assignments(session, "a.id = :id", {"id": assignment_id})
    if not rows:
        raise LookupError("assignment not found")
    return rows[0]


async def _get_assignment(session: AsyncSession, assignment_id: uuid.UUID) -> TaskAssignment:
    a = (
        await session.execute(select(TaskAssignment).where(TaskAssignment.id == assignment_id))
    ).scalar_one_or_none()
    if a is None:
        raise LookupError("assignment not found")
    return a


async def create_assignment(
    session: AsyncSession,
    claims: AccessClaims,
    task_id: uuid.UUID,
    worker_user_id: uuid.UUID,
    quantity: int,
    instructions: str | None,
    due_on: dt.date | None,
) -> dict[str, Any]:
    t = await _get_task(session, task_id)
    if t.assignee_org_id != claims.org_id:
        raise DeliveryError("Only the assigned supplier assigns its workers.")
    if t.status not in ("assigned", "in_progress", "qa_failed"):
        raise DeliveryError(f"A {t.status} task cannot take new assignments.")

    # A live worker grant in THIS organisation — invited from the roster.
    ok = (
        await session.execute(
            text(
                "SELECT EXISTS (SELECT 1 FROM user_role_grant g JOIN role r ON r.id = g.role_id "
                "WHERE g.user_id = :u AND g.org_id = :me AND r.code = 'worker' "
                "  AND g.revoked_at IS NULL)"
            ),
            {"u": worker_user_id, "me": claims.org_id},
        )
    ).scalar_one()
    if not ok:
        raise DeliveryError(
            "Not an active worker in your organisation. Invite them from the crowd roster first."
        )

    if t.target_quantity:
        assigned = (
            await session.execute(
                text(
                    "SELECT coalesce(sum(quantity), 0) FROM task_assignment "
                    "WHERE task_id = :t AND status <> 'cancelled'"
                ),
                {"t": task_id},
            )
        ).scalar_one()
        if assigned + quantity > t.target_quantity:
            unit = t.target_unit or "units"
            raise DeliveryError(
                f"Assigning {quantity} exceeds the task target of {t.target_quantity} {unit} "
                f"by {assigned + quantity - t.target_quantity}."
            )

    a = TaskAssignment(
        task_id=t.id,
        contract_id=t.contract_id,
        supplier_org_id=claims.org_id,
        worker_user_id=worker_user_id,
        quantity=quantity,
        instructions=instructions,
        due_on=due_on,
        assigned_by=claims.user_id,
    )
    session.add(a)
    try:
        await session.flush()
    except DBAPIError as e:
        msg = str(e.orig) if e.orig else str(e)
        if "task_assignment_one_open_key" in msg:
            raise DeliveryError("This worker already has an open assignment on this task.") from None
        raise

    unit = t.target_unit or "units"
    await notifier.notify(
        session, claims.org_id,
        f"New assignment: {t.title} — {quantity} {unit}."
        + (f" Due {due_on.isoformat()}." if due_on else ""),
        "assignment", {"id": str(a.id)},
        user_id=worker_user_id,
    )
    await audit.log(
        session, "assignment.created",
        f"Assigned {quantity} {unit} of {t.reference_code} to a worker",
        [a.id, t.id, t.contract_id, claims.org_id, worker_user_id],
    )
    return await _assignment_by_id(session, a.id)


async def list_assignments(
    session: AsyncSession, claims: AccessClaims, task_id: uuid.UUID
) -> list[dict[str, Any]]:
    """404 when the task itself is out of sight; otherwise RLS decides which
    assignments appear (the client sees the task and none of these)."""
    await _get_task(session, task_id)
    return await _assignments(session, "a.task_id = :t", {"t": task_id})


async def my_assignments(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    return await _assignments(
        session,
        "a.worker_user_id = :me AND a.status <> 'cancelled'",
        {"me": claims.user_id},
        order="a.assigned_at DESC",
    )


async def get_assignment(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID
) -> dict[str, Any]:
    return await _assignment_by_id(session, assignment_id)


async def start_assignment(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID
) -> dict[str, Any]:
    """The worker's first move, and the rework move after a rejection. The
    first start on a task moves the task itself to in_progress."""
    a = await _get_assignment(session, assignment_id)
    if a.worker_user_id != claims.user_id:
        raise DeliveryError("Only the assigned worker starts an assignment.")
    if a.status not in ("assigned", "rejected"):
        raise DeliveryError(f"A {a.status.replace('_', ' ')} assignment cannot be started.")
    a.status = "in_progress"
    a.started_at = a.started_at or dt.datetime.now(dt.timezone.utc)
    await session.execute(
        text(
            "UPDATE task SET status = 'in_progress', started_at = coalesce(started_at, now()) "
            "WHERE id = :t AND status IN ('assigned','qa_failed')"
        ),
        {"t": a.task_id},
    )
    await session.flush()
    row = await _assignment_by_id(session, a.id)
    await audit.log(
        session, "assignment.started",
        f"Started an assignment on {row['task']['reference_code']}",
        [a.id, a.task_id, a.contract_id, a.supplier_org_id],
    )
    return row


async def submit_assignment(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID, note: str | None
) -> dict[str, Any]:
    a = await _get_assignment(session, assignment_id)
    if a.worker_user_id != claims.user_id:
        raise DeliveryError("Only the assigned worker submits an assignment.")
    if a.status in ("assigned", "rejected"):
        raise DeliveryError("Start the assignment before submitting.")
    if a.status != "in_progress":
        raise DeliveryError(f"A {a.status} assignment cannot be submitted.")
    n = await media.ready_count(session, a.id)
    if n < 1:
        raise DeliveryError("Upload at least one file before submitting.")
    # The assignment carries the number of units this worker was given. Sending
    # it short pushes the shortfall onto the aggregator's review, where it costs
    # a rework round to discover.
    if a.quantity and n < a.quantity:
        raise DeliveryError(
            f"{a.quantity} required, {n} uploaded — capture {a.quantity - n} more before submitting."
        )

    a.status = "submitted"
    a.submitted_at = dt.datetime.now(dt.timezone.utc)
    a.worker_note = note
    await session.flush()
    row = await _assignment_by_id(session, a.id)

    await notifier.notify(
        session, a.supplier_org_id,
        f"{row['worker_name']} submitted {n} file(s) on {row['task']['title']} for review.",
        "gate1", {"assignment_id": str(a.id)},
    )
    await audit.log(
        session, "assignment.submitted",
        f"Submitted {n} file(s) on {row['task']['reference_code']}",
        [a.id, a.task_id, a.contract_id, a.supplier_org_id],
        {"assets": n},
    )
    return row


async def cancel_assignment(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID, reason: str | None
) -> dict[str, Any]:
    a = await _get_assignment(session, assignment_id)
    if a.supplier_org_id != claims.org_id:
        raise DeliveryError("Only the supplier cancels an assignment.")
    if a.status not in ("assigned", "in_progress", "rejected"):
        raise DeliveryError(f"A {a.status} assignment cannot be cancelled.")
    a.status = "cancelled"
    a.decided_at = dt.datetime.now(dt.timezone.utc)
    a.decided_by = claims.user_id
    await session.flush()
    row = await _assignment_by_id(session, a.id)
    await notifier.notify(
        session, claims.org_id,
        f"Your assignment on {row['task']['title']} was cancelled."
        + (f" {reason}" if reason else ""),
        "assignment", {"id": str(a.id)},
        user_id=a.worker_user_id,
    )
    await audit.log(
        session, "assignment.cancelled",
        f"Cancelled an assignment on {row['task']['reference_code']}",
        [a.id, a.task_id, a.contract_id, claims.org_id],
    )
    return row


async def reopen_assignment(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID, note: str | None
) -> dict[str, Any]:
    """After the delivery partner fails the task at gate 2, the aggregator
    sends an accepted assignment back to the worker for rework."""
    a = await _get_assignment(session, assignment_id)
    if a.supplier_org_id != claims.org_id:
        raise DeliveryError("Only the supplier reopens an assignment.")
    if a.status != "accepted":
        raise DeliveryError(f"A {a.status} assignment cannot be reopened.")
    task_status = (
        await session.execute(text("SELECT status FROM task WHERE id = :t"), {"t": a.task_id})
    ).scalar_one()
    if task_status != "qa_failed":
        raise DeliveryError("An assignment is reopened only after the task failed partner QA.")
    a.status = "in_progress"
    a.decision_note = note
    a.decided_at = dt.datetime.now(dt.timezone.utc)
    a.decided_by = claims.user_id
    await session.flush()
    row = await _assignment_by_id(session, a.id)
    await notifier.notify(
        session, claims.org_id,
        f"{row['task']['title']} came back from partner QA and needs rework."
        + (f" {note}" if note else ""),
        "assignment", {"id": str(a.id)},
        user_id=a.worker_user_id,
    )
    await audit.log(
        session, "assignment.reopened",
        f"Reopened an assignment on {row['task']['reference_code']} after gate 2",
        [a.id, a.task_id, a.contract_id, claims.org_id],
    )
    return row


# ---------------------------------------------------------------------------
# The two handovers
# ---------------------------------------------------------------------------

async def deliver_contract(
    session: AsyncSession, claims: AccessClaims, contract_id: uuid.UUID
) -> dict[str, Any]:
    """Partner -> client. Gated hard on every task having cleared QA."""
    c = (
        await session.execute(select(Contract).where(Contract.id == contract_id))
    ).scalar_one_or_none()
    if c is None:
        raise LookupError("contract not found")
    if c.partner_org_id != claims.org_id:
        raise DeliveryError("Only the delivering partner can deliver.")
    if c.status != "active":
        raise DeliveryError(f"A {c.status} contract cannot be delivered.")
    prog = await progress_of(session, contract_id)
    if not prog["deliverable"]:
        raise DeliveryError(
            f"Not deliverable: {prog['done']} of {prog['total']} tasks have cleared QA."
        )
    c.status = "delivered"
    c.delivered_at = dt.datetime.now(dt.timezone.utc)
    c.updated_by = claims.user_id
    await notifier.notify(
        session, c.client_org_id,
        "A delivery is ready. Your approval releases payment.",
        "deliveries", {"id": str(c.id)},
    )
    await audit.log(
        session, "contract.delivered",
        f"Delivered {c.reference_code} to the client",
        [c.id, c.request_id, c.client_org_id, c.partner_org_id],
    )
    return await _contract_row(session, c)


async def dispute_delivery(
    session: AsyncSession, claims: AccessClaims, contract_id: uuid.UUID, reason: str
) -> dict[str, Any]:
    """The client's other answer to a delivery.

    Approval releases the money, so refusing had to be possible: without it the
    only way to reject work was to withhold approval silently and leave the
    partner guessing. The contract goes back to active, which is the state that
    accepts new tasks and a later re-delivery — a dispute is a round of rework,
    not a terminus.
    """
    c = (
        await session.execute(select(Contract).where(Contract.id == contract_id))
    ).scalar_one_or_none()
    if c is None:
        raise LookupError("contract not found")
    if c.client_org_id != claims.org_id:
        raise DeliveryError("Only the client can dispute a delivery.")
    if c.status != "delivered":
        raise DeliveryError(f"A {c.status} contract cannot be disputed.")
    if not reason.strip():
        raise DeliveryError("Say what is wrong with the delivery.")

    c.status = "active"
    c.disputed_at = dt.datetime.now(dt.timezone.utc)
    c.delivered_at = None
    c.updated_by = claims.user_id
    await notifier.notify(
        session, c.partner_org_id,
        f"{c.reference_code} was sent back: {reason}",
        "contracts", {"id": str(c.id)},
    )
    await audit.log(
        session, "contract.disputed",
        f"Client sent {c.reference_code} back: {reason}",
        [c.id, c.request_id, c.client_org_id, c.partner_org_id],
    )
    return await _contract_row(session, c)


async def approve_delivery(
    session: AsyncSession,
    claims: AccessClaims,
    contract_id: uuid.UUID,
    score: int,
    comment: str,
) -> dict[str, Any]:
    """Client accepts: contract completes, money settles, the partner is rated.
    The comment is required — 'ratings without one are not published'."""
    from sourcehub.modules.network import service as network

    if not comment or not comment.strip():
        raise DeliveryError("Add a comment — ratings without one are not published.")

    c = (
        await session.execute(select(Contract).where(Contract.id == contract_id))
    ).scalar_one_or_none()
    if c is None:
        raise LookupError("contract not found")
    if c.client_org_id != claims.org_id:
        raise DeliveryError("Only the buying client approves a delivery.")
    if c.status != "delivered":
        raise DeliveryError(f"A {c.status} contract cannot be approved.")

    c.status = "completed"
    c.completed_at = dt.datetime.now(dt.timezone.utc)
    c.updated_by = claims.user_id

    await network.rate_counterparty(
        session, claims, contract_id=c.id, to_org_id=c.partner_org_id,
        score=score, comment=comment,
    )
    fee = await ledger.record_completion(
        session, c.id, c.client_org_id, c.partner_org_id,
        c.value, c.milestone_pct, c.platform_fee_pct,
    )
    await notifier.notify(
        session, c.partner_org_id,
        f"Delivery approved. {c.currency} {c.value} released "
        f"(platform fee {c.currency} {fee}).",
        "contracts", {"id": str(c.id)},
    )
    await audit.log(
        session, "contract.accepted",
        f"Approved {c.reference_code}; released {c.currency} {c.value} and rated the partner",
        [c.id, c.request_id, c.client_org_id, c.partner_org_id],
    )
    return await _contract_row(session, c)


async def _attach_instructions(
    session: AsyncSession, claims: AccessClaims, task_id: uuid.UUID,
    items: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """Files behind a task's instructions — a shot list, a site map.

    Workers can read these: attachment_parent_visible() runs under invoker
    rights, so a phone sees the attachments on a task it actually holds.
    """
    from sourcehub.modules.attachments import service as attachments

    if not items:
        return []
    if {i.get("slot") for i in items} - {"instructions"}:
        raise DeliveryError("A task takes attachments on its instructions.")
    try:
        return await attachments.attach(
            session, claims, entity_type="task", entity_id=task_id, items=items
        )
    except attachments.AttachmentError as e:
        raise DeliveryError(str(e)) from None
