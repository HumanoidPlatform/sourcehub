-- ============================================================================
-- 200 · Organisation user management
--
-- Lets an organisation add its own people. The capabilities for this
-- (user.invite, user.manage, role.manage) have been seeded since 900_seed and
-- granted to six roles, but nothing has ever read them: there was no endpoint,
-- so there was no floor under one either.
--
-- This file is that floor. It is deliberately all schema, because the hole it
-- closes is reachable from the most obvious possible endpoint:
--
--   is_platform_admin() is current_setting('app.role') = 'platform_admin'
--   (001_conventions.sql:163), and app.role is the JWT role claim. role_select
--   (100_rls.sql:252) lets EVERY authenticated member of EVERY organisation
--   read the platform_admin role row and its id. user_role_grant_write
--   (100_rls.sql:227) constrains org_id and says nothing about role_id. And
--   applies_to_kind, which 020_rbac.sql:38 claims "keeps a client from being
--   granted an aggregator role", is enforced by no CHECK, no trigger and no
--   service code anywhere in the repository.
--
--   So an invite endpoint that accepts a role and passes it through hands any
--   client-org member platform_admin inside their own organisation, and at
--   their next login every is_platform_admin() disjunct in 100_rls.sql opens.
--
-- An endpoint-side check would be one forgotten call site from reopening that.
-- The trigger below is not.
--
-- No new table, no new column, no new policy: user_role_grant already models
-- membership, and user_role_grant_write already scopes writes to the caller's
-- own organisation — its comment on 100_rls.sql:226 was written for this.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1 · One live grant per (user, organisation)
--
-- The existing key includes role_id, so a role change leaves TWO live grants.
-- user_capabilities (020_rbac.sql:141) then unions both permission sets, and
-- user_organisations returns two rows ordered by organisation name alone — so
-- which role reaches app.role, and therefore whether is_platform_admin() is
-- true, is decided by a tie-break in next() at identity/service.py:249.
--
-- Narrowing the key makes that state unrepresentable and forces a role change
-- to be revoke-then-insert inside one transaction.
--
-- Checked first rather than left to a bare "duplicate key" from the index
-- build: pilot data predates this rule, and an operator reading that error has
-- no idea which rows to look at.
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_n int;
BEGIN
  SELECT count(*) INTO v_n
  FROM  (SELECT user_id, org_id
         FROM   user_role_grant
         WHERE  revoked_at IS NULL
         GROUP  BY user_id, org_id
         HAVING count(*) > 1) d;
  IF v_n > 0 THEN
    RAISE EXCEPTION
      'cannot narrow user_role_grant_live_key: % (user, organisation) pair(s) hold more than one live grant; revoke the surplus first', v_n
      USING ERRCODE = 'check_violation';
  END IF;
END
$fn$;

DROP INDEX IF EXISTS user_role_grant_live_key;

CREATE UNIQUE INDEX user_role_grant_live_key
  ON user_role_grant (user_id, org_id) WHERE revoked_at IS NULL;


-- ---------------------------------------------------------------------------
-- 2 · A grant's role must fit the organisation's kind
--
-- The floor under the escalation described at the top of this file, and it
-- holds whatever the endpoint does.
--
-- applies_to_kind IS NULL stays legal on purpose: 905_seed_workers.sql:15
-- seeds 'worker' that way so both an aggregator and a business partner can
-- hold crowd resources. platform_admin is applies_to_kind = 'platform'
-- (900_seed.sql:84), so after this it can only ever be granted inside the one
-- platform organisation.
--
-- SECURITY DEFINER because it must read organisation and role rows the caller
-- may not select — the same reasoning as assert_ledger_balanced()
-- (110_auth_functions.sql:246): an integrity rule is about all rows by
-- definition.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION user_role_grant_role_fits_org() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_kind     org_kind;
  v_system   boolean;
  v_applies  org_kind;
  v_role_org uuid;
