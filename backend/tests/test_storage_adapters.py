"""The contract every storage adapter owes its callers, run against the real thing.

This exists because the Azure adapter shipped with thirteen defects and nobody
noticed: it had never been imported, let alone executed. Mocking would not have
caught a single one of them. The failures live precisely where a mock is
confident — a signature computed over a decoded resource, a URL signed for the
wrong host, a header the service demands on upload.

Runs against the platform's own storage, which is Azure everywhere — there is
no local substitute any more. It skips rather than fails when no credentials
are configured, because a missing account key is a machine that has not been
set up, not a broken adapter.

This does not cover the S3 adapter. That one is reachable only through a
client's own delivery destination, and exercising it needs a storage_target
row; tests/e2e_loop.py is where that path is driven end to end.

    pytest -m adapters
"""

from __future__ import annotations

import uuid

import httpx
import pytest

from sourcehub.config import settings
from sourcehub.platform import storage
from sourcehub.platform.storage.types import StorageError

pytestmark = [pytest.mark.adapters, pytest.mark.asyncio]

# Spaces, a hash and parentheses — the three characters that break an unencoded
# blob name, and all three are ordinary in a file a client actually uploads.
# The folder is the real layout, which is where the spaces come from in
# production: "{client name}/{RFP}/{slot}/{file}".
FILENAME = "my report #2 (final).pdf"
BODY = b"sourcehub adapter contract test\n" * 16


def _configured() -> bool:
    """Platform storage is Azure and nothing else, so there is one thing to ask."""
    return bool(settings.storage_account_name and settings.storage_account_key)


pytestmark.append(
    pytest.mark.skipif(not _configured(), reason="no Azure storage credentials configured")
)


@pytest.fixture
def target():
    return storage.platform_target()


@pytest.fixture
def folder() -> str:
    """A throwaway folder shaped like a real one, cleaned up by the test."""
    return f"_staging/adapter-test/{uuid.uuid4()}"


async def test_verify_accepts_the_configured_destination(target):
    """The probe a client's destination has to pass, run against our own."""
    await storage.verify(target)


async def test_round_trip_through_presigned_urls(target, folder):
    """Upload, stat, download — over HTTP, exactly as a browser would.

    The assertion that matters is that the bytes come back: a signature
    computed over a differently-encoded name produces a 403 here, and a URL
    signed for the wrong host produces a connection error, both of which a
    mocked store reports as success.
    """
    key = f"{folder}/{FILENAME}"

    url, headers = await storage.presign_put(target, key)
    async with httpx.AsyncClient(timeout=30) as http:
        put = await http.put(url, content=BODY, headers=headers)
    assert put.status_code in (200, 201), put.text

    size, _ = await storage.stat(target, key)
    assert size == len(BODY), "the recorded size must come from storage, not the caller"

    get_url = await storage.presign_get(target, key, FILENAME)
    async with httpx.AsyncClient(timeout=30) as http:
        got = await http.get(get_url)
    assert got.status_code == 200, got.text
    assert got.content == BODY
    # The filename is pinned at signing time, so a link cannot be re-pointed at
    # another object and still claim this name.
    assert FILENAME in got.headers.get("content-disposition", "")

    await storage.delete(target, key)


async def test_copy_then_delete_is_a_move(target, folder):
    """What the staging move is built out of.

    Both halves are checked because the delete is the one most easily skipped
    without anyone noticing: the file appears in its folder either way, and the
    leftover only shows up when someone browses _staging months later.
    """
    src = f"{folder}/_staging/{FILENAME}"
    dst = f"{folder}/compliance/{FILENAME}"

    url, headers = await storage.presign_put(target, src)
    async with httpx.AsyncClient(timeout=30) as http:
        await http.put(url, content=BODY, headers=headers)

    await storage.copy(target, src, dst)
    assert (await storage.head(target, dst)).size == len(BODY)

    await storage.delete(target, src)
    with pytest.raises(LookupError):
        await storage.head(target, src)

    await storage.delete(target, dst)


async def test_head_of_a_missing_object_is_lookuperror(target, folder):
    """Callers turn this into 'not uploaded yet' and must not see a 500."""
    with pytest.raises(LookupError):
        await storage.head(target, f"{folder}/nothing-was-ever-put-here.pdf")


async def test_delete_of_a_missing_object_succeeds(target, folder):
    """Already gone is the desired state — a retried move must not fail."""
    await storage.delete(target, f"{folder}/nothing-was-ever-put-here.pdf")


async def test_a_bad_destination_raises_storageerror(target):
    """Never a bare SDK exception: these messages are shown to a client."""
    import dataclasses

    broken = dataclasses.replace(target, bucket="No Such Bucket!")
    with pytest.raises(StorageError):
        await storage.head(broken, "whatever.pdf")
