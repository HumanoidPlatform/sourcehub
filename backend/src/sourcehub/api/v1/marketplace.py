"""marketplace — requests and proposals."""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.api.v1.attachments import AttachmentIn
from sourcehub.modules.marketplace import service as marketplace

router = APIRouter(route_class=TxRoute)


# The vocabularies below are the CHECK constraints in db/040_marketplace.sql,
# transcribed. Keeping them as Literals is what turns a bad value into a 422
# naming the field rather than an IntegrityError 500 out of Postgres — and the
# console builds its selects from the same lists, so it cannot offer a value
# the database will refuse.
UseCase = Literal["ai_training", "market_research", "audit_compliance",
                  "monitoring_evaluation", "other"]
TargetUnit = Literal["photos", "videos", "audio_clips", "audio_hours",
                     "responses", "records", "sites", "hours"]
LocationType = Literal["public_outdoor", "retail_interior", "private_premises", "residential"]
PeopleInFrame = Literal["none", "incidental", "consented"]
MinorsPolicy = Literal["prohibited", "with_parental_consent"]
LawfulBasis = Literal["consent", "contract", "legitimate_interest", "public_task",
                      "legal_obligation", "not_personal_data"]
Deidentification = Literal["blur_faces", "redact_plates", "strip_gps"]
PermittedUse = Literal["model_training", "internal_analysis", "research", "audit", "publication"]
ProposalRequirement = Literal["method_statement", "team_cv", "sample_work",
                              "insurance", "dpa_acceptance", "references"]
PricingModel = Literal["fixed", "per_unit", "milestone", "open"]


class CaptureSpec(BaseModel):
    """Shape read off the deployed rows, not the DDL — the column is bare
    jsonb. Keys differ per medium, so extras are allowed rather than refused;
    what is named here is what the console renders."""

    model_config = {"extra": "allow"}

    media: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    notes: str | None = None
    orientation: str | None = None
    require_gps: bool | None = None
    min_megapixels: float | None = None
    # Degrees off square tolerated, checked on the device against the
    # accelerometer. Bounded because beyond 45 the phone is nearer the
    # next quarter turn, and the check folds to that.
    max_tilt_deg: float | None = Field(default=None, ge=0, le=45)


class Quota(BaseModel):
    label: str
    quantity: int = Field(gt=0)


class SamplingFrame(BaseModel):
    model_config = {"extra": "allow"}

    subject_type: str | None = None
    site_count: int | None = Field(default=None, gt=0)
    quotas: list[Quota] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)


class QualityThresholds(BaseModel):
    model_config = {"extra": "allow"}

    min_pass_rate_pct: float | None = Field(default=None, ge=0, le=100)
    qa_sample_pct_gate1: float | None = Field(default=None, ge=0, le=100)
    qa_sample_pct_gate2: float | None = Field(default=None, ge=0, le=100)


class RejectionPolicy(BaseModel):
    model_config = {"extra": "allow"}

    max_retakes: int | None = Field(default=None, ge=0)
    retake_window_days: int | None = Field(default=None, ge=0)
    rework_cost_bearer: Literal["partner", "client", "shared"] | None = None
    partial_acceptance_allowed: bool | None = None


class Milestone(BaseModel):
    """INFERRED, not recovered. milestones is jsonb with no CHECK and no row
    anywhere populates it, so this shape is a reading of the column's name and
    its pairing with pricing_model 'milestone' — not something the database
    told us. Revisit it the moment a real one exists."""

    label: str
    amount: Decimal | None = Field(default=None, ge=0)
    due_on: dt.date | None = None


