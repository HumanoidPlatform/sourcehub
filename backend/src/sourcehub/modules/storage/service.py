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
import re
import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
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


class StorageTargetInUseError(StorageTargetError):
    """A delete refused because a contract or a live request names the
    destination. A conflict with the data, not a bad request."""


def _refused(e: IntegrityError) -> RuntimeError:
    """An unexpected refusal of a write that carried the key, without the key.

    Re-raised as it is, an IntegrityError carries every bound parameter, the
    secret among them, into the 500's traceback and the logs. This keeps only
    the constraint's name, which is all anyone needs to find the cause. Raise
    it `from None`, so the original is not chained back on.
    """
    m = re.search(r'constraint "([^"]+)"', str(e.orig))
    return RuntimeError(f"storage_target write refused by {m.group(1) if m else 'the database'}")


# Everything a caller may see. `secret` is deliberately absent: leaving it out
# of the query is a stronger guarantee than stripping it from a dict later.
_COLUMNS = (
    "id, owner_org_id, label, provider, endpoint, region, bucket, key_prefix, "
    "verified_at, verify_error, created_at, updated_at"
)

# What each provider needs, and what the console must therefore ask for.
_REQUIRED_SECRET_KEYS: dict[str, tuple[str, ...]] = {
    "s3": ("access_key_id", "secret_access_key"),
    "gcs": ("service_account_json",),
    "azure_blob": ("account_name", "account_key"),
}

_PROVIDER_LABEL = {
    "s3": "S3-compatible storage",
    "gcs": "Google Cloud Storage",
    "azure_blob": "Azure Blob storage",
}

# The three the platform can actually sign for. storage_target_provider_supported
# says the same in db/370_gcs_destinations.sql; saying it here first is what
# makes a wrong provider a sentence rather than a constraint violation.
SUPPORTED_PROVIDERS = frozenset(_REQUIRED_SECRET_KEYS)


def _refs(codes: list[str], shown: int = 3) -> str:
    """'RFP-1011', 'RFP-1011 and RFP-1012', 'RFP-1011, RFP-1012, RFP-1013 and 2 more'."""
    if len(codes) <= 1:
        return "".join(codes)
    if len(codes) <= shown:
        return f"{', '.join(codes[:-1])} and {codes[-1]}"
    return f"{', '.join(codes[:shown])} and {len(codes) - shown} more"


def delete_problem(label: str, requests: list[str], contracts: list[str]) -> str | None:
    """Why this destination cannot be deleted, or None if nothing uses it.

    `requests` are the reference codes of requests that are neither cancelled
    nor deleted; `contracts` of every contract, whatever its status. It is the
    rule storage_target_delete_guard enforces (db/590). A contract stays a
    reason for ever: its captures are in this bucket and are signed from this
    key every time anyone opens them.
    """
    if contracts:
        return (
            f"{label} holds the captures for {_refs(contracts)}, so it cannot be deleted. "
            "If its key has changed, replace the key instead."
        )
    if requests:
        return (
            f"{label} is the destination of {_refs(requests)}, so it cannot be deleted. "
            "Choose another destination on a draft, or cancel the RFP, first."
        )
    return None


def _clean_prefix(prefix: str | None) -> str:
    """'' or something ending in exactly one slash — the check constraint's shape."""
    p = (prefix or "").strip().strip("/")
    return f"{p}/" if p else ""


# storage_target_prefix_shape in db/035_storage.sql, said first: a folder the
# constraint refuses passed the probe and then failed the INSERT as a 500.
_PREFIX_SHAPE = re.compile(r"[A-Za-z0-9._/-]+/")


def _check_secret(provider: str, secret: dict[str, Any]) -> None:
    required = _REQUIRED_SECRET_KEYS.get(provider)
    if required is None:
        raise StorageTargetError(f"Unknown storage provider {provider!r}.")
    missing = [k for k in required if not str(secret.get(k) or "").strip()]
    if missing:
        want = ", ".join(missing)
        raise StorageTargetError(f"{_PROVIDER_LABEL[provider]} needs {want}.")
    if provider == "gcs":
        _check_service_account(secret["service_account_json"])


