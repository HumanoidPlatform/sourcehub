"""Resumable capture uploads: db/530, migration 0057, the three adapters, the
media service's shapes, the routes and the sweep.

What this file guards, in the order it would hurt:

  * the storage session leaking: a Google session URL authorises writes, so
    it must never be in the columns any listing returns;
  * an adapter assembling the wrong thing — Azure committing blocks out of
    order, S3 completing with parts missing, Google's 308 misread;
  * a resumed upload starting from the phone's idea of its offset rather than
    storage's;
  * the sweep touching a capture a phone is still working on, or leaving S3
    parts to be billed for ever;
  * the SQL file and the migration drifting apart.

conftest.py's database fixtures raise NotImplementedError, so the pure parts
are tested directly and the adapters against fakes, as test_gcs_store_unit.py
does; the flow itself (chunk, cut, resume, complete) runs against the compose
stack and dev's client bucket.

    pytest tests/test_resumable_uploads_unit.py
"""

from __future__ import annotations

import base64
import datetime as dt
import re
import uuid
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import quote

import httpx
import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from sourcehub.api.v1 import media as media_api
from sourcehub.api.v1.media import PartsIn, PresignIn
from sourcehub.modules.media import service as media
from sourcehub.modules.media import sweep
from sourcehub.modules.storage.service import StorageTargetError
from sourcehub.platform import storage
from sourcehub.platform.storage import azure_store, gcs_store, s3_store
from sourcehub.platform.storage.types import (
    CHUNK_BYTES,
    StorageError,
    StorageTarget,
    UploadSession,
)

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "530_resumable_uploads.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0057_resumable_uploads.py"
).read_text(encoding="utf-8")
BUNDLE = (ROOT / "infra" / "bundle_schema.sh").read_text(encoding="utf-8")

NOW = dt.datetime(2026, 10, 18, 12, 0, tzinfo=dt.UTC)
DAY = dt.timedelta(days=1)
SIZE = 3 * CHUNK_BYTES + 5  # four parts, the last a short one


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    m = re.search(r'_UP = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m and m.group(1) == "\n" + SQL_TEXT


def test_the_migration_follows_0056_and_the_bundle_lists_the_file():
    assert re.search(r'^revision = "0057"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0056"$', MIGRATION_TEXT, re.M)
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE, re.M)
    assert m
    names = m.group(1).split()
    assert names[names.index("520_equipment_details") + 1] == "530_resumable_uploads"


def test_the_session_is_a_credential_and_is_never_listed():
    assert "upload_session" in SQL_TEXT
    assert "upload_session" not in media._ASSET_COLUMNS
    # a capture is named by a hash or by the phone's own id, never by neither
    assert "ALTER COLUMN sha256 DROP NOT NULL" in SQL_TEXT
    assert "CHECK (sha256 IS NOT NULL OR client_capture_id IS NOT NULL)" in SQL_TEXT
    # the sweep finds suppliers without a tenant: definer, app role only
    assert "FUNCTION upload_sweep_orgs() RETURNS SETOF uuid" in SQL_TEXT
    assert "SECURITY DEFINER" in SQL_TEXT
    assert "REVOKE EXECUTE ON FUNCTION upload_sweep_orgs() FROM PUBLIC" in SQL_TEXT
    assert "GRANT  EXECUTE ON FUNCTION upload_sweep_orgs() TO sourcehub_app" in SQL_TEXT


# ---------------------------------------------------------------------------
# The service's pure parts
# ---------------------------------------------------------------------------
def test_the_stored_session_round_trips_and_garbage_reads_as_none():
    us = UploadSession("s3", "upload-1", CHUNK_BYTES, SIZE)
    as_json = (
        f'{{"protocol": "s3", "session": "upload-1", "chunk_size": {CHUNK_BYTES}, "size": {SIZE}}}'
    )
    assert media.upload_session_from(as_json) == us
    assert media.upload_session_from(us._asdict()) == us
    assert media.upload_session_from(None) is None
    assert media.upload_session_from({"protocol": "s3"}) is None
    assert media.part_count(us) == 4


