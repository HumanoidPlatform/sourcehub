"""The dataset catalogue: listings, versions, files, deals, licences, leads.

datahub_dataset, datahub_dataset_version, datahub_dataset_item,
datahub_dataset_deal, datahub_dataset_licence, datahub_lead (every marketplace
object carries the datahub_ prefix) and user_consent, their triggers, definer
helpers and the
public read functions; request.partner_reuse_allowed now defaults to true
(not exclusive) for new requests.

Purely additive apart from that default, which changes no existing row.

SQL copied verbatim from db/350_catalogue.sql so the bootstrap and migration
paths keep producing identical schemas; a test asserts the two stay
byte-identical. The capability rows ride in _SEED, because STRUCTURE runs
before SEED on a fresh build.

Executed one statement at a time, with the splitter 0025 onwards use, because
asyncpg refuses two statements in one execute.

Revision ID: 0038
Revises: 0037
"""

from alembic import op

revision = "0038"
down_revision = "0037"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 350 · The dataset catalogue
--
-- Beside the RFP marketplace, where a client orders data that does not exist
-- yet, the catalogue sells data that does. Research and rationale:
-- docs/research/data-marketplace/decisions.md.
--
-- Every table, function and policy of the data marketplace carries the
-- datahub_ prefix. user_consent does not: it records any notice a person
-- accepts, and the marketplace is only its first reader.
--
--   datahub_dataset          a listing, owned by the organisation that sells
--                            it. Two ways in: uploaded by its owner (a delivery
--                            partner's or an aggregator's own data, or a
--                            client's exclusive data it now wants to sell), or
--                            relisted from a delivered contract whose request
--                            was not exclusive (owner: the delivery partner).
--   datahub_dataset_version  what a buyer is entitled to. Open while the owner
--                            fills it; final, and immutable, once Ops publishes.
--   datahub_dataset_item     one file, in SourceHub's own storage. Relisted
--                            items are COPIES out of the client's bucket, made
--                            only for captures whose worker had accepted the
--                            resale notice beforehand.
--   datahub_dataset_deal     a buyer asks, the seller quotes, the buyer accepts.
--   datahub_dataset_licence  what accepting issues. Awaiting payment until the
--                            seller marks its invoice paid; then the buyer may
--                            download.
--   datahub_lead             a quote request from someone without an account,
--                            taken from the public catalogue page.
--   user_consent             the server's copy of a notice a person accepted.
--                            The phone has kept these locally since the privacy
--                            notice (mobile/src/consent.ts); the catalogue asks,
--                            at relisting time, whether a capture's worker had
--                            agreed.
--
-- Nothing reaches a buyer, or the public, until Ops publishes it: the
-- transition trigger refuses publish and reject to anyone else. The platform
-- takes no part in the money (db/320); a licence records what the seller
-- invoiced and when the seller said it was paid.
--
-- Copied columns (owner_org_id, dataset_id) are there so policies are column
-- compares, as capture_batch does.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · Listings
-- ---------------------------------------------------------------------------
CREATE TABLE datahub_dataset (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id          uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  source                text NOT NULL CHECK (source IN ('upload', 'contract')),
  contract_id           uuid REFERENCES contract(id) ON DELETE RESTRICT,
  slug                  text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  title                 text NOT NULL CHECK (length(btrim(title)) > 0),
  summary               text,
  description           text,
  category              request_category,
  use_cases             text[] NOT NULL DEFAULT '{}',
  regions               text[] NOT NULL DEFAULT '{}',
  languages             text[] NOT NULL DEFAULT '{}',
  permitted_uses        text[] NOT NULL DEFAULT '{}'
                          CHECK (permitted_uses <@ ARRAY['model_training','internal_analysis','research','audit','publication']),
  -- The seller's own words. The platform drafts no licence text.
  licence_terms         text,
  indicative_price_text text,

  status                text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','in_review','published','rejected','withdrawn')),
  submitted_at          timestamptz,
  review_note           text,
  reviewed_by           uuid REFERENCES app_user(id) ON DELETE SET NULL,
  reviewed_at           timestamptz,
  published_at          timestamptz,
  withdrawn_at          timestamptz,
  withdrawn_reason      text,

  created_by            uuid REFERENCES app_user(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT datahub_dataset_source_shape CHECK (
    (source = 'contract') = (contract_id IS NOT NULL)
  ),
  CONSTRAINT datahub_dataset_published_shape CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

-- one relisting per contract
CREATE UNIQUE INDEX datahub_dataset_contract_key ON datahub_dataset (contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX datahub_dataset_owner_idx     ON datahub_dataset (owner_org_id);
CREATE INDEX datahub_dataset_published_idx ON datahub_dataset (published_at DESC) WHERE status = 'published';
CREATE INDEX datahub_dataset_review_idx    ON datahub_dataset (submitted_at) WHERE status = 'in_review';

CREATE TRIGGER datahub_dataset_updated_at BEFORE UPDATE ON datahub_dataset
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Who may move a listing where. The owner drafts, submits, pulls back and
-- withdraws; only Ops publishes or rejects. Enforced here rather than trusted
-- to the API, because publishing is the one step that makes data public.
CREATE OR REPLACE FUNCTION datahub_dataset_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.status = OLD.status THEN
    -- Edits. A published listing's text is what buyers licensed against, and
    -- one in review is what Ops is reading; only the owner's draft (or a
    -- rejected one) is freely editable. The price note stays editable.
    IF OLD.status IN ('in_review', 'published', 'withdrawn') AND NOT is_platform_admin()
       AND (NEW.title, NEW.summary, NEW.description, NEW.licence_terms, NEW.permitted_uses)
           IS DISTINCT FROM
           (OLD.title, OLD.summary, OLD.description, OLD.licence_terms, OLD.permitted_uses) THEN
      RAISE EXCEPTION 'dataset %: a published listing cannot be edited', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF (OLD.status, NEW.status) IN (('draft','in_review'), ('rejected','in_review')) THEN
    NEW.submitted_at := now();
    NEW.review_note  := NULL;
  ELSIF (OLD.status, NEW.status) IN (('in_review','draft'), ('rejected','draft')) THEN
    NULL;
  ELSIF (OLD.status, NEW.status) IN (('in_review','published'), ('in_review','rejected')) THEN
    IF NOT is_platform_admin() THEN
      RAISE EXCEPTION 'dataset %: only operations publishes or rejects a listing', OLD.id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.reviewed_by := current_user_id();
    NEW.reviewed_at := now();
    IF NEW.status = 'published' THEN
      NEW.published_at := coalesce(OLD.published_at, now());
    END IF;
  ELSIF (OLD.status, NEW.status) = ('published','withdrawn') THEN
    NEW.withdrawn_at := now();
  ELSE
    RAISE EXCEPTION 'dataset %: cannot move from % to %', OLD.id, OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER datahub_dataset_transition BEFORE UPDATE ON datahub_dataset
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_transition();

-- ---------------------------------------------------------------------------
-- 2 · Versions and files
-- ---------------------------------------------------------------------------
CREATE TABLE datahub_dataset_version (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id    uuid NOT NULL REFERENCES datahub_dataset(id) ON DELETE RESTRICT,
  owner_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  number        integer NOT NULL CHECK (number > 0),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','final')),
  item_count    integer NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  total_bytes   bigint  NOT NULL DEFAULT 0 CHECK (total_bytes >= 0),
  -- what relisting left out, and why; shown to the owner
  notes         text,
  finalized_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT datahub_dataset_version_number_key UNIQUE (dataset_id, number),
  CONSTRAINT datahub_dataset_version_final_shape CHECK (status <> 'final' OR finalized_at IS NOT NULL)
);

CREATE TRIGGER datahub_dataset_version_updated_at BEFORE UPDATE ON datahub_dataset_version
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION datahub_dataset_version_freeze() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD.status = 'final' AND (NEW.status <> 'final' OR NEW.item_count <> OLD.item_count
                               OR NEW.total_bytes <> OLD.total_bytes) THEN
    RAISE EXCEPTION 'dataset version %: a final version cannot change', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER datahub_dataset_version_freeze BEFORE UPDATE ON datahub_dataset_version
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_version_freeze();

CREATE TABLE datahub_dataset_item (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id           uuid NOT NULL REFERENCES datahub_dataset_version(id) ON DELETE RESTRICT,
  dataset_id           uuid NOT NULL REFERENCES datahub_dataset(id) ON DELETE RESTRICT,
  owner_org_id         uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  -- in SourceHub's own storage (platform_target), never a client's bucket
  storage_key          text NOT NULL,
  filename             text NOT NULL,
  mime_type            text,
  size_bytes           bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  sha256               text,
  is_sample            boolean NOT NULL DEFAULT false,

  -- provenance of a relisted capture. No FK: asset is partitioned. Where the
  -- copy sweep reads it from: the client's bucket the capture was written to.
  source_asset_id      uuid,
  source_storage_key   text,
  source_storage_target_id uuid REFERENCES storage_target(id) ON DELETE SET NULL,
  captured_at          timestamptz,
  captured_by_user_id  uuid REFERENCES app_user(id) ON DELETE SET NULL,
  check_summary        jsonb NOT NULL DEFAULT '{}',

  -- relisted items start pending and the copy sweep fills them; uploads are
  -- recorded once the upload is confirmed, so they start copied
  copy_status          text NOT NULL DEFAULT 'copied' CHECK (copy_status IN ('pending','copied','failed')),
  copy_error           text,

  withdrawn_at         timestamptz,
  withdrawn_reason     text,
  withdrawn_by         uuid REFERENCES app_user(id) ON DELETE SET NULL,

  created_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT datahub_dataset_item_key UNIQUE (version_id, storage_key),
  CONSTRAINT datahub_dataset_item_withdrawn_shape CHECK (
    (withdrawn_at IS NULL) = (withdrawn_reason IS NULL)
  )
);

CREATE INDEX datahub_dataset_item_version_idx ON datahub_dataset_item (version_id);
CREATE INDEX datahub_dataset_item_pending_idx ON datahub_dataset_item (created_at) WHERE copy_status = 'pending';
CREATE UNIQUE INDEX datahub_dataset_item_source_key ON datahub_dataset_item (version_id, source_asset_id)
  WHERE source_asset_id IS NOT NULL;

-- A final version's files are what buyers licensed. Once final, the only
-- change is withdrawing a file, which keeps its row and says why.
CREATE OR REPLACE FUNCTION datahub_dataset_item_freeze() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v datahub_dataset_version%ROWTYPE;
BEGIN
  SELECT * INTO v FROM datahub_dataset_version
   WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.version_id ELSE NEW.version_id END;
  -- the copied columns must agree with the version they hang off
  IF TG_OP = 'INSERT' AND (v.dataset_id IS DISTINCT FROM NEW.dataset_id
                           OR v.owner_org_id IS DISTINCT FROM NEW.owner_org_id) THEN
    RAISE EXCEPTION 'dataset item: version, dataset and owner do not agree'
      USING ERRCODE = 'check_violation';
  END IF;
  IF v.status = 'final' THEN
    IF TG_OP <> 'UPDATE'
       OR (to_jsonb(NEW) - ARRAY['withdrawn_at','withdrawn_reason','withdrawn_by'])
          IS DISTINCT FROM
          (to_jsonb(OLD) - ARRAY['withdrawn_at','withdrawn_reason','withdrawn_by'])
       OR OLD.withdrawn_at IS NOT NULL THEN
      RAISE EXCEPTION 'dataset version is final: its files cannot change, only be withdrawn'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$fn$;

CREATE TRIGGER datahub_dataset_item_freeze BEFORE INSERT OR UPDATE OR DELETE ON datahub_dataset_item
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_item_freeze();

-- ---------------------------------------------------------------------------
-- 3 · Deals and licences
-- ---------------------------------------------------------------------------
CREATE TABLE datahub_dataset_deal (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id      uuid NOT NULL REFERENCES datahub_dataset(id) ON DELETE RESTRICT,
  version_id      uuid NOT NULL REFERENCES datahub_dataset_version(id) ON DELETE RESTRICT,
  buyer_org_id    uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  seller_org_id   uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  requested_by    uuid REFERENCES app_user(id) ON DELETE SET NULL,

  intended_use    text NOT NULL CHECK (length(btrim(intended_use)) > 0),
  requested_uses  text[] NOT NULL DEFAULT '{}'
                    CHECK (requested_uses <@ ARRAY['model_training','internal_analysis','research','audit','publication']),
  message         text,

  status          text NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','quoted','accepted','declined','withdrawn')),
  quote_amount    numeric(14,2) CHECK (quote_amount IS NULL OR quote_amount >= 0),
  currency        char(3) CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  quote_terms     text,
  quote_uses      text[] NOT NULL DEFAULT '{}'
                    CHECK (quote_uses <@ ARRAY['model_training','internal_analysis','research','audit','publication']),
  quoted_by       uuid REFERENCES app_user(id) ON DELETE SET NULL,
  quoted_at       timestamptz,
  decided_by      uuid REFERENCES app_user(id) ON DELETE SET NULL,
  decided_at      timestamptz,
  decision_note   text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT datahub_dataset_deal_not_own CHECK (buyer_org_id <> seller_org_id),
  CONSTRAINT datahub_dataset_deal_quoted_shape CHECK (
    status NOT IN ('quoted','accepted')
    OR (quote_amount IS NOT NULL AND currency IS NOT NULL AND quoted_at IS NOT NULL)
  )
);

CREATE INDEX datahub_dataset_deal_buyer_idx  ON datahub_dataset_deal (buyer_org_id, created_at DESC);
CREATE INDEX datahub_dataset_deal_seller_idx ON datahub_dataset_deal (seller_org_id, created_at DESC);
-- one live conversation per buyer and version
CREATE UNIQUE INDEX datahub_dataset_deal_open_key ON datahub_dataset_deal (buyer_org_id, version_id)
  WHERE status IN ('requested','quoted');

CREATE TRIGGER datahub_dataset_deal_updated_at BEFORE UPDATE ON datahub_dataset_deal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The seller and version come from the listing, not the buyer's request.
CREATE OR REPLACE FUNCTION datahub_dataset_deal_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_owner  uuid;
  v_status text;
BEGIN
  SELECT d.owner_org_id, d.status INTO v_owner, v_status
    FROM datahub_dataset d JOIN datahub_dataset_version v ON v.dataset_id = d.id
   WHERE d.id = NEW.dataset_id AND v.id = NEW.version_id AND v.status = 'final';
  IF v_owner IS NULL OR v_status <> 'published' THEN
    RAISE EXCEPTION 'dataset deal: that version is not on sale'
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.seller_org_id := v_owner;
  NEW.status        := 'requested';
  NEW.quote_amount  := NULL;
  NEW.quoted_at     := NULL;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER datahub_dataset_deal_before_insert BEFORE INSERT ON datahub_dataset_deal
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_deal_before_insert();

-- The seller quotes and declines; the buyer accepts and withdraws.
CREATE OR REPLACE FUNCTION datahub_dataset_deal_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  -- IS NOT DISTINCT FROM, so no org context reads as false, not NULL
  v_seller boolean := (current_org_id() IS NOT DISTINCT FROM OLD.seller_org_id);
  v_buyer  boolean := (current_org_id() IS NOT DISTINCT FROM OLD.buyer_org_id);
BEGIN
  IF (OLD.status, NEW.status) IN (('requested','quoted'), ('quoted','quoted')) THEN
    IF NOT v_seller THEN
      RAISE EXCEPTION 'dataset deal %: only the seller quotes', OLD.id USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.quoted_by := current_user_id();
    NEW.quoted_at := now();
  ELSIF (OLD.status, NEW.status) IN (('requested','declined'), ('quoted','declined')) THEN
    IF NOT v_seller THEN
      RAISE EXCEPTION 'dataset deal %: only the seller declines', OLD.id USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.decided_by := current_user_id();
    NEW.decided_at := now();
  ELSIF (OLD.status, NEW.status) = ('quoted','accepted') THEN
    IF NOT v_buyer THEN
      RAISE EXCEPTION 'dataset deal %: only the buyer accepts', OLD.id USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF (NEW.quote_amount, NEW.currency, NEW.quote_terms, NEW.quote_uses)
       IS DISTINCT FROM (OLD.quote_amount, OLD.currency, OLD.quote_terms, OLD.quote_uses) THEN
      RAISE EXCEPTION 'dataset deal %: a quote is accepted as given', OLD.id USING ERRCODE = 'check_violation';
    END IF;
    NEW.decided_by := current_user_id();
    NEW.decided_at := now();
  ELSIF (OLD.status, NEW.status) IN (('requested','withdrawn'), ('quoted','withdrawn')) THEN
    IF NOT v_buyer THEN
      RAISE EXCEPTION 'dataset deal %: only the buyer withdraws', OLD.id USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.decided_by := current_user_id();
    NEW.decided_at := now();
  ELSE
    RAISE EXCEPTION 'dataset deal %: cannot move from % to %', OLD.id, OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER datahub_dataset_deal_transition BEFORE UPDATE ON datahub_dataset_deal
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_deal_transition();

CREATE TABLE datahub_dataset_licence (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id          uuid NOT NULL UNIQUE REFERENCES datahub_dataset_deal(id) ON DELETE RESTRICT,
  dataset_id       uuid NOT NULL REFERENCES datahub_dataset(id) ON DELETE RESTRICT,
  version_id       uuid NOT NULL REFERENCES datahub_dataset_version(id) ON DELETE RESTRICT,
  buyer_org_id     uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  seller_org_id    uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  permitted_uses   text[] NOT NULL DEFAULT '{}',
  terms_snapshot   text,
  amount           numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency         char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),

  status           text NOT NULL DEFAULT 'awaiting_payment'
                     CHECK (status IN ('awaiting_payment','active','revoked')),
  invoice_number   text,
  paid_marked_by   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  paid_at          timestamptz,
  revoked_at       timestamptz,
  revoked_reason   text,

  issued_at        timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT datahub_dataset_licence_active_shape CHECK (status <> 'active' OR paid_at IS NOT NULL)
);

CREATE INDEX datahub_dataset_licence_buyer_idx   ON datahub_dataset_licence (buyer_org_id);
CREATE INDEX datahub_dataset_licence_seller_idx  ON datahub_dataset_licence (seller_org_id);
CREATE INDEX datahub_dataset_licence_version_idx ON datahub_dataset_licence (version_id) WHERE status = 'active';

CREATE TRIGGER datahub_dataset_licence_updated_at BEFORE UPDATE ON datahub_dataset_licence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Every term comes off the accepted deal. The buyer's session inserts the
-- licence as it accepts, and must not be able to name its own price.
CREATE OR REPLACE FUNCTION datahub_dataset_licence_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  d datahub_dataset_deal%ROWTYPE;
BEGIN
  SELECT * INTO d FROM datahub_dataset_deal WHERE id = NEW.deal_id;
  IF d.id IS NULL OR d.status <> 'accepted' THEN
    RAISE EXCEPTION 'dataset licence: the deal has not been accepted' USING ERRCODE = 'check_violation';
  END IF;
  NEW.dataset_id     := d.dataset_id;
  NEW.version_id     := d.version_id;
  NEW.buyer_org_id   := d.buyer_org_id;
  NEW.seller_org_id  := d.seller_org_id;
  NEW.permitted_uses := d.quote_uses;
  NEW.terms_snapshot := d.quote_terms;
  NEW.amount         := d.quote_amount;
  NEW.currency       := d.currency;
  NEW.status         := 'awaiting_payment';
  NEW.paid_at        := NULL;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER datahub_dataset_licence_before_insert BEFORE INSERT ON datahub_dataset_licence
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_licence_before_insert();

-- The seller marks it paid (or revokes it); Ops may revoke.
CREATE OR REPLACE FUNCTION datahub_dataset_licence_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF (NEW.amount, NEW.currency, NEW.permitted_uses, NEW.terms_snapshot, NEW.version_id, NEW.buyer_org_id)
     IS DISTINCT FROM
     (OLD.amount, OLD.currency, OLD.permitted_uses, OLD.terms_snapshot, OLD.version_id, OLD.buyer_org_id) THEN
    RAISE EXCEPTION 'dataset licence %: its terms are fixed', OLD.id USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF (OLD.status, NEW.status) = ('awaiting_payment','active') THEN
    IF current_org_id() IS DISTINCT FROM OLD.seller_org_id THEN
      RAISE EXCEPTION 'dataset licence %: only the seller marks it paid', OLD.id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.paid_marked_by := current_user_id();
    NEW.paid_at        := now();
  ELSIF NEW.status = 'revoked' AND OLD.status IN ('awaiting_payment','active') THEN
    IF NOT (is_platform_admin() OR current_org_id() IS NOT DISTINCT FROM OLD.seller_org_id) THEN
      RAISE EXCEPTION 'dataset licence %: only the seller or operations revokes it', OLD.id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.revoked_at := now();
  ELSE
    RAISE EXCEPTION 'dataset licence %: cannot move from % to %', OLD.id, OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER datahub_dataset_licence_transition BEFORE UPDATE ON datahub_dataset_licence
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_licence_transition();

-- ---------------------------------------------------------------------------
-- 4 · Leads from the public page
-- ---------------------------------------------------------------------------
CREATE TABLE datahub_lead (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id    uuid NOT NULL REFERENCES datahub_dataset(id) ON DELETE RESTRICT,
  name          text NOT NULL CHECK (length(btrim(name)) > 0),
  email         citext NOT NULL CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  company       text NOT NULL CHECK (length(btrim(company)) > 0),
  intended_use  text NOT NULL CHECK (length(btrim(intended_use)) > 0),
  message       text,
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  handled_by    uuid REFERENCES app_user(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX datahub_lead_new_idx ON datahub_lead (created_at DESC) WHERE status = 'new';

CREATE TRIGGER datahub_lead_updated_at BEFORE UPDATE ON datahub_lead
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 5 · Notices a person accepted
-- ---------------------------------------------------------------------------
CREATE TABLE user_consent (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  document     text NOT NULL CHECK (document IN ('worker_privacy_notice')),
  version      integer NOT NULL CHECK (version > 0),
  accepted_at  timestamptz NOT NULL DEFAULT now(),
  app_version  text,
  platform     text,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_consent_key UNIQUE (user_id, document, version)
);

-- The worker privacy notice from this version on says captures may be resold
-- in the catalogue (mobile/src/consent.ts PRIVACY_NOTICE_VERSION).
COMMENT ON TABLE user_consent IS
  'Notices a person accepted. worker_privacy_notice >= 2 includes resale in the dataset catalogue.';

-- ---------------------------------------------------------------------------
-- 6 · Definer helpers. Policies on one catalogue table that ask about another
--     would re-enter that table's policies; these run as the owner.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION datahub_dataset_owner(p_dataset_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT owner_org_id FROM datahub_dataset WHERE id = p_dataset_id
$fn$;

CREATE OR REPLACE FUNCTION datahub_dataset_on_sale(p_dataset_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM datahub_dataset d WHERE d.id = p_dataset_id AND d.status = 'published')
$fn$;

-- Does the current org hold a licence on this dataset (any state)?
CREATE OR REPLACE FUNCTION datahub_dataset_licensed(p_dataset_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM datahub_dataset_licence l
                  WHERE l.dataset_id = p_dataset_id AND l.buyer_org_id = current_org_id())
$fn$;

-- Does the current org hold an ACTIVE licence on this version?
CREATE OR REPLACE FUNCTION datahub_version_licensed(p_version_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM datahub_dataset_licence l
                  WHERE l.version_id = p_version_id AND l.buyer_org_id = current_org_id()
                    AND l.status = 'active')
$fn$;

CREATE OR REPLACE FUNCTION datahub_version_final(p_version_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM datahub_dataset_version v WHERE v.id = p_version_id AND v.status = 'final')
$fn$;

-- What relisting a delivered contract may copy: its accepted captures, each
-- with whether its worker had accepted the resale notice before capturing
-- it. Only the contract's delivery partner gets an answer.
CREATE OR REPLACE FUNCTION datahub_relist_candidates(p_contract_id uuid)
RETURNS TABLE (
  asset_id uuid, storage_key text, storage_target_id uuid, filename text,
  mime_type text, size_bytes bigint, sha256 text, captured_at timestamptz,
  captured_by_user_id uuid, check_results jsonb, resale_consented boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT s.id, s.storage_key, s.storage_target_id, s.filename,
         s.mime_type, s.size_bytes, s.sha256, s.captured_at,
         s.captured_by_user_id, s.check_results,
         EXISTS (SELECT 1 FROM user_consent c
                  WHERE c.user_id = s.captured_by_user_id
                    AND c.document = 'worker_privacy_notice' AND c.version >= 2
                    AND c.accepted_at <= coalesce(s.captured_at, s.created_at))
  FROM   asset s
  JOIN   contract k ON k.id = s.contract_id
  WHERE  s.contract_id = p_contract_id
    AND  k.partner_org_id = current_org_id()
    AND  s.status = 'ready'
    AND  s.deleted_at IS NULL
    AND  NOT EXISTS (SELECT 1 FROM asset r
                      WHERE r.replaces_asset_id = s.id AND r.deleted_at IS NULL
                        AND r.status = 'ready')
$fn$;

-- Which owners have relisted files still to copy. The sweep has no org of
-- its own; it opens one session per owner from this list.
CREATE OR REPLACE FUNCTION datahub_copy_owners() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT DISTINCT owner_org_id FROM datahub_dataset_item WHERE copy_status = 'pending'
$fn$;

-- ---------------------------------------------------------------------------
-- 7 · The public catalogue. No session, no org: these are the only reads, and
--     they answer for published listings and their sample files only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION datahub_public_list()
RETURNS TABLE (
  id uuid, slug text, title text, summary text, category request_category,
  use_cases text[], regions text[], languages text[], permitted_uses text[],
  indicative_price_text text, seller_name text, version_number integer,
  item_count integer, total_bytes bigint, sample_count integer, published_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT d.id, d.slug, d.title, d.summary, d.category,
         d.use_cases, d.regions, d.languages, d.permitted_uses,
         d.indicative_price_text, o.name, v.number,
         v.item_count, v.total_bytes,
         (SELECT count(*)::integer FROM datahub_dataset_item i
           WHERE i.version_id = v.id AND i.is_sample AND i.withdrawn_at IS NULL),
         d.published_at
  FROM   datahub_dataset d
  JOIN   organisation o ON o.id = d.owner_org_id
  JOIN LATERAL (SELECT * FROM datahub_dataset_version v
                 WHERE v.dataset_id = d.id AND v.status = 'final'
                 ORDER BY v.number DESC LIMIT 1) v ON true
  WHERE  d.status = 'published'
  ORDER  BY d.published_at DESC
$fn$;

CREATE OR REPLACE FUNCTION datahub_public_dataset(p_slug text)
RETURNS TABLE (
  id uuid, slug text, title text, summary text, description text, category request_category,
  use_cases text[], regions text[], languages text[], permitted_uses text[],
  licence_terms text, indicative_price_text text, seller_name text, source text,
  version_id uuid, version_number integer, item_count integer, total_bytes bigint,
  published_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT d.id, d.slug, d.title, d.summary, d.description, d.category,
         d.use_cases, d.regions, d.languages, d.permitted_uses,
         d.licence_terms, d.indicative_price_text, o.name, d.source,
         v.id, v.number, v.item_count, v.total_bytes, d.published_at
  FROM   datahub_dataset d
  JOIN   organisation o ON o.id = d.owner_org_id
  JOIN LATERAL (SELECT * FROM datahub_dataset_version v
                 WHERE v.dataset_id = d.id AND v.status = 'final'
                 ORDER BY v.number DESC LIMIT 1) v ON true
  WHERE  d.slug = p_slug AND d.status = 'published'
$fn$;

-- storage_key is returned so the API can sign a URL; the API never passes it on.
CREATE OR REPLACE FUNCTION datahub_public_samples(p_slug text)
RETURNS TABLE (id uuid, storage_key text, filename text, mime_type text, size_bytes bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT i.id, i.storage_key, i.filename, i.mime_type, i.size_bytes
  FROM   datahub_dataset d
  JOIN LATERAL (SELECT * FROM datahub_dataset_version v
                 WHERE v.dataset_id = d.id AND v.status = 'final'
                 ORDER BY v.number DESC LIMIT 1) v ON true
  JOIN   datahub_dataset_item i ON i.version_id = v.id
  WHERE  d.slug = p_slug AND d.status = 'published'
    AND  i.is_sample AND i.withdrawn_at IS NULL AND i.copy_status = 'copied'
  ORDER  BY i.filename
$fn$;

-- The one write without a session. It answers only for a published listing.
CREATE OR REPLACE FUNCTION datahub_lead_create(
  p_slug text, p_name text, p_email text, p_company text, p_intended_use text, p_message text
) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_dataset uuid;
  v_id      uuid;
BEGIN
  SELECT id INTO v_dataset FROM datahub_dataset WHERE slug = p_slug AND status = 'published';
  IF v_dataset IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO datahub_lead (dataset_id, name, email, company, intended_use, message)
  VALUES (v_dataset, btrim(p_name), btrim(p_email), btrim(p_company), btrim(p_intended_use),
          nullif(btrim(coalesce(p_message, '')), ''))
  RETURNING id INTO v_id;
  -- Ops' bell. There is no session to notify from, so it is done here.
  INSERT INTO notification (org_id, body, link_page, link_params)
  SELECT o.id,
         'A quote request from ' || btrim(p_company) || ' came in through the public catalogue.',
         'catalogue_review', jsonb_build_object('lead', v_id)
  FROM   organisation o WHERE o.kind = 'platform';
  RETURN v_id;
END
$fn$;

-- Quoted with the function-body tag, not a DO tag of its own: the migration's
-- statement splitter recognises only that one.
DO $fn$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'datahub_dataset_owner(uuid)',
    'datahub_dataset_on_sale(uuid)', 'datahub_dataset_licensed(uuid)',
    'datahub_version_licensed(uuid)', 'datahub_version_final(uuid)',
    'datahub_relist_candidates(uuid)', 'datahub_copy_owners()',
    'datahub_public_list()', 'datahub_public_dataset(text)', 'datahub_public_samples(text)',
    'datahub_lead_create(text, text, text, text, text, text)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO sourcehub_app', f);
  END LOOP;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 8 · Row-level security. ENABLE, never FORCE (db/270). Every read policy is
--     FOR SELECT; every write has its own.
-- ---------------------------------------------------------------------------
ALTER TABLE datahub_dataset         ENABLE ROW LEVEL SECURITY;
ALTER TABLE datahub_dataset_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE datahub_dataset_item    ENABLE ROW LEVEL SECURITY;
ALTER TABLE datahub_dataset_deal    ENABLE ROW LEVEL SECURITY;
ALTER TABLE datahub_dataset_licence ENABLE ROW LEVEL SECURITY;
ALTER TABLE datahub_lead  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent    ENABLE ROW LEVEL SECURITY;

-- dataset: on sale to every signed-in organisation; the owner's and Ops'
-- always; a licence holder keeps seeing what it bought after a withdrawal.
CREATE POLICY datahub_dataset_select ON datahub_dataset FOR SELECT
  USING (
       is_platform_admin()
    OR owner_org_id = current_org_id()
    OR (status = 'published' AND current_org_id() IS NOT NULL)
    OR datahub_dataset_licensed(id)
  );
CREATE POLICY datahub_dataset_insert ON datahub_dataset FOR INSERT
  WITH CHECK (
    owner_org_id = current_org_id()
    AND status = 'draft'
    AND current_org_kind() IN ('tenant','aggregator','client')
    AND (contract_id IS NULL OR contract_is_mine_as_partner(contract_id))
  );
CREATE POLICY datahub_dataset_update ON datahub_dataset FOR UPDATE
  USING      (is_platform_admin() OR owner_org_id = current_org_id())
  WITH CHECK (is_platform_admin() OR owner_org_id = current_org_id());
CREATE POLICY datahub_dataset_worker_deny ON datahub_dataset AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

CREATE POLICY datahub_dataset_version_select ON datahub_dataset_version FOR SELECT
  USING (
       is_platform_admin()
    OR owner_org_id = current_org_id()
    OR (status = 'final' AND current_org_id() IS NOT NULL AND datahub_dataset_on_sale(dataset_id))
    OR datahub_dataset_licensed(dataset_id)
  );
CREATE POLICY datahub_dataset_version_insert ON datahub_dataset_version FOR INSERT
  WITH CHECK (owner_org_id = current_org_id() AND status = 'open'
              AND datahub_dataset_owner(dataset_id) = current_org_id());
CREATE POLICY datahub_dataset_version_update ON datahub_dataset_version FOR UPDATE
  USING      (is_platform_admin() OR owner_org_id = current_org_id())
  WITH CHECK (is_platform_admin() OR owner_org_id = current_org_id());
CREATE POLICY datahub_dataset_version_worker_deny ON datahub_dataset_version AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

-- datahub_dataset_item: samples of what is on sale; everything to the owner, Ops, and
-- an organisation holding an active licence on the version.
CREATE POLICY datahub_dataset_item_select ON datahub_dataset_item FOR SELECT
  USING (
       is_platform_admin()
    OR owner_org_id = current_org_id()
    OR (is_sample AND current_org_id() IS NOT NULL
        AND datahub_version_final(version_id) AND datahub_dataset_on_sale(dataset_id))
    OR datahub_version_licensed(version_id)
  );
CREATE POLICY datahub_dataset_item_insert ON datahub_dataset_item FOR INSERT
  WITH CHECK (owner_org_id = current_org_id());
CREATE POLICY datahub_dataset_item_update ON datahub_dataset_item FOR UPDATE
  USING      (is_platform_admin() OR owner_org_id = current_org_id())
  WITH CHECK (is_platform_admin() OR owner_org_id = current_org_id());
CREATE POLICY datahub_dataset_item_delete ON datahub_dataset_item FOR DELETE
  USING (owner_org_id = current_org_id());
CREATE POLICY datahub_dataset_item_worker_deny ON datahub_dataset_item AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

CREATE POLICY datahub_dataset_deal_select ON datahub_dataset_deal FOR SELECT
  USING (is_platform_admin() OR buyer_org_id = current_org_id() OR seller_org_id = current_org_id());
CREATE POLICY datahub_dataset_deal_insert ON datahub_dataset_deal FOR INSERT
  WITH CHECK (buyer_org_id = current_org_id());
CREATE POLICY datahub_dataset_deal_update ON datahub_dataset_deal FOR UPDATE
  USING      (buyer_org_id = current_org_id() OR seller_org_id = current_org_id())
  WITH CHECK (buyer_org_id = current_org_id() OR seller_org_id = current_org_id());
CREATE POLICY datahub_dataset_deal_worker_deny ON datahub_dataset_deal AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

CREATE POLICY datahub_dataset_licence_select ON datahub_dataset_licence FOR SELECT
  USING (is_platform_admin() OR buyer_org_id = current_org_id() OR seller_org_id = current_org_id());
-- the buyer's own acceptance; the trigger takes every term from the deal
CREATE POLICY datahub_dataset_licence_insert ON datahub_dataset_licence FOR INSERT
  WITH CHECK (buyer_org_id = current_org_id());
CREATE POLICY datahub_dataset_licence_update ON datahub_dataset_licence FOR UPDATE
  USING      (is_platform_admin() OR seller_org_id = current_org_id())
  WITH CHECK (is_platform_admin() OR seller_org_id = current_org_id());
CREATE POLICY datahub_dataset_licence_worker_deny ON datahub_dataset_licence AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

-- Leads arrive through datahub_lead_create() only; Ops reads and works them.
CREATE POLICY datahub_lead_select ON datahub_lead FOR SELECT
  USING (is_platform_admin());
CREATE POLICY datahub_lead_update ON datahub_lead FOR UPDATE
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- A person records and reads their own; Ops reads all.
CREATE POLICY user_consent_select ON user_consent FOR SELECT
  USING (is_platform_admin() OR user_id = current_user_id());
CREATE POLICY user_consent_insert ON user_consent FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- ---------------------------------------------------------------------------
-- 9 · Grants, 270 style: the default privileges include DELETE and UPDATE on
--     every column, so they come off first.
-- ---------------------------------------------------------------------------
REVOKE ALL ON datahub_dataset FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_dataset TO sourcehub_app;
GRANT UPDATE (title, summary, description, category, use_cases, regions, languages,
              permitted_uses, licence_terms, indicative_price_text, status, review_note,
              withdrawn_reason, updated_at)
  ON datahub_dataset TO sourcehub_app;

REVOKE ALL ON datahub_dataset_version FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_dataset_version TO sourcehub_app;
GRANT UPDATE (status, item_count, total_bytes, notes, finalized_at, updated_at)
  ON datahub_dataset_version TO sourcehub_app;

REVOKE ALL ON datahub_dataset_item FROM sourcehub_app;
GRANT SELECT, INSERT, DELETE ON datahub_dataset_item TO sourcehub_app;
GRANT UPDATE (size_bytes, mime_type, sha256, is_sample, copy_status, copy_error,
              withdrawn_at, withdrawn_reason, withdrawn_by)
  ON datahub_dataset_item TO sourcehub_app;

REVOKE ALL ON datahub_dataset_deal FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_dataset_deal TO sourcehub_app;
GRANT UPDATE (status, quote_amount, currency, quote_terms, quote_uses, decision_note, updated_at)
  ON datahub_dataset_deal TO sourcehub_app;

REVOKE ALL ON datahub_dataset_licence FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_dataset_licence TO sourcehub_app;
GRANT UPDATE (status, invoice_number, revoked_reason, updated_at)
  ON datahub_dataset_licence TO sourcehub_app;

REVOKE ALL ON datahub_lead FROM sourcehub_app;
GRANT SELECT ON datahub_lead TO sourcehub_app;
GRANT UPDATE (status, handled_by, updated_at) ON datahub_lead TO sourcehub_app;

REVOKE ALL ON user_consent FROM sourcehub_app;
GRANT SELECT, INSERT ON user_consent TO sourcehub_app;

GRANT SELECT ON datahub_dataset, datahub_dataset_version, datahub_dataset_item, datahub_dataset_deal, datahub_dataset_licence,
                datahub_lead, user_consent
  TO sourcehub_readonly;

-- ---------------------------------------------------------------------------
-- 10 · Exclusivity. A request that does not ask for exclusivity is now, by
--      default, one whose captures the delivery partner may also sell in the
--      catalogue. Existing requests keep the value they were raised with.
-- ---------------------------------------------------------------------------
ALTER TABLE request ALTER COLUMN partner_reuse_allowed SET DEFAULT true;
COMMENT ON COLUMN request.partner_reuse_allowed IS
  'false: exclusive to the client. true: the delivery partner may also list the delivered '
  'captures in the dataset catalogue (db/350), subject to each worker''s resale consent.';
"""

_SEED = """
-- The catalogue capabilities, as db/900 now seeds them.
INSERT INTO permission (code, module, description, requires_mfa) VALUES
  ('catalogue.list',   'catalogue', 'List own datasets in the catalogue',     false),
  ('catalogue.quote',  'catalogue', 'Quote for, and invoice, a dataset sale', false),
  ('catalogue.buy',    'catalogue', 'Request and accept dataset quotes',      false),
  ('catalogue.review', 'catalogue', 'Publish or reject catalogue listings',   false)
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'client' AND r.is_system
  AND  p.code IN ('catalogue.buy', 'catalogue.list', 'catalogue.quote')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code IN ('tenant', 'aggregator') AND r.is_system
  AND  p.code IN ('catalogue.list', 'catalogue.quote')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'platform_admin' AND r.is_system AND p.code = 'catalogue.review'
ON CONFLICT DO NOTHING;
"""

_DOWN = """
DELETE FROM role_permission
WHERE  permission_id IN (SELECT id FROM permission
                          WHERE code IN ('catalogue.list', 'catalogue.quote',
                                         'catalogue.buy', 'catalogue.review'));
DELETE FROM permission
WHERE  code IN ('catalogue.list', 'catalogue.quote', 'catalogue.buy', 'catalogue.review');
COMMENT ON COLUMN request.partner_reuse_allowed IS NULL;
ALTER TABLE request ALTER COLUMN partner_reuse_allowed SET DEFAULT false;
DROP TABLE IF EXISTS user_consent;
DROP TABLE IF EXISTS datahub_lead;
DROP TABLE IF EXISTS datahub_dataset_licence;
DROP TABLE IF EXISTS datahub_dataset_deal;
DROP TABLE IF EXISTS datahub_dataset_item;
DROP TABLE IF EXISTS datahub_dataset_version;
DROP TABLE IF EXISTS datahub_dataset;
DROP FUNCTION IF EXISTS datahub_lead_create(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS datahub_public_samples(text);
DROP FUNCTION IF EXISTS datahub_public_dataset(text);
DROP FUNCTION IF EXISTS datahub_public_list();
DROP FUNCTION IF EXISTS datahub_copy_owners();
DROP FUNCTION IF EXISTS datahub_relist_candidates(uuid);
DROP FUNCTION IF EXISTS datahub_version_final(uuid);
DROP FUNCTION IF EXISTS datahub_version_licensed(uuid);
DROP FUNCTION IF EXISTS datahub_dataset_licensed(uuid);
DROP FUNCTION IF EXISTS datahub_dataset_on_sale(uuid);
DROP FUNCTION IF EXISTS datahub_dataset_owner(uuid);
DROP FUNCTION IF EXISTS datahub_dataset_licence_transition();
DROP FUNCTION IF EXISTS datahub_dataset_licence_before_insert();
DROP FUNCTION IF EXISTS datahub_dataset_deal_transition();
DROP FUNCTION IF EXISTS datahub_dataset_deal_before_insert();
DROP FUNCTION IF EXISTS datahub_dataset_item_freeze();
DROP FUNCTION IF EXISTS datahub_dataset_version_freeze();
DROP FUNCTION IF EXISTS datahub_dataset_transition();
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
    for stmt in _statements(_UP) + _statements(_SEED):
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
