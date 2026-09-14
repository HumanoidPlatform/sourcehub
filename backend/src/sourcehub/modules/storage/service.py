"""storage — where a client's captured data is delivered.

Business rules, and the ONLY public surface of this module.

A destination is named while the request is a draft, probed before it may be
used, and pinned to the contract at award. Captures for that contract are then
written to the client's own bucket; SourceHub holds the credential and signs
every URL, so the phone and the console never see it.

The credential is stored as given — nothing here encrypts it. Two rules follow,
and both are load-bearing: `secret` is never in the SELECT list of a read that
feeds a response (see _COLUMNS), and it never reaches a log line or an error
message (adapters raise StorageError with provider-shaped text only).
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.audit import service as audit

# Imported for its side effect, not its name: this registers storage_target in
# the shared MetaData. Every service below speaks raw SQL, so without this the
# table is never declared, and the FIRST thing to break is not a query here but
# an ORM flush anywhere else — SQLAlchemy sorts tables by foreign key on every
# flush, and request.storage_target_id then has nothing to point at.
from sourcehub.modules.storage import models as _models  # noqa: F401
from sourcehub.platform import storage
from sourcehub.platform.storage import StorageError, StorageTarget


class StorageTargetError(Exception):
    pass


# Everything a caller may see. `secret` is deliberately absent: leaving it out
# of the query is a stronger guarantee than stripping it from a dict later.
_COLUMNS = (
    "id, owner_org_id, label, provider, endpoint, region, bucket, key_prefix, "
    "verified_at, verify_error, created_at, updated_at"
)

# What each provider needs, and what the console must therefore ask for.
_REQUIRED_SECRET_KEYS: dict[str, tuple[str, ...]] = {
    "s3": ("access_key_id", "secret_access_key"),
    "azure_blob": ("account_name", "account_key"),
}

_PROVIDER_LABEL = {
    "s3": "S3-compatible storage",
    "azure_blob": "Azure Blob storage",
}

# The two the platform can actually sign for. storage_target_provider_supported
# says the same in db/035_storage.sql; saying it here first is what makes a
# wrong provider a sentence rather than a constraint violation.
SUPPORTED_PROVIDERS = frozenset(_REQUIRED_SECRET_KEYS)


def _clean_prefix(prefix: str | None) -> str:
    """'' or something ending in exactly one slash — the check constraint's shape."""
    p = (prefix or "").strip().strip("/")
    return f"{p}/" if p else ""


def _check_secret(provider: str, secret: dict[str, Any]) -> None:
    required = _REQUIRED_SECRET_KEYS.get(provider)
    if required is None:
        raise StorageTargetError(f"Unknown storage provider {provider!r}.")
    missing = [k for k in required if not str(secret.get(k) or "").strip()]
    if missing:
        want = ", ".join(missing)
        raise StorageTargetError(f"{_PROVIDER_LABEL[provider]} needs {want}.")


def _target_from_row(row: dict[str, Any]) -> StorageTarget:
    return StorageTarget(
        provider=row["provider"],
        bucket=row["bucket"],
        # NULL on Azure — a container has no region to sign for. On S3 it is
        # what keeps signing off the network; see db/035_storage.sql.
        region=row["region"],
        secret=row["secret"] or {},
        endpoint=row["endpoint"],
        key_prefix=row["key_prefix"] or "",
    )


# ---------------------------------------------------------------------------
# Resolution — used by media, never exposed
# ---------------------------------------------------------------------------

def platform_default() -> StorageTarget:
    """SourceHub's own bucket. Assets captured before destinations existed."""
    return storage.platform_target()


async def resolve_by_id(session: AsyncSession, target_id: uuid.UUID | None) -> StorageTarget:
    """The destination an asset was actually written to.

    Reads through a SECURITY DEFINER function because the caller is usually a
    worker, whose session cannot see storage_target at all.
    """
    if target_id is None:
        return platform_default()
    row = (
        await session.execute(
            text("SELECT * FROM storage_destination_by_id(:t)"), {"t": target_id}
        )
    ).mappings().one_or_none()
    if row is None or row["id"] is None:
        raise StorageTargetError("The destination for this file is no longer configured.")
    return _target_from_row(dict(row))


async def resolve_for_contract(
    session: AsyncSession, contract_id: uuid.UUID
) -> tuple[StorageTarget, uuid.UUID | None]:
    """Where new captures on this contract go, and the id to stamp on them.

    (platform_default(), None) for contracts awarded before destinations
    existed — the fallback is what keeps old contracts uploadable.
    """
    row = (
        await session.execute(
            text("SELECT * FROM storage_destination_for_contract(:c)"), {"c": contract_id}
        )
    ).mappings().one_or_none()
    if row is None or row["id"] is None:
        return platform_default(), None
    return _target_from_row(dict(row)), row["id"]


# ---------------------------------------------------------------------------
# The client's own destinations
# ---------------------------------------------------------------------------

