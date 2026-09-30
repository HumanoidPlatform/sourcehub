"""Ready for managed PostgreSQL: no FORCE, narrow rights, wider codes, 2027-28.

Four changes, one reason: a managed server (Azure Flexible Server, RDS, Cloud
SQL) has no superuser, and the schema was written on servers that had one.

  1. FORCE ROW LEVEL SECURITY off every table; ENABLE stays. The SECURITY
     DEFINER helpers depend on the owner being exempt from its own policies,
     which FORCE removes and only a superuser ignores.
  2. The API's narrow table rights restated (REVOKE, then GRANT), because a
     GRANT cannot take back a default privilege and 900_seed re-granted
     everything on a bundle-built database.
  3. next_reference_code pads to a minimum width instead of truncating to it.
  4. Quarterly partitions of asset and audit_event through 2028.

Safe on the VM, where the owner is a superuser: FORCE never bound it, no code
deletes from the four tables that lose DELETE, and no code updates rfp_thread
beyond its three closing columns.

SQL copied verbatim from db/270_managed_postgres.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. db/900_seed.sql loses its blanket grants in the same change;
that file runs only on the bootstrap path, so nothing here mirrors it.

Executed one statement at a time, with the splitter 0025, 0027 and 0029 use,
because asyncpg refuses two statements in one execute.

Revision ID: 0030
Revises: 0029
"""

from alembic import op

revision = "0030"
down_revision = "0029"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 270 · Ready for managed PostgreSQL: Azure, AWS, Google, any provider
--
-- A managed server gives nobody a superuser. The files before this one were
-- written on servers where one exists (the compose container, the VM), and
-- four things follow from that. Each is fixed here, in one place.
--
--   1. FORCE ROW LEVEL SECURITY comes off every table. ENABLE stays.
--
--      About forty SECURITY DEFINER helpers read across organisations on
--      purpose: authenticate_lookup before anyone is signed in,
--      partner_performance over every client's contracts, write_audit_event
--      reading the one chain head, storage_destination_for_contract for a
--      worker's capture. They can because they run as the table OWNER, and an
--      owner is exempt from its own table's policies. FORCE removes exactly
--      that exemption. A superuser ignores FORCE, so where the owner was a
--      superuser it never mattered. On a managed server the owner is an
--      ordinary login, FORCE binds it, and every helper silently sees only
--      what its caller sees: nobody can sign in, the audit chain forks per
--      organisation, the vendor figures come back empty.
--
--      FORCE only ever affected the owner. sourcehub_app and
--      sourcehub_readonly are not owners, so every policy applies to them
--      exactly as before. What FORCE guarded against, the API connecting AS
--      the owner, is now refused by the API itself (sourcehub.db.guard) and by
--      the Alembic preflight (migrations/env.py).
--
--      THE RULE FROM HERE ON: ENABLE ROW LEVEL SECURITY, never FORCE.
--
--   2. The API's table rights say what each table is for, and nothing more.
--      db/000's default privileges give sourcehub_app SELECT, INSERT, UPDATE
--      and DELETE on every table as it is created. 120, 130, 170 and 250 then
--      name narrower sets, but a GRANT cannot take back what a default
--      privilege already gave, and on a database built from the bundle
--      900_seed then granted everything on every table once more. Nothing
--      reached a row: none of these tables has a DELETE policy and
--      rfp_message has no UPDATE policy either, so row-level security refused
--      what the grants allowed. But the second fence was down, and on
--      rfp_thread the API could update any column instead of the three that
--      closing a thread writes. Restated here as REVOKE, then GRANT, and 900
--      no longer grants anything on tables.
--
--   3. Reference codes: the width is a minimum. lpad() TRUNCATES a longer
--      string, so lpad('100', 2, '0') is '10': the 100th worker, contract or
--      proposal was given the 10th one's code and failed its UNIQUE
--      constraint. Codes already issued are unchanged.
--
--   4. Partitions for 2027 and 2028. asset and audit_event had quarters up to
--      2027-01-01 and a default partition. Rows past that land in the default,
--      and a default holding rows for a range blocks attaching that range
--      later. Each new partition gets ENABLE ROW LEVEL SECURITY and no policy,
--      as 120 did for the first ones: named directly it shows nothing, read
--      through its parent the parent's policies apply. A unit test fails when
--      the last one is less than six months away.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1 · FORCE off, everywhere it is on. Read from the catalogue rather than
--     listed, so a table added before this file with FORCE is not missed.
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS rel
    FROM   pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  n.nspname = 'public'
      AND  c.relforcerowsecurity
  LOOP
    EXECUTE format('ALTER TABLE %s NO FORCE ROW LEVEL SECURITY', r.rel);
  END LOOP;
END
$fn$;


-- ---------------------------------------------------------------------------
-- 2 · The narrow sets, restated so they hold whatever came before.
-- ---------------------------------------------------------------------------
-- Assignments, offers and reminders: read, create, move along. Never delete.
REVOKE ALL
  ON task_assignment, task_offer, task_offer_recipient, engagement_reminder
  FROM sourcehub_app;
GRANT SELECT, INSERT, UPDATE
  ON task_assignment, task_offer, task_offer_recipient, engagement_reminder
  TO sourcehub_app;

-- Conversations, as 250 wrote them. Messages: no UPDATE, no DELETE.
REVOKE ALL ON rfp_thread, rfp_message, rfp_thread_read FROM sourcehub_app;
GRANT SELECT, INSERT ON rfp_thread TO sourcehub_app;
GRANT UPDATE (closed_at, closed_reason, closed_by) ON rfp_thread TO sourcehub_app;
GRANT SELECT, INSERT ON rfp_message TO sourcehub_app;
GRANT SELECT, INSERT, UPDATE ON rfp_thread_read TO sourcehub_app;


