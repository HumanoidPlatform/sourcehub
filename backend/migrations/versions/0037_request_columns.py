"""request: drop the columns nothing uses, fold people and pilot into json.

Seven request columns held nothing a client typed: geography and spec_quality
carried the same server placeholder on every row, sampling_frame was always
empty, people_headcount always 0, and residency_region, contact_user_id and
proposal_requirements were never sent by the console. They are dropped. The
three people columns, reduced to placeholders, become one optional jsonb
column, people_requirements, which the form asks for again and partners see
when it is filled. pilot_required stays; the pilot's size and due date become
one jsonb column, pilot, present exactly while a pilot is required, so later
pilot terms need no column. request goes from 57 to 47 columns.

SQL copied verbatim from db/340_request_columns.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. The guard refuses to run, changing nothing, if a dropped column
holds anything but its empty value or the old placeholder. The downgrade
brings the twelve columns back with their constraint names, filled from the
json or with the old placeholders. No operator flag.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0037
Revises: 0036
"""

from alembic import op

revision = "0037"
down_revision = "0036"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 340 · request: drop what nothing uses, fold people and pilot into json
--
-- 040 flattened the prototype's spec, people and timeline objects into columns
-- because every field was shown or filtered on. The form has changed since, and
-- that is no longer true of several of them:
--
--   geography, spec_quality   the form has no field; the server stored the same
--                             placeholder on every row ('Not specified',
--                             'Standard acceptance applies') and showed it to
--                             partners as if the client had written it.
--   sampling_frame            never set by the form; always '{}'.
--   people_headcount          the form always sends 0.
--   residency_region,         accepted by the API, never sent by the console,
--   contact_user_id,          never read; the region rule residency_region was
--   proposal_requirements     meant for was never enforced.
--
-- They go. Two groups are folded instead:
--
--   people_requirements  The client's optional crew requirements: training,
--                        experience, certification, free text. The form asks
--                        for them again (they had been reduced to the
--                        placeholders 'None specified' and 'None'); partners see
--                        them when the client fills them. jsonb because nothing
--                        filters on them and further requirements need no column.
--   pilot                The size and due date of a paid first batch, present
--                        exactly while pilot_required is true. pilot_required
--                        stays a column; any later pilot term goes into the json.
--
-- request goes from 57 to 47 columns. Safe on a database with data: the guard
-- refuses to run, changing nothing, if a column this file drops holds anything
-- but its empty value or the server placeholder. A fresh build holds no rows.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Guard · Nothing this file drops holds real data
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_rows bigint;
BEGIN
  SELECT count(*) INTO v_rows FROM request
   WHERE (nullif(btrim(geography), '') IS NOT NULL AND geography <> 'Not specified')
      OR (nullif(btrim(spec_quality), '') IS NOT NULL
          AND spec_quality <> 'Standard acceptance applies')
      OR people_headcount <> 0
      OR residency_region IS NOT NULL
      OR contact_user_id IS NOT NULL
      OR cardinality(proposal_requirements) > 0
      OR sampling_frame <> '{}'::jsonb;
  IF v_rows > 0 THEN
    RAISE EXCEPTION '340: % request(s) hold a value in a column this file drops (geography, '
                    'spec_quality, people_headcount, residency_region, contact_user_id, '
                    'proposal_requirements or sampling_frame); nothing was changed. Look at '
                    'them, then clear those values or extend this file to carry them', v_rows;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 1 · The two json columns, at the end of the table
-- ---------------------------------------------------------------------------
ALTER TABLE request ADD COLUMN people_requirements jsonb;
ALTER TABLE request ADD COLUMN pilot jsonb;

COMMENT ON COLUMN request.people_requirements IS
  'Optional crew requirements the client states: {training, experience, certification}, '
  'free text, each key present only when filled. NULL when none. Shown to the partners '
  'who can read the request.';
COMMENT ON COLUMN request.pilot IS
  'The paid pilot while pilot_required is true: {quantity, due_on}, quantity in '
  'target_unit, due_on an ISO date or absent. NULL when no pilot is required.';

-- ---------------------------------------------------------------------------
-- 2 · Carry what the folded columns hold
--
--     The people text columns hold real answers only where they differ from
--     the placeholders the server used to store. A pilot is carried only while
--     it is required, which also clears the size and date an unticked pilot
--     used to leave behind. updated_at is not a user edit here, so its trigger
--     is held off for the copy.
-- ---------------------------------------------------------------------------
ALTER TABLE request DISABLE TRIGGER request_updated_at;
UPDATE request SET
  people_requirements = nullif(jsonb_strip_nulls(jsonb_build_object(
    'training', nullif(nullif(btrim(people_training), ''), 'None specified'),
    'experience', nullif(nullif(btrim(people_experience), ''), 'None specified'),
    'certification', nullif(nullif(nullif(btrim(people_certification), ''), 'None'),
                            'None specified'))), '{}'::jsonb),
  pilot = CASE WHEN pilot_required
               THEN jsonb_strip_nulls(jsonb_build_object('quantity', pilot_quantity,
                                                         'due_on', pilot_due_on))
          END;
ALTER TABLE request ENABLE TRIGGER request_updated_at;

-- ---------------------------------------------------------------------------
-- 3 · Constraints: the pilot shape moves into the json
--
--     A required pilot has a whole quantity above zero and, if dated, an ISO
--     date; a pilot that is not required has no terms at all. The CASE keeps
--     the cast from running on anything but a number.
-- ---------------------------------------------------------------------------
ALTER TABLE request DROP CONSTRAINT request_pilot_shape;
ALTER TABLE request DROP CONSTRAINT request_pilot_quantity_check;
ALTER TABLE request DROP CONSTRAINT request_people_headcount_check;
ALTER TABLE request DROP CONSTRAINT request_proposal_requirements_check;
ALTER TABLE request DROP CONSTRAINT request_contact_user_id_fkey;

