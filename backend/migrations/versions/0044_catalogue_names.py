"""catalogue: the names a buyer and a seller may see of each other.

A delivery partner now buys as well as sells, and organisation's policies
never let one partner see another; joining organisation hid every other
partner's published listing outright. datahub_org_name answers with the name
alone, and only for an organisation with a listing on sale, a counterpart on a
deal or a licence, the caller's own, or to operations.

SQL copied verbatim from db/410_catalogue_names.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. The downgrade drops the function; nothing stores its answers.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0044
Revises: 0043
"""

from alembic import op

revision = "0044"
down_revision = "0043"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 410 · Whose name the catalogue may show
--
-- A delivery partner now buys from the catalogue as well as selling in it,
-- and organisation's policies never let one partner see another: neither
-- the seller's name on a listing nor the buyer's on a deal. Joining
-- organisation hid a published listing from every other partner outright.
--
-- This answers with the name only, never the row, and only when the
-- catalogue gives a reason to know it:
--   * the organisation sells a listing that is on sale
--   * the two are buyer and seller on a deal or a licence
--   * it is the caller's own organisation, or the caller is operations
-- Anything else is NULL, as a LEFT JOIN on a hidden row was.
-- ============================================================================

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
                         OR (k.seller_org_id = o.id AND k.buyer_org_id = current_org_id()))
          OR EXISTS (SELECT 1 FROM datahub_dataset_licence l
                      WHERE (l.buyer_org_id = o.id AND l.seller_org_id = current_org_id())
                         OR (l.seller_org_id = o.id AND l.buyer_org_id = current_org_id())))
$fn$;

REVOKE EXECUTE ON FUNCTION datahub_org_name(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION datahub_org_name(uuid) TO sourcehub_app;
"""

_DOWN = """
DROP FUNCTION IF EXISTS datahub_org_name(uuid);
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
