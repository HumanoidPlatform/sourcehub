"""The mail outbox: db/480, migration 0052 and modules/outbox.

What this file guards, in the order it would hurt:

  * a mail leaving for a decision that rolled back, or twice for one row: the
    rows are written in the deciding transaction and the pass reads committed
    rows, under one advisory lock, in one transaction, marking every row it
    touched;
  * the mail server being down turning into rows marked failed (they must
    wait), or into a flood of stale mails later (the two-day limit lives in
    mail_pending);
  * demo accounts on reserved domains bouncing off a real provider;
  * a client's session reading another organisation's addresses: the table
    has no policy and the expansion happens inside a definer function;
  * the migration drifting from the SQL file.

conftest.py's database fixtures raise NotImplementedError, so SQL is read
rather than executed and the pass runs against a session that answers from a
script.

    pytest tests/test_mail_outbox_unit.py
"""

from __future__ import annotations

import ast
import asyncio
import re
import smtplib
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from sourcehub.config import settings
from sourcehub.modules.outbox import service as outbox
from sourcehub.platform.mail import smtp as smtp_mod
from sourcehub.platform.mail.smtp import SMTPDeliveryError

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "480_mail_outbox.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0052_mail_outbox.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
MAIN = ROOT / "backend" / "src" / "sourcehub" / "main.py"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


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


def _body(fn: str) -> str:
    m = re.search(rf"FUNCTION {fn}\(.*?\$fn\$(.*?)\$fn\$", _strip_comments(SQL_TEXT), re.S)
    assert m, fn
    return m.group(1)


# ---------------------------------------------------------------------------
# The SQL file and the migration
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_the_terms_0051():
    assert re.search(r'^revision = "0052"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0051"$', MIGRATION_TEXT, re.M)


def test_the_file_is_in_the_bundle_after_the_terms_470():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("480_mail_outbox") == files.index("470_platform_terms") + 1


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/480", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_function_whole():
    stmts = _statements(_literal("_UP"))
    assert all(s.count("$fn$") in (0, 2) for s in stmts)
    created = [
        re.search(r"FUNCTION (\w+)", s).group(1) for s in stmts if "CREATE OR REPLACE FUNCTION" in s
    ]
    assert created == ["org_mail_recipients", "mail_enqueue", "mail_pending", "mail_mark"]
    down = _statements(_literal("_DOWN"))
    assert len(down) == 5 and all(s.startswith("DROP") for s in down)


def test_the_table_has_row_security_no_policy_and_no_force():
    code = _strip_comments(SQL_TEXT)
    assert "CREATE TABLE mail_outbox" in code
    assert "ALTER TABLE mail_outbox ENABLE ROW LEVEL SECURITY;" in code
    assert "CREATE POLICY" not in code
    assert "GRANT SELECT" not in code and "GRANT INSERT" not in code
    assert not re.search(r"(?<!NO )FORCE\s+ROW\s+LEVEL\s+SECURITY", code, re.I)
    assert "CHECK (sent_at IS NULL OR failed_at IS NULL)" in code


def test_every_function_is_definer_and_granted_to_the_api_only():
    code = _strip_comments(SQL_TEXT)
    for fn, sig in (
        ("org_mail_recipients", "uuid[]"),
        ("mail_enqueue", "text, jsonb, uuid[]"),
        ("mail_pending", "int"),
        ("mail_mark", "uuid[], text"),
    ):
        head = re.search(rf"FUNCTION {fn}\(.*?\$fn\$", code, re.S)
        assert head and "SECURITY DEFINER" in head.group(0), fn
        assert "SET search_path = public" in head.group(0), fn
        target = rf"FUNCTION {re.escape(fn)}\({re.escape(sig)}\)"
        assert re.search(rf"REVOKE EXECUTE ON {target}\s+FROM PUBLIC", code), fn
        assert re.search(rf"GRANT\s+EXECUTE ON {target}\s+TO sourcehub_app;", code), fn


def test_recipients_are_active_staff_of_active_organisations_once_each():
    body = _body("org_mail_recipients")
    for clause in (
        "g.revoked_at IS NULL",
        "u.status = 'active' AND u.deleted_at IS NULL",
        "o.status = 'active' AND o.deleted_at IS NULL",
        "r.applies_to_kind IS NOT NULL",
        "DISTINCT ON (u.email)",
        "g.org_id = ANY (p_org_ids)",
    ):
        assert clause in body, clause


def test_enqueue_expands_organisations_in_the_database_and_names_the_recipient():
    body = _body("mail_enqueue")
    assert "FROM   org_mail_recipients(p_org_ids)" in body
    assert "'recipient_name', r.full_name" in body and "'recipient_org'" in body
    assert "GET DIAGNOSTICS v_n = ROW_COUNT" in body


def test_pending_settles_only_stale_rows_and_returns_the_oldest_first():
    body = _body("mail_pending")
    assert "'too old'" in body and "interval '48 hours'" in body
    assert body.count("sent_at IS NULL AND m.failed_at IS NULL") == 2
    assert "ORDER  BY m.created_at" in body and "LIMIT  p_limit" in body


