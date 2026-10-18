"""The task dialog's phone-check line is counted in the database, not from
every capture of the task.

The dialog used to load the whole asset list to count warnings; with two
thousand captures that was megabytes for one line of text. check_summary asks
three questions in SQL — how many captures and how many carry checks, every
check by severity and code, and the first eight complaints — under the same
visibility rule as the lists, and never a row more.

Fakes only; no database is opened.

    pytest tests/test_check_summary_unit.py
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest

from sourcehub.api.security import AccessClaims
from sourcehub.modules.media import service as media

ME, TASK = uuid.uuid4(), uuid.uuid4()


def _claims() -> AccessClaims:
    return AccessClaims(
        user_id=uuid.uuid4(), full_name="N", email="n@x.example", org_id=ME, org_kind="tenant",
        org_name="Northstar", role="tenant", scope="owner", capabilities=frozenset({"task.read"}),
        mfa_satisfied=True, must_change_password=False,
    )


class _Rows:
    def __init__(self, rows: list[Any] | None = None, scalar: Any = None):
        self._rows, self._scalar = rows or [], scalar

    def mappings(self) -> _Rows:
        return self

    def all(self) -> list[Any]:
        return list(self._rows)

    def one(self) -> Any:
        return self._rows[0]

    def scalar_one_or_none(self) -> Any:
        return self._scalar


class _Session:
    """Answers the task probe and the three statements; records every one."""

    def __init__(self, *, task_found: bool = True, heads: dict[str, int] | None = None,
                 by: list[dict[str, Any]] | None = None,
                 complaints: list[dict[str, Any]] | None = None):
        self.task_found, self.by, self.complaints = task_found, by or [], complaints or []
        self.heads = heads or {"captures": 0, "with_checks": 0}
        self.calls: list[tuple[str, dict[str, Any]]] = []

    async def execute(self, statement: Any, params: dict[str, Any] | None = None) -> _Rows:
        sql, p = str(statement), dict(params or {})
        self.calls.append((sql, p))
        if sql.startswith("SELECT 1 FROM task"):
            return _Rows(scalar=1 if self.task_found else None)
        if sql.startswith("SELECT count(*) AS captures"):
            return _Rows([self.heads])
        if sql.startswith("SELECT c->>'severity' AS severity"):
            return _Rows(self.by)
        if sql.startswith("SELECT a.id AS asset_id"):
            return _Rows(self.complaints)
        raise AssertionError(f"unexpected statement: {sql[:80]}")


async def _summary(s: _Session) -> dict[str, Any]:
    return await media.check_summary(s, _claims(), TASK)  # type: ignore[arg-type]


async def test_a_task_the_caller_cannot_see_is_not_found():
    s = _Session(task_found=False)
    with pytest.raises(LookupError):
        await _summary(s)
    assert len(s.calls) == 1


async def test_three_statements_under_the_lists_visibility_rule():
    s = _Session()
    await _summary(s)
    statements = s.calls[1:]
    assert len(statements) == 3
    for sql, params in statements:
        assert media._VISIBLE in sql, sql[:60]
        assert "a.task_id = :t" in sql
        assert params == {"t": TASK, "me": ME}
    # every one reads the phone's checks, and only those
    for sql, _ in statements[1:]:
        assert "jsonb_array_elements(coalesce(a.check_results->'device', '[]'::jsonb))" in sql


async def test_the_counts_are_by_severity_and_by_code():
    s = _Session(
        heads={"captures": 40, "with_checks": 31},
        by=[
            {"severity": "warn", "code": "wrong_subject", "n": 3},
            {"severity": "block", "code": "wrong_subject", "n": 1},
            {"severity": "warn", "code": "tilt", "n": 2},
            {"severity": "info", "code": "text_found", "n": 25},
            {"severity": "info", "code": "handset", "n": 31},
        ],
    )
    out = await _summary(s)
    assert out["captures"] == 40 and out["with_checks"] == 31
    assert (out["warnings"], out["blockers"], out["measurements"]) == (5, 1, 56)
    # a measurement is not a complaint
    assert out["complaints_total"] == 6
    assert out["by_code"] == {"handset": 31, "text_found": 25, "tilt": 2, "wrong_subject": 4}


async def test_the_first_eight_complaints_in_gallery_order():
    rows = [{"asset_id": uuid.uuid4(), "filename": f"{i}.jpg", "code": "tilt", "severity": "warn",
             "message": "Tilted", "score": None} for i in range(3)]
    s = _Session(complaints=rows)
    out = await _summary(s)
    sql, _ = s.calls[3]
    assert "c->>'severity' IN ('warn', 'block')" in sql
    assert "WITH ORDINALITY" in sql and sql.rstrip().endswith(", dc.n LIMIT 8")
    assert media._GALLERY_ORDER in sql, "the same order the gallery shows them in"
    assert "CAST(c->>'score' AS double precision) AS score" in sql
    assert out["complaints"] == rows
    assert set(out["complaints"][0]) == {"asset_id", "filename", "code", "severity", "message",
                                         "score"}


async def test_with_no_checks_everything_is_zero_and_the_shape_is_the_frozen_one():
    # frontend/src/api/types.ts CheckSummary: both sides code to these keys
    out = await _summary(_Session(heads={"captures": 3, "with_checks": 0}))
    assert out == {
        "captures": 3, "with_checks": 0, "warnings": 0, "blockers": 0, "measurements": 0,
        "by_code": {}, "complaints_total": 0, "complaints": [],
    }
