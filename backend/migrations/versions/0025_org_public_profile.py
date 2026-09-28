"""An organisation's public profile: website, description, size, founded year,
registered address and logo, in one jsonb column on organisation.

Onboarding captured a name, an industry or HQ, a plan and a free-text country,
and nothing could be changed after approval. This adds the column the API
validates and writes (modules/identity/profile_schema.py), with three CHECKs as
a backstop: it is an object, a website is a web address, a logo key points into
the logo folder. Everything in it is visible to whoever may see the
organisation, which organisation_select already decides; no policy changes.

It also adds org.update, the capability Ops edits any client's or partner's
profile with. An organisation's own owner or manager uses profile.manage, which
has been seeded since db/900_seed.sql and never checked until now.

Additive: a column with a default that every existing row satisfies, and one
new permission. The deployed API keeps working before its image is replaced.

SQL copied verbatim from db/230_org_public_profile.sql so the bootstrap and
migration paths keep producing identical schemas (make verify-schema); a test
asserts the two stay byte-identical. The permission rows mirror
db/900_seed.sql, which is edited in place, as 0015 did.

Executed one statement at a time — the same splitter 0012 to 0014, 0018 to 0020,
0022 and 0024 use, because asyncpg refuses two statements in one execute.

Revision ID: 0025
Revises: 0024
"""

from alembic import op

revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 230 · An organisation's public profile
--
-- Onboarding captured a name, an industry or HQ, a plan, a free-text country
-- and the first user — and nothing could be changed once the request was
-- approved. Clients asked, in the first demo, for the rest of what a buyer
-- expects to know about a supplier and a supplier about a buyer: a website,
-- what the company does, how big it is, where it is registered, and its logo.
--
-- ONE jsonb column rather than a column per field, deliberately:
--
--   * the shape is the API's to validate (modules/identity/profile_schema.py,
--     extra="forbid"), and it will grow — partner expertise arrives with the
--     vendors directory — without a migration per key;
--   * everything in it has ONE audience. The column is named for that audience
--     so the rule is on the tin: whoever may see the organisation may see all of
--     this. organisation_select already decides who that is (bidders, open
--     buyers, contract counterparties, the network), so no policy changes here.
--     Tax identifiers, billing details and private contacts do NOT belong in
--     this column; they need their own table with an Ops-or-self policy.
--
-- The CHECKs below are a backstop for the few invariants that matter if the API
-- is ever bypassed: it is an object, a website is a web address, and a logo key
-- points into the logo folder the API files logos under — never into another
-- organisation's attachments.
--
-- legal_name is NOT moved in here. It has been a column since 010_identity,
-- unwritten and unread; it is Ops-owned rather than self-service, and the
-- service now writes and returns it.
--
-- Additive only: a new column with a default, and three CHECKs that every
-- existing row ('{}') satisfies. The currently deployed API image reads
-- organisation through an explicit ORM column list and is unaffected.
-- ============================================================================

ALTER TABLE organisation
  ADD COLUMN public_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE organisation
  ADD CONSTRAINT organisation_public_profile_object
    CHECK (jsonb_typeof(public_profile) = 'object');

ALTER TABLE organisation
  ADD CONSTRAINT organisation_public_profile_website
    CHECK (public_profile->>'website' IS NULL
           OR (public_profile->>'website' ~* '^https?://[^ ]+$'
               AND length(public_profile->>'website') <= 255));

ALTER TABLE organisation
  ADD CONSTRAINT organisation_public_profile_logo
    CHECK (public_profile->>'logo_key' IS NULL
           OR public_profile->>'logo_key' LIKE 'orgs/%');
"""

_SEED = """
INSERT INTO permission (code, module, description, requires_mfa) VALUES
  ('org.update', 'identity', 'Edit any organisation profile', false)
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'platform_admin'
  AND  r.is_system
  AND  p.code = 'org.update'
ON CONFLICT DO NOTHING;
"""

_DOWN = """
DELETE FROM role_permission
WHERE  permission_id = (SELECT id FROM permission WHERE code = 'org.update');

DELETE FROM permission WHERE code = 'org.update';

ALTER TABLE organisation DROP CONSTRAINT IF EXISTS organisation_public_profile_logo;

ALTER TABLE organisation DROP CONSTRAINT IF EXISTS organisation_public_profile_website;

ALTER TABLE organisation DROP CONSTRAINT IF EXISTS organisation_public_profile_object;

ALTER TABLE organisation DROP COLUMN IF EXISTS public_profile;
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
