"""onboarding — onboarding requests, the approval chain and invitations.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import DateTime, ForeignKey, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import CITEXT, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import ApprovalDecision, GrantScope, OnboardingStatus, OrgKind

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class OnboardingRequest(Base):
    __tablename__ = "onboarding_request"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    target_org_kind: Mapped[str] = mapped_column(OrgKind)
    proposed_name: Mapped[str] = mapped_column(Text)
    requester_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    requester_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    parent_org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organisation.id"))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    contact: Mapped[dict[str, Any]] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(OnboardingStatus, server_default=text("'draft'"))
    submitted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    decided_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organisation.id"))
    created_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class OnboardingApproval(Base):
    __tablename__ = "onboarding_approval"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("onboarding_request.id"))
    step: Mapped[int] = mapped_column(SmallInteger, server_default=text("1"))
    approver_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    approver_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    approver_role: Mapped[str] = mapped_column(Text)
    decision: Mapped[str] = mapped_column(ApprovalDecision)
    reason: Mapped[str | None] = mapped_column(Text)
    decided_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)


class Invitation(Base):
    __tablename__ = "invitation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    token_hash: Mapped[str] = mapped_column(Text, unique=True)
    email: Mapped[str] = mapped_column(CITEXT)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("role.id"))
    scope: Mapped[str] = mapped_column(GrantScope, server_default=text("'owner'"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    request_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("onboarding_request.id"))
    invited_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    invited_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    reminder_count: Mapped[int] = mapped_column(SmallInteger, server_default=text("0"))
    last_reminder_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
