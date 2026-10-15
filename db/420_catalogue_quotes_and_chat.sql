-- ============================================================================
-- 420 · The catalogue lists data; the files change hands outside it
--
-- A listing shows what a dataset is, how many files it holds and a few
-- samples. A buyer asks for a quote, the two sides agree in a chat how many
-- files and at what price, the seller quotes, the buyer accepts, and the
-- seller marks the deal paid and then delivered. The seller hands the files
-- over itself. So the platform keeps no copy of a dataset beyond its samples,
-- and no version, file row or licence is needed to gate downloads.
--
--   datahub_dataset          gains file_count and total_bytes: what the
--                            listing says it holds. Counted from the accepted
--                            captures for a contract listing, given by the
--                            owner for an upload. Fixed once in review.
--   datahub_dataset_sample   the few files shown on the listing. For a
--                            contract listing the owner picks captures and
--                            only those are copied (the copy sweep); for an
--                            upload the owner uploads them.
--   datahub_dataset_deal     becomes the whole agreement: requested and
--                            agreed quantity, the quote, then paid and
--                            delivered, each marked by the seller.
--   datahub_deal_message     the chat on a deal, between its buyer and its
--                            seller. Operations read it and post in none.
--
-- Dropped: datahub_dataset_version, datahub_dataset_item and
-- datahub_dataset_licence. Their samples move to datahub_dataset_sample and
-- their counts to datahub_dataset. Refused, changing nothing, while any
-- licence exists: a licence is the record of a sale.
-- ============================================================================

DO $fn$
DECLARE
  v_rows bigint;
BEGIN
  SELECT count(*) INTO v_rows FROM datahub_dataset_licence;
  IF v_rows > 0 THEN
    RAISE EXCEPTION '420: % dataset licence(s) exist; nothing was changed. Settle or export them first', v_rows;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 1 · What a listing says it holds
-- ---------------------------------------------------------------------------
ALTER TABLE datahub_dataset
  ADD COLUMN file_count  integer NOT NULL DEFAULT 0 CHECK (file_count >= 0),
  ADD COLUMN total_bytes bigint CHECK (total_bytes IS NULL OR total_bytes >= 0);

COMMENT ON COLUMN datahub_dataset.file_count IS
  'How many files the dataset holds. Counted from the accepted captures for a contract listing, '
  'given by the owner for an upload. What a buyer agrees to take is settled in the deal chat.';

-- The counts of each listing's newest version, before the versions go.
UPDATE datahub_dataset d
SET    file_count  = s.n,
       total_bytes = s.bytes
FROM  (SELECT v.dataset_id,
              count(i.id) FILTER (WHERE i.withdrawn_at IS NULL)::integer AS n,
              sum(i.size_bytes) FILTER (WHERE i.withdrawn_at IS NULL) AS bytes
       FROM   datahub_dataset_version v
       LEFT JOIN datahub_dataset_item i ON i.version_id = v.id
       WHERE  v.number = (SELECT max(number) FROM datahub_dataset_version w WHERE w.dataset_id = v.dataset_id)
       GROUP  BY v.dataset_id) s
WHERE  s.dataset_id = d.id;

-- The owner drafts, submits, pulls back and withdraws; only Ops publishes or
-- rejects. What buyers read, the count included, is fixed once in review.
CREATE OR REPLACE FUNCTION datahub_dataset_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.status = OLD.status THEN
    IF OLD.status IN ('in_review', 'published', 'withdrawn') AND NOT is_platform_admin()
       AND (NEW.title, NEW.summary, NEW.description, NEW.licence_terms, NEW.permitted_uses,
            NEW.file_count, NEW.total_bytes)
           IS DISTINCT FROM
           (OLD.title, OLD.summary, OLD.description, OLD.licence_terms, OLD.permitted_uses,
            OLD.file_count, OLD.total_bytes) THEN
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

