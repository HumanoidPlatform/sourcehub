"""db/330 folds onboarding_approval onto the request row; 0036 carries it.

The two files stay one change (verbatim); the columns exist before the copy
and the copy is asserted before the table is dropped; the approval function
gains the reason and writes the decision itself; the transition trigger keeps
a decision Ops-only, signed, dated and reasoned; the login's column grant is
narrow; the downgrade brings the table back with one row per decided request;
and the backend reads and writes the columns, never the table.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "db"
SQL = DB / "330_onboarding_decisions.sql"
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION = VERSIONS / "0036_onboarding_decisions.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"
SERVICE = SRC / "modules" / "onboarding" / "service.py"
MODELS = SRC / "modules" / "onboarding" / "models.py"
FRONT = ROOT / "frontend" / "src"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
OLD_SIGNATURE = "approve_onboarding_request(uuid, uuid, uuid, text, text, interval)"
NEW_SIGNATURE = "approve_onboarding_request(uuid, uuid, text, text, interval)"
GONE = ("OnboardingApproval", "ApprovalDecision", "approval_decision")
TRAIL = (".decisions", "decisions=", "jsonb array")
DECISION_COLUMNS = ("decided_at", "decided_by", "decision_reason")
UPDATABLE = {
    "proposed_name", "payload", "contact", "status", "submitted_at", "decided_at", "decided_by",
    "decision_reason", "updated_by", "created_org_id", "created_user_id",
}


def _literal(name: str, text: str = MIGRATION_TEXT) -> str:
    m = re.search(rf'{name} = """(.*?)"""', text, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0036", "exec"), ns)
    return ns["_statements"](ddl)


def _code_only(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith("#"))


def _function(text: str, head: str) -> str:
    body = text[text.index(head) :]
    return body[: body.index("$fn$;")]


def _slice(text: str, start: str, end: str) -> str:
    return text[text.index(start) : text.index(end, text.index(start))]


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0035():
    assert re.search(r'^revision = "0036"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0035"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_320_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    # straight after 320; later files (340_..., ...) may follow
    at = listed.index("330_onboarding_decisions")
    assert listed[at - 1 : at + 1] == ["320_partner_invoices", "330_onboarding_decisions"]
    assert all(int(name[:3]) > 330 for name in listed[at + 1 :])


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/330", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_body_whole():
    stmts = _statements(_literal("_UP")) + _statements(_literal("_DOWN"))
    for stmt in stmts:
        assert stmt.count("$fn$") in (0, 2), stmt[:200]
    blocks = [s for s in stmts if "DO $fn$" in s]
    assert len(blocks) == 2  # the copy assertion up, the expansion assertion down
    for block in blocks:
        assert "RAISE EXCEPTION" in block and "DROP " not in block


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
def test_the_columns_exist_before_the_copy_and_the_rule_comes_after():
    copied = SQL_TEXT.index("UPDATE onboarding_request r")
    assert SQL_TEXT.index("ADD COLUMN decision_reason text;") < copied
    decided_by = "ADD COLUMN decided_by uuid REFERENCES app_user(id) ON DELETE RESTRICT;"
    assert SQL_TEXT.index(decided_by) < copied
    off = SQL_TEXT.index("DISABLE TRIGGER onboarding_request_updated_at")
    on = SQL_TEXT.index("ENABLE TRIGGER onboarding_request_updated_at")
    assert off < copied < on
    # the latest decision of each request, decided_at included
    assert "SELECT DISTINCT ON (request_id)" in SQL_TEXT
    assert "ORDER BY request_id, decided_at DESC, step DESC" in SQL_TEXT
    copy = (
        r"SET decision_reason = a\.reason,\s+decided_by\s+= a\.approver_user_id,"
        r"\s+decided_at\s+= a\.decided_at"
    )
    assert re.search(copy, SQL_TEXT)
    assert copied < SQL_TEXT.index("ADD CONSTRAINT onboarding_request_decision_shape")


def test_the_copy_is_checked_before_the_table_is_dropped():
    copied = SQL_TEXT.index("UPDATE onboarding_request r")
    assertion = SQL_TEXT.index("DO $fn$")
    dropped = SQL_TEXT.index("DROP TABLE onboarding_approval;")
    assert copied < assertion < dropped
    block = SQL_TEXT[assertion : SQL_TEXT.index("$fn$;", assertion)]
    assert "count(DISTINCT request_id)" in block and "WHERE decided_by IS NOT NULL" in block
    assert "RAISE EXCEPTION '330:" in block
    assert SQL_TEXT.count("DROP TABLE onboarding_approval;") == 1
    assert dropped < SQL_TEXT.index("DROP TYPE approval_decision;")
    assert dropped < SQL_TEXT.index("DROP COLUMN expires_at;")


def test_the_decision_shape_rule():
    rule = _slice(SQL_TEXT, "ADD CONSTRAINT onboarding_request_decision_shape", ";")
    assert "(decided_at IS NULL) = (decided_by IS NULL)" in rule
    assert "(decision_reason IS NULL OR decided_at IS NOT NULL)" in rule
    decided = (
        "status NOT IN ('approved', 'rejected', 'changes_requested') OR decided_at IS NOT NULL"
    )
    assert decided in rule
    assert "status NOT IN ('rejected', 'changes_requested')" in rule
    assert "length(btrim(coalesce(decision_reason, ''))) > 0" in rule
    assert "status <> 'draft' OR decided_at IS NULL" in rule


def test_the_approval_function_takes_the_reason_and_writes_the_decision_itself():
    old = SQL_TEXT.index(f"DROP FUNCTION {OLD_SIGNATURE};")
    new = SQL_TEXT.index("CREATE FUNCTION approve_onboarding_request(")
    assert old < new
    fn = _function(SQL_TEXT, "CREATE FUNCTION approve_onboarding_request(")
    assert re.search(r"p_reason\s+text DEFAULT NULL,", fn)
    assert re.search(r"decided_at = now\(\),\s+decided_by = p_approver_user_id,", fn)
    assert "decision_reason = nullif(btrim(coalesce(p_reason, '')), '')" in fn
    assert "INSERT INTO onboarding_approval" not in fn
    # the approver's organisation and role only ever fed the dropped row
    assert "p_approver_org_id" not in fn and "p_approver_role" not in fn
    assert f"GRANT EXECUTE ON FUNCTION {NEW_SIGNATURE}" in SQL_TEXT


def test_the_transition_trigger_keeps_a_decision_ops_only_signed_dated_and_reasoned():
    fn = _function(SQL_TEXT, "CREATE OR REPLACE FUNCTION onboarding_request_transition()")
    assert "IF NOT is_platform_admin() THEN" in fn
    assert "only Ops records a decision" in fn
    # on a submitted request, never on a draft or a returned one
    assert re.search(r"IF OLD\.status NOT IN \('submitted', 'under_review'\) THEN", fn)
    assert "NEW.decided_by IS DISTINCT FROM current_user_id()" in fn  # signed by the session
    assert "NEW.decided_at IS NULL OR NEW.decided_at IS NOT DISTINCT FROM OLD.decided_at" in fn
    assert "a % needs a reason" in fn
    # the decision columns change with no other move
    assert "the decision is written with the move it belongs to" in fn
    for col in DECISION_COLUMNS:
        assert f"NEW.{col} IS DISTINCT FROM OLD.{col}" in fn, col
    final = (
        r"OLD\.status IN \('approved', 'rejected', 'withdrawn', 'expired'\)"
        r"\s+AND NEW\.status <> OLD\.status"
    )
    assert re.search(final, fn)
    assert "USING ERRCODE = 'check_violation'" in fn
    assert "SECURITY DEFINER" not in fn  # the caller's own context decides
    assert (
        "CREATE TRIGGER onboarding_request_transition BEFORE INSERT OR UPDATE ON onboarding_request"
        in SQL_TEXT
    )


def test_the_trigger_freezes_what_was_filed_and_the_grant_narrows_the_login():
    fn = _function(SQL_TEXT, "CREATE OR REPLACE FUNCTION onboarding_request_transition()")
    assert "what was filed cannot change" in fn
    for col in ("reference_code", "target_org_kind", "requester_org_id", "requester_user_id"):
        assert f"NEW.{col} <> OLD.{col}" in fn, col
    assert "NEW.parent_org_id IS DISTINCT FROM OLD.parent_org_id" in fn
    # the proposal is edited only while draft or returned (which covers the resubmit)
    assert "AND OLD.status NOT IN ('draft', 'changes_requested') THEN" in fn
    assert "submitted_at is set by submitting" in fn
    assert "a new request carries no decision" in fn
    assert "(NEW.status = 'submitted') <> (NEW.submitted_at IS NOT NULL)" in fn  # on INSERT too
    grants = SQL_TEXT[SQL_TEXT.index("REVOKE ALL ON onboarding_request FROM sourcehub_app;") :]
    assert "GRANT SELECT, INSERT ON onboarding_request TO sourcehub_app;" in grants
    grant = re.search(r"GRANT UPDATE \(([^)]*)\)\s+ON onboarding_request TO sourcehub_app;", grants)
    assert grant
    assert {c.strip() for c in grant.group(1).split(",")} == UPDATABLE
    # nothing deletes a request, and who asked is never updatable by the login
    assert "DELETE ON onboarding_request" not in grants and "GRANT UPDATE ON" not in grants
    assert "requester_org_id" not in grants and "parent_org_id" not in grants


def test_the_downgrade_recreates_the_table_with_one_row_per_decided_request():
    down = _literal("_DOWN")
    trigger_gone = down.index("DROP TRIGGER onboarding_request_transition")
    assert trigger_gone < down.index("DROP COLUMN decision_reason")
    enum_ddl = "CREATE TYPE approval_decision AS ENUM ('approved','rejected','changes_requested')"
    assert enum_ddl in down
    assert "CREATE TABLE onboarding_approval (" in down
    assert "REFERENCES onboarding_request(id) ON DELETE CASCADE" in down
    assert "CREATE POLICY onboarding_approval_select" in down
    assert "CREATE POLICY onboarding_approval_insert" in down
    assert "FORCE ROW LEVEL SECURITY" not in down  # 270 took FORCE off everywhere
    expanded = down.index("INSERT INTO onboarding_approval")
    assert down.index("CREATE TABLE onboarding_approval") < expanded
    assert "WHERE r.decided_by IS NOT NULL" in down
    # a returned request that was resubmitted or withdrawn becomes a return row
    assert "ELSE 'changes_requested' END::approval_decision" in down
    assert "WHERE kind = 'platform'" in down  # the approver organisation
    rule_gone = down.index("DROP CONSTRAINT onboarding_request_decision_shape")
    assert expanded < rule_gone < down.index("DROP COLUMN decided_by")
    # decided_at means what it did: NULL unless approved or rejected
    old_meaning = "SET decided_at = NULL WHERE status NOT IN ('approved', 'rejected')"
    assert old_meaning in down
    assert "ADD COLUMN expires_at timestamptz" in down
    assert f"DROP FUNCTION {NEW_SIGNATURE};" in down
    old_grant = "approve_onboarding_request(uuid,uuid,uuid,text,text,interval)"
    assert f"GRANT EXECUTE ON FUNCTION {old_grant}" in down
    fn = _function(down, "CREATE FUNCTION approve_onboarding_request(")
    assert "p_reason" not in fn and "INSERT INTO onboarding_approval" in fn
    # the whole-table grants come back, the column grant goes
    assert "GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_request TO sourcehub_app;" in down
    revoke = r"REVOKE ALL \([^)]*decision_reason[^)]*\)\s+ON onboarding_request FROM sourcehub_app;"
    assert re.search(revoke, down)


# ---------------------------------------------------------------------------
# The backend writes and reads the columns, never the table
# ---------------------------------------------------------------------------
def test_the_model_maps_the_columns_and_not_the_dead_one():
    text = _code_only(MODELS.read_text(encoding="utf-8"))
    request_cls = text[text.index("class OnboardingRequest") : text.index("class Invitation")]
    by = r"decided_by: Mapped\[uuid\.UUID \| None\] = mapped_column\(ForeignKey\(\"app_user\.id\"\)"
    assert re.search(by, request_cls)
    assert re.search(r"decision_reason: Mapped\[str \| None\] = mapped_column\(Text\)", request_cls)
    assert "expires_at" not in request_cls and "decisions" not in request_cls
    assert "class OnboardingApproval" not in text


def test_the_service_reads_the_decision_from_the_row_and_writes_it_with_the_move():
    text = _code_only(SERVICE.read_text(encoding="utf-8"))
    approvals = _slice(text, "def _approvals_for(", "\nasync def ")
    assert "if r.decided_at is None:" in approvals and "return []" in approvals
    assert "r.decision_reason" in approvals and '"approver_role": "platform_admin"' in approvals
    assert 'else "changes_requested"' in approvals  # returned, then resubmitted or withdrawn
    # the created organisation reads its origin request but not the note Ops typed
    assert "claims.org_id == r.created_org_id" in approvals
    assert "None if created_org_reads else r.decision_reason" in approvals
    decide = _slice(text, "async def decide(", "async def _approve(")
    assert re.search(r"r\.decided_at = dt\.datetime\.now\(", decide)
    assert "r.decided_by = claims.user_id" in decide
    assert "r.decision_reason = reason" in decide
    assert "_flush_or_refuse(session)" in decide  # the trigger's refusal is a 409 here
    assert re.search(r"_approve\(session, claims, request_id, reason\)", decide)
    assert "{verb}: {reason}" in decide  # the audit log is the history now
    approve = _slice(text, "async def _approve(", "async def resend_invitation(")
    # the reason reaches the function and the audit log; the dropped parameters are gone
    call = r":rid, :uid, :thash, :reason,\s*\"?\s*\"?make_interval\(days => :ttl\)"
    assert re.search(call, approve)
    assert ":oid" not in approve and ":role" not in approve
    assert '(f" ({reason})" if reason else "")' in approve
    # one DBAPIError branch: the trigger's refusal is an IntegrityError too
    assert "except IntegrityError" not in approve
    assert "_refusal(e)" in approve
    for fn in ("submit_request", "update_draft", "withdraw_request"):
        body = _slice(text, f"async def {fn}(", "\nasync def ")
        assert "_flush_or_refuse(session)" in body, fn
    withdraw = _slice(text, "async def withdraw_request(", "\nasync def ")
    assert '("approved", "rejected", "withdrawn", "expired")' in withdraw
    assert "select(OnboardingApproval" not in text


def test_a_refusal_is_the_triggers_or_the_functions_sentence_and_nothing_else():
    from sourcehub.modules.onboarding.service import _refusal

    class Orig:
        def __init__(self, sqlstate: str | None, message: str) -> None:
            self.sqlstate = sqlstate
            self.message = message

        def __str__(self) -> str:
            return self.message

    class Err:
        def __init__(self, orig: Orig) -> None:
            self.orig = orig

    def refusal(sqlstate: str | None, message: str) -> str | None:
        return _refusal(Err(Orig(sqlstate, message)))  # type: ignore[arg-type]

    check = "<class 'asyncpg.exceptions.CheckViolationError'>: "
    raised = "<class 'asyncpg.exceptions.RaiseError'>: "
    # the trigger's sentence, first line only, without the driver's framing
    sentence = "onboarding ONB-03: only Ops records a decision"
    assert refusal("23514", check + sentence + "\nDETAIL: x") == sentence
    filed = "onboarding: a new request carries no decision"
    assert refusal("23514", check + filed) == filed
    # the function's own RAISE
    fn = refusal("P0001", raised + "onboarding request 1a24 is changes_requested and cannot be ...")
    assert fn is not None and fn.startswith("onboarding request 1a24 is")
    # a fault that merely names the relation is not a refusal to explain
    relation = 'of relation "onboarding_request"'
    assert refusal("23502", 'null value in column "contact" ' + relation) is None
    assert refusal("23514", 'new row for relation "onboarding_request" violates a check') is None
    assert refusal(None, "onboarding: no state") is None


def test_a_refusal_is_recognised_by_sqlstate_and_prefix_not_by_the_word_alone():
    text = _code_only(SERVICE.read_text(encoding="utf-8"))
    refusal = _slice(text, "def _refusal(", "\nasync def ")
    assert '"23514"' in text and '"P0001"' in text
    assert "sqlstate" in refusal
    assert '"onboarding "' in refusal and '"onboarding:"' in refusal


def test_no_backend_source_names_the_table_its_enum_or_the_trail():
    hits = []
    for path in sorted(SRC.rglob("*.py")):
        for n, line in enumerate(_code_only(path.read_text(encoding="utf-8")).splitlines(), 1):
            if any(name in line for name in GONE):
                hits.append(f"{path.relative_to(ROOT)}:{n}: {line.strip()}")
    assert hits == [], "\n".join(hits)
    # the jsonb trail of the first draft is gone from the onboarding module, the
    # routes, the types, and the migration's own description of itself
    routes, types = SRC / "api" / "v1" / "onboarding.py", SRC / "db" / "types.py"
    for path in (SERVICE, MODELS, routes, types, MIGRATION):
        text = path.read_text(encoding="utf-8")
        for token in TRAIL:
            assert token not in text, f"{path.name}: {token}"
    doc = MIGRATION_TEXT[: MIGRATION_TEXT.index("from alembic import op")]
    for phrase in ("decided_by", "decision_reason", "latest decision", "one row per decided"):
        assert phrase in doc, phrase


def test_the_erd_and_the_console_follow():
    assert "onboarding_approval" not in (ROOT / "infra" / "erd.py").read_text(encoding="utf-8")
    types = (FRONT / "api" / "types.ts").read_text(encoding="utf-8")
    trail = types[types.index("approvals?: {") : types.index("}[];", types.index("approvals?: {"))]
    assert "step" not in trail and "approver_role" in trail
    pages = (FRONT / "features" / "onboarding" / "pages.tsx").read_text(encoding="utf-8")
    assert "a.step" not in pages
    # the decision is still drawn from the same fields, under its new heading
    assert "a.reason" in pages and "a.decided_at" in pages
    assert '"Decision" : "Previous decision"' in pages and "Decision trail" not in pages
