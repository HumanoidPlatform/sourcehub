"""MinIO storage adapter. The ONLY module allowed to import the minio SDK —
.importlinter's no-vendor-sdks-in-domain contract fails the build otherwise.

Presigned URLs end to end: the browser talks to object storage directly and
file bytes never traverse the API tier. The SDK is blocking, so every call
runs in a thread; the caller awaits a coroutine either way, the same shape
every adapter here honours (see platform/mail/smtp.py).

STORAGE_ENDPOINT must be reachable from the BROWSER, not just the API —
presigned URLs embed its host (localhost:9000 in development).
"""

from __future__ import annotations

import asyncio
import datetime as dt
from urllib.parse import urlparse

from minio import Minio
from minio.error import S3Error

from sourcehub.config import settings


def _client() -> Minio:
    u = urlparse(settings.storage_endpoint)
    return Minio(
        u.netloc,
        access_key=settings.storage_access_key,
        secret_key=settings.storage_secret_key.get_secret_value(),
        secure=(u.scheme == "https"),
    )


def _ttl() -> dt.timedelta:
    return dt.timedelta(seconds=settings.storage_presign_ttl_seconds)


async def presign_put(bucket: str, key: str) -> str:
    """A one-object, short-TTL upload URL. The URL is the credential."""
    return await asyncio.to_thread(
        lambda: _client().presigned_put_object(bucket, key, expires=_ttl())
    )


async def presign_get(bucket: str, key: str, filename: str) -> str:
    """A one-object, short-TTL download URL that saves under the given name."""
    return await asyncio.to_thread(
        lambda: _client().presigned_get_object(
            bucket,
            key,
            expires=_ttl(),
            response_headers={
                "response-content-disposition": f'attachment; filename="{filename}"'
            },
        )
    )


def _stat_sync(bucket: str, key: str) -> tuple[int, str | None]:
    try:
        s = _client().stat_object(bucket, key)
    except S3Error as e:
        if e.code in ("NoSuchKey", "NoSuchObject"):
            raise LookupError(key) from None
        raise
    return s.size or 0, s.content_type


async def stat(bucket: str, key: str) -> tuple[int, str | None]:
    """(size_bytes, content_type) of a stored object; LookupError if absent.

    This is the real size enforcement — a presigned PUT cannot cap what the
    client uploads, so the recorded size comes from here, never the claim.
    """
    return await asyncio.to_thread(_stat_sync, bucket, key)
