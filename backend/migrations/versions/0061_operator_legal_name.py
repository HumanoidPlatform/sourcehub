"""organisation: the operator's legal name is the registered company.

The platform organisation was seeded with legal_name 'SourceHub Ltd', a
placeholder named after this repository; 0017 renamed the workspace and left
the legal name for when the registered entity was known. Terms 1.1 (db/560)
settled it: the operator is CoSarathi Group Private Limited. Ops reads the
legal name on the organisation's profile, where it contradicted the Terms.

Only a row still holding the placeholder is touched, so a database somebody
has already corrected by hand is left alone and the downgrade is exact.
db/900_seed.sql carries the new value for a database built from scratch. One
statement each way, so asyncpg's one-command limit does not apply. A label: no
column, constraint or policy changes.

Revision ID: 0061
Revises: 0060
"""

from alembic import op

revision = "0061"
down_revision = "0060"
branch_labels = None
depends_on = None

_UP = """
    UPDATE organisation SET legal_name = 'CoSarathi Group Private Limited'
    WHERE  kind = 'platform' AND legal_name = 'SourceHub Ltd'
"""

_DOWN = """
    UPDATE organisation SET legal_name = 'SourceHub Ltd'
    WHERE  kind = 'platform' AND legal_name = 'CoSarathi Group Private Limited'
"""


def upgrade() -> None:
    op.execute(_UP)


def downgrade() -> None:
    op.execute(_DOWN)
