-- ============================================================================
-- 035 · Storage — client-supplied destinations for captured data
--
-- Captures do not land in a SourceHub bucket. The client names the destination
-- while drafting the request, and every asset for the resulting contract is
-- written there. SourceHub holds the credential and does the signing; the
-- phone and the browser only ever see a short-lived URL.
--
-- This file is numbered before 040 because `request` references a target, and
-- after 010 because a target belongs to an organisation.
--
-- Why a table rather than columns on `request`: request_select opens published
-- RFPs to every tenant, so anything sitting on that row is readable by every
-- bidding partner. A credential cannot live there. A client also points many
-- requests at one bucket, so a destination is worth naming once and reusing.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- storage_target — one destination, owned by the client that supplied it.
--
-- `secret` holds the credential in the shape its provider expects:
--   s3          {"access_key_id": …, "secret_access_key": …}
--   azure_blob  {"account_name": …, "account_key": …}
--
-- It is stored as given. Nothing here encrypts it, so treat database access as
-- equivalent to holding every client's storage credentials, and keep the
-- column out of every SELECT that feeds an API response.
--
-- `endpoint` NULL means the provider's own default host.
--
-- `region` is S3-only and matters more than it looks: s3_store passes it to the
-- SDK so that signing stays arithmetic over a key. Without it the SDK issues a
-- live GetBucketLocation before it will sign anything, and SigV4 against a
-- bucket outside us-east-1 is rejected outright. NULL on an Azure target — a
-- container has no region to sign for.
--
-- This is the CLIENT's storage, chosen when the RFP is raised. The platform's
-- own container is a different thing entirely: Azure, fixed, and configured in
-- settings rather than here.
-- ---------------------------------------------------------------------------
CREATE TABLE storage_target (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,

  label         text NOT NULL,
  provider      storage_provider NOT NULL,
  endpoint      text,
  bucket        text NOT NULL,              -- the container, on Azure
  key_prefix    text NOT NULL DEFAULT '',

  secret        jsonb NOT NULL,

  -- A destination is probed before it may be used: written, read and deleted.
  -- Without that the first sign of a bad credential is a worker in the field
  -- holding a capture that will never upload.
  verified_at   timestamptz,
  verify_error  text,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES app_user(id),
  updated_by    uuid REFERENCES app_user(id),
  deleted_at    timestamptz,

  -- After deleted_at because it was dropped and then re-added: pg_attribute
  -- order is what pg_dump emits and what infra/verify_schema.sh compares.
  -- See the same note on `request` in db/040_marketplace.sql.
  region        text,

  CONSTRAINT storage_target_prefix_shape
    CHECK (key_prefix = '' OR key_prefix ~ '^[A-Za-z0-9._/-]+/$'),
  -- Two providers are implemented and supported. The storage_provider enum
  -- still carries 'gcs' because Postgres cannot drop an enum label without
  -- rewriting the column that uses it; this CHECK is what actually forbids it,
  -- and there is no gcs adapter to serve one.
  CONSTRAINT storage_target_provider_supported
    CHECK (provider IN ('s3','azure_blob'))
);

CREATE INDEX storage_target_owner_idx ON storage_target (owner_org_id)
  WHERE deleted_at IS NULL;

-- One label per client, so the picker on the request builder cannot show two
-- identically named destinations.
CREATE UNIQUE INDEX storage_target_label_key
  ON storage_target (owner_org_id, lower(label)) WHERE deleted_at IS NULL;

CREATE TRIGGER storage_target_updated_at BEFORE UPDATE ON storage_target
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
