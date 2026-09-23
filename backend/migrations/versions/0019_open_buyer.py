"""A published request names its buyer.

Fix 9 (db/110_auth_functions.sql) made a client visible to the partner that had
already bid to it, and named the need it was serving: a partner comparing
opportunities wants to know who is buying. That case was the one left unserved,
because it happens BEFORE the bid — the brief a partner reads while deciding
carried an opaque client_org_id, and the only organisation named on the page
was the partner's own.

This adds one SECURITY DEFINER predicate and two permissive SELECT policies, so
a tenant sees the organisation and client_profile of a client whose request is
open to the market. Nothing is taken away, and _may_see_commercials still
strips billing, suspension, plan and DPA terms from a counterparty: this
discloses who is buying, never how they are billed.

SQL copied verbatim from db/180_open_buyer.sql so the bootstrap and migration
paths keep producing identical schemas (make verify-schema). Executed one
statement at a time — split on a semicolon at end of line, except inside the
$fn$ body — the same splitter 0012 to 0014 and 0018 use. 0017 sat unapplied on
the pilot database for days because it handed two statements to one execute and
asyncpg refuses that.

Revision ID: 0019
Revises: 0018
"""

from alembic import op

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None

_UP = """
CREATE OR REPLACE FUNCTION org_with_open_request(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM request
    WHERE  client_org_id = p_org_id
      AND  status IN ('published', 'proposals_received')
      AND  deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION org_with_open_request(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_with_open_request(uuid) TO sourcehub_app, sourcehub_readonly;

CREATE POLICY organisation_select_open_buyers ON organisation FOR SELECT
  USING (current_org_kind() = 'tenant' AND org_with_open_request(id));

CREATE POLICY client_profile_select_open_buyers ON client_profile FOR SELECT
  USING (current_org_kind() = 'tenant' AND org_with_open_request(org_id));
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
    op.execute("DROP POLICY IF EXISTS client_profile_select_open_buyers ON client_profile")
    op.execute("DROP POLICY IF EXISTS organisation_select_open_buyers ON organisation")
    op.execute("DROP FUNCTION IF EXISTS org_with_open_request(uuid)")