-- ---------------------------------------------------------------------------
-- 2 · Samples: the only files the platform keeps
-- ---------------------------------------------------------------------------
CREATE TABLE datahub_dataset_sample (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id               uuid NOT NULL REFERENCES datahub_dataset(id) ON DELETE RESTRICT,
  owner_org_id             uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  -- in SourceHub's own storage (platform_target), never a client's bucket
  storage_key              text NOT NULL,
  filename                 text NOT NULL,
  mime_type                text,
  size_bytes               bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),

  -- a contract listing's sample is a copy of one accepted capture. No FK:
  -- asset is partitioned. The copy sweep reads it from the client's bucket.
  source_asset_id          uuid,
  source_storage_key       text,
  source_storage_target_id uuid REFERENCES storage_target(id) ON DELETE SET NULL,

  -- a picked capture starts pending and the sweep copies it; an uploaded
  -- sample is recorded once its upload is confirmed, so it starts copied
  copy_status              text NOT NULL DEFAULT 'copied' CHECK (copy_status IN ('pending','copied','failed')),
  copy_error               text,

  created_at               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT datahub_dataset_sample_key UNIQUE (dataset_id, storage_key)
);

CREATE INDEX datahub_dataset_sample_dataset_idx ON datahub_dataset_sample (dataset_id);
CREATE INDEX datahub_dataset_sample_pending_idx ON datahub_dataset_sample (created_at) WHERE copy_status = 'pending';
CREATE UNIQUE INDEX datahub_dataset_sample_source_key ON datahub_dataset_sample (dataset_id, source_asset_id)
  WHERE source_asset_id IS NOT NULL;

-- The samples a listing had, from its newest version.
INSERT INTO datahub_dataset_sample (dataset_id, owner_org_id, storage_key, filename, mime_type, size_bytes,
                                    source_asset_id, source_storage_key, source_storage_target_id,
                                    copy_status, copy_error, created_at)
SELECT i.dataset_id, i.owner_org_id, i.storage_key, i.filename, i.mime_type, i.size_bytes,
       i.source_asset_id, i.source_storage_key, i.source_storage_target_id,
       i.copy_status, i.copy_error, i.created_at
FROM   datahub_dataset_item i
JOIN   datahub_dataset_version v ON v.id = i.version_id
WHERE  i.is_sample AND i.withdrawn_at IS NULL
  AND  v.number = (SELECT max(number) FROM datahub_dataset_version w WHERE w.dataset_id = v.dataset_id);

-- Samples are part of what operations review: added and removed only while
-- the listing is the owner's to change, and only for the listing's owner.
-- The sweep's copy status may change at any time.
CREATE OR REPLACE FUNCTION datahub_dataset_sample_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  d datahub_dataset%ROWTYPE;
BEGIN
  SELECT * INTO d FROM datahub_dataset
   WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.dataset_id ELSE NEW.dataset_id END;
  IF TG_OP = 'INSERT' AND d.owner_org_id IS DISTINCT FROM NEW.owner_org_id THEN
    RAISE EXCEPTION 'dataset sample: dataset and owner do not agree' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.dataset_id, NEW.owner_org_id, NEW.storage_key, NEW.source_asset_id)
       IS DISTINCT FROM (OLD.dataset_id, OLD.owner_org_id, OLD.storage_key, OLD.source_asset_id) THEN
      RAISE EXCEPTION 'dataset sample: only its copy status changes' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF d.status NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'dataset sample: samples change only while the listing is a draft'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$fn$;

CREATE TRIGGER datahub_dataset_sample_guard BEFORE INSERT OR UPDATE OR DELETE ON datahub_dataset_sample
  FOR EACH ROW EXECUTE FUNCTION datahub_dataset_sample_guard();

