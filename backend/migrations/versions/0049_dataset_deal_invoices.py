"""catalogue: a dataset deal is invoiced like a contract.

When the buyer accepts a seller's quote, the platform issues an invoice from
the seller to the buyer for the accepted amount, in the invoice table the
contracts use (db/320), so it shows on Billing. The buyer marks it paid; the
seller acknowledges, and that moves the deal to paid. The seller's own Mark
paid is gone.

invoice gains deal_id (a contract or a deal, never both; one per deal; never
withdrawn); the insert and transition triggers learn the deal; a trigger on
the deal issues the invoice on accept, and one on the invoice settles the
deal. Deals already accepted get their invoice now.

Grants ride in _SEED, as 0044's did: a delivery partner who buys may mark its
invoice paid (invoice.pay), and a client who sells may acknowledge one
(invoice.acknowledge). db/900 seeds the same.

The downgrade refuses while any deal has an invoice, and otherwise restores
the db/320 and db/440 functions and drops the column.

SQL copied verbatim from db/450_dataset_deal_invoices.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0049
Revises: 0048
"""

from alembic import op

revision = "0049"
down_revision = "0048"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 450 · A dataset deal is invoiced like a contract
--
-- When the buyer accepts a seller's quote, the platform issues an invoice
-- from the seller to the buyer for the accepted amount: the same invoice a
-- delivery partner raises on a contract (db/320), on the same Billing page.
-- The buyer marks it paid; the seller acknowledges the payment, and that
-- acknowledgement is what moves the deal to paid. Then the seller hands the
-- files over and marks the deal delivered, as before.
--
--   invoice          gains deal_id. An invoice bills a contract or a deal,
--                    never both. On a deal's invoice client_org_id is the
--                    buyer and partner_org_id the seller. One per deal, issued
--                    by the platform (issued_by NULL), and never withdrawn:
--                    the deal has no step to go back to.
--
-- A deal accepted before this file gets its invoice now; one already paid or
-- delivered keeps the invoice number its seller typed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The invoice may bill a deal
-- ---------------------------------------------------------------------------
ALTER TABLE invoice ALTER COLUMN contract_id DROP NOT NULL;
ALTER TABLE invoice ADD COLUMN deal_id uuid REFERENCES datahub_dataset_deal(id) ON DELETE RESTRICT;
ALTER TABLE invoice ADD CONSTRAINT invoice_bills_one CHECK ((contract_id IS NULL) <> (deal_id IS NULL));
CREATE UNIQUE INDEX invoice_deal_key ON invoice (deal_id) WHERE deal_id IS NOT NULL;

COMMENT ON COLUMN invoice.deal_id IS
  'A dataset deal this invoice bills (db/450), instead of a contract. client_org_id is then the buyer and partner_org_id the seller';

-- At issue: from the contract, as before, or from an accepted deal.
CREATE OR REPLACE FUNCTION invoice_before_insert() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  c contract%ROWTYPE;
  k datahub_dataset_deal%ROWTYPE;
BEGIN
  -- A dataset deal's invoice (db/450): issued by the platform when the buyer
  -- accepts, from the seller to the buyer, for the accepted quote.
  IF NEW.deal_id IS NOT NULL THEN
    SELECT * INTO k FROM datahub_dataset_deal WHERE id = NEW.deal_id;
    IF NOT FOUND OR k.status <> 'accepted' THEN
      RAISE EXCEPTION 'invoice: deal % is not an accepted deal', NEW.deal_id
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.contract_id     := NULL;
    NEW.client_org_id   := k.buyer_org_id;
    NEW.partner_org_id  := k.seller_org_id;
    NEW.currency        := k.currency;
    NEW.amount          := k.quote_amount;
    NEW.quantity := NULL;  NEW.unit := NULL;  NEW.block := NULL;  NEW.rate := NULL;
    NEW.accepted_assets_at_issue := NULL;
    NEW.status          := 'issued';
    NEW.issued_at       := now();
    NEW.issued_by       := NULL;
    NEW.paid_at := NULL;  NEW.paid_by := NULL;  NEW.payment_reference := NULL;
    NEW.acknowledged_at := NULL;  NEW.acknowledged_by := NULL;
    NEW.withdrawn_at := NULL;  NEW.withdrawn_by := NULL;  NEW.withdrawn_reason := NULL;
    RETURN NEW;
  END IF;
  SELECT * INTO c FROM contract WHERE id = NEW.contract_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice: contract % is not one you can invoice', NEW.contract_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  NEW.client_org_id   := c.client_org_id;
  NEW.partner_org_id  := c.partner_org_id;
  NEW.currency        := c.currency;
  NEW.status          := 'issued';
  NEW.issued_at       := now();
  NEW.issued_by       := current_user_id();
  NEW.paid_at := NULL;  NEW.paid_by := NULL;  NEW.payment_reference := NULL;
  NEW.acknowledged_at := NULL;  NEW.acknowledged_by := NULL;
  NEW.withdrawn_at := NULL;  NEW.withdrawn_by := NULL;  NEW.withdrawn_reason := NULL;
  IF c.pricing_basis = 'per_unit' THEN
    IF NEW.quantity IS NULL THEN
      RAISE EXCEPTION 'invoice: % is priced per unit; state the quantity', c.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    IF c.pricing_unit NOT IN ('hours', 'audio_hours')
       AND NEW.quantity <> trunc(NEW.quantity) THEN
      RAISE EXCEPTION 'invoice: % is counted in whole %', c.reference_code, c.pricing_unit
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.unit   := c.pricing_unit;
    NEW.block  := c.pricing_block;
    NEW.rate   := c.value;
    NEW.amount := round(NEW.quantity * c.value / c.pricing_block, 2);
  ELSE
    IF NEW.quantity IS NOT NULL THEN
      RAISE EXCEPTION 'invoice: % is a fixed price; state the amount', c.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.unit := NULL;  NEW.block := NULL;  NEW.rate := NULL;
  END IF;
  RETURN NEW;
