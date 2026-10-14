"""Google Cloud Storage adapter.

GCS signed URLs are the same control/data split as the other adapters: the API
creates a short-lived URL, then the phone or browser uploads bytes directly to
the bucket. Signing needs credentials that can sign bytes, either a service
account JSON blob in the target secret or application-default credentials on a
runtime whose credentials expose a signer.
"""

from __future__ import annotations

import asyncio
import contextlib
import datetime as dt
import json
import uuid
from typing import Any

from google.api_core.exceptions import Forbidden, GoogleAPIError, NotFound
from google.auth.exceptions import DefaultCredentialsError, GoogleAuthError
from google.cloud import storage as gcs
from google.oauth2 import service_account

from sourcehub.config import settings
from sourcehub.platform.storage.types import ObjectStat, StorageError, StorageTarget


def _ttl() -> dt.timedelta:
    return dt.timedelta(seconds=settings.storage_presign_ttl_seconds)


def _credentials(t: StorageTarget) -> Any | None:
    raw = str(t.secret.get("service_account_json") or "").strip()
    if not raw:
        return None
    try:
        info = json.loads(raw)
    except json.JSONDecodeError:
        raise StorageError("GCS service account JSON is not valid JSON.") from None
    try:
        return service_account.Credentials.from_service_account_info(info)
    except (TypeError, ValueError, GoogleAuthError) as e:
        raise StorageError(
            f"GCS service account JSON could not be loaded: {type(e).__name__}"
        ) from None


def _client(t: StorageTarget) -> gcs.Client:
    project = str(t.secret.get("project") or "").strip() or None
    try:
        return gcs.Client(project=project, credentials=_credentials(t))
    except StorageError:
        raise
    except DefaultCredentialsError:
        raise StorageError(
            "GCS needs application-default credentials or STORAGE_GCS_CREDENTIALS_JSON."
        ) from None
    except Exception as e:
        raise StorageError(f"Could not initialise GCS: {type(e).__name__}") from None


def _bucket(t: StorageTarget) -> gcs.Bucket:
    return _client(t).bucket(t.bucket)


def _blob(t: StorageTarget, key: str) -> gcs.Blob:
    return _bucket(t).blob(key)


def _wrap(t: StorageTarget, e: Exception) -> StorageError:
    if isinstance(e, StorageError):
        return e
    if isinstance(e, Forbidden):
        return StorageError(
            f"GCS refused access to bucket {t.bucket!r}. Grant the signing service "
            "account object create/read/delete access to that bucket."
        )
    if isinstance(e, GoogleAPIError):
        return StorageError(f"GCS refused the request: {type(e).__name__}")
    return StorageError(f"Could not reach GCS: {type(e).__name__}")


def _signing_error(e: Exception) -> StorageError:
    if isinstance(e, StorageError):
        return e
    return StorageError(
        "GCS signed URLs need service-account credentials that can sign URLs."
    )


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    """A one-object, short-TTL upload URL."""
    try:
        url = await asyncio.to_thread(
            lambda: _blob(t, key).generate_signed_url(
                version="v4", expiration=_ttl(), method="PUT"
            )
        )
    except Exception as e:
        raise _signing_error(e) from None
    return url, {}


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    disposition = "inline" if inline else "attachment"
    try:
        return await asyncio.to_thread(
            lambda: _blob(t, key).generate_signed_url(
                version="v4",
                expiration=_ttl(),
                method="GET",
                response_disposition=f'{disposition}; filename="{filename}"',
            )
        )
    except Exception as e:
        raise _signing_error(e) from None


def _head_sync(t: StorageTarget, key: str) -> ObjectStat:
    b = _blob(t, key)
    try:
        b.reload()
    except NotFound:
        raise LookupError(key) from None
    except Exception as e:
        raise _wrap(t, e) from None
    return ObjectStat(
        size=int(b.size or 0),
        content_type=b.content_type,
        etag=(b.etag or "").strip('"') or None,
    )


async def head(t: StorageTarget, key: str) -> ObjectStat:
    return await asyncio.to_thread(_head_sync, t, key)


def _copy_sync(t: StorageTarget, src: str, dst: str) -> None:
    bucket = _bucket(t)
    try:
        bucket.copy_blob(bucket.blob(src), bucket, new_name=dst)
    except NotFound:
        raise LookupError(src) from None
    except Exception as e:
        raise _wrap(t, e) from None


async def copy(t: StorageTarget, src: str, dst: str) -> None:
    await asyncio.to_thread(_copy_sync, t, src, dst)


def _delete_sync(t: StorageTarget, key: str) -> None:
    try:
        _blob(t, key).delete()
    except NotFound:
        return
    except Exception as e:
        raise _wrap(t, e) from None


async def delete(t: StorageTarget, key: str) -> None:
    await asyncio.to_thread(_delete_sync, t, key)


def _verify_sync(t: StorageTarget) -> None:
    key = t.key(f".sourcehub-probe/{uuid.uuid4()}")
    body = b"sourcehub destination check"
    b = _blob(t, key)
    try:
        b.upload_from_string(body, content_type="text/plain")
        b.reload()
        if b.download_as_bytes() != body:
            raise StorageError("Wrote an object but read different bytes back from GCS.")
    except Exception as e:
        raise _wrap(t, e) from None
    finally:
        with contextlib.suppress(Exception):
            b.delete()


async def verify(t: StorageTarget) -> None:
    await asyncio.to_thread(_verify_sync, t)
