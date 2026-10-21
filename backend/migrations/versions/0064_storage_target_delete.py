"""storage: a client can delete a delivery destination that nothing uses.

A destination could be added from the RFP builder and never removed, and the
only answer to a rotated or revoked key was a duplicate. db/590 adds what the
database holds to once modules/storage can delete one: a deleted destination
holds no key (storage_target_deleted_wiped), a destination that a contract or
a live request names cannot be deleted and a deleted one stays deleted
(storage_target_delete_guard), and a request may name only a live destination
of its own client, share-locking it so a save racing a delete is refused
(request_storage_target_guard).

The downgrade drops the two guards, the check and the column comment. Keys
already wiped stay wiped: they belonged to destinations their client deleted,
and nothing reads a deleted destination.

SQL copied verbatim from db/590_storage_target_delete.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0064
Revises: 0063
"""

from alembic import op

revision = "0064"
down_revision = "0063"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 590 · A client can delete a delivery destination that nothing uses
--
-- A destination could be added from the RFP builder and never removed. One a
-- client had stopped using stayed in the picker for ever, with its key still
-- held, and the only answer to a rotated or revoked key was a duplicate.
-- modules/storage now replaces a key, renames and deletes, from the Delivery
-- storage section of the console's Organisation profile.
--
-- Deleting is soft, as everywhere else: deleted_at, which every read already
-- filters. Only a destination that nothing uses may go. A contract writes its
-- captures there, and every capture already written names it on its asset
-- row and is signed from it each time it is viewed. A draft or published
-- request would be awarded into it. A cancelled or deleted request does not
-- count, because neither can be awarded.
--
-- What the database holds to, whatever the client's own row policy lets it
-- write:
--   * storage_target_deleted_wiped: a deleted destination holds no key.
--     Deleting wipes the key in the same statement. The location stays, for
--     the audit trail
--   * storage_target_delete_guard: a destination that a contract names, or a
--     request that is neither cancelled nor deleted, cannot be deleted, and a
--     deleted one stays deleted. It reads contract and request as the owner,
--     so the caller's row policy cannot hide a reference and let it through
--   * request_storage_target_guard: a request may name only a live
--     destination of its own client. It share-locks that destination, so a
--     request saved while the destination is being deleted waits for the
--     delete and is then refused. Without the lock both would succeed and
--     leave the request naming a destination that is gone
--
-- No destination was deleted before this file (nothing could delete one), but
-- any that were have their key wiped first, so the check can be added.
-- ============================================================================

UPDATE storage_target SET secret = '{}'::jsonb
 WHERE deleted_at IS NOT NULL AND secret <> '{}'::jsonb;

ALTER TABLE storage_target ADD CONSTRAINT storage_target_deleted_wiped
  CHECK (deleted_at IS NULL OR secret = '{}'::jsonb);

CREATE OR REPLACE FUNCTION storage_target_delete_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_ref text;
BEGIN
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    RAISE EXCEPTION 'storage target %: a deleted destination stays deleted', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    SELECT c.reference_code INTO v_ref FROM contract c
     WHERE c.storage_target_id = OLD.id
     LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'storage target %: contract % delivers into it', OLD.id, v_ref
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT r.reference_code INTO v_ref FROM request r
     WHERE r.storage_target_id = OLD.id
       AND r.deleted_at IS NULL AND r.status <> 'cancelled'
     LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'storage target %: request % names it', OLD.id, v_ref
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER storage_target_delete_guard BEFORE UPDATE ON storage_target
  FOR EACH ROW EXECUTE FUNCTION storage_target_delete_guard();

CREATE OR REPLACE FUNCTION request_storage_target_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NEW.storage_target_id IS NULL
     OR (TG_OP = 'UPDATE' AND NEW.storage_target_id IS NOT DISTINCT FROM OLD.storage_target_id) THEN
    RETURN NEW;
  END IF;
  PERFORM 1 FROM storage_target st
   WHERE st.id = NEW.storage_target_id
     AND st.owner_org_id = NEW.client_org_id
     AND st.deleted_at IS NULL
     FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'request %: the delivery destination is deleted or is not its client''s',
      NEW.reference_code USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER request_storage_target_guard BEFORE INSERT OR UPDATE OF storage_target_id ON request
  FOR EACH ROW EXECUTE FUNCTION request_storage_target_guard();

COMMENT ON COLUMN storage_target.deleted_at IS
  'When the client deleted it. Only a destination no contract and no live request names; '
  'the key is wiped in the same statement and a deleted destination stays deleted (db/590)';
"""

_DOWN = """
DROP TRIGGER IF EXISTS request_storage_target_guard ON request;
DROP FUNCTION IF EXISTS request_storage_target_guard();
DROP TRIGGER IF EXISTS storage_target_delete_guard ON storage_target;
DROP FUNCTION IF EXISTS storage_target_delete_guard();
ALTER TABLE storage_target DROP CONSTRAINT IF EXISTS storage_target_deleted_wiped;
COMMENT ON COLUMN storage_target.deleted_at IS NULL;
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
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _statements(_DOWN):
        op.execute(stmt)
