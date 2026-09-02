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
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.audit import service as audit
from sourcehub.modules.delivery.models import Contract, Submission, Task
from sourcehub.modules.ledger import service as ledger
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

async def _task_row(session: AsyncSession, t: Task) -> dict[str, Any]:
    extra = (
        await session.execute(
            text(
                "SELECT o.name AS assignee_name, o.kind AS assignee_kind, "
                "  c.reference_code AS contract_ref, "
                "  (SELECT row_to_json(x) FROM ("
                "     SELECT s.id, s.attempt_no, s.status, s.supplier_note, s.asset_count, "
                "            s.submitted_at "
                "     FROM submission s WHERE s.task_id = :tid "
                "     ORDER BY s.attempt_no DESC LIMIT 1) x) AS last_submission "
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
        "status": t.status,
        "due_on": t.due_on,
        "last_submission": extra.get("last_submission"),
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
        due_on=due_on,
        created_by=claims.user_id,
    )
    session.add(t)
    await session.flush()
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
    asset_count: int,
    note: str | None,
) -> dict[str, Any]:
    """One attempt, one submission row. A resubmission after qa_failed gets the
    next attempt number; every earlier attempt survives untouched."""
    t = await _get_task(session, task_id)
    if t.assignee_org_id != claims.org_id:
        raise DeliveryError("Only the assignee submits a task.")
    if t.status not in ("in_progress", "assigned", "qa_failed"):
        raise DeliveryError(f"A {t.status} task cannot be submitted.")

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
        asset_count=asset_count,
        submitted_at=now,
        created_by=claims.user_id,
    )
    session.add(s)
    t.status = "submitted"
    t.updated_by = claims.user_id
    await session.flush()

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
