-- ============================================================================
-- 340 · Capture batches, retakes, and handing an assignment to someone else
--
-- A worker used to send their whole share at once: nothing could be submitted
-- until every unit was captured, and nothing could be captured while the
-- aggregator was looking at it. Now they send what they have, as a BATCH, and
-- go on capturing. The aggregator answers each batch capture by capture:
-- everything not marked to be shot again is accepted, and stays accepted.
--
--   capture_batch   one send: its number within the assignment, who sent it
--                   and when, the worker's note, and the reviewer's answer.
--                   in_review -> reviewed. More than one can be in review at
--                   once; each is decided on its own.
--
-- What a capture is, read off columns that already exist plus batch_id:
--
--   draft       batch_id IS NULL and status 'ready' — on the server, not sent
--   in review   its batch is in_review
--   accepted    its batch is reviewed and it is still 'ready'
--   rework      status 'rejected' (db/210) and no live capture replaces it
--
-- The assignment stays in_progress while any of it is still to do, and the
-- server moves it to accepted itself once the accepted captures reach its
-- quantity (modules/qa settle). 'submitted' and 'rejected' are no longer
-- entered; rows already in them are moved below.
--
-- asset.replaces_asset_id is a retake's pointer to the capture it replaces —
-- no foreign key, because asset is partitioned and its key includes
-- created_at. The replaced one keeps its row and its reason, for the record.
--
-- REVOKING. An aggregator can take an assignment off one worker and give the
-- rest to another (modules/delivery reassign_assignment). What the first one
-- uploaded is sent as a last batch; their quantity shrinks to what they sent;
-- revoked_at stops them uploading; reassigned_to is the assignment that took
-- the rest, which also takes any of the first worker's captures later marked
-- to be shot again.
-- ============================================================================

CREATE TYPE batch_status AS ENUM ('in_review', 'reviewed');

CREATE TABLE capture_batch (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id    uuid NOT NULL REFERENCES task_assignment(id) ON DELETE RESTRICT,
  -- copied from the assignment so the policies are column compares
  task_id          uuid NOT NULL REFERENCES task(id)            ON DELETE RESTRICT,
  contract_id      uuid NOT NULL REFERENCES contract(id)        ON DELETE RESTRICT,
  supplier_org_id  uuid NOT NULL REFERENCES organisation(id)    ON DELETE RESTRICT,
  worker_user_id   uuid NOT NULL REFERENCES app_user(id)        ON DELETE RESTRICT,

  batch_no         integer NOT NULL CHECK (batch_no > 0),
  status           batch_status NOT NULL DEFAULT 'in_review',
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  -- the worker, or the aggregator when a revoke sent it for them
  submitted_by     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  worker_note      text,

  decided_at       timestamptz,
  decided_by       uuid REFERENCES app_user(id) ON DELETE SET NULL,
  decision_note    text,
  accepted_count   integer NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
  rework_count     integer NOT NULL DEFAULT 0 CHECK (rework_count >= 0),

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT capture_batch_no_key UNIQUE (assignment_id, batch_no),
  CONSTRAINT capture_batch_reviewed_has_decision CHECK (
    status <> 'reviewed' OR decided_at IS NOT NULL
  )
);

-- the aggregator's gate-1 queue
CREATE INDEX capture_batch_review_idx ON capture_batch (supplier_org_id, submitted_at)
  WHERE status = 'in_review';
CREATE INDEX capture_batch_worker_idx ON capture_batch (worker_user_id);

CREATE TRIGGER capture_batch_updated_at BEFORE UPDATE ON capture_batch
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ENABLE, never FORCE (db/270).
ALTER TABLE capture_batch ENABLE ROW LEVEL SECURITY;

-- task_assignment's own audience: the supplier, its delivery partner, Ops.
CREATE POLICY capture_batch_select ON capture_batch FOR SELECT
  USING (
       is_platform_admin()
    OR supplier_org_id = current_org_id()
    OR contract_is_mine_as_partner(contract_id)
  );

-- The worker sends their own; the aggregator sends one on a revoke.
CREATE POLICY capture_batch_insert ON capture_batch FOR INSERT
  WITH CHECK (supplier_org_id = current_org_id());

-- Only the supplier's staff answer a batch.
CREATE POLICY capture_batch_update ON capture_batch FOR UPDATE
  USING      (NOT is_worker() AND (is_platform_admin() OR supplier_org_id = current_org_id()))
  WITH CHECK (NOT is_worker() AND (is_platform_admin() OR supplier_org_id = current_org_id()));

