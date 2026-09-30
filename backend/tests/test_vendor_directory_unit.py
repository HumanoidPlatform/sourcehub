"""The vendors directory: who is in it, what a row may say, and where the figures come from.

db/260 opens every active delivery partner to every client and adds
partner_performance(), the one source of a partner's rating, on-time rate and
QA pass rate. The risks this file guards, in the order they would hurt:

  * the directory disclosing more than a name and a reputation — a partner's
    plan, its billing state, why it was suspended, its logo's storage key, or
    anything about WHO it worked for;
  * the policies admitting more than "a client reads an active delivery
    partner": another kind of reader, another kind of organisation, a
    suspended account, or a write;
  * a figure shown to a client that nobody calculated — the seeded columns
    creeping back into an answer, or two screens disagreeing about one partner;
  * a partner claiming expertise that is not on the list, so that a filter
    finds half of the partners that do the work;
  * the SQL file and the migration drifting apart.

conftest.py's database fixtures raise NotImplementedError, so SQL is read
rather than executed, every SQL assertion runs through _strip_comments, and
wiring is checked on the AST, on FastAPI's own route table, or by calling the
function with a session that answers from a script — never on a file's text.

    pytest tests/test_vendor_directory_unit.py
"""

from __future__ import annotations

import ast
import datetime as dt
import json
import re
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from sourcehub.api.security import AccessClaims
from sourcehub.api.v1 import vendors as vendors_api
from sourcehub.main import app
from sourcehub.modules.identity import directory
from sourcehub.modules.identity import expertise_vocabulary as vocab
from sourcehub.modules.identity import service as identity
from sourcehub.modules.identity.models import ClientProfile, Organisation, TenantProfile
from sourcehub.modules.identity.profile_schema import (
    PUBLIC_KIND_KEYS,
    ExpertiseIn,
    OnboardingProfileIn,
    OrgProfilePatch,
    foreign_kind_fields,
    public_part,
)
from sourcehub.modules.marketplace import service as marketplace
from sourcehub.modules.marketplace.models import Proposal

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "260_vendor_directory.sql"
SEED = ROOT / "db" / "900_seed.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0029_vendor_directory.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"
IDENTITY = SRC / "modules" / "identity" / "service.py"
MARKETPLACE = SRC / "modules" / "marketplace" / "service.py"
CONSOLE = ROOT / "frontend" / "src"
TS_VOCAB = CONSOLE / "shared" / "expertise.ts"
TS_LANGUAGES = CONSOLE / "shared" / "languages.ts"
TS_COUNTRIES = CONSOLE / "shared" / "countries.ts"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


def _flat(sql: str) -> str:
    """Comments out, whitespace collapsed: an assertion about what a statement
    says must not depend on how it was wrapped."""
    return re.sub(r"\s+", " ", _strip_comments(sql)).strip()


CODE = _flat(SQL_TEXT)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal in the migration"
    return m.group(1)


def _policy(name: str) -> tuple[str, str, str]:
    """(table, command, USING expression) of one CREATE POLICY in db/260."""
    m = re.search(rf"CREATE POLICY {name} ON (\w+) FOR (\w+) USING \((.*?)\);", CODE)
    assert m, f"no policy {name}"
    return m.group(1), m.group(2), m.group(3)


def _function(name: str) -> tuple[str, str]:
    """(header, body) of one function in db/260: what precedes AS $fn$ and
    what sits between the two markers."""
    m = re.search(rf"CREATE OR REPLACE FUNCTION {name}\((.*?) AS \$fn\$ (.*?) \$fn\$;", CODE)
    assert m, f"no function {name}"
    return m.group(1), m.group(2)


def _claims(
    *, org_id: uuid.UUID | None = None, caps: set[str], role: str = "client", kind: str = "client"
) -> AccessClaims:
    return AccessClaims(
        user_id=uuid.uuid4(),
        full_name="Test User",
        email="test@example.com",
        org_id=org_id or uuid.uuid4(),
        org_kind=kind,
        org_name="Acme",
        role=role,
        scope="owner",
        capabilities=frozenset(caps),
        mfa_satisfied=True,
        must_change_password=False,
    )


# What must never reach a directory answer. Each value is distinctive, so
# finding it anywhere in the JSON is a leak whatever key it sits under.
SECRETS = {
    "legal_name": "Northstar Holdings Private Limited",
    "plan": "Partner Pro Platinum",
    "billing_status": "overdue",
    "suspension_reason": "Chargeback under review",
    "residency_region": "APAC",
    "capabilities": "Free text nobody curated",
    "logo_key": "orgs/abc/logo/1.png",
}


def _partner(**over: Any) -> Organisation:
    fields: dict[str, Any] = {
        "id": uuid.uuid4(),
        "reference_code": "TN-01",
        "kind": "tenant",
        "name": "NorthStar Delivery Partners",
        "legal_name": SECRETS["legal_name"],
        "status": "active",
        "country": "India",
        "residency_region": SECRETS["residency_region"],
        "billing_status": SECRETS["billing_status"],
        "rating": Decimal("4.9"),
        "suspended_at": dt.datetime(2026, 9, 1, tzinfo=dt.UTC),
        "suspension_reason": SECRETS["suspension_reason"],
        "public_profile": {
            "website": "https://northstar.example",
            "description": "Field data collection across South Asia.",
            "company_size": "51-200",
            "founded_year": 2016,
            "registered_address": {"city": "Pune", "country": "India"},
            "expertise": {
                "data_types": ["video", "image"],
                "domains": ["retail"],
                "languages": ["eng", "hin"],
                "regions": ["IN"],
                "certifications": ["iso_27001"],
                "other_certifications": "TISAX",
            },
            "logo_key": SECRETS["logo_key"],
            "logo_updated_at": "2026-09-28T10:00:00+00:00",
        },
    }
    fields.update(over)
    return Organisation(**fields)


