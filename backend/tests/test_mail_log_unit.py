"""The mail log: db/480, migration 0052 and the Ops side of modules/outbox.

What this file guards, in the order it would hurt:

  * an unsent invitation's token reaching anyone but its recipient: the Ops
    list never looks at a row's context, a token mail is emptied once sent or
    re-sent, and a re-send past the link's life is refused;
  * a client's session reading another organisation's mail: every read is a
    definer function that checks is_platform_admin() or the row's org_id;
  * the console's offer and reminder screens going blind: mail_mark writes the
    outcome back onto task_offer_recipient and engagement_reminder;
  * the running 0051 API breaking while 0052 lands: the three-argument
    mail_enqueue stays;
  * the migration drifting from the SQL file, or the capability existing in
    one of the two seeding paths only.

conftest.py's database fixtures raise NotImplementedError, so SQL is read
rather than executed.

    pytest tests/test_mail_log_unit.py
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

from sourcehub.config import settings
from sourcehub.modules.outbox import service as outbox

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "480_mail_log.sql"
SEED_SQL = ROOT / "db" / "900_seed.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0052_mail_log.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

SQL_TEXT = SQL.read_text(encoding="utf-8")
SEED_TEXT = SEED_SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
CAPS = ("mail.read", "mail.resend")
FUNCTIONS = [
    ("mail_enqueue", "text, jsonb, uuid[], text, uuid, text"),
    ("mail_enqueue", "text, jsonb, uuid[]"),
    ("mail_enqueue_to", "text, jsonb, citext, text, text, text, uuid, text, boolean, timestamptz"),
    ("mail_mark", "uuid[], text"),
    ("mail_pending", "int"),
    ("mail_status", "text, uuid"),
    ("mail_stats", ""),
    ("mail_log", "text, int, timestamptz"),
    ("mail_resend", "uuid"),
    ("mail_purge", "int, int"),
]


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0052", "exec"), ns)
    return ns["_statements"](ddl)


def _body(fn: str, sig: str | None = None) -> str:
    """The $fn$ body of a function in db/480; `sig` picks an overload."""
    code = _strip_comments(SQL_TEXT)
    head = rf"FUNCTION {fn}\({re.escape(sig)}" if sig is not None else rf"FUNCTION {fn}\("
    m = re.search(head + r".*?\$fn\$(.*?)\$fn\$", code, re.S)
    assert m, fn
    return m.group(1)


# ---------------------------------------------------------------------------
# The SQL file and the migration
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0051():
    assert re.search(r'^revision = "0052"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0051"$', MIGRATION_TEXT, re.M)


def test_the_file_is_in_the_bundle_after_470():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("480_mail_log") == files.index("470_mail_outbox") + 1


def test_no_comment_line_ends_a_statement():
    for label, text in (
        ("db/480", SQL_TEXT),
        ("_SEED", _literal("_SEED")),
        ("_DOWN", _literal("_DOWN")),
    ):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"
                assert "$fn$" not in line, f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_function_whole_and_in_order():
    stmts = _statements(_literal("_UP"))
    assert all(s.count("$fn$") in (0, 2) for s in stmts)
    created = [
        re.search(r"FUNCTION (\w+)", s).group(1) for s in stmts if "CREATE OR REPLACE FUNCTION" in s
    ]
    assert created == [name for name, _ in FUNCTIONS]
    # the return type changed, so the old one is dropped first (a statement
    # carries the comment lines above it)
    assert any("DROP FUNCTION mail_pending(int);" in s for s in stmts)


def test_every_function_is_definer_and_granted_to_the_api_only():
    code = _strip_comments(SQL_TEXT)
    heads = [
        (m.group(1), m.group(2), m.group(0))
        for m in re.finditer(
            r"CREATE OR REPLACE FUNCTION (\w+)\((.*?)\)\s*RETURNS.*?\$fn\$", code, re.S
        )
    ]
    for fn, sig in FUNCTIONS:
        arity = sig.count(",") + 1 if sig else 0
        head = next(
            h
            for name, params, h in heads
            if name == fn and (params.count(",") + 1 if params.strip() else 0) == arity
        )
        assert "SECURITY DEFINER" in head and "SET search_path = public" in head, (fn, sig)
        target = rf"FUNCTION {re.escape(fn)}\({re.escape(sig)}\)"
        assert re.search(rf"REVOKE EXECUTE ON {target}\s+FROM PUBLIC", code), (fn, sig)
        assert re.search(rf"GRANT\s+EXECUTE ON {target}\s+TO sourcehub_app;", code), (fn, sig)


def test_the_table_keeps_row_security_with_no_policy_and_no_grants():
    code = _strip_comments(SQL_TEXT)
    assert "CREATE POLICY" not in code
    assert "GRANT SELECT" not in code and "GRANT INSERT" not in code
    assert not re.search(r"(?<!NO )FORCE\s+ROW\s+LEVEL\s+SECURITY", code, re.I)
    for col in (
        "org_id",
        "entity_type",
        "entity_id",
        "label",
        "reply_to",
        "scrub_on_send",
        "scrubbed_at",
        "resend_until",
        "resent_from",
    ):
        assert f"ALTER TABLE mail_outbox ADD COLUMN {col} " in code, col
    assert "CHECK ((entity_type IS NULL) = (entity_id IS NULL))" in code


def test_the_three_argument_enqueue_stays_for_the_running_api():
    assert "SELECT mail_enqueue(p_template, p_context, p_org_ids, NULL, NULL, '')" in _body(
        "mail_enqueue", "p_template text, p_context jsonb, p_org_ids uuid[])"
    )


def test_enqueue_stamps_the_organisation_from_the_session_not_a_parameter():
    for body in (
        _body("mail_enqueue", "p_template text, p_context jsonb, p_org_ids uuid[],"),
        _body("mail_enqueue_to"),
    ):
        assert "current_org_id()" in body
    code = _strip_comments(SQL_TEXT)
    assert not re.search(r"\bp_org_id\b", code)


def test_marking_scrubs_token_mails_and_writes_back_to_the_subject_rows():
    body = _body("mail_mark")
    assert "WHERE id = ANY (p_ids) AND sent_at IS NULL AND failed_at IS NULL" in body
    assert "scrub_on_send THEN '{}'::jsonb" in body
    assert "scrubbed_at    = CASE WHEN p_reason IS NULL AND scrub_on_send THEN now()" in body
    assert "UPDATE task_offer_recipient t" in body and "'task_offer_recipient'" in body
    assert "UPDATE engagement_reminder e" in body and "'engagement_reminder'" in body
    assert "SET sent_at = d.sent_at, send_error = p_reason" in body


def test_pending_settles_stale_rows_through_mark_so_the_subject_hears_too():
    body = _body("mail_pending")
    assert "PERFORM mail_mark(v_old, 'too old')" in body
    assert "interval '48 hours'" in body
    assert "m.reply_to" in body and "ORDER  BY m.created_at" in body and "LIMIT  p_limit" in body


def test_status_is_for_the_rows_owner_or_operations():
    body = _body("mail_status")
    assert "is_platform_admin() OR m.org_id = current_org_id()" in body
    assert "LIMIT  1" in body and "ORDER  BY m.created_at DESC" in body


def test_the_ops_reads_refuse_everyone_but_the_platform_role():
    for fn in ("mail_stats", "mail_log", "mail_resend"):
        body = _body(fn)
        assert "IF NOT is_platform_admin() THEN" in body, fn
        assert "operations only" in body, fn


def test_the_list_never_looks_at_a_rows_context():
    body = _body("mail_log")
    assert "context" not in body
    assert "scrubbed_at IS NULL" in body
    assert "m.resend_until > now()" in body
    for status in ("'all'", "'sent'", "'failed'", "'waiting'"):
        assert status in body
    assert "p_before IS NULL OR m.created_at < p_before" in body


def test_a_resend_copies_a_failed_row_once_and_only_while_the_link_lives():
    body = _body("mail_resend")
    assert "FOR UPDATE" in body
    assert "no such mail" in body and "no_data_found" in body
    assert "only a failed mail can be re-sent" in body
    assert "m.scrubbed_at IS NOT NULL" in body
    assert "m.resend_until <= now()" in body
    assert "already re-sent" in body
    assert "resent_from" in body
    assert "SET context = '{}'::jsonb, scrubbed_at = now()" in body


def test_stats_count_a_utc_day_and_the_last_week():
    body = _body("mail_stats")
    assert "date_trunc('day', now(), 'UTC')" in body
    for key in (
        "'since'",
        "'sent_today'",
        "'failed_today'",
        "'waiting'",
        "'failed_open'",
        "'days'",
    ):
        assert key in body, key
    assert "interval '6 days'" in body and "interval '30 days'" in body


def test_purge_deletes_by_age_only():
    body = _body("mail_purge")
    assert "DELETE FROM mail_outbox" in body
    assert "make_interval(days => p_sent_days)" in body
    assert "make_interval(days => p_failed_days)" in body


# ---------------------------------------------------------------------------
# Seeding the capabilities, both ways; the downgrade
# ---------------------------------------------------------------------------


def test_upgrade_runs_the_schema_then_the_seed():
    tree = ast.parse(MIGRATION_TEXT)
    up = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "upgrade")
    loop = next(n for n in ast.walk(up) if isinstance(n, ast.For))
    names = [n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name)]
    assert names == ["_statements", "_UP", "_statements", "_SEED"]


def test_the_capabilities_live_in_both_seeding_paths():
    seed = _literal("_SEED")
    for cap in CAPS:
        assert f"('{cap}'" in SEED_TEXT, f"{cap} missing from db/900"
        assert f"('{cap}'" in seed, f"{cap} missing from _SEED"
    assert seed.count("ON CONFLICT") == 2
    grants = re.search(r"r.code = 'platform_admin' AND p.code IN \((.*?)\);", SEED_TEXT, re.S)
    assert grants and all(f"'{cap}'" in grants.group(1) for cap in CAPS)
    assert (
        "r.code = 'platform_admin' AND r.is_system AND p.code IN ('mail.read', 'mail.resend')"
        in seed
    )


def test_the_downgrade_refuses_while_mail_waits_and_restores_the_470_bodies():
    down = _literal("_DOWN")
    assert "sent_at IS NULL AND failed_at IS NULL" in down.split("DELETE FROM", 1)[0]
    assert "RAISE EXCEPTION '0052 downgrade" in down
    assert down.index("DELETE FROM role_permission") < down.index("DELETE FROM permission WHERE")
    for fn in (
        "mail_purge(int, int)",
        "mail_resend(uuid)",
        "mail_log(text, int, timestamptz)",
        "mail_stats()",
        "mail_status(text, uuid)",
        "mail_enqueue(text, jsonb, uuid[], text, uuid, text)",
        "mail_pending(int)",
    ):
        assert f"DROP FUNCTION IF EXISTS {fn};" in down, fn
    for fn in (
        "mail_enqueue(p_template text, p_context jsonb, p_org_ids uuid[])",
        "mail_pending(p_limit int)",
        "mail_mark(p_ids uuid[], p_reason text)",
    ):
        assert f"CREATE OR REPLACE FUNCTION {fn}" in down, fn
    # the restored bodies are db/470's, not a retyping
    sql470 = (ROOT / "db" / "470_mail_outbox.sql").read_text(encoding="utf-8")
    for fn in ("mail_enqueue", "mail_pending", "mail_mark"):
        m = re.search(rf"CREATE OR REPLACE FUNCTION {fn}\(.*?\n\$fn\$;", sql470, re.S)
        assert m and m.group(0) in down, fn
    for col in (
        "resent_from",
        "resend_until",
        "scrubbed_at",
        "scrub_on_send",
        "reply_to",
        "label",
        "entity_id",
        "entity_type",
        "org_id",
    ):
        assert f"DROP COLUMN IF EXISTS {col};" in down, col


# ---------------------------------------------------------------------------
# The dispatcher's new edges
# ---------------------------------------------------------------------------


def test_the_clock_starts_quickly_ticks_every_five_seconds_and_keeps_history_as_agreed():
    assert outbox.FIRST_PASS_DELAY == 5
    assert settings.mail_outbox_tick_seconds == 5
    assert settings.mail_outbox_keep_sent_days == 30
    assert settings.mail_outbox_keep_failed_days == 90
    assert outbox.STATUSES == ("failed", "all", "waiting", "sent")


def test_purge_runs_once_an_hour():
    assert outbox.purge_due(now=1000.0, last=None)
    assert not outbox.purge_due(now=1000.0, last=1000.0 - 3599)
    assert outbox.purge_due(now=1000.0, last=1000.0 - 3600)


def test_prepare_carries_the_reply_to_into_the_message():
    row = {
        "id": "r1",
        "to_email": "lab@example.org",
        "to_name": "Lab",
        "template": "rfp_awarded",
        "reply_to": "Ravi <ravi@northstar.co>",
        "context": {
            "recipient_name": "Priya",
            "recipient_org": "NorthStar",
            "client_name": "Acme",
            "request_ref": "RFP-0007",
            "title": "Shelves",
            "contract_ref": "CTR-0003",
            "price_text": "USD 1",
            "contract_id": "22222222-2222-2222-2222-222222222222",
        },
    }
    out = outbox.Outcome()
    ready, msgs = outbox.prepare([row], skip_reserved=False, into=out)
    assert len(ready) == 1 and len(msgs[0]) == 5
    assert msgs[0][0] == "lab@example.org" and msgs[0][4] == "Ravi <ravi@northstar.co>"
    row2 = {**row, "id": "r2"}
    del row2["reply_to"]
    _, msgs2 = outbox.prepare([row2], skip_reserved=False, into=out)
    assert msgs2[0][4] is None
