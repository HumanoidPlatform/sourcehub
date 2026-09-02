"""marketplace — requests (the RFP) and proposals.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal

from sqlalchemy import CHAR, Date, DateTime, ForeignKey, Integer, Numeric, Text, text
from sqlalchemy.dialects.postgresql import UUID
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
    spec_format: Mapped[str | None] = mapped_column(Text)
    spec_quantity: Mapped[str | None] = mapped_column(Text)
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
    published_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


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
