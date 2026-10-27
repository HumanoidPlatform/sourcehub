"""Google Cloud Storage adapter, native: V4 signed URLs, no S3 layer.

Two ways in, chosen by what the target carries:

  * A service-account JSON key in secret["service_account_json"]. A client's
    own delivery destination always comes this way — the client creates a
    service account with access to their bucket and hands us its key, the same
    as an S3 key pair or an Azure account key.

  * Nothing, which means keyless. Only the platform's own storage does this,
    on a Google Cloud VM: the VM's service account is found through
    google.auth.default(), and URLs are signed by the IAM signBlob API on its
    behalf. That needs the IAM Service Account Credentials API enabled and the
    account holding Service Account Token Creator on itself — and in exchange
    no key exists that could leak.

Things that differ from the other two adapters, all deliberate:

  * presign_put returns no extra headers. GCS needs nothing like Azure's
    x-ms-blob-type, and the Content-Type the client sends is not signed — the
    same as s3_store, so the stored type is checked with head() afterwards
    rather than trusted.
  * The SDK retries and waits generously by default. Every call here passes
    timeout and retry explicitly, for the reason s3_store.py:44-53 records: an
    unreachable host must fail a request quickly, not hold its thread.
"""

from __future__ import annotations

import asyncio
import contextlib
import datetime as dt
import hashlib
import json
import re
import threading
import uuid
from typing import Any

import google.auth
import httpx
from google.api_core.exceptions import Forbidden, GoogleAPIError, NotFound, Unauthorized
from google.auth.exceptions import DefaultCredentialsError, GoogleAuthError, RefreshError
from google.auth.transport.requests import Request as AuthRequest
from google.cloud import storage as gcs
from google.oauth2 import service_account

from sourcehub.config import settings
from sourcehub.platform.storage.types import (
    CHUNK_BYTES,
    ObjectStat,
    StorageError,
    StorageTarget,
    UploadSession,
    UploadStatus,
)

# 3-63 characters: lowercase letters, digits, dashes, underscores and dots,
# starting and ending with a letter or digit. (Dotted names may run to 222 but
# need domain verification; nobody hands those to a capture platform.)
_BUCKET = re.compile(r"^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$")

_TIMEOUT = (5, 30)  # connect, read — same numbers as the other adapters
_HOST = "storage.googleapis.com"
_SCOPES = ("https://www.googleapis.com/auth/cloud-platform",)

# One client per credential identity, reused: a gcs.Client per call builds a
# new HTTP session every time and nothing closes it.
_CLIENTS: dict[str, tuple[gcs.Client, Any]] = {}
_LOCK = threading.Lock()


def _key_info(t: StorageTarget) -> dict[str, Any] | None:
    """The service-account key on this target, parsed — or None for keyless."""
    raw = t.secret.get("service_account_json") if t.secret else None
    if raw in (None, "", {}):
        return None
    if isinstance(raw, str):
        try:
            info = json.loads(raw)
        except json.JSONDecodeError:
            raise StorageError("The service account key is not valid JSON.") from None
    elif isinstance(raw, dict):
        info = dict(raw)
    else:
        raise StorageError("The service account key is not valid JSON.")
    if not isinstance(info, dict) or info.get("type") != "service_account":
        raise StorageError(
            "That file is not a service account key (its type must be service_account)."
        )
    if not info.get("client_email") or not info.get("private_key"):
        raise StorageError("The service account key is missing its client_email or private_key.")
    return info


def _client(t: StorageTarget) -> tuple[gcs.Client, Any]:
    """(client, credentials). Keyless credentials come from the environment."""
    info = _key_info(t)
    if info is not None:
        ident = hashlib.sha256(
            f"{info['client_email']}|{info.get('private_key_id', '')}|{t.endpoint or ''}".encode()
        ).hexdigest()
    else:
        ident = f"keyless|{t.endpoint or ''}"
    with _LOCK:
        cached = _CLIENTS.get(ident)
        if cached is not None:
            return cached
        try:
            if info is not None:
                creds = service_account.Credentials.from_service_account_info(  # type: ignore[no-untyped-call]
                    info, scopes=_SCOPES
                )
                project = info.get("project_id")
            else:
                creds, project = google.auth.default(scopes=_SCOPES)
        except DefaultCredentialsError:
            raise StorageError(
                "No Google credentials are available here. Platform storage on Google Cloud "
                "signs with the VM's service account; elsewhere set a service account key."
            ) from None
        except (ValueError, GoogleAuthError) as e:
            raise StorageError(
                f"The service account key could not be read: {type(e).__name__}"
            ) from None
        options = {"api_endpoint": t.endpoint} if t.endpoint else None
        client = gcs.Client(project=project, credentials=creds, client_options=options)
        _CLIENTS[ident] = (client, creds)
        return client, creds


