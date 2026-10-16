-- ============================================================================
-- 490 · Mail retry: a temporary refusal is tried again, a person comes first
--
-- Until now a mail the server refused was failed at once, whatever the reason.
-- A 4xx answer -- mailbox full, greylisting, "try again later" -- and Gmail's
-- daily sending limit are temporary: the same mail goes through minutes or an
-- hour later. From here the dispatcher (modules/outbox) defers such a row with
-- back-off instead of failing it, and fails it only when the tries run out or
-- no time is left before the row's link dies or it is two days old.
--
-- Two more rules for the queue, in the same pass:
--   * a person waiting for their mail comes first. Resets, invitations,
--     offers, reminders and replies are priority 0. The RFP mails to whole
--     organisations (a publish to every partner user, an award to the
--     winner's users) are priority 1, so a large publish never delays a reset.
--   * a mail whose link has died is never sent. A waiting row past its
--     resend_until is settled as 'link expired', through mail_mark, so an
--     offer recipient or reminder hears about it too.
--
-- WHAT A ROW NOW CARRIES:
--   attempts         how many times a temporary refusal deferred it
--   next_attempt_at  not before this; NULL means now
--   last_error       the latest temporary refusal; failure_reason keeps the
--                    final one, as before
--   priority         0 for a person waiting, 1 for a fan-out
-- ============================================================================

ALTER TABLE mail_outbox ADD COLUMN attempts smallint NOT NULL DEFAULT 0;
ALTER TABLE mail_outbox ADD COLUMN next_attempt_at timestamptz;
ALTER TABLE mail_outbox ADD COLUMN last_error text;
ALTER TABLE mail_outbox ADD COLUMN priority smallint NOT NULL DEFAULT 0;

COMMENT ON COLUMN mail_outbox.attempts IS
  'How many times a temporary refusal (4xx, a quota) deferred this mail; '
  'mail_defer() counts them, the dispatcher gives up after its last back-off step.';
COMMENT ON COLUMN mail_outbox.next_attempt_at IS
  'Not sent before this. NULL means as soon as the clock reaches it.';
COMMENT ON COLUMN mail_outbox.last_error IS
  'The latest temporary refusal while the mail is still being retried; '
  'failure_reason holds the final one once it fails.';
COMMENT ON COLUMN mail_outbox.priority IS
  '0: a person is waiting for this mail (reset, invitation, offer, reminder, '
  'reply). 1: a fan-out (the RFP mails). The dispatcher sends 0 first.';

-- The dispatcher's scan, in the order it now sends: replaces the db/470 index.
DROP INDEX mail_outbox_waiting_idx;
CREATE INDEX mail_outbox_due_idx ON mail_outbox (priority, created_at)
  WHERE sent_at IS NULL AND failed_at IS NULL;

-- ---------------------------------------------------------------------------
-- mail_enqueue -- the fan-out (db/480), now queued behind single mails.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mail_enqueue(p_template text, p_context jsonb, p_org_ids uuid[],
                                        p_entity_type text, p_entity_id uuid, p_label text)
RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_n int;
BEGIN
  INSERT INTO mail_outbox (to_email, to_name, template, context, org_id, entity_type, entity_id, label,
                           priority)
  SELECT r.email, r.full_name, p_template,
         p_context || jsonb_build_object('recipient_name', r.full_name,
                                         'recipient_org',  r.org_name),
         current_org_id(), p_entity_type, p_entity_id, coalesce(p_label, ''), 1
  FROM   org_mail_recipients(p_org_ids) r;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END
$fn$;

-- ---------------------------------------------------------------------------
-- mail_pending -- the rows to send now: a person's mail first, then the
-- oldest, never one deferred to later. Before answering it settles what will
-- never go, through mail_mark so the subject row hears about it:
--   'too old'        waiting for more than two days, with the last refusal
--                    if a retry was in progress
--   'link expired'   its resend_until has passed: the link inside is dead,
--                    with the last refusal if a retry was in progress
-- The return type gains attempts, so this is a DROP and a CREATE.
-- ---------------------------------------------------------------------------
DROP FUNCTION mail_pending(int);

CREATE OR REPLACE FUNCTION mail_pending(p_limit int)
RETURNS TABLE (id uuid, to_email citext, to_name text, template text, context jsonb, reply_to text,
               attempts smallint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
#variable_conflict use_column
DECLARE
  v_old record;
BEGIN
  FOR v_old IN
    SELECT m.id, m.last_error
    FROM   mail_outbox m
    WHERE  m.sent_at IS NULL AND m.failed_at IS NULL
      AND  m.created_at < now() - interval '48 hours'
  LOOP
    PERFORM mail_mark(ARRAY[v_old.id],
                      CASE WHEN v_old.last_error IS NULL THEN 'too old'
                           ELSE 'too old; last error: ' || v_old.last_error END);
  END LOOP;

  FOR v_old IN
    SELECT m.id, m.last_error
    FROM   mail_outbox m
    WHERE  m.sent_at IS NULL AND m.failed_at IS NULL
      AND  m.resend_until IS NOT NULL AND m.resend_until <= now()
  LOOP
    PERFORM mail_mark(ARRAY[v_old.id],
                      CASE WHEN v_old.last_error IS NULL THEN 'link expired'
                           ELSE 'link expired; last error: ' || v_old.last_error END);
  END LOOP;

  RETURN QUERY
  SELECT m.id, m.to_email, m.to_name, m.template, m.context, m.reply_to, m.attempts
  FROM   mail_outbox m
  WHERE  m.sent_at IS NULL AND m.failed_at IS NULL
    AND  (m.next_attempt_at IS NULL OR m.next_attempt_at <= now())
  ORDER  BY m.priority, m.created_at
  LIMIT  p_limit;
END
$fn$;

-- ---------------------------------------------------------------------------
-- mail_defer -- a temporary refusal: try again after p_after. A row that
-- would be retried past its two days or past the life of its link fails now
-- instead, with the refusal and the reason it was not retried.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mail_defer(p_ids uuid[], p_error text, p_after interval) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_late uuid[];
BEGIN
  SELECT array_agg(m.id) INTO v_late
  FROM   mail_outbox m
  WHERE  m.id = ANY (p_ids) AND m.sent_at IS NULL AND m.failed_at IS NULL
    AND  (now() + p_after > m.created_at + interval '48 hours'
          OR (m.resend_until IS NOT NULL AND now() + p_after > m.resend_until));
  IF v_late IS NOT NULL THEN
    PERFORM mail_mark(v_late, p_error || '; no time left to retry');
  END IF;

  UPDATE mail_outbox m
     SET attempts        = m.attempts + 1,
         next_attempt_at = now() + p_after,
         last_error      = p_error
   WHERE m.id = ANY (p_ids) AND m.sent_at IS NULL AND m.failed_at IS NULL;
END
$fn$;

-- ---------------------------------------------------------------------------
-- The Ops screen, with the retries in it.
-- ---------------------------------------------------------------------------

-- Today (UTC) and the last seven days; 'retrying' counts the waiting rows a
-- temporary refusal has deferred at least once.
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
           'retrying',     count(*) FILTER (WHERE m.sent_at IS NULL AND m.failed_at IS NULL
                                              AND m.attempts > 0),
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
-- ('waiting' includes the retries). state is 'retrying' for a waiting row a
-- temporary refusal has deferred; attempts, next_attempt_at and last_error say
-- how far it has got. The return type changed, so this is a DROP and a CREATE.
DROP FUNCTION mail_log(text, int, timestamptz);

CREATE OR REPLACE FUNCTION mail_log(p_status text, p_limit int, p_before timestamptz)
RETURNS TABLE (id uuid, created_at timestamptz, to_email citext, to_name text, template text, label text,
               entity_type text, entity_id uuid, org_name text, state text, sent_at timestamptz,
               failed_at timestamptz, failure_reason text, resent_from uuid, resent_to uuid,
               can_resend boolean, attempts smallint, next_attempt_at timestamptz, last_error text)
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
              WHEN m.attempts > 0 THEN 'retrying'
              ELSE 'queued' END,
         m.sent_at, m.failed_at, m.failure_reason, m.resent_from,
         (SELECT c.id FROM mail_outbox c WHERE c.resent_from = m.id ORDER BY c.created_at DESC LIMIT 1),
         (m.failed_at IS NOT NULL
          AND m.scrubbed_at IS NULL
          AND (m.resend_until IS NULL OR m.resend_until > now())
          AND NOT EXISTS (SELECT 1 FROM mail_outbox c WHERE c.resent_from = m.id)),
         m.attempts, m.next_attempt_at, m.last_error
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

-- A re-send (db/480) now keeps the source's priority and starts its own count
-- of tries from nothing.
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
                           label, scrub_on_send, resend_until, resent_from, priority)
  VALUES (m.to_email, m.to_name, m.template, m.context, m.reply_to, m.org_id, m.entity_type, m.entity_id,
          m.label, m.scrub_on_send, m.resend_until, m.id, m.priority)
  RETURNING id INTO v_new;
  IF m.scrub_on_send THEN
    UPDATE mail_outbox SET context = '{}'::jsonb, scrubbed_at = now() WHERE id = m.id;
  END IF;
  RETURN v_new;
END
$fn$;

REVOKE EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[], text, uuid, text)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_pending(int)                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_defer(uuid[], text, interval)                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_stats()                                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_log(text, int, timestamptz)                     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_resend(uuid)                                    FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[], text, uuid, text)  TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_pending(int)                                    TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_defer(uuid[], text, interval)                   TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_stats()                                         TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_log(text, int, timestamptz)                     TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_resend(uuid)                                    TO sourcehub_app;
