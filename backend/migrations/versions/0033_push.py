"""Push notifications: app_user.push_token and the dispatcher's functions.

No new table. One column on app_user holds the Expo push token of the phone a
user receives notifications on (one phone per user, one user per token), and
notification's delivery columns from 090, never written until now, record
whether the push went out. Five SECURITY DEFINER functions: two for the phone
to set and clear its own token, three for the dispatcher (modules/push), which
runs with no organisation like the engagement clock.

Additive: the deployed API keeps working before its image is replaced. Nothing
it runs reads or writes the new column; rows it writes simply wait, and the
first pass of the new image settles every older row as 'too old'.

SQL copied verbatim from db/300_push.sql so the bootstrap and migration paths
keep producing identical schemas; a test asserts the two stay byte-identical.

Executed one statement at a time, with the splitter 0025, 0027, 0029 and 0030
use, because asyncpg refuses two statements in one execute.

Revision ID: 0033
Revises: 0032
"""

from alembic import op

revision = "0033"
down_revision = "0032"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 300 · Push notifications to the worker's phone
--
-- The bell (notification, db/090) is filled in the same transaction as the
-- change it announces, and the phone only sees it by polling while the app is
-- open. This file lets the same rows also reach a closed phone as an Android
-- system notification, through the Expo push service.
--
-- NO NEW TABLE:
--
--   1. app_user.push_token holds the Expo push token of the one phone the
--      user receives notifications on. The latest sign-in wins, and a token
--      belongs to one user at a time, so a phone handed to someone else stops
--      receiving the previous worker's notifications.
--   2. notification's delivery columns, created in 090 and never written until
--      now, record the push:
--        sent_at                    handed to Expo
--        failed_at, failure_reason  not sent: 'no push token', 'too old',
--                                   'already read', 'expo: <error>'
--      A row addressed to one user with neither set is waiting. channel stays
--      'in_app': every row is still a bell row. Rows addressed to the whole
--      organisation (user_id NULL) are never pushed: workers never see them.
--
-- WHO WRITES WHAT:
--   * app_user_update lets only an admin of the user's organisation update the
--     row, so a worker sets their own token through set_push_token() and
--     unset_push_token(), SECURITY DEFINER, acting on current_user_id() only.
--   * The dispatcher (modules/push) runs with no organisation, like the
--     engagement clock. push_pending(), push_mark() and push_token_dead() are
--     its cross-organisation reads and writes. They return what a push needs
--     and nothing else.
--
-- The token is never added to the ORM model, so no serializer can return it.
-- ============================================================================

ALTER TABLE app_user ADD COLUMN push_token text;

COMMENT ON COLUMN app_user.push_token IS
  'Expo push token (ExponentPushToken[...]) of the phone this user receives '
  'push notifications on. One phone per user, one user per token. Written only '
  'through set_push_token(), unset_push_token() and push_token_dead().';

CREATE UNIQUE INDEX app_user_push_token_key ON app_user (push_token) WHERE push_token IS NOT NULL;

-- The dispatcher's scan: addressed to one user, not yet sent or given up on.
CREATE INDEX notification_push_waiting_idx ON notification (created_at)
  WHERE user_id IS NOT NULL AND sent_at IS NULL AND failed_at IS NULL;

-- ---------------------------------------------------------------------------
-- The phone registers its token after sign-in. Taking it from any other user
-- first keeps the token unique and stops a handed-on phone receiving the
-- previous worker's notifications.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_push_token(p_token text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_user uuid := current_user_id();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'set_push_token needs a signed-in user';
  END IF;
  -- [[] and []] are the brackets, written without a backslash so the
  -- migration can carry this file in an ordinary Python string.
  IF p_token IS NULL OR p_token !~ '^Expo(nent)?PushToken[[].+[]]$' THEN
    RAISE EXCEPTION 'not an Expo push token';
  END IF;
  UPDATE app_user SET push_token = NULL WHERE push_token = p_token AND id <> v_user;
  UPDATE app_user SET push_token = p_token WHERE id = v_user;
