"""Partner-raised invoices replace the escrow ledger.

The award no longer holds half the value in escrow and the approval no longer
settles it and takes a fee: the platform moves no money. The client states its
budget as one amount on a basis (a total, or an amount per N units), partners
bid on that basis, the award freezes it on the contract, and the partner raises
an invoice once some of its work has passed gate 2; the client marks it paid;
the partner acknowledges, or withdraws an unpaid one. The four ledger tables,
their two enums and their balance trigger go; one invoice table replaces them,
with an insert trigger that fills the parties and the rate from the contract
and a transition trigger that enforces who may move it where.

SQL copied verbatim from db/320_partner_invoices.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. The capability rows are a separate literal, as 0029 did,
because on a fresh build STRUCTURE runs before SEED.

Two guards refuse to run rather than drop data: one if any row carries a value
the new model has no home for, one if the ledger holds rows and the operator
has not passed `-x old_billing_dumped=yes` (migrations/env.py turns that into
the session setting the guard reads). The downgrade recreates the ledger as
080 made it, empty, maps the pricing columns back, and refuses while partner
invoices exist unless the same flag is given.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0035
Revises: 0034
"""

from alembic import op

revision = "0035"
down_revision = "0034"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 320 · Partner-raised invoices replace the escrow ledger
--
-- Until now money moved by itself: the award invoiced half the contract value
-- into escrow, the approval settled the rest, took a 9% platform fee and marked
-- the invoices paid, all through four tables (invoice, ledger_account,
-- ledger_transaction, ledger_entry) that only the ledger module wrote, under an
-- elevated platform context. Nothing read the three ledger tables, no payment
-- provider existed, a partner's payable was never paid out, and a dispute or an
-- unfinished contract left escrow held for ever.
--
-- The platform no longer moves money. It records what the parties agree and
-- what they say happened:
--
--   request   The client states its budget as one amount on a BASIS: a total,
--             or an amount per N units (per 100 photos, per 1,000 records, per
--             10 hours of footage). budget_disclosed still hides the amount
--             from bidders. budget_min, budget_max, pricing_model_requested and
--             milestones go; every existing row becomes 'total' at its old
--             maximum.
--   proposal  A bid is one price on the request's basis. unit_price and unit,
--             which nothing ever filled, go.
--   contract  The basis is frozen at award beside the rubric and the storage
--             target; value is the agreed amount on that basis. milestone_pct
--             and platform_fee_pct go.
--   invoice   Rebuilt. The PARTNER raises one once some of its work has passed
--             gate 2, for a quantity (per-unit) or an amount (total); the
--             client marks it paid; the partner acknowledges, or withdraws an
--             unpaid one. The database fills the parties, the currency and the
--             rate from the contract and computes the amount, so a caller
--             cannot forge any of them; a transition trigger enforces who may
--             move it where; the application login may update three columns.
--
-- Safe on a database with data. Guard A refuses to run if any row carries a
-- value this file would discard without a home (a per-unit or milestone bid,
-- a non-default fee). Guard B refuses to drop the ledger while it holds rows
-- unless the operator has set sourcehub.old_billing_dumped = 'yes' for the
-- session, which the migration does from `alembic -x old_billing_dumped=yes`
-- once the rows are in the rollback folder. A fresh build holds none and
-- passes both.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Guard A · Nothing this file would discard is in use
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_rows bigint;
BEGIN
  SELECT count(*) INTO v_rows FROM request
   WHERE pricing_model_requested <> 'fixed' OR milestones <> '[]'::jsonb;
  IF v_rows > 0 THEN
    RAISE EXCEPTION '320: % request(s) ask for a pricing model or milestones this file cannot '
                    'carry; nothing was changed. Look at them, then either set '
                    'pricing_model_requested = ''fixed'' and milestones = ''[]'' on those rows '
                    'or extend this file to carry them', v_rows;
  END IF;
  SELECT count(*) INTO v_rows FROM proposal WHERE unit_price IS NOT NULL OR unit IS NOT NULL;
  IF v_rows > 0 THEN
    RAISE EXCEPTION '320: % proposal(s) carry a unit price this file cannot carry; '
                    'nothing was changed. Look at them, then clear unit_price and unit '
                    'or extend this file to carry them', v_rows;
  END IF;
  SELECT count(*) INTO v_rows FROM contract
   WHERE milestone_pct <> 50 OR platform_fee_pct <> 9.00;
  IF v_rows > 0 THEN
    RAISE EXCEPTION '320: % contract(s) carry a non-default milestone or fee; '
                    'nothing was changed. Look at them before deciding they can go', v_rows;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 1 · The pricing basis
