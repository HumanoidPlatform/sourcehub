"""Azure Blob storage adapter — the platform's own files live here.

Azure does not presign in the S3 sense. It issues a SAS token — a signed query
string appended to the blob URL — and an upload through one MUST carry
`x-ms-blob-type: BlockBlob`. That header is why presign_put returns headers
alongside the URL, and why the phone has to send what the API tells it to
rather than assuming a plain PUT.

Two things here are easy to get wrong and both have bitten:

  * The blob name must be percent-encoded in the URL, because the signature is
    computed over the DECODED canonical resource. The platform's own layout is
    "{client name}/{RFP}/{slot}/{file}" — full of spaces — so an unencoded name
    is not an edge case here, it is every single object.

  * The account name must be passed explicitly. Left to the SDK it is parsed
    out of the account URL, which is right for {account}.blob.core.windows.net
    and wrong for anything else, and it would then disagree with the name used
    for signing.
"""

from __future__ import annotations

import asyncio
import base64
import contextlib
import datetime as dt
import re
import uuid
from typing import Any
from urllib.parse import quote

from azure.core.exceptions import (
    AzureError,
    ClientAuthenticationError,
    ResourceNotFoundError,
)
from azure.storage.blob import (
    BlobBlock,
    BlobSasPermissions,
    BlobServiceClient,
    ContentSettings,
    generate_blob_sas,
)

from sourcehub.config import settings
from sourcehub.platform.storage.types import (
    CHUNK_BYTES,
    ObjectStat,
    StorageError,
    StorageTarget,
    UploadSession,
    UploadStatus,
)

# 3-63 chars, lowercase letters, digits and single inner hyphens. Checked here
# because nothing upstream does: the column takes 255 characters of anything,
# and a name that is legal on S3 is often illegal on Azure.
_CONTAINER = re.compile(r"^[a-z0-9]([a-z0-9]|-(?!-)){1,61}[a-z0-9]$")

# The SDK retries three times with backoff by default and applies its own
# timeouts. s3_store.py:44-53 records what that cost: an unreachable host held
# a request thread for minutes. Same reasoning, same numbers.
_CONNECT_TIMEOUT = 5
_READ_TIMEOUT = 30

# One client per (account, url), reused. A fresh BlobServiceClient per call
# builds a new pipeline and session and nothing ever closes it.
_CLIENTS: dict[tuple[str, str], BlobServiceClient] = {}


def _account(t: StorageTarget, *, signing: bool) -> tuple[str, str, str]:
    """(account name, key, account URL).

    signing picks the host a browser or phone will call; everything else uses
    the host the API can reach. Same split as s3_store, for the same reason:
    the SAS signature covers the host, so a URL signed for one is rejected on
    the other.
    """
    name = str(t.secret.get("account_name") or "")
    key = str(t.secret.get("account_key") or "")
    if not name or not key:
        raise StorageError("This destination needs an account name and account key.")
    raw = (t.public_endpoint or t.endpoint) if signing else t.endpoint
    url = (raw or f"https://{name}.blob.core.windows.net").rstrip("/")
    return name, key, url


def _service(t: StorageTarget) -> BlobServiceClient:
    name, key, url = _account(t, signing=False)
    cached = _CLIENTS.get((name, url))
    if cached is not None:
        return cached
    try:
        client = BlobServiceClient(
            account_url=url,
            # Explicit, so shared-key signing never depends on parsing the host.
            credential={"account_name": name, "account_key": key},
            connection_timeout=_CONNECT_TIMEOUT,
            read_timeout=_READ_TIMEOUT,
            retry_total=0,
        )
    except ValueError as e:
        # A malformed account URL raises plain ValueError, not AzureError.
        raise StorageError(f"Azure storage is misconfigured: {e}") from None
    _CLIENTS[(name, url)] = client
    return client


