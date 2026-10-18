"""The capture gallery reads by page: db/530, migration 0057, and the service.

What this file guards:

  * the migration is db/530 verbatim, follows 0056, sits after 520 in the
    bundle, and adds no column — the poster lives in asset.metadata, so nothing
    here can clash with a column another change adds to asset;
  * the page query, the cursor and the index all speak of the same three
    values in the same order, so the LIMIT is served without a sort;
  * a cursor round-trips exactly ('infinity' and microseconds included), its
    timestamps are printed in one UTC form whatever the session's DateStyle,
    and anything that is not one of ours is a 422, never a database error;
  * the parent probe goes through task; one row more than asked for is read;
    the total is counted on the first page only; the slim row carries none of
    the checks, hashes or coordinates the full row does; the badge is picked
    in the console's order;
  * posters are signed eight at a time with each destination resolved once, a
    failure costs one tile, and a capture without a poster is never signed;
  * the detail route carries the lists' visibility rule and does not shadow
    /assets/{id}/url.

Scripts, pure rules and fakes only; no database or storage is opened.

    pytest tests/test_gallery_paging_unit.py
"""

from __future__ import annotations

import asyncio
import base64
import datetime as dt
import re
import uuid
from pathlib import Path
from typing import Any

import pytest
from fastapi.routing import APIRoute
from starlette.routing import Match

from sourcehub.api.security import AccessClaims
from sourcehub.api.v1 import media as media_api
from sourcehub.modules.media import service as media

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "530_gallery_paging.sql").read_text(encoding="utf-8")
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION_TEXT = (VERSIONS / "0057_gallery_paging.py").read_text(encoding="utf-8")
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
WEB_GALLERY = (
    ROOT / "frontend" / "src" / "features" / "delivery" / "components" / "AssetGallery.tsx"
)

ME = uuid.uuid4()
TASK = uuid.uuid4()
TARGET_A, TARGET_B = uuid.uuid4(), uuid.uuid4()


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _claims(**kw: Any) -> AccessClaims:
    base: dict[str, Any] = {
        "user_id": uuid.uuid4(), "full_name": "R", "email": "r@x.example",
        "org_id": ME, "org_kind": "aggregator", "org_name": "Bengaluru Crowd",
        "role": "aggregator", "scope": "owner", "capabilities": frozenset({"qa.review.gate1"}),
        "mfa_satisfied": True, "must_change_password": False,
    }
    return AccessClaims(**{**base, **kw})


