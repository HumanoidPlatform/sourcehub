-- Local-only bootstrap for the standalone Cosaarthi mobile database.
-- The backend runtime uses cosaarthi_mobile_app, while Alembic uses the owner.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cosaarthi_mobile_app') THEN
    CREATE ROLE cosaarthi_mobile_app LOGIN PASSWORD 'cosaarthi_mobile_app_dev_password'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE cosaarthi_mobile TO cosaarthi_mobile_app;

