"""db/400 takes the worker out of relisting; 0043 carries it.

The crowd hands its captures to the aggregator and the aggregator to the
delivery partner; what the partner then does with captures the client did not
keep exclusive is not the worker's concern. So the relisting function no longer
asks whether a capture's worker had accepted a resale notice, and user_consent,
which nothing else read, goes.

Scripts only; no database is opened.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "400_no_worker_consent.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0043_no_worker_consent.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0043", "exec"), ns)
    return ns["_statements"](ddl)


UP = _literal("_UP")
DOWN = _literal("_DOWN")


def _code(text: str) -> str:
    """The SQL without its comments."""
    return "\n".join(ln for ln in text.splitlines() if not ln.strip().startswith("--"))


def test_the_migration_carries_the_sql_verbatim():
    assert UP == "\n" + SQL_TEXT


def test_the_migration_follows_0042():
    assert re.search(r'^revision = "0043"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0042"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_390_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    assert listed[listed.index("400_no_worker_consent") - 1] == "390_catalogue"


def test_no_comment_line_ends_a_statement_or_opens_a_body():
    for label, text in (("db/400", SQL_TEXT), ("_DOWN", DOWN)):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"
                assert "$fn$" not in line, f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_body_whole():
    for stmt in _statements(UP) + _statements(DOWN):
        assert stmt.count("$fn$") in (0, 2), stmt[:200]


def test_relisting_no_longer_asks_the_worker():
    code = _code(SQL_TEXT)
    assert "user_consent c" not in code and "resale_consented" not in code
    # still only the contract's delivery partner gets an answer, and a retake
    # still replaces the capture it retook
    assert "k.partner_org_id = current_org_id()" in code
    assert "r.replaces_asset_id = s.id" in code
    # the return type changes, so it is dropped and created, then re-fenced
    assert code.index("DROP FUNCTION datahub_relist_candidates(uuid);") < code.index(
        "CREATE FUNCTION datahub_relist_candidates(")
    assert "REVOKE EXECUTE ON FUNCTION datahub_relist_candidates(uuid) FROM PUBLIC;" in code
    assert "GRANT EXECUTE ON FUNCTION datahub_relist_candidates(uuid) TO sourcehub_app;" in code


def test_the_consent_table_goes_after_the_function_stops_reading_it():
    code = _code(SQL_TEXT)
    assert code.index("CREATE FUNCTION datahub_relist_candidates(") < code.index("DROP TABLE user_consent;")


def test_the_downgrade_puts_back_the_table_and_the_old_function():
    code = _code(DOWN)
    assert "CREATE TABLE user_consent (" in code
    assert "ENABLE ROW LEVEL SECURITY" in code
    assert "CREATE POLICY user_consent_insert ON user_consent FOR INSERT" in code
    assert "resale_consented boolean" in code
    # the table must exist before the function that reads it
    assert code.index("CREATE TABLE user_consent (") < code.index("CREATE FUNCTION datahub_relist_candidates(")
    assert "REVOKE EXECUTE ON FUNCTION datahub_relist_candidates(uuid) FROM PUBLIC;" in code