ALTER TABLE request
  ADD CONSTRAINT request_pilot_shape CHECK (
    (NOT pilot_required AND pilot IS NULL)
    OR (pilot_required
        AND jsonb_typeof(pilot) = 'object'
        AND CASE WHEN jsonb_typeof(pilot -> 'quantity') = 'number'
                 THEN (pilot ->> 'quantity')::numeric > 0
                      AND (pilot ->> 'quantity')::numeric = floor((pilot ->> 'quantity')::numeric)
                 ELSE false
            END
        AND ((pilot ->> 'due_on') IS NULL
             OR (pilot ->> 'due_on') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')));
ALTER TABLE request
  ADD CONSTRAINT request_people_requirements_shape CHECK (
    people_requirements IS NULL OR jsonb_typeof(people_requirements) = 'object');

-- ---------------------------------------------------------------------------
-- 4 · Drop the twelve columns
-- ---------------------------------------------------------------------------
ALTER TABLE request DROP COLUMN geography;
ALTER TABLE request DROP COLUMN spec_quality;
ALTER TABLE request DROP COLUMN sampling_frame;
ALTER TABLE request DROP COLUMN people_headcount;
ALTER TABLE request DROP COLUMN people_training;
ALTER TABLE request DROP COLUMN people_experience;
ALTER TABLE request DROP COLUMN people_certification;
ALTER TABLE request DROP COLUMN residency_region;
ALTER TABLE request DROP COLUMN contact_user_id;
ALTER TABLE request DROP COLUMN proposal_requirements;
ALTER TABLE request DROP COLUMN pilot_quantity;
ALTER TABLE request DROP COLUMN pilot_due_on;
"""

_DOWN = """
-- Downgrade of 0037: the twelve request columns come back with their 040
-- definitions and constraint names (at the end of the table, so the column
-- order differs from a database that never ran 0037). The people text columns
-- take the json's answers or the placeholders the old server stored; geography
-- and spec_quality take their placeholders; the pilot size and date come out of
-- the json. residency_region, contact_user_id, proposal_requirements and
-- sampling_frame return empty, as they were on every row 0037 accepted.

-- 4 · The twelve columns
ALTER TABLE request ADD COLUMN geography text;
ALTER TABLE request ADD COLUMN spec_quality text;
ALTER TABLE request ADD COLUMN sampling_frame jsonb NOT NULL DEFAULT '{}';
ALTER TABLE request ADD COLUMN people_headcount integer NOT NULL DEFAULT 0;
ALTER TABLE request ADD COLUMN people_training text;
ALTER TABLE request ADD COLUMN people_experience text;
ALTER TABLE request ADD COLUMN people_certification text;
ALTER TABLE request ADD COLUMN residency_region text;
ALTER TABLE request ADD COLUMN contact_user_id uuid;
ALTER TABLE request ADD COLUMN proposal_requirements text[] NOT NULL DEFAULT '{}';
ALTER TABLE request ADD COLUMN pilot_quantity integer;
ALTER TABLE request ADD COLUMN pilot_due_on date;

-- 2 · Their values
ALTER TABLE request DISABLE TRIGGER request_updated_at;
UPDATE request SET
  geography = 'Not specified',
  spec_quality = 'Standard acceptance applies',
  people_training = coalesce(people_requirements ->> 'training', 'None specified'),
  people_experience = coalesce(people_requirements ->> 'experience', 'None specified'),
  people_certification = coalesce(people_requirements ->> 'certification', 'None'),
  pilot_quantity = (pilot ->> 'quantity')::numeric::integer,
  pilot_due_on = (pilot ->> 'due_on')::date;
ALTER TABLE request ENABLE TRIGGER request_updated_at;

-- 3 · The old constraints
ALTER TABLE request DROP CONSTRAINT request_pilot_shape;
ALTER TABLE request DROP CONSTRAINT request_people_requirements_shape;
ALTER TABLE request
  ADD CONSTRAINT request_people_headcount_check CHECK (people_headcount >= 0);
ALTER TABLE request
  ADD CONSTRAINT request_pilot_quantity_check CHECK (pilot_quantity IS NULL OR pilot_quantity > 0);
ALTER TABLE request
  ADD CONSTRAINT request_proposal_requirements_check CHECK (proposal_requirements <@ ARRAY[
    'method_statement', 'team_cv', 'sample_work', 'insurance', 'dpa_acceptance', 'references']);
ALTER TABLE request
  ADD CONSTRAINT request_contact_user_id_fkey FOREIGN KEY (contact_user_id)
    REFERENCES app_user(id) ON DELETE SET NULL;
ALTER TABLE request
  ADD CONSTRAINT request_pilot_shape CHECK (NOT pilot_required OR pilot_quantity IS NOT NULL);

-- 1 · The json columns go
ALTER TABLE request DROP COLUMN people_requirements;
ALTER TABLE request DROP COLUMN pilot;
"""


def _statements(ddl: str) -> list[str]:
    out: list[str] = []
    buf: list[str] = []
    in_body = False
    for line in ddl.splitlines():
        if line.count("$fn$") == 1:
            in_body = not in_body
        buf.append(line)
        if not in_body and line.rstrip().endswith(";"):
            stmt = chr(10).join(buf).strip()
            buf = []
            lines = stmt.splitlines()
            only_comments = all(ln.strip().startswith("--") or not ln.strip() for ln in lines)
            if stmt and not only_comments:
                out.append(stmt)
    return out


def upgrade() -> None:
    for stmt in _statements(_UP):
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
