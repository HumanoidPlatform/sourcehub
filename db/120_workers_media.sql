-- ============================================================================
-- 120 · Field workers and the media plane (pilot)
--
-- Closes the gap between "a task is assigned to an aggregator organisation"
-- and "a person captured a file on a phone":
--
--   1. crowd workers become principals: an app_user with the 'worker' role
--      granted in the aggregator's organisation (role and permissions are
--      seeded in 905, which runs after 900 has created the RBAC tables' data);
--   2. task_assignment — the aggregator → person hop, with its own lifecycle
--      and a gate-1 verdict;
--   3. asset becomes the manifest of ONE capture, attributable to a task, an
--      assignment and a person before any submission exists, and its policy
--      becomes column compares instead of a three-table walk per row;
--   4. qa_review may review an assignment (gate 1) as well as a submission
--      (gates 2 and 3);
--   5. a 'worker' session is narrowed to its own rows by RESTRICTIVE policies,
--      which AND with the permissive org-level policies that already work.
--
-- Two implementation details decide whether the worker scope works at all:
--
--   * current_app_role() is NULL when no role is set, so a predicate written
--     as  current_app_role() <> 'worker'  is NULL, and NULL denies. Every
--     worker predicate below goes through is_worker(), which coalesces.
--   * A policy on task that subqueries task_assignment while a policy on
--     task_assignment subqueries task is "infinite recursion detected in
--     policy". task_assignment therefore carries contract_id (like asset
--     does), and task reads task_assignment only through the SECURITY DEFINER
--     helper worker_holds_assignment().
--
-- Also carries the fix for a concurrency defect in write_audit_event: the
-- chain head was read without a lock, so two commits at once forked the
-- chain. An advisory transaction lock serialises the append.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 0 · Session helper. Mirrors is_platform_admin(): coalesced, never NULL.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_worker() RETURNS boolean
LANGUAGE sql STABLE AS $fn$
  SELECT coalesce(current_setting('app.role', true) = 'worker', false)
$fn$;

GRANT EXECUTE ON FUNCTION is_worker() TO sourcehub_app, sourcehub_readonly;


-- ---------------------------------------------------------------------------
-- 1 · The audit chain must serialise.
--
-- Same signature and body as 090, plus one line: an advisory lock held to
-- the end of the transaction, so the head read and the append are atomic
-- with respect to every other writer. SECURITY DEFINER is restated because
-- CREATE OR REPLACE resets unspecified attributes (110 had set it).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION write_audit_event(
  p_event_type text,
  p_summary    text,
  p_scope      uuid[]  DEFAULT '{}',
  p_payload    jsonb   DEFAULT '{}'::jsonb,
  p_actor_org  uuid    DEFAULT NULL,
  p_actor_user uuid    DEFAULT NULL
) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_prev text;
  v_hash text;
  v_id   bigint;
  v_org  uuid := coalesce(p_actor_org,  current_org_id());
  v_user uuid := coalesce(p_actor_user, current_user_id());
BEGIN
  -- one writer at a time: two concurrent commits must not both chain onto
  -- the same head, or the single tamper-evident chain silently becomes a tree
  PERFORM pg_advisory_xact_lock(hashtext('audit_event_chain'));

  SELECT row_hash INTO v_prev FROM audit_event ORDER BY id DESC LIMIT 1;

  v_hash := encode(digest(
      coalesce(v_prev, '') || p_event_type || p_summary ||
      coalesce(v_org::text, '') || coalesce(v_user::text, '') ||
      p_payload::text || now()::text,
    'sha256'), 'hex');

  INSERT INTO audit_event (event_type, actor_org_id, actor_user_id,
                           summary, payload, scope, prev_hash, row_hash)
  VALUES (p_event_type, v_org, v_user, p_summary, p_payload, p_scope, v_prev, v_hash)
  RETURNING id INTO v_id;

  RETURN v_id;
END
$fn$;


