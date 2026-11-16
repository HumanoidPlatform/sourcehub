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