def _check_bucket(t: StorageTarget) -> None:
    if not _BUCKET.match(t.bucket or ""):
        raise StorageError(
            f"{t.bucket!r} is not a valid Google Cloud Storage bucket name — 3 to 63 characters, "
            "lowercase letters, digits, dashes, underscores and dots."
        )


def _ttl() -> dt.timedelta:
    return dt.timedelta(seconds=settings.storage_presign_ttl_seconds)


def _wrap(e: Exception, t: StorageTarget) -> StorageError:
    """A message safe to show a client: never the credential, never a stack."""
    if isinstance(e, StorageError):
        return e
    if isinstance(e, (RefreshError, Unauthorized)):
        return StorageError("Google refused the credential.")
    if isinstance(e, Forbidden):
        return StorageError(f"The service account has no access to the bucket {t.bucket!r}.")
    if isinstance(e, NotFound):
        return StorageError(f"The bucket {t.bucket!r} does not exist.")
    host = t.endpoint or _HOST
    return StorageError(f"Could not reach {host}: {type(e).__name__}")


def _bucket_missing(e: NotFound) -> bool:
    """A 404 for the bucket, as opposed to one for the object.

    Callers turn LookupError into "the file was never uploaded", which would be
    a misleading thing to say about a bucket that is not there at all.
    """
    text = str(e).lower()
    return "bucket" in text and ("does not exist" in text or "not found" in text)


def _sign(t: StorageTarget, key: str, **kw: Any) -> str:
    client, creds = _client(t)
    blob = client.bucket(t.bucket).blob(key)
    extra: dict[str, Any] = {}
    if _key_info(t) is None:
        # Keyless: no private key here, so Google signs through IAM signBlob
        # with the environment's service account and a fresh access token.
        if not creds.valid:
            creds.refresh(AuthRequest())
        extra = {"service_account_email": creds.service_account_email, "access_token": creds.token}
    endpoint = t.public_endpoint or t.endpoint
    if endpoint:
        extra["api_access_endpoint"] = endpoint
    # The blob's client carries the credentials; with a key they sign locally.
    return str(blob.generate_signed_url(version="v4", expiration=_ttl(), **extra, **kw))


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    """Upload URL. GCS needs no extra header on the PUT."""
    _check_bucket(t)
    try:
        url = await asyncio.to_thread(lambda: _sign(t, key, method="PUT"))
    except Exception as e:  # a bad key fails in the signer, not over HTTP
        raise _wrap(e, t) from None
    return url, {}


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    """Download URL. The disposition is part of the signed URL, not an override."""
    _check_bucket(t)
    disposition = "inline" if inline else "attachment"
    try:
        return await asyncio.to_thread(
            lambda: _sign(
                t, key, method="GET", response_disposition=f'{disposition}; filename="{filename}"'
            )
        )
    except Exception as e:
        raise _wrap(e, t) from None


def _head_sync(t: StorageTarget, key: str) -> ObjectStat:
    client, _ = _client(t)
    blob = client.bucket(t.bucket).blob(key)
    try:
        blob.reload(timeout=_TIMEOUT, retry=None)
    except NotFound as e:
        if _bucket_missing(e):
            raise StorageError(f"The bucket {t.bucket!r} does not exist.") from None
        raise LookupError(key) from None
    except Exception as e:
        raise _wrap(e, t) from None
    crc = getattr(blob, "crc32c", None)
    return ObjectStat(
        size=int(blob.size or 0),
        content_type=blob.content_type,
        etag=(blob.etag or "").strip('"') or None,
        # Google computes a CRC32C over every object, however it arrived
        checksum=f"crc32c:{crc}" if crc else None,
    )


async def head(t: StorageTarget, key: str) -> ObjectStat:
    _check_bucket(t)
    return await asyncio.to_thread(_head_sync, t, key)


def _read_range_sync(t: StorageTarget, key: str, start: int, length: int) -> bytes:
    client, _ = _client(t)
    blob = client.bucket(t.bucket).blob(key)
    try:
        # end is inclusive; a partial read has no whole-object checksum to match
        return blob.download_as_bytes(
            start=start, end=start + length - 1, timeout=_TIMEOUT, retry=None, checksum=None
        )
    except NotFound as e:
        if _bucket_missing(e):
            raise StorageError(f"The bucket {t.bucket!r} does not exist.") from None
        raise LookupError(key) from None
    except Exception as e:
        raise _wrap(e, t) from None


