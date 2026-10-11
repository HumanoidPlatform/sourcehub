-- ============================================================================
-- 370 · Google Cloud Storage as a client's delivery destination
--
-- storage_provider has carried 'gcs' since 001, but 035's CHECK refused it:
-- the first GCS adapter was removed before it ever ran. A native one is back
-- (backend/src/sourcehub/platform/storage/gcs_store.py, V4 signed URLs), so a
-- client may now name a Google Cloud Storage bucket for their captures, next to
-- S3-compatible storage and Azure Blob.
--
-- For a gcs row:
--   bucket      the GCS bucket
--   key_prefix  the folder inside it, as for the other two
--   secret      {"service_account_json": "<the key file, as Google issued it>"}
--   endpoint    NULL (Google's own host); region NULL (GCS signs for none)
--
-- The client creates the service account and gives it Storage Object Admin on
-- that one bucket; the key is stored as given, under the same rules 035 sets
-- for every credential in this table. The platform's own storage may be GCS
-- too, but that is configured in settings (STORAGE_PROVIDER), never here.
-- ============================================================================

ALTER TABLE storage_target DROP CONSTRAINT storage_target_provider_supported;
ALTER TABLE storage_target
  ADD CONSTRAINT storage_target_provider_supported
    CHECK (provider IN ('s3', 'gcs', 'azure_blob'));
