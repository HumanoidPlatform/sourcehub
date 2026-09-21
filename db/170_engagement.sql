-- ============================================================================
-- 170 · Engagement — reminders that keep the crowd moving
--
-- An offer (130) is mailed once and an assignment (120) is a row the worker
-- may never open. Until now nothing ran on a clock to notice either. The
-- engage module (backend modules/engage) runs one pass every few minutes:
-- it finds workers who have not answered an offer, not started, are due
-- soon, overdue, or sitting on a rejection, and reminds them by email and on
-- the phone's bell. Every reminder it sends — and every one an aggregator
-- sends by hand from the console — is a row here.
--
--   * One row per (subject, kind, step) for the clock: the partial unique
--     indexes make a second pass over the same state a no-op even if two API
--     workers ever ran a pass together (they should not: pg_try_advisory_lock
--     guards the pass). A manual reminder is outside that key — an aggregator
--     may nudge twice.
--   * The subject is EITHER an offer recipient OR an assignment, never both;
--     the CHECK says so.
--   * engagement_orgs() is the one cross-organisation read, SECURITY DEFINER
--     like task_offer_lookup(): it answers only "which suppliers have live
--     work", and the pass then acts under each organisation's own context so
--     every write below passes the ordinary policies.
--   * Policies mirror task_offer_recipient: who was reminded is crowd
--     management. A worker never reads this table — the reminder they see
--     is the notification row it produced.
-- ============================================================================

CREATE TYPE reminder_kind AS ENUM (
  'offer_nudge',            -- half-way through the respond-by window
  'offer_closing',          -- the last day, with places left
  'assignment_start',       -- accepted, never started
  'assignment_due_soon',    -- due within two days
  'assignment_overdue',     -- past due_on, not submitted
  'assignment_rework'       -- rejected at gate 1, not restarted
);

CREATE TABLE engagement_reminder (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_org_id    uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  worker_user_id     uuid NOT NULL REFERENCES app_user(id)     ON DELETE RESTRICT,
  kind               reminder_kind NOT NULL,
  step               smallint NOT NULL DEFAULT 0 CHECK (step >= 0),  -- nth repeat of a repeating kind
  offer_recipient_id uuid REFERENCES task_offer_recipient(id) ON DELETE CASCADE,
  assignment_id      uuid REFERENCES task_assignment(id)      ON DELETE CASCADE,
  manual_by          uuid REFERENCES app_user(id),            -- NULL = the clock
  email              citext,                                  -- where it went, as sent
  sent_at            timestamptz,
  send_error         text,
  created_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT engagement_reminder_one_subject
    CHECK ((offer_recipient_id IS NULL) <> (assignment_id IS NULL))
);

-- the clock sends each (kind, step) once per subject; manual sends are outside that
CREATE UNIQUE INDEX engagement_reminder_offer_key
  ON engagement_reminder (offer_recipient_id, kind, step) WHERE manual_by IS NULL;
CREATE UNIQUE INDEX engagement_reminder_assignment_key
  ON engagement_reminder (assignment_id, kind, step) WHERE manual_by IS NULL;
CREATE INDEX engagement_reminder_offer_idx      ON engagement_reminder (offer_recipient_id, created_at DESC);
CREATE INDEX engagement_reminder_assignment_idx ON engagement_reminder (assignment_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Which suppliers have work a reminder could apply to. The pass calls this
-- with no org context and then opens one session per organisation returned.
-- STABLE: no writes. Returns ids only — nothing about the work itself.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION engagement_orgs() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT supplier_org_id FROM task_offer
  WHERE  status = 'open' AND respond_by > now()
  UNION
  SELECT supplier_org_id FROM task_assignment
  WHERE  status IN ('assigned', 'in_progress', 'rejected')
$fn$;

REVOKE EXECUTE ON FUNCTION engagement_orgs() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION engagement_orgs() TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
ALTER TABLE engagement_reminder ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_reminder FORCE  ROW LEVEL SECURITY;

CREATE POLICY engagement_reminder_select ON engagement_reminder FOR SELECT
  USING (is_platform_admin() OR supplier_org_id = current_org_id());

CREATE POLICY engagement_reminder_insert ON engagement_reminder FOR INSERT
  WITH CHECK (NOT is_worker() AND supplier_org_id = current_org_id());

CREATE POLICY engagement_reminder_update ON engagement_reminder FOR UPDATE
  USING      (supplier_org_id = current_org_id())
  WITH CHECK (supplier_org_id = current_org_id());

CREATE POLICY engagement_reminder_worker_select ON engagement_reminder AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker());

CREATE POLICY engagement_reminder_worker_insert ON engagement_reminder AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT is_worker());

CREATE POLICY engagement_reminder_worker_update ON engagement_reminder AS RESTRICTIVE FOR UPDATE
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

GRANT SELECT, INSERT, UPDATE ON engagement_reminder TO sourcehub_app;
GRANT SELECT ON engagement_reminder TO sourcehub_readonly;
