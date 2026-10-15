"""catalogue: aggregators take no part in the data marketplace.

An aggregator gathers captures from its crowd and hands them to the delivery
partner; the partner sells datasets and buys them, and so does a client. So
the aggregator role loses catalogue.list and catalogue.quote, which 0042
granted it, as db/900 no longer seeds them. Any role scoped to aggregators,
or owned by an aggregator organisation, loses them too, should a custom role
have copied them.

Grants only, no schema, so there is no db/ file: the rows ride here, the way
0044 carried the partner's catalogue.buy. 0042 is left as it is; it may
already have run somewhere.

The downgrade gives the aggregator system role both grants back.

Revision ID: 0048
Revises: 0047
"""

from alembic import op

revision = "0048"
down_revision = "0047"
branch_labels = None
depends_on = None

_UP = """
DELETE FROM role_permission
WHERE  permission_id IN (SELECT id FROM permission
                         WHERE  code IN ('catalogue.list', 'catalogue.quote'))
  AND  role_id IN (SELECT id FROM role
                   WHERE  (code = 'aggregator' AND is_system)
                      OR  applies_to_kind = 'aggregator'
                      OR  org_id IN (SELECT id FROM organisation WHERE kind = 'aggregator'));
"""

_DOWN = """
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'aggregator' AND r.is_system AND p.code IN ('catalogue.list', 'catalogue.quote')
ON CONFLICT DO NOTHING;
"""


def upgrade() -> None:
    op.execute(_UP.strip())


def downgrade() -> None:
    op.execute(_DOWN.strip())
