"""network: ratings in every direction the work goes.

Until now one rating existed, the client's of its delivery partner, written at
approval. Four kinds now share the rating table (client_partner, partner_client,
partner_supplier, supplier_worker): a kind column, task/assignment/to_user
subject columns, a BEFORE INSERT trigger that derives the parties from the
subject and refuses the wrong state or rater, three partial unique indexes in
place of the three-column UNIQUE, a select policy narrowed to the two parties
and Ops, SELECT and INSERT only for the login, and org_rating_summary() for
client and supplier averages. organisation.rating and crowd_worker.rating,
written by seeds and nothing else, are dropped.

SQL copied verbatim from db/380_ratings.sql so the bootstrap and migration
paths keep producing identical schemas; a test asserts the two stay
byte-identical. The seed rows below (rating.write for the aggregator and the
business roles) are what db/900 now seeds; STRUCTURE runs before SEED on a
fresh build, so db/380 cannot name a permission.

Stop the API while this runs: the old code selects the dropped columns and
inserts a rating without a kind; the new code reads kind. The downgrade
refuses, changing nothing, while any rating of a new kind exists: the old
shape has nowhere to keep it.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0041
Revises: 0040
"""

from alembic import op

revision = "0041"
down_revision = "0040"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 380 · Ratings in every direction the work goes, and no seeded figure left
--
-- Until now one rating existed: the client's, of its delivery partner, written
-- at approval (070, 100). Four kinds now share the one table:
--
--   client_partner    client  -> its partner, at approval            (as before)
--   partner_client    partner -> its client, once the contract completed
--   partner_supplier  partner -> the task's supplier, once that task passed QA
--   supplier_worker   supplier (aggregator or business) -> the crowd resource,
--                     once the assignment was accepted and not reassigned
--
-- The database says who rates whom. A BEFORE INSERT trigger derives both
-- parties from the subject (contract, task or assignment), refuses the wrong
-- state or the wrong rater, and fills the party columns itself: the API only
-- ever names the kind, the subject, a score and a comment. "Once" is three
-- partial unique indexes; the 070 three-column UNIQUE goes, because it would
-- refuse a second task rating to the same supplier on one contract.
--
-- Who reads a rating: its two parties and Ops. contract_is_visible no longer
-- lets a supplier on the contract read the client's words about the partner.
-- A worker reads none (the 120 deny stays). Ratings are never edited: the
-- login keeps SELECT and INSERT only.
--
-- Averages are computed where they are read, never stored. partner_performance
-- (260) keeps answering for partners, untouched: its filter admits only a
-- client's rating of the contract's partner, which is still the one kind that
-- matches. org_rating_summary, below, answers for clients and suppliers.
-- organisation.rating and crowd_worker.rating, written by seeds and by nothing
-- else, are dropped.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0 · Guard. Every rating so far must be a client's, of its own partner: that
--     is what the backfill to kind 'client_partner' asserts of it.
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_rows bigint;
BEGIN
  SELECT count(*) INTO v_rows
  FROM   rating g
  JOIN   contract k ON k.id = g.contract_id
  WHERE  g.from_org_id <> k.client_org_id OR g.to_org_id <> k.partner_org_id;
  IF v_rows > 0 THEN
    RAISE EXCEPTION '380: % rating(s) are not a client''s rating of its own partner; '
                    'nothing was changed', v_rows;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 1 · The kind, the subject columns, and the shape each kind must have.
--     to_org_id becomes nullable: a crowd resource is a user, not an org.
-- ---------------------------------------------------------------------------
CREATE TYPE rating_kind AS ENUM
  ('client_partner', 'partner_client', 'partner_supplier', 'supplier_worker');

ALTER TABLE rating ADD COLUMN kind rating_kind NOT NULL DEFAULT 'client_partner';
ALTER TABLE rating ALTER COLUMN kind DROP DEFAULT;
ALTER TABLE rating ADD COLUMN task_id uuid REFERENCES task(id) ON DELETE RESTRICT;
ALTER TABLE rating ADD COLUMN assignment_id uuid REFERENCES task_assignment(id) ON DELETE RESTRICT;
ALTER TABLE rating ADD COLUMN to_user_id uuid REFERENCES app_user(id) ON DELETE RESTRICT;
ALTER TABLE rating ALTER COLUMN to_org_id DROP NOT NULL;

