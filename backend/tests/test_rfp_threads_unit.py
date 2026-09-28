"""Conversations: one private thread per request per delivery partner.

What this file guards, in the order it would hurt:

  * a partner reading another partner's thread, or Ops posting in one — the
    database refuses both by name, and the refusal has to survive an edit to
    the policy text;
  * a message edited or deleted at any layer: no policy, no grant, a rewrite
    rule that turns the attempt into nothing;
  * a post landing after the award closed the thread, or the wrong person
    being told they may open one;
  * a read stamp that moves backwards, or counts the reader's own messages
    as unread;
  * an Ops read that writes an audit line per ten-second poll;
  * the award or the approval forgetting to close what they end;
  * the SQL file and the migration drifting apart.

conftest.py's database fixtures raise NotImplementedError, so — as in
test_bidding_deadline_unit.py — the pure parts are tested with fixed inputs
and the wiring is read off the AST, the route table and the policy text, never
off a file's prose.

    pytest tests/test_rfp_threads_unit.py
"""

from __future__ import annotations

import ast
import importlib.util
import inspect
import re
import uuid
from pathlib import Path

import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from sourcehub.api.deps import TxRoute, get_principal
from sourcehub.api.v1 import threads as threads_api
from sourcehub.api.v1.threads import MessageIn
from sourcehub.main import app
from sourcehub.modules.threads import service

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "250_rfp_threads.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0027_rfp_threads.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _tree(*parts: str) -> ast.AST:
    return ast.parse(SRC.joinpath(*parts).read_text(encoding="utf-8"))


SERVICE_TREE = _tree("modules", "threads", "service.py")
MARKETPLACE_TREE = _tree("modules", "marketplace", "service.py")
DELIVERY_TREE = _tree("modules", "delivery", "service.py")

ORG_A = uuid.uuid4()
ORG_B = uuid.uuid4()
ORG_C = uuid.uuid4()


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


# comments stripped, so prose can never satisfy a code assertion
CODE = _strip_comments(SQL_TEXT)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal in the migration"
    return m.group(1)


def _policy(name: str) -> str:
    m = re.search(rf"CREATE POLICY {name} ON \w+.*?;", CODE, re.S)
    assert m, f"no policy {name}"
    return m.group(0)


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


def _sql_texts(fn: ast.AST) -> list[str]:
    """Every text(...) literal in a function, in source order. Adjacent
    strings are folded by the parser into one Constant, so each is the whole
    query."""
    return [
        node.args[0].value
        for node in ast.walk(fn)
        if isinstance(node, ast.Call)
        and getattr(node.func, "id", None) == "text"
        and node.args
        and isinstance(node.args[0], ast.Constant)
        and isinstance(node.args[0].value, str)
    ]


def _direct(stmts: list[ast.stmt]) -> list[ast.stmt]:
    """The statements that run unconditionally: the body minus anything under
    an if/try — a call parked under `if False:` is not a call."""
    return [s for s in stmts if not isinstance(s, ast.If | ast.Try | ast.With | ast.AsyncWith)]


def _direct_sql(stmts: list[ast.stmt]) -> list[str]:
    out: list[str] = []
    for s in _direct(stmts):
        out.extend(_sql_texts(s))
    return out


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


def _notify_calls(fn: ast.AST) -> list[tuple[str | None, set[str]]]:
    """(link_page, link_params keys) for every notifier.notify(...) call."""
    out: list[tuple[str | None, set[str]]] = []
    for node in ast.walk(fn):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "notify"
            and getattr(node.func.value, "id", "") == "notifier"
        ):
            page = None
            if len(node.args) > 3 and isinstance(node.args[3], ast.Constant):
                page = node.args[3].value
            keys: set[str] = set()
            if len(node.args) > 4 and isinstance(node.args[4], ast.Dict):
                keys = {k.value for k in node.args[4].keys if isinstance(k, ast.Constant)}
            out.append((page, keys))
    return out


# ---------------------------------------------------------------------------
# The pure rules
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("body", ["", "   ", "\n\t", None])
def test_a_blank_body_is_refused(body):
    with pytest.raises(service.ThreadError):
        service.clean_body(body)


def test_a_body_is_trimmed_and_capped_at_4000():
    assert service.clean_body("  hello  ") == "hello"
    assert len(service.clean_body("x" * 4000)) == 4000
    with pytest.raises(service.ThreadError, match="4000"):
        service.clean_body("x" * 4001)
    assert service.MAX_BODY == 4000
    # the column agrees
    assert "char_length(body) <= 4000" in CODE
    assert "btrim(body) <> ''" in CODE


