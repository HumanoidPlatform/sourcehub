-- ============================================================================
-- 900 · Seed — permissions, system roles, the platform organisation,
--              the first administrator
--
-- This file is NOT demo data. It is the minimum a working deployment needs:
-- without it there is no capability vocabulary, no role to grant, and nobody
-- who can approve the first onboarding request.
--
-- Runs as the superuser, which bypasses RLS. That is the only reason these
-- inserts succeed with no app.org_id set.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Permissions.
--
-- The first six blocks are the prototype's CAPS matrix, transcribed verbatim
-- from sourcehub-app.html:884. The onboarding block is new — the prototype has
-- no approval step, so it has no vocabulary for one.
--
-- requires_mfa carries the blueprint's rule: a second factor is enforced for
-- "any role that can move money or approve a delivery".
-- ---------------------------------------------------------------------------
INSERT INTO permission (code, module, description, requires_mfa) VALUES
  -- client
  ('rfp.create',          'marketplace', 'Draft a request',                          false),
  ('rfp.publish',         'marketplace', 'Publish a request to the marketplace',     false),
  ('rfp.read',            'marketplace', 'Read own requests',                        false),
  ('proposal.read',       'marketplace', 'Read proposals on own requests',           false),
  ('proposal.accept',     'marketplace', 'Award a contract',                         true),
  ('contract.read',       'delivery',    'Read contracts',                           false),
  ('contract.approve',    'delivery',    'Accept a delivery and release payment',    true),
  ('delivery.track',      'delivery',    'Track delivery progress',                  false),
  ('invoice.read',        'ledger',      'Read own invoices',                        false),
  ('rating.write',        'network',     'Rate a counterparty',                      false),
  ('storage.manage',      'storage',     'Manage where captured data is delivered',  false),

  -- tenant
  ('rfp.read.published',  'marketplace', 'Read the open marketplace',                false),
  ('proposal.create',     'marketplace', 'Submit a proposal',                        false),
  ('contract.deliver',    'delivery',    'Deliver a contract to the client',         true),
  ('task.create',         'delivery',    'Break a contract into tasks',              false),
  ('task.assign',         'delivery',    'Assign a task to a supplier',              false),
  ('qa.review',           'qa',          'Record a QA outcome at gate 2',            false),
  ('network.manage',      'network',     'Manage the partner network',               false),
  ('equipment.read',      'network',     'Read equipment in the network',            false),

  -- aggregator and business
  ('task.read',           'delivery',    'Read assigned tasks',                      false),
  ('task.start',          'delivery',    'Start an assigned task',                   false),
  ('task.submit',         'delivery',    'Submit captured data',                     false),
  ('roster.manage',       'network',     'Manage the crowd roster',                  false),
  ('profile.manage',      'identity',    'Manage own organisation profile',          false),
  ('equipment.request',   'network',     'Request an equipment loan',                false),

  -- sponsor
  ('equipment.manage',    'network',     'Manage equipment inventory',               false),
  ('equipment.decide',    'network',     'Approve or reject an equipment loan',      false),

  -- platform admin
  ('account.read',        'identity',    'Read any organisation account',            false),
  ('billing.read',        'ledger',      'Read any organisation billing',            false),
  ('activity.read',       'audit',       'Read the platform activity trail',         false),
  ('dispute.arbitrate',   'delivery',    'Arbitrate a dispute',                      true),

  -- onboarding — new
  ('onboarding.request',  'onboarding',  'Raise an onboarding request',              false),
  ('onboarding.read',     'onboarding',  'Read onboarding requests in scope',        false),
  ('onboarding.approve',  'onboarding',  'Approve or reject an onboarding request',  true),
  ('org.create',          'identity',    'Create an organisation directly',          true),
  ('org.suspend',         'identity',    'Suspend or terminate an organisation',     true),
  ('user.invite',         'identity',    'Invite a user into an organisation',       false),
  ('user.manage',         'identity',    'Manage users in own organisation',         false),
  ('role.manage',         'identity',    'Manage roles and grants in own organisation', false);


-- ---------------------------------------------------------------------------
-- System roles — one per persona, matching ROLES in the prototype.
-- ---------------------------------------------------------------------------
INSERT INTO role (code, name, description, applies_to_kind, is_system) VALUES
  ('client',         'Client',         'Buys data through the marketplace',       'client',     true),
  ('tenant',         'Delivery partner','Fulfils requests through its network',   'tenant',     true),
  ('aggregator',     'Aggregator',     'Crowd workforce supplier',                'aggregator', true),
  ('business',       'Business partner','Specialist vendor supplier',             'business',   true),
  ('sponsor',        'Device sponsor', 'Lends equipment into a network',          'sponsor',    true),
  ('platform_admin', 'Platform admin', 'SourceHub operations',                    'platform',   true);


