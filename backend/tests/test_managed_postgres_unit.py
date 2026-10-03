"""Ready for managed PostgreSQL: no FORCE, narrow rights, wide codes, partitions ahead.

db/270 exists because a managed server (Azure, AWS, Google) has no superuser,
and the schema was written where one existed. The risks this file guards, in
the order they would hurt:

  * FORCE ROW LEVEL SECURITY coming back in a later file or migration, which
    on a managed server stops sign-in and forks the audit chain without an
    error anywhere;
  * the API connecting as the tables' owner (or a superuser) with nothing
    noticing: row-level security then binds nobody and every organisation sees
    every row. The login guard and GET /ready exist for this;
  * a migration run by the wrong login, building tables the API cannot read,
    or running data steps that FORCE turns into silent no-ops;
  * the seed quietly re-widening the API's table rights;
  * the 100th reference code colliding with the 10th;
  * the storage partitions running out.

conftest.py's database fixtures raise NotImplementedError, so SQL is read
rather than executed (every assertion goes through _strip_comments) and the
guard is exercised with a session that answers from a script.
infra/verify_owner_model.sh runs the real thing against a scratch server.

    pytest tests/test_managed_postgres_unit.py
"""

from __future__ import annotations

import ast
import asyncio
import datetime as dt
import itertools
import re
from contextlib import asynccontextmanager
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import asyncpg
import pytest
from fastapi.routing import APIRoute

from sourcehub import main as main_module
from sourcehub.db import guard

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "db"
SQL = DB / "270_managed_postgres.sql"
SEED = DB / "900_seed.sql"
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION = VERSIONS / "0030_managed_postgres.py"
ENV_PY = ROOT / "backend" / "migrations" / "env.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SETUP = ROOT / "infra" / "db" / "managed_setup.sql"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")

FORCE = re.compile(r"(?<!NO )FORCE\s+ROW\s+LEVEL\s+SECURITY", re.I)


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


def _flat(sql: str) -> str:
    return re.sub(r"\s+", " ", _strip_comments(sql)).strip()


CODE = _flat(SQL_TEXT)


def _literal(name: str, text: str = MIGRATION_TEXT) -> str:
    m = re.search(rf'{name} = """(.*?)"""', text, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0030", "exec"), ns)
    return ns["_statements"](ddl)


def _schema_number(p: Path) -> int:
    return int(p.name[:3])


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0029():
    assert re.search(r'^revision = "0030"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0029"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_the_last_structure_file_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    # it restates rights and removes FORCE over everything before it. 280, 290
    # and 300 come after: none creates a table or grants anything, so 270 still
    # covers all
    assert listed[-4:] == [
        "270_managed_postgres",
        "280_organisation_profile",
        "290_dormant_objects",
        "300_review_defects",
    ]


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/270", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_do_block_and_function_whole():
    for stmt in _statements(_literal("_UP")) + _statements(_literal("_DOWN")):
        assert stmt.count("$fn$") in (0, 2), stmt[:200]


def test_upgrade_and_downgrade_run_their_literals_unconditionally():
    tree = ast.parse(MIGRATION_TEXT)
    for fn, literal in (("upgrade", "_UP"), ("downgrade", "_DOWN")):
        body = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == fn)
        loop = body.body[0]
        assert isinstance(loop, ast.For), f"{fn}() must run its statements unconditionally"
        assert literal in {n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name)}


# ---------------------------------------------------------------------------
# FORCE: off everywhere, and never back
# ---------------------------------------------------------------------------


def test_270_removes_force_from_every_table_the_catalogue_names():
    assert "c.relforcerowsecurity" in CODE
    assert "n.nspname = 'public'" in CODE
    assert "ALTER TABLE %s NO FORCE ROW LEVEL SECURITY" in CODE
    assert not FORCE.search(_strip_comments(SQL_TEXT))


