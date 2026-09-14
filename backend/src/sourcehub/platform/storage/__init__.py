"""Storage — one façade over two providers.

Callers never choose an adapter. They hand in a StorageTarget and this module
dispatches on its provider, so modules/ stays free of any knowledge about
whether a client is on S3 or Azure.

Adapters are imported lazily, on the first call for that provider, so a missing
SDK surfaces as a clear message on the one destination that needs it rather
than an import error at boot.

Two storages meet here and they are not the same thing. platform_target() is
SourceHub's own container: Azure, fixed, not configurable. Everything else
comes from a storage_target row — the client's own storage, S3/MinIO or Azure
as they chose when raising the RFP.
"""

from __future__ import annotations

from types import ModuleType

from sourcehub.config import settings
from sourcehub.platform.storage.types import ObjectStat, StorageError, StorageTarget

__all__ = [
    "ObjectStat",
    "StorageError",
    "StorageTarget",
    "copy",
    "delete",
    "head",
    "platform_target",
    "presign_get",
    "presign_put",
    "stat",
    "verify",
]

# Two providers, both reachable only through a client's own delivery
# destination. 'gcs' is gone: the enum still carries the label because Postgres
# cannot drop one, but there is no adapter and a CHECK refuses the value.
_PACKAGES = {
    "s3": ("s3_store", "minio"),
    "azure_blob": ("azure_store", "azure-storage-blob"),
}


def _adapter(provider: str) -> ModuleType:
    try:
        module, package = _PACKAGES[provider]
    except KeyError:
        raise StorageError(f"Unknown storage provider {provider!r}.") from None
    try:
        return __import__(f"sourcehub.platform.storage.{module}", fromlist=[module])
    except ImportError:
        raise StorageError(
            f"This destination needs the {package} package, which is not installed."
        ) from None


def platform_target() -> StorageTarget:
    """SourceHub's own storage, as a target. Always Azure Blob.

    The platform's files — request attachments, capture examples, method
    statements, QA evidence — live here, and so does any capture from a
    contract awarded before client destinations existed.

    No parameter and no choice. One container holds everything the platform
    owns, foldered by client and RFP inside it, and there is no setting that
    points it anywhere else. A CLIENT's delivery destination is the thing that
    varies — S3/MinIO or Azure, per row in storage_target — and it never comes
    through this function.
    """
    return StorageTarget(
        provider="azure_blob",
        bucket=settings.storage_container,
        endpoint=settings.storage_endpoint_azure,
        public_endpoint=settings.storage_public_endpoint_azure
        or settings.storage_endpoint_azure,
        key_prefix="",
        secret={
            "account_name": settings.storage_account_name,
            "account_key": settings.storage_account_key.get_secret_value(),
        },
    )


async def presign_put(t: StorageTarget, key: str) -> tuple[str, dict[str, str]]:
    """Upload URL plus the headers the upload must carry.

    The headers matter: Azure rejects a PUT without x-ms-blob-type.
    """
    return await _adapter(t.provider).presign_put(t, key)


async def presign_get(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
    return await _adapter(t.provider).presign_get(t, key, filename, inline)


async def head(t: StorageTarget, key: str) -> ObjectStat:
    return await _adapter(t.provider).head(t, key)


async def stat(t: StorageTarget, key: str) -> tuple[int, str | None]:
    """(size_bytes, content_type) of a stored object; LookupError if absent.

    This is the real size enforcement — a presigned PUT cannot cap what the
    client uploads, so the recorded size comes from here, never the claim.
    """
    s = await head(t, key)
    return s.size, s.content_type


async def verify(t: StorageTarget) -> None:
    """Prove the destination is usable: write, read back, clean up.

    Raises StorageError with a message safe to show a client. Called when a
    destination is saved, before a request may be published, and again at
    award — the alternative is a worker in the field holding a capture that
    will never upload.
    """
    await _adapter(t.provider).verify(t)


async def copy(t: StorageTarget, src: str, dst: str) -> None:
    """Server-side copy within one account. The bytes never reach the API.

    Used by the staging move: a file is uploaded before the thing it belongs to
    exists, so it lands under a scratch prefix and is copied into its real
    folder once the parent has an identity.
    """
    await _adapter(t.provider).copy(t, src, dst)


async def delete(t: StorageTarget, key: str) -> None:
    """Remove an object. Already-gone counts as success."""
    await _adapter(t.provider).delete(t, key)
