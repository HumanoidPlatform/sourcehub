-- ============================================================================
-- 290 · The dormant objects go
--
-- Thirteen tables were created from the blueprint and never reached code: no
-- backend module, console page or phone screen reads or writes them, no
-- function, policy, view or trigger names them, and every one is empty on
-- every database this schema has run against (retention_policy held the one
-- seeded platform default, which nothing read). Six of them never had
-- row-level security at all, so the application login could read and write
-- them freely. An empty table is not free: it is a policy to keep in step, a
-- grant to audit, and a promise in the docs that the code does not keep.
--
--   qa            rubric, rubric_rule, sampling_plan, gold_set, gold_set_item.
--                 The rubric lives on contract.rubric_snapshot; with these
--                 goes qa_review.sampling_plan_id, which was always NULL.
--   delivery      consent_artefact
--   marketplace   proposal_resource
--   onboarding    onboarding_document, and with it the enum
--                 onboarding_document_kind, whose only column that was
--   identity      user_mfa. permission.requires_mfa and the token flag stay:
--                 require_mfa() never read this table.
--   records       event_outbox, retention_policy, legal_hold, erasure_request
--
-- With them go two functions nothing calls — current_app_role() (001), whose
-- job is_platform_admin() does, and org_in_vendor_directory() (260), whose
-- only caller was a tenant_profile policy that left with 280 — and the four
-- views. No code reads a view: modules/overview refuses them because a view
-- runs with its owner's rights and so bypasses row-level security, and the
-- invariant ledger_imbalance looked for is enforced at write time by
-- assert_ledger_balanced().
--
-- The CREATE statements stay in the earlier files and in git. When a feature
-- arrives that needs one of these, it gets a new file and a fresh design, with
-- row-level security from the first line.
--
-- Safe on a database with data: the guard below refuses to run if any of the
-- thirteen tables holds a row, so this file can never drop data silently.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · Refuse to drop anything that holds data
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_table text;
  v_rows  bigint;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
      'gold_set_item', 'gold_set', 'rubric_rule', 'sampling_plan', 'rubric',
      'consent_artefact', 'proposal_resource', 'onboarding_document', 'user_mfa',
      'legal_hold', 'erasure_request', 'event_outbox'] LOOP
    EXECUTE format('SELECT count(*) FROM %I', v_table) INTO v_rows;
    IF v_rows > 0 THEN
      RAISE EXCEPTION '290: % holds % row(s) and was expected to be empty; nothing was dropped',
        v_table, v_rows;
    END IF;
  END LOOP;
  -- The seeded platform default (org_id NULL, from 900) is expected. A row
  -- with an org_id would be a per-client override nobody could have written
  -- through the API, and so worth a look before it is lost.
  SELECT count(*) INTO v_rows FROM retention_policy WHERE org_id IS NOT NULL;
  IF v_rows > 0 THEN
    RAISE EXCEPTION '290: retention_policy holds % per-organisation row(s); nothing was dropped',
      v_rows;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 2 · The column that pointed at a sampling plan. Its foreign key goes too.
-- ---------------------------------------------------------------------------
ALTER TABLE qa_review DROP COLUMN sampling_plan_id;

-- ---------------------------------------------------------------------------
-- 3 · The tables, children before parents. Indexes, policies, the
--     event_outbox sequence and the grants go with them.
-- ---------------------------------------------------------------------------
DROP TABLE gold_set_item;
DROP TABLE gold_set;
DROP TABLE rubric_rule;
DROP TABLE sampling_plan;
DROP TABLE rubric;
DROP TABLE consent_artefact;
DROP TABLE proposal_resource;
DROP TABLE onboarding_document;
DROP TABLE user_mfa;
DROP TABLE legal_hold;
DROP TABLE erasure_request;
DROP TABLE event_outbox;
DROP TABLE retention_policy;

-- ---------------------------------------------------------------------------
-- 4 · The enum only onboarding_document used
-- ---------------------------------------------------------------------------
DROP TYPE onboarding_document_kind;

-- ---------------------------------------------------------------------------
-- 5 · Two functions nothing calls
-- ---------------------------------------------------------------------------
DROP FUNCTION current_app_role();
DROP FUNCTION org_in_vendor_directory(uuid);

-- ---------------------------------------------------------------------------
-- 6 · The views
-- ---------------------------------------------------------------------------
DROP VIEW contract_progress;
DROP VIEW equipment_availability;
DROP VIEW ledger_account_balance;
DROP VIEW ledger_imbalance;