# ---------------------------------------------------------------------------
# The two files stay one change, and add no column
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0056():
    assert re.search(r'^revision = "0057"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0056"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_520_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("530_gallery_paging") == files.index("520_equipment_details") + 1


def test_nothing_is_added_to_the_table():
    # The poster's promise lives in asset.metadata, so a column another change
    # adds to asset (a resumable upload's session, say) has nothing to clash with.
    up = _literal("_UP")
    assert "ADD COLUMN" not in up
    assert "upload_session" not in up
    assert "CREATE INDEX asset_task_gallery_idx" in up
    assert "COMMENT ON COLUMN asset.metadata IS" in up


def test_the_downgrade_drops_the_index_and_clears_the_comment():
    down = _literal("_DOWN")
    assert "DROP INDEX IF EXISTS asset_task_gallery_idx" in down
    # db/050 set no comment on the column, so "back" is none
    assert "COMMENT ON COLUMN asset.metadata IS NULL" in down
    start, end = MIGRATION_TEXT.index("def upgrade"), MIGRATION_TEXT.index("def downgrade")
    assert "autocommit_block" not in MIGRATION_TEXT[start:end], "nothing here needs its own txn"


def test_the_index_is_partial_on_live_rows_and_carries_the_runbook():
    assert "WHERE deleted_at IS NULL;" in SQL_TEXT
    # the 40 M-row route: per partition, concurrently, then attached
    for words in ("ON ONLY asset", "CREATE INDEX CONCURRENTLY", "ATTACH PARTITION"):
        assert words in SQL_TEXT, words


# ---------------------------------------------------------------------------
# The order, the cursor and the index say the same thing
# ---------------------------------------------------------------------------
def test_the_order_the_cursor_and_the_index_list_the_same_expressions():
    key, order = media._GALLERY_KEY, media._GALLERY_ORDER
    assert order == f"ORDER BY {key}, a.created_at, a.id"
    assert media._GALLERY_AFTER.startswith(f"({key}, a.created_at, a.id) > (")
    # the index holds the same expression, unaliased, in the same position
    assert key.replace("a.", "") == "coalesce(captured_at, 'infinity'::timestamptz)"
    assert (
        "ON asset (task_id, (coalesce(captured_at, 'infinity'::timestamptz)), created_at, id)"
        in SQL_TEXT
    )


def test_the_cursor_binds_are_typed_timestamps_not_text_casts():
    # a text cast inside the query is not leakproof and could never be an index
    # condition under RLS; the binds are typed (the COALESCE key still keeps the
    # comparison a filter — the note above _GALLERY_KEY has the measurement)
    assert "CAST(:k_at AS timestamptz), CAST(:k_created AS timestamptz), :k_id)" in media._GALLERY_AFTER
    assert "AS text" not in media._GALLERY_AFTER
    asset_id = uuid.uuid4()
    b = media.cursor_binds("2026-10-18 10:00:00.000007+05:30", "2026-10-18 04:30:00+00", asset_id)
    assert b["k_at"].isoformat() == "2026-10-18T10:00:00.000007+05:30"
    assert b["k_created"].utcoffset() is not None and b["k_created"].hour == 4
    assert b["k_id"] == asset_id
    # the untimed captures sort last: 'infinity' is the one value with no datetime,
    # and asyncpg writes datetime.max as timestamptz infinity
    assert media.cursor_binds("infinity", "2026-10-18 04:30:00+00", asset_id)["k_at"] == dt.datetime.max.replace(
        tzinfo=dt.timezone.utc
    )


def test_the_cursor_values_are_printed_in_one_fixed_utc_form():
    # ::text prints a timestamptz as the session's DateStyle says — ISO only by
    # default, which the app never sets — and a cursor minted under one setting
    # would be refused under another. to_char pins the form; the untimed key is
    # 'infinity', the one value no datetime prints.
    cols = media._GALLERY_COLUMNS
    assert "::text AS k_at" not in cols and "::text AS k_created" not in cols
    form = "'YYYY-MM-DD HH24:MI:SS.US+00'"
    assert (
        "CASE WHEN a.captured_at IS NULL THEN 'infinity' "
        f"ELSE to_char(a.captured_at AT TIME ZONE 'UTC', {form}) END AS k_at, "
        f"to_char(a.created_at AT TIME ZONE 'UTC', {form}) AS k_created, "
    ) in cols
    # and what that prints is exactly what decode_cursor takes and cursor_binds parses
    printed = "2026-10-18 10:00:05.000001+00"
    assert media._PG_TIMESTAMPTZ.fullmatch(printed)
    assert media.cursor_binds(printed, printed, uuid.uuid4())["k_at"] == dt.datetime(
        2026, 10, 18, 10, 0, 5, 1, tzinfo=dt.UTC
    )


@pytest.mark.parametrize("k_at", ["2026-10-18 10:00:00.123456+00", "infinity"])
def test_a_cursor_round_trips_exactly(k_at: str):
    asset_id = uuid.uuid4()
    created = "2026-10-18 10:00:00.000007+05:30"
    token = media.encode_cursor(k_at, created, asset_id)
    assert re.fullmatch(r"[A-Za-z0-9_-]+", token), "a cursor must survive a query string untouched"
    assert media.decode_cursor(token) == (k_at, created, asset_id)


@pytest.mark.parametrize(
    "bad",
    [
        "",
        "not-a-cursor",
        base64.urlsafe_b64encode(b"[1,2,3]").decode().rstrip("="),
        base64.urlsafe_b64encode(b'["x","y","z"]').decode().rstrip("="),
        base64.urlsafe_b64encode(b'{"a":1}').decode().rstrip("="),
        base64.urlsafe_b64encode(b'["2026-10-18 10:00:00+00","2026-10-18 10:00:00+00"]').decode(),
        base64.urlsafe_b64encode(
            b'["2026-10-18 10:00:00+00","2026-10-18 10:00:00+00","not-a-uuid"]'
        ).decode(),
        base64.urlsafe_b64encode(b"\xff\xfe").decode(),
        # three timestamp forms this list never prints: Python's parser takes
        # them all, Postgres refuses the first two, and a cursor the database
        # refused would be a 500 instead of this 422
        base64.urlsafe_b64encode(
            b'["2026-W42-1","2026-10-18 10:00:00+00","6f1d8a2e-0c3b-4e5f-9a7b-1c2d3e4f5a6b"]'
        ).decode().rstrip("="),
        base64.urlsafe_b64encode(
            b'["20261018T100000","2026-10-18 10:00:00+00","6f1d8a2e-0c3b-4e5f-9a7b-1c2d3e4f5a6b"]'
        ).decode().rstrip("="),
        base64.urlsafe_b64encode(
            b'["2026-10-18T10:00:00+00:00","2026-10-18 10:00:00+00",'
            b'"6f1d8a2e-0c3b-4e5f-9a7b-1c2d3e4f5a6b"]'
        ).decode().rstrip("="),
    ],
)
def test_anything_that_is_not_our_cursor_is_refused_before_the_database(bad: str):
    with pytest.raises(media.MediaInvalid):
        media.decode_cursor(bad)


# ---------------------------------------------------------------------------
# list_gallery on a fake session
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

    def scalar_one_or_none(self) -> Any:
        return self._scalar

    def scalar_one(self) -> Any:
        return self._scalar


def _row(i: int, **over: Any) -> dict[str, Any]:
    """One row as the page SELECT returns it (_GALLERY_COLUMNS' aliases)."""
    at = dt.datetime(2026, 10, 18, 10, 0, i, 123456, tzinfo=dt.UTC)
    printed = f"2026-10-18 10:00:{i:02d}.123456+00"
    base: dict[str, Any] = {
        "id": uuid.uuid4(), "task_id": TASK, "assignment_id": uuid.uuid4(), "submission_id": None,
        "batch_id": None, "batch_no": None, "batch_status": None, "status": "ready",
        "filename": f"CTR-05_TSK-06_AG-04_WKR-13_{i:08x}.jpg", "mime_type": "image/jpeg",
        "duration_s": None, "captured_at": at, "created_at": at, "captured_by_name": "Priya Nair",
        "quarantine_reason": None, "review_reason": None, "review_label": None,
        "storage_target_id": TARGET_A, "thumb_key": None,
        "k_at": printed, "k_created": printed, "replaced": False, "badge": None,
    }
    base.update(over)
    return base


class _GallerySession:
    """Answers the parent probe, the page and the count; records every statement."""

    def __init__(self, rows: list[dict[str, Any]], *, total: int = 0, parent: Any = TASK):
        self.rows, self.total, self.parent = rows, total, parent
        self.calls: list[tuple[str, dict[str, Any]]] = []

    async def execute(self, statement: Any, params: dict[str, Any] | None = None) -> _Rows:
        sql, p = str(statement), dict(params or {})
        self.calls.append((sql, p))
        if sql.startswith("SELECT t.id FROM"):
            return _Rows(scalar=self.parent)
        if sql.startswith("SELECT count(*) FROM asset a"):
            return _Rows(scalar=self.total)
        if sql.startswith("SELECT a.id, a.task_id, a.assignment_id, a.submission_id, a.batch_id"):
            return _Rows(rows=self.rows[: p["n"]])
        if sql.startswith("SELECT a.id, a.task_id, a.assignment_id, a.submission_id, a.captured_"):
            return _Rows(rows=self.rows)  # get_asset's full row
        raise AssertionError(f"unexpected statement: {sql[:80]}")

    @property
    def page(self) -> tuple[str, dict[str, Any]]:
        return next(c for c in self.calls if "LIMIT :n" in c[0])

    @property
    def counts(self) -> list[tuple[str, dict[str, Any]]]:
        return [c for c in self.calls if c[0].startswith("SELECT count(*)")]


async def _page(session: _GallerySession, **kw: Any) -> dict[str, Any]:
    args: dict[str, Any] = {"parent": "task", "parent_id": TASK, "limit": 2}
    args.update(kw)
    return await media.list_gallery(session, _claims(), **args)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("parent", "words"),
    [
        ("task", "FROM task t WHERE t.id = :p AND t.deleted_at IS NULL"),
        ("batch", "FROM capture_batch b JOIN task t ON t.id = b.task_id"),
        ("submission", "FROM submission s JOIN task t ON t.id = s.task_id"),
    ],
)
async def test_the_parent_is_probed_through_task(parent: str, words: str):
    # A bare probe on submission answers any worker of the supplier; through
    # task, task's restrictive worker policy applies.
    s = _GallerySession([_row(1)])
    await _page(s, parent=parent, parent_id=uuid.uuid4())
    probe_sql, probe_params = s.calls[0]
    assert words in probe_sql and "t.deleted_at IS NULL" in probe_sql
    assert set(probe_params) == {"p"}
    # and the page is anchored on the task the probe yielded, whatever the scope
    sql, params = s.page
    assert "a.task_id = :t" in sql and params["t"] == TASK


