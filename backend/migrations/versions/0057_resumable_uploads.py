"""media: resumable capture uploads.

A capture was one PUT of the whole file. The phone now sends a big file in
chunks against a session storage keeps (a Google resumable session, Azure
uncommitted blocks, an S3 multipart upload) and resumes after a cut. The asset
gains the session (a credential, never listed), the phone's own capture id so
a retry finds its row without hashing the file, and a nullable sha256 since a
chunked upload sends none. upload_sweep_orgs() lets modules/media/sweep.py find
suppliers with uploads that never finished.

Additive and reversible: the downgrade refuses while any capture has no hash,
because setting sha256 back to NOT NULL would otherwise fail halfway.

SQL copied verbatim from db/530_resumable_uploads.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0057
Revises: 0056
"""

from alembic import op

revision = "0057"
down_revision = "0056"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 530 · Resumable capture uploads
--
-- A capture used to be one PUT of the whole file: a dropped connection started
-- it again from byte 0, and a ten-minute clip is a gigabyte. The phone now
-- sends a big file in chunks against a session that storage itself keeps — a
-- Google resumable session, Azure's uncommitted blocks, an S3 multipart upload
-- — and after a cut asks storage where it got to and carries on. Three things
-- change on asset:
--
--   upload_session     what the server opened for this capture: protocol,
--                      session, chunk_size, size. A Google session URL by
--                      itself authorises writing the object, so this column is
--                      a credential: media/service.py never puts it in
--                      _ASSET_COLUMNS and returns it only to the capturing
--                      worker, from presign. Cleared when the upload confirms.
--   client_capture_id  the phone's own id for the capture (its outbox row), so
--                      a retry finds its row without hashing the file. Hashing
--                      a gigabyte on the phone is what loaded it into memory
--                      and had the OS kill the app.
--   sha256             nullable. A chunked upload sends none; a small file
--                      still sends one. One of the two identifies a capture.
--
-- upload_sweep_orgs() is for the sweep (modules/media/sweep.py): the suppliers
-- with uploads that never finished, which it aborts and soft-deletes. The
-- sweep runs without a tenant, and asset is invisible without one.
-- ============================================================================

ALTER TABLE asset
  ADD COLUMN upload_session    jsonb,
  ADD COLUMN client_capture_id uuid,
  ALTER COLUMN sha256 DROP NOT NULL,
  ADD CONSTRAINT asset_identity_check
    CHECK (sha256 IS NOT NULL OR client_capture_id IS NOT NULL);

COMMENT ON COLUMN asset.upload_session IS
  'The storage session a chunked upload writes to: protocol, session, chunk_size, size. '
  'A credential: never listed, cleared on confirm.';
COMMENT ON COLUMN asset.client_capture_id IS
  'The capturing device''s own id for this capture; presign finds the row by it.';

CREATE INDEX IF NOT EXISTS asset_client_capture_idx ON asset (assignment_id, client_capture_id);

CREATE OR REPLACE FUNCTION upload_sweep_orgs() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT DISTINCT supplier_org_id FROM asset
  WHERE status = 'pending' AND deleted_at IS NULL AND supplier_org_id IS NOT NULL
    AND updated_at < now() - interval '6 days'
$fn$;

REVOKE EXECUTE ON FUNCTION upload_sweep_orgs() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION upload_sweep_orgs() TO sourcehub_app;
"""

_DOWN = """
DROP FUNCTION IF EXISTS upload_sweep_orgs();
DROP INDEX IF EXISTS asset_client_capture_idx;
DO $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM asset WHERE sha256 IS NULL) THEN
    RAISE EXCEPTION
      '0057 downgrade would leave chunked uploads without a hash: remove them first';
  END IF;
END
$fn$;
ALTER TABLE asset
  DROP CONSTRAINT asset_identity_check,
  ALTER COLUMN sha256 SET NOT NULL,
  DROP COLUMN client_capture_id,
  DROP COLUMN upload_session;
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
