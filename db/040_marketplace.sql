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

  -- spec
  spec_format       text,
  spec_quantity     text,
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

  published_at      timestamptz,
  closed_at         timestamptz,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES app_user(id),
  updated_by        uuid REFERENCES app_user(id),
  deleted_at        timestamptz,

  CONSTRAINT request_budget_order   CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min),
  CONSTRAINT request_timeline_order CHECK (delivery_due_on IS NULL OR starts_on IS NULL OR delivery_due_on >= starts_on)
);

CREATE INDEX request_client_idx  ON request (client_org_id) WHERE deleted_at IS NULL;
CREATE INDEX request_status_idx  ON request (status) WHERE deleted_at IS NULL;
-- the tenant's opportunities board
CREATE INDEX request_open_idx    ON request (published_at DESC)
  WHERE status IN ('published','proposals_received') AND deleted_at IS NULL;
CREATE INDEX request_title_trgm_idx ON request USING gin (title gin_trgm_ops);

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
  deleted_at      timestamptz
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
-- request_sample — optional sample files a client attaches while drafting a
-- request, so partners can gauge the work before proposing. Object storage
-- holds the bytes (bucket sourcehub-documents, presigned URLs); this row is
-- the pointer and the audit trail. Append-only: no update, no delete.
-- ---------------------------------------------------------------------------
CREATE TABLE request_sample (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid NOT NULL REFERENCES request(id) ON DELETE CASCADE,
  filename      text NOT NULL,
  storage_key   text NOT NULL UNIQUE,        -- object storage key, never the bytes
  content_type  text,
  size_bytes    bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),  -- 25 MiB
  uploaded_by   uuid REFERENCES app_user(id),
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX request_sample_request_idx ON request_sample (request_id);
