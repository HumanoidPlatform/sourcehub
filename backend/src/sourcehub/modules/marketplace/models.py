"""marketplace — requests (the RFP) and proposals.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import CHAR, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import ProposalStatus, RequestCategory, RequestStatus

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class Request(Base):
    __tablename__ = "request"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    client_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    title: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(RequestCategory)
    status: Mapped[str] = mapped_column(RequestStatus, server_default=text("'draft'"))
    geography: Mapped[str | None] = mapped_column(Text)
    compliance_notes: Mapped[str | None] = mapped_column(Text)
    spec_quality: Mapped[str | None] = mapped_column(Text)
    acceptance: Mapped[str | None] = mapped_column(Text)
    people_headcount: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    people_training: Mapped[str | None] = mapped_column(Text)
    people_experience: Mapped[str | None] = mapped_column(Text)
    people_certification: Mapped[str | None] = mapped_column(Text)
    budget_min: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    budget_max: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(CHAR(3), server_default=text("'USD'"))
    starts_on: Mapped[dt.date | None] = mapped_column(Date)
    delivery_due_on: Mapped[dt.date | None] = mapped_column(Date)
    residency_region: Mapped[str | None] = mapped_column(Text)
    storage_target_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("storage_target.id")
    )
    published_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))

    # --- client requirements -------------------------------------------------
    # What the client is asking for, precisely enough to bid against. The
    # vocabularies are CHECK constraints in db/040_marketplace.sql; the API
    # mirrors them as Literals so a bad value is a 422 rather than a 500 out of
    # Postgres. Declared last to match the column order on disk — see the note
    # in the DDL.
    objective: Mapped[str | None] = mapped_column(Text)
    use_case: Mapped[str | None] = mapped_column(Text)
    target_quantity: Mapped[int | None] = mapped_column(Integer)
    target_unit: Mapped[str | None] = mapped_column(Text)
    capture_spec: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'"))
    countries: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    sampling_frame: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'"))
    quality_thresholds: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'"))
    rejection_policy: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'"))

    people_in_frame: Mapped[str | None] = mapped_column(Text)
    minors_policy: Mapped[str | None] = mapped_column(Text)
    deidentification: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    regulations: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    lawful_basis: Mapped[str | None] = mapped_column(Text)
    permitted_uses: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    partner_reuse_allowed: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    biometric_processing: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    location_type: Mapped[str | None] = mapped_column(Text)

    pricing_model_requested: Mapped[str] = mapped_column(Text, server_default=text("'fixed'"))
    budget_disclosed: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    pilot_required: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    pilot_quantity: Mapped[int | None] = mapped_column(Integer)
    pilot_due_on: Mapped[dt.date | None] = mapped_column(Date)
    milestones: Mapped[list[Any]] = mapped_column(JSONB, server_default=text("'[]'"))
    proposals_close_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    contact_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    proposal_requirements: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))


class Proposal(Base):
    __tablename__ = "proposal"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("request.id"))
    partner_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(CHAR(3), server_default=text("'USD'"))
    duration_days: Mapped[int] = mapped_column(Integer)
    methodology: Mapped[str] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(ProposalStatus, server_default=text("'submitted'"))
    submitted_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    decided_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    # Per-unit bidding, when the request asked for pricing_model 'per_unit'.
    # price stays authoritative: nothing computes one from the other.
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric)
    unit: Mapped[str | None] = mapped_column(Text)
