-- ============================================================================
-- 430 · A quote request from the public page goes to the seller
--
-- Someone without an account asks for a quote on a published listing. The
-- seller prices and quotes, so the request (datahub_lead) is theirs: their
-- bell rings, they see the person's details, and they mark it contacted or
-- closed. Operations still read every request and change none.
--
--   datahub_lead_reply   what the seller wrote back from the console. The
--                        platform emails it, Reply-To the seller's own
--                        address, so the conversation carries on by email.
--                        One row per email sent; never changed.
--
-- Until now only Operations could read a lead, and only Operations were told.
-- ============================================================================

DROP POLICY datahub_lead_select ON datahub_lead;
DROP POLICY datahub_lead_update ON datahub_lead;

-- The seller reads and works the requests on its own listings; Ops read all.
CREATE POLICY datahub_lead_select ON datahub_lead FOR SELECT
  USING (is_platform_admin() OR datahub_dataset_owner(dataset_id) = current_org_id());
CREATE POLICY datahub_lead_update ON datahub_lead FOR UPDATE
  USING      (datahub_dataset_owner(dataset_id) = current_org_id())
  WITH CHECK (datahub_dataset_owner(dataset_id) = current_org_id());

-- The one write without a session. It answers only for a published listing,
-- and tells the listing's owner.
CREATE OR REPLACE FUNCTION datahub_lead_create(
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
  INSERT INTO datahub_lead (dataset_id, name, email, company, intended_use, message)
  VALUES (v_dataset, btrim(p_name), btrim(p_email), btrim(p_company), btrim(p_intended_use),
          nullif(btrim(coalesce(p_message, '')), ''))
  RETURNING id INTO v_id;
  -- The seller's bell. There is no session to notify from, so it is done here.
  INSERT INTO notification (org_id, body, link_page, link_params)
  VALUES (v_owner,
          'A quote request from ' || btrim(p_company) || ' for ' || v_title
            || ' came in through the public catalogue.',
          'catalogue_leads', jsonb_build_object('lead', v_id));
  RETURN v_id;
END
$fn$;

-- ---------------------------------------------------------------------------
-- The seller's replies, sent as email by the platform
-- ---------------------------------------------------------------------------
CREATE TABLE datahub_lead_reply (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid NOT NULL REFERENCES datahub_lead(id) ON DELETE RESTRICT,
  org_id        uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  sent_by       uuid NOT NULL REFERENCES app_user(id),
  sender_name   text NOT NULL,
  reply_to      citext NOT NULL,
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT datahub_lead_reply_body_shape CHECK (btrim(body) <> '' AND char_length(body) <= 10000)
);

CREATE INDEX datahub_lead_reply_lead_idx ON datahub_lead_reply (lead_id, created_at);

COMMENT ON TABLE datahub_lead_reply IS
  'A seller''s reply to a public quote request, emailed by the platform with Reply-To the seller';
COMMENT ON COLUMN datahub_lead_reply.reply_to IS
  'The seller''s address the email named as Reply-To: where the person''s answer goes';

CREATE RULE datahub_lead_reply_no_update AS ON UPDATE TO datahub_lead_reply DO INSTEAD NOTHING;
CREATE RULE datahub_lead_reply_no_delete AS ON DELETE TO datahub_lead_reply DO INSTEAD NOTHING;

ALTER TABLE datahub_lead_reply ENABLE ROW LEVEL SECURITY;

-- The seller writes and reads the replies on its own listings' requests; Ops read all.
CREATE POLICY datahub_lead_reply_select ON datahub_lead_reply FOR SELECT
  USING (is_platform_admin() OR org_id = current_org_id());
CREATE POLICY datahub_lead_reply_insert ON datahub_lead_reply FOR INSERT
  WITH CHECK (
        org_id  = current_org_id()
    AND sent_by = current_user_id()
    AND EXISTS (SELECT 1 FROM datahub_lead l
                 WHERE l.id = datahub_lead_reply.lead_id
                   AND l.status <> 'closed'
                   AND datahub_dataset_owner(l.dataset_id) = current_org_id())
  );
CREATE POLICY datahub_lead_reply_worker_deny ON datahub_lead_reply AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

REVOKE ALL ON datahub_lead_reply FROM sourcehub_app;
GRANT SELECT, INSERT ON datahub_lead_reply TO sourcehub_app;
GRANT SELECT ON datahub_lead_reply TO sourcehub_readonly;