-- OR of ANDs, never CASE: a CASE with no ELSE yields NULL, and a CHECK passes NULL.
ALTER TABLE rating ADD CONSTRAINT rating_shape CHECK (
     (kind IN ('client_partner', 'partner_client')
      AND task_id IS NULL AND assignment_id IS NULL
      AND to_user_id IS NULL AND to_org_id IS NOT NULL)
  OR (kind = 'partner_supplier'
      AND task_id IS NOT NULL AND assignment_id IS NULL
      AND to_user_id IS NULL AND to_org_id IS NOT NULL)
  OR (kind = 'supplier_worker'
      AND task_id IS NOT NULL AND assignment_id IS NOT NULL
      AND to_user_id IS NOT NULL AND to_org_id IS NULL)
);

-- ---------------------------------------------------------------------------
-- 2 · Once each. The 070 UNIQUE was never named, so it carries the name
--     PostgreSQL gives an unnamed one; say so plainly if it is not there.
-- ---------------------------------------------------------------------------
DO $fn$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE  conrelid = 'rating'::regclass
      AND  conname = 'rating_contract_id_from_org_id_to_org_id_key'
  ) THEN
    RAISE EXCEPTION '380: rating has no constraint named '
                    'rating_contract_id_from_org_id_to_org_id_key; find the UNIQUE '
                    '(contract_id, from_org_id, to_org_id) under its real name first';
  END IF;
END
$fn$;

ALTER TABLE rating DROP CONSTRAINT rating_contract_id_from_org_id_to_org_id_key;

CREATE UNIQUE INDEX rating_once_per_contract ON rating (contract_id, kind)
  WHERE kind IN ('client_partner', 'partner_client');
CREATE UNIQUE INDEX rating_once_per_task ON rating (task_id)
  WHERE kind = 'partner_supplier';
CREATE UNIQUE INDEX rating_once_per_assignment ON rating (assignment_id)
  WHERE kind = 'supplier_worker';
CREATE INDEX rating_to_user_idx ON rating (to_user_id) WHERE to_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3 · The trigger. It runs with the caller's own rights: the subject must be
--     one the caller can see at all. It finds the expected rater and ratee,
--     refuses the wrong state and the wrong rater, and stamps the row. With no
--     organisation in the session (the owner running a seed or a check) the
--     rater check is skipped; the parties and the state are checked still.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rating_before_insert() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  k          contract%ROWTYPE;
  t          task%ROWTYPE;
  a          task_assignment%ROWTYPE;
  v_contract uuid;
  v_task     uuid;
  v_from     uuid;
  v_to       uuid;
  v_user     uuid;
  v_rater    text;
