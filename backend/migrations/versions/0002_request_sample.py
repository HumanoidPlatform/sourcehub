"""request_sample — sample files attached to a data request.

The SQL is copied verbatim from db/040_marketplace.sql and db/100_rls.sql so
the bootstrap and migration paths keep producing identical schemas. RLS
policies are hand-written here — autogenerate does not see them.

Revision ID: 0002
Revises: 0001
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE request_sample (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id    uuid NOT NULL REFERENCES request(id) ON DELETE CASCADE,
          filename      text NOT NULL,
          storage_key   text NOT NULL UNIQUE,
          content_type  text,
          size_bytes    bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
          uploaded_by   uuid REFERENCES app_user(id),
          uploaded_at   timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX request_sample_request_idx ON request_sample (request_id);

        ALTER TABLE request_sample ENABLE ROW LEVEL SECURITY;
        ALTER TABLE request_sample FORCE  ROW LEVEL SECURITY;

        CREATE POLICY request_sample_select ON request_sample FOR SELECT
          USING (
               is_platform_admin()
            OR EXISTS (SELECT 1 FROM request r
                        WHERE r.id = request_sample.request_id
                          AND r.deleted_at IS NULL
                          AND (r.client_org_id = current_org_id()
                            OR (r.status IN ('published','proposals_received')
                                AND current_org_kind() = 'tenant')
                            OR EXISTS (SELECT 1 FROM contract c
                                        WHERE c.request_id = r.id
                                          AND c.partner_org_id = current_org_id())))
          );

        CREATE POLICY request_sample_insert ON request_sample FOR INSERT
          WITH CHECK (EXISTS (SELECT 1 FROM request r
                               WHERE r.id = request_sample.request_id
                                 AND r.client_org_id = current_org_id()));

        GRANT SELECT, INSERT ON request_sample TO sourcehub_app;
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE request_sample;")
