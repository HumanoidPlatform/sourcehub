"""outbox: every platform e-mail through the mail log, and an Ops screen.

db/490 widens mail_outbox with whose mail it is (org_id), what it is about
(entity_type, entity_id, label), a Reply-To, the token-scrubbing flags and the
re-send chain; adds mail_enqueue_to for one address, write-back of the outcome
onto task_offer_recipient and engagement_reminder from mail_mark, and the Ops
reads mail_stats, mail_log, mail_resend, mail_status and mail_purge. Additive:
the three-argument mail_enqueue stays as a wrapper, so the 0052 API keeps
publishing while this runs.

_SEED gives the platform role the two new capabilities, mail.read and
mail.resend, in an existing database; db/900_seed.sql carries them for a fresh
build (STRUCTURE runs before SEED there).

The downgrade refuses while any mail is still waiting, then removes the
capabilities, the new functions, the new columns and indexes, and puts the
db/480 bodies of mail_enqueue, mail_pending and mail_mark back. Sent and
failed history keeps only what db/480 recorded.

SQL copied verbatim from db/490_mail_log.sql so the bootstrap and migration
paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0053
Revises: 0052
"""

from alembic import op

revision = "0053"
down_revision = "0052"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 490 · Mail log: every platform e-mail goes through the outbox, and Ops see it
--
-- db/480 queued only the two RFP mails. From here every e-mail the platform
-- sends -- password resets, invitations, task offers, reminders, DataHub
-- replies, the RFP mails -- is a mail_outbox row, written in the transaction
-- that decided to send it and sent by the clock (modules/outbox). One table
-- answers "did it go?", and an Ops screen reads it: how many went today, which
-- failed and why, and a re-send.
--
-- WHAT A ROW NOW CARRIES:
--   org_id         whose business the mail is: current_org_id() at enqueue,
--                  NULL for the platform's own, such as a password reset
--   entity_type,   what it is about: 'request', 'contract', 'app_user',
--   entity_id      'onboarding_request', 'crowd_worker', 'task_offer_recipient',
--                  'engagement_reminder', 'datahub_deal_message'
--   label          one human line for the Ops list, never rendered from context
--   reply_to       a DataHub reply answers to the seller, not the platform
--   scrub_on_send  a mail carrying a link token forgets its context once sent
--                  the token then exists only in the mailbox it went to
--   scrubbed_at    when that happened (so a list never has to look at context)
--   resend_until   after this a re-send would deliver a dead link, and Ops are
--                  pointed at the module's own Resend instead
--   resent_from    the failed row a re-send copies
--
-- WRITE-BACK: task_offer_recipient and engagement_reminder keep their own
-- sent_at / send_error, which the console shows and the engagement clock reads
-- (a recipient is reminded only once the first mail went). mail_mark() fills
-- them in when the row settles, so nothing that read them has to change.
--
-- OPS READS are SECURITY DEFINER functions that refuse anyone but the platform
-- role. mail_log never looks at context: an unsent invitation's token is in it.
-- The three-argument mail_enqueue stays, as a wrapper, so the 0052 API keeps
-- publishing while this file lands.
-- ============================================================================

ALTER TABLE mail_outbox ADD COLUMN org_id uuid REFERENCES organisation(id) ON DELETE SET NULL;
ALTER TABLE mail_outbox ADD COLUMN entity_type text;
ALTER TABLE mail_outbox ADD COLUMN entity_id uuid;
ALTER TABLE mail_outbox ADD COLUMN label text NOT NULL DEFAULT '';
ALTER TABLE mail_outbox ADD COLUMN reply_to text;
ALTER TABLE mail_outbox ADD COLUMN scrub_on_send boolean NOT NULL DEFAULT false;
ALTER TABLE mail_outbox ADD COLUMN scrubbed_at timestamptz;
ALTER TABLE mail_outbox ADD COLUMN resend_until timestamptz;
ALTER TABLE mail_outbox ADD COLUMN resent_from uuid REFERENCES mail_outbox(id) ON DELETE SET NULL;
ALTER TABLE mail_outbox ADD CONSTRAINT mail_outbox_entity_pair
  CHECK ((entity_type IS NULL) = (entity_id IS NULL));

COMMENT ON COLUMN mail_outbox.org_id IS
  'The organisation on whose behalf the mail goes (current_org_id() when it was '
  'queued); NULL for the platform''s own, such as a password reset.';
