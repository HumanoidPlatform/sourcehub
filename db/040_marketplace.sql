-- ============================================================================
-- 040 · Marketplace — requests and proposals
-- ============================================================================

-- ---------------------------------------------------------------------------
-- request — the RFP. state.rfps in the prototype.
--
-- The prototype nests spec{format,quantity,quality}, people{...} and
-- timeline{start,delivery} as value objects. They are flattened here: every one
-- of those fields is shown in a table column or filtered on in the console, so
-- none of them belongs in jsonb.
-- ---------------------------------------------------------------------------
CREATE TABLE request (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code    text UNIQUE NOT NULL,    -- RFP-1001
  client_org_id     uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  title             text NOT NULL,
  category          request_category NOT NULL,
  status            request_status NOT NULL DEFAULT 'draft',
  geography         text,
  compliance_notes  text,

  -- spec. spec_format and spec_quantity were free text and are gone; see the
  -- client requirements block at the foot of this table.
  spec_quality      text,
  acceptance        text,

  -- people
  people_headcount    integer NOT NULL DEFAULT 0 CHECK (people_headcount >= 0),
  people_training     text,
  people_experience   text,
  people_certification text,

  -- commercials
  budget_min        numeric(14,2) CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max        numeric(14,2) CHECK (budget_max IS NULL OR budget_max >= 0),
  currency          char(3) NOT NULL DEFAULT 'USD',

  starts_on         date,
  delivery_due_on   date,

  -- residency pinning. Blueprint: "a task cannot be assigned to a supplier
  -- outside the permitted region."
  residency_region  text,

  -- Where captured data is written. Chosen while drafting, required before the
  -- request may be published, and copied onto the contract at award so that
  -- editing the request later cannot move work already under way.
  -- Nullable in the column so existing rows survive the migration; the API
  -- requires it.
  storage_target_id uuid REFERENCES storage_target(id) ON DELETE RESTRICT,

  published_at      timestamptz,
  closed_at         timestamptz,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES app_user(id),
  updated_by        uuid REFERENCES app_user(id),
  deleted_at        timestamptz,

  -- ---- client requirements -------------------------------------------------
  -- Everything below this line is declared AFTER deleted_at on purpose, out of
  -- logical order. They reached the deployed database as ALTER TABLE ADD
  -- COLUMN, so they sit at the end in pg_attribute order, and pg_dump emits
  -- columns in that order. Declaring them where they belong would read better
  -- and would make infra/verify_schema.sh report a difference on every run
  -- against a database that is in fact identical. Do not tidy this.
  --
  -- What is wanted. The two columns this replaces, spec_format and
  -- spec_quantity, were free text — "25,000 images", "JPEG minimum 12MP" —
  -- which reads well and cannot be bid against, filtered on, or checked at
  -- delivery. A quantity with a unit can be. capture_spec stays jsonb because
  -- its keys differ per medium (megapixels mean nothing to an audio clip) and
  -- nothing queries inside it.
  objective         text,
  use_case          text CHECK (use_case IS NULL OR use_case IN
                      ('ai_training','market_research','audit_compliance','monitoring_evaluation','other')),
  target_quantity   integer CHECK (target_quantity IS NULL OR target_quantity > 0),
  target_unit       text CHECK (target_unit IS NULL OR target_unit IN
                      ('photos','videos','audio_clips','audio_hours','responses','records','sites','hours')),
  capture_spec      jsonb NOT NULL DEFAULT '{}',
  countries         text[] NOT NULL DEFAULT '{}',
  sampling_frame    jsonb NOT NULL DEFAULT '{}',

  -- The quality bar, and what happens when it is missed. Read whole by QA,
  -- never filtered on, so jsonb rather than columns.
  quality_thresholds jsonb NOT NULL DEFAULT '{}',
  rejection_policy  jsonb NOT NULL DEFAULT '{}',

  -- Privacy and lawfulness. A sourcing marketplace that does not settle these
  -- before work starts is asking someone in the field to guess, which is where
  -- consent failures come from. lawful_basis is the six GDPR Article 6 bases
  -- plus an escape hatch for material that is not personal data at all.
  people_in_frame   text CHECK (people_in_frame IS NULL OR people_in_frame IN
                      ('none','incidental','consented')),
  minors_policy     text CHECK (minors_policy IS NULL OR minors_policy IN
                      ('prohibited','with_parental_consent')),
  deidentification  text[] NOT NULL DEFAULT '{}'
                      CHECK (deidentification <@ ARRAY['blur_faces','redact_plates','strip_gps']),
  -- Deliberately unconstrained, unlike its three neighbours: the set of regimes
  -- a client may need to name is open-ended and a CHECK would only go stale.
  regulations       text[] NOT NULL DEFAULT '{}',
  lawful_basis      text CHECK (lawful_basis IS NULL OR lawful_basis IN
                      ('consent','contract','legitimate_interest','public_task','legal_obligation','not_personal_data')),
  permitted_uses    text[] NOT NULL DEFAULT '{}'
                      CHECK (permitted_uses <@ ARRAY['model_training','internal_analysis','research','audit','publication']),
  partner_reuse_allowed boolean NOT NULL DEFAULT false,
  biometric_processing  boolean NOT NULL DEFAULT false,
  location_type     text CHECK (location_type IS NULL OR location_type IN
                      ('public_outdoor','retail_interior','private_premises','residential')),

  -- Commercials and process.
  pricing_model_requested text NOT NULL DEFAULT 'fixed',
  budget_disclosed  boolean NOT NULL DEFAULT true,
  pilot_required    boolean NOT NULL DEFAULT false,
  pilot_quantity    integer CHECK (pilot_quantity IS NULL OR pilot_quantity > 0),
  pilot_due_on      date,
  milestones        jsonb NOT NULL DEFAULT '[]',
  proposals_close_at timestamptz,
  contact_user_id   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  proposal_requirements text[] NOT NULL DEFAULT '{}'
                      CHECK (proposal_requirements <@ ARRAY['method_statement','team_cv','sample_work','insurance','dpa_acceptance','references']),

  CONSTRAINT request_budget_order   CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min),
  CONSTRAINT request_timeline_order CHECK (delivery_due_on IS NULL OR starts_on IS NULL OR delivery_due_on >= starts_on),
  CONSTRAINT request_currency_shape CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT request_pricing_model_check CHECK (pricing_model_requested IN ('fixed','per_unit','milestone','open')),
  -- A pilot nobody sized is not a pilot.
  CONSTRAINT request_pilot_shape CHECK (NOT pilot_required OR pilot_quantity IS NOT NULL),
  CONSTRAINT request_close_before_delivery CHECK (
    proposals_close_at IS NULL OR delivery_due_on IS NULL
    OR (proposals_close_at AT TIME ZONE 'UTC')::date <= delivery_due_on)
);