-- ---------------------------------------------------------------------------
-- 2 · crowd_worker — a roster row may now be a person who signs in.
--
-- user_id links the roster entry to its app_user; NULL for a legacy roster
-- row added without an email. Offboarding revokes the grant (service layer).
-- ---------------------------------------------------------------------------
ALTER TABLE crowd_worker
  ADD COLUMN user_id uuid UNIQUE REFERENCES app_user(id) ON DELETE SET NULL,
  ADD COLUMN email   citext,
  ADD COLUMN phone   text;


-- ---------------------------------------------------------------------------
-- 3 · task — countable. "100 images" as a number, so assignments can split it
--     and progress can count it. target (free text) stays for display.
-- ---------------------------------------------------------------------------
ALTER TABLE task
  ADD COLUMN target_quantity integer CHECK (target_quantity IS NULL OR target_quantity > 0),
  ADD COLUMN target_unit     text,                      -- image | video | record | hour
  ADD COLUMN instructions    text,
  ADD COLUMN capture_spec    jsonb NOT NULL DEFAULT '{}'::jsonb;  -- min resolution, geofence, orientation


-- ---------------------------------------------------------------------------
-- 4 · task_assignment — the aggregator → person hop.
--
-- One row per worker per task, with its own lifecycle:
--
--   assigned --worker start--> in_progress --worker submit--> submitted
--   submitted --aggregator accept--> accepted
--   submitted --aggregator reject (note)--> rejected --worker start--> in_progress
--   accepted --aggregator reopen (task qa_failed)--> in_progress
--   assigned | in_progress | rejected --aggregator cancel--> cancelled
--
-- contract_id and supplier_org_id are copied from the task at insert so the
-- policies are column compares and never subquery task (recursion, above).
-- ---------------------------------------------------------------------------
CREATE TYPE assignment_status AS ENUM
  ('assigned','in_progress','submitted','accepted','rejected','cancelled');

CREATE TABLE task_assignment (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          uuid NOT NULL REFERENCES task(id)         ON DELETE RESTRICT,
  contract_id      uuid NOT NULL REFERENCES contract(id)     ON DELETE RESTRICT,  -- denormalised for RLS
  supplier_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,  -- = task.assignee_org_id
  worker_user_id   uuid NOT NULL REFERENCES app_user(id)     ON DELETE RESTRICT,

  quantity         integer NOT NULL CHECK (quantity > 0),
  status           assignment_status NOT NULL DEFAULT 'assigned',
  instructions     text,
  due_on           date,
  worker_note      text,                       -- the worker's own account, never overwritten

  assigned_by      uuid REFERENCES app_user(id),
  assigned_at      timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  submitted_at     timestamptz,
  decided_at       timestamptz,
  decided_by       uuid REFERENCES app_user(id),
  decision_note    text,                       -- the last gate-1 verdict; history is in qa_review

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- The prototype's rule, applied to workers too: a rejection must say what
  -- must change.
  CONSTRAINT task_assignment_rejected_needs_note CHECK (
    status <> 'rejected' OR (decision_note IS NOT NULL AND length(btrim(decision_note)) > 0)
  )
);

CREATE INDEX task_assignment_task_idx   ON task_assignment (task_id, status);
CREATE INDEX task_assignment_worker_idx ON task_assignment (worker_user_id, status);
-- the aggregator's gate-1 queue
CREATE INDEX task_assignment_gate1_idx  ON task_assignment (supplier_org_id, submitted_at)
  WHERE status = 'submitted';
-- one open assignment per worker per task
CREATE UNIQUE INDEX task_assignment_one_open_key ON task_assignment (task_id, worker_user_id)
  WHERE status IN ('assigned','in_progress','submitted','rejected');

CREATE TRIGGER task_assignment_updated_at BEFORE UPDATE ON task_assignment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Does the current user hold a live assignment on this task? Definer, so the
-- task policy can ask without re-entering task_assignment's own policies.
CREATE OR REPLACE FUNCTION worker_holds_assignment(p_task_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM task_assignment a
    WHERE a.task_id = p_task_id
      AND a.worker_user_id = current_user_id()
      AND a.status <> 'cancelled'
  )
$fn$;