def _check_container(t: StorageTarget) -> None:
    if not _CONTAINER.match(t.bucket or ""):
        raise StorageError(
            f"{t.bucket!r} is not a valid Azure container name — 3 to 63 characters, "
            "lowercase letters, digits and single hyphens."
        )


def _blob_url(url: str, container: str, key: str, token: str) -> str:
    # safe="/" keeps the folder separators and encodes everything else. The
    # SDK's own BlobClient.url does exactly this.
    return f"{url}/{container}/{quote(key, safe='/')}?{token}"


def _expiry() -> dt.datetime:
    return dt.datetime.now(dt.UTC) + dt.timedelta(seconds=settings.storage_presign_ttl_seconds)


def _sas(t: StorageTarget, key: str, perms: BlobSasPermissions, **kw: Any) -> str:
    name, akey, url = _account(t, signing=True)
    token = generate_blob_sas(
        account_name=name,
        container_name=t.bucket,
        blob_name=key,
        account_key=akey,
        permission=perms,
        expiry=_expiry(),
        **kw,
    )
    return _blob_url(url, t.bucket, key, token)


def _wrap(host: str | None, e: Exception) -> StorageError:
    if isinstance(e, ClientAuthenticationError):
        return StorageError("Azure refused the credential.")
    return StorageError(f"Could not reach {host or 'Azure storage'}: {type(e).__name__}")


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    """Upload URL plus the header Azure requires on the PUT."""
    _check_container(t)
    try:
        url = await asyncio.to_thread(
            lambda: _sas(t, key, BlobSasPermissions(create=True, write=True))
        )
    except StorageError:
        raise
    except Exception as e:  # noqa: BLE001 - a bad key fails in the signer, not over HTTP
        raise _wrap(t.public_endpoint or t.endpoint, e) from None
    return url, {"x-ms-blob-type": "BlockBlob"}


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    """Download URL. Disposition is baked into the SAS, not sent as an override."""
    _check_container(t)
    disposition = "inline" if inline else "attachment"
    try:
        return await asyncio.to_thread(
            lambda: _sas(
                t,
                key,
                BlobSasPermissions(read=True),
                content_disposition=f'{disposition}; filename="{filename}"',
            )
        )
    except StorageError:
        raise
    except Exception as e:  # noqa: BLE001
        raise _wrap(t.public_endpoint or t.endpoint, e) from None


def _head_sync(t: StorageTarget, key: str) -> ObjectStat:
    try:
        p = _service(t).get_blob_client(t.bucket, key).get_blob_properties()
    except ResourceNotFoundError as e:
        # Azure raises this for a missing CONTAINER too, and the callers all
        # translate LookupError into "the file was never uploaded" — which
        # would be a lie, and an unfixable-looking one.
        if "ContainerNotFound" in str(e):
            raise StorageError(f"The container {t.bucket!r} does not exist.") from None
        raise LookupError(key) from None
    except StorageError:
        raise
    except Exception as e:  # noqa: BLE001
        raise _wrap(t.endpoint, e) from None
    ct = p.content_settings.content_type if p.content_settings else None
    # Azure keeps a content MD5 for a blob written in one request; a blob
    # committed from blocks has none, and the service then records nothing
    md5 = p.content_settings.content_md5 if p.content_settings else None
    return ObjectStat(
        size=p.size or 0,
        content_type=ct,
        etag=(p.etag or "").strip('"') or None,
        checksum=f"md5:{base64.b64encode(bytes(md5)).decode()}" if md5 else None,
    )


async def head(t: StorageTarget, key: str) -> ObjectStat:
    _check_container(t)
    return await asyncio.to_thread(_head_sync, t, key)