BEGIN
  SELECT kind INTO v_kind FROM organisation WHERE id = NEW.org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'organisation % does not exist', NEW.org_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  SELECT is_system, applies_to_kind, org_id
    INTO v_system, v_applies, v_role_org
    FROM role WHERE id = NEW.role_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'role % does not exist', NEW.role_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_system THEN
    IF v_applies IS NOT NULL AND v_applies <> v_kind THEN
      RAISE EXCEPTION 'that role cannot be granted in a % organisation', v_kind
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_role_org IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'a custom role belongs to another organisation'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS user_role_grant_role_fits ON user_role_grant;

CREATE TRIGGER user_role_grant_role_fits
  BEFORE INSERT OR UPDATE ON user_role_grant
  FOR EACH ROW EXECUTE FUNCTION user_role_grant_role_fits_org();


-- ---------------------------------------------------------------------------
-- 3 · An organisation can never reach zero owners
--
-- Five paths lead there and none was blocked: the last owner revokes
-- themselves, a manager demotes them, two managers revoke each other at once,
-- a DELETE slips past a design that expects revocation to be a timestamp, or
-- the row is simply updated by hand.
--
-- The concurrent case is why this LOCKS THE ORGANISATION ROW before counting.
-- Two transactions each revoking a different owner both see one owner
-- remaining and both commit — write skew that no CHECK can see, because
-- neither transaction's own rows are in violation.
--
-- 'invited' counts. approve_onboarding_request (030_onboarding.sql:259)
-- creates a new organisation's first owner in that state, and refusing it here
-- would make every new organisation impossible to create. The service layer
-- adds the stricter rule — at least one owner who can actually sign in —
-- because an org holding a single never-accepted owner is locked out in
-- practice while satisfying this trigger.
--
-- DEFERRED, and the caller must force it. A role change is revoke-then-insert
-- in one transaction (the narrowed index above requires that), so on the sole
-- owner the count passes through zero mid-transaction; IMMEDIATE would refuse
-- a legal edit. But deferred means it fires at COMMIT, and TxRoute commits
-- AFTER the endpoint returns (api/deps.py:71-74) — where no service code can
-- catch it, so a violation would reach the client as a 500.
--
-- So every service call that changes membership must end with
--
--     SET CONSTRAINTS user_role_grant_keeps_an_owner IMMEDIATE;
--
-- which fires the check while the service can still turn it into a clean
-- refusal. Verified: without it COMMIT raises; with it the same error arrives
-- inside the transaction and is catchable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_org_has_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_org uuid := coalesce(NEW.org_id, OLD.org_id);
  v_n   int;
BEGIN
  -- An organisation being deleted cascades its grants; there is no invariant
  -- left to assert, and FOR UPDATE on a vanished row would fail.
  PERFORM 1 FROM organisation WHERE id = v_org FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO v_n
  FROM   user_role_grant g
  JOIN   app_user u ON u.id = g.user_id
  WHERE  g.org_id = v_org
    AND  g.scope = 'owner'
    AND  g.revoked_at IS NULL
    AND  u.deleted_at IS NULL
    AND  u.status IN ('invited', 'active', 'locked');

  IF v_n = 0 THEN
    RAISE EXCEPTION 'an organisation must keep at least one owner'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS user_role_grant_keeps_an_owner ON user_role_grant;

CREATE CONSTRAINT TRIGGER user_role_grant_keeps_an_owner
  AFTER INSERT OR UPDATE OR DELETE ON user_role_grant
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_org_has_owner();


