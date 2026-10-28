"""A task can end before it passes QA: db/600, 0065.

Once a partner gave a task to a supplier nothing could take it back, and one
task that never passed QA held up delivery of the whole contract. What this
file guards, in the order it would hurt:

  * work going on under an ended task: a live crowd assignment, an open
    offer, or a submission a late QA verdict brings back to life, including
    by a call already in flight when the ending lands (every writer takes the
    task row first, as task_end() does);
  * an ending nobody hears about, or one with no reason to act on;
  * a task that passed QA being ended, or an ended one revived;
  * an ended task still holding up delivery;
  * the SQL file and the migration drifting apart, or a downgrade dropping
    the reasons of tasks already ended.

conftest.py's database fixtures raise NotImplementedError, so, as in
test_request_cancel_unit.py, the pure parts are tested directly and the wiring
is read off the AST and the route table. The behaviour against a real database
was proven on a scratch copy (decline, hand back, withdraw, move, the guards,
and races between an ending and a start, a verdict or an accept).

    pytest tests/test_task_end_unit.py
"""

from __future__ import annotations

import ast
import re
import types
from pathlib import Path
from typing import Any

import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from sourcehub.api.v1 import delivery as delivery_api
from sourcehub.api.v1.delivery import TaskEndIn, TaskMoveIn
from sourcehub.modules.delivery import service
from sourcehub.platform.mail import messages

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "backend" / "src" / "sourcehub"
SQL_TEXT = (ROOT / "db" / "600_task_end.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0065_task_end.py"
).read_text(encoding="utf-8")
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SERVICE_TEXT = (SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8")
SERVICE_TREE = ast.parse(SERVICE_TEXT)
QA_TREE = ast.parse((SRC / "modules" / "qa" / "service.py").read_text(encoding="utf-8"))
ATTACH_TREE = ast.parse(
    (SRC / "modules" / "attachments" / "service.py").read_text(encoding="utf-8")
)
OVERVIEW_TEXT = (SRC / "modules" / "overview" / "service.py").read_text(encoding="utf-8")
STATUS_TS = (ROOT / "frontend" / "src" / "shared" / "status" / "index.ts").read_text(
    encoding="utf-8"
)
TASK_END_TSX = (
    ROOT / "frontend" / "src" / "features" / "delivery" / "components" / "task-end.tsx"
).read_text(encoding="utf-8")


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
    return m.group(0)


def _function(tree: ast.AST, name: str) -> ast.FunctionDef | ast.AsyncFunctionDef:
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found")


def _calls(fn: ast.AST) -> list[str]:
    """Called names, in source order."""
    out: list[tuple[int, int, str]] = []
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            f = node.func
            out.append((node.lineno, node.col_offset,
                        f.attr if isinstance(f, ast.Attribute) else getattr(f, "id", "")))
    return [n for _, _, n in sorted(out)]


def _strings(fn: ast.AST) -> str:
    return " ".join(
        n.value for n in ast.walk(fn) if isinstance(n, ast.Constant) and isinstance(n.value, str)
    )


def _locked_get_task(fn: ast.AST) -> bool:
    """_get_task(..., lock=True) somewhere in the function."""
    return any(
        isinstance(n, ast.Call)
        and getattr(n.func, "id", "") == "_get_task"
        and any(k.arg == "lock" and getattr(k.value, "value", None) is True for k in n.keywords)
        for n in ast.walk(fn)
    )


def _route(path: str, method: str) -> APIRoute:
    return next(
        r
        for r in delivery_api.router.routes
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


@pytest.mark.parametrize("reason", ["", "   ", "ab", " ab ", "x" * 2001, None])
def test_a_reason_must_be_a_few_words_and_not_a_book(reason):
    assert service.end_reason_problem(reason)


@pytest.mark.parametrize("reason", ["abc", "No crowd in that city this month.", "x" * 2000])
def test_a_few_words_will_do(reason):
    assert service.end_reason_problem(reason) is None


def test_the_reason_limits_are_the_dialogs_and_the_checks():
    assert service.MIN_END_REASON == 3 and "minLength={3}" in TASK_END_TSX
    assert service.MAX_END_REASON == 2000
    assert "char_length(end_reason) <= 2000" in CODE


@pytest.mark.parametrize(
    ("kind", "status", "started", "says"),
    [
        ("declined", "assigned", False, None),
        ("declined", "assigned", True, "Hand it back instead"),
        ("declined", "in_progress", True, "Hand it back instead"),
        ("declined", "qa_failed", True, "Hand it back instead"),
        ("returned", "assigned", False, None),
        ("returned", "in_progress", True, None),
        ("returned", "qa_failed", True, None),
        ("returned", "submitted", True, "with the partner for QA"),
        ("withdrawn", "assigned", False, None),
        ("withdrawn", "submitted", True, None),
        ("withdrawn", "qa_failed", True, None),
        ("moved", "in_progress", True, None),
        ("moved", "submitted", True, None),
    ],
)
def test_who_may_end_what_and_when(kind, status, started, says):
    problem = service.end_problem(kind, "TSK-07", status, started)
    assert (problem is None) if says is None else (problem and says in problem), problem


@pytest.mark.parametrize("kind", ["declined", "returned", "withdrawn", "moved"])
def test_nothing_ends_twice_and_work_that_passed_stays(kind):
    assert "already ended" in service.end_problem(kind, "TSK-07", "cancelled", True)
    assert "passed QA" in service.end_problem(kind, "TSK-07", "qa_passed", True)


@pytest.mark.parametrize("reason", ["", "   ", "ab", "x" * 2001])
def test_a_blank_short_or_overlong_reason_is_a_422_at_the_door(reason):
    with pytest.raises(ValidationError):
        TaskEndIn(reason=reason)
    with pytest.raises(ValidationError):
        TaskMoveIn(reason=reason, assignee_org_id="00000000-0000-0000-0000-000000000001")


def test_a_good_reason_arrives_trimmed_and_a_move_keeps_quantity_and_date_optional():
    assert TaskEndIn(reason="  Two crews fell ill.  ").reason == "Two crews fell ill."
    m = TaskMoveIn(reason="Faster crew", assignee_org_id="00000000-0000-0000-0000-000000000001")
    assert m.target_quantity is None and m.due_on is None


class _OrigError(Exception):
    def __init__(self, sqlstate: str, msg: str):
        super().__init__(msg)
        self.sqlstate = sqlstate


@pytest.mark.parametrize("state", ["23514", "42501"])
def test_the_functions_own_refusal_is_said_in_its_words(state):
    e = types.SimpleNamespace(orig=_OrigError(state, "task TSK-07: it has already ended\nCONTEXT: x"))
    assert service._task_refusal(e) == "TSK-07: it has already ended"


@pytest.mark.parametrize("state", ["40P01", "23505", "P0002", None])
def test_any_other_error_is_a_fault_to_surface(state):
    e = types.SimpleNamespace(orig=_OrigError(state, "task TSK-07: deadlock detected"))
    assert service._task_refusal(e) is None


# ---------------------------------------------------------------------------
# The routes
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("action", ["decline", "return"])
def test_the_supplier_ends_with_the_capability_it_starts_tasks_with(action):
    assert "task.start" in _capabilities(_route(f"/tasks/{{task_id}}/{action}", "POST"))


@pytest.mark.parametrize("action", ["withdraw", "move"])
def test_the_partner_ends_with_the_capability_it_assigns_tasks_with(action):
    assert "task.assign" in _capabilities(_route(f"/tasks/{{task_id}}/{action}", "POST"))


def test_the_picker_figures_are_the_partners():
    assert "task.assign" in _capabilities(_route("/suppliers/stats", "GET"))


# ---------------------------------------------------------------------------
# Wiring: ending
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("name", "kind"),
    [("decline_task", "declined"), ("return_task", "returned"),
     ("withdraw_task", "withdrawn"), ("move_task", "moved")],
)
def test_each_ending_locks_the_task_checks_ends_and_tells(name, kind):
    fn = _function(SERVICE_TREE, name)
    calls = _calls(fn)
    assert _locked_get_task(fn)
    assert "_end_reason" in calls and "_end_task" in calls and "_announce_end" in calls
    # the check before the ending, the announcement after it
    assert calls.index("_end_task") < calls.index("_announce_end")
    assert f"'{kind}'" in ast.unparse(fn)
    if kind in ("declined", "returned"):
        assert "end_problem" in calls
    else:
        assert "_partner_end_check" in calls


def test_the_partners_check_is_the_same_rule():
    assert "end_problem" in _calls(_function(SERVICE_TREE, "_partner_end_check"))


def test_the_ending_is_the_database_function_and_the_row_is_read_back():
    fn = _function(SERVICE_TREE, "_end_task")
    assert "task_end(:t, :k, :r)" in _strings(fn)
    assert {"refresh", "_task_refusal"} <= set(_calls(fn))


def test_the_other_side_is_told_by_bell_and_mail_each_worker_by_push_and_it_is_audited():
    fn = _function(SERVICE_TREE, "_announce_end")
    calls = _calls(fn)
    assert calls.count("notify") == 2 and "enqueue" in calls and "log" in calls
    src = ast.unparse(fn)
    assert "'task_ended'" in src and "user_id=worker" in src
    assert "f'task.{kind}'" in src


def test_the_mail_is_registered():
    assert messages.OUTBOX["task_ended"] is messages.task_ended


def test_a_move_checks_first_copies_the_files_then_ends_and_makes_the_copy():
    calls = _calls(_function(SERVICE_TREE, "move_task"))
    order = [calls.index(n) for n in
             ("_partner_end_check", "_check_assignee", "stage_copies", "_end_task", "create_task")]
    assert order == sorted(order)
    assert "replaces_task_id=t.id" in ast.unparse(_function(SERVICE_TREE, "move_task"))


def test_a_copy_of_the_files_is_its_own_object():
    fn = _function(ATTACH_TREE, "stage_copies")
    assert {"staging_key", "copy"} <= set(_calls(fn))
    assert "is_current" in _strings(fn) and "deleted_at IS NULL" in _strings(fn)


def test_the_network_check_is_shared_by_assign_and_move():
    assert "_check_assignee" in _calls(_function(SERVICE_TREE, "create_task"))


# ---------------------------------------------------------------------------
# Wiring: everything else waits for an ending and then sees it
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("name", ["start_task", "submit_task", "create_offer", "_assign_worker"])
def test_task_writers_take_the_task_row_first_and_refuse_an_ended_task(name):
    fn = _function(SERVICE_TREE, name)
    assert _locked_get_task(fn)
    assert "_ended" in _calls(fn)


@pytest.mark.parametrize(
    "name", ["start_assignment", "submit_assignment", "reassign_assignment", "reopen_assignment"]
)
def test_assignment_writers_lock_the_task_before_the_assignment(name):
    assert "_lock_assignment" in _calls(_function(SERVICE_TREE, name))


def test_the_assignment_lock_takes_the_task_then_the_assignment():
    fn = _function(SERVICE_TREE, "_lock_assignment")
    src = ast.unparse(fn)
    assert src.index("FROM task WHERE id = :t FOR NO KEY UPDATE") < src.index("with_for_update")
    assert "with_for_update(key_share=True)" in src and "populate_existing" in src


def test_an_accept_locks_the_task_before_the_offer():
    src = ast.unparse(_function(SERVICE_TREE, "_respond"))
    assert src.index("FROM task WHERE id = :t FOR NO KEY UPDATE") < src.index("with_for_update")


def test_a_qa_verdict_locks_the_task_and_refuses_an_ended_one():
    fn = _function(QA_TREE, "decide")
    s = _strings(fn)
    assert "FOR NO KEY UPDATE OF t" in s
    assert "has ended; there is nothing left to review." in s
    src = ast.unparse(fn)
    assert src.index("FOR NO KEY UPDATE OF t") < src.index("SELECT s.id, s.status")


def test_gate_one_drops_an_ended_tasks_batches_and_locks_the_task_first():
    assert "t.status <> 'cancelled'" in _strings(_function(QA_TREE, "gate1_queue"))
    fn = _function(QA_TREE, "decide_batch")
    assert "its batches are no longer reviewed" in _strings(fn)
    src = ast.unparse(fn)
    assert src.index("FOR NO KEY UPDATE OF t") < src.index("SELECT b.id, b.batch_no")


def test_no_lock_these_features_take_blocks_a_foreign_key_check():
    # FOR UPDATE is the one row lock a referencing insert's FOR KEY SHARE waits
    # on; with a task held and an insert waiting on the other side, two
    # writers deadlock. Every lock taken for an ending is NO KEY UPDATE.
    get_task = ast.unparse(_function(SERVICE_TREE, "_get_task"))
    assert "with_for_update(key_share=True)" in get_task and "with_for_update()" not in get_task
    for name in ("_lock_assignment", "_respond"):
        assert "FROM task WHERE id = :t FOR UPDATE" not in ast.unparse(_function(SERVICE_TREE, name)), name
    assert "FOR NO KEY UPDATE;" in _sql_function("task_end") and " FOR UPDATE;" not in _sql_function("task_end")


def test_an_ended_task_counts_as_no_work_under_way_on_the_rfp():
    market = (SRC / "modules" / "marketplace" / "service.py").read_text(encoding="utf-8")
    assert "AND t.deleted_at IS NULL AND t.status <> 'cancelled') AS task_count" in market
    assert "AND  t.status <> 'cancelled'\n           ) tc" in OVERVIEW_TEXT.replace("\r\n", "\n")


def test_an_ended_task_no_longer_holds_up_delivery():
    s = _strings(_function(SERVICE_TREE, "progress_of"))
    assert "count(*) FILTER (WHERE status <> 'cancelled') AS total" in s
    assert "count(*) FILTER (WHERE status = 'cancelled') AS ended" in s
    assert "count(t.id) FILTER (WHERE t.status <> 'cancelled')" in OVERVIEW_TEXT


def test_the_picker_figures_are_this_partners_own():
    s = _strings(_function(SERVICE_TREE, "supplier_stats"))
    assert "c.partner_org_id = :me" in s and "q.gate = 'gate2_partner'" in s
    assert "end_kind IN ('declined','returned')" in s


def test_the_console_calls_it_ended():
    assert 'cancelled: { label: "Ended"' in STATUS_TS


# ---------------------------------------------------------------------------
# The database
# ---------------------------------------------------------------------------


def test_no_enum_policy_or_table_grant_changes():
    assert "ALTER TYPE" not in CODE and "POLICY" not in CODE
    assert re.findall(r"GRANT\s+\w+", CODE) == ["GRANT  EXECUTE"]


def test_the_end_shape_holds_in_the_database():
    shape = " ".join(CODE.split("ADD CONSTRAINT task_end_shape CHECK", 1)[1].split(";")[0].split())
    assert "(status = 'cancelled') = (ended_at IS NOT NULL)" in shape
    assert "(end_kind IS NULL) = (ended_at IS NULL)" in shape
    assert "'declined', 'returned', 'withdrawn', 'moved', 'contract_ended'" in shape
    assert "btrim(end_reason) <> ''" in shape


def test_an_ended_task_stays_ended_and_one_that_passed_cannot_end():
    guard = " ".join(_sql_function("task_end_guard").split())
    assert "OLD.status = 'cancelled'" in guard and "NEW.status = 'cancelled' AND OLD.status = 'qa_passed'" in guard
    for col in ("ended_at", "ended_by", "ended_by_org_id", "end_kind", "end_reason"):
        assert f"NEW.{col} IS DISTINCT FROM OLD.{col}" in guard, col
    assert "CREATE TRIGGER task_end_guard BEFORE UPDATE ON task" in CODE


@pytest.mark.parametrize("table", ["task_assignment", "task_offer", "submission"])
def test_an_ended_task_takes_no_new_work(table):
    assert re.search(rf"CREATE TRIGGER \w+ BEFORE INSERT ON {table}\s+FOR EACH ROW EXECUTE FUNCTION task_live_guard", CODE)
    assert "SECURITY DEFINER SET search_path = public" in _sql_function("task_live_guard")


def test_a_cancelled_share_stays_cancelled():
    guard = " ".join(_sql_function("task_assignment_cancel_guard").split())
    assert "OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM OLD.status" in guard
    assert "BEFORE UPDATE OF status ON task_assignment" in " ".join(CODE.split())


def test_a_copy_names_only_a_moved_task_of_its_own_contract_once():
    guard = " ".join(_sql_function("task_replaces_guard").split())
    assert "o.contract_id = NEW.contract_id" in guard and "o.end_kind = 'moved'" in guard
    assert "CREATE UNIQUE INDEX task_replaces_key ON task (replaces_task_id)" in CODE


def test_task_end_checks_who_asks_locks_first_and_ends_the_work_under_it():
    fn = " ".join(_sql_function("task_end").split())
    assert "SECURITY DEFINER SET search_path = public" in fn
    assert "FOR NO KEY UPDATE" in fn and fn.index("FOR NO KEY UPDATE") < fn.index("UPDATE task_offer")
    assert "WHEN 'declined' THEN t.assignee_org_id = v_org AND NOT is_worker()" in fn
    assert "WHEN 'withdrawn' THEN k.partner_org_id = v_org" in fn
    assert "WHEN 'contract_ended' THEN k.status = 'cancelled'" in fn
    assert "ERRCODE = 'insufficient_privilege'" in fn
    assert "UPDATE task_offer SET status = 'closed'" in fn
    assert "a.status IN ('assigned', 'in_progress', 'submitted', 'rejected')" in fn
    assert "UPDATE submission SET status = 'superseded'" in fn
    assert "status IN ('open', 'submitted', 'under_review')" in fn
    assert "REVOKE EXECUTE ON FUNCTION task_end(uuid, text, text) FROM PUBLIC" in CODE
    assert "GRANT EXECUTE ON FUNCTION task_end(uuid, text, text) TO sourcehub_app" in " ".join(CODE.split())


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0064():
    assert re.search(r'^revision = "0065"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0064"$', MIGRATION_TEXT, re.M)


def test_the_file_follows_590_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("600_task_end") == files.index("590_storage_target_delete") + 1


def test_no_comment_line_ends_a_statement():
    comments = [ln for ln in SQL_TEXT.splitlines() if ln.strip().startswith("--")]
    assert not [ln for ln in comments if ln.rstrip().endswith(";")]


def test_the_downgrade_refuses_while_tasks_have_ended_and_drops_what_600_added():
    down = _literal("_DOWN")
    assert "IF EXISTS (SELECT 1 FROM task WHERE status = 'cancelled')" in down
    assert down.index("RAISE EXCEPTION") < down.index("DROP FUNCTION IF EXISTS task_end")
    for drop in (
        "DROP FUNCTION IF EXISTS task_end(uuid, text, text)",
        "DROP TRIGGER IF EXISTS task_replaces_guard ON task",
        "DROP TRIGGER IF EXISTS task_assignment_cancel_guard ON task_assignment",
        "DROP TRIGGER IF EXISTS submission_live_guard ON submission",
        "DROP TRIGGER IF EXISTS task_offer_live_guard ON task_offer",
        "DROP TRIGGER IF EXISTS task_assignment_live_guard ON task_assignment",
        "DROP FUNCTION IF EXISTS task_live_guard()",
        "DROP TRIGGER IF EXISTS task_end_guard ON task",
        "DROP INDEX IF EXISTS task_replaces_key",
        "DROP CONSTRAINT IF EXISTS task_end_shape",
        "DROP COLUMN IF EXISTS replaces_task_id",
        "DROP COLUMN IF EXISTS ended_at",
    ):
        assert drop in down, drop
