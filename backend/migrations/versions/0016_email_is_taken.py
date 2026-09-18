"""Onboarding refuses a taken email at the form, not at approval.

app_user.email is unique platform-wide and approve_onboarding_request() inserts
the first user unconditionally, so an address that already belonged to somebody
raised a unique violation from inside the approval transaction — surfacing as a
500 after the request had been written, queued and reviewed.

The check cannot run in the caller's own session: app_user_select shows an
organisation only its own people, and the clashing address is usually held by
someone the caller cannot see. Hence one narrow SECURITY DEFINER function,
following db/110_auth_functions.sql — one boolean, about one address the caller
has already typed, revealing nothing about who holds it.

SQL copied verbatim from db/160_email_is_taken.sql so the bootstrap and
migration paths keep producing identical schemas (make verify-schema).

Revision ID: 0016
Revises: 0015
"""

from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None

_FN = r"""
CREATE OR REPLACE FUNCTION email_is_taken(p_email citext)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE  email = p_email
      AND  deleted_at IS NULL
  )
$fn$
"""


def upgrade() -> None:
    op.execute(_FN)
    op.execute("REVOKE EXECUTE ON FUNCTION email_is_taken(citext) FROM PUBLIC")
    op.execute("GRANT EXECUTE ON FUNCTION email_is_taken(citext) TO sourcehub_app")


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS email_is_taken(citext)")
