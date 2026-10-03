"""identity — organisations, users, role grants and sessions.

Business rules, and the ONLY public surface of this module.

Authentication is the one path in the system that runs without an org context,
which is why every anonymous step goes through a SECURITY DEFINER function
(db/100_rls.sql, db/110_auth_functions.sql) instead of reading tables the RLS
policies would — correctly — show nothing of.
"""

from __future__ import annotations

import datetime as dt
import json
import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, cast

from pydantic import ValidationError
from sqlalchemy import select, text, update
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims, hash_token, new_opaque_token
from sourcehub.config import PRODUCT, settings
from sourcehub.db.session import anonymous_session, org_session
from sourcehub.modules.attachments import service as attachments
from sourcehub.modules.audit import service as audit
from sourcehub.modules.identity import directory, members
from sourcehub.modules.identity.models import AppUser, Organisation, UserSession
from sourcehub.modules.identity.profile_schema import (
    KIND_FIELDS,
    OPS_ONLY,
    OnboardingProfileIn,
    OrgProfilePatch,
    foreign_kind_fields,
    public_part,
)

if TYPE_CHECKING:
    from sqlalchemy import CursorResult


class OrgLifecycleError(Exception):
    """An organisation was asked to make a move its status does not allow."""


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


async def _record_failure(
    email: str,
    user_id: uuid.UUID | None,
    failure_code: str,
    ip: str | None,
    user_agent: str | None,
) -> None:
    """Record a refused attempt in a transaction of its own.

    login() raises AuthError straight after recording a failure, and raising
    out of anonymous_session() rolls its transaction back — which took the
    login_attempt row and the failed_login_count increment with it. Successes
    committed and failures vanished: the lockout never engaged, and the
    forensic trail held only the logins that worked. A separate short
    transaction commits the failure before the caller raises.
    """
    async with anonymous_session() as s:
        await _record_attempt(s, email, user_id, False, failure_code, ip, user_agent)


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

        # Each refusal goes through _record_failure, never _record_attempt on
        # this session: the raise that follows rolls this session back.
        if creds is None:
            await _record_failure(email, None, "no_such_user", ip, user_agent)
            raise AuthError()

        uid: uuid.UUID = creds["user_id"]

        if creds["locked_until"] and creds["locked_until"] > dt.datetime.now(dt.timezone.utc):
            await _record_failure(email, uid, "locked", ip, user_agent)
            raise AuthError("Account temporarily locked. Try again later.")

        if creds["status"] not in ("active", "locked"):
            await _record_failure(email, uid, "inactive", ip, user_agent)
            raise AuthError()

        if not creds["password_hash"] or not pwd.verify_password(
            password, creds["password_hash"], creds["password_algo"]
        ):
            await _record_failure(email, uid, "bad_password", ip, user_agent)
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
            f"Reset your {PRODUCT} password",
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

# db/280: a kind's profile is organisation.profile (the descriptors KIND_FIELDS
# lists) plus the typed terms below, which code has rules on. The platform
# organisation has no profile.
_TYPED_FIELDS: dict[str, tuple[str, ...]] = {
    "client": ("plan", "dpa_signed", "dpa_signed_at"),
    "tenant": ("plan", "fair_work_attested"),
}
# The organisation's terms WITH THE PLATFORM: what tier they bought and whether
# they have signed the DPA. A counterparty is entitled to know who they are
# dealing with, not how they are billed for it.
_COMMERCIAL_FIELDS = frozenset({"plan", "dpa_signed", "dpa_signed_at"})


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


def _profile_dict(org: Organisation, *, commercials: bool = True) -> dict[str, Any]:
    """The kind profile as the API shows it, one flat object: the descriptors
    from organisation.profile, the typed terms the kind carries, and `since`,
    the day the account was onboarded."""
    if org.kind not in KIND_FIELDS:
        return {}
    shown: dict[str, Any] = dict(org.profile or {})
    for field in KIND_FIELDS[org.kind]:
        # the same keys whether or not a value was ever stored, so the
        # console's `hq: string | null` stays true
        shown.setdefault(field, None)
    for field in _TYPED_FIELDS.get(org.kind, ()):
        shown[field] = getattr(org, field)
    if org.kind in PROFILE_KINDS:
        shown["since"] = org.onboarded_at.date() if org.onboarded_at else None
    if not commercials:
        for field in _COMMERCIAL_FIELDS:
            shown.pop(field, None)
    return shown


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
    return await _org_out(session, org, claims)


def _public_profile(org: Organisation) -> dict[str, Any]:
    """public_profile as the API shows it: without the storage key.

    The key would let nobody fetch the file (storage is private), but it names
    the folder layout and there is nothing a caller can do with it. What the
    console needs is whether there is a logo and when it last changed, so it can
    ask for a signed URL and cache it until the logo is replaced.
    """
    stored = dict(org.public_profile or {})
    key = stored.pop("logo_key", None)
    changed = stored.pop("logo_updated_at", None)
    return {"public_profile": stored, "logo_version": changed if key else None}


# The kind whose figures are calculated. A delivery partner's rating, on-time
# rate and QA pass rate were columns the seed files wrote and nothing updated;
# they are answered from partner_performance() now (db/260), here and on every
# other screen, so a partner cannot show one number on its profile and another
# in the vendors directory.
_MEASURED_KIND = "tenant"


