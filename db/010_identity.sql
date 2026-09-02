-- ============================================================================
-- 010 · Identity — organisations, profiles, users, credentials, sessions
--
-- The prototype has FIVE separate arrays (clients, tenants, aggregators,
-- businesses, deviceSponsors) and NO user object at all. A grep for
-- password|login|auth|token|session over sourcehub-app.html returns only CSS.
-- Everything in this file is new.
--
-- The blueprint collapses those five arrays: "Polymorphic root: client,
-- partner, aggregator, business, sponsor. One table, one kind."
-- ============================================================================

-- ---------------------------------------------------------------------------
-- organisation — the polymorphic root, and the anchor of both tenancy axes.
--
--   account axis : id = current_org_id()          (one org from another)
--   network axis : parent_org_id = current_org_id() (a tenant's own suppliers)
--
-- The prototype's Platform Admin is a synthetic id 'OPS' with no backing row,
-- so every approval and audit FK would have nowhere to point. Ops gets a real
-- row here, of kind 'platform'.
-- ---------------------------------------------------------------------------
CREATE TABLE organisation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code    text UNIQUE NOT NULL,
  kind              org_kind NOT NULL,
  name              text NOT NULL,
  legal_name        text,
  status            org_status NOT NULL DEFAULT 'pending_approval',

  -- the network axis. NULL for client, tenant and platform; required for the
  -- three supplier kinds, which belong to exactly one tenant.
  parent_org_id     uuid REFERENCES organisation(id) ON DELETE RESTRICT,

  country           text,
  residency_region  text,                    -- US | EU | APAC — pins storage
  billing_status    billing_status,
  rating            numeric(2,1) CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),

  onboarded_at      timestamptz,
  suspended_at      timestamptz,
  suspension_reason text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid,
  updated_by        uuid,
  deleted_at        timestamptz,

  -- The network axis, enforced rather than documented. An aggregator with no
  -- parent is invisible to every tenant and belongs to no one.
  CONSTRAINT organisation_network_parent CHECK (
    (kind IN ('aggregator','business','sponsor') AND parent_org_id IS NOT NULL)
    OR
    (kind IN ('client','tenant','platform')      AND parent_org_id IS NULL)
  )
);

CREATE INDEX organisation_kind_idx        ON organisation (kind) WHERE deleted_at IS NULL;
CREATE INDEX organisation_parent_idx      ON organisation (parent_org_id) WHERE deleted_at IS NULL;
CREATE INDEX organisation_status_idx      ON organisation (status) WHERE deleted_at IS NULL;
CREATE INDEX organisation_name_trgm_idx   ON organisation USING gin (name gin_trgm_ops);

CREATE TRIGGER organisation_updated_at BEFORE UPDATE ON organisation
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- Kind-specific profiles, 1:1 with organisation.
--
-- Satellite tables rather than one wide nullable row or a jsonb blob: these
-- columns are filtered and sorted on in the console (rating, residency,
-- qa_pass_rate, crowd_size), so they need real types and real indexes.
-- ---------------------------------------------------------------------------

