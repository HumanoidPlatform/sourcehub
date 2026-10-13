"""Ratings in every direction (db/380 + 0041).

The two files stay one change (verbatim); the migration follows 0040 and the bundle lists
380 last; the splitter rules hold; the downgrade refuses while a rating of a new kind
exists; the schema says what the plan said (four kinds, the shape CHECK, once-each
indexes, a trigger that reads the subject's state, reads narrowed to the parties, no
UPDATE or DELETE, a numbers-only summary, both seeded columns gone); the seeds and the
migration grant rating.write the same way; the service writes each kind to its subject
column, audits the score and never the words, and tells the right people; the routes
are mounted behind rating.write; and the comment minimum is one number on both sides.
"""

from __future__ import annotations

import ast
import re
import uuid
from pathlib import Path
from typing import Any

import pytest
from fastapi.routing import APIRoute
from sqlalchemy.exc import DBAPIError

from sourcehub.api.security import AccessClaims
from sourcehub.api.v1 import delivery as delivery_api
from sourcehub.main import app
from sourcehub.modules.identity.models import Organisation
from sourcehub.modules.network import service as network
from sourcehub.modules.network.models import CrowdWorker, Rating

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "380_ratings.sql").read_text(encoding="utf-8")
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0041_ratings.py"
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
BUNDLE = (ROOT / "infra" / "bundle_schema.sh").read_text(encoding="utf-8")
SEED_900 = (ROOT / "db" / "900_seed.sql").read_text(encoding="utf-8")
SEED_910 = (ROOT / "db" / "910_seed_demo.sql").read_text(encoding="utf-8")
SEED_IDENTITY = (ROOT / "infra" / "seed_identity.sql").read_text(encoding="utf-8")
OWNER_CHECK = (ROOT / "infra" / "verify_owner_model.sh").read_text(encoding="utf-8")
RATING_TSX = (ROOT / "frontend" / "src" / "shared" / "rating.tsx").read_text(encoding="utf-8")
SRC = ROOT / "backend" / "src" / "sourcehub"
KINDS = ("client_partner", "partner_client", "partner_supplier", "supplier_worker")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0041", "exec"), ns)
    return ns["_statements"](ddl)


UP = _literal("_UP")
SEED = _literal("_SEED")
DOWN = _literal("_DOWN")


def _stmt(fragment: str, text: str = UP) -> str:
    for s in _statements(text):
        if fragment in s:
            return s
    raise AssertionError(f"no statement holds {fragment!r}")


def _strip_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


# ---------------------------------------------------------------------------
# db/380 and migration 0041
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert UP == "\n" + SQL_TEXT


def test_the_migration_follows_0040():
    assert re.search(r'^revision = "0041"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0040"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_370_in_the_bundle_and_is_last():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE, re.M)
    assert m
    listed = m.group(1).split()
    at = listed.index("380_ratings")
    assert listed[at - 1] == "370_gcs_destinations"
    assert all(int(name[:3]) > 380 for name in listed[at + 1 :])


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/380", SQL_TEXT), ("_SEED", SEED), ("_DOWN", DOWN)):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_every_function_body_reaches_the_splitter_whole():
    for text in (UP, SEED, DOWN):
        for stmt in _statements(text):
            assert stmt.count("$fn$") in (0, 2), stmt[:120]


def test_upgrade_runs_the_schema_then_the_seed_and_downgrade_its_literal():
    tree = ast.parse(MIGRATION_TEXT)
    up = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "upgrade")
    loop = up.body[0]
    assert isinstance(loop, ast.For)
    names = [n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name) and n.id.startswith("_")]
    assert names == ["_statements", "_UP", "_statements", "_SEED"]
    down = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "downgrade")
    loop = down.body[0]
    assert isinstance(loop, ast.For)
    assert "_DOWN" in {n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name)}


def test_the_upgrade_guard_runs_first_and_asserts_the_old_rows_are_a_clients():
    up = _statements(UP)
    assert "DO $fn$" in up[0] and "RAISE EXCEPTION" in up[0]
    assert "g.from_org_id <> k.client_org_id OR g.to_org_id <> k.partner_org_id" in up[0]
    assert "ALTER" not in up[0]


