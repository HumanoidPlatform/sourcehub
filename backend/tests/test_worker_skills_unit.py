"""The worker-skill vocabulary, in all four places it is written by hand.

There is no codegen here and the OpenAPI pipeline is unbuilt, so the same nine
values are transcribed into a SQL CHECK, a Python Literal, a TypeScript union
and a list of labels — and nothing in the repo compares them. A drift shows up
as a 422 the console cannot explain, or an IntegrityError 500 out of Postgres.

Order is deliberately NOT compared. features/marketplace/vocabularies.ts states
the rule for these lists: "Order is presentation order, not the constraint's."
The TS labels lead with shelf capture because that is what this crowd does most.

    pytest tests/test_worker_skills_unit.py
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import get_args

from sourcehub.api.v1.network import Skill

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "190_worker_skills.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0020_worker_skills.py"
TS_TYPES = ROOT / "frontend" / "src" / "api" / "types.ts"
TS_VOCAB = ROOT / "frontend" / "src" / "features" / "network" / "vocabularies.ts"

PYTHON = set(get_args(Skill))


def _check_values(text: str) -> set[str]:
    """The values inside `CHECK (skills <@ ARRAY[...])`."""
    m = re.search(r"CHECK \(skills <@ ARRAY\[(.*?)\]\)", text, re.S)
    assert m, "no skills CHECK constraint found"
    return set(re.findall(r"'([a-z_]+)'", m.group(1)))


def test_python_literal_has_the_nine():
    assert len(PYTHON) == 9, PYTHON


def test_the_sql_check_matches_the_python_literal():
    assert _check_values(SQL.read_text(encoding="utf-8")) == PYTHON


def test_the_migration_matches_the_sql():
    # The two are meant to be verbatim copies; this catches an edit to one.
    assert _check_values(MIGRATION.read_text(encoding="utf-8")) == PYTHON


def test_the_typescript_union_matches():
    src = TS_TYPES.read_text(encoding="utf-8")
    m = re.search(r"export type Skill\s*=(.*?);", src, re.S)
    assert m, "no Skill union in api/types.ts"
    assert set(re.findall(r'"([a-z_]+)"', m.group(1))) == PYTHON


def test_every_value_has_a_label_and_no_label_is_orphaned():
    src = TS_VOCAB.read_text(encoding="utf-8")
    m = re.search(r"export const SKILLS.*?=\s*\[(.*?)\];", src, re.S)
    assert m, "no SKILLS list in features/network/vocabularies.ts"
    pairs = re.findall(r'\{\s*value:\s*"([a-z_]+)",\s*label:\s*"([^"]+)"', m.group(1))
    assert {v for v, _ in pairs} == PYTHON
    # a blank label would render as an empty cell rather than a readable one
    assert all(label.strip() for _, label in pairs)


def test_the_old_column_is_gone_from_both_schema_paths():
    # skill -> skills was a rename, not a retype, which is what turned the two
    # silent rendering bugs in assignments.tsx into compile errors.
    for path in (SQL, MIGRATION):
        assert "DROP COLUMN skill;" in path.read_text(encoding="utf-8"), path


def test_invite_worker_is_dropped_before_it_is_recreated():
    # A changed signature cannot be CREATE OR REPLACEd: that leaves an overload
    # behind and the call becomes ambiguous.
    for path in (SQL, MIGRATION):
        text = path.read_text(encoding="utf-8")
        drop = text.index("DROP FUNCTION invite_worker(citext,text,text,text,boolean")
        create = text.index("CREATE OR REPLACE FUNCTION invite_worker(")
        assert drop < create, path
        assert "invite_worker(citext,text,text,text[],boolean,uuid,text,interval) TO sourcehub_app" in text