def test_presign_answers_a_chunked_upload_with_the_protocol_not_a_put_url():
    session_url = "https://storage.googleapis.com/upload?upload_id=x"
    us = UploadSession("gcs", session_url, CHUNK_BYTES, SIZE)
    aid = uuid.uuid4()
    d = media._resumable_answer(aid, "k", us, "video/mp4", "pending")
    assert d["method"] == "RESUMABLE" and d["url"] is None and d["asset_id"] == aid
    assert d["upload"] == {
        "protocol": "gcs",
        "chunk_size": CHUNK_BYTES,
        "size": SIZE,
        "session_url": session_url,
    }
    # S3 and Azure take a URL per part, so no session leaves the server
    s3_session = UploadSession("s3", "id", CHUNK_BYTES, SIZE)
    s3 = media._resumable_answer(aid, "k", s3_session, "v", "pending")
    assert s3["upload"]["session_url"] is None


def test_presign_needs_a_hash_or_a_capture_id_and_chunks_only_on_request():
    base = {
        "filename": "a.mp4",
        "content_type": "video/mp4",
        "size_bytes": SIZE,
        "captured_at": NOW,
    }
    with pytest.raises(ValidationError):
        PresignIn(**base)
    p = PresignIn(**base, client_capture_id=uuid.uuid4(), resumable=True)
    assert p.resumable and p.restart is False and p.sha256 is None
    assert PresignIn(**base, sha256="a" * 64).resumable is False
    assert "hash_scope" not in PresignIn.model_fields
    # a few parts at a time, never none
    assert PartsIn(parts=[1, 2, 3]).parts == [1, 2, 3]
    with pytest.raises(ValidationError):
        PartsIn(parts=[])
    with pytest.raises(ValidationError):
        PartsIn(parts=list(range(1, 18)))


def test_the_routes_exist_for_the_capturing_worker_and_errors_map():
    routes = {
        (r.path, tuple(sorted(r.methods)))
        for r in media_api.router.routes
        if isinstance(r, APIRoute)
    }
    assert ("/assets/{asset_id}/upload/urls", ("POST",)) in routes
    assert ("/assets/{asset_id}/upload/status", ("GET",)) in routes
    assert media_api._map(media.MediaGone("x")).status_code == 410
    assert media_api._map(StorageError("x")).status_code == 502
    assert media_api._map(StorageTargetError("x")).status_code == 409
    assert media_api._map(LookupError("x")).status_code == 404


# ---------------------------------------------------------------------------
# The sweep's rule
# ---------------------------------------------------------------------------
class _FakeSession:
    """Answers every statement with the one row given; records what ran."""

    def __init__(self, row: dict | None) -> None:
        self.row, self.ran = row, []

    async def execute(self, stmt, params=None):
        self.ran.append((str(stmt), params))
        row = self.row
        return SimpleNamespace(mappings=lambda: SimpleNamespace(one_or_none=lambda: row))


def _pending_row(owner: uuid.UUID, **over):
    row = {
        "id": uuid.uuid4(),
        "storage_key": "k",
        "status": "pending",
        "captured_by_user_id": owner,
        "storage_target_id": None,
        "mime_type": "video/mp4",
        "upload_session": {
            "protocol": "s3",
            "session": "u",
            "chunk_size": CHUNK_BYTES,
            "size": SIZE,
        },
        "deleted_at": None,
    }
    row.update(over)
    return row


