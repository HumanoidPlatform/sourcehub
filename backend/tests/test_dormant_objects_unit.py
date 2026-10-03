"""db/290 drops the dormant objects; 0032 carries it.

The two files stay one change (verbatim), the guard runs before the first
DROP, children go before parents, the downgrade brings everything back as it
stood at 0031, and nothing in the backend names a dropped table, column or
type any more.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "db"
SQL = DB / "290_dormant_objects.sql"
SEED = DB / "900_seed.sql"
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION = VERSIONS / "0032_dormant_objects.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
TABLES = (
    "gold_set_item",
    "gold_set",
    "rubric_rule",
    "sampling_plan",
    "rubric",
    "consent_artefact",
    "proposal_resource",
    "onboarding_document",
    "user_mfa",
    "legal_hold",
    "erasure_request",
    "event_outbox",
    "retention_policy",
)
# the policies db/100 gave them; the other six tables never had row-level security
POLICIES = {
    "user_mfa": ("user_mfa_own",),
    "onboarding_document": ("onboarding_document_select", "onboarding_document_insert"),
    "proposal_resource": ("proposal_resource_select", "proposal_resource_write"),
    "consent_artefact": ("consent_artefact_select", "consent_artefact_insert"),
    "rubric": ("rubric_select", "rubric_write"),
    "gold_set": ("gold_set_select", "gold_set_write"),
    "legal_hold": ("legal_hold_select", "legal_hold_write"),
}
FUNCTIONS = ("current_app_role()", "org_in_vendor_directory(uuid)")
VIEWS = (
    "contract_progress",
    "equipment_availability",
    "ledger_account_balance",
    "ledger_imbalance",
)
ENUM = "onboarding_document_kind"


def _literal(name: str, text: str = MIGRATION_TEXT) -> str:
    m = re.search(rf'{name} = """(.*?)"""', text, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0032", "exec"), ns)
    return ns["_statements"](ddl)


def _code_only(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith("#"))


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0031():
    assert re.search(r'^revision = "0032"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0031"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_the_last_structure_file_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    # straight after 280; later files (300_push, 310_review_defects, ...) may follow
    at = listed.index("290_dormant_objects")
    assert listed[at - 1 : at + 1] == ["280_organisation_profile", "290_dormant_objects"]
    assert all(int(name[:3]) > 290 for name in listed[at + 1 :])


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/290", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_the_guard_and_every_function_whole():
    up = _statements(_literal("_UP"))
    # the file's header rides along with the first statement, as in 0031; the
    # guard must be that statement, whole
    assert "DO $fn$" in up[0] and "RAISE EXCEPTION" in up[0] and "DROP " not in up[0]
    for stmt in up + _statements(_literal("_DOWN")):
        assert stmt.count("$fn$") in (0, 2), stmt[:200]


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
def test_the_guard_checks_every_table_before_anything_is_dropped():
    guard = SQL_TEXT[SQL_TEXT.index("DO $fn$") : SQL_TEXT.index("$fn$;")]
    assert SQL_TEXT.index("DO $fn$") < SQL_TEXT.index("DROP ")
    for t in TABLES:
        assert t in guard, t
    # the seeded platform default is allowed through; a per-client row is not
    assert "FROM retention_policy WHERE org_id IS NOT NULL" in guard


def test_children_are_dropped_before_their_parents():
    def at(s: str) -> int:
        return SQL_TEXT.index(s)

    assert at("DROP COLUMN sampling_plan_id") < at("DROP TABLE sampling_plan;")
    assert at("DROP TABLE gold_set_item;") < at("DROP TABLE gold_set;")
    assert at("DROP TABLE rubric_rule;") < at("DROP TABLE rubric;")
    assert at("DROP TABLE sampling_plan;") < at("DROP TABLE rubric;")
    assert at("DROP TABLE onboarding_document;") < at(f"DROP TYPE {ENUM};")


def test_every_object_is_dropped_exactly_once():
    for t in TABLES:
        assert SQL_TEXT.count(f"DROP TABLE {t};") == 1, t
    assert SQL_TEXT.count(f"DROP TYPE {ENUM};") == 1
    for fn in FUNCTIONS:
        assert SQL_TEXT.count(f"DROP FUNCTION {fn};") == 1, fn
    for v in VIEWS:
        assert SQL_TEXT.count(f"DROP VIEW {v};") == 1, v
    assert "IF EXISTS" not in SQL_TEXT  # every object exists on every path; a miss is a bug


def test_the_downgrade_recreates_everything_as_it_stood_at_0031():
    down = _literal("_DOWN")
    for t in TABLES:
        assert f"CREATE TABLE {t} (" in down, t
    for t, names in POLICIES.items():
        assert f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY;" in down, t
        for p in names:
            assert f"CREATE POLICY {p} ON {t} " in down, p
    assert "FORCE ROW LEVEL SECURITY" not in down  # 270 took it off everything
    assert f"CREATE TYPE {ENUM} AS ENUM" in down
    for fn in ("current_app_role()", "org_in_vendor_directory(p_org_id uuid)"):
        assert f"CREATE OR REPLACE FUNCTION {fn}" in down, fn
    assert (
        "GRANT  EXECUTE ON FUNCTION org_in_vendor_directory(uuid) "
        "TO sourcehub_app, sourcehub_readonly;"
    ) in down
    for v in VIEWS:
        assert f"CREATE VIEW {v} AS" in down, v
    assert (
        "ADD COLUMN sampling_plan_id uuid REFERENCES sampling_plan(id) ON DELETE SET NULL;" in down
    )
    assert "INSERT INTO retention_policy (org_id, retention_months) VALUES (NULL, 24);" in down


def test_the_downgrade_creates_parents_before_children():
    down = _literal("_DOWN")

    def at(s: str) -> int:
        return down.index(s)

    assert at(f"CREATE TYPE {ENUM}") < at("CREATE TABLE onboarding_document (")
    assert at("CREATE TABLE rubric (") < at("CREATE TABLE rubric_rule (")
    assert at("CREATE TABLE rubric (") < at("CREATE TABLE sampling_plan (")
    assert at("CREATE TABLE gold_set (") < at("CREATE TABLE gold_set_item (")
    assert at("CREATE TABLE sampling_plan (") < at("ADD COLUMN sampling_plan_id")
    assert at("CREATE TABLE retention_policy (") < at("INSERT INTO retention_policy")


# ---------------------------------------------------------------------------
# Nothing else still points at them
# ---------------------------------------------------------------------------
def test_the_backend_names_no_dropped_object():
    sql_use = re.compile(
        r"\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+(" + "|".join(TABLES) + r")\b"
        r"|__tablename__\s*=\s*\"(" + "|".join(TABLES) + r")\""
        r"|\bsampling_plan_id\b|\bOnboardingDocumentKind\b|\bonboarding_document_kind\b"
        r"|\b(" + "|".join(VIEWS) + r")\b"
        r"|\bcurrent_app_role\(|\borg_in_vendor_directory\(",
    )
    hits = []
    for path in sorted(SRC.rglob("*.py")):
        for n, line in enumerate(_code_only(path.read_text(encoding="utf-8")).splitlines(), 1):
            if sql_use.search(line):
                hits.append(f"{path.relative_to(ROOT)}:{n}: {line.strip()}")
    assert hits == [], "\n".join(hits)


def test_the_seed_no_longer_writes_retention_policy():
    assert "retention_policy" not in SEED.read_text(encoding="utf-8")