async def test_a_parent_the_caller_cannot_see_is_not_found_not_empty():
    s = _GallerySession([], parent=None)
    with pytest.raises(LookupError):
        await _page(s)
    assert len(s.calls) == 1, "nothing is read once the parent is missing"


async def test_a_batch_or_submission_narrows_the_page_a_task_does_not():
    s = _GallerySession([_row(1)])
    await _page(s, parent="batch", parent_id=uuid.uuid4())
    assert "a.batch_id = :p" in s.page[0]
    s = _GallerySession([_row(1)])
    await _page(s, parent="submission", parent_id=uuid.uuid4())
    assert "a.submission_id = :p" in s.page[0]
    s = _GallerySession([_row(1)])
    await _page(s)
    assert "a.batch_id = :p" not in s.page[0] and "a.submission_id = :p" not in s.page[0]


async def test_a_page_reads_one_more_than_it_returns():
    rows = [_row(1), _row(2), _row(3)]
    s = _GallerySession(rows, total=3)
    out = await _page(s, limit=2)
    sql, params = s.page
    assert sql.rstrip().endswith("LIMIT :n") and params["n"] == 3
    assert [i["id"] for i in out["items"]] == [rows[0]["id"], rows[1]["id"]]
    assert out["has_more"] is True
    # the cursor is the last RETURNED row's three keyset values, as printed
    assert media.decode_cursor(out["next_cursor"]) == (
        rows[1]["k_at"], rows[1]["k_created"], rows[1]["id"]
    )


