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
