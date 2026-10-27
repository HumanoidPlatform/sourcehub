"""media — captured assets: presign, confirm, list, view.

Business rules, and the ONLY public surface of this module.

The bytes never traverse the API. A crowd resource asks for a presigned PUT, uploads
straight to object storage, then confirms; the API HEADs the object and
records what storage actually holds (size, etag, content type) rather than
what the client claimed. It then reads the file's own headers (probe.py) for
the facts a client specifies and is billed on — kind, frame size, running
time — and holds them to the task; every judgement of the picture itself
stays with the phone. No worker pool, no thumbnails. The asset_status value
'uploaded' is reserved for the day verification becomes asynchronous.

No ORM model, on purpose. asset is partitioned with a composite primary key
(id, created_at); every statement here is written by hand, exactly as audit
treats the partitioned audit_event. Inserts carry no RETURNING: under RLS a
RETURNING row must also pass the SELECT policy, and a plain INSERT needs only
the WITH CHECK.

Two idempotency rules the phone relies on:
  * presign is keyed on the phone's own capture id, or on (assignment, sha256)
    for a build that hashes: the same file asked for twice gets the same asset
    row and a fresh URL, so an expired URL costs nothing — and a chunked
    upload asked for again gets its session back, so a cut costs one chunk;
  * confirm on a ready asset returns it unchanged, so a retry after a lost
    response is harmless.

A file over CHUNK_BYTES goes up in chunks against a session storage keeps
(db/530, platform/storage resumable_*). The session is a credential and is
never listed: only presign hands it to the capturing worker.
"""

from __future__ import annotations

import contextlib
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
from sourcehub.modules.marketplace import pricing
from sourcehub.modules.media.probe import Probe, probe
from sourcehub.platform.storage.types import CHUNK_BYTES, UploadSession


class MediaError(Exception):
    """A rule of the flow was broken (409)."""


class MediaInvalid(Exception):
    """The request itself is not acceptable (422)."""


class MediaGone(Exception):  # noqa: N818 - named like MediaError and MediaInvalid above
    """What the phone is continuing no longer exists (410): the storage
    session expired or was swept. The phone starts that upload again."""


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov"}
MAX_IMAGE_BYTES = 25 * 1024 * 1024
# Clips run to minutes now, and the phone checks them before they leave (see
# mobile/src/qa_pipeline/clip/clip.ts); a single SAS PUT takes up to 5000 MiB.
MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024

# What already holds a place in a share, for presign_capture's one ceiling,
# the share's quantity — there is no cap on captures beyond what the
# aggregator assigned. Delivered or on its way: not a capture sent back for
# rework, which freed its place; not a
# quarantined upload, whose bytes did not match and which will be re-sent or
# removed; and not a pending row the phone gave up on — a presign whose PUT
# never came within a day is a capture that was discarded, lost, or sits on a
# phone that has not been online since, and counting it had the server refuse
# a worker whose phone said two were left. The phone counts ready captures
# plus its own queue (mobile batches.ts remaining()); this must not count more
# than that for long, or the two disagree and the worker cannot see why.
HELD_SQL = (
    "status IN ('pending','uploaded','ready') "
    "AND NOT (status = 'pending' AND created_at < now() - interval '24 hours')"
)
# The row a repeat presign of the same file reuses. Quarantined is in the list
# so a retry after a size mismatch gets its row back, reset to pending, rather
# than minting a second one that leaves the first holding a place for ever.
REUSABLE_SQL = "status IN ('pending','uploaded','ready','quarantined')"


def upload_session_from(raw: Any) -> UploadSession | None:
    """The storage session an asset row holds, or None for a single PUT. The
    column is jsonb; the driver hands it back decoded, a test as text."""
    if not raw:
        return None
    d = raw if isinstance(raw, dict) else json.loads(raw)
    try:
        return UploadSession(
            str(d["protocol"]), str(d["session"]), int(d["chunk_size"]), int(d["size"])
        )
    except (KeyError, TypeError, ValueError):
        return None