async def read_range(t: StorageTarget, key: str, start: int, length: int) -> bytes:
    _check_bucket(t)
    return await asyncio.to_thread(_read_range_sync, t, key, start, length)


def _copy_sync(t: StorageTarget, src: str, dst: str) -> None:
    """Server-side copy within the bucket. The bytes never pass through the API."""
    client, _ = _client(t)
    bucket = client.bucket(t.bucket)
    try:
        bucket.copy_blob(bucket.blob(src), bucket, dst, timeout=_TIMEOUT, retry=None)
    except NotFound as e:
        if _bucket_missing(e):
            raise StorageError(f"The bucket {t.bucket!r} does not exist.") from None
        raise LookupError(src) from None
    except Exception as e:
        raise _wrap(e, t) from None


async def copy(t: StorageTarget, src: str, dst: str) -> None:
    _check_bucket(t)
    await asyncio.to_thread(_copy_sync, t, src, dst)


# A cross-bucket copy reads the whole source in one request and writes it in
# resumable chunks, so its read timeout is the copy's own, as Azure's is.
_COPY_TIMEOUT = (5, 600)
_COPY_CHUNK = 8 * 1024 * 1024  # resumable uploads want a multiple of 256 KiB


def _copy_from_url_sync(t: StorageTarget, dst: str, source_url: str) -> None:
    """Copy into this bucket from a signed GET elsewhere: the cross-account
    counterpart of _copy_sync, for a capture in a client's own bucket.

    Google has no call that fetches a foreign URL into a bucket (Storage
    Transfer is a batch service), so the bytes stream through this process
    once: read in chunks, written as a resumable upload of the same chunks.
    Nothing is held beyond one chunk and nothing touches disk. The signed URL
    is a credential, so no message carries it.
    """
    client, _ = _client(t)
    blob = client.bucket(t.bucket).blob(dst)
    timeout = httpx.Timeout(_COPY_TIMEOUT[1], connect=_COPY_TIMEOUT[0])
    try:
        with httpx.stream("GET", source_url, timeout=timeout) as r:
            if r.status_code == 404:
                raise LookupError(dst)
            if r.status_code >= 400:
                raise StorageError(f"The source refused the copy: HTTP {r.status_code}.")
            with blob.open(
                "wb",
                chunk_size=_COPY_CHUNK,
                ignore_flush=True,
                content_type=r.headers.get("content-type") or "application/octet-stream",
                timeout=_COPY_TIMEOUT,
                retry=None,
            ) as out:
                for chunk in r.iter_bytes():
                    out.write(chunk)
    except (LookupError, StorageError):
        raise
    except httpx.HTTPError as e:
        raise StorageError(f"Could not read the source: {type(e).__name__}") from None
    except NotFound as e:
        if _bucket_missing(e):
            raise StorageError(f"The bucket {t.bucket!r} does not exist.") from None
        raise _wrap(e, t) from None
    except Exception as e:
        raise _wrap(e, t) from None


async def copy_from_url(t: StorageTarget, dst: str, source_url: str) -> None:
    _check_bucket(t)
    await asyncio.to_thread(_copy_from_url_sync, t, dst, source_url)


def _delete_sync(t: StorageTarget, key: str) -> None:
    client, _ = _client(t)
    try:
        client.bucket(t.bucket).blob(key).delete(timeout=_TIMEOUT, retry=None)
    except NotFound:
        return  # already gone is the desired state
    except Exception as e:
        raise _wrap(e, t) from None


async def delete(t: StorageTarget, key: str) -> None:
    _check_bucket(t)
    await asyncio.to_thread(_delete_sync, t, key)


