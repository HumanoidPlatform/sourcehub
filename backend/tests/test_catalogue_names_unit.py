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


def test_the_new_file_follows_400_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    assert listed[listed.index("410_catalogue_names") - 1] == "400_no_worker_consent"


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


# ---------------------------------------------------------------------------
# A delivery partner buys: the grant rides in 0044, not in 0042, so a
# database that already ran 0042 gets it too.
# ---------------------------------------------------------------------------
def test_0044_grants_a_partner_catalogue_buy():
    seed = _code(_literal("_SEED"))
    assert "r.code = 'tenant' AND r.is_system AND p.code = 'catalogue.buy'" in seed
    assert "ON CONFLICT DO NOTHING" in seed


def test_upgrade_runs_the_schema_then_the_grant():
    up = MIGRATION_TEXT[MIGRATION_TEXT.index("def upgrade()"):MIGRATION_TEXT.index("def downgrade()")]
    assert "_statements(_UP) + _statements(_SEED)" in up


def test_the_downgrade_takes_the_grant_back():
    down = _code(_literal("_DOWN"))
    assert "DELETE FROM role_permission" in down
    assert "code = 'tenant'" in down and "code = 'catalogue.buy'" in down


def test_0042_still_grants_a_partner_only_list_and_quote():
    # 0042 is left as it may already have run somewhere; editing it would
    # change nothing there.
    m42 = (ROOT / "backend" / "migrations" / "versions" / "0042_catalogue.py").read_text(encoding="utf-8")
    seed42 = re.search(r'_SEED = """(.*?)"""', m42, re.S).group(1)
    assert "r.code IN ('tenant', 'aggregator') AND r.is_system" in seed42
    assert "r.code = 'tenant'" not in seed42


def test_a_fresh_build_seeds_the_same_grant():
    seed900 = (ROOT / "db" / "900_seed.sql").read_text(encoding="utf-8")
    tenant = re.search(r"WHERE r\.code = 'tenant' AND p\.code IN \((.*?)\);", seed900, re.S).group(1)
    assert "'catalogue.buy'" in tenant


def test_the_catalogue_never_joins_organisation():
    # a join on a row the caller may not see drops the listing with it
    service = SERVICE.read_text(encoding="utf-8")
    assert "JOIN organisation" not in service
    assert "datahub_org_name(d.owner_org_id) AS owner_name" in service
    # licences went in db/420; the deal is the agreement. A public request
    # (db/440) has no buyer organisation: the visitor's company stands in.
    assert "coalesce(datahub_org_name(k.buyer_org_id), k.contact_company) AS buyer_name" in service
    assert "datahub_org_name(k.seller_org_id) AS seller_name" in service
