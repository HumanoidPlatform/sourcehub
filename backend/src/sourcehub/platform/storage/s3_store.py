"""S3 storage adapter — the ONLY module besides its siblings here allowed to
import the minio SDK; .importlinter's no-vendor-sdks-in-domain contract fails
the build otherwise.

Despite the SDK's name this speaks to anything S3-compatible: AWS S3, MinIO,
Cloudflare R2, Wasabi, and Google Cloud Storage through its interoperability
endpoint with HMAC keys. Only the endpoint and the region change.

Presigned URLs end to end: the phone and the browser talk to object storage
directly and file bytes never traverse the API tier. The SDK is blocking, so
every call runs in a thread; the caller awaits a coroutine either way, the same
shape every adapter here honours (see platform/mail/smtp.py).

The endpoint must be reachable from the DEVICE, not just the API — presigned
URLs embed its host, which is why a client's destination has to be a real
public bucket and why localhost:9000 only ever works in development.

region is not optional in practice: SigV4 presigning against an S3 bucket
outside us-east-1 produces URLs the service rejects.
"""

from __future__ import annotations

import asyncio
import contextlib
import datetime as dt
import uuid
from urllib.parse import urlparse

from minio import Minio
from minio.error import S3Error

from sourcehub.config import settings
from sourcehub.platform.storage.types import ObjectStat, StorageError, StorageTarget

_DEFAULT_HOST = "s3.amazonaws.com"


def _client(t: StorageTarget) -> Minio:
    if t.endpoint:
        u = urlparse(t.endpoint)
        host, secure = (u.netloc or u.path), (u.scheme != "http")
    else:
        host, secure = _DEFAULT_HOST, True
    return Minio(
        host,
        access_key=str(t.secret.get("access_key_id") or ""),
        secret_key=str(t.secret.get("secret_access_key") or ""),
        secure=secure,
        region=t.region or None,
    )


def _ttl() -> dt.timedelta:
    return dt.timedelta(seconds=settings.storage_presign_ttl_seconds)


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    """A one-object, short-TTL upload URL. The URL is the credential.

    Returns the extra request headers the upload must carry — none for S3, but
    the caller treats every provider the same way.
    """
    url = await asyncio.to_thread(
        lambda: _client(t).presigned_put_object(t.bucket, key, expires=_ttl())
    )
    return url, {}


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    """A one-object, short-TTL download URL.

    attachment (the default) makes a browser save the file under the given
    name; inline lets an <img> or <video> render it in place, which is what
    the capture galleries need.
    """
    disposition = "inline" if inline else "attachment"
    return await asyncio.to_thread(
        lambda: _client(t).presigned_get_object(
            t.bucket,
            key,
            expires=_ttl(),
            response_headers={
                "response-content-disposition": f'{disposition}; filename="{filename}"'
            },
        )
    )


def _head_sync(t: StorageTarget, key: str) -> ObjectStat:
    try:
        s = _client(t).stat_object(t.bucket, key)
    except S3Error as e:
        if e.code in ("NoSuchKey", "NoSuchObject"):
            raise LookupError(key) from None
        raise
    etag = (s.etag or "").strip('"') or None
    return ObjectStat(size=s.size or 0, content_type=s.content_type, etag=etag)


async def head(t: StorageTarget, key: str) -> ObjectStat:
    """Size, content type and etag of a stored object; LookupError if absent.

    The confirm step of a capture upload records these, never the client's
    claim: a presigned PUT cannot cap what was uploaded.
    """
    return await asyncio.to_thread(_head_sync, t, key)


def _verify_sync(t: StorageTarget) -> None:
    import io

    c = _client(t)
    key = t.key(f".sourcehub-probe/{uuid.uuid4()}")
    body = b"sourcehub destination check"
    try:
        c.put_object(t.bucket, key, io.BytesIO(body), len(body), content_type="text/plain")
    except S3Error as e:
        raise StorageError(f"Could not write to the bucket: {e.code}") from None
    except Exception as e:
        # DNS, TLS and a wrong host all land here, and none of them are S3Error
        raise StorageError(f"Could not reach the endpoint: {type(e).__name__}") from None

    try:
        c.stat_object(t.bucket, key)
        r = c.get_object(t.bucket, key)
        try:
            r.read()
        finally:
            r.close()
            r.release_conn()
    except S3Error as e:
        raise StorageError(f"Wrote an object but could not read it back: {e.code}") from None
    finally:
        # A probe left behind is untidy, not a failure: the destination has
        # already proved it accepts writes and reads.
        with contextlib.suppress(Exception):
            c.remove_object(t.bucket, key)


async def verify(t: StorageTarget) -> None:
    """Write, stat, read and delete a probe object. StorageError if any fails.

    Delete is attempted but not required to pass: a bucket that accepts writes
    and reads is usable, and lifecycle rules can handle the probe.
    """
    await asyncio.to_thread(_verify_sync, t)