COMMENT ON COLUMN mail_outbox.entity_type IS
  'What the mail is about, with entity_id: request, contract, app_user, '
  'onboarding_request, crowd_worker, task_offer_recipient, engagement_reminder, '
  'datahub_deal_message. mail_mark() writes the outcome back onto the last two.';
COMMENT ON COLUMN mail_outbox.label IS
  'One human line for the Ops mail log, written when the row is queued; the list '
  'never renders a mail to describe it.';
COMMENT ON COLUMN mail_outbox.scrub_on_send IS
  'The mail carries a link token (invitation, reset, offer): its context is '
  'emptied once sent or re-sent, so the token lives only in the mailbox it went to.';
COMMENT ON COLUMN mail_outbox.resend_until IS
  'Past this a re-send would deliver a dead link; mail_resend() refuses and Ops '
  'use the module''s own Resend, which mints a fresh token.';

-- The Ops list, newest first; what a mail is about; the chain of re-sends.
CREATE INDEX mail_outbox_created_idx ON mail_outbox (created_at DESC);
CREATE INDEX mail_outbox_entity_idx  ON mail_outbox (entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX mail_outbox_resent_idx  ON mail_outbox (resent_from) WHERE resent_from IS NOT NULL;

-- ---------------------------------------------------------------------------
-- mail_enqueue -- the fan-out to every active user of the given organisations
-- (db/480), now stamping whose mail it is and what it is about.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mail_enqueue(p_template text, p_context jsonb, p_org_ids uuid[],
                                        p_entity_type text, p_entity_id uuid, p_label text)
RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_n int;
BEGIN
  INSERT INTO mail_outbox (to_email, to_name, template, context, org_id, entity_type, entity_id, label)
  SELECT r.email, r.full_name, p_template,
         p_context || jsonb_build_object('recipient_name', r.full_name,
                                         'recipient_org',  r.org_name),
         current_org_id(), p_entity_type, p_entity_id, coalesce(p_label, '')
  FROM   org_mail_recipients(p_org_ids) r;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END
$fn$;

-- The db/480 shape, for the API that is still running when this file lands.
CREATE OR REPLACE FUNCTION mail_enqueue(p_template text, p_context jsonb, p_org_ids uuid[])
RETURNS int
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT mail_enqueue(p_template, p_context, p_org_ids, NULL, NULL, '')
$fn$;

-- ---------------------------------------------------------------------------
-- mail_enqueue_to -- one address. Works with or without a session: a password
-- reset runs with none, and then org_id is NULL.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mail_enqueue_to(p_template text, p_context jsonb, p_to_email citext, p_to_name text,
                                           p_reply_to text, p_entity_type text, p_entity_id uuid, p_label text,
                                           p_scrub boolean, p_resend_until timestamptz)
RETURNS uuid
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
  INSERT INTO mail_outbox (to_email, to_name, template, context, reply_to, org_id,
                           entity_type, entity_id, label, scrub_on_send, resend_until)
  VALUES (p_to_email, coalesce(p_to_name, ''), p_template, p_context, p_reply_to, current_org_id(),
          p_entity_type, p_entity_id, coalesce(p_label, ''), coalesce(p_scrub, false), p_resend_until)
  RETURNING id
$fn$;

-- ---------------------------------------------------------------------------
-- mail_mark -- p_reason NULL: sent. Otherwise: failed, for that reason. Only
-- rows still waiting are touched. A sent token mail forgets its context, and
-- the outcome is written onto the offer recipient or reminder it was about.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mail_mark(p_ids uuid[], p_reason text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  WITH done AS (
    UPDATE mail_outbox
       SET sent_at        = CASE WHEN p_reason IS NULL THEN now() END,
           failed_at      = CASE WHEN p_reason IS NOT NULL THEN now() END,
           failure_reason = p_reason,
           context        = CASE WHEN p_reason IS NULL AND scrub_on_send THEN '{}'::jsonb ELSE context END,
           scrubbed_at    = CASE WHEN p_reason IS NULL AND scrub_on_send THEN now() ELSE scrubbed_at END
     WHERE id = ANY (p_ids) AND sent_at IS NULL AND failed_at IS NULL
     RETURNING entity_type, entity_id, sent_at
  ), offers AS (
    UPDATE task_offer_recipient t
       SET sent_at = d.sent_at, send_error = p_reason
      FROM done d
     WHERE d.entity_type = 'task_offer_recipient' AND t.id = d.entity_id
  )
  UPDATE engagement_reminder e
     SET sent_at = d.sent_at, send_error = p_reason
    FROM done d
   WHERE d.entity_type = 'engagement_reminder' AND e.id = d.entity_id
$fn$;

-- ---------------------------------------------------------------------------
-- mail_pending -- the rows to send now, oldest first, with their Reply-To.
-- Rows waiting for more than two days are settled first, through mail_mark()
-- so the subject row hears about it too. The return type changed, so this is
-- a DROP and a CREATE rather than a replace.
-- ---------------------------------------------------------------------------
DROP FUNCTION mail_pending(int);

CREATE OR REPLACE FUNCTION mail_pending(p_limit int)
RETURNS TABLE (id uuid, to_email citext, to_name text, template text, context jsonb, reply_to text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
#variable_conflict use_column
DECLARE
  v_old uuid[];
BEGIN
  SELECT array_agg(m.id) INTO v_old
  FROM   mail_outbox m
  WHERE  m.sent_at IS NULL AND m.failed_at IS NULL
    AND  m.created_at < now() - interval '48 hours';
  IF v_old IS NOT NULL THEN
    PERFORM mail_mark(v_old, 'too old');
  END IF;

  RETURN QUERY
  SELECT m.id, m.to_email, m.to_name, m.template, m.context, m.reply_to
  FROM   mail_outbox m
  WHERE  m.sent_at IS NULL AND m.failed_at IS NULL
  ORDER  BY m.created_at
  LIMIT  p_limit;
END
$fn$;

-- ---------------------------------------------------------------------------
-- mail_status -- the latest mail about one row, for the organisation it
-- belongs to (or operations): queued, sent or failed, when, and why.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mail_status(p_entity_type text, p_entity_id uuid)
RETURNS TABLE (state text, happened_at timestamptz, reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT CASE WHEN m.sent_at IS NOT NULL THEN 'sent'
              WHEN m.failed_at IS NOT NULL THEN 'failed'
              ELSE 'queued' END,
         coalesce(m.sent_at, m.failed_at, m.created_at),
         m.failure_reason
  FROM   mail_outbox m
  WHERE  m.entity_type = p_entity_type AND m.entity_id = p_entity_id
    AND  (is_platform_admin() OR m.org_id = current_org_id())
  ORDER  BY m.created_at DESC
  LIMIT  1
$fn$;

-- ---------------------------------------------------------------------------
-- The Ops screen. Each refuses anyone but the platform role.
-- ---------------------------------------------------------------------------

-- Today (UTC) and the last seven days, as one document for the tiles and chart.
CREATE OR REPLACE FUNCTION mail_stats() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_since timestamptz := date_trunc('day', now(), 'UTC');
  v       jsonb;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'mail_stats: operations only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT jsonb_build_object(
           'since',        v_since,
           'sent_today',   count(*) FILTER (WHERE m.sent_at >= v_since),
           'failed_today', count(*) FILTER (WHERE m.failed_at >= v_since),
           'waiting',      count(*) FILTER (WHERE m.sent_at IS NULL AND m.failed_at IS NULL),
           'failed_open',  count(*) FILTER (WHERE m.failed_at >= now() - interval '30 days'
                                              AND NOT EXISTS (SELECT 1 FROM mail_outbox c
                                                              WHERE c.resent_from = m.id)),
           'days',
           (SELECT coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'sent', d.sent, 'failed', d.failed)
                                      ORDER BY d.day), '[]'::jsonb)
            FROM (SELECT (coalesce(x.sent_at, x.failed_at) AT TIME ZONE 'UTC')::date AS day,
                         count(*) FILTER (WHERE x.sent_at IS NOT NULL)   AS sent,
                         count(*) FILTER (WHERE x.failed_at IS NOT NULL) AS failed
                  FROM   mail_outbox x
                  WHERE  coalesce(x.sent_at, x.failed_at) >= v_since - interval '6 days'
                  GROUP  BY 1) d))
  INTO   v
  FROM   mail_outbox m;
  RETURN v;
