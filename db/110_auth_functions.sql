-- ============================================================================
-- 110 · Authentication support functions
--
-- Login, invitation acceptance and password reset all happen BEFORE an org
-- context exists — and RLS therefore (correctly) shows them nothing. Each flow
-- gets one narrow SECURITY DEFINER function: it takes a hashed token or an
-- email, returns only what that step needs, and cannot enumerate anything.
--
-- Also carries two fixes to earlier files, kept here rather than edited in
-- place so a database built from the original files and then this one matches
-- a database built fresh:
--
--   1. write_audit_event becomes SECURITY DEFINER. As INVOKER its read of the
--      previous row's hash was RLS-filtered, so every org would have chained
--      onto ITS OWN last visible event and the single hash chain would have
--      silently forked into one chain per organisation.
--   2. A tenant may suspend organisations in its own network (the prototype's
--      "remove from network"), which needs an UPDATE policy the account axis
--      alone does not grant.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Invitations. The invitee is anonymous until the moment they accept.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION invitation_lookup(p_token_hash text)
RETURNS TABLE (
  invitation_id uuid, email citext, org_id uuid, org_name text,
  role_code text, user_id uuid, expires_at timestamptz,
  accepted_at timestamptz, revoked_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT i.id, i.email, i.org_id, o.name, r.code, i.user_id,
         i.expires_at, i.accepted_at, i.revoked_at
  FROM   invitation i
  JOIN   organisation o ON o.id = i.org_id
  JOIN   role r         ON r.id = i.role_id
  WHERE  i.token_hash = p_token_hash
$fn$;

CREATE OR REPLACE FUNCTION invitation_accept(
  p_token_hash text, p_password_hash text, p_algo text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  inv invitation%ROWTYPE;
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

  UPDATE app_user
     SET password_hash = p_password_hash,
         password_algo = p_algo,
         password_updated_at = now(),
         status = 'active',
         email_verified_at = coalesce(email_verified_at, now()),
         must_change_password = false
   WHERE id = inv.user_id;

  INSERT INTO user_password_history (user_id, password_hash, password_algo)
  VALUES (inv.user_id, p_password_hash, p_algo);

  UPDATE invitation SET accepted_at = now() WHERE id = inv.id;

  RETURN inv.user_id;
END
$fn$;

-- ---------------------------------------------------------------------------
-- Sessions. A refresh token arrives before any context is set; this resolves
-- it to (user, org) so the API can then open a properly scoped session.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION session_lookup(p_token_hash text)
RETURNS TABLE (
  session_id uuid, user_id uuid, org_id uuid,
  expires_at timestamptz, revoked_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT s.id, s.user_id, s.org_id, s.expires_at, s.revoked_at
  FROM   user_session s
  WHERE  s.token_hash = p_token_hash
$fn$;

-- ---------------------------------------------------------------------------
-- Password reset. The create step deliberately returns nothing: whether the
-- email exists must not be observable from the response.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION password_reset_create(
  p_email citext, p_token_hash text, p_ttl interval DEFAULT interval '1 hour'
) RETURNS TABLE (user_id uuid, full_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_user app_user%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM app_user
   WHERE email = p_email AND deleted_at IS NULL AND status IN ('active','locked');
  IF NOT FOUND THEN
    RETURN;  -- silent: no enumeration
  END IF;

  INSERT INTO user_token (user_id, purpose, token_hash, expires_at)
  VALUES (v_user.id, 'password_reset', p_token_hash, now() + p_ttl);

  RETURN QUERY SELECT v_user.id, v_user.full_name;
END
$fn$;

CREATE OR REPLACE FUNCTION password_reset_consume(
  p_token_hash text, p_password_hash text, p_algo text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE tok user_token%ROWTYPE;
BEGIN
  SELECT * INTO tok FROM user_token
   WHERE token_hash = p_token_hash AND purpose = 'password_reset' FOR UPDATE;
  IF NOT FOUND OR tok.consumed_at IS NOT NULL OR tok.expires_at < now() THEN
    RAISE EXCEPTION 'reset token invalid' USING ERRCODE = 'check_violation';
  END IF;

  UPDATE app_user
     SET password_hash = p_password_hash, password_algo = p_algo,
         password_updated_at = now(), must_change_password = false,
         failed_login_count = 0, locked_until = NULL,
         status = CASE WHEN status = 'locked' THEN 'active' ELSE status END
   WHERE id = tok.user_id;

  INSERT INTO user_password_history (user_id, password_hash, password_algo)
  VALUES (tok.user_id, p_password_hash, p_algo);

  UPDATE user_token SET consumed_at = now() WHERE id = tok.id;

  RETURN tok.user_id;
END
$fn$;

-- ---------------------------------------------------------------------------
-- Fix 1 — the audit chain must not fork.
--
-- write_audit_event reads the last row's hash to chain onto. As SECURITY
-- INVOKER that read ran under the caller's RLS and each org saw only its own
-- events — so each org chained onto a different "last" row and there was no
-- single tamper-evident chain at all. DEFINER makes the append see the true
-- head. The function still records the caller's own context as the actor.
-- ---------------------------------------------------------------------------
ALTER FUNCTION write_audit_event(text, text, uuid[], jsonb, uuid, uuid) SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Fix 2 — a tenant manages its own network.
--
-- The prototype lets a tenant remove a partner from its network. Here that is
-- a suspension (soft — the org and its history remain), and it needs an UPDATE
-- policy: the account-axis policy only lets an org update itself.
-- ---------------------------------------------------------------------------
CREATE POLICY organisation_update_network ON organisation FOR UPDATE
  USING      (parent_org_id = current_org_id())
  WITH CHECK (parent_org_id = current_org_id());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION invitation_lookup(text)                        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION invitation_accept(text, text, text)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION session_lookup(text)                           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION password_reset_create(citext, text, interval)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION password_reset_consume(text, text, text)       FROM PUBLIC;

GRANT EXECUTE ON FUNCTION invitation_lookup(text)                        TO sourcehub_app;
GRANT EXECUTE ON FUNCTION invitation_accept(text, text, text)            TO sourcehub_app;
GRANT EXECUTE ON FUNCTION session_lookup(text)                           TO sourcehub_app;
GRANT EXECUTE ON FUNCTION password_reset_create(citext, text, interval)  TO sourcehub_app;
GRANT EXECUTE ON FUNCTION password_reset_consume(text, text, text)       TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- Fix 3 — org listing at login time.
--
-- user_organisations() is called at the one moment no org context exists yet:
-- immediately after the credential check, to decide which org the session will
-- carry. As INVOKER it saw nothing there. DEFINER is safe here because the
-- argument is the user id the API has just authenticated, and only
-- sourcehub_app may execute it.
-- ---------------------------------------------------------------------------
ALTER FUNCTION user_organisations(uuid) SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- platform_org_id() — the one organisation every context may address.
--
-- A tenant submitting an onboarding request notifies Ops; the ledger writes
-- system records under the platform org. Neither can SELECT the platform row
-- through RLS, and neither needs to — they need its id, nothing else.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION platform_org_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT id FROM organisation WHERE kind = 'platform' LIMIT 1
$fn$;

REVOKE EXECUTE ON FUNCTION platform_org_id() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION platform_org_id() TO sourcehub_app, sourcehub_readonly;

-- ---------------------------------------------------------------------------
-- Fix 4 — a bidder is visible to the client it bids to.
--
-- The contract-traversal rule alone made bidders invisible at exactly the
-- moment the client must compare them: before any contract exists. The
-- prototype's comparison table shows each bidder's name and QA track record,
-- so the act of proposing discloses the proposer to that client — and to
-- no one else.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION org_visible_via_proposal(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM proposal p
    JOIN request r ON r.id = p.request_id
    WHERE p.partner_org_id = p_org_id
      AND r.client_org_id = current_org_id()
      AND p.deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION org_visible_via_proposal(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_visible_via_proposal(uuid) TO sourcehub_app, sourcehub_readonly;

CREATE POLICY organisation_select_bidders ON organisation FOR SELECT
  USING (org_visible_via_proposal(id));

CREATE POLICY tenant_profile_select_bidders ON tenant_profile FOR SELECT
  USING (org_visible_via_proposal(org_id));

-- ---------------------------------------------------------------------------
-- Fix 5 — the balance check must see both legs.
--
-- assert_ledger_balanced is a DEFERRED trigger: it runs at COMMIT, under
-- whatever org context the transaction ends with. A client-context commit saw
-- only the client-side leg of a perfectly balanced transaction and declared it
-- out of balance by the other half. An integrity invariant is about ALL rows
-- by definition, so it runs as definer.
-- ---------------------------------------------------------------------------
ALTER FUNCTION assert_ledger_balanced() SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Fix 6 — a partner keeps sight of every request it has bid on.
--
-- After award the request leaves the open marketplace, and the losing bidders'
-- own proposal history went dark with it: their bids joined to a request row
-- they could no longer see. Having bid on a request is a durable reason to see
-- it. DEFINER is not optional here — request's policy referencing proposal
-- while proposal's references request would recurse.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_has_my_proposal(p_request_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM proposal p
    WHERE p.request_id = p_request_id
      AND p.partner_org_id = current_org_id()
      AND p.deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION request_has_my_proposal(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION request_has_my_proposal(uuid) TO sourcehub_app, sourcehub_readonly;

CREATE POLICY request_select_bidder ON request FOR SELECT
  USING (request_has_my_proposal(id));

-- ---------------------------------------------------------------------------
-- Fix 7 — siblings in one network see each other; rival networks never do.
--
-- An aggregator borrows from the sponsors REGISTERED IN ITS OWN TENANT'S
-- NETWORK ("Equipment is drawn from your registered device sponsors"), which
-- means a supplier must see its sibling sponsors and their inventory before
-- any loan exists. The network axis is unharmed: visibility requires the SAME
-- parent, and a rival tenant's network has a different one.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION org_is_my_network_sibling(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM organisation o
    WHERE o.id = p_org_id
      AND o.parent_org_id IS NOT NULL
      AND o.parent_org_id = (SELECT parent_org_id FROM organisation
                              WHERE id = current_org_id())
  )
$fn$;

REVOKE EXECUTE ON FUNCTION org_is_my_network_sibling(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_is_my_network_sibling(uuid) TO sourcehub_app, sourcehub_readonly;

CREATE POLICY organisation_select_siblings ON organisation FOR SELECT
  USING (org_is_my_network_sibling(id));

CREATE POLICY equipment_select_siblings ON equipment FOR SELECT
  USING (org_is_my_network_sibling(sponsor_org_id));

-- ---------------------------------------------------------------------------
-- Fix 8 — the reviewing partner moves the submission it reviews.
--
-- Gate 2 closes a submission (accepted/rejected), and the reviewer is the
-- PARTNER — but submission_write only admitted the supplier, so the partner's
-- verdict updated zero rows and every submission stayed 'submitted' forever.
-- The partner may update submissions under its own contracts; creating them
-- remains the supplier's alone.
-- ---------------------------------------------------------------------------
CREATE POLICY submission_update_reviewer ON submission FOR UPDATE
  USING (EXISTS (SELECT 1 FROM task t JOIN contract c ON c.id = t.contract_id
                  WHERE t.id = submission.task_id
                    AND c.partner_org_id = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM task t JOIN contract c ON c.id = t.contract_id
                       WHERE t.id = submission.task_id
                         AND c.partner_org_id = current_org_id()));

-- ---------------------------------------------------------------------------
-- Fix 9 — the client is visible to the partner that bids to it.
--
-- The mirror of Fix 4, and a deliberate widening of the confidentiality model
-- rather than a repair. Fix 4 made the marketplace one-directional: the client
-- learned who bid, the bidder learned the client only on award, through
-- org_visible_via_contract. A partner comparing opportunities has the same
-- need in reverse — who is buying, in what industry, since when — and the
-- console cannot show it while the client's row is invisible.
--
-- The cost is real and accepted: bidding now discloses the buyer, so a partner
-- can enumerate clients by proposing on requests it has no intention of
-- winning. If that becomes a problem the answer is rate-limiting or reputation,
-- not re-hiding the row, because the console would go dark with it.
--
-- Scope: the organisation and its client_profile, and only for a client this
-- org has actually bid to. Withdrawn and rejected bids still count — having
-- bid is the durable fact, exactly as in Fix 4 and Fix 6.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION org_visible_via_my_proposal(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM request r
    JOIN proposal p ON p.request_id = r.id
    WHERE r.client_org_id = p_org_id
      AND p.partner_org_id = current_org_id()
      AND p.deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION org_visible_via_my_proposal(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION org_visible_via_my_proposal(uuid) TO sourcehub_app, sourcehub_readonly;

CREATE POLICY organisation_select_my_clients ON organisation FOR SELECT
  USING (org_visible_via_my_proposal(id));

CREATE POLICY client_profile_select_my_clients ON client_profile FOR SELECT
  USING (org_visible_via_my_proposal(org_id));


-- ---------------------------------------------------------------------------
-- Fix 10 · Resolving a capture's destination from inside a worker's session.
--
-- Captures are written to the client's own storage, but the session doing the
-- writing belongs to a worker in an aggregator org: storage_target_select is
-- owner-only, and storage_target_worker_deny closes it further. Every one of
-- those policies is correct — a supplier has no business reading a client's
-- bucket credentials — and together they make the row unreadable by precisely
-- the context that needs it.
--
-- The same shape as worker_holds_assignment: a definer function that answers
-- one narrow question, rather than opening the table. These two take an id the
-- caller has already been authorised for (media.presign_capture checks the
-- assignment belongs to the caller before it gets here) and return the row.
--
-- Granted to sourcehub_app ONLY, never to sourcehub_readonly: unlike every
-- other function in this file these return credential material, and the
-- read-only role exists for analytics.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION storage_destination_for_contract(p_contract uuid)
RETURNS storage_target
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT st.* FROM storage_target st
  JOIN contract c ON c.storage_target_id = st.id
  WHERE c.id = p_contract AND st.deleted_at IS NULL
$fn$;

CREATE OR REPLACE FUNCTION storage_destination_by_id(p_target uuid)
RETURNS storage_target
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT st.* FROM storage_target st
  WHERE st.id = p_target AND st.deleted_at IS NULL
$fn$;

REVOKE EXECUTE ON FUNCTION storage_destination_for_contract(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION storage_destination_by_id(uuid)        FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION storage_destination_for_contract(uuid) TO sourcehub_app;
GRANT  EXECUTE ON FUNCTION storage_destination_by_id(uuid)        TO sourcehub_app;