-- ---------------------------------------------------------------------------
-- 4 · Is this address already one of ours?
--
-- app_user_select (100_rls.sql:201) requires a LIVE grant, so a revoked
-- ex-member is invisible to their own organisation while their app_user row
-- still holds app_user_email_key. Re-inviting them would collide on an index
-- against a row nobody can see.
--
-- SECURITY DEFINER for that reason, and narrow for the reason
-- 160_email_is_taken.sql:11 gives: it answers one question about one address
-- the caller has already typed, and only when that address is already granted
-- in the CALLER'S OWN organisation. It cannot be used to enumerate anything.
-- current_org_id() still reads the caller's GUC under DEFINER.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION org_member_by_email(p_email citext)
RETURNS TABLE (
  user_id    uuid,
  full_name  text,
  status     user_status,
  grant_id   uuid,
  role_id    uuid,
  scope      grant_scope,
  revoked_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT u.id, u.full_name, u.status, g.id, g.role_id, g.scope, g.revoked_at
  FROM   app_user u
  JOIN   user_role_grant g ON g.user_id = u.id
  WHERE  u.email = p_email
    AND  u.deleted_at IS NULL
    AND  g.org_id = current_org_id()
  ORDER  BY g.granted_at DESC
  LIMIT  1
$fn$;


-- ---------------------------------------------------------------------------
-- 5 · Invite a colleague
--
-- Mirrors invite_worker (190_worker_skills.sql:47) — one call, all or nothing
-- — and differs in exactly three ways, each deliberate:
--
--   * no p_org_id. The organisation comes from current_org_id(), so inviting
--     into somebody else's organisation is not something a caller can express.
--     invite_worker took none either; the moment one is added, RLS's WITH
--     CHECK is the only thing left.
--   * the granter is current_user_id(), not a parameter. invite_worker trusts
--     p_invited_by, which a caller could forge; granted_by is the audit trail
--     for "who let this person in", so it is taken from the session.
--   * the role is resolved INSIDE, against this organisation's own kind, so a
--     role code that does not fit is refused here as well as by the trigger.
--
-- Stays INVOKER. 000_extensions.sql:13 notes these scripts run as the
-- superuser, who therefore owns every table; SECURITY DEFINER on a function
-- that writes app_user AND user_role_grant AND invitation would be a complete
-- RLS bypass rather than a narrow one.
--
-- KNOWN LIMIT, v1: an address that already belongs to a user in ANOTHER
-- organisation cannot be added, because app_user_email_key is unique across
-- the platform. It raises unique_violation, which the service turns into the
-- same 202 every other outcome returns — saying otherwise would make this an
-- oracle for whether any address on earth has an account.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION invite_member(
  p_email      citext,
  p_full_name  text,
  p_role_code  text,
  p_scope      grant_scope,
  p_token_hash text,
  p_ttl        interval DEFAULT interval '14 days'
) RETURNS TABLE (user_id uuid, created_user boolean, invitation_sent boolean)
LANGUAGE plpgsql AS $fn$
DECLARE
  v_org   uuid := current_org_id();
  v_me    uuid := current_user_id();
  v_kind  org_kind;
  v_role  uuid;
  v_prior record;
  v_user  uuid;
  v_new   boolean := false;
  v_send  boolean := true;
BEGIN
  IF v_org IS NULL OR v_me IS NULL THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT kind INTO v_kind FROM organisation WHERE id = v_org;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT r.id INTO v_role
  FROM   role r
  WHERE  r.code = p_role_code
    AND  ((r.is_system AND r.applies_to_kind = v_kind)
          OR (NOT r.is_system AND r.org_id = v_org));
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'that role cannot be granted in a % organisation', v_kind
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_prior FROM org_member_by_email(p_email);

  IF FOUND AND v_prior.revoked_at IS NULL THEN
    RAISE EXCEPTION 'already a member of this organisation'
      USING ERRCODE = 'unique_violation';
  END IF;

  IF FOUND THEN
    -- A rejoin. The person still exists; only the grant was revoked. Someone
    -- who already set a password keeps it and needs no second invitation —
    -- sending one would be a password-reset link they did not ask for.
    v_user := v_prior.user_id;
    v_send := (v_prior.status <> 'active');
  ELSE
    v_user := gen_random_uuid();
    v_new  := true;
    INSERT INTO app_user (id, email, full_name, status, created_by, updated_by)
    VALUES (v_user, p_email, p_full_name, 'invited', v_me, v_me);
  END IF;

  INSERT INTO user_role_grant (user_id, org_id, role_id, scope, granted_by)
  VALUES (v_user, v_org, v_role, p_scope, v_me);

  IF v_send THEN
    INSERT INTO invitation (token_hash, email, org_id, role_id, scope,
                            user_id, invited_by, expires_at)
    VALUES (p_token_hash, p_email, v_org, v_role, p_scope,
            v_user, v_me, now() + p_ttl);
  END IF;

  RETURN QUERY SELECT v_user, v_new, v_send;
END
$fn$;

REVOKE EXECUTE ON FUNCTION invite_member(citext,text,text,grant_scope,text,interval) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION invite_member(citext,text,text,grant_scope,text,interval) TO sourcehub_app;
REVOKE EXECUTE ON FUNCTION org_member_by_email(citext) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_member_by_email(citext) TO sourcehub_app;


-- ---------------------------------------------------------------------------
-- 6 · Revoking access must end the sessions
--
-- user_session_own (100_rls.sql:233) is USING (user_id = current_user_id()),
-- so an owner revoking somebody else updates ZERO rows — silently, because RLS
-- filters rather than errors. The refresh token stays live until it expires.
-- The same gap exists today in worker offboarding (network/service.py:474).
--
-- Narrow on purpose: it ends sessions only for a user who holds a grant in the
-- caller's own organisation, so it cannot be turned into a log-anyone-out.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION revoke_member_sessions(p_user_id uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_org uuid := current_org_id();
  v_n   int;
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'no organisation context' USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM 1 FROM user_role_grant
  WHERE  user_id = p_user_id AND org_id = v_org;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not a member of this organisation' USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE user_session
     SET revoked_at = now()
   WHERE user_id = p_user_id
     AND revoked_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END
$fn$;

REVOKE EXECUTE ON FUNCTION revoke_member_sessions(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION revoke_member_sessions(uuid) TO sourcehub_app;


-- ---------------------------------------------------------------------------
-- 7 · Acceptance must never reset an existing password
--
-- 110_auth_functions.sql:61 sets password_hash unconditionally for
-- inv.user_id. That is safe only while every invitation points at a freshly
-- created user with no password — which is exactly what this file changes,
-- because a rejoin reuses an existing app_user row.
--
-- Without this guard, an owner could invite an address that already has an
-- account and hand whoever opens the link a password change on it, bypassing
-- change_password's current-password check (identity/service.py:334) and the
-- verified-email loop of password_reset_create.
--
-- Replaced whole rather than patched, so the bootstrap and migration paths
-- keep producing one definition (verify-schema diffs them).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION invitation_accept(
  p_token_hash text, p_password_hash text, p_algo text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  inv invitation%ROWTYPE;
  v_has_password boolean;
BEGIN
  SELECT * INTO inv FROM invitation WHERE token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation not found' USING ERRCODE = 'no_data_found';
  END IF;
  IF inv.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'invitation revoked' USING ERRCODE = 'check_violation';
  END IF;
  IF inv.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'invitation already accepted' USING ERRCODE = 'check_violation';
  END IF;
  IF inv.expires_at < now() THEN
    RAISE EXCEPTION 'invitation expired' USING ERRCODE = 'check_violation';
  END IF;

  SELECT password_hash IS NOT NULL INTO v_has_password
  FROM   app_user WHERE id = inv.user_id;
  IF v_has_password THEN
    RAISE EXCEPTION 'this account already has a password; sign in instead'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE app_user
     SET password_hash = p_password_hash,
         password_algo = p_algo,
         password_updated_at = now(),
         status = 'active',
         email_verified_at = coalesce(email_verified_at, now()),
         must_change_password = false
   WHERE id = inv.user_id
     AND password_hash IS NULL;

  INSERT INTO user_password_history (user_id, password_hash, password_algo)
  VALUES (inv.user_id, p_password_hash, p_algo);

  UPDATE invitation SET accepted_at = now() WHERE id = inv.id;

  RETURN inv.user_id;
END
$fn$;