BEGIN
  IF NEW.kind IN ('client_partner', 'partner_client') THEN
    SELECT * INTO k FROM contract WHERE id = NEW.contract_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'rating: that contract is not one you can rate'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF k.status <> 'completed' THEN
      RAISE EXCEPTION 'rating: % is not complete; it is rated once the client has approved it',
        k.reference_code USING ERRCODE = 'check_violation';
    END IF;
    v_contract := k.id;
    IF NEW.kind = 'client_partner' THEN
      v_from := k.client_org_id;
      v_to := k.partner_org_id;
      v_rater := 'the client';
    ELSE
      v_from := k.partner_org_id;
      v_to := k.client_org_id;
      v_rater := 'the delivery partner';
    END IF;
  ELSIF NEW.kind = 'partner_supplier' THEN
    SELECT * INTO t FROM task WHERE id = NEW.task_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'rating: that task is not one you can rate'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF t.status <> 'qa_passed' THEN
      RAISE EXCEPTION 'rating: % has not passed QA; its supplier is rated once it has',
        t.reference_code USING ERRCODE = 'check_violation';
    END IF;
    SELECT * INTO k FROM contract WHERE id = t.contract_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'rating: that task is not one you can rate'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    v_contract := k.id;
    v_task := t.id;
    v_from := k.partner_org_id;
    v_to := t.assignee_org_id;
    v_rater := 'the delivery partner';
  ELSE
    SELECT * INTO a FROM task_assignment WHERE id = NEW.assignment_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'rating: that assignment is not one you can rate'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF a.status <> 'accepted' OR a.revoked_at IS NOT NULL THEN
      RAISE EXCEPTION 'rating: only an accepted assignment, still with its crowd resource, is rated'
        USING ERRCODE = 'check_violation';
    END IF;
    v_contract := a.contract_id;
    v_task := a.task_id;
    v_from := a.supplier_org_id;
    v_user := a.worker_user_id;
    v_rater := 'the supplier that assigned the work';
  END IF;

  IF current_org_id() IS NOT NULL AND current_org_id() IS DISTINCT FROM v_from THEN
    RAISE EXCEPTION 'rating: only % rates here', v_rater USING ERRCODE = 'check_violation';
  END IF;
  IF (NEW.from_org_id IS NOT NULL AND NEW.from_org_id IS DISTINCT FROM v_from)
     OR (NEW.to_org_id IS NOT NULL AND NEW.to_org_id IS DISTINCT FROM v_to)
     OR (NEW.to_user_id IS NOT NULL AND NEW.to_user_id IS DISTINCT FROM v_user)
     OR (NEW.contract_id IS NOT NULL AND NEW.contract_id IS DISTINCT FROM v_contract)
     OR (NEW.task_id IS NOT NULL AND NEW.task_id IS DISTINCT FROM v_task) THEN
    RAISE EXCEPTION 'rating: the parties named are not the ones this work was between'
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.contract_id := v_contract;
  NEW.task_id     := v_task;
  NEW.from_org_id := v_from;
  NEW.to_org_id   := v_to;
  NEW.to_user_id  := v_user;
  NEW.created_at  := now();
  NEW.created_by  := COALESCE(current_user_id(), NEW.created_by);
  RETURN NEW;
END
$fn$;

CREATE TRIGGER rating_before_insert BEFORE INSERT ON rating
  FOR EACH ROW EXECUTE FUNCTION rating_before_insert();

