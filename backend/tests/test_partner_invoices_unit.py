"""db/320 replaces the escrow ledger with partner-raised invoices; 0035 carries it.

The two files stay one change (verbatim); the capability rows ride in a
separate literal because STRUCTURE runs before SEED on a fresh build; both
guards run before anything is dropped; the drops go children before parents
and the old enum goes only after the old table; the new table is fenced by
triggers, policies and column grants, never FORCE; the downgrade brings the
ledger back as 080 made it and maps the pricing columns back; and the backend
reads and writes the new shapes, never the old.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "db"
SQL = DB / "320_partner_invoices.sql"
SEED_FILE = DB / "900_seed.sql"
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION = VERSIONS / "0035_partner_invoices.py"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
ENV = ROOT / "backend" / "migrations" / "env.py"
SRC = ROOT / "backend" / "src" / "sourcehub"

SQL_TEXT = SQL.read_text(encoding="utf-8")
MIGRATION_TEXT = MIGRATION.read_text(encoding="utf-8")
SEED_TEXT = SEED_FILE.read_text(encoding="utf-8")

OLD_TABLES = ("ledger_entry", "invoice", "ledger_transaction", "ledger_account")
NEW_CAPS = ("invoice.raise", "invoice.pay", "invoice.acknowledge")


def _literal(name: str, text: str = MIGRATION_TEXT) -> str:
    m = re.search(rf'{name} = """(.*?)"""', text, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0035", "exec"), ns)
    return ns["_statements"](ddl)


def _code_only(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith("#"))


UP = _literal("_UP")
SEED = _literal("_SEED")
DOWN = _literal("_DOWN")


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert UP == "\n" + SQL_TEXT


def test_the_migration_follows_0034():
    assert re.search(r'^revision = "0035"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0034"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_310_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    listed = m.group(1).split()
    at = listed.index("320_partner_invoices")
    assert listed[at - 1] == "310_review_defects"
    assert all(int(name[:3]) > 320 for name in listed[at + 1 :])


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/320", SQL_TEXT), ("_SEED", SEED), ("_DOWN", DOWN)):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_the_splitter_keeps_every_body_whole():
    stmts = _statements(UP) + _statements(SEED) + _statements(DOWN)
    for stmt in stmts:
        assert stmt.count("$fn$") in (0, 2), stmt[:200]
    bodies = [s for s in stmts if "$fn$" in s]
    # two guards, two trigger functions on the way up; a guard and the balance
    # function on the way down
    assert len(bodies) == 6, [b.splitlines()[0] for b in bodies]
    for b in bodies:
        assert "DROP TABLE" not in b and "CREATE TABLE" not in b


def test_upgrade_runs_the_schema_then_the_seed_and_downgrade_its_literal():
    tree = ast.parse(MIGRATION_TEXT)
    up = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "upgrade")
    loop = up.body[0]
    assert isinstance(loop, ast.For)
    names = [n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name) and n.id.startswith("_")]
    assert names == ["_statements", "_UP", "_statements", "_SEED"]
    down = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "downgrade")
    loop = down.body[0]
    assert isinstance(loop, ast.For)
    assert "_DOWN" in {n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name)}


# ---------------------------------------------------------------------------
# What the SQL does, in the order it must
# ---------------------------------------------------------------------------
def test_both_guards_run_before_anything_is_dropped():
    first_drop = min(SQL_TEXT.index("DROP COLUMN"), SQL_TEXT.index("DROP TABLE"))
    guard_a = SQL_TEXT.index("RAISE EXCEPTION '320: % request(s)")
    assert guard_a < first_drop
    guard_b = SQL_TEXT.index("current_setting('sourcehub.old_billing_dumped', true)")
    assert guard_b < SQL_TEXT.index("DROP TABLE ledger_entry;")
    # the guard counts the three tables that carry money, not the seeded accounts
    block = SQL_TEXT[SQL_TEXT.rindex("DO $fn$", 0, guard_b) : guard_b]
    assert "FROM invoice" in block and "FROM ledger_entry" in block
    assert "FROM ledger_transaction" in block and "FROM ledger_account" not in block


def test_the_operator_flag_reaches_the_guard():
    env = ENV.read_text(encoding="utf-8")
    assert "get_x_argument(as_dictionary=True)" in env
    assert "SET sourcehub.old_billing_dumped = 'yes'" in env
    guard = "current_setting('sourcehub.old_billing_dumped', true) IS DISTINCT FROM 'yes'"
    assert guard in SQL_TEXT and guard in DOWN


def test_the_conversion_runs_before_the_old_columns_go():
    filled = SQL_TEXT.index("UPDATE request SET budget_amount = coalesce(budget_max, budget_min);")
    assert SQL_TEXT.index("ADD COLUMN budget_amount") < filled
    assert filled < SQL_TEXT.index("DROP COLUMN budget_min;")
    # constraints by name first, as 310 does, then the columns
    col_gone = SQL_TEXT.index("DROP COLUMN budget_min;")
    assert SQL_TEXT.index("DROP CONSTRAINT request_budget_order;") < col_gone
    assert SQL_TEXT.index("DROP CONSTRAINT request_pricing_model_check;") < SQL_TEXT.index(
        "DROP COLUMN pricing_model_requested;"
    )
    for col in ("budget_min", "budget_max", "pricing_model_requested", "milestones"):
        assert SQL_TEXT.count(f"DROP COLUMN {col};") == 1
    for col in ("unit_price", "unit"):
        assert f"ALTER TABLE proposal DROP COLUMN {col};" in SQL_TEXT
    for col in ("milestone_pct", "platform_fee_pct"):
        assert f"ALTER TABLE contract DROP COLUMN {col};" in SQL_TEXT


def test_the_drops_go_children_first_and_the_enum_after_its_table():
    order = [SQL_TEXT.index(f"DROP TABLE {t};") for t in OLD_TABLES]
    assert order == sorted(order)
    assert SQL_TEXT.index("DROP FUNCTION assert_ledger_balanced();") > order[-1]
    assert SQL_TEXT.index("DROP TYPE invoice_status;") > SQL_TEXT.index("DROP TABLE invoice;")
    assert SQL_TEXT.index("DROP TYPE invoice_status;") < SQL_TEXT.index(
        "CREATE TYPE invoice_status AS ENUM ('issued', 'paid', 'acknowledged', 'withdrawn');"
    )
    for t in ("ledger_entry_type", "ledger_direction"):
        assert f"DROP TYPE {t};" in SQL_TEXT
    assert "CASCADE" not in SQL_TEXT


def test_the_new_table_is_fenced_by_the_database_not_only_the_api():
    table = SQL_TEXT[SQL_TEXT.index("CREATE TABLE invoice (") :]
    # the trigger, not the caller, names the parties and prices the claim
    assert "NEW.client_org_id   := c.client_org_id;" in table
    assert "NEW.partner_org_id  := c.partner_org_id;" in table
    assert "NEW.amount := round(NEW.quantity * c.value / c.pricing_block, 2);" in table
    assert "CREATE TRIGGER invoice_before_insert BEFORE INSERT ON invoice" in table
    # the three moves, each tied to its party
    assert "OLD.status = 'issued' AND NEW.status = 'paid'" in table
    assert "OLD.status = 'paid' AND NEW.status = 'acknowledged'" in table
    assert "OLD.status = 'issued' AND NEW.status = 'withdrawn'" in table
    assert table.count("current_org_id() IS DISTINCT FROM OLD.client_org_id") == 1
    assert table.count("current_org_id() IS DISTINCT FROM OLD.partner_org_id") == 2
    assert "ERRCODE = 'check_violation'" in table
    # policies: read both, insert partner against its own contract, update both
    assert "CREATE POLICY invoice_insert ON invoice FOR INSERT" in table
    assert "contract_is_mine_as_partner(contract_id)" in table
    assert "CREATE POLICY invoice_update ON invoice FOR UPDATE" in table
    assert "CREATE POLICY invoice_worker_deny ON invoice AS RESTRICTIVE FOR ALL" in table
    assert "invoice_write" not in table  # no platform-admin FOR ALL door this time
    assert "FORCE ROW LEVEL SECURITY" not in SQL_TEXT
    # grants, 270 style
    assert table.index("REVOKE ALL ON invoice FROM sourcehub_app;") < table.index(
        "GRANT SELECT, INSERT ON invoice TO sourcehub_app;"
    )
    assert "GRANT UPDATE (status, payment_reference, withdrawn_reason) ON invoice" in table
    assert "GRANT ALL" not in SQL_TEXT


def test_no_bare_for_all_policy():
    for m in re.finditer(r"CREATE POLICY (\w+) ON \w+ (AS RESTRICTIVE )?FOR ALL", SQL_TEXT):
        assert m.group(2), f"{m.group(1)} is a permissive FOR ALL policy"


# ---------------------------------------------------------------------------
# The capability rows
# ---------------------------------------------------------------------------
def test_the_seed_and_the_migration_grant_the_same_capabilities():
    for cap in NEW_CAPS:
        assert f"('{cap}'" in SEED_TEXT, f"db/900 lacks {cap}"
        assert f"('{cap}'" in SEED, f"_SEED lacks {cap}"
        assert f"'{cap}'" in DOWN
    assert "ON CONFLICT DO NOTHING" in SEED
    assert "r.code = 'client' AND r.is_system AND p.code = 'invoice.pay'" in SEED
    assert ("r.code = 'tenant' AND r.is_system "
            "AND p.code IN ('invoice.raise', 'invoice.acknowledge')") in SEED
    # 900's role matrix, read the way the seed writes it
    matrix = r"WHERE r\.code = '%s' AND p\.code IN \((.*?)\);"
    client = re.search(matrix % "client", SEED_TEXT, re.S).group(1)
    tenant = re.search(matrix % "tenant", SEED_TEXT, re.S).group(1)
    assert "'invoice.pay'" in client and "'invoice.raise'" not in client
    assert "'invoice.raise'" in tenant and "'invoice.acknowledge'" in tenant
    assert "'invoice.pay'" not in tenant
    # the mfa flag follows the blueprint's rule: paying moves money
    assert re.search(r"\('invoice\.pay',\s+'invoices',\s+'[^']*',\s+true\)", SEED_TEXT)
    assert "INSERT INTO ledger_account" not in SEED_TEXT
    assert "'ledger'" not in SEED_TEXT


# ---------------------------------------------------------------------------
# The downgrade
# ---------------------------------------------------------------------------
def test_the_downgrade_recreates_the_ledger_as_080_made_it():
    for t in OLD_TABLES:
        assert f"CREATE TABLE {t} (" in DOWN
    assert DOWN.index("DROP TABLE invoice;") < DOWN.index("DROP TYPE invoice_status;")
    assert DOWN.index("DROP TYPE invoice_status;") < DOWN.index(
        "CREATE TYPE invoice_status AS ENUM ('pending','paid','overdue','void');"
    )
    assert "CREATE RULE ledger_entry_no_update" in DOWN
    assert "CREATE RULE ledger_entry_no_delete" in DOWN
    assert "CREATE CONSTRAINT TRIGGER ledger_entry_balanced" in DOWN
    assert "LANGUAGE plpgsql SECURITY DEFINER AS $fn$" in DOWN  # 110's Fix 5
    assert "CREATE POLICY invoice_worker_deny ON invoice AS RESTRICTIVE FOR ALL" in DOWN
    assert "FORCE ROW LEVEL SECURITY" not in DOWN
    assert "INSERT INTO ledger_account (org_id, code, currency) VALUES" in DOWN
    assert "DROP FUNCTION invoice_transition();" in DOWN
    assert "DROP FUNCTION invoice_before_insert();" in DOWN


def test_the_downgrade_maps_the_pricing_columns_back():
    # per-unit prices become the totals they implied, before the basis columns go
    assert DOWN.index("round(p.price * r.pricing_quantity / r.pricing_block, 2)") < DOWN.index(
        "ALTER TABLE request DROP COLUMN pricing_basis;"
    )
    contract_mapped = DOWN.index("SET value = round(value * pricing_quantity / pricing_block, 2)")
    assert contract_mapped < DOWN.index("ALTER TABLE contract DROP COLUMN pricing_basis;")
    assert "budget_min = CASE WHEN pricing_basis = 'per_unit'" in DOWN
    for col in ("budget_min", "budget_max", "pricing_model_requested", "milestones"):
        assert re.search(rf"ALTER TABLE request\s+ADD COLUMN {col}\b", DOWN), col
    assert DOWN.index("ADD COLUMN unit_price") < DOWN.index("ADD COLUMN unit text")  # 0010's order
    assert "ADD COLUMN milestone_pct" in DOWN and "ADD COLUMN platform_fee_pct" in DOWN
    assert DOWN.rstrip().endswith("DROP TYPE pricing_basis;")
    assert ("DELETE FROM permission WHERE code IN "
            "('invoice.raise', 'invoice.pay', 'invoice.acknowledge');") in DOWN


# ---------------------------------------------------------------------------
# The backend speaks the new shapes, never the old
# ---------------------------------------------------------------------------
def test_no_backend_source_names_the_ledger():
    hits = []
    for path in sorted(SRC.rglob("*.py")):
        text = _code_only(path.read_text(encoding="utf-8"))
        for n, line in enumerate(text.splitlines(), 1):
            if re.search(r"\bledger_(account|entry|transaction)\b|milestone_pct|platform_fee_pct"
                         r"|budget_min|budget_max|pricing_model_requested|unit_price", line):
                hits.append(f"{path.relative_to(ROOT)}:{n}: {line.strip()}")
    assert hits == [], "\n".join(hits)
    assert not (SRC / "modules" / "ledger").exists()
    assert not (SRC / "api" / "v1" / "ledger.py").exists()


def test_the_models_map_the_new_columns():
    mk = _code_only((SRC / "modules" / "marketplace" / "models.py").read_text(encoding="utf-8"))
    for col in ("pricing_basis", "pricing_unit", "pricing_block", "pricing_quantity",
                "budget_amount"):
        assert f"{col}: Mapped[" in mk, col
    dv = _code_only((SRC / "modules" / "delivery" / "models.py").read_text(encoding="utf-8"))
    for col in ("pricing_basis", "pricing_unit", "pricing_block", "pricing_quantity"):
        assert f"{col}: Mapped[" in dv, col
    inv = _code_only((SRC / "modules" / "invoices" / "models.py").read_text(encoding="utf-8"))
    assert '__tablename__ = "invoice"' in inv
    types = _code_only((SRC / "db" / "types.py").read_text(encoding="utf-8"))
    assert 'db_enum("pricing_basis", "total", "per_unit")' in types
    assert 'db_enum("invoice_status", "issued", "paid", "acknowledged", "withdrawn")' in types
    assert "LedgerEntryType" not in types and "LedgerDirection" not in types


def test_the_award_no_longer_touches_money():
    text = _code_only((SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8"))
    assert "record_award" not in text and "record_completion" not in text
    assert "releases payment" not in text and "platform fee" not in text.lower()
    mkt = _code_only((SRC / "modules" / "marketplace" / "service.py").read_text(encoding="utf-8"))
    assert "escrow" not in mkt.lower()


def test_the_invoice_service_moves_an_invoice_with_a_conditional_update():
    text = _code_only((SRC / "modules" / "invoices" / "service.py").read_text(encoding="utf-8"))
    # one UPDATE per move, each gated on the state it leaves, never read-then-write
    assert "WHERE id = :id AND status = '{frm}' RETURNING id" in text
    assert '"issued", "paid"' in text and '"paid", "acknowledged"' in text
    assert '"issued", "withdrawn"' in text
    assert "DBAPIError" in text  # the trigger's refusal becomes a 409, not a 500
    # the claim is raised only against work the partner's own gate has passed
    assert "status = 'accepted'" in text
