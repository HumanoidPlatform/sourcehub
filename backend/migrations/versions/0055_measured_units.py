"""delivery: crowd work counted in the task's own unit.

One capture was one unit whatever the task was written in, so a share of
"2 hours of footage" was done after two clips of any length. A clip's running
time is now kept on the asset (asset.duration_s), a share of hours may be a
fraction (task.target_quantity, task_assignment.quantity and task_offer.quantity
become numeric), capture_units() says what one capture is worth, and a
submission records what it delivered in its unit (submission.unit_quantity).
Hours tasks that already had work handed out become videos, which is what
their workers were told.

The downgrade refuses while any share is a fraction. It does not turn the
converted tasks back into hours.

SQL copied verbatim from db/510_measured_units.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0055
Revises: 0054
"""

from alembic import op

revision = "0055"
down_revision = "0054"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 510 · Crowd work counted in the task's own unit
--
-- Until now one capture was one unit whatever the task was written in, so a
-- "2 hours of footage" share was done after two clips of any length. A unit
-- is now either counted (photos, videos, records: one capture each) or
-- measured (hours: the clips' running time). The phone and the web capture
-- dialog already measure each clip; the length is now kept on the asset, and
-- a share of hours may be a fraction ("1.5 hours"). Units the crowd cannot
-- capture (audio, sites, responses) are refused at assignment by the API.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · How long a clip runs. NULL for a photo, and for every clip uploaded
--     before this. 600 s is the longest clip a capture spec can ask for.
-- ---------------------------------------------------------------------------
ALTER TABLE asset
  ADD COLUMN duration_s numeric(8,2)
    CONSTRAINT asset_duration_s_check CHECK (duration_s IS NULL OR (duration_s > 0 AND duration_s <= 600));

COMMENT ON COLUMN asset.duration_s IS
  'Running time of a video capture in seconds, as the capturing device measured it. NULL for a photo.';

-- ---------------------------------------------------------------------------
-- 2 · What a submission delivered, in its task's unit: the capture count for a
--     counted unit, the hours of footage for hours. NULL where it was never
--     measured (hours delivered before this), which the invoice cap skips.
-- ---------------------------------------------------------------------------
ALTER TABLE submission
  ADD COLUMN unit_quantity numeric(14,4)
    CONSTRAINT submission_unit_quantity_check CHECK (unit_quantity IS NULL OR unit_quantity >= 0);

COMMENT ON COLUMN submission.unit_quantity IS
  'Units delivered in the task''s target_unit: captures for a counted unit, hours of footage for hours. NULL = not measured.';

UPDATE submission s
   SET unit_quantity = s.asset_count
  FROM task t
 WHERE t.id = s.task_id
   AND coalesce(t.target_unit, '') NOT IN ('hours', 'audio_hours');

-- ---------------------------------------------------------------------------
-- 3 · Work already handed out on an hours task was given, captured and
--     reviewed as a number of clips: that is what its workers were told. It
--     stays a number of clips. The contract's own pricing unit is untouched.
-- ---------------------------------------------------------------------------
UPDATE task t
   SET target_unit = 'videos'
 WHERE t.target_unit = 'hours'
   AND (EXISTS (SELECT 1 FROM task_assignment a WHERE a.task_id = t.id)
        OR EXISTS (SELECT 1 FROM task_offer o WHERE o.task_id = t.id));

-- ---------------------------------------------------------------------------
-- 4 · A task's unit is one of the request vocabulary (db/040)
-- ---------------------------------------------------------------------------
ALTER TABLE task
  ADD CONSTRAINT task_target_unit_check CHECK (target_unit IS NULL OR target_unit IN
    ('photos','videos','audio_clips','audio_hours','responses','records','sites','hours'));

-- ---------------------------------------------------------------------------
-- 5 · A share of hours may be a fraction. Every other unit stays whole (6).
-- ---------------------------------------------------------------------------
ALTER TABLE task            ALTER COLUMN target_quantity TYPE numeric(12,2);
ALTER TABLE task_assignment ALTER COLUMN quantity        TYPE numeric(12,2);
ALTER TABLE task_offer      ALTER COLUMN quantity        TYPE numeric(12,2);

-- task_offer_lookup() returned quantity as integer
DROP FUNCTION task_offer_lookup(text);

CREATE OR REPLACE FUNCTION task_offer_lookup(p_token_hash text)
RETURNS TABLE (
  recipient_id uuid, offer_id uuid, supplier_org_id uuid, org_name text, created_by uuid,
  worker_user_id uuid, worker_name text, worker_email citext, grant_live boolean,
  task_id uuid, task_ref text, task_title text, task_instructions text,
  task_due_on date, task_status task_status, target_unit text,
  quantity numeric, instructions text, due_on date, respond_by timestamptz,
  offer_status task_offer_status, worker_limit integer, accepted_count integer,
  response task_offer_response, responded_at timestamptz, assignment_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, o.id, o.supplier_org_id, org.name, o.created_by,
         r.worker_user_id, coalesce(w.display_name, u.full_name), r.email,
         EXISTS (SELECT 1 FROM user_role_grant g JOIN role rl ON rl.id = g.role_id
                 WHERE g.user_id = r.worker_user_id AND g.org_id = o.supplier_org_id
                   AND rl.code = 'worker' AND g.revoked_at IS NULL),
         t.id, t.reference_code, t.title, t.instructions,
         t.due_on, t.status, t.target_unit,
         o.quantity, o.instructions, o.due_on, o.respond_by,
         o.status, o.worker_limit, o.accepted_count,
         r.response, r.responded_at, r.assignment_id
  FROM   task_offer_recipient r
  JOIN   task_offer   o   ON o.id = r.offer_id
  JOIN   task         t   ON t.id = o.task_id
  JOIN   organisation org ON org.id = o.supplier_org_id
  JOIN   app_user     u   ON u.id = r.worker_user_id
  LEFT JOIN crowd_worker w ON w.user_id = r.worker_user_id
                          AND w.aggregator_org_id = o.supplier_org_id
                          AND w.deleted_at IS NULL
  WHERE  r.token_hash = p_token_hash
$fn$;

REVOKE EXECUTE ON FUNCTION task_offer_lookup(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION task_offer_lookup(text) TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- 6 · The guards. A fraction only on a unit measured in hours, as an invoice
--     (db/320). A task's unit is fixed once work on it has been handed out:
--     changing it would change what every share already given means.
--     SECURITY DEFINER: the task is read from a worker's session too (an
--     accepted offer inserts their assignment), which RLS narrows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION task_quantity_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  q    numeric;
  unit text;
BEGIN
  IF TG_TABLE_NAME = 'task' THEN
    q    := NEW.target_quantity;
    unit := NEW.target_unit;
    IF TG_OP = 'UPDATE' AND NEW.target_unit IS DISTINCT FROM OLD.target_unit
       AND (EXISTS (SELECT 1 FROM task_assignment a WHERE a.task_id = NEW.id)
            OR EXISTS (SELECT 1 FROM task_offer o WHERE o.task_id = NEW.id)) THEN
      RAISE EXCEPTION 'task: % has work handed out in %; its unit cannot change', NEW.reference_code, OLD.target_unit
        USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    q := NEW.quantity;
    SELECT t.target_unit INTO unit FROM task t WHERE t.id = NEW.task_id;
  END IF;
  IF q IS NOT NULL AND q <> trunc(q) AND coalesce(unit, '') NOT IN ('hours', 'audio_hours') THEN
    RAISE EXCEPTION '%: % is counted in whole %', TG_TABLE_NAME, q, coalesce(unit, 'units')
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER task_quantity_guard BEFORE INSERT OR UPDATE OF target_quantity, target_unit ON task
  FOR EACH ROW EXECUTE FUNCTION task_quantity_guard();
CREATE TRIGGER task_assignment_quantity_guard BEFORE INSERT OR UPDATE OF quantity ON task_assignment
  FOR EACH ROW EXECUTE FUNCTION task_quantity_guard();
CREATE TRIGGER task_offer_quantity_guard BEFORE INSERT OR UPDATE OF quantity ON task_offer
  FOR EACH ROW EXECUTE FUNCTION task_quantity_guard();

-- ---------------------------------------------------------------------------
-- 7 · What one capture is worth in its task's unit. Every count of work
--     against a quantity sums this (media.STAGE_COUNTS).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION capture_units(p_unit text, p_duration_s numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $fn$
  SELECT CASE WHEN p_unit IN ('hours', 'audio_hours') THEN coalesce(p_duration_s, 0) / 3600.0
              ELSE 1 END
$fn$;

COMMENT ON FUNCTION capture_units(text, numeric) IS
  'One capture in its task''s unit: its running time in hours for hours, otherwise 1.';
"""

_DOWN = """
DO $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM task WHERE target_quantity <> trunc(target_quantity))
     OR EXISTS (SELECT 1 FROM task_assignment WHERE quantity <> trunc(quantity))
     OR EXISTS (SELECT 1 FROM task_offer WHERE quantity <> trunc(quantity)) THEN
    RAISE EXCEPTION '0055 downgrade: some shares are fractions of an hour and cannot be whole numbers; '
                    'nothing was changed';
  END IF;
END
$fn$;
DROP TRIGGER task_offer_quantity_guard ON task_offer;
DROP TRIGGER task_assignment_quantity_guard ON task_assignment;
DROP TRIGGER task_quantity_guard ON task;
DROP FUNCTION task_quantity_guard();
DROP FUNCTION capture_units(text, numeric);
DROP FUNCTION task_offer_lookup(text);
ALTER TABLE task_offer      ALTER COLUMN quantity        TYPE integer;
ALTER TABLE task_assignment ALTER COLUMN quantity        TYPE integer;
ALTER TABLE task            ALTER COLUMN target_quantity TYPE integer;
CREATE OR REPLACE FUNCTION task_offer_lookup(p_token_hash text)
RETURNS TABLE (
  recipient_id uuid, offer_id uuid, supplier_org_id uuid, org_name text, created_by uuid,
  worker_user_id uuid, worker_name text, worker_email citext, grant_live boolean,
  task_id uuid, task_ref text, task_title text, task_instructions text,
  task_due_on date, task_status task_status, target_unit text,
  quantity integer, instructions text, due_on date, respond_by timestamptz,
  offer_status task_offer_status, worker_limit integer, accepted_count integer,
  response task_offer_response, responded_at timestamptz, assignment_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, o.id, o.supplier_org_id, org.name, o.created_by,
         r.worker_user_id, coalesce(w.display_name, u.full_name), r.email,
         EXISTS (SELECT 1 FROM user_role_grant g JOIN role rl ON rl.id = g.role_id
                 WHERE g.user_id = r.worker_user_id AND g.org_id = o.supplier_org_id
                   AND rl.code = 'worker' AND g.revoked_at IS NULL),
         t.id, t.reference_code, t.title, t.instructions,
         t.due_on, t.status, t.target_unit,
         o.quantity, o.instructions, o.due_on, o.respond_by,
         o.status, o.worker_limit, o.accepted_count,
         r.response, r.responded_at, r.assignment_id
  FROM   task_offer_recipient r
  JOIN   task_offer   o   ON o.id = r.offer_id
  JOIN   task         t   ON t.id = o.task_id
  JOIN   organisation org ON org.id = o.supplier_org_id
  JOIN   app_user     u   ON u.id = r.worker_user_id
  LEFT JOIN crowd_worker w ON w.user_id = r.worker_user_id
                          AND w.aggregator_org_id = o.supplier_org_id
                          AND w.deleted_at IS NULL
  WHERE  r.token_hash = p_token_hash
$fn$;

REVOKE EXECUTE ON FUNCTION task_offer_lookup(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION task_offer_lookup(text) TO sourcehub_app;
ALTER TABLE task DROP CONSTRAINT task_target_unit_check;
ALTER TABLE submission DROP COLUMN unit_quantity;
ALTER TABLE asset DROP COLUMN duration_s;
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
