"""db/350 adds the dataset catalogue; 0038 carries it.

The two files stay one change (verbatim), with the capability rows in a
separate literal because STRUCTURE runs before SEED on a fresh build. The
tables are fenced the 270 way: ENABLE never FORCE, every policy names its
command, workers are denied outright, and grants are narrowed by column.
What the public may read without a session is the riskiest surface the
catalogue adds, so the public functions are read for what they filter on.

Scripts only; no database is opened.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "350_catalogue.sql"
SEED_FILE = ROOT / "db" / "900_seed.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0038_catalogue.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
SEED_TEXT = SEED_FILE.read_text(encoding="utf-8")

TABLES = ("datahub_dataset", "datahub_dataset_version", "datahub_dataset_item", "datahub_dataset_deal", "datahub_dataset_licence",
          "datahub_lead", "user_consent")
# every table a worker has no business in; user_consent is the worker's own
WORKER_DENIED = ("datahub_dataset", "datahub_dataset_version", "datahub_dataset_item", "datahub_dataset_deal", "datahub_dataset_licence")
CAPS = ("catalogue.list", "catalogue.quote", "catalogue.buy", "catalogue.review")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0038", "exec"), ns)
    return ns["_statements"](ddl)


def _function(name: str) -> str:
    start = SQL_TEXT.index(f"CREATE OR REPLACE FUNCTION {name}(")
    end = SQL_TEXT.index("$fn$;", start)
    return SQL_TEXT[start:end]


UP = _literal("_UP")
SEED = _literal("_SEED")
DOWN = _literal("_DOWN")


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert UP == "\n" + SQL_TEXT


def test_the_migration_follows_0037():
    assert re.search(r'^revision = "0038"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0037"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_340_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    at = listed.index("350_catalogue")
    assert listed[at - 1] == "340_capture_batches"


def test_no_comment_line_ends_a_statement_or_opens_a_body():
    for label, text in (("db/350", SQL_TEXT), ("_SEED", SEED), ("_DOWN", DOWN)):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"
                assert "$fn$" not in line, f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_body_whole():
    for stmt in _statements(UP) + _statements(SEED) + _statements(DOWN):
        assert stmt.count("$fn$") in (0, 2), stmt[:200]
    # the only dollar tag the splitter understands
    assert not re.search(r"\$(?!fn\$)[a-z]*\$", SQL_TEXT)


def test_upgrade_runs_the_schema_then_the_seed():
    tree = ast.parse(MIGRATION_TEXT)
    up = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "upgrade")
    names = [n.id for n in ast.walk(up.body[0].iter) if isinstance(n, ast.Name) and n.id.startswith("_")]
    assert names == ["_statements", "_UP", "_statements", "_SEED"]


def test_every_marketplace_object_carries_the_datahub_prefix():
    # user_consent is the one exception: any notice a person accepts, not the
    # marketplace's own (db/350 header).
    tables = re.findall(r"^CREATE TABLE (\w+)", SQL_TEXT, re.M)
    assert sorted(tables) == sorted(TABLES)
    assert [t for t in tables if not t.startswith("datahub_")] == ["user_consent"]
    for kind in ("FUNCTION", "TRIGGER"):
        names = re.findall(rf"CREATE (?:OR REPLACE )?{kind} (\w+)", SQL_TEXT)
        assert names and all(n.startswith("datahub_") for n in names), (kind, names)
    for name, table in re.findall(r"CREATE POLICY (\w+) ON (\w+)", SQL_TEXT):
        assert name.startswith(table), (name, table)
    for name in re.findall(r"CREATE (?:UNIQUE )?INDEX (\w+)", SQL_TEXT):
        assert name.startswith("datahub_"), name


def test_the_downgrade_drops_every_table_it_made():
    for t in TABLES:
        assert f"DROP TABLE IF EXISTS {t};" in DOWN
    assert "SET DEFAULT false" in DOWN


# ---------------------------------------------------------------------------
# Capabilities
# ---------------------------------------------------------------------------
def test_the_seed_and_the_migration_grant_the_same_capabilities():
    for cap in CAPS:
        assert f"('{cap}'" in SEED_TEXT, f"db/900 lacks {cap}"
        assert f"('{cap}'" in SEED, f"_SEED lacks {cap}"
        assert f"'{cap}'" in DOWN
    assert SEED.count("ON CONFLICT DO NOTHING") == 4


def test_only_operations_reviews_listings():
    rows = re.findall(r"WHERE r\.code = '(\w+)' AND p\.code IN \((.*?)\);", SEED_TEXT, re.S)
    holders = {role for role, caps in rows if "'catalogue.review'" in caps}
    assert holders == {"platform_admin"}
    buyers = {role for role, caps in rows if "'catalogue.buy'" in caps}
    assert buyers == {"client"}


# ---------------------------------------------------------------------------
# Row-level security, 270 style
# ---------------------------------------------------------------------------
def test_every_table_is_enabled_never_forced():
    assert "FORCE ROW LEVEL SECURITY" not in SQL_TEXT
    for t in TABLES:
        assert re.search(rf"ALTER TABLE {t}\s+ENABLE ROW LEVEL SECURITY;", SQL_TEXT), t


def test_every_policy_names_its_command():
    for m in re.finditer(r"CREATE POLICY (\w+) ON (\w+)(.*?);", SQL_TEXT, re.S):
        assert re.search(r"\bFOR (SELECT|INSERT|UPDATE|DELETE|ALL)\b", m.group(3)), m.group(1)
        if re.search(r"\bFOR ALL\b", m.group(3)):
            assert "AS RESTRICTIVE" in m.group(3), f"{m.group(1)}: a permissive ALL policy"


def test_workers_are_denied_the_catalogue():
    for t in WORKER_DENIED:
        assert re.search(
            rf"CREATE POLICY {t}_worker_deny ON {t} AS RESTRICTIVE FOR ALL\s+"
            r"USING \(NOT is_worker\(\)\) WITH CHECK \(NOT is_worker\(\)\);",
            SQL_TEXT,
        ), t


def test_grants_are_narrowed_before_they_are_given():
    for t in TABLES:
        revoke = SQL_TEXT.index(f"REVOKE ALL ON {t} FROM sourcehub_app;")
        assert revoke < SQL_TEXT.index(f"ON {t} TO sourcehub_app;", revoke)
    # money and the seller's identity are never writable by the API login
    licence = re.search(r"GRANT UPDATE \(([^)]*)\)\s+ON datahub_dataset_licence", SQL_TEXT)
    assert licence
    for col in ("amount", "currency", "buyer_org_id", "seller_org_id", "paid_at", "permitted_uses"):
        assert col not in licence.group(1)
    deal = re.search(r"GRANT UPDATE \(([^)]*)\)\s+ON datahub_dataset_deal", SQL_TEXT)
    assert deal and "seller_org_id" not in deal.group(1) and "buyer_org_id" not in deal.group(1)


def test_leads_have_no_insert_policy_and_no_insert_grant():
    # the only way in is datahub_lead_create()
    assert "CREATE POLICY datahub_lead_insert" not in SQL_TEXT
    assert "GRANT SELECT ON datahub_lead TO sourcehub_app;" in SQL_TEXT


# ---------------------------------------------------------------------------
# What only Ops may do, and what a buyer may not name
# ---------------------------------------------------------------------------
def test_only_operations_publishes_or_rejects():
    body = _function("datahub_dataset_transition")
    branch = body[body.index("('in_review','published')"):body.index("('published','withdrawn')")]
    assert "IF NOT is_platform_admin() THEN" in branch


def test_a_licence_takes_every_term_from_the_accepted_deal():
    body = _function("datahub_dataset_licence_before_insert")
    assert "d.status <> 'accepted'" in body
    for col in ("amount", "currency", "permitted_uses", "buyer_org_id", "seller_org_id"):
        assert re.search(rf"NEW\.{col}\s+:= d\.", body), col


def test_a_deal_takes_its_seller_from_the_listing():
    body = _function("datahub_dataset_deal_before_insert")
    assert "NEW.seller_org_id := v_owner;" in body
    assert "v.status = 'final'" in body and "'published'" in body


def test_party_checks_do_not_fail_open_without_an_org():
    for fn in ("datahub_dataset_deal_transition", "datahub_dataset_licence_transition"):
        body = _function(fn)
        assert "current_org_id() = OLD." not in body, fn
        assert "IS NOT DISTINCT FROM OLD." in body, fn


# ---------------------------------------------------------------------------
# The public surface
# ---------------------------------------------------------------------------
PUBLIC = ("datahub_public_list", "datahub_public_dataset", "datahub_public_samples")


def test_public_reads_answer_for_published_listings_only():
    for fn in PUBLIC:
        body = _function(fn)
        assert "d.status = 'published'" in body, fn
        assert "v.status = 'final'" in body, fn


def test_public_files_are_samples_only():
    body = _function("datahub_public_samples")
    assert "i.is_sample" in body and "i.withdrawn_at IS NULL" in body


def test_public_reads_carry_nothing_internal():
    for fn in PUBLIC:
        returns = _function(fn).split("LANGUAGE", 1)[0]
        for col in ("owner_org_id", "contract_id", "captured_by_user_id", "review_note",
                    "source_asset_id", "created_by", "check_summary"):
            assert col not in returns, f"{fn} returns {col}"


def test_no_definer_function_is_left_executable_by_public():
    definers = [
        (name, args)
        for name, args in re.findall(r"CREATE OR REPLACE FUNCTION (datahub_\w+)\(([^)]*)\)", SQL_TEXT)
        if "SECURITY DEFINER" in _function(name).split("$fn$", 1)[0]
        and "RETURNS trigger" not in _function(name)
    ]
    assert len(definers) >= 10, definers
    grant_block = SQL_TEXT[SQL_TEXT.index("FOREACH f IN ARRAY ARRAY["):]
    for name, _ in definers:
        assert f"'{name}(" in grant_block, f"{name} keeps PUBLIC execute"


def test_relisting_needs_the_resale_notice_before_the_capture():
    body = _function("datahub_relist_candidates")
    assert "k.partner_org_id = current_org_id()" in body
    assert "c.version >= 2" in body
    assert "c.accepted_at <= coalesce(s.captured_at, s.created_at)" in body


def test_new_requests_default_to_not_exclusive():
    assert "ALTER TABLE request ALTER COLUMN partner_reuse_allowed SET DEFAULT true;" in SQL_TEXT
    # and nothing rewrites requests already raised
    assert not re.search(r"UPDATE\s+request\b", SQL_TEXT)