def test_the_excerpt_is_eighty_chars_with_collapsed_whitespace():
    assert service.excerpt("short") == "short"
    long = "a" * 81
    cut = service.excerpt(long)
    assert cut.endswith("…") and len(cut) == 81
    assert service.excerpt("one\n\n  two\tthree") == "one two three"


@pytest.mark.parametrize("kind", ["client", "platform", "aggregator", "sponsor", "business"])
def test_only_a_delivery_partner_opens(kind):
    assert service.open_problem(kind, "published")
    assert service.open_problem("tenant", "published") is None


def test_a_thread_opens_only_while_the_request_is_published():
    assert service.open_problem("tenant", "draft")
    assert service.open_problem("tenant", "accepted")
    # the winner, during delivery
    assert service.open_problem("tenant", "accepted", awarded_to_me_and_active=True) is None
    # a passed deadline is still 'published': award is the cut-off
    assert service.open_problem("tenant", "published", awarded_to_me_and_active=False) is None


def test_a_party_posts_while_open_and_nobody_after_close():
    assert service.post_problem(None, ORG_A, ORG_A, ORG_B) is None
    assert service.post_problem(None, ORG_B, ORG_A, ORG_B) is None
    assert "not a party" in service.post_problem(None, ORG_C, ORG_A, ORG_B)
    assert "awarded to another partner" in service.post_problem(
        service.AWARDED_ELSEWHERE, ORG_B, ORG_A, ORG_B
    )
    assert "contract was completed" in service.post_problem(
        service.CONTRACT_COMPLETED, ORG_A, ORG_A, ORG_B
    )
    # a stranger is a stranger before it is anything else
    assert "not a party" in service.post_problem(service.AWARDED_ELSEWHERE, ORG_C, ORG_A, ORG_B)


def test_closed_wording_names_the_reason():
    assert service.closed_message(None) is None
    assert "another partner" in service.closed_message(service.AWARDED_ELSEWHERE)
    assert "completed" in service.closed_message(service.CONTRACT_COMPLETED)
    assert service.closed_message("something_else")
    # the column accepts exactly the two reasons the service knows
    assert "closed_reason IN ('awarded_elsewhere', 'contract_completed')" in CODE


def test_ops_reads_are_audited_once_per_new_content():
    assert service.ops_read_is_new(None, 5, False)        # the first look
    assert not service.ops_read_is_new(5, 5, False)       # a poll with nothing new
    assert service.ops_read_is_new(5, 7, False)           # two more messages
    assert service.ops_read_is_new(7, 3, True)            # paging back into history
    assert not service.ops_read_is_new(7, 3, False)


def test_the_message_model_refuses_blank_and_oversized():
    with pytest.raises(ValidationError):
        MessageIn(body="   ")
    with pytest.raises(ValidationError):
        MessageIn(body="x" * 4001)
    assert MessageIn(body="x" * 4000).body


# ---------------------------------------------------------------------------
# The wiring
# ---------------------------------------------------------------------------


def test_opening_takes_the_slot_lock_and_is_race_safe():
    fn = _function(SERVICE_TREE, "open_thread")
    assert "_lock" in _calls(fn)
    assert any("ON CONFLICT (request_id, partner_org_id) DO NOTHING" in s for s in _sql_texts(fn))
    assert "open_problem" in _calls(fn)


def test_opening_posts_the_first_message_and_audits_once():
    fn = _function(SERVICE_TREE, "open_thread")
    assert "post_message" in _calls(fn)
    assert _audit_events(fn) == {"thread.opened"}


def test_posting_locks_numbers_and_tells_the_other_side():
    fn = _function(SERVICE_TREE, "post_message")
    assert "_lock" in _calls(fn)
    assert "post_problem" in _calls(fn)
    assert any("coalesce(max(seq), 0) + 1" in s for s in _sql_texts(fn))
    assert _notify_calls(fn) == [("thread", {"id", "request"})]


def test_posting_writes_no_audit_line():
    assert _audit_events(_function(SERVICE_TREE, "post_message")) == set()


def test_posting_maps_the_policy_refusal_to_a_conflict():
    fn = _function(SERVICE_TREE, "post_message")
    handlers = [
        n for n in ast.walk(fn)
        if isinstance(n, ast.ExceptHandler) and getattr(n.type, "id", "") == "DBAPIError"
    ]
    assert handlers, "no DBAPIError handler"
    raised = [
        getattr(r.exc.func, "id", "")
        for h in handlers for r in ast.walk(h)
        if isinstance(r, ast.Raise) and isinstance(r.exc, ast.Call)
    ]
    assert "ThreadError" in raised
    assert any(
        isinstance(n, ast.Constant) and n.value == "row-level security" for n in ast.walk(fn)
    )


