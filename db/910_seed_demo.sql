-- ============================================================================
-- 910 · Demo data — the prototype's seed database, translated
--
-- Everything here comes from `const state = {...}` in sourcehub-app.html. It
-- exists so a developer can log in as each of the six personas and see the same
-- console the prototype shows.
--
-- DELETE THIS FILE before any deployment carrying real data.
--
-- Every demo user shares one password: SourceHub#2026
-- ============================================================================

-- Creates one active user, owner of one organisation, with the demo password.
CREATE OR REPLACE FUNCTION seed_demo_user(
  p_email text, p_name text, p_org_id uuid, p_role_code text
) RETURNS uuid LANGUAGE plpgsql AS $fn$
DECLARE v_user uuid; v_role uuid;
BEGIN
  SELECT id INTO v_role FROM role WHERE code = p_role_code AND is_system;

  INSERT INTO app_user (email, full_name, status, password_hash, password_algo,
                        password_updated_at, email_verified_at)
  VALUES (p_email::citext, p_name, 'active',
          crypt('SourceHub#2026', gen_salt('bf', 12)), 'bcrypt', now(), now())
  RETURNING id INTO v_user;

  INSERT INTO user_role_grant (user_id, org_id, role_id, scope)
  VALUES (v_user, p_org_id, v_role, 'owner');

  RETURN v_user;
END
$fn$;

DO $seed$
DECLARE
  v_ops        uuid;
  v_admin      uuid;
  v_cl1 uuid; v_cl2 uuid; v_cl3 uuid;
  v_tn1 uuid; v_tn2 uuid; v_tn3 uuid;
  v_ag1 uuid; v_ag2 uuid; v_ag3 uuid; v_ag4 uuid;
  v_bz1 uuid; v_bz2 uuid; v_bz3 uuid;
  v_ds1 uuid; v_ds2 uuid; v_ds3 uuid;