async def _store_session(
    session: AsyncSession, asset_id: uuid.UUID, us: UploadSession | None
) -> None:
    await session.execute(
        text(
            "UPDATE asset SET upload_session = CAST(:s AS jsonb), updated_at = now() "
            "WHERE id = :id"
        ),
        {"s": json.dumps(us._asdict()) if us is not None else None, "id": asset_id},
    )


def _resumable_answer(
    asset_id: uuid.UUID, key: str, us: UploadSession, content_type: str, state: str
) -> dict[str, Any]:
    """What presign returns for a chunked upload: no PUT URL, the protocol the
    phone speaks, and for Google the session URL every chunk goes to. Azure
    and S3 take a URL per part (upload_part_urls). The only place the session
    leaves the server, and only to the worker who owns the capture."""
    return {
        "asset_id": asset_id, "storage_key": key,
        "url": None, "method": "RESUMABLE",
        "headers": {"Content-Type": content_type},
        "expires_in": settings.storage_presign_ttl_seconds, "status": state,
        "upload": {
            "protocol": us.protocol, "chunk_size": us.chunk_size, "size": us.size,
            "session_url": us.session if us.protocol == "gcs" else None,
        },
    }

_SHA256 = re.compile(r"^[0-9a-f]{64}$")

_ASSET_COLUMNS = (
    "a.id, a.task_id, a.assignment_id, a.submission_id, a.captured_by_user_id, "
    "coalesce(w.display_name, u.full_name) AS captured_by_name, "
    "a.filename, a.mime_type, a.size_bytes, a.duration_s, a.sha256, a.etag, a.status, a.quarantine_reason, "
    "a.captured_at, a.captured_lat, a.captured_lon, a.uploaded_at, a.created_at, "
    "a.check_results, a.metadata, a.review_reason, a.review_note, a.reviewed_at, "
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
    probed = (r.get("metadata") or {}).get("probe") or {}
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
        # a clip's running time as the capturing device measured it (db/510)
        "duration_s": None if r["duration_s"] is None else float(r["duration_s"]),
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
        # what confirm read from the stored file itself (probe.py), and the
        # frame size it found there
        "server_checks": (r["check_results"] or {}).get("server") or [],
        "width": probed.get("width"),
        "height": probed.get("height"),
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
    # hours of footage are measured by clip length; a photo has none
    if pricing.measured_by_duration(unit):
        return {"video"}
    if unit.startswith(("photo", "image")):
        return {"image"}
    if unit.startswith(("video", "clip")):
        return {"video"}
    return {"image", "video"}


# The longest clip a capture spec may ask for (api/v1/marketplace CaptureSpec),
# and the asset.duration_s CHECK (db/510).
MAX_CLIP_SECONDS = 600
# The phone times a recording on its own clock; the file it writes can run a
# fraction longer or shorter than the spec's bound it stopped at.
_DURATION_SLACK_S = 1.0


def checked_duration(
    kind: str, duration_s: float | None, capture_spec: dict[str, Any] | None, target_unit: str | None
) -> Decimal | None:
    """A clip's running time, checked against the task, as it is stored. Pure.

    A photo has none, whatever was sent. A clip on an hours task must say how
    long it runs: it is what the share is counted in, and an app from before
    this sends nothing. The spec's min/max are enforced here as well as on the
    device, with a second's slack for the device's own timing.
    """
    if kind != "video":
        return None
    if duration_s is None:
        if pricing.measured_by_duration(target_unit):
            raise MediaInvalid(
                "This task is counted in hours of footage, and the clip's length was not sent. "
                "Update the app and capture it again."
            )
        return None
    spec = capture_spec or {}
    lo = float(spec.get("min_duration_s") or 0)
    hi = min(float(spec.get("max_duration_s") or MAX_CLIP_SECONDS), MAX_CLIP_SECONDS)
    if duration_s <= 0 or duration_s > MAX_CLIP_SECONDS + _DURATION_SLACK_S:
        raise MediaInvalid(f"A clip runs between 0 and {MAX_CLIP_SECONDS} seconds.")
    if duration_s < lo - _DURATION_SLACK_S:
        raise MediaInvalid(f"This task takes clips of at least {lo:g} seconds.")
    if duration_s > hi + _DURATION_SLACK_S:
        raise MediaInvalid(f"This task takes clips of at most {hi:g} seconds.")
    return Decimal(str(round(min(max(duration_s, 0.01), MAX_CLIP_SECONDS), 2)))


# The phone's own allowance under a megapixel floor (mobile rules.ts): a
# "12 MP" sensor writes a hair under twelve million pixels.
_MEGAPIXEL_SLACK = 0.05


def judge_capture(
    declared: str,
    p: Probe,
    capture_spec: dict[str, Any] | None,
    target_unit: str | None,
    claimed_s: float | None,
) -> tuple[str | None, Decimal | None, list[dict[str, Any]]]:
    """What confirm makes of the stored file, against the task. Pure.

    (quarantine reason or None, the running time to store or None to keep the
    claimed one, the server's checks in the device's shape). Only facts read
    from the file are judged here — kind, running time, frame size. Blur, tilt,
    GPS, the subject and the rest stay with the phone, gate 0.

    The file's running time replaces the claimed one: an hours task is billed
    on it. One that cannot be read is refused only where it is billed on.
    """
    checks: list[dict[str, Any]] = []
    if p.kind is None:
        return "The file is not a photo or video this platform can read.", None, checks
    if p.kind != declared:
        return (
            f"The file is a {_KIND_WORD[p.kind]}, not the {_KIND_WORD[declared]} its name says.",
            None, checks,
        )
    allowed = _allowed_kinds(capture_spec, target_unit)
    if p.kind not in allowed:
        want = " or ".join(sorted(allowed))
        return f"This task takes {want} captures; that file is a {p.kind}.", None, checks

    reason: str | None = None
    duration: Decimal | None = None
    if p.kind == "video":
        if p.duration_s is not None:
            checks.append({
                "code": "duration_measured", "severity": "info",
                "message": f"The file runs {p.duration_s:g} s.",
                "detail": {"claimed": claimed_s, "measured": p.duration_s},
            })
            try:
                duration = checked_duration("video", p.duration_s, capture_spec, target_unit)
            except MediaInvalid as e:
                reason = str(e)
        elif pricing.measured_by_duration(target_unit):
            reason = (
                "This task is counted in hours of footage, and the clip's length could not be "
                "read from the file. Record it again with the app's camera."
            )
        else:
            checks.append({
                "code": "duration_unverified", "severity": "warn",
                "message": "The clip's length could not be read from the file.",
            })

    spec = capture_spec or {}
    short = min(p.width, p.height) if p.width and p.height else None
    # a clip's floor is its short side in lines, a photo's its megapixels
    floor = spec.get("min_video_lines" if p.kind == "video" else "min_megapixels")
    if floor:
        if short is None:
            checks.append({
                "code": "resolution_unverified", "severity": "warn",
                "message": "The frame size could not be read from the file.",
            })
        elif p.kind == "video" and short < int(floor):
            reason = reason or f"This task asks for {float(floor):g}p video; that clip is {short}p."
        elif p.kind == "image":
            mp = (p.width or 0) * (p.height or 0) / 1_000_000
            if mp < float(floor) - _MEGAPIXEL_SLACK:
                reason = reason or (
                    f"This task asks for {float(floor):g} megapixels; that capture is {mp:.1f}."
                )
    return reason, duration, checks


_KIND_WORD = {"image": "photo", "video": "video"}


def hours_text(hours: Any) -> str:
    """'45 min', '1 h 30 min', '2 h'. Pure."""
    minutes = int((Decimal(str(hours)) * 60).to_integral_value())
    h, m = divmod(minutes, 60)
    if h and m:
        return f"{h} h {m} min"
    return f"{h} h" if h else f"{m} min"


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
    sha256: str | None = None,
    captured_at: dt.datetime,
    lat: float | None,
    lon: float | None,
    checks: list[dict[str, Any]] | None = None,
    replaces_asset_id: uuid.UUID | None = None,
    duration_s: float | None = None,
    client_capture_id: uuid.UUID | None = None,
    resumable: bool = False,
    restart: bool = False,
) -> dict[str, Any]:
    """Record the manifest and mint the upload: a one-object PUT URL, or for a
    big file the phone asked to send in chunks, a storage session.

    duration_s is a clip's running time as the device measured it. A task in
    hours counts its clips by it, so there it is required; anywhere else a
    clip carries it when the device sent one. A photo has none.

    A capture is named by sha256, or by client_capture_id — the phone's own id
    for it — since hashing a gigabyte on a phone is what loaded it into memory
    and had the OS kill the app. Either finds the row again. Nothing verifies
    the hash; confirm checks the size against storage.

    resumable asks for chunks, honoured above CHUNK_BYTES. A pending chunked
    row asked for again gets its stored session back, so the phone resumes;
    restart drops that session and opens a fresh one, for a phone told the
    old one is gone (upload_status, 410).

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

    sha = sha256.lower() if sha256 else None
    if sha is not None and not _SHA256.match(sha):
        raise MediaInvalid("sha256 must be 64 hex characters.")
    if sha is None and client_capture_id is None:
        raise MediaInvalid("A capture needs a sha256 or a client_capture_id.")
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
    duration = checked_duration(kind, duration_s, a.get("capture_spec"), a.get("target_unit"))

    # Where this contract's client asked for delivery. Resolved through a
    # SECURITY DEFINER function: this runs in the worker's session, which
    # cannot read storage_target and should not be able to.
    target, target_id = await storage_svc.resolve_for_contract(session, a["contract_id"])
    chunked = resumable and size_bytes > CHUNK_BYTES

    # Idempotent on the phone's own capture id, or on (assignment, sha256) for
    # a build that hashes: a retry, an expired URL or a resume reuses the row.
    if client_capture_id is not None:
        same, ident = "client_capture_id = :ident", client_capture_id
    else:
        same, ident = "sha256 = :ident", sha
    existing = (
        await session.execute(
            text(
                "SELECT id, status, storage_key, upload_session FROM asset "
                "WHERE assignment_id = :a AND deleted_at IS NULL AND " + same + " "
                "  AND " + REUSABLE_SQL + " "
                "ORDER BY created_at DESC LIMIT 1"
            ),
            {"a": assignment_id, "ident": ident},
        )
    ).mappings().one_or_none()
    if existing is not None:
        if existing["status"] == "ready":
            return {
                "asset_id": existing["id"], "storage_key": existing["storage_key"],
                "url": None, "method": "PUT", "headers": {}, "expires_in": 0,
                "status": "ready",
            }
        state = existing["status"]
        held = upload_session_from(existing["upload_session"])
        if state == "quarantined":
            # the same file again after a size mismatch: the row is reused and
            # the bytes are expected afresh, so the old verdict goes with them —
            # and so does any session, whose parts are what did not add up
            await session.execute(
                text(
                    "UPDATE asset SET status = 'pending', quarantine_reason = NULL, etag = NULL, "
                    "       upload_session = NULL, updated_at = now() WHERE id = :id"
                ),
                {"id": existing["id"]},
            )
            state = "pending"
            if held is not None:
                with contextlib.suppress(Exception):
                    await storage.resumable_abort(target, existing["storage_key"], held)
                held = None
        if chunked:
            if held is not None and not restart:
                # the phone is resuming: the session it had is the one it needs
                return _resumable_answer(
                    existing["id"], existing["storage_key"], held, content_type, state
                )
            if held is not None:
                with contextlib.suppress(Exception):
                    await storage.resumable_abort(target, existing["storage_key"], held)
            fresh = await storage.resumable_start(
                target, existing["storage_key"], size_bytes, content_type
            )
            await _store_session(session, existing["id"], fresh)
            return _resumable_answer(
                existing["id"], existing["storage_key"], fresh, content_type, state
            )
        if held is not None:
            # The row was being chunked and is now asked for as one PUT. A
            # session left behind would have confirm try to assemble parts
            # that never come, so it goes before the PUT link is issued.
            with contextlib.suppress(Exception):
                await storage.resumable_abort(target, existing["storage_key"], held)
            await _store_session(session, existing["id"], None)
        url, extra = await storage.presign_put(target, existing["storage_key"])
        return {
            "asset_id": existing["id"], "storage_key": existing["storage_key"],
            "url": url, "method": "PUT",
            "headers": {"Content-Type": content_type, **extra},
            "expires_in": settings.storage_presign_ttl_seconds, "status": state,
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

    held = await _held(session, assignment_id, a.get("target_unit"))
    n = int(held["n"])
    # The aggregator asked for a number of units and reviews every one of them.
    # Refusing here rather than at submit costs the worker a message instead of
    # an upload over a field connection. In hours the clip that crosses the
    # line is still taken: the share is met, and a clip cannot be cut to fit.
    if a.get("quantity") and Decimal(held["units"]) >= Decimal(a["quantity"]):
        unit = a.get("target_unit")
        if pricing.measured_by_duration(unit):
            raise MediaError(
                f"This assignment is for {pricing.quantity_text(a['quantity'], unit)} and already has "
                f"{hours_text(held['units'])} of footage. Remove a clip before adding another."
            )
        raise MediaError(
            f"This assignment is for {pricing.quantity_text(a['quantity'], unit or 'captures')} "
            f"and already has {n}. Remove one before adding another."
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
            "                   client_capture_id, status, captured_at, captured_lat, "
            "                   captured_lon, metadata, check_results, storage_target_id, "
            "                   replaces_asset_id, duration_s) "
            "VALUES (:id, :task, :asg, :user, :org, :contract, :key, :name, :ct, :size, :sha, "
            "        :cid, 'pending', :cat, :lat, :lon, CAST(:meta AS jsonb), "
            "        CAST(:checks AS jsonb), :target, :replaces, :dur)"
        ),
        {
            "id": asset_id, "task": a["task_id"], "asg": assignment_id, "user": claims.user_id,
            "org": a["supplier_org_id"], "contract": a["contract_id"], "key": key, "name": safe,
            "ct": content_type, "size": size_bytes, "sha": sha, "cid": client_capture_id,
            "cat": captured_at, "lat": _to_numeric(lat), "lon": _to_numeric(lon),
            "meta": json.dumps(
                {"claimed_size": size_bytes, "kind": kind,
                 "upload": "chunked" if chunked else "single"}
            ),
            # What the phone decided before it queued the file. Recorded, not
            # trusted: everything enforced above was checked here, on the
            # server, from the manifest the device sent.
            "checks": json.dumps({"device": checks or []}),
            "target": target_id,
            "replaces": replaces_asset_id,
            "dur": duration,
        },
    )
    if chunked:
        fresh = await storage.resumable_start(target, key, size_bytes, content_type)
        await _store_session(session, asset_id, fresh)
        return _resumable_answer(asset_id, key, fresh, content_type, "pending")
    url, extra = await storage.presign_put(target, key)
    return {
        "asset_id": asset_id, "storage_key": key,
        "url": url, "method": "PUT",
        "headers": {"Content-Type": content_type, **extra},
        "expires_in": settings.storage_presign_ttl_seconds, "status": "pending",
    }


async def _held(
    session: AsyncSession,
    assignment_id: uuid.UUID,
    unit: str | None,
    exclude: uuid.UUID | None = None,
) -> Any:
    """(n, units) the assignment's share already holds (HELD_SQL), less one
    capture where confirm is weighing that one against the rest."""
    return (
        await session.execute(
            text(
                "SELECT count(*) AS n, round(coalesce(sum(capture_units(:unit, duration_s)), 0), 4) AS units "
                "FROM asset WHERE assignment_id = :a AND deleted_at IS NULL AND " + HELD_SQL + " "
                "  AND id IS DISTINCT FROM CAST(:x AS uuid)"
            ),
            {"a": assignment_id, "unit": unit, "x": exclude},
        )
    ).mappings().one()


async def _own_pending_upload(
    session: AsyncSession, claims: AccessClaims, asset_id: uuid.UUID
) -> tuple[dict[str, Any], UploadSession]:
    """The chunked upload the caller is continuing: theirs, pending, with a
    session. Touches updated_at so the sweep sees the phone is at work.

    A row the sweep removed is answered as gone (410), not as never having
    existed (404): the phone reads gone as "start this upload again", and the
    file is still on the phone — a 404 it would read as a failure."""
    row = (
        await session.execute(
            text(
                "SELECT id, storage_key, status, captured_by_user_id, storage_target_id, "
                "       mime_type, upload_session, deleted_at "
                "FROM asset WHERE id = :id"
            ),
            {"id": asset_id},
        )
    ).mappings().one_or_none()
    if row is None:
        raise LookupError("asset not found")
    if row["captured_by_user_id"] != claims.user_id:
        raise MediaError("Only the crowd resource uploading this capture can continue it.")
    if row["deleted_at"] is not None:
        raise MediaGone("This upload was abandoned and removed; start it again.")
    if row["status"] != "pending":
        raise MediaError(f"A {row['status']} asset is not being uploaded.")
    us = upload_session_from(row["upload_session"])
    if us is None:
        raise MediaError("This capture is not a chunked upload.")
    await session.execute(
        text("UPDATE asset SET updated_at = now() WHERE id = :id"), {"id": asset_id}
    )
    return dict(row), us


def part_count(us: UploadSession) -> int:
    return -(-us.size // us.chunk_size)


async def upload_part_urls(
    session: AsyncSession, claims: AccessClaims, asset_id: uuid.UUID, parts: list[int]
) -> dict[str, Any]:
    """Signed URLs for the parts the phone is about to send (Azure, S3)."""
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    row, us = await _own_pending_upload(session, claims, asset_id)
    expected = part_count(us)
    bad = [n for n in parts if n < 1 or n > expected]
    if bad:
        raise MediaInvalid(f"This upload has {expected} parts; part {bad[0]} does not exist.")
    target = await storage_svc.resolve_by_id(session, row["storage_target_id"])
    urls = await storage.resumable_part_urls(target, row["storage_key"], us, sorted(set(parts)))
    return {
        "urls": {str(n): u for n, u in urls.items()},
        "expires_in": settings.storage_presign_ttl_seconds,
    }


async def upload_status(
    session: AsyncSession, claims: AccessClaims, asset_id: uuid.UUID
) -> dict[str, Any]:
    """How far storage says the upload has got — what the phone resumes from,
    never its own idea of where it was."""
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    row, us = await _own_pending_upload(session, claims, asset_id)
    target = await storage_svc.resolve_by_id(session, row["storage_target_id"])
    try:
        st = await storage.resumable_status(target, row["storage_key"], us)
    except LookupError:
        raise MediaGone("The upload session has expired. Start this upload again.") from None
    return {
        "bytes_done": st.bytes_done, "parts_done": st.parts_done,
        "chunk_size": us.chunk_size, "size": us.size, "parts": part_count(us),
    }


async def confirm_asset(
    session: AsyncSession, claims: AccessClaims, asset_id: uuid.UUID
) -> dict[str, Any]:
    """The device says it has finished; storage is asked whether that is true.

    A size mismatch quarantines the row and RETURNS it (HTTP 200) rather than
    raising: TxRoute skips the commit on an exception, and the quarantine
    marker is exactly the thing that must persist. So does a file whose own
    headers break the task (judge_capture): the wrong kind, too small a frame,
    a clip outside the task's length or past a met share.
    """
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    row = (
        await session.execute(
            text(
                "SELECT id, assignment_id, storage_key, filename, size_bytes, status, "
                "       storage_target_id, mime_type, upload_session, duration_s, metadata "
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
    us = upload_session_from(row["upload_session"])

    a = (
        await session.execute(
            text(
                "SELECT CASE WHEN ta.revoked_at IS NULL THEN ta.status::text ELSE 'revoked' END "
                "       AS status, ta.quantity, t.target_unit, t.capture_spec "
                "FROM task_assignment ta JOIN task t ON t.id = ta.task_id WHERE ta.id = :a"
            ),
            {"a": row["assignment_id"]},
        )
    ).mappings().one_or_none()
    if a is None or a["status"] != "in_progress":
        raise MediaError("The assignment is no longer taking uploads.")

    try:
        target = await storage_svc.resolve_by_id(session, row["storage_target_id"])
        if us is not None:
            # The chunks are assembled first. Parts still missing come back as
            # "not uploaded yet", and the phone asks storage what is missing.
            await storage.resumable_complete(
                target, row["storage_key"], us, row["mime_type"] or "application/octet-stream"
            )
        s = await storage.head(target, row["storage_key"])
    except LookupError:
        raise MediaError("File not uploaded yet.") from None

    if s.size != row["size_bytes"]:
        await session.execute(
            text(
                "UPDATE asset SET status = 'quarantined', etag = :etag, updated_at = now(), "
                "       upload_session = NULL, quarantine_reason = :why WHERE id = :id"
            ),
            {
                "etag": s.etag, "id": asset_id,
                "why": f"size mismatch: manifest says {row['size_bytes']} bytes, storage holds {s.size}",
            },
        )
        return (await _get_asset(session, asset_id)) or {}

    # The sizes agree; now what the bytes are. A few range reads of the
    # headers (probe.py), never the whole file. The kind, frame size and
    # running time come from there, not from the manifest: the running time
    # is what an hours task is billed on.
    async def read(start: int, length: int) -> bytes:
        return await storage.read_range(target, row["storage_key"], start, length)

    try:
        p = await probe(read, s.size)
    except LookupError:
        raise MediaError("File not uploaded yet.") from None
    meta = row["metadata"] or {}
    if isinstance(meta, str):
        meta = json.loads(meta)
    declared = meta.get("kind") or _safe_filename(row["filename"])[1]
    claimed = None if row["duration_s"] is None else float(row["duration_s"])
    why, duration, checks = judge_capture(
        declared, p, a["capture_spec"], a["target_unit"], claimed
    )
    unit = a["target_unit"]
    if why is None and duration is not None and a["quantity"] and pricing.measured_by_duration(unit):
        # The share is counted again with this clip's real length, and the
        # others': presign counted claimed lengths. As at presign, the clip
        # that crosses the line is taken; one after a share already met is not.
        held = await _held(session, row["assignment_id"], unit, exclude=asset_id)
        if Decimal(held["units"]) >= Decimal(a["quantity"]):
            why = (
                f"This assignment is for {pricing.quantity_text(a['quantity'], unit)} and already "
                f"has {hours_text(held['units'])} of footage. Remove a clip before adding another."
            )
    extra: dict[str, Any] = {"probe": p.facts()}
    if s.checksum:
        extra["storage_checksum"] = s.checksum
    found = json.dumps({"server": checks})

    if why is not None:
        await session.execute(
            text(
                "UPDATE asset SET status = 'quarantined', etag = :etag, updated_at = now(), "
                "       upload_session = NULL, quarantine_reason = :why, "
                "       metadata = metadata || CAST(:extra AS jsonb), "
                "       check_results = coalesce(check_results, '{}'::jsonb) || CAST(:found AS jsonb) "
                "WHERE id = :id"
            ),
            {"etag": s.etag, "id": asset_id, "why": why,
             "extra": json.dumps(extra), "found": found},
        )
    else:
        # The provider's own digest of what it holds, recorded beside the
        # phone's claims; the session is spent and goes.
        await session.execute(
            text(
                "UPDATE asset SET status = 'ready', etag = :etag, "
                "       mime_type = coalesce(:ct, mime_type), uploaded_at = now(), "
                "       updated_at = now(), upload_session = NULL, "
                "       duration_s = coalesce(:dur, duration_s), "
                "       metadata = metadata || CAST(:extra AS jsonb), "
                "       check_results = coalesce(check_results, '{}'::jsonb) || CAST(:found AS jsonb) "
                "WHERE id = :id"
            ),
            {
                "etag": s.etag, "ct": s.content_type, "id": asset_id, "dur": duration,
                "extra": json.dumps(extra), "found": found,
            },
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
) -> tuple[int, Decimal]:
    """Bundle every ready capture of an ACCEPTED assignment into the submission
    the aggregator hands to its delivery partner. Returns how many, and what
    they come to in the task's unit."""
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
    units = (
        await session.execute(
            text(
                "SELECT round(coalesce(sum(capture_units(t.target_unit, a.duration_s)), 0), 4) "
                "FROM asset a JOIN task t ON t.id = a.task_id "
                "WHERE a.submission_id = :s AND a.deleted_at IS NULL"
            ),
            {"s": submission_id},
        )
    ).scalar_one()
    return int(result.rowcount or 0), Decimal(units)


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
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    row = (
        await session.execute(
            text(
                "SELECT a.id, a.status AS asset_status, a.batch_id, ta.worker_user_id, "
                "       ta.status, ta.revoked_at, "
                "       a.storage_key, a.storage_target_id, a.upload_session "
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
        text(
            "UPDATE asset SET deleted_at = now(), updated_at = now(), upload_session = NULL "
            "WHERE id = :id"
        ),
        {"id": asset_id},
    )
    us = upload_session_from(row["upload_session"])
    if us is not None:
        # An unfinished chunked upload still holds parts in storage. Best
        # effort: the row is gone either way, and the sweep or the provider's
        # own expiry clears what this cannot reach.
        with contextlib.suppress(Exception):
            target = await storage_svc.resolve_by_id(session, row["storage_target_id"])
            await storage.resumable_abort(target, row["storage_key"], us)


# How many of an assignment's captures stand where (stage, above), in SQL. One
# fragment so the assignment payload, submit and the gate-1 settle all count
# alike. :a is the assignment.
_REWORK = (
    "s.status = 'rejected' AND NOT EXISTS ("
    "SELECT 1 FROM asset r WHERE r.replaces_asset_id = s.id "
    "AND r.deleted_at IS NULL AND r.status <> 'erased')"
)
# the same four, in the task's unit (db/510 capture_units): equal to the
# counts for a counted unit, hours of footage for hours
_UNITS = "round(coalesce(sum(capture_units(tu.target_unit, s.duration_s)) FILTER (WHERE {}), 0), 4)"
STAGE_COUNTS = (
    "SELECT count(*) FILTER (WHERE s.status = 'ready' AND s.batch_id IS NULL) AS draft, "
    "       count(*) FILTER (WHERE s.status = 'ready' AND b.status = 'in_review') AS in_review, "
    "       count(*) FILTER (WHERE s.status = 'ready' AND b.status = 'reviewed') AS accepted, "
    "       count(*) FILTER (WHERE " + _REWORK + ") AS rework, "
    "       " + _UNITS.format("s.status = 'ready' AND s.batch_id IS NULL") + " AS draft_units, "
    "       " + _UNITS.format("s.status = 'ready' AND b.status = 'in_review'") + " AS in_review_units, "
    "       " + _UNITS.format("s.status = 'ready' AND b.status = 'reviewed'") + " AS accepted_units, "
    "       " + _UNITS.format(_REWORK) + " AS rework_units "
    "FROM asset s LEFT JOIN capture_batch b ON b.id = s.batch_id "
    "LEFT JOIN task tu ON tu.id = s.task_id "
    "WHERE s.assignment_id = :a AND s.deleted_at IS NULL"
)
STAGES = ("draft", "in_review", "accepted", "rework")


async def stage_counts(session: AsyncSession, assignment_id: uuid.UUID) -> dict[str, int]:
    """{draft, in_review, accepted, rework} as capture counts, and the same
    with _units as Decimals in the task's unit."""
    r = (await session.execute(text(STAGE_COUNTS), {"a": assignment_id})).mappings().one()
    return stage_values(r)


def stage_values(r: Any) -> dict[str, Any]:
    """The counts and unit sums from a row carrying STAGE_COUNTS' columns."""
    out: dict[str, Any] = {k: int(r[k] or 0) for k in STAGES}
    out.update({f"{k}_units": Decimal(r[f"{k}_units"] or 0) for k in STAGES})
    return out


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
