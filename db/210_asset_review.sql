-- ============================================================================
-- 210 · A gate-1 verdict can name the capture, not just the batch
--
-- The aggregator's only move on a submitted batch was accept or reject for the
-- whole of it (modules/qa/service.py decide_gate1). Nine good frames and one
-- bad one meant sending back all ten, and the worker re-shot the lot.
--
-- The effect of "retake this one" is asset.status = 'rejected' — a value that
-- has existed in the enum since db/001_conventions.sql:92 and that no code path
-- has ever written. It is the right lever because five separate rollups already
-- key on status = 'ready' and so need no change at all:
--
--     media.ready_count          the quantity a worker still owes
--     media.attach_to_submission what is bundled to the delivery partner
--     delivery task rollup       asset_summary on the task detail
--     delivery assignment rollup ready/pending/quarantined per batch
--     qa.gate1_queue             ready_assets in the aggregator's queue
--
-- So a sent-back capture stops counting toward the quantity, which makes the
-- existing submit gate (ready_count >= quantity) enforce the retake by itself,
-- and it never reaches the partner. The frames that passed survive the round
-- trip untouched.
--
-- What is added here is only the judgement: why, by whom, when. The reason is
-- a defect_code.code — the taxonomy seeded in db/900_seed.sql:191 — kept as
-- text rather than an FK because asset is partitioned and a composite-key
-- table carrying a second FK per row buys nothing a CHECK does not. The
-- countable rollup lives where it was always meant to, in qa_review_defect.
--
-- No RLS change. asset_update (db/120_workers_media.sql:294) already passes for
-- an aggregator-staff session on its own org's assets, and the restrictive
-- worker policies do not apply to a session that is not a worker.
-- ============================================================================

ALTER TABLE asset
  -- defect_code.code. NULL unless this capture was sent back.
  ADD COLUMN review_reason text,
  -- the reviewer's own words about THIS frame, beside the batch's note
  ADD COLUMN review_note   text,
  ADD COLUMN reviewed_by   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at   timestamptz;

-- A capture sent back always says why: the worker has to know what to change,
-- and the same rule already holds one level up (task_assignment_rejected_needs_note,
-- qa_review_fail_needs_note).
ALTER TABLE asset
  ADD CONSTRAINT asset_rejected_needs_reason
  CHECK (status <> 'rejected' OR review_reason IS NOT NULL);

-- The phone asks "what is left to retake?" on every assignment screen.
CREATE INDEX asset_assignment_rejected_idx ON asset (assignment_id)
  WHERE status = 'rejected';
