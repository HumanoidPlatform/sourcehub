"""A worker's skills come from a list.

crowd_worker.skill was free text and produced, across four workers on the pilot
database, 'Proficient', 'work', 'all' and NULL. Not one is a skill, so there is
nothing to migrate: the column is dropped and every row starts at '{}'.

The nine values are the ones docs/sourcehub-app.html:833-841 already authored
and db/910_seed_demo.sql already seeds. text[] NOT NULL DEFAULT '{}' with a <@
CHECK is the house pattern — seven columns already use it.

invite_worker changes signature, which CREATE OR REPLACE cannot do: it would
add an overload and leave the call ambiguous. It is dropped by its full
argument list first, and the REVOKE/GRANT pair names that list too.

SQL copied verbatim from db/190_worker_skills.sql so the bootstrap and
migration paths keep producing identical schemas (make verify-schema). The
column is added after the drop, in a file that runs after 120, so the column
ORDER matches on both paths — that is what verify-schema diffs.

Executed one statement at a time, with the $fn$ body held together — the same
splitter 0012 to 0014, 0018 and 0019 use. 0017 sat unapplied on the pilot
database for days because it handed two statements to one execute and asyncpg
refuses that.

Revision ID: 0020
Revises: 0019
"""

from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None

_UP = """
ALTER TABLE crowd_worker
  ADD COLUMN skills text[] NOT NULL DEFAULT '{}'
    CHECK (skills <@ ARRAY['street_imagery','night_driving','shelf_capture',
                           'drone_operation','retail_audit','field_survey',
                           'transcription','voice_capture','household_survey']);

ALTER TABLE crowd_worker DROP COLUMN skill;

DROP FUNCTION invite_worker(citext,text,text,text,boolean,uuid,text,interval);

CREATE OR REPLACE FUNCTION invite_worker(
  p_email       citext,
  p_full_name   text,
  p_phone       text,
  p_skills      text[],
  p_trained     boolean,
  p_invited_by  uuid,
  p_token_hash  text,
  p_ttl         interval DEFAULT interval '14 days'
) RETURNS TABLE (worker_id uuid, user_id uuid, reference_code text)
LANGUAGE plpgsql AS $fn$
DECLARE
  v_org  uuid := current_org_id();
  v_role uuid;
  v_user uuid := gen_random_uuid();
  v_wkr  uuid;
  v_ref  text;
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT r.id INTO v_role FROM role r WHERE r.code = 'worker' AND r.is_system;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'the worker role is not seeded';
  END IF;

  v_ref := next_reference_code('WKR', 'seq_ref_worker');

  -- 1 · the person, invited, with no password
  INSERT INTO app_user (id, email, full_name, phone, status, created_by, updated_by)
  VALUES (v_user, p_email, p_full_name, p_phone, 'invited', p_invited_by, p_invited_by);

  -- 2 · their worker grant in THIS organisation
  INSERT INTO user_role_grant (user_id, org_id, role_id, scope, granted_by)
  VALUES (v_user, v_org, v_role, 'member', p_invited_by);

  -- 3 · the roster row (RETURNING is safe: the org's own roster is selectable)
  INSERT INTO crowd_worker (reference_code, aggregator_org_id, display_name, skills, trained,
                            user_id, email, phone)
  VALUES (v_ref, v_org, p_full_name, coalesce(p_skills, '{}'), coalesce(p_trained, false), v_user, p_email, p_phone)
  RETURNING id INTO v_wkr;

  -- 4 · the invitation
  INSERT INTO invitation (token_hash, email, org_id, role_id, scope, user_id, invited_by, expires_at)
  VALUES (p_token_hash, p_email, v_org, v_role, 'member', v_user, p_invited_by, now() + p_ttl);

  RETURN QUERY SELECT v_wkr, v_user, v_ref;
END
$fn$;

REVOKE EXECUTE ON FUNCTION invite_worker(citext,text,text,text[],boolean,uuid,text,interval) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION invite_worker(citext,text,text,text[],boolean,uuid,text,interval) TO sourcehub_app;
"""

# The skills are NOT restored: the column they came from held 'work' and 'all'.
# Downgrade puts the shape back, empty, which is the honest inverse.
_DOWN = """
ALTER TABLE crowd_worker ADD COLUMN skill text;

ALTER TABLE crowd_worker DROP COLUMN skills;

DROP FUNCTION invite_worker(citext,text,text,text[],boolean,uuid,text,interval);

CREATE OR REPLACE FUNCTION invite_worker(
  p_email       citext,
  p_full_name   text,
  p_phone       text,
  p_skill       text,
  p_trained     boolean,
  p_invited_by  uuid,
  p_token_hash  text,
  p_ttl         interval DEFAULT interval '14 days'
) RETURNS TABLE (worker_id uuid, user_id uuid, reference_code text)
LANGUAGE plpgsql AS $fn$
DECLARE
  v_org  uuid := current_org_id();
  v_role uuid;
  v_user uuid := gen_random_uuid();
  v_wkr  uuid;
  v_ref  text;
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT r.id INTO v_role FROM role r WHERE r.code = 'worker' AND r.is_system;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'the worker role is not seeded';
  END IF;

  v_ref := next_reference_code('WKR', 'seq_ref_worker');

  INSERT INTO app_user (id, email, full_name, phone, status, created_by, updated_by)
  VALUES (v_user, p_email, p_full_name, p_phone, 'invited', p_invited_by, p_invited_by);

  INSERT INTO user_role_grant (user_id, org_id, role_id, scope, granted_by)
  VALUES (v_user, v_org, v_role, 'member', p_invited_by);

  INSERT INTO crowd_worker (reference_code, aggregator_org_id, display_name, skill, trained,
                            user_id, email, phone)
  VALUES (v_ref, v_org, p_full_name, p_skill, coalesce(p_trained, false), v_user, p_email, p_phone)
  RETURNING id INTO v_wkr;

  INSERT INTO invitation (token_hash, email, org_id, role_id, scope, user_id, invited_by, expires_at)
  VALUES (p_token_hash, p_email, v_org, v_role, 'member', v_user, p_invited_by, now() + p_ttl);

  RETURN QUERY SELECT v_wkr, v_user, v_ref;
END
$fn$;

REVOKE EXECUTE ON FUNCTION invite_worker(citext,text,text,text,boolean,uuid,text,interval) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION invite_worker(citext,text,text,text,boolean,uuid,text,interval) TO sourcehub_app;
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
