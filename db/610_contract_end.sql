-- ============================================================================
-- 610 · A contract can be ended: by its client, its partner or Ops
--
-- Once awarded, a contract could not be ended by anyone, even after a wrong
-- award, a partner that stalled or a need that went away. It stayed In
-- Progress for good: it counted as committed spend, it stayed open to
-- invoices, and workers could keep uploading to it. db/001 has carried
-- contract_status 'cancelled' from the start; nothing ever wrote it.
--
-- contract_end() is the one way a contract ends, with a reason, while it is
-- live (active, delivered, or disputed). The client, the partner or Ops ends
-- it alone and at once (modules/delivery end_contract tells the others). In
-- the same transaction:
--   * every task that has not passed QA ends through task_end() (db/600) as
--     'contract_ended': its open offer closes, its crowd assignments are
--     cancelled, a submission waiting for QA is superseded
--   * the conversation between the client and the partner closes, with the
--     new reason 'contract_ended'
-- Work that passed QA stays accepted, and invoices already raised stay
-- payable. Further invoices follow the accepted work (modules/invoices: a
-- fixed price in proportion to it).
--
-- An ended RFP can be tendered again as a new draft copied from it:
-- request.retender_of names the RFP a draft was copied from, one live copy
-- each. One contract per RFP stays the rule.
--
-- What the database holds to, whatever a caller's row policy would let it
-- write:
--   * contract_end_shape: ended_at is set exactly when the contract is
--     cancelled, with who ended it (client, partner or ops) and a reason that
--     is not blank
--   * contract_end_guard: only a live contract can end, and an ended one stays
--     ended. A delivery, an approval or a dispute racing the end finds it so
--   * task_contract_guard: an ended contract takes no new task. It share-locks
--     the contract, so a task being created waits for an ending in flight
--   * rfp_thread_insert: no new conversation on an ended contract
-- ============================================================================

ALTER TABLE contract ADD COLUMN ended_at        timestamptz;
ALTER TABLE contract ADD COLUMN ended_by        uuid REFERENCES app_user(id);
ALTER TABLE contract ADD COLUMN ended_by_org_id uuid REFERENCES organisation(id);
ALTER TABLE contract ADD COLUMN ended_by_party  text;
ALTER TABLE contract ADD COLUMN end_reason      text;

-- Nothing wrote 'cancelled' before this file. A row edited by hand gets a
-- stamp, so the shape below holds for every row.
UPDATE contract SET ended_at = updated_at, ended_by_party = 'ops',
                    end_reason = 'Ended before contracts recorded why.'
WHERE status = 'cancelled';

ALTER TABLE contract ADD CONSTRAINT contract_end_shape CHECK (
  (status = 'cancelled') = (ended_at IS NOT NULL)
  AND (ended_by_party IS NULL) = (ended_at IS NULL)
  AND (ended_by_party IS NULL OR ended_by_party IN ('client', 'partner', 'ops'))
  AND (ended_at IS NULL OR (end_reason IS NOT NULL AND btrim(end_reason) <> ''))
  AND (end_reason IS NULL OR char_length(end_reason) <= 2000)
);

CREATE OR REPLACE FUNCTION contract_end_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD.status = 'cancelled'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.ended_at IS DISTINCT FROM OLD.ended_at
          OR NEW.ended_by IS DISTINCT FROM OLD.ended_by
          OR NEW.ended_by_org_id IS DISTINCT FROM OLD.ended_by_org_id
          OR NEW.ended_by_party IS DISTINCT FROM OLD.ended_by_party
          OR NEW.end_reason IS DISTINCT FROM OLD.end_reason) THEN
    RAISE EXCEPTION 'contract %: it has ended, and an ended contract stays ended', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled'
     AND OLD.status NOT IN ('active', 'delivered', 'disputed') THEN
    RAISE EXCEPTION 'contract %: only a live contract can end', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER contract_end_guard BEFORE UPDATE ON contract
  FOR EACH ROW EXECUTE FUNCTION contract_end_guard();

-- Definer, and FOR SHARE: the partner inserting the task may read the row,
-- but the answer must not depend on that, and the lock is what makes a task
-- created during an ending wait for it and then be refused.
CREATE OR REPLACE FUNCTION task_contract_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_status contract_status;
  v_ref    text;
BEGIN
  SELECT status, reference_code INTO v_status, v_ref FROM contract
   WHERE id = NEW.contract_id FOR SHARE;
  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'contract %: it has ended, so it takes no new task', v_ref
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER task_contract_guard BEFORE INSERT ON task
  FOR EACH ROW EXECUTE FUNCTION task_contract_guard();

ALTER TABLE rfp_thread DROP CONSTRAINT rfp_thread_closed_reason_check;
ALTER TABLE rfp_thread ADD CONSTRAINT rfp_thread_closed_reason_check
  CHECK (closed_reason IS NULL
         OR closed_reason IN ('awarded_elsewhere', 'contract_completed', 'request_cancelled',
                              'contract_ended'));