async def test_continuing_an_upload_the_sweep_removed_is_gone_not_not_found():
    # A phone away for a week comes back and asks where its clip stands. The
    # row was swept: 410 tells it to start again (the file is still on the
    # phone); a 404 it would read as a failure.
    me = uuid.uuid4()
    swept = _FakeSession(_pending_row(me, deleted_at=NOW))
    with pytest.raises(media.MediaGone):
        await media._own_pending_upload(swept, SimpleNamespace(user_id=me), uuid.uuid4())
    assert "deleted_at IS NULL" not in swept.ran[0][0], "the swept row must be found to be told"

    # someone else's row is refused before anything about it is said
    with pytest.raises(media.MediaError):
        await media._own_pending_upload(
            _FakeSession(_pending_row(uuid.uuid4(), deleted_at=NOW)),
            SimpleNamespace(user_id=me),
            uuid.uuid4(),
        )
    with pytest.raises(LookupError):
        await media._own_pending_upload(
            _FakeSession(None), SimpleNamespace(user_id=me), uuid.uuid4()
        )

    # a live one is handed back with its session, and marked as being worked on
    live = _FakeSession(_pending_row(me))
    row, us = await media._own_pending_upload(live, SimpleNamespace(user_id=me), uuid.uuid4())
    assert (row["storage_key"], us.protocol, us.size) == ("k", "s3", SIZE)
    assert "updated_at = now()" in live.ran[1][0]


def test_the_sweep_aborts_stale_sessions_and_drops_stale_puts_and_leaves_live_work():
    a, b, c, d = (uuid.uuid4() for _ in range(4))
    rows = [
        sweep.Stale(a, NOW - 7 * DAY, has_session=True),  # abandoned chunked upload
        sweep.Stale(b, NOW - 2 * DAY, has_session=True),  # a phone away for the weekend
        sweep.Stale(c, NOW - 8 * DAY, has_session=False),  # a single PUT that never came
        sweep.Stale(d, NOW - 6 * DAY, has_session=False),  # not yet
    ]
    assert sweep.plan(NOW, rows) == [sweep.Action(a, "abort"), sweep.Action(c, "drop")]
    # inside the providers' own seven-day expiry, so the abort still lands
    assert dt.timedelta(days=7) > sweep.SESSION_STALE


# ---------------------------------------------------------------------------
# Google: a session URL, 308 with Range, nothing per part
# ---------------------------------------------------------------------------
def _gcs_target() -> StorageTarget:
    return StorageTarget(provider="gcs", bucket="dm360-dev-client-acme", secret={})


async def test_gcs_opens_a_session_and_takes_every_chunk_at_its_url(monkeypatch):
    seen: dict = {}

    class Blob:
        def create_resumable_upload_session(self, **kw):
            seen.update(kw)
            return "https://storage.googleapis.com/upload/storage/v1/b/x/o?upload_id=abc"

    class Client:
        def bucket(self, name):
            return SimpleNamespace(blob=lambda key: Blob())

    monkeypatch.setattr(gcs_store, "_client", lambda t: (Client(), None))
    us = await storage.resumable_start(_gcs_target(), "k.mp4", SIZE, "video/mp4")
    session_url = "https://storage.googleapis.com/upload/storage/v1/b/x/o?upload_id=abc"
    assert us == UploadSession("gcs", session_url, CHUNK_BYTES, SIZE)
    assert seen["content_type"] == "video/mp4" and seen["size"] == SIZE
    assert seen["retry"] is None, "an unreachable Google must fail fast, like every other call"
    assert await storage.resumable_part_urls(_gcs_target(), "k.mp4", us, [1, 2]) == {}
    await storage.resumable_complete(_gcs_target(), "k.mp4", us, "video/mp4")  # a no-op


