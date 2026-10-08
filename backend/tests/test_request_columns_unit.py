"""db/340 drops seven request columns and folds people and pilot into json; 0037 carries it.

The two files stay one change (verbatim); the guard runs before anything moves; the
json columns exist before the copy and the twelve columns go only after it; the pilot
rule moves into the json; the downgrade brings the twelve back; and the backend reads
and writes the json columns, never the dropped ones.
"""

from __future__ import annotations

import ast
import datetime as dt
import re
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from sourcehub.api.v1.marketplace import RequestIn
from sourcehub.modules.marketplace import service
from sourcehub.modules.marketplace.models import Request

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "340_request_columns.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0037_request_columns.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
DROPPED = (
    "geography", "spec_quality", "sampling_frame", "people_headcount", "people_training",
    "people_experience", "people_certification", "residency_region", "contact_user_id",
    "proposal_requirements", "pilot_quantity", "pilot_due_on",
)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0037", "exec"), ns)
    return ns["_statements"](ddl)


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0036():
    assert re.search(r'^revision = "0037"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0036"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_330_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    at = listed.index("340_request_columns")
    assert listed[at - 1] == "330_onboarding_decisions"
    assert all(int(name[:3]) > 340 for name in listed[at + 1 :])


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/340", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_the_guard_whole():
    stmts = _statements(_literal("_UP")) + _statements(_literal("_DOWN"))
    for stmt in stmts:
        assert stmt.count("$fn$") in (0, 2), stmt[:200]
    blocks = [s for s in stmts if "DO $fn$" in s]
    assert len(blocks) == 1  # the guard
    assert "RAISE EXCEPTION" in blocks[0] and "ALTER" not in blocks[0]


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
def test_the_guard_runs_first_and_the_columns_go_last():
    guard = SQL_TEXT.index("RAISE EXCEPTION '340:")
    add = SQL_TEXT.index("ADD COLUMN people_requirements")
    copy = SQL_TEXT.index("UPDATE request SET")
    new_rule = SQL_TEXT.index("ADD CONSTRAINT request_pilot_shape")
    first_drop = SQL_TEXT.index("DROP COLUMN")
    assert guard < add < copy < new_rule < first_drop
    assert SQL_TEXT.index("DROP CONSTRAINT request_pilot_shape") < new_rule


def test_every_dropped_column_is_dropped_and_comes_back_on_downgrade():
    down = _literal("_DOWN")
    for col in DROPPED:
        assert f"DROP COLUMN {col};" in SQL_TEXT, col
        assert re.search(rf"ADD COLUMN {col} ", down), col
    for col in ("people_requirements", "pilot"):
        assert f"ADD COLUMN {col} jsonb" in SQL_TEXT
        assert f"DROP COLUMN {col};" in down


def test_the_backfill_holds_the_updated_at_trigger_off():
    copy = SQL_TEXT[SQL_TEXT.index("DISABLE TRIGGER request_updated_at"):]
    assert copy.index("UPDATE request SET") < copy.index("ENABLE TRIGGER request_updated_at")


# ---------------------------------------------------------------------------
# The backend reads and writes the json columns, never the dropped ones
# ---------------------------------------------------------------------------
def test_the_model_maps_the_json_columns_and_none_of_the_dropped():
    cols = set(Request.__table__.columns.keys())
    assert {"people_requirements", "pilot", "pilot_required"} <= cols
    assert not cols & set(DROPPED)
    assert len(cols) == 47


def test_none_reaches_the_database_as_sql_null():
    # Plain JSONB writes None as the JSON value null, which request_pilot_shape and
    # request_people_requirements_shape refuse: a draft with no pilot or no crew
    # requirements would fail to save.
    for col in ("people_requirements", "pilot"):
        assert Request.__table__.columns[col].type.none_as_null, col


def test_no_backend_code_names_a_dropped_request_column():
    for path in (SRC / "modules" / "marketplace").glob("*.py"):
        text = path.read_text(encoding="utf-8")
        for col in DROPPED:
            assert not re.search(rf"\b{col}\b", text), f"{path.name} names {col}"
    api = (SRC / "api" / "v1" / "marketplace.py").read_text(encoding="utf-8")
    for col in DROPPED:
        assert not re.search(rf"\b{col}\b", api), f"api names {col}"


def _body(**over: Any) -> dict[str, Any]:
    base: dict[str, Any] = {"title": "Laptop clips", "category": "video"}
    base.update(over)
    return base


def test_a_required_pilot_needs_a_size():
    with pytest.raises(ValidationError):
        RequestIn(**_body(pilot_required=True))
    with pytest.raises(ValidationError):
        RequestIn(**_body(pilot_required=True, pilot={"quantity": 0}))
    ok = RequestIn(**_body(pilot_required=True, pilot={"quantity": 4, "due_on": "2026-10-31"}))
    assert ok.pilot is not None and ok.pilot.quantity == 4


def test_a_pilot_that_is_not_required_is_cleared():
    body = RequestIn(**_body(pilot_required=False, pilot={"quantity": 4}))
    assert body.pilot is None
    assert service._pilot_terms(body.model_dump()) is None


def test_the_pilot_is_stored_as_json():
    body = RequestIn(**_body(pilot_required=True, pilot={"quantity": 100, "due_on": "2026-10-15"}))
    assert service._pilot_terms(body.model_dump()) == {"quantity": 100, "due_on": "2026-10-15"}
    body = RequestIn(**_body(pilot_required=True, pilot={"quantity": 5}))
    assert service._pilot_terms(body.model_dump()) == {"quantity": 5}


def test_crew_requirements_keep_only_what_was_filled():
    body = RequestIn(**_body(people_requirements={
        "training": "  Two hours on the app  ", "experience": "", "certification": "   "}))
    assert service._people_requirements(body.model_dump()) == {"training": "Two hours on the app"}
    blank = RequestIn(**_body(people_requirements={"training": " ", "experience": None}))
    assert service._people_requirements(blank.model_dump()) is None
    assert service._people_requirements(RequestIn(**_body()).model_dump()) is None


def test_only_acceptance_and_compliance_keep_a_server_default():
    assert set(service._DEFAULTS) == {"acceptance", "compliance_notes"}


def _request(**over: Any) -> Request:
    base: dict[str, Any] = dict(
        id=uuid.uuid4(), reference_code="RFP-1007", client_org_id=uuid.uuid4(), title="TestSPec",
        category="image", status="published", currency="USD", budget_disclosed=True,
        pricing_basis="per_unit", pricing_unit="records", pricing_block=100, pricing_quantity=2000,
        budget_amount=Decimal("10.00"), pilot_required=True,
        pilot={"quantity": 100, "due_on": "2026-10-15"},
        people_requirements={"training": "Capture app course"},
        proposals_close_at=dt.datetime(2026, 10, 9, 8, 12, tzinfo=dt.timezone.utc),
    )
    base.update(over)
    return Request(**base)


def test_the_response_carries_pilot_and_crew_and_none_of_the_dropped():
    row = service._row(_request(), "published", 0,
                       now=dt.datetime(2026, 10, 8, tzinfo=dt.timezone.utc))
    assert row["pilot"] == {"required": True, "quantity": 100, "due_on": "2026-10-15"}
    assert row["people_requirements"] == {"training": "Capture app course"}
    for key in ("geography", "proposal_requirements", "contact_user_id", "people"):
        assert key not in row, key
    assert "quality" not in row["spec"] and "sampling_frame" not in row["spec"]


def test_no_pilot_and_no_crew_read_as_empty():
    row = service._row(_request(pilot_required=False, pilot=None, people_requirements=None),
                       "published", 0, now=dt.datetime(2026, 10, 8, tzinfo=dt.timezone.utc))
    assert row["pilot"] == {"required": False, "quantity": None, "due_on": None}
    assert row["people_requirements"] is None
