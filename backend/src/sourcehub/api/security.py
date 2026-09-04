"""Token mechanics: JWT access tokens and hashed opaque refresh tokens.

The access token carries the RESOLVED capability set so the hot path never
re-queries RBAC. The set is re-resolved on every refresh, which bounds how long
a revoked grant stays live to the access-token TTL (15 minutes by default).

Refresh tokens are opaque random strings; only their sha256 ever touches the
database, so a dump of user_session yields nothing usable.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import secrets
import uuid
from dataclasses import dataclass

from jose import JWTError, jwt

from sourcehub.config import settings


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def new_opaque_token() -> tuple[str, str]:
    """Returns (raw, sha256). The raw value goes to the client and is never stored."""
    raw = secrets.token_urlsafe(48)
    return raw, hash_token(raw)


@dataclass(frozen=True, slots=True)
class AccessClaims:
    user_id: uuid.UUID
    full_name: str
    email: str
    org_id: uuid.UUID
    org_kind: str
    org_name: str
    role: str
    scope: str
    capabilities: frozenset[str]
    mfa_satisfied: bool
    must_change_password: bool


def issue_access_token(claims: AccessClaims) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": str(claims.user_id),
        "name": claims.full_name,
        "email": claims.email,
        "org": str(claims.org_id),
        "org_kind": claims.org_kind,
        "org_name": claims.org_name,
        "role": claims.role,
        "scope": claims.scope,
        "caps": sorted(claims.capabilities),
        "mfa": claims.mfa_satisfied,
        "mcp": claims.must_change_password,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + dt.timedelta(minutes=settings.access_token_ttl_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret.get_secret_value(), algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> AccessClaims:
    """Raises jose.JWTError on anything invalid — the caller maps that to 401."""
    payload = jwt.decode(token, settings.jwt_secret.get_secret_value(), algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "access":
        raise JWTError("not an access token")
    return AccessClaims(
        user_id=uuid.UUID(payload["sub"]),
        # .get: tokens issued before these claims existed must still decode
        full_name=payload.get("name", ""),
        email=payload.get("email", ""),
        org_id=uuid.UUID(payload["org"]),
        org_kind=payload["org_kind"],
        org_name=payload.get("org_name", ""),
        role=payload["role"],
        scope=payload.get("scope", "member"),
        capabilities=frozenset(payload.get("caps", [])),
        mfa_satisfied=bool(payload.get("mfa", False)),
        must_change_password=bool(payload.get("mcp", False)),
    )