async def test_gcs_status_reads_the_308_range_and_a_dead_session_as_gone(monkeypatch):
    us = UploadSession("gcs", "https://session", CHUNK_BYTES, SIZE)
    calls: list[dict] = []

    def put(url, **kw):
        calls.append(kw)
        return httpx.Response(308, headers={"Range": f"bytes=0-{2 * CHUNK_BYTES - 1}"})

    monkeypatch.setattr(httpx, "put", put)
    st = await storage.resumable_status(_gcs_target(), "k", us)
    assert st.bytes_done == 2 * CHUNK_BYTES and st.parts_done == []
    assert calls[0]["headers"]["Content-Range"] == f"bytes */{SIZE}"
    assert calls[0]["content"] == b""

    monkeypatch.setattr(httpx, "put", lambda url, **kw: httpx.Response(200))
    assert (await storage.resumable_status(_gcs_target(), "k", us)).bytes_done == SIZE
    monkeypatch.setattr(httpx, "put", lambda url, **kw: httpx.Response(404))
    with pytest.raises(LookupError):
        await storage.resumable_status(_gcs_target(), "k", us)
    monkeypatch.setattr(httpx, "put", lambda url, **kw: httpx.Response(500))
    with pytest.raises(StorageError):
        await storage.resumable_status(_gcs_target(), "k", us)
    assert gcs_store._bytes_held(None) == 0 and gcs_store._bytes_held("bytes=0-0") == 1


# ---------------------------------------------------------------------------
# Azure: blocks staged under a prefix, committed in order
# ---------------------------------------------------------------------------
def _azure_target() -> StorageTarget:
    key = base64.b64encode(b"\x01" * 32).decode()
    return StorageTarget(
        provider="azure_blob",
        bucket="captures",
        secret={"account_name": "dm360dev", "account_key": key},
    )


def test_azure_block_ids_are_fixed_width_and_ours_alone():
    ids = [azure_store._block_id("p1", n) for n in (1, 2, 999999)]
    assert len({len(i) for i in ids}) == 1, "Azure requires equal-length block ids within a blob"
    assert [azure_store._part_of(i, "p1") for i in ids] == [1, 2, 999999]
    assert azure_store._part_of(ids[0], "other") is None
    assert azure_store._part_of("not base64!", "p1") is None


async def test_azure_part_urls_carry_the_block_id_on_a_write_sas():
    us = UploadSession("azure", "p1", CHUNK_BYTES, SIZE)
    urls = await storage.resumable_part_urls(_azure_target(), "a b/c.mp4", us, [1, 2])
    assert set(urls) == {1, 2}
    for n, url in urls.items():
        assert url.startswith("https://dm360dev.blob.core.windows.net/captures/a%20b/c.mp4?")
        assert "comp=block&blockid=" in url and "sp=cw" in url
        assert url.endswith(f"blockid={quote(azure_store._block_id('p1', n), safe='')}")


async def test_azure_completes_only_a_full_set_in_order_and_twice_is_fine(monkeypatch):
    committed: list = []
    state = {"uncommitted": [1, 3, 2], "committed": False}

    class BlobClient:
        def get_block_list(self, kind):
            unc = [SimpleNamespace(id=azure_store._block_id("p1", n)) for n in state["uncommitted"]]
            com = [SimpleNamespace(id="x")] if state["committed"] else []
            return com, unc

        def commit_block_list(self, blocks, content_settings=None):
            committed.append(([b.id for b in blocks], content_settings.content_type))

    service = SimpleNamespace(get_blob_client=lambda c, k: BlobClient())
    monkeypatch.setattr(azure_store, "_service", lambda t: service)
    us = UploadSession("azure", "p1", CHUNK_BYTES, SIZE)
    st = await storage.resumable_status(_azure_target(), "k", us)
    assert st.parts_done == [1, 2, 3], "sorted, whatever order Azure lists them in"
    with pytest.raises(LookupError):  # part 4 is missing: "not uploaded yet"
        await storage.resumable_complete(_azure_target(), "k", us, "video/mp4")
    assert committed == []
    state["uncommitted"] = [4, 1, 3, 2]
    await storage.resumable_complete(_azure_target(), "k", us, "video/mp4")
    assert committed == [([azure_store._block_id("p1", n) for n in (1, 2, 3, 4)], "video/mp4")]
    # a second confirm after the commit: blocks gone, blob there, nothing to do
    state["uncommitted"], state["committed"] = [], True
    await storage.resumable_complete(_azure_target(), "k", us, "video/mp4")
    assert len(committed) == 1