-- ---------------------------------------------------------------------------
-- 3 · next_reference_code: pad up to the width, never cut down to it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION next_reference_code(
  p_prefix text, p_sequence text, p_width int DEFAULT 2
) RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT nextval(%L)', p_sequence) INTO n;
  RETURN p_prefix || '-' || CASE WHEN length(n::text) >= p_width
                                 THEN n::text
                                 ELSE lpad(n::text, p_width, '0')
                            END;
END
$fn$;


-- ---------------------------------------------------------------------------
-- 4 · Quarterly partitions through 2028.
-- ---------------------------------------------------------------------------
CREATE TABLE asset_2027q1 PARTITION OF asset
  FOR VALUES FROM ('2027-01-01') TO ('2027-04-01');
CREATE TABLE asset_2027q2 PARTITION OF asset
  FOR VALUES FROM ('2027-04-01') TO ('2027-07-01');
CREATE TABLE asset_2027q3 PARTITION OF asset
  FOR VALUES FROM ('2027-07-01') TO ('2027-10-01');
CREATE TABLE asset_2027q4 PARTITION OF asset
  FOR VALUES FROM ('2027-10-01') TO ('2028-01-01');
CREATE TABLE asset_2028q1 PARTITION OF asset
  FOR VALUES FROM ('2028-01-01') TO ('2028-04-01');
CREATE TABLE asset_2028q2 PARTITION OF asset
  FOR VALUES FROM ('2028-04-01') TO ('2028-07-01');
CREATE TABLE asset_2028q3 PARTITION OF asset
  FOR VALUES FROM ('2028-07-01') TO ('2028-10-01');
CREATE TABLE asset_2028q4 PARTITION OF asset
  FOR VALUES FROM ('2028-10-01') TO ('2029-01-01');

CREATE TABLE audit_event_2027q1 PARTITION OF audit_event
  FOR VALUES FROM ('2027-01-01') TO ('2027-04-01');
CREATE TABLE audit_event_2027q2 PARTITION OF audit_event
  FOR VALUES FROM ('2027-04-01') TO ('2027-07-01');
CREATE TABLE audit_event_2027q3 PARTITION OF audit_event
  FOR VALUES FROM ('2027-07-01') TO ('2027-10-01');
CREATE TABLE audit_event_2027q4 PARTITION OF audit_event
  FOR VALUES FROM ('2027-10-01') TO ('2028-01-01');
CREATE TABLE audit_event_2028q1 PARTITION OF audit_event
  FOR VALUES FROM ('2028-01-01') TO ('2028-04-01');
CREATE TABLE audit_event_2028q2 PARTITION OF audit_event
  FOR VALUES FROM ('2028-04-01') TO ('2028-07-01');
CREATE TABLE audit_event_2028q3 PARTITION OF audit_event
  FOR VALUES FROM ('2028-07-01') TO ('2028-10-01');
CREATE TABLE audit_event_2028q4 PARTITION OF audit_event
  FOR VALUES FROM ('2028-10-01') TO ('2029-01-01');

DO $fn$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
      'asset_2027q1', 'asset_2027q2', 'asset_2027q3', 'asset_2027q4',
      'asset_2028q1', 'asset_2028q2', 'asset_2028q3', 'asset_2028q4',
      'audit_event_2027q1', 'audit_event_2027q2', 'audit_event_2027q3', 'audit_event_2027q4',
      'audit_event_2028q1', 'audit_event_2028q2', 'audit_event_2028q3', 'audit_event_2028q4'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$fn$;
"""

_DOWN = """
-- 4 · the new partitions, each dropped only when empty. One holding rows is
--     kept, because dropping it would drop them.
DO $fn$
DECLARE
  t        text;
  has_rows boolean;
BEGIN
  FOREACH t IN ARRAY ARRAY[
      'asset_2027q1', 'asset_2027q2', 'asset_2027q3', 'asset_2027q4',
      'asset_2028q1', 'asset_2028q2', 'asset_2028q3', 'asset_2028q4',
      'audit_event_2027q1', 'audit_event_2027q2', 'audit_event_2027q3', 'audit_event_2027q4',
      'audit_event_2028q1', 'audit_event_2028q2', 'audit_event_2028q3', 'audit_event_2028q4'] LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I)', t) INTO has_rows;
      IF has_rows THEN
        RAISE NOTICE '% holds rows and is kept', t;
      ELSE
        EXECUTE format('DROP TABLE %I', t);
      END IF;
    END IF;
  END LOOP;
END
$fn$;

-- 3 · the reference-code function as it was, truncation included.
CREATE OR REPLACE FUNCTION next_reference_code(
  p_prefix text, p_sequence text, p_width int DEFAULT 2
) RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT nextval(%L)', p_sequence) INTO n;
  RETURN p_prefix || '-' || lpad(n::text, p_width, '0');
END
$fn$;

-- 2 · rights as a migrated database had them. The conversation tables were
--     already narrow (0027), so only DELETE comes back, on the four others.
GRANT DELETE ON task_assignment, task_offer, task_offer_recipient, engagement_reminder
  TO sourcehub_app;

-- 1 · FORCE back on every table with row-level security, as before 0030.
--     On a server whose owner is not a superuser this brings back the failure
--     db/270 describes: do not downgrade there.
DO $fn$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS rel
    FROM   pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  n.nspname = 'public'
      AND  c.relrowsecurity
      AND  NOT c.relforcerowsecurity
  LOOP
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', r.rel);
  END LOOP;
END
$fn$;
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
