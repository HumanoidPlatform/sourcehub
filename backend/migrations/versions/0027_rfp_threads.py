"""Conversations: one private thread per request per delivery partner.

Three tables — rfp_thread, the append-only rfp_message, and rfp_thread_read
(one last-read seq per organisation) — whose policies admit exactly the two
parties and let Ops read; two SECURITY DEFINER helpers so a partner that asked
keeps sight of the request after award and the two parties may read each
other's name; and the REVOKE/GRANT that makes "nothing is edited or deleted"
a database fact rather than a convention.

SQL copied verbatim from db/250_rfp_threads.sql so the bootstrap and migration
paths keep producing identical schemas (make verify-schema); a test asserts
the two stay byte-identical.

Executed one statement at a time — the same splitter 0012 to 0014, 0018 to 0020,
0022 and 0024 to 0026 use, because asyncpg refuses two statements in one execute.

Revision ID: 0027
Revises: 0026
"""

from alembic import op

revision = "0027"
down_revision = "0026"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 250 · Conversations: one private thread per request per delivery partner
--
-- A partner deciding whether to bid could not ask the client anything, and a
-- bid's notes never reached the client. This adds one conversation per
-- (request, partner) between the client and that partner only: opened by the
-- partner, replied to by the client, kept beside the bid, continued through
-- delivery for the winner and read-only afterwards. Nothing in it is edited
-- or deleted.
--
-- Blind bidding is preserved by the policies, not by the console: a rival's
-- thread is not hidden from a partner, it does not exist for it.
--
--   * rfp_thread: the conversation. client_org_id and partner_org_id are
--     copied from the request so every policy is two column compares, as
--     contract does. The one UPDATE the table allows is the close, by the
--     client (award() and approve_delivery() both run in the client's
--     session), and a trigger keeps a closed thread closed.
--   * rfp_message: append-only. seq is 1, 2, 3… within the thread, assigned
--     under the thread's advisory lock — a total order, so the read stamp and
--     the page cursor are both a seq and no clock race can mis-mark a message.
--     sender_name is a snapshot: app_user_select (100) hides the other
--     organisation's people, so the client could never join it.
--   * rfp_thread_read: one last-read seq per organisation. Its own table so
--     both parties can stamp without holding the thread's UPDATE policy.
--   * request_has_my_thread(): a partner that asked keeps sight of the request
--     after award, exactly as request_has_my_proposal (110) keeps a bidder's.
--   * org_visible_via_thread(): the two parties may read each other's name,
--     the shape of org_visible_via_proposal (110). This discloses an asker's
--     name to the client before any bid — the same trade Fix 4 made for a bid.
--
-- Ops (is_platform_admin) reads every thread and posts in none: the INSERT
-- policies say so by name, and the service audits each read that shows new
-- content. 000's default privileges hand sourcehub_app full DML on any new
-- table; they are taken back below to what each table is for.
-- ============================================================================

