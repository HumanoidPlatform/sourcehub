from __future__ import annotations

import datetime as dt
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from cosaarthi_mobile.api.schemas import AuthSessionOut, AuthUserOut, SignupIn
from cosaarthi_mobile.api.security import (
    hash_password,
    hash_token,
    issue_access_token,
    new_refresh_token,
    verify_password,
)
from cosaarthi_mobile.config import settings
from cosaarthi_mobile.db.models import (
    CrowdWorker,
    Organization,
    Role,
    User,
    UserRole,
    UserSession,
)
from cosaarthi_mobile.modules.audit.service import record_event
from cosaarthi_mobile.modules.notifications.service import create_notification
from cosaarthi_mobile.modules.roles.service import (
    available_personas,
    normalize_persona,
    permission_codes,
    primary_persona,
    user_has_persona,
)
from cosaarthi_mobile.modules.users.service import get_user_by_email

ENTITY_TYPES = {
    "aggregator",
    "builder",
    "client",
    "crowd_pool",
    "ide",
    "partner",
    "platform",
    "qa",
    "sponsor",
    "tenant",
}


def _entity_type_for_persona(persona: str, organization: Organization) -> str:
    if persona == "crowd":
        return "crowd_pool"
    if persona in ENTITY_TYPES:
        return persona
    if organization.kind in ENTITY_TYPES:
        return organization.kind
    return "tenant"


def user_to_out(user: User, selected_persona: str | None = None) -> AuthUserOut:
    permissions = sorted(permission_codes(user))
    personas = available_personas(user)
    persona = normalize_persona(selected_persona) if selected_persona else primary_persona(user)
    if persona not in personas:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Persona is not assigned to this user")
    organization = user.organization
    full_name = f"{user.first_name} {user.last_name}".strip()
    return AuthUserOut(
        available_personas=personas,
        certification_ids=[],
        email=user.email,
        entity={
            "id": str(user.id),
            "name": full_name if persona == "crowd" else organization.name,
            "type": _entity_type_for_persona(persona, organization),
        },
        id=user.id,
        locale=user.locale,
        name=full_name,
        permissions=permissions,
        persona=persona,
        phone=user.phone,
        tenant={"id": str(organization.id), "name": organization.name},
    )


async def _issue_session(
    session: AsyncSession,
    user: User,
    selected_persona: str | None = None,
) -> AuthSessionOut:
    persona = normalize_persona(selected_persona) if selected_persona else primary_persona(user)
    if persona not in available_personas(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Persona is not assigned to this user")
    permissions = permission_codes(user)
    access_token, access_expires_at = issue_access_token(user.id, permissions, persona)
    refresh_raw, refresh_hash = new_refresh_token()
    session.add(
        UserSession(
            expires_at=dt.datetime.now(dt.UTC)
            + dt.timedelta(days=settings.refresh_token_ttl_days),
            refresh_token_hash=refresh_hash,
            user_id=user.id,
        )
    )
    await session.flush()
    return AuthSessionOut(
        access_token=access_token,
        expires_at=access_expires_at,
        refresh_token=refresh_raw,
        user=user_to_out(user, persona),
    )


async def login(session: AsyncSession, email: str, password: str) -> AuthSessionOut:
    user = await get_user_by_email(session, email)
    if user is None or user.status != "active" or not verify_password(password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    await record_event(session, "auth.login", f"{user.email} signed in", actor_user_id=user.id)
    return await _issue_session(session, user)


async def switch_persona(session: AsyncSession, user: User, persona: str) -> AuthSessionOut:
    selected_persona = normalize_persona(persona)
    if not user_has_persona(user, selected_persona):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Persona is not assigned to this user")
    await record_event(
        session,
        "auth.persona_switch",
        f"{user.email} switched to {selected_persona}",
        actor_user_id=user.id,
        payload={"persona": selected_persona},
    )
    return await _issue_session(session, user, selected_persona)


async def signup(session: AsyncSession, body: SignupIn) -> AuthSessionOut:
    if not body.terms_accepted:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Terms must be accepted")
    existing = await get_user_by_email(session, str(body.email))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    role = await session.scalar(select(Role).where(Role.code == "crowd_worker", Role.public_signup))
    org = await session.scalar(select(Organization).where(Organization.kind == "crowd_pool"))
    if role is None or org is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Mobile signup is not seeded")

    user = User(
        email=str(body.email).lower(),
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        phone=body.phone.strip(),
        password_hash=hash_password(body.password),
        organization_id=org.id,
        status="active",
    )
    session.add(user)
    await session.flush()
    session.add(UserRole(user_id=user.id, role_id=role.id))
    session.add(
        CrowdWorker(
            display_name=f"{user.first_name} {user.last_name}".strip(),
            user_id=user.id,
            worker_code=f"CW-{str(user.id)[:8]}",
        )
    )
    await create_notification(
        session,
        user.id,
        "Welcome to Cosaarthi",
        "Your Crowd Worker account is ready.",
        tone="success",
        deep_link="/work",
    )
    await record_event(
        session,
        "auth.signup",
        f"{user.email} self-registered",
        actor_user_id=user.id,
    )
    await session.flush()
    user = await session.scalar(
        select(User)
        .options(
            selectinload(User.organization),
            selectinload(User.roles).selectinload(Role.permissions),
        )
        .where(User.id == user.id)
    )
    if user is None:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Signup did not create a user")
    return await _issue_session(session, user)


async def refresh(session: AsyncSession, refresh_token: str) -> AuthSessionOut:
    token_hash = hash_token(refresh_token)
    row = await session.scalar(
        select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    )
    now = dt.datetime.now(dt.UTC)
    if row is None or row.revoked_at is not None or row.expires_at <= now:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")
    user = await session.scalar(
        select(User)
        .options(
            selectinload(User.organization),
            selectinload(User.roles).selectinload(Role.permissions),
        )
        .where(User.id == row.user_id)
    )
    if user is None or user.status != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")
    row.revoked_at = now
    await session.flush()
    return await _issue_session(session, user)


async def logout(
    session: AsyncSession,
    user_id: uuid.UUID,
    refresh_token: str | None = None,
) -> None:
    if refresh_token:
        token_hash = hash_token(refresh_token)
        row = await session.scalar(
            select(UserSession).where(
                UserSession.refresh_token_hash == token_hash,
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
            )
        )
        if row:
            row.revoked_at = dt.datetime.now(dt.UTC)
        return

    rows = (
        await session.scalars(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
            )
        )
    ).all()
    for row in rows:
        row.revoked_at = dt.datetime.now(dt.UTC)