-- ---------------------------------------------------------------------------
CREATE TYPE pricing_basis AS ENUM ('total', 'per_unit');

-- ---------------------------------------------------------------------------
-- 2 · request: one amount on a basis replaces the range
--
--     pricing_unit shares target_unit's vocabulary but is its own column: a
--     request for 500 videos may be priced per 10 hours of footage, so the
--     priced quantity (pricing_quantity) is stated too. The estimated total is
--     derived on read: budget_amount for a total, otherwise
--     budget_amount * pricing_quantity / pricing_block. NULL budget_amount
--     means the client did not state one.
-- ---------------------------------------------------------------------------
ALTER TABLE request ADD COLUMN pricing_basis    pricing_basis NOT NULL DEFAULT 'total';
ALTER TABLE request ADD COLUMN pricing_unit     text;
ALTER TABLE request ADD COLUMN pricing_block    integer;
ALTER TABLE request ADD COLUMN pricing_quantity integer;
ALTER TABLE request ADD COLUMN budget_amount    numeric(14,2);

COMMENT ON COLUMN request.pricing_basis IS
  'How the client states the budget and how bids are priced: total, or per_unit '
  '(an amount per pricing_block of pricing_unit).';
COMMENT ON COLUMN request.pricing_unit IS
  'Unit the per-unit price is quoted for; the target_unit vocabulary. hours means '
  'hours of footage. NULL on a total.';
COMMENT ON COLUMN request.pricing_block IS
  'How many units one price covers: 1, 100, 1000, any N. NULL on a total.';
COMMENT ON COLUMN request.pricing_quantity IS
  'How many pricing_units the client expects to buy, for the estimated total. '
  'NULL on a total.';
COMMENT ON COLUMN request.budget_amount IS
  'The budget: the whole amount on a total, the amount per block on per_unit. '
  'NULL when the client did not state one. Hidden from bidders when '
  'budget_disclosed is false.';

-- Every existing request was priced as a fixed total range; it becomes a total
-- at its old maximum. updated_at is not a user edit here, so its trigger is
-- held off for the copy.
ALTER TABLE request DISABLE TRIGGER request_updated_at;
UPDATE request SET budget_amount = coalesce(budget_max, budget_min);
ALTER TABLE request ENABLE TRIGGER request_updated_at;

ALTER TABLE request
  ADD CONSTRAINT request_pricing_shape CHECK (
    (pricing_basis = 'total'
      AND pricing_unit IS NULL AND pricing_block IS NULL AND pricing_quantity IS NULL)
    OR (pricing_basis = 'per_unit'
      AND pricing_unit IS NOT NULL AND pricing_block >= 1 AND pricing_quantity > 0));
ALTER TABLE request
  ADD CONSTRAINT request_pricing_unit_check CHECK (pricing_unit IS NULL OR pricing_unit IN
    ('photos','videos','audio_clips','audio_hours','responses','records','sites','hours'));
ALTER TABLE request
  ADD CONSTRAINT request_budget_amount_check CHECK (budget_amount IS NULL OR budget_amount >= 0);

