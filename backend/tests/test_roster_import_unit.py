"""Importing a crowd roster from a file: what each row becomes, and how a batch is written.

The rows arrive as JSON from the browser, which parsed the spreadsheet. What
this file guards, in the order it would hurt:

  * a row being written when it should not be — a name too short, an address
    that is not one, a duplicate inside the file, an address that belongs to
    someone else on the platform — or an already-rostered address being
    imported again (the "same file twice adds nothing" promise);
  * one bad row taking the rest of its batch with it: the single-add path
    finds a duplicate address only when the insert fails, and without a
    savepoint that aborts the transaction;
  * fifty invitations opening fifty SMTP connections, or fifty audit lines
    each taking the platform-wide audit chain lock;
  * the import routes being reachable without roster.manage, or accepting a
    file larger than the limits the console promises.

conftest.py's database fixtures raise NotImplementedError, so — as every
sibling test does — the pure planner is exercised with fixed inputs and the
wiring is read off the AST and the route table, never off the file's text.

    pytest tests/test_roster_import_unit.py
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest
from fastapi.routing import APIRoute

from sourcehub.api.v1 import network as network_api
from sourcehub.api.v1.network import KNOWN_SKILLS, ImportBatchIn, ImportCheckIn
from sourcehub.modules.network import service

ROOT = Path(__file__).resolve().parents[2]
SERVICE_TREE = ast.parse(
    (ROOT / "backend" / "src" / "sourcehub" / "modules" / "network" / "service.py").read_text(
        encoding="utf-8"
    )
)


def _function(name: str) -> ast.FunctionDef | ast.AsyncFunctionDef:
    for node in ast.walk(SERVICE_TREE):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found")


def _calls(fn: ast.AST) -> list[str]:
    out: list[str] = []
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            f = node.func
            out.append(f.attr if isinstance(f, ast.Attribute) else getattr(f, "id", ""))
    return out


def _audit_events(fn: ast.AST) -> list[str]:
    return [
        node.args[1].value
        for node in ast.walk(fn)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "log"
        and getattr(node.func.value, "id", "") == "audit"
        and len(node.args) > 1
        and isinstance(node.args[1], ast.Constant)
    ]


def plan(rows, *, taken=(), mine=()):
    return service.plan_import(rows, taken=set(taken), mine=set(mine), known_skills=KNOWN_SKILLS)


def row(n: int, **over):
    base = {
        "row": n,
        "display_name": f"Person {n}",
        "email": None,
        "phone": None,
        "skills": [],
        "trained": False,
    }
    base.update(over)
    return base


# ---------------------------------------------------------------------------
# The planner
# ---------------------------------------------------------------------------


def test_a_good_row_is_ready_and_normalised():
    (v,) = plan(
        [
            row(
                2,
                display_name="  Asha   Rao ",
                email="ASHA@Example.COM",
                phone=" +91 9 ",
                skills=["shelf_capture"],
                trained=True,
            )
        ]
    )
    assert v.status == "ready" and v.reasons == ()
    assert v.normalized.display_name == "Asha Rao"
    assert v.normalized.email == "asha@example.com"
    assert v.normalized.phone == "+91 9"
    assert v.normalized.skills == ("shelf_capture",) and v.normalized.trained is True


@pytest.mark.parametrize("name", ["", " ", "A", None])
def test_a_missing_or_one_letter_name_is_an_error(name):
    (v,) = plan([row(2, display_name=name, email="a@example.com")])
    assert v.status == "error" and any("Name" in r for r in v.reasons)


@pytest.mark.parametrize(
    "bad", ["not-an-email", "a@b", "someone@", "@example.com", "a b@example.com"]
)
def test_a_non_address_is_an_error_not_a_422(bad):
    (v,) = plan([row(2, email=bad)])
    assert v.status == "error" and any("Not an email address" in r for r in v.reasons)


def test_the_later_duplicate_in_the_file_is_the_one_marked():
    a, b = plan([row(2, email="a@example.com"), row(3, email="A@EXAMPLE.COM")])
    assert a.status == "ready"
    assert b.status == "error" and "Duplicate of row 2" in b.reasons[0]


def test_an_address_on_my_roster_is_skipped_not_an_error():
    # the "same file twice adds nothing" promise
    (v,) = plan([row(2, email="a@example.com")], taken=["a@example.com"], mine=["a@example.com"])
    assert v.status == "skipped" and v.reasons == ("Already on your roster.",)


def test_an_address_taken_elsewhere_is_an_error():
    (v,) = plan([row(2, email="client@acme.example")], taken=["client@acme.example"])
    assert v.status == "error" and "someone else" in v.reasons[0]


def test_unknown_skills_are_dropped_with_a_warning_and_known_ones_kept():
    (v,) = plan(
        [
            row(
                2,
                email="a@example.com",
                skills=["Shelf Capture", "juggling", "retail_audit", "juggling"],
            )
        ]
    )
    assert v.status == "warning"
    assert v.normalized.skills == ("shelf_capture", "retail_audit")
    assert v.reasons == ("Unknown skill(s) dropped: juggling.",)


def test_no_email_is_imported_with_a_warning_that_says_what_it_means():
    (v,) = plan([row(2, phone="99")])
    assert v.status == "warning"
    assert "cannot be offered work until invited" in v.reasons[0]
    assert v.normalized.phone == "99"


def test_an_error_row_is_never_also_skipped_or_a_warning():
    (v,) = plan(
        [row(2, display_name="X", email="a@example.com", skills=["nope"])], mine=["a@example.com"]
    )
    assert v.status == "error"
    assert not any("roster" in r for r in v.reasons)


def test_a_phone_over_the_column_width_is_an_error():
    (v,) = plan([row(2, phone="9" * 41)])
    assert v.status == "error"


# ---------------------------------------------------------------------------
# The request shapes
# ---------------------------------------------------------------------------


def test_the_file_limit_and_the_batch_limit():
    assert service.IMPORT_CHECK_LIMIT == 1000 and service.IMPORT_BATCH_LIMIT == 100
    one = {"row": 1, "display_name": "A"}
    ImportCheckIn(rows=[one] * 1000)
    with pytest.raises(ValueError):
        ImportCheckIn(rows=[one] * 1001)
    ImportBatchIn(rows=[one] * 100)
    with pytest.raises(ValueError):
        ImportBatchIn(rows=[one] * 101)


def test_a_bad_value_in_one_row_is_that_rows_verdict_not_a_422():
    # strings, not EmailStr / Literal: the model accepts what a spreadsheet says
    body = ImportCheckIn(
        rows=[{"row": 2, "display_name": "A", "email": "nope", "skills": ["juggling"]}]
    )
    assert body.rows[0].email == "nope" and body.rows[0].skills == ["juggling"]


def test_known_skills_are_the_nine():
    assert len(KNOWN_SKILLS) == 9 and "shelf_capture" in KNOWN_SKILLS


# ---------------------------------------------------------------------------
# Wiring
# ---------------------------------------------------------------------------


def test_both_import_routes_require_roster_manage():
    found = 0
    for r in network_api.router.routes:
        if isinstance(r, APIRoute) and r.path in ("/workers/import/check", "/workers/import"):
            found += 1
            caps = [
                c.cell_contents
                for d in r.dependant.dependencies
                for c in (getattr(d.call, "__closure__", None) or ())
            ]
            assert "roster.manage" in caps, r.path
            assert r.methods == {"POST"}
    assert found == 2


def test_the_import_routes_come_before_the_id_routes():
    # "/workers/import" must never be read as /workers/{worker_id}
    paths = [r.path for r in network_api.router.routes if isinstance(r, APIRoute)]
    assert paths.index("/workers/import") < paths.index("/workers/{worker_id}/resend-invitation")


def test_each_row_is_written_in_its_own_savepoint():
    assert "begin_nested" in _calls(_function("import_rows"))


def test_a_batch_audits_once_and_mails_once():
    fn = _function("import_rows")
    assert _audit_events(fn) == ["roster.imported"]
    calls = _calls(fn)
    assert (
        "_send_invitations" in calls
        and "send_mail" not in calls
        and "_send_worker_invitation" not in calls
    )
    assert "send_many" in _calls(_function("_send_invitations"))


def test_the_check_writes_nothing():
    calls = _calls(_function("check_import")) + _calls(_function("_judge"))
    for forbidden in (
        "begin_nested",
        "_create_invited",
        "add_worker",
        "log",
        "notify",
        "send_many",
    ):
        assert forbidden not in calls, forbidden


def test_the_single_invitation_still_audits_and_mails():
    fn = _function("invite_worker")
    assert _audit_events(fn) == ["worker.invited"]
    assert "_send_worker_invitation" in _calls(fn) and "_create_invited" in _calls(fn)


def test_the_check_asks_the_platform_and_the_roster():
    texts = [
        node.args[0].value
        for node in ast.walk(_function("_judge"))
        if isinstance(node, ast.Call)
        and getattr(node.func, "id", None) == "text"
        and node.args
        and isinstance(node.args[0], ast.Constant)
    ]
    assert any("email_is_taken(" in t for t in texts)
    assert any("FROM crowd_worker" in t and "aggregator_org_id = :org" in t for t in texts)


def test_a_roster_only_row_keeps_its_phone():
    fn = _function("add_worker")
    assert "phone" in {a.arg for a in fn.args.args}
    for node in ast.walk(fn):
        if isinstance(node, ast.Call) and getattr(node.func, "id", "") == "CrowdWorker":
            assert "phone" in {k.arg for k in node.keywords}
            return
    raise AssertionError("CrowdWorker(...) not found in add_worker")