class RequestIn(BaseModel):
    title: str = Field(min_length=3)
    category: Literal["image", "video", "structured_data", "unstructured_data", "people_deliverable"]
    geography: str | None = None
    compliance_notes: str | None = None
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

    # --- what is wanted ---
    objective: str | None = None
    use_case: UseCase | None = None
    target_quantity: int | None = Field(default=None, gt=0)
    target_unit: TargetUnit | None = None
    capture_spec: CaptureSpec | None = None
    countries: list[str] = Field(default_factory=list, max_length=60)
    sampling_frame: SamplingFrame | None = None
    location_type: LocationType | None = None

    # --- the quality bar ---
    quality_thresholds: QualityThresholds | None = None
    rejection_policy: RejectionPolicy | None = None

    # --- privacy and lawfulness ---
    people_in_frame: PeopleInFrame | None = None
    minors_policy: MinorsPolicy | None = None
    deidentification: list[Deidentification] = Field(default_factory=list)
    regulations: list[str] = Field(default_factory=list, max_length=20)
    lawful_basis: LawfulBasis | None = None
    permitted_uses: list[PermittedUse] = Field(default_factory=list)
    partner_reuse_allowed: bool = False
    biometric_processing: bool = False

    # --- commercials and process ---
    pricing_model_requested: PricingModel = "fixed"
    budget_disclosed: bool = True
    milestones: list[Milestone] = Field(default_factory=list, max_length=20)
    pilot_required: bool = False
    pilot_quantity: int | None = Field(default=None, gt=0)
    pilot_due_on: dt.date | None = None
    proposals_close_at: dt.datetime | None = None
    proposal_requirements: list[ProposalRequirement] = Field(default_factory=list)
    contact_user_id: uuid.UUID | None = None

    # Where captured data is delivered. Required before publishing; a draft
    # may be saved without one so the builder can be filled in any order.
    storage_target_id: uuid.UUID | None = None
    publish: bool = False
    # Files hung off a FIELD. capture_examples and guidelines are the brief's
    # reference material — what request_sample used to hold.
    attachments: list[AttachmentIn] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def _cross_field(self) -> RequestIn:
        """The rules that span two fields, checked here rather than only in the
        database.

        Each of these is also a CHECK constraint, and a constraint violation
        arrives as an IntegrityError that nothing maps — so without this the
        client gets a 500 for a form mistake. Named the same as the constraint
        that backs it, so the two stay findable from each other.
        """
        # request_budget_order
        if self.budget_min is not None and self.budget_max is not None \
                and self.budget_max < self.budget_min:
            raise ValueError("budget_max must be at least budget_min")
        # request_timeline_order
        if self.starts_on and self.delivery_due_on and self.delivery_due_on < self.starts_on:
            raise ValueError("delivery_due_on must be on or after starts_on")
        # request_pilot_shape
        if self.pilot_required and self.pilot_quantity is None:
            raise ValueError("pilot_quantity is required when pilot_required is set")
        # request_close_before_delivery
        if self.proposals_close_at and self.delivery_due_on \
                and self.proposals_close_at.date() > self.delivery_due_on:
            raise ValueError("proposals_close_at must be on or before delivery_due_on")
        return self


class ProposalIn(BaseModel):
    price: Decimal = Field(gt=0)
    # Per-unit bidding, for a request that asked for it. price stays the
    # authoritative total; nothing derives one from the other.
    unit: str | None = None
    unit_price: Decimal | None = Field(default=None, ge=0)
    duration_days: int = Field(gt=0)
    methodology: str = Field(min_length=10)
    notes: str | None = None
    # a method statement, a capability deck, CVs, insurance — a tender reply is
    # rarely one file, so this is ten where a request's single slot is five
    attachments: list[AttachmentIn] = Field(default_factory=list, max_length=10)


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.post("/requests", status_code=status.HTTP_201_CREATED)
async def create_request(
    body: RequestIn,
    principal: Principal = Depends(require_capability("rfp.create")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await marketplace.create_request(
            session, principal,
            body.model_dump(exclude={"publish", "attachments"}), body.publish,
            attachments=[a.model_dump() for a in body.attachments],
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
    try:
        return await marketplace.update_request(
            session, principal, request_id,
            body.model_dump(exclude={"publish", "attachments"}),
            attachments=[a.model_dump() for a in body.attachments],
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found") from None
    except marketplace.MarketplaceError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


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
            unit=body.unit, unit_price=body.unit_price,
            attachments=[a.model_dump() for a in body.attachments],
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