-- db/250's policy, with an ended contract counted as closed as a completed
-- one is: the winner may open a conversation only while its contract is live.
DROP POLICY rfp_thread_insert ON rfp_thread;
CREATE POLICY rfp_thread_insert ON rfp_thread FOR INSERT
  WITH CHECK (
       NOT is_platform_admin()
    AND current_org_kind() = 'tenant'
    AND partner_org_id = current_org_id()
    AND opened_by      = current_user_id()
    AND EXISTS (SELECT 1 FROM request r
                 WHERE r.id = rfp_thread.request_id
                   AND r.client_org_id = rfp_thread.client_org_id
                   AND r.deleted_at IS NULL
                   AND (r.status = 'published'
                        OR EXISTS (SELECT 1 FROM contract c
                                    WHERE c.request_id = r.id
                                      AND c.partner_org_id = current_org_id()
                                      AND c.status NOT IN ('completed', 'cancelled'))))
  );

ALTER TABLE request ADD COLUMN retender_of uuid REFERENCES request(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX request_retender_key ON request (retender_of)
  WHERE retender_of IS NOT NULL AND deleted_at IS NULL;

-- Returns, for each crowd assignment it cancelled, its task and its worker,
-- so the caller can tell each person the work was taken off them.
CREATE OR REPLACE FUNCTION contract_end(p_contract uuid, p_reason text)
RETURNS TABLE (ended_task uuid, ended_assignment uuid, ended_worker uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_org    uuid := current_org_id();
  v_user   uuid := current_user_id();
  v_reason text := btrim(coalesce(p_reason, ''));
  v_party  text;
  k        contract%ROWTYPE;
  t        record;
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- First the contract, then each task (task_end locks it), in the order
  -- every other writer takes them: a delivery or an approval in flight lands
  -- first or waits and finds the contract ended. NO KEY UPDATE: a worker
  -- holding one of these tasks while its batch, assignment or offer row checks
  -- its foreign key to this contract must not wait on us while we wait on it.
  SELECT * INTO k FROM contract WHERE id = p_contract AND deleted_at IS NULL FOR NO KEY UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'contract_end: no such contract' USING ERRCODE = 'no_data_found';
  END IF;

  v_party := CASE
    WHEN is_platform_admin()       THEN 'ops'
    WHEN v_org = k.client_org_id   THEN 'client'
    WHEN v_org = k.partner_org_id  THEN 'partner'
  END;
  IF v_party IS NULL THEN
    RAISE EXCEPTION 'contract %: only its client, its partner or Ops can end it', k.reference_code
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF k.status = 'cancelled' THEN
    RAISE EXCEPTION 'contract %: it has already ended', k.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF k.status NOT IN ('active', 'delivered', 'disputed') THEN
    RAISE EXCEPTION 'contract %: it is complete, so it cannot end', k.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_reason = '' THEN
    RAISE EXCEPTION 'contract %: say why it ends', k.reference_code
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE contract
     SET status = 'cancelled', ended_at = now(), ended_by = v_user, ended_by_org_id = v_org,
         ended_by_party = v_party, end_reason = v_reason, updated_by = v_user
   WHERE id = k.id;

  -- task_end() finds the contract ended and lets its client, partner or Ops
  -- end each task as 'contract_ended'. Locked here, so a task withdrawn or
  -- passed by a call that got its lock first is read as it now is, and
  -- skipped, instead of refused inside task_end().
  FOR t IN SELECT id FROM task
            WHERE contract_id = k.id AND deleted_at IS NULL
              AND status NOT IN ('qa_passed', 'cancelled')
            ORDER BY created_at, reference_code
            FOR NO KEY UPDATE
  LOOP
    RETURN QUERY SELECT t.id, e.ended_assignment, e.ended_worker
                 FROM task_end(t.id, 'contract_ended', v_reason) e;
  END LOOP;

  -- the conversation, under the lock a poster holds (modules/threads)
  PERFORM pg_advisory_xact_lock(hashtextextended('rfp-thread:' || CAST(h.id AS text), 0))
     FROM rfp_thread h
    WHERE h.request_id = k.request_id AND h.partner_org_id = k.partner_org_id
      AND h.closed_at IS NULL;
  UPDATE rfp_thread
     SET closed_at = now(), closed_reason = 'contract_ended', closed_by = v_user
   WHERE request_id = k.request_id AND partner_org_id = k.partner_org_id
     AND closed_at IS NULL;
END
$fn$;

REVOKE EXECUTE ON FUNCTION contract_end(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION contract_end(uuid, text) TO sourcehub_app;

COMMENT ON COLUMN contract.ended_at IS
  'When the contract was ended before completion; set exactly when status is cancelled';
COMMENT ON COLUMN contract.ended_by_party IS
  'Who ended it: client, partner or ops';
COMMENT ON COLUMN contract.end_reason IS
  'Why it ended, in the words of whoever ended it: shown to both parties and to the suppliers';
COMMENT ON COLUMN request.retender_of IS
  'On a draft copied from an RFP whose contract ended: the RFP it was copied from';
COMMENT ON COLUMN rfp_thread.closed_reason IS
  'awarded_elsewhere: a losing partner''s thread, closed at award. '
  'contract_completed: the winner''s, closed when the client approved the delivery. '
  'request_cancelled: every thread on a request its client cancelled. '
  'contract_ended: the winner''s, closed when the contract was ended';
