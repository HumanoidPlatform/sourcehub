"""Google Cloud Storage adapter, native service-account signing.

Worth knowing before reaching for this: GCS also speaks S3 through its
interoperability endpoint, and a target with provider 's3', endpoint
https://storage.googleapis.com and an HMAC key pair works through s3_store with
no extra dependency. This module exists for organisations that disable
interoperability, where a service-account JSON key is the only way in.

V4 signed URLs, which need the private key from the service account — hence the
whole JSON document as the credential rather than a key/secret pair.
"""

from __future__ import annotations

import asyncio
import contextlib
import datetime as dt
import json
import uuid
from typing import Any

from google.api_core.exceptions import GoogleAPIError, NotFound
from google.cloud import storage as gcs
from google.oauth2 import service_account

from sourcehub.config import settings
from sourcehub.platform.storage.types import ObjectStat, StorageError, StorageTarget


def _info(t: StorageTarget) -> dict[str, Any]:
    raw = t.secret.get("service_account_json")
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            raise StorageError("The service account key is not valid JSON.") from None
    if isinstance(raw, dict):
        return dict(raw)
    raise StorageError("No service account key on this destination.")


def _bucket(t: StorageTarget) -> Any:
    info = _info(t)
    creds = service_account.Credentials.from_service_account_info(info)
    client = gcs.Client(project=info.get("project_id"), credentials=creds)
    return client.bucket(t.bucket)


def _ttl() -> dt.timedelta:
    return dt.timedelta(seconds=settings.storage_presign_ttl_seconds)


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    url = await asyncio.to_thread(
        lambda: _bucket(t).blob(key).generate_signed_url(
            version="v4", expiration=_ttl(), method="PUT"
        )
    )
    return url, {}


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    disposition = "inline" if inline else "attachment"
    return await asyncio.to_thread(
        lambda: _bucket(t).blob(key).generate_signed_url(
            version="v4",
            expiration=_ttl(),
            method="GET",
            response_disposition=f'{disposition}; filename="{filename}"',
        )
    )


def _head_sync(t: StorageTarget, key: str) -> ObjectStat:
    blob = _bucket(t).blob(key)
    try:
        blob.reload()
    except NotFound:
        raise LookupError(key) from None
    return ObjectStat(
        size=blob.size or 0,
        content_type=blob.content_type,
        etag=(blob.etag or "").strip('"') or None,
    )


async def head(t: StorageTarget, key: str) -> ObjectStat:
    return await asyncio.to_thread(_head_sync, t, key)


def _verify_sync(t: StorageTarget) -> None:
    key = t.key(f".sourcehub-probe/{uuid.uuid4()}")
    try:
        blob = _bucket(t).blob(key)
        blob.upload_from_string(b"sourcehub destination check", content_type="text/plain")
    except GoogleAPIError as e:
        raise StorageError(f"Could not write to the bucket: {type(e).__name__}") from None
    except Exception as e:
        # Malformed key material fails here, before any API call is made
        raise StorageError(f"Could not reach the bucket: {type(e).__name__}") from None

    try:
        blob.reload()
        blob.download_as_bytes()
    except GoogleAPIError as e:
        raise StorageError(
            f"Wrote an object but could not read it back: {type(e).__name__}"
        ) from None
    finally:
        with contextlib.suppress(Exception):
            blob.delete()


async def verify(t: StorageTarget) -> None:
    await asyncio.to_thread(_verify_sync, t)


async def copy(t: StorageTarget, src: str, dst: str) -> None:
    """Not implemented. The staging move is a platform-storage operation, and
    platform storage is never GCS — a client's own destination receives
    captures directly and never needs a file moved within it."""
    raise StorageError("Copy is not supported on Google Cloud Storage destinations.")


async def delete(t: StorageTarget, key: str) -> None:
    raise StorageError("Delete is not supported on Google Cloud Storage destinations.")
