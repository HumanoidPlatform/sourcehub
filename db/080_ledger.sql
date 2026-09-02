-- ============================================================================
-- 080 · Ledger — double entry
--
-- The prototype has a flat invoices array where an invoice is just
-- {party, amount, status, kind}. The blueprint is explicit that this must be
-- double entry: "Invoices, escrow holds, releases, fees and payouts are all
-- rows here."
--
-- The reason is the escrow. On award, 50% is invoiced to the client and HELD.
-- On acceptance it releases, the 9% fee is deducted, and the balance is queued
-- for payout. A flat amount column cannot express "this money exists but
-- belongs to neither party yet" — and that is precisely the state a dispute
-- freezes.
--
-- Blueprint SLO: "Ledger correctness — 100%, always. Not an SLO — a
-- reconciliation job that pages on any imbalance."
-- ============================================================================

-- ---------------------------------------------------------------------------
-- account — one per organisation per purpose, plus the platform's own.
-- ---------------------------------------------------------------------------
CREATE TABLE ledger_account (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organisation(id) ON DELETE RESTRICT,  -- NULL = platform-internal
  code        text NOT NULL,                 -- receivable | payable | escrow | fee_income | cash
  currency    char(3) NOT NULL DEFAULT 'USD',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, code, currency)
);


-- ---------------------------------------------------------------------------
-- ledger_transaction — the grouping. Every transaction's entries must sum to
-- zero, which is checked by a deferred constraint trigger below.
-- ---------------------------------------------------------------------------
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


-- ---------------------------------------------------------------------------
-- ledger_entry — one leg. Debits and credits, never a signed amount.
-- ---------------------------------------------------------------------------
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

-- Append-only. A correction is a reversing transaction, never an edit.
CREATE RULE ledger_entry_no_update AS ON UPDATE TO ledger_entry DO INSTEAD NOTHING;
CREATE RULE ledger_entry_no_delete AS ON DELETE TO ledger_entry DO INSTEAD NOTHING;

-- Every transaction balances. Deferred so both legs can be inserted first.
CREATE OR REPLACE FUNCTION assert_ledger_balanced() RETURNS trigger
LANGUAGE plpgsql AS $fn$
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


-- ---------------------------------------------------------------------------
-- invoice — the document a party actually receives.
--
-- A projection over the ledger, not the source of truth. state.invoices in the
-- prototype maps here; the money itself lives in ledger_entry.
-- ---------------------------------------------------------------------------
CREATE TABLE invoice (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  text UNIQUE NOT NULL,      -- INV-01
  contract_id     uuid REFERENCES contract(id) ON DELETE RESTRICT,
  party_org_id    uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  transaction_id  uuid REFERENCES ledger_transaction(id) ON DELETE SET NULL,

  kind            text NOT NULL,             -- 'Milestone 1 of 2', 'Platform fee, 9%'
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
-- Balance view, and the reconciliation check the blueprint demands.
-- ---------------------------------------------------------------------------
CREATE VIEW ledger_account_balance AS
SELECT a.id AS account_id, a.org_id, a.code, a.currency,
       coalesce(sum(CASE WHEN e.direction = 'debit'  THEN e.amount ELSE 0 END), 0)
     - coalesce(sum(CASE WHEN e.direction = 'credit' THEN e.amount ELSE 0 END), 0) AS balance
FROM   ledger_account a
LEFT   JOIN ledger_entry e ON e.account_id = a.id
GROUP  BY a.id, a.org_id, a.code, a.currency;

-- Should always return zero rows. The reconciliation job pages if it does not.
CREATE VIEW ledger_imbalance AS
SELECT t.id AS transaction_id, t.description,
       coalesce(sum(CASE WHEN e.direction = 'debit'  THEN e.amount ELSE 0 END), 0)
     - coalesce(sum(CASE WHEN e.direction = 'credit' THEN e.amount ELSE 0 END), 0) AS diff
FROM   ledger_transaction t
LEFT   JOIN ledger_entry e ON e.transaction_id = t.id
GROUP  BY t.id, t.description
HAVING coalesce(sum(CASE WHEN e.direction = 'debit'  THEN e.amount ELSE 0 END), 0)
     - coalesce(sum(CASE WHEN e.direction = 'credit' THEN e.amount ELSE 0 END), 0) <> 0;
