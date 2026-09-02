-- ============================================================================
-- 030 · Onboarding — the request and approval chain
--
-- This behaviour does not exist in the prototype. sourcehub-app.html:2569
-- addPartner() pushes straight into state.aggregators with the dialog subtitle
-- "Registered under {tenant} — SourceHub does not bill this account". There is
-- no approval step anywhere.
--
-- Two tiers:
--   1. Platform Admin onboards a CLIENT or a TENANT directly.
--   2. A TENANT requests an AGGREGATOR, BUSINESS or SPONSOR, and the request
--      goes to the Platform Admin for approval.
--
-- One table serves both, so the audit trail, the document attachments and the
-- approval history are uniform regardless of who is being onboarded.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- onboarding_request
--
-- payload holds the proposed organisation profile. It is jsonb because its
-- shape genuinely differs per target kind (an aggregator has crowd_size and
-- region, a sponsor has a contact email) and because nothing queries inside it
-- until approval, at which point it is unpacked into real profile columns.
--
-- contact becomes the first user of the new organisation. Capturing it on the
-- request rather than asking for it after approval means the approval
-- transaction has everything it needs and cannot half-complete.
-- ---------------------------------------------------------------------------
CREATE TABLE onboarding_request (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code    text UNIQUE NOT NULL,

  target_org_kind   org_kind NOT NULL,
  proposed_name     text NOT NULL,

  -- who is asking. Always populated: onboarding is internal-only, there is no
  -- public self-signup, so every request has an authenticated requester and
  -- ordinary RLS applies with no anonymous write path.
  requester_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  requester_user_id uuid NOT NULL REFERENCES app_user(id)     ON DELETE RESTRICT,

  -- the sponsoring tenant for a network entity; NULL when Ops onboards a
  -- client or a tenant directly.
  parent_org_id     uuid REFERENCES organisation(id) ON DELETE RESTRICT,

  payload           jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact           jsonb NOT NULL,          -- {full_name, email, phone}

  status            onboarding_status NOT NULL DEFAULT 'draft',
  submitted_at      timestamptz,
  decided_at        timestamptz,
  expires_at        timestamptz,

  -- set by the approval transaction
  created_org_id    uuid REFERENCES organisation(id) ON DELETE SET NULL,
  created_user_id   uuid REFERENCES app_user(id)     ON DELETE SET NULL,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES app_user(id),
  updated_by        uuid REFERENCES app_user(id),
  deleted_at        timestamptz,

  -- A network entity must name its sponsoring tenant; a client or tenant
  -- must not. Same rule as organisation.parent_org_id, enforced one step
  -- earlier so a malformed request cannot even be filed.
  CONSTRAINT onboarding_request_parent CHECK (
    (target_org_kind IN ('aggregator','business','sponsor') AND parent_org_id IS NOT NULL)
    OR
    (target_org_kind IN ('client','tenant')                 AND parent_org_id IS NULL)
  ),

  CONSTRAINT onboarding_request_contact_shape CHECK (
    contact ? 'email' AND contact ? 'full_name'
  ),

  -- An approved request must say what it created.
  CONSTRAINT onboarding_request_approved_result CHECK (
    status <> 'approved' OR (created_org_id IS NOT NULL AND created_user_id IS NOT NULL)
  )
);

CREATE INDEX onboarding_request_status_idx    ON onboarding_request (status) WHERE deleted_at IS NULL;
CREATE INDEX onboarding_request_requester_idx ON onboarding_request (requester_org_id) WHERE deleted_at IS NULL;
CREATE INDEX onboarding_request_parent_idx    ON onboarding_request (parent_org_id) WHERE deleted_at IS NULL;
-- the Ops queue: everything awaiting a decision, oldest first
CREATE INDEX onboarding_request_queue_idx     ON onboarding_request (submitted_at)
  WHERE status IN ('submitted','under_review');

