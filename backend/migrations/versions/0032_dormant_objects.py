"""The dormant objects go: thirteen empty tables, a column, an enum, two functions, four views.

Nothing in the backend, console or phone app reads or writes any of them, no
function, policy, view or trigger names them, and every table is empty on every
database this schema has run against (retention_policy held the one seeded
default, which nothing read). A guard at the top refuses to run if that is not
so, so the upgrade can never drop data silently.

SQL copied verbatim from db/290_dormant_objects.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. The downgrade recreates everything as it stood at 0031, from
the files that first created it, with ENABLE ROW LEVEL SECURITY (270 took FORCE
off) and the seeded retention row; qa_review.sampling_plan_id returns at the
end of the row.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0032
Revises: 0031
"""

from alembic import op

revision = "0032"
down_revision = "0031"
branch_labels = None
depends_on = None

_UP = """
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
"""

_DOWN = """
-- Downgrade of 0032: everything db/290 removed comes back as it stood at 0031,
-- copied from the files that first created it. The tables return empty (they
-- were) with ENABLE ROW LEVEL SECURITY and the policies 100 gave them — 270
-- took FORCE off everything, so none is set here — plus the one seeded
-- retention row. Grants come from db/000's default privileges, as they do for
-- every table the owner creates.

-- ---------------------------------------------------------------------------
-- 6 · The views (050, 070, 080)
-- ---------------------------------------------------------------------------
CREATE VIEW contract_progress AS
SELECT c.id                                            AS contract_id,
       count(t.id)                                     AS task_count,
       count(t.id) FILTER (WHERE t.status = 'qa_passed') AS tasks_passed,
       CASE WHEN count(t.id) = 0 THEN 0
            ELSE round(100.0 * count(t.id) FILTER (WHERE t.status = 'qa_passed') / count(t.id))
       END                                             AS pct_complete,
       count(t.id) > 0
         AND count(t.id) = count(t.id) FILTER (WHERE t.status = 'qa_passed')
         AND c.status IN ('active','in_qa')            AS is_deliverable
FROM   contract c
LEFT   JOIN task t ON t.contract_id = c.id AND t.deleted_at IS NULL
WHERE  c.deleted_at IS NULL
GROUP  BY c.id, c.status;

CREATE VIEW equipment_availability AS
SELECT e.id AS equipment_id, e.sponsor_org_id, e.equipment_type,
       e.total_units,
       equipment_units_on_loan(e.id)                  AS units_on_loan,
       e.total_units - equipment_units_on_loan(e.id)  AS units_available,
       e.calibration_expires_on,
       (e.calibration_expires_on IS NOT NULL
        AND e.calibration_expires_on < current_date)  AS calibration_expired
FROM   equipment e
WHERE  e.deleted_at IS NULL;

CREATE VIEW ledger_account_balance AS
SELECT a.id AS account_id, a.org_id, a.code, a.currency,
       coalesce(sum(CASE WHEN e.direction = 'debit'  THEN e.amount ELSE 0 END), 0)
     - coalesce(sum(CASE WHEN e.direction = 'credit' THEN e.amount ELSE 0 END), 0) AS balance
FROM   ledger_account a
LEFT   JOIN ledger_entry e ON e.account_id = a.id
GROUP  BY a.id, a.org_id, a.code, a.currency;

CREATE VIEW ledger_imbalance AS
SELECT t.id AS transaction_id, t.description,
       coalesce(sum(CASE WHEN e.direction = 'debit'  THEN e.amount ELSE 0 END), 0)
     - coalesce(sum(CASE WHEN e.direction = 'credit' THEN e.amount ELSE 0 END), 0) AS diff
FROM   ledger_transaction t
LEFT   JOIN ledger_entry e ON e.transaction_id = t.id
GROUP  BY t.id, t.description
HAVING coalesce(sum(CASE WHEN e.direction = 'debit'  THEN e.amount ELSE 0 END), 0)
     - coalesce(sum(CASE WHEN e.direction = 'credit' THEN e.amount ELSE 0 END), 0) <> 0;

-- ---------------------------------------------------------------------------
-- 5 · The functions (001, 260)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_app_role() RETURNS text
LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('app.role', true), '')
$fn$;

CREATE OR REPLACE FUNCTION org_in_vendor_directory(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM organisation o
    WHERE  o.id = p_org_id
      AND  o.kind = 'tenant'
      AND  o.status = 'active'
      AND  o.deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION org_in_vendor_directory(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_in_vendor_directory(uuid) TO sourcehub_app, sourcehub_readonly;

-- ---------------------------------------------------------------------------
-- 4 · The enum (001)
-- ---------------------------------------------------------------------------
CREATE TYPE onboarding_document_kind AS ENUM
  ('kyb','dpa','tax_form','fair_work_attestation','insurance','other');

-- ---------------------------------------------------------------------------
-- 3 · The tables, parents before children (010, 030, 040, 050, 060, 090)
-- ---------------------------------------------------------------------------
CREATE TABLE user_mfa (
  user_id       uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  totp_secret   text NOT NULL,
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  backup_codes  text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE onboarding_document (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid NOT NULL REFERENCES onboarding_request(id) ON DELETE CASCADE,
  kind          onboarding_document_kind NOT NULL,
  filename      text NOT NULL,
  storage_key   text NOT NULL,
  content_type  text,
  size_bytes    bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  sha256        text,
  uploaded_by   uuid REFERENCES app_user(id),
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  verified_at   timestamptz,
  verified_by   uuid REFERENCES app_user(id)
);

CREATE INDEX onboarding_document_request_idx ON onboarding_document (request_id);

CREATE TABLE proposal_resource (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid NOT NULL REFERENCES proposal(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  role_note    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, org_id)
);

CREATE TABLE consent_artefact (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    uuid NOT NULL REFERENCES contract(id) ON DELETE RESTRICT,
  asset_id       uuid,
  subject_ref    text NOT NULL,
  consent_type   text NOT NULL,
  storage_key    text,
  obtained_at    timestamptz NOT NULL,
  expires_at     timestamptz,
  withdrawn_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consent_artefact_contract_idx ON consent_artefact (contract_id);
CREATE INDEX consent_artefact_asset_idx    ON consent_artefact (asset_id);

CREATE TABLE rubric (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid NOT NULL REFERENCES request(id) ON DELETE CASCADE,
  version      integer NOT NULL DEFAULT 1,
  name         text,
  is_current   boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES app_user(id),
  UNIQUE (request_id, version)
);

CREATE UNIQUE INDEX rubric_one_current_key ON rubric (request_id) WHERE is_current;

CREATE TABLE rubric_rule (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id      uuid NOT NULL REFERENCES rubric(id) ON DELETE CASCADE,
  defect_code_id uuid NOT NULL REFERENCES defect_code(id) ON DELETE RESTRICT,
  operator       text NOT NULL,
  threshold      numeric(10,4),
  unit           text,
  severity       text NOT NULL DEFAULT 'major',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rubric_rule_rubric_idx ON rubric_rule (rubric_id);

CREATE TABLE sampling_plan (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id      uuid NOT NULL REFERENCES rubric(id) ON DELETE CASCADE,
  gate           qa_gate NOT NULL,
  sample_pct     numeric(5,2) CHECK (sample_pct IS NULL OR sample_pct BETWEEN 0 AND 100),
  min_sample     integer CHECK (min_sample IS NULL OR min_sample >= 0),
  aql            numeric(5,2),
  accept_number  integer,
  reject_number  integer,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rubric_id, gate)
);

CREATE TABLE gold_set (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id uuid NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  name         text NOT NULL,
  category     request_category NOT NULL,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gold_set_item (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gold_set_id   uuid NOT NULL REFERENCES gold_set(id) ON DELETE CASCADE,
  storage_key   text NOT NULL,
  expected_pass boolean NOT NULL,
  expected_defects text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE event_outbox (
  id            bigserial PRIMARY KEY,
  event_type    text NOT NULL,
  aggregate_id  uuid,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  attempts      smallint NOT NULL DEFAULT 0,
  last_error    text
);

CREATE INDEX event_outbox_pending_idx ON event_outbox (created_at) WHERE published_at IS NULL;

CREATE TABLE retention_policy (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organisation(id) ON DELETE CASCADE,
  retention_months  smallint NOT NULL DEFAULT 24 CHECK (retention_months > 0),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id)
);

CREATE TABLE legal_hold (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  uuid REFERENCES contract(id) ON DELETE RESTRICT,
  org_id       uuid REFERENCES organisation(id) ON DELETE RESTRICT,
  reason       text NOT NULL,
  placed_by    uuid REFERENCES app_user(id),
  placed_at    timestamptz NOT NULL DEFAULT now(),
  released_at  timestamptz,
  released_by  uuid REFERENCES app_user(id),

  CONSTRAINT legal_hold_target CHECK (contract_id IS NOT NULL OR org_id IS NOT NULL)
);

CREATE INDEX legal_hold_active_idx ON legal_hold (contract_id) WHERE released_at IS NULL;

CREATE TABLE erasure_request (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_org_id uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  subject_ref    text,
  scope_note     text NOT NULL,
  status         text NOT NULL DEFAULT 'received',
  received_at    timestamptz NOT NULL DEFAULT now(),
  due_at         timestamptz NOT NULL DEFAULT now() + interval '30 days',
  completed_at   timestamptz,
  refusal_reason text,
  assets_erased  integer NOT NULL DEFAULT 0
);

CREATE INDEX erasure_request_due_idx ON erasure_request (due_at) WHERE status <> 'completed';

-- ---------------------------------------------------------------------------
-- 2 · The column (060). It returns at the end of the row, which is the one
--     thing a downgrade cannot put back without rewriting the table.
-- ---------------------------------------------------------------------------
ALTER TABLE qa_review
  ADD COLUMN sampling_plan_id uuid REFERENCES sampling_plan(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Row-level security as 100 wrote it, less FORCE (270)
-- ---------------------------------------------------------------------------
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_mfa_own ON user_mfa FOR ALL
  USING      (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

ALTER TABLE onboarding_document ENABLE ROW LEVEL SECURITY;
CREATE POLICY onboarding_document_select ON onboarding_document FOR SELECT
  USING (
       is_platform_admin()
    OR EXISTS (SELECT 1 FROM onboarding_request r
                WHERE r.id = onboarding_document.request_id
                  AND (r.requester_org_id = current_org_id()
                    OR r.parent_org_id    = current_org_id()))
  );
CREATE POLICY onboarding_document_insert ON onboarding_document FOR INSERT
  WITH CHECK (
       is_platform_admin()
    OR EXISTS (SELECT 1 FROM onboarding_request r
                WHERE r.id = onboarding_document.request_id
                  AND r.requester_org_id = current_org_id())
  );

ALTER TABLE proposal_resource ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposal_resource_select ON proposal_resource FOR SELECT
  USING (EXISTS (SELECT 1 FROM proposal p WHERE p.id = proposal_resource.proposal_id));
CREATE POLICY proposal_resource_write ON proposal_resource FOR ALL
  USING      (EXISTS (SELECT 1 FROM proposal p
                       WHERE p.id = proposal_resource.proposal_id
                         AND p.partner_org_id = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM proposal p
                       WHERE p.id = proposal_resource.proposal_id
                         AND p.partner_org_id = current_org_id()));

ALTER TABLE consent_artefact ENABLE ROW LEVEL SECURITY;
CREATE POLICY consent_artefact_select ON consent_artefact FOR SELECT
  USING (is_platform_admin() OR contract_is_visible(contract_id));
CREATE POLICY consent_artefact_insert ON consent_artefact FOR INSERT
  WITH CHECK (is_platform_admin() OR contract_is_visible(contract_id));

ALTER TABLE rubric ENABLE ROW LEVEL SECURITY;
CREATE POLICY rubric_select ON rubric FOR SELECT
  USING (is_platform_admin()
         OR EXISTS (SELECT 1 FROM request r WHERE r.id = rubric.request_id));
CREATE POLICY rubric_write ON rubric FOR ALL
  USING      (EXISTS (SELECT 1 FROM request r WHERE r.id = rubric.request_id
                       AND r.client_org_id = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM request r WHERE r.id = rubric.request_id
                       AND r.client_org_id = current_org_id()));

ALTER TABLE gold_set ENABLE ROW LEVEL SECURITY;
CREATE POLICY gold_set_select ON gold_set FOR SELECT
  USING (is_platform_admin() OR owner_org_id = current_org_id());
CREATE POLICY gold_set_write ON gold_set FOR ALL
  USING      (owner_org_id = current_org_id())
  WITH CHECK (owner_org_id = current_org_id());

ALTER TABLE legal_hold ENABLE ROW LEVEL SECURITY;
CREATE POLICY legal_hold_select ON legal_hold FOR SELECT
  USING (is_platform_admin() OR org_id = current_org_id());
CREATE POLICY legal_hold_write ON legal_hold FOR ALL
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- ---------------------------------------------------------------------------
-- The seeded platform default (900)
-- ---------------------------------------------------------------------------
INSERT INTO retention_policy (org_id, retention_months) VALUES (NULL, 24);
"""


def _statements(ddl: str) -> list[str]:
    out: list[str] = []
    buf: list[str] = []
    in_body = False
    for line in ddl.splitlines():
        if line.count("$fn$") == 1:
            in_body = not in_body
        buf.append(line)
        if not in_body and line.rstrip().endswith(";"):
            stmt = chr(10).join(buf).strip()
            buf = []
            lines = stmt.splitlines()
            only_comments = all(ln.strip().startswith("--") or not ln.strip() for ln in lines)
            if stmt and not only_comments:
                out.append(stmt)
    return out


def upgrade() -> None:
    for stmt in _statements(_UP):
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
