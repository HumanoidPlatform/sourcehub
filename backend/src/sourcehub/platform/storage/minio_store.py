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
from typing import NamedTuple
from urllib.parse import urlparse

from minio import Minio
from minio.error import S3Error

from sourcehub.config import settings


class ObjectStat(NamedTuple):
    """What storage actually holds for a key — never what the client claimed."""

    size: int
    content_type: str | None
    etag: str | None


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


async def presign_get(bucket: str, key: str, filename: str, inline: bool = False) -> str:
    """A one-object, short-TTL download URL.

    attachment (the default) makes a browser save the file under the given
    name; inline lets an <img> or <video> render it in place, which is what
    the capture galleries need.
    """
    disposition = "inline" if inline else "attachment"
    return await asyncio.to_thread(
        lambda: _client().presigned_get_object(
            bucket,
            key,
            expires=_ttl(),
            response_headers={
                "response-content-disposition": f'{disposition}; filename="{filename}"'
            },
        )
    )


def _head_sync(bucket: str, key: str) -> ObjectStat:
    try:
        s = _client().stat_object(bucket, key)
    except S3Error as e:
        if e.code in ("NoSuchKey", "NoSuchObject"):
            raise LookupError(key) from None
        raise
    etag = (s.etag or "").strip('"') or None
    return ObjectStat(size=s.size or 0, content_type=s.content_type, etag=etag)


async def head(bucket: str, key: str) -> ObjectStat:
    """Size, content type and etag of a stored object; LookupError if absent.

    The confirm step of a capture upload records these, never the client's
    claim: a presigned PUT cannot cap what was uploaded.
    """
    return await asyncio.to_thread(_head_sync, bucket, key)


async def stat(bucket: str, key: str) -> tuple[int, str | None]:
    """(size_bytes, content_type) of a stored object; LookupError if absent.

    This is the real size enforcement — a presigned PUT cannot cap what the
    client uploads, so the recorded size comes from here, never the claim.
    """
    s = await head(bucket, key)
    return s.size, s.content_type