async def list_targets(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                f"SELECT {_COLUMNS} FROM storage_target "
                "WHERE deleted_at IS NULL ORDER BY lower(label)"
            )
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_target(session: AsyncSession, target_id: uuid.UUID) -> dict[str, Any]:
    row = (
        await session.execute(
            text(f"SELECT {_COLUMNS} FROM storage_target WHERE id = :id AND deleted_at IS NULL"),
            {"id": target_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("storage target not found")
    return dict(row)


async def create_target(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    label: str,
    provider: str,
    bucket: str,
    secret: dict[str, Any],
    endpoint: str | None = None,
    region: str | None = None,
    key_prefix: str | None = None,
) -> dict[str, Any]:
    """Probe the destination, then record it.

    Probed first, deliberately: an unusable destination should fail while the
    client is still looking at the form, not when a worker is standing in a
    street with a capture that will never upload.
    """
    label = (label or "").strip()
    bucket = (bucket or "").strip()
    if not label:
        raise StorageTargetError("Give this destination a name you will recognise later.")
    if not bucket:
        raise StorageTargetError("Name the bucket or container to write to.")
    if provider not in SUPPORTED_PROVIDERS:
        raise StorageTargetError(
            "A delivery destination must be S3-compatible storage or Azure Blob."
        )
    _check_secret(provider, secret)
    prefix = _clean_prefix(key_prefix)

    probe = StorageTarget(
        provider=provider, bucket=bucket, secret=secret,
        endpoint=(endpoint or None), region=(region or None), key_prefix=prefix,
    )
    try:
        await storage.verify(probe)
    except StorageError as e:
        raise StorageTargetError(str(e)) from None

    row = (
        await session.execute(
            text(
                "INSERT INTO storage_target "
                "  (owner_org_id, label, provider, endpoint, region, bucket, key_prefix, "
                "   secret, verified_at, created_by, updated_by) "
                "VALUES (:org, :label, CAST(:provider AS storage_provider), :endpoint, :region, "
                "        :bucket, :prefix, CAST(:secret AS jsonb), now(), :who, :who) "
                f"RETURNING {_COLUMNS}"
            ),
            {
                "org": claims.org_id, "label": label, "provider": provider,
                "endpoint": endpoint or None, "region": region or None,
                "bucket": bucket, "prefix": prefix,
                "secret": json.dumps(secret), "who": claims.user_id,
            },
        )
    ).mappings().one()

    await audit.log(
        session, "storage.target.created",
        f"Delivery destination {label} added ({_PROVIDER_LABEL[provider]}, {bucket})",
        scope=[claims.org_id],
    )
    return dict(row)


async def update_target(
    session: AsyncSession,
    claims: AccessClaims,
    target_id: uuid.UUID,
    *,
    label: str | None = None,
    secret: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Rename, or rotate the credential.

    Location is not editable. Once a contract has been awarded against a
    destination, moving the bucket would strand every asset already written to
    it, since the asset rows point at this id rather than carrying a copy.
    """
    current = (
        await session.execute(
            text(
                "SELECT id, label, provider, endpoint, region, bucket, key_prefix "
                "FROM storage_target WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": target_id},
        )
    ).mappings().one_or_none()
    if current is None:
        raise LookupError("storage target not found")

    sets: list[str] = []
    params: dict[str, Any] = {"id": target_id, "who": claims.user_id}

    if label is not None:
        label = label.strip()
        if not label:
            raise StorageTargetError("Give this destination a name you will recognise later.")
        sets.append("label = :label")
        params["label"] = label

    if secret is not None:
        _check_secret(current["provider"], secret)
        probe = StorageTarget(
            provider=current["provider"], bucket=current["bucket"], secret=secret,
            endpoint=current["endpoint"], region=current["region"],
            key_prefix=current["key_prefix"] or "",
        )
        try:
            await storage.verify(probe)
        except StorageError as e:
            raise StorageTargetError(str(e)) from None
        sets.append("secret = CAST(:secret AS jsonb)")
        sets.append("verified_at = now()")
        sets.append("verify_error = NULL")
        params["secret"] = json.dumps(secret)

    if not sets:
        return await get_target(session, target_id)

    sets.append("updated_by = :who")
    assignments = ", ".join(sets)
    row = (
        await session.execute(
            text(
                f"UPDATE storage_target SET {assignments} "
                f"WHERE id = :id AND deleted_at IS NULL RETURNING {_COLUMNS}"
            ),
            params,
        )
    ).mappings().one()

    if secret is not None:
        await audit.log(
            session, "storage.target.rotated",
            f"Credential rotated for delivery destination {row['label']}",
            scope=[claims.org_id],
        )
    return dict(row)


async def verify_target(
    session: AsyncSession, claims: AccessClaims, target_id: uuid.UUID
) -> dict[str, Any]:
    """Re-probe a destination and record the outcome.

    Worth doing before publishing and again at award. Nothing re-checks on a
    schedule — this deployment drains no queues — so a credential revoked
    mid-contract is found by the next upload.
    """
    row = (
        await session.execute(
            text(
                "SELECT id, provider, endpoint, region, bucket, key_prefix, secret "
                "FROM storage_target WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": target_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("storage target not found")

    try:
        await storage.verify(_target_from_row(dict(row)))
    except StorageError as e:
        await session.execute(
            text(
                "UPDATE storage_target SET verified_at = NULL, verify_error = :why "
                "WHERE id = :id"
            ),
            {"id": target_id, "why": str(e)[:500]},
        )
        raise StorageTargetError(str(e)) from None

    await session.execute(
        text("UPDATE storage_target SET verified_at = now(), verify_error = NULL WHERE id = :id"),
        {"id": target_id},
    )
    return await get_target(session, target_id)


async def assert_usable(session: AsyncSession, target_id: uuid.UUID | None) -> None:
    """Gate publishing and awarding on a destination that has actually worked."""
    if target_id is None:
        raise StorageTargetError("Choose where captured data should be delivered.")
    row = (
        await session.execute(
            text(
                "SELECT label, verified_at FROM storage_target "
                "WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": target_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise StorageTargetError("That delivery destination no longer exists.")
    if row["verified_at"] is None:
        raise StorageTargetError(f"Test the connection to {row['label']} before using it.")
