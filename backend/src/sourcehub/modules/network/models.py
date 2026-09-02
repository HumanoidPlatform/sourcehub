"""network — aggregators, businesses, sponsors, equipment, loans and rosters.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

The organisations themselves live in identity; this module owns what a network
runs on — equipment, its chain of custody, the crowd roster, and ratings.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import EquipmentStatus, LoanStatus, WorkerStatus

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    sponsor_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    equipment_type: Mapped[str] = mapped_column(Text)
    total_units: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    status: Mapped[str] = mapped_column(EquipmentStatus, server_default=text("'available'"))
    calibrated_on: Mapped[dt.date | None] = mapped_column(Date)
    calibration_expires_on: Mapped[dt.date | None] = mapped_column(Date)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Loan(Base):
    __tablename__ = "loan"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipment.id"))
    sponsor_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    requester_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("task.id"))
    units: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(LoanStatus, server_default=text("'pending'"))
    needed_by: Mapped[dt.date | None] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text)
    decided_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    decided_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    decision_reason: Mapped[str | None] = mapped_column(Text)
    issued_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    returned_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class CrowdWorker(Base):
    __tablename__ = "crowd_worker"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    aggregator_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    display_name: Mapped[str] = mapped_column(Text)
    skill: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(WorkerStatus, server_default=text("'on_shift'"))
    trained: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    rating: Mapped[Decimal | None] = mapped_column(Numeric(2, 1))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Rating(Base):
    __tablename__ = "rating"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contract.id"))
    from_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    to_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    score: Mapped[int] = mapped_column(SmallInteger)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
