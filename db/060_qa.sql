-- ============================================================================
-- 060 · QA — rubrics, sampling plans, gold sets, reviews, defects
--
-- The prototype's QA is a pass/fail button that overwrites task.note. The
-- blueprint replaces it with three independently recorded gates:
--
--   gate 1  supplier self-check     reject -> recapture, supplier absorbs
--   gate 2  partner QA              reject -> rework, supplier absorbs
--   gate 3  client acceptance       reject -> dispute, partner absorbs, escrow held
--
-- "The gate that catches a defect determines who absorbs the rework, which is
-- why the gates must be independently recorded rather than collapsed into a
-- single 'approved' flag. Gate 3 is the only one that can move money."
--
-- That sentence is the reason qa_review has a gate column and is append-only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- defect_code — a lookup table, not an enum.
--
-- Operators extend this taxonomy as new failure modes appear in the field.
-- An enum would need a migration each time.
-- ---------------------------------------------------------------------------
CREATE TABLE defect_code (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,          -- 'blur', 'occlusion', 'missing_geotag'
  label       text NOT NULL,
  category    text NOT NULL,                 -- optical | metadata | coverage | compliance
  automated   boolean NOT NULL DEFAULT false,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- rubric — the machine-checkable acceptance criteria.
--
-- Blueprint decision: "The client's acceptance criteria are captured as a
-- machine-checkable rubric plus a sampling plan, not free text, from the moment
-- the request is drafted." The prototype's acceptance string — "95% or better
-- pass on the automated blur and occlusion check; 5% manual audit sample" — is
-- exactly this, unparsed.
--
-- Versioned because contract.rubric_snapshot must be immutable from award while
-- the client may keep editing the request's rubric for future work.
-- ---------------------------------------------------------------------------
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

-- One row per threshold. "95% pass on blur" is a rule, not prose.
CREATE TABLE rubric_rule (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id      uuid NOT NULL REFERENCES rubric(id) ON DELETE CASCADE,
  defect_code_id uuid NOT NULL REFERENCES defect_code(id) ON DELETE RESTRICT,
  operator       text NOT NULL,              -- gte | lte | eq | present
  threshold      numeric(10,4),
  unit           text,                       -- pct | count | ratio
  severity       text NOT NULL DEFAULT 'major',   -- major | minor
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rubric_rule_rubric_idx ON rubric_rule (rubric_id);


-- ---------------------------------------------------------------------------
-- sampling_plan — how much of a submission gate 2 actually inspects.
-- ISO 2859-1 style: a lot size, an AQL, an accept/reject number.
-- ---------------------------------------------------------------------------
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


-- ---------------------------------------------------------------------------
-- gold_set — known-good and known-bad reference assets, used to score the
-- reviewers rather than the work. A partner whose QA passes a known-bad asset
-- has a QA problem, not a supplier problem.
-- ---------------------------------------------------------------------------
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


-- ---------------------------------------------------------------------------
-- qa_review — append-only. One row per gate outcome per submission.
--
-- No UPDATE path: a reviewer who changes their mind writes a second row. This
-- is what preserves "who caught it, at which gate", which is what decides who
-- pays for the rework.
-- ---------------------------------------------------------------------------
CREATE TABLE qa_review (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES submission(id) ON DELETE RESTRICT,
  gate            qa_gate NOT NULL,
  outcome         qa_outcome NOT NULL,

  reviewer_org_id uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  reviewer_user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,  -- NULL for automated gate 1

  sample_size     integer CHECK (sample_size IS NULL OR sample_size >= 0),
  sample_failed   integer CHECK (sample_failed IS NULL OR sample_failed >= 0),
  sampling_plan_id uuid REFERENCES sampling_plan(id) ON DELETE SET NULL,

  note            text,
  reviewed_at     timestamptz NOT NULL DEFAULT now(),

  -- The prototype refuses a blank rejection: "Say what must change — the
  -- supplier cannot act on a blank rejection." Enforced here rather than in
  -- the UI, so an API caller cannot skip it.
  CONSTRAINT qa_review_fail_needs_note CHECK (
    outcome <> 'fail' OR (note IS NOT NULL AND length(btrim(note)) > 0)
  ),
  CONSTRAINT qa_review_sample_sane CHECK (
    sample_failed IS NULL OR sample_size IS NULL OR sample_failed <= sample_size
  )
);

CREATE INDEX qa_review_submission_idx ON qa_review (submission_id, gate);
CREATE INDEX qa_review_reviewer_idx   ON qa_review (reviewer_org_id, reviewed_at DESC);

-- Append-only, enforced. Corrections are new rows.
CREATE RULE qa_review_no_update AS ON UPDATE TO qa_review DO INSTEAD NOTHING;
CREATE RULE qa_review_no_delete AS ON DELETE TO qa_review DO INSTEAD NOTHING;


-- ---------------------------------------------------------------------------
-- qa_review_defect — which defect codes a failing review cited.
-- ---------------------------------------------------------------------------
CREATE TABLE qa_review_defect (
  review_id      uuid NOT NULL REFERENCES qa_review(id) ON DELETE CASCADE,
  defect_code_id uuid NOT NULL REFERENCES defect_code(id) ON DELETE RESTRICT,
  affected_count integer CHECK (affected_count IS NULL OR affected_count >= 0),
  PRIMARY KEY (review_id, defect_code_id)
);
