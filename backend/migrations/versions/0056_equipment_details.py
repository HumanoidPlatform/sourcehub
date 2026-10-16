"""network: what a sponsor's device is, with its photos and documents.

Equipment gains make, model, location and labelled details
(equipment.specifications, a flat object), and the attachment table gains a
parent kind, 'equipment', so a sponsor can attach photos and documentation to
a device. Who sees those files is whoever sees the device: the equipment
branch of attachment_parent_visible() runs with the caller's rights.
attachment_folder() files them under the sponsor and the device's DV- code.

The enum value is added in an autocommit block before anything else runs:
Postgres will not let a transaction use an enum value it added, and the
functions name it. An enum value cannot be removed, so the downgrade leaves
'equipment' in attachment_entity; it refuses while any device has details or
live files, puts db/095's and db/140's functions back, and drops the columns.

SQL copied verbatim from db/520_equipment_details.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0056
Revises: 0055
"""

from alembic import op

revision = "0056"
down_revision = "0055"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 520 · What a sponsor's device is, with its photos and documents
--
-- An equipment row said what kind of device it was, how many units there are
-- and when they were last calibrated. A borrower choosing between two "helmet
-- camera" rows had nothing else to go on. A sponsor can now say which device it
-- is (make, model), where the units are kept, anything else a borrower should
-- know as labelled details ("Resolution: 4K"), and attach photos and
-- documentation.
--
-- The files are ordinary attachment rows under a new parent kind, 'equipment',
-- in two slots: photos and documentation. Who may read them is whoever may
-- read the device: attachment_parent_visible() runs with the caller's rights,
-- so equipment's own policies decide (the sponsor, the siblings that may
-- borrow from it per db/220, its borrowers, operations). Only the sponsor
-- writes: attachment_insert still requires the owning org, and the service
-- checks the device is the caller's before filing anything against it.
--
-- Existing rows stay valid: the new columns are nullable and the details
-- default to an empty object. Calibration dates stay optional.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The new parent kind. First and on its own: Postgres will not let a
--     transaction use an enum value that transaction added, and the functions
--     below name it. The bootstrap runs each statement in its own transaction;
--     0056 runs this one in an autocommit block.
-- ---------------------------------------------------------------------------
ALTER TYPE attachment_entity ADD VALUE IF NOT EXISTS 'equipment';

-- ---------------------------------------------------------------------------
-- 2 · Which device, where it is kept, and the details a borrower asks about.
--     Blank is not a value: a field left empty is NULL. The details are a flat
--     object of label → text; the API holds the shape (at most 20 labels, each
--     value a short string), the database holds that it is an object and not
--     an unbounded one.
-- ---------------------------------------------------------------------------
ALTER TABLE equipment
  ADD COLUMN make text
    CONSTRAINT equipment_make_check CHECK (char_length(btrim(make)) BETWEEN 1 AND 200),
  ADD COLUMN model text
    CONSTRAINT equipment_model_check CHECK (char_length(btrim(model)) BETWEEN 1 AND 200),
  ADD COLUMN location text
    CONSTRAINT equipment_location_check CHECK (char_length(btrim(location)) BETWEEN 1 AND 200),
  ADD COLUMN specifications jsonb NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT equipment_specifications_check
      CHECK (jsonb_typeof(specifications) = 'object'
             AND octet_length(specifications::text) <= 32768);

COMMENT ON COLUMN equipment.make IS
  'Manufacturer, as the sponsor writes it ("GoPro"). NULL when not given.';
COMMENT ON COLUMN equipment.model IS
  'Model, as the sponsor writes it ("HERO12 Black"). NULL when not given.';
COMMENT ON COLUMN equipment.location IS
  'Where the units are kept or collected from. NULL when not given.';
COMMENT ON COLUMN equipment.specifications IS
  'Labelled details a borrower asks about: a flat object of label to text, {"Resolution": "4K"}.';

-- ---------------------------------------------------------------------------
-- 3 · A file on a device is visible to whoever can see the device. The other
--     four branches are db/095's, unchanged.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4 · Where a device's files are filed: under its sponsor and its DV- code,
--     the way a request's are under its client and its RFP- code. The service
--     puts them beneath an equipment/ folder of their own. The second half is
--     db/140's body, unchanged; for 'equipment' its CASE yields NULL and it
--     returns no row. Same signature, so CREATE OR REPLACE keeps the grants;
--     they are restated anyway.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION attachment_folder(p_type attachment_entity, p_id uuid)
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

_DOWN = """
DO $fn$
BEGIN
  IF EXISTS (
    SELECT 1 FROM equipment
    WHERE make IS NOT NULL OR model IS NOT NULL OR location IS NOT NULL
       OR specifications <> '{}'::jsonb
  ) THEN
    RAISE EXCEPTION
      '0056 downgrade would discard device details: clear make, model, location and details first';
  END IF;
  IF EXISTS (SELECT 1 FROM attachment WHERE entity_type = 'equipment' AND deleted_at IS NULL) THEN
    RAISE EXCEPTION '0056 downgrade would strand device photos and documents: remove them first';
  END IF;
END
$fn$;

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

CREATE OR REPLACE FUNCTION attachment_folder(p_type attachment_entity, p_id uuid)
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

ALTER TABLE equipment
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
        if line.count("$fn$") == 1:
            in_body = not in_body
        buf.append(line)
        if not in_body and line.rstrip().endswith(";"):
            stmt = chr(10).join(buf).strip()
            buf = []
            lines = stmt.splitlines()
            only_comments = all(ln.strip().startswith("--") or not ln.strip() for ln in lines)
            if stmt and not only_comments:
                out.append(stmt)
    return out


def upgrade() -> None:
    for stmt in _statements(_UP):
        if "ADD VALUE" in stmt:
            # Committed on its own before the functions below can name it.
            with op.get_context().autocommit_block():
                op.execute(stmt)
        else:
            op.execute(stmt)


def downgrade() -> None:
    # 'equipment' stays in attachment_entity: Postgres cannot drop an enum value.
    for stmt in _statements(_DOWN):
        op.execute(stmt)
