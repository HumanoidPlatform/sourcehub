"""delivery: the acceptance criteria reach the people the work is judged by.

A request's acceptance criteria are frozen into contract.rubric_snapshot at
award, and until now only the client and the partner read them. The supplier
deciding a batch at gate 1 and the crowd resource holding the camera now see
them too. The supplier, the partner and the client read the snapshot through
contract as they always could; a worker cannot read contract, so one SECURITY
DEFINER read, task_acceptance(), answers for a task the caller can see, under
task_request_id()'s guard (db/150).

Additive and reversible: the downgrade drops the function.

SQL copied verbatim from db/560_task_acceptance.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0060
Revises: 0059
"""

from alembic import op

revision = "0060"
down_revision = "0059"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 560 · The acceptance criteria reach the people the work is judged by
--
-- A request's acceptance criteria are frozen into contract.rubric_snapshot at
-- award (modules/delivery create_contract). Until now only the client and the
-- partner ever read them, on the contract page. The supplier deciding a crowd
-- resource's batch at gate 1 and the crowd resource holding the camera were
-- judged against words they were never shown: the gap db/150 closed for the
-- acceptance DOCUMENTS and left open for the text.
--
-- The supplier, the partner and the client can read contract themselves, and
-- the service reads the snapshot directly for them. A worker cannot
-- (contract_worker_deny), so this read answers for one: the frozen text, for a
-- task the caller can see. The guard is task_request_id()'s (db/150), so
-- whoever can see the task may read what it will be judged against, and
-- nobody else gets an answer.
--
-- The text is returned as stored. A request saved with the field blank holds
-- marketplace's placeholder ("Client review on delivery"), which the service
-- reads as absent: what a screen shows is the service's decision, not the
-- schema's.
-- ============================================================================

CREATE OR REPLACE FUNCTION task_acceptance(p_task_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT c.rubric_snapshot ->> 'acceptance'
  FROM   task t
  JOIN   contract c ON c.id = t.contract_id
  WHERE  t.id = p_task_id
    AND  t.deleted_at IS NULL
    AND  (is_platform_admin()
          OR t.assignee_org_id = current_org_id()
          OR contract_is_visible(t.contract_id))
    AND  (NOT is_worker() OR worker_holds_assignment(t.id))
$fn$;

REVOKE EXECUTE ON FUNCTION task_acceptance(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION task_acceptance(uuid) TO sourcehub_app, sourcehub_readonly;
"""

_DOWN = """
DROP FUNCTION IF EXISTS task_acceptance(uuid);
"""


def _statements(ddl: str) -> list[str]:
    out: list[str] = []
    buf: list[str] = []
    in_body = False
    for line in ddl.splitlines():
        if line.count("$fn$") == 1:
            in_body = not in_body
        buf.append(line)
        if not in_body and line.rstrip().endswith(";"):
            stmt = chr(10).join(buf).strip()
            buf = []
            lines = stmt.splitlines()
            only_comments = all(ln.strip().startswith("--") or not ln.strip() for ln in lines)
            if stmt and not only_comments:
                out.append(stmt)
    return out


def upgrade() -> None:
    for stmt in _statements(_UP):
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
