"""The vendors directory: a client may browse every active delivery partner.

Two permissive SELECT policies (organisation, tenant_profile) that mirror what
db/180 gave partners; partner_performance(), a SECURITY DEFINER function that
turns a partner's contracts, gate-2 reviews and ratings into numbers and
returns nothing else; and a CHECK that the expertise a partner declares in
public_profile is an object. No new table and no new column.

It also adds vendor.read, the capability the directory's routes are guarded
by, to the client and to Ops.

Additive: the deployed API keeps working before its image is replaced. It
reads organisation.rating and tenant_profile's two rates, which stay where
they are; the new image stops reading them and asks the function instead.

SQL copied verbatim from db/260_vendor_directory.sql so the bootstrap and
migration paths keep producing identical schemas (make verify-schema); a test
asserts the two stay byte-identical. The permission rows mirror
db/900_seed.sql, which is edited in place, as 0015 and 0025 did.

Executed one statement at a time, with the splitter 0025 and 0027 use, because
asyncpg refuses two statements in one execute.

Revision ID: 0029
Revises: 0028
"""

from alembic import op

revision = "0029"
down_revision = "0028"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 260 · The vendors directory: a client may browse delivery partners
--
-- A client could see a delivery partner only after dealing with it: a bid on
-- its request (110's Fix 4), a conversation (250), a shared contract (100). A
-- client with no history saw none, so it had nothing to compare before writing
-- its first request. db/180 already gave partners the mirror of this — every
-- client with an open request — and this is the same grant in the other
-- direction.
--
-- THREE THINGS, and no new table:
--
--   1. Two permissive SELECT policies: a client reads every ACTIVE delivery
--      partner and its tenant_profile. Permissive, so they OR with the existing
--      set and take nothing away.
--   2. partner_performance(): what a partner's record amounts to, as numbers.
--      The record lives in OTHER clients' contracts, reviews and ratings, which
--      RLS rightly hides from the reader, so it is a SECURITY DEFINER function
--      and it returns aggregates only — never a contract, a client, a comment
--      or a date.
--   3. A backstop CHECK for the expertise a partner declares about itself,
--      which lives in public_profile as db/230 said it would.
--
-- SCOPE, deliberately narrow:
--   * Delivery partners only. Aggregators, businesses and sponsors belong to a
--     partner's network and stay invisible to clients, as does the crowd.
--   * Active only. A suspended or pending partner drops out of the directory,
--     while a client that has actually dealt with it keeps its view through the
--     older policies, because having dealt is the durable fact.
--   * Identity and reputation only. _may_see_commercials
--     (modules/identity/service.py) still strips the plan, the DPA, billing and
--     suspension from a counterparty.
--
-- THE COST, stated as 180 stated its own: a client can now enumerate the
-- delivery partners on the platform. That is what a directory is. What it
-- cannot learn is who any of them works for.
--
-- The figures organisation.rating, tenant_profile.on_time_rate and
-- tenant_profile.qa_pass_rate were written by the seed files and by nothing
-- else. They stay in place, unread: the API now answers from
-- partner_performance() everywhere those three were shown.
-- ============================================================================

-- SECURITY DEFINER for the reason every helper in db/100 is: a policy on
-- tenant_profile that asked organisation directly would be answered under the
-- reader's own policies. It answers one boolean about one organisation.
CREATE OR REPLACE FUNCTION org_in_vendor_directory(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM organisation o
    WHERE  o.id = p_org_id
      AND  o.kind = 'tenant'
      AND  o.status = 'active'
      AND  o.deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION org_in_vendor_directory(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_in_vendor_directory(uuid) TO sourcehub_app, sourcehub_readonly;

-- The organisation policy reads the row's own columns, so it needs no helper
-- and cannot recurse.
CREATE POLICY organisation_select_directory ON organisation FOR SELECT
  USING (current_org_kind() = 'client'
         AND kind = 'tenant'
         AND status = 'active'
         AND deleted_at IS NULL);

CREATE POLICY tenant_profile_select_directory ON tenant_profile FOR SELECT
  USING (current_org_kind() = 'client' AND org_in_vendor_directory(org_id));

-- ---------------------------------------------------------------------------
-- partner_performance — one row per delivery partner asked about.
--
--   contracts_completed      contracts the client approved
--   on_time_pct              of those with a due date, the share whose LAST
--                            delivery was on or before it. A delivery sent back
--                            clears delivered_at (delivery/service.py), so the
--                            column holds the delivery that was accepted
--   accepted_first_time_pct  of those, the share never sent back
--   qa_pass_pct              the partner's own gate 2: passes over passes and
--                            failures, across all of its contracts. A waiver is
--                            neither and is not counted
--   rating_*                 what the client of each of its contracts scored
--                            it, as an average, a count and the count per
--                            score. Never the comment, and never a score from
--                            anyone who was not that contract's buyer
--
-- Every percentage is NULL when there is nothing to divide by: "no completed
-- work yet" and "0% on time" are different statements and the console prints
-- them differently.
--
-- A session acting as no organisation gets no rows, and neither does a crowd
-- session, nor an id that is not a delivery partner. The caller passes ids it
-- has already read under its own policies.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION partner_performance(p_org_ids uuid[])
RETURNS TABLE (
  partner_org_id          uuid,
  contracts_completed     integer,
  on_time_pct             smallint,
  accepted_first_time_pct smallint,
  qa_pass_pct             smallint,
  rating_avg              numeric(2,1),
  rating_count            integer,
  rating_1                integer,
  rating_2                integer,
  rating_3                integer,
  rating_4                integer,
  rating_5                integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT o.id,
         done.completed,
         done.on_time,
         done.first_time,
         gate.passed,
         stars.average,
         stars.total,
         stars.s1, stars.s2, stars.s3, stars.s4, stars.s5
  FROM   organisation o
  CROSS  JOIN LATERAL (
    SELECT count(*)::integer AS completed,
           round(100.0 * count(*) FILTER (
                   WHERE (k.delivered_at AT TIME ZONE 'UTC')::date <= r.delivery_due_on)
                 / NULLIF(count(*) FILTER (
                   WHERE k.delivered_at IS NOT NULL AND r.delivery_due_on IS NOT NULL), 0)
           )::smallint AS on_time,
           round(100.0 * count(*) FILTER (WHERE k.disputed_at IS NULL)
                 / NULLIF(count(*), 0)
           )::smallint AS first_time
    FROM   contract k
    JOIN   request r ON r.id = k.request_id
    WHERE  k.partner_org_id = o.id
      AND  k.status = 'completed'
      AND  k.deleted_at IS NULL
  ) done
  CROSS  JOIN LATERAL (
    SELECT round(100.0 * count(*) FILTER (WHERE q.outcome = 'pass')
                 / NULLIF(count(*), 0)
           )::smallint AS passed
    FROM   qa_review q
    JOIN   submission s ON s.id = q.submission_id
    JOIN   task t       ON t.id = s.task_id
    JOIN   contract k   ON k.id = t.contract_id
    WHERE  k.partner_org_id = o.id
      AND  k.deleted_at IS NULL
      AND  q.gate = 'gate2_partner'
      AND  q.outcome IN ('pass', 'fail')
  ) gate
  CROSS  JOIN LATERAL (
    SELECT round(avg(g.score), 1)::numeric(2,1)          AS average,
           count(*)::integer                             AS total,
           (count(*) FILTER (WHERE g.score = 1))::integer AS s1,
           (count(*) FILTER (WHERE g.score = 2))::integer AS s2,
           (count(*) FILTER (WHERE g.score = 3))::integer AS s3,
           (count(*) FILTER (WHERE g.score = 4))::integer AS s4,
           (count(*) FILTER (WHERE g.score = 5))::integer AS s5
    FROM   rating g
    JOIN   contract k ON k.id = g.contract_id
    WHERE  g.to_org_id = o.id
      AND  k.partner_org_id = o.id
      AND  k.deleted_at IS NULL
      AND  g.from_org_id = k.client_org_id
  ) stars
  WHERE  o.id = ANY (p_org_ids)
    AND  o.kind = 'tenant'
    AND  o.deleted_at IS NULL
    AND  current_org_id() IS NOT NULL
    AND  NOT is_worker()
$fn$;

REVOKE EXECUTE ON FUNCTION partner_performance(uuid[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION partner_performance(uuid[]) TO sourcehub_app, sourcehub_readonly;

-- The API validates what goes inside (modules/identity/profile_schema.py,
-- ExpertiseIn). This is the backstop if it is ever bypassed: the console reads
-- expertise as an object of lists and would fail on anything else.
ALTER TABLE organisation
  ADD CONSTRAINT organisation_public_profile_expertise
    CHECK (public_profile->'expertise' IS NULL
           OR jsonb_typeof(public_profile->'expertise') = 'object');
"""

_SEED = """
INSERT INTO permission (code, module, description, requires_mfa) VALUES
  ('vendor.read', 'identity', 'Browse the delivery partner directory', false)
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code IN ('client', 'platform_admin')
  AND  r.is_system
  AND  p.code = 'vendor.read'
ON CONFLICT DO NOTHING;
"""

_DOWN = """
DELETE FROM role_permission
WHERE  permission_id = (SELECT id FROM permission WHERE code = 'vendor.read');

DELETE FROM permission WHERE code = 'vendor.read';

ALTER TABLE organisation DROP CONSTRAINT IF EXISTS organisation_public_profile_expertise;

DROP FUNCTION IF EXISTS partner_performance(uuid[]);

DROP POLICY IF EXISTS tenant_profile_select_directory ON tenant_profile;

DROP POLICY IF EXISTS organisation_select_directory ON organisation;

DROP FUNCTION IF EXISTS org_in_vendor_directory(uuid);
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
