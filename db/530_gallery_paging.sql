-- ============================================================================
-- 530 · Paging the capture gallery
--
-- The console drew a task's gallery from one request that returned every
-- capture of the task, sorted in memory because no index covers the order the
-- gallery reads in. A task with two thousand clips is three to eight megabytes
-- of JSON, and a sort of every row, for every reviewer who opens it. The
-- gallery now reads by page: ordered by when each capture was taken (captures
-- without a time last), then by row order, with a cursor made of those three
-- values, and one index that holds exactly that order per task.
--
-- One index serves the three gallery scopes (task, batch, submission): every
-- page is anchored on the task, and the batch or the submission narrows it.
-- coalesce(captured_at, 'infinity') is NULLS LAST as an expression an index
-- can carry; the page query orders by exactly that expression, then created_at,
-- then id, and continues from a cursor with a row comparison over the three.
--
-- Nothing is added to the table. The poster the phone makes for a capture — a
-- small JPEG the tile shows instead of the original — lives in asset.metadata:
-- a promise at presign, a key once confirm has seen the object in storage. The
-- comment on the column records the shape.
--
-- Plain CREATE INDEX on the partitioned parent: Postgres builds one index per
-- partition and attaches them, inside the one transaction the bootstrap and
-- migration 0057 run this in. CONCURRENTLY is not possible on a partitioned
-- parent, nor inside a transaction. At today's sizes that is seconds. At the
-- 40-million-row target the index is built partition by partition, outside
-- any transaction, and attached:
--
--     CREATE INDEX asset_task_gallery_idx
--       ON ONLY asset (task_id, (coalesce(captured_at, 'infinity'::timestamptz)), created_at, id)
--       WHERE deleted_at IS NULL
--     -- then, for each partition P (asset_2026q3, asset_2026q4, …, asset_default):
--     CREATE INDEX CONCURRENTLY P_task_gallery_idx
--       ON P (task_id, (coalesce(captured_at, 'infinity'::timestamptz)), created_at, id)
--       WHERE deleted_at IS NULL
--     ALTER INDEX asset_task_gallery_idx ATTACH PARTITION P_task_gallery_idx
--
-- The parent index becomes valid once every partition's index is attached.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · The order the gallery reads in, as the index holds it. Live rows only:
--     a soft-deleted capture is in no gallery.
-- ---------------------------------------------------------------------------
CREATE INDEX asset_task_gallery_idx
  ON asset (task_id, (coalesce(captured_at, 'infinity'::timestamptz)), created_at, id)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2 · What asset.metadata holds now that the poster lives in it. The column
--     was "EXIF and probe output, never filtered on directly" (db/050); it
--     stays open, and the keys below are the ones the API reads.
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN asset.metadata IS
  'Open: EXIF and probe output, claimed_size and kind from presign. thumb {key, claimed_size, content_type} is the poster the phone promised at presign; thumb_key and thumb_size are set once confirm has seen the object in storage.';