END
$fn$;

-- Afterwards: as before, and a deal's invoice is never withdrawn.
CREATE OR REPLACE FUNCTION invoice_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.contract_id IS DISTINCT FROM OLD.contract_id OR NEW.deal_id IS DISTINCT FROM OLD.deal_id
     OR NEW.client_org_id <> OLD.client_org_id OR NEW.partner_org_id <> OLD.partner_org_id
     OR NEW.currency <> OLD.currency OR NEW.reference_code <> OLD.reference_code
     OR NEW.amount <> OLD.amount
     OR NEW.quantity IS DISTINCT FROM OLD.quantity OR NEW.unit IS DISTINCT FROM OLD.unit
     OR NEW.block IS DISTINCT FROM OLD.block OR NEW.rate IS DISTINCT FROM OLD.rate
     OR NEW.accepted_assets_at_issue IS DISTINCT FROM OLD.accepted_assets_at_issue
     OR NEW.note IS DISTINCT FROM OLD.note
     OR NEW.issued_at <> OLD.issued_at OR NEW.issued_by IS DISTINCT FROM OLD.issued_by THEN
    RAISE EXCEPTION 'invoice %: what was issued cannot change', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  -- start from the old stamps; the one move below adds its own
  NEW.paid_at := OLD.paid_at;  NEW.paid_by := OLD.paid_by;
  NEW.acknowledged_at := OLD.acknowledged_at;  NEW.acknowledged_by := OLD.acknowledged_by;
  NEW.withdrawn_at := OLD.withdrawn_at;  NEW.withdrawn_by := OLD.withdrawn_by;
  IF NEW.status = OLD.status THEN
    IF NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
       OR NEW.withdrawn_reason IS DISTINCT FROM OLD.withdrawn_reason THEN
      RAISE EXCEPTION 'invoice %: a reference is written with the move it belongs to',
        OLD.reference_code USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'issued' AND NEW.status = 'paid' THEN
    IF current_org_id() IS DISTINCT FROM OLD.client_org_id THEN
      RAISE EXCEPTION 'invoice %: only the client marks it paid', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.paid_at := now();
    NEW.paid_by := current_user_id();
    NEW.withdrawn_reason := OLD.withdrawn_reason;
  ELSIF OLD.status = 'paid' AND NEW.status = 'acknowledged' THEN
    IF current_org_id() IS DISTINCT FROM OLD.partner_org_id THEN
      RAISE EXCEPTION 'invoice %: only the partner acknowledges payment', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.acknowledged_at := now();
    NEW.acknowledged_by := current_user_id();
    NEW.payment_reference := OLD.payment_reference;
    NEW.withdrawn_reason := OLD.withdrawn_reason;
  ELSIF OLD.status = 'issued' AND NEW.status = 'withdrawn' THEN
    -- the deal it bills has no step to go back to
    IF OLD.deal_id IS NOT NULL THEN
      RAISE EXCEPTION 'invoice %: a dataset deal''s invoice cannot be withdrawn', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    IF current_org_id() IS DISTINCT FROM OLD.partner_org_id THEN
      RAISE EXCEPTION 'invoice %: only the partner withdraws it', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.withdrawn_at := now();
    NEW.withdrawn_by := current_user_id();
    NEW.payment_reference := OLD.payment_reference;
  ELSE
    RAISE EXCEPTION 'invoice %: cannot go from % to %',
      OLD.reference_code, OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

-- Acknowledging a deal's invoice is what makes the deal paid. Runs with the
-- seller's rights: the deal's own policy and transition trigger still judge it.
CREATE OR REPLACE FUNCTION invoice_settles_deal() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE datahub_dataset_deal
  SET    status = 'paid', invoice_number = NEW.reference_code
  WHERE  id = NEW.deal_id AND status = 'accepted';
  RETURN NULL;
