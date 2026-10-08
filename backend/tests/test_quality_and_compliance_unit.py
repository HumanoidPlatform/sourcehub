"""db/360 folds the quality bar and the consent terms into two json columns; 0039 carries it.

The two files stay one change (verbatim); the json columns exist before the copy and the
twelve columns go only after it; the 040 vocabularies move into the json checks and agree
with the API's; the downgrade brings the twelve back; and the backend writes each json
value whole and returns exactly the shape the flat columns gave.
"""

from __future__ import annotations

import ast
import datetime as dt
import re
import typing
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

from sourcehub.api.v1 import marketplace as api
from sourcehub.api.v1.marketplace import RequestIn
from sourcehub.modules.marketplace import service
from sourcehub.modules.marketplace.models import Request

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "360_quality_and_compliance.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0039_quality_and_compliance.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SERVICE = ROOT / "backend" / "src" / "sourcehub" / "modules" / "marketplace" / "service.py"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
QUALITY = ("acceptance", "quality_thresholds", "rejection_policy")
CONSENT = ("compliance_notes", "people_in_frame", "minors_policy", "deidentification",
           "regulations", "lawful_basis", "permitted_uses", "partner_reuse_allowed",
           "biometric_processing")
FOLDED = QUALITY + CONSENT
OLD_CHECKS = ("request_people_in_frame_check", "request_minors_policy_check",
              "request_deidentification_check", "request_lawful_basis_check",
              "request_permitted_uses_check")
