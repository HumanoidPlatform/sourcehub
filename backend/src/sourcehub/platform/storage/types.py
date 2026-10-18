"""Shared shapes for the storage adapters.

Kept out of __init__ so an adapter can import them without a cycle: __init__
dispatches to the adapters, the adapters import from here.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, NamedTuple

# One chunk of a resumable upload. A multiple of 256 KiB, which Google
# requires, and above the 5 MiB S3 insists on for every part but the last.
# The phone reads exactly this much at a time (mobile upload/chunks.ts), so it
# is also the most of a capture that is ever in memory on either side.
CHUNK_BYTES = 8 * 1024 * 1024


class ObjectStat(NamedTuple):
    """What storage actually holds for a key — never what the client claimed."""

    size: int
    content_type: str | None
    etag: str | None
    # The provider's own digest of the stored bytes, where it gives one: S3's
    # etag for a single PUT, Azure's content-md5 when the upload set it, GCS's
    # crc32c. Recorded on the asset at confirm; nothing recomputes it.
    checksum: str | None = None


class UploadSession(NamedTuple):
    """A resumable upload storage has agreed to take, as the asset stores it.

    `session` is whatever the provider's protocol resumes by: Google's session
    URL (which authorises writes — a credential, never listed), S3's upload id,
    or for Azure a prefix for the block ids, since Azure keeps no session and
    the uncommitted blocks themselves are the state.
    """

    protocol: str  # 'gcs' | 'azure' | 's3'
    session: str
    chunk_size: int
    size: int


class UploadStatus(NamedTuple):
    """How far a resumable upload has got, as storage reports it.

    Google counts bytes; Azure and S3 count parts. Either way this is the
    answer the phone resumes from, and never its own idea of where it was.
    """

    bytes_done: int | None
    parts_done: list[int]


class StorageError(RuntimeError):
    """The destination refused, or could not be reached.

    Carries no credential material: this reaches API responses and logs.
    """


@dataclass(frozen=True)
class StorageTarget:
    """A resolved destination — everything an adapter needs to sign a URL.

    Built either from a client's storage_target row or, for platform-owned
    objects like request samples, from settings via platform_target().

    `secret` is provider-shaped:
        s3          {"access_key_id", "secret_access_key"}
        gcs         {"service_account_json"}, or {} for keyless platform storage
        azure_blob  {"account_name", "account_key"}

    Never log this object. __repr__ is overridden because a dataclass would
    otherwise print the credential the first time one of these appears in a
    traceback.
    """

    provider: str
    bucket: str
    secret: Mapping[str, Any]
    endpoint: str | None = None
    # The host a signed URL is signed against, when it differs from the one the
    # API talks to. SigV4 covers the Host header, so a URL signed for localhost
    # is rejected when a phone calls it by LAN address — the two cannot be
    # swapped after the fact. Only platform storage sets this; a client's own
    # bucket is reachable from both sides by definition.
    public_endpoint: str | None = None
    region: str | None = None
    key_prefix: str = ""

    def key(self, suffix: str) -> str:
        """Apply the client's prefix. The rest of the layout is ours."""
        return f"{self.key_prefix}{suffix}"

    def __repr__(self) -> str:  # pragma: no cover - defensive
        return (
            f"StorageTarget(provider={self.provider!r}, bucket={self.bucket!r}, "
            f"endpoint={self.endpoint!r}, public_endpoint={self.public_endpoint!r}, "
            f"region={self.region!r}, key_prefix={self.key_prefix!r}, secret=<redacted>)"
        )
