"""A client manages its delivery destinations: db/590, 0064.

A destination could be added from the RFP builder and never changed. A
rotated or revoked key read Not reachable with only Test again to offer, a
failed test was not even recorded, and the only way out was a duplicate. What
this file guards, in the order it would hurt:

  * a destination deleted while a contract delivers into it, or a live RFP
    would be awarded into it: the service refuses with words, the database
    refuses whatever the caller's row policy shows, and a request saved while
    its destination is being deleted waits for the delete and is refused;
  * a deleted destination keeping its key, or coming back;
  * a failed test vanishing with the rolled-back request, so a destination
    that had just failed still read Reachable and could still be published to;
  * a replacement Azure key moving the destination to another account;
  * a name already in use coming back as a 500;
  * the SQL file and the migration drifting apart.

conftest.py's database fixtures raise NotImplementedError, so, as in
test_request_cancel_unit.py, the pure parts are tested directly, the service
against a session that answers by statement, and the wiring off the AST.

    pytest tests/test_storage_target_delete_unit.py
"""

from __future__ import annotations

import ast
import asyncio
import re
import uuid
from pathlib import Path
from typing import Any

import pytest
from fastapi.routing import APIRoute
from sqlalchemy.exc import IntegrityError

from sourcehub.api.v1 import storage as storage_api
from sourcehub.modules.storage import service
from sourcehub.platform.storage import StorageError

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "backend" / "src" / "sourcehub"
SQL_TEXT = (ROOT / "db" / "590_storage_target_delete.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0064_storage_target_delete.py"
).read_text(encoding="utf-8")
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SERVICE_TEXT = (SRC / "modules" / "storage" / "service.py").read_text(encoding="utf-8")
SERVICE_TREE = ast.parse(SERVICE_TEXT)
MARKETPLACE_TREE = ast.parse(
    (SRC / "modules" / "marketplace" / "service.py").read_text(encoding="utf-8")
)

TARGET = uuid.UUID("00000000-0000-0000-0000-0000000000a1")
ORG = uuid.UUID("00000000-0000-0000-0000-0000000000c1")
USER = uuid.UUID("00000000-0000-0000-0000-0000000000e1")


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


CODE = _strip_comments(SQL_TEXT)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal in the migration"
    return m.group(1)


def _function(tree: ast.AST, name: str) -> ast.FunctionDef | ast.AsyncFunctionDef:
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found")


def _calls(fn: ast.AST) -> list[str]:
    out: list[str] = []
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            f = node.func
            out.append(f.attr if isinstance(f, ast.Attribute) else getattr(f, "id", ""))
    return out


def _source(name: str) -> str:
    fn = _function(SERVICE_TREE, name)
    return ast.get_source_segment(SERVICE_TEXT, fn) or ""


def _sql_function(name: str) -> str:
    start = CODE.index(f"CREATE OR REPLACE FUNCTION {name}()")
    return CODE[start : CODE.index("$fn$;", start)]


# ---------------------------------------------------------------------------
# A session that answers by statement
# ---------------------------------------------------------------------------


class _Result:
    def __init__(self, rows: list[dict[str, Any]] | None = None):
        self._rows = rows or []

    def mappings(self) -> _Result:
        return self

    def all(self) -> list[dict[str, Any]]:
        return self._rows

    def one(self) -> dict[str, Any]:
        assert len(self._rows) == 1, self._rows
        return self._rows[0]

    def one_or_none(self) -> dict[str, Any] | None:
        return self._rows[0] if self._rows else None

    def first(self) -> dict[str, Any] | None:
        return self._rows[0] if self._rows else None

    def scalar_one_or_none(self) -> Any:
        return next(iter(self._rows[0].values())) if self._rows else None


class _Session:
    """Each statement is answered by the first fragment it contains."""

    def __init__(
        self,
        answers: list[tuple[str, list[dict[str, Any]]]],
        refuse: tuple[str, Exception] | None = None,
    ):
        self.answers = answers
        self.refuse = refuse
        self.calls: list[tuple[str, dict[str, Any] | None]] = []

    async def execute(self, stmt: Any, params: dict[str, Any] | None = None) -> _Result:
        sql = " ".join(str(stmt).split())
        self.calls.append((sql, params))
        if self.refuse and self.refuse[0] in sql:
            raise self.refuse[1]
        for fragment, rows in self.answers:
            if fragment in sql:
                return _Result(rows)
        return _Result()

    def sent(self, fragment: str) -> list[tuple[str, dict[str, Any] | None]]:
        return [(s, p) for s, p in self.calls if fragment in s]


