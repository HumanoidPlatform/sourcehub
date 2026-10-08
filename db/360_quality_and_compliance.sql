-- ============================================================================
-- 360 · request: the quality bar and the consent terms, each as one json value
--
-- 040 gave the RFP's quality bar and its consent and compliance terms a column
-- each, twelve in all. Nothing filters on any of them: they are written by the
-- request form, read back whole by the API and shown on the RFP page, and at
-- award two of them are copied into the contract. Each group becomes one jsonb
-- column whose keys are the old column names:
--
--   quality_bar             {acceptance, quality_thresholds, rejection_policy}
--   consent_and_compliance  {compliance_notes, people_in_frame, minors_policy,
--                            deidentification, regulations, lawful_basis,
--                            permitted_uses, partner_reuse_allowed,
--                            biometric_processing}
--
-- Every value is carried, every key is always present (JSON null when empty),
-- and the vocabularies the old column CHECKs enforced are enforced inside the
-- json instead. The API shape does not change. request goes from 47 to 37
-- columns. No guard is needed: nothing is dropped without being copied, and
-- the old CHECKs guarantee every copied value passes the new ones.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The two json columns, at the end of the table
-- ---------------------------------------------------------------------------
ALTER TABLE request ADD COLUMN quality_bar jsonb NOT NULL DEFAULT '{}';
ALTER TABLE request ADD COLUMN consent_and_compliance jsonb NOT NULL DEFAULT '{}';

COMMENT ON COLUMN request.quality_bar IS
  'The quality bar the client sets: {acceptance, quality_thresholds, rejection_policy}. '
  'acceptance is text, the other two are objects. Shown on the RFP page; acceptance '
  'is frozen into contract.rubric_snapshot at award.';
COMMENT ON COLUMN request.consent_and_compliance IS
  'Consent and compliance terms: {compliance_notes, people_in_frame, minors_policy, '
  'deidentification, regulations, lawful_basis, permitted_uses, partner_reuse_allowed, '
  'biometric_processing}. Vocabularies as 040 had them; compliance_notes is frozen into '
  'contract.rubric_snapshot at award.';

-- ---------------------------------------------------------------------------
-- 2 · Carry every value
--
--     updated_at is not a user edit here, so its trigger is held off for the
--     copy.
-- ---------------------------------------------------------------------------
ALTER TABLE request DISABLE TRIGGER request_updated_at;
UPDATE request SET
  quality_bar = jsonb_build_object(
    'acceptance', acceptance,
    'quality_thresholds', quality_thresholds,
    'rejection_policy', rejection_policy),
  consent_and_compliance = jsonb_build_object(
    'compliance_notes', compliance_notes,
    'people_in_frame', people_in_frame,
    'minors_policy', minors_policy,
    'deidentification', to_jsonb(deidentification),
    'regulations', to_jsonb(regulations),
    'lawful_basis', lawful_basis,
    'permitted_uses', to_jsonb(permitted_uses),
    'partner_reuse_allowed', partner_reuse_allowed,
    'biometric_processing', biometric_processing);
ALTER TABLE request ENABLE TRIGGER request_updated_at;

-- ---------------------------------------------------------------------------
-- 3 · The shapes, with the 040 vocabularies
--
--     A key may be absent; when present it has the type its column had, and
--     the closed lists keep their values. regulations stays open-ended, as in
--     040, but holds text only.
-- ---------------------------------------------------------------------------
ALTER TABLE request
  ADD CONSTRAINT request_quality_bar_shape CHECK (
    jsonb_typeof(quality_bar) = 'object'
    AND coalesce(jsonb_typeof(quality_bar -> 'acceptance') IN ('string', 'null'), true)
    AND coalesce(jsonb_typeof(quality_bar -> 'quality_thresholds') = 'object', true)
    AND coalesce(jsonb_typeof(quality_bar -> 'rejection_policy') = 'object', true));
ALTER TABLE request
  ADD CONSTRAINT request_consent_and_compliance_shape CHECK (
    jsonb_typeof(consent_and_compliance) = 'object'
    AND coalesce(jsonb_typeof(consent_and_compliance -> 'compliance_notes')
                 IN ('string', 'null'), true)
    AND coalesce((consent_and_compliance ->> 'people_in_frame')
                 IN ('none', 'incidental', 'consented'), true)
    AND coalesce((consent_and_compliance ->> 'minors_policy')
                 IN ('prohibited', 'with_parental_consent'), true)
    AND coalesce((consent_and_compliance ->> 'lawful_basis')
                 IN ('consent', 'contract', 'legitimate_interest', 'public_task',
                     'legal_obligation', 'not_personal_data'), true)
    AND coalesce(jsonb_typeof(consent_and_compliance -> 'deidentification') = 'array'
                 AND (consent_and_compliance -> 'deidentification')
                     <@ '["blur_faces", "redact_plates", "strip_gps"]'::jsonb, true)
    AND coalesce(jsonb_typeof(consent_and_compliance -> 'permitted_uses') = 'array'
                 AND (consent_and_compliance -> 'permitted_uses')
                     <@ '["model_training", "internal_analysis", "research", "audit",
                          "publication"]'::jsonb, true)
    AND coalesce(jsonb_typeof(consent_and_compliance -> 'regulations') = 'array'
                 AND NOT jsonb_path_exists(consent_and_compliance -> 'regulations',
                                           '$[*] ? (@.type() != "string")'), true)
    AND coalesce(jsonb_typeof(consent_and_compliance -> 'partner_reuse_allowed')
                 = 'boolean', true)
    AND coalesce(jsonb_typeof(consent_and_compliance -> 'biometric_processing')
                 = 'boolean', true));

-- ---------------------------------------------------------------------------
-- 4 · Drop the twelve columns and the checks 040 put on five of them
-- ---------------------------------------------------------------------------
ALTER TABLE request DROP CONSTRAINT request_people_in_frame_check;
ALTER TABLE request DROP CONSTRAINT request_minors_policy_check;
ALTER TABLE request DROP CONSTRAINT request_deidentification_check;
ALTER TABLE request DROP CONSTRAINT request_lawful_basis_check;
ALTER TABLE request DROP CONSTRAINT request_permitted_uses_check;

ALTER TABLE request DROP COLUMN acceptance;
ALTER TABLE request DROP COLUMN quality_thresholds;
ALTER TABLE request DROP COLUMN rejection_policy;
ALTER TABLE request DROP COLUMN compliance_notes;
ALTER TABLE request DROP COLUMN people_in_frame;
ALTER TABLE request DROP COLUMN minors_policy;
ALTER TABLE request DROP COLUMN deidentification;
ALTER TABLE request DROP COLUMN regulations;
ALTER TABLE request DROP COLUMN lawful_basis;
ALTER TABLE request DROP COLUMN permitted_uses;
ALTER TABLE request DROP COLUMN partner_reuse_allowed;
ALTER TABLE request DROP COLUMN biometric_processing;
