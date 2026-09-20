"""The operator's own organisation carries the company's name, not the codebase's.

The console shows organisation.name as the workspace the signed-in person is in,
and for a platform administrator that read "SourceHub Operations" — the name of
this repository, which nobody outside it uses. The company is Cosarathi and the
product it operates is DataMind360 (frontend/src/shared/brand.tsx, and PRODUCT /
COMPANY in backend config.py). A workspace names the organisation, so it takes
the company's name, not the product's.

The role description beside it said the same thing and moves with it. Both are
labels: no column, constraint or policy changes here.

db/900_seed.sql carries the same values, for a database built from scratch.

Only rows still holding the old value are touched, so a database somebody has
already renamed by hand is left alone and the downgrade is exact.

legal_name is deliberately untouched. It says "SourceHub Ltd", which is a
placeholder, and the registered entity is the open question the privacy notice
already carries (it names Vaieon) — one for a lawyer, not a migration.

Revision ID: 0017
Revises: 0016
"""

from alembic import op

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None

_RENAME = """
UPDATE organisation SET name = 'Cosarathi Operations'
WHERE  kind = 'platform' AND name = 'SourceHub Operations';

UPDATE role SET description = 'Cosarathi operations'
WHERE  code = 'platform_admin' AND is_system AND description = 'SourceHub operations';
"""

_UNDO = """
UPDATE organisation SET name = 'SourceHub Operations'
WHERE  kind = 'platform' AND name = 'Cosarathi Operations';

UPDATE role SET description = 'SourceHub operations'
WHERE  code = 'platform_admin' AND is_system AND description = 'Cosarathi operations';
"""


def upgrade() -> None:
    op.execute(_RENAME)


def downgrade() -> None:
    op.execute(_UNDO)