CREATE TABLE rfp_thread (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES request(id)      ON DELETE RESTRICT,
  client_org_id   uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  partner_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  opened_by       uuid NOT NULL REFERENCES app_user(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  closed_reason   text,
  closed_by       uuid REFERENCES app_user(id),
  CONSTRAINT rfp_thread_parties_differ  CHECK (client_org_id <> partner_org_id),
  CONSTRAINT rfp_thread_one_per_partner UNIQUE (request_id, partner_org_id),
  CONSTRAINT rfp_thread_closed_reason_check
    CHECK (closed_reason IS NULL OR closed_reason IN ('awarded_elsewhere', 'contract_completed')),
  CONSTRAINT rfp_thread_closed_consistent CHECK ((closed_at IS NULL) = (closed_reason IS NULL))
);

CREATE INDEX rfp_thread_partner_idx ON rfp_thread (partner_org_id);
CREATE INDEX rfp_thread_client_idx  ON rfp_thread (client_org_id);

CREATE TRIGGER rfp_thread_updated_at BEFORE UPDATE ON rfp_thread
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- A closed conversation stays closed: the close is the one UPDATE the table
-- allows, and it is irreversible.
CREATE OR REPLACE FUNCTION rfp_thread_close_once() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD.closed_at IS NOT NULL
     AND (NEW.closed_at IS DISTINCT FROM OLD.closed_at
          OR NEW.closed_reason IS DISTINCT FROM OLD.closed_reason) THEN
    RAISE EXCEPTION 'a closed conversation stays closed' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER rfp_thread_close_once BEFORE UPDATE ON rfp_thread
  FOR EACH ROW EXECUTE FUNCTION rfp_thread_close_once();

CREATE TABLE rfp_message (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id      uuid NOT NULL REFERENCES rfp_thread(id)   ON DELETE RESTRICT,
  seq            integer NOT NULL CHECK (seq > 0),
  sender_org_id  uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  sender_user_id uuid NOT NULL REFERENCES app_user(id),
  sender_name    text NOT NULL,
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rfp_message_seq_key    UNIQUE (thread_id, seq),
  CONSTRAINT rfp_message_body_shape CHECK (btrim(body) <> '' AND char_length(body) <= 4000)
);

-- Append-only at the rewrite level too, as audit_event is (090).
CREATE RULE rfp_message_no_update AS ON UPDATE TO rfp_message DO INSTEAD NOTHING;
CREATE RULE rfp_message_no_delete AS ON DELETE TO rfp_message DO INSTEAD NOTHING;

CREATE TABLE rfp_thread_read (
  thread_id     uuid NOT NULL REFERENCES rfp_thread(id)   ON DELETE RESTRICT,
  org_id        uuid NOT NULL REFERENCES organisation(id) ON DELETE RESTRICT,
  last_read_seq integer NOT NULL DEFAULT 0 CHECK (last_read_seq >= 0),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, org_id)
);

COMMENT ON TABLE  rfp_thread IS
  'One private conversation per request per delivery partner, between the client and that partner only';
COMMENT ON COLUMN rfp_thread.closed_reason IS
  'awarded_elsewhere: a losing partner''s thread, closed at award. '
  'contract_completed: the winner''s, closed when the client approved the delivery';
COMMENT ON COLUMN rfp_message.seq IS
  'The message''s number within its thread, assigned under the thread lock: the page cursor and the read stamp';
COMMENT ON COLUMN rfp_message.sender_name IS
  'Snapshot at send: the other organisation cannot read app_user for this person';
COMMENT ON TABLE  rfp_thread_read IS
  'Per-organisation last-read seq; unread = the other side''s messages with a seq above it';

-- ---------------------------------------------------------------------------
-- Having asked is a durable reason to see the request (110's Fix 6, for a
-- thread instead of a bid), and the two parties may read each other's name
-- (110's Fix 4). Both DEFINER: a request policy must not re-enter request.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_has_my_thread(p_request_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM rfp_thread t
    WHERE t.request_id = p_request_id
      AND t.partner_org_id = current_org_id()
  )
$fn$;

CREATE OR REPLACE FUNCTION org_visible_via_thread(p_org_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM rfp_thread t
    WHERE (t.client_org_id  = current_org_id() AND t.partner_org_id = p_org_id)
       OR (t.partner_org_id = current_org_id() AND t.client_org_id  = p_org_id)
  )
$fn$;

