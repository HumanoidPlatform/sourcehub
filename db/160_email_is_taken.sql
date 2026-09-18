-- ============================================================================
-- 160 · email_is_taken — so onboarding refuses a clash at the form, not at
--       the moment of approval
--
-- app_user.email is unique platform-wide, and approve_onboarding_request()
-- INSERTs the first user unconditionally (step 4). An address already held by
-- somebody therefore raised a unique violation from inside the approval
-- transaction: a 500 to the operator, at the point where they had already
-- reviewed the request and pressed Approve, with nothing in the message to say
-- whether the platform was broken or the address was simply taken.
--
-- Checking it in application code is not possible from the caller's own
-- session. app_user_select shows an organisation only the people holding a live
-- grant in it, which is correct — and it means the clashing address is usually
-- one the caller cannot see. That is exactly the case that used to fail late,
-- so the check has to run above RLS.
--
-- Narrow on purpose, in the spirit of db/110: it answers one boolean, about one
-- address the caller has already typed, and cannot enumerate anything. It does
-- NOT say who holds it — that would turn an onboarding form into a directory.
-- ============================================================================

CREATE OR REPLACE FUNCTION email_is_taken(p_email citext)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE  email = p_email
      AND  deleted_at IS NULL
  )
$fn$;

REVOKE EXECUTE ON FUNCTION email_is_taken(citext) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION email_is_taken(citext) TO sourcehub_app;