END
$fn$;

-- The list, newest first: p_status is 'all', 'sent', 'failed' or 'waiting'
-- p_before pages back. can_resend is true for a failed row that still holds
-- its content, whose link has not expired, and that has not been re-sent.
CREATE OR REPLACE FUNCTION mail_log(p_status text, p_limit int, p_before timestamptz)
RETURNS TABLE (id uuid, created_at timestamptz, to_email citext, to_name text, template text, label text,
               entity_type text, entity_id uuid, org_name text, state text, sent_at timestamptz,
               failed_at timestamptz, failure_reason text, resent_from uuid, resent_to uuid,
               can_resend boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
#variable_conflict use_column
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'mail_log: operations only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
  SELECT m.id, m.created_at, m.to_email, m.to_name, m.template, m.label,
         m.entity_type, m.entity_id, o.name,
         CASE WHEN m.sent_at IS NOT NULL THEN 'sent'
              WHEN m.failed_at IS NOT NULL THEN 'failed'
              ELSE 'queued' END,
         m.sent_at, m.failed_at, m.failure_reason, m.resent_from,
         (SELECT c.id FROM mail_outbox c WHERE c.resent_from = m.id ORDER BY c.created_at DESC LIMIT 1),
         (m.failed_at IS NOT NULL
          AND m.scrubbed_at IS NULL
          AND (m.resend_until IS NULL OR m.resend_until > now())
          AND NOT EXISTS (SELECT 1 FROM mail_outbox c WHERE c.resent_from = m.id))
  FROM   mail_outbox m
  LEFT   JOIN organisation o ON o.id = m.org_id
  WHERE  (p_status = 'all'
          OR (p_status = 'sent'    AND m.sent_at IS NOT NULL)
          OR (p_status = 'failed'  AND m.failed_at IS NOT NULL)
          OR (p_status = 'waiting' AND m.sent_at IS NULL AND m.failed_at IS NULL))
    AND  (p_before IS NULL OR m.created_at < p_before)
  ORDER  BY m.created_at DESC
  LIMIT  p_limit;
END
$fn$;

-- A re-send is a new row copied from the failed one, so the first attempt
-- keeps its reason. A token mail then forgets its content, so one live copy
-- of the link exists.
CREATE OR REPLACE FUNCTION mail_resend(p_id uuid) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  m     mail_outbox%ROWTYPE;
  v_new uuid;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'mail_resend: operations only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO m FROM mail_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'mail_resend: no such mail' USING ERRCODE = 'no_data_found';
  END IF;
  IF m.failed_at IS NULL THEN
    RAISE EXCEPTION 'mail_resend: only a failed mail can be re-sent; this one is %',
      CASE WHEN m.sent_at IS NOT NULL THEN 'sent' ELSE 'still waiting' END;
  END IF;
  -- before the scrub test: a re-send scrubs its source, and "already re-sent"
  -- is the truer answer for that row
  IF EXISTS (SELECT 1 FROM mail_outbox c WHERE c.resent_from = m.id) THEN
    RAISE EXCEPTION 'mail_resend: this mail was already re-sent';
  END IF;
  IF m.scrubbed_at IS NOT NULL THEN
    RAISE EXCEPTION 'mail_resend: this mail carried a link that has since been retired; use Resend on the account itself';
  END IF;
  IF m.resend_until IS NOT NULL AND m.resend_until <= now() THEN
    RAISE EXCEPTION 'mail_resend: the link in this mail has expired; use Resend on the account itself';
  END IF;
  INSERT INTO mail_outbox (to_email, to_name, template, context, reply_to, org_id, entity_type, entity_id,
                           label, scrub_on_send, resend_until, resent_from)
  VALUES (m.to_email, m.to_name, m.template, m.context, m.reply_to, m.org_id, m.entity_type, m.entity_id,
          m.label, m.scrub_on_send, m.resend_until, m.id)
  RETURNING id INTO v_new;
  IF m.scrub_on_send THEN
    UPDATE mail_outbox SET context = '{}'::jsonb, scrubbed_at = now() WHERE id = m.id;
  END IF;
  RETURN v_new;
END
$fn$;

-- Retention: sent rows after p_sent_days, failed ones after p_failed_days.
-- Run by the clock once an hour. A purged source leaves resent_from NULL.
CREATE OR REPLACE FUNCTION mail_purge(p_sent_days int, p_failed_days int) RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_n int;
BEGIN
  DELETE FROM mail_outbox
  WHERE  (sent_at IS NOT NULL AND sent_at < now() - make_interval(days => p_sent_days))
     OR  (failed_at IS NOT NULL AND failed_at < now() - make_interval(days => p_failed_days));
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END
$fn$;

REVOKE EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[], text, uuid, text)                                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[])                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_enqueue_to(text, jsonb, citext, text, text, text, uuid, text, boolean, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_mark(uuid[], text)                                                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_pending(int)                                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_status(text, uuid)                                                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_stats()                                                                        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_log(text, int, timestamptz)                                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_resend(uuid)                                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_purge(int, int)                                                                FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[], text, uuid, text)                                 TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[])                                                   TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_enqueue_to(text, jsonb, citext, text, text, text, uuid, text, boolean, timestamptz) TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_mark(uuid[], text)                                                             TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_pending(int)                                                                   TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_status(text, uuid)                                                             TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_stats()                                                                        TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_log(text, int, timestamptz)                                                    TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_resend(uuid)                                                                   TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_purge(int, int)                                                                TO sourcehub_app;
"""

_SEED = """
INSERT INTO permission (code, module, description, requires_mfa) VALUES
  ('mail.read',   'audit', 'Read the platform mail log',       false),
  ('mail.resend', 'audit', 'Re-send a failed platform e-mail', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM   role r, permission p
WHERE  r.code = 'platform_admin' AND r.is_system AND p.code IN ('mail.read', 'mail.resend')
ON CONFLICT DO NOTHING;
"""

_DOWN = """
DO $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM mail_outbox WHERE sent_at IS NULL AND failed_at IS NULL) THEN
    RAISE EXCEPTION '0053 downgrade: mail is still waiting to be sent; stop the API and let the queue drain first';
  END IF;
