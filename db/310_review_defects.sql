-- ============================================================================
-- 310 · The gate-1 defect tally moves onto the verdict: qa_review.defects
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
    RAISE EXCEPTION '310: the defect tally did not copy (% reviews / % rows / sum % in the table; '
                    '% / % / % on the column); nothing was dropped',
      v_reviews_with_rows, v_rows, v_sum_rows, v_reviews_filled, v_keys, v_sum_keys;
  END IF;
END
$fn$;

-- ---------------------------------------------------------------------------
-- 4 · The table goes, with its primary key and both foreign keys
-- ---------------------------------------------------------------------------
DROP TABLE qa_review_defect;