async def test_the_last_page_has_no_cursor():
    s = _GallerySession([_row(1), _row(2)], total=2)
    out = await _page(s, limit=2)
    assert out["has_more"] is False and out["next_cursor"] is None
    assert len(out["items"]) == 2


async def test_the_limit_is_bounded():
    s = _GallerySession([_row(1)])
    await _page(s, limit=10_000)
    assert s.page[1]["n"] == media.GALLERY_PAGE_MAX + 1
    s = _GallerySession([_row(1)])
    await _page(s, limit=0)
    assert s.page[1]["n"] == 2


async def test_the_order_is_the_keyset_order():
    s = _GallerySession([_row(1)])
    await _page(s)
    sql = s.page[0]
    assert media._GALLERY_ORDER in sql
    assert sql.index(media._GALLERY_ORDER) < sql.index("LIMIT :n")


async def test_the_total_is_counted_on_the_first_page_only():
    s = _GallerySession([_row(1), _row(2), _row(3)], total=41)
    first = await _page(s, limit=2)
    assert first["total"] == 41 and len(s.counts) == 1
    count_sql, count_params = s.counts[0]
    assert media._VISIBLE in count_sql and "a.task_id = :t" in count_sql
    assert count_params["me"] == ME and "n" not in count_params
    s = _GallerySession([_row(3)], total=41)
    later = await _page(s, limit=2, after=first["next_cursor"])
    assert later["total"] is None and s.counts == []


async def test_after_adds_the_row_comparison_and_its_three_values():
    s = _GallerySession([_row(1)])
    await _page(s)
    assert media._GALLERY_AFTER not in s.page[0]
    assert not {"k_at", "k_created", "k_id"} & set(s.page[1])

    asset_id = uuid.uuid4()
    token = media.encode_cursor("infinity", "2026-10-18 10:00:05.000001+00", asset_id)
    s = _GallerySession([_row(6)])
    await _page(s, after=token)
    sql, params = s.page
    assert media._GALLERY_AFTER in sql
    # typed binds, not the cursor's text (cursor_binds): infinity for the untimed
    assert (params["k_at"], params["k_created"], params["k_id"]) == (
        media._INFINITY, dt.datetime.fromisoformat("2026-10-18 10:00:05.000001+00"), asset_id
    )


