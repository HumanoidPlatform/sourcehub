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

Numbered 0028, having been 0025 and then 0026 on the way. It collided twice, the
same way both times: written against a branch that did not yet carry the
revision it would share a number with, then meeting it in a merge — first
0025_org_public_profile, then 0026_bidding_deadline. Two revisions with one id
is not a conflict alembic resolves; it refuses to build a revision map at all,
so upgrade, heads and even current fail. This one moves each time because the
other is already on origin.

The lesson, for whoever numbers the next one: read `alembic heads` against
ORIGIN rather than the local tree, because a number that is free here may not be
free there.

Revision ID: 0028
Revises: 0027
"""

from alembic import op

revision = "0028"
down_revision = "0027"
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
