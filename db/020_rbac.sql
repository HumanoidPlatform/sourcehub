-- ============================================================================
-- 020 · RBAC — roles, permissions, grants
--
-- This is the file that makes "logins controlled from the database" true.
--
-- The prototype already has the right instinct. Its comment on the CAPS matrix:
--   "The UI asks can('rfp.create') rather than checking the role directly, so a
--    new role is a row in this table rather than a hunt through the views."
-- Here that table is an actual table. Adding a role is an INSERT.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- permission — one row per capability. The vocabulary the code checks.
--
-- requires_mfa carries the blueprint's rule that a second factor is enforced
-- "for any role that can move money or approve a delivery". Because it hangs
-- off the permission rather than the role, a custom role that happens to
-- include contract.approve inherits the requirement automatically.
-- ---------------------------------------------------------------------------
CREATE TABLE permission (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text UNIQUE NOT NULL,         -- 'proposal.accept'
  module       text NOT NULL,                -- identity | marketplace | delivery | qa | network | ledger | onboarding
  description  text NOT NULL,
  requires_mfa boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX permission_module_idx ON permission (module);


-- ---------------------------------------------------------------------------
-- role — system roles plus, later, tenant-defined custom roles.
--
--   is_system = true, org_id NULL  -> built in, every org of that kind gets it
--   is_system = false, org_id set  -> a custom role belonging to one org
--
-- applies_to_kind keeps a client from being granted an aggregator role.
--
-- The org-scope tier (owner / manager / member) is a SEPARATE dimension held on
-- the grant, not baked into the role name. "tenant_owner" and "tenant_member"
-- as two roles would double the role table every time a tier is added, and the
-- tiers differ in administrative reach, not in domain capability.
-- ---------------------------------------------------------------------------
CREATE TABLE role (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL,             -- 'tenant', 'platform_admin'
  name            text NOT NULL,
  description     text,
  applies_to_kind org_kind,                  -- NULL = any kind
  is_system       boolean NOT NULL DEFAULT false,
  org_id          uuid REFERENCES organisation(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT role_system_is_global CHECK (
    (is_system = true AND org_id IS NULL) OR (is_system = false AND org_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX role_system_code_key ON role (code) WHERE is_system;
CREATE UNIQUE INDEX role_custom_code_key ON role (org_id, code) WHERE NOT is_system;

CREATE TRIGGER role_updated_at BEFORE UPDATE ON role
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- role_permission — the matrix itself.
-- ---------------------------------------------------------------------------
CREATE TABLE role_permission (
  role_id       uuid NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX role_permission_permission_idx ON role_permission (permission_id);


-- ---------------------------------------------------------------------------
-- user_role_grant — user × org × role.
--
-- The join that turns a person into a principal. A person may hold grants in
-- several organisations; a session carries exactly one, which is what app.org_id
-- is set from.
--
-- Revocation is a timestamp, not a DELETE: "who could do what, when" has to
-- survive the revocation for any audit to be worth reading.
-- ---------------------------------------------------------------------------
CREATE TABLE user_role_grant (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  role_id     uuid NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
  scope       grant_scope NOT NULL DEFAULT 'member',

  granted_by  uuid REFERENCES app_user(id),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  revoked_by  uuid REFERENCES app_user(id),
  revoked_at  timestamptz,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One live grant of a given role per user per org.
CREATE UNIQUE INDEX user_role_grant_live_key
  ON user_role_grant (user_id, org_id, role_id) WHERE revoked_at IS NULL;
CREATE INDEX user_role_grant_user_idx ON user_role_grant (user_id) WHERE revoked_at IS NULL;
CREATE INDEX user_role_grant_org_idx  ON user_role_grant (org_id)  WHERE revoked_at IS NULL;

CREATE TRIGGER user_role_grant_updated_at BEFORE UPDATE ON user_role_grant
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- Session resolution
--
-- Step 5 and 6 of the login flow. These two functions are the entire contract
-- between the database and the API's can() check.
-- ============================================================================

-- Which organisations may this user sign in to?
CREATE OR REPLACE FUNCTION user_organisations(p_user_id uuid)
RETURNS TABLE (org_id uuid, org_kind org_kind, org_name text,
               reference_code text, role_code text, scope grant_scope)
LANGUAGE sql STABLE AS $fn$
  SELECT o.id, o.kind, o.name, o.reference_code, r.code, g.scope
  FROM   user_role_grant g
  JOIN   organisation o ON o.id = g.org_id
  JOIN   role r         ON r.id = g.role_id
  WHERE  g.user_id = p_user_id
    AND  g.revoked_at IS NULL
    AND  o.status = 'active'
    AND  o.deleted_at IS NULL
  ORDER BY o.name
$fn$;

-- The effective capability set for one (user, org) pair.
-- This is what the access token carries and what can() tests against.
CREATE OR REPLACE FUNCTION user_capabilities(p_user_id uuid, p_org_id uuid)
RETURNS TABLE (code text, requires_mfa boolean)
LANGUAGE sql STABLE AS $fn$
  SELECT p.code, bool_or(p.requires_mfa)
  FROM   user_role_grant g
  JOIN   role_permission rp ON rp.role_id = g.role_id
  JOIN   permission p       ON p.id = rp.permission_id
  WHERE  g.user_id = p_user_id
    AND  g.org_id  = p_org_id
    AND  g.revoked_at IS NULL
  GROUP BY p.code
$fn$;

-- Does this (user, org) need a second factor at all?
CREATE OR REPLACE FUNCTION user_requires_mfa(p_user_id uuid, p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM user_capabilities(p_user_id, p_org_id) WHERE requires_mfa
  )
$fn$;