-- ---------------------------------------------------------------------------
-- 3 · The deal is the agreement: quantity, quote, paid, delivered
-- ---------------------------------------------------------------------------
ALTER TABLE datahub_dataset_deal
  ADD COLUMN requested_quantity  integer CHECK (requested_quantity IS NULL OR requested_quantity > 0),
  ADD COLUMN quote_quantity      integer CHECK (quote_quantity IS NULL OR quote_quantity > 0),
  ADD COLUMN invoice_number      text,
  ADD COLUMN paid_at             timestamptz,
  ADD COLUMN paid_marked_by      uuid REFERENCES app_user(id) ON DELETE SET NULL,
  ADD COLUMN delivered_at        timestamptz,
  ADD COLUMN delivered_marked_by uuid REFERENCES app_user(id) ON DELETE SET NULL;

COMMENT ON COLUMN datahub_dataset_deal.requested_quantity IS
  'How many files the buyer asked for, if it said. The number agreed is quote_quantity.';
COMMENT ON COLUMN datahub_dataset_deal.quote_quantity IS
  'How many files the quote covers, as agreed in the deal chat. NULL: the whole dataset.';

ALTER TABLE datahub_dataset_deal DROP CONSTRAINT datahub_dataset_deal_status_check;
ALTER TABLE datahub_dataset_deal ADD CONSTRAINT datahub_dataset_deal_status_check
  CHECK (status IN ('requested','quoted','accepted','paid','delivered','declined','withdrawn'));

ALTER TABLE datahub_dataset_deal DROP CONSTRAINT datahub_dataset_deal_quoted_shape;
ALTER TABLE datahub_dataset_deal ADD CONSTRAINT datahub_dataset_deal_quoted_shape CHECK (
  status NOT IN ('quoted','accepted','paid','delivered')
  OR (quote_amount IS NOT NULL AND currency IS NOT NULL AND quoted_at IS NOT NULL)
);
ALTER TABLE datahub_dataset_deal ADD CONSTRAINT datahub_dataset_deal_paid_shape CHECK (
  status NOT IN ('paid','delivered') OR paid_at IS NOT NULL
);
ALTER TABLE datahub_dataset_deal ADD CONSTRAINT datahub_dataset_deal_delivered_shape CHECK (
  status <> 'delivered' OR delivered_at IS NOT NULL
);

-- A deal is on the listing now, not on a version of it.
DROP INDEX datahub_dataset_deal_open_key;

-- ---------------------------------------------------------------------------
-- 4 · Versions, files and licences go
-- ---------------------------------------------------------------------------
DROP POLICY datahub_dataset_select ON datahub_dataset;
DROP TABLE datahub_dataset_licence;
ALTER TABLE datahub_dataset_deal DROP COLUMN version_id;
DROP TABLE datahub_dataset_item;
DROP TABLE datahub_dataset_version;

DROP FUNCTION datahub_dataset_licensed(uuid);
DROP FUNCTION datahub_version_licensed(uuid);
DROP FUNCTION datahub_version_final(uuid);
DROP FUNCTION datahub_dataset_version_freeze();
DROP FUNCTION datahub_dataset_item_freeze();
DROP FUNCTION datahub_dataset_licence_before_insert();
DROP FUNCTION datahub_dataset_licence_transition();
DROP FUNCTION datahub_public_list();
DROP FUNCTION datahub_public_dataset(text);

-- one live conversation per buyer and listing
CREATE UNIQUE INDEX datahub_dataset_deal_open_key ON datahub_dataset_deal (buyer_org_id, dataset_id)
  WHERE status IN ('requested','quoted');

-- The seller comes from the listing, not the buyer's request, and a deal
-- starts as a request with nothing quoted, paid or delivered.
CREATE OR REPLACE FUNCTION datahub_dataset_deal_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_owner  uuid;
  v_status text;
BEGIN
  SELECT d.owner_org_id, d.status INTO v_owner, v_status
    FROM datahub_dataset d WHERE d.id = NEW.dataset_id;
  IF v_owner IS NULL OR v_status <> 'published' THEN
    RAISE EXCEPTION 'dataset deal: that dataset is not on sale'
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.seller_org_id  := v_owner;
  NEW.status         := 'requested';
  NEW.quote_amount   := NULL;
  NEW.quote_quantity := NULL;
  NEW.quoted_at      := NULL;
  NEW.paid_at        := NULL;
  NEW.delivered_at   := NULL;
  RETURN NEW;