def test_the_read_stamp_never_moves_backwards():
    stamp = _function(SERVICE_TREE, "_stamp")
    assert any(
        "GREATEST(rfp_thread_read.last_read_seq, EXCLUDED.last_read_seq)" in s
        for s in _sql_texts(stamp)
    )
    # both readers and posters stamp, and the stamp is a message, not a clock
    assert "_stamp" in _calls(_function(SERVICE_TREE, "mark_read"))
    assert "_stamp" in _calls(_function(SERVICE_TREE, "post_message"))
    assert not any("now()" in s and "last_read_seq" in s and "VALUES (:t, :org, now()" in s
                   for s in _sql_texts(stamp))
    # the bell rows this thread produced clear with it
    assert any("link_page = 'thread'" in s and "read_at = now()" in s for s in _sql_texts(stamp))


def test_unread_counts_only_the_other_sides_messages():
    sql = "\n".join(_sql_texts(_function(SERVICE_TREE, "_headers")))
    assert "m.sender_org_id <> current_org_id()" in sql
    assert "ELSE m.seq END" in sql   # Ops is nobody's other side: 0


def test_closing_locks_stamps_conditionally_and_audits():
    close = _function(SERVICE_TREE, "_close_threads")
    # both statements run unconditionally, the lock first
    sqls = _direct_sql(close.body)
    assert len(sqls) == 2
    lock, update = sqls
    assert "pg_advisory_xact_lock" in lock and "closed_at IS NULL" in lock
    assert update.startswith("UPDATE rfp_thread") and "closed_at IS NULL" in update
    assert "RETURNING" in update
    award = _function(SERVICE_TREE, "close_for_award")
    done = _function(SERVICE_TREE, "close_for_completion")
    assert "_close_threads" in _calls(award) and "_close_threads" in _calls(done)
    assert _audit_events(award) == {"thread.closed"}
    assert _audit_events(done) == {"thread.closed"}
    # the losers are told, bidder or not — inside the loop, unconditionally;
    # the winner already hears from delivery
    loop = next(n for n in ast.walk(award) if isinstance(n, ast.For))
    told = [c for s in _direct(loop.body) for c in _notify_calls(s)]
    assert told == [("thread", {"id", "request"})]
    assert _notify_calls(done) == []


def test_award_closes_the_losers_threads():
    assert "close_for_award" in _calls(_function(MARKETPLACE_TREE, "award"))


def test_completion_closes_the_winners_thread():
    assert "close_for_completion" in _calls(_function(DELIVERY_TREE, "approve_delivery"))


def test_ops_reads_audit_from_the_messages_route_only():
    assert "_audit_ops_read" in _calls(_function(SERVICE_TREE, "list_messages"))
    assert "_audit_ops_read" not in _calls(_function(SERVICE_TREE, "get_thread"))
    assert "_audit_ops_read" not in _calls(_function(SERVICE_TREE, "list_threads"))
    fn = _function(SERVICE_TREE, "_audit_ops_read")
    assert _audit_events(fn) == {"thread.read_by_ops"}
    assert "ops_read_is_new" in _calls(fn)
    sql = "\n".join(_sql_texts(fn))
    assert "'thread.read_by_ops'" in sql and "up_to_seq" in sql


# ---------------------------------------------------------------------------
# The routes
# ---------------------------------------------------------------------------


def _caps(route: APIRoute) -> set[str]:
    dep = inspect.signature(route.endpoint).parameters["principal"].default.dependency
    if dep is get_principal:
        return set()
    out: set[str] = set()
    for cell in getattr(dep, "__closure__", None) or ():
        v = cell.cell_contents
        if isinstance(v, str):
            out.add(v)
        elif isinstance(v, tuple):
            out.update(x for x in v if isinstance(x, str))
    return out


EXPECTED_GUARDS = {
    ("GET", "/requests/{request_id}/threads"): set(),
    ("POST", "/requests/{request_id}/threads"): {"proposal.create"},
    ("GET", "/threads/{thread_id}"): set(),
    ("GET", "/threads/{thread_id}/messages"): set(),
    ("POST", "/threads/{thread_id}/messages"): {"proposal.create", "proposal.read"},
    ("POST", "/threads/{thread_id}/read"): {"proposal.create", "proposal.read"},
}


def test_route_guards():
    assert threads_api.router.route_class is TxRoute
    found = {}
    for r in threads_api.router.routes:
        assert isinstance(r, APIRoute)
        for m in r.methods:
            found[(m, r.path)] = _caps(r)
    assert found == EXPECTED_GUARDS


def test_the_router_is_mounted():
    paths = app.openapi()["paths"]
    for _, path in EXPECTED_GUARDS:
        assert f"/api/v1{path}" in paths, path


