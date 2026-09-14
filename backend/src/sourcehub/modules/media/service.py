"""media — captured assets: presign, confirm, list, view.

Business rules, and the ONLY public surface of this module.

The bytes never traverse the API. A worker asks for a presigned PUT, uploads
straight to object storage, then confirms; the API HEADs the object and
records what storage actually holds (size, etag, content type) rather than
what the client claimed. That is the whole of the pilot's ingest: no worker
pool, no thumbnails, no automated checks yet. The asset_status value
'uploaded' is reserved for the day verification becomes asynchronous.

No ORM model, on purpose. asset is partitioned with a composite primary key
(id, created_at); every statement here is written by hand, exactly as audit
treats the partitioned audit_event. Inserts carry no RETURNING: under RLS a
RETURNING row must also pass the SELECT policy, and a plain INSERT needs only
the WITH CHECK.

Two idempotency rules the phone relies on:
  * presign is keyed on (assignment, sha256): the same file asked for twice
    gets the same asset row and a fresh URL, so an expired URL costs nothing;
  * confirm on a ready asset returns it unchanged, so a retry after a lost
    response is harmless.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.config import settings


class MediaError(Exception):
    """A rule of the flow was broken (409)."""


class MediaInvalid(Exception):
    """The request itself is not acceptable (422)."""


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov"}
MAX_IMAGE_BYTES = 25 * 1024 * 1024
MAX_VIDEO_BYTES = 100 * 1024 * 1024
MAX_ASSETS_PER_ASSIGNMENT = 500

_SHA256 = re.compile(r"^[0-9a-f]{64}$")

_ASSET_COLUMNS = (
    "a.id, a.task_id, a.assignment_id, a.submission_id, a.captured_by_user_id, "
    "coalesce(w.display_name, u.full_name) AS captured_by_name, "
    "a.filename, a.mime_type, a.size_bytes, a.sha256, a.etag, a.status, a.quarantine_reason, "
    "a.captured_at, a.captured_lat, a.captured_lon, a.uploaded_at, a.created_at "
)
_ASSET_FROM = (
    "FROM asset a "
    "LEFT JOIN crowd_worker w ON w.user_id = a.captured_by_user_id "
    "LEFT JOIN app_user u ON u.id = a.captured_by_user_id "
)


def _safe_filename(name: str) -> tuple[str, str]:
    """(safe basename, 'image' | 'video'). Content-type is advisory; the
    extension is what we gate on — the same rule marketplace applies to
    request samples."""
    name = name.replace("\\", "/").rsplit("/", 1)[-1]
    name = "".join(c for c in name if c.isprintable() and c not in '<>:"|?*').strip()
    if len(name) > 200:
        stem, _, ext = name.rpartition(".")
        name = stem[: 200 - len(ext) - 1] + "." + ext if ext else name[:200]
    if not name or "." not in name:
        raise MediaInvalid("Captures need a real filename with an extension.")
    ext = "." + name.rsplit(".", 1)[-1].lower()
    if ext in IMAGE_EXTENSIONS:
        return name, "image"
    if ext in VIDEO_EXTENSIONS:
        return name, "video"
    raise MediaInvalid(f"Captures of type {ext} are not accepted.")


def _asset_dict(r: Any) -> dict[str, Any]:
    return {
        "id": r["id"],
        "task_id": r["task_id"],
        "assignment_id": r["assignment_id"],
        "submission_id": r["submission_id"],
        "captured_by_user_id": r["captured_by_user_id"],
        "captured_by_name": r["captured_by_name"],
        "filename": r["filename"],
        "mime_type": r["mime_type"],
        "size_bytes": r["size_bytes"],
        "sha256": r["sha256"],
        "etag": r["etag"],
        "status": r["status"],
        "quarantine_reason": r["quarantine_reason"],
        "captured_at": r["captured_at"],
        "captured_lat": r["captured_lat"],
        "captured_lon": r["captured_lon"],
        "uploaded_at": r["uploaded_at"],
        "created_at": r["created_at"],
    }


async def _get_asset(session: AsyncSession, asset_id: uuid.UUID) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT " + _ASSET_COLUMNS + _ASSET_FROM + "WHERE a.id = :id AND a.deleted_at IS NULL"),
            {"id": asset_id},
        )
    ).mappings().one_or_none()
    return _asset_dict(row) if row else None


def _allowed_kinds(capture_spec: dict[str, Any] | None, target_unit: str | None) -> set[str]:
    """What this task will accept.

    capture_spec.media is the explicit answer where one was set. Where it was
    not, the unit the task was written in is the answer: a task for "2 photos"
    is not satisfied by a video, and letting one through means the aggregator
    reviews it and the client is billed for it.

    media arrives as a LIST now that a task inherits the client's capture spec
    (delivery.create_task) — the request builder has always stored it as one.
    A scalar is still accepted because tasks created before that inheritance
    carry the older shape, and a stored value never migrates itself.

    Anything unrecognised falls through to the unit rather than narrowing to
    nothing. An empty set would reject every upload a worker could possibly
    make, and they would find out standing in a shop.
    """
    raw = (capture_spec or {}).get("media")
    media = [raw] if isinstance(raw, str) else list(raw or [])

    kinds: set[str] = set()
    for m in media:
        m = str(m).strip().lower()
        if m == "both":
            kinds |= {"image", "video"}
        elif m.startswith(("photo", "image")):
            kinds.add("image")
        elif m.startswith(("video", "clip")):
            kinds.add("video")
    if kinds:
        return kinds

    unit = (target_unit or "").lower()
    if unit.startswith(("photo", "image")):
        return {"image"}
    if unit.startswith(("video", "clip")):
        return {"video"}
    return {"image", "video"}


async def _assignment_for_upload(
    session: AsyncSession, claims: AccessClaims, assignment_id: uuid.UUID
) -> dict[str, Any]:
    a = (
        await session.execute(
            text(
                "SELECT ta.id, ta.task_id, ta.contract_id, ta.supplier_org_id, "
                "       ta.worker_user_id, ta.status, ta.quantity, "
                "       t.target_unit, t.capture_spec "
                "FROM task_assignment ta JOIN task t ON t.id = ta.task_id "
                "WHERE ta.id = :a"
            ),
            {"a": assignment_id},
        )
    ).mappings().one_or_none()
    if a is None or a["worker_user_id"] != claims.user_id:
        raise LookupError("assignment not found")
    if a["status"] in ("assigned", "rejected"):
        raise MediaError("Start the assignment before uploading.")
    if a["status"] != "in_progress":
        raise MediaError(f"A {a['status']} assignment cannot take uploads.")
    return dict(a)


def _to_numeric(v: float | None) -> Decimal | None:
    return None if v is None else Decimal(str(round(v, 6)))


async def presign_capture(
    session: AsyncSession,
    claims: AccessClaims,
    assignment_id: uuid.UUID,
    *,
    filename: str,
    content_type: str,
    size_bytes: int,
    sha256: str,
    captured_at: dt.datetime,
    lat: float | None,
    lon: float | None,
) -> dict[str, Any]:
    """Record the manifest and mint a one-object upload URL.

    The key is server-generated under the contract, task and assignment so a
    device can never choose where bytes land. The row is inserted as
    'pending' before the URL is handed out; confirm() turns it 'ready' once
    storage confirms the bytes.
    """
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    a = await _assignment_for_upload(session, claims, assignment_id)

    sha = sha256.lower()
    if not _SHA256.match(sha):
        raise MediaInvalid("sha256 must be 64 hex characters.")
    safe, kind = _safe_filename(filename)
    allowed = _allowed_kinds(a.get("capture_spec"), a.get("target_unit"))
    if kind not in allowed:
        want = " or ".join(sorted(allowed))
        raise MediaInvalid(f"This task takes {want} captures; that file is a {kind}.")
    cap = MAX_VIDEO_BYTES if kind == "video" else MAX_IMAGE_BYTES
    if size_bytes <= 0 or size_bytes > cap:
        raise MediaInvalid(f"A {kind} capture is capped at {cap // (1024 * 1024)} MB.")
    if captured_at.tzinfo is None:
        captured_at = captured_at.replace(tzinfo=dt.timezone.utc)

    # Where this contract's client asked for delivery. Resolved through a
    # SECURITY DEFINER function: this runs in the worker's session, which
    # cannot read storage_target and should not be able to.
    target, target_id = await storage_svc.resolve_for_contract(session, a["contract_id"])

    # idempotent on (assignment, sha256): a retry or an expired URL reuses the row
    existing = (
        await session.execute(
            text(
                "SELECT id, status, storage_key FROM asset "
                "WHERE assignment_id = :a AND sha256 = :sha AND deleted_at IS NULL "
                "  AND status IN ('pending','uploaded','ready') "
                "ORDER BY created_at DESC LIMIT 1"
            ),
            {"a": assignment_id, "sha": sha},
        )
    ).mappings().one_or_none()
    if existing is not None:
        if existing["status"] == "ready":
            return {
                "asset_id": existing["id"], "storage_key": existing["storage_key"],
                "url": None, "method": "PUT", "headers": {}, "expires_in": 0,
                "status": "ready",
            }
        url, extra = await storage.presign_put(target, existing["storage_key"])
        return {
            "asset_id": existing["id"], "storage_key": existing["storage_key"],
            "url": url, "method": "PUT",
            "headers": {"Content-Type": content_type, **extra},
            "expires_in": settings.storage_presign_ttl_seconds, "status": existing["status"],
        }

    n = (
        await session.execute(
            text(
                "SELECT count(*) FROM asset WHERE assignment_id = :a "
                "AND deleted_at IS NULL AND status NOT IN ('rejected','erased')"
            ),
            {"a": assignment_id},
        )
    ).scalar_one()
    if n >= MAX_ASSETS_PER_ASSIGNMENT:
        raise MediaError(f"An assignment holds at most {MAX_ASSETS_PER_ASSIGNMENT} captures.")
    # The aggregator asked for a number of units and reviews every one of them.
    # Refusing here rather than at submit costs the worker a message instead of
    # an upload over a field connection.
    if a.get("quantity") and n >= a["quantity"]:
        raise MediaError(
            f"This assignment is for {a['quantity']} captures and already has {n}. "
            "Remove one before adding another."
        )

    asset_id = uuid.uuid4()
    # The client's prefix, then our layout. They browse this bucket themselves.
    key = target.key(
        f"captures/{a['contract_id']}/{a['task_id']}/{assignment_id}/{asset_id}/{safe}"
    )
    await session.execute(
        text(
            "INSERT INTO asset (id, task_id, assignment_id, captured_by_user_id, supplier_org_id, "
            "                   contract_id, storage_key, filename, mime_type, size_bytes, sha256, "
            "                   status, captured_at, captured_lat, captured_lon, metadata, "
            "                   storage_target_id) "
            "VALUES (:id, :task, :asg, :user, :org, :contract, :key, :name, :ct, :size, :sha, "
            "        'pending', :cat, :lat, :lon, CAST(:meta AS jsonb), :target)"
        ),
        {
            "id": asset_id, "task": a["task_id"], "asg": assignment_id, "user": claims.user_id,
            "org": a["supplier_org_id"], "contract": a["contract_id"], "key": key, "name": safe,
            "ct": content_type, "size": size_bytes, "sha": sha, "cat": captured_at,
            "lat": _to_numeric(lat), "lon": _to_numeric(lon),
            "meta": json.dumps({"claimed_size": size_bytes, "kind": kind}),
            "target": target_id,
        },
    )
    url, extra = await storage.presign_put(target, key)
    return {
        "asset_id": asset_id, "storage_key": key,
        "url": url, "method": "PUT",
        "headers": {"Content-Type": content_type, **extra},
        "expires_in": settings.storage_presign_ttl_seconds, "status": "pending",
    }


async def confirm_asset(
    session: AsyncSession, claims: AccessClaims, asset_id: uuid.UUID
) -> dict[str, Any]:
    """The device says it has finished; storage is asked whether that is true.

    A size mismatch quarantines the row and RETURNS it (HTTP 200) rather than
    raising: TxRoute skips the commit on an exception, and the quarantine
    marker is exactly the thing that must persist.
    """
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    row = (
        await session.execute(
            text(
                "SELECT id, assignment_id, storage_key, filename, size_bytes, status, "
                "       storage_target_id "
                "FROM asset WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": asset_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("asset not found")
    if row["status"] == "ready":
        return (await _get_asset(session, asset_id)) or {}
    if row["status"] != "pending":
        raise MediaError(f"A {row['status']} asset cannot be confirmed.")

    a_status = (
        await session.execute(
            text("SELECT status FROM task_assignment WHERE id = :a"), {"a": row["assignment_id"]}
        )
    ).scalar_one_or_none()
    if a_status != "in_progress":
        raise MediaError("The assignment is no longer taking uploads.")

    try:
        target = await storage_svc.resolve_by_id(session, row["storage_target_id"])
        s = await storage.head(target, row["storage_key"])
    except LookupError:
        raise MediaError("File not uploaded yet.") from None

    if s.size != row["size_bytes"]:
        await session.execute(
            text(
                "UPDATE asset SET status = 'quarantined', etag = :etag, updated_at = now(), "
                "       quarantine_reason = :why WHERE id = :id"
            ),
            {
                "etag": s.etag, "id": asset_id,
                "why": f"size mismatch: manifest says {row['size_bytes']} bytes, storage holds {s.size}",
            },
        )
    else:
        await session.execute(
            text(
                "UPDATE asset SET status = 'ready', etag = :etag, "
                "       mime_type = coalesce(:ct, mime_type), uploaded_at = now(), updated_at = now() "
                "WHERE id = :id"
            ),
            {"etag": s.etag, "ct": s.content_type, "id": asset_id},
        )
    return (await _get_asset(session, asset_id)) or {}


async def list_assets(
    session: AsyncSession,
    claims: AccessClaims,
    *,
    assignment_id: uuid.UUID | None = None,
    task_id: uuid.UUID | None = None,
) -> list[dict[str, Any]]:
    """The parent is checked first so a parent the caller may not see is a
    404 rather than an empty list; the rows themselves are RLS-filtered, and
    a caller outside the supplier organisation sees only ready captures."""
    if assignment_id is not None:
        parent = (
            await session.execute(
                text("SELECT 1 FROM task_assignment WHERE id = :a"), {"a": assignment_id}
            )
        ).scalar_one_or_none()
        where, params = "a.assignment_id = :p", {"p": assignment_id}
    elif task_id is not None:
        parent = (
            await session.execute(
                text("SELECT 1 FROM task WHERE id = :t AND deleted_at IS NULL"), {"t": task_id}
            )
        ).scalar_one_or_none()
        where, params = "a.task_id = :p", {"p": task_id}
    else:
        raise ValueError("assignment_id or task_id is required")
    if parent is None:
        raise LookupError("not found")

    # The supplier sees every capture of its own, failed attempts included;
    # anyone else (the delivery partner, the client) sees only what is ready.
    params["me"] = claims.org_id
    rows = (
        await session.execute(
            text(
                "SELECT " + _ASSET_COLUMNS + _ASSET_FROM
                + "WHERE a.deleted_at IS NULL "
                + "  AND (a.supplier_org_id = :me OR a.status = 'ready') AND " + where
                + " ORDER BY a.captured_at NULLS LAST, a.created_at"
            ),
            params,
        )
    ).mappings().all()
    return [_asset_dict(r) for r in rows]


async def asset_view_url(
    session: AsyncSession, claims: AccessClaims, asset_id: uuid.UUID
) -> dict[str, Any]:
    """A short-TTL inline URL. The RLS'd select is the whole access check."""
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    row = (
        await session.execute(
            text(
                "SELECT storage_key, filename, mime_type, status, storage_target_id "
                "FROM asset WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": asset_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("asset not found")
    if row["status"] != "ready":
        raise MediaError(f"A {row['status']} asset cannot be viewed yet.")
    target = await storage_svc.resolve_by_id(session, row["storage_target_id"])
    url = await storage.presign_get(
        target, row["storage_key"], row["filename"], inline=True
    )
    return {
        "url": url, "filename": row["filename"], "mime_type": row["mime_type"],
        "expires_in": settings.storage_presign_ttl_seconds,
    }


async def attach_to_submission(
    session: AsyncSession, task_id: uuid.UUID, submission_id: uuid.UUID
) -> int:
    """Bundle every ready capture of an ACCEPTED assignment into the submission
    the aggregator hands to its delivery partner. Returns how many."""
    result = await session.execute(
        text(
            "UPDATE asset a SET submission_id = :s, updated_at = now() "
            "FROM task_assignment ta "
            "WHERE ta.id = a.assignment_id AND a.task_id = :t "
            "  AND a.status = 'ready' AND a.deleted_at IS NULL AND ta.status = 'accepted'"
        ),
        {"s": submission_id, "t": task_id},
    )
    return int(result.rowcount or 0)


async def discard_asset(
    session: AsyncSession, claims: AccessClaims, asset_id: uuid.UUID
) -> None:
    """Remove a capture the worker does not want to send.

    Soft delete: the row stays for the audit trail, ready_count stops counting
    it, and the slot frees for a replacement. Only the worker who captured it,
    and only while the assignment is still theirs to change.
    """
    row = (
        await session.execute(
            text(
                "SELECT a.id, ta.worker_user_id, ta.status "
                "FROM asset a JOIN task_assignment ta ON ta.id = a.assignment_id "
                "WHERE a.id = :id AND a.deleted_at IS NULL"
            ),
            {"id": asset_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("asset not found")
    if row["worker_user_id"] != claims.user_id:
        raise MediaError("Only the worker who captured it can remove it.")
    # 'rejected' means sent back for rework, and removing the frame the
    # aggregator objected to is the whole point of that round. Capture already
    # treats the two alike — the phone restarts the assignment on the way in.
    if row["status"] not in ("in_progress", "rejected"):
        raise MediaError(
            "This batch is with your aggregator. You can change it if it comes back."
        )
    await session.execute(
        text("UPDATE asset SET deleted_at = now(), updated_at = now() WHERE id = :id"),
        {"id": asset_id},
    )


async def ready_count(session: AsyncSession, assignment_id: uuid.UUID) -> int:
    return int(
        (
            await session.execute(
                text(
                    "SELECT count(*) FROM asset WHERE assignment_id = :a "
                    "AND status = 'ready' AND deleted_at IS NULL"
                ),
                {"a": assignment_id},
            )
        ).scalar_one()
    )
