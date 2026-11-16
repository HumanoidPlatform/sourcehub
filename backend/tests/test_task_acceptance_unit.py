"""The acceptance criteria reach the people the work is judged by: db/560,
migration 0060, delivery.stated_acceptance and every payload that carries a
task's brief.

What this file guards, in the order it would hurt:

  * the criteria reaching someone who cannot see the task: task_acceptance()
    must answer under task_request_id()'s guard (db/150), word for word;
  * a brief shown without its criteria: the task row, the worker's
    assignments and offers, and both review queues must all carry them;
  * a forgotten migration taking down more than the worker's board: only the
    path a worker reads in their own session may depend on the definer;
  * the placeholder a blank answer froze ("Client review on delivery") shown
    as if the client had written it;
  * the migration drifting from the SQL file.

    pytest tests/test_task_acceptance_unit.py
"""

from __future__ import annotations

import ast
import inspect
import re
from pathlib import Path
from typing import Any

import pytest

from sourcehub.api.v1.marketplace import RequestIn
from sourcehub.modules.delivery import service as delivery
from sourcehub.modules.marketplace import service as marketplace
from sourcehub.modules.qa import service as qa

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "560_task_acceptance.sql").read_text(encoding="utf-8")
DB150 = (ROOT / "db" / "150_downstream_documents.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0060_task_acceptance.py"
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
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0060", "exec"), ns)
    return ns["_statements"](ddl)


def _function(sql: str, name: str) -> str:
    start = sql.index(f"CREATE OR REPLACE FUNCTION {name}(")
    return sql[start : sql.index("$fn$;", start)]


def _words(s: str) -> str:
    return " ".join(s.split())


# ---------------------------------------------------------------------------
# The SQL file and the migration
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0059():
    assert re.search(r'^revision = "0060"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0059"$', MIGRATION_TEXT, re.M)


def test_the_file_follows_550_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("560_task_acceptance") == files.index("550_offer_push") + 1


def test_no_comment_line_ends_a_statement():
    # the splitter ends a statement at a line ending ';' outside a body
    comments = [ln for ln in SQL_TEXT.splitlines() if ln.strip().startswith("--")]
    assert not [ln for ln in comments if ln.rstrip().endswith(";")]
    assert not [ln for ln in comments if "$fn$" in ln]


def test_the_splitter_keeps_the_function_whole():
    up = _statements(_literal("_UP"))
    assert len(up) == 3
    assert "CREATE OR REPLACE FUNCTION task_acceptance(" in up[0]
    assert up[0].count("$fn$") == 2


def test_no_table_or_column_changes():
    assert "CREATE TABLE" not in SQL_TEXT and "ALTER TABLE" not in SQL_TEXT


def test_the_downgrade_drops_the_function():
    assert _statements(_literal("_DOWN")) == ["DROP FUNCTION IF EXISTS task_acceptance(uuid);"]


# ---------------------------------------------------------------------------
# The read: definer, for the API only, under task_request_id()'s guard
# ---------------------------------------------------------------------------
def test_the_read_is_definer_and_granted_to_the_api_only():
    fn = _function(SQL_TEXT, "task_acceptance")
    assert "STABLE SECURITY DEFINER SET search_path = public" in fn
    assert "REVOKE EXECUTE ON FUNCTION task_acceptance(uuid) FROM PUBLIC;" in SQL_TEXT
    grant = (
        r"GRANT\s+EXECUTE ON FUNCTION task_acceptance\(uuid\)"
        r" TO sourcehub_app, sourcehub_readonly;"
    )
    assert re.search(grant, SQL_TEXT)


def test_whoever_can_see_the_task_may_read_its_criteria_and_nobody_else():
    # From FROM to the end of the body, the two functions must be the same
    # words: a worker only through an assignment they hold, an organisation
    # only through the task's assignee or a contract it can see.
    mine = _function(SQL_TEXT, "task_acceptance")
    theirs = _function(DB150, "task_request_id")
    assert _words(mine[mine.index("FROM"):]) == _words(theirs[theirs.index("FROM"):])


def test_it_reads_the_text_frozen_at_award_not_the_live_request():
    fn = _function(SQL_TEXT, "task_acceptance")
    assert "c.rubric_snapshot ->> 'acceptance'" in fn
    assert "request" not in fn.split("$fn$", 1)[1]


# ---------------------------------------------------------------------------
# What a screen shows: the client's words, or nothing
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    ("stored", "shown"),
    [
        (None, None),
        ("", None),
        ("   ", None),
        ("Client review on delivery", None),
        ("  Client review on delivery ", None),
        ("Sharp, no glare", "Sharp, no glare"),
        ("  Sharp, no glare\n", "Sharp, no glare"),
    ],
)
def test_stated_acceptance(stored, shown):
    assert delivery.stated_acceptance(stored) == shown