END
$fn$;

-- The seller quotes, declines, marks paid and marks delivered; the buyer
-- accepts and withdraws. Once accepted, the agreed terms never change.
CREATE OR REPLACE FUNCTION datahub_dataset_deal_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  -- IS NOT DISTINCT FROM, so no org context reads as false, not NULL
  v_seller boolean := (current_org_id() IS NOT DISTINCT FROM OLD.seller_org_id);
  v_buyer  boolean := (current_org_id() IS NOT DISTINCT FROM OLD.buyer_org_id);
BEGIN
  IF OLD.status IN ('accepted','paid','delivered')
     AND (NEW.quote_amount, NEW.currency, NEW.quote_terms, NEW.quote_uses, NEW.quote_quantity)
         IS DISTINCT FROM
         (OLD.quote_amount, OLD.currency, OLD.quote_terms, OLD.quote_uses, OLD.quote_quantity) THEN
    RAISE EXCEPTION 'dataset deal %: the agreed terms are fixed', OLD.id USING ERRCODE = 'check_violation';
  END IF;
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
    IF (NEW.quote_amount, NEW.currency, NEW.quote_terms, NEW.quote_uses, NEW.quote_quantity)
       IS DISTINCT FROM
       (OLD.quote_amount, OLD.currency, OLD.quote_terms, OLD.quote_uses, OLD.quote_quantity) THEN
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
  ELSIF (OLD.status, NEW.status) = ('accepted','paid') THEN
    IF NOT v_seller THEN
      RAISE EXCEPTION 'dataset deal %: only the seller marks it paid', OLD.id USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.paid_marked_by := current_user_id();
    NEW.paid_at        := now();
  ELSIF (OLD.status, NEW.status) = ('paid','delivered') THEN
    IF NOT v_seller THEN
      RAISE EXCEPTION 'dataset deal %: only the seller marks it delivered', OLD.id USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.delivered_marked_by := current_user_id();
    NEW.delivered_at        := now();
  ELSE
    RAISE EXCEPTION 'dataset deal %: cannot move from % to %', OLD.id, OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 5 · The chat on a deal
-- ---------------------------------------------------------------------------
CREATE TABLE datahub_deal_message (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id        uuid NOT NULL REFERENCES datahub_dataset_deal(id) ON DELETE RESTRICT,
  seq            integer NOT NULL CHECK (seq > 0),
  sender_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  sender_user_id uuid NOT NULL REFERENCES app_user(id),
  sender_name    text NOT NULL,
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT datahub_deal_message_seq_key    UNIQUE (deal_id, seq),
  CONSTRAINT datahub_deal_message_body_shape CHECK (btrim(body) <> '' AND char_length(body) <= 4000)
);

COMMENT ON TABLE datahub_deal_message IS
  'The chat on a dataset deal, between its buyer and its seller: how many files, which, and the price';
COMMENT ON COLUMN datahub_deal_message.seq IS
  'The message''s number within its deal, assigned under the deal''s advisory lock';
COMMENT ON COLUMN datahub_deal_message.sender_name IS
  'Snapshot at send: the other organisation cannot read app_user for this person';

-- Append-only at the rewrite level too, as rfp_message is (250).
CREATE RULE datahub_deal_message_no_update AS ON UPDATE TO datahub_deal_message DO INSTEAD NOTHING;
CREATE RULE datahub_deal_message_no_delete AS ON DELETE TO datahub_deal_message DO INSTEAD NOTHING;

-- ---------------------------------------------------------------------------
-- 6 · Definer helpers and the public catalogue, on the new shape
-- ---------------------------------------------------------------------------
-- Has the current org a deal on this listing (any state)? A buyer keeps
-- seeing a listing it dealt on after the listing is withdrawn.
CREATE OR REPLACE FUNCTION datahub_dataset_dealt(p_dataset_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM datahub_dataset_deal k
                  WHERE k.dataset_id = p_dataset_id AND k.buyer_org_id = current_org_id())