def test_the_downgrade_guard_runs_first_and_changes_nothing():
    down = _statements(DOWN)
    assert "DO $fn$" in down[0]
    assert "RAISE EXCEPTION" in down[0] and "kind <> 'client_partner'" in down[0]
    assert "ALTER" not in down[0] and "DROP" not in down[0]


# ---------------------------------------------------------------------------
# What the schema says
# ---------------------------------------------------------------------------
def test_four_kinds_and_a_shape_for_each():
    enum = _stmt("CREATE TYPE rating_kind")
    assert all(f"'{k}'" in enum for k in KINDS)
    shape = _strip_comments(_stmt("CONSTRAINT rating_shape"))
    assert "CASE" not in shape, "a CASE with no ELSE is NULL, and a CHECK passes NULL"
    assert shape.count(" OR ") == 2 and "to_user_id IS NOT NULL AND to_org_id IS NULL" in shape


def test_to_org_id_may_be_null_and_the_old_unique_goes_by_its_default_name():
    assert "ALTER TABLE rating ALTER COLUMN to_org_id DROP NOT NULL;" in UP
    guard = _stmt("conname = 'rating_contract_id_from_org_id_to_org_id_key'")
    assert "RAISE EXCEPTION" in guard and "ALTER" not in guard
    assert "DROP CONSTRAINT rating_contract_id_from_org_id_to_org_id_key;" in UP


def test_once_each_is_three_partial_unique_indexes():
    assert "CREATE UNIQUE INDEX rating_once_per_contract ON rating (contract_id, kind)" in UP
    assert "WHERE kind IN ('client_partner', 'partner_client');" in UP
    assert "CREATE UNIQUE INDEX rating_once_per_task ON rating (task_id)" in UP
    assert "WHERE kind = 'partner_supplier';" in UP
    assert "CREATE UNIQUE INDEX rating_once_per_assignment ON rating (assignment_id)" in UP
    assert "WHERE kind = 'supplier_worker';" in UP


def test_the_trigger_reads_the_subjects_state_and_the_sessions_organisation():
    body = _stmt("FUNCTION rating_before_insert()")
    for needed in (
        "k.status <> 'completed'",
        "t.status <> 'qa_passed'",
        "a.status <> 'accepted' OR a.revoked_at IS NOT NULL",
        "current_org_id() IS DISTINCT FROM v_from",
        "NEW.from_org_id := v_from",
        "NEW.to_org_id   := v_to",
        "NEW.to_user_id  := v_user",
    ):
        assert needed in body, needed
    assert "CREATE TRIGGER rating_before_insert BEFORE INSERT ON rating" in UP
    assert "FOR EACH ROW EXECUTE FUNCTION rating_before_insert();" in UP


def test_reads_narrow_to_the_parties_and_the_login_never_edits():
    policy = _stmt("CREATE POLICY rating_select")
    assert "contract_is_visible" not in policy
    assert "is_platform_admin()" in policy and "from_org_id = current_org_id()" in policy
    assert "to_org_id = current_org_id()" in policy
    assert "REVOKE ALL ON rating FROM sourcehub_app;" in UP
    assert "GRANT SELECT, INSERT ON rating TO sourcehub_app;" in UP
    assert "FORCE ROW LEVEL SECURITY" not in UP


def test_the_summary_is_numbers_only_and_says_who_may_ask():
    fn = _stmt("FUNCTION org_rating_summary")
    assert "SECURITY DEFINER SET search_path = public" in fn
    header = fn.split("AS $fn$")[0]
    assert "rating_avg   numeric(2,1)" in header and "rating_count integer" in header
    body = fn.split("AS $fn$")[1]
    assert ".comment" not in body
    assert "o.kind IN ('client', 'aggregator', 'business')" in body
    assert "NOT is_worker()" in body and "current_org_id() IS NOT NULL" in body
    assert "o.parent_org_id = current_org_id()" in body
    assert "REVOKE EXECUTE ON FUNCTION org_rating_summary(uuid[]) FROM PUBLIC;" in UP


