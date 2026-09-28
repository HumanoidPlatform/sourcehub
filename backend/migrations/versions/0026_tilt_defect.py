"""A capture can be sent back for being tilted.

The phone has measured squareness since 15 September and could refuse a capture
over it, but the degrees never reached the server: a refusal deletes the file
before it is queued, and a capture inside the client's tolerance produced no
finding at all. So an aggregator looking at an obviously crooked frame had no
reason to pick but 'other'.

Two halves, and only one of them is here. The phone now records the reading on
every capture as a severity "info" check, which needs no schema — check_results
is jsonb. This half is the taxonomy row, so the reason can be named.

Added to db/900_seed.sql for fresh installs. bundle_schema.sh runs STRUCTURE
before SEED, so a db/2xx file inserting it would be undone by the seed that
follows; this migration is for databases that already exist, exactly as 0023
was for 'other'.

Numbered 0026, not 0025. It was written as 0025 against a branch that did not
yet carry 0025_org_public_profile, and the two then met in a fast-forward: both
claimed revision "0025" with down_revision "0024", which alembic refuses to
build a revision map from at all — upgrade, heads and even current fail. This
one moved because the other is already on origin.

Revision ID: 0026
Revises: 0025
"""

from alembic import op

revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # automated = false, following wrong_subject: the phone measures it, a
    # person decides it. Nothing reads defect_code.automated today in any case.
    op.execute(
        "INSERT INTO defect_code (code, label, category, automated) "
        "VALUES ('tilt', 'Tilted — not square', 'optical', false) "
        "ON CONFLICT (code) DO NOTHING"
    )


def downgrade() -> None:
    # A verdict already given keeps its reason. qa_review_defect references
    # defect_code(id) ON DELETE RESTRICT, so deleting a code a reviewer has
    # already used would fail on the foreign key and take the whole downgrade
    # with it. Retire it from the reviewer's list first, then remove it only if
    # it was never used, which leaves the history readable either way.
    op.execute("UPDATE defect_code SET active = false WHERE code = 'tilt'")
    op.execute(
        """
        DELETE FROM defect_code d
         WHERE d.code = 'tilt'
           AND NOT EXISTS (SELECT 1 FROM qa_review_defect x WHERE x.defect_code_id = d.id)
        """
    )
