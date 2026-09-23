-- ============================================================================
-- Identity-only seed — four sign-ins, and nothing behind them.
--
-- For a deployed database that has the schema and the required seeds (900, 905)
-- but no demo data. It creates the people needed to exercise the flows, without
-- the requests, contracts, invoices and equipment that 910_seed_demo.sql brings.
--
-- Deliberately NOT in db/. The compose entrypoint runs every file in that
-- directory on a fresh volume, so a copy there would fire on every local
-- `make reset` and collide with 910, which uses these same email addresses.
-- This one is applied by hand, to a deployed database, on purpose.
--
-- Names and emails match the local demo exactly, so the runbooks, the e2e
-- script and muscle memory all carry over.
--
-- All four share the password SourceHub#2026 — the same one README.md
-- publishes. Fine for four fictional organisations; not fine the moment
-- anything real is in the same database.
--
--   psql "$URL" -v ON_ERROR_STOP=1 -f infra/seed_identity.sql
-- ============================================================================

-- Same helper 910 uses, recreated because 910 drops it when it finishes.
CREATE OR REPLACE FUNCTION seed_identity_user(
  p_email text, p_name text, p_org_id uuid, p_role_code text, p_scope grant_scope
) RETURNS uuid LANGUAGE plpgsql AS $fn$
DECLARE v_user uuid; v_role uuid;
BEGIN
  SELECT id INTO v_role FROM role WHERE code = p_role_code AND is_system;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'role % not found — apply db/900_seed.sql and db/905_seed_workers.sql first', p_role_code;
  END IF;

  INSERT INTO app_user (email, full_name, status, password_hash, password_algo,
                        password_updated_at, email_verified_at)
  VALUES (p_email::citext, p_name, 'active',
          crypt('SourceHub#2026', gen_salt('bf', 12)), 'bcrypt', now(), now())
  RETURNING id INTO v_user;

  INSERT INTO user_role_grant (user_id, org_id, role_id, scope)
  VALUES (v_user, p_org_id, v_role, p_scope);

  RETURN v_user;
END
$fn$;

DO $seed$
DECLARE
  v_admin  uuid;
  v_client uuid;
  v_tenant uuid;
  v_agg    uuid;
  v_worker uuid;
BEGIN
  SELECT id INTO v_admin FROM app_user WHERE email = 'admin@sourcehub.local';
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'admin@sourcehub.local not found — apply db/900_seed.sql first';
  END IF;

  IF EXISTS (SELECT 1 FROM app_user WHERE email = 'client@acme.example') THEN
    RAISE EXCEPTION 'this seed has already been applied to this database';
  END IF;

  -- -------------------------------------------------------------------------
  -- The buyer. No parent: organisation_network_parent forbids one for a client.
  -- -------------------------------------------------------------------------
  INSERT INTO organisation (reference_code, kind, name, status, country, residency_region,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('client'), 'client', 'Acme Retail Analytics', 'active',
          'United States', 'US', 'current', 4.6, now(), v_admin)
  RETURNING id INTO v_client;

  INSERT INTO client_profile (org_id, industry, plan, dpa_signed, dpa_signed_at, since)
  VALUES (v_client, 'Retail / CPG', 'Enterprise', true, now(), now());

  -- -------------------------------------------------------------------------
  -- The delivery partner. Also parentless, and the aggregator below hangs off
  -- it — which is the only reason a tenant is required for this to work at all.
  -- -------------------------------------------------------------------------
  INSERT INTO organisation (reference_code, kind, name, status, country,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('tenant'), 'tenant', 'NorthStar Delivery Partners', 'active',
          'India', 'current', 4.7, now(), v_admin)
  RETURNING id INTO v_tenant;

  INSERT INTO tenant_profile (org_id, hq, plan, capabilities, on_time_rate, qa_pass_rate,
                              fair_work_attested, since)
  VALUES (v_tenant, 'Bengaluru, India', 'Partner Pro',
          'Image & video capture, field operations', 96, 94, true, now());

  -- -------------------------------------------------------------------------
  -- The crowd. parent_org_id is not optional: organisation_network_parent
  -- REQUIRES a parent for an aggregator, so this is what makes it legal.
  -- -------------------------------------------------------------------------
  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id,
                            onboarded_at, created_by)
  VALUES (org_reference_code('aggregator'), 'aggregator', 'Bengaluru Crowd Collective',
          'active', v_tenant, now(), v_admin)
  RETURNING id INTO v_agg;

  INSERT INTO aggregator_profile (org_id, crowd_size, region, focus)
  VALUES (v_agg, 820, 'South India', 'Street-level imagery');
  UPDATE organisation SET rating = 4.6 WHERE id = v_agg;

  -- -------------------------------------------------------------------------
  -- One owner per organisation.
  -- -------------------------------------------------------------------------
  PERFORM seed_identity_user('client@acme.example',       'Dana Whitfield', v_client, 'client',     'owner');
  PERFORM seed_identity_user('partner@northstar.example', 'Ravi Menon',     v_tenant, 'tenant',     'owner');
  PERFORM seed_identity_user('crowd@bengaluru.example',   'Anita Rao',      v_agg,    'aggregator', 'owner');

  -- -------------------------------------------------------------------------
  -- A crowd worker who can actually sign in.
  --
  -- Two things separate this from the rosters in 910, whose own comment says
  -- those people are NOT platform users:
  --
  --   * scope is 'member', not 'owner' — a worker owns nothing;
  --   * crowd_worker.user_id links the roster entry to the account, and that
  --     link is what lets the phone app resolve a sign-in to an assignment.
  --
  -- The worker's org is the aggregator's: a worker session carries the
  -- aggregator's org_id, narrowed by the restrictive worker policies.
  -- -------------------------------------------------------------------------
  v_worker := seed_identity_user('worker@bengaluru.example', 'Priya Nair', v_agg, 'worker', 'member');

  INSERT INTO crowd_worker (reference_code, aggregator_org_id, user_id, email,
                            display_name, skills, status, trained, rating)
  VALUES (next_reference_code('WKR','seq_ref_worker'), v_agg, v_worker,
          'worker@bengaluru.example', 'Priya Nair', '{shelf_capture}', 'on_shift', true, 4.8);
END
$seed$;

DROP FUNCTION seed_identity_user(text, text, uuid, text, grant_scope);

-- What was created, so a run that half-worked is visible immediately.
SELECT o.reference_code, o.kind::text, o.name, coalesce(p.name, '—') AS parent
FROM   organisation o
LEFT   JOIN organisation p ON p.id = o.parent_org_id
ORDER  BY o.kind::text;

SELECT u.email::text, r.code AS role, g.scope::text
FROM   app_user u
JOIN   user_role_grant g ON g.user_id = u.id
JOIN   role r ON r.id = g.role_id
ORDER  BY r.code;