# ---------------------------------------------------------------------------
# The schema and the migration
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT
    assert re.search(r'^revision = "0027"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0026"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_in_the_bundle():
    assert "250_rfp_threads" in BUNDLE.read_text(encoding="utf-8")


def test_the_splitter_can_cut_the_file():
    spec = importlib.util.spec_from_file_location("m0027", MIGRATION)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    stmts = mod._statements(mod._UP)
    assert len(stmts) >= 40
    for s in stmts:
        first = next(ln for ln in s.splitlines() if ln.strip() and not ln.strip().startswith("--"))
        assert first.startswith(("CREATE", "ALTER", "GRANT", "REVOKE", "COMMENT")), first
    assert "DO $" not in CODE
    assert len(mod._statements(mod._DOWN)) == 8


def test_messages_are_append_only_at_every_layer():
    assert not re.search(r"CREATE POLICY rfp_message_(update|delete)", CODE)
    assert "REVOKE ALL ON rfp_thread, rfp_message, rfp_thread_read FROM sourcehub_app;" in CODE
    assert "GRANT SELECT, INSERT ON rfp_message TO sourcehub_app;" in CODE
    assert not re.search(r"GRANT[^;]*(UPDATE|DELETE)[^;]*ON rfp_message", CODE)
    for rule in ("no_update AS ON UPDATE", "no_delete AS ON DELETE"):
        assert f"CREATE RULE rfp_message_{rule} TO rfp_message DO INSTEAD NOTHING;" in CODE


def test_the_database_itself_keeps_ops_out_of_the_conversation():
    assert "NOT is_platform_admin()" in _policy("rfp_message_insert")
    assert "NOT is_platform_admin()" in _policy("rfp_thread_insert")
    assert "NOT is_platform_admin()" in _policy("rfp_thread_read_insert")
    assert "is_platform_admin()" in _policy("rfp_thread_select")


def test_posting_is_refused_by_policy_once_closed():
    p = _policy("rfp_message_insert")
    assert "closed_at IS NULL" in p
    assert "sender_org_id  = current_org_id()" in p
    assert "sender_user_id = current_user_id()" in p


def test_only_a_partner_opens_and_only_the_client_closes():
    ins = _policy("rfp_thread_insert")
    assert "current_org_kind() = 'tenant'" in ins
    assert "r.status = 'published'" in ins
    assert "c.status <> 'completed'" in ins        # the winner, during delivery
    upd = _policy("rfp_thread_update")
    assert "client_org_id = current_org_id()" in upd
    assert "partner_org_id" not in upd
    grant = "GRANT UPDATE (closed_at, closed_reason, closed_by) ON rfp_thread TO sourcehub_app;"
    assert grant in CODE
    body = re.search(r"FUNCTION rfp_thread_close_once\(\).*?\$fn\$;", CODE, re.S).group(0)
    assert "RAISE EXCEPTION" in body
    assert "rfp_thread_close_once BEFORE UPDATE ON rfp_thread" in CODE


def test_the_asker_keeps_sight_of_the_request_after_award():
    assert CODE.count("SECURITY DEFINER") == 2
    for fn in ("request_has_my_thread", "org_visible_via_thread"):
        assert f"REVOKE EXECUTE ON FUNCTION {fn}(uuid)" in CODE
        assert re.search(
            rf"GRANT\s+EXECUTE ON FUNCTION {fn}\(uuid\)\s+TO sourcehub_app, sourcehub_readonly",
            CODE,
        )
    assert "USING (request_has_my_thread(id))" in _policy("request_select_thread")
    assert "USING (org_visible_via_thread(id))" in _policy("organisation_select_thread_parties")


def test_every_table_denies_crowd_resources():
    for t in ("rfp_thread", "rfp_message", "rfp_thread_read"):
        assert f"CREATE POLICY {t}_worker_deny ON {t} AS RESTRICTIVE FOR ALL" in CODE
        assert f"ALTER TABLE {t} FORCE  ROW LEVEL SECURITY;" in CODE


def test_one_thread_per_request_per_partner_and_one_seq_per_message():
    assert "UNIQUE (request_id, partner_org_id)" in CODE
    assert "UNIQUE (thread_id, seq)" in CODE
    assert "CHECK (client_org_id <> partner_org_id)" in CODE


def test_the_downgrade_removes_what_the_upgrade_added():
    down = _literal("_DOWN")
    for t in ("rfp_thread_read", "rfp_message", "rfp_thread"):
        assert f"DROP TABLE IF EXISTS {t};" in down
    for f in (
        "org_visible_via_thread(uuid)", "request_has_my_thread(uuid)", "rfp_thread_close_once()",
    ):
        assert f"DROP FUNCTION IF EXISTS {f};" in down
    for p in (
        "organisation_select_thread_parties ON organisation", "request_select_thread ON request",
    ):
        assert f"DROP POLICY IF EXISTS {p};" in down
