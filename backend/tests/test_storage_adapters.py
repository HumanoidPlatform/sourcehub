"""The contract every storage adapter owes its callers, run against the real thing.

This exists because the Azure adapter shipped with thirteen defects and nobody
noticed: it had never been imported, let alone executed. Mocking would not have
caught a single one of them. The failures live precisely where a mock is
confident — a signature computed over a decoded resource, a URL signed for the
wrong host, a header the service demands on upload.

Runs once per provider that has credentials on this machine, and skips the rest
— a missing key is a machine that has not been set up, not a broken adapter:

  azure       the Azure platform settings: STORAGE_ACCOUNT_NAME / _KEY
              (/ _CONTAINER, STORAGE_ENDPOINT_AZURE for Azurite)
  gcs         the GCS platform settings: STORAGE_GCS_BUCKET, signed keylessly
              by the machine's own service account unless
              STORAGE_GCS_SERVICE_ACCOUNT_JSON holds a key
  gcs-client  a client destination with a service-account key file:
              TEST_GCS_CLIENT_BUCKET and TEST_GCS_CLIENT_KEY_FILE

On a Google Cloud VM the gcs run is the go-live check for STORAGE_PROVIDER=gcs.

This does not cover the S3 adapter. That one is reachable only through a
client's own delivery destination, and tests/e2e_loop.py drives it end to end.

    pytest -m adapters
"""

from __future__ import annotations

import dataclasses
import os
import uuid
from pathlib import Path

import httpx
import pytest

from sourcehub.config import settings
from sourcehub.platform import storage
from sourcehub.platform.storage.types import StorageError, StorageTarget

pytestmark = [pytest.mark.adapters, pytest.mark.asyncio]

# Spaces, a hash and parentheses — the three characters that break an unencoded
# blob name, and all three are ordinary in a file a client actually uploads.
# The folder is the real layout, which is where the spaces come from in
# production: "{client name}/{RFP}/{slot}/{file}".
FILENAME = "my report #2 (final).pdf"
# A name a field worker in India types without thinking about it.
NON_ASCII_NAME = "दुकान शेल्फ़ फ़ोटो.jpg"
BODY = b"sourcehub adapter contract test\n" * 16


def _azure() -> StorageTarget | None:
    if not (settings.storage_account_name and settings.storage_account_key.get_secret_value()):
        return None
    return StorageTarget(
        provider="azure_blob",
        bucket=settings.storage_container,
        endpoint=settings.storage_endpoint_azure,
        public_endpoint=settings.storage_public_endpoint_azure or settings.storage_endpoint_azure,
        secret={
            "account_name": settings.storage_account_name,
            "account_key": settings.storage_account_key.get_secret_value(),
        },
    )


def _gcs_platform() -> StorageTarget | None:
    if not settings.storage_gcs_bucket:
        return None
    key = settings.storage_gcs_service_account_json.get_secret_value()
    return StorageTarget(
        provider="gcs",
        bucket=settings.storage_gcs_bucket,
        secret={"service_account_json": key} if key.strip() else {},
    )


def _gcs_client() -> StorageTarget | None:
    bucket = os.environ.get("TEST_GCS_CLIENT_BUCKET")
    key_file = os.environ.get("TEST_GCS_CLIENT_KEY_FILE")
    if not (bucket and key_file):
        return None
    return StorageTarget(
        provider="gcs",
        bucket=bucket,
        key_prefix="adapter-contract/",
        secret={"service_account_json": Path(key_file).read_text(encoding="utf-8")},
    )


_TARGETS = {"azure": _azure, "gcs": _gcs_platform, "gcs-client": _gcs_client}


@pytest.fixture(params=sorted(_TARGETS))
def target(request: pytest.FixtureRequest) -> StorageTarget:
    t = _TARGETS[request.param]()
    if t is None:
        pytest.skip(f"no {request.param} storage credentials configured")
    return t


@pytest.fixture
def folder() -> str:
    """A throwaway folder shaped like a real one, cleaned up by the test."""
    return f"_staging/adapter-test/{uuid.uuid4()}"


