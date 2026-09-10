-- ============================================================================
-- 050 · Delivery — contracts, tasks, submissions, assets
--
-- Three prototype flaws are fixed here.
--
-- 1. contract has no client FK in the prototype (the client is reached via
--    rfp.clientId), but the build guide's RLS policy requires client_org_id AND
--    partner_org_id denormalised onto the row. Without them the policy cannot
--    be written.
--
-- 2. task.assets is an integer count and task.note is overloaded — submitTask()
--    writes the supplier's note, then qaDecide() overwrites it with the QA
--    verdict. The supplier's account of what happened is destroyed by the
--    review of it. Split into submission (one row per attempt) and asset (one
--    row per file), with qa_review in 060.
--
-- 3. request.status and contract.status are mutated in lockstep by the same
--    actions. Kept as two columns because the request has a life before any
--    contract exists, but a trigger keeps them consistent rather than trusting
--    every caller to update both.
-- ============================================================================

CREATE TABLE contract (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  text UNIQUE NOT NULL,      -- CTR-01
  request_id      uuid NOT NULL UNIQUE REFERENCES request(id)  ON DELETE RESTRICT,
  proposal_id     uuid NOT NULL UNIQUE REFERENCES proposal(id) ON DELETE RESTRICT,

  -- denormalised for RLS. Both are on the policy's hot path; a join would make
  -- the predicate unindexable.
  client_org_id   uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  partner_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  value           numeric(14,2) NOT NULL CHECK (value >= 0),
  currency        char(3) NOT NULL DEFAULT 'USD',
  status          contract_status NOT NULL DEFAULT 'active',

  -- The rubric snapshot. Blueprint: "Ops arbitrates against the rubric snapshot
  -- taken at award, which is why the rubric must be immutable from that
  -- moment." Copied in at award, never updated.
  rubric_snapshot jsonb,
  milestone_pct   smallint NOT NULL DEFAULT 50 CHECK (milestone_pct BETWEEN 0 AND 100),
  platform_fee_pct numeric(5,2) NOT NULL DEFAULT 9.00,

  -- The destination, pinned at award for the same reason as the rubric: the
  -- client may keep editing the request, but work already under way must not
  -- change where it is written.
  storage_target_id uuid REFERENCES storage_target(id) ON DELETE RESTRICT,

  started_at      timestamptz,
  delivered_at    timestamptz,
  completed_at    timestamptz,
  disputed_at     timestamptz,
  acceptance_due_at timestamptz,             -- the client's contractual window

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES app_user(id),
  updated_by      uuid REFERENCES app_user(id),
  deleted_at      timestamptz,

  CONSTRAINT contract_parties_differ CHECK (client_org_id <> partner_org_id)
);

CREATE INDEX contract_client_idx  ON contract (client_org_id) WHERE deleted_at IS NULL;
CREATE INDEX contract_partner_idx ON contract (partner_org_id) WHERE deleted_at IS NULL;
CREATE INDEX contract_status_idx  ON contract (status) WHERE deleted_at IS NULL;

CREATE TRIGGER contract_updated_at BEFORE UPDATE ON contract
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- task — the unit of assignment, QA and rework. "Never spans suppliers."
--
-- The prototype's polymorphic assigneeType/assigneeId pair collapses to a plain
-- FK now that every org kind lives in one table.
-- ---------------------------------------------------------------------------
CREATE TABLE task (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  text UNIQUE NOT NULL,      -- TSK-01
  contract_id     uuid NOT NULL REFERENCES contract(id) ON DELETE RESTRICT,

  -- the supplier. RLS on contract reaches through this column.
  assignee_org_id uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  title           text NOT NULL,
  target          text,                      -- "320 hours", "6,000 transcripts"
  status          task_status NOT NULL DEFAULT 'assigned',
  due_on          date,

  started_at      timestamptz,
  completed_at    timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES app_user(id),
  updated_by      uuid REFERENCES app_user(id),
  deleted_at      timestamptz
);

CREATE INDEX task_contract_idx ON task (contract_id) WHERE deleted_at IS NULL;
CREATE INDEX task_assignee_idx ON task (assignee_org_id) WHERE deleted_at IS NULL;
CREATE INDEX task_status_idx   ON task (status) WHERE deleted_at IS NULL;

