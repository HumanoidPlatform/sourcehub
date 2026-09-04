"""identity — organisations, users, role grants and sessions.

Business rules, and the ONLY public surface of this module.

Authentication is the one path in the system that runs without an org context,
which is why every anonymous step goes through a SECURITY DEFINER function
(db/100_rls.sql, db/110_auth_functions.sql) instead of reading tables the RLS
policies would — correctly — show nothing of.
"""

from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims, hash_token, new_opaque_token
from sourcehub.config import BRAND, settings
from sourcehub.db.session import anonymous_session, org_session
from sourcehub.modules.identity.models import (
    AggregatorProfile,
    AppUser,
    BusinessProfile,
    ClientProfile,
    Organisation,
    SponsorProfile,
    TenantProfile,
    UserSession,
)


class AuthError(Exception):
    """Every credential failure raises this with the same outward message —
    the specific reason goes to login_attempt, not to the caller."""

    def __init__(self, public_message: str = "Invalid email or password") -> None:
        super().__init__(public_message)
        self.public_message = public_message


@dataclass(frozen=True, slots=True)
class OrgChoice:
    org_id: uuid.UUID
    org_kind: str
    org_name: str
    reference_code: str
    role_code: str
    scope: str


@dataclass(frozen=True, slots=True)
class LoginSuccess:
    claims: AccessClaims
    refresh_token_raw: str


# ---------------------------------------------------------------------------
# Credential check and session issue
# ---------------------------------------------------------------------------

async def _lookup_credentials(session: AsyncSession, email: str) -> dict[str, Any] | None:
    row = (
        await session.execute(text("SELECT * FROM authenticate_lookup(:email)"), {"email": email})
    ).mappings().first()
    return dict(row) if row else None


async def _record_attempt(
    session: AsyncSession,
    email: str,
    user_id: uuid.UUID | None,
    succeeded: bool,
    failure_code: str | None,
    ip: str | None,
    user_agent: str | None,
) -> None:
    await session.execute(
        text(
            "SELECT record_login_attempt(:email, :uid, :ok, :code, :ip, :ua, :thr, "
            "make_interval(mins => :mins))"
        ),
        {
            "email": email,
            "uid": user_id,
            "ok": succeeded,
            "code": failure_code,
            "ip": ip,
            "ua": user_agent,
            "thr": settings.login_lock_threshold,
            "mins": settings.login_lock_minutes,
        },
    )


async def list_user_orgs(session: AsyncSession, user_id: uuid.UUID) -> list[OrgChoice]:
    rows = (
        await session.execute(
            text("SELECT * FROM user_organisations(:uid)"), {"uid": user_id}
        )
    ).mappings().all()
    return [
        OrgChoice(
            org_id=r["org_id"],
            org_kind=r["org_kind"],
            org_name=r["org_name"],
            reference_code=r["reference_code"],
            role_code=r["role_code"],
            scope=r["scope"],
        )
        for r in rows
    ]


async def resolve_claims(
    session: AsyncSession,
    user_id: uuid.UUID,
    choice: OrgChoice,
    must_change_password: bool,
) -> AccessClaims:
    caps = (
        await session.execute(
            text("SELECT code FROM user_capabilities(:uid, :org)"),
            {"uid": user_id, "org": choice.org_id},
        )
    ).scalars().all()
    # MFA is satisfied when nothing in the set demands it, or enforcement is off
    # (TOTP enrolment is not built yet — the flag keeps the design honest).
    needs_mfa = (
        await session.execute(
            text("SELECT user_requires_mfa(:uid, :org)"), {"uid": user_id, "org": choice.org_id}
        )
    ).scalar_one()
    mfa_satisfied = (not needs_mfa) or (not settings.mfa_enforcement)
    who = (
        await session.execute(
            select(AppUser.full_name, AppUser.email).where(AppUser.id == user_id)
        )
    ).one()
    return AccessClaims(
        user_id=user_id,
        full_name=who.full_name,
        email=who.email,
        org_id=choice.org_id,
        org_kind=choice.org_kind,
        org_name=choice.org_name,
        role=choice.role_code,
        scope=choice.scope,
        capabilities=frozenset(caps),
        mfa_satisfied=mfa_satisfied,
        must_change_password=must_change_password,
    )


