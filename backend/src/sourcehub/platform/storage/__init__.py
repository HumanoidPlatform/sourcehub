"""Storage — one façade over three providers.

Callers never choose an adapter. They hand in a StorageTarget and this module
dispatches on its provider, so modules/ stays free of any knowledge about
whether a client is on S3, GCS or Azure.

Adapters are imported lazily, on the first call for that provider. A
deployment that never sees an Azure destination therefore never needs
azure-storage-blob installed, and a missing SDK surfaces as a clear message on
the one destination that needs it rather than an import error at boot.
"""

from __future__ import annotations

from types import ModuleType

from sourcehub.config import settings
from sourcehub.platform.storage.types import ObjectStat, StorageError, StorageTarget

__all__ = [
    "ObjectStat",
    "StorageError",
    "StorageTarget",
    "head",
    "platform_target",
    "presign_get",
    "presign_put",
    "stat",
    "verify",
]

_PACKAGES = {
    "s3": ("s3_store", "minio"),
    "gcs": ("gcs_store", "google-cloud-storage"),
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


def platform_target(bucket: str) -> StorageTarget:
    """SourceHub's own storage, as a target.

    Request samples and any asset captured before destinations existed live
    here, so the same four functions serve both without a second code path.
    """
    return StorageTarget(
        provider="s3",
        bucket=bucket,
        endpoint=settings.storage_endpoint,
        region=None,
        key_prefix="",
        secret={
            "access_key_id": settings.storage_access_key,
            "secret_access_key": settings.storage_secret_key.get_secret_value(),
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
