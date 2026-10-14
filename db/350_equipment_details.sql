-- ============================================================================
-- 350 · Equipment details and attachments
--
-- Device sponsors can describe equipment beyond its stock count and calibration
-- dates, and can attach equipment files. Photos and documentation reuse the
-- generic attachment table: entity_type 'equipment', slot 'photos' or
-- 'documentation'.
--
-- Existing equipment rows stay valid: the descriptive columns are nullable and
-- specifications defaults to the empty object.
-- ============================================================================

ALTER TABLE equipment
  ADD COLUMN make text,
  ADD COLUMN model text,
  ADD COLUMN location text,
  ADD COLUMN specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT equipment_specifications_object
    CHECK (jsonb_typeof(specifications) = 'object');

ALTER TYPE attachment_entity ADD VALUE IF NOT EXISTS 'equipment';

CREATE OR REPLACE FUNCTION attachment_parent_visible(p_type attachment_entity, p_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $fn$
  SELECT CASE p_type
    WHEN 'request'   THEN EXISTS (SELECT 1 FROM request   WHERE id = p_id AND deleted_at IS NULL)
    WHEN 'proposal'  THEN EXISTS (SELECT 1 FROM proposal  WHERE id = p_id AND deleted_at IS NULL)
    WHEN 'task'      THEN EXISTS (SELECT 1 FROM task      WHERE id = p_id AND deleted_at IS NULL)
    WHEN 'qa_review' THEN EXISTS (SELECT 1 FROM qa_review WHERE id = p_id)
    WHEN 'equipment' THEN EXISTS (SELECT 1 FROM equipment WHERE id = p_id AND deleted_at IS NULL)
    ELSE false
  END
$fn$;

DROP FUNCTION attachment_folder(attachment_entity, uuid);

CREATE FUNCTION attachment_folder(p_type attachment_entity, p_id uuid)
RETURNS TABLE (client_name text, request_ref text, scope_ref text, scope_label text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT o.name, e.reference_code, NULL::text, NULL::text
  FROM   equipment e
  JOIN   organisation o ON o.id = e.sponsor_org_id
  WHERE  p_type = 'equipment'
    AND  e.id = p_id
    AND  e.deleted_at IS NULL

  UNION ALL

  SELECT o.name,
         r.reference_code,
         CASE p_type
           WHEN 'proposal'  THEN (SELECT p.reference_code FROM proposal p WHERE p.id = p_id)
           WHEN 'task'      THEN (SELECT t.reference_code FROM task t WHERE t.id = p_id)
           WHEN 'qa_review' THEN (SELECT t.reference_code FROM qa_review q
                                    JOIN submission s ON s.id = q.submission_id
                                    JOIN task t       ON t.id = s.task_id
                                   WHERE q.id = p_id)
         END,
         CASE p_type
           WHEN 'proposal'  THEN (SELECT po.reference_code || ' ' || po.name
                                    FROM proposal p
                                    JOIN organisation po ON po.id = p.partner_org_id
                                   WHERE p.id = p_id)
         END
  FROM   request r
  JOIN   organisation o ON o.id = r.client_org_id
  WHERE  p_type <> 'equipment'
    AND  r.id = CASE p_type
      WHEN 'request'   THEN p_id
      WHEN 'proposal'  THEN (SELECT p.request_id FROM proposal p WHERE p.id = p_id)
      WHEN 'task'      THEN (SELECT c.request_id FROM task t
                              JOIN contract c ON c.id = t.contract_id
                             WHERE t.id = p_id)
      WHEN 'qa_review' THEN (SELECT c.request_id FROM qa_review q
                              JOIN submission s ON s.id = q.submission_id
                              JOIN task t       ON t.id = s.task_id
                              JOIN contract c   ON c.id = t.contract_id
                             WHERE q.id = p_id)
    END
$fn$;

REVOKE EXECUTE ON FUNCTION attachment_folder(attachment_entity, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION attachment_folder(attachment_entity, uuid) TO sourcehub_app;