def test_no_later_schema_file_forces_row_level_security():
    later = [p for p in DB.glob("*.sql") if 270 <= _schema_number(p) < 900]
    assert later, "db/270 itself should be found"
    for p in later:
        assert not FORCE.search(_strip_comments(p.read_text(encoding="utf-8"))), (
            f"{p.name} FORCEs row-level security. On a managed server the owner is not a "
            "superuser, FORCE binds it, and every SECURITY DEFINER helper goes blind. "
            "ENABLE only (see db/270)."
        )


def _sql_strings(text: str, skip: set[str]) -> list[str]:
    """Every string constant in a migration except its docstring and the
    literals named in skip: the SQL it can execute."""
    tree = ast.parse(text)
    doc = ast.get_docstring(tree, clean=False)
    skipped = {
        id(n.value)
        for n in tree.body
        if isinstance(n, ast.Assign) and any(ast.unparse(t) in skip for t in n.targets)
    }
    return [
        n.value
        for n in ast.walk(tree)
        if isinstance(n, ast.Constant)
        and isinstance(n.value, str)
        and n.value != doc
        and id(n) not in skipped
    ]


def test_no_later_migration_forces_row_level_security():
    checked = 0
    for p in sorted(VERSIONS.glob("0*.py")):
        rev = int(p.name[:4])
        if rev < 30:
            continue
        checked += 1
        # 0030's downgrade restores what 0030 removed; nothing else may FORCE
        for sql in _sql_strings(p.read_text(encoding="utf-8"), {"_DOWN"} if rev == 30 else set()):
            assert not FORCE.search(_strip_comments(sql)), f"{p.name} FORCEs row-level security"
    assert checked, "0030 itself should be found"


def test_the_force_check_sees_sql_in_a_migration():
    sample = 'x = """\nALTER TABLE t FORCE ROW LEVEL SECURITY;\n"""\n'
    assert any(FORCE.search(s) for s in _sql_strings(sample, set()))
    assert not any(FORCE.search(s) for s in _sql_strings(sample, {"x"}))


def test_the_downgrade_forces_back_only_what_had_row_level_security():
    down = _flat(_literal("_DOWN"))
    assert "c.relrowsecurity AND NOT c.relforcerowsecurity" in down
    assert "ALTER TABLE %s FORCE ROW LEVEL SECURITY" in down


# ---------------------------------------------------------------------------
# The API's table rights
# ---------------------------------------------------------------------------

NARROW = ("task_assignment", "task_offer", "task_offer_recipient", "engagement_reminder")


def _declared_rights(table: str) -> str:
    """The GRANT ... ON <table> TO sourcehub_app the file that made it wrote."""
    for p in sorted(DB.glob("1*.sql")) + sorted(DB.glob("2[0-6]*.sql")):
        for m in re.finditer(
            r"GRANT ([A-Z, ]+) ON ([\w, ]+) TO sourcehub_app;", _flat(p.read_text("utf-8"))
        ):
            if table in [t.strip() for t in m.group(2).split(",")]:
                return m.group(1)
    raise AssertionError(f"no grant found for {table}")


def test_the_four_tables_are_restated_as_their_files_declared_them():
    tables = ", ".join(NARROW)
    assert f"REVOKE ALL ON {tables} FROM sourcehub_app;" in CODE
    assert f"GRANT SELECT, INSERT, UPDATE ON {tables} TO sourcehub_app;" in CODE
    for t in NARROW:
        assert _declared_rights(t) == "SELECT, INSERT, UPDATE", t


def test_the_conversation_tables_are_restated_exactly_as_250_wrote_them():
    threads = _flat((DB / "250_rfp_threads.sql").read_text(encoding="utf-8"))
    for stmt in (
        "REVOKE ALL ON rfp_thread, rfp_message, rfp_thread_read FROM sourcehub_app;",
        "GRANT SELECT, INSERT ON rfp_thread TO sourcehub_app;",
        "GRANT UPDATE (closed_at, closed_reason, closed_by) ON rfp_thread TO sourcehub_app;",
        "GRANT SELECT, INSERT ON rfp_message TO sourcehub_app;",
        "GRANT SELECT, INSERT, UPDATE ON rfp_thread_read TO sourcehub_app;",
    ):
        assert stmt in threads, stmt
        assert stmt in CODE, stmt


