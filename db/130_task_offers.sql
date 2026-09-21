-- ============================================================================
-- 130 · Task offers — a task broadcast to the crowd, first come first served
--
-- Until now the aggregator assigned a task one worker at a time (120,
-- task_assignment). An offer is the aggregator saying it once: "N places,
-- Q units each, by this date" — and every recipient getting an email with
-- Accept and Decline. The first N accepts each become an ordinary
-- task_assignment row; everybody after that is told the task is closed.
--
--   * The recipient row IS the credential. Each email carries an opaque
--     token whose sha256 lives here (as invitation.token_hash does); the raw
--     token is never stored. task_offer_lookup() is the one sanctioned read
--     without an org context, shaped like invitation_lookup().
--   * accepted_count is a stored counter guarded by a CHECK against
--     worker_limit, so the database refuses an over-fill even if the service
--     regresses. The service serialises accepts with FOR UPDATE on the offer;
--     the CHECK is the brace to that belt.
--   * 'expired' is derived (respond_by < now()), never stored. The clock
--     that does exist (170, the reminder pass) reads it the same way and
--     flips nothing.
--   * Policies mirror task_assignment minus the partner clause: who was
--     ASKED is crowd management, not delivery evidence.
-- ============================================================================

CREATE TYPE task_offer_status   AS ENUM ('open', 'filled', 'closed');
CREATE TYPE task_offer_response AS ENUM ('accepted', 'declined');