def test_the_placeholder_is_the_one_a_blank_request_freezes():
    # a request saved with the field empty, through the builder award reads
    blank = RequestIn(title="Storefronts", category="image").model_dump()
    frozen = marketplace._quality_bar(blank)["acceptance"]
    assert frozen == marketplace.NO_ACCEPTANCE_STATED == marketplace._DEFAULTS["acceptance"]
    assert delivery.stated_acceptance(frozen) is None


# ---------------------------------------------------------------------------
# Every payload that carries a task's brief carries its criteria
# ---------------------------------------------------------------------------
class _Row(dict[str, Any]):
    """An _ASSIGNMENT_ROWS row: what a test does not name reads as 0."""

    def __missing__(self, key: str) -> Any:
        return 0


def test_the_workers_assignments_carry_the_criteria():
    assert "task_acceptance(t.id) AS task_acceptance" in delivery._ASSIGNMENT_ROWS
    r = _Row(
        target_unit="photos", capture_spec={"media": ["photo"]}, task_instructions="Shelf 3",
        task_acceptance="Every price tag readable.", rating_score=None,
    )
    d = delivery._assignment_dict(r)
    assert d["task"]["acceptance"] == "Every price tag readable."
    assert d["task"]["instructions"] == "Shelf 3"
    blank = _Row(r, task_acceptance="Client review on delivery")
    assert delivery._assignment_dict(blank)["task"]["acceptance"] is None


def test_the_workers_offers_carry_the_criteria_read_as_the_supplier():
    q = str(delivery._MY_OFFERS)
    assert "c.rubric_snapshot ->> 'acceptance' AS task_acceptance" in q
    # joined before the WHERE that test_offer_push_unit pins, and LEFT so an
    # unreadable contract costs the worker the criteria, never the offer
    joined = q.index("LEFT JOIN contract c ON c.id = t.contract_id")
    assert joined < q.index("WHERE r.worker_user_id")


def test_the_task_row_carries_the_criteria():
    src = inspect.getsource(delivery._task_row)
    assert "c.rubric_snapshot ->> 'acceptance' AS acceptance" in src
    assert '"acceptance": stated_acceptance(extra.get("acceptance"))' in src


@pytest.mark.parametrize("queue", [qa.gate1_queue, qa.review_queue])
def test_both_review_queues_carry_the_criteria(queue):
    src = inspect.getsource(queue)
    assert "c.rubric_snapshot ->> 'acceptance' AS task_acceptance" in src
    assert 'delivery.stated_acceptance(r["task_acceptance"])' in src


def test_gate1_reads_the_contract_without_losing_a_batch():
    # LEFT: a batch whose contract the supplier somehow cannot read still
    # reaches the queue, without its criteria
    assert "LEFT JOIN contract c ON c.id = t.contract_id" in inspect.getsource(qa.gate1_queue)


def test_only_the_workers_own_session_depends_on_the_definer():
    # Everyone else can read contract, so they read the snapshot directly: an
    # API deployed before migration 0060 then breaks the worker's board alone
    # rather than every task, offer and review queue with it.
    assert "task_acceptance(t.id)" in delivery._ASSIGNMENT_ROWS
    for src in (
        str(delivery._MY_OFFERS),
        inspect.getsource(delivery._task_row),
        inspect.getsource(qa.gate1_queue),
        inspect.getsource(qa.review_queue),
    ):
        assert "task_acceptance(" not in src
