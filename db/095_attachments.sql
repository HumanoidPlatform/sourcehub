-- ============================================================================
-- 095 · Attachments — files hung off a field, wherever one is useful
--
-- Before this, exactly one field in the product could take a file: a request's
-- sample data, with its own table, its own presign route and its own
-- attach-on-save path. Every other place a person would reach for a document —
-- the compliance notes a DPA belongs to, the method statement behind a bid,
-- the shot list a task refers to, the evidence under a QA rejection — was free
-- text and nothing else.
--
-- One table rather than four. The alternative was request_sample copied per
-- feature, which is four sets of policies to keep in step and four presign
-- routes that drift.
--
-- entity_id is deliberately NOT a foreign key. A polymorphic parent cannot be,
-- and adding four nullable columns with four FKs to say the same thing buys
-- nothing: the parent's own RLS is what decides visibility here, through
-- attachment_parent_visible() below.
--
-- request_sample stays where it is. It is not the same thing — samples are the
-- brief's reference material, shown in their own panel and downloadable by
-- every bidder — and migrating a working table to prove a point is not worth
-- the risk. This is for attachments that belong to a FIELD.
-- ============================================================================

CREATE TYPE attachment_entity AS ENUM
  ('request','proposal','task','qa_review');

CREATE TABLE attachment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  entity_type   attachment_entity NOT NULL,
  entity_id     uuid NOT NULL,
  -- Which field on that entity. A request carries attachments on both its
  -- compliance notes and its acceptance criteria, so the parent id alone
  -- cannot say where a file belongs.
  slot          text NOT NULL,

  -- The uploader's organisation. Also what makes an orphan cleanable: a file
  -- is presigned before its parent row exists, exactly as samples are.
  owner_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  filename      text NOT NULL,
  storage_key   text NOT NULL UNIQUE,        -- object storage key, never bytes
  content_type  text,
  size_bytes    bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),

  uploaded_by   uuid REFERENCES app_user(id),
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,

  CONSTRAINT attachment_slot_shape CHECK (slot ~ '^[a-z][a-z0-9_]{0,39}$')
);

CREATE INDEX attachment_entity_idx ON attachment (entity_type, entity_id)
  WHERE deleted_at IS NULL;
CREATE INDEX attachment_owner_idx  ON attachment (owner_org_id)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Who may see an attachment: exactly whoever may see the thing it hangs off.
--
-- SECURITY INVOKER on purpose, like invite_worker. Under invoker rights each
-- inner SELECT is filtered by that table's own policies, so this returns true
-- only when the caller can genuinely see the parent row — the whole visibility
-- rule, without restating any of it here. A definer function would bypass the
-- very policies that make the answer correct.
--
-- No recursion risk: none of the parent tables' policies reference attachment.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION attachment_parent_visible(p_type attachment_entity, p_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $fn$
  SELECT CASE p_type
    WHEN 'request'   THEN EXISTS (SELECT 1 FROM request   WHERE id = p_id AND deleted_at IS NULL)
    WHEN 'proposal'  THEN EXISTS (SELECT 1 FROM proposal  WHERE id = p_id AND deleted_at IS NULL)
    WHEN 'task'      THEN EXISTS (SELECT 1 FROM task      WHERE id = p_id AND deleted_at IS NULL)
    WHEN 'qa_review' THEN EXISTS (SELECT 1 FROM qa_review WHERE id = p_id)
    ELSE false
  END
$fn$;