# ---------------------------------------------------------------------------
# S3: a multipart upload, URLs signed per part, completed by etag
# ---------------------------------------------------------------------------
def _s3_target() -> StorageTarget:
    return StorageTarget(
        provider="s3",
        bucket="acme",
        region="eu-west-1",
        secret={"access_key_id": "AK", "secret_access_key": "SK"},
        endpoint="http://minio:9000",
    )


class FakeMinio:
    def __init__(self):
        self.parts: list[SimpleNamespace] = []
        self.completed: list = []
        self.aborted: list[str] = []
        self.exists = False

    def _create_multipart_upload(self, bucket, key, headers):
        self.headers = headers
        return "upload-1"

    def get_presigned_url(self, method, bucket, key, expires, extra_query_params=None, **kw):
        q = "&".join(f"{k}={v}" for k, v in sorted((extra_query_params or {}).items()))
        return f"https://acme.s3.example/{key}?{q}&X-Amz-Signature=sig"

    def _list_parts(self, bucket, key, upload_id, part_number_marker=None):
        from minio.error import S3Error

        if upload_id != "upload-1":
            raise S3Error(
                response=None,
                code="NoSuchUpload",
                message="gone",
                resource="r",
                request_id="req",
                host_id="h",
            )
        return SimpleNamespace(parts=self.parts, is_truncated=False, next_part_number_marker=None)

    def _complete_multipart_upload(self, bucket, key, upload_id, parts):
        self.completed.append([(p.part_number, p.etag) for p in parts])

    def _abort_multipart_upload(self, bucket, key, upload_id):
        self.aborted.append(upload_id)

    def stat_object(self, bucket, key):
        if not self.exists:
            raise LookupError(key)
        return SimpleNamespace(size=SIZE)


async def test_s3_signs_a_url_per_part_and_completes_by_etag_in_order(monkeypatch):
    fake = FakeMinio()
    monkeypatch.setattr(s3_store, "_client", lambda t, *, signing: fake)
    t = _s3_target()
    us = await storage.resumable_start(t, "k.mp4", SIZE, "video/mp4")
    assert us == UploadSession("s3", "upload-1", CHUNK_BYTES, SIZE)
    assert fake.headers == {"Content-Type": "video/mp4"}
    urls = await storage.resumable_part_urls(t, "k.mp4", us, [2, 1])
    assert urls[1].endswith("partNumber=1&uploadId=upload-1&X-Amz-Signature=sig")
    assert set(urls) == {1, 2}

    fake.parts = [SimpleNamespace(part_number=n, etag=f"e{n}") for n in (3, 1, 2)]
    assert (await storage.resumable_status(t, "k.mp4", us)).parts_done == [1, 2, 3]
    with pytest.raises(LookupError):  # part 4 missing
        await storage.resumable_complete(t, "k.mp4", us, "video/mp4")
    fake.parts.append(SimpleNamespace(part_number=4, etag="e4"))
    await storage.resumable_complete(t, "k.mp4", us, "video/mp4")
    assert fake.completed == [[(1, "e1"), (2, "e2"), (3, "e3"), (4, "e4")]]

    # after completion S3 forgets the upload id; the object being there says it is done
    fake.exists = True
    gone = UploadSession("s3", "upload-old", CHUNK_BYTES, SIZE)
    await storage.resumable_complete(t, "k.mp4", gone, "video/mp4")
    fake.exists = False
    with pytest.raises(LookupError):
        await storage.resumable_complete(t, "k.mp4", gone, "video/mp4")
    with pytest.raises(LookupError):
        await storage.resumable_status(t, "k.mp4", gone)
    await storage.resumable_abort(t, "k.mp4", us)
    assert fake.aborted == ["upload-1"]
