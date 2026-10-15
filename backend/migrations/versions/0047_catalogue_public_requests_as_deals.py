"""catalogue: a quote request from the public page is a deal.

Someone without an account asking for a quote and a buyer with one asking
for a quote are the same thing, so the public request becomes a deal with no
buyer organisation (channel 'public', the visitor's name, email and
organisation instead), and the seller's emailed replies become messages in
its chat (emailed_to set). A public deal is only ever requested, then closed
by the seller.

datahub_lead and datahub_lead_reply are carried over, keeping their ids, and
dropped with datahub_lead_create(); datahub_public_request_create() takes its
place. Bells that pointed at a request now open its deal.

The downgrade refuses: the request tables, their rules and their function
would all have to be rebuilt by hand, and a public deal may by then carry
emailed messages the old tables cannot hold. Restore from a backup taken
before 0047.

SQL copied verbatim from db/440_catalogue_public_requests_as_deals.sql so the
bootstrap and migration paths keep producing identical schemas; a test asserts
the two stay byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0047
Revises: 0046
"""

from alembic import op

revision = "0047"
down_revision = "0046"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 440 · A quote request from the public page is a deal
--
-- Someone without an account asking for a quote and a buyer with one asking
-- for a quote are the same thing: a person asks a seller about a listing and
-- the seller answers. So the public request becomes a deal, and the seller's
-- emailed answers become messages in its chat. datahub_lead and
-- datahub_lead_reply (db/390, db/430) are carried over and dropped.
--
--   datahub_dataset_deal     gains channel ('account' or 'public') and, for a
--                            public request, the visitor's name, email and
--                            organisation in place of a buyer organisation.
--                            A public deal is only ever requested, then
--                            closed (declined) by the seller: nobody on the
--                            other side has an account to accept a quote, so
--                            the rest happens by email.
--   datahub_deal_message     gains emailed_to: the address a message was
--                            emailed to, on a public deal. The platform sends
--                            it Reply-To the seller, so the answer reaches
--                            the seller's own inbox.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The deal takes a public request
-- ---------------------------------------------------------------------------
ALTER TABLE datahub_dataset_deal ALTER COLUMN buyer_org_id DROP NOT NULL;
ALTER TABLE datahub_dataset_deal
  ADD COLUMN channel         text NOT NULL DEFAULT 'account' CHECK (channel IN ('account', 'public')),
  ADD COLUMN contact_name    text,
  ADD COLUMN contact_email   citext,
  ADD COLUMN contact_company text;

ALTER TABLE datahub_dataset_deal ADD CONSTRAINT datahub_dataset_deal_channel_shape CHECK (
  (channel = 'account'
     AND buyer_org_id IS NOT NULL
     AND contact_name IS NULL AND contact_email IS NULL AND contact_company IS NULL)
  OR
  (channel = 'public'
     AND buyer_org_id IS NULL
     AND length(btrim(contact_name)) > 0
     AND contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
     AND length(btrim(contact_company)) > 0
     AND status IN ('requested', 'declined'))
);

COMMENT ON COLUMN datahub_dataset_deal.channel IS
  'account: a buyer organisation asked in the console. public: someone without an account asked on the public page';
COMMENT ON COLUMN datahub_dataset_deal.contact_email IS
  'A public request only: where the seller''s replies are emailed';

ALTER TABLE datahub_deal_message ADD COLUMN emailed_to citext;
COMMENT ON COLUMN datahub_deal_message.emailed_to IS
  'On a public request: the address this message was emailed to, Reply-To the seller';

-- The seller quotes, declines, marks paid and marks delivered; the buyer
-- accepts and withdraws. Once accepted, the agreed terms never change. A
-- public request is only ever closed, by the seller.
CREATE OR REPLACE FUNCTION datahub_dataset_deal_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  -- IS NOT DISTINCT FROM, so no org context reads as false, not NULL
  v_seller boolean := (current_org_id() IS NOT DISTINCT FROM OLD.seller_org_id);
  v_buyer  boolean := (OLD.buyer_org_id IS NOT NULL AND current_org_id() IS NOT DISTINCT FROM OLD.buyer_org_id);