REVOKE EXECUTE ON FUNCTION worker_holds_assignment(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION worker_holds_assignment(uuid) TO sourcehub_app, sourcehub_readonly;

ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignment FORCE  ROW LEVEL SECURITY;

-- The supplier, its delivery partner at gate 2, and Ops. NEVER the client:
-- "no client ever sees a roster" holds for who did the work as well.
CREATE POLICY task_assignment_select ON task_assignment FOR SELECT
  USING (
       is_platform_admin()
    OR supplier_org_id = current_org_id()
    OR contract_is_mine_as_partner(contract_id)
  );

-- Only the supplier's staff assign; a worker never creates one.
CREATE POLICY task_assignment_insert ON task_assignment FOR INSERT
  WITH CHECK (NOT is_worker() AND supplier_org_id = current_org_id());

CREATE POLICY task_assignment_update ON task_assignment FOR UPDATE
  USING      (is_platform_admin() OR supplier_org_id = current_org_id())
  WITH CHECK (is_platform_admin() OR supplier_org_id = current_org_id());

-- Worker scope. RESTRICTIVE policies AND with the permissive ones above: a
-- worker sees only their own rows and may only move their own rows to the two
-- states a worker produces.
CREATE POLICY task_assignment_worker_select ON task_assignment AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR worker_user_id = current_user_id());

CREATE POLICY task_assignment_worker_update ON task_assignment AS RESTRICTIVE FOR UPDATE
  USING      (NOT is_worker() OR worker_user_id = current_user_id())
  WITH CHECK (NOT is_worker() OR (worker_user_id = current_user_id()
                                  AND status IN ('in_progress','submitted')));

GRANT SELECT, INSERT, UPDATE ON task_assignment TO sourcehub_app;
GRANT SELECT ON task_assignment TO sourcehub_readonly;


-- ---------------------------------------------------------------------------
-- 5 · asset — the manifest of ONE capture.
--
-- A capture is attributable to a task, an assignment and a person the moment
-- it is taken; it is bundled into a submission only when the aggregator hands
-- the task to its delivery partner, so submission_id becomes nullable.
--
-- supplier_org_id and contract_id are denormalised so the policy is two
-- column compares. The old policy walked submission → task → contract for
-- every row, which on the 40-million-row table would be the slowest predicate
-- in the system.
--
-- Written migration-safe (nullable add → backfill → SET NOT NULL) so the
-- verbatim Alembic copy works on a table already holding rows. ADD VALUE is
-- fine here: the bootstrap runs each statement in its own transaction, and
-- nothing in this file uses the new value.
-- ---------------------------------------------------------------------------
ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'uploaded' AFTER 'pending';

ALTER TABLE asset ALTER COLUMN submission_id DROP NOT NULL;

ALTER TABLE asset
  ADD COLUMN task_id             uuid REFERENCES task(id)            ON DELETE RESTRICT,
  ADD COLUMN assignment_id       uuid REFERENCES task_assignment(id) ON DELETE RESTRICT,
  ADD COLUMN captured_by_user_id uuid REFERENCES app_user(id)        ON DELETE SET NULL,
  ADD COLUMN supplier_org_id     uuid REFERENCES organisation(id)    ON DELETE RESTRICT,
  ADD COLUMN contract_id         uuid REFERENCES contract(id)        ON DELETE RESTRICT,
  ADD COLUMN uploaded_at         timestamptz;

UPDATE asset a
   SET task_id = s.task_id, supplier_org_id = s.supplier_org_id, contract_id = t.contract_id
  FROM submission s JOIN task t ON t.id = s.task_id
 WHERE s.id = a.submission_id AND a.task_id IS NULL;

ALTER TABLE asset
  ALTER COLUMN task_id         SET NOT NULL,
  ALTER COLUMN supplier_org_id SET NOT NULL,
  ALTER COLUMN contract_id     SET NOT NULL;

CREATE INDEX asset_assignment_status_idx ON asset (assignment_id, status);
CREATE INDEX asset_task_status_idx       ON asset (task_id, status);
CREATE INDEX asset_captured_by_idx       ON asset (captured_by_user_id);

DROP POLICY asset_select ON asset;
DROP POLICY asset_write  ON asset;