def test_marking_only_touches_rows_still_waiting():
    assert "sent_at IS NULL AND failed_at IS NULL" in _body("mail_mark")


def test_the_api_starts_the_clock_behind_its_switch():
    main = MAIN.read_text(encoding="utf-8")
    assert "outbox.run_forever()" in main and "settings.mail_outbox_enabled" in main


# ---------------------------------------------------------------------------
# Pure: reserved domains and rows to messages
# ---------------------------------------------------------------------------


def test_reserved_domains_are_recognised_and_real_ones_are_not():
    for addr in (
        "partner@northstar.example",
        "A@X.TEST",
        "x@mail.invalid",
        "a@b.localhost.",
        "ops@stack.local",
    ):
        assert outbox.is_reserved(addr), addr
    for addr in ("a@example.com", "a@test.co.in", "ops@cosarathi.ai", "x@local.example.org"):
        assert not outbox.is_reserved(addr), addr


def _ctx(**over: Any) -> dict[str, Any]:
    ctx: dict[str, Any] = {
        "recipient_name": "Priya",
        "recipient_org": "NorthStar",
        "client_name": "Acme",
        "request_ref": "RFP-0007",
        "title": "Shelf & price tags",
        "contract_ref": "CTR-0003",
        "price_text": "USD 2,900 per 1,000 photos",
        "contract_id": "22222222-2222-2222-2222-222222222222",
    }
    ctx.update(over)
    return ctx


def _row(email: str = "partner@northstar.co", template: str = "rfp_awarded", **over: Any):
    return {
        "id": uuid.uuid4(),
        "to_email": email,
        "to_name": "Priya",
        "template": template,
        "context": _ctx(**over),
    }


def test_prepare_fails_what_cannot_become_a_mail_and_keeps_the_rest_in_order():
    good, reserved, unknown, broken = (
        _row(),
        _row(email="partner@northstar.example"),
        _row(template="no_such_mail"),
        _row(),
    )
    del broken["context"]["contract_ref"]
    out = outbox.Outcome()
    ready, msgs = outbox.prepare([good, reserved, unknown, broken], skip_reserved=True, into=out)
    assert [r["id"] for r in ready] == [good["id"]]
    assert msgs[0][0] == "partner@northstar.co"
    assert msgs[0][1] == "You won RFP-0007 Shelf & price tags"
    assert "CTR-0003" in msgs[0][2] and "CTR-0003" in msgs[0][3]
    assert out.failed == {
        "reserved domain": [reserved["id"]],
        "unknown template no_such_mail": [unknown["id"]],
        "render failed: TypeError": [broken["id"]],
    }


def test_reserved_domains_go_through_when_the_skip_is_off():
    out = outbox.Outcome()
    ready, msgs = outbox.prepare(
        [_row(email="partner@northstar.example")], skip_reserved=False, into=out
    )
    assert len(ready) == 1 and msgs[0][0] == "partner@northstar.example" and not out.failed


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
    def __init__(self, lock=True, rows=(), enqueued=0):
        self.lock, self.rows, self.enqueued, self.calls = lock, list(rows), enqueued, []

    async def execute(self, stmt, params=None):
        sql = str(stmt)
        self.calls.append((sql, params))
        if "pg_try_advisory_xact_lock" in sql:
            return _Result(scalar=self.lock)
        if "mail_pending" in sql:
            return _Result(rows=self.rows)
        if "mail_enqueue" in sql:
            return _Result(scalar=self.enqueued)
        return _Result()

    def called(self, fn):
        return [p for s, p in self.calls if fn in s]


def _opener(session):
    @asynccontextmanager
    async def open_session():
        yield session

    return open_session


def _run(session, send):
    return asyncio.run(outbox.run_pass(send=send, open_session=_opener(session)))


def test_enqueue_hands_the_organisations_to_the_database_and_nothing_for_none():
    s = _Session(enqueued=3)
    org = uuid.uuid4()
    n = asyncio.run(outbox.enqueue(s, "rfp_awarded", {"title": "x"}, [org]))
    assert n == 3
    calls = [(sql, p) for sql, p in s.calls if "mail_enqueue" in sql]
    assert len(calls) == 1
    sql, params = calls[0]
    assert "CAST(:c AS jsonb)" in sql and "CAST(:o AS uuid[])" in sql
    # db/490: the fan-out also records what the mail is about, when the caller says
    assert params == {
        "t": "rfp_awarded",
        "c": '{"title": "x"}',
        "o": [org],
        "et": None,
        "ei": None,
        "l": "",
    }
    s2 = _Session()
    assert asyncio.run(outbox.enqueue(s2, "rfp_awarded", {}, [])) == 0
    assert not s2.calls


def test_a_second_pass_without_the_lock_does_nothing():
    s = _Session(lock=False, rows=[_row()])

    async def send(_):
        raise AssertionError("must not send")

    assert _run(s, send)["skipped"] == 1
    assert not s.called("mail_pending")


