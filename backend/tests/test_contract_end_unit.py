"""A contract can be ended by its client, its partner or Ops: db/610, 0066.

Once awarded, a contract could not be ended by anyone: it stayed In Progress
for good, counted as committed spend, stayed open to invoices, and workers
could keep uploading. What this file guards, in the order it would hurt:

  * work going on under an ended contract: a task left live, a new task, a
    delivery or approval landing after the end, a conversation reopened;
  * money: invoices after the end beyond the accepted work, or a fixed price
    claimed in full for work half done;
  * an ending nobody hears about, or one with no reason to act on;
  * a completed contract being ended, or an ended one revived;
  * the SQL file and the migration drifting apart, or a downgrade dropping
    the record of contracts already ended.

The behaviour against a real database was proven on a scratch copy (client,
partner and Ops ending, invoicing after, re-tendering, the guards, and races
with delivery, a new task and a withdrawal).

    pytest tests/test_contract_end_unit.py
"""

from __future__ import annotations

import ast
import re
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from fastapi.routing import APIRoute

from sourcehub.api.v1 import delivery as delivery_api
from sourcehub.api.v1 import marketplace as marketplace_api
from sourcehub.modules.delivery import service
from sourcehub.modules.invoices import service as invoices
from sourcehub.modules.marketplace import service as marketplace
from sourcehub.modules.threads import service as threads
from sourcehub.platform.mail import messages

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "backend" / "src" / "sourcehub"
SQL_TEXT = (ROOT / "db" / "610_contract_end.sql").read_text(encoding="utf-8")
DB250 = (ROOT / "db" / "250_rfp_threads.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0066_contract_end.py"
).read_text(encoding="utf-8")
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SERVICE_TREE = ast.parse((SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8"))
INVOICES_TREE = ast.parse((SRC / "modules" / "invoices" / "service.py").read_text(encoding="utf-8"))
MARKET_TREE = ast.parse((SRC / "modules" / "marketplace" / "service.py").read_text(encoding="utf-8"))
THREADS_TEXT = (SRC / "modules" / "threads" / "service.py").read_text(encoding="utf-8")
STATUS_TS = (ROOT / "frontend" / "src" / "shared" / "status" / "index.ts").read_text(encoding="utf-8")


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


CODE = _strip_comments(SQL_TEXT)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal in the migration"
    return m.group(1)


def _sql_function(name: str) -> str:
    m = re.search(rf"CREATE OR REPLACE FUNCTION {name}\(.*?\n\$fn\$;", CODE, re.S)
    assert m, f"no function {name}"
    return " ".join(m.group(0).split())


def _function(tree: ast.AST, name: str) -> ast.FunctionDef | ast.AsyncFunctionDef:
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found")


def _calls(fn: ast.AST) -> list[str]:
    out: list[tuple[int, int, str]] = []
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            f = node.func
            out.append((node.lineno, node.col_offset,
                        f.attr if isinstance(f, ast.Attribute) else getattr(f, "id", "")))
    return [n for _, _, n in sorted(out)]


def _route(router: Any, path: str, method: str) -> APIRoute:
    return next(
        r for r in router.routes
        if isinstance(r, APIRoute) and r.path == path and method in r.methods
    )


def _capabilities(route: APIRoute) -> set[str]:
    out: set[str] = set()
    for d in route.dependant.dependencies:
        for c in getattr(d.call, "__closure__", None) or ():
            v = c.cell_contents
            out |= set(v) if isinstance(v, tuple) else {v} if isinstance(v, str) else set()
    return out


# ---------------------------------------------------------------------------
# The pure rules
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("status", ["active", "in_qa", "delivered", "disputed"])
def test_a_live_contract_can_end(status):
    assert service.end_contract_problem(status, "CTR-0003") is None


@pytest.mark.parametrize(
    ("status", "says"),
    [("cancelled", "already ended"), ("completed", "is complete"), ("bogus", "cannot end")],
)
def test_anything_else_is_refused_in_words(status, says):
    assert says in service.end_contract_problem(status, "CTR-0003")


@pytest.mark.parametrize(
    ("value", "accepted", "target", "cap"),
    [
        ("1500.00", Decimal(40), 100, Decimal("600.00")),
        ("1000.00", Decimal(1), 3, Decimal("333.33")),  # rounded down, never up
        ("1500.00", Decimal(150), 100, Decimal("1500.00")),  # never more than the value
        ("1500.00", Decimal(0), 100, Decimal("0.00")),
    ],
)
def test_a_fixed_price_ended_early_is_owed_in_proportion(value, accepted, target, cap):
    assert invoices.ended_cap(value, accepted, target) == cap


@pytest.mark.parametrize(("accepted", "target"), [(None, 100), (Decimal(40), None), (Decimal(40), 0)])
def test_an_unmeasurable_share_caps_nothing_here(accepted, target):
    assert invoices.ended_cap("1500.00", accepted, target) is None


def test_an_ended_contract_stays_invoiceable_and_an_ended_rfp_reads_so():
    assert "cancelled" in invoices._INVOICEABLE
    assert marketplace._CONTRACT_TO_REQUEST["cancelled"] == "contract_ended"
    assert 'contract_ended: { label: "Contract ended"' in STATUS_TS
    assert 'cancelled: { label: "Ended", tone: "neutral", owner: null },\n};' in STATUS_TS.replace("\r\n", "\n")


def test_the_conversation_says_why_it_closed():
    assert threads.CLOSED_MESSAGES[threads.CONTRACT_ENDED] == (
        "This conversation is read-only: the contract was ended."
    )
    assert "status NOT IN ('completed', 'cancelled')" in THREADS_TEXT


# ---------------------------------------------------------------------------
# The routes
# ---------------------------------------------------------------------------


def test_the_client_the_partner_and_ops_end_with_capabilities_they_already_hold():
    route = _route(delivery_api.router, "/contracts/{contract_id}/end", "POST")
    assert _capabilities(route) == {"contract.approve", "contract.deliver", "dispute.arbitrate"}


def test_tendering_again_is_guarded_as_drafting_is():
    route = _route(marketplace_api.router, "/requests/{request_id}/retender", "POST")
    assert "rfp.create" in _capabilities(route)


# ---------------------------------------------------------------------------
# Wiring
# ---------------------------------------------------------------------------


def test_the_ending_is_the_database_function_and_everyone_is_told():
    fn = _function(SERVICE_TREE, "end_contract")
    calls = _calls(fn)
    src = ast.unparse(fn)
    assert "end_contract_problem" in calls and "_end_reason" in calls
    assert "contract_end(:c, :r)" in src and "refresh" in calls
    assert calls.index("execute") < calls.index("_announce_end")
    assert "'contract_ended'" in src and "enqueue" in calls and "notify" in calls
    assert "'contract.ended'" in src and "'thread.closed'" in src
    # the party that ended it is not told its own act; Ops ending tells both
    assert "if ops or o != claims.org_id" in src


@pytest.mark.parametrize("name", ["deliver_contract", "dispute_delivery", "approve_delivery"])
def test_the_contracts_writers_lock_it_first_and_refuse_an_ended_one(name):
    fn = _function(SERVICE_TREE, name)
    assert "_lock_contract" in _calls(fn)
    assert "has ended" in ast.unparse(fn)


def test_a_new_task_share_locks_the_contract_and_refuses_an_ended_one():
    src = ast.unparse(_function(SERVICE_TREE, "create_task"))
    assert "_lock_contract(session, contract_id, share=True)" in src
    assert "it takes no new tasks" in src


def test_the_lock_reads_the_row_afresh_and_never_blocks_a_foreign_key_check():
    src = ast.unparse(_function(SERVICE_TREE, "_lock_contract"))
    assert "with_for_update(read=share, key_share=not share)" in src and "populate_existing" in src


def test_a_move_takes_the_contract_before_the_task():
    # create_task share-locks the contract; taking it after the task would
    # wait on an ending that already holds the contract and waits on the task
    calls = _calls(_function(SERVICE_TREE, "move_task"))
    assert calls.index("_lock_contract") < calls.index("_partner_end_check")


def test_only_the_parties_see_what_is_left_to_claim():
    src = ast.unparse(_function(SERVICE_TREE, "get_contract"))
    assert "claims.org_id in (c.client_org_id, c.partner_org_id)" in src and "platform_admin" in src


def test_an_invoice_after_the_end_follows_the_accepted_work():
    fn = _function(INVOICES_TREE, "raise_invoice")
    calls = _calls(fn)
    assert {"ended_share", "ended_cap"} <= set(calls)
    assert "cannot be measured" in ast.unparse(fn)


def test_the_contract_page_shows_what_is_left_to_claim():
    assert "after_end" in _calls(_function(SERVICE_TREE, "get_contract"))


def test_tendering_again_copies_the_rfp_into_a_new_draft_once():
    fn = _function(MARKET_TREE, "retender_request")
    calls = _calls(fn)
    src = ast.unparse(fn)
    assert calls.index("_get_owned") < calls.index("stage_copies")
    assert "Only an RFP whose contract was ended can be tendered again." in src
    assert "retender_of=r.id" in src and "status='draft'" in src
    assert "'request.retendered'" in src
    for kept_out in ("proposals_close_at", "delivery_due_on", "starts_on"):
        assert kept_out not in marketplace._RETENDER_COPY


def test_the_mail_is_registered():
    assert messages.OUTBOX["contract_ended"] is messages.contract_ended


# ---------------------------------------------------------------------------
# The database
# ---------------------------------------------------------------------------


def test_no_enum_change_and_only_the_thread_policy_is_restated():
    assert "ALTER TYPE" not in CODE
    assert re.findall(r"CREATE POLICY (\w+)", CODE) == ["rfp_thread_insert"]
    assert re.findall(r"GRANT\s+\w+", CODE) == ["GRANT  EXECUTE"]


def test_the_end_shape_holds_in_the_database():
    shape = " ".join(CODE.split("ADD CONSTRAINT contract_end_shape CHECK", 1)[1].split(";")[0].split())
    assert "(status = 'cancelled') = (ended_at IS NOT NULL)" in shape
    assert "ended_by_party IN ('client', 'partner', 'ops')" in shape
    assert "btrim(end_reason) <> ''" in shape and "char_length(end_reason) <= 2000" in shape


def test_only_a_live_contract_ends_and_an_ended_one_stays_ended():
    guard = _sql_function("contract_end_guard")
    assert "OLD.status = 'cancelled'" in guard
    assert "OLD.status NOT IN ('active', 'delivered', 'disputed')" in guard
    for col in ("ended_at", "ended_by", "ended_by_org_id", "ended_by_party", "end_reason"):
        assert f"NEW.{col} IS DISTINCT FROM OLD.{col}" in guard, col


def test_an_ended_contract_takes_no_new_task_and_waits_for_one_in_flight():
    guard = _sql_function("task_contract_guard")
    assert "SECURITY DEFINER SET search_path = public" in guard and "FOR SHARE" in guard
    assert "CREATE TRIGGER task_contract_guard BEFORE INSERT ON task" in CODE


def test_no_new_conversation_on_an_ended_contract_and_the_rest_of_the_policy_is_db250s():
    new = " ".join(CODE.split("CREATE POLICY rfp_thread_insert", 1)[1].split(";")[0].split())
    old = " ".join(DB250.split("CREATE POLICY rfp_thread_insert", 1)[1].split(";")[0].split())
    assert new == old.replace("c.status <> 'completed'", "c.status NOT IN ('completed', 'cancelled')")
    flat = " ".join(CODE.split())
    assert "'contract_ended'" in flat.split("rfp_thread_closed_reason_check CHECK", 1)[1].split(";")[0]


def test_contract_end_checks_who_asks_locks_in_order_and_ends_the_work_under_it():
    fn = _sql_function("contract_end")
    assert "SECURITY DEFINER SET search_path = public" in fn
    assert fn.index("FROM contract WHERE id = p_contract AND deleted_at IS NULL FOR NO KEY UPDATE") < fn.index("FROM task")
    assert " FOR UPDATE" not in fn
    assert "WHEN is_platform_admin() THEN 'ops'" in fn
    assert "WHEN v_org = k.client_org_id THEN 'client'" in fn
    assert "WHEN v_org = k.partner_org_id THEN 'partner'" in fn
    assert "status NOT IN ('qa_passed', 'cancelled') ORDER BY created_at, reference_code FOR NO KEY UPDATE" in fn
    assert "task_end(t.id, 'contract_ended', v_reason)" in fn
    assert "closed_reason = 'contract_ended'" in fn
    assert "REVOKE EXECUTE ON FUNCTION contract_end(uuid, text) FROM PUBLIC" in CODE


def test_one_live_copy_per_rfp():
    assert "CREATE UNIQUE INDEX request_retender_key ON request (retender_of)" in CODE
    assert "WHERE retender_of IS NOT NULL AND deleted_at IS NULL" in CODE


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0065():
    assert re.search(r'^revision = "0066"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0065"$', MIGRATION_TEXT, re.M)


def test_the_file_follows_600_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("610_contract_end") == files.index("600_task_end") + 1


def test_no_comment_line_ends_a_statement():
    comments = [ln for ln in SQL_TEXT.splitlines() if ln.strip().startswith("--")]
    assert not [ln for ln in comments if ln.rstrip().endswith(";")]


def test_the_downgrade_refuses_while_anything_ended_and_puts_250_and_580_back():
    down = _literal("_DOWN")
    assert "FROM contract WHERE status = 'cancelled'" in down
    assert "closed_reason = 'contract_ended'" in down and "retender_of IS NOT NULL" in down
    assert down.index("RAISE EXCEPTION") < down.index("DROP FUNCTION IF EXISTS contract_end")
    old = " ".join(DB250.split("CREATE POLICY rfp_thread_insert", 1)[1].split(";")[0].split())
    back = " ".join(down.split("CREATE POLICY rfp_thread_insert", 1)[1].split(";")[0].split())
    assert back == old
    assert "OR closed_reason IN ('awarded_elsewhere', 'contract_completed', 'request_cancelled'));" in down
    for drop in (
        "DROP INDEX IF EXISTS request_retender_key",
        "ALTER TABLE request DROP COLUMN IF EXISTS retender_of",
        "DROP TRIGGER IF EXISTS task_contract_guard ON task",
        "DROP TRIGGER IF EXISTS contract_end_guard ON contract",
        "DROP CONSTRAINT IF EXISTS contract_end_shape",
        "DROP COLUMN IF EXISTS ended_by_party",
    ):
        assert drop in down, drop