ALTER TABLE request DROP CONSTRAINT request_budget_order;
ALTER TABLE request DROP CONSTRAINT request_pricing_model_check;
ALTER TABLE request DROP COLUMN budget_min;
ALTER TABLE request DROP COLUMN budget_max;
ALTER TABLE request DROP COLUMN pricing_model_requested;
ALTER TABLE request DROP COLUMN milestones;

-- ---------------------------------------------------------------------------
-- 3 · proposal: one price on the client's basis
-- ---------------------------------------------------------------------------
ALTER TABLE proposal DROP COLUMN unit_price;
ALTER TABLE proposal DROP COLUMN unit;
COMMENT ON COLUMN proposal.price IS
  'The bid, on the request''s basis: the whole price on a total, the price per '
  'pricing_block on per_unit. Becomes contract.value at award.';

-- ---------------------------------------------------------------------------
-- 4 · contract: the basis frozen at award, no milestone, no fee
-- ---------------------------------------------------------------------------
ALTER TABLE contract ADD COLUMN pricing_basis    pricing_basis NOT NULL DEFAULT 'total';
ALTER TABLE contract ADD COLUMN pricing_unit     text;
ALTER TABLE contract ADD COLUMN pricing_block    integer;
ALTER TABLE contract ADD COLUMN pricing_quantity integer;
ALTER TABLE contract
  ADD CONSTRAINT contract_pricing_shape CHECK (
    (pricing_basis = 'total'
      AND pricing_unit IS NULL AND pricing_block IS NULL AND pricing_quantity IS NULL)
    OR (pricing_basis = 'per_unit'
      AND pricing_unit IS NOT NULL AND pricing_block >= 1 AND pricing_quantity > 0));
ALTER TABLE contract
  ADD CONSTRAINT contract_pricing_unit_check CHECK (pricing_unit IS NULL OR pricing_unit IN
    ('photos','videos','audio_clips','audio_hours','responses','records','sites','hours'));
COMMENT ON COLUMN contract.value IS
  'The agreed amount on pricing_basis: the whole price on a total, the rate per '
  'pricing_block on per_unit. The estimated total of a per-unit contract is '
  'value * pricing_quantity / pricing_block.';
COMMENT ON COLUMN contract.pricing_basis IS
  'Copied from the request at award and never changed, like rubric_snapshot: '
  'invoices are priced against it.';

ALTER TABLE contract DROP COLUMN milestone_pct;
ALTER TABLE contract DROP COLUMN platform_fee_pct;

-- ---------------------------------------------------------------------------
-- Guard B · The ledger is dropped only once its rows are safe elsewhere
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_invoices bigint;
  v_legs     bigint;
  v_txns     bigint;
BEGIN
  SELECT count(*) INTO v_invoices FROM invoice;
  SELECT count(*) INTO v_legs     FROM ledger_entry;
  SELECT count(*) INTO v_txns     FROM ledger_transaction;
  IF v_invoices + v_legs + v_txns > 0
     AND current_setting('sourcehub.old_billing_dumped', true) IS DISTINCT FROM 'yes' THEN
    RAISE EXCEPTION '320: the ledger holds % invoice(s), % transaction(s) and % leg(s). Dump them '
                    'into the rollback folder, then run with -x old_billing_dumped=yes. '
                    'Nothing was dropped',
      v_invoices, v_txns, v_legs;
  END IF;
  RAISE NOTICE '320: dropping the ledger with % invoice(s), % transaction(s) and % leg(s)',
    v_invoices, v_txns, v_legs;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 5 · The ledger goes: children before parents, then the function the
--     constraint trigger ran, then the types only these tables used.
-- ---------------------------------------------------------------------------
DROP TABLE ledger_entry;
DROP TABLE invoice;
DROP TABLE ledger_transaction;
DROP TABLE ledger_account;
DROP FUNCTION assert_ledger_balanced();
DROP TYPE ledger_entry_type;
DROP TYPE ledger_direction;
DROP TYPE invoice_status;

