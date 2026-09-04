from __future__ import annotations

import datetime as dt
import hashlib
import secrets
import uuid
from dataclasses import dataclass

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from jose import JWTError, jwt

from cosaarthi_mobile.config import settings

_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)


@dataclass(frozen=True, slots=True)
class AccessPrincipal:
    user_id: uuid.UUID
    permissions: frozenset[str]
    persona: str | None = None


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, plain)
    except VerificationError:
        return False


def new_refresh_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(48)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def issue_access_token(
    user_id: uuid.UUID,
    permissions: set[str],
    persona: str | None = None,
) -> tuple[str, dt.datetime]:
    now = dt.datetime.now(dt.UTC)
    expires_at = now + dt.timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        "sub": str(user_id),
        "permissions": sorted(permissions),
        "persona": persona,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret.get_secret_value(), algorithm="HS256")
    return token, expires_at


def decode_access_token(token: str) -> AccessPrincipal:
    payload = jwt.decode(token, settings.jwt_secret.get_secret_value(), algorithms=["HS256"])
    if payload.get("type") != "access":
        raise JWTError("not an access token")
    return AccessPrincipal(
        user_id=uuid.UUID(payload["sub"]),
        permissions=frozenset(payload.get("permissions", [])),
        persona=payload.get("persona") if isinstance(payload.get("persona"), str) else None,
    )
