"""Sibling equipment visibility belongs to borrowers, not to rivals.

Fix 7 (db/110_auth_functions.sql) opened sibling equipment so a supplier could
see what it may borrow. Its predicate asks only whether the OWNER is a sibling,
never who is asking — and a device sponsor is itself a child of a tenant, so
every other sponsor under that tenant is its sibling. Permissive policies OR
together, so that one clause overrode the own-org scoping in equipment_select
for exactly the party that must not have it.

In the deployed system a sponsor onboarded to a partner opened Inventory before
adding anything of its own and saw six devices belonging to the two competing
sponsors in the same network, under the heading "Your fleet".

This narrows the policy to the audience it was written for: aggregator and
business, the kinds that hold equipment.request. The borrow path is unchanged,
equipment_write is untouched, and a sponsor keeps its own inventory through
equipment_select's first clause.

No new table, no new column, no new function.

SQL copied verbatim from db/210_equipment_sibling_scope.sql so the bootstrap and
migration paths keep producing identical schemas (make verify-schema); a test
asserts the two stay byte-identical.

Executed one statement at a time — the same splitter 0012 to 0014, 0018 to 0020
and 0022 use, because asyncpg refuses two statements in one execute.

Revision ID: 0023
Revises: 0022
"""

from alembic import op

revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 210 · Sibling equipment visibility belongs to borrowers, not to rivals
--
-- Fix 7 (db/110_auth_functions.sql) opened sibling equipment so that a
-- supplier could see what it may borrow, and said so in its own words: "a
-- supplier must see its sibling sponsors and their inventory before any loan
-- exists." That is right, and the network axis it was careful about is intact:
-- visibility still requires the same parent, so a rival network never appears.
--
-- But the predicate it wrote asks only whether the OWNER is a sibling. It never
-- asks who is doing the asking. A device sponsor is itself a child of a tenant,
-- so every other sponsor under that tenant is its sibling, and permissive
-- policies OR together — so equipment_select_siblings quietly overrode the
-- own-org scoping in equipment_select (db/100_rls.sql) for exactly the party
-- that must not have it.
--
-- What that looked like in the deployed system: a device sponsor onboarded to a
-- partner opened Inventory before adding anything of its own and saw six
-- devices — every unit count and calibration date belonging to the two
-- competing sponsors in the same network — under the heading "Your fleet", with
-- the owner column suppressed because the console hides it for sponsors.
--
-- The fix is to name the audience Fix 7 was actually written for. aggregator
-- and business are the kinds that hold equipment.request (db/900_seed.sql);
-- sponsor holds equipment.manage and equipment.decide and has no reason to read
-- a competitor's stock. The org_kind test is the same instrument db/180 uses on
-- the same kind of question.
--
-- SCOPE, deliberately narrow:
--   * SELECT only. equipment_write was always own-org and is not touched.
--   * The borrow path is unchanged: an aggregator or business still sees every
--     sibling sponsor's inventory, which is what makes a loan requestable.
--   * A tenant still sees its own network through org_in_my_network, and a
--     borrower on a live loan still sees the kit it holds. Both clauses live in
--     equipment_select and are untouched.
--   * A sponsor keeps its own inventory through equipment_select's first
--     clause. It loses only other people's.
--
-- THE COST: a sponsor can no longer see what else its network lends. Nothing in
-- the product asked it to — a sponsor lends, decides loans and manages its own
-- calibration, and none of those needs another sponsor's numbers.
--
-- DROP IF EXISTS first so this file is correct in both directions it is applied
-- from: a fresh bootstrap, where db/110 created the broad policy moments
-- earlier, and a database already in service, where it has been live.
-- ============================================================================

DROP POLICY IF EXISTS equipment_select_siblings ON equipment;

-- Permissive, as before, so it still only adds to what equipment_select allows.
-- The conjunction is the whole change: sibling-hood decides WHICH rows, and the
-- caller's kind decides WHETHER the policy applies at all.
CREATE POLICY equipment_select_siblings ON equipment FOR SELECT
  USING (
       current_org_kind() IN ('aggregator','business')
   AND org_is_my_network_sibling(sponsor_org_id)
  );
"""

_DOWN = """
-- Back to the predicate Fix 7 shipped: sibling-hood alone, whoever is asking.
DROP POLICY IF EXISTS equipment_select_siblings ON equipment;

CREATE POLICY equipment_select_siblings ON equipment FOR SELECT
  USING (org_is_my_network_sibling(sponsor_org_id));
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