class _Claims:
    org_id = ORG
    user_id = USER


@pytest.fixture
def audited(monkeypatch: pytest.MonkeyPatch) -> list[tuple[str, str]]:
    events: list[tuple[str, str]] = []

    async def log(_session: Any, event: str, summary: str, **_kw: Any) -> None:
        events.append((event, summary))

    monkeypatch.setattr(service.audit, "log", log)
    return events


PROBED = "a3f1c0ffee0000000000000000000000"  # md5(secret::text), as verify_target reads it
KEY = {"access_key_id": "AKIA", "secret_access_key": "TOPSECRET"}


def _refusal(constraint: str) -> IntegrityError:
    """What asyncpg raises through SQLAlchemy: the statement and every bound
    parameter, the key among them, are in str(e)."""
    return IntegrityError(
        "INSERT INTO storage_target (...) VALUES (...)",
        {"secret": '{"secret_access_key": "TOPSECRET"}'},
        Exception(
            f'new row for relation "storage_target" violates check constraint "{constraint}"'
        ),
    )


ROW = {
    "id": TARGET, "owner_org_id": ORG, "label": "Field capture", "provider": "s3",
    "endpoint": None, "region": "ap-south-1", "bucket": "acme-field", "key_prefix": "",
    "verified_at": None, "verify_error": "AccessDenied", "created_at": None, "updated_at": None,
}


# ---------------------------------------------------------------------------
# The rule
# ---------------------------------------------------------------------------


def test_a_destination_nothing_uses_may_be_deleted():
    assert service.delete_problem("Field capture", [], []) is None


def test_a_contract_keeps_it_and_says_so():
    said = service.delete_problem("Field capture", ["RFP-1012"], ["CTR-0003"])
    assert said is not None
    assert "Field capture holds the captures for CTR-0003" in said
    assert "replace the key" in said


def test_a_live_rfp_keeps_it_and_says_what_to_do():
    said = service.delete_problem("Field capture", ["RFP-1011"], [])
    assert said is not None
    assert "destination of RFP-1011" in said
    assert "cancel the RFP" in said


@pytest.mark.parametrize(
    ("codes", "reads"),
    [
        (["RFP-1"], "RFP-1"),
        (["RFP-1", "RFP-2"], "RFP-1 and RFP-2"),
        (["RFP-1", "RFP-2", "RFP-3"], "RFP-1, RFP-2 and RFP-3"),
        (["RFP-1", "RFP-2", "RFP-3", "RFP-4", "RFP-5"], "RFP-1, RFP-2, RFP-3 and 2 more"),
    ],
)
def test_references_read_as_a_sentence(codes, reads):
    assert service._refs(codes) == reads


def test_the_service_and_the_database_count_the_same_requests():
    live = "r.deleted_at IS NULL AND r.status <> 'cancelled'"
    assert live in " ".join(_source("_usage").split())
    assert live in " ".join(_sql_function("storage_target_delete_guard").split())


# ---------------------------------------------------------------------------
# Deleting
# ---------------------------------------------------------------------------


def _delete_session(requests: list[dict[str, Any]], contracts: list[dict[str, Any]]) -> _Session:
    usage = [{"target_id": TARGET, "kind": "requests", "id": uuid.uuid4(), "title": "x",
              "status": "draft", "reference_code": r} for r in requests]
    usage += [{"target_id": TARGET, "kind": "contracts", "id": uuid.uuid4(), "title": "x",
               "status": "active", "reference_code": c} for c in contracts]
    return _Session([
        ("FOR UPDATE", [{"id": TARGET, "label": "Field capture", "provider": "s3",
                         "bucket": "acme-field"}]),
        ("UNION ALL", usage),
    ])


def test_an_unused_destination_is_deleted_and_its_key_wiped(audited):
    s = _delete_session([], [])
    asyncio.run(service.delete_target(s, _Claims(), TARGET))  # type: ignore[arg-type]
    [(sql, params)] = s.sent("UPDATE storage_target")
    for part in ("deleted_at = now()", "secret = '{}'::jsonb", "verified_at = NULL"):
        assert part in sql
    assert params == {"id": TARGET, "who": USER}
    assert [e for e, _ in audited] == ["storage.target.deleted"]
    assert "key was wiped" in audited[0][1]


