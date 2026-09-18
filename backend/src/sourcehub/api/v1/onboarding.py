"""onboarding — requests, the Ops approval queue, invitations."""

from __future__ import annotations

import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.modules.onboarding import service as onboarding

router = APIRouter(route_class=TxRoute)


class OnboardingCreateIn(BaseModel):
    target_org_kind: Literal["client", "tenant", "aggregator", "business", "sponsor"]
    proposed_name: str = Field(min_length=2)
    payload: dict[str, Any] = Field(default_factory=dict)
    contact: dict[str, Any]
    submit: bool = True


class OnboardingUpdateIn(BaseModel):
    proposed_name: str | None = None
    payload: dict[str, Any] | None = None
    contact: dict[str, Any] | None = None


class DecisionIn(BaseModel):
    decision: Literal["approved", "rejected", "changes_requested"]
    reason: str | None = None


def _contact_ok(contact: dict[str, Any]) -> bool:
    return bool(contact.get("email")) and bool(contact.get("full_name"))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_request(
    body: OnboardingCreateIn,
    principal: Principal = Depends(require_capability("onboarding.request")),
    session: AsyncSession = Depends(get_session),
):
    if not _contact_ok(body.contact):
        raise HTTPException(422, "contact must include full_name and email")
    try:
        return await onboarding.create_request(
            session, principal, body.target_org_kind, body.proposed_name,
            body.payload, body.contact, body.submit,
        )
    # Order matters: the conflict subclasses the base error, and "this email is
    # taken" is not a permissions answer.
    except onboarding.OnboardingConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
    except onboarding.OnboardingError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e)) from None


@router.get("")
async def list_requests(
    status_filter: str | None = None,
    principal: Principal = Depends(require_capability("onboarding.read")),
    session: AsyncSession = Depends(get_session),
):
    return await onboarding.list_requests(session, status_filter)


@router.get("/{request_id}")
async def get_request(
    request_id: uuid.UUID,
    principal: Principal = Depends(require_capability("onboarding.read")),
    session: AsyncSession = Depends(get_session),
):
    row = await onboarding.get_request(session, request_id)
    if row is None:
        # RLS may be hiding it; existence is not disclosed either way
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding request not found")
    return row


@router.post("/{request_id}/submit")
async def submit_request(
    request_id: uuid.UUID,
    principal: Principal = Depends(require_capability("onboarding.request")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await onboarding.submit_request(session, principal, request_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding request not found") from None
    except onboarding.OnboardingError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None


@router.patch("/{request_id}")
async def update_draft(
    request_id: uuid.UUID,
    body: OnboardingUpdateIn,
    principal: Principal = Depends(require_capability("onboarding.request")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await onboarding.update_draft(
            session, principal, request_id, body.proposed_name, body.payload, body.contact
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding request not found") from None
    except onboarding.OnboardingError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None


@router.post("/{request_id}/withdraw")
async def withdraw_request(
    request_id: uuid.UUID,
    principal: Principal = Depends(require_capability("onboarding.request")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await onboarding.withdraw_request(session, principal, request_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding request not found") from None
    except onboarding.OnboardingError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None


@router.post("/{request_id}/decide")
async def decide(
    request_id: uuid.UUID,
    body: DecisionIn,
    principal: Principal = Depends(require_capability("onboarding.approve")),
    session: AsyncSession = Depends(get_session),
):
    """Ops only. The capability gate here is the FIRST fence; the RLS insert
    policy on onboarding_approval and the rights the approval function runs
    under are the second and third."""
    try:
        return await onboarding.decide(session, principal, request_id, body.decision, body.reason)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding request not found") from None
    except onboarding.OnboardingError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None


@router.post("/{request_id}/resend-invitation", status_code=status.HTTP_204_NO_CONTENT)
async def resend_invitation(
    request_id: uuid.UUID,
    principal: Principal = Depends(require_capability("onboarding.approve")),
    session: AsyncSession = Depends(get_session),
):
    try:
        await onboarding.resend_invitation(session, principal, request_id)
    except onboarding.OnboardingError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