CREATE POLICY capture_batch_worker_select ON capture_batch AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR worker_user_id = current_user_id());
CREATE POLICY capture_batch_worker_insert ON capture_batch AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT is_worker() OR (worker_user_id = current_user_id() AND status = 'in_review'));

-- What the API does with a batch, and nothing more (db/270): it inserts one
-- and answers it. No DELETE — a send is part of the record.
REVOKE ALL ON capture_batch FROM sourcehub_app;
GRANT SELECT, INSERT ON capture_batch TO sourcehub_app;
GRANT UPDATE (status, decided_at, decided_by, decision_note, accepted_count, rework_count,
              updated_at)
  ON capture_batch TO sourcehub_app;
GRANT SELECT ON capture_batch TO sourcehub_readonly;

ALTER TABLE asset ADD COLUMN batch_id uuid REFERENCES capture_batch(id) ON DELETE RESTRICT;
ALTER TABLE asset ADD COLUMN replaces_asset_id uuid;
COMMENT ON COLUMN asset.batch_id IS
  'The send this capture went out in (capture_batch). NULL: on the server, not yet sent.';
COMMENT ON COLUMN asset.replaces_asset_id IS
  'A retake: the capture sent back for rework that this one replaces.';
CREATE INDEX asset_batch_idx ON asset (batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX asset_replaces_idx ON asset (replaces_asset_id) WHERE replaces_asset_id IS NOT NULL;

ALTER TABLE qa_review ADD COLUMN batch_id uuid REFERENCES capture_batch(id) ON DELETE RESTRICT;

ALTER TABLE task_assignment ADD COLUMN revoked_at timestamptz;
ALTER TABLE task_assignment ADD COLUMN revoked_by uuid REFERENCES app_user(id) ON DELETE SET NULL;
ALTER TABLE task_assignment ADD COLUMN reassigned_to uuid REFERENCES task_assignment(id) ON DELETE SET NULL;
COMMENT ON COLUMN task_assignment.revoked_at IS
  'Taken off this worker. What they uploaded is reviewed; they capture nothing more.';
COMMENT ON COLUMN task_assignment.reassigned_to IS
  'The assignment that took the rest of a revoked one, and takes its later retakes.';

-- ---------------------------------------------------------------------------
-- Existing work, in the new shape. Everything an assignment had sent before
-- becomes its batch 1: in review if it is waiting on the aggregator now,
-- reviewed if it was answered. A capture made after the last send stays a
-- draft. Then nothing is left 'submitted' or 'rejected'.
-- ---------------------------------------------------------------------------
INSERT INTO capture_batch (assignment_id, task_id, contract_id, supplier_org_id, worker_user_id,
                           batch_no, status, submitted_at, submitted_by, worker_note,
                           decided_at, decided_by, decision_note)
SELECT a.id, a.task_id, a.contract_id, a.supplier_org_id, a.worker_user_id,
       1,
       CASE WHEN a.status = 'submitted' THEN 'in_review'::batch_status ELSE 'reviewed'::batch_status END,
       a.submitted_at, a.worker_user_id, a.worker_note,
       CASE WHEN a.status = 'submitted' THEN NULL ELSE coalesce(a.decided_at, a.submitted_at) END,
       CASE WHEN a.status = 'submitted' THEN NULL ELSE a.decided_by END,
       CASE WHEN a.status = 'submitted' THEN NULL ELSE a.decision_note END
FROM task_assignment a
WHERE a.submitted_at IS NOT NULL;

UPDATE asset s SET batch_id = b.id
FROM capture_batch b
WHERE b.assignment_id = s.assignment_id
  AND s.deleted_at IS NULL
  AND s.status IN ('ready', 'rejected')
  AND s.created_at <= b.submitted_at;

UPDATE capture_batch b SET
  accepted_count = (SELECT count(*) FROM asset s
                    WHERE s.batch_id = b.id AND s.status = 'ready' AND s.deleted_at IS NULL),
  rework_count   = (SELECT count(*) FROM asset s
                    WHERE s.batch_id = b.id AND s.status = 'rejected' AND s.deleted_at IS NULL)
WHERE b.status = 'reviewed';

UPDATE task_assignment SET status = 'in_progress'
WHERE status IN ('submitted', 'rejected');
