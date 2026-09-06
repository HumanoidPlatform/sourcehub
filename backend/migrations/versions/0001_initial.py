"""Baseline. Stamp only — this revision builds nothing.

db/*.sql is the bootstrap: docker-entrypoint-initdb.d runs those 15 files once,
on an empty volume, producing 56 tables and 82 policies with no application
code involved (infra/compose.yaml, README). This revision marks that point on
the Alembic timeline so later revisions have somewhere to attach.

An earlier draft of this file promised to reproduce db/*.sql statement for
statement, so the two paths could be built independently and diffed. That is a
stronger guarantee and it was never written. Rather than leave the promise
standing, the guarantee is now enforced from outside: `make verify-schema`
builds a throwaway database from db/*.sql, runs the migrations against a second
one, and diffs pg_dump --schema-only. Drift fails there instead of in a
docstring nobody can execute.

So: a database is stamped 0001 if it was built by db/*.sql. New environments
get there via `make up`, not via `alembic upgrade`.

Revision ID: 0001
"""

revision = "0001"
down_revision = None


def upgrade() -> None:
    """Intentionally empty. See the module docstring."""


def downgrade() -> None:
    """Nothing to undo; the baseline is the bootstrap."""
