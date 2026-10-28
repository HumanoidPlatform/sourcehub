-- ============================================================================
-- 600 · A task can end before it passes QA: declined, returned, withdrawn, moved
--
-- Once a partner gave a task to a supplier, nothing could take it back. The
-- supplier could only start and submit it, and the partner could neither
-- withdraw it nor give it to someone else. A task the supplier could not
-- staff sat Assigned for good, and since every task had to pass QA before
-- delivery, one stuck task held up the whole contract. db/001 has carried
-- task_status 'cancelled' from the start; nothing ever wrote it.
--
-- task_end() is the one way a task ends. modules/delivery calls it as:
--   declined        the supplier, before anyone has started on it
--   returned        the supplier, any time before it is with the partner for
--                   QA (in progress, or sent back by QA)
--   withdrawn       the partner, any time before it passes QA
--   moved           the partner: this one ends and a copy goes to another
--                   supplier, the copy naming it in replaces_task_id
--   contract_ended  for each live task of a contract that has ended
--                   (db/610 writes that)
-- Every ending carries a reason, and ends the work under the task in the
-- same transaction:
--   * its open offer closes, so nobody accepts a place on it
--   * every live crowd assignment is cancelled, which stops uploads,
--     sending and reminders (they all read the assignment's status)
--   * a submission waiting for partner QA is superseded, so a verdict given
--     late cannot bring the task back
-- Batches waiting for the supplier's own review stay as they are, and leave
-- the queue with their task. Captures already uploaded stay in the client's
-- bucket, and nothing that passed QA is touched: a task that passed cannot
-- end.
--
-- It is a definer function because the partner, and later the client and
-- Ops, end rows only the supplier may write (task_assignment, task_offer).
-- It checks who is asking itself, from the session's organisation.
--
-- What the database holds to, whatever a caller's row policy would let it
-- write:
--   * task_end_shape: ended_at is set exactly when the task is cancelled, with
--     a kind and a reason that is not blank
--   * task_end_guard: an ended task stays ended, and a task that passed QA
--     cannot end
--   * task_live_guard: an ended task takes no new crowd assignment, offer or
--     submission
--   * task_assignment_cancel_guard: a cancelled crowd assignment stays
--     cancelled, so a start racing the end cannot revive it
--   * task_replaces_guard: a copy names only a task of its own contract that
--     ended as moved, and each moved task has at most one copy
-- ============================================================================

ALTER TABLE task ADD COLUMN ended_at         timestamptz;
ALTER TABLE task ADD COLUMN ended_by         uuid REFERENCES app_user(id);
ALTER TABLE task ADD COLUMN ended_by_org_id  uuid REFERENCES organisation(id);
ALTER TABLE task ADD COLUMN end_kind         text;
ALTER TABLE task ADD COLUMN end_reason       text;
ALTER TABLE task ADD COLUMN replaces_task_id uuid REFERENCES task(id) ON DELETE RESTRICT;

-- Nothing wrote 'cancelled' before this file. A row edited by hand gets a
-- stamp, so the shape below holds for every row.
UPDATE task SET ended_at = updated_at, end_kind = 'withdrawn',
                end_reason = 'Ended before tasks recorded why.'
WHERE status = 'cancelled';

ALTER TABLE task ADD CONSTRAINT task_end_shape CHECK (
  (status = 'cancelled') = (ended_at IS NOT NULL)
  AND (end_kind IS NULL) = (ended_at IS NULL)
  AND (end_kind IS NULL
       OR end_kind IN ('declined', 'returned', 'withdrawn', 'moved', 'contract_ended'))
  AND (ended_at IS NULL OR (end_reason IS NOT NULL AND btrim(end_reason) <> ''))
  AND (end_reason IS NULL OR char_length(end_reason) <= 2000)
);

CREATE UNIQUE INDEX task_replaces_key ON task (replaces_task_id)
  WHERE replaces_task_id IS NOT NULL;

CREATE OR REPLACE FUNCTION task_end_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD.status = 'cancelled'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.ended_at IS DISTINCT FROM OLD.ended_at
          OR NEW.ended_by IS DISTINCT FROM OLD.ended_by
          OR NEW.ended_by_org_id IS DISTINCT FROM OLD.ended_by_org_id
          OR NEW.end_kind IS DISTINCT FROM OLD.end_kind
          OR NEW.end_reason IS DISTINCT FROM OLD.end_reason) THEN
    RAISE EXCEPTION 'task %: it has ended, and an ended task stays ended', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status = 'qa_passed' THEN
    RAISE EXCEPTION 'task %: it passed QA, so it cannot end', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER task_end_guard BEFORE UPDATE ON task
  FOR EACH ROW EXECUTE FUNCTION task_end_guard();

-- Definer: a worker's session inserting its own row may not be able to read
-- the task, and the answer must not depend on who asks.
CREATE OR REPLACE FUNCTION task_live_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_ref text;
BEGIN
  SELECT reference_code INTO v_ref FROM task WHERE id = NEW.task_id AND status = 'cancelled';
  IF FOUND THEN
    RAISE EXCEPTION 'task %: it has ended, so it takes no new work', v_ref
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER task_assignment_live_guard BEFORE INSERT ON task_assignment
  FOR EACH ROW EXECUTE FUNCTION task_live_guard();
CREATE TRIGGER task_offer_live_guard BEFORE INSERT ON task_offer
  FOR EACH ROW EXECUTE FUNCTION task_live_guard();
