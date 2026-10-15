"""0048 takes the dataset catalogue away from aggregators.

An aggregator hands captures to the delivery partner, who sells; it neither
lists nor buys. So its role holds no catalogue capability, a fresh build
seeds none, the service lets no aggregator list, and every catalogue route
asks for a catalogue capability before it answers.

Scripts only; no database is opened.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0048_no_catalogue_for_aggregators.py"
SEED = ROOT / "db" / "900_seed.sql"
SERVICE = ROOT / "backend" / "src" / "sourcehub" / "modules" / "catalogue" / "service.py"
ROUTES = ROOT / "backend" / "src" / "sourcehub" / "api" / "v1" / "catalogue.py"

MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def test_the_migration_follows_0047():
    assert re.search(r'^revision = "0048"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0047"$', MIGRATION_TEXT, re.M)


def test_the_upgrade_takes_both_grants_from_every_aggregator_role():
    up = _literal("_UP")
    assert up.strip().startswith("DELETE FROM role_permission")
    assert "WHERE  code IN ('catalogue.list', 'catalogue.quote')" in up
    assert "(code = 'aggregator' AND is_system)" in up
    assert "applies_to_kind = 'aggregator'" in up
    assert "kind = 'aggregator'" in up


def test_the_downgrade_gives_them_back():
    down = _literal("_DOWN")
    assert "INSERT INTO role_permission" in down and "ON CONFLICT DO NOTHING" in down
    assert "r.code = 'aggregator' AND r.is_system" in down
    assert "('catalogue.list', 'catalogue.quote')" in down


def test_a_fresh_build_seeds_no_catalogue_capability_for_aggregators():
    seed = SEED.read_text(encoding="utf-8")
    caps = re.search(r"WHERE r\.code = 'aggregator' AND p\.code IN \((.*?)\);", seed, re.S).group(1)
    assert "catalogue." not in caps


def test_no_aggregator_lists_a_dataset():
    service = SERVICE.read_text(encoding="utf-8")
    kinds = re.search(r"^SELLER_KINDS = frozenset\(\{(.*?)\}\)", service, re.M).group(1)
    assert "aggregator" not in kinds


def test_browsing_asks_for_a_catalogue_capability():
    routes = ROUTES.read_text(encoding="utf-8")
    assert "Depends(get_principal)" not in routes
    assert re.search(r'^_BROWSERS = \(.*"catalogue\.buy".*"catalogue\.review"\)', routes, re.M)
