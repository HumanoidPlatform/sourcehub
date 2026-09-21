"""Engagement: reminders that keep the crowd moving.

An offer was mailed once and an assignment could sit unopened for weeks; nothing
in the stack ran on a clock. The engage module now runs a pass every few minutes
and records every reminder it (or an aggregator, by hand) sends in
engagement_reminder. engagement_orgs() is the one cross-organisation read the
pass needs, SECURITY DEFINER like task_offer_lookup().

SQL copied verbatim from db/170_engagement.sql so the bootstrap and migration
paths keep producing identical schemas (make verify-schema). Executed one
statement at a time: split on a semicolon at end of line, except inside the
$fn$ body — the same splitter 0012 to 0014 use.

Revision ID: 0018
Revises: 0017
"""

from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None

_UP = r"""

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
    op.execute("DROP FUNCTION IF EXISTS engagement_orgs()")
    op.execute("DROP TABLE IF EXISTS engagement_reminder")
    op.execute("DROP TYPE IF EXISTS reminder_kind")