CREATE POLICY asset_select ON asset FOR SELECT
  USING (is_platform_admin() OR supplier_org_id = current_org_id() OR contract_is_visible(contract_id));

-- The supplier's own context writes captures. A worker's session org IS the
-- supplier, so a worker passes this and the restrictive one below.
CREATE POLICY asset_insert ON asset FOR INSERT
  WITH CHECK (supplier_org_id = current_org_id());

CREATE POLICY asset_update ON asset FOR UPDATE
  USING      (is_platform_admin() OR supplier_org_id = current_org_id())
  WITH CHECK (is_platform_admin() OR supplier_org_id = current_org_id());

CREATE POLICY asset_worker_select ON asset AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR captured_by_user_id = current_user_id());
CREATE POLICY asset_worker_insert ON asset AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT is_worker() OR captured_by_user_id = current_user_id());
CREATE POLICY asset_worker_update ON asset AS RESTRICTIVE FOR UPDATE
  USING      (NOT is_worker() OR captured_by_user_id = current_user_id())
  WITH CHECK (NOT is_worker() OR captured_by_user_id = current_user_id());

-- Hardening: partitions are ordinary tables with no policies of their own, so
-- a query naming one directly saw everything. With RLS forced and no policy
-- they show nothing when addressed directly; a scan through the parent is
-- governed by the parent's policies and is unaffected.
DO $p$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['asset_2026q3','asset_2026q4','asset_default',
                           'audit_event_2026q3','audit_event_2026q4','audit_event_default'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY', t);
  END LOOP;
END
$p$;


-- ---------------------------------------------------------------------------
-- 6 · qa_review — gate 1 reviews an assignment; gates 2 and 3 a submission.
-- ---------------------------------------------------------------------------
ALTER TABLE qa_review ALTER COLUMN submission_id DROP NOT NULL;

ALTER TABLE qa_review
  ADD COLUMN assignment_id uuid REFERENCES task_assignment(id) ON DELETE RESTRICT,
  ADD CONSTRAINT qa_review_one_subject CHECK (num_nonnulls(submission_id, assignment_id) = 1);

CREATE INDEX qa_review_assignment_idx ON qa_review (assignment_id, gate);

DROP POLICY qa_review_select ON qa_review;
CREATE POLICY qa_review_select ON qa_review FOR SELECT
  USING (
       is_platform_admin()
    OR reviewer_org_id = current_org_id()
    OR EXISTS (SELECT 1 FROM submission s
                JOIN task t ON t.id = s.task_id
               WHERE s.id = qa_review.submission_id
                 AND (s.supplier_org_id = current_org_id()
                   OR contract_is_visible(t.contract_id)))
    OR EXISTS (SELECT 1 FROM task_assignment a
               WHERE a.id = qa_review.assignment_id
                 AND (a.supplier_org_id = current_org_id()
                   OR contract_is_mine_as_partner(a.contract_id)))
  );


-- ---------------------------------------------------------------------------
-- 7 · submission.asset_count is no longer typed by hand.
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN submission.asset_count IS
  'Set server-side at task submit from the ready assets of accepted assignments. '
  'The request body value is honoured only on a legacy task with no assignments.';


-- ---------------------------------------------------------------------------
-- 8 · Worker scope on the tables a worker touches, and a blanket deny on the
--     tables a worker has no business reading at all.
--
-- All RESTRICTIVE: they narrow what the permissive org-level policies allow.
-- Writes to notification (a worker notifies its aggregator) and audit_event
-- (through the definer function) are unaffected.
-- ---------------------------------------------------------------------------
CREATE POLICY task_worker_select ON task AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR worker_holds_assignment(id));
CREATE POLICY task_worker_update ON task AS RESTRICTIVE FOR UPDATE
  USING      (NOT is_worker() OR worker_holds_assignment(id))
  WITH CHECK (NOT is_worker() OR worker_holds_assignment(id));

CREATE POLICY app_user_worker_scope ON app_user AS RESTRICTIVE FOR ALL
  USING      (NOT is_worker() OR id = current_user_id())
  WITH CHECK (NOT is_worker() OR id = current_user_id());