BEGIN
  IF OLD.channel = 'public' AND (OLD.status, NEW.status) IS DISTINCT FROM ('requested', 'declined') THEN
    RAISE EXCEPTION 'dataset deal %: a request from the public page can only be closed', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
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
-- 2 · The one write without a session: a public request opens a deal
-- ---------------------------------------------------------------------------
-- Answers only for a published listing, and tells the listing's owner.
CREATE OR REPLACE FUNCTION datahub_public_request_create(
  p_slug text, p_name text, p_email text, p_company text, p_intended_use text, p_message text
) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_dataset uuid;
  v_owner   uuid;
  v_title   text;
  v_id      uuid;
BEGIN
  SELECT id, owner_org_id, title INTO v_dataset, v_owner, v_title
  FROM   datahub_dataset WHERE slug = p_slug AND status = 'published';
  IF v_dataset IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO datahub_dataset_deal (dataset_id, seller_org_id, channel, contact_name, contact_email,
                                    contact_company, intended_use, message)
  VALUES (v_dataset, v_owner, 'public', btrim(p_name), btrim(p_email), btrim(p_company),
          btrim(p_intended_use), nullif(btrim(coalesce(p_message, '')), ''))
  RETURNING id INTO v_id;
  -- The seller's bell. There is no session to notify from, so it is done here.
  INSERT INTO notification (org_id, body, link_page, link_params)
  VALUES (v_owner,
          'A quote request from ' || btrim(p_company) || ' for ' || v_title
            || ' came in through the public catalogue.',
          'catalogue_deal', jsonb_build_object('id', v_id));
  RETURN v_id;
END
$fn$;

REVOKE EXECUTE ON FUNCTION datahub_public_request_create(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION datahub_public_request_create(text, text, text, text, text, text) TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- 3 · Carry the requests and replies over, keeping their ids
-- ---------------------------------------------------------------------------
-- The insert trigger would refuse a request on a listing since withdrawn and
-- reset every status to requested; these rows are history, so it is off for
-- the copy.
ALTER TABLE datahub_dataset_deal DISABLE TRIGGER datahub_dataset_deal_before_insert;

INSERT INTO datahub_dataset_deal (id, dataset_id, buyer_org_id, seller_org_id, channel,
                                  contact_name, contact_email, contact_company, intended_use, message,
                                  status, decided_by, decided_at, created_at, updated_at)
SELECT l.id, l.dataset_id, NULL, d.owner_org_id, 'public',
       l.name, l.email, l.company, l.intended_use, l.message,
       CASE WHEN l.status = 'closed' THEN 'declined' ELSE 'requested' END,
       CASE WHEN l.status = 'closed' THEN l.handled_by END,
       CASE WHEN l.status = 'closed' THEN l.updated_at END,
       l.created_at, l.updated_at
FROM   datahub_lead l JOIN datahub_dataset d ON d.id = l.dataset_id;

ALTER TABLE datahub_dataset_deal ENABLE TRIGGER datahub_dataset_deal_before_insert;

INSERT INTO datahub_deal_message (deal_id, seq, sender_org_id, sender_user_id, sender_name, body,
                                  emailed_to, created_at)
SELECT r.lead_id,
       row_number() OVER (PARTITION BY r.lead_id ORDER BY r.created_at, r.id),
       r.org_id, r.sent_by, r.sender_name, left(r.body, 4000), l.email, r.created_at
FROM   datahub_lead_reply r JOIN datahub_lead l ON l.id = r.lead_id;

-- A bell that pointed at a request now opens its deal (the same id).
UPDATE notification
SET    link_page = 'catalogue_deal', link_params = jsonb_build_object('id', link_params ->> 'lead')
WHERE  link_page IN ('catalogue_leads', 'catalogue_review') AND link_params ? 'lead';

DROP TABLE datahub_lead_reply;
DROP TABLE datahub_lead;
DROP FUNCTION datahub_lead_create(text, text, text, text, text, text);
"""

_DOWN = """
DO $fn$
BEGIN
  RAISE EXCEPTION '0047 downgrade: public requests are deals now and the request tables were dropped; '
                  'nothing was changed. Restore from a backup taken before 0047';
END
$fn$;
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
