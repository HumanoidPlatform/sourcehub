from __future__ import annotations

import datetime as dt
import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.api.schemas import (
    ConfirmUploadIn,
    PresignUploadIn,
    PresignUploadOut,
    UploadMediaOut,
)
from cosaarthi_mobile.config import settings
from cosaarthi_mobile.db.models import Asset, User
from cosaarthi_mobile.modules.storage import service as storage
from cosaarthi_mobile.modules.tasks.service import get_task_by_code

ALLOWED_IMAGE_MIME = {"image/jpeg", "image/jpg", "image/png"}


def _safe_name(name: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9._-]+", "-", name).strip(".-")
    return clean or "upload.bin"


def _validate_upload(body: PresignUploadIn) -> None:
    if body.kind != "image":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only image uploads are enabled")
    if body.mime_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Only jpg, jpeg and png images are allowed",
        )
    if body.size_bytes > settings.max_image_upload_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image file is too large")


async def presign_upload(
    session: AsyncSession,
    user: User,
    body: PresignUploadIn,
) -> PresignUploadOut:
    _validate_upload(body)
    task = await get_task_by_code(session, body.task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    existing = await session.scalar(
        select(Asset).where(Asset.user_id == user.id, Asset.idempotency_key == body.idempotency_key)
    )
    if existing:
        url, expires_at = await storage.presigned_put_url(existing.object_key, existing.mime_type)
        return PresignUploadOut(
            expires_at=expires_at,
            headers={"Content-Type": existing.mime_type},
            object_key=existing.object_key,
            upload_id=existing.id,
            upload_url=url,
        )

    object_key = (
        f"tasks/{body.task_id}/users/{user.id}/"
        f"{uuid.uuid5(uuid.NAMESPACE_URL, body.idempotency_key)}/{_safe_name(body.file_name)}"
    )
    asset = Asset(
        file_name=_safe_name(body.file_name),
        idempotency_key=body.idempotency_key,
        mime_type=body.mime_type,
        object_key=object_key,
        size_bytes=body.size_bytes,
        status="queued",
        task_id=task.id,
        user_id=user.id,
    )
    session.add(asset)
    await session.flush()
    url, expires_at = await storage.presigned_put_url(object_key, body.mime_type)
    return PresignUploadOut(
        expires_at=expires_at,
        headers={"Content-Type": body.mime_type},
        object_key=object_key,
        upload_id=asset.id,
        upload_url=url,
    )


async def confirm_upload(
    session: AsyncSession,
    user: User,
    body: ConfirmUploadIn,
) -> UploadMediaOut:
    asset = await session.scalar(
        select(Asset).where(
            Asset.id == body.upload_id,
            Asset.user_id == user.id,
            Asset.idempotency_key == body.idempotency_key,
        )
    )
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Upload not found")
    task = await get_task_by_code(session, body.task_id)
    if task is None or asset.task_id != task.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "Upload does not match this task")

    exists = await storage.stat_object(asset.object_key)
    if not exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Uploaded object is not present in MinIO")

    asset.status = "uploaded"
    asset.uploaded_at = dt.datetime.now(dt.UTC)
    await session.flush()
    return UploadMediaOut(
        message="Image uploaded to mobile MinIO and metadata recorded.",
        object_key=asset.object_key,
        status="accepted",
        submission_id=f"asset-{asset.id}",
    )
