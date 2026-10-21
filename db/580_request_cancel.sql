-- ============================================================================
-- 580 · A client can cancel a published request, and delete a draft
--
-- A published request could not be withdrawn and a draft could not be deleted.
-- Nothing ever wrote request.status = 'cancelled', although db/001 has carried
-- the value from the start and modules/marketplace counts it among the states
-- a request's owner produces. A request that drew no bids read Published for
-- ever, and the bids on one its client had given up on stayed Submitted.
--
-- Cancelling (modules/marketplace cancel_request) is the client's, with a
-- reason, while the request is published and not awarded. Every submitted bid
-- becomes 'cancelled', a new proposal status that is neither a rejection nor
-- a withdrawal, and each bidder is told why. Every open conversation on the
-- request closes with the new reason 'request_cancelled'. A draft, which
-- nobody else has seen, is deleted instead: deleted_at, which every read
-- already filters.
--
-- What the database holds to, whatever a client's own row policy would let
-- it write:
--   * request_cancel_shape: cancelled_at is set exactly when the request is
--     cancelled, and a cancelled request carries a reason that is not blank
--   * request_cancel_guard: only a published request becomes cancelled, and a
--     cancelled one stays cancelled, its reason and stamps unchanged
--   * proposal_cancel_guard: only a bid on a cancelled request becomes
--     cancelled, and a cancelled bid stays cancelled. It reads the request as
--     the owner, so the caller's row policy cannot hide it into a false refusal
--
-- The enum value comes first, on its own: a transaction may not use an enum
-- value it added (migration 0063 commits it in an autocommit block), and
-- nothing below names it.
-- ============================================================================

ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE request ADD COLUMN cancelled_at  timestamptz;
ALTER TABLE request ADD COLUMN cancelled_by  uuid REFERENCES app_user(id);
ALTER TABLE request ADD COLUMN cancel_reason text;

ALTER TABLE request ADD CONSTRAINT request_cancel_shape CHECK (
  (status = 'cancelled') = (cancelled_at IS NOT NULL)
  AND (cancelled_at IS NULL OR (cancel_reason IS NOT NULL AND btrim(cancel_reason) <> ''))
  AND (cancel_reason IS NULL OR char_length(cancel_reason) <= 2000)
);

CREATE OR REPLACE FUNCTION request_cancel_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD.status = 'cancelled'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
          OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
          OR NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason) THEN
    RAISE EXCEPTION 'request %: a cancelled request stays cancelled', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND OLD.status <> 'published' THEN
    RAISE EXCEPTION 'request %: only a published request can be cancelled', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER request_cancel_guard BEFORE UPDATE ON request
  FOR EACH ROW EXECUTE FUNCTION request_cancel_guard();

CREATE OR REPLACE FUNCTION proposal_cancel_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'proposal %: a bid on a cancelled request stays cancelled', OLD.reference_code
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status
     AND NOT EXISTS (SELECT 1 FROM request r
                      WHERE r.id = NEW.request_id AND r.status = 'cancelled') THEN
    RAISE EXCEPTION 'proposal %: only a bid on a cancelled request can be cancelled',
      OLD.reference_code USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER proposal_cancel_guard BEFORE UPDATE ON proposal
  FOR EACH ROW EXECUTE FUNCTION proposal_cancel_guard();

ALTER TABLE rfp_thread DROP CONSTRAINT rfp_thread_closed_reason_check;
ALTER TABLE rfp_thread ADD CONSTRAINT rfp_thread_closed_reason_check
  CHECK (closed_reason IS NULL
         OR closed_reason IN ('awarded_elsewhere', 'contract_completed', 'request_cancelled'));

COMMENT ON COLUMN rfp_thread.closed_reason IS
  'awarded_elsewhere: a losing partner''s thread, closed at award. '
  'contract_completed: the winner''s, closed when the client approved the delivery. '
  'request_cancelled: every thread on a request its client cancelled';
COMMENT ON COLUMN request.cancelled_at IS
  'When the client cancelled the published request; set exactly when status is cancelled';
COMMENT ON COLUMN request.cancel_reason IS
  'Why the client cancelled it: shown to the client and to every partner that bid';
