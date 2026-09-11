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

Two addresses, not one. A presigned URL embeds the host it was signed against —
SigV4 covers the Host header — so the URL must carry an address the DEVICE can
resolve, while the calls the API makes for itself go somewhere it can reach.
For platform storage those differ: localhost for us, the LAN address for a
phone. For a client's own bucket they are the same, and public_endpoint is
left unset.

region is not optional in practice, for two reasons. SigV4 presigning against a
bucket outside us-east-1 produces URLs the service rejects — and without a
region the SDK fetches one over the network before it will sign anything, which
made presigning depend on a host it has no business contacting.
"""

from __future__ import annotations

import asyncio
import contextlib
import datetime as dt
import uuid
from urllib.parse import urlparse

import urllib3
from minio import Minio
from minio.error import S3Error

from sourcehub.config import settings
from sourcehub.platform.storage.types import ObjectStat, StorageError, StorageTarget

_DEFAULT_HOST = "s3.amazonaws.com"

# The SDK's default connect timeout is 300 seconds. An unreachable endpoint
# therefore hung a request thread for five minutes and then returned a stack
# trace. Five seconds is long enough for a real network and short enough that
# the answer arrives while someone is still looking at the screen.
_HTTP = urllib3.PoolManager(
    timeout=urllib3.Timeout(connect=5.0, read=30.0),
    # No retry. A host that refused to answer in five seconds will not answer
    # in ten, and retrying only doubles how long someone waits to be told.
    retries=False,
)


def _client(t: StorageTarget, *, signing: bool) -> Minio:
    """A client bound to one of the two addresses.

    signing=True builds URLs for whoever opens them — a browser, a phone — so
    it must use the public host: SigV4 covers the Host header, and a URL signed
    against one host is rejected when called on another.

    signing=False is for calls the API makes itself, which go to the address
    the API can actually reach.

    Passing region matters more than it looks. Without it the SDK issues a live
    GetBucketLocation before signing anything, which turned presigning — pure
    computation — into a network round trip against a host that need not be
    reachable from here at all.
    """
    raw = (t.public_endpoint or t.endpoint) if signing else t.endpoint
    if raw:
        u = urlparse(raw)
        host, secure = (u.netloc or u.path), (u.scheme != "http")
    else:
        host, secure = _DEFAULT_HOST, True
    return Minio(
        host,
        access_key=str(t.secret.get("access_key_id") or ""),
        secret_key=str(t.secret.get("secret_access_key") or ""),
        secure=secure,
        region=t.region or None,
        http_client=_HTTP,
    )


def _unreachable(host: str | None, e: Exception) -> StorageError:
    """One message for every way a host can fail to answer."""
    where = host or "storage"
    return StorageError(f"Could not reach {where}: {type(e).__name__}")


def _ttl() -> dt.timedelta:
    return dt.timedelta(seconds=settings.storage_presign_ttl_seconds)


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    """A one-object, short-TTL upload URL. The URL is the credential.

    Returns the extra request headers the upload must carry — none for S3, but
    the caller treats every provider the same way.
    """
    try:
        url = await asyncio.to_thread(
            lambda: _client(t, signing=True).presigned_put_object(t.bucket, key, expires=_ttl())
        )
    except Exception as e:
        # With a region set this is pure computation and should not fail. It
        # still can, for a target whose region was never filled in.
        raise _unreachable(t.public_endpoint or t.endpoint, e) from None
    return url, {}


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    """A one-object, short-TTL download URL.

    attachment (the default) makes a browser save the file under the given
    name; inline lets an <img> or <video> render it in place, which is what
    the capture galleries need.
    """
    disposition = "inline" if inline else "attachment"
    try:
        return await asyncio.to_thread(
            lambda: _client(t, signing=True).presigned_get_object(
                t.bucket,
                key,
                expires=_ttl(),
                response_headers={
                    "response-content-disposition": f'{disposition}; filename="{filename}"'
                },
            )
        )
    except Exception as e:
        raise _unreachable(t.public_endpoint or t.endpoint, e) from None


def _head_sync(t: StorageTarget, key: str) -> ObjectStat:
    try:
        s = _client(t, signing=False).stat_object(t.bucket, key)
    except S3Error as e:
        if e.code in ("NoSuchKey", "NoSuchObject"):
            raise LookupError(key) from None
        raise StorageError(f"Storage refused the request: {e.code}") from None
    except Exception as e:
        # A real call to a real host, so this one genuinely can be unreachable.
        raise _unreachable(t.endpoint, e) from None
    etag = (s.etag or "").strip('"') or None
    return ObjectStat(size=s.size or 0, content_type=s.content_type, etag=etag)


async def head(t: StorageTarget, key: str) -> ObjectStat:
    """Size, content type and etag of a stored object; LookupError if absent.

    The confirm step of a capture upload records these, never the client's
    claim: a presigned PUT cannot cap what was uploaded.
    """
    return await asyncio.to_thread(_head_sync, t, key)


def _copy_sync(t: StorageTarget, src: str, dst: str) -> None:
    from minio.commonconfig import CopySource

    c = _client(t, signing=False)
    try:
        c.copy_object(t.bucket, dst, CopySource(t.bucket, src))
    except S3Error as e:
        if e.code in ("NoSuchKey", "NoSuchObject"):
            raise LookupError(src) from None
        raise StorageError(f"Storage refused the copy: {e.code}") from None
    except Exception as e:  # noqa: BLE001
        raise _unreachable(t.endpoint, e) from None


async def copy(t: StorageTarget, src: str, dst: str) -> None:
    """Server-side copy. The bytes never pass through the API."""
    await asyncio.to_thread(_copy_sync, t, src, dst)


def _delete_sync(t: StorageTarget, key: str) -> None:
    try:
        _client(t, signing=False).remove_object(t.bucket, key)
    except S3Error as e:
        if e.code in ("NoSuchKey", "NoSuchObject"):
            return  # already gone is the desired state
        raise StorageError(f"Storage refused the delete: {e.code}") from None
    except Exception as e:  # noqa: BLE001
        raise _unreachable(t.endpoint, e) from None


async def delete(t: StorageTarget, key: str) -> None:
    await asyncio.to_thread(_delete_sync, t, key)


def _verify_sync(t: StorageTarget) -> None:
    import io

    # The probe writes and reads for real, so it uses the address the API can
    # reach — not the one a phone would.
    c = _client(t, signing=False)
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
