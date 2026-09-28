-- ============================================================================
-- 240 · The bidding window: closes on a deadline, changeable until the award
--
-- request.proposals_close_at has been a column since 040_marketplace, with a
-- CHECK that it falls on or before the delivery date and an index "for the
-- sweep for requests whose bidding window has closed". Nothing ever set it,
-- showed it, compared it with the clock or swept it: a partner could bid on a
-- request whose window had closed, and a client could not move the window at
-- all, because a published request cannot be edited.
--
-- What changes here is deliberately small, because "closed" is NOT a stored
-- state. It is derived from the time, the way task offers derive 'expired'
-- from respond_by (db/130). The stored status stays 'published', so every
-- policy that keys on it — request_select's open marketplace, the open-buyer
-- visibility in 180, the bidder's continued view in 110 — is untouched. What
-- moves is what the service accepts (no bid, withdrawal or resubmission after
-- the deadline) and what the console says.
--
--   * bidding_reminder_sent_at: the sweep's stamp for the "closes in 24 hours"
--     notice, so a second pass over the same window sends nothing.
--   * closed_at, a column 040 created and nothing wrote, now records when the
--     sweep noticed the window had closed and told the client and bidders.
--     NULL again when the client moves the deadline later, which reopens
--     bidding and lets the sweep notice the next close.
--   * active_tenant_ids(): every active delivery partner, as ids. The publish
--     announcement used to find them with a plain SELECT on organisation
--     under the CLIENT's own policies, which show a client only the partners
--     it already has a bid or contract from — so a client's first request was
--     announced to nobody. A definer function returning ids alone is the same
--     instrument engagement_orgs() (170) uses, and discloses nothing else.
--   * bidding_sweep_orgs(): which CLIENTS have a window due within a day. The
--     pass calls this with no org context and then opens one session per
--     client, under which it may update that client's own requests
--     (request_update) and notify anyone (notification_insert).
--
-- Additive: one nullable column and two functions. Nothing is backfilled — a
-- request published before deadlines existed has none, and none means open
-- until awarded, exactly as it was.
-- ============================================================================

ALTER TABLE request ADD COLUMN bidding_reminder_sent_at timestamptz;

COMMENT ON COLUMN request.closed_at IS
  'When the bidding sweep recorded that proposals_close_at had passed and '
  'notified the client and bidders; NULL again if the client moves the deadline later.';
COMMENT ON COLUMN request.bidding_reminder_sent_at IS
  'When the bidding sweep sent the closes-in-24-hours notice; '
  'NULL again if the client moves the deadline more than a day out.';

-- ---------------------------------------------------------------------------
-- Every active delivery partner, for announcements a client makes to the
-- whole market. Ids only. STABLE: no writes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION active_tenant_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT id FROM organisation
  WHERE  kind = 'tenant' AND status = 'active' AND deleted_at IS NULL
$fn$;

REVOKE EXECUTE ON FUNCTION active_tenant_ids() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION active_tenant_ids() TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- Which clients have a bidding window the sweep should look at: due within a
-- day and not yet reminded about, or past and not yet closed. The pass opens
-- one session per client returned and reads the requests there, under that
-- client's own policies. Ids only. STABLE: no writes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bidding_sweep_orgs() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT DISTINCT client_org_id FROM request
  WHERE  status = 'published' AND deleted_at IS NULL
    AND  proposals_close_at IS NOT NULL
    AND  proposals_close_at <= now() + interval '24 hours'
    AND  (closed_at IS NULL OR bidding_reminder_sent_at IS NULL)
$fn$;

REVOKE EXECUTE ON FUNCTION bidding_sweep_orgs() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION bidding_sweep_orgs() TO sourcehub_app;
