from __future__ import annotations

from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

CREATE_TABLES = [
    """
    CREATE TABLE organizations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      kind varchar(32) NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code varchar(80) UNIQUE NOT NULL,
      description text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code varchar(80) UNIQUE NOT NULL,
      name text NOT NULL,
      public_signup boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE role_permissions (
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    )
    """,
    """
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email varchar(320) UNIQUE NOT NULL,
      first_name text NOT NULL,
      last_name text NOT NULL,
      phone varchar(40) NOT NULL DEFAULT '',
      password_hash text NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'active',
      locale varchar(16) NOT NULL DEFAULT 'en-IN',
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE user_roles (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      PRIMARY KEY (user_id, role_id),
      CONSTRAINT user_roles_once UNIQUE (user_id, role_id)
    )
    """,
    """
    CREATE TABLE user_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash text UNIQUE NOT NULL,
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE crowd_workers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      worker_code varchar(80) UNIQUE NOT NULL,
      display_name text NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE tasks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      task_code varchar(80) UNIQUE NOT NULL,
      title text NOT NULL,
      category text,
      project text NOT NULL,
      campaign_id text,
      location text NOT NULL,
      pay numeric(12,2) NOT NULL,
      currency varchar(3) NOT NULL DEFAULT 'INR',
      estimated_minutes integer NOT NULL DEFAULT 10,
      difficulty varchar(32) NOT NULL DEFAULT 'starter',
      status varchar(32) NOT NULL DEFAULT 'available',
      task_type varchar(32) NOT NULL DEFAULT 'capture',
      progress integer NOT NULL DEFAULT 0,
      required_media jsonb NOT NULL DEFAULT '[]'::jsonb,
      required_upload_count integer,
      allowed_file_types jsonb,
      storage_bucket text,
      required_duration_ms integer,
      certification_required text,
      distance_km numeric(8,2),
      slots_remaining integer NOT NULL DEFAULT 1,
      due_at timestamptz NOT NULL,
      checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
      description text NOT NULL,
      quality_bar text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE assignments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status varchar(32) NOT NULL DEFAULT 'reserved',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT assignments_user_task_once UNIQUE (task_id, user_id)
    )
    """,
    """
    CREATE TABLE submissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_code varchar(80) UNIQUE NOT NULL,
      task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      type varchar(32) NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'processing',
      payload_ref text NOT NULL,
      meta jsonb NOT NULL DEFAULT '{}'::jsonb,
      idempotency_key text UNIQUE NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      submission_id uuid REFERENCES submissions(id) ON DELETE SET NULL,
      object_key text UNIQUE NOT NULL,
      file_name text NOT NULL,
      mime_type varchar(120) NOT NULL,
      size_bytes integer NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'queued',
      idempotency_key text UNIQUE NOT NULL,
      uploaded_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE qa_reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      status varchar(32) NOT NULL,
      note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL,
      body text NOT NULL,
      tone varchar(32) NOT NULL DEFAULT 'info',
      deep_link text,
      read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE audit_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type varchar(120) NOT NULL,
      actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      summary text NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
    """,
]

TIMESTAMPED_TABLES = [
    "organizations",
    "permissions",
    "roles",
    "users",
    "user_sessions",
    "crowd_workers",
    "tasks",
    "assignments",
    "submissions",
    "assets",
    "qa_reviews",
    "notifications",
    "audit_events",
]


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
          NEW.updated_at := now();
          RETURN NEW;
        END
        $$;
        """
    )
    for statement in CREATE_TABLES:
        op.execute(statement)
    for table in TIMESTAMPED_TABLES:
        op.execute(
            f"CREATE TRIGGER {table}_updated_at BEFORE UPDATE ON {table} "
            "FOR EACH ROW EXECUTE FUNCTION set_updated_at()"
        )

    op.execute(
        "INSERT INTO organizations (name, kind) "
        "VALUES ('Cosaarthi Crowd Network', 'crowd_pool')"
    )
    op.execute(
        """
        INSERT INTO permissions (code, description) VALUES
          ('work:read', 'Read available and assigned mobile work'),
          ('task:start', 'Accept and start a mobile task'),
          ('media:capture', 'Capture task media on device'),
          ('upload:create', 'Create direct-to-MinIO uploads'),
          ('submission:create', 'Create task submissions'),
          ('wallet:read', 'Read worker wallet'),
          ('profile:update', 'Update worker profile')
        """
    )
    op.execute(
        "INSERT INTO roles (code, name, public_signup) "
        "VALUES ('crowd_worker', 'Crowd Worker', true)"
    )
    op.execute(
        """
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.code = 'crowd_worker'
          AND p.code IN (
            'work:read', 'task:start', 'media:capture', 'upload:create',
            'submission:create', 'wallet:read', 'profile:update'
          )
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cosaarthi_mobile_app') THEN
            GRANT USAGE ON SCHEMA public TO cosaarthi_mobile_app;
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
              TO cosaarthi_mobile_app;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cosaarthi_mobile_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public
              GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cosaarthi_mobile_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public
              GRANT USAGE, SELECT ON SEQUENCES TO cosaarthi_mobile_app;
          END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    for table in (
        "audit_events",
        "notifications",
        "qa_reviews",
        "assets",
        "submissions",
        "assignments",
        "tasks",
        "crowd_workers",
        "user_sessions",
        "user_roles",
        "users",
        "role_permissions",
        "roles",
        "permissions",
        "organizations",
    ):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at() CASCADE")