-- ---------------------------------------------------------------------------
-- The matrix. One statement per role, listing capability codes.
-- ---------------------------------------------------------------------------
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'client' AND p.code IN (
  'rfp.create','rfp.publish','rfp.read','proposal.read','proposal.accept',
  'contract.read','contract.approve','delivery.track','invoice.read','rating.write',
  'storage.manage',
  'onboarding.read','user.invite','user.manage','role.manage','profile.manage');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'tenant' AND p.code IN (
  'rfp.read.published','proposal.create','contract.read','contract.deliver',
  'task.create','task.assign','qa.review','network.manage','equipment.read',
  'invoice.read','rating.write','delivery.track',
  -- the new capability: a tenant may ASK, but never approve
  'onboarding.request','onboarding.read',
  'user.invite','user.manage','role.manage','profile.manage');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'aggregator' AND p.code IN (
  'task.read','task.start','task.submit','roster.manage','equipment.request',
  'profile.manage','user.invite','user.manage');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'business' AND p.code IN (
  'task.read','task.start','task.submit','profile.manage','equipment.request',
  'user.invite','user.manage');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'sponsor' AND p.code IN (
  'equipment.manage','equipment.decide','profile.manage',
  'user.invite','user.manage');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'platform_admin' AND p.code IN (
  'account.read','billing.read','activity.read','dispute.arbitrate',
  'onboarding.read','onboarding.approve','org.create','org.suspend',
  'user.invite','user.manage','role.manage','contract.read','delivery.track');


-- ---------------------------------------------------------------------------
-- The platform organisation.
--
-- The prototype fakes this with a hard-coded { id:'OPS' } that has no backing
-- row, so every approval and audit FK would point at nothing. Ops is a real
-- organisation here.
-- ---------------------------------------------------------------------------
INSERT INTO organisation (reference_code, kind, name, legal_name, status, onboarded_at)
VALUES (org_reference_code('platform'), 'platform', 'SourceHub Operations',
        'SourceHub Ltd', 'active', now());


-- ---------------------------------------------------------------------------
-- The first administrator.
--
-- Dev credential: admin@sourcehub.local / SourceHub#2026
--
-- Hashed with bcrypt via pgcrypto, because Postgres has no argon2. The
-- application hashes with argon2id; password_algo records which was used, so
-- both verify correctly and this seed row is upgraded on the admin's next
-- password change.
--
-- CHANGE THIS BEFORE ANY DEPLOYMENT THAT IS NOT LOCAL.
-- ---------------------------------------------------------------------------
INSERT INTO app_user (email, full_name, status, password_hash, password_algo,
                      password_updated_at, email_verified_at, must_change_password)
VALUES ('admin@sourcehub.local', 'Platform Administrator', 'active',
        crypt('SourceHub#2026', gen_salt('bf', 12)), 'bcrypt',
        now(), now(), true);

INSERT INTO user_role_grant (user_id, org_id, role_id, scope)
SELECT u.id, o.id, r.id, 'owner'
FROM   app_user u, organisation o, role r
WHERE  u.email = 'admin@sourcehub.local'
  AND  o.kind = 'platform'
  AND  r.code = 'platform_admin';


-- ---------------------------------------------------------------------------
-- Defect taxonomy — the automated checks named in the build guide.
-- ---------------------------------------------------------------------------
INSERT INTO defect_code (code, label, category, automated) VALUES
  ('blur',            'Blur (variance of Laplacian)', 'optical',    true),
  ('exposure',        'Exposure and glare',           'optical',    true),
  ('occlusion',       'Occlusion and framing',        'coverage',   true),
  ('missing_geotag',  'Geotag absent',                'metadata',   true),
  ('bitrate',         'Duration, bitrate, frame rate','metadata',   true),
  ('corrupt_frames',  'Corrupt frames',               'metadata',   true),
  ('night_precip',    'Night or precipitation',       'coverage',   true),
  ('redaction',       'Redaction verification failed','compliance', true),
  ('malware',         'Malware detected',             'compliance', true),
  ('wrong_subject',   'Wrong subject or location',    'coverage',   false),
  ('consent_missing', 'Consent artefact missing',     'compliance', false);


-- ---------------------------------------------------------------------------
-- Platform-default retention: 24 months post-contract.
-- ---------------------------------------------------------------------------
INSERT INTO retention_policy (org_id, retention_months) VALUES (NULL, 24);


-- ---------------------------------------------------------------------------
-- Platform-internal ledger accounts.
-- ---------------------------------------------------------------------------
INSERT INTO ledger_account (org_id, code, currency) VALUES
  (NULL, 'escrow',     'USD'),
  (NULL, 'fee_income', 'USD'),
  (NULL, 'cash',       'USD');


-- ---------------------------------------------------------------------------
-- Grants for tables created after 000's ALTER DEFAULT PRIVILEGES, belt and
-- braces. Views need them explicitly.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sourcehub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sourcehub_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sourcehub_readonly;