$fn$;

-- Which owners have picked samples still to copy. The sweep has no org of
-- its own; it opens one session per owner from this list.
CREATE OR REPLACE FUNCTION datahub_copy_owners() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT DISTINCT owner_org_id FROM datahub_dataset_sample WHERE copy_status = 'pending'
$fn$;

-- The name only, never the row, and only when the catalogue gives a reason
-- to know it (db/410): a listing on sale, or the other side of a deal.
CREATE OR REPLACE FUNCTION datahub_org_name(p_org_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT o.name
  FROM   organisation o
  WHERE  o.id = p_org_id
    AND  current_org_id() IS NOT NULL
    AND  (   o.id = current_org_id()
          OR is_platform_admin()
          OR EXISTS (SELECT 1 FROM datahub_dataset d
                      WHERE d.owner_org_id = o.id AND d.status = 'published')
          OR EXISTS (SELECT 1 FROM datahub_dataset_deal k
                      WHERE (k.buyer_org_id = o.id AND k.seller_org_id = current_org_id())
                         OR (k.seller_org_id = o.id AND k.buyer_org_id = current_org_id())))
$fn$;

CREATE FUNCTION datahub_public_list()
RETURNS TABLE (
  id uuid, slug text, title text, summary text, category request_category,
  use_cases text[], regions text[], languages text[], permitted_uses text[],
  indicative_price_text text, seller_name text, file_count integer, total_bytes bigint,
  sample_count integer, published_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT d.id, d.slug, d.title, d.summary, d.category,
         d.use_cases, d.regions, d.languages, d.permitted_uses,
         d.indicative_price_text, o.name, d.file_count, d.total_bytes,
         (SELECT count(*)::integer FROM datahub_dataset_sample s
           WHERE s.dataset_id = d.id AND s.copy_status = 'copied'),
         d.published_at
  FROM   datahub_dataset d
  JOIN   organisation o ON o.id = d.owner_org_id
  WHERE  d.status = 'published'
  ORDER  BY d.published_at DESC
$fn$;

CREATE FUNCTION datahub_public_dataset(p_slug text)
RETURNS TABLE (
  id uuid, slug text, title text, summary text, description text, category request_category,
  use_cases text[], regions text[], languages text[], permitted_uses text[],
  licence_terms text, indicative_price_text text, seller_name text, source text,
  file_count integer, total_bytes bigint, published_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT d.id, d.slug, d.title, d.summary, d.description, d.category,
         d.use_cases, d.regions, d.languages, d.permitted_uses,
         d.licence_terms, d.indicative_price_text, o.name, d.source,
         d.file_count, d.total_bytes, d.published_at
  FROM   datahub_dataset d
  JOIN   organisation o ON o.id = d.owner_org_id
  WHERE  d.slug = p_slug AND d.status = 'published'
$fn$;

-- storage_key is returned so the API can sign a URL; the API never passes it on.
CREATE OR REPLACE FUNCTION datahub_public_samples(p_slug text)
RETURNS TABLE (id uuid, storage_key text, filename text, mime_type text, size_bytes bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT s.id, s.storage_key, s.filename, s.mime_type, s.size_bytes
  FROM   datahub_dataset d
  JOIN   datahub_dataset_sample s ON s.dataset_id = d.id
  WHERE  d.slug = p_slug AND d.status = 'published' AND s.copy_status = 'copied'
  ORDER  BY s.filename
$fn$;

DO $fn$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'datahub_dataset_dealt(uuid)', 'datahub_copy_owners()', 'datahub_org_name(uuid)',
    'datahub_public_list()', 'datahub_public_dataset(text)', 'datahub_public_samples(text)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO sourcehub_app', f);
  END LOOP;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 7 · Row-level security. ENABLE, never FORCE (db/270).
-- ---------------------------------------------------------------------------
-- dataset: on sale to every signed-in organisation; the owner's and Ops'
-- always; a buyer keeps seeing a listing it dealt on.
CREATE POLICY datahub_dataset_select ON datahub_dataset FOR SELECT
  USING (
       is_platform_admin()
    OR owner_org_id = current_org_id()
    OR (status = 'published' AND current_org_id() IS NOT NULL)
    OR datahub_dataset_dealt(id)
  );

ALTER TABLE datahub_dataset_sample ENABLE ROW LEVEL SECURITY;
ALTER TABLE datahub_deal_message   ENABLE ROW LEVEL SECURITY;

-- samples: every signed-in organisation while the listing is on sale; the
-- owner and Ops always.
CREATE POLICY datahub_dataset_sample_select ON datahub_dataset_sample FOR SELECT
  USING (
       is_platform_admin()
    OR owner_org_id = current_org_id()
    OR (current_org_id() IS NOT NULL AND datahub_dataset_on_sale(dataset_id))
  );
CREATE POLICY datahub_dataset_sample_insert ON datahub_dataset_sample FOR INSERT
  WITH CHECK (owner_org_id = current_org_id() AND datahub_dataset_owner(dataset_id) = current_org_id());
CREATE POLICY datahub_dataset_sample_update ON datahub_dataset_sample FOR UPDATE
  USING      (is_platform_admin() OR owner_org_id = current_org_id())
  WITH CHECK (is_platform_admin() OR owner_org_id = current_org_id());
CREATE POLICY datahub_dataset_sample_delete ON datahub_dataset_sample FOR DELETE
  USING (owner_org_id = current_org_id());
CREATE POLICY datahub_dataset_sample_worker_deny ON datahub_dataset_sample AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

-- messages: whoever can see the deal reads them (the subquery runs under the
-- deal's own policies). A party writes, in its own name, while the deal is
-- live; Ops reads and is refused here by name.
CREATE POLICY datahub_deal_message_select ON datahub_deal_message FOR SELECT
  USING (EXISTS (SELECT 1 FROM datahub_dataset_deal k WHERE k.id = datahub_deal_message.deal_id));
CREATE POLICY datahub_deal_message_insert ON datahub_deal_message FOR INSERT
  WITH CHECK (
       NOT is_platform_admin()
    AND sender_org_id  = current_org_id()
    AND sender_user_id = current_user_id()
    AND EXISTS (SELECT 1 FROM datahub_dataset_deal k
                 WHERE k.id = datahub_deal_message.deal_id
                   AND k.status NOT IN ('declined', 'withdrawn')
                   AND (k.buyer_org_id = current_org_id() OR k.seller_org_id = current_org_id()))
  );
CREATE POLICY datahub_deal_message_worker_deny ON datahub_deal_message AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

-- ---------------------------------------------------------------------------
-- 8 · Grants, 270 style
-- ---------------------------------------------------------------------------
REVOKE ALL ON datahub_dataset FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_dataset TO sourcehub_app;
GRANT UPDATE (title, summary, description, category, use_cases, regions, languages,
              permitted_uses, licence_terms, indicative_price_text, file_count, total_bytes,
              status, review_note, withdrawn_reason, updated_at)
  ON datahub_dataset TO sourcehub_app;

REVOKE ALL ON datahub_dataset_sample FROM sourcehub_app;
GRANT SELECT, INSERT, DELETE ON datahub_dataset_sample TO sourcehub_app;
GRANT UPDATE (size_bytes, mime_type, copy_status, copy_error) ON datahub_dataset_sample TO sourcehub_app;

REVOKE ALL ON datahub_dataset_deal FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_dataset_deal TO sourcehub_app;
GRANT UPDATE (status, quote_amount, currency, quote_terms, quote_uses, quote_quantity,
              decision_note, invoice_number, updated_at)
  ON datahub_dataset_deal TO sourcehub_app;

REVOKE ALL ON datahub_deal_message FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_deal_message TO sourcehub_app;

GRANT SELECT ON datahub_dataset_sample, datahub_deal_message TO sourcehub_readonly;