CREATE TABLE client_profile (
  org_id        uuid PRIMARY KEY REFERENCES organisation(id) ON DELETE CASCADE,
  industry      text,
  plan          text,                        -- Enterprise | Growth
  dpa_signed    boolean NOT NULL DEFAULT false,
  dpa_signed_at timestamptz,
  since         date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER client_profile_updated_at BEFORE UPDATE ON client_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE tenant_profile (
  org_id            uuid PRIMARY KEY REFERENCES organisation(id) ON DELETE CASCADE,
  hq                text,
  plan              text,                    -- Partner Pro | Partner Starter
  capabilities      text,
  on_time_rate      smallint CHECK (on_time_rate BETWEEN 0 AND 100),
  qa_pass_rate      smallint CHECK (qa_pass_rate BETWEEN 0 AND 100),
  fair_work_attested boolean NOT NULL DEFAULT false,
  since             date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER tenant_profile_updated_at BEFORE UPDATE ON tenant_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE aggregator_profile (
  org_id      uuid PRIMARY KEY REFERENCES organisation(id) ON DELETE CASCADE,
  crowd_size  integer NOT NULL DEFAULT 0 CHECK (crowd_size >= 0),
  region      text,
  focus       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER aggregator_profile_updated_at BEFORE UPDATE ON aggregator_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE business_profile (
  org_id      uuid PRIMARY KEY REFERENCES organisation(id) ON DELETE CASCADE,
  specialty   text,
  capacity    text,                          -- free text in the prototype: "40 crews / week"
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER business_profile_updated_at BEFORE UPDATE ON business_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sponsor_profile (
  org_id        uuid PRIMARY KEY REFERENCES organisation(id) ON DELETE CASCADE,
  contact_email citext,
  contact_phone text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER sponsor_profile_updated_at BEFORE UPDATE ON sponsor_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- Authentication
--
-- Credentials live here, in Postgres. The blueprint specifies Keycloak; the
-- decision for this build is database-only auth now, with a seam so an IdP can
-- be layered on later without a migration. The seam columns are marked below
-- and are unused today.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- app_user — named app_user because "user" is reserved in Postgres.
--
-- A person, not a membership. Org membership lives in user_role_grant, so one
-- person can hold grants in several organisations; a session carries exactly
-- one (blueprint, §domain model).
-- ---------------------------------------------------------------------------
CREATE TABLE app_user (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 citext NOT NULL,
  full_name             text NOT NULL,
  phone                 text,
  status                user_status NOT NULL DEFAULT 'invited',

  -- credential. NULL while status = 'invited': the invitee sets their own
  -- password from the invitation link, so no admin ever knows it.
  password_hash         text,
  password_algo         text NOT NULL DEFAULT 'argon2id',
  password_updated_at   timestamptz,
  must_change_password  boolean NOT NULL DEFAULT false,

  email_verified_at     timestamptz,
  last_login_at         timestamptz,

  -- lockout counters, maintained by the login path
  failed_login_count    smallint NOT NULL DEFAULT 0,
  locked_until          timestamptz,

  -- ---- IdP seam. Unused today. Populating external_idp_subject and dropping
  -- ---- the password columns is the whole of the Keycloak/Entra migration.
  external_idp          text,
  external_idp_subject  text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES app_user(id),
  updated_by            uuid REFERENCES app_user(id),
  deleted_at            timestamptz,

  -- An active user must be able to authenticate somehow.
  CONSTRAINT app_user_active_has_credential CHECK (
    status <> 'active'
    OR password_hash IS NOT NULL
    OR external_idp_subject IS NOT NULL
  )
);

-- Email is unique among the living. A soft-deleted user must not block reuse.
CREATE UNIQUE INDEX app_user_email_key ON app_user (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX app_user_idp_subject_key
  ON app_user (external_idp, external_idp_subject)
  WHERE external_idp_subject IS NOT NULL;
CREATE INDEX app_user_status_idx ON app_user (status) WHERE deleted_at IS NULL;

CREATE TRIGGER app_user_updated_at BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Deferred FKs from organisation, now that app_user exists.
ALTER TABLE organisation
  ADD CONSTRAINT organisation_created_by_fkey FOREIGN KEY (created_by) REFERENCES app_user(id),
  ADD CONSTRAINT organisation_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES app_user(id);


-- ---------------------------------------------------------------------------
-- user_session — refresh-token sessions.
--
-- Stores a hash, never the token. A database dump must not yield live sessions.
-- "Log out everywhere" is one UPDATE by user_id.
-- ---------------------------------------------------------------------------
CREATE TABLE user_session (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,

  -- the org this session is scoped to. A user with grants in several orgs
  -- opens one session per org; app.org_id comes from here.
  org_id          uuid NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,

  token_hash      text NOT NULL UNIQUE,      -- sha256 of the refresh token
  device_label    text,
  user_agent      text,
  ip_address      inet,

  issued_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz,
  expires_at      timestamptz NOT NULL,
  revoked_at      timestamptz,
  revoke_reason   text
);

CREATE INDEX user_session_user_idx   ON user_session (user_id) WHERE revoked_at IS NULL;
CREATE INDEX user_session_expiry_idx ON user_session (expires_at) WHERE revoked_at IS NULL;


-- ---------------------------------------------------------------------------
-- user_token — password reset and email verification in one table.
--
-- Same shape, same lifecycle, same security properties: hashed, single use,
-- expiring. Two tables would be two places to get that wrong.
-- ---------------------------------------------------------------------------
CREATE TABLE user_token (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  purpose      user_token_purpose NOT NULL,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz,
  requested_ip inet,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_token_user_purpose_idx
  ON user_token (user_id, purpose) WHERE consumed_at IS NULL;


-- ---------------------------------------------------------------------------
-- user_password_history — reuse prevention.
-- ---------------------------------------------------------------------------
CREATE TABLE user_password_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_algo text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_password_history_user_idx ON user_password_history (user_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- user_mfa — TOTP enrolment.
--
-- The blueprint enforces a second factor "for any role that can move money or
-- approve a delivery". That is expressed as permission.requires_mfa (020), not
-- as a hard-coded list of role names — so the rule is data, like every other
-- access rule in this schema.
-- ---------------------------------------------------------------------------
CREATE TABLE user_mfa (
  user_id       uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  totp_secret   text NOT NULL,               -- encrypted at the application layer
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  backup_codes  text[] NOT NULL DEFAULT '{}' -- hashes, consumed on use
);


-- ---------------------------------------------------------------------------
-- login_attempt — append-only. Records successes AND failures.
--
-- Failures alone cannot answer "was this account taken over?"; you need the
-- successful login that followed the burst.
-- ---------------------------------------------------------------------------
CREATE TABLE login_attempt (
  id           bigserial PRIMARY KEY,
  email        citext NOT NULL,              -- recorded even when no user matches
  user_id      uuid REFERENCES app_user(id) ON DELETE SET NULL,
  succeeded    boolean NOT NULL,
  failure_code text,                         -- bad_password | locked | inactive | no_such_user | mfa_failed
  ip_address   inet,
  user_agent   text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX login_attempt_email_time_idx ON login_attempt (email, attempted_at DESC);
CREATE INDEX login_attempt_ip_time_idx    ON login_attempt (ip_address, attempted_at DESC);
