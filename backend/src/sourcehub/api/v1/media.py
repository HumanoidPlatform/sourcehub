"""media — capture uploads: presign, confirm, list, view URL.

The API stays on the control path and off the data path: a presigned PUT is
minted here, the bytes go straight to object storage, and confirm asks
storage what it holds.
"""

from __future__ import annotations

import datetime as dt
import json
import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.modules.media import service as media
from sourcehub.modules.storage.service import StorageTargetError
from sourcehub.platform.storage import StorageError

router = APIRouter(route_class=TxRoute)


class DeviceCheck(BaseModel):
    """One thing the phone noticed about a capture before it queued it.

    The device is not trusted to judge its own work — these are recorded, not
    acted on. Everything the server actually enforces it checks itself, below.
    """

    code: str = Field(min_length=1, max_length=40)
    # "info" is a measurement the phone took and nothing more: it is not a
    # complaint, the worker is never shown it, and no count or queue reads it.
    # It exists because a reading the phone discarded once it was inside the
    # client's tolerance was a reading no reviewer ever saw — squareness, today.
    severity: Literal["block", "warn", "info"]
    message: str = Field(min_length=1, max_length=300)
    # a scored check (the subject check) says how sure it was, and what it
    # saw — so the reviewer can tell "shelf, floor" from a blank guess
    score: float | None = Field(default=None, ge=0, le=1)
    detail: dict[str, Any] | None = None

    @field_validator("detail")
    @classmethod
    def _small(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        if v is not None and len(json.dumps(v)) > 1024:
            raise ValueError("detail must be 1 KB or less")
        return v


class PresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=3, max_length=120)
    size_bytes: int = Field(gt=0, le=media.MAX_VIDEO_BYTES)
    # One of these names the file for the server's dedupe. A small file is
    # hashed whole; a chunked upload sends the phone's own capture id instead,
    # since hashing a gigabyte on a phone is what used to load it into memory.
    sha256: str | None = Field(default=None, min_length=64, max_length=64)
    client_capture_id: uuid.UUID | None = None
    # Ask to send the file in chunks against a storage session (honoured above
    # media.CHUNK_BYTES); restart drops a session the phone was told is gone.
    resumable: bool = False
    restart: bool = False
    captured_at: dt.datetime
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    # An older build sends no checks at all; that is an empty list, not a fault.
    checks: list[DeviceCheck] = Field(default_factory=list, max_length=20)
    # a retake: the capture sent back for rework that this one replaces
    replaces_asset_id: uuid.UUID | None = None
    # a clip's running time as the device measured it; an hours task counts by it
    duration_s: float | None = Field(default=None, gt=0, le=media.MAX_CLIP_SECONDS + 5)

    @model_validator(mode="after")
    def _identified(self) -> PresignIn:
        if self.sha256 is None and self.client_capture_id is None:
            raise ValueError("a capture needs a sha256 or a client_capture_id")
        return self


class PartsIn(BaseModel):
    """Which parts of a chunked upload the phone wants URLs for: a few at a
    time, so a signed URL is never minted long before it is used."""

    parts: list[int] = Field(min_length=1, max_length=16)


_STORAGE_ERRORS = (StorageError, StorageTargetError)


def _map(e: Exception) -> HTTPException:
    if isinstance(e, LookupError):
        return HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if isinstance(e, media.MediaInvalid):
        return HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))
    if isinstance(e, media.MediaGone):
        return HTTPException(status.HTTP_410_GONE, str(e))
    if isinstance(e, StorageError):
        # The client's own bucket, their endpoint, their credential: the most
        # exposed call the phone makes, and not a fault of the request.
        return HTTPException(status.HTTP_502_BAD_GATEWAY, str(e))
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.post("/assignments/{assignment_id}/assets/presign")
async def presign(
    assignment_id: uuid.UUID,
    body: PresignIn,
    principal: Principal = Depends(require_capability("asset.upload")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await media.presign_capture(
            session, principal, assignment_id,
            filename=body.filename, content_type=body.content_type, size_bytes=body.size_bytes,
            sha256=body.sha256, captured_at=body.captured_at, lat=body.lat, lon=body.lon,
            checks=[c.model_dump(exclude_none=True) for c in body.checks],
            replaces_asset_id=body.replaces_asset_id, duration_s=body.duration_s,
            client_capture_id=body.client_capture_id,
            resumable=body.resumable, restart=body.restart,
        )
    except (LookupError, media.MediaError, media.MediaInvalid, *_STORAGE_ERRORS) as e:
        raise _map(e) from None


@router.post("/assets/{asset_id}/upload/urls")
async def upload_part_urls(
    asset_id: uuid.UUID,
    body: PartsIn,
    principal: Principal = Depends(require_capability("asset.upload")),
    session: AsyncSession = Depends(get_session),
):
    """Signed URLs for the next parts of a chunked upload. The capturing
    worker's own, while the asset is still pending."""
    try:
        return await media.upload_part_urls(session, principal, asset_id, body.parts)
    except (LookupError, media.MediaError, media.MediaInvalid, *_STORAGE_ERRORS) as e:
        raise _map(e) from None


@router.get("/assets/{asset_id}/upload/status")
async def upload_status(
    asset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("asset.upload")),
    session: AsyncSession = Depends(get_session),
):
    """How far storage says a chunked upload has got: what the phone resumes
    from after a cut. 410 when the session is gone and the phone must start
    the upload again (presign with restart)."""
    try:
        return await media.upload_status(session, principal, asset_id)
    except (LookupError, media.MediaError, media.MediaGone, *_STORAGE_ERRORS) as e:
        raise _map(e) from None


@router.post("/assets/{asset_id}/confirm")
async def confirm(
    asset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("asset.upload")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await media.confirm_asset(session, principal, asset_id)
    except (LookupError, media.MediaError, *_STORAGE_ERRORS) as e:
        raise _map(e) from None


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def discard(
    asset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("asset.upload")),
    session: AsyncSession = Depends(get_session),
):
    """Drop a capture before submitting. The worker's own, and only while the
    assignment is still in progress."""
    try:
        await media.discard_asset(session, principal, asset_id)
    except (LookupError, media.MediaError) as e:
        raise _map(e) from None


@router.get("/assignments/{assignment_id}/assets")
async def assignment_assets(
    assignment_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await media.list_assets(session, principal, assignment_id=assignment_id)
    except LookupError as e:
        raise _map(e) from None


@router.get("/tasks/{task_id}/assets")
async def task_assets(
    task_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await media.list_assets(session, principal, task_id=task_id)
    except LookupError as e:
        raise _map(e) from None


@router.get("/assets/{asset_id}/url")
async def asset_url(
    asset_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """Returns {url} rather than a redirect: a 307 would make the browser
    forward the Authorization header to storage, which rejects a request
    carrying both a header and a query signature."""
    try:
        return await media.asset_view_url(session, principal, asset_id)
    except (LookupError, media.MediaError, *_STORAGE_ERRORS) as e:
        raise _map(e) from None