async def _open_session_record(
    claims: AccessClaims, ip: str | None, user_agent: str | None
) -> str:
    """Insert the refresh-token session under the user's own org context."""
    raw, digest = new_opaque_token()
    async with org_session(claims.org_id, claims.role, claims.user_id) as s:
        s.add(
            UserSession(
                user_id=claims.user_id,
                org_id=claims.org_id,
                token_hash=digest,
                user_agent=user_agent,
                ip_address=ip,
                expires_at=dt.datetime.now(dt.timezone.utc)
                + dt.timedelta(days=settings.refresh_token_ttl_days),
            )
        )
    return raw


async def login(
    email: str,
    password: str,
    org_id: uuid.UUID | None,
    ip: str | None,
    user_agent: str | None,
) -> LoginSuccess | list[OrgChoice]:
    """Returns tokens, or the org list when the user must choose one first.

    The generic AuthError message is deliberate: which part failed is recorded
    in login_attempt for forensics, never surfaced to the caller.
    """
    from sourcehub.platform.identity import database as pwd

    async with anonymous_session() as s:
        creds = await _lookup_credentials(s, email)

        if creds is None:
            await _record_attempt(s, email, None, False, "no_such_user", ip, user_agent)
            raise AuthError()

        uid: uuid.UUID = creds["user_id"]

        if creds["locked_until"] and creds["locked_until"] > dt.datetime.now(dt.timezone.utc):
            await _record_attempt(s, email, uid, False, "locked", ip, user_agent)
            raise AuthError("Account temporarily locked. Try again later.")

        if creds["status"] not in ("active", "locked"):
            await _record_attempt(s, email, uid, False, "inactive", ip, user_agent)
            raise AuthError()

        if not creds["password_hash"] or not pwd.verify_password(
            password, creds["password_hash"], creds["password_algo"]
        ):
            await _record_attempt(s, email, uid, False, "bad_password", ip, user_agent)
            raise AuthError()

        await _record_attempt(s, email, uid, True, None, ip, user_agent)
        orgs = await list_user_orgs(s, uid)

    if not orgs:
        raise AuthError("No active organisation for this account.")

    if org_id is not None:
        chosen = next((o for o in orgs if o.org_id == org_id), None)
        if chosen is None:
            raise AuthError("No access to that organisation.")
    elif len(orgs) == 1:
        chosen = orgs[0]
    else:
        return orgs  # the client picks and calls again with org_id

    # Upgrade a legacy (seeded bcrypt) hash now that we hold the plaintext.
    if pwd.needs_rehash(creds["password_algo"], creds["password_hash"]):
        new_hash, algo = pwd.hash_password(password)
        async with org_session(chosen.org_id, chosen.role_code, uid) as s:
            await s.execute(
                update(AppUser)
                .where(AppUser.id == uid)
                .values(password_hash=new_hash, password_algo=algo)
            )

    claims = await _build_claims_for(uid, chosen, bool(creds["must_change_password"]))
    refresh_raw = await _open_session_record(claims, ip, user_agent)
    return LoginSuccess(claims=claims, refresh_token_raw=refresh_raw)


async def _build_claims_for(
    uid: uuid.UUID, chosen: OrgChoice, must_change_password: bool
) -> AccessClaims:
    async with org_session(chosen.org_id, chosen.role_code, uid) as s:
        return await resolve_claims(s, uid, chosen, must_change_password)


async def refresh(
    refresh_token_raw: str, ip: str | None, user_agent: str | None
) -> LoginSuccess:
    """Rotate the session: the old token is revoked, a new one issued, and the
    capability set re-resolved — which is how a revoked grant actually dies."""
    digest = hash_token(refresh_token_raw)
    async with anonymous_session() as s:
        row = (
            await s.execute(text("SELECT * FROM session_lookup(:h)"), {"h": digest})
        ).mappings().first()

    now = dt.datetime.now(dt.timezone.utc)
    if row is None or row["revoked_at"] is not None or row["expires_at"] < now:
        raise AuthError("Session expired. Sign in again.")

    uid, oid = row["user_id"], row["org_id"]

    async with org_session(oid, "pending", uid) as s:
        orgs = await list_user_orgs(s, uid)
        chosen = next((o for o in orgs if o.org_id == oid), None)
        if chosen is None:
            raise AuthError("Access to this organisation was revoked.")
        mcp = (
            await s.execute(select(AppUser.must_change_password).where(AppUser.id == uid))
        ).scalar_one()
        claims = await resolve_claims(s, uid, chosen, mcp)
        await s.execute(
            update(UserSession)
            .where(UserSession.id == row["session_id"])
            .values(revoked_at=now, revoke_reason="rotated")
        )

    refresh_raw = await _open_session_record(claims, ip, user_agent)
    return LoginSuccess(claims=claims, refresh_token_raw=refresh_raw)


