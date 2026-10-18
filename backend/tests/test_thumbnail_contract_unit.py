"""A capture may carry a poster: presign promises it, confirm notes it, and the
capture never waits on it.

What this file guards:

  * the route takes a small JPEG and nothing else — and takes none at all;
  * the poster sits beside its capture under the same name, and can never
    collide with a capture's own key;
  * presign writes the promise to asset.metadata and returns the second PUT —
    on a new row, on a pending retry, and again on a ready row whose poster
    never arrived;
  * confirm HEADs the poster only when one was promised, tolerates a poster
    that is missing or a destination that refuses without touching the
    capture's readiness, notes a poster that arrives late, and notes nothing
    under the key that is not an image.

Fakes only; no database or storage is opened.

    pytest tests/test_thumbnail_contract_unit.py
"""

from __future__ import annotations

import datetime as dt
import json
import uuid
from decimal import Decimal
from typing import Any

import pytest
from pydantic import ValidationError

from sourcehub.api.security import AccessClaims
from sourcehub.api.v1.media import PresignIn
from sourcehub.modules.media import service as media
from sourcehub.platform.storage import ObjectStat, StorageError, StorageTarget

ASSIGNMENT, CONTRACT, WORKER, TARGET = uuid.uuid4(), uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
JPEG = {"size_bytes": 30_000, "content_type": "image/jpeg"}


def _claims(**kw: Any) -> AccessClaims:
    base: dict[str, Any] = {
        "user_id": WORKER, "full_name": "Priya Nair", "email": "p@x.example",
        "org_id": uuid.uuid4(), "org_kind": "aggregator", "org_name": "Bengaluru Crowd",
        "role": "worker", "scope": "member", "capabilities": frozenset({"asset.upload"}),
        "mfa_satisfied": True, "must_change_password": False,
    }
    return AccessClaims(**{**base, **kw})


def _presign_body(**over: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "filename": "shelf-01.jpg", "content_type": "image/jpeg", "size_bytes": 1024,
        "sha256": "a" * 64, "captured_at": "2026-10-18T10:00:00Z",
    }
    base.update(over)
    return base


# ---------------------------------------------------------------------------
# The shape the route takes
# ---------------------------------------------------------------------------
def test_a_poster_is_optional():
    assert PresignIn(**_presign_body()).thumbnail is None
    assert PresignIn(**_presign_body(thumbnail=None)).thumbnail is None


def test_a_poster_is_a_small_jpeg():
    body = PresignIn(**_presign_body(thumbnail=JPEG))
    assert body.thumbnail is not None and body.thumbnail.size_bytes == 30_000
    assert PresignIn(**_presign_body(thumbnail={**JPEG, "size_bytes": 2 * 1024 * 1024})).thumbnail


@pytest.mark.parametrize(
    "bad",
    [
        {**JPEG, "content_type": "image/png"},
        {**JPEG, "content_type": "video/mp4"},
        {**JPEG, "size_bytes": 2 * 1024 * 1024 + 1},
        {**JPEG, "size_bytes": 0},
        {"content_type": "image/jpeg"},
    ],
)
def test_anything_else_is_refused_by_shape(bad: dict[str, Any]):
    with pytest.raises(ValidationError):
        PresignIn(**_presign_body(thumbnail=bad))


# ---------------------------------------------------------------------------
# Where the poster goes
# ---------------------------------------------------------------------------
def test_the_poster_sits_beside_its_capture_under_the_same_name():
    key = "acme/CTR-05_TSK-06_AG-04_WKR-13_ef051366.jpg"
    assert media.thumb_key_for(key) == key + ".thumb.jpg"


def test_a_capture_key_can_never_be_a_poster_key():
    # _capture_name rebuilds every name as …_<hex8>.<ext>; the extension is one
    # the gate accepts, so '.thumb.' never appears, and the five fields still split.
    name = media._capture_name(
        contract_ref="CTR-05", task_ref="TSK-06", aggregator_ref="AG-04", worker_ref="WKR-13",
        worker_user_id=WORKER, asset_id=uuid.uuid4(), ext="jpg",
    )
    assert ".thumb." not in name
    poster = media.thumb_key_for(name)
    assert poster.endswith(".jpg.thumb.jpg") and len(poster.split("_")) == 5


