"""A client can cancel a published request and delete a draft: db/580, 0063.

Nothing ever wrote request.status = 'cancelled'. A request that drew no bids
read Published for ever, and bids on one its client had given up on stayed
Submitted. What this file guards, in the order it would hurt:

  * a cancelled request still being awarded, or bid on, or having its
    deadline moved, including by a call already in flight when the cancel
    lands (the window lock and the row lock);
  * a bidder not being told, or told nothing they can act on (the reason is
    required, kept on the request, and sent with the notice);
  * the cancelled state not holding: the database refuses to cancel anything
    but a published request, and refuses to un-cancel one;
  * a draft being deleted for real, or anything published being deleted;
  * the SQL file and the migration drifting apart, or a downgrade dropping
    the reasons of requests already cancelled.

conftest.py's database fixtures raise NotImplementedError, so, as in
test_bidding_deadline_unit.py, the pure parts are tested directly and the
wiring is read off the AST and the route table.

    pytest tests/test_request_cancel_unit.py
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from sourcehub.api.v1 import marketplace as marketplace_api
from sourcehub.api.v1.marketplace import CancelIn
from sourcehub.db import types as db_types
from sourcehub.modules.marketplace import service
from sourcehub.modules.threads import service as threads

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "backend" / "src" / "sourcehub"
SQL_TEXT = (ROOT / "db" / "580_request_cancel.sql").read_text(encoding="utf-8")
DB250 = (ROOT / "db" / "250_rfp_threads.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0063_request_cancel.py"
).read_text(encoding="utf-8")
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SERVICE_TREE = ast.parse(
    (SRC / "modules" / "marketplace" / "service.py").read_text(encoding="utf-8")
)
THREADS_TREE = ast.parse((SRC / "modules" / "threads" / "service.py").read_text(encoding="utf-8"))
SWEEP_TEXT = (SRC / "modules" / "marketplace" / "sweep.py").read_text(encoding="utf-8")
STATUS_TS = (ROOT / "frontend" / "src" / "shared" / "status" / "index.ts").read_text(
    encoding="utf-8"
)


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


CODE = _strip_comments(SQL_TEXT)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal in the migration"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0063", "exec"), ns)
    return ns["_statements"](ddl)


def _function(tree: ast.AST, name: str) -> ast.FunctionDef | ast.AsyncFunctionDef:
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found")


def _calls(fn: ast.AST) -> set[str]:
    out: set[str] = set()
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            f = node.func
            out.add(f.attr if isinstance(f, ast.Attribute) else getattr(f, "id", ""))
    return out


def _strings(fn: ast.AST) -> set[str]:
    return {
        n.value for n in ast.walk(fn) if isinstance(n, ast.Constant) and isinstance(n.value, str)
    }


def _audit_events(fn: ast.AST) -> set[str]:
    out: set[str] = set()
    for node in ast.walk(fn):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "log"
            and getattr(node.func.value, "id", "") == "audit"
            and len(node.args) > 1
            and isinstance(node.args[1], ast.Constant)
        ):
            out.add(node.args[1].value)
    return out


def _assigned(fn: ast.AST, attr: str) -> list[Any]:
    """The constants assigned to <something>.<attr> in a function."""
    return [
        node.value.value
        for node in ast.walk(fn)
        if isinstance(node, ast.Assign)
        and any(isinstance(t, ast.Attribute) and t.attr == attr for t in node.targets)
        and isinstance(node.value, ast.Constant)
    ]


def _route(path: str, method: str) -> APIRoute:
    return next(
        r
        for r in marketplace_api.router.routes
        if isinstance(r, APIRoute) and r.path == path and method in r.methods
    )


def _capabilities(route: APIRoute) -> list[Any]:
    return [
        c.cell_contents
        for d in route.dependant.dependencies
        for c in (getattr(d.call, "__closure__", None) or ())
    ]


# ---------------------------------------------------------------------------
# The pure rules
# ---------------------------------------------------------------------------


def test_a_published_request_without_a_contract_can_be_cancelled():
    assert service.cancel_problem("published", has_contract=False) is None


@pytest.mark.parametrize(
    ("stored", "has_contract", "says"),
    [
        ("draft", False, "delete it"),
        ("published", True, "has a contract"),
        ("accepted", True, "has a contract"),
        # no contract, yet not published: say what it is, not that it has one
        ("accepted", False, "is accepted cannot be cancelled"),
        ("proposals_received", False, "is proposals received cannot be cancelled"),
        ("cancelled", False, "already cancelled"),
    ],
)
def test_anything_else_is_refused_with_a_reason(stored, has_contract, says):
    problem = service.cancel_problem(stored, has_contract)
    assert problem and says in problem


@pytest.mark.parametrize("reason", ["", "   ", "ab", " ab ", "x" * 2001])
def test_a_reason_must_be_a_few_words_and_not_a_book(reason):
    assert service.cancel_reason_problem(reason)


@pytest.mark.parametrize("reason", ["abc", "No longer needed.", "x" * 2000])
def test_a_few_words_will_do(reason):
    assert service.cancel_reason_problem(reason) is None


def test_the_shortest_reason_is_the_dialogs():
    # ReasonDialog's default minLength (frontend/src/shared/reason-dialog.tsx)
    dialog = ROOT / "frontend" / "src" / "shared" / "reason-dialog.tsx"
    assert f"minLength = {service.MIN_CANCEL_REASON}," in dialog.read_text(encoding="utf-8")


def test_only_a_draft_can_be_deleted():
    assert service.delete_problem("draft") is None
    for stored in ("published", "accepted", "cancelled"):
        problem = service.delete_problem(stored)
        assert problem and "Cancel a published RFP" in problem


def test_the_reason_limit_is_the_checks():
    assert service.MAX_CANCEL_REASON == 2000
    assert "char_length(cancel_reason) <= 2000" in CODE


@pytest.mark.parametrize("reason", ["", "   ", "ab", "x" * 2001])
def test_a_blank_short_or_overlong_reason_is_a_422_at_the_door(reason):
    with pytest.raises(ValidationError):
        CancelIn(reason=reason)


def test_a_good_reason_arrives_trimmed():
    assert CancelIn(reason="  Budget withdrawn.  ").reason == "Budget withdrawn."
    assert CancelIn(reason="x" * 2000).reason


# ---------------------------------------------------------------------------
# The routes
# ---------------------------------------------------------------------------


def test_cancelling_is_guarded_as_publishing_is():
    route = _route("/requests/{request_id}/cancel", "POST")
    assert "rfp.publish" in _capabilities(route)


def test_deleting_a_draft_is_guarded_as_drafting_is():
    route = _route("/requests/{request_id}", "DELETE")
    assert "rfp.create" in _capabilities(route)
    assert route.status_code == 204


# ---------------------------------------------------------------------------
# Wiring: cancelling
# ---------------------------------------------------------------------------


def test_a_cancel_waits_for_a_bid_or_deadline_change_in_flight_and_locks_the_row():
    fn = _function(SERVICE_TREE, "cancel_request")
    assert {"_lock_window", "with_for_update", "cancel_problem"} <= _calls(fn)


def test_a_cancel_stamps_the_request_and_releases_every_submitted_bid():
    fn = _function(SERVICE_TREE, "cancel_request")
    assert "cancelled" in _assigned(fn, "status")  # the request and each bid
    for stamp in ("cancelled_at", "cancelled_by", "cancel_reason", "decided_at"):
        assert any(
            isinstance(n, ast.Assign)
            and any(isinstance(t, ast.Attribute) and t.attr == stamp for t in n.targets)
            for n in ast.walk(fn)
        ), stamp
    assert "submitted" in _strings(fn)  # only bids still standing


def test_a_cancel_tells_every_bidder_closes_the_conversations_and_is_audited():
    fn = _function(SERVICE_TREE, "cancel_request")
    assert "notify" in _calls(fn)
    assert "close_for_cancel" in _calls(fn)
    assert _audit_events(fn) == {"request.cancelled"}


def test_a_partner_that_withdrew_is_told_too():
    # it may still mean to respond again; its bid stays withdrawn
    fn = _function(SERVICE_TREE, "cancel_request")
    assert "withdrawn" in _strings(fn)


def test_a_reject_waits_for_a_cancel_in_flight():
    # otherwise a released bid could also end 'rejected', told twice
    fn = _function(SERVICE_TREE, "reject_proposal")
    assert {"_lock_window", "refresh"} <= _calls(fn)


@pytest.mark.parametrize("name", ["_get_owned", "update_request"])
def test_publishing_or_editing_a_draft_waits_for_a_delete_in_flight(name):
    # _get_owned is what publish_request reads the draft through
    assert "with_for_update" in _calls(_function(SERVICE_TREE, name))
    assert "_get_owned" in _calls(_function(SERVICE_TREE, "publish_request"))


def test_a_first_question_waits_for_a_cancel_in_flight():
    # without it a thread opened mid-cancel stayed open on a cancelled RFP
    assert "lock_bidding_window" in _calls(_function(THREADS_TREE, "open_thread"))
    assert service.lock_bidding_window is service._lock_window


def test_award_waits_for_a_cancel_and_refuses_a_cancelled_rfp():
    fn = _function(SERVICE_TREE, "award")
    assert {"_lock_window", "with_for_update", "refresh"} <= _calls(fn)
    assert "This RFP was cancelled; its bids can no longer be awarded." in _strings(fn)


def test_a_withdrawal_waits_for_a_cancel_in_flight():
    fn = _function(SERVICE_TREE, "withdraw_proposal")
    assert {"_lock_window", "refresh"} <= _calls(fn)


def test_a_cancelled_rfps_deadline_cannot_move():
    fn = _function(SERVICE_TREE, "change_bidding_deadline")
    assert "This RFP was cancelled." in _strings(fn)


def test_the_no_bids_notice_offers_a_way_out():
    assert "let it lapse" not in SWEEP_TEXT
    assert "or cancel the RFP." in SWEEP_TEXT


# ---------------------------------------------------------------------------
# Wiring: deleting a draft
# ---------------------------------------------------------------------------


def test_a_draft_is_deleted_softly_and_audited():
    fn = _function(SERVICE_TREE, "delete_draft")
    assert "delete_problem" in _calls(fn)
    assert "with_for_update" in _calls(fn)
    assert "delete" not in _calls(fn)  # deleted_at, never a DELETE
    assert any(
        isinstance(n, ast.Assign)
        and any(isinstance(t, ast.Attribute) and t.attr == "deleted_at" for t in n.targets)
        for n in ast.walk(fn)
    )
    assert _audit_events(fn) == {"request.deleted"}


# ---------------------------------------------------------------------------
# The conversations
# ---------------------------------------------------------------------------


def test_threads_know_the_new_close_reason():
    assert threads.REQUEST_CANCELLED == "request_cancelled"
    assert threads.closed_message("request_cancelled") == (
        "This conversation is read-only: the client cancelled the request."
    )
    assert "'request_cancelled'" in CODE


def test_partners_who_only_asked_questions_are_told_and_bidders_not_twice():
    fn = _function(THREADS_TREE, "close_for_cancel")
    assert "_close_threads" in _calls(fn)
    assert any(
        isinstance(n, ast.Compare)
        and any(isinstance(op, ast.NotIn) for op in n.ops)
        and any(getattr(c, "id", "") == "already_told" for c in n.comparators)
        for n in ast.walk(fn)
    )
    assert _audit_events(fn) == {"thread.closed"}


# ---------------------------------------------------------------------------
# The new bid status, everywhere it is named
# ---------------------------------------------------------------------------


def test_the_api_and_the_console_know_the_new_bid_status():
    assert "cancelled" in db_types.ProposalStatus.enums
    block = STATUS_TS[STATUS_TS.index("export const proposalStatus") :]
    block = block[: block.index("};")]
    assert 'cancelled: { label: "RFP cancelled"' in block


# ---------------------------------------------------------------------------
# The SQL file and the migration
# ---------------------------------------------------------------------------


def test_the_enum_value_comes_first_and_alone():
    up = _statements(_literal("_UP"))
    assert up[0].endswith("ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'cancelled';")
    assert sum("ADD VALUE" in s for s in up) == 1


def test_the_migration_commits_the_enum_value_before_anything_names_it():
    tree = ast.parse(MIGRATION_TEXT)
    upgrade = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "upgrade")
    assert "autocommit_block" in _calls(upgrade)


def test_the_cancel_shape_holds_in_the_database():
    assert "CONSTRAINT request_cancel_shape CHECK" in CODE
    assert "(status = 'cancelled') = (cancelled_at IS NOT NULL)" in CODE
    assert "btrim(cancel_reason) <> ''" in CODE


def test_the_database_refuses_to_cancel_anything_but_a_published_request_or_to_uncancel():
    assert "CREATE TRIGGER request_cancel_guard BEFORE UPDATE ON request" in CODE
    guard = CODE[CODE.index("FUNCTION request_cancel_guard()") : CODE.index("CREATE TRIGGER")]
    assert "a cancelled request stays cancelled" in guard
    assert "only a published request can be cancelled" in guard
    for col in ("status", "cancelled_at", "cancelled_by", "cancel_reason"):
        assert f"NEW.{col} IS DISTINCT FROM OLD.{col}" in guard


def test_the_database_ties_a_cancelled_bid_to_a_cancelled_request():
    assert "CREATE TRIGGER proposal_cancel_guard BEFORE UPDATE ON proposal" in CODE
    guard = CODE[CODE.index("FUNCTION proposal_cancel_guard()") :]
    guard = guard[: guard.index("CREATE TRIGGER")]
    assert "SECURITY DEFINER SET search_path = public" in guard  # no false refusal via RLS
    assert "a bid on a cancelled request stays cancelled" in guard
    assert "only a bid on a cancelled request can be cancelled" in guard
    assert "r.status = 'cancelled'" in guard


def test_no_policy_or_grant_changes():
    # the client already updates its own request and the bids on it (db/100)
    assert "POLICY" not in CODE and "GRANT" not in CODE


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0062():
    assert re.search(r'^revision = "0063"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0062"$', MIGRATION_TEXT, re.M)


def test_the_file_follows_570_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("580_request_cancel") == files.index("570_login_lock_status") + 1


def test_no_comment_line_ends_a_statement():
    comments = [ln for ln in SQL_TEXT.splitlines() if ln.strip().startswith("--")]
    assert not [ln for ln in comments if ln.rstrip().endswith(";")]


def test_the_downgrade_refuses_while_anything_was_cancelled():
    down = _statements(_literal("_DOWN"))
    refusal = down[0]
    assert refusal.startswith("DO $fn$")
    for probe in (
        "FROM request WHERE status = 'cancelled'",
        "FROM proposal WHERE status = 'cancelled'",
        "FROM rfp_thread WHERE closed_reason = 'request_cancelled'",
    ):
        assert probe in refusal, probe


def test_the_downgrade_puts_db250s_thread_reasons_back_and_leaves_the_enum_value():
    down = _literal("_DOWN")
    assert (
        "CHECK (closed_reason IS NULL OR closed_reason IN ('awarded_elsewhere', "
        "'contract_completed'))" in down
    )
    old_comment = DB250[DB250.index("COMMENT ON COLUMN rfp_thread.closed_reason IS") :]
    old_comment = old_comment[: old_comment.index(";") + 1]
    assert old_comment in down
    for col in ("cancel_reason", "cancelled_by", "cancelled_at"):
        assert f"DROP COLUMN IF EXISTS {col}" in down
    for guard in ("proposal_cancel_guard", "request_cancel_guard"):
        assert f"DROP FUNCTION IF EXISTS {guard}()" in down
    assert "proposal_status" not in down  # an enum value cannot be dropped
