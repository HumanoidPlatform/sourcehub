"""catalogue: relisting no longer asks the worker.

The crowd hands its captures to the aggregator, and the aggregator to the
delivery partner; what the partner does with captures the client did not keep
exclusive is not the worker's concern. datahub_relist_candidates stops
reporting whether a capture's worker had accepted the resale notice, so
relisting copies every accepted capture, and user_consent, which nothing else
read, is dropped. The phone keeps its own record of the privacy notice, as it
did before 0042.

SQL copied verbatim from db/400_no_worker_consent.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. The downgrade restores the table (empty) and the 0042 function.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0043
Revises: 0042
"""

from alembic import op

revision = "0043"
down_revision = "0042"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 400 · Relisting no longer asks the worker
--
-- The crowd captures for an assignment and hands the work to its aggregator,
-- which hands it to the delivery partner. What the partner then does with
-- captures the client did not keep exclusive is the partner's business, not
-- the worker's. So relisting an approved, non-exclusive contract copies every
-- accepted capture, and the server no longer keeps a copy of the notices a
-- worker accepted: user_consent (db/390) had no other reader.
--
-- The phone still asks a worker to accept its privacy notice before the first
-- assignment, and keeps that record on the phone, as it did before db/390.
-- ============================================================================

-- What relisting a delivered contract may copy: its accepted captures, the
-- retaken ones replaced by their retakes. Only the contract's delivery partner
-- gets an answer. The return type loses resale_consented, so this is a DROP
-- and a CREATE rather than a replace.
DROP FUNCTION datahub_relist_candidates(uuid);

CREATE FUNCTION datahub_relist_candidates(p_contract_id uuid)
RETURNS TABLE (
  asset_id uuid, storage_key text, storage_target_id uuid, filename text,
  mime_type text, size_bytes bigint, sha256 text, captured_at timestamptz,
  captured_by_user_id uuid, check_results jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT s.id, s.storage_key, s.storage_target_id, s.filename,
         s.mime_type, s.size_bytes, s.sha256, s.captured_at,
         s.captured_by_user_id, s.check_results
  FROM   asset s
  JOIN   contract k ON k.id = s.contract_id
  WHERE  s.contract_id = p_contract_id
    AND  k.partner_org_id = current_org_id()
    AND  s.status = 'ready'
    AND  s.deleted_at IS NULL
    AND  NOT EXISTS (SELECT 1 FROM asset r
                      WHERE r.replaces_asset_id = s.id AND r.deleted_at IS NULL
                        AND r.status = 'ready')
$fn$;

REVOKE EXECUTE ON FUNCTION datahub_relist_candidates(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION datahub_relist_candidates(uuid) TO sourcehub_app;

-- Its policies and grants go with it.
DROP TABLE user_consent;
"""

_DOWN = """
-- Back to db/390: the server keeps the notices a worker accepted, and
-- relisting reports, per capture, whether its worker had accepted the resale
-- notice before capturing it. The table comes back empty; the phones that
-- would refill it no longer send anything.
CREATE TABLE user_consent (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  document     text NOT NULL CHECK (document IN ('worker_privacy_notice')),
  version      integer NOT NULL CHECK (version > 0),
  accepted_at  timestamptz NOT NULL DEFAULT now(),
  app_version  text,
  platform     text,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_consent_key UNIQUE (user_id, document, version)
);

COMMENT ON TABLE user_consent IS
  'Notices a person accepted. worker_privacy_notice >= 2 includes resale in the dataset catalogue.';

ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_consent_select ON user_consent FOR SELECT
  USING (is_platform_admin() OR user_id = current_user_id());
CREATE POLICY user_consent_insert ON user_consent FOR INSERT
  WITH CHECK (user_id = current_user_id());

REVOKE ALL ON user_consent FROM sourcehub_app;
GRANT SELECT, INSERT ON user_consent TO sourcehub_app;
GRANT SELECT ON user_consent TO sourcehub_readonly;

DROP FUNCTION datahub_relist_candidates(uuid);

CREATE FUNCTION datahub_relist_candidates(p_contract_id uuid)
RETURNS TABLE (
  asset_id uuid, storage_key text, storage_target_id uuid, filename text,
  mime_type text, size_bytes bigint, sha256 text, captured_at timestamptz,
  captured_by_user_id uuid, check_results jsonb, resale_consented boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT s.id, s.storage_key, s.storage_target_id, s.filename,
         s.mime_type, s.size_bytes, s.sha256, s.captured_at,
         s.captured_by_user_id, s.check_results,
         EXISTS (SELECT 1 FROM user_consent c
                  WHERE c.user_id = s.captured_by_user_id
                    AND c.document = 'worker_privacy_notice' AND c.version >= 2
                    AND c.accepted_at <= coalesce(s.captured_at, s.created_at))
  FROM   asset s
  JOIN   contract k ON k.id = s.contract_id
  WHERE  s.contract_id = p_contract_id
    AND  k.partner_org_id = current_org_id()
    AND  s.status = 'ready'
    AND  s.deleted_at IS NULL
    AND  NOT EXISTS (SELECT 1 FROM asset r
                      WHERE r.replaces_asset_id = s.id AND r.deleted_at IS NULL
                        AND r.status = 'ready')
$fn$;

REVOKE EXECUTE ON FUNCTION datahub_relist_candidates(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION datahub_relist_candidates(uuid) TO sourcehub_app;
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