def test_the_promise_is_key_size_and_type():
    assert media.thumb_promise("k.jpg", None) is None
    assert media.thumb_promise("k.jpg", JPEG) == {
        "key": "k.jpg.thumb.jpg", "claimed_size": 30_000, "content_type": "image/jpeg",
    }


@pytest.mark.parametrize(
    "bad",
    [
        {**JPEG, "content_type": "image/png"},
        {**JPEG, "size_bytes": media.MAX_THUMB_BYTES + 1},
        {**JPEG, "size_bytes": 0},
        {},
    ],
)
def test_the_rule_holds_past_the_route_too(bad: dict[str, Any]):
    with pytest.raises(media.MediaInvalid):
        media.thumb_promise("k.jpg", bad)


# ---------------------------------------------------------------------------
# Presign on a fake session
# ---------------------------------------------------------------------------
class _Rows:
    def __init__(self, rows: list[Any] | None = None, scalar: Any = None):
        self._rows, self._scalar = rows or [], scalar

    def mappings(self) -> _Rows:
        return self

    def all(self) -> list[Any]:
        return list(self._rows)

    def one_or_none(self) -> Any:
        return self._rows[0] if self._rows else None

    def one(self) -> Any:
        return self._rows[0]

    def scalar_one_or_none(self) -> Any:
        return self._scalar

    def scalar_one(self) -> Any:
        return self._scalar


def _assignment() -> dict[str, Any]:
    return {
        "id": ASSIGNMENT, "task_id": uuid.uuid4(), "contract_id": CONTRACT,
        "supplier_org_id": uuid.uuid4(), "worker_user_id": WORKER, "status": "in_progress",
        "quantity": Decimal(3), "revoked_at": None, "target_unit": "photos",
        "capture_spec": {"media": ["photo"]}, "contract_ref": "CTR-05", "task_ref": "TSK-06",
        "aggregator_ref": "AG-04", "worker_ref": "WKR-13",
    }


class _PresignSession:
    """Answers the assignment, the idempotency lookup, the quota and the name
    check; records the insert and any metadata update."""

    def __init__(self, existing: dict[str, Any] | None = None):
        # a single PUT, as every row here: the chunked path (db/540) has its own tests
        self.existing = {"upload_session": None, **existing} if existing else None
        self.inserts: list[dict[str, Any]] = []
        self.updates: list[dict[str, Any]] = []

    async def execute(self, statement: Any, params: dict[str, Any] | None = None) -> _Rows:
        sql, p = str(statement), dict(params or {})
        if sql.startswith("SELECT ta.id, ta.task_id"):
            return _Rows([_assignment()])
        if sql.startswith("SELECT id, status, storage_key, metadata, upload_session FROM asset"):
            return _Rows([self.existing] if self.existing else [])
        if sql.startswith("SELECT count(*) AS n"):
            return _Rows([{"n": 0, "units": Decimal(0)}])
        if sql.startswith("SELECT 1 FROM asset WHERE storage_key"):
            return _Rows(scalar=None)
        if sql.startswith("INSERT INTO asset"):
            self.inserts.append(p)
            return _Rows()
        if sql.startswith("UPDATE asset SET metadata"):
            self.updates.append(json.loads(p["m"]))
            return _Rows()
        raise AssertionError(f"unexpected statement: {sql[:80]}")


