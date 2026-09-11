"""Shared shapes for the storage adapters.

Kept out of __init__ so an adapter can import them without a cycle: __init__
dispatches to the adapters, the adapters import from here.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, NamedTuple


class ObjectStat(NamedTuple):
    """What storage actually holds for a key — never what the client claimed."""

    size: int
    content_type: str | None
    etag: str | None


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
        gcs         {"service_account_json"}
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
