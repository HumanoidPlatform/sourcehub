"""media — capture uploads: presign, confirm, list, view URL.

The API stays on the control path and off the data path: a presigned PUT is
minted here, the bytes go straight to object storage, and confirm asks
storage what it holds.
"""

from __future__ import annotations

import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.modules.media import service as media
from sourcehub.platform.storage import StorageError

router = APIRouter(route_class=TxRoute)


class PresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=3, max_length=120)
    size_bytes: int = Field(gt=0, le=media.MAX_VIDEO_BYTES)
    sha256: str = Field(min_length=64, max_length=64)
    captured_at: dt.datetime
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)


def _map(e: Exception) -> HTTPException:
    if isinstance(e, LookupError):
        return HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if isinstance(e, media.MediaInvalid):
        return HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))
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
        )
    except StorageError as e:
        # The capture presign runs against the CLIENT's bucket, so this is the
        # most exposed of the three: their endpoint, their credential.
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from None
    except (LookupError, media.MediaError, media.MediaInvalid) as e:
        raise _map(e) from None


@router.post("/assets/{asset_id}/confirm")
async def confirm(
    asset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("asset.upload")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await media.confirm_asset(session, principal, asset_id)
    except (LookupError, media.MediaError) as e:
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
    except (LookupError, media.MediaError) as e:
        raise _map(e) from None
