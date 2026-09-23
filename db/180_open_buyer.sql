-- ============================================================================
-- 180 · A published request names its buyer
--
-- Fix 9 (db/110_auth_functions.sql) made the client visible to the partner
-- that bids to it, and said why in its own words: "A partner comparing
-- opportunities has the same need in reverse — who is buying, in what
-- industry, since when — and the console cannot show it while the client's
-- row is invisible."
--
-- It then granted that visibility only AFTER a proposal exists. So the need it
-- describes — comparing opportunities — was the one case still unserved: the
-- brief a partner reads while deciding whether to bid carried an opaque
-- client_org_id and no name, and the only organisation named anywhere on the
-- page was the partner's own. A bidder had to commit a bid to learn who they
-- had bid to.
--
-- This finishes Fix 9 rather than extending it. The audience is unchanged —
-- current_org_kind() = 'tenant' is the same clause request_select already uses
-- to open a published request to the market, so nobody learns of a buyer whose
-- request they could not already read in full.
--
-- SCOPE, deliberately narrow:
--   * Only while the request is open. Awarded or cancelled, the policy stops
--     matching. A partner that actually bid keeps its view through Fix 9,
--     because having bid is the durable fact; a partner that only browsed
--     loses it, because browsing is not.
--   * Identity only. _may_see_commercials (modules/identity/service.py) still
--     strips billing_status, suspension and the client's plan and DPA terms
--     from a counterparty, so this discloses who is buying and never how they
--     are billed for it.
--
-- THE COST, stated as Fix 9 stated its own: a partner can now enumerate the
-- buyers with open requests by reading the opportunities board. That board is
-- already open to every tenant, so what is newly disclosed is the name against
-- a request, not the existence of the request. If it becomes a problem the
-- answer is the same one Fix 9 gave — rate-limiting or reputation, not
-- re-hiding the row, because the console would go dark with it.
-- ============================================================================

-- SECURITY DEFINER for the same reason every helper in db/110 is: a policy on
-- organisation cannot ask organisation about itself without recursing, and the
-- question is about `request`, which the caller may not read for every client.
-- It answers one boolean about one organisation and cannot enumerate anything.
CREATE OR REPLACE FUNCTION org_with_open_request(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM request
    WHERE  client_org_id = p_org_id
      AND  status IN ('published', 'proposals_received')
      AND  deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION org_with_open_request(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_with_open_request(uuid) TO sourcehub_app, sourcehub_readonly;

-- Permissive, so it ORs with the existing set and takes nothing away. The
-- org_kind test mirrors request_select: the people who may already read the
-- request are exactly the people who may now see whose it is.
CREATE POLICY organisation_select_open_buyers ON organisation FOR SELECT
  USING (current_org_kind() = 'tenant' AND org_with_open_request(id));

CREATE POLICY client_profile_select_open_buyers ON client_profile FOR SELECT
  USING (current_org_kind() = 'tenant' AND org_with_open_request(org_id));