def _profile(org: Organisation) -> TenantProfile:
    return TenantProfile(
        org_id=org.id,
        hq="Pune",
        plan=SECRETS["plan"],
        capabilities=SECRETS["capabilities"],
        on_time_rate=99,
        qa_pass_rate=98,
        fair_work_attested=True,
        since=dt.date(2024, 3, 1),
    )


RECORD = directory.Performance(
    contracts_completed=14,
    on_time_pct=94,
    accepted_first_time_pct=92,
    qa_pass_pct=88,
    rating_avg=4.6,
    rating_count=12,
    rating_distribution=(0, 1, 0, 3, 8),
)


def _row(org_id: uuid.UUID, **over: Any) -> dict[str, Any]:
    """One row as partner_performance() returns it."""
    row: dict[str, Any] = {
        "partner_org_id": org_id,
        "contracts_completed": 14,
        "on_time_pct": 94,
        "accepted_first_time_pct": 92,
        "qa_pass_pct": 88,
        "rating_avg": Decimal("4.6"),
        "rating_count": 12,
        "rating_1": 0,
        "rating_2": 1,
        "rating_3": 0,
        "rating_4": 3,
        "rating_5": 8,
    }
    row.update(over)
    return row


def _leaves(obj: Any) -> list[Any]:
    """Every value in an answer, however deeply nested. Looked through by
    value: a substring search of the JSON would also match a uuid's digits."""
    if isinstance(obj, dict):
        return [leaf for v in obj.values() for leaf in _leaves(v)]
    if isinstance(obj, list | tuple):
        return [leaf for v in obj for leaf in _leaves(v)]
    return [obj]


class _Result:
    def __init__(self, rows: list[Any]) -> None:
        self._rows = rows

    def mappings(self) -> _Result:
        return self

    def all(self) -> list[Any]:
        return self._rows

    def one_or_none(self) -> Any:
        return self._rows[0] if self._rows else None

    def scalar_one_or_none(self) -> Any:
        return self._rows[0] if self._rows else None


class _Session:
    """Answers from a script: the figures when asked for partner_performance,
    the scripted rows for anything else. Records every statement it was given."""

    def __init__(self, rows: list[Any] | None = None, figures: list[dict[str, Any]] | None = None):
        self.rows = rows or []
        self.figures = figures or []
        self.statements: list[str] = []
        self.params: list[Any] = []
        self.asked: list[Any] = []

    async def execute(self, stmt: Any, params: Any = None) -> _Result:
        text = str(stmt)
        self.asked.append(stmt)
        self.statements.append(text)
        self.params.append(params)
        if "partner_performance" in text:
            asked = set((params or {}).get("ids", []))
            return _Result([f for f in self.figures if f["partner_org_id"] in asked])
        return _Result(self.rows)

    def asked_for_figures(self) -> list[Any]:
        return [
            p["ids"]
            for s, p in zip(self.statements, self.params, strict=True)
            if "partner_performance" in s
        ]


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0028():
    assert re.search(r'^revision = "0029"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0028"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m, "no STRUCTURE= assignment"
    listed = m.group(1).split()
    assert "260_vendor_directory" in listed
    # after the file whose column it constrains, and the last of the structure
    assert listed.index("260_vendor_directory") > listed.index("230_org_public_profile")


def test_no_comment_line_ends_a_statement():
    # The migration splits on a line ending in ";" outside a function body. A
    # comment ending in one would cut the statement that follows it in two.
    for n, line in enumerate(SQL_TEXT.splitlines(), 1):
        if line.strip().startswith("--"):
            assert not line.rstrip().endswith(";"), f"line {n}: {line}"


def test_the_upgrade_runs_the_structure_and_the_capability():
    tree = ast.parse(MIGRATION_TEXT)
    up = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "upgrade")
    loop = up.body[0]
    assert isinstance(loop, ast.For), "upgrade() must run its statements unconditionally"
    names = {n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name)}
    assert {"_UP", "_SEED"} <= names, names


def test_the_downgrade_undoes_everything_the_upgrade_did():
    down = _flat(_literal("_DOWN"))
    for stmt in (
        "DROP POLICY IF EXISTS organisation_select_directory ON organisation;",
        "DROP POLICY IF EXISTS tenant_profile_select_directory ON tenant_profile;",
        "DROP FUNCTION IF EXISTS partner_performance(uuid[]);",
        "DROP FUNCTION IF EXISTS org_in_vendor_directory(uuid);",
        "DROP CONSTRAINT IF EXISTS organisation_public_profile_expertise;",
        "DELETE FROM permission WHERE code = 'vendor.read';",
    ):
        assert stmt in down, stmt
    # a policy that calls a function must go before the function does
    assert down.index("tenant_profile_select_directory") < down.index(
        "DROP FUNCTION IF EXISTS org_in_vendor_directory"
    )


def _grant_block(seed: str, role: str) -> str:
    m = re.search(rf"r\.code = '{role}' AND p\.code IN \((.*?)\);", seed, re.S)
    assert m, f"no {role} grant block in the seed"
    return m.group(1)


def test_the_capability_is_the_clients_and_opss_in_the_seed():
    seed = _strip_comments(SEED.read_text(encoding="utf-8"))
    assert re.search(r"\('vendor\.read',\s*'identity',", seed)
    for role in ("client", "platform_admin"):
        assert "'vendor.read'" in _grant_block(seed, role), role
    # The directory is for the people who buy. A partner browsing its rivals'
    # records, or a supplier its partner's rivals, is not what was asked for.
    for role in ("tenant", "aggregator", "business", "sponsor"):
        assert "'vendor.read'" not in _grant_block(seed, role), role


def test_the_migration_grants_what_the_seed_grants():
    mig = _flat(_literal("_SEED"))
    assert "('vendor.read', 'identity', 'Browse the delivery partner directory', false)" in mig
    assert "r.code IN ('client', 'platform_admin')" in mig
    assert "r.is_system" in mig
    assert "p.code = 'vendor.read'" in mig
    assert mig.count("ON CONFLICT DO NOTHING") == 2
    seed = _strip_comments(SEED.read_text(encoding="utf-8"))
    assert "'Browse the delivery partner directory'" in seed