def _org_dict(
    org: Organisation,
    claims: AccessClaims | None = None,
    performance: directory.Performance | None = None,
) -> dict[str, Any]:
    """For a delivery partner pass performance (see _org_out). Without it the
    figures are absent rather than read from the seeded columns: a blank is
    honest, and a number nobody calculated is not."""
    commercials = _may_see_commercials(org, claims)
    measured = org.kind == _MEASURED_KIND
    record = performance or directory.NO_RECORD
    shown = _profile_dict(org, commercials=commercials)
    if measured and shown:
        shown["on_time_rate"] = record.on_time_pct
        shown["qa_pass_rate"] = record.qa_pass_pct
    out: dict[str, Any] = {
        "id": org.id,
        "reference_code": org.reference_code,
        "kind": org.kind,
        "name": org.name,
        "legal_name": org.legal_name,
        "status": org.status,
        "parent_org_id": org.parent_org_id,
        "country": org.country,
        "residency_region": org.residency_region,
        "billing_status": org.billing_status,
        "rating": record.rating_avg if measured else org.rating,
        "onboarded_at": org.onboarded_at,
        # Why an account is suspended is between it and the platform. The
        # columns were written at suspension and returned to nobody, so the
        # console could show that an account was suspended and never why.
        "suspended_at": org.suspended_at,
        "suspension_reason": org.suspension_reason,
        "profile": shown,
        **_public_profile(org),
    }
    if measured:
        out["performance"] = record.summary()
    if not commercials:
        del out["billing_status"]
        del out["suspended_at"]
        del out["suspension_reason"]
    return out


async def _org_out(
    session: AsyncSession,
    org: Organisation,
    claims: AccessClaims | None = None,
) -> dict[str, Any]:
    """_org_dict for ONE organisation, with a delivery partner's figures looked
    up. Lists batch the lookup instead (list_orgs_of_kind)."""
    record = None
    if org.kind == _MEASURED_KIND:
        record = (await directory.performance_for(session, [org.id])).get(org.id)
    return _org_dict(org, claims, record)


async def list_orgs_of_kind(
    session: AsyncSession,
    kind: str,
    claims: AccessClaims | None = None,
    status: str | None = "active",
) -> list[dict[str, Any]]:
    """RLS decides who appears: Ops sees every account, a tenant its network,
    everyone else what a shared contract exposes.

    Pass claims. RLS says WHICH organisations come back; it says nothing about
    which of their columns you may read, and this list is reached by every
    persona. Without claims _org_dict treats the caller as internal and hands a
    counterparty the plan, the DPA and the billing status that
    GET /organisations/{id} deliberately withholds.

    status defaults to 'active' because that is what every existing caller
    means — a tenant's network page wants its live suppliers. status=None
    returns every lifecycle state, which is what an operator needs: the filter
    used to be unconditional, so suspending an account removed it from the only
    screen that could have reinstated it.
    """
    where = [Organisation.kind == kind, Organisation.deleted_at.is_(None)]
    if status is not None:
        where.append(Organisation.status == status)
    stmt = select(Organisation).where(*where).order_by(Organisation.reference_code)
    orgs = list((await session.execute(stmt)).scalars())
    record = (
        await directory.performance_for(session, [org.id for org in orgs])
        if kind == _MEASURED_KIND
        else {}
    )
    return [_org_dict(org, claims, record.get(org.id)) for org in orgs]


# What each action means, and the states it may be invoked from.
#
# Suspension is the only lever, and that is the honest set. A 'terminate' action
# lived here briefly and was removed: org_status declares 'terminated', nothing
# keys off it, and nothing writes it — so it ended no billing, released no escrow
# and erased nothing. Offboarding is a real feature and this was not it.
_LIFECYCLE: dict[str, tuple[str, frozenset[str]]] = {
    "suspend": ("suspended", frozenset({"active", "pending_approval"})),
    "reinstate": ("active", frozenset({"suspended", "pending_approval"})),
}

_LIFECYCLE_EVENT = {
    "suspend": "org.suspended",
    "reinstate": "org.reinstated",
}


