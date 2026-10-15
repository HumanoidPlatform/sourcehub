"""db/420 turns the catalogue into a listing plus a negotiated deal; 0045 carries it.

A listing shows what a dataset is, how many files it holds and a few samples.
Buyer and seller agree the quantity and price in a chat on the deal, and the
seller marks the deal paid and then delivered; the files change hands outside
the platform. So versions, file rows and licences go.

Scripts only; no database is opened.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "420_catalogue_quotes_and_chat.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0045_catalogue_quotes_and_chat.py"
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
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0045", "exec"), ns)
    return ns["_statements"](ddl)


def _code(text: str) -> str:
    return "\n".join(ln for ln in text.splitlines() if not ln.strip().startswith("--"))


def _function(name: str) -> str:
    start = SQL_TEXT.index(f"FUNCTION {name}(")
    end = SQL_TEXT.index("$fn$;", start)
    return SQL_TEXT[start:end]


CODE = _code(SQL_TEXT)


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0044():
    assert re.search(r'^revision = "0045"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0044"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_410_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    names = m.group(1).split()
    assert names[names.index("410_catalogue_names") + 1] == "420_catalogue_quotes_and_chat"


def test_no_comment_line_ends_a_statement_or_opens_a_body():
    for label, text in (("db/420", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"
                assert "$fn$" not in line, f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_body_whole():
    for stmt in _statements(_literal("_UP")) + _statements(_literal("_DOWN")):
        assert stmt.count("$fn$") in (0, 2), stmt[:200]
    assert not re.search(r"\$(?!fn\$)[a-z]*\$", SQL_TEXT)


# ---------------------------------------------------------------------------
# Nothing sold is lost
# ---------------------------------------------------------------------------
def test_the_upgrade_refuses_while_a_licence_exists():
    first = _statements(_literal("_UP"))[0]
    body = "\n".join(ln for ln in first.splitlines() if not ln.startswith("--")).strip()
    assert body.startswith("DO $fn$")
    assert "FROM datahub_dataset_licence" in first and "RAISE EXCEPTION '420:" in first


def test_counts_and_samples_are_carried_over_before_the_tables_go():
    assert CODE.index("UPDATE datahub_dataset d") < CODE.index("DROP TABLE datahub_dataset_item;")
    assert CODE.index("INSERT INTO datahub_dataset_sample") < CODE.index("DROP TABLE datahub_dataset_item;")
    assert "WHERE  i.is_sample AND i.withdrawn_at IS NULL" in CODE


def test_the_downgrade_refuses_rather_than_fake_the_old_model():
    down = _code(_literal("_DOWN"))
    assert "RAISE EXCEPTION '0045 downgrade" in down
    assert "CREATE TABLE" not in down


def test_versions_files_and_licences_are_dropped():
    for t in ("datahub_dataset_licence", "datahub_dataset_item", "datahub_dataset_version"):
        assert f"DROP TABLE {t};" in CODE
    assert "ALTER TABLE datahub_dataset_deal DROP COLUMN version_id;" in CODE


# ---------------------------------------------------------------------------
# The listing, its samples, the deal and the chat
# ---------------------------------------------------------------------------
def test_a_listing_says_how_many_files_and_that_is_fixed_once_in_review():
    assert "ADD COLUMN file_count  integer NOT NULL DEFAULT 0 CHECK (file_count >= 0)" in CODE
    t = _function("datahub_dataset_transition")
    assert "NEW.file_count, NEW.total_bytes" in t and "OLD.file_count, OLD.total_bytes" in t


def test_samples_change_only_while_the_listing_is_a_draft():
    g = _function("datahub_dataset_sample_guard")
    assert "d.status NOT IN ('draft', 'rejected')" in g
    assert "only its copy status changes" in g


def test_the_deal_runs_requested_to_delivered_each_move_to_one_party():
    t = _function("datahub_dataset_deal_transition")
    assert "('accepted','paid')" in t and "only the seller marks it paid" in t
    assert "('paid','delivered')" in t and "only the seller marks it delivered" in t
    assert "('quoted','accepted')" in t and "only the buyer accepts" in t
    assert "the agreed terms are fixed" in t
    assert "NEW.quote_quantity" in t


def test_one_open_deal_per_buyer_and_listing():
    assert re.search(
        r"CREATE UNIQUE INDEX datahub_dataset_deal_open_key ON datahub_dataset_deal "
        r"\(buyer_org_id, dataset_id\)\s+WHERE status IN \('requested','quoted'\)",
        CODE,
    )


def test_the_chat_is_append_only_and_the_two_parties_write_it():
    assert "CREATE RULE datahub_deal_message_no_update" in CODE
    assert "CREATE RULE datahub_deal_message_no_delete" in CODE
    insert = CODE[CODE.index("CREATE POLICY datahub_deal_message_insert"):]
    insert = insert[: insert.index(";")]
    assert "NOT is_platform_admin()" in insert
    assert "k.buyer_org_id = current_org_id() OR k.seller_org_id = current_org_id()" in insert
    assert "k.status NOT IN ('declined', 'withdrawn')" in insert


def test_workers_are_denied_the_new_tables():
    for t in ("datahub_dataset_sample", "datahub_deal_message"):
        assert f"CREATE POLICY {t}_worker_deny ON {t} AS RESTRICTIVE FOR ALL" in CODE


def test_no_function_still_reads_a_dropped_table():
    for name in ("datahub_org_name", "datahub_public_list", "datahub_public_dataset",
                 "datahub_public_samples", "datahub_copy_owners", "datahub_dataset_dealt"):
        body = _function(name)
        for gone in ("datahub_dataset_licence", "datahub_dataset_item", "datahub_dataset_version"):
            assert gone not in body, (name, gone)


def test_every_recreated_helper_is_closed_to_public():
    grant_block = CODE[CODE.index("FOREACH f IN ARRAY ARRAY["):]
    for f in ("datahub_dataset_dealt(uuid)", "datahub_copy_owners()", "datahub_org_name(uuid)",
              "datahub_public_list()", "datahub_public_dataset(text)", "datahub_public_samples(text)"):
        assert f"'{f}'" in grant_block, f
