"""db/440 makes a public quote request a deal; 0047 carries it.

The visitor's request becomes a deal with no buyer organisation, and the
seller's emailed replies become messages in its chat. The request tables are
carried over, keeping their ids, and dropped.

Scripts only; no database is opened.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "440_catalogue_public_requests_as_deals.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0047_catalogue_public_requests_as_deals.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _code(text: str) -> str:
    return "\n".join(ln for ln in text.splitlines() if not ln.strip().startswith("--"))


CODE = _code(SQL_TEXT)


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0046():
    assert re.search(r'^revision = "0047"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0046"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_430_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    names = m.group(1).split()
    after = names[names.index("430_catalogue_leads_to_seller") + 1]
    assert after == "440_catalogue_public_requests_as_deals"


def test_a_public_deal_has_a_visitor_and_no_buyer_and_is_only_requested_or_closed():
    shape = CODE[CODE.index("datahub_dataset_deal_channel_shape") :]
    shape = shape[: shape.index(");")]
    assert "channel = 'account'" in shape and "buyer_org_id IS NOT NULL" in shape
    assert "channel = 'public'" in shape and "buyer_org_id IS NULL" in shape
    assert "status IN ('requested', 'declined')" in shape


def test_the_transition_lets_a_public_deal_only_close():
    fn = CODE[CODE.index("FUNCTION datahub_dataset_deal_transition()") :]
    fn = fn[: fn.index("$fn$;")]
    assert "OLD.channel = 'public'" in fn
    assert "IS DISTINCT FROM ('requested', 'declined')" in fn
    # the buyer side never matches a NULL buyer
    assert "OLD.buyer_org_id IS NOT NULL AND" in fn


def test_requests_and_replies_are_carried_over_before_the_tables_go():
    drop_lead = CODE.index("DROP TABLE datahub_lead;")
    drop_reply = CODE.index("DROP TABLE datahub_lead_reply;")
    assert CODE.index("FROM   datahub_lead l JOIN datahub_dataset d") < drop_lead
    assert CODE.index("FROM   datahub_lead_reply r JOIN datahub_lead l") < drop_reply < drop_lead
    assert "SELECT l.id, l.dataset_id, NULL, d.owner_org_id, 'public'" in CODE
    assert "DISABLE TRIGGER datahub_dataset_deal_before_insert" in CODE
    assert "ENABLE TRIGGER datahub_dataset_deal_before_insert" in CODE


def test_the_new_function_replaces_the_old_and_tells_the_seller():
    assert "DROP FUNCTION datahub_lead_create(" in CODE
    fn = CODE[CODE.index("FUNCTION datahub_public_request_create(") :]
    fn = fn[: fn.index("$fn$;")]
    assert "'public'" in fn and "'catalogue_deal'" in fn and "VALUES (v_owner," in fn
    assert "GRANT EXECUTE ON FUNCTION datahub_public_request_create(" in CODE


def test_the_downgrade_refuses():
    down = _code(_literal("_DOWN"))
    assert "RAISE EXCEPTION '0047 downgrade" in down
    assert "CREATE TABLE" not in down
