"""db/300 folds qa_review_defect onto the verdict row; 0033 carries it.

The two files stay one change (verbatim); the append-only rule on qa_review
comes off before the copy and goes back on after it; the assertion runs before
the table is dropped; the downgrade brings the table back and expands the
column into rows; and the backend writes and reads the column, never the table.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "db"
SQL = DB / "300_review_defects.sql"
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION = VERSIONS / "0033_review_defects.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"
QA_SERVICE = SRC / "modules" / "qa" / "service.py"
QA_MODELS = SRC / "modules" / "qa" / "models.py"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
RULE = "CREATE RULE qa_review_no_update AS ON UPDATE TO qa_review DO INSTEAD NOTHING;"


def _literal(name: str, text: str = MIGRATION_TEXT) -> str:
    m = re.search(rf'{name} = """(.*?)"""', text, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0033", "exec"), ns)
    return ns["_statements"](ddl)


def _code_only(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith("#"))


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0032():
    assert re.search(r'^revision = "0033"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0032"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_the_last_structure_file_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    assert listed[-2:] == ["290_dormant_objects", "300_review_defects"]


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/300", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_the_assertion_block_whole():
    stmts = _statements(_literal("_UP")) + _statements(_literal("_DOWN"))
    for stmt in stmts:
        assert stmt.count("$fn$") in (0, 2), stmt[:200]
    block = next(s for s in stmts if "DO $fn$" in s)
    assert "RAISE EXCEPTION" in block and "DROP TABLE" not in block


def test_upgrade_and_downgrade_run_their_literals_unconditionally():
    tree = ast.parse(MIGRATION_TEXT)
    for fn, literal in (("upgrade", "_UP"), ("downgrade", "_DOWN")):
        body = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == fn)
        loop = body.body[0]
        assert isinstance(loop, ast.For), f"{fn}() must run its statements unconditionally"
        assert literal in {n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name)}


# ---------------------------------------------------------------------------
# What the SQL does, in the order it must
# ---------------------------------------------------------------------------
def test_the_column_exists_before_the_copy():
    copied = SQL_TEXT.index("UPDATE qa_review q")
    assert SQL_TEXT.index("ADD COLUMN defects jsonb") < copied
    assert SQL_TEXT.index("ADD CONSTRAINT qa_review_defects_is_object") < copied


def test_the_append_only_rule_is_lifted_for_the_copy_and_put_back_verbatim():
    dropped = SQL_TEXT.index("DROP RULE qa_review_no_update ON qa_review;")
    copied = SQL_TEXT.index("UPDATE qa_review q")
    restored = SQL_TEXT.index(RULE)
    assert dropped < copied < restored
    assert SQL_TEXT.count("DROP RULE") == 1 and SQL_TEXT.count("CREATE RULE") == 1
    # the rule 060 wrote, character for character
    assert RULE in (DB / "060_qa.sql").read_text(encoding="utf-8")


def test_the_copy_is_checked_before_the_table_is_dropped():
    assertion = SQL_TEXT.index("DO $fn$")
    dropped = SQL_TEXT.index("DROP TABLE qa_review_defect;")
    assert SQL_TEXT.index("UPDATE qa_review q") < assertion < dropped
    block = SQL_TEXT[assertion : SQL_TEXT.index("$fn$;")]
    assert "count(DISTINCT review_id)" in block and "sum(affected_count)" in block
    assert "RAISE EXCEPTION '300:" in block
    assert SQL_TEXT.count("DROP TABLE qa_review_defect;") == 1


def test_the_downgrade_recreates_the_table_and_expands_the_column():
    down = _literal("_DOWN")
    assert "CREATE TABLE qa_review_defect (" in down
    assert "REFERENCES qa_review(id) ON DELETE CASCADE" in down
    assert "REFERENCES defect_code(id) ON DELETE RESTRICT" in down
    assert "PRIMARY KEY (review_id, defect_code_id)" in down
    assert down.index("CREATE TABLE qa_review_defect") < down.index("INSERT INTO qa_review_defect")
    assert "jsonb_each_text(q.defects)" in down and "JOIN defect_code d ON d.code = e.key" in down
    assert down.index("INSERT INTO qa_review_defect") < down.index("DROP COLUMN defects")
    assert "DROP RULE" not in down  # ALTER TABLE is not an UPDATE


# ---------------------------------------------------------------------------
# The backend writes and reads the column, never the table
# ---------------------------------------------------------------------------
def test_the_model_maps_the_column():
    text = _code_only(QA_MODELS.read_text(encoding="utf-8"))
    assert re.search(r"defects: Mapped\[dict\[str, Any\]\] = mapped_column\(\s*JSONB", text)


def test_the_gate1_verdict_carries_the_tally_and_the_listing_returns_it():
    text = _code_only(QA_SERVICE.read_text(encoding="utf-8"))
    assert "defects=dict(sorted(tally.items()))" in text
    assert "q.defects" in text  # reviews_for_task


def test_no_backend_source_names_the_table():
    hits = []
    for path in sorted(SRC.rglob("*.py")):
        for n, line in enumerate(_code_only(path.read_text(encoding="utf-8")).splitlines(), 1):
            if "qa_review_defect" in line:
                hits.append(f"{path.relative_to(ROOT)}:{n}: {line.strip()}")
    assert hits == [], "\n".join(hits)