# ---------------------------------------------------------------------------
# The policies: a client reads an active delivery partner, and that is all
# ---------------------------------------------------------------------------


def test_the_file_adds_two_select_policies_and_nothing_else():
    made = re.findall(r"CREATE POLICY (\w+) ON (\w+) FOR (\w+)", CODE)
    assert sorted(made) == [
        ("organisation_select_directory", "organisation", "SELECT"),
        ("tenant_profile_select_directory", "tenant_profile", "SELECT"),
    ]
    for forbidden in ("DROP POLICY", "ALTER POLICY", "AS RESTRICTIVE", "CREATE TABLE", "DROP "):
        assert forbidden not in CODE, forbidden
    assert " DISABLE ROW LEVEL SECURITY" not in CODE


def test_a_client_reads_active_delivery_partners_only():
    table, command, using = _policy("organisation_select_directory")
    assert (table, command) == ("organisation", "SELECT")
    terms = [t.strip() for t in using.split(" AND ")]
    assert sorted(terms) == sorted(
        [
            "current_org_kind() = 'client'",
            "kind = 'tenant'",
            "status = 'active'",
            "deleted_at IS NULL",
        ]
    ), terms
    # every term narrows; an OR anywhere in it would widen
    assert " OR " not in using


def test_the_profile_follows_the_organisation():
    table, command, using = _policy("tenant_profile_select_directory")
    assert (table, command) == ("tenant_profile", "SELECT")
    assert using == "current_org_kind() = 'client' AND org_in_vendor_directory(org_id)"


def test_the_directory_helper_asks_the_same_three_questions():
    header, body = _function("org_in_vendor_directory")
    assert "RETURNS boolean" in header
    assert "SECURITY DEFINER" in header and "SET search_path = public" in header
    for term in (
        "o.id = p_org_id",
        "o.kind = 'tenant'",
        "o.status = 'active'",
        "o.deleted_at IS NULL",
    ):
        assert term in body, term
    assert " OR " not in body


@pytest.mark.parametrize("fn", ["org_in_vendor_directory(uuid)", "partner_performance(uuid[])"])
def test_the_functions_are_not_public(fn):
    assert f"REVOKE EXECUTE ON FUNCTION {fn} FROM PUBLIC;" in CODE
    assert f"GRANT EXECUTE ON FUNCTION {fn} TO sourcehub_app, sourcehub_readonly;" in CODE


def test_expertise_has_a_backstop():
    assert (
        "CHECK (public_profile->'expertise' IS NULL "
        "OR jsonb_typeof(public_profile->'expertise') = 'object')"
    ) in CODE


# ---------------------------------------------------------------------------
# partner_performance: numbers, and only numbers
# ---------------------------------------------------------------------------

FIGURES = {
    "partner_org_id": "uuid",
    "contracts_completed": "integer",
    "on_time_pct": "smallint",
    "accepted_first_time_pct": "smallint",
    "qa_pass_pct": "smallint",
    "rating_avg": "numeric(2,1)",
    "rating_count": "integer",
    "rating_1": "integer",
    "rating_2": "integer",
    "rating_3": "integer",
    "rating_4": "integer",
    "rating_5": "integer",
}


def _returns() -> dict[str, str]:
    header, _ = _function("partner_performance")
    m = re.search(r"RETURNS TABLE \((.*?)\) LANGUAGE", header)
    assert m, header
    cols = {}
    for part in re.split(r",\s*(?![^()]*\))", m.group(1)):
        name, _, kind = part.strip().partition(" ")
        cols[name] = kind.strip()
    return cols


def test_it_returns_aggregates_only():
    cols = _returns()
    assert cols == FIGURES
    # One id, to say whose figures they are. Everything else is a number: no
    # text to carry a comment or a name, no date to say when, no second uuid
    # to say for whom.
    assert [n for n, k in cols.items() if k == "uuid"] == ["partner_org_id"]
    assert {k for n, k in cols.items() if n != "partner_org_id"} <= {
        "integer",
        "smallint",
        "numeric(2,1)",
    }


def test_it_runs_as_the_owner_with_a_pinned_search_path():
    header, _ = _function("partner_performance")
    assert "LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public" in header


def test_what_it_selects_is_what_it_aggregated():
    _, body = _function("partner_performance")
    m = re.match(r"SELECT (.*?) FROM organisation o ", body)
    assert m, body[:80]
    outputs = [c.strip() for c in m.group(1).split(",")]
    assert outputs[0] == "o.id"
    # every other output is a column of one of the three aggregating subqueries
    assert all(re.fullmatch(r"(done|gate|stars)\.\w+", c) for c in outputs[1:]), outputs
    assert len(outputs) == len(FIGURES)
    for never in ("comment", "client_org_id AS", "reference_code", "title", "value", "note"):
        assert never not in m.group(1), never
    # and nothing in the whole body reads a rating's words or a review's
    assert ".comment" not in body and ".note" not in body


def test_who_it_answers_and_about_whom():
    _, body = _function("partner_performance")
    where = body[body.rindex(") stars WHERE ") :]
    for term in (
        "o.id = ANY (p_org_ids)",
        "o.kind = 'tenant'",
        "o.deleted_at IS NULL",
        "current_org_id() IS NOT NULL",
        "NOT is_worker()",
    ):
        assert f" {term}" in where, term
    assert " OR " not in where


