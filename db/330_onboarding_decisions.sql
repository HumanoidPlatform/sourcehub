-- ============================================================================
-- 330 · The onboarding decision moves onto the request
--
-- onboarding_approval (030) held one row per Ops decision on a request. It
-- was written in two places — decide() for a rejection or a return, and
-- approve_onboarding_request() for an approval — always in the same
-- transaction as the request's own status change, and read in one: the
-- decision the queue and the requester's pages attach to each request, one
-- query per row. Its step column never left 1; the multi-step chain the
-- comment promised was never built. The reason typed on an approval was
-- dropped on the way (the function had no parameter for it).
--
-- The request row already says which decision was taken (status: approved and
-- rejected are final, changes_requested is the return) and when (decided_at,
-- which from here on a return sets too instead of clearing). What it lacked
-- was the reason and who decided: decision_reason and decided_by. A request
-- that was returned and resubmitted keeps the return on these columns until
-- the next decision, so Ops sees what it asked for when the resubmission
-- arrives. Earlier decisions are not kept on the row: the audit log records
-- each one with its reason, and the bell told the requester.
--
-- The rule that mattered on the old table — only Ops may record a decision,
-- its INSERT policy — moves into a trigger on the request, in the shape 320
-- gave invoice_transition(): a decision is taken by the platform admin, on a
-- submitted request, signed by the session that takes it (decided_by), with
-- a reason unless it is an approval; the decision columns change with no
-- other move; a final request does not move again; what was filed (who
-- asked, for what kind, under whom) never changes, and the proposal (name,
-- payload, contact) changes only while the request is a draft or back with
-- the requester. The requester organisation holds an UPDATE policy on the
-- whole row (100), and the application login held every column: the trigger
-- and the column grant at the end close what that allowed by a direct
-- UPDATE. The service refuses the same things earlier, with better words,
-- and the database is the backstop.
--
-- expires_at, never written and never read, goes in the same file.
--
-- Safe on a database with data: the latest decision of every request is
-- carried before the table goes, and an assertion refuses the whole
-- transaction if the copy fell short. Earlier decisions stay in the dump the
-- release takes first, and in audit_event.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The columns
-- ---------------------------------------------------------------------------
ALTER TABLE onboarding_request ADD COLUMN decision_reason text;
ALTER TABLE onboarding_request
  ADD COLUMN decided_by uuid REFERENCES app_user(id) ON DELETE RESTRICT;
COMMENT ON COLUMN onboarding_request.decided_at IS
  'When the latest decision was taken: an approval, a rejection, or a return for changes. NULL '
  'until the first. A resubmitted request keeps the return''s time until the next decision.';
COMMENT ON COLUMN onboarding_request.decided_by IS
  'The Ops user who took the latest decision; the session that took it, by trigger.';
COMMENT ON COLUMN onboarding_request.decision_reason IS
  'What Ops wrote with the latest decision. Required on a return or a rejection, optional on an '
  'approval. Replaced the onboarding_approval table (db/330); earlier decisions are in the '
  'audit log.';

-- ---------------------------------------------------------------------------
-- 2 · The copy: the latest decision of each request. The updated_at trigger
--     comes off so the stamp does not move for a change that is not the
--     row's own.
-- ---------------------------------------------------------------------------
ALTER TABLE onboarding_request DISABLE TRIGGER onboarding_request_updated_at;

UPDATE onboarding_request r
   SET decision_reason = a.reason,
       decided_by      = a.approver_user_id,
       decided_at      = a.decided_at
  FROM (SELECT DISTINCT ON (request_id) request_id, reason, approver_user_id, decided_at
          FROM onboarding_approval
         ORDER BY request_id, decided_at DESC, step DESC, id DESC) a
 WHERE a.request_id = r.id;

ALTER TABLE onboarding_request ENABLE TRIGGER onboarding_request_updated_at;

-- ---------------------------------------------------------------------------
-- 3 · Refuse to continue unless every decided request got its decision
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_requests_rows   bigint;
  v_requests_filled bigint;