CREATE INDEX request_client_idx  ON request (client_org_id) WHERE deleted_at IS NULL;
CREATE INDEX request_status_idx  ON request (status) WHERE deleted_at IS NULL;
-- the tenant's opportunities board
CREATE INDEX request_open_idx    ON request (published_at DESC)
  WHERE status IN ('published','proposals_received') AND deleted_at IS NULL;
CREATE INDEX request_title_trgm_idx ON request USING gin (title gin_trgm_ops);
-- the sweep for requests whose bidding window has closed
CREATE INDEX request_close_idx ON request (proposals_close_at)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE TRIGGER request_updated_at BEFORE UPDATE ON request
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- proposal — a tenant's bid. Immutable once submitted (blueprint).
--
-- The prototype enforces one bid per tenant per request in the UI:
--   already = state.proposals.some(p => p.rfpId === r.id && p.tenantId === me().id)
-- Here it is a unique index, so a double-submit race cannot create two.
-- ---------------------------------------------------------------------------
CREATE TABLE proposal (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  text UNIQUE NOT NULL,      -- PRO-01
  request_id      uuid NOT NULL REFERENCES request(id) ON DELETE RESTRICT,
  partner_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  price           numeric(14,2) NOT NULL CHECK (price >= 0),
  currency        char(3) NOT NULL DEFAULT 'USD',
  duration_days   integer NOT NULL CHECK (duration_days > 0),
  methodology     text NOT NULL,
  notes           text,

  status          proposal_status NOT NULL DEFAULT 'submitted',
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  decided_at      timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES app_user(id),
  updated_by      uuid REFERENCES app_user(id),
  deleted_at      timestamptz,

  -- Per-unit bidding, for a request that asked for pricing_model 'per_unit'.
  -- After deleted_at for the pg_attribute-order reason given on request.
  -- price stays NOT NULL and authoritative: nothing yet computes one from the
  -- other, and no deployed proposal populates these.
  unit_price      numeric CHECK (unit_price IS NULL OR unit_price >= 0),
  unit            text
);

CREATE UNIQUE INDEX proposal_one_per_partner_key
  ON proposal (request_id, partner_org_id) WHERE deleted_at IS NULL;
CREATE INDEX proposal_request_idx ON proposal (request_id) WHERE deleted_at IS NULL;
CREATE INDEX proposal_partner_idx ON proposal (partner_org_id) WHERE deleted_at IS NULL;
-- at most one accepted proposal per request
CREATE UNIQUE INDEX proposal_single_winner_key
  ON proposal (request_id) WHERE status = 'accepted' AND deleted_at IS NULL;

CREATE TRIGGER proposal_updated_at BEFORE UPDATE ON proposal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- The prototype's named network resources on a bid: "820-strong Bengaluru crowd
-- plus Vertex crews". Modelled so a client can see who would actually do the
-- work before awarding, and so residency can be checked at award time.
-- ---------------------------------------------------------------------------
CREATE TABLE proposal_resource (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid NOT NULL REFERENCES proposal(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  role_note    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, org_id)
);

-- ---------------------------------------------------------------------------
-- request_sample used to live here: sample files a client attached while
-- drafting, so partners could gauge the work before bidding. It is gone. The
-- polymorphic attachment table (db/095) does the same job for every entity,
-- and a client's sample files are now attachment rows with entity_type
-- 'request' and slot 'capture_examples' or 'guidelines'.
--
-- The rows were carried over rather than dropped, storage_key untouched, so
-- files uploaded under the old scheme are still reachable at the key they were
-- written to. See backend/migrations/versions/0010_request_intake.py.
-- ---------------------------------------------------------------------------