-- ---------------------------------------------------------------------------
-- 6 · invoice, as the partner raises it
--
--     client_org_id and partner_org_id are copied from the contract so the
--     policies are column compares (as on contract itself), but by the insert
--     trigger below, never by the caller. The money columns are set once, by
--     the same trigger, and the application login holds UPDATE on status,
--     payment_reference and withdrawn_reason only.
-- ---------------------------------------------------------------------------
CREATE TYPE invoice_status AS ENUM ('issued', 'paid', 'acknowledged', 'withdrawn');

CREATE TABLE invoice (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  text UNIQUE NOT NULL,      -- INV-01
  contract_id     uuid NOT NULL REFERENCES contract(id) ON DELETE RESTRICT,
  client_org_id   uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  partner_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  currency        char(3) NOT NULL DEFAULT 'USD',

  -- per-unit: the quantity claimed and the frozen rate it is priced at.
  -- total: all four NULL and the partner states the amount
  quantity        numeric(14,2) CHECK (quantity IS NULL OR quantity > 0),
  unit            text,
  block           integer CHECK (block IS NULL OR block >= 1),
  rate            numeric(14,2) CHECK (rate IS NULL OR rate >= 0),
  amount          numeric(14,2) NOT NULL CHECK (amount > 0),
  -- captures accepted at gate 2 on the contract when the invoice was raised:
  -- context for the client, not the priced unit (hours are never measured)
  accepted_assets_at_issue integer
                  CHECK (accepted_assets_at_issue IS NULL OR accepted_assets_at_issue >= 0),
  note            text CHECK (note IS NULL OR char_length(note) <= 2000),

  status          invoice_status NOT NULL DEFAULT 'issued',
  issued_at       timestamptz NOT NULL DEFAULT now(),
  issued_by       uuid REFERENCES app_user(id),
  paid_at         timestamptz,
  paid_by         uuid REFERENCES app_user(id),
  payment_reference text
                  CHECK (payment_reference IS NULL OR char_length(payment_reference) <= 200),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES app_user(id),
  withdrawn_at    timestamptz,
  withdrawn_by    uuid REFERENCES app_user(id),
  withdrawn_reason text
                  CHECK (withdrawn_reason IS NULL OR char_length(withdrawn_reason) <= 500),

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT invoice_parties_differ CHECK (client_org_id <> partner_org_id),
  CONSTRAINT invoice_currency_shape CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT invoice_basis_shape CHECK (
    (quantity IS NULL AND unit IS NULL AND block IS NULL AND rate IS NULL)
    OR (quantity IS NOT NULL AND unit IS NOT NULL AND block IS NOT NULL AND rate IS NOT NULL)),
  -- each state carries exactly the stamps it needs
  CONSTRAINT invoice_status_stamps CHECK (
    CASE status
      WHEN 'issued'       THEN paid_at IS NULL AND acknowledged_at IS NULL
                                AND withdrawn_at IS NULL
      WHEN 'paid'         THEN paid_at IS NOT NULL AND acknowledged_at IS NULL
                                AND withdrawn_at IS NULL
      WHEN 'acknowledged' THEN paid_at IS NOT NULL AND acknowledged_at IS NOT NULL
                                AND withdrawn_at IS NULL
      WHEN 'withdrawn'    THEN withdrawn_at IS NOT NULL AND paid_at IS NULL
                                AND acknowledged_at IS NULL
    END),
  CONSTRAINT invoice_withdrawn_reason_shape CHECK (withdrawn_reason IS NULL OR status = 'withdrawn')
);

CREATE INDEX invoice_contract_idx ON invoice (contract_id);
CREATE INDEX invoice_client_idx   ON invoice (client_org_id);
CREATE INDEX invoice_partner_idx  ON invoice (partner_org_id);
CREATE INDEX invoice_open_idx     ON invoice (status) WHERE status <> 'withdrawn';

COMMENT ON TABLE invoice IS
  'A partner''s claim for payment on a contract, raised once some of its work has '
  'passed gate 2. issued -> paid (client) -> acknowledged (partner); an unpaid '
  'one may be withdrawn (partner). The platform moves no money.';