def test_the_seed_grants_nothing_on_tables_or_sequences():
    seed = _flat(SEED.read_text(encoding="utf-8"))
    assert "ON ALL TABLES" not in seed
    assert "ON ALL SEQUENCES" not in seed


def test_the_code_never_deletes_from_the_tables_that_lose_delete():
    pattern = re.compile(rf"DELETE\s+FROM\s+({'|'.join(NARROW)})\b", re.I)
    hits = [p for p in SRC.rglob("*.py") if pattern.search(p.read_text(encoding="utf-8"))]
    assert not hits, f"these now fail with 'permission denied': {hits}"


def test_the_code_updates_a_thread_only_in_the_columns_it_may():
    found = 0
    for p in SRC.rglob("*.py"):
        text = p.read_text(encoding="utf-8")
        assert text.count("UPDATE rfp_thread") == len(
            re.findall(r"UPDATE rfp_thread \"\s*\"SET ", text)
        ), f"{p}: an UPDATE rfp_thread this test cannot read"
        for m in re.finditer(r"UPDATE rfp_thread \"\s*\"SET ([^\"]*)\"", text):
            found += 1
            cols = {c.split("=")[0].strip() for c in m.group(1).split(",")}
            assert cols <= {"closed_at", "closed_reason", "closed_by"}, (p, cols)
    assert found, "no UPDATE rfp_thread found at all; this test is no longer looking"


# ---------------------------------------------------------------------------
# Reference codes
# ---------------------------------------------------------------------------


def test_the_width_is_a_minimum():
    # lpad('100', 2, '0') is '10' in PostgreSQL: it truncates. Only a string
    # shorter than the width may reach it. (infra/verify_owner_model.sh runs
    # it: the 100th worker code comes back WKR-100.)
    assert (
        "RETURN p_prefix || '-' || CASE WHEN length(n::text) >= p_width THEN n::text "
        "ELSE lpad(n::text, p_width, '0') END;"
    ) in CODE
    assert (
        "CREATE OR REPLACE FUNCTION next_reference_code( "
        "p_prefix text, p_sequence text, p_width int DEFAULT 2 )"
    ) in CODE


def test_the_downgrade_restores_the_old_function():
    down = _flat(_literal("_DOWN"))
    assert "RETURN p_prefix || '-' || lpad(n::text, p_width, '0');" in down


# ---------------------------------------------------------------------------
# Partitions
# ---------------------------------------------------------------------------

PARTITION = re.compile(
    r"CREATE TABLE (\w+) PARTITION OF (asset|audit_event) "
    r"FOR VALUES FROM \('([\d-]+)'\) TO \('([\d-]+)'\)"
)


def _partitions() -> dict[str, list[tuple[str, dt.date, dt.date]]]:
    found: dict[str, list[tuple[str, dt.date, dt.date]]] = {"asset": [], "audit_event": []}
    for p in sorted(DB.glob("*.sql")):
        for name, parent, lo, hi in PARTITION.findall(_flat(p.read_text(encoding="utf-8"))):
            found[parent].append((name, dt.date.fromisoformat(lo), dt.date.fromisoformat(hi)))
    return found


def test_the_ranges_are_contiguous_with_no_gap_or_overlap():
    for parent, parts in _partitions().items():
        parts.sort(key=lambda x: x[1])
        assert parts, parent
        for (_, _, hi), (name, lo, _) in itertools.pairwise(parts):
            assert lo == hi, f"{parent}: {name} starts {lo}, the one before ends {hi}"


def test_the_partitions_run_at_least_six_months_ahead():
    horizon = dt.date.today() + dt.timedelta(days=183)
    for parent, parts in _partitions().items():
        last = max(hi for _, _, hi in parts)
        assert last >= horizon, (
            f"{parent}'s last partition ends {last}. Add the next year's quarters in a new "
            "db/ file and migration, as db/270 did, before rows start landing in "
            f"{parent}_default (a default holding rows blocks attaching their range)."
        )