def test_what_counts_as_the_record():
    _, body = _function("partner_performance")
    done = body[body.index("CROSS JOIN LATERAL (") : body.index(") done")]
    for term in ("k.partner_org_id = o.id", "k.status = 'completed'", "k.deleted_at IS NULL"):
        assert term in done, term
    assert "(k.delivered_at AT TIME ZONE 'UTC')::date <= r.delivery_due_on" in done
    assert "WHERE k.delivered_at IS NOT NULL AND r.delivery_due_on IS NOT NULL" in done
    assert "FILTER (WHERE k.disputed_at IS NULL)" in done

    gate = body[body.index(") done") : body.index(") gate")]
    for term in (
        "q.gate = 'gate2_partner'",
        "q.outcome IN ('pass', 'fail')",
        "FILTER (WHERE q.outcome = 'pass')",
        "k.partner_org_id = o.id",
    ):
        assert term in gate, term

    stars = body[body.index(") gate") : body.index(") stars")]
    for term in (
        "g.to_org_id = o.id",
        "k.partner_org_id = o.id",
        "k.deleted_at IS NULL",
        # a score counts when the contract's own buyer gave it
        "g.from_org_id = k.client_org_id",
    ):
        assert term in stars, term


def test_nothing_to_divide_by_is_null_not_zero():
    _, body = _function("partner_performance")
    # three percentages, three guarded denominators
    assert body.count("/ NULLIF(") == 3
    assert "COALESCE" not in body.upper()


# ---------------------------------------------------------------------------
# Shaping the figures
# ---------------------------------------------------------------------------


def test_a_row_becomes_a_performance():
    org_id = uuid.uuid4()
    assert directory.shape(_row(org_id)) == RECORD


def test_a_partner_with_no_work_has_no_percentages():
    empty = directory.shape(
        _row(
            uuid.uuid4(),
            contracts_completed=0,
            on_time_pct=None,
            accepted_first_time_pct=None,
            qa_pass_pct=None,
            rating_avg=None,
            rating_count=0,
            rating_1=0,
            rating_2=0,
            rating_3=0,
            rating_4=0,
            rating_5=0,
        )
    )
    assert empty == directory.NO_RECORD
    assert empty.summary() == {
        "contracts_completed": 0,
        "on_time_pct": None,
        "accepted_first_time_pct": None,
        "qa_pass_pct": None,
        "rating_avg": None,
        "rating_count": 0,
    }


def test_zero_percent_is_a_figure_and_is_kept():
    late = directory.shape(
        _row(uuid.uuid4(), on_time_pct=0, accepted_first_time_pct=0, qa_pass_pct=0)
    )
    assert (late.on_time_pct, late.accepted_first_time_pct, late.qa_pass_pct) == (0, 0, 0)


def test_no_ratings_is_no_average():
    assert (
        directory.shape(_row(uuid.uuid4(), rating_count=0, rating_avg=Decimal("0.0"))).rating_avg
        is None
    )


def test_the_figures_are_plain_numbers():
    out = directory.shape(_row(uuid.uuid4())).detail()
    assert json.loads(json.dumps(out)) == out  # no Decimal, nothing to coerce
    assert isinstance(out["rating_avg"], float) and out["rating_avg"] == 4.6


def test_the_distribution_is_in_the_detail_only_and_reads_five_to_one():
    assert "rating_distribution" not in RECORD.summary()
    assert RECORD.detail()["rating_distribution"] == [
        {"score": 5, "count": 8},
        {"score": 4, "count": 3},
        {"score": 3, "count": 0},
        {"score": 2, "count": 1},
        {"score": 1, "count": 0},
    ]
    assert {
        k: v for k, v in RECORD.detail().items() if k != "rating_distribution"
    } == RECORD.summary()


async def test_one_call_answers_for_the_whole_page():
    a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    session = _Session(figures=[_row(a), _row(b, contracts_completed=2)])
    out = await directory.performance_for(session, [a, b, c, a])
    assert session.asked_for_figures() == [[a, b, c]]  # one call, each id once
    assert out[a] == RECORD and out[b].contracts_completed == 2
    assert c not in out  # not a delivery partner: absent, not an error


async def test_nobody_to_ask_about_asks_nothing():
    session = _Session()
    assert await directory.performance_for(session, []) == {}
    assert session.statements == []


# ---------------------------------------------------------------------------
# What a vendor row may say
# ---------------------------------------------------------------------------

VENDOR_KEYS = {
    "id",
    "reference_code",
    "name",
    "country",
    "hq",
    "partner_since",
    "fair_work_attested",
    "website",
    "description",
    "company_size",
    "founded_year",
    "years_in_business",
    "registered_address",
    "expertise",
    "logo_version",
    "performance",
}


def test_a_vendor_row_is_exactly_the_public_keys():
    org = _partner()
    out = directory.vendor_dict(org, _profile(org), RECORD)
    assert set(out) == VENDOR_KEYS


@pytest.mark.parametrize("detail", [False, True])
def test_no_commercial_value_is_in_a_vendor_row(detail):
    org = _partner()
    dumped = json.dumps(
        directory.vendor_dict(org, _profile(org), RECORD, detail=detail), default=str
    )
    for what, value in SECRETS.items():
        assert value not in dumped, f"{what} leaked"
    for key in (
        "plan",
        "billing_status",
        "suspended_at",
        "suspension_reason",
        "legal_name",
        "residency_region",
        "logo_key",
        "dpa_signed",
        'rating"',
        "on_time_rate",
        "qa_pass_rate",
        "capabilities",
        "status",
        "kind",
    ):
        assert f'"{key}' not in dumped, key


def test_a_vendor_row_never_reads_the_seeded_figures():
    # rating 4.9, on time 99 and QA 98 are what the seed wrote on this partner
    org = _partner()
    out = directory.vendor_dict(org, _profile(org), None)
    leaves = _leaves(out)
    for seeded in (Decimal("4.9"), 4.9, 99, 98):
        assert seeded not in leaves, seeded
    assert out["performance"] == directory.NO_RECORD.summary()