CREATE TRIGGER onboarding_request_updated_at BEFORE UPDATE ON onboarding_request
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- onboarding_approval — append-only decision record.
--
-- One row per decision, not one column on the request. A request that goes
-- submitted -> changes_requested -> submitted -> approved has three rows, and
-- the reason for the middle one survives. A single decided_by/decision pair on
-- the request would lose it.
--
-- The step column means a multi-step chain (compliance review, then Ops) can be
-- added later as data rather than as a schema change.
-- ---------------------------------------------------------------------------
CREATE TABLE onboarding_approval (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid NOT NULL REFERENCES onboarding_request(id) ON DELETE CASCADE,
  step             smallint NOT NULL DEFAULT 1,
  approver_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  approver_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  approver_role    text NOT NULL,
  decision         approval_decision NOT NULL,
  reason           text,
  decided_at       timestamptz NOT NULL DEFAULT now(),

  -- The prototype already refuses a blank QA rejection: "Say what must change —
  -- the supplier cannot act on a blank rejection." The same rule applies here.
  CONSTRAINT onboarding_approval_reason_required CHECK (
    decision = 'approved' OR (reason IS NOT NULL AND length(btrim(reason)) > 0)
  )
);

CREATE INDEX onboarding_approval_request_idx ON onboarding_approval (request_id, step);


-- ---------------------------------------------------------------------------
-- onboarding_document — KYB, DPA, W-8/W-9, fair-work attestation.
-- ---------------------------------------------------------------------------
CREATE TABLE onboarding_document (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid NOT NULL REFERENCES onboarding_request(id) ON DELETE CASCADE,
  kind          onboarding_document_kind NOT NULL,
  filename      text NOT NULL,
  storage_key   text NOT NULL,               -- object storage, never the bytes
  content_type  text,
  size_bytes    bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  sha256        text,
  uploaded_by   uuid REFERENCES app_user(id),
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  verified_at   timestamptz,
  verified_by   uuid REFERENCES app_user(id)
);

CREATE INDEX onboarding_document_request_idx ON onboarding_document (request_id);


-- ---------------------------------------------------------------------------
-- invitation — how the first user of a new organisation gets in.
--
-- Approval creates the user in 'invited' status with no password and issues one
-- of these. The invitee sets their own password from the link, so no
-- administrator ever knows a user's credential.
-- ---------------------------------------------------------------------------
CREATE TABLE invitation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash      text NOT NULL UNIQUE,
  email           citext NOT NULL,
  org_id          uuid NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  role_id         uuid NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
  scope           grant_scope NOT NULL DEFAULT 'owner',
  user_id         uuid REFERENCES app_user(id) ON DELETE CASCADE,
  request_id      uuid REFERENCES onboarding_request(id) ON DELETE SET NULL,

  invited_by      uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  invited_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  accepted_at     timestamptz,
  revoked_at      timestamptz,
  reminder_count  smallint NOT NULL DEFAULT 0,
  last_reminder_at timestamptz
);

CREATE INDEX invitation_email_idx ON invitation (email) WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX invitation_org_idx   ON invitation (org_id);


-- ============================================================================
-- The approval transaction
--
-- All of it or none of it. Approving a request must create the organisation,
-- its profile, its relationship to the sponsoring tenant, its first user, that
-- user's owner grant and the invitation — or leave nothing behind.
--
-- Implemented as a function so the guarantee lives with the data rather than
-- depending on every caller remembering to open a transaction.
-- ============================================================================
CREATE OR REPLACE FUNCTION approve_onboarding_request(
  p_request_id       uuid,
  p_approver_user_id uuid,
  p_approver_org_id  uuid,
  p_approver_role    text,
  p_invitation_token_hash text,
  p_invitation_ttl   interval DEFAULT interval '14 days'
) RETURNS uuid                                   -- the new organisation id
LANGUAGE plpgsql AS $fn$
DECLARE
  r          onboarding_request%ROWTYPE;
  v_org_id   uuid;
  v_user_id  uuid;
  v_role_id  uuid;
  v_ref      text;