@pytest.mark.parametrize(("requests", "contracts"), [(["RFP-1011"], []), ([], ["CTR-0003"])])
def test_a_used_destination_is_refused_and_left_alone(audited, requests, contracts):
    s = _delete_session(requests, contracts)
    with pytest.raises(service.StorageTargetInUseError, match="cannot be deleted"):
        asyncio.run(service.delete_target(s, _Claims(), TARGET))  # type: ignore[arg-type]
    assert not s.sent("UPDATE storage_target")
    assert audited == []


def test_a_refusal_by_the_database_guard_is_a_409_not_a_500(audited):
    # a use the caller's row policy hides: the guard counts every request
    s = _delete_session([], [])
    s.refuse = ("SET deleted_at = now()", _refusal("storage_target_delete_guard"))
    with pytest.raises(service.StorageTargetInUseError, match="Field capture is in use"):
        asyncio.run(service.delete_target(s, _Claims(), TARGET))  # type: ignore[arg-type]
    assert audited == []


def test_a_destination_already_gone_is_a_404():
    s = _Session([])
    with pytest.raises(LookupError):
        asyncio.run(service.delete_target(s, _Claims(), TARGET))  # type: ignore[arg-type]


def test_the_row_is_locked_before_anything_reads_what_uses_it():
    calls = _calls(_function(SERVICE_TREE, "delete_target"))
    src = _source("delete_target")
    assert "FOR UPDATE" in src
    assert src.index("FOR UPDATE") < src.index("_usage(")
    assert "delete_problem" in calls


def test_a_request_holds_its_destination_with_a_share_lock():
    src = " ".join(_source("hold_for_request").split())
    assert "deleted_at IS NULL FOR SHARE" in src


def test_a_hold_on_a_destination_gone_or_not_the_callers_is_refused():
    # the row policy hides another client's, so both read back as nothing
    with pytest.raises(service.StorageTargetError, match="no longer exists"):
        asyncio.run(service.hold_for_request(_Session([]), TARGET))  # type: ignore[arg-type]


def test_an_rfp_edit_holds_only_a_destination_it_newly_names():
    # an unchanged destination is not held again: one deleted before db/590
    # would otherwise make the draft unsaveable
    fn = _function(MARKETPLACE_TREE, "update_request")
    guards = [
        n for n in ast.walk(fn)
        if isinstance(n, ast.If) and "_hold_destination" in _calls(n)
    ]
    assert len(guards) == 1
    test = ast.unparse(guards[0].test)
    assert "!= r.storage_target_id" in test


@pytest.mark.parametrize("name", ["create_request", "update_request"])
def test_saving_an_rfp_holds_the_destination_it_names(name):
    assert "_hold_destination" in _calls(_function(MARKETPLACE_TREE, name))


def test_the_hold_is_the_storage_services():
    assert "hold_for_request" in _calls(_function(MARKETPLACE_TREE, "_hold_destination"))


def test_listing_says_what_uses_each_and_whether_it_may_go():
    s = _Session([
        ("ORDER BY lower(label)", [dict(ROW)]),
        ("UNION ALL", [{"target_id": TARGET, "kind": "contracts", "id": uuid.uuid4(),
                        "reference_code": "CTR-0003", "title": "Storefronts", "status": "active"}]),
    ])
    [row] = asyncio.run(service.list_targets(s, _Claims()))  # type: ignore[arg-type]
    assert row["can_delete"] is False
    assert [u["reference_code"] for u in row["used_by"]["contracts"]] == ["CTR-0003"]
    assert row["used_by"]["requests"] == []
    [(sql, _)] = s.sent("ORDER BY lower(label)")
    assert "secret" not in sql  # the key is never read for a listing


def test_an_awarded_rfp_is_listed_once_as_its_contract():
    s = _Session([])
    asyncio.run(service._usage(s, [TARGET]))  # type: ignore[arg-type]
    [(sql, _)] = s.sent("UNION ALL")
    # only when the contract names the same destination: otherwise the request
    # still counts, as it does for storage_target_delete_guard
    assert (
        "NOT EXISTS (SELECT 1 FROM contract c WHERE c.request_id = r.id "
        "AND c.storage_target_id = r.storage_target_id)" in sql
    )


# ---------------------------------------------------------------------------
# Testing again
# ---------------------------------------------------------------------------