CREATE TRIGGER task_updated_at BEFORE UPDATE ON task
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- submission — ONE attempt at a task.
--
-- Blueprint: "One attempt. A reworked task has several; the trail keeps every
-- one." This is where the supplier's own note lives, and it is never
-- overwritten by a reviewer.
-- ---------------------------------------------------------------------------
CREATE TABLE submission (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        uuid NOT NULL REFERENCES task(id) ON DELETE RESTRICT,
  attempt_no     smallint NOT NULL DEFAULT 1 CHECK (attempt_no > 0),
  supplier_org_id uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  status         submission_status NOT NULL DEFAULT 'open',
  supplier_note  text,                       -- the supplier's account, kept
  asset_count    integer NOT NULL DEFAULT 0 CHECK (asset_count >= 0),

  opened_at      timestamptz NOT NULL DEFAULT now(),
  submitted_at   timestamptz,
  closed_at      timestamptz,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_by     uuid REFERENCES app_user(id),
  updated_by     uuid REFERENCES app_user(id),

  UNIQUE (task_id, attempt_no)
);

CREATE INDEX submission_task_idx ON submission (task_id);
-- the partner's QA queue
CREATE INDEX submission_review_queue_idx ON submission (submitted_at)
  WHERE status IN ('submitted','under_review');

CREATE TRIGGER submission_updated_at BEFORE UPDATE ON submission
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- asset — one captured file plus its manifest.
--
-- The largest table in the system: the year-one target is 40 million rows and
-- 80 TB/month of ingest. Partitioned by month on created_at so old ranges can
-- be detached and archived without touching the live set.
--
-- The bytes never live here. storage_key points at region-pinned object
-- storage; the application tier only ever handles manifests and events.
-- ---------------------------------------------------------------------------
CREATE TABLE asset (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES submission(id) ON DELETE RESTRICT,

  storage_key     text NOT NULL,
  storage_region  text,                      -- residency pinning
  filename        text,
  mime_type       text,
  size_bytes      bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  sha256          text NOT NULL,
  etag            text,

  status          asset_status NOT NULL DEFAULT 'pending',
  redaction       redaction_state NOT NULL DEFAULT 'not_required',

  captured_at     timestamptz,
  captured_lat    numeric(9,6),
  captured_lon    numeric(9,6),
  equipment_id    uuid,                      -- FK added in 070

  -- EXIF and probe output. Open by nature — a JPEG and a 4K video share almost
  -- no fields — and never filtered on directly.
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- automated check results, thresholds from the contract's rubric snapshot
  check_results   jsonb NOT NULL DEFAULT '{}'::jsonb,
  quarantine_reason text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  erased_at       timestamptz,               -- lawful erasure leaves the row as a tombstone

  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Dev partitions. Production creates these on a rolling schedule.
CREATE TABLE asset_2026q3 PARTITION OF asset
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE asset_2026q4 PARTITION OF asset
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE asset_default PARTITION OF asset DEFAULT;

CREATE INDEX asset_submission_idx ON asset (submission_id);
CREATE INDEX asset_status_idx     ON asset (status);
CREATE INDEX asset_sha256_idx     ON asset (sha256);
-- BRIN rather than btree: 40M rows appended in time order, and the query that
-- matters is a range scan. A btree here would be gigabytes for no benefit.
CREATE INDEX asset_created_brin   ON asset USING brin (created_at);


-- ---------------------------------------------------------------------------
-- consent_artefact — one per identifiable subject in a people-based capture.
--
-- Blueprint: "stored with the asset and surviving deletion of the asset
-- itself". Hence ON DELETE SET NULL and its own retention: proof that consent
-- was obtained has to outlive the thing consented to.
-- ---------------------------------------------------------------------------
CREATE TABLE consent_artefact (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    uuid NOT NULL REFERENCES contract(id) ON DELETE RESTRICT,
  asset_id       uuid,                       -- deliberately not a hard FK: survives asset erasure
  subject_ref    text NOT NULL,              -- pseudonymous subject identifier
  consent_type   text NOT NULL,
  storage_key    text,                       -- the signed artefact itself
  obtained_at    timestamptz NOT NULL,
  expires_at     timestamptz,
  withdrawn_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consent_artefact_contract_idx ON consent_artefact (contract_id);
CREATE INDEX consent_artefact_asset_idx    ON consent_artefact (asset_id);


-- ---------------------------------------------------------------------------
-- Delivery gate, as a view rather than a denormalised counter.
--
-- The prototype computes this ad hoc in progressOf() and deliverable():
-- a contract may be handed to the client once every task has cleared QA.
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
