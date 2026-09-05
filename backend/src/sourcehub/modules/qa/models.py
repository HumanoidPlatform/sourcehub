"""qa — rubrics, sampling plans, gold sets and the three review gates.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

qa_review is append-only at every level: rewrite rules in the database, no
UPDATE policy, and no update path in this module's service.
"""

from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import QaGate, QaOutcome

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class QaReview(Base):
    __tablename__ = "qa_review"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    # exactly one of the two: gates 2 and 3 review a submission, gate 1 a
    # worker's assignment (CHECK qa_review_one_subject)
    submission_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("submission.id"))
    assignment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("task_assignment.id"))
    gate: Mapped[str] = mapped_column(QaGate)
    outcome: Mapped[str] = mapped_column(QaOutcome)
    reviewer_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    reviewer_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    sample_size: Mapped[int | None] = mapped_column(Integer)
    sample_failed: Mapped[int | None] = mapped_column(Integer)
    sampling_plan_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    note: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)


class DefectCode(Base):
    __tablename__ = "defect_code"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    code: Mapped[str] = mapped_column(Text, unique=True)
    label: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(Text)
    automated: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