def test_a_failed_test_is_kept_and_returned_not_raised(monkeypatch):
    async def refuse(_target: Any) -> None:
        raise StorageError("AccessDenied: the key was revoked")

    monkeypatch.setattr(service.storage, "verify", refuse)
    probe = dict(ROW, secret=KEY, probed=PROBED)
    s = _Session([
        ("SELECT id, provider, endpoint", [probe]),
        ("FROM storage_target WHERE id = :id AND deleted_at IS NULL", [dict(ROW)]),
    ])
    out = asyncio.run(service.verify_target(s, _Claims(), TARGET))  # type: ignore[arg-type]
    [(_, params)] = s.sent("SET verified_at = NULL, verify_error = :why")
    assert params == {"id": TARGET, "probed": PROBED, "why": "AccessDenied: the key was revoked"}
    assert out["verify_error"] == "AccessDenied"
    assert "secret" not in out


def test_a_passing_test_clears_the_error(monkeypatch):
    async def accept(_target: Any) -> None:
        return None

    monkeypatch.setattr(service.storage, "verify", accept)
    probe = dict(ROW, secret=KEY, probed=PROBED)
    s = _Session([
        ("SELECT id, provider, endpoint", [probe]),
        ("FROM storage_target WHERE id = :id AND deleted_at IS NULL", [dict(ROW)]),
    ])
    asyncio.run(service.verify_target(s, _Claims(), TARGET))  # type: ignore[arg-type]
    assert s.sent("SET verified_at = now(), verify_error = NULL")


@pytest.mark.parametrize("passes", [True, False])
def test_a_test_finishing_after_a_delete_leaves_the_deleted_row_alone(monkeypatch, passes):
    async def probe(_target: Any) -> None:
        if not passes:
            raise StorageError("NoSuchBucket")

    monkeypatch.setattr(service.storage, "verify", probe)
    s = _Session([("SELECT id, provider, endpoint", [dict(ROW, secret=KEY, probed=PROBED)])])
    # deleted while the probe ran: the row no longer reads back
    with pytest.raises(LookupError):
        asyncio.run(service.verify_target(s, _Claims(), TARGET))  # type: ignore[arg-type]
    [(sql, _)] = s.sent("UPDATE storage_target")
    assert "WHERE id = :id AND deleted_at IS NULL" in sql


@pytest.mark.parametrize("passes", [True, False])
def test_a_result_is_recorded_only_against_the_key_that_was_tested(monkeypatch, passes):
    # a key replaced while a slow test of the old one ran keeps its own result
    async def probe(_target: Any) -> None:
        if not passes:
            raise StorageError("InvalidAccessKeyId")

    monkeypatch.setattr(service.storage, "verify", probe)
    s = _Session([
        ("SELECT id, provider, endpoint", [dict(ROW, secret=KEY, probed=PROBED)]),
        ("FROM storage_target WHERE id = :id AND deleted_at IS NULL", [dict(ROW)]),
    ])
    asyncio.run(service.verify_target(s, _Claims(), TARGET))  # type: ignore[arg-type]
    [(read, _)] = s.sent("SELECT id, provider, endpoint")
    assert "md5(secret::text) AS probed" in read
    [(sql, params)] = s.sent("UPDATE storage_target")
    assert sql.endswith("AND md5(secret::text) = :probed")
    assert params is not None and params["probed"] == PROBED
    assert "TOPSECRET" not in repr(params)  # matched by its hash, never sent back


def test_nothing_turns_a_failed_test_back_into_an_error():
    [handler] = [
        h for h in ast.walk(_function(SERVICE_TREE, "verify_target"))
        if isinstance(h, ast.ExceptHandler) and getattr(h.type, "id", "") == "StorageError"
    ]
    assert not [n for n in ast.walk(handler) if isinstance(n, ast.Raise)]


# ---------------------------------------------------------------------------
# Replacing a key, renaming
# ---------------------------------------------------------------------------


def _azure(stored: str | None) -> _Session:
    return _Session([("secret->>'account_name'", [{"account_name": stored}])])


def test_an_azure_key_is_kept_on_its_account():
    out = asyncio.run(
        service._same_azure_account(_azure("acmefield"), TARGET, {"account_key": "k"})
    )
    assert out == {"account_key": "k", "account_name": "acmefield"}


def test_the_same_account_in_another_case_is_the_same_account():
    out = asyncio.run(service._same_azure_account(
        _azure("acmefield"), TARGET, {"account_name": "AcmeField", "account_key": "k"}
    ))
    assert out["account_key"] == "k"


def test_a_key_for_another_azure_account_is_refused_without_echoing_it():
    with pytest.raises(service.StorageTargetError, match="same storage account") as e:
        asyncio.run(service._same_azure_account(
            _azure("acmefield"), TARGET, {"account_name": "rivalco", "account_key": "TOPSECRET"}
        ))
    assert "TOPSECRET" not in str(e.value)


