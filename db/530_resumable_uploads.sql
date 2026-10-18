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