async def logout(claims: AccessClaims, refresh_token_raw: str | None, everywhere: bool) -> None:
    async with org_session(claims.org_id, claims.role, claims.user_id) as s:
        stmt = (
            update(UserSession)
            .where(UserSession.user_id == claims.user_id, UserSession.revoked_at.is_(None))
            .values(revoked_at=dt.datetime.now(dt.timezone.utc), revoke_reason="logout")
        )
        if not everywhere and refresh_token_raw:
            stmt = stmt.where(UserSession.token_hash == hash_token(refresh_token_raw))
        await s.execute(stmt)


async def change_password(claims: AccessClaims, current: str, new: str) -> None:
    from sourcehub.platform.identity import database as pwd

    async with org_session(claims.org_id, claims.role, claims.user_id) as s:
        user = (
            await s.execute(select(AppUser).where(AppUser.id == claims.user_id))
        ).scalar_one()
        if not user.password_hash or not pwd.verify_password(
            current, user.password_hash, user.password_algo
        ):
            raise AuthError("Current password is incorrect.")
        new_hash, algo = pwd.hash_password(new)
        await s.execute(
            update(AppUser)
            .where(AppUser.id == claims.user_id)
            .values(
                password_hash=new_hash,
                password_algo=algo,
                password_updated_at=dt.datetime.now(dt.timezone.utc),
                must_change_password=False,
            )
        )
        await s.execute(
            text(
                "INSERT INTO user_password_history (user_id, password_hash, password_algo) "
                "VALUES (:u, :h, :a)"
            ),
            {"u": claims.user_id, "h": new_hash, "a": algo},
        )


# ---------------------------------------------------------------------------
# Invitation and password reset — anonymous, via the definer functions
# ---------------------------------------------------------------------------

async def invitation_preview(token_raw: str) -> dict[str, Any] | None:
    async with anonymous_session() as s:
        row = (
            await s.execute(
                text("SELECT * FROM invitation_lookup(:h)"), {"h": hash_token(token_raw)}
            )
        ).mappings().first()
    return dict(row) if row else None


async def invitation_accept(token_raw: str, password: str) -> uuid.UUID:
    from sourcehub.platform.identity import database as pwd

    new_hash, algo = pwd.hash_password(password)
    async with anonymous_session() as s:
        uid = (
            await s.execute(
                text("SELECT invitation_accept(:h, :p, :a)"),
                {"h": hash_token(token_raw), "p": new_hash, "a": algo},
            )
        ).scalar_one()
    return uid


async def request_password_reset(email: str, ip: str | None) -> None:
    from sourcehub.platform.mail.smtp import send_mail

    raw, digest = new_opaque_token()
    async with anonymous_session() as s:
        row = (
            await s.execute(
                text("SELECT * FROM password_reset_create(:e, :h)"), {"e": email, "h": digest}
            )
        ).mappings().first()
    if row is None:
        return  # silent — no enumeration
    link = f"{settings.app_base_url}/reset-password?token={raw}"
    try:
        await send_mail(
            email,
            f"Reset your {BRAND} password",
            f"Hello {row['full_name']},\n\n"
            f"Someone asked to reset the password for this account. If it was you,\n"
            f"open the link below within one hour:\n\n  {link}\n\n"
            f"If it was not you, ignore this email — nothing has changed.",
        )
    except OSError:
        pass  # best-effort; the token stands and support can resend


async def confirm_password_reset(token_raw: str, password: str) -> None:
    from sourcehub.platform.identity import database as pwd

    new_hash, algo = pwd.hash_password(password)
    async with anonymous_session() as s:
        await s.execute(
            text("SELECT password_reset_consume(:h, :p, :a)"),
            {"h": hash_token(token_raw), "p": new_hash, "a": algo},
        )