CREATE POLICY organisation_worker_scope ON organisation AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR id = current_org_id());

-- A worker's bell shows only rows addressed to them; org-wide rows are for
-- the console staff.
CREATE POLICY notification_worker_select ON notification AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR user_id = current_user_id());
CREATE POLICY notification_worker_update ON notification AS RESTRICTIVE FOR UPDATE
  USING (NOT is_worker() OR user_id = current_user_id());

CREATE POLICY crowd_worker_worker_scope ON crowd_worker AS RESTRICTIVE FOR ALL
  USING      (NOT is_worker() OR user_id = current_user_id())
  WITH CHECK (NOT is_worker());

CREATE POLICY user_role_grant_worker_scope ON user_role_grant AS RESTRICTIVE FOR ALL
  USING      (NOT is_worker() OR user_id = current_user_id())
  WITH CHECK (NOT is_worker());

DO $w$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contract','submission','invitation','qa_review','request','proposal',
                           'loan','equipment','rating','invoice','onboarding_request','audit_event'] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I AS RESTRICTIVE FOR ALL USING (NOT is_worker()) WITH CHECK (NOT is_worker())',
      t || '_worker_deny', t);
  END LOOP;
END
$w$;


-- ---------------------------------------------------------------------------
-- 9 · invite_worker — the aggregator's version of the onboarding approval.
--
-- All of it or none of it: the app_user (invited, no password), the worker
-- grant, the roster row and the invitation. SECURITY INVOKER on purpose, like
-- approve_onboarding_request: RLS applies inside, so only a context that may
-- write crowd_worker, user_role_grant and invitation in its own organisation
-- gets through.
--
-- The app_user id is pre-generated. INSERT ... RETURNING has to pass the
-- SELECT policy too, and the new user passes app_user_select only through a
-- grant that does not exist until the next statement.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION invite_worker(
  p_email       citext,
  p_full_name   text,
  p_phone       text,
  p_skill       text,
  p_trained     boolean,
  p_invited_by  uuid,
  p_token_hash  text,
  p_ttl         interval DEFAULT interval '14 days'
) RETURNS TABLE (worker_id uuid, user_id uuid, reference_code text)
LANGUAGE plpgsql AS $fn$
DECLARE
  v_org  uuid := current_org_id();
  v_role uuid;
  v_user uuid := gen_random_uuid();
  v_wkr  uuid;
  v_ref  text;
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT r.id INTO v_role FROM role r WHERE r.code = 'worker' AND r.is_system;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'the worker role is not seeded';
  END IF;

  v_ref := next_reference_code('WKR', 'seq_ref_worker');

  -- 1 · the person, invited, with no password
  INSERT INTO app_user (id, email, full_name, phone, status, created_by, updated_by)
  VALUES (v_user, p_email, p_full_name, p_phone, 'invited', p_invited_by, p_invited_by);

  -- 2 · their worker grant in THIS organisation
  INSERT INTO user_role_grant (user_id, org_id, role_id, scope, granted_by)
  VALUES (v_user, v_org, v_role, 'member', p_invited_by);

  -- 3 · the roster row (RETURNING is safe: the org's own roster is selectable)
  INSERT INTO crowd_worker (reference_code, aggregator_org_id, display_name, skill, trained,
                            user_id, email, phone)
  VALUES (v_ref, v_org, p_full_name, p_skill, coalesce(p_trained, false), v_user, p_email, p_phone)
  RETURNING id INTO v_wkr;

  -- 4 · the invitation
  INSERT INTO invitation (token_hash, email, org_id, role_id, scope, user_id, invited_by, expires_at)
  VALUES (p_token_hash, p_email, v_org, v_role, 'member', v_user, p_invited_by, now() + p_ttl);

  RETURN QUERY SELECT v_wkr, v_user, v_ref;
END
$fn$;

REVOKE EXECUTE ON FUNCTION invite_worker(citext,text,text,text,boolean,uuid,text,interval) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION invite_worker(citext,text,text,text,boolean,uuid,text,interval) TO sourcehub_app;
