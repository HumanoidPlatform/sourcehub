"""Azure Blob storage adapter.

Azure does not presign in the S3 sense. It issues a SAS token — a signed query
string appended to the blob URL — and an upload through one MUST carry
`x-ms-blob-type: BlockBlob`. That header is the reason presign_put returns
headers alongside the URL and the reason the phone has to send what the API
tells it to rather than assuming a plain PUT.

Content disposition is baked into the SAS at signing time rather than passed as
a response override, which is the other place the two models differ.
"""

from __future__ import annotations

import asyncio
import contextlib
import datetime as dt
import uuid

from azure.core.exceptions import AzureError, ResourceNotFoundError
from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    ContentSettings,
    generate_blob_sas,
)

from sourcehub.config import settings
from sourcehub.platform.storage.types import ObjectStat, StorageError, StorageTarget


def _account(t: StorageTarget) -> tuple[str, str, str]:
    name = str(t.secret.get("account_name") or "")
    key = str(t.secret.get("account_key") or "")
    url = t.endpoint or f"https://{name}.blob.core.windows.net"
    return name, key, url.rstrip("/")


def _service(t: StorageTarget) -> BlobServiceClient:
    _, key, url = _account(t)
    return BlobServiceClient(account_url=url, credential=key)


def _expiry() -> dt.datetime:
    return dt.datetime.now(dt.UTC) + dt.timedelta(
        seconds=settings.storage_presign_ttl_seconds
    )


def _sas(t: StorageTarget, key: str, perms: BlobSasPermissions, **kw: object) -> str:
    name, akey, url = _account(t)
    token = generate_blob_sas(
        account_name=name,
        container_name=t.bucket,
        blob_name=key,
        account_key=akey,
        permission=perms,
        expiry=_expiry(),
        **kw,
    )
    return f"{url}/{t.bucket}/{key}?{token}"


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    url = await asyncio.to_thread(
        lambda: _sas(t, key, BlobSasPermissions(create=True, write=True))
    )
    return url, {"x-ms-blob-type": "BlockBlob"}


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    disposition = "inline" if inline else "attachment"
    return await asyncio.to_thread(
        lambda: _sas(
            t,
            key,
            BlobSasPermissions(read=True),
            content_disposition=f'{disposition}; filename="{filename}"',
        )
    )


def _head_sync(t: StorageTarget, key: str) -> ObjectStat:
    try:
        p = _service(t).get_blob_client(t.bucket, key).get_blob_properties()
    except ResourceNotFoundError:
        raise LookupError(key) from None
    ct = p.content_settings.content_type if p.content_settings else None
    return ObjectStat(size=p.size or 0, content_type=ct, etag=(p.etag or "").strip('"') or None)


async def head(t: StorageTarget, key: str) -> ObjectStat:
    return await asyncio.to_thread(_head_sync, t, key)


def _verify_sync(t: StorageTarget) -> None:
    key = t.key(f".sourcehub-probe/{uuid.uuid4()}")
    body = b"sourcehub destination check"
    try:
        blob = _service(t).get_blob_client(t.bucket, key)
    except AzureError as e:
        raise StorageError(f"Could not reach the account: {type(e).__name__}") from None

    try:
        blob.upload_blob(
            body, overwrite=True, content_settings=ContentSettings(content_type="text/plain")
        )
    except AzureError as e:
        raise StorageError(f"Could not write to the container: {type(e).__name__}") from None

    try:
        blob.get_blob_properties()
        blob.download_blob().readall()
    except AzureError as e:
        raise StorageError(
            f"Wrote a blob but could not read it back: {type(e).__name__}"
        ) from None
    finally:
        with contextlib.suppress(AzureError):
            blob.delete_blob()


async def verify(t: StorageTarget) -> None:
    await asyncio.to_thread(_verify_sync, t)
