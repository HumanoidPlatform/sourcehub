"""delivery — contracts, tasks, submissions and assets.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

The asset table is deliberately NOT mapped here. It is partitioned with a
composite primary key (id, created_at), and every query against it is a
hand-written statement in the media module — the same way audit treats the
partitioned audit_event. Mapping it would make the ORM emit RETURNING on
every insert, which under RLS is a trap (see notify.service.notify).
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
from sourcehub.db.types import (
    AssignmentStatus, ContractStatus, SubmissionStatus, TaskOfferResponse, TaskOfferStatus,
    TaskStatus,
)

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
    storage_target_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("storage_target.id"))
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
    # countable: "100 images" as a number, so assignments can split it
    target_quantity: Mapped[int | None] = mapped_column(Integer)
    target_unit: Mapped[str | None] = mapped_column(Text)
    instructions: Mapped[str | None] = mapped_column(Text)
    capture_spec: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    status: Mapped[str] = mapped_column(TaskStatus, server_default=text("'assigned'"))
    due_on: Mapped[dt.date | None] = mapped_column(Date)
    started_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class TaskAssignment(Base):
    """The aggregator → person hop: one worker's share of a task.

    contract_id and supplier_org_id are copied from the task at insert so the
    row's policies are column compares and never subquery task (which would
    recurse with task's own worker-scope policy).
    """

    __tablename__ = "task_assignment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("task.id"))
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contract.id"))
    supplier_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    worker_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(AssignmentStatus, server_default=text("'assigned'"))
    instructions: Mapped[str | None] = mapped_column(Text)
    due_on: Mapped[dt.date | None] = mapped_column(Date)
    worker_note: Mapped[str | None] = mapped_column(Text)
    assigned_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    assigned_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    started_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    decided_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    decided_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    decision_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)


class TaskOffer(Base):
    """A task put to the crowd at once: N places, Q units each, first come
    first served. Every accept becomes a TaskAssignment; the counter is
    guarded by a CHECK against worker_limit (db/130_task_offers.sql)."""

    __tablename__ = "task_offer"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("task.id"))
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contract.id"))
    supplier_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    worker_limit: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer)
    instructions: Mapped[str | None] = mapped_column(Text)
    due_on: Mapped[dt.date | None] = mapped_column(Date)
    respond_by: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(TaskOfferStatus, server_default=text("'open'"))
    accepted_count: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    closed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    closed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class TaskOfferRecipient(Base):
    """One worker's copy of an offer. token_hash is the sha256 of the link in
    their email — the row is the credential, the raw token is never stored."""

    __tablename__ = "task_offer_recipient"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    offer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("task_offer.id"))
    supplier_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    worker_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    email: Mapped[str] = mapped_column(Text)
    token_hash: Mapped[str] = mapped_column(Text)
    sent_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    send_error: Mapped[str | None] = mapped_column(Text)
    response: Mapped[str | None] = mapped_column(TaskOfferResponse)
    responded_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    assignment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("task_assignment.id"))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)


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