BEGIN
  SELECT count(DISTINCT request_id) INTO v_requests_rows FROM onboarding_approval;
  SELECT count(*) INTO v_requests_filled FROM onboarding_request WHERE decided_by IS NOT NULL;
  IF v_requests_rows <> v_requests_filled THEN
    RAISE EXCEPTION '330: the decision did not copy (% requests have rows in the table, % carry a '
                    'decision on the row); nothing was dropped', v_requests_rows, v_requests_filled;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 4 · The shape, now that the rows satisfy it
-- ---------------------------------------------------------------------------
ALTER TABLE onboarding_request
  ADD CONSTRAINT onboarding_request_decision_shape CHECK (
    (decided_at IS NULL) = (decided_by IS NULL)
    AND (decision_reason IS NULL OR decided_at IS NOT NULL)
    AND (status NOT IN ('approved', 'rejected', 'changes_requested') OR decided_at IS NOT NULL)
    AND (status NOT IN ('rejected', 'changes_requested')
         OR length(btrim(coalesce(decision_reason, ''))) > 0)
    AND (status <> 'draft' OR decided_at IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 5 · The table goes, with its two policies and its index, then its enum,
--     then the column nothing ever wrote
-- ---------------------------------------------------------------------------
DROP TABLE onboarding_approval;
DROP TYPE approval_decision;
ALTER TABLE onboarding_request DROP COLUMN expires_at;

-- ---------------------------------------------------------------------------
-- 6 · approve_onboarding_request: the 280 body, with the reason the approver
--     typed as a parameter and the decision written onto the request in the
--     same UPDATE that closes it (step 6); step 7 is gone with the table, and
--     so are the approver's organisation and role, which only ever fed that
--     row (who approves is the session: the trigger checks decided_by against
--     it). A changed parameter list is a new signature, so the old one is
--     dropped first and the grant 100 gave is made again.
-- ---------------------------------------------------------------------------
DROP FUNCTION approve_onboarding_request(uuid, uuid, uuid, text, text, interval);

CREATE FUNCTION approve_onboarding_request(
  p_request_id       uuid,
  p_approver_user_id uuid,
  p_invitation_token_hash text,
  p_reason           text DEFAULT NULL,
  p_invitation_ttl   interval DEFAULT interval '14 days'
) RETURNS uuid                                   -- the new organisation id
LANGUAGE plpgsql AS $fn$
DECLARE
  r          onboarding_request%ROWTYPE;
  v_org_id   uuid;
  v_user_id  uuid;
  v_role_id  uuid;
  v_ref      text;
  v_profile  jsonb;
BEGIN
  SELECT * INTO r FROM onboarding_request WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'onboarding request % not found', p_request_id;
  END IF;
  IF r.status NOT IN ('submitted','under_review') THEN
    RAISE EXCEPTION 'onboarding request % is % and cannot be approved', p_request_id, r.status;
  END IF;

  -- 1 · the organisation, with its kind-specific profile on the same row
  v_profile := CASE r.target_org_kind
    WHEN 'client' THEN
      jsonb_build_object('industry', r.payload->>'industry')
    WHEN 'tenant' THEN
      jsonb_build_object('hq', r.payload->>'hq', 'capabilities', r.payload->>'capabilities')
    WHEN 'aggregator' THEN
      jsonb_build_object('crowd_size', coalesce((r.payload->>'crowd_size')::int, 0),
                         'region', r.payload->>'region', 'focus', r.payload->>'focus')
    WHEN 'business' THEN
      jsonb_build_object('specialty', r.payload->>'specialty', 'capacity', r.payload->>'capacity')
    WHEN 'sponsor' THEN
      jsonb_build_object('contact_email', r.payload->>'contact_email')
    ELSE NULL
  END;
  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'cannot onboard an organisation of kind %', r.target_org_kind;
  END IF;

  v_ref := org_reference_code(r.target_org_kind);
  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id,
                            country, residency_region, billing_status,
                            plan, profile,
                            onboarded_at, created_by, updated_by)
  VALUES (v_ref, r.target_org_kind, r.proposed_name, 'active', r.parent_org_id,
          r.payload->>'country', r.payload->>'residency_region', 'current',
          CASE WHEN r.target_org_kind IN ('client','tenant') THEN r.payload->>'plan' END,
          jsonb_strip_nulls(v_profile),
          now(), p_approver_user_id, p_approver_user_id)
  RETURNING id INTO v_org_id;

  -- 2 · the owner role for this kind
  SELECT id INTO v_role_id FROM role
   WHERE is_system AND applies_to_kind = r.target_org_kind
   LIMIT 1;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'no system role defined for kind %', r.target_org_kind;
  END IF;

  -- 3 · the first user, invited, with no password
  INSERT INTO app_user (email, full_name, phone, status, created_by, updated_by)
  VALUES ((r.contact->>'email')::citext, r.contact->>'full_name',
          r.contact->>'phone', 'invited', p_approver_user_id, p_approver_user_id)
  RETURNING id INTO v_user_id;

  -- 4 · their owner grant
  INSERT INTO user_role_grant (user_id, org_id, role_id, scope, granted_by)
  VALUES (v_user_id, v_org_id, v_role_id, 'owner', p_approver_user_id);

  -- 5 · the invitation
  INSERT INTO invitation (token_hash, email, org_id, role_id, scope,
                          user_id, request_id, invited_by, expires_at)
  VALUES (p_invitation_token_hash, (r.contact->>'email')::citext, v_org_id,
          v_role_id, 'owner', v_user_id, r.id, p_approver_user_id,
          now() + p_invitation_ttl);

  -- 6 · close the request, decision included
  UPDATE onboarding_request
     SET status = 'approved',
         decided_at = now(),
         decided_by = p_approver_user_id,
         decision_reason = nullif(btrim(coalesce(p_reason, '')), ''),
         created_org_id = v_org_id, created_user_id = v_user_id,
         updated_by = p_approver_user_id
   WHERE id = r.id;

  RETURN v_org_id;
END
$fn$;

GRANT EXECUTE ON FUNCTION approve_onboarding_request(uuid, uuid, text, text, interval)
  TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- 7 · Who may move a request where, and what every move must carry. Runs with
--     the caller's rights: is_platform_admin() and current_user_id() read the
--     session the API set, inside the approval function too (SECURITY
--     INVOKER). Refusals are check_violation; the service maps that SQLSTATE
--     to a 409, as for invoices.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION onboarding_request_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  v_decision boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('draft', 'submitted') THEN
      RAISE EXCEPTION 'onboarding: a request is filed as draft or submitted, not %', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.decided_at IS NOT NULL OR NEW.decided_by IS NOT NULL OR NEW.decision_reason IS NOT NULL
       OR NEW.created_org_id IS NOT NULL OR NEW.created_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'onboarding: a new request carries no decision'
        USING ERRCODE = 'check_violation';
    END IF;
    IF (NEW.status = 'submitted') <> (NEW.submitted_at IS NOT NULL) THEN
      RAISE EXCEPTION 'onboarding: submitted_at is set by submitting'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  -- a final request does not move again
  IF OLD.status IN ('approved', 'rejected', 'withdrawn', 'expired')
     AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'onboarding %: already %, which is final', OLD.reference_code, OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- what was filed does not change: who asked, for what, under whom
  IF NEW.reference_code <> OLD.reference_code
     OR NEW.target_org_kind <> OLD.target_org_kind
     OR NEW.requester_org_id <> OLD.requester_org_id
     OR NEW.requester_user_id <> OLD.requester_user_id
     OR NEW.parent_org_id IS DISTINCT FROM OLD.parent_org_id
     OR NEW.created_at <> OLD.created_at
     OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'onboarding %: what was filed cannot change', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;

  -- the proposal is edited while it is a draft or back with the requester,
  -- which includes the resubmit that re-validates it
  IF (NEW.proposed_name <> OLD.proposed_name OR NEW.payload <> OLD.payload
      OR NEW.contact <> OLD.contact)
     AND OLD.status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'onboarding %: a % request is not edited', OLD.reference_code, OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- submitted_at is the submit
  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     AND NOT (NEW.status = 'submitted' AND OLD.status <> 'submitted') THEN
    RAISE EXCEPTION 'onboarding %: submitted_at is set by submitting', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;

  -- a decision: Ops only, on a submitted request, signed by the session that
  -- takes it, dated, and with a reason unless it is an approval
  v_decision := NEW.status <> OLD.status
                AND NEW.status IN ('approved', 'rejected', 'changes_requested');
  IF v_decision THEN
    IF NOT is_platform_admin() THEN
      RAISE EXCEPTION 'onboarding %: only Ops records a decision', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.status NOT IN ('submitted', 'under_review') THEN
      RAISE EXCEPTION 'onboarding %: a decision is taken on a submitted request, not a % one',
        OLD.reference_code, OLD.status USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.decided_by IS DISTINCT FROM current_user_id() THEN
      RAISE EXCEPTION 'onboarding %: a decision is signed by the session that takes it',
        OLD.reference_code USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.decided_at IS NULL OR NEW.decided_at IS NOT DISTINCT FROM OLD.decided_at THEN
      RAISE EXCEPTION 'onboarding %: a decision is dated when it is taken', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.status <> 'approved' AND length(btrim(coalesce(NEW.decision_reason, ''))) = 0 THEN
      RAISE EXCEPTION 'onboarding %: say what must change; a % needs a reason',
        OLD.reference_code, NEW.status USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.decided_at IS DISTINCT FROM OLD.decided_at
        OR NEW.decided_by IS DISTINCT FROM OLD.decided_by
        OR NEW.decision_reason IS DISTINCT FROM OLD.decision_reason THEN
    RAISE EXCEPTION 'onboarding %: the decision is written with the move it belongs to',
      OLD.reference_code USING ERRCODE = 'check_violation';
  END IF;

  -- the requester's moves
  IF NEW.status <> OLD.status THEN
    IF NEW.status = 'submitted' AND OLD.status NOT IN ('draft', 'changes_requested') THEN
      RAISE EXCEPTION 'onboarding %: cannot go from % to submitted',
        OLD.reference_code, OLD.status USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.status = 'under_review' AND NOT (OLD.status = 'submitted' AND is_platform_admin()) THEN
      RAISE EXCEPTION 'onboarding %: only Ops takes a submitted request under review',
        OLD.reference_code USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.status IN ('draft', 'expired') THEN
      RAISE EXCEPTION 'onboarding %: cannot go from % to %',
        OLD.reference_code, OLD.status, NEW.status USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- what approval created, approval sets
  IF (NEW.created_org_id IS DISTINCT FROM OLD.created_org_id
      OR NEW.created_user_id IS DISTINCT FROM OLD.created_user_id)
     AND NOT (NEW.status = 'approved' AND OLD.status <> 'approved') THEN
    RAISE EXCEPTION 'onboarding %: what approval created is set by approval', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER onboarding_request_transition BEFORE INSERT OR UPDATE ON onboarding_request
  FOR EACH ROW EXECUTE FUNCTION onboarding_request_transition();

COMMENT ON FUNCTION onboarding_request_transition() IS
  'Who may move an onboarding request where: a decision (approved, rejected, changes_requested) '
  'is Ops only, on a submitted request, signed by the session, dated, with a reason unless '
  'approved; the decision columns change with no other move; what was filed never changes and '
  'the proposal only while draft or returned; the requester submits, resubmits a returned '
  'request, or withdraws; a final request is final.';

-- ---------------------------------------------------------------------------
-- 8 · Grants, 270 style: the default privileges (000) gave the login every
--     column and DELETE, which nothing uses. It reads, files, and updates the
--     columns the service and the approval function write; the trigger decides
--     when. SELECT ... FOR UPDATE in the function needs UPDATE on a column,
--     which this keeps.
-- ---------------------------------------------------------------------------
REVOKE ALL ON onboarding_request FROM sourcehub_app;
GRANT SELECT, INSERT ON onboarding_request TO sourcehub_app;
GRANT UPDATE (proposed_name, payload, contact, status, submitted_at, decided_at, decided_by,
              decision_reason, updated_by, created_org_id, created_user_id)
  ON onboarding_request TO sourcehub_app;
