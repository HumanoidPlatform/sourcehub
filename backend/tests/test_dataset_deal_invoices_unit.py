"""db/450 invoices a dataset deal like a contract; 0049 carries it.

Accepting the seller's quote issues an invoice from the seller to the buyer in
the contracts' invoice table. The buyer marks it paid, the seller acknowledges
it, and only that moves the deal to paid. A deal's invoice is never withdrawn.

Scripts only; no database is opened.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = ROOT / "db" / "450_dataset_deal_invoices.sql"
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0049_dataset_deal_invoices.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
SEED = ROOT / "db" / "900_seed.sql"
API = ROOT / "backend" / "src" / "sourcehub" / "api" / "v1" / "catalogue.py"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _code(text: str) -> str:
    return "\n".join(ln for ln in text.splitlines() if not ln.strip().startswith("--"))


CODE = _code(SQL_TEXT)


def _function(name: str) -> str:
    start = CODE.index(f"FUNCTION {name}()")
    return CODE[start : CODE.index("$fn$;", start)]


def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0048():
    assert re.search(r'^revision = "0049"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0048"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_440_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    names = m.group(1).split()
    after = names[names.index("440_catalogue_public_requests_as_deals") + 1]
    assert after == "450_dataset_deal_invoices"


def test_an_invoice_bills_a_contract_or_a_deal_never_both_and_one_per_deal():
    assert "ALTER TABLE invoice ALTER COLUMN contract_id DROP NOT NULL;" in CODE
    assert "CHECK ((contract_id IS NULL) <> (deal_id IS NULL))" in CODE
    assert "CREATE UNIQUE INDEX invoice_deal_key ON invoice (deal_id)" in CODE


def test_a_deals_invoice_is_priced_from_the_accepted_quote():
    fn = _function("invoice_before_insert")
    assert "IF NEW.deal_id IS NOT NULL THEN" in fn
    assert "k.status <> 'accepted'" in fn
    assert "NEW.client_org_id   := k.buyer_org_id;" in fn
    assert "NEW.partner_org_id  := k.seller_org_id;" in fn
    assert "NEW.amount          := k.quote_amount;" in fn
    assert "NEW.issued_by       := NULL;" in fn


def test_a_deals_invoice_is_never_withdrawn():
    fn = _function("invoice_transition")
    assert "NEW.deal_id IS DISTINCT FROM OLD.deal_id" in fn
    assert "IF OLD.deal_id IS NOT NULL THEN" in fn


def test_acknowledging_makes_the_deal_paid_and_nothing_else_does():
    settle = _function("invoice_settles_deal")
    assert "SET    status = 'paid', invoice_number = NEW.reference_code" in settle
    assert "NEW.deal_id IS NOT NULL AND OLD.status = 'paid' AND NEW.status = 'acknowledged'" in CODE
    deal = _function("datahub_dataset_deal_transition")
    assert "i.deal_id = OLD.id AND i.status = 'acknowledged'" in deal


def test_accepting_issues_the_invoice_with_the_definers_rights():
    issue = _function("datahub_deal_issue_invoice")
    assert "SECURITY DEFINER" in issue
    assert "next_reference_code('INV', 'seq_ref_invoice')" in issue
    assert "'catalogue_deal'" in issue
    assert "WHEN (OLD.status <> 'accepted' AND NEW.status = 'accepted')" in CODE
    # nobody raises a deal's invoice by hand: the insert policy is untouched
    assert "invoice_insert" not in CODE


def test_deals_accepted_before_get_their_invoice():
    assert "WHERE  k.status = 'accepted'" in CODE


def test_a_partner_buyer_pays_and_a_client_seller_acknowledges():
    seed = _code(_literal("_SEED"))
    assert "r.code = 'tenant' AND r.is_system AND p.code = 'invoice.pay'" in seed
    assert "r.code = 'client' AND r.is_system AND p.code = 'invoice.acknowledge'" in seed
    seed900 = SEED.read_text(encoding="utf-8")
    for role, cap in (("tenant", "invoice.pay"), ("client", "invoice.acknowledge")):
        caps = re.search(rf"WHERE r\.code = '{role}' AND p\.code IN \((.*?)\);", seed900, re.S)
        assert caps and f"'{cap}'" in caps.group(1)


def test_the_seller_no_longer_marks_paid_and_a_quote_is_above_zero():
    api = API.read_text(encoding="utf-8")
    assert '"/catalogue/deals/{deal_id}/paid"' not in api
    assert "amount: Decimal = Field(gt=0" in api


def test_the_downgrade_refuses_while_a_deal_has_an_invoice():
    down = _code(_literal("_DOWN"))
    assert "IF EXISTS (SELECT 1 FROM invoice WHERE deal_id IS NOT NULL)" in down
    assert down.index("RAISE EXCEPTION '0049 downgrade") < down.index("DROP COLUMN deal_id")
    assert "ALTER COLUMN contract_id SET NOT NULL" in down