-- At issue: the parties, the currency and the rate come from the contract, the
-- amount is computed from them, and every later stamp starts empty. Runs with
-- the caller's rights: a partner can read its own contract, and the policy
-- below refuses an insert against anyone else's.
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

CREATE TRIGGER invoice_before_insert BEFORE INSERT ON invoice
  FOR EACH ROW EXECUTE FUNCTION invoice_before_insert();

-- Afterwards: three moves, each by one party, each stamped here and nowhere
-- else. Everything set at issue is frozen. The comparison with the session's
-- organisation is IS DISTINCT FROM so that no context (NULL) is refused, not
-- waved through.
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

CREATE TRIGGER invoice_transition BEFORE UPDATE ON invoice
  FOR EACH ROW EXECUTE FUNCTION invoice_transition();
CREATE TRIGGER invoice_updated_at BEFORE UPDATE ON invoice
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 7 · Row-level security, as 100 writes it, less FORCE (270). Both parties
--     read; the partner raises, against its own contract only; both parties
--     update, and the transition trigger decides which of them may do what.
--     Ops reads. Workers are shut out, as the 120 loop did for the old table.
-- ---------------------------------------------------------------------------
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_select ON invoice FOR SELECT
  USING (is_platform_admin() OR client_org_id = current_org_id()
         OR partner_org_id = current_org_id());
CREATE POLICY invoice_insert ON invoice FOR INSERT
  WITH CHECK (partner_org_id = current_org_id() AND contract_is_mine_as_partner(contract_id));
CREATE POLICY invoice_update ON invoice FOR UPDATE
  USING      (client_org_id = current_org_id() OR partner_org_id = current_org_id())
  WITH CHECK (client_org_id = current_org_id() OR partner_org_id = current_org_id());
CREATE POLICY invoice_worker_deny ON invoice AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

-- ---------------------------------------------------------------------------
-- 8 · Grants, 270 style: the default privileges (000) include DELETE and
--     UPDATE on every column, so they come off first. The triggers write the
--     stamps; the login only ever names the move and its reference.
-- ---------------------------------------------------------------------------
REVOKE ALL ON invoice FROM sourcehub_app;
GRANT SELECT, INSERT ON invoice TO sourcehub_app;
GRANT UPDATE (status, payment_reference, withdrawn_reason) ON invoice TO sourcehub_app;
"""

_SEED = """
-- The capability vocabulary for the new invoice flow, as db/900 now seeds it.
-- Carried here because STRUCTURE runs before SEED on a fresh build, so db/320
-- cannot name a permission; on a deployed database this is the only place the
-- rows can come from.
INSERT INTO permission (code, module, description, requires_mfa) VALUES
  ('invoice.raise',       'invoices', 'Raise an invoice on a contract',                     false),
  ('invoice.pay',         'invoices', 'Mark a partner invoice as paid',                     true),
  ('invoice.acknowledge', 'invoices', 'Acknowledge payment of, or withdraw, an invoice',    false)
ON CONFLICT DO NOTHING;

UPDATE permission SET module = 'invoices', description = 'Read invoices on own contracts'
 WHERE code = 'invoice.read';
UPDATE permission SET module = 'invoices' WHERE code = 'billing.read';
UPDATE permission SET description = 'Accept a delivery' WHERE code = 'contract.approve';

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'client' AND r.is_system AND p.code = 'invoice.pay'
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'tenant' AND r.is_system AND p.code IN ('invoice.raise', 'invoice.acknowledge')
ON CONFLICT DO NOTHING;
"""

_DOWN = """
-- Downgrade of 0035: the escrow ledger returns as 080 made it, with 100's
-- policies (ENABLE only, 270 took FORCE off), 110's definer fix, 120's worker
-- deny and 900's three platform accounts, all empty — the rows it held are in
-- the rollback folder, not here. The pricing columns come off request, proposal
-- and contract and the old ones return at the end of each row (the one thing a
-- downgrade cannot put back without rewriting the table), with the data mapped
-- back: a per-unit price becomes the estimated total it implied. Invoices
-- raised under 0035 have no home in the old model, so the downgrade refuses to
-- run while any exist unless the operator has set the same session flag the
-- upgrade uses.

