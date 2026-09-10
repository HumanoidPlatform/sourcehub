-- ============================================================================
-- 001 · Conventions — enums, helper functions, sequences
--
-- Every enum here is scoped to ONE entity. The prototype shares a single flat
-- vocabulary of 28 status strings across every table, and that vocabulary is
-- ambiguous: 'Submitted' belongs to both a proposal (awaiting the client) and a
-- task (awaiting the partner's QA), yet §1 STATUS gives it a single owner,
-- 'client', which is wrong for the task. 'Accepted', 'Rejected', 'Delivered',
-- 'Completed', 'Pending' and 'Active' are overloaded the same way.
--
-- The shared display vocabulary stays a presentation concern. The database
-- keeps one enum per entity so an illegal value cannot be written at all.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
CREATE TYPE org_kind AS ENUM
  ('client','tenant','aggregator','business','sponsor','platform');

CREATE TYPE org_status AS ENUM
  ('pending_approval','active','suspended','terminated');

CREATE TYPE billing_status AS ENUM
  ('current','overdue','suspended');

CREATE TYPE user_status AS ENUM
  ('invited','active','suspended','locked','deactivated');

CREATE TYPE user_token_purpose AS ENUM
  ('password_reset','email_verification');

CREATE TYPE grant_scope AS ENUM
  ('owner','manager','member');

-- ---------------------------------------------------------------------------
-- Onboarding
-- ---------------------------------------------------------------------------
CREATE TYPE onboarding_status AS ENUM
  ('draft','submitted','under_review','changes_requested',
   'approved','rejected','withdrawn','expired');

CREATE TYPE approval_decision AS ENUM
  ('approved','rejected','changes_requested');

CREATE TYPE onboarding_document_kind AS ENUM
  ('kyb','dpa','tax_form','fair_work_attestation','insurance','other');

-- ---------------------------------------------------------------------------
-- Storage
--
-- Captures land in the client's own object storage, named on the request. The
-- provider decides how a URL is signed, not where the bytes go: 's3' covers
-- AWS, MinIO, R2, Wasabi and GCS's interoperability endpoint — anything the
-- S3 SDK can presign against — while 'gcs' means native service-account
-- signing and 'azure_blob' means a SAS token, which is a different mechanism.
-- ---------------------------------------------------------------------------
CREATE TYPE storage_provider AS ENUM
  ('s3','gcs','azure_blob');

-- ---------------------------------------------------------------------------
-- Marketplace
-- ---------------------------------------------------------------------------
CREATE TYPE request_category AS ENUM
  ('image','video','structured_data','unstructured_data','people_deliverable');

CREATE TYPE request_status AS ENUM
  ('draft','published','proposals_received','accepted',
   'in_progress','delivered','completed','cancelled');

CREATE TYPE proposal_status AS ENUM
  ('submitted','accepted','rejected','withdrawn');

-- ---------------------------------------------------------------------------
-- Delivery
-- ---------------------------------------------------------------------------
CREATE TYPE contract_status AS ENUM
  ('active','in_qa','delivered','completed','disputed','cancelled');

CREATE TYPE task_status AS ENUM
  ('assigned','in_progress','submitted','qa_passed','qa_failed','cancelled');

CREATE TYPE submission_status AS ENUM
  ('open','submitted','under_review','accepted','rejected','superseded');

CREATE TYPE asset_status AS ENUM
  ('pending','ready','quarantined','rejected','erased');

CREATE TYPE redaction_state AS ENUM
  ('not_required','device_redacted','verified','failed_verification');

-- ---------------------------------------------------------------------------
-- QA — three independently recorded gates.
-- Blueprint: "the gate that catches a defect determines who absorbs the
-- rework, which is why the gates must be independently recorded rather than
-- collapsed into a single 'approved' flag."
-- ---------------------------------------------------------------------------
CREATE TYPE qa_gate AS ENUM
  ('gate1_supplier','gate2_partner','gate3_client');

CREATE TYPE qa_outcome AS ENUM
  ('pass','fail','waived');

-- ---------------------------------------------------------------------------
-- Network
-- ---------------------------------------------------------------------------
CREATE TYPE equipment_status AS ENUM
  ('available','in_use','returned','maintenance','retired');

CREATE TYPE loan_status AS ENUM
  ('pending','approved','rejected','issued','returned','overdue');

CREATE TYPE worker_status AS ENUM
  ('on_shift','on_break','offboarded');

-- ---------------------------------------------------------------------------
-- Ledger — double entry, so a type and a direction rather than a flat amount
-- ---------------------------------------------------------------------------
CREATE TYPE ledger_entry_type AS ENUM
  ('invoice','escrow_hold','escrow_release','platform_fee',
   'payout','refund','adjustment');

CREATE TYPE ledger_direction AS ENUM ('debit','credit');

CREATE TYPE invoice_status AS ENUM ('pending','paid','overdue','void');

-- ---------------------------------------------------------------------------
-- Notify
-- ---------------------------------------------------------------------------
CREATE TYPE notification_channel AS ENUM ('in_app','email','webhook');


-- ============================================================================
-- Session context helpers
--
-- Always the missing-ok form of current_setting. An unset context returns NULL,
-- so every RLS policy fails closed rather than raising. This is the difference
-- between "a query with no context returns nothing" and "a query with no
-- context errors out and someone adds a try/except".
-- ============================================================================

CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid
LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('app.org_id', true), '')::uuid
$fn$;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$fn$;

