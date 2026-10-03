-- ============================================================================
-- 280 · One organisation row: the five profile tables fold into organisation
--
-- client_profile, tenant_profile, aggregator_profile, business_profile and
-- sponsor_profile were 1:1 satellites of organisation (010). The comment that
-- introduced them said the console filtered and sorted on their columns, so
-- they needed real types and indexes. That is no longer true: nothing filters,
-- sorts, joins or indexes on a profile column. A partner's on_time_rate and
-- qa_pass_rate are answered by partner_performance() (260) and the seeded
-- columns are never read; `since` always equalled onboarded_at.
--
-- What the satellites cost: every time organisation visibility widened (110,
-- 180, 260) a matching profile policy had to be added, fourteen in all, and
-- they had already drifted (sponsor_profile lacked the contract clause the
-- others carry). Approval wrote two rows, every read joined two tables, and
-- the API flattened the result into one `profile` object anyway.
--
-- After this file:
--   * organisation.profile (jsonb) holds the descriptive, kind-specific fields
--     the way public_profile (230) already holds the public ones, validated by
--     modules/identity/profile_schema.py:
--       client      industry
--       tenant      hq, capabilities
--       aggregator  crowd_size, region, focus
--       business    specialty, capacity
--       sponsor     contact_email, contact_phone
--   * four typed columns carry the terms that code has rules on: plan,
--     dpa_signed with dpa_signed_at (a client's DPA), fair_work_attested (a
--     partner's attestation). CHECKs tie each to its kind.
--   * on_time_rate, qa_pass_rate and since are dropped, not moved.
--   * approve_onboarding_request() writes one row.
--   * the five tables are dropped, and their policies, triggers and grants
--     go with them. The new columns inherit organisation's policies; the API
--     keeps plan and the DPA out of a counterparty's answer, as it always has
--     (_may_see_commercials in modules/identity/service.py).
--
-- Safe on a database with data: the copy below runs before the drop, in the
-- same transaction as everything else here.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The columns
-- ---------------------------------------------------------------------------
ALTER TABLE organisation ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE organisation ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE organisation ADD COLUMN IF NOT EXISTS dpa_signed boolean NOT NULL DEFAULT false;
ALTER TABLE organisation ADD COLUMN IF NOT EXISTS dpa_signed_at timestamptz;
ALTER TABLE organisation ADD COLUMN IF NOT EXISTS fair_work_attested boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 2 · Copy every row across. jsonb_strip_nulls so an empty profile is {} and
--     not a set of null keys the console would render as blank rows.
-- ---------------------------------------------------------------------------
UPDATE organisation o
   SET plan          = p.plan,
       dpa_signed    = p.dpa_signed,
       dpa_signed_at = p.dpa_signed_at,
       profile       = o.profile || jsonb_strip_nulls(jsonb_build_object('industry', p.industry))
  FROM client_profile p
 WHERE p.org_id = o.id;

UPDATE organisation o
   SET plan               = p.plan,
       fair_work_attested = p.fair_work_attested,
       profile            = o.profile || jsonb_strip_nulls(jsonb_build_object(
                              'hq', p.hq, 'capabilities', p.capabilities))
  FROM tenant_profile p
 WHERE p.org_id = o.id;

UPDATE organisation o
   SET profile = o.profile || jsonb_strip_nulls(jsonb_build_object(
                   'crowd_size', p.crowd_size, 'region', p.region, 'focus', p.focus))
  FROM aggregator_profile p
 WHERE p.org_id = o.id;

UPDATE organisation o
   SET profile = o.profile || jsonb_strip_nulls(jsonb_build_object(
                   'specialty', p.specialty, 'capacity', p.capacity))
  FROM business_profile p
 WHERE p.org_id = o.id;

UPDATE organisation o
   SET profile = o.profile || jsonb_strip_nulls(jsonb_build_object(
                   'contact_email', p.contact_email::text, 'contact_phone', p.contact_phone))
  FROM sponsor_profile p
 WHERE p.org_id = o.id;

-- ---------------------------------------------------------------------------
-- 3 · The rules. Each term belongs to one kind; the JSON is an object and a
--     crowd size, when given, is a number that is not negative.
-- ---------------------------------------------------------------------------
ALTER TABLE organisation
  ADD CONSTRAINT organisation_profile_is_object
  CHECK (jsonb_typeof(profile) = 'object');
ALTER TABLE organisation
  ADD CONSTRAINT organisation_dpa_is_a_client_term
  CHECK (kind = 'client' OR (dpa_signed = false AND dpa_signed_at IS NULL));
ALTER TABLE organisation
  ADD CONSTRAINT organisation_fair_work_is_a_partner_term
  CHECK (kind = 'tenant' OR fair_work_attested = false);
ALTER TABLE organisation
  ADD CONSTRAINT organisation_plan_is_an_account_term
  CHECK (plan IS NULL OR kind IN ('client', 'tenant'));
ALTER TABLE organisation
  ADD CONSTRAINT organisation_profile_crowd_size
  CHECK (profile->'crowd_size' IS NULL
         OR (jsonb_typeof(profile->'crowd_size') = 'number'
             AND (profile->>'crowd_size')::numeric >= 0));

-- ---------------------------------------------------------------------------
-- 4 · approve_onboarding_request writes one row. Same signature, same steps
--     as 030; step 2 (the kind profile) is now part of step 1. RLS still
--     applies inside, as 120 notes, so only a context that may insert an
--     organisation can call it.
-- ---------------------------------------------------------------------------
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

  -- 6 · close the request
  UPDATE onboarding_request
     SET status = 'approved', decided_at = now(),
         created_org_id = v_org_id, created_user_id = v_user_id,
         updated_by = p_approver_user_id
   WHERE id = r.id;

  -- 7 · the decision record
  INSERT INTO onboarding_approval (request_id, step, approver_user_id,
                                   approver_org_id, approver_role, decision)
  VALUES (r.id, 1, p_approver_user_id, p_approver_org_id, p_approver_role, 'approved');

  RETURN v_org_id;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 5 · The satellites go, and with them their policies, triggers and grants.
--     Nothing else references them: the function above was the last writer
--     and the API the last reader.
-- ---------------------------------------------------------------------------
DROP TABLE client_profile;
DROP TABLE tenant_profile;
DROP TABLE aggregator_profile;
DROP TABLE business_profile;
DROP TABLE sponsor_profile;
