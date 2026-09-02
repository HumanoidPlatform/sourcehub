-- ============================================================================
-- 000 · Extensions and application role
--
-- Runs first. Two jobs: turn on the extensions the schema depends on, and
-- create the role the application connects as.
--
-- The application role matters more than it looks. The build guide is explicit:
-- "The application must connect as a role that is neither the table owner nor
-- holds BYPASSRLS. Table owners bypass their own policies by default, so an app
-- connecting as the owner has RLS enabled and entirely ineffective — the most
-- common way this control fails silently."
--
-- These scripts run as the superuser, so the superuser owns every table.
-- sourcehub_app is a plain role with DML only. It is the only role the API
-- may ever use.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), digest()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy search on org and request names
CREATE EXTENSION IF NOT EXISTS btree_gin;  -- composite GIN for audit scope lookups

-- ---------------------------------------------------------------------------
-- The application role. Password comes from the environment in a real
-- deployment; the compose file passes it in for local development.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sourcehub_app') THEN
    CREATE ROLE sourcehub_app LOGIN PASSWORD 'sourcehub_app_dev_password'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

-- A read-only role for analytics and support. Same RLS applies.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sourcehub_readonly') THEN
    CREATE ROLE sourcehub_readonly LOGIN PASSWORD 'sourcehub_readonly_dev_password'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO sourcehub_app, sourcehub_readonly;

-- Applies to every table created after this point by the current user.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sourcehub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO sourcehub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO sourcehub_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO sourcehub_readonly;
