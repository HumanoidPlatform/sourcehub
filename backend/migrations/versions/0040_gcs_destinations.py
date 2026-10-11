"""storage: Google Cloud Storage as a client's delivery destination.

The storage_provider enum has carried 'gcs' since the first schema, but a
CHECK refused it because no adapter existed. A native adapter is back
(platform/storage/gcs_store.py, V4 signed URLs with a service-account key), so
the CHECK now admits 'gcs' next to 's3' and 'azure_blob'. A gcs row keeps its
service-account key in storage_target.secret as {service_account_json}.

SQL copied verbatim from db/370_gcs_destinations.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. The downgrade refuses, changing nothing, while any destination
is on Google Cloud Storage.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0040
Revises: 0039
"""

from alembic import op

revision = "0040"
down_revision = "0039"
branch_labels = None
depends_on = None

_UP = """
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
"""

_DOWN = """
-- Back to S3 and Azure only. Refused, changing nothing, while any destination
-- (deleted ones included, the CHECK covers every row) is on Google Cloud
-- Storage: there would be no adapter left to serve it.
DO $fn$
DECLARE
  v_rows bigint;
BEGIN
  SELECT count(*) INTO v_rows FROM storage_target WHERE provider = 'gcs';
  IF v_rows > 0 THEN
    RAISE EXCEPTION '0040 downgrade: % storage destination(s) use Google Cloud Storage; '
                    'nothing was changed. Move them to S3 or Azure first', v_rows;
  END IF;
END
$fn$;

ALTER TABLE storage_target DROP CONSTRAINT storage_target_provider_supported;
ALTER TABLE storage_target
  ADD CONSTRAINT storage_target_provider_supported CHECK (provider IN ('s3','azure_blob'));
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