def _check_service_account(raw: Any) -> None:
    """The key file a client uploads, checked for shape before any probe.

    The probe would refuse a wrong file too, but only as "could not be read";
    saying what is wrong with it is the difference between a client fixing it
    and a support ticket. The key itself is never echoed back.
    """
    if isinstance(raw, str):
        try:
            info = json.loads(raw)
        except json.JSONDecodeError:
            raise StorageTargetError(
                "The service account key is not valid JSON. Upload the .json key file "
                "Google gave you when you created the key."
            ) from None
    else:
        info = raw
    if not isinstance(info, dict) or info.get("type") != "service_account":
        raise StorageTargetError(
            "That is not a service account key. In Google Cloud, open IAM & Admin → "
            "Service accounts → your account → Keys → Add key → JSON."
        )
    if not info.get("client_email") or not info.get("private_key"):
        raise StorageTargetError(
            "The service account key is missing its client_email or private_key."
        )


def _target_from_row(row: dict[str, Any]) -> StorageTarget:
    return StorageTarget(
        provider=row["provider"],
        bucket=row["bucket"],
        # NULL on Azure and GCS — neither signs for a region. On S3 it is what
        # keeps signing off the network; see db/035_storage.sql.
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

async def _usage(
    session: AsyncSession, ids: list[uuid.UUID]
) -> dict[uuid.UUID, dict[str, list[dict[str, Any]]]]:
    """What names each destination: requests that are neither cancelled nor
    deleted, and every contract, newest first.

    A request whose contract names the same destination is listed as the
    contract, not twice; with that, the two lists are exactly what
    storage_target_delete_guard (db/590) counts. Read under the caller's row
    policy, which shows a client its own requests and contracts: the only ones
    that can name its destinations, since request_storage_target_guard refuses
    a request naming another client's.
    """
    out: dict[uuid.UUID, dict[str, list[dict[str, Any]]]] = {
        i: {"requests": [], "contracts": []} for i in ids
    }
    if not ids:
        return out
    rows = (
        await session.execute(
            text(
                "SELECT r.storage_target_id AS target_id, 'requests' AS kind, r.id, "
                "       r.reference_code, r.title, r.status::text AS status, r.created_at "
                "  FROM request r "
                " WHERE r.storage_target_id = ANY(:ids) "
                "   AND r.deleted_at IS NULL AND r.status <> 'cancelled' "
                "   AND NOT EXISTS (SELECT 1 FROM contract c WHERE c.request_id = r.id "
                "                     AND c.storage_target_id = r.storage_target_id) "
                "UNION ALL "
                "SELECT c.storage_target_id, 'contracts', c.id, "
                "       c.reference_code, r.title, c.status::text, c.created_at "
                "  FROM contract c LEFT JOIN request r ON r.id = c.request_id "
                " WHERE c.storage_target_id = ANY(:ids) "
                "ORDER BY created_at DESC"
            ),
            {"ids": ids},
        )
    ).mappings().all()
    for r in rows:
        out[r["target_id"]][r["kind"]].append(
            {"id": r["id"], "reference_code": r["reference_code"],
             "title": r["title"], "status": r["status"]}
        )
    return out


async def list_targets(session: AsyncSession, claims: AccessClaims) -> list[dict[str, Any]]:
    """The client's destinations, each with what uses it and whether it may
    be deleted, which the Organisation profile's Delivery storage section
    shows beside it."""
    rows = [
        dict(r)
        for r in (
            await session.execute(
                text(
                    f"SELECT {_COLUMNS} FROM storage_target "
                    "WHERE deleted_at IS NULL ORDER BY lower(label)"
                )
            )
        ).mappings().all()
    ]
    usage = await _usage(session, [r["id"] for r in rows])
    for r in rows:
        used = usage[r["id"]]
        r["used_by"] = used
        r["can_delete"] = not used["requests"] and not used["contracts"]
    return rows


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


def _label_taken(label: str) -> StorageTargetError:
    return StorageTargetError(
        f"You already have a destination called {label}. Give this one another name."
    )


async def _assert_label_free(
    session: AsyncSession, org_id: uuid.UUID, label: str, except_id: uuid.UUID | None = None
) -> None:
    """storage_target_label_key, said first. Unchecked, a second destination
    with a name already in use reached the unique index and came back as a
    500."""
    clash = (
        await session.execute(
            text(
                "SELECT 1 FROM storage_target "
                "WHERE owner_org_id = :org AND lower(label) = lower(:label) "
                "AND deleted_at IS NULL AND id IS DISTINCT FROM :id"
            ),
            {"org": org_id, "label": label, "id": except_id},
        )
    ).first()
    if clash is not None:
        raise _label_taken(label)


async def hold_for_request(session: AsyncSession, target_id: uuid.UUID) -> None:
    """A request is about to name this destination: refuse if it is gone or
    not the caller's, and share-lock it until the request is saved.

    The lock is what orders a save against a delete of the same destination.
    The delete takes the row first and the save waits, then finds it deleted;
    or the save does and the delete waits, then finds the request naming it.
    request_storage_target_guard (db/590) does the same in the database; this
    is the half that answers in words rather than with a failed statement.
    """
    row = (
        await session.execute(
            text(
                "SELECT id FROM storage_target "
                "WHERE id = :id AND deleted_at IS NULL FOR SHARE"
            ),
            {"id": target_id},
        )
    ).first()
    if row is None:
        raise StorageTargetError(
            "That delivery destination no longer exists. Choose another."
        )


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
            "A delivery destination must be S3-compatible storage, Google Cloud Storage "
            "or Azure Blob."
        )
    _check_secret(provider, secret)
    prefix = _clean_prefix(key_prefix)
    if prefix and not _PREFIX_SHAPE.fullmatch(prefix):
        raise StorageTargetError(
            "A folder may use only letters, digits, dots, dashes, underscores and "
            "slashes, for example captures/2026/."
        )
    # Before the probe: a name clash is known without touching the bucket.
    await _assert_label_free(session, claims.org_id, label)

    probe = StorageTarget(
        provider=provider, bucket=bucket, secret=secret,
        endpoint=(endpoint or None), region=(region or None), key_prefix=prefix,
    )
    try:
        await storage.verify(probe)
    except StorageError as e:
        raise StorageTargetError(str(e)) from None

    try:
        row = (
            await session.execute(
                text(
                    "INSERT INTO storage_target "
                    "  (owner_org_id, label, provider, endpoint, region, bucket, key_prefix, "
                    "   secret, verified_at, created_by, updated_by) "
                    "VALUES (:org, :label, CAST(:provider AS storage_provider), :endpoint, "
                    "        :region, :bucket, :prefix, CAST(:secret AS jsonb), now(), :who, :who) "
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
    except IntegrityError as e:
        # The same name saved from another tab while this one was probing.
        if "storage_target_label_key" in str(e):
            raise _label_taken(label) from None
        raise _refused(e) from None

    await audit.log(
        session, "storage.target.created",
        f"Delivery destination {label} added ({_PROVIDER_LABEL[provider]}, {bucket})",
        scope=[claims.org_id],
    )
    return dict(row)


async def _same_azure_account(
    session: AsyncSession, target_id: uuid.UUID, secret: dict[str, Any]
) -> dict[str, Any]:
    """An Azure key is replaced for the same storage account, never another.

    The account name is part of where the files are: a container of the same
    name in another account is somewhere else, and every capture already
    written would be signed against the wrong host. A replacement may leave the
    name out, and the stored one is kept. Only the name is read, never the key.
    """
    stored = (
        await session.execute(
            text("SELECT secret->>'account_name' FROM storage_target WHERE id = :id"),
            {"id": target_id},
        )
    ).scalar_one_or_none()
    given = str(secret.get("account_name") or "").strip()
    if given and stored and given.lower() != stored.lower():
        raise StorageTargetError(
            "A new key must be for the same storage account. To deliver to another "
            "account, add a new destination."
        )
    return {**secret, "account_name": given or stored or ""}


async def update_target(
    session: AsyncSession,
    claims: AccessClaims,
    target_id: uuid.UUID,
    *,
    label: str | None = None,
    secret: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Rename, or replace the key.

    Location is not editable. Once a contract has been awarded against a
    destination, moving the bucket would strand every asset already written to
    it, since the asset rows point at this id rather than carrying a copy.

    A new key is probed against the same bucket before it is kept, and passing
    marks the destination reachable again: it is how a client recovers one
    whose key was rotated or revoked, contracts and all.
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

    renamed = False
    if label is not None:
        label = label.strip()
        if not label:
            raise StorageTargetError("Give this destination a name you will recognise later.")
        if label != current["label"]:
            await _assert_label_free(session, claims.org_id, label, except_id=target_id)
            sets.append("label = :label")
            params["label"] = label
            renamed = True

    if secret is not None:
        if current["provider"] == "azure_blob":
            secret = await _same_azure_account(session, target_id, secret)
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
    try:
        row = (
            await session.execute(
                text(
                    f"UPDATE storage_target SET {assignments} "
                    f"WHERE id = :id AND deleted_at IS NULL RETURNING {_COLUMNS}"
                ),
                params,
            )
        ).mappings().one_or_none()
    except IntegrityError as e:
        if renamed and "storage_target_label_key" in str(e):
            raise _label_taken(params["label"]) from None
        raise _refused(e) from None
    if row is None:
        # Deleted from another tab while this was probing the new key.
        raise LookupError("storage target not found")

    if renamed:
        await audit.log(
            session, "storage.target.renamed",
            f"Delivery destination {current['label']} renamed to {row['label']}",
            scope=[claims.org_id],
        )
    if secret is not None:
        await audit.log(
            session, "storage.target.rotated",
            f"Credential rotated for delivery destination {row['label']}",
            scope=[claims.org_id],
        )
    return dict(row)


async def delete_target(
    session: AsyncSession, claims: AccessClaims, target_id: uuid.UUID
) -> None:
    """Delete a destination that nothing uses, wiping its key.

    Only while no contract and no live request names it (delete_problem, and
    storage_target_delete_guard in db/590 says the same). A destination that
    has been used stays: its captures are signed from it. The client can
    replace its key, or revoke the key at their provider once they no longer
    need the files.

    The row is locked first. A request saved at the same moment either names
    the destination before this reads what uses it, and the delete is
    refused, or waits for the delete and finds it gone (hold_for_request).
    """
    row = (
        await session.execute(
            text(
                "SELECT id, label, provider, bucket FROM storage_target "
                "WHERE id = :id AND deleted_at IS NULL FOR UPDATE"
            ),
            {"id": target_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("storage target not found")

    used = (await _usage(session, [target_id]))[target_id]
    problem = delete_problem(
        row["label"],
        [u["reference_code"] for u in used["requests"]],
        [u["reference_code"] for u in used["contracts"]],
    )
    if problem:
        raise StorageTargetInUseError(problem)

    # The key goes in the same statement as the row: storage_target_deleted_wiped
    # (db/590) refuses a deleted destination that still holds one.
    try:
        await session.execute(
            text(
                "UPDATE storage_target SET deleted_at = now(), secret = '{}'::jsonb, "
                "verified_at = NULL, verify_error = NULL, updated_by = :who "
                "WHERE id = :id"
            ),
            {"id": target_id, "who": claims.user_id},
        )
    except IntegrityError:
        # storage_target_delete_guard saw a use this caller's row policy hides:
        # a request another client saved before db/590 could refuse one.
        raise StorageTargetInUseError(
            f"{row['label']} is in use, so it cannot be deleted."
        ) from None
    await audit.log(
        session, "storage.target.deleted",
        f"Delivery destination {row['label']} deleted "
        f"({_PROVIDER_LABEL.get(row['provider'], row['provider'])}, {row['bucket']}); "
        "its key was wiped",
        scope=[claims.org_id],
    )


async def verify_target(
    session: AsyncSession, claims: AccessClaims, target_id: uuid.UUID
) -> dict[str, Any]:
    """Re-probe a destination and record the outcome, pass or fail.

    Worth doing before publishing and again at award. Nothing re-checks on a
    schedule — this deployment drains no queues — so a credential revoked
    mid-contract is found by the next upload.

    A failed probe is an answer, not an error, so it is returned rather than
    raised: verified_at cleared and verify_error saying why. Raised, the
    request's transaction rolled the record back with it, and a destination
    that had just failed its test still read as reachable everywhere.
    Publishing and awarding then refuse it (assert_usable) until a test
    passes or a new key does.
    """
    row = (
        await session.execute(
            text(
                "SELECT id, provider, endpoint, region, bucket, key_prefix, secret, "
                "       md5(secret::text) AS probed "
                "FROM storage_target WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": target_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("storage target not found")

    # The result is recorded against the key that was tested, and only on a
    # destination that still exists. A key replaced while the probe ran keeps
    # what its own test said (update_target marks it reachable), and one
    # deleted meanwhile answers 404 from get_target. The key is matched by its
    # hash, so it never travels as a bound parameter.
    outcome = {"id": target_id, "probed": row["probed"]}
    try:
        await storage.verify(_target_from_row(dict(row)))
    except StorageError as e:
        await session.execute(
            text(
                "UPDATE storage_target SET verified_at = NULL, verify_error = :why "
                "WHERE id = :id AND deleted_at IS NULL AND md5(secret::text) = :probed"
            ),
            {**outcome, "why": str(e)[:500]},
        )
        return await get_target(session, target_id)

    await session.execute(
        text(
            "UPDATE storage_target SET verified_at = now(), verify_error = NULL "
            "WHERE id = :id AND deleted_at IS NULL AND md5(secret::text) = :probed"
        ),
        outcome,
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