NOW = dt.datetime(2026, 10, 8, tzinfo=dt.timezone.utc)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0039", "exec"), ns)
    return ns["_statements"](ddl)


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0038():
    assert re.search(r'^revision = "0039"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0038"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_350_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    at = listed.index("360_quality_and_compliance")
    assert listed[at - 1] == "350_capture_batches"
    assert all(int(name[:3]) > 360 for name in listed[at + 1 :])


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/360", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_cuts_whole_statements_and_there_is_no_guard():
    up = _statements(_literal("_UP"))
    down = _statements(_literal("_DOWN"))
    assert not [s for s in up + down if "$fn$" in s]

    def first_sql(stmt: str) -> str:  # a statement keeps the comments above it
        lines = [ln for ln in stmt.splitlines() if ln.strip()]
        return next(ln for ln in lines if not ln.lstrip().startswith("--"))

    assert first_sql(up[0]).startswith("ALTER TABLE request ADD COLUMN quality_bar jsonb")
    assert first_sql(down[0]).startswith("ALTER TABLE request ADD COLUMN compliance_notes text")
    # the two shape checks span many lines; each must reach the splitter whole
    shapes = [s for s in up if "ADD CONSTRAINT request_" in s]
    assert len(shapes) == 2 and all(s.count("(") == s.count(")") for s in shapes)


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
def test_the_columns_go_only_after_the_copy_and_the_new_checks():
    add = SQL_TEXT.index("ADD COLUMN quality_bar")
    copy = SQL_TEXT.index("UPDATE request SET")
    shape = SQL_TEXT.index("ADD CONSTRAINT request_quality_bar_shape")
    first_drop = SQL_TEXT.index("DROP COLUMN")
    assert add < copy < shape < first_drop
    held = SQL_TEXT[SQL_TEXT.index("DISABLE TRIGGER request_updated_at"):]
    assert held.index("UPDATE request SET") < held.index("ENABLE TRIGGER request_updated_at")


def test_every_folded_column_is_copied_dropped_and_comes_back_on_downgrade():
    down = _literal("_DOWN")
    copy = SQL_TEXT[SQL_TEXT.index("UPDATE request SET"):SQL_TEXT.index("ENABLE TRIGGER")]
    for col in FOLDED:
        assert f"'{col}', " in copy, f"{col} is not copied into the json"
        assert f"DROP COLUMN {col};" in SQL_TEXT, col
        assert re.search(rf"ADD COLUMN {col} ", down), col
        assert re.search(rf"\b{col} = ", down), f"{col} is not restored on downgrade"
    for name in OLD_CHECKS:
        assert f"DROP CONSTRAINT {name};" in SQL_TEXT, name
        assert f"ADD CONSTRAINT {name} CHECK" in down, name
    for col in ("quality_bar", "consent_and_compliance"):
        assert f"ADD COLUMN {col} jsonb NOT NULL DEFAULT '{{}}';" in SQL_TEXT
        assert f"DROP COLUMN {col};" in down


def test_the_json_checks_keep_the_api_vocabularies():
    shape = SQL_TEXT[SQL_TEXT.index("ADD CONSTRAINT request_consent_and_compliance_shape"):]
    down = _literal("_DOWN")
    for alias in (api.PeopleInFrame, api.MinorsPolicy, api.LawfulBasis, api.Deidentification,
                  api.PermittedUse):
        for value in typing.get_args(alias):
            assert f"'{value}'" in shape or f'"{value}"' in shape, f"{value} missing from db/360"
            assert f"'{value}'" in down, f"{value} missing from the downgrade's checks"


# ---------------------------------------------------------------------------
# The backend writes each json value whole and reads the old shape back
# ---------------------------------------------------------------------------
def test_the_model_has_the_two_json_columns_and_none_of_the_folded():
    cols = Request.__table__.columns
    names = set(cols.keys())
    assert not names & set(FOLDED)
    assert len(names) == 37
    for col in ("quality_bar", "consent_and_compliance"):
        assert not cols[col].nullable, col
        assert cols[col].server_default is not None, col


def test_no_backend_code_reads_a_folded_column_off_a_request():
    text = SERVICE.read_text(encoding="utf-8")
    for col in FOLDED:
        assert not re.search(rf"\b(r|req|request|Request)\.{col}\b", text), col


def test_award_freezes_the_terms_from_the_json():
    text = SERVICE.read_text(encoding="utf-8")
    assert 'acceptance=(r.quality_bar or {}).get("acceptance")' in text
    assert 'compliance=(r.consent_and_compliance or {}).get("compliance_notes")' in text


def _body(**over: Any) -> dict[str, Any]:
    base: dict[str, Any] = {"title": "TestSPec", "category": "image"}
    base.update(over)
    return RequestIn(**base).model_dump()


FULL = dict(
    acceptance="Sharp, no glare", compliance_notes="Signed releases on file",
    quality_thresholds={"min_pass_rate_pct": 90.4},
    rejection_policy={"max_retakes": 2, "rework_cost_bearer": "partner"},
    people_in_frame="incidental", minors_policy="prohibited", deidentification=["blur_faces"],
    regulations=["GDPR"], lawful_basis="public_task",
    permitted_uses=["model_training", "audit"], partner_reuse_allowed=True,
    biometric_processing=True,
)


def test_the_builders_write_every_key():
    qb = service._quality_bar(_body(**FULL))
    cc = service._consent_and_compliance(_body(**FULL))
    assert tuple(qb) == QUALITY and tuple(cc) == CONSENT
    assert qb["acceptance"] == "Sharp, no glare"
    assert qb["quality_thresholds"]["min_pass_rate_pct"] == 90.4
    assert qb["rejection_policy"]["max_retakes"] == 2
    assert cc["people_in_frame"] == "incidental"
    assert cc["permitted_uses"] == ["model_training", "audit"]
    assert cc["partner_reuse_allowed"] is True and cc["biometric_processing"] is True


def test_empty_answers_take_the_defaults_and_clear_the_rest():
    # an edit that empties the form clears what an earlier save set: the flat
    # columns skipped None and kept the old people in frame, lawful basis,
    # pass rate and rejection policy
    qb = service._quality_bar(_body())
    cc = service._consent_and_compliance(_body())
    assert qb == {"acceptance": "Client review on delivery", "quality_thresholds": {},
                  "rejection_policy": {}}
    assert cc == {"compliance_notes": "None specified", "people_in_frame": None,
                  "minors_policy": None, "deidentification": [], "regulations": [],
                  "lawful_basis": None, "permitted_uses": [], "partner_reuse_allowed": False,
                  "biometric_processing": False}


def _request(**over: Any) -> Request:
    base: dict[str, Any] = dict(
        id=uuid.uuid4(), reference_code="RFP-1007", client_org_id=uuid.uuid4(), title="TestSPec",
        category="image", status="published", currency="USD", budget_disclosed=True,
        pricing_basis="per_unit", pricing_unit="records", pricing_block=100, pricing_quantity=2000,
        budget_amount=Decimal("10.00"), pilot_required=False, pilot=None, people_requirements=None,
        proposals_close_at=dt.datetime(2026, 10, 9, 8, 12, tzinfo=dt.timezone.utc),
    )
    base.update(over)
    return Request(**base)


def test_the_response_keeps_the_shape_the_flat_columns_gave():
    r = _request(quality_bar=service._quality_bar(_body(**FULL)),
                 consent_and_compliance=service._consent_and_compliance(_body(**FULL)))
    row = service._row(r, "published", 0, now=NOW)
    assert row["acceptance"] == "Sharp, no glare"
    assert row["compliance_notes"] == "Signed releases on file"
    assert set(row["quality"]) == {"thresholds", "rejection_policy"}
    assert row["quality"]["thresholds"]["min_pass_rate_pct"] == 90.4
    assert row["quality"]["rejection_policy"]["rework_cost_bearer"] == "partner"
    assert row["compliance"] == {
        "people_in_frame": "incidental", "minors_policy": "prohibited",
        "deidentification": ["blur_faces"], "regulations": ["GDPR"], "lawful_basis": "public_task",
        "permitted_uses": ["model_training", "audit"], "partner_reuse_allowed": True,
        "biometric_processing": True,
    }
    for key in ("quality_bar", "consent_and_compliance"):
        assert key not in row, key


def test_an_empty_json_value_reads_as_the_old_empty_columns():
    row = service._row(_request(quality_bar={}, consent_and_compliance={}), "published", 0, now=NOW)
    assert row["acceptance"] is None and row["compliance_notes"] is None
    assert row["quality"] == {"thresholds": {}, "rejection_policy": {}}
    assert row["compliance"] == {
        "people_in_frame": None, "minors_policy": None, "deidentification": [], "regulations": [],
        "lawful_basis": None, "permitted_uses": [], "partner_reuse_allowed": False,
        "biometric_processing": False,
    }
