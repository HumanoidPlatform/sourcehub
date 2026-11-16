"""delivery: every task carries its client's privacy terms; a reviewer can name a person in frame.

A request's privacy terms (db/360 consent_and_compliance) stopped at the client
and the partner: the supplier and the crowd resource cannot read a request
under RLS, and no task inherited them. delivery.create_task now merges six of
them into the task's capture_spec as "privacy", which already reaches the
phone, its offline copy, the browser upload and both review gates. This fills
the same object in for the tasks that already exist, built exactly as
delivery.privacy_terms builds it.

It also adds the defect code a reviewer sends a capture back with when
someone, or a child, is in a shot the client said should have nobody in it.
Added to db/900_seed.sql for fresh installs; bundle_schema.sh runs STRUCTURE
before SEED, so a db/ file inserting it would be undone by the seed that
follows. Data only, like 0028.

updated_at is not a user edit here, so its trigger is held off for the
backfill, as db/360 did for the request columns it folded.

Revision ID: 0061
Revises: 0060
"""

from alembic import op

revision = "0061"
down_revision = "0060"
branch_labels = None
depends_on = None

# An array key that is absent or JSON null becomes [], as privacy_terms does.
_ARRAY = (
    "CASE WHEN jsonb_typeof(r.consent_and_compliance -> '{k}') = 'array' "
    "THEN r.consent_and_compliance -> '{k}' ELSE '[]'::jsonb END"
)

_BACKFILL = f"""
UPDATE task t
   SET capture_spec = coalesce(t.capture_spec, '{{}}'::jsonb) || jsonb_build_object(
         'privacy', jsonb_build_object(
           'people_in_frame', r.consent_and_compliance -> 'people_in_frame',
           'minors_policy', r.consent_and_compliance -> 'minors_policy',
           'deidentification', {_ARRAY.format(k="deidentification")},
           'lawful_basis', r.consent_and_compliance -> 'lawful_basis',
           'regulations', {_ARRAY.format(k="regulations")},
           'biometric_processing',
             coalesce((r.consent_and_compliance ->> 'biometric_processing')::boolean, false)))
  FROM contract c
  JOIN request r ON r.id = c.request_id
 WHERE c.id = t.contract_id
"""


def upgrade() -> None:
    op.execute("ALTER TABLE task DISABLE TRIGGER task_updated_at")
    op.execute(_BACKFILL)
    op.execute("ALTER TABLE task ENABLE TRIGGER task_updated_at")
    # automated = false, following wrong_subject and tilt: the phone can see a
    # face, a person decides whether the shot breaks the client's terms.
    op.execute(
        "INSERT INTO defect_code (code, label, category, automated) "
        "VALUES ('person_in_frame', 'Person or child in frame', 'compliance', false) "
        "ON CONFLICT (code) DO NOTHING"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE task DISABLE TRIGGER task_updated_at")
    op.execute(
        "UPDATE task SET capture_spec = capture_spec - 'privacy' WHERE capture_spec ? 'privacy'"
    )
    op.execute("ALTER TABLE task ENABLE TRIGGER task_updated_at")
    # A verdict already given keeps its reason: retire the code from the
    # reviewer's list, and remove it only if no review ever cited it
    # (db/310 keeps a review's defects as a json object keyed by code).
    op.execute("UPDATE defect_code SET active = false WHERE code = 'person_in_frame'")
    op.execute(
        """
        DELETE FROM defect_code d
         WHERE d.code = 'person_in_frame'
           AND NOT EXISTS (SELECT 1 FROM qa_review q WHERE q.defects ? 'person_in_frame')
        """
    )