async def set_org_lifecycle(
    session: AsyncSession, claims: AccessClaims, org_id: uuid.UUID, action: str, reason: str
) -> dict[str, Any]:
    """Move an organisation through its lifecycle. A suspension, never a delete.

    RLS decides whose row this may touch at all — organisation_update is
    is_platform_admin() OR id = current_org_id(), so a tenant reaches its own
    network and Ops reaches everyone. This decides whether the move itself makes
    sense.

    Suspension is a live kill switch and worth saying plainly: user_organisations()
    filters on o.status = 'active', so every user of a suspended org fails login
    immediately and fails refresh within the access-token TTL. Reinstating is
    what gives them their workspace back, and until this function there was no
    way to do it outside SQL.
    """
    target, from_states = _LIFECYCLE[action]
    org = (
        await session.execute(select(Organisation).where(Organisation.id == org_id))
    ).scalar_one_or_none()
    if org is None:
        raise LookupError("organisation not found")

    # The platform organisation is not an account and cannot be switched off.
    # user_organisations() filters o.status = 'active', and every platform_admin
    # grant lives in this one org — so suspending it fails the login of the only
    # people who could reinstate it. Reversible in theory, unrecoverable in fact.
    if org.kind == "platform":
        raise OrgLifecycleError("The platform organisation cannot be suspended.")

    if org.status == target:
        raise OrgLifecycleError(f"{org.name} is already {target}.")
    if org.status not in from_states:
        raise OrgLifecycleError(f"A {org.status} organisation cannot be {target}.")

    org.status = target
    org.updated_by = claims.user_id
    if action == "suspend":
        org.suspended_at = dt.datetime.now(dt.timezone.utc)
        org.suspension_reason = reason
    else:
        # leaving the old reason behind would read as though it still applied
        org.suspended_at = None
        org.suspension_reason = None

    # Scoped to the affected org as well as the actor, because scope is the
    # visibility key: without org_id here the organisation whose status just
    # changed could not see the event in its own trail. Suspension wrote three
    # columns and logged nothing at all until now.
    await audit.log(
        session,
        _LIFECYCLE_EVENT[action],
        f"{org.reference_code} ({org.name}) {target}: {reason}",
        [org.id, claims.org_id],
    )
    return await _org_out(session, org, claims)


# ---------------------------------------------------------------------------
# Organisation profile — what onboarding captured, kept current afterwards.
#
# profile.manage has been seeded for every organisation kind since 900_seed and
# checked by nothing; this is its first reader. Ops edits through org.update
# (db/230). The route admits either (require_any_capability); these functions
# decide what each may change, and RLS decides whose row — organisation_update
# is is_platform_admin() OR id = current_org_id().
# ---------------------------------------------------------------------------

# The kinds onboarding captures a full profile for (legal name, public profile,
# DPA, logo). Every kind but the platform may edit the fields KIND_FIELDS gives
# it, now that db/280 keeps them all on the organisation row.
PROFILE_KINDS = ("client", "tenant")
EDITABLE_KINDS = ("client", "tenant", "aggregator", "business", "sponsor")
_EDITOR_SCOPES = ("owner", "manager")
_KIND_NAME = {
    "client": "a client",
    "tenant": "a partner",
    "aggregator": "an aggregator",
    "business": "a business partner",
    "sponsor": "a device sponsor",
}
_OPS_ONLY_LABEL = {
    "name": "the organisation name",
    "legal_name": "the legal name",
    "country": "the country",
    "plan": "the plan",
    "residency_region": "the data residency",
    "dpa_signed": "the DPA status",
}


class ProfileError(Exception):
    """A well-formed profile change that does not apply to this organisation."""


class ProfileForbiddenError(ProfileError):
    """The caller may not make this change."""


def _is_profile_ops(claims: AccessClaims) -> bool:
    return "org.update" in claims.capabilities


def _check_editor(claims: AccessClaims, org: Organisation, sent: set[str]) -> None:
    """Ops edits any client or partner. Anyone else edits their own, if they
    administer it, and never the fields that are the account's terms."""
    if org.kind not in EDITABLE_KINDS:
        raise ProfileError("The platform organisation's profile cannot be edited here.")
    if _is_profile_ops(claims):
        return
    if org.id != claims.org_id or "profile.manage" not in claims.capabilities:
        raise ProfileForbiddenError("You can only edit your own organisation's profile.")
    # One role per organisation kind, so every member holds profile.manage; the
    # grant's scope is what separates the people who run the account (see
    # require_member_admin, api/deps.py).
    if claims.scope not in _EDITOR_SCOPES:
        raise ProfileForbiddenError("Only an owner or manager can edit the organisation profile.")
    locked = [f for f in _OPS_ONLY_LABEL if f in sent and f in OPS_ONLY]
    if locked:
        raise ProfileForbiddenError(
            f"Only {PRODUCT} can change "
            + ", ".join(_OPS_ONLY_LABEL[f] for f in locked)
            + ". Contact your account manager."
        )