def test_every_new_partition_gets_row_level_security():
    made = {name for name, *_ in PARTITION.findall(CODE)}
    assert len(made) == 16
    m = re.search(
        r"FOREACH t IN ARRAY ARRAY\[(.*?)\] LOOP "
        r"EXECUTE format\('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t\);",
        CODE,
    )
    assert m
    enabled = set(re.findall(r"'(\w+)'", m.group(1)))
    assert enabled == made


def test_the_downgrade_drops_only_empty_partitions():
    down = _flat(_literal("_DOWN"))
    assert "EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I)', t) INTO has_rows;" in down
    # rows keep their partition; only an empty one is dropped
    assert (
        "IF has_rows THEN RAISE NOTICE '% holds rows and is kept', t; "
        "ELSE EXECUTE format('DROP TABLE %I', t); END IF;"
    ) in down
    assert down.count("DROP TABLE") == 1
    made = {name for name, *_ in PARTITION.findall(CODE)}
    assert made <= set(re.findall(r"'(\w+_20\d\dq\d)'", down))


# ---------------------------------------------------------------------------
# The login guard
# ---------------------------------------------------------------------------


def _check(**over: bool) -> guard.LoginCheck:
    base = {"superuser": False, "bypasses_rls": False, "owns_tables": False}
    base.update(over)
    return guard.LoginCheck(login="someone", **base)


def test_only_a_login_bound_by_row_level_security_is_safe():
    assert _check().safe
    for flag in ("superuser", "bypasses_rls", "owns_tables"):
        found = _check(**{flag: True})
        assert not found.safe, flag
        assert len(found.problems) == 1


def test_the_message_names_the_login_every_problem_and_the_fix():
    found = _check(superuser=True, owns_tables=True)
    msg = found.message()
    assert "'someone'" in msg and "is a superuser" in msg and "owns the tables" in msg
    assert "sourcehub_app" in msg and "DATABASE_ADMIN_URL" in msg


def test_the_query_asks_the_three_things_postgres_decides_on():
    q = re.sub(r"\s+", " ", str(guard.LOGIN_CHECK))
    assert "r.rolsuper" in q and "r.rolbypassrls" in q
    # USAGE: the owner and anyone inheriting its privileges, which is who RLS exempts
    assert "pg_has_role(r.oid, c.relowner, 'USAGE')" in q
    assert "c.relkind IN ('r', 'p')" in q
    assert "r.rolname = current_user" in q


class _Session:
    def __init__(self, row: dict[str, Any]) -> None:
        self.row = row

    async def execute(self, _stmt: Any) -> Any:
        row = SimpleNamespace(**self.row)
        return SimpleNamespace(one=lambda: row)


def _answers(monkeypatch: pytest.MonkeyPatch, **row: Any) -> None:
    full = {"rolname": "x", "rolsuper": False, "rolbypassrls": False, "owns_tables": False}
    full.update(row)

    @asynccontextmanager
    async def fake():
        yield _Session(full)

    monkeypatch.setattr(guard, "anonymous_session", fake)
    monkeypatch.setattr("sourcehub.db.session.anonymous_session", fake)


def test_an_unsafe_login_raises(monkeypatch: pytest.MonkeyPatch):
    _answers(monkeypatch, rolname="azureadmin", owns_tables=True)
    with pytest.raises(guard.UnsafeDatabaseLoginError, match="azureadmin"):
        asyncio.run(guard.assert_safe_login())


def test_a_safe_login_passes(monkeypatch: pytest.MonkeyPatch):
    _answers(monkeypatch, rolname="sourcehub_app")
    assert asyncio.run(guard.assert_safe_login()).login == "sourcehub_app"


def test_startup_stops_on_an_unsafe_login(monkeypatch: pytest.MonkeyPatch):
    _answers(monkeypatch, rolname="postgres", rolsuper=True)
    with pytest.raises(guard.UnsafeDatabaseLoginError):
        asyncio.run(main_module._refuse_an_unbound_login())