END
$fn$;

CREATE TRIGGER invoice_settles_deal AFTER UPDATE OF status ON invoice
  FOR EACH ROW
  WHEN (NEW.deal_id IS NOT NULL AND OLD.status = 'paid' AND NEW.status = 'acknowledged')
  EXECUTE FUNCTION invoice_settles_deal();

-- ---------------------------------------------------------------------------
-- 2 · The deal is paid only through its invoice
-- ---------------------------------------------------------------------------
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
    -- paid means the seller acknowledged the deal's invoice (db/450)
    IF NOT EXISTS (SELECT 1 FROM invoice i WHERE i.deal_id = OLD.id AND i.status = 'acknowledged') THEN
      RAISE EXCEPTION 'dataset deal %: paid once its invoice is acknowledged', OLD.id
        USING ERRCODE = 'check_violation';
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
-- 3 · Accepting a quote issues the invoice
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: the buyer accepts, and invoice_insert lets only a
-- contract's partner insert. That policy stays as it is, so nobody raises a
-- deal's invoice by hand.
CREATE OR REPLACE FUNCTION datahub_deal_issue_invoice() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_ref   text;
  v_title text;
BEGIN
  v_ref := next_reference_code('INV', 'seq_ref_invoice');
  INSERT INTO invoice (reference_code, deal_id, client_org_id, partner_org_id, amount)
  VALUES (v_ref, NEW.id, NEW.buyer_org_id, NEW.seller_org_id, NEW.quote_amount);
  SELECT title INTO v_title FROM datahub_dataset WHERE id = NEW.dataset_id;
  INSERT INTO notification (org_id, body, link_page, link_params)
  VALUES (NEW.buyer_org_id,
          'Invoice ' || v_ref || ' for ' || v_title || ' was issued to you: '
            || NEW.currency || ' ' || to_char(NEW.quote_amount, 'FM999,999,999,990.00')
            || '. Mark it paid once you have paid the seller.',
          'catalogue_deal', jsonb_build_object('id', NEW.id));
  RETURN NULL;
END
$fn$;

REVOKE EXECUTE ON FUNCTION datahub_deal_issue_invoice() FROM PUBLIC;

CREATE TRIGGER datahub_deal_issue_invoice AFTER UPDATE OF status ON datahub_dataset_deal
  FOR EACH ROW
  WHEN (OLD.status <> 'accepted' AND NEW.status = 'accepted')
  EXECUTE FUNCTION datahub_deal_issue_invoice();

-- ---------------------------------------------------------------------------
-- 4 · Deals accepted before this file get their invoice
-- ---------------------------------------------------------------------------
INSERT INTO invoice (reference_code, deal_id, client_org_id, partner_org_id, amount)
SELECT next_reference_code('INV', 'seq_ref_invoice'), k.id, k.buyer_org_id, k.seller_org_id, k.quote_amount
FROM   datahub_dataset_deal k
WHERE  k.status = 'accepted'
ORDER  BY k.decided_at NULLS LAST, k.created_at;
"""

_SEED = """
-- A delivery partner who buys a dataset marks its invoice paid; a client who
-- sells one acknowledges the payment.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'tenant' AND r.is_system AND p.code = 'invoice.pay'
ON CONFLICT DO NOTHING;
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'client' AND r.is_system AND p.code = 'invoice.acknowledge'
ON CONFLICT DO NOTHING;
"""

_DOWN = """
DO $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM invoice WHERE deal_id IS NOT NULL) THEN
    RAISE EXCEPTION '0049 downgrade: dataset deals have invoices, which the old invoice table cannot '
                    'hold; nothing was changed. Restore from a backup taken before 0049';
  END IF;
