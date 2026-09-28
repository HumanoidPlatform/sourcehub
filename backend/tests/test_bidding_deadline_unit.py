"""The bidding window: when it is open, what may not happen once it shuts, who is told.

request.proposals_close_at existed since db/040 and nothing compared it with
the clock. db/240 and this feature make it mean something. What this file
guards, in the order it would hurt:

  * a bid, a withdrawal or a resubmission slipping in after the window shut
    (the refusal is the whole feature; the sweep only TELLS people);
  * a request going live with no deadline, a past one, or one after the
    delivery date — the last of which the API used to check in the sender's
    own offset while the CHECK compares in UTC, so an evening time west of
    Greenwich was a 500;
  * the sweep announcing a close twice, reminding twice, or reminding about a
    window that was never longer than a day;
  * the publish and deadline announcements reaching only the partners the
    client already knew (the latent bug active_tenant_ids() fixes);
  * the SQL file and the migration drifting apart.

conftest.py's database fixtures raise NotImplementedError, so — as in
test_engagement_unit.py and test_equipment_edit_unit.py — the pure parts are
tested with a fixed NOW and the wiring is read off the AST and the route
table, never off the file's text.

    pytest tests/test_bidding_deadline_unit.py
"""

from __future__ import annotations

import ast
import datetime as dt
import re
import uuid
from pathlib import Path

import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from sourcehub.api.v1 import marketplace as marketplace_api
from sourcehub.api.v1.marketplace import RequestIn
from sourcehub.config import settings
from sourcehub.modules.marketplace import service, sweep

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "240_bidding_deadline.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0026_bidding_deadline.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
SERVICE_TREE = ast.parse(
    (SRC / "modules" / "marketplace" / "service.py").read_text(encoding="utf-8")
)
SWEEP_TREE = ast.parse((SRC / "modules" / "marketplace" / "sweep.py").read_text(encoding="utf-8"))
MAIN_TREE = ast.parse((SRC / "main.py").read_text(encoding="utf-8"))

UTC = dt.UTC
NOW = dt.datetime(2026, 10, 1, 12, 0, tzinfo=UTC)
H = dt.timedelta(hours=1)
D = dt.timedelta(days=1)
MIN = dt.timedelta(minutes=1)


def _strip_comments(sql: str) -> str:
    return "\n".join(re.sub(r"--.*$", "", line) for line in sql.splitlines())


CODE = _strip_comments(SQL_TEXT)


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal in the migration"
    return m.group(1)


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


def _raises(fn: ast.AST, exc: str) -> int:
    return sum(
        1
        for node in ast.walk(fn)
        if isinstance(node, ast.Raise)
        and isinstance(node.exc, ast.Call)
        and getattr(node.exc.func, "id", "") == exc
    )


def _sql_texts(fn: ast.AST) -> list[str]:
    """Every text(...) literal in a function. Adjacent strings are folded by
    the parser into one Constant, so each is the whole query."""
    return [
        node.args[0].value
        for node in ast.walk(fn)
        if isinstance(node, ast.Call)
        and getattr(node.func, "id", None) == "text"
        and node.args
        and isinstance(node.args[0], ast.Constant)
        and isinstance(node.args[0].value, str)
    ]


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


# ---------------------------------------------------------------------------
# The pure rules
# ---------------------------------------------------------------------------


def test_no_deadline_means_open_until_awarded():
    # every request published before deadlines existed
    assert service.bidding_is_open(None, NOW)


def test_the_window_shuts_at_the_deadline_itself():
    assert service.bidding_is_open(NOW + MIN, NOW)
    assert not service.bidding_is_open(NOW, NOW)
    assert not service.bidding_is_open(NOW - MIN, NOW)


def test_utc_wording_is_the_same_whatever_offset_arrived():
    at_utc = dt.datetime(2026, 10, 5, 18, 0, tzinfo=UTC)
    at_ist = dt.datetime(2026, 10, 5, 23, 30, tzinfo=dt.timezone(dt.timedelta(hours=5, minutes=30)))
    assert service.fmt_utc(at_utc) == "5 Oct 2026, 18:00 UTC"
    assert service.fmt_utc(at_ist) == "5 Oct 2026, 18:00 UTC"


def test_a_request_cannot_go_live_without_a_deadline():
    assert service.deadline_problem(None, dt.date(2026, 10, 25), NOW) == "Set when bidding closes."


@pytest.mark.parametrize("close_at", [NOW, NOW - H, NOW - 3 * D])
def test_a_deadline_must_be_in_the_future(close_at):
    assert (
        service.deadline_problem(close_at, dt.date(2026, 10, 25), NOW)
        == "Bidding must close in the future."
    )


def test_the_delivery_rule_is_measured_in_utc_like_the_check():
    # 22:00 in New York on the delivery date is 03:00 the NEXT day in UTC.
    # The CHECK compares in UTC, so this must be refused here, not at commit.
    ny = dt.timezone(dt.timedelta(hours=-5))
    late = dt.datetime(2026, 10, 25, 22, 0, tzinfo=ny)
    early = dt.datetime(2026, 10, 25, 18, 0, tzinfo=ny)  # 23:00 UTC, same day
    delivery = dt.date(2026, 10, 25)
    assert "delivery" in (service.deadline_problem(late, delivery, NOW) or "")
    assert service.deadline_problem(early, delivery, NOW) is None