async def _load_org(session: AsyncSession, org_id: uuid.UUID) -> Organisation:
    org = (
        await session.execute(
            select(Organisation).where(Organisation.id == org_id, Organisation.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if org is None:
        raise LookupError("organisation not found")
    return org


# The two JSON columns on organisation that profile edits merge into.
_JSON_COLUMNS = ("public_profile", "profile")


async def _merge_json(
    session: AsyncSession,
    org_id: uuid.UUID,
    column: str,
    changes: dict[str, Any],
    who: uuid.UUID,
) -> None:
    """Merge into one JSON column in ONE statement: set what has a value, drop
    what was sent as null. Read-modify-write in Python would let two editors
    silently undo each other; || and - on jsonb cannot."""
    if column not in _JSON_COLUMNS:
        raise ValueError(f"not a JSON profile column: {column}")
    sets = {k: v for k, v in changes.items() if v is not None}
    drops = [k for k, v in changes.items() if v is None]
    if not sets and not drops:
        return
    res = await session.execute(
        text(
            f"UPDATE organisation "
            f"SET {column} = ({column} || CAST(:sets AS jsonb))"
            f"                     - CAST(:drops AS text[]), "
            f"    updated_by = :who "
            f"WHERE id = :id"
        ),
        {"sets": json.dumps(sets), "drops": drops, "who": who, "id": org_id},
    )
    if cast("CursorResult[Any]", res).rowcount != 1:
        # RLS filtered the UPDATE: the caller can see the organisation but may
        # not write it. _check_editor should have said so first.
        raise ProfileForbiddenError("You can only edit your own organisation's profile.")


async def _merge_public(
    session: AsyncSession, org_id: uuid.UUID, changes: dict[str, Any], who: uuid.UUID
) -> None:
    await _merge_json(session, org_id, "public_profile", changes, who)


def _apply_typed_fields(org: Organisation, values: dict[str, Any]) -> None:
    """The typed terms on the organisation row. Signing the DPA stamps when."""
    for field, value in values.items():
        if field == "dpa_signed":
            value = bool(value)
            if value != bool(org.dpa_signed):
                org.dpa_signed_at = dt.datetime.now(dt.timezone.utc) if value else None
        setattr(org, field, value)


async def update_org_profile(
    session: AsyncSession, claims: AccessClaims, org_id: uuid.UUID, patch: OrgProfilePatch
) -> dict[str, Any]:
    """Change what the patch names, and nothing else.

    The audit line records WHICH fields changed, not their values: the trail is
    read by more people than the profile is, and the values are one click away
    on the profile itself.
    """
    org = await _load_org(session, org_id)
    sent = set(patch.model_fields_set)
    _check_editor(claims, org, sent)

    wrong = foreign_kind_fields(org.kind, sent)
    if wrong:
        raise ProfileError(f"{', '.join(wrong)} does not apply to {_KIND_NAME[org.kind]}.")
    if "name" in sent and patch.name is None:
        raise ProfileError("An organisation needs a name.")

    if not sent:
        return await _org_out(session, org, claims)

    for field in ("name", "legal_name", "country", "residency_region"):
        if field in sent:
            setattr(org, field, getattr(patch, field))
    org.updated_by = claims.user_id

    # db/280: the typed terms are columns on the row; the descriptors merge
    # into organisation.profile the way the public fields merge into
    # public_profile, so a sent null clears a key and an omitted one is kept.
    kind_values = {f: getattr(patch, f) for f in sent & KIND_FIELDS[org.kind]}
    typed = {f: v for f, v in kind_values.items() if f in _TYPED_FIELDS.get(org.kind, ())}
    described = {f: v for f, v in kind_values.items() if f not in typed}
    _apply_typed_fields(org, typed)

    await session.flush()
    await _merge_json(session, org.id, "profile", described, claims.user_id)
    await _merge_public(session, org.id, public_part(patch), claims.user_id)
    await session.refresh(org)

    await audit.log(
        session,
        "org.profile_updated",
        f"{org.reference_code} ({org.name}) profile updated: {', '.join(sorted(sent))}",
        [org.id, claims.org_id],
    )
    return await _org_out(session, org, claims)


async def _write_logo_key(
    session: AsyncSession, org_id: uuid.UUID, key: str | None, who: uuid.UUID
) -> None:
    if key is None:
        sql = (
            "UPDATE organisation "
            "SET public_profile = public_profile - CAST(:drops AS text[]), updated_by = :who "
            "WHERE id = :id"
        )
        params: dict[str, Any] = {
            "drops": ["logo_key", "logo_updated_at"], "who": who, "id": org_id,
        }
    else:
        sql = (
            "UPDATE organisation "
            "SET public_profile = public_profile || jsonb_build_object("
            "      'logo_key', CAST(:key AS text), 'logo_updated_at', to_jsonb(now())), "
            "    updated_by = :who "
            "WHERE id = :id"
        )
        params = {"key": key, "who": who, "id": org_id}
    res = await session.execute(text(sql), params)
    if cast("CursorResult[Any]", res).rowcount != 1:
        raise ProfileForbiddenError("You can only edit your own organisation's profile.")


async def set_org_logo(
    session: AsyncSession, claims: AccessClaims, org_id: uuid.UUID, staging_key: str
) -> dict[str, Any]:
    """File an uploaded image as the organisation's logo, replacing any other."""
    org = await _load_org(session, org_id)
    _check_editor(claims, org, set())
    previous = (org.public_profile or {}).get("logo_key")
    try:
        key = await attachments.file_org_logo(claims, staging_key, org.id)
    except attachments.AttachmentError as e:
        raise ProfileError(str(e)) from None
    await _write_logo_key(session, org.id, key, claims.user_id)
    await session.refresh(org)
    await audit.log(
        session, "org.logo_updated", f"{org.reference_code} ({org.name}) logo updated",
        [org.id, claims.org_id],
    )
    # Last: until the row points at the new key, the old one is still the logo.
    if previous:
        await attachments.discard_org_logo(previous)
    return await _org_out(session, org, claims)


async def clear_org_logo(
    session: AsyncSession, claims: AccessClaims, org_id: uuid.UUID
) -> dict[str, Any]:
    org = await _load_org(session, org_id)
    _check_editor(claims, org, set())
    previous = (org.public_profile or {}).get("logo_key")
    if previous:
        await _write_logo_key(session, org.id, None, claims.user_id)
        await session.refresh(org)
        await audit.log(
            session, "org.logo_removed", f"{org.reference_code} ({org.name}) logo removed",
            [org.id, claims.org_id],
        )
        await attachments.discard_org_logo(previous)
    return await _org_out(session, org, claims)


async def org_logo_url(session: AsyncSession, org_id: uuid.UUID) -> dict[str, Any]:
    """A signed URL for the logo of an organisation the caller can see.

    The RLS'd select is the whole access check, as for attachments: whoever may
    see the organisation may see its logo, which is what public_profile means.
    """
    org = await _load_org(session, org_id)
    key = (org.public_profile or {}).get("logo_key")
    if not key:
        raise LookupError("no logo")
    ext = key.rsplit(".", 1)[-1]
    return await attachments.signed_inline_url(key, f"{org.reference_code}-logo.{ext}")


async def apply_onboarding_profile(
    session: AsyncSession, claims: AccessClaims, org_id: uuid.UUID, payload: dict[str, Any]
) -> list[str]:
    """What approve_onboarding_request() does not write, written at approval.

    The SQL function still creates the organisation, its kind profile (industry
    or HQ, plan, capabilities), the first user and the invitation; this adds the
    legal name, the public profile, the DPA flag and the logo, in the same
    transaction. The logo yields a warning rather than an error: an upload that
    has gone missing is no reason to refuse an organisation Ops has already
    decided to admit, and the logo can be added on the account page.
    """
    try:
        p = OnboardingProfileIn.model_validate(payload or {})
    except ValidationError:
        # Requests are validated when they are filed; this is one filed before
        # that check existed, holding a value it would now refuse.
        return [
            "The profile details on this request could not be read; "
            "complete them on the account page."
        ]

    org = await _load_org(session, org_id)
    if org.kind not in PROFILE_KINDS:
        return []

    if p.legal_name:
        org.legal_name = p.legal_name
        org.updated_by = claims.user_id
    if p.dpa_signed and org.kind == "client":
        _apply_typed_fields(org, {"dpa_signed": True})
    await session.flush()

    await _merge_public(
        session,
        org.id,
        {k: v for k, v in public_part(p, only_sent=False).items() if v is not None},
        claims.user_id,
    )

    warnings: list[str] = []
    if p.logo_staging_key:
        try:
            key = await attachments.file_org_logo(claims, p.logo_staging_key, org.id)
        except attachments.AttachmentError as e:
            warnings.append(f"The logo was not added: {e} Add it from the account page.")
        else:
            await _write_logo_key(session, org.id, key, claims.user_id)
    await session.refresh(org)
    return warnings


# ---------------------------------------------------------------------------
# Organisation membership — adding and removing your own colleagues.
#
# The capabilities (user.invite, user.manage, role.manage) have been seeded
# since 900_seed and read by nothing. These are the first callers.
#
# Two rules live here rather than in the database, and both are deliberate:
#
#   * the REACHABLE-owner rule. db/200's trigger refuses zero owners, counting
#     'invited' ones because approve_onboarding_request creates them that way.
#     But login() admits only ('active','locked'), so an organisation holding a
#     single never-accepted owner satisfies the trigger and cannot be signed
#     into by anyone. The trigger cannot tighten without breaking onboarding;
#     this can.
#   * the identical answer from invite_member. app_user.email is unique across
#     the whole platform, so reporting "that address is taken" would turn the
#     invite form into an oracle for whether ANY address has an account here.
#     Every outcome returns the same shape.
# ---------------------------------------------------------------------------


class MemberError(Exception):
    """A membership change the caller may not or should not make."""


_MEMBER_ROWS = text(
    "SELECT u.id AS user_id, u.full_name, u.email, u.status AS user_status, "
    "       g.id AS grant_id, g.scope, g.granted_at, r.code AS role_code, r.name AS role_name, "
    "       inv.accepted_at, inv.expires_at "
    "FROM   user_role_grant g "
    "JOIN   app_user u ON u.id = g.user_id "
    "JOIN   role r     ON r.id = g.role_id "
    "LEFT JOIN LATERAL (SELECT i.accepted_at, i.expires_at FROM invitation i "
    "                    WHERE i.user_id = g.user_id AND i.org_id = g.org_id "
    "                      AND i.revoked_at IS NULL "
    "                    ORDER BY i.invited_at DESC LIMIT 1) inv ON true "
    # RLS confines this to the caller's organisation (user_role_grant_select),
    # but that policy also admits `user_id = current_user_id()` — which would
    # leak the caller's grants in OTHER organisations into this list. Hence the
    # explicit org_id: the one place application code must repeat a tenancy
    # predicate, because the policy is deliberately wider than this view needs.
    "WHERE  g.org_id = :org AND g.revoked_at IS NULL "
    "  AND  u.deleted_at IS NULL "
    # Staff only. invite_worker (db/190_worker_skills.sql:82) grants every crowd
    # resource role 'worker' with scope 'member' in the AGGREGATOR'S OWN org, so
    # without this an aggregator's Manage users page lists its whole crowd as
    # colleagues — and removing one from there revokes the grant without
    # touching crowd_worker.status, leaving them active on the roster and
    # permanently unassignable.
    #
    # applies_to_kind IS NOT NULL is the discriminator the schema already uses:
    # 'worker' is the single role seeded with NULL (db/905_seed_workers.sql:15)
    # because it is workforce, not staff. db/200's role-fits trigger and
    # assignable_roles both turn on the same column.
    "  AND  r.applies_to_kind IS NOT NULL "
    "ORDER  BY u.full_name"
)


def _member_invitation_status(r: Any) -> str:
    if r["user_status"] == "active" or r["accepted_at"] is not None:
        return "accepted"
    if r["expires_at"] is not None and r["expires_at"] < dt.datetime.now(dt.timezone.utc):
        return "expired"
    return "pending"


def _member_dict(r: Any) -> dict[str, Any]:
    return {
        "user_id": r["user_id"],
        "full_name": r["full_name"],
        "email": r["email"],
        "scope": r["scope"],
        "role_code": r["role_code"],
        "role_name": r["role_name"],
        "granted_at": r["granted_at"],
        "invitation_status": _member_invitation_status(r),
    }


async def list_members(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (await session.execute(_MEMBER_ROWS, {"org": claims.org_id})).mappings().all()
    return [_member_dict(r) for r in rows]


async def assignable_roles(session: AsyncSession, claims: AccessClaims) -> list[dict[str, str]]:
    """The roles this organisation may actually grant.

    Equality on applies_to_kind, never "NULL means any": 'worker' is seeded
    with NULL (db/905_seed_workers.sql:15) so both an aggregator and a business
    partner can hold crowd resources, and offering it here would create a
    person with a login and no roster row. platform_admin is applies_to_kind
    'platform', so it cannot appear for anyone else — the same rule db/200's
    trigger enforces, asked the other way round.
    """
    rows = (
        await session.execute(
            text(
                "SELECT r.code, r.name FROM role r, organisation o "
                "WHERE  o.id = :org "
                "  AND  ((r.is_system AND r.applies_to_kind = o.kind) "
                "        OR (NOT r.is_system AND r.org_id = o.id)) "
                "ORDER  BY r.is_system DESC, r.name"
            ),
            {"org": claims.org_id},
        )
    ).mappings().all()
    return [{"code": r["code"], "name": r["name"]} for r in rows]


async def _assert_owner_reachable(session: AsyncSession, org_id: uuid.UUID) -> None:
    """At least one owner who can actually sign in.

    Also forces the deferred owner trigger to fire HERE, where the caller can
    turn it into a clean refusal. Without this, db/200's constraint raises at
    COMMIT — which TxRoute performs after the endpoint has returned, so the
    client gets a 500 for a rule we can explain in a sentence.

    The try is not decoration. Postgres applies a deferred-to-immediate change
    retroactively, running the queued checks DURING the SET CONSTRAINTS
    statement — so a genuine violation raises from that line, before the
    friendlier count below can run. The first version of this left it bare, and
    the sole-owner cases it was written to explain returned 500 anyway: the
    error had been moved inside the transaction and still nobody caught it.

    Anything unrecognised re-raises. The count below is reached only when the
    trigger PASSES, which is the narrower case of an organisation whose last
    owner exists but has never accepted their invitation — the trigger counts
    'invited', login() does not.
    """
    try:
        await session.execute(
            text("SET CONSTRAINTS user_role_grant_keeps_an_owner IMMEDIATE")
        )
    except DBAPIError as e:
        msg = str(e.orig) if e.orig else str(e)
        if "must keep at least one owner" in msg:
            raise MemberError(
                "This would leave the organisation with no owner who can sign in."
            ) from None
        raise
    n = (
        await session.execute(
            text(
                "SELECT count(*) FROM user_role_grant g JOIN app_user u ON u.id = g.user_id "
                "WHERE g.org_id = :org AND g.scope = 'owner' AND g.revoked_at IS NULL "
                "  AND u.deleted_at IS NULL AND u.status IN ('active','locked')"
            ),
            {"org": org_id},
        )
    ).scalar_one()
    if n == 0:
        raise MemberError(
            "This would leave the organisation with no owner who can sign in."
        )


async def _member_row(
    session: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID
) -> Any:
    """Resolve one STAFF member of this organisation, or raise LookupError.

    The role filter matters more here than in _MEMBER_ROWS. This is what
    resend_member_invitation, change_member and revoke_member resolve their
    target through, so hiding crowd resources from the list alone would still
    leave a crafted request able to revoke one — taking their grant without
    updating crowd_worker.status, which is what set_worker_status exists to keep
    in step (modules/network/service.py). Offboarding stays that route's job.
    """
    row = (
        await session.execute(
            text(
                "SELECT g.id AS grant_id, g.scope, g.role_id, u.full_name, u.status "
                "FROM user_role_grant g "
                "JOIN app_user u ON u.id = g.user_id "
                "JOIN role r     ON r.id = g.role_id "
                "WHERE g.org_id = :org AND g.user_id = :uid AND g.revoked_at IS NULL "
                "  AND r.applies_to_kind IS NOT NULL"
            ),
            {"org": org_id, "uid": user_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("not a member of this organisation")
    return row


def _guard(claims: AccessClaims, target_scope: str, new_scope: str | None = None) -> None:
    if not members.may_manage(claims.scope, target_scope, new_scope):
        raise MemberError(members.describe_refusal(claims.scope, target_scope, new_scope))


async def _send_member_invitation(
    email: str, full_name: str, org_name: str, inviter: str, raw_token: str
) -> None:
    """Best-effort, exactly as the worker and onboarding invitations are: the
    grant exists either way and the invitation can be re-sent, so a dead SMTP
    must not roll back the change."""
    from sourcehub.platform.mail.smtp import send_mail

    link = f"{settings.app_base_url}/accept-invitation?token={raw_token}"
    try:
        await send_mail(
            email,
            f"You're invited to {PRODUCT} — {org_name}",
            f"Hello {full_name},\n\n"
            f"{inviter} has added you to {org_name} on {PRODUCT}. Set your password\n"
            f"within {settings.invitation_ttl_days} days and sign in with this email\n"
            f"address:\n\n  {link}\n\n"
            f"No one at {PRODUCT} knows this link's token or your future password.",
        )
    except OSError:
        pass


async def invite_member(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    email: str,
    full_name: str,
    role_code: str,
    scope: str,
) -> dict[str, Any]:
    """Add a colleague, or say plainly why not.

    An earlier version of this returned success whatever happened, to avoid
    confirming whether an address had an account here. That silence cost more
    than it bought: inviting somebody who already had an account — which
    app_user.email being unique platform-wide (db/010_identity.sql:193) makes a
    normal thing to attempt — reported "Invitation sent", created nothing and
    sent no mail, with no way for the person inviting to find out why.

    So it now refuses out loud. The wording says only that the address is in
    use, never which organisation holds it: existence is a small leak and
    unavoidable if the message is to be useful at all, but WHICH organisation
    someone belongs to is cross-tenant membership data, and an invite form that
    reported it would be a directory of every rival's staff, one address at a
    time. db/160_email_is_taken.sql's header makes the same distinction, and
    onboarding already words it this way (modules/onboarding/service.py:136).
    """
    _guard(claims, "member", scope)

    # Checked before the write, as approve_onboarding_request does
    # (onboarding/service.py:130): a unique violation surfacing from inside
    # invite_member cannot be told apart from a real fault, and used to be
    # swallowed as success. email_is_taken runs above RLS because
    # app_user_select hides anyone without a live grant in the caller's org —
    # which is exactly who this clashes with.
    prior = (
        await session.execute(
            text("SELECT * FROM org_member_by_email(CAST(:email AS citext))"),
            {"email": email},
        )
    ).mappings().one_or_none()
    if prior is None:
        # Not ours, past or present. If the address exists at all, it belongs to
        # somebody else's organisation and cannot be reused.
        taken = (
            await session.execute(text("SELECT email_is_taken(:e)"), {"e": email})
        ).scalar_one()
        if taken:
            raise MemberError(
                "That email already belongs to someone on the platform. "
                "Ask them to use a different address, or contact platform operations."
            )

    raw, digest = new_opaque_token()
    try:
        row = (
            await session.execute(
                text(
                    "SELECT * FROM invite_member(CAST(:email AS citext), :name, :role, "
                    "CAST(:scope AS grant_scope), :thash, make_interval(days => :ttl))"
                ),
                {
                    "email": email,
                    "name": full_name,
                    "role": role_code,
                    "scope": scope,
                    "thash": digest,
                    "ttl": settings.invitation_ttl_days,
                },
            )
        ).mappings().one()
    except DBAPIError as e:
        msg = str(e.orig) if e.orig else str(e)
        # Every case named explicitly, and anything unrecognised re-raised. The
        # previous `return {"invited": True}` fallback meant a dropped
        # connection, or any constraint not thought of, reached the user as
        # "Invitation sent".
        if "cannot be granted" in msg:
            raise MemberError("That role cannot be granted in this organisation.") from None
        if "already a member of this organisation" in msg:
            raise MemberError(f"{email} is already in your organisation.") from None
        if "app_user_email_key" in msg:
            # The pre-check above passed and someone claimed the address first.
            raise MemberError(
                "That email already belongs to someone on the platform. "
                "Ask them to use a different address, or contact platform operations."
            ) from None
        raise

    await _assert_owner_reachable(session, claims.org_id)

    # Names embedded at write time. Once the granter's own grant is revoked,
    # app_user_select stops returning their row and a granted_by join renders
    # "-", so this string is the only durable answer to "who let them in".
    await audit.log(
        session,
        "member.invited",
        f"{claims.full_name} invited {full_name} <{email}> as {role_code}/{scope}",
        [row["user_id"], claims.org_id],
    )
    if row["invitation_sent"]:
        await _send_member_invitation(
            email, full_name, claims.org_name, claims.full_name, raw
        )
    # Honest now that refusals are: false means a rejoining colleague who
    # already has a password and needs no link, so the console can say which
    # happened instead of hedging.
    return {"invited": bool(row["invitation_sent"])}


async def resend_member_invitation(
    session: AsyncSession, claims: AccessClaims, user_id: uuid.UUID
) -> None:
    """Rotate the token in place so the old link dies, as
    network/service.py:427 does for a crowd resource."""
    row = await _member_row(session, claims.org_id, user_id)
    _guard(claims, row["scope"])
    if row["status"] == "active":
        raise MemberError("They have already set a password and can sign in.")

    raw, digest = new_opaque_token()
    updated = (
        await session.execute(
            text(
                "UPDATE invitation SET token_hash = :thash, "
                "       expires_at = now() + make_interval(days => :ttl), "
                "       invited_at = now(), invited_by = :me "
                " WHERE user_id = :uid AND org_id = :org "
                "   AND accepted_at IS NULL AND revoked_at IS NULL "
                "RETURNING email"
            ),
            {
                "thash": digest,
                "ttl": settings.invitation_ttl_days,
                "me": claims.user_id,
                "uid": user_id,
                "org": claims.org_id,
            },
        )
    ).mappings().one_or_none()
    if updated is None:
        raise MemberError("There is no open invitation for this person.")

    await audit.log(
        session,
        "member.invitation_resent",
        f"{claims.full_name} re-sent the invitation to {row['full_name']}",
        [user_id, claims.org_id],
    )
    await _send_member_invitation(
        updated["email"], row["full_name"], claims.org_name, claims.full_name, raw
    )


async def change_member(
    session: AsyncSession,
    claims: AccessClaims,
    user_id: uuid.UUID,
    *,
    role_code: str | None = None,
    scope: str | None = None,
) -> None:
    """Change a colleague's role, their scope, or both.

    A role change is revoke-then-insert inside this one transaction, because
    the live-grant index is keyed on (user_id, org_id): two live grants would
    make user_capabilities union both permission sets and leave the JWT role
    decided by a tie-break. The DEFERRED owner trigger is what makes that legal
    on a sole owner, since the owner count passes through zero between the two
    statements.
    """
    row = await _member_row(session, claims.org_id, user_id)
    _guard(claims, row["scope"], scope)

    new_scope = scope or row["scope"]
    if role_code is None:
        await session.execute(
            text(
                "UPDATE user_role_grant "
                "   SET scope = CAST(:scope AS grant_scope), updated_at = now() "
                " WHERE id = :gid"
            ),
            {"scope": new_scope, "gid": row["grant_id"]},
        )
    else:
        await session.execute(
            text(
                "UPDATE user_role_grant SET revoked_at = now(), revoked_by = :me "
                " WHERE id = :gid"
            ),
            {"me": claims.user_id, "gid": row["grant_id"]},
        )
        inserted = (
            await session.execute(
                text(
                    "INSERT INTO user_role_grant (user_id, org_id, role_id, scope, granted_by) "
                    "SELECT :uid, :org, r.id, CAST(:scope AS grant_scope), :me "
                    "FROM   role r, organisation o "
                    "WHERE  o.id = :org AND r.code = :role "
                    "  AND  ((r.is_system AND r.applies_to_kind = o.kind) "
                    "        OR (NOT r.is_system AND r.org_id = o.id)) "
                    "RETURNING id"
                ),
                {
                    "uid": user_id,
                    "org": claims.org_id,
                    "role": role_code,
                    "scope": new_scope,
                    "me": claims.user_id,
                },
            )
        ).scalar_one_or_none()
        # No row means the role did not fit this organisation's kind. The
        # SELECT simply matched nothing, so nothing raised — without this the
        # member would silently lose their grant and gain none.
        if inserted is None:
            raise MemberError("That role cannot be granted in this organisation.")

    await _assert_owner_reachable(session, claims.org_id)

    changed = []
    if role_code is not None:
        changed.append(f"role -> {role_code}")
    if scope is not None and scope != row["scope"]:
        changed.append(f"access {row['scope']} -> {scope}")
    await audit.log(
        session,
        "member.changed",
        f"{claims.full_name} changed {row['full_name']}: " + ", ".join(changed or ["no change"]),
        [user_id, claims.org_id],
    )


async def revoke_member(
    session: AsyncSession, claims: AccessClaims, user_id: uuid.UUID, reason: str
) -> None:
    """Remove a colleague's access to this organisation.

    Never deletes: revocation is a timestamp by design (db/020_rbac.sql:88), so
    the trail survives the removal. app_user.status is left alone because the
    person may hold a live grant in another organisation — the same reasoning
    set_worker_status uses when offboarding a crowd resource.
    """
    reason = (reason or "").strip()
    if not reason:
        raise MemberError("Give a reason - it is what the audit trail will show.")
    row = await _member_row(session, claims.org_id, user_id)
    _guard(claims, row["scope"])

    await session.execute(
        text(
            "UPDATE user_role_grant SET revoked_at = now(), revoked_by = :me WHERE id = :gid"
        ),
        {"me": claims.user_id, "gid": row["grant_id"]},
    )
    # An invitation they never accepted dies with the grant, or the link still
    # works and hands access back to someone who was just removed.
    await session.execute(
        text(
            "UPDATE invitation SET revoked_at = now() "
            " WHERE user_id = :uid AND org_id = :org "
            "   AND accepted_at IS NULL AND revoked_at IS NULL"
        ),
        {"uid": user_id, "org": claims.org_id},
    )
    await _assert_owner_reachable(session, claims.org_id)

    # RLS on user_session is user_id = current_user_id(), so an owner's UPDATE
    # matches zero rows SILENTLY. Without this, "removed" means "removed once
    # their access token expires".
    ended = (
        await session.execute(
            text("SELECT revoke_member_sessions(:uid)"), {"uid": user_id}
        )
    ).scalar_one()

    await audit.log(
        session,
        "member.revoked",
        f"{claims.full_name} removed {row['full_name']} ({row['scope']}): {reason} "
        f"[{ended} session(s) ended]",
        [user_id, claims.org_id],
    )