@pytest.fixture
def puts(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Fake storage: the contract delivers to one S3 destination; every PUT
    signs, and the keys signed are recorded in order."""
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    signed: list[str] = []
    target = StorageTarget(provider="s3", bucket="acme", secret={}, key_prefix="acme/")

    async def resolve_for_contract(_s: Any, _c: Any) -> tuple[StorageTarget, uuid.UUID]:
        return target, TARGET

    async def presign_put(_t: Any, key: str) -> tuple[str, dict[str, str]]:
        signed.append(key)
        return f"https://put.example/{key}", {"x-ms-blob-type": "BlockBlob"}

    monkeypatch.setattr(storage_svc, "resolve_for_contract", resolve_for_contract)
    monkeypatch.setattr(storage, "presign_put", presign_put)
    return signed


async def _presign(session: _PresignSession, thumbnail: dict[str, Any] | None) -> dict[str, Any]:
    return await media.presign_capture(
        session, _claims(), ASSIGNMENT,  # type: ignore[arg-type]
        filename="shelf-01.jpg", content_type="image/jpeg", size_bytes=1024, sha256="a" * 64,
        captured_at=dt.datetime(2026, 10, 18, 10, tzinfo=dt.UTC), lat=None, lon=None,
        thumbnail=thumbnail,
    )


async def test_presign_promises_the_poster_and_returns_its_put(puts: list[str]):
    s = _PresignSession()
    out = await _presign(s, JPEG)
    key = out["storage_key"]
    assert key.startswith("acme/CTR-05_TSK-06_AG-04_WKR-13_") and key.endswith(".jpg")
    meta = json.loads(s.inserts[0]["meta"])
    assert meta["thumb"] == {"key": key + ".thumb.jpg", "claimed_size": 30_000,
                             "content_type": "image/jpeg"}
    assert meta["claimed_size"] == 1024 and meta["kind"] == "image", "the old keys stay"
    assert out["thumb"] == {
        "storage_key": key + ".thumb.jpg", "url": f"https://put.example/{key}.thumb.jpg",
        "method": "PUT", "headers": {"Content-Type": "image/jpeg", "x-ms-blob-type": "BlockBlob"},
    }
    assert puts == [key, key + ".thumb.jpg"]
    assert out["status"] == "pending" and out["url"] == f"https://put.example/{key}"


async def test_without_a_poster_the_presign_is_what_it_was(puts: list[str]):
    s = _PresignSession()
    out = await _presign(s, None)
    assert "thumb" not in json.loads(s.inserts[0]["meta"])
    assert out["thumb"] is None
    assert puts == [out["storage_key"]]


async def test_a_ready_row_gets_the_poster_put_again_until_it_arrives(puts: list[str]):
    promise = {"key": "acme/k.jpg.thumb.jpg", "claimed_size": 30_000, "content_type": "image/jpeg"}
    s = _PresignSession({"id": uuid.uuid4(), "status": "ready", "storage_key": "acme/k.jpg",
                         "metadata": {"kind": "image", "thumb": promise}})
    out = await _presign(s, JPEG)
    assert out["status"] == "ready" and out["url"] is None, "the capture itself is done"
    assert out["thumb"]["storage_key"] == "acme/k.jpg.thumb.jpg"
    assert puts == ["acme/k.jpg.thumb.jpg"] and s.updates == []


async def test_a_ready_row_whose_poster_arrived_offers_nothing(puts: list[str]):
    s = _PresignSession({"id": uuid.uuid4(), "status": "ready", "storage_key": "acme/k.jpg",
                         "metadata": {"thumb": {"key": "acme/k.jpg.thumb.jpg"},
                                      "thumb_key": "acme/k.jpg.thumb.jpg", "thumb_size": 28_000}})
    out = await _presign(s, JPEG)
    assert out["thumb"] is None and puts == []


async def test_a_pending_retry_records_a_new_promise(puts: list[str]):
    s = _PresignSession({"id": uuid.uuid4(), "status": "pending", "storage_key": "acme/k.jpg",
                         "metadata": {"kind": "image"}})
    out = await _presign(s, JPEG)
    assert s.updates == [{"thumb": {"key": "acme/k.jpg.thumb.jpg", "claimed_size": 30_000,
                                    "content_type": "image/jpeg"}}]
    assert out["thumb"]["storage_key"] == "acme/k.jpg.thumb.jpg"
    assert puts == ["acme/k.jpg", "acme/k.jpg.thumb.jpg"]


async def test_a_pending_retry_keeps_a_promise_it_already_holds(puts: list[str]):
    promise = {"key": "acme/k.jpg.thumb.jpg", "claimed_size": 30_000, "content_type": "image/jpeg"}
    s = _PresignSession({"id": uuid.uuid4(), "status": "pending", "storage_key": "acme/k.jpg",
                         "metadata": {"thumb": promise}})
    out = await _presign(s, None)
    assert s.updates == [], "nothing new was promised"
    assert out["thumb"]["storage_key"] == "acme/k.jpg.thumb.jpg"
    assert puts == ["acme/k.jpg", "acme/k.jpg.thumb.jpg"]


async def test_a_bad_poster_refuses_the_presign_before_anything_is_written(puts: list[str]):
    s = _PresignSession()
    with pytest.raises(media.MediaInvalid):
        await _presign(s, {**JPEG, "content_type": "image/png"})
    assert s.inserts == [] and puts == []


# ---------------------------------------------------------------------------
# Confirm on a fake session
# ---------------------------------------------------------------------------
def _full_row(row: dict[str, Any]) -> dict[str, Any]:
    base: dict[str, Any] = dict.fromkeys(
        ("task_id", "assignment_id", "submission_id", "captured_by_user_id", "captured_by_name",
         "mime_type", "duration_s", "sha256", "etag", "quarantine_reason", "captured_at",
         "captured_lat", "captured_lon", "uploaded_at", "created_at", "check_results",
         "review_reason", "review_note", "reviewed_at", "review_label", "batch_id", "batch_no",
         "batch_status", "replaces_asset_id")
    )
    base.update({"id": row["id"], "filename": row["filename"], "size_bytes": row["size_bytes"],
                 "status": "ready", "replaced": False})
    return base


class _ConfirmSession:
    def __init__(self, row: dict[str, Any]):
        self.row = row
        self.status_updates: list[dict[str, Any]] = []
        self.meta_updates: list[dict[str, Any]] = []

    async def execute(self, statement: Any, params: dict[str, Any] | None = None) -> _Rows:
        sql, p = str(statement), dict(params or {})
        if sql.startswith("SELECT id, assignment_id, storage_key"):
            return _Rows([self.row])
        if sql.startswith("SELECT CASE WHEN revoked_at"):
            return _Rows(scalar="in_progress")
        if sql.startswith("UPDATE asset SET status"):
            self.status_updates.append(p)
            return _Rows()
        if sql.startswith("UPDATE asset SET metadata"):
            self.meta_updates.append(json.loads(p["m"]))
            return _Rows()
        if sql.startswith("SELECT a.id, a.task_id"):
            return _Rows([_full_row(self.row)])
        raise AssertionError(f"unexpected statement: {sql[:80]}")


PROMISE = {"key": "acme/k.jpg.thumb.jpg", "claimed_size": 30_000, "content_type": "image/jpeg"}


def _row(status: str = "pending", **meta: Any) -> dict[str, Any]:
    return {
        "id": uuid.uuid4(), "assignment_id": ASSIGNMENT, "storage_key": "acme/k.jpg",
        "filename": "k.jpg", "size_bytes": 1024, "status": status, "storage_target_id": TARGET,
        "metadata": {"kind": "image", **meta}, "mime_type": "image/jpeg", "upload_session": None,
    }


@pytest.fixture
def heads(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Fake storage: what each key holds (an ObjectStat, an exception to raise,
    or nothing), and the keys HEADed in order."""
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    store: dict[str, Any] = {"acme/k.jpg": ObjectStat(1024, "image/jpeg", "etag-1"),
                             "asked": []}

    async def resolve_by_id(_s: Any, _t: Any) -> StorageTarget:
        return StorageTarget(provider="s3", bucket="acme", secret={})

    async def head(_t: Any, key: str) -> ObjectStat:
        store["asked"].append(key)
        held = store.get(key)
        if held is None:
            raise LookupError(key)
        if isinstance(held, Exception):
            raise held
        return held  # type: ignore[no-any-return]

    monkeypatch.setattr(storage_svc, "resolve_by_id", resolve_by_id)
    monkeypatch.setattr(storage, "head", head)
    return store


async def _confirm(s: _ConfirmSession) -> dict[str, Any]:
    return await media.confirm_asset(s, _claims(), s.row["id"])  # type: ignore[arg-type]


async def test_confirm_notes_the_poster_once_the_capture_has_passed(heads: dict[str, Any]):
    heads["acme/k.jpg.thumb.jpg"] = ObjectStat(28_000, "image/jpeg", "etag-2")
    s = _ConfirmSession(_row(thumb=PROMISE))
    out = await _confirm(s)
    assert heads["asked"] == ["acme/k.jpg", "acme/k.jpg.thumb.jpg"], "the original first"
    assert len(s.status_updates) == 1 and s.status_updates[0]["etag"] == "etag-1"
    assert s.meta_updates == [{"thumb_key": "acme/k.jpg.thumb.jpg", "thumb_size": 28_000}]
    assert out["status"] == "ready"


async def test_confirm_looks_for_no_poster_that_was_not_promised(heads: dict[str, Any]):
    s = _ConfirmSession(_row())
    await _confirm(s)
    assert heads["asked"] == ["acme/k.jpg"] and s.meta_updates == []


@pytest.mark.parametrize("trouble", [None, StorageError("destination refused")])
async def test_a_missing_or_refused_poster_never_touches_readiness(
    heads: dict[str, Any], trouble: Exception | None
):
    if trouble is not None:
        heads["acme/k.jpg.thumb.jpg"] = trouble
    s = _ConfirmSession(_row(thumb=PROMISE))
    out = await _confirm(s)
    assert heads["asked"] == ["acme/k.jpg", "acme/k.jpg.thumb.jpg"]
    assert len(s.status_updates) == 1 and "etag" in s.status_updates[0], "the capture is ready"
    assert s.meta_updates == [], "and the poster is simply not there yet"
    assert out["status"] == "ready"


async def test_a_poster_that_arrives_late_is_noted_on_the_ready_row(heads: dict[str, Any]):
    heads["acme/k.jpg.thumb.jpg"] = ObjectStat(28_000, "image/jpeg", "etag-2")
    s = _ConfirmSession(_row("ready", thumb=PROMISE))
    out = await _confirm(s)
    assert heads["asked"] == ["acme/k.jpg.thumb.jpg"], "the original is not asked about again"
    assert s.status_updates == []
    assert s.meta_updates == [{"thumb_key": "acme/k.jpg.thumb.jpg", "thumb_size": 28_000}]
    assert out["status"] == "ready"


async def test_a_ready_row_with_its_poster_noted_asks_storage_nothing(heads: dict[str, Any]):
    s = _ConfirmSession(_row("ready", thumb=PROMISE, thumb_key="acme/k.jpg.thumb.jpg"))
    await _confirm(s)
    assert heads["asked"] == [] and s.meta_updates == []


async def test_a_quarantined_capture_gets_no_poster(heads: dict[str, Any]):
    heads["acme/k.jpg"] = ObjectStat(999, "image/jpeg", "etag-1")
    heads["acme/k.jpg.thumb.jpg"] = ObjectStat(28_000, "image/jpeg", "etag-2")
    s = _ConfirmSession(_row(thumb=PROMISE))
    await _confirm(s)
    assert heads["asked"] == ["acme/k.jpg"], "the poster is for a capture that passed"
    assert s.status_updates[0]["why"].startswith("size mismatch")
    assert s.meta_updates == []


async def test_a_poster_far_larger_than_a_poster_is_not_noted(heads: dict[str, Any]):
    heads["acme/k.jpg.thumb.jpg"] = ObjectStat(media.MAX_THUMB_BYTES + 1, "image/jpeg", "e")
    s = _ConfirmSession(_row(thumb=PROMISE))
    out = await _confirm(s)
    assert out["status"] == "ready" and s.meta_updates == []


@pytest.mark.parametrize(
    ("held", "noted"),
    [("image/jpeg", True), ("image/png", True), ("text/plain", False), ("text/html", False),
     (None, False)],
)
async def test_only_an_image_under_the_poster_key_is_noted(
    heads: dict[str, Any], held: str | None, noted: bool
):
    # The promise said image/jpeg, but the key holds whatever the device PUT
    # there, and a tile is an <img>: text under it would draw as a broken image
    # on every reviewer's screen. The capture itself is ready either way.
    heads["acme/k.jpg.thumb.jpg"] = ObjectStat(28_000, held, "e")
    s = _ConfirmSession(_row(thumb=PROMISE))
    out = await _confirm(s)
    assert out["status"] == "ready" and len(s.status_updates) == 1, "the capture is untouched"
    assert s.status_updates[0]["etag"] == "etag-1" and "why" not in s.status_updates[0]
    noted_as = [{"thumb_key": "acme/k.jpg.thumb.jpg", "thumb_size": 28_000}] if noted else []
    assert s.meta_updates == noted_as