END
$fn$;
DROP TRIGGER datahub_deal_issue_invoice ON datahub_dataset_deal;
DROP FUNCTION datahub_deal_issue_invoice();
DROP TRIGGER invoice_settles_deal ON invoice;
DROP FUNCTION invoice_settles_deal();
CREATE OR REPLACE FUNCTION invoice_before_insert() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  c contract%ROWTYPE;
BEGIN
  SELECT * INTO c FROM contract WHERE id = NEW.contract_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice: contract % is not one you can invoice', NEW.contract_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  NEW.client_org_id   := c.client_org_id;
  NEW.partner_org_id  := c.partner_org_id;
  NEW.currency        := c.currency;
  NEW.status          := 'issued';
  NEW.issued_at       := now();
  NEW.issued_by       := current_user_id();
  NEW.paid_at := NULL;  NEW.paid_by := NULL;  NEW.payment_reference := NULL;
  NEW.acknowledged_at := NULL;  NEW.acknowledged_by := NULL;
  NEW.withdrawn_at := NULL;  NEW.withdrawn_by := NULL;  NEW.withdrawn_reason := NULL;
  IF c.pricing_basis = 'per_unit' THEN
    IF NEW.quantity IS NULL THEN
      RAISE EXCEPTION 'invoice: % is priced per unit; state the quantity', c.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    IF c.pricing_unit NOT IN ('hours', 'audio_hours')
       AND NEW.quantity <> trunc(NEW.quantity) THEN
      RAISE EXCEPTION 'invoice: % is counted in whole %', c.reference_code, c.pricing_unit
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.unit   := c.pricing_unit;
    NEW.block  := c.pricing_block;
    NEW.rate   := c.value;
    NEW.amount := round(NEW.quantity * c.value / c.pricing_block, 2);
  ELSE
    IF NEW.quantity IS NOT NULL THEN
      RAISE EXCEPTION 'invoice: % is a fixed price; state the amount', c.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.unit := NULL;  NEW.block := NULL;  NEW.rate := NULL;
  END IF;
  RETURN NEW;
END
$fn$;

CREATE OR REPLACE FUNCTION invoice_transition() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.contract_id <> OLD.contract_id
     OR NEW.client_org_id <> OLD.client_org_id OR NEW.partner_org_id <> OLD.partner_org_id
     OR NEW.currency <> OLD.currency OR NEW.reference_code <> OLD.reference_code
     OR NEW.amount <> OLD.amount
     OR NEW.quantity IS DISTINCT FROM OLD.quantity OR NEW.unit IS DISTINCT FROM OLD.unit
     OR NEW.block IS DISTINCT FROM OLD.block OR NEW.rate IS DISTINCT FROM OLD.rate
     OR NEW.accepted_assets_at_issue IS DISTINCT FROM OLD.accepted_assets_at_issue
     OR NEW.note IS DISTINCT FROM OLD.note
     OR NEW.issued_at <> OLD.issued_at OR NEW.issued_by IS DISTINCT FROM OLD.issued_by THEN
    RAISE EXCEPTION 'invoice %: what was issued cannot change', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  -- start from the old stamps; the one move below adds its own
  NEW.paid_at := OLD.paid_at;  NEW.paid_by := OLD.paid_by;
  NEW.acknowledged_at := OLD.acknowledged_at;  NEW.acknowledged_by := OLD.acknowledged_by;
  NEW.withdrawn_at := OLD.withdrawn_at;  NEW.withdrawn_by := OLD.withdrawn_by;
  IF NEW.status = OLD.status THEN
    IF NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
       OR NEW.withdrawn_reason IS DISTINCT FROM OLD.withdrawn_reason THEN
      RAISE EXCEPTION 'invoice %: a reference is written with the move it belongs to',
        OLD.reference_code USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'issued' AND NEW.status = 'paid' THEN
    IF current_org_id() IS DISTINCT FROM OLD.client_org_id THEN
      RAISE EXCEPTION 'invoice %: only the client marks it paid', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.paid_at := now();
    NEW.paid_by := current_user_id();
    NEW.withdrawn_reason := OLD.withdrawn_reason;
  ELSIF OLD.status = 'paid' AND NEW.status = 'acknowledged' THEN
    IF current_org_id() IS DISTINCT FROM OLD.partner_org_id THEN
      RAISE EXCEPTION 'invoice %: only the partner acknowledges payment', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.acknowledged_at := now();
    NEW.acknowledged_by := current_user_id();
    NEW.payment_reference := OLD.payment_reference;
    NEW.withdrawn_reason := OLD.withdrawn_reason;
  ELSIF OLD.status = 'issued' AND NEW.status = 'withdrawn' THEN
    IF current_org_id() IS DISTINCT FROM OLD.partner_org_id THEN
      RAISE EXCEPTION 'invoice %: only the partner withdraws it', OLD.reference_code
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.withdrawn_at := now();
    NEW.withdrawn_by := current_user_id();
    NEW.payment_reference := OLD.payment_reference;
  ELSE
    RAISE EXCEPTION 'invoice %: cannot go from % to %',
      OLD.reference_code, OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

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
DROP INDEX invoice_deal_key;
ALTER TABLE invoice DROP CONSTRAINT invoice_bills_one;
ALTER TABLE invoice DROP COLUMN deal_id;
ALTER TABLE invoice ALTER COLUMN contract_id SET NOT NULL;
DELETE FROM role_permission
WHERE  role_id IN (SELECT id FROM role WHERE code = 'tenant' AND is_system)
  AND  permission_id IN (SELECT id FROM permission WHERE code = 'invoice.pay');
DELETE FROM role_permission
WHERE  role_id IN (SELECT id FROM role WHERE code = 'client' AND is_system)
  AND  permission_id IN (SELECT id FROM permission WHERE code = 'invoice.acknowledge');
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