def test_both_seeded_columns_go():
    assert "ALTER TABLE organisation DROP COLUMN rating;" in UP
    assert "ALTER TABLE crowd_worker DROP COLUMN rating;" in UP


def test_the_downgrade_restores_the_old_shape_last():
    down = _statements(DOWN)
    joined = " ".join(down)
    assert "ALTER TABLE organisation ADD COLUMN rating numeric(2,1)" in joined
    assert "ALTER TABLE crowd_worker ADD COLUMN rating numeric(2,1)" in joined
    assert "OR contract_is_visible(contract_id)" in joined
    assert "GRANT SELECT, INSERT, UPDATE, DELETE ON rating TO sourcehub_app;" in joined
    assert "DROP TYPE rating_kind;" in joined
    assert down[-1].startswith("ALTER TABLE rating ADD CONSTRAINT rating_contract_id_from_org_id_to_org_id_key")


# ---------------------------------------------------------------------------
# Seeds: the capability, and no seeded figure anywhere
# ---------------------------------------------------------------------------
def test_the_seed_and_the_migration_grant_rating_write_the_same_way():
    matrix = r"WHERE r\.code = '%s' AND p\.code IN \((.*?)\);"
    for role in ("aggregator", "business", "client", "tenant"):
        block = re.search(matrix % role, SEED_900, re.S)
        assert block and "'rating.write'" in block.group(1), role
    sponsor = re.search(matrix % "sponsor", SEED_900, re.S)
    assert sponsor and "'rating.write'" not in sponsor.group(1)
    assert "r.code IN ('aggregator', 'business') AND r.is_system AND p.code = 'rating.write'" in SEED
    assert "ON CONFLICT DO NOTHING" in SEED
    assert "code IN ('aggregator', 'business')" in DOWN and "'rating.write'" in DOWN


def test_no_seed_writes_a_rating_figure_any_more():
    for label, text in (("910", SEED_910), ("seed_identity", SEED_IDENTITY)):
        assert not re.search(r"\brating\b", _strip_comments(text)), label


def test_the_owner_check_names_the_kind():
    assert "INSERT INTO rating (kind, contract_id, from_org_id, to_org_id, score, comment)" in OWNER_CHECK
    assert "org_rating_summary" in OWNER_CHECK


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
def test_the_models_follow_the_schema():
    assert not hasattr(Organisation, "rating")
    assert not hasattr(CrowdWorker, "rating")
    for col in ("kind", "task_id", "assignment_id", "to_user_id"):
        assert col in Rating.__table__.columns, col
    assert Rating.__table__.columns["to_org_id"].nullable


# ---------------------------------------------------------------------------
# The service
# ---------------------------------------------------------------------------
class _Row(dict):
    pass


class _Result:
    def __init__(self, row: dict[str, Any]) -> None:
        self._row = row

    def mappings(self) -> _Result:
        return self

    def one(self) -> dict[str, Any]:
        return self._row


class _Session:
    def __init__(self, row: dict[str, Any] | None = None, fail: Exception | None = None) -> None:
        self.row = row
        self.fail = fail
        self.statements: list[str] = []
        self.params: list[Any] = []

    async def execute(self, stmt: Any, params: Any = None) -> _Result:
        self.statements.append(str(stmt))
        self.params.append(params)
        if self.fail is not None:
            raise self.fail
        return _Result(self.row or {})


def _claims(org: uuid.UUID) -> AccessClaims:
    return AccessClaims(
        user_id=uuid.uuid4(), full_name="Ravi Menon", email="partner@northstar.example",
        org_id=org, org_kind="tenant", org_name="NorthStar", role="tenant", scope="owner",
        capabilities=frozenset({"rating.write"}), mfa_satisfied=False, must_change_password=False,
    )


def _stored(kind: str, **over: Any) -> dict[str, Any]:
    row = {
        "id": uuid.uuid4(), "kind": kind, "contract_id": uuid.uuid4(), "task_id": None,
        "assignment_id": None, "from_org_id": uuid.uuid4(), "to_org_id": uuid.uuid4(),
        "to_user_id": None, "score": 4, "comment": "Good work.", "created_at": None,
    }
    row.update(over)
    return row


