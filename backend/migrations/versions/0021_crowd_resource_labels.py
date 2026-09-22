"""The console says "crowd resource", not "worker".

Two rows in the database are display text rather than code, and a copy change
in the source leaves them behind:

    role.name             'Field worker'
    permission.description 'Assign units of a task to workers'

Data only. There is no schema change, and **role.code stays 'worker'** — it is
what api/deps.py writes into app.role, what is_worker() reads, and what 39 RLS
policies turn on. Renaming the code would not be a rename; every restrictive
`NOT is_worker() OR …` policy would flip open for a real crowd resource.

Deliberately NOT mirrored by a db/*.sql file, unlike every schema change in this
tree. bundle_schema.sh runs STRUCTURE before SEED, so an UPDATE in a db/2xx file
would execute before db/905_seed_workers.sql re-inserted the old text and be
silently undone. A fresh install gets the new wording from the seed itself,
which is edited in the same change; this migration is only for databases that
already exist.

Revision ID: 0021
Revises: 0020
"""

from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE role SET name = 'Crowd resource' WHERE code = 'worker'")
    op.execute(
        "UPDATE permission SET description = 'Assign units of a task to crowd resources' "
        "WHERE code = 'assignment.assign'"
    )


def downgrade() -> None:
    op.execute("UPDATE role SET name = 'Field worker' WHERE code = 'worker'")
    op.execute(
        "UPDATE permission SET description = 'Assign units of a task to workers' "
        "WHERE code = 'assignment.assign'"
    )
