"""Push notifications: db/300, migration 0033 and modules/push.

What this file guards, in the order it would hurt:

  * a phone buzzing for something that rolled back, or twice for one row:
    the pass only reads committed rows, under one advisory lock, in one
    transaction, and marks every row it touched;
  * Expo being down turning into rows marked failed (they must wait), or into
    a flood of stale pushes later (the hour limit lives in push_pending);
  * a dead token being pushed to forever;
  * the token leaking through an API response, which no ORM column means it
    cannot;
  * the migration drifting from the SQL file.

conftest.py's database fixtures raise NotImplementedError, so SQL is read
rather than executed and the pass runs against a session that answers from a
script.

    pytest tests/test_push_unit.py
"""

from __future__ import annotations

import ast
import asyncio
import re
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from sourcehub.api.v1.push import PushToken
from sourcehub.modules.identity.models import AppUser
from sourcehub.modules.push import expo
from sourcehub.modules.push import service as push

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "300_push.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0033_push.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
TOKEN = "ExponentPushToken[abc123]"


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
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0033", "exec"), ns)
    return ns["_statements"](ddl)


# ---------------------------------------------------------------------------
# The SQL file and the migration
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0032():
    assert re.search(r'^revision = "0033"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0032"$', MIGRATION_TEXT, re.M)


def test_the_file_is_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    assert "300_push" in m.group(1).split()


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/300", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_function_whole():
    stmts = _statements(_literal("_UP"))
    assert all(s.count("$fn$") in (0, 2) for s in stmts)
    created = [
        re.search(r"FUNCTION (\w+)", s).group(1) for s in stmts if "CREATE OR REPLACE FUNCTION" in s
    ]
    assert created == [
        "set_push_token", "unset_push_token", "push_token_dead", "push_pending", "push_mark",
    ]


def test_no_new_table_and_no_force():
    code = _strip_comments(SQL_TEXT)
    assert "CREATE TABLE" not in code
    assert not re.search(r"(?<!NO )FORCE\s+ROW\s+LEVEL\s+SECURITY", code, re.I)


def test_every_function_is_definer_and_granted_to_the_api_only():
    code = _strip_comments(SQL_TEXT)
    for fn, sig in (("set_push_token", "text"), ("unset_push_token", "text"),
                    ("push_token_dead", "text"), ("push_pending", "int"),
                    ("push_mark", "uuid[], text")):
        body = re.search(rf"FUNCTION {fn}\(.*?\$fn\$", code, re.S)
        assert body and "SECURITY DEFINER" in body.group(0), fn
        target = rf"FUNCTION {re.escape(fn)}\({re.escape(sig)}\)"
        assert re.search(rf"REVOKE EXECUTE ON {target}\s+FROM PUBLIC", code), fn
        assert re.search(rf"GRANT\s+EXECUTE ON {target}\s+TO sourcehub_app;", code), fn


def test_the_phone_can_only_touch_its_own_user():
    code = _strip_comments(SQL_TEXT)
    set_fn = re.search(r"FUNCTION set_push_token.*?\$fn\$(.*?)\$fn\$", code, re.S).group(1)
    assert "current_user_id()" in set_fn
    assert "WHERE id = v_user" in set_fn
    unset_fn = re.search(r"FUNCTION unset_push_token.*?\$fn\$(.*?)\$fn\$", code, re.S).group(1)
    assert "id = current_user_id() AND push_token = p_token" in unset_fn


def test_pending_settles_stale_read_and_tokenless_rows_and_skips_org_wide_ones():
    code = _strip_comments(SQL_TEXT)
    fn = re.search(r"FUNCTION push_pending.*?\$fn\$(.*?)\$fn\$", code, re.S).group(1)
    for reason in ("'too old'", "'already read'", "'no push token'"):
        assert reason in fn
    assert "interval '1 hour'" in fn
    assert fn.count("n.user_id IS NOT NULL AND n.sent_at IS NULL AND n.failed_at IS NULL") == 2


def test_marking_only_touches_rows_still_waiting():
    code = _strip_comments(SQL_TEXT)
    fn = re.search(r"FUNCTION push_mark.*?\$fn\$(.*?)\$fn\$", code, re.S).group(1)
    assert "sent_at IS NULL AND failed_at IS NULL" in fn


def test_the_token_is_not_on_the_orm_model():
    # No column, so no serializer that walks __table__.columns can return it.
    assert "push_token" not in AppUser.__table__.columns


# ---------------------------------------------------------------------------
# The endpoint's validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("token", [TOKEN, "ExpoPushToken[xyz]"])
def test_expo_tokens_are_accepted(token):
    assert PushToken(token=token).token == token


@pytest.mark.parametrize(
    "token", ["", "abc", "ExponentPushToken[]", "fcm:abc", "ExponentPushToken[a]x"]
)
def test_anything_else_is_refused(token):
    with pytest.raises(ValidationError):
        PushToken(token=token)


