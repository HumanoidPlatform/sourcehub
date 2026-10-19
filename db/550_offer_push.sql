-- ============================================================================
-- 550 · Offers and reminders reach the crowd by push, not by e-mail
--
-- An offer, its reminders and every assignment reminder used to be mailed to
-- the worker as well as written to their bell. They are now the bell and the
-- push alone (modules/delivery create_offer, modules/engage _send): the mail
-- quota is kept for the people who have no app to be reached on. That makes
-- the push the only way an offer reaches a worker, so two things change.
--
-- 1. push_pending keeps an OPEN offer's bell row waiting instead of giving up.
--    It used to settle every row after an hour ('too old') and at once for a
--    worker with no phone ('no push token'). An offer stays open for days: a
--    push held back by an Expo outage, or by a worker who installs the app on
--    the second day, must still go while the offer can be answered. The row is
--    pushed the first pass after a token exists; once the offer closes, fills
--    or passes respond_by, the old rules settle it. Read in the bell first
--    still means no push.
--
-- 2. The aggregator can see what reached whom. Its session cannot read a
--    worker's bell rows (notification_select: user_id = current_user_id()) nor
--    is a push token anything it should hold, so two SECURITY DEFINER reads
--    answer only what the console shows, only for the caller's own
--    organisation:
--      offer_notices(recipient_ids)  per recipient of the caller's offers:
--                                    whether the worker has a phone
--                                    registered, and the latest offer notice's
--                                    push outcome and when it was seen
--      worker_app_connected(user_ids) per worker of the caller's roster:
--                                    whether a phone is registered
--    Neither returns a token.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- push_pending — the rows to push now, oldest first (db/300, revised).
--
-- Settled before answering, so they leave the waiting index:
--   'too old'        waiting for more than an hour, unless it announces an
--                    offer that is still open
--   'already read'   the worker saw it in the bell first
--   'no push token'  the user has no phone registered, unless it announces an
--                    offer that is still open: that row waits for a phone
--
-- The offer is found through the notified worker (task_offer_recipient_worker_idx),
-- then by the link id compared as text: never cast, so a bell row whose id is
-- not a uuid cannot fail the pass, and never a scan of every recipient per tick
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION push_pending(p_limit int)
RETURNS TABLE (id uuid, token text, body text, link_page text, link_params jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
#variable_conflict use_column
BEGIN
  UPDATE notification n
     SET failed_at = now(),
         failure_reason = CASE
           WHEN n.read_at IS NOT NULL THEN 'already read'
           WHEN n.created_at < now() - interval '1 hour' THEN 'too old'
           ELSE 'no push token' END
   WHERE n.user_id IS NOT NULL AND n.sent_at IS NULL AND n.failed_at IS NULL
     AND (n.read_at IS NOT NULL
          OR (NOT (n.link_page = 'offer' AND EXISTS (
                     SELECT 1 FROM task_offer_recipient r
                     JOIN   task_offer o ON o.id = r.offer_id
                     WHERE  r.worker_user_id = n.user_id
                       AND  r.id::text = n.link_params->>'id'
                       AND  o.status = 'open' AND o.respond_by > now()
                       AND  r.response IS NULL))
              AND (n.created_at < now() - interval '1 hour'
                   OR NOT EXISTS (SELECT 1 FROM app_user u
                                  WHERE u.id = n.user_id AND u.push_token IS NOT NULL))));

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

-- ---------------------------------------------------------------------------
-- offer_notices — what the offer's recipients were told, for the offering
-- supplier (and Ops). One row per recipient the caller may see:
--   app_connected   the worker has a phone registered right now
--   notices         bell rows announcing this offer to them (first + reminders)
--   last_notice_at  when the latest was written
--   pushed_at       when Expo took the latest, if it did
--   push_failure    why the latest was not pushed, if it was settled unsent
--   seen_at         when they first read one in the app, or tapped its push
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION offer_notices(p_recipient_ids uuid[])
RETURNS TABLE (recipient_id uuid, app_connected boolean, notices int,
               last_notice_at timestamptz, pushed_at timestamptz,
               push_failure text, seen_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id,
         u.push_token IS NOT NULL,
         (SELECT count(*)::int FROM notification n
           WHERE n.user_id = r.worker_user_id AND n.link_page = 'offer'
             AND n.link_params->>'id' = r.id::text),
         l.created_at, l.sent_at, l.failure_reason,
         (SELECT min(n.read_at) FROM notification n
           WHERE n.user_id = r.worker_user_id AND n.link_page = 'offer'
             AND n.link_params->>'id' = r.id::text)
  FROM   task_offer_recipient r
  JOIN   task_offer o ON o.id = r.offer_id
  JOIN   app_user u ON u.id = r.worker_user_id
  LEFT JOIN LATERAL (
         SELECT n.created_at, n.sent_at, n.failure_reason
         FROM   notification n
         WHERE  n.user_id = r.worker_user_id AND n.link_page = 'offer'
           AND  n.link_params->>'id' = r.id::text
         ORDER  BY n.created_at DESC
         LIMIT  1) l ON true
  WHERE  r.id = ANY (p_recipient_ids)
    AND  (o.supplier_org_id = current_org_id() OR is_platform_admin())
$fn$;

-- ---------------------------------------------------------------------------
-- worker_app_connected — which of the caller's crowd can be reached by push.
-- Only users holding a live worker grant in the caller's organisation.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION worker_app_connected(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, app_connected boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT u.id, u.push_token IS NOT NULL
  FROM   app_user u
  WHERE  u.id = ANY (p_user_ids)
    AND  (is_platform_admin() OR EXISTS (
           SELECT 1 FROM user_role_grant g JOIN role rl ON rl.id = g.role_id
           WHERE  g.user_id = u.id AND g.org_id = current_org_id()
             AND  rl.code = 'worker' AND g.revoked_at IS NULL))
$fn$;

REVOKE EXECUTE ON FUNCTION offer_notices(uuid[])        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION worker_app_connected(uuid[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION offer_notices(uuid[])        TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION worker_app_connected(uuid[]) TO sourcehub_app;
