"""network — aggregators, businesses, sponsors, equipment, loans and rosters.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

The organisations themselves live in identity; this module owns what a network
runs on — equipment, its chain of custody, the crowd roster, and ratings.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import (
    ARRAY,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import CITEXT, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import EquipmentStatus, LoanStatus, RatingKind, WorkerStatus

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
    # db/520: which device it is, where it is kept, labelled details.
    make: Mapped[str | None] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(Text)
    specifications: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb")
    )
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
    status: Mapped[str] = mapped_column(WorkerStatus, server_default=text("'on_shift'"))
    trained: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    # a roster row that is also a person who signs in (db/120_workers_media.sql)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    email: Mapped[str | None] = mapped_column(CITEXT)
    phone: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    # Last, matching the column order db/190_worker_skills.sql produces: it is
    # ADDed after the table exists, so it lands at the end on both the
    # bootstrap and the migration path. make verify-schema diffs that order.
    # list[str], not list[Skill]: the Literal lives in the API layer, and the
    # CHECK constraint is what the database enforces.
    skills: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))


class Rating(Base):
    """One rating, of one of four kinds (db/380_ratings.sql). The parties are
    derived by a BEFORE INSERT trigger from the subject, so the service writes
    the row with raw SQL naming only the kind, the subject, a score and a
    comment; this mapping is for reading."""

    __tablename__ = "rating"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contract.id"))
    from_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    # NULL for a crowd resource, who is a user (to_user_id), not an organisation
    to_org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organisation.id"))
    score: Mapped[int] = mapped_column(SmallInteger)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    # Last, matching the column order db/380 produces (ADDed after the table).
    kind: Mapped[str] = mapped_column(RatingKind)
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("task.id"))
    assignment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("task_assignment.id"))
    to_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
