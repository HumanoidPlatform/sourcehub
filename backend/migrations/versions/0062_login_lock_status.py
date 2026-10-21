"""auth: a sign-in lock is a timer, not a status.

Five failed sign-ins lock an account for 15 minutes. record_login_attempt also
set status = 'locked', and only a password reset ever set it back, so a person
who signed in again once the lock ran out was passed over for good by every
read that wants an active person: crowd offers, reminders and organisation
mail. The function now keeps the lock in locked_until alone, and accounts
already caught go back to 'active' (or 'invited' where no password was ever
set). No table or column changes, and no API change.

The downgrade puts db/100's record_login_attempt back. The repaired accounts
stay repaired: which ones were caught is not recorded, and marking them locked
again would cut them off again.

SQL copied verbatim from db/570_login_lock_status.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0062
Revises: 0061
"""

from alembic import op

revision = "0062"
down_revision = "0061"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 570 · A sign-in lock is a timer, not a status
--
-- Five failed sign-ins in a row lock an account for 15 minutes
-- (config.login_lock_threshold, login_lock_minutes). record_login_attempt
-- (db/100) did that by setting locked_until AND status = 'locked', and the
-- next successful sign-in cleared the counter and locked_until but never the
-- status. login() admits 'locked', so the person signed in as usual, while
-- every read that wants an active person passed over them for good: crowd
-- offers (modules/delivery), reminders (modules/engage) and organisation mail
-- (db/480 org_mail_recipients). The roster still said accepted, and only a
-- password reset (db/110 password_reset_consume) set the status back.
--
-- The lock is now locked_until alone. login() refuses while it lies in the
-- future, which is all the lock ever needed, and status is left to the
-- account's lifecycle. Nothing else writes 'locked', so it stays free for a
-- deliberate lock should one be built. The signature is unchanged, so the
-- grants made in db/100 still apply.
--
-- Accounts already caught are repaired: back to 'active', or to 'invited'
-- where the account has no credential yet (an attempt on an invitation not
-- yet accepted counted too). That is the rule app_user_active_has_credential
-- (db/010) enforces. Nothing sets 'suspended' or 'deactivated', so a locked
-- account with a credential was active before the lock. A lock still running
-- (locked_until, failed_login_count) is left to run out.
-- ============================================================================

CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email citext, p_user_id uuid, p_succeeded boolean,
  p_failure_code text, p_ip inet, p_user_agent text,
  p_lock_threshold int DEFAULT 5, p_lock_for interval DEFAULT interval '15 minutes'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  INSERT INTO login_attempt (email, user_id, succeeded, failure_code, ip_address, user_agent)
  VALUES (p_email, p_user_id, p_succeeded, p_failure_code, p_ip, p_user_agent);

  IF p_user_id IS NULL THEN RETURN; END IF;

  IF p_succeeded THEN
    UPDATE app_user
       SET failed_login_count = 0, locked_until = NULL, last_login_at = now()
     WHERE id = p_user_id;
  ELSE
    UPDATE app_user
       SET failed_login_count = failed_login_count + 1,
           locked_until = CASE WHEN failed_login_count + 1 >= p_lock_threshold
                               THEN now() + p_lock_for ELSE locked_until END
     WHERE id = p_user_id;
  END IF;
END
$fn$;

UPDATE app_user
   SET status = CASE WHEN password_hash IS NULL AND external_idp_subject IS NULL
                     THEN 'invited'::user_status ELSE 'active'::user_status END
 WHERE status = 'locked';
"""

_DOWN = """
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email citext, p_user_id uuid, p_succeeded boolean,
  p_failure_code text, p_ip inet, p_user_agent text,
  p_lock_threshold int DEFAULT 5, p_lock_for interval DEFAULT interval '15 minutes'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  INSERT INTO login_attempt (email, user_id, succeeded, failure_code, ip_address, user_agent)
  VALUES (p_email, p_user_id, p_succeeded, p_failure_code, p_ip, p_user_agent);

  IF p_user_id IS NULL THEN RETURN; END IF;

  IF p_succeeded THEN
    UPDATE app_user
       SET failed_login_count = 0, locked_until = NULL, last_login_at = now()
     WHERE id = p_user_id;
  ELSE
    UPDATE app_user
       SET failed_login_count = failed_login_count + 1,
           locked_until = CASE WHEN failed_login_count + 1 >= p_lock_threshold
                               THEN now() + p_lock_for ELSE locked_until END,
           status = CASE WHEN failed_login_count + 1 >= p_lock_threshold
                         THEN 'locked'::user_status ELSE status END
     WHERE id = p_user_id;
  END IF;
END
$fn$;
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
