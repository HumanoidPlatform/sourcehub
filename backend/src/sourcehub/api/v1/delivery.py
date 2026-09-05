"""delivery — contracts, tasks, submissions, the two handovers."""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.modules.delivery import service as delivery
from sourcehub.modules.network import service as network
from sourcehub.modules.qa import service as qa

router = APIRouter(route_class=TxRoute)


class TaskIn(BaseModel):
    assignee_org_id: uuid.UUID
    title: str = Field(min_length=3)
    target: str | None = None
    due_on: dt.date | None = None
    # countable work, so the supplier can split it among workers
    target_quantity: int | None = Field(default=None, gt=0)
    target_unit: str | None = Field(default=None, max_length=40)
    instructions: str | None = None
    capture_spec: dict[str, Any] = Field(default_factory=dict)


class SubmitIn(BaseModel):
    # required only for a task with no worker assignments; otherwise derived
    asset_count: int | None = Field(default=None, gt=0)
    note: str | None = None


class AssignmentIn(BaseModel):
    worker_user_id: uuid.UUID
    quantity: int = Field(gt=0)
    instructions: str | None = None
    due_on: dt.date | None = None


class AssignmentNoteIn(BaseModel):
    note: str | None = None


class AssignmentDecideIn(BaseModel):
    outcome: Literal["accept", "reject"]
    note: str | None = None


class ApproveIn(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3)


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("/contracts")
async def list_contracts(
    principal: Principal = Depends(require_capability("contract.read")),
    session: AsyncSession = Depends(get_session),
):
    return await delivery.list_contracts(session, principal)


@router.get("/contracts/{contract_id}")
async def get_contract(
    contract_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    row = await delivery.get_contract(session, principal, contract_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found")
    row["ratings"] = await network.ratings_for(session, contract_id)
    return row


@router.post("/contracts/{contract_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    contract_id: uuid.UUID,
    body: TaskIn,
    principal: Principal = Depends(require_capability("task.assign")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.create_task(
            session, principal, contract_id, body.assignee_org_id,
            body.title, body.target, body.due_on,
            target_quantity=body.target_quantity, target_unit=body.target_unit,
            instructions=body.instructions, capture_spec=body.capture_spec,
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.get("/tasks")
async def my_tasks(
    principal: Principal = Depends(require_capability("task.read")),
    session: AsyncSession = Depends(get_session),
):
    return await delivery.list_tasks(session, principal, mine_only=True)


@router.get("/tasks/{task_id}/reviews")
async def task_reviews(
    task_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    return await qa.reviews_for_task(session, task_id)


@router.post("/tasks/{task_id}/start")
async def start_task(
    task_id: uuid.UUID,
    principal: Principal = Depends(require_capability("task.start")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.start_task(session, principal, task_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.post("/tasks/{task_id}/submit")
async def submit_task(
    task_id: uuid.UUID,
    body: SubmitIn,
    principal: Principal = Depends(require_capability("task.submit")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.submit_task(
            session, principal, task_id, body.asset_count, body.note
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


# --- assignments: the aggregator → worker hop ---------------------------------

@router.post("/tasks/{task_id}/assignments", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    task_id: uuid.UUID,
    body: AssignmentIn,
    principal: Principal = Depends(require_capability("assignment.assign")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.create_assignment(
            session, principal, task_id, body.worker_user_id,
            body.quantity, body.instructions, body.due_on,
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.get("/tasks/{task_id}/assignments")
async def task_assignments(
    task_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.list_assignments(session, principal, task_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found") from None


@router.get("/me/assignments")
async def my_assignments(
    principal: Principal = Depends(require_capability("assignment.read")),
    session: AsyncSession = Depends(get_session),
):
    """The worker's board. RLS shows a worker their own rows and nothing else."""
    return await delivery.my_assignments(session, principal)


@router.get("/assignments/{assignment_id}")
async def get_assignment(
    assignment_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.get_assignment(session, principal, assignment_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found") from None


@router.post("/assignments/{assignment_id}/start")
async def start_assignment(
    assignment_id: uuid.UUID,
    principal: Principal = Depends(require_capability("assignment.start")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.start_assignment(session, principal, assignment_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: uuid.UUID,
    body: AssignmentNoteIn | None = None,
    principal: Principal = Depends(require_capability("assignment.submit")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.submit_assignment(
            session, principal, assignment_id, body.note if body else None
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.post("/assignments/{assignment_id}/decide")
async def decide_assignment(
    assignment_id: uuid.UUID,
    body: AssignmentDecideIn,
    principal: Principal = Depends(require_capability("qa.review.gate1")),
    session: AsyncSession = Depends(get_session),
):
    """Gate 1: the supplier's own verdict on a worker's batch."""
    try:
        return await qa.decide_gate1(session, principal, assignment_id, body.outcome, body.note)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found") from None
    except qa.QaError as e:
        raise _conflict(e) from None


@router.post("/assignments/{assignment_id}/cancel")
async def cancel_assignment(
    assignment_id: uuid.UUID,
    body: AssignmentNoteIn | None = None,
    principal: Principal = Depends(require_capability("assignment.assign")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.cancel_assignment(
            session, principal, assignment_id, body.note if body else None
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.post("/assignments/{assignment_id}/reopen")
async def reopen_assignment(
    assignment_id: uuid.UUID,
    body: AssignmentNoteIn | None = None,
    principal: Principal = Depends(require_capability("assignment.assign")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.reopen_assignment(
            session, principal, assignment_id, body.note if body else None
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.post("/contracts/{contract_id}/deliver")
async def deliver(
    contract_id: uuid.UUID,
    principal: Principal = Depends(require_capability("contract.deliver")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await delivery.deliver_contract(session, principal, contract_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None


@router.post("/contracts/{contract_id}/approve")
async def approve(
    contract_id: uuid.UUID,
    body: ApproveIn,
    principal: Principal = Depends(require_capability("contract.approve")),
    session: AsyncSession = Depends(get_session),
):
    """Approval releases payment — contract.approve carries requires_mfa."""
    try:
        return await delivery.approve_delivery(
            session, principal, contract_id, body.score, body.comment
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found") from None
    except delivery.DeliveryError as e:
        raise _conflict(e) from None