def test_what_a_vendor_row_says():
    org = _partner()
    out = directory.vendor_dict(org, _profile(org), RECORD, today=dt.date(2026, 9, 29))
    assert out["name"] == "NorthStar Delivery Partners"
    assert out["hq"] == "Pune" and out["partner_since"] == dt.date(2024, 3, 1)
    assert out["fair_work_attested"] is True
    assert out["website"] == "https://northstar.example"
    assert out["founded_year"] == 2016 and out["years_in_business"] == 10
    assert out["registered_address"] == {"city": "Pune", "country": "India"}
    assert out["expertise"]["data_types"] == ["video", "image"]
    assert out["expertise"]["other_certifications"] == "TISAX"
    assert out["logo_version"] == "2026-09-28T10:00:00+00:00"
    assert out["performance"] == RECORD.summary()
    assert (
        directory.vendor_dict(org, _profile(org), RECORD, detail=True)["performance"]
        == RECORD.detail()
    )


def test_a_partner_without_a_profile_row_is_still_a_vendor():
    out = directory.vendor_dict(_partner(public_profile={}), None, None)
    assert set(out) == VENDOR_KEYS
    assert out["hq"] is None and out["fair_work_attested"] is False
    assert out["logo_version"] is None and out["years_in_business"] is None
    # the five lists even so: the console's filters read them without asking
    assert out["expertise"] == {
        "data_types": [],
        "domains": [],
        "languages": [],
        "regions": [],
        "certifications": [],
        "other_certifications": None,
    }


def test_no_key_means_no_logo_version():
    org = _partner(public_profile={"logo_updated_at": "2026-09-28T10:00:00+00:00"})
    assert directory.vendor_dict(org, None, None)["logo_version"] is None


@pytest.mark.parametrize(
    "founded,expected", [(2016, 10), (2026, 0), (2027, None), (None, None), ("2016", None)]
)
def test_years_in_business(founded, expected):
    assert directory.years_in_business(founded, dt.date(2026, 9, 29)) == expected


@pytest.mark.parametrize(
    "stored", [None, {}, [], "video", {"data_types": None}, {"data_types": "video"}]
)
def test_expertise_has_one_shape_whatever_is_stored(stored):
    profile = {} if stored is None else {"expertise": stored}
    out = directory.expertise_of(_partner(public_profile=profile))
    assert set(out) == {*vocab.LISTS, "other_certifications"}
    assert all(out[k] == [] for k in vocab.LISTS) or stored == {"data_types": "video"}
    assert all(isinstance(out[k], list) for k in vocab.LISTS)
    assert out["other_certifications"] is None


# ---------------------------------------------------------------------------
# Who may open what
# ---------------------------------------------------------------------------


async def test_the_directory_is_the_active_partners_with_their_figures():
    a, b = _partner(), _partner(reference_code="TN-02", name="Meridian Field Ops")
    session = _Session(rows=[(a, _profile(a)), (b, None)], figures=[_row(a.id)])
    out = await directory.list_vendors(session, _claims(caps={"vendor.read"}))
    assert [v["name"] for v in out] == ["NorthStar Delivery Partners", "Meridian Field Ops"]
    assert out[0]["performance"] == RECORD.summary()
    assert out[1]["performance"] == directory.NO_RECORD.summary()
    assert session.asked_for_figures() == [[a.id, b.id]]
    listing = session.statements[0]
    for term in ("organisation.kind =", "organisation.status =", "organisation.deleted_at IS NULL"):
        assert term in listing, term
    assert all(set(v) == VENDOR_KEYS for v in out)


def _filtered_by(stmt: Any) -> list[Any]:
    """The literal values a statement was filtered by, compiled out of it: a
    filter on the right column with the wrong value is no filter."""
    from sqlalchemy.dialects import postgresql

    return list(stmt.compile(dialect=postgresql.dialect()).params.values())


def test_the_listing_asks_for_active_delivery_partners():
    assert sorted(_filtered_by(directory._listed())) == ["active", "tenant"]
    where = str(directory._listed().whereclause)
    assert "organisation.kind =" in where and "organisation.status =" in where
    assert "organisation.deleted_at IS NULL" in where


async def test_a_caller_who_cannot_browse_opens_only_its_own_page():
    me = uuid.uuid4()
    partner = _claims(org_id=me, caps={"profile.manage"}, role="tenant", kind="tenant")
    session = _Session()
    with pytest.raises(LookupError):
        await directory.get_vendor(session, partner, uuid.uuid4())
    assert session.statements == [], "refused before the database was asked anything"

    org = _partner(id=me)
    session = _Session(rows=[(org, _profile(org))], figures=[_row(me)])
    out = await directory.get_vendor(session, partner, me)
    assert out["id"] == me and out["performance"] == RECORD.detail()


async def test_a_client_opens_any_vendor_the_database_shows_it():
    org = _partner()
    session = _Session(rows=[(org, _profile(org))], figures=[_row(org.id)])
    out = await directory.get_vendor(session, _claims(caps={"vendor.read"}), org.id)
    # the page asked for, among the active delivery partners: not the first one
    asked = _filtered_by(session.asked[0])
    assert org.id in asked and {"active", "tenant"} <= {v for v in asked if isinstance(v, str)}
    assert out["name"] == org.name
    assert "rating_distribution" in out["performance"]
    assert set(out) == VENDOR_KEYS


async def test_a_vendor_the_database_hides_is_not_found():
    # suspended, not a delivery partner, or simply not there: RLS and the
    # listing's own WHERE return no row, and the answer is the same for each
    with pytest.raises(LookupError):
        await directory.get_vendor(_Session(rows=[]), _claims(caps={"vendor.read"}), uuid.uuid4())


def test_an_aggregators_own_page_is_not_a_vendor_page():
    # profile.manage admits an aggregator at the door; its own organisation is
    # not a delivery partner, and the listing's kind filter is what says so
    assert "tenant" in _filtered_by(directory._listed())


# ---------------------------------------------------------------------------
# Wiring
# ---------------------------------------------------------------------------


def _route(method: str, path: str) -> APIRoute:
    for r in vendors_api.router.routes:
        if isinstance(r, APIRoute) and r.path == path and method in r.methods:
            return r
    raise AssertionError(f"no {method} {path}")


def _cells(guard: Any) -> list[Any]:
    return [c.cell_contents for c in guard.__closure__ or ()]


def _guards(route: APIRoute) -> list[Any]:
    return [d.call for d in route.dependant.dependencies]