REVOKE EXECUTE ON FUNCTION request_has_my_thread(uuid)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION org_visible_via_thread(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION request_has_my_thread(uuid)  TO sourcehub_app, sourcehub_readonly;
GRANT  EXECUTE ON FUNCTION org_visible_via_thread(uuid) TO sourcehub_app, sourcehub_readonly;

CREATE POLICY request_select_thread ON request FOR SELECT
  USING (request_has_my_thread(id));

CREATE POLICY organisation_select_thread_parties ON organisation FOR SELECT
  USING (org_visible_via_thread(id));

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
ALTER TABLE rfp_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_thread FORCE  ROW LEVEL SECURITY;

-- Ops reads every thread; a party reads its own. Nobody else: a rival
-- partner's thread on the same request is simply absent.
CREATE POLICY rfp_thread_select ON rfp_thread FOR SELECT
  USING (is_platform_admin()
         OR client_org_id  = current_org_id()
         OR partner_org_id = current_org_id());

-- Only a delivery partner opens one, in its own name, on a request it can
-- read that is still open for proposals — or, once awarded to it, while its
-- contract is not yet completed.
CREATE POLICY rfp_thread_insert ON rfp_thread FOR INSERT
  WITH CHECK (
       NOT is_platform_admin()
    AND current_org_kind() = 'tenant'
    AND partner_org_id = current_org_id()
    AND opened_by      = current_user_id()
    AND EXISTS (SELECT 1 FROM request r
                 WHERE r.id = rfp_thread.request_id
                   AND r.client_org_id = rfp_thread.client_org_id
                   AND r.deleted_at IS NULL
                   AND (r.status = 'published'
                        OR EXISTS (SELECT 1 FROM contract c
                                    WHERE c.request_id = r.id
                                      AND c.partner_org_id = current_org_id()
                                      AND c.status <> 'completed')))
  );

-- The client closes, at award and at completion. The partner never updates.
CREATE POLICY rfp_thread_update ON rfp_thread FOR UPDATE
  USING      (client_org_id = current_org_id())
  WITH CHECK (client_org_id = current_org_id());

ALTER TABLE rfp_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_message FORCE  ROW LEVEL SECURITY;

-- Whoever can see the thread reads its messages. The subquery reads
-- rfp_thread under its own policies and rfp_thread never re-enters
-- rfp_message, so there is no recursion.
CREATE POLICY rfp_message_select ON rfp_message FOR SELECT
  USING (EXISTS (SELECT 1 FROM rfp_thread t WHERE t.id = rfp_message.thread_id));

-- A party, in its own name, while the thread is open. Ops reads the thread
-- and is refused here by name.
CREATE POLICY rfp_message_insert ON rfp_message FOR INSERT
  WITH CHECK (
       NOT is_platform_admin()
    AND sender_org_id  = current_org_id()
    AND sender_user_id = current_user_id()
    AND EXISTS (SELECT 1 FROM rfp_thread t
                 WHERE t.id = rfp_message.thread_id
                   AND t.closed_at IS NULL
                   AND (t.client_org_id  = current_org_id()
                     OR t.partner_org_id = current_org_id()))
  );

ALTER TABLE rfp_thread_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_thread_read FORCE  ROW LEVEL SECURITY;

-- Both stamps are readable by both parties: that is "seen by the other side".
CREATE POLICY rfp_thread_read_select ON rfp_thread_read FOR SELECT
  USING (EXISTS (SELECT 1 FROM rfp_thread t WHERE t.id = rfp_thread_read.thread_id));

CREATE POLICY rfp_thread_read_insert ON rfp_thread_read FOR INSERT
  WITH CHECK (
       NOT is_platform_admin()
    AND org_id = current_org_id()
    AND EXISTS (SELECT 1 FROM rfp_thread t
                 WHERE t.id = rfp_thread_read.thread_id
                   AND (t.client_org_id  = current_org_id()
                     OR t.partner_org_id = current_org_id()))
  );

CREATE POLICY rfp_thread_read_update ON rfp_thread_read FOR UPDATE
  USING      (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Crowd resources are never parties (120's shape).
CREATE POLICY rfp_thread_worker_deny ON rfp_thread AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());
CREATE POLICY rfp_message_worker_deny ON rfp_message AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());
CREATE POLICY rfp_thread_read_worker_deny ON rfp_thread_read AS RESTRICTIVE FOR ALL
  USING (NOT is_worker()) WITH CHECK (NOT is_worker());

-- What each table is for, and nothing more. Messages: no UPDATE, no DELETE.
REVOKE ALL ON rfp_thread, rfp_message, rfp_thread_read FROM sourcehub_app;
GRANT SELECT, INSERT ON rfp_thread TO sourcehub_app;
GRANT UPDATE (closed_at, closed_reason, closed_by) ON rfp_thread TO sourcehub_app;
GRANT SELECT, INSERT ON rfp_message TO sourcehub_app;
GRANT SELECT, INSERT, UPDATE ON rfp_thread_read TO sourcehub_app;
GRANT SELECT ON rfp_thread, rfp_message, rfp_thread_read TO sourcehub_readonly;
"""

_DOWN = """
DROP POLICY IF EXISTS organisation_select_thread_parties ON organisation;

DROP POLICY IF EXISTS request_select_thread ON request;

DROP FUNCTION IF EXISTS org_visible_via_thread(uuid);

DROP FUNCTION IF EXISTS request_has_my_thread(uuid);

DROP TABLE IF EXISTS rfp_thread_read;

DROP TABLE IF EXISTS rfp_message;

DROP TABLE IF EXISTS rfp_thread;

DROP FUNCTION IF EXISTS rfp_thread_close_once();
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
