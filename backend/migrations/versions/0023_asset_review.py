"""A gate-1 verdict can name the capture, not just the batch.

The schema half is copied verbatim from db/210_asset_review.sql so the
bootstrap and migration paths keep producing identical schemas (`make
verify-schema` diffs them). See that file for why asset.status = 'rejected' is
the lever: five rollups already filter on status = 'ready', so a sent-back
capture drops out of the quantity the worker owes and out of the bundle handed
to the delivery partner without any of them changing.

The one extra statement here is the 'other' defect code. It is added to
db/900_seed.sql for fresh installs, and bundle_schema.sh runs STRUCTURE before
SEED — so a db/2xx file inserting it would be undone by the seed that follows.
This migration is for databases that already exist, exactly as 0021 was.

Revision ID: 0023
Revises: 0022
"""

from alembic import op

revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE asset
          ADD COLUMN review_reason text,
          ADD COLUMN review_note   text,
          ADD COLUMN reviewed_by   uuid REFERENCES app_user(id) ON DELETE SET NULL,
          ADD COLUMN reviewed_at   timestamptz
        """
    )
    op.execute(
        """
        ALTER TABLE asset
          ADD CONSTRAINT asset_rejected_needs_reason
          CHECK (status <> 'rejected' OR review_reason IS NOT NULL)
        """
    )
    op.execute(
        "CREATE INDEX asset_assignment_rejected_idx ON asset (assignment_id) "
        "WHERE status = 'rejected'"
    )
    op.execute(
        "INSERT INTO defect_code (code, label, category, automated) "
        "VALUES ('other', 'Something else', 'coverage', false) "
        "ON CONFLICT (code) DO NOTHING"
    )


def downgrade() -> None:
    # A capture sent back under the new rule has nowhere to record why once the
    # columns go, so put it back to 'ready' rather than leave a verdict that
    # cannot be read. It re-enters the count, which is the pre-0022 behaviour.
    op.execute("UPDATE asset SET status = 'ready' WHERE status = 'rejected'")
    op.execute("DROP INDEX IF EXISTS asset_assignment_rejected_idx")
    op.execute("ALTER TABLE asset DROP CONSTRAINT asset_rejected_needs_reason")
    op.execute(
        "ALTER TABLE asset "
        "  DROP COLUMN review_reason, DROP COLUMN review_note, "
        "  DROP COLUMN reviewed_by, DROP COLUMN reviewed_at"
    )
    op.execute("DELETE FROM defect_code WHERE code = 'other'")