def test_the_directory_needs_vendor_read():
    assert directory.BROWSE == "vendor.read"
    assert _cells(vendors_api._MAY_BROWSE) == ["vendor.read"]
    assert vendors_api._MAY_BROWSE in _guards(_route("GET", "/vendors"))


def test_one_page_admits_the_partner_looking_at_itself():
    assert ("vendor.read", "profile.manage") in _cells(vendors_api._MAY_OPEN)
    assert vendors_api._MAY_OPEN in _guards(_route("GET", "/vendors/{org_id}"))
    # and the list does not: that guard must not have been swapped for this one
    assert vendors_api._MAY_OPEN not in _guards(_route("GET", "/vendors"))


def test_the_directory_is_read_only():
    routes = [r for r in vendors_api.router.routes if isinstance(r, APIRoute)]
    assert {(tuple(sorted(r.methods)), r.path) for r in routes} == {
        (("GET",), "/vendors"),
        (("GET",), "/vendors/{org_id}"),
    }


def test_the_router_is_mounted():
    # From the OpenAPI schema, not app.routes: an included router is one entry
    # there, so walking it finds no path at all (test_frontend_calls_exist_unit).
    paths = app.openapi()["paths"]
    assert set(paths["/api/v1/vendors"]) == {"get"}
    assert set(paths["/api/v1/vendors/{org_id}"]) == {"get"}


async def test_not_found_is_a_404(monkeypatch):
    from fastapi import HTTPException

    async def missing(*_a, **_k):
        raise LookupError("vendor not found")

    monkeypatch.setattr(directory, "get_vendor", missing)
    with pytest.raises(HTTPException) as e:
        await vendors_api.get_vendor(uuid.uuid4(), _claims(caps={"vendor.read"}), _Session())
    assert e.value.status_code == 404


# ---------------------------------------------------------------------------
# Expertise: from the lists, or not at all
# ---------------------------------------------------------------------------


def test_expertise_from_the_lists_is_accepted():
    e = ExpertiseIn(
        data_types=["video", "image"],
        domains=["retail", "automotive"],
        languages=["eng", "hin"],
        regions=["IN", "US"],
        certifications=["iso_27001", "soc_2"],
        other_certifications="TISAX",
    )
    assert e.data_types == ["video", "image"]  # order kept: it is the partner's
    assert e.other_certifications == "TISAX"


@pytest.mark.parametrize(
    "field,value",
    [
        ("data_types", ["hologram"]),
        ("data_types", ["Video"]),  # the code, not the label
        ("domains", ["retail", "space"]),
        ("languages", ["english"]),
        ("regions", ["in"]),  # ISO codes are upper case
        ("regions", ["India"]),
        ("certifications", ["iso27001"]),
        ("data_types", [""]),
    ],
)
def test_a_value_off_the_list_is_refused(field, value):
    with pytest.raises(ValidationError) as e:
        ExpertiseIn(**{field: value})
    assert "Not on the list" in str(e.value)


@pytest.mark.parametrize("field", sorted(vocab.LISTS))
def test_each_list_has_a_cap(field):
    allowed, most = vocab.LISTS[field]
    assert len(getattr(ExpertiseIn(**{field: list(allowed[:most])}), field)) == most
    if len(allowed) > most:
        with pytest.raises(ValidationError) as e:
            ExpertiseIn(**{field: list(allowed[: most + 1])})
        assert f"Choose at most {most}" in str(e.value)


def test_the_caps_are_the_agreed_ones():
    assert {k: most for k, (_, most) in vocab.LISTS.items()} == {
        "data_types": 5,
        "domains": 8,
        "languages": 34,
        "regions": 60,
        "certifications": 6,
    }
    # a cap above the list's length would be no cap at all
    assert all(most <= len(allowed) for allowed, most in vocab.LISTS.values())


def test_the_same_box_ticked_twice_is_one_claim():
    assert ExpertiseIn(data_types=["video", "image", "video"]).data_types == ["video", "image"]
    # and duplicates do not count towards the cap
    many = list(vocab.DATA_TYPES) + list(vocab.DATA_TYPES)
    assert ExpertiseIn(data_types=many).data_types == list(vocab.DATA_TYPES)


@pytest.mark.parametrize(
    "payload",
    [
        {"colour": ["red"]},  # a key nobody defined
        {"data_types": "video"},  # a value where a list belongs
        {"data_types": [1]},
        {"other_certifications": "x" * 121},
    ],
)
def test_a_malformed_expertise_is_refused(payload):
    with pytest.raises(ValidationError):
        ExpertiseIn.model_validate(payload)


def test_a_blank_line_is_no_line():
    assert ExpertiseIn(other_certifications="   ").other_certifications is None
    assert ExpertiseIn(other_certifications="  TISAX ").other_certifications == "TISAX"
    assert len(ExpertiseIn(other_certifications="x" * 120).other_certifications or "") == 120


def test_a_missing_list_is_an_empty_one():
    assert ExpertiseIn.model_validate({"data_types": None}).data_types == []
    assert ExpertiseIn.model_validate({}).is_empty()
    assert not ExpertiseIn(other_certifications="TISAX").is_empty()
    assert not ExpertiseIn(regions=["IN"]).is_empty()


def test_expertise_is_stored_whole():
    part = public_part(OrgProfilePatch.model_validate({"expertise": {"data_types": ["video"]}}))
    assert part == {
        "expertise": {
            "data_types": ["video"],
            "domains": [],
            "languages": [],
            "regions": [],
            "certifications": [],
        }
    }


def test_every_box_unticked_removes_the_key():
    for payload in ({"expertise": {}}, {"expertise": None}, {"expertise": {"data_types": []}}):
        assert public_part(OrgProfilePatch.model_validate(payload)) == {"expertise": None}, payload
    # and an expertise nobody sent is not touched
    assert "expertise" not in public_part(OrgProfilePatch.model_validate({"website": "acme.com"}))