def test_sent_rows_are_marked_sent_and_refused_ones_failed_with_the_servers_reason():
    a, b = _row(), _row(email="other@meridian.co")
    s = _Session(rows=[a, b])

    async def send(msgs):
        assert [m[0] for m in msgs] == ["partner@northstar.co", "other@meridian.co"]
        # db/500: the adapter says whether a refusal is worth retrying
        return [None, smtp_mod.SendError("SMTPRecipientsRefused: 550 no such user", False)]

    counts = _run(s, send)
    assert counts["sent"] == 1 and counts["failed"] == 1 and counts["waiting"] == 0
    marks = s.called("mail_mark")
    assert {"ids": [a["id"]]} in marks
    assert {"ids": [b["id"]], "r": "smtp: SMTPRecipientsRefused: 550 no such user"} in marks
    assert s.called("mail_pending") == [{"n": settings.mail_outbox_batch}]


def test_the_mail_server_being_down_leaves_rows_waiting_but_settles_the_unsendable(monkeypatch):
    monkeypatch.setattr(outbox.settings, "mail_outbox_skip_reserved_domains", True)
    good, reserved = _row(), _row(email="demo@acme.example")
    s = _Session(rows=[good, reserved])

    async def send(_):
        raise SMTPDeliveryError("Could not send mail via smtp.gmail.com: timeout")

    counts = _run(s, send)
    assert counts == {"sent": 0, "failed": 1, "deferred": 0, "waiting": 1, "skipped": 0}
    assert s.called("mail_mark") == [{"ids": [reserved["id"]], "r": "reserved domain"}]


def test_nothing_pending_sends_nothing():
    s = _Session(rows=[])

    async def send(_):
        raise AssertionError("must not send")

    assert _run(s, send) == {"sent": 0, "failed": 0, "deferred": 0, "waiting": 0, "skipped": 0}
    assert not s.called("mail_mark")


# ---------------------------------------------------------------------------
# The adapter's batch: one bad message never stops the queue
# ---------------------------------------------------------------------------


class _FakeSMTP:
    def __init__(self, refuse=(), quit_fails=False):
        self.sent, self.refuse, self.quit_fails, self.closed = [], set(refuse), quit_fails, False

    def send_message(self, msg):
        if msg["To"] in self.refuse:
            raise smtplib.SMTPRecipientsRefused({msg["To"]: (550, b"no such user")})
        self.sent.append(msg)

    def quit(self):
        if self.quit_fails:
            raise smtplib.SMTPServerDisconnected("connection dropped on QUIT")

    def close(self):
        self.closed = True


def _batch(monkeypatch, fake, messages):
    monkeypatch.setattr(smtp_mod, "_open", lambda: fake)
    return smtp_mod._send_many_sync(messages)


def test_a_title_with_a_line_break_becomes_a_one_line_subject_not_a_stopped_queue(monkeypatch):
    # db/490: subjects carry RFP, task and dataset titles; Reply-To a person's name
    fake = _FakeSMTP()
    errors = _batch(
        monkeypatch,
        fake,
        [
            ("a@x.co", "New RFP: RFP-1 Shelf\nimagery\r\nBcc: evil@x.co", "t", None, None),
            ("b@x.co", "fine", "t", None, "Ravi\nMenon <ravi@n.co>"),
        ],
    )
    assert errors == [None, None]
    assert [m["Subject"] for m in fake.sent] == [
        "New RFP: RFP-1 Shelf imagery Bcc: evil@x.co",
        "fine",
    ]
    assert fake.sent[1]["Reply-To"] == "Ravi Menon <ravi@n.co>"
    assert all("Bcc" not in m for m in fake.sent)


def test_a_message_that_cannot_be_built_fails_its_own_row_only(monkeypatch):
    fake = _FakeSMTP(refuse={"b@x.co"})
    monkeypatch.setattr(smtp_mod, "_build", _build_failing_on("boom"))
    errors = _batch(
        monkeypatch,
        fake,
        [
            ("a@x.co", "ok", "t", None, None),
            ("b@x.co", "ok", "t", None, None),
            ("c@x.co", "boom", "t", None, None),
            ("d@x.co", "ok", "t", None, None),
        ],
    )
    assert errors[0] is None and errors[3] is None
    assert errors[1].text.startswith("SMTPRecipientsRefused") and errors[1].temporary is False
    assert errors[2].text.startswith("ValueError") and errors[2].temporary is False
    assert [m["To"] for m in fake.sent] == ["a@x.co", "d@x.co"]


def test_a_failed_quit_after_the_batch_does_not_undo_what_was_delivered(monkeypatch):
    fake = _FakeSMTP(quit_fails=True)
    errors = _batch(monkeypatch, fake, [("a@x.co", "ok", "t", None, None)])
    assert errors == [None] and len(fake.sent) == 1 and fake.closed


def _build_failing_on(bad_subject):
    real = smtp_mod._build

    def build(to, subject, body, html=None, reply_to=None):
        if subject == bad_subject:
            raise ValueError("cannot build this one")
        return real(to, subject, body, html, reply_to)

    return build