END
$fn$;

DELETE FROM role_permission
WHERE  permission_id IN (SELECT id FROM permission WHERE code IN ('mail.read', 'mail.resend'));
DELETE FROM permission WHERE code IN ('mail.read', 'mail.resend');

DROP FUNCTION IF EXISTS mail_purge(int, int);
DROP FUNCTION IF EXISTS mail_resend(uuid);
DROP FUNCTION IF EXISTS mail_log(text, int, timestamptz);
DROP FUNCTION IF EXISTS mail_stats();
DROP FUNCTION IF EXISTS mail_status(text, uuid);
DROP FUNCTION IF EXISTS mail_enqueue_to(text, jsonb, citext, text, text, text, uuid, text, boolean, timestamptz);
DROP FUNCTION IF EXISTS mail_enqueue(text, jsonb, uuid[], text, uuid, text);
DROP FUNCTION IF EXISTS mail_pending(int);

-- the db/480 bodies, verbatim
CREATE OR REPLACE FUNCTION mail_enqueue(p_template text, p_context jsonb, p_org_ids uuid[])
RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_n int;
BEGIN
  INSERT INTO mail_outbox (to_email, to_name, template, context)
  SELECT r.email, r.full_name, p_template,
         p_context || jsonb_build_object('recipient_name', r.full_name,
                                         'recipient_org',  r.org_name)
  FROM   org_mail_recipients(p_org_ids) r;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END