def _verify_sync(t: StorageTarget) -> None:
    key = t.key(f".sourcehub-probe/{uuid.uuid4()}")
    body = b"sourcehub destination check"
    try:
        client, _ = _client(t)
        blob = client.bucket(t.bucket).blob(key)
        blob.upload_from_string(body, content_type="text/plain", timeout=_TIMEOUT, retry=None)
    except StorageError:
        raise
    except Forbidden:
        raise StorageError(
            f"The service account cannot write to the bucket {t.bucket!r} — give it "
            "Storage Object Admin on that bucket."
        ) from None
    except GoogleAPIError as e:
        raise _wrap(e, t) from None
    except Exception as e:  # a malformed key fails before any HTTP call
        raise _wrap(e, t) from None

    try:
        blob.reload(timeout=_TIMEOUT, retry=None)
        if blob.download_as_bytes(timeout=_TIMEOUT, retry=None) != body:
            raise StorageError("Wrote an object but read back something else.")
        # Signing is the other half of what a destination must do: a key that
        # can write but not sign (or a keyless account without Token Creator)
        # would pass the write and fail every upload in the field.
        _sign(t, key, method="GET")
    except StorageError:
        raise
    except GoogleAPIError as e:
        raise StorageError(
            f"Wrote an object but could not read it back: {type(e).__name__}"
        ) from None
    except Exception as e:
        raise StorageError(
            f"Wrote an object but could not sign a link to it: {type(e).__name__}"
        ) from None
    finally:
        with contextlib.suppress(Exception):
            blob.delete(timeout=_TIMEOUT, retry=None)


async def verify(t: StorageTarget) -> None:
    _check_bucket(t)
    await asyncio.to_thread(_verify_sync, t)


# ---------------------------------------------------------------------------
# Resumable uploads: a session Google keeps for seven days. The session URL
# alone authorises writing the object, which is why the asset never lists it.
# The phone PUTs each chunk to it with a Content-Range; Google answers 308 and
# says in Range how much it holds, or 200/201 when the last chunk lands. Status
# is asked the same way with an empty body, so the server can answer the phone
# without the phone ever holding anything but its own chunk.
# ---------------------------------------------------------------------------

_SESSION_TIMEOUT = httpx.Timeout(_TIMEOUT[1], connect=_TIMEOUT[0])


def _resumable_start_sync(
    t: StorageTarget, key: str, size: int, content_type: str
) -> UploadSession:
    client, _ = _client(t)
    blob = client.bucket(t.bucket).blob(key)
    try:
        url = blob.create_resumable_upload_session(
            content_type=content_type, size=size, timeout=_TIMEOUT, retry=None, checksum=None
        )
    except Exception as e:
        raise _wrap(e, t) from None
    if not url:
        raise StorageError("Google did not open an upload session.")
    return UploadSession("gcs", str(url), CHUNK_BYTES, size)


def _bytes_held(range_header: str | None) -> int:
    """Google's `Range: bytes=0-8388607` is the last byte held: one more is the count."""
    m = re.match(r"bytes=0-(\d+)$", (range_header or "").strip())
    return int(m.group(1)) + 1 if m else 0


def _resumable_status_sync(t: StorageTarget, key: str, session: UploadSession) -> UploadStatus:
    try:
        r = httpx.put(
            session.session,
            content=b"",
            headers={"Content-Range": f"bytes */{session.size}"},
            timeout=_SESSION_TIMEOUT,
        )
    except httpx.HTTPError as e:
        raise StorageError(f"Could not reach Google's upload session: {type(e).__name__}") from None
    if r.status_code == 308:
        return UploadStatus(_bytes_held(r.headers.get("Range")), [])
    if 200 <= r.status_code < 300:
        return UploadStatus(session.size, [])
    if r.status_code in (404, 410):
        raise LookupError(key)
    raise StorageError(f"Google refused the upload session query: HTTP {r.status_code}.")


def _resumable_abort_sync(session: UploadSession) -> None:
    # Google answers 499 to the cancel; anything else, including no answer, is
    # left to the seven-day expiry. Best effort by design.
    with contextlib.suppress(Exception):
        httpx.delete(session.session, headers={"Content-Length": "0"}, timeout=_SESSION_TIMEOUT)


async def resumable_start(
    t: StorageTarget, key: str, size: int, content_type: str
) -> UploadSession:
    _check_bucket(t)
    return await asyncio.to_thread(_resumable_start_sync, t, key, size, content_type)


async def resumable_part_urls(
    t: StorageTarget, key: str, session: UploadSession, parts: list[int]
) -> dict[int, str]:
    # Every chunk goes to the session URL; there is nothing per part to sign.
    return {}


async def resumable_status(t: StorageTarget, key: str, session: UploadSession) -> UploadStatus:
    return await asyncio.to_thread(_resumable_status_sync, t, key, session)


async def resumable_complete(
    t: StorageTarget, key: str, session: UploadSession, content_type: str
) -> None:
    # The last chunk completes a Google session; confirm's head() then finds
    # the object or does not. Nothing to assemble here.
    return None


async def resumable_abort(t: StorageTarget, key: str, session: UploadSession) -> None:
    await asyncio.to_thread(_resumable_abort_sync, session)