BEGIN
  SELECT id INTO v_ops   FROM organisation WHERE kind = 'platform';
  SELECT id INTO v_admin FROM app_user WHERE email = 'admin@sourcehub.local';

  -- =========================================================================
  -- Clients
  -- =========================================================================
  INSERT INTO organisation (reference_code, kind, name, status, country, residency_region,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('client'), 'client', 'Acme Retail Analytics', 'active',
          'United States', 'US', 'current', 4.6, '2024-03-11', v_admin)
  RETURNING id INTO v_cl1;
  INSERT INTO client_profile (org_id, industry, plan, dpa_signed, dpa_signed_at, since)
  VALUES (v_cl1, 'Retail / CPG', 'Enterprise', true, '2024-03-11', '2024-03-11');

  INSERT INTO organisation (reference_code, kind, name, status, country, residency_region,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('client'), 'client', 'Voltra Mobility', 'active',
          'Germany', 'EU', 'current', 4.8, '2024-07-02', v_admin)
  RETURNING id INTO v_cl2;
  INSERT INTO client_profile (org_id, industry, plan, dpa_signed, dpa_signed_at, since)
  VALUES (v_cl2, 'Autonomous driving', 'Enterprise', true, '2024-07-02', '2024-07-02');

  INSERT INTO organisation (reference_code, kind, name, status, country, residency_region,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('client'), 'client', 'MediScan Health AI', 'active',
          'Singapore', 'APAC', 'overdue', 4.2, '2025-01-19', v_admin)
  RETURNING id INTO v_cl3;
  INSERT INTO client_profile (org_id, industry, plan, dpa_signed, dpa_signed_at, since)
  VALUES (v_cl3, 'Healthcare AI', 'Growth', true, '2025-01-19', '2025-01-19');

  -- =========================================================================
  -- Tenants (delivery partners)
  -- =========================================================================
  INSERT INTO organisation (reference_code, kind, name, status, country,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('tenant'), 'tenant', 'NorthStar Delivery Partners', 'active',
          'India', 'current', 4.7, '2024-02-01', v_admin)
  RETURNING id INTO v_tn1;
  INSERT INTO tenant_profile (org_id, hq, plan, capabilities, on_time_rate, qa_pass_rate,
                              fair_work_attested, since)
  VALUES (v_tn1, 'Bengaluru, India', 'Partner Pro',
          'Image & video capture, field operations', 96, 94, true, '2024-02-01');

  INSERT INTO organisation (reference_code, kind, name, status, country,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('tenant'), 'tenant', 'Meridian Field Ops', 'active',
          'Philippines', 'current', 4.5, '2024-05-20', v_admin)
  RETURNING id INTO v_tn2;
  INSERT INTO tenant_profile (org_id, hq, plan, capabilities, on_time_rate, qa_pass_rate,
                              fair_work_attested, since)
  VALUES (v_tn2, 'Manila, Philippines', 'Partner Pro',
          'People-based deliverables, annotation', 92, 97, true, '2024-05-20');

  INSERT INTO organisation (reference_code, kind, name, status, country,
                            billing_status, rating, onboarded_at, created_by)
  VALUES (org_reference_code('tenant'), 'tenant', 'Helix Data Collective', 'active',
          'Kenya', 'current', 4.3, '2025-02-14', v_admin)
  RETURNING id INTO v_tn3;
  INSERT INTO tenant_profile (org_id, hq, plan, capabilities, on_time_rate, qa_pass_rate,
                              fair_work_attested, since)
  VALUES (v_tn3, 'Nairobi, Kenya', 'Partner Starter',
          'Structured data, survey panels', 88, 91, true, '2025-02-14');

  -- =========================================================================
  -- Aggregators — each belongs to exactly one tenant (the network axis)
  -- =========================================================================
  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('aggregator'), 'aggregator', 'Bengaluru Crowd Collective',
          'active', v_tn1, now(), v_admin) RETURNING id INTO v_ag1;
  INSERT INTO aggregator_profile (org_id, crowd_size, region, focus)
  VALUES (v_ag1, 820, 'South India', 'Street-level imagery');
  UPDATE organisation SET rating = 4.6 WHERE id = v_ag1;

  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('aggregator'), 'aggregator', 'Delhi Field Network',
          'active', v_tn1, now(), v_admin) RETURNING id INTO v_ag2;
  INSERT INTO aggregator_profile (org_id, crowd_size, region, focus)
  VALUES (v_ag2, 540, 'North India', 'Retail shelf photography');
  UPDATE organisation SET rating = 4.4 WHERE id = v_ag2;

  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('aggregator'), 'aggregator', 'Luzon Gig Guild',
          'active', v_tn2, now(), v_admin) RETURNING id INTO v_ag3;
  INSERT INTO aggregator_profile (org_id, crowd_size, region, focus)
  VALUES (v_ag3, 1200, 'Luzon, PH', 'Voice capture & transcription');
  UPDATE organisation SET rating = 4.5 WHERE id = v_ag3;

  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('aggregator'), 'aggregator', 'Rift Valley Surveyors',
          'active', v_tn3, now(), v_admin) RETURNING id INTO v_ag4;
  INSERT INTO aggregator_profile (org_id, crowd_size, region, focus)
  VALUES (v_ag4, 310, 'East Africa', 'Household surveys');
  UPDATE organisation SET rating = 4.2 WHERE id = v_ag4;

  -- =========================================================================
  -- Business partners
  -- =========================================================================
  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('business'), 'business', 'Vertex Imaging Services',
          'active', v_tn1, now(), v_admin) RETURNING id INTO v_bz1;
  INSERT INTO business_profile (org_id, specialty, capacity)
  VALUES (v_bz1, 'Studio & drone video', '40 crews / week');
  UPDATE organisation SET rating = 4.8 WHERE id = v_bz1;

  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('business'), 'business', 'Cobalt Data Works',
          'active', v_tn1, now(), v_admin) RETURNING id INTO v_bz2;
  INSERT INTO business_profile (org_id, specialty, capacity)
  VALUES (v_bz2, 'Structured data extraction', '25,000 records / week');
  UPDATE organisation SET rating = 4.5 WHERE id = v_bz2;

  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('business'), 'business', 'Pacific Linguistics Ltd',
          'active', v_tn2, now(), v_admin) RETURNING id INTO v_bz3;
  INSERT INTO business_profile (org_id, specialty, capacity)
  VALUES (v_bz3, 'Multilingual annotation', '60 linguists');
  UPDATE organisation SET rating = 4.6 WHERE id = v_bz3;

  -- =========================================================================
  -- Device sponsors and their equipment
  -- =========================================================================
  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('sponsor'), 'sponsor', 'OptiGear Devices',
          'active', v_tn1, now(), v_admin) RETURNING id INTO v_ds1;
  INSERT INTO sponsor_profile (org_id, contact_email) VALUES (v_ds1, 'ops@optigear.example');

  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('sponsor'), 'sponsor', 'FieldSense Sensors',
          'active', v_tn1, now(), v_admin) RETURNING id INTO v_ds2;
  INSERT INTO sponsor_profile (org_id, contact_email) VALUES (v_ds2, 'hello@fieldsense.example');

  INSERT INTO organisation (reference_code, kind, name, status, parent_org_id, onboarded_at, created_by)
  VALUES (org_reference_code('sponsor'), 'sponsor', 'Archipelago Audio Kit',
          'active', v_tn2, now(), v_admin) RETURNING id INTO v_ds3;
  INSERT INTO sponsor_profile (org_id, contact_email) VALUES (v_ds3, 'kit@archipelago.example');

  INSERT INTO equipment (reference_code, sponsor_org_id, equipment_type, total_units, status,
                         calibrated_on, calibration_expires_on) VALUES
    (next_reference_code('DV','seq_ref_equipment'), v_ds1, 'Helmet camera, 4K',    120, 'available',   '2026-07-14', '2027-07-14'),
    (next_reference_code('DV','seq_ref_equipment'), v_ds1, '360° body camera',      45, 'in_use',      '2026-06-30', '2027-06-30'),
    (next_reference_code('DV','seq_ref_equipment'), v_ds1, 'Rugged tablet, 10in',   80, 'available',   '2026-08-02', '2027-08-02'),
    (next_reference_code('DV','seq_ref_equipment'), v_ds2, 'LiDAR backpack',        14, 'in_use',      '2026-08-11', '2027-08-11'),
    (next_reference_code('DV','seq_ref_equipment'), v_ds2, 'GPS logger',           200, 'available',   '2026-05-22', '2027-05-22'),
    (next_reference_code('DV','seq_ref_equipment'), v_ds2, 'Thermal camera',        22, 'maintenance', '2026-03-08', '2027-03-08'),
    (next_reference_code('DV','seq_ref_equipment'), v_ds3, 'Field recorder, pro',   65, 'available',   '2026-07-30', '2027-07-30'),
    (next_reference_code('DV','seq_ref_equipment'), v_ds3, 'Noise-cancel headset', 150, 'in_use',      '2026-06-15', '2027-06-15');

  -- =========================================================================
  -- Crowd rosters — aggregator-internal. These people are NOT platform users.
  -- =========================================================================
  INSERT INTO crowd_worker (reference_code, aggregator_org_id, display_name, skill, status, trained, rating) VALUES
    (next_reference_code('WKR','seq_ref_worker'), v_ag1, 'Priya Nair',     'Street imagery', 'on_shift',   true,  4.8),
    (next_reference_code('WKR','seq_ref_worker'), v_ag1, 'Sana Kulkarni',  'Shelf capture',  'on_break',   true,  4.4),
    (next_reference_code('WKR','seq_ref_worker'), v_ag2, 'Karan Gill',     'Field survey',   'offboarded', false, 4.1),
    (next_reference_code('WKR','seq_ref_worker'), v_ag3, 'Mateo Reyes',    'Voice capture',  'on_shift',   true,  4.7),
    (next_reference_code('WKR','seq_ref_worker'), v_ag4, 'Amina Otieno',   'Household survey','on_shift',  true,  4.3);

  -- =========================================================================
  -- One user per organisation.
  --
  -- Each is an owner of exactly one org. Sign in as any of them with
  -- SourceHub#2026 to see that persona's console.
  -- =========================================================================
  PERFORM seed_demo_user('client@acme.example',        'Dana Whitfield',  v_cl1, 'client');
  PERFORM seed_demo_user('client@voltra.example',      'Jonas Brandt',    v_cl2, 'client');
  PERFORM seed_demo_user('client@mediscan.example',    'Wei Lin Tan',     v_cl3, 'client');
  PERFORM seed_demo_user('partner@northstar.example',  'Ravi Menon',      v_tn1, 'tenant');
  PERFORM seed_demo_user('partner@meridian.example',   'Grace Delgado',   v_tn2, 'tenant');
  PERFORM seed_demo_user('partner@helix.example',      'Achieng Wanjiru', v_tn3, 'tenant');
  PERFORM seed_demo_user('crowd@bengaluru.example',    'Anita Rao',       v_ag1, 'aggregator');
  PERFORM seed_demo_user('crowd@delhi.example',        'Vikram Sethi',    v_ag2, 'aggregator');
  PERFORM seed_demo_user('crowd@luzon.example',        'Carlo Bautista',  v_ag3, 'aggregator');
  PERFORM seed_demo_user('crowd@riftvalley.example',   'Joseph Kimani',   v_ag4, 'aggregator');
  PERFORM seed_demo_user('ops@vertex.example',         'Elena Marsh',     v_bz1, 'business');
  PERFORM seed_demo_user('ops@cobalt.example',         'Tom Ashby',       v_bz2, 'business');
  PERFORM seed_demo_user('ops@pacificling.example',    'Maria Santos',    v_bz3, 'business');
  PERFORM seed_demo_user('ops@optigear.example',       'Hannah Fischer',  v_ds1, 'sponsor');
  PERFORM seed_demo_user('hello@fieldsense.example',   'Derek Osei',      v_ds2, 'sponsor');
  PERFORM seed_demo_user('kit@archipelago.example',    'Liza Cruz',       v_ds3, 'sponsor');

  RAISE NOTICE 'demo organisations and users seeded';
END
$seed$;

DROP FUNCTION seed_demo_user(text, text, uuid, text);
