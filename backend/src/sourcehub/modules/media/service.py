"""media — captured assets: presign, confirm, list, view.

Business rules, and the ONLY public surface of this module.

The bytes never traverse the API. A crowd resource asks for a presigned PUT, uploads
straight to object storage, then confirms; the API HEADs the object and
records what storage actually holds (size, etag, content type) rather than
what the client claimed. That is the whole of the pilot's ingest: nobody
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
# Clips run to minutes now, and the phone checks them before they leave (see
# mobile/src/validation/clip.ts); a single SAS PUT takes up to 5000 MiB.
MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024
MAX_ASSETS_PER_ASSIGNMENT = 500

_SHA256 = re.compile(r"^[0-9a-f]{64}$")

_ASSET_COLUMNS = (
    "a.id, a.task_id, a.assignment_id, a.submission_id, a.captured_by_user_id, "
    "coalesce(w.display_name, u.full_name) AS captured_by_name, "
    "a.filename, a.mime_type, a.size_bytes, a.sha256, a.etag, a.status, a.quarantine_reason, "
    "a.captured_at, a.captured_lat, a.captured_lon, a.uploaded_at, a.created_at, "
    "a.check_results, a.review_reason, a.review_note, a.reviewed_at, "
    "d.label AS review_label, a.batch_id, cb.batch_no, cb.status AS batch_status, "
    "a.replaces_asset_id, "
    # a retake that is still alive answers this capture's rework mark
    "EXISTS (SELECT 1 FROM asset r WHERE r.replaces_asset_id = a.id "
    "        AND r.deleted_at IS NULL AND r.status <> 'erased') AS replaced "
)
_ASSET_FROM = (
    "FROM asset a "
    "LEFT JOIN crowd_worker w ON w.user_id = a.captured_by_user_id "
    "LEFT JOIN app_user u ON u.id = a.captured_by_user_id "
    # the reviewer's reason as a person reads it, so neither the console nor
    # the phone has to carry a copy of the taxonomy
    "LEFT JOIN defect_code d ON d.code = a.review_reason "
    "LEFT JOIN capture_batch cb ON cb.id = a.batch_id "
)


def stage(status: str, batch_status: str | None, replaced: bool) -> str:
    """Where one capture stands in the worker's round trip (db/350). Pure.

    draft: on the server, not sent · in_review: its batch is with the
    aggregator · accepted: its batch was answered and it was kept · rework:
    marked to be shot again, and no retake has replaced it yet · replaced: a
    rework capture a retake now stands in for · uploading: not finished
    (pending or quarantined), never part of a batch.
    """
    if status == "rejected":
        return "replaced" if replaced else "rework"
    if status != "ready":
        return "uploading"
    if batch_status is None:
        return "draft"
    return "in_review" if batch_status == "in_review" else "accepted"


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


def _capture_name(
    *,
    contract_ref: str | None,
    task_ref: str | None,
    aggregator_ref: str | None,
    worker_ref: str | None,
    worker_user_id: uuid.UUID,
    asset_id: uuid.UUID,
    ext: str,
) -> str:
    """One flat, self-describing name per capture, straight under the client's
    prefix — no folders:

        CTR-05_TSK-06_AG-04_WKR-13_ef051366.jpg

    contract, task, aggregator, worker, then the first 8 hex of the asset id
    for uniqueness. Fields are joined with '_' and never contain one (reference
    codes use '-'), so name.split('_') recovers every part, and a plain sort
    groups by contract, then task, then aggregator, then worker. Capture time
    is deliberately not in the name; it lives on the row.

    Reference codes, not names: a worker's display name changes and needs
    sanitising, a code does neither. A worker with no roster row falls back to
    a fragment of their user id. A missing contract, task or aggregator code is
    a data error and refuses the presign rather than minting a half name.
    """
    missing = [
        label for label, ref in (
            ("contract", contract_ref), ("task", task_ref), ("aggregator", aggregator_ref),
        ) if not ref
    ]
    if missing:
        raise MediaError(f"This assignment has no {', '.join(missing)} reference code.")
    who = worker_ref or f"U-{worker_user_id.hex[:8]}"
    fields = (contract_ref, task_ref, aggregator_ref, who, asset_id.hex[:8])
    # '_' is the separator; a stray one inside a field would break the split.
    return "_".join(str(f).replace("_", "-") for f in fields) + f".{ext.lower().lstrip('.')}"


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
        # what the phone noticed before it queued the file (presign_asset);
        # recorded, not trusted — the reviewer reads it, nothing acts on it
        "device_checks": (r["check_results"] or {}).get("device") or [],
        # the aggregator's verdict on THIS capture at gate 1. Set only on one
        # sent back to be shot again, where status is 'rejected'.
        "review_reason": r["review_reason"],
        "review_label": r["review_label"],
        "review_note": r["review_note"],
        "reviewed_at": r["reviewed_at"],
        # the send it went out in, and where it stands now (stage above)
        "batch_id": r["batch_id"],
        "batch_no": r["batch_no"],
        "replaces_asset_id": r["replaces_asset_id"],
        "stage": stage(r["status"], r["batch_status"], bool(r["replaced"])),
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
    # The three LEFT JOINs fetch the reference codes the capture's filename is
    # built from. Task, the worker's own organisation and their own roster row
    # are readable in the worker's RLS context; the CONTRACT is not (a worker
    # session cannot read a contract — see db/120_workers_media.sql), so that
    # one join comes back NULL and _contract_ref fills it under elevation.
    a = (
        await session.execute(
            text(
                "SELECT ta.id, ta.task_id, ta.contract_id, ta.supplier_org_id, "
                "       ta.worker_user_id, ta.status, ta.quantity, ta.revoked_at, "
                "       t.target_unit, t.capture_spec, "
                "       c.reference_code AS contract_ref, t.reference_code AS task_ref, "
                "       o.reference_code AS aggregator_ref, w.reference_code AS worker_ref "
                "FROM task_assignment ta "
                "JOIN task t ON t.id = ta.task_id "
                "LEFT JOIN contract c ON c.id = ta.contract_id "
                "LEFT JOIN organisation o ON o.id = ta.supplier_org_id "
                "LEFT JOIN crowd_worker w ON w.user_id = ta.worker_user_id "
                "WHERE ta.id = :a"
            ),
            {"a": assignment_id},
        )
    ).mappings().one_or_none()
    if a is None or a["worker_user_id"] != claims.user_id:
        raise LookupError("assignment not found")
    if a["revoked_at"] is not None:
        raise MediaError(
            "This task was given to someone else. Nothing more is needed from you on it."
        )
    if a["status"] in ("assigned", "rejected"):
        raise MediaError("Start the assignment before uploading.")
    if a["status"] != "in_progress":
        raise MediaError(f"A {a['status']} assignment cannot take uploads.")
    row = dict(a)
    if row.get("contract_ref") is None:
        row["contract_ref"] = await _contract_ref(session, row["contract_id"])
    return row


async def _contract_ref(session: AsyncSession, contract_id: uuid.UUID) -> str | None:
    """The contract's reference code, read past the worker's RLS.

    A worker session is deliberately blind to contract rows, but the capture's
    filename carries the contract code so the client can group their own
    bucket by it. This borrows the ledger's shape: swap the transaction's
    context to the platform for one SELECT and put it back. set_config is
    transaction-local, so even a failure between the two leaves nothing
    behind past the request. The caller has already proved the assignment is
    the worker's own, which is the only authorisation this read needs.
    """
    prev = (
        await session.execute(
            text("SELECT current_setting('app.org_id', true), current_setting('app.role', true)")
        )
    ).one()
    await session.execute(
        text(
            "SELECT set_config('app.org_id', platform_org_id()::text, true), "
            "set_config('app.role', 'platform_admin', true)"
        )
    )
    try:
        return (
            await session.execute(
                text("SELECT reference_code FROM contract WHERE id = :c"), {"c": contract_id}
            )
        ).scalar_one_or_none()
    finally:
        await session.execute(
            text("SELECT set_config('app.org_id', :o, true), set_config('app.role', :r, true)"),
            {"o": prev[0] or "", "r": prev[1] or ""},
        )


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
    checks: list[dict[str, Any]] | None = None,
    replaces_asset_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    """Record the manifest and mint a one-object upload URL.

    replaces_asset_id makes this capture a retake of one the aggregator sent
    back: it must be a rework capture of this same assignment that nothing has
    replaced yet. The replaced row stays, with its reason, for the record.

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

    if replaces_asset_id is not None:
        old = (
            await session.execute(
                text(
                    "SELECT a.status, EXISTS (SELECT 1 FROM asset r "
                    "         WHERE r.replaces_asset_id = a.id AND r.deleted_at IS NULL "
                    "           AND r.status <> 'erased') AS replaced "
                    "FROM asset a WHERE a.id = :id AND a.assignment_id = :a "
                    "  AND a.deleted_at IS NULL"
                ),
                {"id": replaces_asset_id, "a": assignment_id},
            )
        ).mappings().one_or_none()
        if old is None or old["status"] != "rejected":
            raise MediaError("Only a capture sent back for rework can be retaken.")
        if old["replaced"]:
            raise MediaError("That capture has already been retaken.")

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

    # The client's prefix, then one flat name that says what the file is (see
    # _capture_name). They browse this bucket themselves, and a folder called
    # a08487fe-8a1d-4181-… told them nothing. Uniqueness in a flat folder rests
    # on the asset-id fragment in the name, so the key is checked before use:
    # a clash can only be with this worker's own captures on the same task —
    # every other field differs — and those are exactly the rows the worker's
    # RLS context can see.
    ext = safe.rsplit(".", 1)[-1]
    for _ in range(3):
        asset_id = uuid.uuid4()
        name = _capture_name(
            contract_ref=a.get("contract_ref"), task_ref=a.get("task_ref"),
            aggregator_ref=a.get("aggregator_ref"), worker_ref=a.get("worker_ref"),
            worker_user_id=claims.user_id, asset_id=asset_id, ext=ext,
        )
        key = target.key(name)
        taken = (
            await session.execute(
                text("SELECT 1 FROM asset WHERE storage_key = :k LIMIT 1"), {"k": key}
            )
        ).scalar_one_or_none()
        if taken is None:
            break
    else:
        raise MediaError("Could not mint a unique name for this capture; try again.")
    safe = name  # what the bucket holds is what every gallery shows
    await session.execute(
        text(
            "INSERT INTO asset (id, task_id, assignment_id, captured_by_user_id, supplier_org_id, "
            "                   contract_id, storage_key, filename, mime_type, size_bytes, sha256, "
            "                   status, captured_at, captured_lat, captured_lon, metadata, "
            "                   check_results, storage_target_id, replaces_asset_id) "
            "VALUES (:id, :task, :asg, :user, :org, :contract, :key, :name, :ct, :size, :sha, "
            "        'pending', :cat, :lat, :lon, CAST(:meta AS jsonb), "
            "        CAST(:checks AS jsonb), :target, :replaces)"
        ),
        {
            "id": asset_id, "task": a["task_id"], "asg": assignment_id, "user": claims.user_id,
            "org": a["supplier_org_id"], "contract": a["contract_id"], "key": key, "name": safe,
            "ct": content_type, "size": size_bytes, "sha": sha, "cat": captured_at,
            "lat": _to_numeric(lat), "lon": _to_numeric(lon),
            "meta": json.dumps({"claimed_size": size_bytes, "kind": kind}),
            # What the phone decided before it queued the file. Recorded, not
            # trusted: everything enforced above was checked here, on the
            # server, from the manifest the device sent.
            "checks": json.dumps({"device": checks or []}),
            "target": target_id,
            "replaces": replaces_asset_id,
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
            text(
                "SELECT CASE WHEN revoked_at IS NULL THEN status::text ELSE 'revoked' END "
                "FROM task_assignment WHERE id = :a"
            ),
            {"a": row["assignment_id"]},
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
                "SELECT storage_key, filename, mime_type, status, storage_target_id, "
                "       supplier_org_id "
                "FROM asset WHERE id = :id AND deleted_at IS NULL"
            ),
            {"id": asset_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("asset not found")
    # A capture the aggregator sent back still has to be looked at: by the
    # worker, to see which frame to shoot again, and by the reviewer who may
    # change their mind while the batch is still theirs to decide. Only the
    # supplier's own people — list_assets already hides anything but 'ready'
    # from the partner and the client, so this widens nothing downstream.
    viewable = ("ready", "rejected") if row["supplier_org_id"] == claims.org_id else ("ready",)
    if row["status"] not in viewable:
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
            "  AND a.status = 'ready' AND a.deleted_at IS NULL AND ta.status = 'accepted' "
            "  AND a.batch_id IS NOT NULL"
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
    only while the assignment is still theirs to change, and only a capture
    that is not with the aggregator: one not yet sent, or one sent back for
    rework. What is in review or accepted is part of the record.
    """
    row = (
        await session.execute(
            text(
                "SELECT a.id, a.status AS asset_status, a.batch_id, ta.worker_user_id, "
                "       ta.status, ta.revoked_at "
                "FROM asset a JOIN task_assignment ta ON ta.id = a.assignment_id "
                "WHERE a.id = :id AND a.deleted_at IS NULL"
            ),
            {"id": asset_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("asset not found")
    if row["worker_user_id"] != claims.user_id:
        raise MediaError("Only the crowd resource who captured it can remove it.")
    # 'rejected' means sent back for rework, and removing the frame the
    # aggregator objected to is the whole point of that round. Capture already
    # treats the two alike — the phone restarts the assignment on the way in.
    if row["revoked_at"] is not None or row["status"] not in ("in_progress", "rejected"):
        raise MediaError("This assignment can no longer be changed.")
    if row["asset_status"] != "rejected" and row["batch_id"] is not None:
        raise MediaError(
            "This capture was sent for review. Only one sent back for rework can be removed."
        )
    await session.execute(
        text("UPDATE asset SET deleted_at = now(), updated_at = now() WHERE id = :id"),
        {"id": asset_id},
    )


# How many of an assignment's captures stand where (stage, above), in SQL. One
# fragment so the assignment payload, submit and the gate-1 settle all count
# alike. :a is the assignment.
STAGE_COUNTS = (
    "SELECT count(*) FILTER (WHERE s.status = 'ready' AND s.batch_id IS NULL) AS draft, "
    "       count(*) FILTER (WHERE s.status = 'ready' AND b.status = 'in_review') AS in_review, "
    "       count(*) FILTER (WHERE s.status = 'ready' AND b.status = 'reviewed') AS accepted, "
    "       count(*) FILTER (WHERE s.status = 'rejected' AND NOT EXISTS ("
    "           SELECT 1 FROM asset r WHERE r.replaces_asset_id = s.id "
    "             AND r.deleted_at IS NULL AND r.status <> 'erased')) AS rework "
    "FROM asset s LEFT JOIN capture_batch b ON b.id = s.batch_id "
    "WHERE s.assignment_id = :a AND s.deleted_at IS NULL"
)


async def stage_counts(session: AsyncSession, assignment_id: uuid.UUID) -> dict[str, int]:
    """{draft, in_review, accepted, rework} for one assignment."""
    r = (await session.execute(text(STAGE_COUNTS), {"a": assignment_id})).mappings().one()
    return {k: int(r[k] or 0) for k in ("draft", "in_review", "accepted", "rework")}


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