# What a database that does not answer looks like, as the drivers raise it. The
# last two come straight from asyncpg while connecting (found by starting the
# API against a database that did not exist: before UNREACHABLE named them, the
# API refused to start at all, which it never did before the guard existed).
DOWN = [
    ConnectionRefusedError("no route"),
    TimeoutError("timed out"),
    asyncpg.InvalidCatalogNameError('database "appdb" does not exist'),
    asyncpg.InvalidPasswordError("password authentication failed"),
]


@pytest.mark.parametrize("exc", DOWN, ids=lambda e: type(e).__name__)
def test_startup_carries_on_when_the_database_is_unreachable(
    monkeypatch: pytest.MonkeyPatch, exc: BaseException
):
    async def down() -> None:
        raise exc

    monkeypatch.setattr(guard, "assert_safe_login", down)
    asyncio.run(main_module._refuse_an_unbound_login())  # does not raise


def test_unreachable_never_covers_an_unsafe_login():
    assert not issubclass(guard.UnsafeDatabaseLoginError, guard.UNREACHABLE)
    assert Exception not in guard.UNREACHABLE and RuntimeError not in guard.UNREACHABLE
    assert all(isinstance(e, guard.UNREACHABLE) for e in DOWN)


def test_the_lifespan_checks_the_login_before_starting_anything():
    tree = ast.parse((SRC / "main.py").read_text(encoding="utf-8"))
    life = next(
        n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "_lifespan"
    )
    awaits = [
        i
        for i, n in enumerate(life.body)
        if isinstance(n, ast.Expr) and isinstance(n.value, ast.Await)
    ]
    assert awaits, "_lifespan awaits nothing"
    first = life.body[awaits[0]]
    assert ast.unparse(first) == "await _refuse_an_unbound_login()"
    clocks = next(
        i
        for i, n in enumerate(life.body)
        if isinstance(n, ast.Assign) and ast.unparse(n.targets[0]) == "clocks"
    )
    assert awaits[0] < clocks, "the login is checked before the clocks start"


def test_startup_swallows_only_connection_failures():
    tree = ast.parse((SRC / "main.py").read_text(encoding="utf-8"))
    fn = next(
        n
        for n in tree.body
        if isinstance(n, ast.AsyncFunctionDef) and n.name == "_refuse_an_unbound_login"
    )
    handlers = [h for n in ast.walk(fn) if isinstance(n, ast.Try) for h in n.handlers]
    assert len(handlers) == 1
    assert ast.unparse(handlers[0].type) == "guard.UNREACHABLE"


def _ready() -> APIRoute:
    route = next(
        r for r in main_module.app.routes if isinstance(r, APIRoute) and r.path == "/ready"
    )
    assert route.methods == {"GET"}
    return route


def test_ready_is_200_through_a_bound_login(monkeypatch: pytest.MonkeyPatch):
    _answers(monkeypatch, rolname="sourcehub_app")
    resp = asyncio.run(_ready().endpoint())
    assert resp.status_code == 200


def test_ready_is_503_through_an_unbound_login(monkeypatch: pytest.MonkeyPatch):
    _answers(monkeypatch, rolname="azureadmin", owns_tables=True)
    resp = asyncio.run(_ready().endpoint())
    assert resp.status_code == 503
    assert b"azureadmin" in resp.body and b"unsafe" in resp.body


@pytest.mark.parametrize("exc", DOWN, ids=lambda e: type(e).__name__)
def test_ready_is_503_when_the_database_does_not_answer(
    monkeypatch: pytest.MonkeyPatch, exc: BaseException
):
    @asynccontextmanager
    async def down():
        raise exc
        yield

    monkeypatch.setattr("sourcehub.db.session.anonymous_session", down)
    resp = asyncio.run(_ready().endpoint())
    assert resp.status_code == 503
    assert b"unavailable" in resp.body
    # the reason names the kind of failure, never its text (hosts, database names)
    assert str(exc).encode() not in resp.body


def test_health_does_not_touch_the_database():
    health = next(
        r for r in main_module.app.routes if isinstance(r, APIRoute) and r.path == "/health"
    )
    assert asyncio.run(health.endpoint()) == {"status": "ok"}


