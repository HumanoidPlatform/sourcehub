"""Equipment details and attachments.

Adds the persisted descriptive fields the equipment API reads, and lets the
existing attachment table link files to equipment with entity_type 'equipment'.

Revision ID: 0038
Revises: 0037
"""

from alembic import op

revision = "0038"
down_revision = "0037"
branch_labels = None
depends_on = None


_UP_COLUMNS = """
ALTER TABLE equipment
  ADD COLUMN make text,
  ADD COLUMN model text,
  ADD COLUMN location text,
  ADD COLUMN specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT equipment_specifications_object
    CHECK (jsonb_typeof(specifications) = 'object');
"""

_UP_ENUM = "ALTER TYPE attachment_entity ADD VALUE IF NOT EXISTS 'equipment'"

_UP_FUNCTIONS = r"""
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
"""

_DOWN_CHECK = """
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM equipment
    WHERE make IS NOT NULL
       OR model IS NOT NULL
       OR location IS NOT NULL
       OR specifications <> '{}'::jsonb
  ) THEN
    RAISE EXCEPTION '0038 downgrade would discard equipment detail data';
  END IF;
  IF EXISTS (
    SELECT 1 FROM attachment
    WHERE entity_type = 'equipment'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION '0038 downgrade would leave live equipment attachments unsupported';
  END IF;
END
$$;
"""

_DOWN_FUNCTIONS = r"""
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
"""

_DOWN_COLUMNS = """
ALTER TABLE equipment
  DROP CONSTRAINT equipment_specifications_object,
  DROP COLUMN specifications,
  DROP COLUMN location,
  DROP COLUMN model,
  DROP COLUMN make;
"""


def _statements(ddl: str) -> list[str]:
    out: list[str] = []
    buf: list[str] = []
    in_body = False
    for line in ddl.splitlines():
        if line.count("$fn$") == 1 or line.count("$$") == 1:
            in_body = not in_body
        buf.append(line)
        if not in_body and line.rstrip().endswith(";"):
            stmt = "\n".join(buf).strip()
            buf = []
            if stmt:
                out.append(stmt)
    tail = "\n".join(buf).strip()
    if tail:
        out.append(tail)
    return out


def _execute(ddl: str) -> None:
    for stmt in _statements(ddl):
        op.execute(stmt)


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute(_UP_ENUM)
    op.execute(_UP_COLUMNS)
    _execute(_UP_FUNCTIONS)


def downgrade() -> None:
    _execute(_DOWN_CHECK)
    _execute(_DOWN_FUNCTIONS)
    op.execute(_DOWN_COLUMNS)
    # PostgreSQL enum labels cannot be safely removed from attachment_entity.