async def test_verify_accepts_the_configured_destination(target):
    """The probe a client's destination has to pass, run against our own."""
    await storage.verify(target)


async def _put(target: StorageTarget, key: str, content_type: str = "application/pdf") -> None:
    url, headers = await storage.presign_put(target, key)
    async with httpx.AsyncClient(timeout=30) as http:
        # Content-Type as every caller adds it: unsigned, alongside what the
        # adapter returned.
        put = await http.put(url, content=BODY, headers={"Content-Type": content_type, **headers})
    assert put.status_code in (200, 201), put.text


async def test_round_trip_through_presigned_urls(target, folder):
    """Upload, stat, download — over HTTP, exactly as a browser would.

    The assertion that matters is that the bytes come back: a signature
    computed over a differently-encoded name produces a 403 here, and a URL
    signed for the wrong host produces a connection error, both of which a
    mocked store reports as success.
    """
    key = target.key(f"{folder}/{FILENAME}")
    await _put(target, key)

    size, content_type = await storage.stat(target, key)
    assert size == len(BODY), "the recorded size must come from storage, not the caller"
    assert content_type == "application/pdf", "the type the uploader sent must be what is stored"

    get_url = await storage.presign_get(target, key, FILENAME)
    async with httpx.AsyncClient(timeout=30) as http:
        got = await http.get(get_url)
    assert got.status_code == 200, got.text
    assert got.content == BODY
    # The filename is pinned at signing time, so a link cannot be re-pointed at
    # another object and still claim this name.
    assert FILENAME in got.headers.get("content-disposition", "")

    await storage.delete(target, key)


async def test_a_non_ascii_name_survives_signing(target, folder):
    """Devanagari in the object name: percent-encoded in the URL, signed over."""
    key = target.key(f"{folder}/{NON_ASCII_NAME}")
    await _put(target, key, content_type="image/jpeg")
    assert (await storage.head(target, key)).size == len(BODY)
    inline_url = await storage.presign_get(target, key, "shelf.jpg", inline=True)
    async with httpx.AsyncClient(timeout=30) as http:
        got = await http.get(inline_url)
    assert got.status_code == 200 and got.content == BODY, got.text
    assert got.headers.get("content-disposition", "").startswith("inline")
    await storage.delete(target, key)


async def test_copy_then_delete_is_a_move(target, folder):
    """What the staging move is built out of.

    Both halves are checked because the delete is the one most easily skipped
    without anyone noticing: the file appears in its folder either way, and the
    leftover only shows up when someone browses _staging months later.
    """
    src = target.key(f"{folder}/_staging/{FILENAME}")
    dst = target.key(f"{folder}/compliance/{FILENAME}")
    await _put(target, src)

    await storage.copy(target, src, dst)
    assert (await storage.head(target, dst)).size == len(BODY)

    await storage.delete(target, src)
    with pytest.raises(LookupError):
        await storage.head(target, src)

    await storage.delete(target, dst)


async def test_head_of_a_missing_object_is_lookuperror(target, folder):
    """Callers turn this into 'not uploaded yet' and must not see a 500."""
    with pytest.raises(LookupError):
        await storage.head(target, target.key(f"{folder}/nothing-was-ever-put-here.pdf"))


async def test_delete_of_a_missing_object_succeeds(target, folder):
    """Already gone is the desired state — a retried move must not fail."""
    await storage.delete(target, target.key(f"{folder}/nothing-was-ever-put-here.pdf"))


async def test_a_bad_destination_raises_storageerror(target):
    """Never a bare SDK exception: these messages are shown to a client."""
    broken = dataclasses.replace(target, bucket="No Such Bucket!")
    with pytest.raises(StorageError):
        await storage.head(broken, "whatever.pdf")


async def test_a_missing_bucket_is_not_a_missing_file(target):
    """A bucket that does not exist must not read as 'the file was never uploaded'."""
    gone = dataclasses.replace(target, bucket=f"sourcehub-no-such-{uuid.uuid4().hex[:12]}")
    with pytest.raises(StorageError):
        await storage.head(gone, "whatever.pdf")