END
$fn$;

-- Sign-out. Clears the token only if this user still holds it, so signing out
-- of an old phone never silences the phone the worker moved to.
CREATE OR REPLACE FUNCTION unset_push_token(p_token text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  UPDATE app_user SET push_token = NULL
  WHERE  id = current_user_id() AND push_token = p_token
$fn$;

-- Expo answered DeviceNotRegistered: the app was uninstalled or the token
-- replaced. Whoever holds it stops being pushed to.
CREATE OR REPLACE FUNCTION push_token_dead(p_token text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  UPDATE app_user SET push_token = NULL WHERE push_token = p_token
$fn$;

-- ---------------------------------------------------------------------------
-- push_pending — the rows to push now, oldest first.
--
-- Before answering it settles the rows that will never be pushed, so they
-- leave the waiting index:
--   'too old'        waiting for more than an hour. After an outage the bell
--                    still has them, but a phone should not light up with
--                    yesterday's news. This also covers every row written
--                    before this file, on the first pass.
--   'already read'   the worker saw it in the bell first.
--   'no push token'  the user has no phone registered.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION push_pending(p_limit int)
RETURNS TABLE (id uuid, token text, body text, link_page text, link_params jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
#variable_conflict use_column
BEGIN
  UPDATE notification n
     SET failed_at = now(),
         failure_reason = CASE
           WHEN n.created_at < now() - interval '1 hour' THEN 'too old'
           WHEN n.read_at IS NOT NULL THEN 'already read'
           ELSE 'no push token' END
   WHERE n.user_id IS NOT NULL AND n.sent_at IS NULL AND n.failed_at IS NULL
     AND (n.created_at < now() - interval '1 hour'
          OR n.read_at IS NOT NULL
          OR NOT EXISTS (SELECT 1 FROM app_user u
                         WHERE u.id = n.user_id AND u.push_token IS NOT NULL));

  RETURN QUERY
  SELECT n.id, u.push_token, n.body, n.link_page, n.link_params
  FROM   notification n
  JOIN   app_user u ON u.id = n.user_id
  WHERE  n.user_id IS NOT NULL AND n.sent_at IS NULL AND n.failed_at IS NULL
    AND  u.push_token IS NOT NULL
  ORDER  BY n.created_at
  LIMIT  p_limit;
END
$fn$;

-- p_reason NULL: sent. Otherwise: failed, for that reason. Only rows still
-- waiting are touched, so a pass that overlaps another cannot overwrite it.
CREATE OR REPLACE FUNCTION push_mark(p_ids uuid[], p_reason text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  UPDATE notification
     SET sent_at        = CASE WHEN p_reason IS NULL THEN now() END,
         failed_at      = CASE WHEN p_reason IS NOT NULL THEN now() END,
         failure_reason = p_reason
   WHERE id = ANY (p_ids) AND sent_at IS NULL AND failed_at IS NULL
$fn$;

REVOKE EXECUTE ON FUNCTION set_push_token(text)       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION unset_push_token(text)     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION push_token_dead(text)      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION push_pending(int)          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION push_mark(uuid[], text)    FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION set_push_token(text)       TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION unset_push_token(text)     TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION push_token_dead(text)      TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION push_pending(int)          TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION push_mark(uuid[], text)    TO sourcehub_app;
"""

_DOWN = """
DROP FUNCTION IF EXISTS push_mark(uuid[], text);
DROP FUNCTION IF EXISTS push_pending(int);
DROP FUNCTION IF EXISTS push_token_dead(text);
DROP FUNCTION IF EXISTS unset_push_token(text);
DROP FUNCTION IF EXISTS set_push_token(text);
DROP INDEX IF EXISTS notification_push_waiting_idx;
DROP INDEX IF EXISTS app_user_push_token_key;
ALTER TABLE app_user DROP COLUMN IF EXISTS push_token;
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