def test_a_patch_and_an_onboarding_request_validate_it_alike():
    bad = {"expertise": {"data_types": ["hologram"]}}
    for model in (OrgProfilePatch, OnboardingProfileIn):
        with pytest.raises(ValidationError):
            model.model_validate(bad)


def test_expertise_is_a_delivery_partners():
    assert {"tenant": frozenset({"expertise"})} == PUBLIC_KIND_KEYS
    assert foreign_kind_fields("client", {"expertise", "website"}) == ["expertise"]
    assert foreign_kind_fields("tenant", {"expertise", "hq"}) == []
    assert foreign_kind_fields("aggregator", {"expertise"}) == ["expertise"]


def _function_node(path: Path, name: str) -> ast.AsyncFunctionDef | ast.FunctionDef:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.AsyncFunctionDef | ast.FunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found in {path.name}")


def _refuses_a_foreign_field(fn: ast.AST) -> bool:
    """`wrong = foreign_kind_fields(...)` then `if wrong: raise`, both as
    statements of the function itself — not nested under a condition."""
    body = list(fn.body)  # type: ignore[attr-defined]
    for i, stmt in enumerate(body):
        if (
            isinstance(stmt, ast.Assign)
            and isinstance(stmt.value, ast.Call)
            and getattr(stmt.value.func, "id", "") == "foreign_kind_fields"
        ):
            target = stmt.targets[0]
            nxt = body[i + 1] if i + 1 < len(body) else None
            return (
                isinstance(target, ast.Name)
                and isinstance(nxt, ast.If)
                and isinstance(nxt.test, ast.Name)
                and nxt.test.id == target.id
                and any(isinstance(s, ast.Raise) for s in nxt.body)
            )
    return False


def test_a_client_sending_expertise_is_refused_not_stored():
    assert _refuses_a_foreign_field(_function_node(IDENTITY, "update_org_profile"))
    onboarding = SRC / "modules" / "onboarding" / "service.py"
    assert _refuses_a_foreign_field(_function_node(onboarding, "_checked_profile"))


# ---------------------------------------------------------------------------
# The console and the API offer the same lists
# ---------------------------------------------------------------------------


def _ts_codes(path: Path, const: str) -> list[str]:
    src = path.read_text(encoding="utf-8")
    m = re.search(rf"export const {const} = \[(.*?)\] as const;", src, re.S)
    assert m, f"no {const} in {path.name}"
    body = "\n".join(re.sub(r"//.*$", "", line) for line in m.group(1).splitlines())
    pairs = re.findall(r'\[\s*"([^"]+)",\s*"([^"]+)"\s*\]', body)
    assert all(label.strip() for _, label in pairs)
    return [code for code, _ in pairs]


@pytest.mark.parametrize(
    "path,const,server",
    [
        (TS_VOCAB, "DATA_TYPES", vocab.DATA_TYPES),
        (TS_VOCAB, "DOMAINS", vocab.DOMAINS),
        (TS_VOCAB, "CERTIFICATIONS", vocab.CERTIFICATIONS),
        (TS_LANGUAGES, "LANGUAGES", vocab.LANGUAGES),
        (TS_COUNTRIES, "COUNTRIES", vocab.REGIONS),
    ],
)
def test_the_console_offers_what_the_api_accepts(path, const, server):
    console = _ts_codes(path, const)
    assert len(console) == len(set(console)), f"{const} repeats a value"
    assert len(server) == len(set(server))
    assert set(console) == set(server), set(console) ^ set(server)


def test_the_lists_are_the_size_they_were_agreed_at():
    # anti-vacuous: two empty lists are equal
    assert (len(vocab.DATA_TYPES), len(vocab.DOMAINS), len(vocab.CERTIFICATIONS)) == (5, 14, 6)
    assert len(vocab.LANGUAGES) == 34
    assert len(vocab.REGIONS) >= 100


def test_the_console_caps_match_the_apis():
    src = TS_VOCAB.read_text(encoding="utf-8")
    m = re.search(r"export const EXPERTISE_MAX = \{(.*?)\} as const;", src, re.S)
    assert m, "no EXPERTISE_MAX in shared/expertise.ts"
    console = {k: int(v) for k, v in re.findall(r"(\w+):\s*(\d+)", m.group(1))}
    assert console == {k: most for k, (_, most) in vocab.LISTS.items()}
    n = re.search(r"export const OTHER_CERTIFICATIONS_MAX = (\d+);", src)
    assert n and int(n.group(1)) == vocab.OTHER_CERTIFICATIONS_MAX == 120


# ---------------------------------------------------------------------------
# One source everywhere
# ---------------------------------------------------------------------------


def test_a_partners_profile_shows_calculated_figures():
    org = _partner()
    out = identity._org_dict(org, _profile(org), None, RECORD)
    assert out["rating"] == 4.6
    assert out["profile"]["on_time_rate"] == 94
    assert out["profile"]["qa_pass_rate"] == 88
    assert out["performance"] == RECORD.summary()


def test_without_figures_a_partner_shows_none_not_the_seeded_ones():
    org = _partner()  # seeded: rating 4.9, on time 99, QA 98
    out = identity._org_dict(org, _profile(org), None)
    assert out["rating"] is None
    assert out["profile"]["on_time_rate"] is None
    assert out["profile"]["qa_pass_rate"] is None
    assert out["performance"] == directory.NO_RECORD.summary()
    leaves = _leaves(out)
    for seeded in (Decimal("4.9"), 4.9, 99, 98):
        assert seeded not in leaves, seeded


def test_other_kinds_are_untouched():
    client = Organisation(
        id=uuid.uuid4(),
        reference_code="CL-01",
        kind="client",
        name="Acme",
        status="active",
        rating=Decimal("4.2"),
        public_profile={},
    )
    out = identity._org_dict(
        client, ClientProfile(org_id=client.id, industry="Retail"), None, RECORD
    )
    assert out["rating"] == Decimal("4.2")
    assert "performance" not in out
    assert out["profile"]["industry"] == "Retail"
    assert "on_time_rate" not in out["profile"]


