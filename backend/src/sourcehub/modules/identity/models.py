"""identity — organisations, users, role grants and sessions.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

These map the tables db/010_identity.sql and db/020_rbac.sql create; the
database is the source of truth and every server default lives there.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import CITEXT, INET, UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import (
    BillingStatus,
    GrantScope,
    OrgKind,
    OrgStatus,
    UserStatus,
    UserTokenPurpose,
)

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class Organisation(Base):
    __tablename__ = "organisation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    kind: Mapped[str] = mapped_column(OrgKind)
    name: Mapped[str] = mapped_column(Text)
    legal_name: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(OrgStatus, server_default=text("'pending_approval'"))
    parent_org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organisation.id"))
    country: Mapped[str | None] = mapped_column(Text)
    residency_region: Mapped[str | None] = mapped_column(Text)
    billing_status: Mapped[str | None] = mapped_column(BillingStatus)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(2, 1))
    onboarded_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    suspended_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    suspension_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class ClientProfile(Base):
    __tablename__ = "client_profile"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"), primary_key=True)
    industry: Mapped[str | None] = mapped_column(Text)
    plan: Mapped[str | None] = mapped_column(Text)
    dpa_signed: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    dpa_signed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    since: Mapped[dt.date | None] = mapped_column(Date)


class TenantProfile(Base):
    __tablename__ = "tenant_profile"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"), primary_key=True)
    hq: Mapped[str | None] = mapped_column(Text)
    plan: Mapped[str | None] = mapped_column(Text)
    capabilities: Mapped[str | None] = mapped_column(Text)
    on_time_rate: Mapped[int | None] = mapped_column(SmallInteger)
    qa_pass_rate: Mapped[int | None] = mapped_column(SmallInteger)
    fair_work_attested: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    since: Mapped[dt.date | None] = mapped_column(Date)


class AggregatorProfile(Base):
    __tablename__ = "aggregator_profile"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"), primary_key=True)
    crowd_size: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    region: Mapped[str | None] = mapped_column(Text)
    focus: Mapped[str | None] = mapped_column(Text)


class BusinessProfile(Base):
    __tablename__ = "business_profile"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"), primary_key=True)
    specialty: Mapped[str | None] = mapped_column(Text)
    capacity: Mapped[str | None] = mapped_column(Text)


class SponsorProfile(Base):
    __tablename__ = "sponsor_profile"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"), primary_key=True)
    contact_email: Mapped[str | None] = mapped_column(CITEXT)
    contact_phone: Mapped[str | None] = mapped_column(Text)


class AppUser(Base):
    __tablename__ = "app_user"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    email: Mapped[str] = mapped_column(CITEXT)
    full_name: Mapped[str] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(UserStatus, server_default=text("'invited'"))
    password_hash: Mapped[str | None] = mapped_column(Text)
    password_algo: Mapped[str] = mapped_column(Text, server_default=text("'argon2id'"))
    password_updated_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    must_change_password: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    email_verified_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    failed_login_count: Mapped[int] = mapped_column(SmallInteger, server_default=text("0"))
    locked_until: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    external_idp: Mapped[str | None] = mapped_column(Text)
    external_idp_subject: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class UserSession(Base):
    __tablename__ = "user_session"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    token_hash: Mapped[str] = mapped_column(Text, unique=True)
    device_label: Mapped[str | None] = mapped_column(Text)
    user_agent: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(INET)
    issued_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    last_seen_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    revoke_reason: Mapped[str | None] = mapped_column(Text)


class UserToken(Base):
    __tablename__ = "user_token"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    purpose: Mapped[str] = mapped_column(UserTokenPurpose)
    token_hash: Mapped[str] = mapped_column(Text, unique=True)
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    consumed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    requested_ip: Mapped[str | None] = mapped_column(INET)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)


class UserPasswordHistory(Base):
    __tablename__ = "user_password_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    password_hash: Mapped[str] = mapped_column(Text)
    password_algo: Mapped[str] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)


class Role(Base):
    __tablename__ = "role"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    applies_to_kind: Mapped[str | None] = mapped_column(OrgKind)
    is_system: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organisation.id"))


class Permission(Base):
    __tablename__ = "permission"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    code: Mapped[str] = mapped_column(Text, unique=True)
    module: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    requires_mfa: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))


class RolePermission(Base):
    __tablename__ = "role_permission"

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("role.id"), primary_key=True)
    permission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("permission.id"), primary_key=True)


class UserRoleGrant(Base):
    __tablename__ = "user_role_grant"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("app_user.id"))
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("role.id"))
    scope: Mapped[str] = mapped_column(GrantScope, server_default=text("'member'"))
    granted_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    granted_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    revoked_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    revoked_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
