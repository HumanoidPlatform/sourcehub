"""A sign-in lock is a timer, not a status: db/570, migration 0062.

Five failed sign-ins lock an account for 15 minutes. db/100's
record_login_attempt also set status = 'locked', which only a password reset
undid, so a person who signed in again afterwards was passed over by every read
that wants an active person: crowd offers, reminders, organisation mail.

What this file guards, in the order it would hurt:

  * a failed sign-in writing the status again;
  * the lock itself going missing: failures still count, the timer still
    starts at the threshold, and login() still refuses while it runs;
  * accounts already caught staying caught;
  * the migration drifting from the SQL file, or the downgrade not putting
    db/100's function back.

Files only; no database is opened.

    pytest tests/test_login_lock_status_unit.py
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "570_login_lock_status.sql").read_text(encoding="utf-8")
DB100 = (ROOT / "db" / "100_rls.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0062_login_lock_status.py"
).read_text(encoding="utf-8")
LOGIN_TEXT = (
    ROOT / "backend" / "src" / "sourcehub" / "modules" / "identity" / "service.py"
).read_text(encoding="utf-8")
BUNDLE = ROOT / "infra" / "bundle_schema.sh"


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0062", "exec"), ns)
    return ns["_statements"](ddl)


def _function(sql: str, name: str) -> str:
    start = sql.index(f"CREATE OR REPLACE FUNCTION {name}(")
    return sql[start : sql.index("$fn$;", start)]


def _success(fn: str) -> str:
    return fn[fn.index("IF p_succeeded THEN") : fn.index("  ELSE\n")]


def _failure(fn: str) -> str:
    start = fn.index("  ELSE\n")
    return fn[start : fn.index("  END IF;", start)]


NEW = _function(SQL_TEXT, "record_login_attempt")
OLD = _function(DB100, "record_login_attempt")


# ---------------------------------------------------------------------------
# The lock is the timer alone
# ---------------------------------------------------------------------------
def test_a_failed_sign_in_no_longer_writes_the_status():
    assert "status" in _failure(OLD)  # what db/100 did, so this test has teeth
    assert "status" not in _failure(NEW)


def test_failures_still_count_and_start_the_timer_at_the_threshold():
    failure = _failure(NEW)
    assert "SET failed_login_count = failed_login_count + 1" in failure
    assert "locked_until = CASE WHEN failed_login_count + 1 >= p_lock_threshold" in failure
    assert "THEN now() + p_lock_for ELSE locked_until END" in failure


def test_a_successful_sign_in_is_unchanged():
    assert _success(NEW) == _success(OLD)


def test_only_the_failure_branch_changed_so_the_grants_still_apply():
    # same name, arguments, defaults and SECURITY DEFINER header: CREATE OR
    # REPLACE keeps db/100's REVOKE and GRANT on the function
    assert NEW[: NEW.index("AS $fn$")] == OLD[: OLD.index("AS $fn$")]
    assert NEW.replace(_failure(NEW), "") == OLD.replace(_failure(OLD), "")


def test_login_still_refuses_while_the_timer_runs():
    lock = LOGIN_TEXT.index('creds["locked_until"] > dt.datetime.now(dt.UTC)')
    status = LOGIN_TEXT.index('creds["status"] not in')
    password = LOGIN_TEXT.index("pwd.verify_password(", lock)
    assert lock < status < password


def test_nothing_else_writes_locked():
    write = re.compile(r"THEN\s+'locked'|SET\s+status\s*=\s*'locked'", re.I)
    offenders = [
        p.name
        for p in sorted((ROOT / "db").glob("*.sql"))
        if p.name != "100_rls.sql" and write.search(p.read_text(encoding="utf-8"))
    ]
    assert not offenders, f"these files write status 'locked' again: {offenders}"


# ---------------------------------------------------------------------------
# Accounts already caught
# ---------------------------------------------------------------------------
def test_every_caught_account_is_put_back():
    repair = _statements(_literal("_UP"))[1]
    assert repair.startswith("UPDATE app_user")
    # the rule app_user_active_has_credential enforces: active needs a credential
    assert "SET status = CASE WHEN password_hash IS NULL AND external_idp_subject IS NULL" in repair
    assert "THEN 'invited'::user_status ELSE 'active'::user_status END" in repair
    assert repair.rstrip().endswith("WHERE status = 'locked';")


def test_a_running_lock_is_left_to_run_out():
    repair = _statements(_literal("_UP"))[1]
    assert "locked_until" not in repair and "failed_login_count" not in repair


# ---------------------------------------------------------------------------
# The SQL file and the migration
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0061():
    assert re.search(r'^revision = "0062"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0061"$', MIGRATION_TEXT, re.M)


def test_the_file_follows_560_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("570_login_lock_status") == files.index("560_terms_1_1") + 1


def test_no_comment_line_ends_a_statement():
    # the splitter ends a statement at a line ending ';' outside a body
    comments = [ln for ln in SQL_TEXT.splitlines() if ln.strip().startswith("--")]
    assert not [ln for ln in comments if ln.rstrip().endswith(";")]


def test_the_splitter_keeps_the_function_whole():
    up = _statements(_literal("_UP"))
    assert len(up) == 2
    assert "CREATE OR REPLACE FUNCTION record_login_attempt(" in up[0]
    assert up[0].count("$fn$") == 2


def test_no_table_or_column_changes():
    assert "CREATE TABLE" not in SQL_TEXT and "ALTER TABLE" not in SQL_TEXT


def test_the_downgrade_puts_db100s_function_back_and_marks_no_one_locked():
    down = _statements(_literal("_DOWN"))
    assert len(down) == 1
    assert _function(down[0] + "\n", "record_login_attempt") == OLD
