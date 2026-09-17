-- ============================================================================
-- 150 · The client's working documents reach the people doing the work
--
-- A request's documents were visible to exactly whoever could see the request:
-- the client, bidders while it was open, the awarded partner. Nobody further
-- down. The aggregator organising the capture and the worker holding the
-- camera never saw the field guidelines, the good/reject examples or the
-- acceptance criteria — the three documents written for them — and their work
-- was then judged against rules they had not been shown.
--
-- What opens up, and to whom:
--
--   slot               aggregator   worker
--   brief              no           no      commercial terms; client and partner
--   guidelines         yes          yes
--   capture_examples   yes          yes
--   acceptance         yes          yes
--   compliance         yes          no      legal paperwork between businesses;
--                                           the rules a worker must follow
--                                           belong in the guidelines
--
-- Access follows the work. An aggregator qualifies through a live task assigned
-- to it on the request's contract; a worker only through an assignment they
-- hold on such a task. Remove the task and the access goes with it.
--
-- The request and contract ROWS stay closed: request_worker_deny and
-- contract_worker_deny are untouched, and an aggregator still cannot read a
-- request. Only attachment rows are admitted, which is why both helpers are
-- SECURITY DEFINER — the caller cannot walk task -> contract -> request itself.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1 · Has this request's work come down to me?
--
-- For the policy. Same shape as worker_holds_assignment(): definer, so it can
-- read contract on behalf of a caller who may not.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_shared_downstream(p_request_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM   task t
    JOIN   contract c ON c.id = t.contract_id
    WHERE  c.request_id = p_request_id
      AND  t.deleted_at IS NULL
      AND  t.assignee_org_id = current_org_id()
      AND  (NOT is_worker() OR worker_holds_assignment(t.id))
  )
$fn$;

REVOKE EXECUTE ON FUNCTION request_shared_downstream(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION request_shared_downstream(uuid) TO sourcehub_app, sourcehub_readonly;


-- ---------------------------------------------------------------------------
-- 2 · Which request is this task for?
--
-- For the service, which has a task in hand and needs the request its documents
-- hang off. A worker cannot read contract to find out. The guard restates
-- task_select and task_worker_select: whoever can see the task may learn which
-- request it belongs to, and nobody else gets an answer.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION task_request_id(p_task_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT c.request_id
  FROM   task t
  JOIN   contract c ON c.id = t.contract_id
  WHERE  t.id = p_task_id
    AND  t.deleted_at IS NULL
    AND  (is_platform_admin()
          OR t.assignee_org_id = current_org_id()
          OR contract_is_visible(t.contract_id))
    AND  (NOT is_worker() OR worker_holds_assignment(t.id))
$fn$;

REVOKE EXECUTE ON FUNCTION task_request_id(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION task_request_id(uuid) TO sourcehub_app, sourcehub_readonly;


-- ---------------------------------------------------------------------------
-- 3 · The policy
--
-- A second PERMISSIVE policy, so it ORs with attachment_select and leaves that
-- one exactly as it was — the same way request_select_bidder sits beside
-- request_select. The slot list lives here and nowhere else: the database is
-- the boundary, and the service filters nothing it could get wrong.
--
-- Writes are unaffected. attachment_insert still requires the owning org, and
-- attachment_worker_no_insert / _no_update still stop a worker outright.
-- ---------------------------------------------------------------------------
CREATE POLICY attachment_select_downstream ON attachment FOR SELECT
  USING (
        entity_type = 'request'
    AND slot IN ('guidelines', 'capture_examples', 'acceptance', 'compliance')
    AND (slot <> 'compliance' OR NOT is_worker())
    AND request_shared_downstream(entity_id)
  );
