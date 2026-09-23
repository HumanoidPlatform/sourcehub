-- ============================================================================
-- 905 · Seed — the field worker role and the assignment capabilities
--
-- Runs after 900 (which creates the RBAC vocabulary this file extends) and
-- before 910 (demo data). Like 900 it is NOT demo data: without it no worker
-- can be invited and no aggregator can assign or review.
--
-- Workers deliberately do NOT receive task.read, task.start or task.submit.
-- The aggregator submits a task to its delivery partner on behalf of the
-- organisation; a worker only ever acts on their own assignment.
-- ============================================================================

INSERT INTO role (code, name, description, applies_to_kind, is_system) VALUES
  ('worker', 'Crowd resource', 'Captures data on assignments for a supplier organisation', NULL, true);
-- applies_to_kind is NULL: an aggregator or a business grants it. The owner
-- role lookup in approve_onboarding_request filters on kind, so this never
-- collides with it.

INSERT INTO permission (code, module, description, requires_mfa) VALUES
  ('assignment.read',   'delivery', 'Read own assignments',                                 false),
  ('assignment.start',  'delivery', 'Start an assignment',                                  false),
  ('assignment.submit', 'delivery', 'Submit an assignment for supplier review',             false),
  ('asset.upload',      'delivery', 'Upload captured files against an assignment',          false),
  ('assignment.assign', 'delivery', 'Assign units of a task to crowd resources',            false),
  ('qa.review.gate1',   'qa',       'Record a QA outcome at gate 1 (supplier self-check)',  false);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.is_system AND r.code = 'worker'
  AND p.code IN ('assignment.read','assignment.start','assignment.submit','asset.upload');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.is_system AND r.code IN ('aggregator','business')
  AND p.code IN ('assignment.assign','qa.review.gate1');