BEGIN
  SELECT * INTO r FROM onboarding_request WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'onboarding request % not found', p_request_id;
  END IF;
  IF r.status NOT IN ('submitted','under_review') THEN
    RAISE EXCEPTION 'onboarding request % is % and cannot be approved', p_request_id, r.status;
  END IF;

  -- 1 · the organisation
  v_ref := org_reference_code(r.target_org_kind);
  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id,
                            country, residency_region, billing_status,
                            onboarded_at, created_by, updated_by)
  VALUES (v_ref, r.target_org_kind, r.proposed_name, 'active', r.parent_org_id,
          r.payload->>'country', r.payload->>'residency_region', 'current',
          now(), p_approver_user_id, p_approver_user_id)
  RETURNING id INTO v_org_id;

  -- 2 · the kind-specific profile
  CASE r.target_org_kind
    WHEN 'client' THEN
      INSERT INTO client_profile (org_id, industry, plan, since)
      VALUES (v_org_id, r.payload->>'industry', r.payload->>'plan', current_date);
    WHEN 'tenant' THEN
      INSERT INTO tenant_profile (org_id, hq, plan, capabilities, since)
      VALUES (v_org_id, r.payload->>'hq', r.payload->>'plan',
              r.payload->>'capabilities', current_date);
    WHEN 'aggregator' THEN
      INSERT INTO aggregator_profile (org_id, crowd_size, region, focus)
      VALUES (v_org_id, coalesce((r.payload->>'crowd_size')::int, 0),
              r.payload->>'region', r.payload->>'focus');
    WHEN 'business' THEN
      INSERT INTO business_profile (org_id, specialty, capacity)
      VALUES (v_org_id, r.payload->>'specialty', r.payload->>'capacity');
    WHEN 'sponsor' THEN
      INSERT INTO sponsor_profile (org_id, contact_email)
      VALUES (v_org_id, (r.payload->>'contact_email')::citext);
    ELSE
      RAISE EXCEPTION 'cannot onboard an organisation of kind %', r.target_org_kind;
  END CASE;

  -- 3 · the owner role for this kind
  SELECT id INTO v_role_id FROM role
   WHERE is_system AND applies_to_kind = r.target_org_kind
   LIMIT 1;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'no system role defined for kind %', r.target_org_kind;
  END IF;

  -- 4 · the first user, invited, with no password
  INSERT INTO app_user (email, full_name, phone, status, created_by, updated_by)
  VALUES ((r.contact->>'email')::citext, r.contact->>'full_name',
          r.contact->>'phone', 'invited', p_approver_user_id, p_approver_user_id)
  RETURNING id INTO v_user_id;

  -- 5 · their owner grant
  INSERT INTO user_role_grant (user_id, org_id, role_id, scope, granted_by)
  VALUES (v_user_id, v_org_id, v_role_id, 'owner', p_approver_user_id);

  -- 6 · the invitation
  INSERT INTO invitation (token_hash, email, org_id, role_id, scope,
                          user_id, request_id, invited_by, expires_at)
  VALUES (p_invitation_token_hash, (r.contact->>'email')::citext, v_org_id,
          v_role_id, 'owner', v_user_id, r.id, p_approver_user_id,
          now() + p_invitation_ttl);

  -- 7 · close the request
  UPDATE onboarding_request
     SET status = 'approved', decided_at = now(),
         created_org_id = v_org_id, created_user_id = v_user_id,
         updated_by = p_approver_user_id
   WHERE id = r.id;

  -- 8 · the decision record
  INSERT INTO onboarding_approval (request_id, step, approver_user_id,
                                   approver_org_id, approver_role, decision)
  VALUES (r.id, 1, p_approver_user_id, p_approver_org_id, p_approver_role, 'approved');

  RETURN v_org_id;
END
$fn$;