CREATE TRIGGER submission_live_guard BEFORE INSERT ON submission
  FOR EACH ROW EXECUTE FUNCTION task_live_guard();

CREATE OR REPLACE FUNCTION task_assignment_cancel_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'assignment: it was cancelled, and a cancelled assignment stays cancelled'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER task_assignment_cancel_guard BEFORE UPDATE OF status ON task_assignment
  FOR EACH ROW EXECUTE FUNCTION task_assignment_cancel_guard();

CREATE OR REPLACE FUNCTION task_replaces_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NEW.replaces_task_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM task o
                      WHERE o.id = NEW.replaces_task_id
                        AND o.contract_id = NEW.contract_id
                        AND o.status = 'cancelled' AND o.end_kind = 'moved') THEN
    RAISE EXCEPTION 'task %: it can only replace a task of the same contract that was moved',
      NEW.reference_code USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER task_replaces_guard BEFORE INSERT OR UPDATE OF replaces_task_id ON task
  FOR EACH ROW EXECUTE FUNCTION task_replaces_guard();

-- Returns the crowd assignments it cancelled, so the caller can tell each
-- person that the work was taken off them.
CREATE OR REPLACE FUNCTION task_end(p_task uuid, p_kind text, p_reason text)
RETURNS TABLE (ended_assignment uuid, ended_worker uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_org     uuid := current_org_id();
  v_user    uuid := current_user_id();
  v_reason  text := btrim(coalesce(p_reason, ''));
  v_ok      boolean;
  v_taken   uuid[];
  v_workers uuid[];
  t         task%ROWTYPE;
  k         contract%ROWTYPE;
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- The lock is what every other writer of the task waits on: a start, a
  -- submission, a new assignment or a QA verdict either lands first and is
  -- seen below, or waits and then finds the task ended. NO KEY UPDATE, as
  -- every writer takes it: it queues them all, and still lets an insert that
  -- only references the task (an upload's asset row) check its foreign key.
  SELECT * INTO t FROM task WHERE id = p_task AND deleted_at IS NULL FOR NO KEY UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'task_end: no such task' USING ERRCODE = 'no_data_found';
  END IF;
  SELECT * INTO k FROM contract WHERE id = t.contract_id;

  v_ok := CASE p_kind
    WHEN 'declined'       THEN t.assignee_org_id = v_org AND NOT is_worker()
    WHEN 'returned'       THEN t.assignee_org_id = v_org AND NOT is_worker()
    WHEN 'withdrawn'      THEN k.partner_org_id = v_org
    WHEN 'moved'          THEN k.partner_org_id = v_org
    WHEN 'contract_ended' THEN k.status = 'cancelled'
                               AND (v_org IN (k.client_org_id, k.partner_org_id)
                                    OR is_platform_admin())
  END;
  IF v_ok IS NULL THEN
    RAISE EXCEPTION 'task_end: % is not a way a task ends', p_kind
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'task %: you cannot end it this way', t.reference_code
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF t.status = 'cancelled' THEN
    RAISE EXCEPTION 'task %: it has already ended', t.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF t.status = 'qa_passed' THEN
    RAISE EXCEPTION 'task %: it passed QA, so it cannot end', t.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF p_kind = 'declined' AND (t.status <> 'assigned' OR t.started_at IS NOT NULL) THEN
    RAISE EXCEPTION 'task %: work on it has started, so hand it back instead', t.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF p_kind = 'returned' AND t.status = 'submitted' THEN
    RAISE EXCEPTION 'task %: it is with the partner for QA', t.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_reason = '' THEN
    RAISE EXCEPTION 'task %: say why it ends', t.reference_code
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE task_offer SET status = 'closed', closed_at = now(), closed_by = v_user
   WHERE task_id = t.id AND status = 'open';

  WITH gone AS (
    UPDATE task_assignment a
       SET status = 'cancelled', decided_at = now(), decided_by = v_user
     WHERE a.task_id = t.id AND a.status IN ('assigned', 'in_progress', 'submitted', 'rejected')
    RETURNING a.id, a.worker_user_id
  )
  SELECT array_agg(gone.id), array_agg(gone.worker_user_id) INTO v_taken, v_workers FROM gone;

  UPDATE submission SET status = 'superseded', closed_at = now()
   WHERE task_id = t.id AND status IN ('open', 'submitted', 'under_review');

  UPDATE task
     SET status = 'cancelled', ended_at = now(), ended_by = v_user, ended_by_org_id = v_org,
         end_kind = p_kind, end_reason = v_reason, updated_by = v_user
   WHERE id = t.id;

  RETURN QUERY SELECT unnest(v_taken), unnest(v_workers);
END
$fn$;

REVOKE EXECUTE ON FUNCTION task_end(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION task_end(uuid, text, text) TO sourcehub_app;

COMMENT ON COLUMN task.ended_at IS
  'When the task ended before passing QA; set exactly when status is cancelled';
COMMENT ON COLUMN task.end_kind IS
  'declined or returned by the supplier, withdrawn or moved by the partner, or contract_ended';
COMMENT ON COLUMN task.end_reason IS
  'Why it ended, in the words of whoever ended it: shown to the partner and the supplier';
COMMENT ON COLUMN task.replaces_task_id IS
  'On the copy a moved task became: the task it replaces';