def test_no_delivery_date_means_no_delivery_rule():
    assert service.deadline_problem(NOW + 3 * D, None, NOW) is None


# ---------------------------------------------------------------------------
# The API model
# ---------------------------------------------------------------------------


def _body(**over):
    base = {"title": "Shelf photos", "category": "image"}
    base.update(over)
    return base


def test_a_naive_deadline_is_refused_at_the_door():
    # It would otherwise be compared with an aware `now` in the service and
    # raise a TypeError there — a 500 for a form mistake.
    with pytest.raises(ValidationError):
        RequestIn(**_body(proposals_close_at="2026-10-05T18:00:00"))


@pytest.mark.parametrize("value", ["2026-10-05T18:00:00Z", "2026-10-05T23:30:00+05:30"])
def test_an_aware_deadline_is_accepted(value):
    assert RequestIn(**_body(proposals_close_at=value)).proposals_close_at is not None


def test_the_models_delivery_rule_matches_the_check():
    with pytest.raises(ValidationError):
        RequestIn(
            **_body(proposals_close_at="2026-10-25T22:00:00-05:00", delivery_due_on="2026-10-25")
        )
    RequestIn(**_body(proposals_close_at="2026-10-25T18:00:00-05:00", delivery_due_on="2026-10-25"))


# ---------------------------------------------------------------------------
# The sweep's planner
# ---------------------------------------------------------------------------


def window(**over) -> sweep.Window:
    base = {
        "request_id": uuid.uuid4(),
        "proposals_close_at": NOW + 3 * D,
        "closed_at": None,
        "reminder_sent_at": None,
        "published_at": NOW - 3 * D,
    }
    base.update(over)
    return sweep.Window(**base)


def kinds(*windows: sweep.Window) -> list[str]:
    return [a.kind for a in sweep.plan(NOW, list(windows))]


def test_a_passed_window_is_closed_once():
    w = window(proposals_close_at=NOW - MIN)
    assert kinds(w) == ["close"]
    assert kinds(window(proposals_close_at=NOW - MIN, closed_at=NOW - MIN)) == []


def test_a_window_with_a_day_left_gets_one_reminder():
    assert kinds(window(proposals_close_at=NOW + 12 * H)) == ["remind"]
    assert kinds(window(proposals_close_at=NOW + 12 * H, reminder_sent_at=NOW - H)) == []
    assert kinds(window(proposals_close_at=NOW + 3 * D)) == []


def test_a_short_window_is_never_reminded_about():
    # Published this morning, closes tonight: "closes in 24 hours" would land
    # minutes after "is open for responses". Stamped as handled, said nothing.
    assert kinds(window(proposals_close_at=NOW + 12 * H, published_at=NOW - H)) == ["stamp"]
    assert kinds(window(proposals_close_at=NOW + 12 * H, published_at=None)) == ["stamp"]


def test_a_reopened_window_closes_again_and_a_moved_one_reminds_again():
    # change_bidding_deadline clears both stamps; the planner sees a fresh window
    assert kinds(window(proposals_close_at=NOW - MIN, closed_at=None)) == ["close"]
    assert kinds(window(proposals_close_at=NOW + 20 * H, reminder_sent_at=None)) == ["remind"]


def test_a_closed_window_is_not_also_reminded_about():
    assert kinds(window(proposals_close_at=NOW - H, reminder_sent_at=None)) == ["close"]


# ---------------------------------------------------------------------------
# Wiring: the refusals
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("name", ["submit_proposal", "withdraw_proposal"])
def test_bids_and_withdrawals_check_the_window(name):
    fn = _function(SERVICE_TREE, name)
    assert "bidding_is_open" in _calls(fn), f"{name} never asks whether bidding is open"
    assert _raises(fn, "MarketplaceError") >= 2, f"{name} has no refusal for a closed window"


def test_a_bid_and_a_deadline_change_take_the_same_lock():
    # An advisory lock, not FOR UPDATE: under RLS a row lock needs the UPDATE
    # policy, which a partner never has on a request — every bid was a 404.
    for name in ("submit_proposal", "change_bidding_deadline"):
        assert "_lock_window" in _calls(_function(SERVICE_TREE, name)), name
    assert "with_for_update" not in _calls(_function(SERVICE_TREE, "submit_proposal"))
    assert any(
        "pg_advisory_xact_lock" in q for q in _sql_texts(_function(SERVICE_TREE, "_lock_window"))
    )


@pytest.mark.parametrize("name", ["publish_request", "create_request"])
def test_going_live_requires_a_valid_deadline(name):
    assert "_assert_deadline" in _calls(_function(SERVICE_TREE, name))
    assert "deadline_problem" in _calls(_function(SERVICE_TREE, "_assert_deadline"))