$fn$;

CREATE OR REPLACE FUNCTION mail_pending(p_limit int)
RETURNS TABLE (id uuid, to_email citext, to_name text, template text, context jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
#variable_conflict use_column
BEGIN
  UPDATE mail_outbox m
     SET failed_at = now(), failure_reason = 'too old'
   WHERE m.sent_at IS NULL AND m.failed_at IS NULL
     AND m.created_at < now() - interval '48 hours';

  RETURN QUERY
  SELECT m.id, m.to_email, m.to_name, m.template, m.context
  FROM   mail_outbox m
  WHERE  m.sent_at IS NULL AND m.failed_at IS NULL
  ORDER  BY m.created_at
  LIMIT  p_limit;
END
$fn$;

CREATE OR REPLACE FUNCTION mail_mark(p_ids uuid[], p_reason text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  UPDATE mail_outbox
     SET sent_at        = CASE WHEN p_reason IS NULL THEN now() END,
         failed_at      = CASE WHEN p_reason IS NOT NULL THEN now() END,
         failure_reason = p_reason
   WHERE id = ANY (p_ids) AND sent_at IS NULL AND failed_at IS NULL
$fn$;

REVOKE EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[])    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_pending(int)                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_mark(uuid[], text)              FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[])    TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_pending(int)                    TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_mark(uuid[], text)              TO sourcehub_app;

DROP INDEX IF EXISTS mail_outbox_resent_idx;
DROP INDEX IF EXISTS mail_outbox_entity_idx;
DROP INDEX IF EXISTS mail_outbox_created_idx;
ALTER TABLE mail_outbox DROP CONSTRAINT IF EXISTS mail_outbox_entity_pair;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS resent_from;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS resend_until;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS scrubbed_at;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS scrub_on_send;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS reply_to;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS label;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS entity_id;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS entity_type;
ALTER TABLE mail_outbox DROP COLUMN IF EXISTS org_id;
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
    for stmt in _statements(_UP) + _statements(_SEED):
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