def _copy_sync(t: StorageTarget, src: str, dst: str) -> None:
    """Server-side copy. The bytes never pass through the API.

    Within one account this is a metadata operation and completes immediately
    for files this size, but the SDK still reports it asynchronously, so the
    status is checked rather than assumed.
    """
    svc = _service(t)
    name, akey, url = _account(t, signing=False)
    try:
        token = generate_blob_sas(
            account_name=name, container_name=t.bucket, blob_name=src,
            account_key=akey, permission=BlobSasPermissions(read=True),
            expiry=dt.datetime.now(dt.UTC) + dt.timedelta(minutes=10),
        )
        target = svc.get_blob_client(t.bucket, dst)
        result = target.start_copy_from_url(_blob_url(url, t.bucket, src, token))
        if result.get("copy_status") not in ("success", None):
            raise StorageError(f"Copy did not complete: {result.get('copy_status')}")
    except ResourceNotFoundError:
        raise LookupError(src) from None
    except StorageError:
        raise
    except Exception as e:  # noqa: BLE001
        raise _wrap(t.endpoint, e) from None


async def copy(t: StorageTarget, src: str, dst: str) -> None:
    _check_container(t)
    await asyncio.to_thread(_copy_sync, t, src, dst)


def _copy_from_url_sync(t: StorageTarget, dst: str, source_url: str) -> None:
    """Put Blob From URL: Azure fetches the source itself, synchronously.

    The source is a signed GET into another account or another provider, so
    this is the cross-account counterpart of _copy_sync. Up to 5,000 MiB in
    one call, which covers every capture the phone produces. The read timeout
    is the call's own: the service holds the request open while it copies.
    """
    try:
        _service(t).get_blob_client(t.bucket, dst).upload_blob_from_url(
            source_url, overwrite=True, read_timeout=600,
        )
    except ResourceNotFoundError:
        raise LookupError(dst) from None
    except StorageError:
        raise
    except Exception as e:  # noqa: BLE001
        raise _wrap(t.endpoint, e) from None


async def copy_from_url(t: StorageTarget, dst: str, source_url: str) -> None:
    _check_container(t)
    await asyncio.to_thread(_copy_from_url_sync, t, dst, source_url)


def _delete_sync(t: StorageTarget, key: str) -> None:
    try:
        _service(t).get_blob_client(t.bucket, key).delete_blob()
    except ResourceNotFoundError:
        return  # already gone is the desired state
    except Exception as e:  # noqa: BLE001
        raise _wrap(t.endpoint, e) from None


async def delete(t: StorageTarget, key: str) -> None:
    _check_container(t)
    await asyncio.to_thread(_delete_sync, t, key)


def _verify_sync(t: StorageTarget) -> None:
    key = t.key(f".sourcehub-probe/{uuid.uuid4()}")
    body = b"sourcehub destination check"
    try:
        blob = _service(t).get_blob_client(t.bucket, key)
    except StorageError:
        raise
    except Exception as e:  # noqa: BLE001
        raise _wrap(t.endpoint, e) from None

    try:
        blob.upload_blob(
            body, overwrite=True, content_settings=ContentSettings(content_type="text/plain")
        )
    except AzureError as e:
        raise StorageError(f"Could not write to the container: {type(e).__name__}") from None
    except Exception as e:  # noqa: BLE001 - a bad base64 key fails before any HTTP call
        raise _wrap(t.endpoint, e) from None

    try:
        blob.get_blob_properties()
        blob.download_blob().readall()
    except AzureError as e:
        raise StorageError(f"Wrote a blob but could not read it back: {type(e).__name__}") from None
    finally:
        with contextlib.suppress(Exception):
            blob.delete_blob()


async def verify(t: StorageTarget) -> None:
    _check_container(t)
    await asyncio.to_thread(_verify_sync, t)


# ---------------------------------------------------------------------------
# Resumable uploads: Azure keeps no session. Each chunk is a Put Block under a
# block id — staged, uncommitted, kept seven days — and the blob comes into
# being when the ids are committed in order. The "session" is a prefix for the
# ids, so one blob's abandoned blocks and a later retry's never mix, and block
# ids within a blob must all be the same length, hence the zero-padded part.
# The write SAS the phone already gets covers Put Block and Put Block List.
# ---------------------------------------------------------------------------


