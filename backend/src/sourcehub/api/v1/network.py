"""network — partners, equipment, loans, roster, ratings."""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.modules.network import service as network

router = APIRouter(route_class=TxRoute)


class EquipmentIn(BaseModel):
    equipment_type: str = Field(min_length=2)
    total_units: int = Field(gt=0)
    calibrated_on: dt.date | None = None
    calibration_expires_on: dt.date | None = None


class EquipmentStatusIn(BaseModel):
    status: Literal["available", "in_use", "returned", "maintenance", "retired"]


class LoanIn(BaseModel):
    equipment_id: uuid.UUID
    units: int = Field(gt=0)
    needed_by: dt.date | None = None
    task_id: uuid.UUID | None = None
    note: str | None = None


class LoanDecideIn(BaseModel):
    decision: Literal["approved", "rejected", "returned"]
    reason: str | None = None


# Same nine values, same order, as the CHECK in db/190_worker_skills.sql and
# SKILLS in frontend/src/features/network/vocabularies.ts. A Literal here turns
# a bad value into a 422 naming the field, rather than an IntegrityError 500
# out of Postgres. tests/test_worker_skills_unit.py pins the three lists
# together — nothing else in the repo does.
Skill = Literal[
    "street_imagery", "night_driving", "shelf_capture",
    "drone_operation", "retail_audit", "field_survey",
    "transcription", "voice_capture", "household_survey",
]


class WorkerIn(BaseModel):
    display_name: str = Field(min_length=2)
    skills: list[Skill] = Field(default_factory=list)
    trained: bool = False
    # With an email the worker is invited to sign in to the capture app;
    # without one this is a roster-only record.
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)


class WorkerStatusIn(BaseModel):
    status: Literal["on_shift", "on_break", "offboarded"]


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


# --- equipment ---------------------------------------------------------------

@router.get("/equipment")
async def list_equipment(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    return await network.list_equipment(session, principal)


@router.post("/equipment", status_code=status.HTTP_201_CREATED)
async def add_equipment(
    body: EquipmentIn,
    principal: Principal = Depends(require_capability("equipment.manage")),
    session: AsyncSession = Depends(get_session),
):
    return await network.add_equipment(
        session, principal, body.equipment_type, body.total_units,
        body.calibrated_on, body.calibration_expires_on,
    )


@router.post("/equipment/{equipment_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def set_equipment_status(
    equipment_id: uuid.UUID,
    body: EquipmentStatusIn,
    principal: Principal = Depends(require_capability("equipment.manage")),
    session: AsyncSession = Depends(get_session),
):
    try:
        await network.set_equipment_status(session, principal, equipment_id, body.status)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipment not found") from None


# --- loans -------------------------------------------------------------------

@router.get("/loans")
async def list_loans(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    return await network.list_loans(session, principal)


@router.post("/loans", status_code=status.HTTP_201_CREATED)
async def request_loan(
    body: LoanIn,
    principal: Principal = Depends(require_capability("equipment.request")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await network.request_loan(
            session, principal, body.equipment_id, body.units,
            body.needed_by, body.task_id, body.note,
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipment not found") from None


@router.post("/loans/{loan_id}/decide")
async def decide_loan(
    loan_id: uuid.UUID,
    body: LoanDecideIn,
    principal: Principal = Depends(require_capability("equipment.decide")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await network.decide_loan(session, principal, loan_id, body.decision, body.reason)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Loan not found") from None
    except network.NetworkError as e:
        raise _conflict(e) from None


# --- crowd roster ------------------------------------------------------------

@router.get("/workers")
async def list_workers(
    principal: Principal = Depends(require_capability("roster.manage")),
    session: AsyncSession = Depends(get_session),
):
    return await network.list_workers(session, principal)


@router.post("/workers", status_code=status.HTTP_201_CREATED)
async def add_worker(
    body: WorkerIn,
    principal: Principal = Depends(require_capability("roster.manage")),
    session: AsyncSession = Depends(get_session),
):
    """With an email: the worker is created as a user of this organisation and
    emailed an invitation. Without: a roster-only record, as before."""
    if body.email is None:
        return await network.add_worker(
            session, principal, body.display_name, body.skills, body.trained
        )
    try:
        return await network.invite_worker(
            session, principal,
            email=str(body.email), full_name=body.display_name, phone=body.phone,
            skills=body.skills, trained=body.trained,
        )
    except network.NetworkError as e:
        raise _conflict(e) from None


@router.post("/workers/{worker_id}/resend-invitation", status_code=status.HTTP_204_NO_CONTENT)
async def resend_worker_invitation(
    worker_id: uuid.UUID,
    principal: Principal = Depends(require_capability("roster.manage")),
    session: AsyncSession = Depends(get_session),
):
    try:
        await network.resend_worker_invitation(session, principal, worker_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Crowd resource not found") from None
    except network.NetworkError as e:
        raise _conflict(e) from None


class WorkerPatchIn(BaseModel):
    skills: list[Skill] = Field(default_factory=list)


@router.patch("/workers/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_worker(
    worker_id: uuid.UUID,
    body: WorkerPatchIn,
    principal: Principal = Depends(require_capability("roster.manage")),
    session: AsyncSession = Depends(get_session),
):
    """Skills were settable only at creation, so everyone already on a roster
    was stuck with whatever was typed the first time — and offboarding and
    re-adding is not a way back: it is irreversible and the same email is
    refused."""
    try:
        await network.update_worker(session, principal, worker_id, body.skills)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Crowd resource not found") from None


@router.post("/workers/{worker_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def set_worker_status(
    worker_id: uuid.UUID,
    body: WorkerStatusIn,
    principal: Principal = Depends(require_capability("roster.manage")),
    session: AsyncSession = Depends(get_session),
):
    try:
        await network.set_worker_status(session, principal, worker_id, body.status)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Crowd resource not found") from None


# --- ratings -----------------------------------------------------------------

@router.get("/ratings")
async def ratings(
    contract_id: uuid.UUID | None = None,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    return await network.ratings_for(session, contract_id)
