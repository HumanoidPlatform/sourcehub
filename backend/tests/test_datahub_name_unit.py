"""db/460 names the data marketplace DataHub where the database speaks; 0050 carries it.

People read it in the bell a public quote request rings for the seller and in
two capability descriptions. Codes and names (catalogue.*, datahub_*) stay. The
console, the backend's own notifications and the reply email say DataHub too,
and link to the /datahub addresses.

Scripts only; no database is opened.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "460_datahub_name.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0050_datahub_name.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SEED = ROOT / "db" / "900_seed.sql"
SERVICE = ROOT / "backend" / "src" / "sourcehub" / "modules" / "catalogue" / "service.py"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0049():
    assert re.search(r'^revision = "0050"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0049"$', MIGRATION_TEXT, re.M)


def test_the_file_is_in_the_bundle_after_450():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("460_datahub_name") == files.index("450_dataset_deal_invoices") + 1


def test_the_sellers_bell_says_datahub():
    assert "came in through the DataHub public page." in SQL_TEXT
    code = "\n".join(ln for ln in SQL_TEXT.splitlines() if not ln.strip().startswith("--"))
    assert "public catalogue" not in code
    assert "came in through the public catalogue." in _literal("_DOWN")


def test_the_capability_descriptions_say_datahub_in_both_builds():
    seed = SEED.read_text(encoding="utf-8")
    for text in ("List own datasets in DataHub", "Publish or reject DataHub listings"):
        assert f"'{text}'" in SQL_TEXT and f"'{text}'" in seed
    assert "in the catalogue'" not in seed and "catalogue listings'" not in seed


def test_the_backend_speaks_of_datahub_and_links_to_it():
    service = SERVICE.read_text(encoding="utf-8")
    assert "is published in DataHub." in service
    assert "/datahub/public/{k['dataset_slug']}" in service
    assert "dataset catalogue" not in service and "/datasets/" not in service