-- ---------------------------------------------------------------------------
-- Guard · Partner-raised invoices have nowhere to go
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_rows bigint;
BEGIN
  SELECT count(*) INTO v_rows FROM invoice;
  IF v_rows > 0
     AND current_setting('sourcehub.old_billing_dumped', true) IS DISTINCT FROM 'yes' THEN
    RAISE EXCEPTION '0035 downgrade: % partner invoice(s) exist and the old model cannot hold '
                    'them. Dump them, then run with -x old_billing_dumped=yes. Nothing was changed',
      v_rows;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- Capabilities (900)
-- ---------------------------------------------------------------------------
DELETE FROM role_permission
WHERE  permission_id IN (SELECT id FROM permission
                          WHERE code IN ('invoice.raise', 'invoice.pay', 'invoice.acknowledge'));
DELETE FROM permission WHERE code IN ('invoice.raise', 'invoice.pay', 'invoice.acknowledge');
UPDATE permission SET module = 'ledger', description = 'Read own invoices'
 WHERE code = 'invoice.read';
UPDATE permission SET module = 'ledger' WHERE code = 'billing.read';
UPDATE permission SET description = 'Accept a delivery and release payment'
 WHERE code = 'contract.approve';

-- ---------------------------------------------------------------------------
-- 6-8 · The partner invoice table, its triggers and its type
-- ---------------------------------------------------------------------------
DROP TABLE invoice;
DROP FUNCTION invoice_transition();
DROP FUNCTION invoice_before_insert();
DROP TYPE invoice_status;

-- ---------------------------------------------------------------------------
-- 5 · The types (001)
-- ---------------------------------------------------------------------------
CREATE TYPE ledger_entry_type AS ENUM
  ('invoice','escrow_hold','escrow_release','platform_fee',
   'payout','refund','adjustment');

CREATE TYPE ledger_direction AS ENUM ('debit','credit');

CREATE TYPE invoice_status AS ENUM ('pending','paid','overdue','void');

-- ---------------------------------------------------------------------------
-- 5 · The ledger (080), parents before children; 110's Fix 5 folded in
-- ---------------------------------------------------------------------------
CREATE TABLE ledger_account (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organisation(id) ON DELETE RESTRICT,
  code        text NOT NULL,
  currency    char(3) NOT NULL DEFAULT 'USD',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, code, currency)
);

CREATE TABLE ledger_transaction (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  uuid REFERENCES contract(id) ON DELETE RESTRICT,
  entry_type   ledger_entry_type NOT NULL,
  description  text NOT NULL,
  currency     char(3) NOT NULL DEFAULT 'USD',
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES app_user(id)
);

CREATE INDEX ledger_transaction_contract_idx ON ledger_transaction (contract_id);
CREATE INDEX ledger_transaction_type_idx     ON ledger_transaction (entry_type, occurred_at DESC);

CREATE TABLE ledger_entry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid NOT NULL REFERENCES ledger_transaction(id) ON DELETE RESTRICT,
  account_id      uuid NOT NULL REFERENCES ledger_account(id) ON DELETE RESTRICT,
  direction       ledger_direction NOT NULL,
  amount          numeric(14,2) NOT NULL CHECK (amount > 0),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ledger_entry_transaction_idx ON ledger_entry (transaction_id);
CREATE INDEX ledger_entry_account_idx     ON ledger_entry (account_id);

CREATE RULE ledger_entry_no_update AS ON UPDATE TO ledger_entry DO INSTEAD NOTHING;
CREATE RULE ledger_entry_no_delete AS ON DELETE TO ledger_entry DO INSTEAD NOTHING;

