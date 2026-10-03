"""The gate-1 defect tally moves onto the verdict: qa_review.defects.

qa_review_defect held one row per defect code a failing gate-1 verdict cited.
It was written in one place and read nowhere, and it had no row-level
security. Each verdict's rows become one jsonb object on the verdict itself
({"exposure": 1}), carried before the table is dropped; an assertion refuses
the transaction if the copy fell short. qa_review is append-only through a
DO INSTEAD NOTHING rule, which is lifted for the copy and put straight back.

SQL copied verbatim from db/300_review_defects.sql so the bootstrap and
migration paths keep producing identical schemas; a test asserts the two stay
byte-identical. The downgrade recreates the table as 060 made it and expands
the column back into rows.

Executed one statement at a time, with the splitter 0030 uses, because asyncpg
refuses two statements in one execute.

Revision ID: 0033
Revises: 0032
"""

from alembic import op

revision = "0033"
down_revision = "0032"
branch_labels = None
depends_on = None

_UP = """
-- ============================================================================
-- 300 · The gate-1 defect tally moves onto the verdict: qa_review.defects
--
-- qa_review_defect (060) held one row per defect code a failing gate-1
-- verdict cited, with how many captures it affected. It was written in one
-- place — the end of decide_gate1(), from the tally plan_marks() had already
-- built and checked against defect_code — and read nowhere: no endpoint,
-- screen, function or policy. It also had no row-level security, and the
-- application login held every right on it.
--
-- The tally is a property of the verdict it belongs to: written in the same
-- transaction, never changed afterwards (qa_review is append-only by rule).
-- So it becomes a jsonb object on the verdict row — {"exposure": 1} — the way
-- contract.rubric_snapshot and asset.check_results already are. The column
-- inherits qa_review's policies, and the reviews listing can finally show it.
--
-- Keys are defect_code.code. The foreign key that used to tie each row to a
-- code is gone; the convention it enforced stays: a code is retired with
-- defect_code.active = false, never deleted. asset.review_reason has carried
-- the same code the same way since 210.
--
-- Safe on a database with data: every row is carried before the table goes,
-- and an assertion refuses the whole transaction if the copy fell short.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The column
-- ---------------------------------------------------------------------------
ALTER TABLE qa_review ADD COLUMN defects jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE qa_review
  ADD CONSTRAINT qa_review_defects_is_object CHECK (jsonb_typeof(defects) = 'object');
COMMENT ON COLUMN qa_review.defects IS
  'Defect codes a failing gate-1 verdict cited, with the number of captures each affected: '
  '{"exposure": 1}. Keys are defect_code.code; codes are retired with active = false, '
  'never deleted.';

-- ---------------------------------------------------------------------------
-- 2 · The copy. qa_review is append-only through a DO INSTEAD NOTHING rule,
--     so an UPDATE with the rule in place would silently change nothing. The
--     rule comes off for the copy and goes straight back on, verbatim (060).
-- ---------------------------------------------------------------------------
DROP RULE qa_review_no_update ON qa_review;

UPDATE qa_review q
   SET defects = (SELECT jsonb_object_agg(d.code, r.affected_count)
                    FROM qa_review_defect r
                    JOIN defect_code d ON d.id = r.defect_code_id
                   WHERE r.review_id = q.id)
 WHERE EXISTS (SELECT 1 FROM qa_review_defect r WHERE r.review_id = q.id);

CREATE RULE qa_review_no_update AS ON UPDATE TO qa_review DO INSTEAD NOTHING;

-- ---------------------------------------------------------------------------
-- 3 · Refuse to continue unless every row arrived
-- ---------------------------------------------------------------------------
DO $fn$
DECLARE
  v_reviews_with_rows  bigint;
  v_reviews_filled     bigint;
  v_rows               bigint;
  v_keys               bigint;
  v_sum_rows           bigint;
  v_sum_keys           bigint;
BEGIN
  SELECT count(DISTINCT review_id), count(*), coalesce(sum(affected_count), 0)
    INTO v_reviews_with_rows, v_rows, v_sum_rows
    FROM qa_review_defect;
  SELECT count(*) FILTER (WHERE defects <> '{}'::jsonb),
         coalesce(sum((SELECT count(*) FROM jsonb_object_keys(defects))), 0),
         coalesce(sum((SELECT sum((v)::int) FROM jsonb_each_text(defects) AS e(k, v)
                        WHERE v IS NOT NULL)), 0)
    INTO v_reviews_filled, v_keys, v_sum_keys
    FROM qa_review;
  IF v_reviews_with_rows <> v_reviews_filled OR v_rows <> v_keys OR v_sum_rows <> v_sum_keys THEN
    RAISE EXCEPTION '300: the defect tally did not copy (% reviews / % rows / sum % in the table; '
                    '% / % / % on the column); nothing was dropped',
      v_reviews_with_rows, v_rows, v_sum_rows, v_reviews_filled, v_keys, v_sum_keys;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 4 · The table goes, with its primary key and both foreign keys
-- ---------------------------------------------------------------------------
DROP TABLE qa_review_defect;
"""

_DOWN = """
-- Downgrade of 0033: qa_review_defect returns as 060 made it, filled from the
-- column, and the column goes. ALTER TABLE is not an UPDATE, so the append-only
-- rule on qa_review needs no lifting here. Grants come from db/000's default
-- privileges, as for every table the owner creates.

-- ---------------------------------------------------------------------------
-- 4 · The table (060)
-- ---------------------------------------------------------------------------
CREATE TABLE qa_review_defect (
  review_id      uuid NOT NULL REFERENCES qa_review(id) ON DELETE CASCADE,
  defect_code_id uuid NOT NULL REFERENCES defect_code(id) ON DELETE RESTRICT,
  affected_count integer CHECK (affected_count IS NULL OR affected_count >= 0),
  PRIMARY KEY (review_id, defect_code_id)
);

-- ---------------------------------------------------------------------------
-- 2 · The rows, expanded back out of the column
-- ---------------------------------------------------------------------------
INSERT INTO qa_review_defect (review_id, defect_code_id, affected_count)
SELECT q.id, d.id, (e.value)::int
  FROM qa_review q
  CROSS JOIN LATERAL jsonb_each_text(q.defects) AS e(key, value)
  JOIN defect_code d ON d.code = e.key;

-- ---------------------------------------------------------------------------
-- 1 · The column
-- ---------------------------------------------------------------------------
ALTER TABLE qa_review DROP CONSTRAINT qa_review_defects_is_object;
ALTER TABLE qa_review DROP COLUMN defects;
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
