"""The catalogue service's pure parts, and what the public surface may carry.

The database half (who may publish, what a buyer may name, which files RLS
shows) is db/390 and tests/test_catalogue_schema_unit.py; this is the Python
around it. No database is opened: the public reads are fed a fake session.
"""

from __future__ import annotations

import ast
import contextlib
import re
import uuid
from pathlib import Path
from typing import Any

import pytest

from sourcehub.modules.catalogue import service as catalogue
from sourcehub.platform.ratelimit import RateLimiter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "backend" / "src" / "sourcehub"


# ---------------------------------------------------------------------------
# Small rules
# ---------------------------------------------------------------------------
def test_a_slug_is_readable_and_matches_the_column_check():
    s = catalogue.slugify("Street Scenes — Mumbai, 2026!")
    assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", s), s
    assert s.startswith("street-scenes-mumbai-2026-")
    assert catalogue.slugify("!!!").startswith("dataset-")
    assert catalogue.slugify("x") != catalogue.slugify("x")


def test_a_filename_cannot_climb_out_of_its_folder():
    assert catalogue._safe_filename("../../etc/passwd") == "passwd"
    assert catalogue._safe_filename("C:\\Users\\a\\photo 1.jpg") == "photo 1.jpg"
    assert catalogue._safe_filename("") == "file"
    assert "/" not in catalogue._safe_filename("a/b/c.mp4")


class _Orig(Exception):
    pass