# ---------------------------------------------------------------------------
# The Alembic preflight
# ---------------------------------------------------------------------------

ENV_TEXT = ENV_PY.read_text(encoding="utf-8")
ENV_TREE = ast.parse(ENV_TEXT)


def _env_function(name: str) -> ast.FunctionDef:
    return next(n for n in ENV_TREE.body if isinstance(n, ast.FunctionDef) and n.name == name)


def test_the_preflight_demands_the_exact_owner():
    q = re.sub(
        r"\s+", " ", re.search(r"_OWNERSHIP_CHECK = text\((.*?)\n\)", ENV_TEXT, re.S).group(1)
    )
    # exact: a login that merely inherits the owner's rights creates tables in its own name
    assert "c.relowner <> r.oid" in q
    assert "pg_has_role" not in q
    assert "c.relforcerowsecurity" in q


def test_the_preflight_lets_force_through_only_on_the_way_to_0030():
    body = ast.unparse(_env_function("_preflight"))
    assert "if row.foreign_tables:" in body
    assert "if row.forced_tables and (not row.exempt):" in body
    assert "if current != '0029':" in body
    assert body.count("raise RuntimeError") == 2


def test_every_online_run_is_preflighted_and_the_read_transaction_ended():
    run = _env_function("_run")
    first = run.body[0]
    assert isinstance(first, ast.Try), "_preflight must run first, inside try/finally"
    assert ast.unparse(first.body[0]) == "_preflight(connection)"
    assert ast.unparse(first.finalbody[0]) == "connection.rollback()"
    assert "context.configure" in ast.unparse(run.body[1])


# ---------------------------------------------------------------------------
# Poolers
# ---------------------------------------------------------------------------


def test_prepared_statements_can_be_switched_off_for_a_pooler():
    from sourcehub.config import Settings

    assert Settings.model_fields["db_prepared_statements"].default is True
    session_py = (SRC / "db" / "session.py").read_text(encoding="utf-8")
    assert '{"statement_cache_size": 0, "prepared_statement_cache_size": 0}' in session_py
    assert "if settings.db_prepared_statements" in session_py


# ---------------------------------------------------------------------------
# The one-time setup script
# ---------------------------------------------------------------------------

SETUP_CODE = _flat(SETUP.read_text(encoding="utf-8"))


def test_setup_creates_the_api_login_without_a_password():
    m = re.search(r"CREATE ROLE sourcehub_app (.*?);", SETUP_CODE)
    assert m
    assert "LOGIN" in m.group(1) and "PASSWORD" not in m.group(1)
    for attr in ("NOSUPERUSER", "NOBYPASSRLS", "NOCREATEROLE", "NOCREATEDB", "NOINHERIT"):
        assert attr in m.group(1)


def test_setup_switches_the_reporting_login_off():
    m = re.search(r"CREATE ROLE sourcehub_readonly (.*?);", SETUP_CODE)
    assert m and "NOLOGIN" in m.group(1)
    assert "ALTER ROLE sourcehub_readonly NOLOGIN PASSWORD NULL;" in SETUP_CODE


def test_setup_never_alters_superuser_or_bypassrls():
    # a managed admin is refused an ALTER ROLE that so much as names them
    for m in re.finditer(r"ALTER ROLE [^;]*;", SETUP_CODE):
        assert "SUPERUSER" not in m.group(0) and "BYPASSRLS" not in m.group(0), m.group(0)


def test_setup_creates_the_extensions_the_schema_needs():
    schema = set(
        re.findall(
            r"CREATE EXTENSION IF NOT EXISTS (\w+);",
            _flat((DB / "000_extensions.sql").read_text("utf-8")),
        )
    )
    setup = set(re.findall(r"CREATE EXTENSION IF NOT EXISTS (\w+);", SETUP_CODE))
    assert schema == setup == {"pgcrypto", "citext", "pg_trgm", "btree_gin"}


def test_setup_refuses_the_built_in_database():
    assert "IF current_database() = 'postgres' THEN RAISE EXCEPTION" in SETUP_CODE
