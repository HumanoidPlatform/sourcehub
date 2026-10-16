"""Mail retry: db/500, migration 0054, the adapter's classification and the
dispatcher's decision for each answer.

What this file guards, in the order it would hurt:

  * a temporary refusal (4xx, Gmail's daily limit, a dropped connection)
    failing a mail for good, or a permanent one (5xx) being retried for hours;
  * a retried mail going on forever, or past the life of the link inside it;
  * a fan-out of RFP mails delaying a password reset;
  * a mail whose link has died being sent at all;
  * the migration drifting from the SQL file.

conftest.py's database fixtures raise NotImplementedError, so SQL is read
rather than executed and the pass runs against a session that answers from a
script.

    pytest tests/test_mail_retry_unit.py
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

import pytest
from sqlalchemy.exc import DBAPIError

from sourcehub.modules.outbox import service as outbox
from sourcehub.platform.mail import smtp
from sourcehub.platform.mail.smtp import SendError, classify

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "500_mail_retry.sql"
SQL_480 = ROOT / "db" / "490_mail_log.sql"
SQL_470 = ROOT / "db" / "480_mail_outbox.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0054_mail_retry.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"

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
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0054", "exec"), ns)
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


def test_the_migration_follows_0053():
    assert re.search(r'^revision = "0054"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0053"$', MIGRATION_TEXT, re.M)


def test_the_file_is_last_in_the_bundle_after_490():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files[-1] == "500_mail_retry"
    assert files.index("500_mail_retry") == files.index("490_mail_log") + 1


def test_no_comment_line_ends_a_statement_or_holds_a_body_marker():
    for label, text in (("db/500", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"
                assert "$fn$" not in line, f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_function_whole():
    stmts = _statements(_literal("_UP"))
    assert all(s.count("$fn$") in (0, 2) for s in stmts)
    created = [
        re.search(r"FUNCTION (\w+)", s).group(1) for s in stmts if "CREATE OR REPLACE FUNCTION" in s
    ]
    assert created == [
        "mail_enqueue",
        "mail_pending",
        "mail_defer",
        "mail_stats",
        "mail_log",
        "mail_resend",
    ]


def test_every_function_is_definer_and_granted_to_the_api_only():
    code = _strip_comments(SQL_TEXT)
    for fn, sig in (
        ("mail_enqueue", "text, jsonb, uuid[], text, uuid, text"),
        ("mail_pending", "int"),
        ("mail_defer", "uuid[], text, interval"),
        ("mail_stats", ""),
        ("mail_log", "text, int, timestamptz"),
        ("mail_resend", "uuid"),
    ):
        head = re.search(rf"FUNCTION {fn}\(.*?\$fn\$", code, re.S)
        assert head and "SECURITY DEFINER" in head.group(0), fn
        assert "SET search_path = public" in head.group(0), fn
        target = rf"FUNCTION {re.escape(fn)}\({re.escape(sig)}\)"
        assert re.search(rf"REVOKE EXECUTE ON {target}\s+FROM PUBLIC", code), fn
        assert re.search(rf"GRANT\s+EXECUTE ON {target}\s+TO sourcehub_app;", code), fn


def test_four_new_columns_and_no_policy_grant_or_force():
    code = _strip_comments(SQL_TEXT)
    for col in (
        "attempts smallint NOT NULL DEFAULT 0",
        "next_attempt_at timestamptz",
        "last_error text",
        "priority smallint NOT NULL DEFAULT 0",
    ):
        assert f"ALTER TABLE mail_outbox ADD COLUMN {col};" in code, col
    assert "CREATE POLICY" not in code
    assert "GRANT SELECT" not in code and "GRANT INSERT" not in code
    assert not re.search(r"(?<!NO )FORCE\s+ROW\s+LEVEL\s+SECURITY", code, re.I)


def test_the_scan_index_follows_the_new_order():
    code = _strip_comments(SQL_TEXT)
    assert "DROP INDEX mail_outbox_waiting_idx;" in code
    assert re.search(
        r"CREATE INDEX mail_outbox_due_idx ON mail_outbox \(priority, created_at\)\s+"
        r"WHERE sent_at IS NULL AND failed_at IS NULL;",
        code,
    )


# ---------------------------------------------------------------------------
# The queue's rules, in SQL
# ---------------------------------------------------------------------------


def test_the_fan_out_queues_behind_a_person():
    body = _body("mail_enqueue")
    assert "priority)" in body and "coalesce(p_label, ''), 1" in body
    # single mails keep db/490's mail_enqueue_to, whose rows default to 0
    assert "mail_enqueue_to" not in _strip_comments(SQL_TEXT)


def test_pending_serves_a_person_first_never_a_deferred_row_and_never_a_dead_link():
    body = _body("mail_pending")
    assert "ORDER  BY m.priority, m.created_at" in body
    assert "(m.next_attempt_at IS NULL OR m.next_attempt_at <= now())" in body
    assert "m.resend_until IS NOT NULL AND m.resend_until <= now()" in body
    assert "THEN 'link expired'" in body
    assert "'link expired; last error: ' || v_old.last_error" in body
    assert "'too old; last error: ' || v_old.last_error" in body
    assert "interval '48 hours'" in body
    assert "m.attempts" in body


def test_defer_counts_waits_and_gives_up_when_no_time_is_left():
    body = _body("mail_defer")
    assert "attempts        = m.attempts + 1" in body
    assert "next_attempt_at = now() + p_after" in body
    assert "last_error      = p_error" in body
    assert "now() + p_after > m.created_at + interval '48 hours'" in body
    assert "now() + p_after > m.resend_until" in body
    assert "PERFORM mail_mark(v_late, p_error || '; no time left to retry')" in body
    assert body.count("m.sent_at IS NULL AND m.failed_at IS NULL") == 2


def test_the_ops_reads_show_the_retries_and_still_refuse_everyone_else():
    for fn in ("mail_stats", "mail_log", "mail_resend"):
        assert "IF NOT is_platform_admin() THEN" in _body(fn), fn
    assert "'retrying'" in _body("mail_stats")
    log = _body("mail_log")
    assert "WHEN m.attempts > 0 THEN 'retrying'" in log
    assert "m.attempts, m.next_attempt_at, m.last_error" in log
    assert "context" not in log


def test_a_resend_keeps_its_priority_and_starts_its_own_count():
    body = _body("mail_resend")
    assert "resent_from, priority)" in body and "m.id, m.priority)" in body
    assert "attempts" not in body
    # db/490's refusals are all still there
    for refusal in ("no such mail", "only a failed mail", "already re-sent", "retired", "expired"):
        assert refusal in body, refusal


def test_the_downgrade_refuses_while_mail_waits_and_restores_490_verbatim():
    down = _literal("_DOWN")
    assert "RAISE EXCEPTION '0054 downgrade" in down.split("DROP FUNCTION", 1)[0]
    for fn in (
        "mail_defer(uuid[], text, interval)",
        "mail_pending(int)",
        "mail_log(text, int, timestamptz)",
    ):
        assert f"DROP FUNCTION IF EXISTS {fn};" in down, fn
    sql480 = SQL_480.read_text(encoding="utf-8")
    for fn, first in (
        ("mail_enqueue", "p_template text, p_context jsonb, p_org_ids uuid[],"),
        ("mail_pending", "p_limit int"),
        ("mail_stats", ""),
        ("mail_log", "p_status text"),
        ("mail_resend", "p_id uuid"),
    ):
        m = re.search(
            rf"CREATE OR REPLACE FUNCTION {fn}\({re.escape(first)}.*?\n\$fn\$;", sql480, re.S
        )
        assert m and m.group(0) in down, fn
    idx = re.search(
        r"CREATE INDEX mail_outbox_waiting_idx.*?;", SQL_470.read_text(encoding="utf-8"), re.S
    )
    assert idx and idx.group(0) in down
    for col in ("priority", "last_error", "next_attempt_at", "attempts"):
        assert f"DROP COLUMN IF EXISTS {col};" in down, col


# ---------------------------------------------------------------------------
# The adapter: temporary or permanent, from the server's own answer
# ---------------------------------------------------------------------------


def _refused(code: int, text: bytes) -> smtplib.SMTPRecipientsRefused:
    return smtplib.SMTPRecipientsRefused({"x@y.co": (code, text)})


@pytest.mark.parametrize(
    ("error", "temporary"),
    [
        (_refused(421, b"4.7.0 Try again later, closing connection"), True),
        (
            _refused(
                450, b"4.2.1 The user you are trying to contact is receiving mail too quickly"
            ),
            True,
        ),
        (_refused(451, b"4.3.0 Mail server temporarily rejected message"), True),
        (_refused(452, b"4.2.2 The email account that you tried to reach is over quota"), True),
        (_refused(550, b"5.1.1 The email account that you tried to reach does not exist"), False),
        (_refused(550, b"5.4.5 Daily user sending limit exceeded"), True),
        (_refused(554, b"5.7.1 Message rejected"), False),
        # an IP address holding "5.4.5" is not Gmail's daily limit
        (_refused(554, b"5.7.1 Client host [185.4.5.12] blocked using zen.spamhaus.org"), False),
        (
            _refused(
                550,
                b"5.4.5 Daily user sending limit exceeded. For more\n"
                b"5.4.5 information go to\n"
                b"5.4.5  https://support.google.com/mail/?p=UserSendingLimit - gsmtp",
            ),
            True,
        ),
        (smtplib.SMTPSenderRefused(451, b"4.4.2 Timeout", "me@x.co"), True),
        (smtplib.SMTPDataError(552, b"5.2.2 Mailbox full"), False),
        (smtplib.SMTPDataError(550, b"5.4.5 Daily sending quota exceeded"), True),
        (smtplib.SMTPServerDisconnected("Connection unexpectedly closed"), True),
        (TimeoutError("timed out"), True),
        (ConnectionResetError("reset by peer"), True),
        (smtplib.SMTPNotSupportedError("SMTPUTF8 not supported"), False),
        (ValueError("Header values may not contain linefeed"), False),
    ],
)
def test_the_answer_decides_whether_a_retry_can_help(error, temporary):
    got = classify(error)
    assert got.temporary is temporary, got
    assert got.text.startswith(type(error).__name__)
    assert len(got.text) <= 300


def test_several_refused_recipients_are_temporary_only_if_all_are():
    mixed = smtplib.SMTPRecipientsRefused(
        {"a@y.co": (452, b"over quota"), "b@y.co": (550, b"no such user")}
    )
    assert classify(mixed).temporary is False


# ---------------------------------------------------------------------------
# The dispatcher: back-off, give-up, and what reaches the database
# ---------------------------------------------------------------------------


def test_the_back_off_is_one_five_fifteen_sixty_then_two_forty_minutes():
    assert outbox.RETRY_AFTER == (60, 300, 900, 3600, 14400)
    assert [outbox.retry_after(n) for n in range(6)] == [60, 300, 900, 3600, 14400, None]


def _row(attempts: int = 0) -> dict[str, Any]:
    return {"id": uuid.uuid4(), "attempts": attempts}


def test_each_answer_is_sent_failed_or_deferred_by_the_next_step():
    out = outbox.Outcome()
    ok, gone, busy, busy_again, spent = _row(), _row(), _row(0), _row(3), _row(5)
    out.settle(ok, None)
    out.settle(gone, SendError("SMTPRecipientsRefused: 550 no such user", False))
    out.settle(busy, SendError("SMTPRecipientsRefused: 452 over quota", True))
    out.settle(busy_again, SendError("SMTPRecipientsRefused: 452 over quota", True))
    out.settle(spent, SendError("SMTPRecipientsRefused: 452 over quota", True))
    assert out.sent == [ok["id"]]
    assert out.failed == {
        "smtp: SMTPRecipientsRefused: 550 no such user": [gone["id"]],
        "smtp: SMTPRecipientsRefused: 452 over quota; gave up after 6 tries": [spent["id"]],
    }
    assert out.deferred == {
        ("smtp: SMTPRecipientsRefused: 452 over quota", 60): [busy["id"]],
        ("smtp: SMTPRecipientsRefused: 452 over quota", 3600): [busy_again["id"]],
    }


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
    def __init__(self, rows=()):
        self.rows, self.calls, self.savepoints = list(rows), [], []

    def begin_nested(self):
        @asynccontextmanager
        async def savepoint():
            try:
                yield
            except BaseException:
                self.savepoints.append("rolled back")
                raise
            self.savepoints.append("released")

        return savepoint()

    async def execute(self, stmt, params=None):
        sql = str(stmt)
        self.calls.append((sql, params))
        if "pg_try_advisory_xact_lock" in sql:
            return _Result(scalar=True)
        if "mail_pending" in sql:
            return _Result(rows=self.rows)
        return _Result()

    def called(self, fn):
        return [(s, p) for s, p in self.calls if fn in s]


def _opener(session):
    @asynccontextmanager
    async def open_session():
        yield session

    return open_session


def _pending_row(email: str, attempts: int = 0) -> dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "to_email": email,
        "to_name": "X",
        "template": "rfp_awarded",
        "reply_to": None,
        "attempts": attempts,
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


def test_a_pass_defers_the_temporary_and_fails_the_permanent():
    a, b, c = _pending_row("a@x.co"), _pending_row("b@x.co"), _pending_row("c@x.co", attempts=1)
    s = _Session(rows=[a, b, c])

    async def send(msgs):
        return [
            None,
            SendError("SMTPRecipientsRefused: 550 no such user", False),
            SendError("SMTPRecipientsRefused: 452 over quota", True),
        ]

    counts = asyncio.run(outbox.run_pass(send=send, open_session=_opener(s)))
    assert counts == {"sent": 1, "failed": 1, "deferred": 1, "waiting": 0, "skipped": 0}
    ((sql, params),) = s.called("mail_defer")
    assert "make_interval(secs => :s)" in sql
    assert params == {
        "ids": [c["id"]],
        "r": "smtp: SMTPRecipientsRefused: 452 over quota",
        "s": 300,
    }
    marks = [p for _, p in s.called("mail_mark")]
    assert {"ids": [a["id"]]} in marks
    assert {"ids": [b["id"]], "r": "smtp: SMTPRecipientsRefused: 550 no such user"} in marks
    assert s.savepoints == ["released"]


def test_the_real_adapter_reports_a_temporary_refusal_without_stopping_the_batch(monkeypatch):
    class Fake:
        def __init__(self):
            self.sent = []

        def send_message(self, msg):
            if msg["To"] == "full@x.co":
                raise smtplib.SMTPRecipientsRefused({"full@x.co": (452, b"4.2.2 over quota")})
            self.sent.append(msg["To"])

        def quit(self):
            return (221, b"bye")

        def close(self):
            pass

    fake = Fake()
    monkeypatch.setattr(smtp, "_open", lambda: fake)
    errors = smtp._send_many_sync(
        [
            ("a@x.co", "s", "t", None, None),
            ("full@x.co", "s", "t", None, None),
            ("c@x.co", "s", "t", None, None),
        ]
    )
    assert errors[0] is None and errors[2] is None and fake.sent == ["a@x.co", "c@x.co"]
    assert errors[1] is not None and errors[1].temporary is True and "452" in errors[1].text


# ---------------------------------------------------------------------------
# Review of 16 Oct 2026: an address the email package chokes on, a hang-up
# mid-batch, a defer the database cannot record, a long answer
# ---------------------------------------------------------------------------


class _Line:
    """A connection that hangs up the way smtplib does on a 421: the socket
    goes, and every later command raises "please run connect() first"."""

    def __init__(self, hang_up_on=None):
        self.sent, self.hang_up_on, self.sock = [], hang_up_on, object()

    def send_message(self, msg):
        if self.sock is None:
            raise smtplib.SMTPServerDisconnected("please run connect() first")
        if msg["To"] == self.hang_up_on:
            self.sock = None
            raise smtplib.SMTPRecipientsRefused(
                {msg["To"]: (421, b"4.7.0 Try again later, closing connection")}
            )
        self.sent.append(msg["To"])

    def quit(self):
        if self.sock is None:
            raise smtplib.SMTPServerDisconnected("please run connect() first")
        return (221, b"bye")

    def close(self):
        self.sock = None


def _batch_of(monkeypatch, line, addresses):
    monkeypatch.setattr(smtp, "_open", lambda: line)
    return smtp._send_many_sync([(a, "s", "t", None, None) for a in addresses])


@pytest.mark.parametrize(
    "bad",
    [
        "jane@[acme.co",
        '"',
        "a@x.co, b@y.co",
        "Ravi <r@x.co>",
        "x y@a.co",
        "",
        "a@b@c",
        "jane@acme..co",
        "jane@.acme.co",
    ],
)
def test_an_address_that_is_not_one_plain_mailbox_fails_its_own_row_only(monkeypatch, bad):
    line = _Line()
    errors = _batch_of(monkeypatch, line, ["a@x.co", bad, "c@x.co"])
    assert errors[0] is None and errors[2] is None and line.sent == ["a@x.co", "c@x.co"]
    assert errors[1] is not None and errors[1].temporary is False and errors[1].tried


def test_any_error_building_a_message_fails_that_row_and_never_the_batch(monkeypatch):
    real = smtp._build

    def build(to, subject, body, html=None, reply_to=None):
        if to == "b@x.co":  # what the email package raised for "jane@[acme.co"
            raise AttributeError("'InvalidHeaderDefect' object has no attribute 'all_defects'")
        return real(to, subject, body, html, reply_to)

    monkeypatch.setattr(smtp, "_build", build)
    line = _Line()
    errors = _batch_of(monkeypatch, line, ["a@x.co", "b@x.co", "c@x.co"])
    assert line.sent == ["a@x.co", "c@x.co"] and errors[0] is None and errors[2] is None
    assert errors[1].text.startswith("AttributeError") and errors[1].temporary is False


def test_a_hang_up_mid_batch_leaves_the_rest_untried_rather_than_refused(monkeypatch):
    line = _Line(hang_up_on="b@x.co")
    errors = _batch_of(monkeypatch, line, ["a@x.co", "b@x.co", "c@x.co", "d@x.co"])
    assert line.sent == ["a@x.co"] and errors[0] is None
    assert errors[1].temporary is True and errors[1].tried and "421" in errors[1].text
    assert errors[2] is smtp.NOT_TRIED and errors[3] is smtp.NOT_TRIED


def test_a_pass_leaves_untried_rows_waiting_without_counting_a_try():
    a, b, c = _pending_row("a@x.co"), _pending_row("b@x.co"), _pending_row("c@x.co", attempts=2)
    s = _Session(rows=[a, b, c])

    async def send(msgs):
        return [None, SendError("SMTPRecipientsRefused: 421 closing", True), smtp.NOT_TRIED]

    counts = asyncio.run(outbox.run_pass(send=send, open_session=_opener(s)))
    assert counts == {"sent": 1, "failed": 0, "deferred": 1, "waiting": 1, "skipped": 0}
    touched = [p["ids"] for _, p in s.calls if p and "ids" in p]
    assert [b["id"]] in touched and all(c["id"] not in ids for ids in touched)


class _UndefinedFunctionError(Exception):
    pass


class _At0053(_Session):
    """A database not yet migrated to 0054: there is no mail_defer."""

    async def execute(self, stmt, params=None):
        if "mail_defer" in str(stmt):
            self.calls.append((str(stmt), params))
            raise DBAPIError(str(stmt), params, _UndefinedFunctionError("mail_defer"))
        return await super().execute(stmt, params)


def test_a_defer_the_database_cannot_record_keeps_the_sent_marks_and_fails_those_rows():
    a, b = _pending_row("a@x.co"), _pending_row("b@x.co")
    s = _At0053(rows=[a, b])

    async def send(msgs):
        return [None, SendError("SMTPRecipientsRefused: 452 over quota", True)]

    asyncio.run(outbox.run_pass(send=send, open_session=_opener(s)))
    assert s.savepoints == ["rolled back"]
    marks = [p for _, p in s.called("mail_mark")]
    assert {"ids": [a["id"]]} in marks
    assert {"ids": [b["id"]], "r": "smtp: SMTPRecipientsRefused: 452 over quota"} in marks


def test_a_long_answer_is_cut_but_the_reason_it_failed_is_kept():
    out = outbox.Outcome()
    out.settle(_row(5), SendError("SMTPRecipientsRefused: " + "x" * 400, True))
    ((reason, _ids),) = out.failed.items()
    assert len(reason) == outbox.REASON_CHARS
    assert reason.endswith("; gave up after 6 tries")


@pytest.mark.parametrize(
    "good",
    ["ok@acme.co", "o'brien+tag@sub.acme.co.uk", "partner@northstar.example", "Ravi@Acme.CO"],
)
def test_an_ordinary_address_goes_through_unchanged(monkeypatch, good):
    line = _Line()
    errors = _batch_of(monkeypatch, line, [good])
    assert errors == [None] and line.sent == [good]
