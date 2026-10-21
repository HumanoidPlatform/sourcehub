"""marketplace: a client can cancel a published request, and delete a draft.

Nothing ever wrote request.status = 'cancelled'. A request that drew no bids
read Published for ever, and the bids on one its client had given up on stayed
Submitted. db/580 adds the cancel stamps and reason to request, a proposal
status 'cancelled' (neither a rejection nor a withdrawal), guards that let
only a published request, and only a bid on a cancelled request, become
cancelled and keep them that way, and the thread close reason
'request_cancelled'. A draft is deleted through deleted_at,
which needs no schema change.

The enum value is added in an autocommit block before anything else runs, as
0056 does: Postgres will not let a transaction use an enum value it added. An
enum value cannot be removed, so the downgrade leaves 'cancelled' in
proposal_status. It refuses while any request has been cancelled; otherwise it
drops the guards, the constraint and the columns, and puts db/250's thread
reasons back.

SQL copied verbatim from db/580_request_cancel.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0063
Revises: 0062
"""

from alembic import op

revision = "0063"
down_revision = "0062"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 580 · A client can cancel a published request, and delete a draft
--
-- A published request could not be withdrawn and a draft could not be deleted.
-- Nothing ever wrote request.status = 'cancelled', although db/001 has carried
-- the value from the start and modules/marketplace counts it among the states
-- a request's owner produces. A request that drew no bids read Published for
-- ever, and the bids on one its client had given up on stayed Submitted.
--
-- Cancelling (modules/marketplace cancel_request) is the client's, with a
-- reason, while the request is published and not awarded. Every submitted bid
-- becomes 'cancelled', a new proposal status that is neither a rejection nor
-- a withdrawal, and each bidder is told why. Every open conversation on the
-- request closes with the new reason 'request_cancelled'. A draft, which
-- nobody else has seen, is deleted instead: deleted_at, which every read
-- already filters.
--
-- What the database holds to, whatever a client's own row policy would let
-- it write:
--   * request_cancel_shape: cancelled_at is set exactly when the request is
--     cancelled, and a cancelled request carries a reason that is not blank
--   * request_cancel_guard: only a published request becomes cancelled, and a
--     cancelled one stays cancelled, its reason and stamps unchanged
--   * proposal_cancel_guard: only a bid on a cancelled request becomes
--     cancelled, and a cancelled bid stays cancelled. It reads the request as
--     the owner, so the caller's row policy cannot hide it into a false refusal
--
-- The enum value comes first, on its own: a transaction may not use an enum
-- value it added (migration 0063 commits it in an autocommit block), and
-- nothing below names it.
-- ============================================================================

ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE request ADD COLUMN cancelled_at  timestamptz;
ALTER TABLE request ADD COLUMN cancelled_by  uuid REFERENCES app_user(id);
ALTER TABLE request ADD COLUMN cancel_reason text;

ALTER TABLE request ADD CONSTRAINT request_cancel_shape CHECK (
  (status = 'cancelled') = (cancelled_at IS NOT NULL)
  AND (cancelled_at IS NULL OR (cancel_reason IS NOT NULL AND btrim(cancel_reason) <> ''))
  AND (cancel_reason IS NULL OR char_length(cancel_reason) <= 2000)
);

CREATE OR REPLACE FUNCTION request_cancel_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD.status = 'cancelled'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
          OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
          OR NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason) THEN
    RAISE EXCEPTION 'request %: a cancelled request stays cancelled', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND OLD.status <> 'published' THEN
    RAISE EXCEPTION 'request %: only a published request can be cancelled', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER request_cancel_guard BEFORE UPDATE ON request
  FOR EACH ROW EXECUTE FUNCTION request_cancel_guard();

CREATE OR REPLACE FUNCTION proposal_cancel_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'proposal %: a bid on a cancelled request stays cancelled', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status
     AND NOT EXISTS (SELECT 1 FROM request r
                      WHERE r.id = NEW.request_id AND r.status = 'cancelled') THEN
    RAISE EXCEPTION 'proposal %: only a bid on a cancelled request can be cancelled',
      OLD.reference_code USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER proposal_cancel_guard BEFORE UPDATE ON proposal
  FOR EACH ROW EXECUTE FUNCTION proposal_cancel_guard();

ALTER TABLE rfp_thread DROP CONSTRAINT rfp_thread_closed_reason_check;
ALTER TABLE rfp_thread ADD CONSTRAINT rfp_thread_closed_reason_check
  CHECK (closed_reason IS NULL
         OR closed_reason IN ('awarded_elsewhere', 'contract_completed', 'request_cancelled'));

COMMENT ON COLUMN rfp_thread.closed_reason IS
  'awarded_elsewhere: a losing partner''s thread, closed at award. '
  'contract_completed: the winner''s, closed when the client approved the delivery. '
  'request_cancelled: every thread on a request its client cancelled';
COMMENT ON COLUMN request.cancelled_at IS
  'When the client cancelled the published request; set exactly when status is cancelled';
COMMENT ON COLUMN request.cancel_reason IS
  'Why the client cancelled it: shown to the client and to every partner that bid';
"""

_DOWN = """
DO $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM request WHERE status = 'cancelled')
     OR EXISTS (SELECT 1 FROM proposal WHERE status = 'cancelled')
     OR EXISTS (SELECT 1 FROM rfp_thread WHERE closed_reason = 'request_cancelled') THEN
    RAISE EXCEPTION '0063 downgrade: requests have been cancelled, and their reasons, bids and '
                    'conversations would be left in states the old schema does not know. '
                    'Nothing was changed. Restore from a backup taken before 0063';
  END IF;
END
$fn$;

DROP TRIGGER IF EXISTS proposal_cancel_guard ON proposal;
DROP FUNCTION IF EXISTS proposal_cancel_guard();
DROP TRIGGER IF EXISTS request_cancel_guard ON request;
DROP FUNCTION IF EXISTS request_cancel_guard();
ALTER TABLE request DROP CONSTRAINT IF EXISTS request_cancel_shape;
ALTER TABLE request DROP COLUMN IF EXISTS cancel_reason;
ALTER TABLE request DROP COLUMN IF EXISTS cancelled_by;
ALTER TABLE request DROP COLUMN IF EXISTS cancelled_at;

ALTER TABLE rfp_thread DROP CONSTRAINT rfp_thread_closed_reason_check;
ALTER TABLE rfp_thread ADD CONSTRAINT rfp_thread_closed_reason_check
  CHECK (closed_reason IS NULL OR closed_reason IN ('awarded_elsewhere', 'contract_completed'));

COMMENT ON COLUMN rfp_thread.closed_reason IS
  'awarded_elsewhere: a losing partner''s thread, closed at award. '
  'contract_completed: the winner''s, closed when the client approved the delivery';
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
        if "ADD VALUE" in stmt:
            # Committed on its own before anything below can name it.
            with op.get_context().autocommit_block():
                op.execute(stmt)
        else:
            op.execute(stmt)


def downgrade() -> None:
    # 'cancelled' stays in proposal_status: Postgres cannot drop an enum value.
    for stmt in _statements(_DOWN):
        op.execute(stmt)
