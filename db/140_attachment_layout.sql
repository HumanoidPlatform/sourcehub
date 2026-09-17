-- ============================================================================
-- 140 · Attachment layout — a grouped tree, self-describing names, versions
--
-- Platform files were filed as {client}/{RFP}/{slot}/{original filename}. That
-- reads well at the top and stops being systematic inside an RFP: two tasks'
-- instructions shared one folder, every bidder's method statement shared
-- another, the same "Laptop_Purchase_Sheet (1).docx" was the brief and the DPA
-- and the acceptance criteria, and a re-upload got a random suffix that said
-- nothing about order.
--
-- The layout is now grouped by who and what
--
--   {client}/{RFP}/request/{slot}/
--   {client}/{RFP}/proposals/{PRO-ref TN-ref Partner}/{slot}/
--   {client}/{RFP}/tasks/{TSK-ref}/{slot}/
--   {client}/{RFP}/qa/{TSK-ref}/{slot}/
--
-- and a stored file is named
--
--   {RFP}[_{scope}]_{slot}_{nn}_v{k}_{original name}
--
-- where nn numbers the DOCUMENTS in a slot and k the VERSIONS of one document.
-- The same original filename uploaded again into the same parent and slot is
-- the next version; a different filename is the next document. Every version
-- is kept: what a partner priced against has to stay provable after award.
--
-- Written migration-safe (nullable add, backfill, SET NOT NULL) so the verbatim
-- Alembic copy in 0013 works on a table already holding rows.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1 · Document and version numbers
--
-- Backfill: a document is a distinct filename (case-insensitive) within one
-- parent and slot, numbered by when it first appeared. Its versions are
-- numbered by upload time. Soft-deleted rows are numbered too, because a
-- number, once used, is never handed out again.
-- ---------------------------------------------------------------------------
ALTER TABLE attachment
  ADD COLUMN doc_no  smallint,
  ADD COLUMN version smallint;

WITH firsts AS (
  SELECT entity_type, entity_id, slot, lower(filename) AS fname, min(uploaded_at) AS first_at
  FROM   attachment
  GROUP  BY entity_type, entity_id, slot, lower(filename)
), docs AS (
  SELECT f.entity_type, f.entity_id, f.slot, f.fname,
         dense_rank() OVER (PARTITION BY f.entity_type, f.entity_id, f.slot
                            ORDER BY f.first_at, f.fname) AS doc_no
  FROM   firsts f
), numbered AS (
  SELECT a.id, d.doc_no,
         row_number() OVER (PARTITION BY a.entity_type, a.entity_id, a.slot, lower(a.filename)
                            ORDER BY a.uploaded_at, a.id) AS version
  FROM   attachment a
  JOIN   docs d ON d.entity_type = a.entity_type AND d.entity_id = a.entity_id
               AND d.slot = a.slot AND d.fname = lower(a.filename)
)
UPDATE attachment a
   SET doc_no = n.doc_no, version = n.version
  FROM numbered n
 WHERE n.id = a.id;

ALTER TABLE attachment
  ALTER COLUMN doc_no  SET NOT NULL,
  ALTER COLUMN version SET NOT NULL,
  ADD CONSTRAINT attachment_doc_no_check  CHECK (doc_no  > 0),
  ADD CONSTRAINT attachment_version_check CHECK (version > 0);

-- Deliberately NOT partial on deleted_at: a removed v2 is followed by v3, never
-- by a second v2, so the numbers stay unique across live and removed rows.
-- Also the backstop behind the advisory lock attach() takes per parent+slot.
CREATE UNIQUE INDEX attachment_doc_version_key
  ON attachment (entity_type, entity_id, slot, doc_no, version);


-- ---------------------------------------------------------------------------
-- 2 · attachment_folder() also says WHICH bid or task a file belongs to
--
-- scope_ref is what goes in the file name: NULL for the client's own request
-- documents, the proposal's reference for a bid, the task's reference for task
-- instructions and for QA evidence. scope_label is only set for a proposal and
-- names the bidder, so the folder reads "PRO-03 TN-01 NorthStar Delivery
-- Partners" rather than a bare code.
--
-- DROP then CREATE, not CREATE OR REPLACE: Postgres refuses to change a
-- function's OUT columns in place, and a fresh function starts with default
-- privileges, so the REVOKE and GRANT are restated rather than assumed.
-- Still SECURITY DEFINER for the reason given in 110: the party attaching is
-- often not the client whose name is on the folder.
-- ---------------------------------------------------------------------------
DROP FUNCTION attachment_folder(attachment_entity, uuid);

CREATE FUNCTION attachment_folder(p_type attachment_entity, p_id uuid)
RETURNS TABLE (client_name text, request_ref text, scope_ref text, scope_label text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
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
  WHERE  r.id = CASE p_type
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
