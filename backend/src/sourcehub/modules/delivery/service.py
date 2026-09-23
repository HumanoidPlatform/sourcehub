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
import html
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims, hash_token, new_opaque_token
from sourcehub.config import CAPTURE_APP, PRODUCT, settings
from sourcehub.db.session import anonymous_session, org_session
from sourcehub.modules.audit import service as audit
from sourcehub.modules.delivery.models import (
    Contract, Submission, Task, TaskAssignment, TaskOffer, TaskOfferRecipient,
)
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


# What a client attaches for whoever ends up doing the work, the ones a person
# capturing reaches for first at the top. NOT the brief: that carries the commercial terms and
# stays between the client and the partner.
#
# Who may read which of these is db/150's decision, not this module's — an
# aggregator gets all four, a worker everything but compliance, and both only
# for work that has actually come down to them. This list exists because the
# partner and the client can read the brief too, and a task should describe the
# same set of documents whoever is looking at it.
WORKING_SLOTS = ("guidelines", "capture_examples", "acceptance", "compliance")


def working_documents(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The request's attachments that travel with a task, grouped in slot order.
    Within a slot the order list_for gave (document, newest version first) is kept."""
    order = {slot: i for i, slot in enumerate(WORKING_SLOTS)}
    kept = [r for r in rows if r.get("slot") in order]
    return sorted(kept, key=lambda r: order[r["slot"]])  # sorted() is stable


async def _client_documents(
    session: AsyncSession, task_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[dict[str, Any]]]:
    """The client's working documents for several tasks at once, keyed by task.

    task_request_id() is a definer function because a worker cannot read
    contract to get from a task to its request; it answers only for a task the
    caller can see. Two queries however many tasks, since tasks on one contract
    share a request.
    """
    from sourcehub.modules.attachments import service as attachments

    ids = list(dict.fromkeys(task_ids))
    if not ids:
        return {}
    pairs = (
        await session.execute(
            text(
                "SELECT t.id AS task_id, task_request_id(t.id) AS request_id "
                "FROM unnest(CAST(:ids AS uuid[])) AS t(id)"
            ),
            {"ids": ids},
        )
    ).all()
    request_of = {p.task_id: p.request_id for p in pairs if p.request_id is not None}
    by_request = await attachments.list_for(session, "request", list(set(request_of.values())))
    return {
        task_id: working_documents(by_request.get(request_id, []))
        for task_id, request_id in request_of.items()
    }


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
        "client_documents": (await _client_documents(session, [t.id])).get(t.id, []),
        "last_submission": extra.get("last_submission"),
        "assignment_summary": extra.get("assignment_summary"),
        "asset_summary": extra.get("asset_summary"),
        "created_at": t.created_at,
    }


def tasks_stmt(
    org_id: uuid.UUID | None = None,
    contract_id: uuid.UUID | None = None,
    mine_only: bool = False,
):
    """The task query, ordered the way each of its two callers needs.

    A supplier's own list is a WORKLIST: the task that just landed is the one
    they opened the page to find. Under a single ascending order it arrived at
    the bottom, below every finished task of the past week — an aggregator with
    twelve tasks met a qa_passed one from seven days ago first and scrolled for
    today's work.

    A contract's breakdown is the opposite kind of list: a numbered sequence
    the partner reads from TSK-01 upward to see how the work was split. That
    one stays ascending.

    reference_code breaks the tie either way. Two tasks assigned in the same
    second is ordinary — one call per aisle — and without a second key their
    order is whatever the planner happens to return.
    """
    stmt = select(Task).where(Task.deleted_at.is_(None))
    if contract_id:
        stmt = stmt.where(Task.contract_id == contract_id)
    if mine_only:
        stmt = stmt.where(Task.assignee_org_id == org_id)
    return stmt.order_by(
        *(
            (Task.created_at.desc(), Task.reference_code.desc())
            if mine_only
            else (Task.created_at, Task.reference_code)
        )
    )


async def list_tasks(
    session: AsyncSession,
    claims: AccessClaims,
    contract_id: uuid.UUID | None = None,
    mine_only: bool = False,
) -> list[dict[str, Any]]:
    stmt = tasks_stmt(claims.org_id, contract_id, mine_only)
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
    subject: dict[str, Any] | None = None,
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

    # What the CLIENT asked for, inherited where the partner did not override.
    #
    # media/service.py:_allowed_kinds decides what a worker's phone may upload
    # from task.capture_spec and task.target_unit. Before this, both were typed
    # fresh by the partner and the client's answers reached nothing — a request
    # for video could become a task that happily accepted photographs. The
    # partner can still override either; they simply cannot lose them by
    # omission, which is what the console did on every task it created.
    # `not capture_spec` rather than `is None`: the API model defaults it to
    # {} (api/v1/delivery.py:31), so a console that never sends the field
    # arrives here with an empty dict, and an `is None` test would inherit
    # nothing while looking like it worked. An empty spec and no spec mean the
    # same thing to _allowed_kinds anyway. A partner who genuinely wants no
    # media restriction sends {"media": []}, which is truthy and overrides.
    if not capture_spec or target_unit is None:
        wanted = (
            await session.execute(
                text(
                    "SELECT r.capture_spec, r.target_unit FROM contract c "
                    "JOIN request r ON r.id = c.request_id WHERE c.id = :cid"
                ),
                {"cid": contract_id},
            )
        ).mappings().one_or_none()
        if wanted is not None:
            if capture_spec is None:
                capture_spec = wanted["capture_spec"] or None
            if target_unit is None:
                target_unit = wanted["target_unit"]

    # The subject rides inside capture_spec so it reaches the phone with the
    # rest of the requirements (_assignment_dict sends the whole spec), but it
    # is merged in AFTER inheritance: it must never cost the task the
    # client's media or tilt answers.
    if subject is not None:
        capture_spec = {**(capture_spec or {}), "subject": subject}

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
            raise DeliveryError("asset_count is required for a task with no crowd assignments.")
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
    "       coalesce(x.quarantined, 0) AS quarantined, coalesce(x.total, 0) AS total, "
    "       coalesce(m.reminder_count, 0) AS reminder_count, m.last_reminded_at "
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
    # a worker's own session reads no reminder rows (RLS), so theirs count 0
    "LEFT JOIN LATERAL (SELECT count(*) AS reminder_count, max(e.created_at) AS last_reminded_at "
    "                   FROM engagement_reminder e WHERE e.assignment_id = a.id) m "
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
        "reminder_count": int(r["reminder_count"]),
        "last_reminded_at": r["last_reminded_at"],
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
    from sourcehub.modules.attachments import service as attachments

    rows = (
        await session.execute(text(_ASSIGNMENT_ROWS + "WHERE " + where + " ORDER BY " + order), params)
    ).mappings().all()
    out = [_assignment_dict(r) for r in rows]
    # The files behind the words: the coordinator's own (a shot list, a site
    # map) and the client's working documents. The phone is who needs both, and
    # until now this payload carried neither. Batched per distinct task — a
    # worker's list is usually several assignments on a handful of tasks.
    task_ids = list({a["task_id"] for a in out})
    task_files = await attachments.list_for(session, "task", task_ids)
    client_docs = await _client_documents(session, task_ids)
    for a in out:
        a["task"]["attachments"] = task_files.get(a["task_id"], [])
        a["task"]["client_documents"] = client_docs.get(a["task_id"], [])
    return out


async def assignment_by_id(session: AsyncSession, assignment_id: uuid.UUID) -> dict[str, Any]:
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
        raise DeliveryError("Only the assigned supplier assigns its crowd.")
    return await _assign_worker(
        session,
        org_id=claims.org_id,
        assigned_by=claims.user_id,
        task=t,
        worker_user_id=worker_user_id,
        quantity=quantity,
        instructions=instructions,
        due_on=due_on,
    )


async def _assign_worker(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    assigned_by: uuid.UUID,
    task: Task,
    worker_user_id: uuid.UUID,
    quantity: int,
    instructions: str | None,
    due_on: dt.date | None,
    via_offer_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    """One worker's share of a task — the manual path and an accepted offer
    both end here. The caller has already established that org_id is the
    task's supplier; everything else the row needs is checked here, under a
    lock on the task so two assignments cannot both fit the same remainder."""
    t = task
    await session.execute(text("SELECT id FROM task WHERE id = :t FOR UPDATE"), {"t": t.id})
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
            {"u": worker_user_id, "me": org_id},
        )
    ).scalar_one()
    if not ok:
        raise DeliveryError(
            "Not an active crowd resource in your organisation. Invite them from the crowd roster first."
        )

    if t.target_quantity:
        assigned = await _assigned_quantity(session, t.id)
        if assigned + quantity > t.target_quantity:
            unit = t.target_unit or "units"
            raise DeliveryError(
                f"Assigning {quantity} exceeds the task target of {t.target_quantity} {unit} "
                f"by {assigned + quantity - t.target_quantity}."
            )

    a = TaskAssignment(
        task_id=t.id,
        contract_id=t.contract_id,
        supplier_org_id=org_id,
        worker_user_id=worker_user_id,
        quantity=quantity,
        instructions=instructions,
        due_on=due_on,
        assigned_by=assigned_by,
    )
    session.add(a)
    try:
        await session.flush()
    except DBAPIError as e:
        msg = str(e.orig) if e.orig else str(e)
        if "task_assignment_one_open_key" in msg:
            raise DeliveryError("This crowd resource already has an open assignment on this task.") from None
        raise

    unit = t.target_unit or "units"
    await notifier.notify(
        session, org_id,
        f"New assignment: {t.title} — {quantity} {unit}."
        + (f" Due {due_on.isoformat()}." if due_on else ""),
        "assignment", {"id": str(a.id)},
        user_id=worker_user_id,
    )
    await audit.log(
        session, "assignment.created",
        f"Assigned {quantity} {unit} of {t.reference_code} to a crowd resource",
        [a.id, t.id, t.contract_id, org_id, worker_user_id],
        {"via_offer_id": str(via_offer_id)} if via_offer_id else None,
    )
    return await assignment_by_id(session, a.id)


async def _assigned_quantity(session: AsyncSession, task_id: uuid.UUID) -> int:
    return int(
        (
            await session.execute(
                text(
                    "SELECT coalesce(sum(quantity), 0) FROM task_assignment "
                    "WHERE task_id = :t AND status <> 'cancelled'"
                ),
                {"t": task_id},
            )
        ).scalar_one()
    )


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
    return await assignment_by_id(session, assignment_id)


async def start_assignment(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID
) -> dict[str, Any]:
    """The worker's first move, and the rework move after a rejection. The
    first start on a task moves the task itself to in_progress."""
    a = await _get_assignment(session, assignment_id)
    if a.worker_user_id != claims.user_id:
        raise DeliveryError("Only the assigned crowd resource starts an assignment.")
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
    row = await assignment_by_id(session, a.id)
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
        raise DeliveryError("Only the assigned crowd resource submits an assignment.")
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
    row = await assignment_by_id(session, a.id)

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
    row = await assignment_by_id(session, a.id)
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
    row = await assignment_by_id(session, a.id)
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

# ---------------------------------------------------------------------------
# Offers — a task put to the crowd at once, first come first served
#
# The aggregator says it once ("N places, Q units each, by this date"); every
# recipient gets an email whose links carry a one-time token; the first N
# accepts each become a task_assignment through _assign_worker, exactly as a
# manual assignment does. See db/130_task_offers.sql for the invariants.
#
# The worker is anonymous when they click. The token resolves through the
# SECURITY DEFINER task_offer_lookup(); the write then runs inside
# org_session(supplier org, 'aggregator', worker): the assignment is the
# supplier's row (its INSERT policy needs NOT is_worker()), and the audit
# actor becomes (supplier org, the worker who clicked). assigned_by stays
# the person who broadcast the offer.
# ---------------------------------------------------------------------------

_ASSIGNABLE = ("assigned", "in_progress", "qa_failed")
_OFFER_STATES_CLOSED = {"closed": 410, "filled": 410, "expired": 410, "responded": 409}


class OfferUnavailableError(DeliveryError):
    """The link works but the answer can no longer be taken; .state names why."""

    def __init__(self, state: str, message: str) -> None:
        super().__init__(message)
        self.state = state
        self.http_status = _OFFER_STATES_CLOSED.get(state, 409)


def offer_state(row: Any, now: dt.datetime | None = None) -> str:
    """One word for the page, in priority order: an answer already given wins
    over everything; then the offer's own status; then the deadline; then
    whether the task or the worker can still take it."""
    now = now or dt.datetime.now(dt.timezone.utc)
    if row["response"] is not None:
        return "responded"
    if row["offer_status"] == "closed":
        return "closed"
    if row["offer_status"] == "filled" or row["accepted_count"] >= row["worker_limit"]:
        return "filled"
    if row["respond_by"] < now:
        return "expired"
    if row["task_status"] not in _ASSIGNABLE:
        return "task_closed"
    if not row["grant_live"]:
        return "not_a_worker"
    return "open"


_STATE_MESSAGES = {
    "responded": "You have already answered this offer.",
    "closed": "This task is closed — the offer was withdrawn.",
    "filled": "This task is closed — all places have been taken.",
    "expired": "This task is closed — the time to respond has passed.",
    "task_closed": "This task is no longer taking anyone.",
    "not_a_worker": "You are no longer active for this organisation.",
}


def offer_email(
    *,
    worker_name: str,
    org_name: str,
    task_ref: str,
    task_title: str,
    unit: str,
    quantity: int,
    worker_limit: int,
    due_on: dt.date | None,
    respond_by: dt.datetime,
    instructions: str | None,
    accept_url: str,
    decline_url: str,
    lead: str | None = None,
) -> tuple[str, str, str]:
    """(subject, text, html). Both links sit on their own lines in the text
    part; the HTML part shows them as buttons. Every interpolated field is
    escaped in the HTML: a task title is somebody else's input.

    `lead` turns the mail into a reminder (engage module): one sentence after
    the greeting saying why the worker is hearing about this again, and
    "Reminder:" on the subject so it threads under the original."""
    due = due_on.isoformat() if due_on else "not set"
    by = respond_by.astimezone(dt.timezone.utc).strftime("%d %b %Y, %H:%M UTC")
    places = f"{worker_limit} place" + ("s" if worker_limit != 1 else "")
    subject = f"{org_name} is offering you a task — {task_ref} {task_title}"
    if lead:
        subject = "Reminder: " + subject
    text_body = (
        f"Hello {worker_name},\n\n"
        + (f"{lead}\n\n" if lead else "")
        + f"{org_name} is offering you work on {PRODUCT}.\n\n"
        f"  Task:          {task_ref} — {task_title}\n"
        f"  Your share:    {quantity} {unit}\n"
        f"  Due:           {due}\n"
        f"  Places:        {places}, first come first served\n"
        f"  Respond by:    {by}\n\n"
        + (f"Instructions:\n{instructions}\n\n" if instructions else "")
        + f"Accept:\n  {accept_url}\n\n"
        f"Decline:\n  {decline_url}\n\n"
        f"Once you accept, the task appears in your {CAPTURE_APP} app and on the console.\n"
        f"If all places are taken before you answer, the link will say so."
    )
    e = html.escape
    rows = [
        ("Task", f"{e(task_ref)} — {e(task_title)}"),
        ("Your share", f"{quantity} {e(unit)}"),
        ("Due", e(due)),
        ("Places", f"{places}, first come first served"),
        ("Respond by", e(by)),
    ]
    trs = "".join(
        f'<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap">{k}</td>'
        f'<td style="padding:4px 0">{v}</td></tr>'
        for k, v in rows
    )
    instr = (
        f'<p style="margin:16px 0 0"><strong>Instructions</strong></p>'
        f'<p style="margin:4px 0 0;white-space:pre-wrap">{e(instructions)}</p>'
        if instructions else ""
    )
    btn = (
        'display:inline-block;padding:10px 18px;border-radius:6px;'
        'text-decoration:none;font-weight:600'
    )
    html_body = (
        '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'
        'font-size:15px;line-height:1.45;color:#1c1c1c;max-width:560px">'
        f"<p>Hello {e(worker_name)},</p>"
        + (f"<p><strong>{e(lead)}</strong></p>" if lead else "")
        + f"<p>{e(org_name)} is offering you work on {e(PRODUCT)}.</p>"
        f'<table style="border-collapse:collapse;font-size:15px">{trs}</table>'
        f"{instr}"
        '<p style="margin:24px 0 8px">'
        f'<a href="{e(accept_url)}" style="{btn};background:#1f6f43;color:#fff">Accept</a>'
        '&nbsp;&nbsp;'
        f'<a href="{e(decline_url)}" style="{btn};background:#eee;color:#1c1c1c">Decline</a>'
        "</p>"
        f'<p style="color:#666;font-size:13px">Once you accept, the task appears in your '
        f'{e(CAPTURE_APP)} app and on the console. If all places are taken before you '
        "answer, the link will say so.</p>"
        "</div>"
    )
    return subject, text_body, html_body


_OFFER_ROWS = (
    "SELECT o.id, o.task_id, o.status, o.worker_limit, o.quantity, o.accepted_count, "
    "       o.instructions, o.due_on, o.respond_by, o.created_at, o.created_by, o.closed_at, "
    "       r.id AS recipient_id, r.worker_user_id, r.email, r.sent_at, r.send_error, "
    "       r.response, r.responded_at, r.assignment_id, "
    "       coalesce(w.display_name, u.full_name) AS worker_name, w.reference_code AS worker_ref "
    "FROM task_offer o "
    "LEFT JOIN task_offer_recipient r ON r.offer_id = o.id "
    "LEFT JOIN crowd_worker w ON w.user_id = r.worker_user_id AND w.deleted_at IS NULL "
    "LEFT JOIN app_user u ON u.id = r.worker_user_id "
)


def _effective_status(status: str, respond_by: dt.datetime) -> str:
    if status == "open" and respond_by < dt.datetime.now(dt.timezone.utc):
        return "expired"
    return status


async def _offers(
    session: AsyncSession, where: str, params: dict[str, Any]
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(_OFFER_ROWS + "WHERE " + where + " ORDER BY o.created_at DESC, worker_name"),
            params,
        )
    ).mappings().all()
    out: dict[uuid.UUID, dict[str, Any]] = {}
    for r in rows:
        o = out.get(r["id"])
        if o is None:
            o = out[r["id"]] = {
                "id": r["id"],
                "task_id": r["task_id"],
                "status": r["status"],
                "effective_status": _effective_status(r["status"], r["respond_by"]),
                "worker_limit": r["worker_limit"],
                "quantity": r["quantity"],
                "accepted_count": r["accepted_count"],
                "declined_count": 0,
                "pending_count": 0,
                "instructions": r["instructions"],
                "due_on": r["due_on"],
                "respond_by": r["respond_by"],
                "created_at": r["created_at"],
                "closed_at": r["closed_at"],
                "recipients": [],
            }
        if r["recipient_id"] is None:
            continue
        if r["response"] == "declined":
            o["declined_count"] += 1
        elif r["response"] is None:
            o["pending_count"] += 1
        o["recipients"].append(
            {
                "id": r["recipient_id"],
                "worker_user_id": r["worker_user_id"],
                "worker_name": r["worker_name"],
                "worker_ref": r["worker_ref"],
                "email": r["email"],
                "sent_at": r["sent_at"],
                "send_error": r["send_error"],
                "response": r["response"],
                "responded_at": r["responded_at"],
                "assignment_id": r["assignment_id"],
                "reminders": [],
            }
        )
    await _attach_reminders(session, out)
    return list(out.values())


async def _attach_reminders(session: AsyncSession, offers: dict[uuid.UUID, dict[str, Any]]) -> None:
    """The campaign history behind each chip: what the clock, or the
    aggregator by hand, sent this recipient and whether it went."""
    by_recipient = {r["id"]: r for o in offers.values() for r in o["recipients"]}
    if not by_recipient:
        return
    rows = (
        await session.execute(
            text(
                "SELECT offer_recipient_id, kind, step, sent_at, send_error, manual_by "
                "FROM engagement_reminder WHERE offer_recipient_id = ANY(:ids) "
                "ORDER BY created_at"
            ),
            {"ids": list(by_recipient)},
        )
    ).mappings().all()
    for e in rows:
        by_recipient[e["offer_recipient_id"]]["reminders"].append(
            {
                "kind": e["kind"],
                "step": e["step"],
                "sent_at": e["sent_at"],
                "send_error": e["send_error"],
                "manual": e["manual_by"] is not None,
            }
        )


async def offer_by_id(session: AsyncSession, offer_id: uuid.UUID) -> dict[str, Any]:
    rows = await _offers(session, "o.id = :id", {"id": offer_id})
    if not rows:
        raise LookupError("offer not found")
    return rows[0]


async def list_offers(
    session: AsyncSession, claims: AccessClaims, task_id: uuid.UUID
) -> list[dict[str, Any]]:
    """404 when the task is out of sight; otherwise RLS decides (the client
    and the partner see none — who was asked is crowd management)."""
    await _get_task(session, task_id)
    return await _offers(session, "o.task_id = :t", {"t": task_id})


_ELIGIBLE_WORKERS = text(
    "SELECT w.user_id, coalesce(w.email, u.email) AS email, "
    "       coalesce(w.display_name, u.full_name) AS name "
    "FROM crowd_worker w "
    "JOIN app_user u ON u.id = w.user_id "
    "WHERE w.aggregator_org_id = :me AND w.deleted_at IS NULL AND w.status <> 'offboarded' "
    "  AND EXISTS (SELECT 1 FROM user_role_grant g JOIN role r ON r.id = g.role_id "
    "              WHERE g.user_id = w.user_id AND g.org_id = :me AND r.code = 'worker' "
    "                AND g.revoked_at IS NULL) "
    "  AND u.status = 'active' "
    "  AND NOT EXISTS (SELECT 1 FROM task_assignment a WHERE a.task_id = :t "
    "                  AND a.worker_user_id = w.user_id "
    "                  AND a.status IN ('assigned','in_progress','submitted','rejected')) "
    "ORDER BY name"
)


async def create_offer(
    session: AsyncSession,
    claims: AccessClaims,
    task_id: uuid.UUID,
    *,
    worker_limit: int,
    quantity: int,
    instructions: str | None,
    due_on: dt.date | None,
    respond_by: dt.datetime | None,
    recipient_user_ids: list[uuid.UUID] | None,
) -> dict[str, Any]:
    t = await _get_task(session, task_id)
    if t.assignee_org_id != claims.org_id:
        raise DeliveryError("Only the assigned supplier offers its tasks.")
    if t.status not in _ASSIGNABLE:
        raise DeliveryError(f"A {t.status} task cannot be offered.")

    now = dt.datetime.now(dt.timezone.utc)
    if respond_by is None:
        respond_by = now + dt.timedelta(days=settings.invitation_ttl_days)
    elif respond_by <= now:
        raise DeliveryError("The respond-by time is already in the past.")

    # Every place must fit the target, or the last accepter is refused for a
    # reason they cannot see.
    if t.target_quantity:
        assigned = await _assigned_quantity(session, t.id)
        if assigned + worker_limit * quantity > t.target_quantity:
            unit = t.target_unit or "units"
            raise DeliveryError(
                f"{worker_limit} x {quantity} {unit} exceeds what is left of the task target "
                f"({t.target_quantity - assigned} of {t.target_quantity} {unit})."
            )

    eligible = (
        await session.execute(_ELIGIBLE_WORKERS, {"me": claims.org_id, "t": t.id})
    ).mappings().all()
    if recipient_user_ids is not None:
        wanted = set(recipient_user_ids)
        by_id = {r["user_id"]: r for r in eligible}
        unknown = wanted - set(by_id)
        if unknown:
            raise DeliveryError(
                f"{len(unknown)} of the chosen crowd resources cannot take this task "
                "(offboarded, not yet signed up, or already assigned to it)."
            )
        eligible = [by_id[u] for u in recipient_user_ids if u in wanted]
    if not eligible:
        raise DeliveryError("Nobody on the roster can take this task right now.")

    o = TaskOffer(
        task_id=t.id,
        contract_id=t.contract_id,
        supplier_org_id=claims.org_id,
        worker_limit=worker_limit,
        quantity=quantity,
        instructions=instructions,
        due_on=due_on,
        respond_by=respond_by,
        created_by=claims.user_id,
    )
    session.add(o)
    try:
        await session.flush()
    except DBAPIError as e:
        msg = str(e.orig) if e.orig else str(e)
        if "task_offer_one_open_key" in msg:
            raise DeliveryError("This task already has an open offer. Close it first.") from None
        raise

    org_name = (
        await session.execute(
            text("SELECT name FROM organisation WHERE id = :o"), {"o": claims.org_id}
        )
    ).scalar_one()
    unit = t.target_unit or "units"
    recipients: list[TaskOfferRecipient] = []
    messages: list[tuple[str, str, str, str | None]] = []
    for w in eligible:
        raw, digest = new_opaque_token()
        r = TaskOfferRecipient(
            offer_id=o.id,
            supplier_org_id=claims.org_id,
            worker_user_id=w["user_id"],
            email=w["email"],
            token_hash=digest,
        )
        session.add(r)
        recipients.append(r)
        base = f"{settings.app_base_url}/offer?token={raw}"
        subject, body, html_body = offer_email(
            worker_name=w["name"], org_name=org_name,
            task_ref=t.reference_code, task_title=t.title, unit=unit,
            quantity=quantity, worker_limit=worker_limit, due_on=due_on,
            respond_by=respond_by, instructions=instructions,
            accept_url=base + "&intent=accept", decline_url=base + "&intent=decline",
        )
        messages.append((w["email"], subject, body, html_body))
    await session.flush()

    await audit.log(
        session, "offer.created",
        f"Offered {t.reference_code} to {len(recipients)} crowd resources "
        f"({worker_limit} x {quantity} {unit})",
        [o.id, t.id, t.contract_id, claims.org_id],
    )

    errors = await _send_offer_emails(messages)
    sent_at = dt.datetime.now(dt.timezone.utc)
    for r, err in zip(recipients, errors, strict=True):
        if err is None:
            r.sent_at = sent_at
        else:
            r.send_error = err
    await session.flush()
    return await offer_by_id(session, o.id)


async def _send_offer_emails(
    messages: list[tuple[str, str, str, str | None]],
) -> list[str | None]:
    """Best-effort, like the invitations: the offer exists either way and the
    console shows who did not get the mail. One connection for the batch."""
    from sourcehub.platform.mail.smtp import send_many

    try:
        return await send_many(messages)
    except OSError as e:
        return [str(e)[:300]] * len(messages)


async def close_offer(
    session: AsyncSession, claims: AccessClaims, offer_id: uuid.UUID
) -> dict[str, Any]:
    o = (
        await session.execute(
            select(TaskOffer).where(TaskOffer.id == offer_id).with_for_update()
        )
    ).scalar_one_or_none()
    if o is None:
        raise LookupError("offer not found")
    if o.supplier_org_id != claims.org_id:
        raise DeliveryError("Only the offering supplier closes its offer.")
    if o.status != "open":
        raise DeliveryError(f"The offer is already {o.status}.")
    o.status = "closed"
    o.closed_at = dt.datetime.now(dt.timezone.utc)
    o.closed_by = claims.user_id
    await session.flush()
    await audit.log(
        session, "offer.closed",
        f"Closed the offer with {o.accepted_count} of {o.worker_limit} places taken",
        [o.id, o.task_id, o.contract_id, claims.org_id],
    )
    return await offer_by_id(session, o.id)


async def _lookup_offer(token: str) -> dict[str, Any]:
    async with anonymous_session() as s:
        row = (
            await s.execute(text("SELECT * FROM task_offer_lookup(:h)"), {"h": hash_token(token)})
        ).mappings().first()
    if row is None:
        raise LookupError("offer not found")
    return dict(row)


def _preview_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "state": offer_state(row),
        "org_name": row["org_name"],
        "worker_name": row["worker_name"],
        "worker_email": row["worker_email"],
        "task": {
            "reference_code": row["task_ref"],
            "title": row["task_title"],
            "instructions": row["task_instructions"],
            "due_on": row["task_due_on"],
            "target_unit": row["target_unit"],
        },
        "quantity": row["quantity"],
        "instructions": row["instructions"],
        "due_on": row["due_on"],
        "respond_by": row["respond_by"],
        "worker_limit": row["worker_limit"],
        "response": row["response"],
        "responded_at": row["responded_at"],
    }


async def preview_offer(token: str) -> dict[str, Any]:
    """What the link shows before any click. Read-only: mail scanners follow
    links, and a scanner must not accept a task."""
    return _preview_dict(await _lookup_offer(token))


async def respond_to_offer(token: str, action: str) -> dict[str, Any]:
    """The click. Serialised per offer by FOR UPDATE on the offer row, so the
    limit is exact under concurrent accepts; the CHECK on accepted_count is
    the brace to that belt. Nothing is written when the answer is refused."""
    row = await _lookup_offer(token)

    async with org_session(row["supplier_org_id"], "aggregator", row["worker_user_id"]) as s:
        o = (
            await s.execute(
                select(TaskOffer).where(TaskOffer.id == row["offer_id"]).with_for_update()
            )
        ).scalar_one()
        r = (
            await s.execute(
                select(TaskOfferRecipient)
                .where(TaskOfferRecipient.id == row["recipient_id"])
                .with_for_update()
            )
        ).scalar_one()

        # re-decide on the locked rows: the lookup was a snapshot from before
        # the queue of accepts ahead of this one drained
        now = dt.datetime.now(dt.timezone.utc)
        live = dict(row, response=r.response, offer_status=o.status,
                    accepted_count=o.accepted_count, worker_limit=o.worker_limit)
        state = offer_state(live, now)
        # a decline is still worth recording when only the task or the grant
        # has moved on; an accept needs everything open
        refused = state != "open" and (action == "accept" or state in _OFFER_STATES_CLOSED)
        if refused:
            raise OfferUnavailableError(state, _STATE_MESSAGES[state])

        t = await _get_task(s, o.task_id)
        if action == "decline":
            r.response = "declined"
            r.responded_at = now
            await s.flush()
            await audit.log(
                s, "offer.declined", f"Declined the offer on {t.reference_code}",
                [o.id, r.id, t.id, o.contract_id, o.supplier_org_id, r.worker_user_id],
            )
            return {"state": "declined", "assignment_id": None}

        a = await _assign_worker(
            s,
            org_id=o.supplier_org_id,
            assigned_by=o.created_by,
            task=t,
            worker_user_id=r.worker_user_id,
            quantity=o.quantity,
            instructions=o.instructions,
            due_on=o.due_on,
            via_offer_id=o.id,
        )
        r.response = "accepted"
        r.responded_at = now
        r.assignment_id = a["id"]
        o.accepted_count += 1
        if o.accepted_count >= o.worker_limit:
            o.status = "filled"
            o.closed_at = now
        await s.flush()
        await notifier.notify(
            s, o.supplier_org_id,
            f"{row['worker_name']} accepted {t.reference_code} "
            f"({o.accepted_count} of {o.worker_limit} places taken).",
            "tasks", {"id": str(t.id)},
        )
        await audit.log(
            s, "offer.accepted",
            f"Accepted the offer on {t.reference_code} ({o.accepted_count}/{o.worker_limit})",
            [o.id, r.id, a["id"], t.id, o.contract_id, o.supplier_org_id, r.worker_user_id],
        )
        return {"state": "accepted", "assignment_id": a["id"]}