@pytest.fixture
def calls(monkeypatch):
    out: dict[str, list[Any]] = {"audit": [], "notify": []}

    async def log(session, event, summary, scope=None, payload=None):
        out["audit"].append((event, summary, list(scope or []), payload))

    async def notify(session, org_id, body, link_page=None, link_params=None, user_id=None):
        out["notify"].append((org_id, body, link_page, link_params, user_id))

    monkeypatch.setattr(network.audit, "log", log)
    monkeypatch.setattr(network.notifier, "notify", notify)
    return out


@pytest.mark.parametrize(
    ("kind", "column"),
    [("client_partner", "contract_id"), ("partner_client", "contract_id"),
     ("partner_supplier", "task_id"), ("supplier_worker", "assignment_id")],
)
async def test_each_kind_lands_on_its_own_subject_column(kind, column, calls):
    subject = uuid.uuid4()
    session = _Session(_stored(kind))
    me = uuid.uuid4()
    await network.record_rating(session, _claims(me), kind, subject, 4, "  Good work.  ")
    sql = session.statements[0]
    assert f"INSERT INTO rating (kind, {column}, score, comment, created_by)" in sql
    assert "from_org_id" not in sql.split("RETURNING")[0], "the trigger derives the parties"
    assert session.params[0]["kind"] == kind and session.params[0]["subject"] == subject
    assert session.params[0]["comment"] == "Good work."


async def test_the_trail_carries_the_score_and_never_the_words(calls):
    row = _stored("partner_client", comment="They paid late and argued about every frame.")
    await network.record_rating(_Session(row), _claims(row["from_org_id"]), "partner_client", row["contract_id"], 2, row["comment"])
    (event, summary, scope, payload), = calls["audit"]
    assert event == "rating.recorded"
    assert payload == {"kind": "partner_client", "score": 2}
    assert "paid late" not in summary and "paid late" not in str(payload)
    assert row["contract_id"] in scope and row["from_org_id"] in scope and row["to_org_id"] in scope


async def test_who_is_told(calls):
    client = _stored("partner_client")
    await network.record_rating(_Session(client), _claims(client["from_org_id"]), "partner_client", client["contract_id"], 5, "Great.")
    (to, _body, page, params, user), = calls["notify"]
    assert to == client["to_org_id"] and page == "deliveries" and params == {"id": str(client["contract_id"])} and user is None
    calls["notify"].clear()

    supplier = _stored("partner_supplier", task_id=uuid.uuid4())
    await network.record_rating(_Session(supplier), _claims(supplier["from_org_id"]), "partner_supplier", supplier["task_id"], 5, "Great.")
    (to, _body, page, params, _user), = calls["notify"]
    assert to == supplier["to_org_id"] and page == "tasks" and params == {"id": str(supplier["task_id"])}
    calls["notify"].clear()

    calls["audit"].clear()
    worker = _stored("supplier_worker", task_id=uuid.uuid4(), assignment_id=uuid.uuid4(), to_org_id=None, to_user_id=uuid.uuid4())
    await network.record_rating(_Session(worker), _claims(worker["from_org_id"]), "supplier_worker", worker["assignment_id"], 3, "Fine.")
    assert calls["notify"] == [], "the crowd resource is never told"
    (_event, _summary, scope, _payload), = calls["audit"]
    assert worker["to_user_id"] in scope and worker["assignment_id"] in scope


async def test_what_the_database_refuses_comes_back_as_a_sentence(calls):
    class _DriverError(Exception):
        pass

    def failing(msg: str) -> DBAPIError:
        return DBAPIError("INSERT", {}, _DriverError(msg))

    me = uuid.uuid4()
    with pytest.raises(network.RatingError, match="already been rated"):
        await network.record_rating(_Session(fail=failing('duplicate key value violates unique constraint "rating_once_per_task"')),
                                    _claims(me), "partner_supplier", uuid.uuid4(), 4, "Good.")
    with pytest.raises(network.RatingError, match="TSK-02 has not passed QA"):
        await network.record_rating(_Session(fail=failing("rating: TSK-02 has not passed QA; its supplier is rated once it has\nCONTEXT: PL/pgSQL")),
                                    _claims(me), "partner_supplier", uuid.uuid4(), 4, "Good.")
    with pytest.raises(network.RatingError, match="only the delivery partner rates here"):
        await network.record_rating(_Session(fail=failing("rating: only the delivery partner rates here")),
                                    _claims(me), "partner_client", uuid.uuid4(), 4, "Good.")


