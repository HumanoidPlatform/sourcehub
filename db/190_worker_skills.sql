-- ============================================================================
-- 190 · A worker's skills come from a list
--
-- crowd_worker.skill was `text`, nullable, no CHECK, no length limit. What a
-- free-text box actually produced, on the pilot database, across four workers:
--
--     'Proficient'   a proficiency level, not a skill
--     'work'         nothing
--     'all'          a refusal to answer
--     NULL           left blank
--
-- Not one of them is a skill. Nobody knew what to type, so the column has
-- never held a usable value and there is nothing to migrate.
--
-- The vocabulary is not invented here. docs/sourcehub-app.html:833-841 — the
-- prototype this console was ported from — authored nine skills and seeded its
-- roster with them; db/910_seed_demo.sql uses five. The prototype never built
-- an ADD form, which is how the port ended up with a text box and no design
-- behind it. These are the values the design already chose.
--
-- text[] NOT NULL DEFAULT '{}' with a <@ containment CHECK is the house
-- pattern for a closed list, not a new idea: request.deidentification,
-- request.permitted_uses, request.proposal_requirements, request.countries,
-- request.regulations, gold_set_item.expected_defects and user_mfa.backup_codes
-- are all text[], all NOT NULL DEFAULT '{}'. Absence is '{}', never NULL, so
-- no reader needs an IS NULL branch.
--
-- Nothing keys off skill — _ELIGIBLE_WORKERS and _assign_worker never select,
-- filter or sort on it, and modules/engage has no reference at all — so this
-- changes presentation only.
-- ============================================================================

ALTER TABLE crowd_worker
  ADD COLUMN skills text[] NOT NULL DEFAULT '{}'
    CHECK (skills <@ ARRAY['street_imagery','night_driving','shelf_capture',
                           'drone_operation','retail_audit','field_survey',
                           'transcription','voice_capture','household_survey']);

ALTER TABLE crowd_worker DROP COLUMN skill;

-- invite_worker changes SIGNATURE, so CREATE OR REPLACE would leave an
-- overload behind rather than replacing anything, and the call would become
-- ambiguous. It has to be dropped by its full argument list first — and the
-- REVOKE/GRANT pair names that list too, so it is reissued below.
DROP FUNCTION invite_worker(citext,text,text,text,boolean,uuid,text,interval);

CREATE OR REPLACE FUNCTION invite_worker(
  p_email       citext,
  p_full_name   text,
  p_phone       text,
  p_skills      text[],
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
  INSERT INTO crowd_worker (reference_code, aggregator_org_id, display_name, skills, trained,
                            user_id, email, phone)
  VALUES (v_ref, v_org, p_full_name, coalesce(p_skills, '{}'), coalesce(p_trained, false), v_user, p_email, p_phone)
  RETURNING id INTO v_wkr;

  -- 4 · the invitation
  INSERT INTO invitation (token_hash, email, org_id, role_id, scope, user_id, invited_by, expires_at)
  VALUES (p_token_hash, p_email, v_org, v_role, 'member', v_user, p_invited_by, now() + p_ttl);

  RETURN QUERY SELECT v_wkr, v_user, v_ref;
END
$fn$;

REVOKE EXECUTE ON FUNCTION invite_worker(citext,text,text,text[],boolean,uuid,text,interval) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION invite_worker(citext,text,text,text[],boolean,uuid,text,interval) TO sourcehub_app;