async def test_a_forged_cursor_is_a_422_and_reads_nothing():
    s = _GallerySession([_row(1)])
    with pytest.raises(media.MediaInvalid):
        await _page(s, after="not-a-cursor")
    assert len(s.calls) == 1, "only the probe ran"


async def test_flagged_adds_the_exists_filter_to_the_page_and_the_count():
    s = _GallerySession([_row(1)], total=1)
    await _page(s)
    assert "EXISTS (SELECT 1 FROM jsonb_array_elements" not in s.page[0]
    assert "EXISTS" not in s.counts[0][0]

    s = _GallerySession([_row(1)], total=1)
    await _page(s, flagged=True)
    for sql, params in (s.page, s.counts[0]):
        assert media._FLAGGED in sql
        assert params["badge_codes"] == list(media.BADGE_ORDER)
    # a filter, not an order: the order and the cursor are untouched
    assert media._GALLERY_ORDER in s.page[0]


async def test_the_visibility_predicate_is_the_lists():
    s = _GallerySession([_row(1)], total=1)
    await _page(s)
    for sql, params in (s.page, s.counts[0]):
        assert "a.deleted_at IS NULL AND (a.supplier_org_id = :me OR a.status = 'ready')" in sql
        assert params["me"] == ME


# ---------------------------------------------------------------------------
# The slim row
# ---------------------------------------------------------------------------
GALLERY_ROW_KEYS = {
    "id", "task_id", "assignment_id", "submission_id", "batch_id", "batch_no", "status", "stage",
    "filename", "mime_type", "duration_s", "captured_at", "captured_by_name", "quarantine_reason",
    "review_reason", "review_label", "badge", "thumb_url",
}


async def test_the_slim_row_is_the_frozen_contract_and_nothing_heavier():
    s = _GallerySession([_row(1, duration_s=12.5, badge={"code": "frozen", "severity": "warn",
                                                           "message": "Still frames", "score": 0.9,
                                                           "detail": {"frames": 30}})])
    out = await _page(s)
    item = out["items"][0]
    assert set(item) == GALLERY_ROW_KEYS
    for heavy in ("check_results", "device_checks", "sha256", "etag", "captured_lat",
                  "captured_lon", "size_bytes", "review_note"):
        assert heavy not in item, heavy
    assert item["duration_s"] == 12.5 and item["stage"] == "draft"
    # the badge is the three fields the tile draws, not the whole check
    assert item["badge"] == {"code": "frozen", "severity": "warn", "message": "Still frames"}
    assert item["thumb_url"] is None
    assert out["expires_in"] > 0


async def test_the_slim_row_selects_no_heavy_columns():
    cols = media._GALLERY_COLUMNS
    for heavy in ("a.sha256", "a.etag", "a.captured_lat", "a.captured_lon", "a.size_bytes",
                  "a.review_note", "a.check_results,"):
        assert heavy not in cols, heavy
    assert "a.metadata->>'thumb_key' AS thumb_key" in cols


def test_replaced_is_looked_up_only_for_a_rejected_row():
    # stage() reads it only when status is 'rejected'; the full row pays the
    # correlated EXISTS on every row, the slim row only where it matters.
    cols = media._GALLERY_COLUMNS
    assert "CASE WHEN a.status = 'rejected' THEN EXISTS (SELECT 1 FROM asset r" in cols
    assert "ELSE false END AS replaced" in cols


def test_the_badge_order_is_the_consoles():
    text = WEB_GALLERY.read_text(encoding="utf-8")
    m = re.search(r"const BADGE: Record<string, [^=]*=\s*\{(.*?)\n\};", text, re.S)
    assert m, "the console's BADGE map moved; the server picks the badge in its order"
    web_order = tuple(re.findall(r"^\s*(\w+):\s*\{\s*text:", m.group(1), re.M))
    assert web_order == media.BADGE_ORDER
    # picked in SQL by that order, one per row
    assert "ORDER BY array_position(CAST(:badge_codes AS text[]), c->>'code') LIMIT 1" in (
        media._GALLERY_COLUMNS
    )


