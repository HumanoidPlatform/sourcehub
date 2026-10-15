"""db/430 sends a public quote request to the seller; 0046 carries it.

The seller prices and quotes, so the request is theirs to read and work.
Operations read every request and change none.

Scripts only; no database is opened.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "430_catalogue_leads_to_seller.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0046_catalogue_leads_to_seller.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _code(text: str) -> str:
    return "\n".join(ln for ln in text.splitlines() if not ln.strip().startswith("--"))


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0045():
    assert re.search(r'^revision = "0046"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0045"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_420_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    names = m.group(1).split()
    assert names[names.index("420_catalogue_quotes_and_chat") + 1] == "430_catalogue_leads_to_seller"


def test_the_seller_reads_and_works_its_leads_and_ops_only_read():
    code = _code(SQL_TEXT)
    sel, upd = "CREATE POLICY datahub_lead_select", "CREATE POLICY datahub_lead_update"
    select = code[code.index(sel) : code.index(upd)]
    update = code[code.index(upd) : code.index("CREATE OR REPLACE FUNCTION")]
    assert "is_platform_admin() OR datahub_dataset_owner(dataset_id) = current_org_id()" in select
    assert "datahub_dataset_owner(dataset_id) = current_org_id()" in update
    assert "is_platform_admin" not in update


def test_the_seller_is_notified_not_the_platform():
    code = _code(SQL_TEXT)
    assert "'catalogue_leads'" in code and "VALUES (v_owner," in code
    assert "kind = 'platform'" not in code


def test_the_downgrade_puts_back_the_ops_only_rules():
    down = _code(_literal("_DOWN"))
    assert "USING (is_platform_admin()) WITH CHECK (is_platform_admin())" in down
    assert "'catalogue_review'" in down


def test_replies_are_the_sellers_to_write_and_are_never_changed():
    code = _code(SQL_TEXT)
    insert = code[code.index("CREATE POLICY datahub_lead_reply_insert") :]
    insert = insert[: insert.index(";")]
    assert "org_id  = current_org_id()" in insert and "sent_by = current_user_id()" in insert
    assert "datahub_dataset_owner(l.dataset_id) = current_org_id()" in insert
    assert "l.status <> 'closed'" in insert
    assert "datahub_lead_reply_no_update AS ON UPDATE" in code
    assert "datahub_lead_reply_no_delete AS ON DELETE" in code
    assert "GRANT SELECT, INSERT ON datahub_lead_reply TO sourcehub_app;" in code


def test_the_downgrade_drops_the_replies_first():
    down = _code(_literal("_DOWN"))
    assert down.strip().startswith("DROP TABLE datahub_lead_reply;")
