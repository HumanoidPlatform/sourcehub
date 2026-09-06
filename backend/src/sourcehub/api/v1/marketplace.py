"""marketplace — requests and proposals."""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.modules.marketplace import service as marketplace

router = APIRouter(route_class=TxRoute)


class SamplePresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str | None = None
    size_bytes: int = Field(gt=0, le=25 * 1024 * 1024)


class SampleAttachIn(BaseModel):
    storage_key: str = Field(min_length=1, max_length=512)
    filename: str = Field(min_length=1, max_length=255)
    content_type: str | None = None
    size_bytes: int = Field(gt=0, le=25 * 1024 * 1024)


class RequestIn(BaseModel):
    title: str = Field(min_length=3)
    category: Literal["image", "video", "structured_data", "unstructured_data", "people_deliverable"]
    geography: str | None = None
    compliance_notes: str | None = None
    spec_format: str | None = None
    spec_quantity: str | None = None
    spec_quality: str | None = None
    acceptance: str | None = None
    people_headcount: int = 0
    people_training: str | None = None
    people_experience: str | None = None
    people_certification: str | None = None
    budget_min: Decimal | None = None
    budget_max: Decimal | None = None
    starts_on: dt.date | None = None
    delivery_due_on: dt.date | None = None
    residency_region: str | None = None
    publish: bool = False
    samples: list[SampleAttachIn] = Field(default_factory=list, max_length=5)


class ProposalIn(BaseModel):
    price: Decimal = Field(gt=0)
    duration_days: int = Field(gt=0)
    methodology: str = Field(min_length=10)
    notes: str | None = None


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.post("/requests", status_code=status.HTTP_201_CREATED)
async def create_request(
    body: RequestIn,
    principal: Principal = Depends(require_capability("rfp.create")),
    session: AsyncSession = Depends(get_session),
):
    if body.budget_min and body.budget_max and body.budget_max < body.budget_min:
        raise HTTPException(422, "budget_max must be at least budget_min")
    if body.starts_on and body.delivery_due_on and body.delivery_due_on < body.starts_on:
        raise HTTPException(422, "delivery_due_on must be on or after starts_on")
    try:
        return await marketplace.create_request(
            session, principal, body.model_dump(exclude={"publish", "samples"}), body.publish,
            samples=[s.model_dump() for s in body.samples],
        )
    except marketplace.MarketplaceError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.patch("/requests/{request_id}")
async def update_request(
    request_id: uuid.UUID,
    body: RequestIn,
    principal: Principal = Depends(require_capability("rfp.create")),
    session: AsyncSession = Depends(get_session),
):
    """Edit a draft. Same body and same guards as creating one — a draft that
    could be raised but not corrected was a dead end for the client."""
    if body.budget_min and body.budget_max and body.budget_max < body.budget_min:
        raise HTTPException(422, "budget_max must be at least budget_min")
    if body.starts_on and body.delivery_due_on and body.delivery_due_on < body.starts_on:
        raise HTTPException(422, "delivery_due_on must be on or after starts_on")
    try:
        return await marketplace.update_request(
            session, principal, request_id,
            body.model_dump(exclude={"publish", "samples"}),
            samples=[s.model_dump() for s in body.samples],
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found") from None
    except marketplace.MarketplaceError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.post("/requests/samples/presign")
async def presign_sample(
    body: SamplePresignIn,
    principal: Principal = Depends(require_capability("rfp.create")),
    session: AsyncSession = Depends(get_session),
):
    """A one-object, short-TTL upload URL — the browser PUTs bytes straight to
    object storage; they never traverse the API. The request row may not exist
    yet: the wizard uploads first and attaches the keys on the final POST."""
    try:
        return await marketplace.presign_sample_upload(
            session, principal, body.filename, body.content_type, body.size_bytes
        )
    except marketplace.MarketplaceError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.get("/requests/{request_id}/samples/{sample_id}/download")
async def download_sample(
    request_id: uuid.UUID,
    sample_id: uuid.UUID,
    # No capability gate, matching get_request: RLS arbitrates whether this
    # caller — client, bidding tenant, awarded partner — sees the sample row.
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """Returns {url, filename} rather than a redirect: a 307 would make the
    browser forward the Authorization header to MinIO, which rejects requests
    carrying both a header and a query signature."""
    try:
        return await marketplace.sample_download_url(session, principal, request_id, sample_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sample not found") from None


@router.get("/requests")
async def list_requests(
    open_only: bool = False,
    principal: Principal = Depends(require_capability("rfp.read")),
    session: AsyncSession = Depends(get_session),
):
    return await marketplace.list_requests(session, principal, open_only)


@router.get("/opportunities")
async def opportunities(
    principal: Principal = Depends(require_capability("rfp.read.published")),
    session: AsyncSession = Depends(get_session),
):
    """The tenant's marketplace: published requests it can still bid on."""
    return await marketplace.list_requests(session, principal, open_only=True)


@router.get("/requests/{request_id}")
async def get_request(
    request_id: uuid.UUID,
    # No capability gate: a client reads its own request, a tenant an
    # opportunity brief, the awarded partner its contract's source. RLS is the
    # arbiter of which of those this caller is.
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    row = await marketplace.get_request(session, principal, request_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    return row


@router.post("/requests/{request_id}/publish")
async def publish_request(
    request_id: uuid.UUID,
    principal: Principal = Depends(require_capability("rfp.publish")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await marketplace.publish_request(session, principal, request_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found") from None
    except marketplace.MarketplaceError as e:
        raise _conflict(e) from None


@router.post("/requests/{request_id}/proposals", status_code=status.HTTP_201_CREATED)
async def submit_proposal(
    request_id: uuid.UUID,
    body: ProposalIn,
    principal: Principal = Depends(require_capability("proposal.create")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await marketplace.submit_proposal(
            session, principal, request_id, body.price, body.duration_days,
            body.methodology, body.notes,
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found") from None
    except marketplace.MarketplaceError as e:
        raise _conflict(e) from None


@router.get("/proposals/mine")
async def my_proposals(
    principal: Principal = Depends(require_capability("proposal.create")),
    session: AsyncSession = Depends(get_session),
):
    return await marketplace.my_proposals(session, principal)


@router.post("/proposals/{proposal_id}/withdraw")
async def withdraw_proposal(
    proposal_id: uuid.UUID,
    principal: Principal = Depends(require_capability("proposal.create")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await marketplace.withdraw_proposal(session, principal, proposal_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found") from None
    except marketplace.MarketplaceError as e:
        raise _conflict(e) from None


@router.post("/proposals/{proposal_id}/award")
async def award(
    proposal_id: uuid.UUID,
    principal: Principal = Depends(require_capability("proposal.accept")),
    session: AsyncSession = Depends(get_session),
):
    """Awarding moves money into escrow — proposal.accept carries requires_mfa
    in the permission table, honoured whenever enforcement is on."""
    try:
        return await marketplace.award(session, principal, proposal_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found") from None
    except marketplace.MarketplaceError as e:
        raise _conflict(e) from None