# ---------------------------------------------------------------------------
# Pure: message() and settle()
# ---------------------------------------------------------------------------


def _row(body="Your batch was accepted", token=TOKEN, **kw):
    return {"id": uuid.uuid4(), "token": token, "body": body,
            "link_page": "assignment", "link_params": {"id": "a1"}, **kw}


def test_a_message_carries_what_the_app_needs_to_open_the_screen():
    r = _row()
    m = push.message(r)
    assert m["to"] == TOKEN
    assert m["body"] == "Your batch was accepted"
    assert m["data"] == {"notification_id": str(r["id"]), "link_page": "assignment",
                         "link_params": {"id": "a1"}}
    assert m["channelId"] == "assignments"
    assert m["priority"] == "high"


def test_a_long_body_is_cut_to_the_shade():
    m = push.message(_row(body="x" * 500))
    assert len(m["body"]) == push.BODY_CHARS
    assert m["body"].endswith("…")


def test_tickets_mark_rows_and_dead_tokens():
    ok, gone, other = _row(), _row(token="ExponentPushToken[dead]"), _row()
    out = push.Outcome()
    push.settle(
        [ok, gone, other],
        [{"status": "ok", "id": "t1"},
         {"status": "error", "message": "not registered",
          "details": {"error": "DeviceNotRegistered"}},
         {"status": "error", "message": "Message too big"}],
        out,
    )
    assert out.sent == [ok["id"]]
    assert out.failed == {"expo: DeviceNotRegistered": [gone["id"]],
                          "expo: Message too big": [other["id"]]}
    assert out.dead_tokens == {"ExponentPushToken[dead]"}


# ---------------------------------------------------------------------------
# The pass, against a scripted session
# ---------------------------------------------------------------------------


class _Result:
    def __init__(self, scalar=None, rows=None):
        self._scalar, self._rows = scalar, rows or []

    def scalar_one(self):
        return self._scalar

    def mappings(self):
        return self

    def all(self):
        return self._rows


class _Session:
    def __init__(self, lock=True, rows=()):
        self.lock, self.rows, self.calls = lock, list(rows), []

    async def execute(self, stmt, params=None):
        sql = str(stmt)
        self.calls.append((sql, params))
        if "pg_try_advisory_xact_lock" in sql:
            return _Result(scalar=self.lock)
        if "push_pending" in sql:
            return _Result(rows=self.rows)
        return _Result()

    def called(self, fn):
        return [p for s, p in self.calls if fn in s]


def _opener(session):
    @asynccontextmanager
    async def open_session():
        yield session
    return open_session


def _run(session, send):
    return asyncio.run(push.run_pass(send=send, open_session=_opener(session)))


def test_a_second_pass_without_the_lock_does_nothing():
    s = _Session(lock=False, rows=[_row()])

    async def send(_):
        raise AssertionError("must not send")

    assert _run(s, send)["skipped"] == 1
    assert not s.called("push_pending")


def test_sent_rows_are_marked_sent_and_dead_tokens_forgotten():
    a, b = _row(), _row(token="ExponentPushToken[dead]")
    s = _Session(rows=[a, b])

    async def send(msgs):
        assert [m["to"] for m in msgs] == [TOKEN, "ExponentPushToken[dead]"]
        return [{"status": "ok"}, {"status": "error", "details": {"error": "DeviceNotRegistered"}}]

    counts = _run(s, send)
    assert counts["sent"] == 1 and counts["failed"] == 1
    marks = s.called("push_mark")
    assert {"ids": [a["id"]]} in marks
    assert {"ids": [b["id"]], "r": "expo: DeviceNotRegistered"} in marks
    assert s.called("push_token_dead") == [{"t": "ExponentPushToken[dead]"}]


def test_expo_down_leaves_rows_waiting():
    s = _Session(rows=[_row(), _row()])

    async def send(_):
        raise expo.ExpoUnavailableError("HTTP 503")

    counts = _run(s, send)
    assert counts == {"sent": 0, "failed": 0, "waiting": 2, "skipped": 0}
    assert not s.called("push_mark")


def test_rows_go_in_batches_of_a_hundred_and_a_failed_batch_stops_the_pass():
    rows = [_row() for _ in range(250)]
    s = _Session(rows=rows)
    sizes = []

    async def send(msgs):
        sizes.append(len(msgs))
        if len(sizes) == 2:
            raise expo.ExpoUnavailableError("timeout")
        return [{"status": "ok"}] * len(msgs)

    counts = _run(s, send)
    assert sizes == [100, 100]
    assert counts["sent"] == 100 and counts["waiting"] == 150
    assert s.called("push_mark") == [{"ids": [r["id"] for r in rows[:100]]}]


def test_nothing_pending_sends_nothing():
    s = _Session(rows=[])

    async def send(_):
        raise AssertionError("must not send")

    assert _run(s, send) == {"sent": 0, "failed": 0, "waiting": 0, "skipped": 0}
