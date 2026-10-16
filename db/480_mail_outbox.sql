-- ============================================================================
-- 480 · Mail outbox: platform e-mail that must not wait on a request
--
-- Publishing an RFP tells every active delivery partner; awarding one tells
-- the winner. From here each of those is an e-mail to every active user of
-- those organisations as well as a bell row (db/090). A request cannot wait
-- on N partners x M users of SMTP, and a mail for a decision that rolls back
-- must never leave, so the rows are written HERE, in the deciding
-- transaction, and sent afterwards by a clock (modules/outbox) -- exactly as
-- push (db/300) does for phones.
--
-- WHO WRITES WHAT:
--   * The deciding transaction calls mail_enqueue(), SECURITY DEFINER, which
--     expands the organisations to their recipients itself. user_role_grant
--     and app_user hide other organisations' users from a client's session,
--     as they should, so the list never passes through Python.
--   * The dispatcher runs with no organisation, like push. mail_pending() and
--     mail_mark() are its cross-organisation read and write.
--   * No policy on the table: it holds other organisations' addresses, and
--     the API login reaches it only through the functions below.
--
-- Rendering is the API's: `template` names a pair of files in
-- platform/mail/templates/ and `context` is what they are rendered with; the
-- recipient's own name and organisation are added to it on enqueue.
-- ============================================================================

CREATE TABLE mail_outbox (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email       citext NOT NULL,
  to_name        text NOT NULL,
  template       text NOT NULL,
  context        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  sent_at        timestamptz,
  failed_at      timestamptz,
  failure_reason text,
  CHECK (sent_at IS NULL OR failed_at IS NULL)
);

COMMENT ON TABLE mail_outbox IS
  'One platform e-mail waiting to be sent, written in the transaction that '
  'decided to send it; modules/outbox renders `template` with `context` and '
  'sends. sent_at, or failed_at with a reason, settles the row.';

-- The dispatcher's scan: not yet sent, not yet given up on.
CREATE INDEX mail_outbox_waiting_idx ON mail_outbox (created_at)
  WHERE sent_at IS NULL AND failed_at IS NULL;

-- No policies, on purpose: see the header.
ALTER TABLE mail_outbox ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- org_mail_recipients -- every active user of the given organisations.
--
-- Through a live grant (user_role_grant.revoked_at IS NULL) on an active,
-- undeleted organisation, to an active, undeleted user. Crowd workers hold
-- roles with applies_to_kind NULL and are never mailed here: these mails are
-- about an organisation's business, and a worker's business is their task.
-- One row per address: a person in two of the organisations hears once.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION org_mail_recipients(p_org_ids uuid[])
RETURNS TABLE (org_id uuid, org_name text, user_id uuid, email citext, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT DISTINCT ON (u.email) g.org_id, o.name, u.id, u.email, u.full_name
  FROM   user_role_grant g
  JOIN   app_user     u ON u.id = g.user_id
  JOIN   role         r ON r.id = g.role_id
  JOIN   organisation o ON o.id = g.org_id
  WHERE  g.org_id = ANY (p_org_ids)
    AND  g.revoked_at IS NULL
    AND  u.status = 'active' AND u.deleted_at IS NULL
    AND  o.status = 'active' AND o.deleted_at IS NULL
    AND  r.applies_to_kind IS NOT NULL
  ORDER  BY u.email, g.granted_at
$fn$;

-- ---------------------------------------------------------------------------
-- mail_enqueue -- one row per recipient of the given organisations, in the
-- caller's transaction. The recipient's name and organisation join the
-- context so the template can greet them. Returns how many rows were written.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- mail_pending -- the rows to send now, oldest first.
--
-- Before answering it settles the rows that will never go, so they leave the
-- waiting index:
--   'too old'   waiting for more than two days. After an outage the bell
--               still has the news; a two-day-old "new RFP" mail would only
--               confuse. This also covers anything stranded by a long stop.
-- ---------------------------------------------------------------------------
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

-- p_reason NULL: sent. Otherwise: failed, for that reason. Only rows still
-- waiting are touched, so a pass that overlaps another cannot overwrite it.
CREATE OR REPLACE FUNCTION mail_mark(p_ids uuid[], p_reason text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  UPDATE mail_outbox
     SET sent_at        = CASE WHEN p_reason IS NULL THEN now() END,
         failed_at      = CASE WHEN p_reason IS NOT NULL THEN now() END,
         failure_reason = p_reason
   WHERE id = ANY (p_ids) AND sent_at IS NULL AND failed_at IS NULL
$fn$;

REVOKE EXECUTE ON FUNCTION org_mail_recipients(uuid[])          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[])    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_pending(int)                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mail_mark(uuid[], text)              FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_mail_recipients(uuid[])          TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_enqueue(text, jsonb, uuid[])    TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_pending(int)                    TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION mail_mark(uuid[], text)              TO sourcehub_app;
