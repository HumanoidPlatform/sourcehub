"""db/280 folds the five profile tables into organisation; 0031 carries it.

The two files stay one change (verbatim), the copy happens before the drop,
the downgrade brings the tables back, and nothing in the backend names a
profile table any more.
"""

from __future__ import annotations

import ast
import datetime as dt
import re
import uuid
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "db"
SQL = DB / "280_organisation_profile.sql"
SEED_DEMO = DB / "910_seed_demo.sql"
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION = VERSIONS / "0031_organisation_profile.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
PROFILE_TABLES = (
    "client_profile",
    "tenant_profile",
    "aggregator_profile",
    "business_profile",
    "sponsor_profile",
)
PROFILE_MODELS = (
    "ClientProfile",
    "TenantProfile",
    "AggregatorProfile",
    "BusinessProfile",
    "SponsorProfile",
)


def _literal(name: str, text: str = MIGRATION_TEXT) -> str:
    m = re.search(rf'{name} = """(.*?)"""', text, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0031", "exec"), ns)
    return ns["_statements"](ddl)


def _code_only(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith("#"))


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0030():
    assert re.search(r'^revision = "0031"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0030"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_the_last_structure_file_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    assert listed[-2:] == ["270_managed_postgres", "280_organisation_profile"]


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/280", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_function_whole():
    for stmt in _statements(_literal("_UP")) + _statements(_literal("_DOWN")):
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
def test_every_row_is_copied_before_its_table_is_dropped():
    for t in PROFILE_TABLES:
        copied = SQL_TEXT.index(f"FROM {t} p")
        dropped = SQL_TEXT.index(f"DROP TABLE {t};")
        assert copied < dropped, t


def test_the_columns_exist_before_the_copy_and_the_rules_come_after():
    added = SQL_TEXT.index("ADD COLUMN IF NOT EXISTS profile")
    copied = SQL_TEXT.index("FROM client_profile p")
    ruled = SQL_TEXT.index("ADD CONSTRAINT organisation_profile_is_object")
    assert added < copied < ruled


def test_the_approval_function_no_longer_writes_a_profile_table():
    fn = SQL_TEXT[SQL_TEXT.index("CREATE OR REPLACE FUNCTION approve_onboarding_request") :]
    fn = fn[: fn.index("$fn$;")]
    for t in PROFILE_TABLES:
        assert f"INSERT INTO {t}" not in fn, t
    assert "plan, profile," in fn


def test_the_downgrade_recreates_the_tables_and_copies_back():
    down = _literal("_DOWN")
    for t in PROFILE_TABLES:
        assert f"CREATE TABLE {t} (" in down, t
        assert f"INSERT INTO {t} (" in down, t
        assert f"ALTER TABLE {t:<18} ENABLE ROW LEVEL SECURITY;".replace(
            "  ENABLE", " ENABLE"
        ) in down or (f"ALTER TABLE {t}" in down), t
    for col in ("profile", "plan", "dpa_signed", "dpa_signed_at", "fair_work_attested"):
        assert f"DROP COLUMN {col};" in down, col
    assert down.index("INSERT INTO client_profile (") < down.index("DROP COLUMN profile;")


def test_a_fresh_build_and_the_demo_seed_write_the_organisation_columns():
    seed = SEED_DEMO.read_text(encoding="utf-8")
    for t in PROFILE_TABLES:
        assert f"INSERT INTO {t}" not in seed, t
    assert seed.count("profile)") >= 16


# ---------------------------------------------------------------------------
# The backend follows
# ---------------------------------------------------------------------------
def test_nothing_in_the_backend_names_a_profile_table_or_model():
    offenders = []
    for path in SRC.rglob("*.py"):
        code = _code_only(path.read_text(encoding="utf-8"))
        for name in PROFILE_TABLES + PROFILE_MODELS:
            if re.search(rf"\b{name}\b", code):
                offenders.append(f"{path.relative_to(SRC)}: {name}")
    assert not offenders, offenders


def test_every_kind_but_the_platform_has_its_profile_fields():
    from sourcehub.modules.identity.profile_schema import KIND_FIELDS, OrgProfilePatch

    assert set(KIND_FIELDS) == {"client", "tenant", "aggregator", "business", "sponsor"}
    assert "crowd_size" in KIND_FIELDS["aggregator"]
    assert "contact_email" in KIND_FIELDS["sponsor"]
    # every kind field is a field of the patch model, so a PATCH can carry it
    for fields in KIND_FIELDS.values():
        assert fields <= set(OrgProfilePatch.model_fields), fields


def _org(kind: str, **over: Any) -> Any:
    from sourcehub.modules.identity.models import Organisation

    fields: dict[str, Any] = {
        "id": uuid.uuid4(),
        "reference_code": "CL-01",
        "kind": kind,
        "name": "Acme",
        "status": "active",
        "onboarded_at": dt.datetime(2024, 3, 11, tzinfo=dt.UTC),
        "profile": {},
        "plan": None,
        "dpa_signed": False,
        "dpa_signed_at": None,
        "fair_work_attested": False,
        "public_profile": {},
    }
    fields.update(over)
    return Organisation(**fields)


def test_a_client_profile_is_the_json_plus_its_typed_terms():
    from sourcehub.modules.identity import service

    org = _org(
        "client",
        profile={"industry": "Retail"},
        plan="Enterprise",
        dpa_signed=True,
        dpa_signed_at=dt.datetime(2024, 3, 11, tzinfo=dt.UTC),
    )
    full = service._profile_dict(org, commercials=True)
    assert full == {
        "industry": "Retail",
        "plan": "Enterprise",
        "dpa_signed": True,
        "dpa_signed_at": dt.datetime(2024, 3, 11, tzinfo=dt.UTC),
        "since": dt.date(2024, 3, 11),
    }


def test_a_counterparty_never_sees_the_terms_with_the_platform():
    from sourcehub.modules.identity import service

    org = _org("client", profile={"industry": "Retail"}, plan="Enterprise", dpa_signed=True)
    shown = service._profile_dict(org, commercials=False)
    assert set(shown) == {"industry", "since"}
    partner = _org(
        "tenant",
        profile={"hq": "Pune", "capabilities": "Video"},
        plan="Partner Pro",
        fair_work_attested=True,
    )
    shown = service._profile_dict(partner, commercials=False)
    assert set(shown) == {"hq", "capabilities", "fair_work_attested", "since"}


def test_network_kinds_show_their_descriptors_and_the_platform_shows_nothing():
    from sourcehub.modules.identity import service

    agg = _org(
        "aggregator", profile={"crowd_size": 820, "region": "South India", "focus": "Streets"}
    )
    assert service._profile_dict(agg) == {
        "crowd_size": 820,
        "region": "South India",
        "focus": "Streets",
    }
    assert service._profile_dict(_org("platform")) == {}


def test_signing_the_dpa_stamps_when_and_unsigning_clears_it():
    from sourcehub.modules.identity import service

    org = _org("client")
    service._apply_typed_fields(org, {"dpa_signed": True})
    assert org.dpa_signed is True and org.dpa_signed_at is not None
    service._apply_typed_fields(org, {"dpa_signed": False})
    assert org.dpa_signed is False and org.dpa_signed_at is None