-- ---------------------------------------------------------------------------
-- 4 · Row-level security: the two parties and Ops. rating_insert (100, "you
--     rate in your own name only") and rating_worker_deny (120) stay as they
--     are; the trigger has already made from_org_id the rater's.
-- ---------------------------------------------------------------------------
DROP POLICY rating_select ON rating;
CREATE POLICY rating_select ON rating FOR SELECT
  USING (is_platform_admin() OR from_org_id = current_org_id()
         OR to_org_id = current_org_id());

-- ---------------------------------------------------------------------------
-- 5 · Grants, 270 style: the default privileges include UPDATE and DELETE on
--     every table, and a rating is never changed once given.
-- ---------------------------------------------------------------------------
REVOKE ALL ON rating FROM sourcehub_app;
GRANT SELECT, INSERT ON rating TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- 6 · Averages for clients and suppliers, numbers only, never a comment.
--     Runs as the owner (the rows are the parties' alone under RLS), so the
--     reader rule is written here: Ops, the organisation itself, any delivery
--     partner about a client, and the parent partner about its supplier. A
--     worker, or anyone else, gets no row. No ratings is NULL, never zero.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION org_rating_summary(p_org_ids uuid[])
RETURNS TABLE (
  org_id       uuid,
  rating_avg   numeric(2,1),
  rating_count integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT o.id, stars.average, stars.total
  FROM   organisation o
  CROSS  JOIN LATERAL (
    SELECT round(avg(g.score), 1)::numeric(2,1) AS average,
           count(*)::integer                    AS total
    FROM   rating g
    JOIN   contract k ON k.id = g.contract_id
    WHERE  g.to_org_id = o.id
      AND  k.deleted_at IS NULL
      AND  g.kind = CASE WHEN o.kind = 'client' THEN 'partner_client'::rating_kind
                         ELSE 'partner_supplier'::rating_kind END
  ) stars
  WHERE  o.id = ANY (p_org_ids)
    AND  o.kind IN ('client', 'aggregator', 'business')
    AND  o.deleted_at IS NULL
    AND  current_org_id() IS NOT NULL
    AND  NOT is_worker()
    AND  (is_platform_admin()
          OR o.id = current_org_id()
          OR (o.kind = 'client' AND current_org_kind() = 'tenant')
          OR (o.kind <> 'client' AND o.parent_org_id = current_org_id()))
$fn$;

REVOKE EXECUTE ON FUNCTION org_rating_summary(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION org_rating_summary(uuid[]) TO sourcehub_app, sourcehub_readonly;

-- ---------------------------------------------------------------------------
-- 7 · The seeded figures go. Nothing in the backend ever wrote either; from
--     here every rating a page shows was given by someone.
-- ---------------------------------------------------------------------------
ALTER TABLE organisation DROP COLUMN rating;
ALTER TABLE crowd_worker DROP COLUMN rating;
"""

_SEED = """
-- rating.write has been seeded for the client and the delivery partner since
-- db/900 and is first checked by a route in this release; the supplier that
-- rates its crowd resource needs it too.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code IN ('aggregator', 'business') AND r.is_system AND p.code = 'rating.write'
ON CONFLICT DO NOTHING;
"""

_DOWN = """
-- Back to the one kind. Refused, changing nothing, while a rating of any other
-- kind exists: the 070 shape (one org rating one org, per contract) cannot
-- hold a task, assignment or worker rating.
DO $fn$
DECLARE
  v_rows bigint;
BEGIN
  SELECT count(*) INTO v_rows FROM rating WHERE kind <> 'client_partner';
  IF v_rows > 0 THEN
    RAISE EXCEPTION '0041 downgrade: % rating(s) are of a kind 070 cannot hold; '
                    'nothing was changed', v_rows;
  END IF;
END
$fn$;

DELETE FROM role_permission
 WHERE permission_id IN (SELECT id FROM permission WHERE code = 'rating.write')
   AND role_id IN (SELECT id FROM role WHERE code IN ('aggregator', 'business') AND is_system);

-- The seeded figures come back empty, and at the end of each row: PostgreSQL
-- appends a re-added column, so a fresh 0040 build and a downgraded one differ
-- in column order alone.
ALTER TABLE organisation ADD COLUMN rating numeric(2,1)
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);
ALTER TABLE crowd_worker ADD COLUMN rating numeric(2,1)
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);

DROP FUNCTION IF EXISTS org_rating_summary(uuid[]);

REVOKE ALL ON rating FROM sourcehub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON rating TO sourcehub_app;

DROP POLICY rating_select ON rating;
CREATE POLICY rating_select ON rating FOR SELECT
  USING (is_platform_admin() OR from_org_id = current_org_id()
         OR to_org_id = current_org_id() OR contract_is_visible(contract_id));

DROP TRIGGER IF EXISTS rating_before_insert ON rating;
DROP FUNCTION IF EXISTS rating_before_insert();

DROP INDEX IF EXISTS rating_to_user_idx;
DROP INDEX IF EXISTS rating_once_per_assignment;
DROP INDEX IF EXISTS rating_once_per_task;
DROP INDEX IF EXISTS rating_once_per_contract;
ALTER TABLE rating DROP CONSTRAINT IF EXISTS rating_shape;

ALTER TABLE rating ALTER COLUMN to_org_id SET NOT NULL;
ALTER TABLE rating DROP COLUMN to_user_id;
ALTER TABLE rating DROP COLUMN assignment_id;
ALTER TABLE rating DROP COLUMN task_id;
ALTER TABLE rating DROP COLUMN kind;
DROP TYPE rating_kind;

ALTER TABLE rating ADD CONSTRAINT rating_contract_id_from_org_id_to_org_id_key
  UNIQUE (contract_id, from_org_id, to_org_id);
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
    for stmt in _statements(_UP) + _statements(_SEED):
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