def _block_id(prefix: str, n: int) -> str:
    return base64.b64encode(f"{prefix}-{n:06d}".encode()).decode()


def _part_of(block_id: str, prefix: str) -> int | None:
    """The part number behind a block id of ours; None for anything else."""
    try:
        raw = base64.b64decode(block_id).decode()
    except Exception:
        return None
    head, _, num = raw.rpartition("-")
    return int(num) if head == prefix and num.isdigit() else None


def _part_urls_sync(
    t: StorageTarget, key: str, session: UploadSession, parts: list[int]
) -> dict[int, str]:
    base = _sas(t, key, BlobSasPermissions(create=True, write=True))
    return {
        n: f"{base}&comp=block&blockid={quote(_block_id(session.session, n), safe='')}"
        for n in parts
    }


def _staged(t: StorageTarget, key: str, prefix: str) -> tuple[list[int], bool]:
    """(our uncommitted parts in order, whether the blob is already committed)."""
    try:
        committed, uncommitted = _service(t).get_blob_client(t.bucket, key).get_block_list("all")
    except ResourceNotFoundError:
        return [], False  # nothing staged yet: Azure has no blob to list blocks of
    except StorageError:
        raise
    except Exception as e:
        raise _wrap(t.endpoint, e) from None
    mine = sorted(p for b in uncommitted if (p := _part_of(b.id, prefix)) is not None)
    return mine, bool(committed)


def _resumable_status_sync(t: StorageTarget, key: str, session: UploadSession) -> UploadStatus:
    parts, _ = _staged(t, key, session.session)
    return UploadStatus(None, parts)


def _resumable_complete_sync(
    t: StorageTarget, key: str, session: UploadSession, content_type: str
) -> None:
    parts, committed = _staged(t, key, session.session)
    expected = -(-session.size // session.chunk_size)
    if parts != list(range(1, expected + 1)):
        if committed and not parts:
            return  # committed earlier; a second confirm finds nothing to do
        # Some parts never arrived: the caller reads this as "not uploaded
        # yet", and the phone asks for the status and sends what is missing.
        raise LookupError(key)
    try:
        _service(t).get_blob_client(t.bucket, key).commit_block_list(
            [BlobBlock(block_id=_block_id(session.session, n)) for n in parts],
            content_settings=ContentSettings(content_type=content_type),
        )
    except StorageError:
        raise
    except AzureError as e:
        raise StorageError(f"Azure refused to assemble the upload: {type(e).__name__}") from None
    except Exception as e:
        raise _wrap(t.endpoint, e) from None


async def resumable_start(
    t: StorageTarget, key: str, size: int, content_type: str
) -> UploadSession:
    _check_container(t)
    # Nothing to open on Azure's side; the prefix is all the state there is.
    return UploadSession("azure", uuid.uuid4().hex[:12], CHUNK_BYTES, size)


async def resumable_part_urls(
    t: StorageTarget, key: str, session: UploadSession, parts: list[int]
) -> dict[int, str]:
    _check_container(t)
    try:
        return await asyncio.to_thread(_part_urls_sync, t, key, session, parts)
    except StorageError:
        raise
    except Exception as e:
        raise _wrap(t.public_endpoint or t.endpoint, e) from None


async def resumable_status(t: StorageTarget, key: str, session: UploadSession) -> UploadStatus:
    _check_container(t)
    return await asyncio.to_thread(_resumable_status_sync, t, key, session)


async def resumable_complete(
    t: StorageTarget, key: str, session: UploadSession, content_type: str
) -> None:
    _check_container(t)
    await asyncio.to_thread(_resumable_complete_sync, t, key, session, content_type)


async def resumable_abort(t: StorageTarget, key: str, session: UploadSession) -> None:
    # Uncommitted blocks expire on their own after seven days; there is no
    # call to hurry them and nothing else to clear.
    return None