def test_replacing_an_azure_key_goes_through_the_account_check():
    assert "_same_azure_account" in _calls(_function(SERVICE_TREE, "update_target"))


@pytest.mark.parametrize("folder", ["my folder", "captures/été", "a\\b"])
def test_a_folder_the_database_would_refuse_is_refused_before_the_probe(monkeypatch, folder):
    async def never(_target: Any) -> None:
        raise AssertionError("probed a destination that could not be saved")

    monkeypatch.setattr(service.storage, "verify", never)
    with pytest.raises(service.StorageTargetError, match="A folder may use only"):
        asyncio.run(service.create_target(  # type: ignore[arg-type]
            _Session([]), _Claims(), label="Field", provider="s3", bucket="b",
            secret=KEY, key_prefix=folder,
        ))


@pytest.mark.parametrize("folder", ["captures", "/captures/2026/", "a.b-c_d/e"])
def test_the_folders_the_database_takes_still_pass(folder):
    prefix = service._clean_prefix(folder)
    assert service._PREFIX_SHAPE.fullmatch(prefix)


def test_an_unexpected_refusal_of_a_new_destination_never_carries_its_key(monkeypatch):
    async def accept(_target: Any) -> None:
        return None

    monkeypatch.setattr(service.storage, "verify", accept)
    refusal = _refusal("storage_target_provider_supported")
    s = _Session([], refuse=("INSERT INTO storage_target", refusal))
    with pytest.raises(RuntimeError) as e:
        asyncio.run(service.create_target(  # type: ignore[arg-type]
            s, _Claims(), label="Field", provider="s3", bucket="b", secret=KEY,
        ))
    assert str(e.value) == "storage_target write refused by storage_target_provider_supported"
    assert e.value.__cause__ is None and e.value.__suppress_context__
    assert "TOPSECRET" not in str(e.value)


def test_an_unexpected_refusal_of_a_new_key_never_carries_it(monkeypatch, audited):
    async def accept(_target: Any) -> None:
        return None

    monkeypatch.setattr(service.storage, "verify", accept)
    s = _Session(
        [("SELECT id, label, provider", [dict(ROW)])],
        refuse=("RETURNING", _refusal("storage_target_prefix_shape")),
    )
    with pytest.raises(RuntimeError) as e:
        asyncio.run(service.update_target(  # type: ignore[arg-type]
            s, _Claims(), TARGET, secret=KEY,
        ))
    assert "TOPSECRET" not in str(e.value)
    assert e.value.__cause__ is None and e.value.__suppress_context__
    assert audited == []


def test_a_name_in_use_is_a_sentence_not_a_500():
    s = _Session([("lower(label) = lower(:label)", [{"one": 1}])])
    with pytest.raises(service.StorageTargetError, match="already have a destination called Main"):
        asyncio.run(service._assert_label_free(s, ORG, "Main", except_id=TARGET))


@pytest.mark.parametrize("name", ["create_target", "update_target"])
def test_both_writes_check_the_name_and_catch_the_race(name):
    calls = _calls(_function(SERVICE_TREE, name))
    assert "_assert_label_free" in calls
    assert "storage_target_label_key" in _source(name)


def test_a_new_destinations_name_is_checked_before_its_bucket_is_probed():
    src = _source("create_target")
    assert src.index("_assert_label_free") < src.index("storage.verify")


def test_a_rename_is_audited(audited):
    s = _Session([
        ("SELECT id, label, provider", [dict(ROW)]),
        ("RETURNING", [dict(ROW, label="Mumbai captures")]),
    ])
    asyncio.run(service.update_target(  # type: ignore[arg-type]
        s, _Claims(), TARGET, label="Mumbai captures"
    ))
    assert audited == [(
        "storage.target.renamed",
        "Delivery destination Field capture renamed to Mumbai captures",
    )]


def test_a_rename_racing_a_delete_is_a_404_not_a_500(audited):
    s = _Session([
        ("SELECT id, label, provider", [dict(ROW)]),
        ("RETURNING", []),  # the UPDATE found the row deleted
    ])
    with pytest.raises(LookupError):
        asyncio.run(service.update_target(  # type: ignore[arg-type]
            s, _Claims(), TARGET, label="Mumbai captures"
        ))
    assert audited == []