CREATE OR REPLACE FUNCTION assert_ledger_balanced() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_diff numeric(14,2);
BEGIN
  SELECT coalesce(sum(CASE WHEN direction = 'debit'  THEN amount ELSE 0 END), 0)
       - coalesce(sum(CASE WHEN direction = 'credit' THEN amount ELSE 0 END), 0)
    INTO v_diff
  FROM ledger_entry WHERE transaction_id = NEW.transaction_id;

  IF v_diff <> 0 THEN
    RAISE EXCEPTION 'ledger transaction % is out of balance by %', NEW.transaction_id, v_diff
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END
$fn$;

CREATE CONSTRAINT TRIGGER ledger_entry_balanced
  AFTER INSERT ON ledger_entry
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_ledger_balanced();

CREATE TABLE invoice (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  text UNIQUE NOT NULL,
  contract_id     uuid REFERENCES contract(id) ON DELETE RESTRICT,
  party_org_id    uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  transaction_id  uuid REFERENCES ledger_transaction(id) ON DELETE SET NULL,
  kind            text NOT NULL,
  amount          numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency        char(3) NOT NULL DEFAULT 'USD',
  status          invoice_status NOT NULL DEFAULT 'pending',
  issued_on       date NOT NULL DEFAULT current_date,
  due_on          date,
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX invoice_party_idx    ON invoice (party_org_id) WHERE deleted_at IS NULL;
CREATE INDEX invoice_contract_idx ON invoice (contract_id) WHERE deleted_at IS NULL;
CREATE INDEX invoice_status_idx   ON invoice (status) WHERE deleted_at IS NULL;

CREATE TRIGGER invoice_updated_at BEFORE UPDATE ON invoice
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security as 100 wrote it, less FORCE (270), and 120's worker deny
-- ---------------------------------------------------------------------------
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_select ON invoice FOR SELECT
  USING (is_platform_admin() OR party_org_id = current_org_id());
CREATE POLICY invoice_write ON invoice FOR ALL
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY invoice_worker_deny ON invoice AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

ALTER TABLE ledger_account ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_account_select ON ledger_account FOR SELECT
  USING (is_platform_admin() OR org_id = current_org_id());
CREATE POLICY ledger_account_write ON ledger_account FOR ALL
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());

ALTER TABLE ledger_transaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_transaction_select ON ledger_transaction FOR SELECT
  USING (is_platform_admin() OR (contract_id IS NOT NULL AND contract_is_visible(contract_id)));
CREATE POLICY ledger_transaction_write ON ledger_transaction FOR ALL
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());

ALTER TABLE ledger_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_entry_select ON ledger_entry FOR SELECT
  USING (is_platform_admin()
         OR EXISTS (SELECT 1 FROM ledger_account a
                     WHERE a.id = ledger_entry.account_id AND a.org_id = current_org_id()));
CREATE POLICY ledger_entry_insert ON ledger_entry FOR INSERT
  WITH CHECK (is_platform_admin());

-- ---------------------------------------------------------------------------
-- The platform's own accounts (900)
-- ---------------------------------------------------------------------------
INSERT INTO ledger_account (org_id, code, currency) VALUES
  (NULL, 'escrow',     'USD'),
  (NULL, 'fee_income', 'USD'),
  (NULL, 'cash',       'USD');

-- ---------------------------------------------------------------------------
-- 3 · proposal: unit_price and unit return; a per-unit bid becomes the total
--     it implied, with the rate kept as the unit price
-- ---------------------------------------------------------------------------
ALTER TABLE proposal ADD COLUMN unit_price numeric CHECK (unit_price IS NULL OR unit_price >= 0);
ALTER TABLE proposal ADD COLUMN unit text;
ALTER TABLE proposal DISABLE TRIGGER proposal_updated_at;
UPDATE proposal p
   SET unit_price = p.price,
       unit       = r.pricing_unit,
       price      = round(p.price * r.pricing_quantity / r.pricing_block, 2)
  FROM request r
 WHERE r.id = p.request_id AND r.pricing_basis = 'per_unit';