async def test_a_comment_is_required_and_bounded(calls):
    me = uuid.uuid4()
    session = _Session(_stored("partner_client"))
    with pytest.raises(network.RatingError, match="at least 3 characters"):
        await network.record_rating(session, _claims(me), "partner_client", uuid.uuid4(), 4, "  a ")
    with pytest.raises(network.RatingError, match="under 2000"):
        await network.record_rating(session, _claims(me), "partner_client", uuid.uuid4(), 4, "x" * 2001)
    with pytest.raises(network.RatingError, match="1 to 5"):
        await network.record_rating(session, _claims(me), "partner_client", uuid.uuid4(), 6, "Good.")
    with pytest.raises(network.RatingError, match="not a kind"):
        await network.record_rating(session, _claims(me), "partner_worker", uuid.uuid4(), 4, "Good.")
    assert session.statements == [], "refused before the database was asked anything"


def test_approval_flushes_the_completed_status_before_rating_the_partner():
    tree = ast.parse((SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8"))
    fn = next(n for n in ast.walk(tree) if isinstance(n, ast.AsyncFunctionDef) and n.name == "approve_delivery")
    src = ast.unparse(fn)  # unparse writes string constants with single quotes
    assert "await session.flush()" in src
    assert src.index("await session.flush()") < src.index("record_rating")
    assert "'client_partner'" in src and "rate_counterparty" not in src


def test_nothing_in_the_backend_edits_a_rating():
    for path in SRC.rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        assert "UPDATE rating" not in text and "DELETE FROM rating" not in text, path


# ---------------------------------------------------------------------------
# The routes
# ---------------------------------------------------------------------------
def _route(method: str, path: str) -> APIRoute:
    for r in delivery_api.router.routes:
        if isinstance(r, APIRoute) and r.path == path and method in r.methods:
            return r
    raise AssertionError(f"no {method} {path}")


def _cells(guard: Any) -> list[Any]:
    return [c.cell_contents for c in guard.__closure__ or ()]


@pytest.mark.parametrize("path", ["/contracts/{contract_id}/rating", "/tasks/{task_id}/rating", "/assignments/{assignment_id}/rating"])
def test_each_rating_route_is_mounted_behind_rating_write(path):
    route = _route("POST", path)
    assert route.status_code == 201
    guards = [d.call for d in route.dependant.dependencies]
    assert any("rating.write" in _cells(g) for g in guards), path
    assert "/api/v1" + path in app.openapi()["paths"]


def test_the_approve_route_shares_the_rating_body():
    assert issubclass(delivery_api.ApproveIn, delivery_api.RatingIn)
    with pytest.raises(ValueError):
        delivery_api.RatingIn(score=4, comment="  a ")
    with pytest.raises(ValueError):
        delivery_api.RatingIn(score=0, comment="Good.")
    assert delivery_api.RatingIn(score=4, comment="  Good.  ").comment == "Good."


def test_the_comment_minimum_is_one_number_on_both_sides():
    m = re.search(r"export const RATING_COMMENT_MIN = (\d+);", RATING_TSX)
    assert m and int(m.group(1)) == network.RATING_COMMENT_MIN == 3
    for url in ("/contracts/${target.contractId}/rating", "/tasks/${target.taskId}/rating", "/assignments/${target.assignmentId}/rating"):
        assert url in RATING_TSX, url


def test_delivery_rows_carry_the_ratings_the_reader_may_see():
    text = (SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8")
    assert "AS supplier_rating" in text and "g.kind = 'partner_supplier'" in text
    assert "g.kind = 'supplier_worker'" in text and '"rating": (' in text
    roster = (SRC / "modules" / "network" / "service.py").read_text(encoding="utf-8")
    assert "g.kind = 'supplier_worker'" in roster and "w.rating" not in roster
