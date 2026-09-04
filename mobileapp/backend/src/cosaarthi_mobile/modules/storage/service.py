from __future__ import annotations

import datetime as dt
from functools import lru_cache

import anyio
from minio import Minio
from minio.error import S3Error

from cosaarthi_mobile.config import settings


@lru_cache
def _internal_client() -> Minio:
    return Minio(
        endpoint=settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key.get_secret_value(),
        secure=settings.minio_secure,
        region=settings.minio_region,
    )


@lru_cache
def _public_presign_client() -> Minio:
    return Minio(
        endpoint=settings.minio_public_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key.get_secret_value(),
        secure=settings.minio_public_secure,
        region=settings.minio_region,
    )


async def ensure_bucket() -> None:
    client = _internal_client()

    def _ensure() -> None:
        if not client.bucket_exists(settings.minio_bucket_media):
            client.make_bucket(settings.minio_bucket_media)

    await anyio.to_thread.run_sync(_ensure)


async def stat_object(object_key: str) -> bool:
    client = _internal_client()

    def _stat() -> bool:
        try:
            client.stat_object(settings.minio_bucket_media, object_key)
            return True
        except S3Error as exc:
            if exc.code == "NoSuchKey":
                return False
            raise

    return await anyio.to_thread.run_sync(_stat)


async def presigned_put_url(object_key: str, _content_type: str) -> tuple[str, dt.datetime]:
    expires = dt.timedelta(seconds=settings.minio_presign_ttl_seconds)
    expires_at = dt.datetime.now(dt.UTC) + expires
    client = _public_presign_client()

    def _presign() -> str:
        return client.presigned_put_object(
            settings.minio_bucket_media,
            object_key,
            expires=expires,
        )

    return await anyio.to_thread.run_sync(_presign), expires_at