def test_a_drafts_deadline_can_be_cleared():
    # _requirements() drops None; a field in that list can be set and never
    # unset. The deadline is assigned outright instead.
    for node in ast.walk(SERVICE_TREE):
        if isinstance(node, ast.Assign) and any(
            getattr(t, "id", "") == "_REQUIREMENT_FIELDS" for t in node.targets
        ):
            names = {e.value for e in node.value.elts}  # type: ignore[attr-defined]
            assert "proposals_close_at" not in names
            return
    raise AssertionError("_REQUIREMENT_FIELDS not found")


# ---------------------------------------------------------------------------
# Wiring: changing the deadline
# ---------------------------------------------------------------------------


def test_the_change_is_locked_audited_and_announced():
    fn = _function(SERVICE_TREE, "change_bidding_deadline")
    assert "with_for_update" in _calls(fn)
    assert "deadline_problem" in _calls(fn)
    assert "notify_active_tenants" in _calls(fn)
    assert _audit_events(fn) == {"request.deadline_changed"}


def test_the_change_route_is_guarded_as_publishing_is():
    route = next(
        r
        for r in marketplace_api.router.routes
        if isinstance(r, APIRoute) and r.path == "/requests/{request_id}/bidding-deadline"
    )
    assert route.methods == {"PATCH"}
    caps = [
        c.cell_contents
        for d in route.dependant.dependencies
        for c in (getattr(d.call, "__closure__", None) or ())
    ]
    assert "rfp.publish" in caps, caps


# ---------------------------------------------------------------------------
# Wiring: who is told
# ---------------------------------------------------------------------------


def test_announcements_reach_every_partner_not_only_the_known_ones():
    fn = _function(SERVICE_TREE, "notify_active_tenants")
    assert any("active_tenant_ids()" in q for q in _sql_texts(fn))
    assert "notify_active_tenants" in _calls(_function(SERVICE_TREE, "_announce_publish"))


def test_the_sweep_stamps_conditionally_so_nothing_is_said_twice():
    close_sql = "\n".join(_sql_texts(_function(SWEEP_TREE, "_close")))
    assert "closed_at IS NULL" in close_sql and "RETURNING" in close_sql
    remind_sql = "\n".join(_sql_texts(_function(SWEEP_TREE, "_remind")))
    assert "bidding_reminder_sent_at IS NULL" in remind_sql and "RETURNING" in remind_sql
    # re-checked against the clock: a window moved a week out since planning
    # must not be stamped as "24 hours" away
    assert (
        "proposals_close_at > :now" in remind_sql and "proposals_close_at <= :horizon" in remind_sql
    )
    # closing stamps the reminder too, or a lapsed window keeps its client in
    # bidding_sweep_orgs() every tick until the award
    assert "coalesce(bidding_reminder_sent_at" in close_sql
    assert _audit_events(_function(SWEEP_TREE, "_close")) == {"request.bidding_closed"}


def test_the_sweep_locks_its_rows_before_it_audits():
    # write_audit_event holds a global chain lock to commit, and the client's
    # own edits take the request row first, the chain second. Same order here.
    assert "FOR NO KEY UPDATE" in "\n".join(_sql_texts(_function(SWEEP_TREE, "_windows")))


def test_the_sweep_runs_under_its_own_lock_and_switch():
    assert any(
        "hashtext('bidding_deadline')" in q for q in _sql_texts(_function(SWEEP_TREE, "run_pass"))
    )
    assert any("bidding_sweep_orgs()" in q for q in _sql_texts(_function(SWEEP_TREE, "run_pass")))
    assert hasattr(settings, "bidding_sweep_enabled") and hasattr(
        settings, "bidding_sweep_tick_seconds"
    )
    lifespan = _function(MAIN_TREE, "_lifespan")
    started = {
        f"{n.value.id}.{n.attr}"
        for n in ast.walk(lifespan)
        if isinstance(n, ast.Attribute) and isinstance(n.value, ast.Name)
    }
    assert "sweep.run_forever" in started


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_new_file_is_in_the_bundle():
    assert "240_bidding_deadline" in BUNDLE.read_text(encoding="utf-8")


def test_the_schema_change_is_what_the_feature_needs():
    assert "ADD COLUMN bidding_reminder_sent_at timestamptz" in CODE
    for fn in ("active_tenant_ids", "bidding_sweep_orgs"):
        assert f"FUNCTION {fn}() RETURNS SETOF uuid" in CODE
        assert f"REVOKE EXECUTE ON FUNCTION {fn}() FROM PUBLIC" in CODE
        assert f"GRANT  EXECUTE ON FUNCTION {fn}() TO sourcehub_app" in CODE
    assert CODE.count("SECURITY DEFINER") == 2
    assert "CREATE POLICY" not in CODE  # "closed" is derived; visibility is untouched


def test_the_downgrade_removes_what_the_upgrade_added():
    down = _strip_comments(_literal("_DOWN"))
    assert "DROP COLUMN IF EXISTS bidding_reminder_sent_at" in down
    assert "DROP FUNCTION IF EXISTS active_tenant_ids()" in down
    assert "DROP FUNCTION IF EXISTS bidding_sweep_orgs()" in down
