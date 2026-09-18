"""Ops may raise an onboarding request, which is how a client or tenant is born.

README.md says "Platform Admin onboards clients and tenants directly", and every
layer below the router already agrees:

  * modules/onboarding/service.py:create_request() checks
    `target_org_kind in TOP_KINDS and not is_admin` and lets Ops through;
  * onboarding_request's CHECK constraint allows client/tenant with a NULL
    parent_org_id (db/030_onboarding.sql);
  * approve_onboarding_request() creates the organisation, its profile, its
    first user, the owner grant and the invitation in one transaction;
  * organisation_insert is WITH CHECK (is_platform_admin()) — Ops, and nobody
    else, may be the one to create it.

Only the router disagreed. POST /onboarding requires onboarding.request, and
that capability was granted to the tenant alone, so the sole path that brings a
paying customer onto the platform was reachable by no one. Clients and delivery
partners could only be inserted by hand-written SQL.

This grants the existing capability to the existing role. One row.

Deliberately NOT inserting into permission: onboarding.request has existed since
db/900_seed.sql:66 and is held by the tenant. Creating it here would be a no-op
on a seeded database and the downgrade would then delete a permission the tenant
still needs. The downgrade below removes only this one grant.

Ops raising a request it will itself approve is intended, not a loophole. The
decision is still recorded in onboarding_approval with the approver's user, org
and role, so "Ops onboarded Acme" remains a fact someone can read back.

Revision ID: 0015
Revises: 0014
"""

from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None

_GRANT = """
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'platform_admin'
  AND  r.is_system
  AND  p.code = 'onboarding.request'
ON CONFLICT DO NOTHING
"""

_REVOKE = """
DELETE FROM role_permission
WHERE  role_id       = (SELECT id FROM role       WHERE code = 'platform_admin' AND is_system)
  AND  permission_id = (SELECT id FROM permission WHERE code = 'onboarding.request')
"""


def upgrade() -> None:
    op.execute(_GRANT)


def downgrade() -> None:
    op.execute(_REVOKE)
