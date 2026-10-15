-- ============================================================================
-- 460 · The data marketplace is called DataHub
--
-- What people read named it three ways: Datasets, the dataset catalogue, the
-- public catalogue. It is DataHub now, on every screen and in every message.
-- Here that is two things: the bell a public quote request rings for the
-- seller, and the descriptions of two capabilities. The capability codes
-- (catalogue.*) and every table and function name stay as they are.
-- ============================================================================

-- The one write without a session, as db/440 made it; only the bell's words differ.
CREATE OR REPLACE FUNCTION datahub_public_request_create(
  p_slug text, p_name text, p_email text, p_company text, p_intended_use text, p_message text
) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_dataset uuid;
  v_owner   uuid;
  v_title   text;
  v_id      uuid;
BEGIN
  SELECT id, owner_org_id, title INTO v_dataset, v_owner, v_title
  FROM   datahub_dataset WHERE slug = p_slug AND status = 'published';
  IF v_dataset IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO datahub_dataset_deal (dataset_id, seller_org_id, channel, contact_name, contact_email,
                                    contact_company, intended_use, message)
  VALUES (v_dataset, v_owner, 'public', btrim(p_name), btrim(p_email), btrim(p_company),
          btrim(p_intended_use), nullif(btrim(coalesce(p_message, '')), ''))
  RETURNING id INTO v_id;
  -- The seller's bell. There is no session to notify from, so it is done here.
  INSERT INTO notification (org_id, body, link_page, link_params)
  VALUES (v_owner,
          'A quote request from ' || btrim(p_company) || ' for ' || v_title
            || ' came in through the DataHub public page.',
          'catalogue_deal', jsonb_build_object('id', v_id));
  RETURN v_id;
END
$fn$;

UPDATE permission SET description = 'List own datasets in DataHub'
WHERE  code = 'catalogue.list';
UPDATE permission SET description = 'Publish or reject DataHub listings'
WHERE  code = 'catalogue.review';