def test_a_counterparty_still_sees_no_commercials_beside_the_figures():
    org = _partner()
    viewer = _claims(caps={"vendor.read"})
    out = identity._org_dict(org, _profile(org), viewer, RECORD)
    for key in ("billing_status", "suspended_at", "suspension_reason"):
        assert key not in out
    assert "plan" not in out["profile"]
    assert out["performance"] == RECORD.summary()


async def test_one_organisation_is_answered_with_its_figures():
    org = _partner()
    session = _Session(figures=[_row(org.id)])
    out = await identity._org_out(session, org, _profile(org), None)
    assert session.asked_for_figures() == [[org.id]]
    assert out["performance"] == RECORD.summary() and out["rating"] == 4.6


async def test_a_client_is_answered_without_asking_for_figures():
    client = Organisation(
        id=uuid.uuid4(),
        reference_code="CL-01",
        kind="client",
        name="Acme",
        status="active",
        public_profile={},
    )
    session = _Session()
    out = await identity._org_out(session, client, None, None)
    assert session.statements == [] and "performance" not in out


async def test_a_list_of_partners_is_answered_in_one_call():
    a, b = _partner(), _partner(reference_code="TN-02")
    session = _Session(rows=[(a, _profile(a)), (b, _profile(b))], figures=[_row(a.id)])
    out = await identity.list_orgs_of_kind(session, "tenant", None)
    assert session.asked_for_figures() == [[a.id, b.id]]
    assert out[0]["performance"] == RECORD.summary()
    assert out[1]["rating"] is None and out[1]["profile"]["qa_pass_rate"] is None


async def test_a_list_of_anything_else_asks_for_no_figures():
    agg = Organisation(
        id=uuid.uuid4(),
        reference_code="AG-01",
        kind="aggregator",
        name="Crowd",
        status="active",
        rating=Decimal("4.1"),
        public_profile={},
    )
    session = _Session(rows=[(agg, None)])
    out = await identity.list_orgs_of_kind(session, "aggregator", None)
    assert session.asked_for_figures() == []
    assert out[0]["rating"] == Decimal("4.1")


def _callers_of(path: Path, callee: str) -> set[str]:
    """The top-level functions of a module whose body calls `callee`."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    out = set()
    for fn in tree.body:
        if not isinstance(fn, ast.AsyncFunctionDef | ast.FunctionDef):
            continue
        for node in ast.walk(fn):
            if isinstance(node, ast.Call) and getattr(node.func, "id", "") == callee:
                out.add(fn.name)
    return out


def test_every_organisation_answer_goes_through_the_figures():
    # _org_dict alone cannot look anything up. The only callers allowed to use
    # it directly are the two that bring the figures with them.
    assert _callers_of(IDENTITY, "_org_dict") == {"_org_out", "list_orgs_of_kind"}
    assert _callers_of(IDENTITY, "_org_out") == {
        "get_org",
        "set_org_lifecycle",
        "update_org_profile",
        "set_org_logo",
        "clear_org_logo",
    }


def _sql_literals(path: Path, name: str) -> str:
    fn = _function_node(path, name)
    return " ".join(
        n.value
        for n in ast.walk(fn)
        if isinstance(n, ast.Constant)
        and isinstance(n.value, str)
        and n.value != ast.get_docstring(fn)
    )


def test_the_bid_list_no_longer_joins_the_seeded_rate():
    sql = _sql_literals(MARKETPLACE, "list_proposals")
    assert "FROM proposal p" in sql  # anti-vacuous: this is the query
    assert "tenant_profile" not in sql and "qa_pass_rate" not in sql.replace(
        "partner_qa_pass_rate", ""
    )


def _proposal() -> Proposal:
    return Proposal(
        id=uuid.uuid4(),
        reference_code="PRP-01",
        request_id=uuid.uuid4(),
        partner_org_id=uuid.uuid4(),
        price=Decimal("1000"),
        currency="USD",
        duration_days=10,
        methodology="m",
        status="submitted",
    )


def test_a_bid_row_carries_the_bidders_figures():
    row = marketplace._proposal_row(_proposal(), "NorthStar", RECORD)
    assert row["partner_accepted_first_time"] == 92
    assert row["partner_qa_pass_rate"] == 88
    assert row["partner_rating"] == 4.6 and row["partner_rating_count"] == 12
    assert row["partner_contracts_completed"] == 14


def test_a_bid_row_without_figures_says_so():
    row = marketplace._proposal_row(_proposal())
    assert row["partner_accepted_first_time"] is None and row["partner_qa_pass_rate"] is None
    assert row["partner_rating"] is None
    assert row["partner_rating_count"] == 0 and row["partner_contracts_completed"] == 0


async def test_the_bid_list_reads_every_bidder_in_one_call(monkeypatch):
    from sourcehub.modules.attachments import service as attachments

    async def no_files(*_a, **_k):
        return {}

    monkeypatch.setattr(attachments, "list_for", no_files)
    a, b = uuid.uuid4(), uuid.uuid4()
    bids = [
        {
            "id": uuid.uuid4(),
            "reference_code": f"PRP-0{i}",
            "request_id": uuid.uuid4(),
            "partner_org_id": partner,
            "partner_name": name,
            "price": Decimal("1000"),
            "currency": "USD",
            "duration_days": 10,
            "methodology": "m",
            "notes": None,
            "status": "submitted",
            "submitted_at": None,
        }
        for i, (partner, name) in enumerate([(a, "NorthStar"), (b, "Meridian")], 1)
    ]
    session = _Session(rows=bids, figures=[_row(a)])
    out = await marketplace.list_proposals(session, _claims(caps={"proposal.read"}))
    assert session.asked_for_figures() == [[a, b]]
    assert out[0]["partner_accepted_first_time"] == 92 and out[0]["partner_qa_pass_rate"] == 88
    assert out[1]["partner_accepted_first_time"] is None and out[1]["partner_rating_count"] == 0