# ---------------------------------------------------------------------------
# Organisations — reads used across the console
# ---------------------------------------------------------------------------

_PROFILE_MODEL = {
    "client": ClientProfile,
    "tenant": TenantProfile,
    "aggregator": AggregatorProfile,
    "business": BusinessProfile,
    "sponsor": SponsorProfile,
}


def _may_see_commercials(org: Organisation, claims: AccessClaims | None) -> bool:
    """Whether the viewer may see what this organisation pays the platform.

    RLS decides which organisations you may see at all; this decides which of
    their columns are the platform's business with them rather than yours. A
    bidder is disclosed to the client it bids to (organisation_select_bidders,
    db/110_auth_functions.sql) — that discloses who they are, not whether they
    are behind on their platform invoices.

    Ops sees every account's commercials, an organisation sees its own, and
    claims=None means an internal caller that has already decided.
    """
    if claims is None:
        return True
    return claims.role == "platform_admin" or org.id == claims.org_id


def _profile_dict(profile: Any, *, commercials: bool = True) -> dict[str, Any]:
    if profile is None:
        return {}
    hidden = {"org_id", "created_at", "updated_at"}
    if not commercials:
        hidden.add("plan")  # tenant_profile.plan — the partner's platform tier
    return {
        c.key: getattr(profile, c.key) for c in profile.__table__.columns if c.key not in hidden
    }


async def get_org(
    session: AsyncSession, org_id: uuid.UUID, claims: AccessClaims | None = None
) -> dict[str, Any] | None:
    """Pass claims wherever the caller may be looking at someone else's org —
    it is what keeps the commercial columns out of the answer."""
    org = (
        await session.execute(
            select(Organisation).where(Organisation.id == org_id, Organisation.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if org is None:
        return None
    profile = None
    model = _PROFILE_MODEL.get(org.kind)
    if model is not None:
        profile = (
            await session.execute(select(model).where(model.org_id == org_id))
        ).scalar_one_or_none()
    return _org_dict(org, profile, claims)


def _org_dict(
    org: Organisation, profile: Any = None, claims: AccessClaims | None = None
) -> dict[str, Any]:
    commercials = _may_see_commercials(org, claims)
    out: dict[str, Any] = {
        "id": org.id,
        "reference_code": org.reference_code,
        "kind": org.kind,
        "name": org.name,
        "status": org.status,
        "parent_org_id": org.parent_org_id,
        "country": org.country,
        "residency_region": org.residency_region,
        "billing_status": org.billing_status,
        "rating": org.rating,
        "onboarded_at": org.onboarded_at,
        "profile": _profile_dict(profile, commercials=commercials),
    }
    if not commercials:
        del out["billing_status"]
    return out


async def list_orgs_of_kind(session: AsyncSession, kind: str) -> list[dict[str, Any]]:
    """RLS decides who appears: Ops sees every account, a tenant its network,
    everyone else what a shared contract exposes."""
    model = _PROFILE_MODEL.get(kind)
    stmt = (
        select(Organisation, model)
        .join(model, model.org_id == Organisation.id, isouter=True)
        .where(
            Organisation.kind == kind,
            Organisation.deleted_at.is_(None),
            Organisation.status == "active",
        )
        .order_by(Organisation.reference_code)
        if model is not None
        else None
    )
    if stmt is None:
        rows = (
            await session.execute(
                select(Organisation).where(Organisation.kind == kind, Organisation.deleted_at.is_(None))
            )
        ).scalars()
        return [_org_dict(o) for o in rows]
    rows = (await session.execute(stmt)).all()
    return [_org_dict(org, profile) for org, profile in rows]


async def suspend_network_org(
    session: AsyncSession, claims: AccessClaims, org_id: uuid.UUID, reason: str
) -> dict[str, Any]:
    """The prototype's 'remove from network' — a suspension, never a delete.
    RLS: only the parent tenant (or Ops) can reach this row for update."""
    org = (
        await session.execute(select(Organisation).where(Organisation.id == org_id))
    ).scalar_one_or_none()
    if org is None:
        raise LookupError("organisation not found")
    org.status = "suspended"
    org.suspended_at = dt.datetime.now(dt.timezone.utc)
    org.suspension_reason = reason
    org.updated_by = claims.user_id
    return _org_dict(org)