# ---------------------------------------------------------------------------
# Posters are signed inside the page
# ---------------------------------------------------------------------------
@pytest.fixture
def signing(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Fake storage: every destination resolves, every signature succeeds, and
    both are recorded with the peak number of signatures in flight."""
    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    log: dict[str, Any] = {"resolved": [], "signed": [], "in_flight": 0, "peak": 0, "fail": set(),
                           "gone": set()}

    async def resolve_by_id(_s: Any, target_id: Any) -> Any:
        log["resolved"].append(target_id)
        if target_id in log["gone"]:
            raise storage_svc.StorageTargetError("gone")
        return ("target", target_id)

    async def presign_get(_t: Any, key: str, _name: str, inline: bool = False) -> str:
        log["in_flight"] += 1
        log["peak"] = max(log["peak"], log["in_flight"])
        try:
            for _ in range(3):
                await asyncio.sleep(0)
            if key in log["fail"]:
                raise storage.StorageError("signing refused")
            log["signed"].append((key, inline))
            return f"https://store.example/{key}"
        finally:
            log["in_flight"] -= 1

    monkeypatch.setattr(storage_svc, "resolve_by_id", resolve_by_id)
    monkeypatch.setattr(storage, "presign_get", presign_get)
    return log


async def test_each_destination_is_resolved_once_and_only_posters_signed(signing: dict[str, Any]):
    rows = [
        _row(1, thumb_key="a.jpg.thumb.jpg"),
        _row(2),                                   # no poster: never signed
        _row(3, thumb_key="c.jpg.thumb.jpg", storage_target_id=TARGET_B),
        _row(4, thumb_key="d.jpg.thumb.jpg"),
        _row(5, storage_target_id=TARGET_B),       # no poster either
    ]
    got = await media._sign_thumbs(object(), rows)  # type: ignore[arg-type]
    assert sorted(map(str, signing["resolved"])) == sorted(map(str, [TARGET_A, TARGET_B]))
    assert sorted(k for k, _ in signing["signed"]) == [
        "a.jpg.thumb.jpg", "c.jpg.thumb.jpg", "d.jpg.thumb.jpg"
    ]
    assert all(inline for _, inline in signing["signed"]), "a tile is shown, not downloaded"
    assert got == {
        rows[0]["id"]: "https://store.example/a.jpg.thumb.jpg",
        rows[2]["id"]: "https://store.example/c.jpg.thumb.jpg",
        rows[3]["id"]: "https://store.example/d.jpg.thumb.jpg",
    }


async def test_no_posters_means_no_storage_at_all(signing: dict[str, Any]):
    assert await media._sign_thumbs(object(), [_row(1), _row(2)]) == {}  # type: ignore[arg-type]
    assert signing["resolved"] == [] and signing["signed"] == []


async def test_at_most_eight_signatures_run_at_once(signing: dict[str, Any]):
    rows = [_row(i, thumb_key=f"{i}.jpg.thumb.jpg") for i in range(30)]
    got = await media._sign_thumbs(object(), rows)  # type: ignore[arg-type]
    assert len(got) == 30 and all(got.values())
    assert 1 < signing["peak"] <= 8, signing["peak"]


async def test_one_failed_signature_costs_one_tile(signing: dict[str, Any]):
    signing["fail"].add("b.jpg.thumb.jpg")
    rows = [_row(1, thumb_key="a.jpg.thumb.jpg"), _row(2, thumb_key="b.jpg.thumb.jpg"),
            _row(3, thumb_key="c.jpg.thumb.jpg")]
    got = await media._sign_thumbs(object(), rows)  # type: ignore[arg-type]
    assert got[rows[1]["id"]] is None
    assert got[rows[0]["id"]] and got[rows[2]["id"]]


async def test_a_destination_that_is_gone_costs_its_tiles_only(signing: dict[str, Any]):
    signing["gone"].add(TARGET_B)
    rows = [_row(1, thumb_key="a.jpg.thumb.jpg"),
            _row(2, thumb_key="b.jpg.thumb.jpg", storage_target_id=TARGET_B)]
    got = await media._sign_thumbs(object(), rows)  # type: ignore[arg-type]
    assert got == {rows[0]["id"]: "https://store.example/a.jpg.thumb.jpg", rows[1]["id"]: None}
    assert len(signing["resolved"]) == 2


async def test_the_page_carries_its_posters(signing: dict[str, Any]):
    rows = [_row(1, thumb_key="a.jpg.thumb.jpg"), _row(2)]
    s = _GallerySession(rows, total=2)
    out = await _page(s, limit=5)
    assert out["items"][0]["thumb_url"] == "https://store.example/a.jpg.thumb.jpg"
    assert out["items"][1]["thumb_url"] is None


# ---------------------------------------------------------------------------
# The detail row and the routes
# ---------------------------------------------------------------------------
def _full_row(**over: Any) -> dict[str, Any]:
    base: dict[str, Any] = dict.fromkeys(
        ("id", "task_id", "assignment_id", "submission_id", "captured_by_user_id",
         "captured_by_name", "filename", "mime_type", "size_bytes", "duration_s", "sha256", "etag",
         "quarantine_reason", "captured_at", "captured_lat", "captured_lon", "uploaded_at",
         "created_at", "check_results", "review_reason", "review_note", "reviewed_at",
         "review_label", "batch_id", "batch_no", "batch_status", "replaces_asset_id")
    )
    base.update({"id": uuid.uuid4(), "status": "rejected", "replaced": False,
                 "review_reason": "exposure", "review_note": "glare"})
    base.update(over)
    return base


async def test_the_detail_row_carries_the_lists_visibility_rule():
    s = _GallerySession([_full_row()])
    out = await media.get_asset(s, _claims(), uuid.uuid4())  # type: ignore[arg-type]
    sql, params = s.calls[0]
    assert sql.endswith("WHERE a.id = :id AND " + media._VISIBLE)
    assert params["me"] == ME
    assert out["review_reason"] == "exposure" and out["stage"] == "rework"


async def test_a_capture_no_list_would_show_is_not_found_in_the_detail_either():
    s = _GallerySession([])
    with pytest.raises(LookupError):
        await media.get_asset(s, _claims(), uuid.uuid4())  # type: ignore[arg-type]


ROUTES = [r for r in media_api.router.routes if isinstance(r, APIRoute)]


def _full_matches(method: str, path: str) -> list[str]:
    scope = {"type": "http", "method": method, "path": path, "root_path": "", "headers": []}
    return [r.endpoint.__name__ for r in ROUTES if r.matches(scope)[0] == Match.FULL]


def test_the_gallery_routes_exist():
    paths = {(r.path, m) for r in ROUTES for m in r.methods}
    for want in (("/tasks/{task_id}/assets", "GET"), ("/batches/{batch_id}/assets", "GET"),
                 ("/submissions/{submission_id}/assets", "GET"), ("/assets/{asset_id}", "GET"),
                 ("/assets/{asset_id}/url", "GET"), ("/tasks/{task_id}/check-summary", "GET")):
        assert want in paths, want


def test_the_detail_route_does_not_shadow_the_url_route():
    asset = uuid.uuid4()
    assert _full_matches("GET", f"/assets/{asset}/url") == ["asset_url"]
    assert _full_matches("GET", f"/assets/{asset}") == ["asset_detail"]
    # and DELETE on the same path is still the worker's discard
    assert _full_matches("DELETE", f"/assets/{asset}") == ["discard"]


def test_the_task_list_takes_its_paging_parameters_as_queries():
    route = next(r for r in ROUTES if r.path == "/tasks/{task_id}/assets")
    names = {p.name for p in route.dependant.query_params}
    assert {"limit", "after", "flagged"} <= names


def test_the_detail_route_is_guarded_by_the_principal_alone():
    # get_principal, not the asset.upload guard DELETE /assets/{id} has: the
    # partner and the client open captures too.
    route = next(r for r in ROUTES if r.path == "/assets/{asset_id}" and "GET" in r.methods)
    guards = [getattr(d.call, "__qualname__", "") for d in route.dependant.dependencies]
    assert any("get_principal" in g for g in guards), guards
    assert not any("require_capability" in g for g in guards), guards