def test_saving_the_same_name_changes_nothing(audited):
    s = _Session([
        ("SELECT id, label, provider", [dict(ROW)]),
        ("SELECT id, owner_org_id", [dict(ROW)]),
    ])
    asyncio.run(service.update_target(  # type: ignore[arg-type]
        s, _Claims(), TARGET, label="  Field capture "
    ))
    assert not s.sent("UPDATE storage_target")
    assert audited == []


# ---------------------------------------------------------------------------
# The API
# ---------------------------------------------------------------------------


def _route(path: str, method: str) -> APIRoute:
    return next(
        r
        for r in storage_api.router.routes
        if isinstance(r, APIRoute) and r.path == path and method in r.methods
    )


def _capabilities(route: APIRoute) -> list[Any]:
    return [
        c.cell_contents
        for d in route.dependant.dependencies
        for c in (getattr(d.call, "__closure__", None) or ())
    ]


def test_delete_is_a_204_for_whoever_manages_storage():
    route = _route("/storage-targets/{target_id}", "DELETE")
    assert route.status_code == 204
    assert "storage.manage" in _capabilities(route)


@pytest.mark.parametrize(
    ("error", "code"),
    [
        (service.StorageTargetInUseError("in use"), 409),
        (service.StorageTargetError("bad key"), 422),
        (LookupError("gone"), 404),
    ],
)
def test_refusals_map_to_what_they_are(error, code):
    assert storage_api._map(error).status_code == code


# ---------------------------------------------------------------------------
# The database
# ---------------------------------------------------------------------------


def test_a_deleted_destination_holds_no_key():
    assert re.search(
        r"ADD CONSTRAINT storage_target_deleted_wiped\s+CHECK \(deleted_at IS NULL OR "
        r"secret = '\{\}'::jsonb\)",
        CODE,
    )


def test_keys_already_deleted_are_wiped_before_the_check_is_added():
    wipe = CODE.index("UPDATE storage_target SET secret = '{}'::jsonb")
    assert wipe < CODE.index("ADD CONSTRAINT storage_target_deleted_wiped")
    assert wipe < CODE.index("CREATE TRIGGER")


def test_the_delete_guard_reads_as_the_owner_and_refuses_both_ways():
    guard = _sql_function("storage_target_delete_guard")
    assert "SECURITY DEFINER SET search_path = public" in guard
    assert "OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL" in guard
    assert "FROM contract c" in guard and "FROM request r" in guard
    assert "ERRCODE = 'check_violation'" in guard
    assert re.search(
        r"CREATE TRIGGER storage_target_delete_guard BEFORE UPDATE ON storage_target", CODE
    )


def test_a_request_names_only_a_live_destination_of_its_own_client():
    guard = " ".join(_sql_function("request_storage_target_guard").split())
    assert "SECURITY DEFINER SET search_path = public" in guard
    assert "st.owner_org_id = NEW.client_org_id" in guard
    assert "st.deleted_at IS NULL FOR SHARE" in guard
    # unchanged on an update is left alone, so an old row is never re-judged
    assert "NEW.storage_target_id IS NOT DISTINCT FROM OLD.storage_target_id" in guard
    assert re.search(
        r"CREATE TRIGGER request_storage_target_guard BEFORE INSERT OR UPDATE OF "
        r"storage_target_id ON request",
        CODE,
    )


def test_no_policy_or_grant_changes():
    assert "POLICY" not in CODE and "GRANT" not in CODE


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0063():
    assert re.search(r'^revision = "0064"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0063"$', MIGRATION_TEXT, re.M)


def test_the_file_follows_580_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("590_storage_target_delete") == files.index("580_request_cancel") + 1


def test_no_comment_line_ends_a_statement():
    comments = [ln for ln in SQL_TEXT.splitlines() if ln.strip().startswith("--")]
    assert not [ln for ln in comments if ln.rstrip().endswith(";")]


def test_the_downgrade_drops_what_590_added():
    down = _literal("_DOWN")
    for drop in (
        "DROP TRIGGER IF EXISTS request_storage_target_guard ON request",
        "DROP FUNCTION IF EXISTS request_storage_target_guard()",
        "DROP TRIGGER IF EXISTS storage_target_delete_guard ON storage_target",
        "DROP FUNCTION IF EXISTS storage_target_delete_guard()",
        "DROP CONSTRAINT IF EXISTS storage_target_deleted_wiped",
        "COMMENT ON COLUMN storage_target.deleted_at IS NULL",
    ):
        assert drop in down, drop