CREATE OR REPLACE FUNCTION current_app_role() RETURNS text
LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('app.role', true), '')
$fn$;

CREATE OR REPLACE FUNCTION is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE AS $fn$
  SELECT coalesce(current_setting('app.role', true) = 'platform_admin', false)
$fn$;


-- ============================================================================
-- updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;


-- ============================================================================
-- Human-readable reference codes
--
-- The prototype's state.seq counters become real sequences. Users, support
-- tickets and invoices refer to CL-01 and RFP-1001, never to a UUID.
-- ============================================================================

CREATE SEQUENCE seq_ref_client      START 1;
CREATE SEQUENCE seq_ref_tenant      START 1;
CREATE SEQUENCE seq_ref_aggregator  START 1;
CREATE SEQUENCE seq_ref_business    START 1;
CREATE SEQUENCE seq_ref_sponsor     START 1;
CREATE SEQUENCE seq_ref_platform    START 1;
CREATE SEQUENCE seq_ref_request     START 1001;
CREATE SEQUENCE seq_ref_proposal    START 1;
CREATE SEQUENCE seq_ref_contract    START 1;
CREATE SEQUENCE seq_ref_task        START 1;
CREATE SEQUENCE seq_ref_equipment   START 1;
CREATE SEQUENCE seq_ref_loan        START 1;
CREATE SEQUENCE seq_ref_worker      START 1;
CREATE SEQUENCE seq_ref_invoice     START 1;
CREATE SEQUENCE seq_ref_onboarding  START 1;

CREATE OR REPLACE FUNCTION next_reference_code(
  p_prefix text, p_sequence text, p_width int DEFAULT 2
) RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT nextval(%L)', p_sequence) INTO n;
  RETURN p_prefix || '-' || lpad(n::text, p_width, '0');
END
$fn$;

CREATE OR REPLACE FUNCTION org_reference_code(p_kind org_kind) RETURNS text
LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN CASE p_kind
    WHEN 'client'     THEN next_reference_code('CL',  'seq_ref_client')
    WHEN 'tenant'     THEN next_reference_code('TN',  'seq_ref_tenant')
    WHEN 'aggregator' THEN next_reference_code('AG',  'seq_ref_aggregator')
    WHEN 'business'   THEN next_reference_code('BZ',  'seq_ref_business')
    WHEN 'sponsor'    THEN next_reference_code('DS',  'seq_ref_sponsor')
    WHEN 'platform'   THEN next_reference_code('OPS', 'seq_ref_platform')
  END;
END
$fn$;
