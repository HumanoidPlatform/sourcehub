"""db/410 lets a catalogue buyer and seller see each other's name; 0044 carries it.

A delivery partner buys as well as sells now, and organisation's policies never
let one partner see another. Joining organisation hid every other partner's
published listing from a partner outright, so the catalogue asks
datahub_org_name instead, which gives the name alone and only for a reason.

Scripts only; no database is opened.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "410_catalogue_names.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0044_catalogue_names.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SERVICE = ROOT / "backend" / "src" / "sourcehub" / "modules" / "catalogue" / "service.py"

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


def test_the_migration_follows_0043():
    assert re.search(r'^revision = "0044"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0043"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_last_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    assert m.group(1).split()[-2:] == ["400_no_worker_consent", "410_catalogue_names"]


def test_no_comment_line_ends_a_statement_or_opens_a_body():
    for n, line in enumerate(SQL_TEXT.splitlines(), 1):
        if line.strip().startswith("--"):
            assert not line.rstrip().endswith(";"), f"db/410 line {n}: {line}"
            assert "$fn$" not in line, f"db/410 line {n}: {line}"


def test_the_name_is_given_only_for_a_reason():
    code = _code(SQL_TEXT)
    assert "SECURITY DEFINER" in code and "RETURNS text" in code
    # a session is required, so the public pages cannot use it
    assert "current_org_id() IS NOT NULL" in code
    # the reasons, and no other
    assert "d.status = 'published'" in code
    assert "k.seller_org_id = current_org_id()" in code and "k.buyer_org_id = current_org_id()" in code
    assert "l.seller_org_id = current_org_id()" in code and "l.buyer_org_id = current_org_id()" in code
    # the name only, never the row
    assert re.search(r"SELECT o\.name\s+FROM\s+organisation o", code)


def test_only_the_app_may_call_it():
    code = _code(SQL_TEXT)
    assert "REVOKE EXECUTE ON FUNCTION datahub_org_name(uuid) FROM PUBLIC;" in code
    assert "GRANT EXECUTE ON FUNCTION datahub_org_name(uuid) TO sourcehub_app;" in code


def test_the_downgrade_drops_it():
    assert "DROP FUNCTION IF EXISTS datahub_org_name(uuid);" in _literal("_DOWN")


def test_the_catalogue_never_joins_organisation():
    # a join on a row the caller may not see drops the listing with it
    service = SERVICE.read_text(encoding="utf-8")
    assert "JOIN organisation" not in service
    assert "datahub_org_name(d.owner_org_id) AS owner_name" in service
    for side in ("buyer", "seller"):
        assert f"datahub_org_name(k.{side}_org_id) AS {side}_name" in service
        assert f"datahub_org_name(l.{side}_org_id) AS {side}_name" in service