class _DBErr(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(msg)
        self.orig = _Orig(msg)


def test_trigger_refusals_read_as_sentences():
    e = _DBErr(
        "<class 'asyncpg.exceptions.CheckViolationError'>: dataset deal "
        "0c2f5b1e-1111-2222-3333-444455556666: only the seller quotes\nCONTEXT: ..."
    )
    assert catalogue._reason(e) == "only the seller quotes"  # type: ignore[arg-type]
    e = _DBErr('duplicate key value violates unique constraint "datahub_dataset_deal_open_key"')
    assert "already have an open quote request" in catalogue._reason(e)  # type: ignore[arg-type]


def test_the_rate_limiter_counts_a_sliding_window():
    rl = RateLimiter(limit=2, window_seconds=10)
    assert rl.allow("a", now=0) and rl.allow("a", now=1)
    assert not rl.allow("a", now=2)
    assert rl.allow("b", now=2)
    assert rl.allow("a", now=10.5)


def test_the_rate_limiter_does_not_grow_without_bound():
    rl = RateLimiter(limit=1, window_seconds=100, max_keys=10)
    for i in range(50):
        rl.allow(str(i), now=float(i))
    assert len(rl._hits) <= 11


# ---------------------------------------------------------------------------
# The public surface carries nothing internal
# ---------------------------------------------------------------------------
class _Result:
    def __init__(self, rows: list[dict[str, Any]]) -> None:
        self._rows = rows

    def mappings(self) -> _Result:
        return self

    def all(self) -> list[dict[str, Any]]:
        return self._rows

    def one_or_none(self) -> dict[str, Any] | None:
        return self._rows[0] if self._rows else None


class _Session:
    def __init__(self, by_fn: dict[str, list[dict[str, Any]]]) -> None:
        self.by_fn = by_fn

    async def execute(self, stmt: Any, params: dict[str, Any] | None = None) -> _Result:
        sql = str(stmt)
        for fn, rows in self.by_fn.items():
            if fn in sql:
                return _Result(rows)
        raise AssertionError(f"unexpected SQL: {sql}")


def _fake_anonymous(by_fn: dict[str, list[dict[str, Any]]]):
    @contextlib.asynccontextmanager
    async def _cm():
        yield _Session(by_fn)

    return _cm


_DATASET = {
    "id": uuid.uuid4(), "slug": "street-abc123", "title": "Street", "summary": "s",
    "description": "d", "category": "image", "use_cases": [], "regions": ["IN"],
    "languages": [], "permitted_uses": ["model_training"], "licence_terms": "t",
    "indicative_price_text": "On request", "seller_name": "Helix", "source": "upload",
    "file_count": 2400, "total_bytes": 10, "published_at": None,
}
_SAMPLE = {"id": uuid.uuid4(), "storage_key": "catalogue/x/samples/secret-key.jpg",
           "filename": "a.jpg", "mime_type": "image/jpeg", "size_bytes": 5}


@pytest.mark.asyncio
async def test_a_public_dataset_signs_samples_and_never_returns_a_storage_key(monkeypatch):
    monkeypatch.setattr(catalogue, "anonymous_session", _fake_anonymous({
        "datahub_public_dataset": [_DATASET], "datahub_public_samples": [_SAMPLE],
    }))
    signed: list[str] = []

    async def presign_get(target, key, filename, inline=False):
        signed.append(key)
        return f"https://signed.example/{filename}"

    monkeypatch.setattr(catalogue.storage, "presign_get", presign_get)
    monkeypatch.setattr(catalogue.storage, "platform_target", lambda: object())

    out = await catalogue.public_dataset("street-abc123")
    assert signed == [_SAMPLE["storage_key"]]
    flat = repr(out)
    assert "secret-key" not in flat and "storage_key" not in flat
    assert "id" not in out
    assert out["file_count"] == 2400
    assert out["samples"][0]["url"] == "https://signed.example/a.jpg"


@pytest.mark.asyncio
async def test_an_unknown_public_slug_is_not_found(monkeypatch):
    monkeypatch.setattr(catalogue, "anonymous_session", _fake_anonymous({
        "datahub_public_dataset": [], "datahub_public_samples": [],
    }))
    with pytest.raises(LookupError):
        await catalogue.public_dataset("nope")


def test_the_public_router_opens_no_org_session():
    tree = ast.parse((SRC / "api" / "v1" / "catalogue_public.py").read_text(encoding="utf-8"))
    names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
    names |= {n.attr for n in ast.walk(tree) if isinstance(n, ast.Attribute)}
    assert "get_session" not in names and "TxRoute" not in names
    assert "get_principal" not in names


def test_every_signed_in_catalogue_route_names_a_guard_or_the_principal():
    text = (SRC / "api" / "v1" / "catalogue.py").read_text(encoding="utf-8")
    tree = ast.parse(text)
    for fn in (n for n in tree.body if isinstance(n, ast.AsyncFunctionDef)):
        src = ast.get_source_segment(text, fn) or ""
        assert "Depends(get_session)" in src, fn.name
        assert re.search(r"require_(any_)?capability\(|Depends\(get_principal\)", src), fn.name


def test_delivery_lists_nothing_by_itself():
    # Listing a contract's captures is the partner's choice, after approval.
    text = (SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8")
    assert "relist" not in text and "modules.catalogue" not in text


def test_relisting_waits_for_the_clients_approval():
    text = (SRC / "modules" / "catalogue" / "service.py").read_text(encoding="utf-8")
    body = text[text.index("async def relist_contract("):]
    assert 'req["status"] != "completed"' in body
    assert 'not req["partner_reuse_allowed"]' in body
    # both checks come before anything is written
    assert body.index('"completed"') < body.index("INSERT INTO datahub_dataset")


def test_relisting_does_not_ask_the_worker():
    # The crowd's part ends when the captures are handed on (db/400).
    service = (SRC / "modules" / "catalogue" / "service.py").read_text(encoding="utf-8")
    body = service[service.index("async def relist_contract("):]
    assert "resale_consented" not in body and "left_out" not in body
    assert "user_consent" not in service
    api = (SRC / "api" / "v1" / "catalogue.py").read_text(encoding="utf-8")
    assert "/me/consents" not in api


# ---------------------------------------------------------------------------
# The files change hands outside the platform (db/420)
# ---------------------------------------------------------------------------
_SERVICE = (SRC / "modules" / "catalogue" / "service.py").read_text(encoding="utf-8")
_API = (SRC / "api" / "v1" / "catalogue.py").read_text(encoding="utf-8")


def _body(name: str) -> str:
    start = _SERVICE.index(f"async def {name}(")
    nxt = _SERVICE.find("\nasync def ", start + 1)
    return _SERVICE[start:nxt if nxt > 0 else None]


def test_relisting_counts_the_captures_and_copies_none():
    body = _body("relist_contract")
    assert "count(*)::integer AS n" in body and "datahub_relist_candidates" in body
    assert "datahub_dataset_sample" not in body


def test_nothing_is_downloaded_through_the_platform():
    # no licence, no manifest, no file of a dataset but its samples
    # the seller's licence terms stay on the listing; the licence record goes
    for gone in ("datahub_dataset_licence", "/licences", "licence_id", "manifest", "/items/",
                 "datahub_dataset_item", "datahub_dataset_version"):
        assert gone not in _API, gone
        assert gone not in _SERVICE, gone


def test_the_seller_marks_paid_then_delivered():
    assert '("accepted",), "paid"' in _body("mark_paid")
    assert '("paid",), "delivered"' in _body("mark_delivered")
    for fn in ("mark_paid", "mark_delivered"):
        assert 'k["seller_org_id"] != claims.org_id' in _body(fn)


def test_operations_read_the_chat_and_do_not_post():
    body = _body("post_message")
    assert 'side == "operations"' in body
    assert body.index('side == "operations"') < body.index("_append_message")


def test_a_message_is_never_blank_or_too_long():
    assert catalogue._clean_message("  hi  ") == "hi"
    with pytest.raises(catalogue.CatalogueError):
        catalogue._clean_message("   ")
    with pytest.raises(catalogue.CatalogueError):
        catalogue._clean_message("x" * (catalogue.MAX_MESSAGE + 1))


def test_a_quantity_reads_as_files_or_the_whole_dataset():
    assert catalogue._quantity(500, 3000) == "500 files"
    assert catalogue._quantity(None, 3000) == "the whole dataset (3,000 files)"
    assert catalogue._quantity(None, 0) == "the whole dataset"


def test_a_quantity_above_the_listing_is_refused():
    assert "requested_quantity > m[\"file_count\"]" in _body("request_quote")
    assert "quantity > k[\"file_count\"]" in _body("quote")