CREATE TABLE task_offer (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          uuid NOT NULL REFERENCES task(id)         ON DELETE RESTRICT,
  contract_id      uuid NOT NULL REFERENCES contract(id)     ON DELETE RESTRICT,  -- denormalised, as task_assignment
  supplier_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,  -- = task.assignee_org_id

  worker_limit     integer NOT NULL CHECK (worker_limit > 0),   -- places
  quantity         integer NOT NULL CHECK (quantity > 0),       -- units per accepting worker
  instructions     text,
  due_on           date,
  respond_by       timestamptz NOT NULL,                        -- the service defaults it; no open-ended tokens
  status           task_offer_status NOT NULL DEFAULT 'open',
  accepted_count   integer NOT NULL DEFAULT 0
                   CHECK (accepted_count >= 0 AND accepted_count <= worker_limit),

  created_by       uuid NOT NULL REFERENCES app_user(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  closed_at        timestamptz,
  closed_by        uuid REFERENCES app_user(id),

  CONSTRAINT task_offer_closed_consistent CHECK ((status = 'open') = (closed_at IS NULL))
);

CREATE INDEX task_offer_task_idx ON task_offer (task_id, status);
-- one open offer per task: the budget arithmetic and the console stay simple
CREATE UNIQUE INDEX task_offer_one_open_key ON task_offer (task_id) WHERE status = 'open';

CREATE TRIGGER task_offer_updated_at BEFORE UPDATE ON task_offer
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE task_offer_recipient (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id         uuid NOT NULL REFERENCES task_offer(id)    ON DELETE CASCADE,
  supplier_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,  -- denormalised for RLS
  worker_user_id   uuid NOT NULL REFERENCES app_user(id)     ON DELETE RESTRICT,
  email            citext NOT NULL,                           -- where it went, as sent
  token_hash       text NOT NULL UNIQUE,                      -- sha256 of the link token; raw never stored
  sent_at          timestamptz,
  send_error       text,
  response         task_offer_response,                       -- NULL until the worker answers
  responded_at     timestamptz,
  assignment_id    uuid REFERENCES task_assignment(id) ON DELETE RESTRICT,
  created_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (offer_id, worker_user_id),
  CONSTRAINT task_offer_recipient_answered CHECK ((response IS NULL) = (responded_at IS NULL)),
  CONSTRAINT task_offer_recipient_assignment_on_accept
    CHECK (assignment_id IS NULL OR response = 'accepted')
);

CREATE INDEX task_offer_recipient_offer_idx  ON task_offer_recipient (offer_id);
CREATE INDEX task_offer_recipient_worker_idx ON task_offer_recipient (worker_user_id);

-- ---------------------------------------------------------------------------
-- Resolving a link token. The worker is anonymous when they click; this is
-- the one read that answers without an org context, and it answers only for
-- the exact hash — nothing can be enumerated through it. STABLE: no writes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION task_offer_lookup(p_token_hash text)
RETURNS TABLE (
  recipient_id uuid, offer_id uuid, supplier_org_id uuid, org_name text, created_by uuid,
  worker_user_id uuid, worker_name text, worker_email citext, grant_live boolean,
  task_id uuid, task_ref text, task_title text, task_instructions text,
  task_due_on date, task_status task_status, target_unit text,
  quantity integer, instructions text, due_on date, respond_by timestamptz,
  offer_status task_offer_status, worker_limit integer, accepted_count integer,
  response task_offer_response, responded_at timestamptz, assignment_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, o.id, o.supplier_org_id, org.name, o.created_by,
         r.worker_user_id, coalesce(w.display_name, u.full_name), r.email,
         EXISTS (SELECT 1 FROM user_role_grant g JOIN role rl ON rl.id = g.role_id
                 WHERE g.user_id = r.worker_user_id AND g.org_id = o.supplier_org_id
                   AND rl.code = 'worker' AND g.revoked_at IS NULL),
         t.id, t.reference_code, t.title, t.instructions,
         t.due_on, t.status, t.target_unit,
         o.quantity, o.instructions, o.due_on, o.respond_by,
         o.status, o.worker_limit, o.accepted_count,
         r.response, r.responded_at, r.assignment_id
  FROM   task_offer_recipient r
  JOIN   task_offer   o   ON o.id = r.offer_id
  JOIN   task         t   ON t.id = o.task_id
  JOIN   organisation org ON org.id = o.supplier_org_id
  JOIN   app_user     u   ON u.id = r.worker_user_id
  LEFT JOIN crowd_worker w ON w.user_id = r.worker_user_id
                          AND w.aggregator_org_id = o.supplier_org_id
                          AND w.deleted_at IS NULL
  WHERE  r.token_hash = p_token_hash
$fn$;

REVOKE EXECUTE ON FUNCTION task_offer_lookup(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION task_offer_lookup(text) TO sourcehub_app;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
ALTER TABLE task_offer ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_offer FORCE  ROW LEVEL SECURITY;

CREATE POLICY task_offer_select ON task_offer FOR SELECT
  USING (is_platform_admin() OR supplier_org_id = current_org_id());

CREATE POLICY task_offer_insert ON task_offer FOR INSERT
  WITH CHECK (NOT is_worker() AND supplier_org_id = current_org_id());

CREATE POLICY task_offer_update ON task_offer FOR UPDATE
  USING      (supplier_org_id = current_org_id())
  WITH CHECK (supplier_org_id = current_org_id());

-- A worker session sees only offers addressed to them. The subquery reads
-- task_offer_recipient under its own policies and never re-enters task_offer,
-- so there is no recursion.
CREATE POLICY task_offer_worker_select ON task_offer AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR EXISTS (
    SELECT 1 FROM task_offer_recipient r
    WHERE r.offer_id = task_offer.id AND r.worker_user_id = current_user_id()));

CREATE POLICY task_offer_worker_insert ON task_offer AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT is_worker());

CREATE POLICY task_offer_worker_update ON task_offer AS RESTRICTIVE FOR UPDATE
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

ALTER TABLE task_offer_recipient ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_offer_recipient FORCE  ROW LEVEL SECURITY;

CREATE POLICY task_offer_recipient_select ON task_offer_recipient FOR SELECT
  USING (is_platform_admin() OR supplier_org_id = current_org_id());

CREATE POLICY task_offer_recipient_insert ON task_offer_recipient FOR INSERT
  WITH CHECK (NOT is_worker() AND supplier_org_id = current_org_id());

CREATE POLICY task_offer_recipient_update ON task_offer_recipient FOR UPDATE
  USING      (supplier_org_id = current_org_id())
  WITH CHECK (supplier_org_id = current_org_id());

CREATE POLICY task_offer_recipient_worker_select ON task_offer_recipient AS RESTRICTIVE FOR SELECT
  USING (NOT is_worker() OR worker_user_id = current_user_id());

CREATE POLICY task_offer_recipient_worker_insert ON task_offer_recipient AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT is_worker());

CREATE POLICY task_offer_recipient_worker_update ON task_offer_recipient AS RESTRICTIVE FOR UPDATE
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

GRANT SELECT, INSERT, UPDATE ON task_offer, task_offer_recipient TO sourcehub_app;
GRANT SELECT ON task_offer, task_offer_recipient TO sourcehub_readonly;
