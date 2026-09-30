-- ============================================================================
-- One-time setup of a managed PostgreSQL server for DataMind360
--
-- WHO RUNS IT   the provider's admin login (on Azure, the admin you created
--               with the server), connected to the application database
--               (appdb), NOT to the built-in "postgres" database.
-- WHEN          once, before build/schema.sql. Running it again changes
--               nothing that is already right.
-- WITH WHAT     pgAdmin (Query Tool, run the whole file), DBeaver (Execute
--               SQL Script, Alt+X, not "Execute statement"), or
--               psql -v ON_ERROR_STOP=1 -f infra/db/managed_setup.sql
--
-- BEFORE IT, ON THE PROVIDER'S SIDE
--   * allow the four extensions. Azure: server parameter azure.extensions,
--     tick PGCRYPTO, CITEXT, PG_TRGM and BTREE_GIN, save.
--   * create the database appdb with your admin login as its owner.
--
-- WHAT IT CREATES
--   sourcehub_app       the ONLY login the API uses. It reads and writes
--                       rows, and row-level security checks it on every
--                       query. Created WITHOUT a password: set one next.
--   sourcehub_readonly  a reporting role with sign-in switched off. db/000
--                       would otherwise create it with a password that is
--                       printed in the repository.
--   pgcrypto, citext, pg_trgm, btree_gin
--
-- AFTER IT
--   1. Give sourcehub_app a strong password. pgAdmin: Login/Group Roles,
--      sourcehub_app, Properties, Definition. DBeaver: Roles, sourcehub_app.
--      Or type ALTER ROLE sourcehub_app PASSWORD '...' in the query tool.
--      Never save it in a file in the repository.
--   2. Apply build/schema.sql, then build/seed.sql, as this same admin
--      login (infra/bundle_schema.sh makes them). The admin then owns every
--      table and runs every migration. The API must never use it.
--
-- NOTHING HERE IS AZURE-SPECIFIC. The same file sets up AWS RDS, Google
-- Cloud SQL, Supabase, Neon or a self-hosted server; only the extension
-- allow-list step above differs between providers.
-- ============================================================================

-- Refuse the built-in database: tables built there are easy to lose track of.
DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    RAISE EXCEPTION 'Connected to the built-in "postgres" database. Connect to appdb and run this again.';
  END IF;
END
$$;

-- The two roles. Attributes are named only when creating: a managed admin is
-- not a superuser, and PostgreSQL refuses it even a harmless ALTER ROLE that
-- mentions SUPERUSER or BYPASSRLS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sourcehub_app') THEN
    CREATE ROLE sourcehub_app LOGIN
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sourcehub_readonly') THEN
    CREATE ROLE sourcehub_readonly NOLOGIN
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

-- If the schema was applied before this file, db/000 created the reporting
-- role with its published password. Switch its sign-in off either way.
ALTER ROLE sourcehub_readonly NOLOGIN PASSWORD NULL;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- What you should see: sourcehub_app can sign in, sourcehub_readonly cannot,
-- neither is a superuser or skips row security, and your admin can build the
-- schema in this database.
SELECT r.rolname                             AS login,
       r.rolcanlogin                         AS can_sign_in,
       r.rolsuper                            AS superuser,
       r.rolbypassrls                        AS skips_row_security,
       r.rolname = current_user              AS is_you,
       CASE WHEN r.rolname = current_user
            THEN has_database_privilege(current_database(), 'CREATE')
             AND has_schema_privilege('public', 'CREATE')
       END                                   AS can_build_schema
FROM   pg_roles r
WHERE  r.rolname IN ('sourcehub_app', 'sourcehub_readonly', current_user)
ORDER  BY r.rolname;

SELECT extname AS extension, extversion AS version
FROM   pg_extension
WHERE  extname IN ('pgcrypto', 'citext', 'pg_trgm', 'btree_gin')
ORDER  BY extname;
