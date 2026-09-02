"""delivery — contracts, tasks, submissions and assets.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

The asset table is partitioned and served by the ingest module at milestone 3;
until then submissions carry an asset_count, exactly as the prototype does.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import CHAR, Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import ContractStatus, SubmissionStatus, TaskStatus

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class Contract(Base):
    __tablename__ = "contract"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("request.id"), unique=True)
    proposal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proposal.id"), unique=True)
    client_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    partner_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    value: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(CHAR(3), server_default=text("'USD'"))
    status: Mapped[str] = mapped_column(ContractStatus, server_default=text("'active'"))
    rubric_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    milestone_pct: Mapped[int] = mapped_column(SmallInteger, server_default=text("50"))
    platform_fee_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default=text("9.00"))
    started_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    disputed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    acceptance_due_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Task(Base):
    __tablename__ = "task"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contract.id"))
    assignee_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    title: Mapped[str] = mapped_column(Text)
    target: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(TaskStatus, server_default=text("'assigned'"))
    due_on: Mapped[dt.date | None] = mapped_column(Date)
    started_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Submission(Base):
    __tablename__ = "submission"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("task.id"))
    attempt_no: Mapped[int] = mapped_column(SmallInteger, server_default=text("1"))
    supplier_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    status: Mapped[str] = mapped_column(SubmissionStatus, server_default=text("'open'"))
    supplier_note: Mapped[str | None] = mapped_column(Text)
    asset_count: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    opened_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    submitted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
