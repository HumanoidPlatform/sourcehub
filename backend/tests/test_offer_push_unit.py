"""Offers and reminders reach the crowd by push, not by e-mail: db/550,
migration 0059, delivery.create_offer / notice_state and engage._send.

What this file guards, in the order it would hurt:

  * an open offer's only notice being given up: push_pending must keep it
    waiting past the hour and for a worker with no phone yet, and settle it by
    the old rules once the offer can no longer be answered;
  * a worker's bell rows or push token reaching the aggregator: the two reads
    answer only booleans and outcomes, for the caller's own organisation;
  * the console reading the wrong state from those answers;
  * the migration drifting from the SQL file, or 0059 leaving db/300's
    push_pending behind on a downgrade.

The mail call sites themselves are guarded in test_mail_callsites_unit.py.

    pytest tests/test_offer_push_unit.py
"""

from __future__ import annotations

import ast
import datetime as dt
import re
from pathlib import Path
from typing import Any

import pytest

from sourcehub.modules.delivery import service as delivery
from sourcehub.modules.engage import service as engage
from sourcehub.modules.network import service as network

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "550_offer_push.sql").read_text(encoding="utf-8")
DB300 = (ROOT / "db" / "300_push.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0059_offer_push.py"
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
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0059", "exec"), ns)
    return ns["_statements"](ddl)


def _function(sql: str, name: str) -> str:
    start = sql.index(f"CREATE OR REPLACE FUNCTION {name}(")
    return sql[start : sql.index("$fn$;", start)]


# ---------------------------------------------------------------------------
# The SQL file and the migration
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0058():
    assert re.search(r'^revision = "0059"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0058"$', MIGRATION_TEXT, re.M)


def test_the_file_follows_540_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("550_offer_push") == files.index("540_resumable_uploads") + 1


def test_no_comment_line_ends_a_statement():
    # the splitter ends a statement at a line ending ';' outside a body
    comments = [ln for ln in SQL_TEXT.splitlines() if ln.strip().startswith("--")]
    assert not [ln for ln in comments if ln.rstrip().endswith(";")]


def test_the_splitter_keeps_every_function_whole():
    up = _statements(_literal("_UP"))
    assert len(up) == 7
    assert sum("CREATE OR REPLACE FUNCTION" in s for s in up) == 3
    assert all(s.count("$fn$") in (0, 2) for s in up)


def test_no_table_or_column_changes():
    assert "CREATE TABLE" not in SQL_TEXT and "ALTER TABLE" not in SQL_TEXT


def test_the_downgrade_puts_db300s_push_pending_back_and_drops_the_reads():
    down = _literal("_DOWN")
    assert _function(down, "push_pending") == _function(DB300, "push_pending")
    assert "DROP FUNCTION IF EXISTS offer_notices(uuid[])" in down
    assert "DROP FUNCTION IF EXISTS worker_app_connected(uuid[])" in down


# ---------------------------------------------------------------------------
# push_pending: an open offer's notice waits instead of being given up
# ---------------------------------------------------------------------------
def test_an_open_offers_notice_is_exempt_from_the_hour_and_the_missing_phone():
    fn = _function(SQL_TEXT, "push_pending")
    update = fn[fn.index("UPDATE notification") : fn.index("RETURN QUERY")]
    # the exemption: a bell row announcing an offer that can still be answered
    for part in ("n.link_page = 'offer'", "r.id::text = n.link_params->>'id'",
                 "o.status = 'open'", "o.respond_by > now()", "r.response IS NULL"):
        assert part in update, part
    # only the notified worker's own recipient row counts, and it is found by
    # the worker index: the tick never scans every recipient per waiting row
    assert update.index("r.worker_user_id = n.user_id") < update.index("r.id::text")
    exempt = update.index("NOT (n.link_page = 'offer'")
    assert exempt < update.index("interval '1 hour'", exempt)
    assert exempt < update.index("u.push_token IS NOT NULL", exempt)
    # read in the bell first still settles it, open offer or not
    assert update.index("n.read_at IS NOT NULL") < exempt


def test_the_link_id_is_compared_as_text_never_cast():
    # a bell row whose id is not a uuid must not fail the whole push pass
    fn = _function(SQL_TEXT, "push_pending")
    assert "::uuid" not in fn


def test_what_is_pushed_is_unchanged():
    new = _function(SQL_TEXT, "push_pending")
    old = _function(DB300, "push_pending")
    assert new[new.index("RETURN QUERY") :] == old[old.index("RETURN QUERY") :]


# ---------------------------------------------------------------------------
# The two reads: booleans and outcomes, for the caller's own organisation
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("name", ["offer_notices", "worker_app_connected"])
def test_each_read_is_definer_and_granted_to_the_api_only(name):
    fn = _function(SQL_TEXT, name)
    assert "SECURITY DEFINER SET search_path = public" in fn
    assert f"REVOKE EXECUTE ON FUNCTION {name}(uuid[])" in SQL_TEXT
    grant = rf"GRANT\s+EXECUTE ON FUNCTION {name}\(uuid\[\]\)\s+TO sourcehub_app;"
    assert re.search(grant, SQL_TEXT)


@pytest.mark.parametrize("name", ["offer_notices", "worker_app_connected"])
def test_neither_read_returns_the_token(name):
    fn = _function(SQL_TEXT, name)
    returns = fn[fn.index("RETURNS TABLE") : fn.index("LANGUAGE")]
    assert "token" not in returns
    # the token is only ever tested for presence
    assert re.findall(r"push_token[^,\n]*", fn) == ["push_token IS NOT NULL"]


def test_offer_notices_answers_only_for_the_offering_supplier():
    fn = _function(SQL_TEXT, "offer_notices")
    assert "o.supplier_org_id = current_org_id() OR is_platform_admin()" in fn


def test_the_roster_read_answers_only_for_the_callers_own_workers():
    fn = _function(SQL_TEXT, "worker_app_connected")
    assert "g.org_id = current_org_id()" in fn and "rl.code = 'worker'" in fn
    assert "g.revoked_at IS NULL" in fn


def test_the_roster_carries_whether_each_worker_can_be_reached():
    assert "worker_app_connected(ARRAY[w.user_id])" in str(network._WORKER_ROWS)
    row = {
        "id": 1, "reference_code": "WKR-1", "display_name": "A", "skills": [], "status": "active",
        "trained": True, "rating_avg": None, "rating_count": 0, "email": None, "phone": None,
        "user_id": None, "user_status": None, "accepted_at": None, "expires_at": None,
        "open_assignments": 0, "app_connected": True,
    }
    assert network._worker_dict(row)["app_connected"] is True


# ---------------------------------------------------------------------------
# What the console says reached each recipient
# ---------------------------------------------------------------------------
NOW = dt.datetime(2026, 10, 19, 12, tzinfo=dt.UTC)


def _n(**over: Any) -> dict[str, Any]:
    base = {"app_connected": True, "notices": 1, "last_notice_at": NOW,
            "pushed_at": None, "push_failure": None, "seen_at": None}
    return {**base, **over}


@pytest.mark.parametrize(
    ("n", "state"),
    [
        (_n(seen_at=NOW, pushed_at=NOW), "seen"),
        (_n(pushed_at=NOW), "pushed"),
        (_n(app_connected=False), "no_app"),
        (_n(push_failure="no push token"), "no_app"),
        (_n(push_failure="expo: MessageRateExceeded"), "failed"),
        (_n(push_failure="too old"), "failed"),
        (_n(), "sending"),
        (_n(notices=0), "emailed"),   # an offer from before offers rang the bell
        (None, "emailed"),
    ],
)
def test_notice_state(n, state):
    assert delivery.notice_state(n) == state


def test_seen_wins_over_everything_else():
    assert delivery.notice_state(_n(seen_at=NOW, push_failure="too old")) == "seen"


def test_an_old_offer_whose_mail_failed_is_never_still_sending():
    # "sending" makes the console poll every 5 s: only a waiting bell row may say it
    assert delivery.notice_state(None) == "emailed"
    assert delivery.notice_state(_n(notices=0, app_connected=False)) == "emailed"


# ---------------------------------------------------------------------------
# The app is the only way to answer: it must say why an answer is refused
# ---------------------------------------------------------------------------
def test_the_answer_finds_the_workers_offer_in_any_state():
    # the board shows open offers and the week's answered; the lookup for an
    # answer must also find a filled or closed one, so the tap that loses the
    # race is told "all places have been taken" (410), not "not found" (404)
    q = str(delivery._MY_OFFERS)
    assert "CAST(:r AS uuid) IS NOT NULL OR o.status = 'open'" in q
    assert "WHERE r.worker_user_id = :me AND r.supplier_org_id = :org" in q


# ---------------------------------------------------------------------------
# The notice carries what the worker decides on
# ---------------------------------------------------------------------------
def test_the_offer_notice_says_the_share_and_when_to_answer():
    text = delivery.offer_notice(
        "NorthStar Crowd", "TSK-22", "Shelf capture", share="4 photos",
        respond_by=dt.datetime(2026, 10, 20, 18, tzinfo=dt.UTC),
    )
    assert text == ("NorthStar Crowd is offering TSK-22 Shelf capture (4 photos), "
                    "answer by 20 Oct — open it to accept or decline.")


def test_the_first_notice_and_a_reminder_name_the_same_day():
    # the console may send respond_by with an offset; a reminder reads it back
    # from the database in UTC. Both say the UTC day, as the offer mail did.
    ist = dt.timezone(dt.timedelta(hours=5, minutes=30))
    sent = dt.datetime(2026, 10, 21, 2, 0, tzinfo=ist)          # 20 Oct 20:30 UTC
    first = delivery.offer_notice("N", "TSK-1", "T", respond_by=sent)
    later = delivery.offer_notice("N", "TSK-1", "T", "Hi", respond_by=sent.astimezone(dt.UTC))
    assert "answer by 20 Oct" in first and "answer by 20 Oct" in later


def test_a_reminder_leads_with_its_line():
    text = delivery.offer_notice("NorthStar Crowd", "TSK-22", "Shelf capture", "Last call —")
    assert text.startswith("Last call — NorthStar Crowd is offering TSK-22")


def test_the_notice_fits_the_shade_for_a_long_title():
    text = delivery.offer_notice(
        "A crowd supplier with a long name", "TSK-1234", "x" * 60,
        share="1.5 hours of footage", respond_by=NOW,
    )
    # the push cuts at 180 (modules/push BODY_CHARS); the decision facts come
    # before the instruction, so a cut drops only the instruction
    assert text.index("answer by") < 180


@pytest.mark.parametrize(("days", "said"), [(0, "today"), (1, "yesterday"), (3, "3 days ago")])
def test_a_reminder_says_when_in_words(days, said):
    # the line is the whole push now: never "0 days ago"
    for kind in ("assignment_start", "assignment_rework"):
        _ctx, line = engage.assignment_reminder_context(
            kind=kind, worker_name="Priya", org_name="NorthStar Crowd", task_ref="TSK-22",
            task_title="Shelf capture", unit="photos", quantity=4, due_on=None, days=days,
            today=dt.date(2026, 10, 19),
        )
        assert said in line and "0 days" not in line, line
