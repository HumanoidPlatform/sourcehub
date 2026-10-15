-- ============================================================================
-- 410 · Whose name the catalogue may show
--
-- A delivery partner now buys from the catalogue as well as selling in it,
-- and organisation's policies never let one partner see another: neither
-- the seller's name on a listing nor the buyer's on a deal. Joining
-- organisation hid a published listing from every other partner outright.
--
-- This answers with the name only, never the row, and only when the
-- catalogue gives a reason to know it:
--   * the organisation sells a listing that is on sale
--   * the two are buyer and seller on a deal or a licence
--   * it is the caller's own organisation, or the caller is operations
-- Anything else is NULL, as a LEFT JOIN on a hidden row was.
-- ============================================================================

CREATE OR REPLACE FUNCTION datahub_org_name(p_org_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT o.name
  FROM   organisation o
  WHERE  o.id = p_org_id
    AND  current_org_id() IS NOT NULL
    AND  (   o.id = current_org_id()
          OR is_platform_admin()
          OR EXISTS (SELECT 1 FROM datahub_dataset d
                      WHERE d.owner_org_id = o.id AND d.status = 'published')
          OR EXISTS (SELECT 1 FROM datahub_dataset_deal k
                      WHERE (k.buyer_org_id = o.id AND k.seller_org_id = current_org_id())
                         OR (k.seller_org_id = o.id AND k.buyer_org_id = current_org_id()))
          OR EXISTS (SELECT 1 FROM datahub_dataset_licence l
                      WHERE (l.buyer_org_id = o.id AND l.seller_org_id = current_org_id())
                         OR (l.seller_org_id = o.id AND l.buyer_org_id = current_org_id())))
$fn$;

REVOKE EXECUTE ON FUNCTION datahub_org_name(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION datahub_org_name(uuid) TO sourcehub_app;