ALTER TABLE proposal ENABLE TRIGGER proposal_updated_at;
COMMENT ON COLUMN proposal.price IS NULL;

-- ---------------------------------------------------------------------------
-- 4 · contract: the percentages return; a per-unit value becomes the total
-- ---------------------------------------------------------------------------
ALTER TABLE contract
  ADD COLUMN milestone_pct smallint NOT NULL DEFAULT 50 CHECK (milestone_pct BETWEEN 0 AND 100);
ALTER TABLE contract ADD COLUMN platform_fee_pct numeric(5,2) NOT NULL DEFAULT 9.00;
ALTER TABLE contract DISABLE TRIGGER contract_updated_at;
UPDATE contract
   SET value = round(value * pricing_quantity / pricing_block, 2)
 WHERE pricing_basis = 'per_unit';
ALTER TABLE contract ENABLE TRIGGER contract_updated_at;
ALTER TABLE contract DROP CONSTRAINT contract_pricing_shape;
ALTER TABLE contract DROP CONSTRAINT contract_pricing_unit_check;
ALTER TABLE contract DROP COLUMN pricing_basis;
ALTER TABLE contract DROP COLUMN pricing_unit;
ALTER TABLE contract DROP COLUMN pricing_block;
ALTER TABLE contract DROP COLUMN pricing_quantity;
COMMENT ON COLUMN contract.value IS NULL;

-- ---------------------------------------------------------------------------
-- 2 · request: the range returns at the estimated total, the pricing model
--     and the milestones as they were
-- ---------------------------------------------------------------------------
ALTER TABLE request
  ADD COLUMN budget_min numeric(14,2) CHECK (budget_min IS NULL OR budget_min >= 0);
ALTER TABLE request
  ADD COLUMN budget_max numeric(14,2) CHECK (budget_max IS NULL OR budget_max >= 0);
ALTER TABLE request ADD COLUMN pricing_model_requested text NOT NULL DEFAULT 'fixed';
ALTER TABLE request ADD COLUMN milestones jsonb NOT NULL DEFAULT '[]';
ALTER TABLE request DISABLE TRIGGER request_updated_at;
UPDATE request
   SET budget_min = CASE WHEN pricing_basis = 'per_unit'
                         THEN round(budget_amount * pricing_quantity / pricing_block, 2)
                         ELSE budget_amount END,
       budget_max = CASE WHEN pricing_basis = 'per_unit'
                         THEN round(budget_amount * pricing_quantity / pricing_block, 2)
                         ELSE budget_amount END,
       pricing_model_requested = CASE WHEN pricing_basis = 'per_unit' THEN 'per_unit'
                                      ELSE 'fixed' END;
ALTER TABLE request ENABLE TRIGGER request_updated_at;
ALTER TABLE request
  ADD CONSTRAINT request_budget_order
    CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min);
ALTER TABLE request
  ADD CONSTRAINT request_pricing_model_check
    CHECK (pricing_model_requested IN ('fixed','per_unit','milestone','open'));
ALTER TABLE request DROP CONSTRAINT request_pricing_shape;
ALTER TABLE request DROP CONSTRAINT request_pricing_unit_check;
ALTER TABLE request DROP CONSTRAINT request_budget_amount_check;
ALTER TABLE request DROP COLUMN pricing_basis;
ALTER TABLE request DROP COLUMN pricing_unit;
ALTER TABLE request DROP COLUMN pricing_block;
ALTER TABLE request DROP COLUMN pricing_quantity;
ALTER TABLE request DROP COLUMN budget_amount;

-- ---------------------------------------------------------------------------
-- 1 · The basis type
-- ---------------------------------------------------------------------------
DROP TYPE pricing_basis;
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
