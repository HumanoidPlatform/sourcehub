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
    "copy",
    "delete",
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


# settings.storage_backend names an implementation; the adapters and the
# storage_provider enum both key off "s3". The setting predates them and says
# "minio", so the two vocabularies are reconciled in exactly one place.
_BACKEND_PROVIDER = {"minio": "s3", "s3": "s3", "azure_blob": "azure_blob"}


def platform_target(bucket: str | None = None) -> StorageTarget:
    """SourceHub's own storage, as a target.

    The platform's files — request samples, field attachments — live here, and
    so does any capture from a contract awarded before client destinations
    existed. Which backend that is comes from settings; the caller does not
    choose, and outside this function nothing knows which one it got.
    """
    provider = _BACKEND_PROVIDER.get(settings.storage_backend)
    if provider is None:
        raise StorageError(f"Unknown storage backend {settings.storage_backend!r}.")

    if provider == "azure_blob":
        return StorageTarget(
            provider="azure_blob",
            # One container holds everything the platform owns, foldered by
            # client and RFP inside it, so the bucket argument — which names
            # one of three S3 buckets — has nothing to select here.
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

    return StorageTarget(
        provider="s3",
        bucket=bucket or settings.storage_bucket_documents,
        endpoint=settings.storage_endpoint,
        # Where a browser or a phone will actually call. Falls back to the
        # internal address, which is right whenever both sides see the same one.
        public_endpoint=settings.storage_public_endpoint or settings.storage_endpoint,
        region=settings.storage_region,
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
