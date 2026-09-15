// The on-device store is an OUTBOX, not a database of record. Postgres holds
// the truth; this holds captures until the server has confirmed them, plus a
// small key/value area for the server address and the signed-in profile.

export const SCHEMA_V1 = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS kv (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS captures (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  assignment_id   TEXT NOT NULL,
  local_uri       TEXT,
  filename        TEXT NOT NULL,
  mime            TEXT NOT NULL,
  size            INTEGER NOT NULL,
  sha256          TEXT,
  checks          TEXT,
  captured_at     TEXT NOT NULL,
  lat             REAL,
  lon             REAL,
  asset_id        TEXT,
  put_url         TEXT,
  put_headers     TEXT,
  url_expires_at  INTEGER,
  status          TEXT NOT NULL
                  CHECK (status IN ('captured','presigned','uploading','uploaded','confirmed','failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS captures_assignment_idx ON captures (assignment_id, created_at);
CREATE INDEX IF NOT EXISTS captures_queue_idx      ON captures (status, next_attempt_at);
`;

// Storage is no longer always ours: a capture may be written to the client's
// own bucket, and Azure rejects an upload that does not carry
// x-ms-blob-type. The API has always returned the headers an upload needs;
// the phone now stores them with the URL they were issued alongside.
export const SCHEMA_V2 = `
ALTER TABLE captures ADD COLUMN put_headers TEXT;
`;

// What the phone decided about a capture before queueing it: a JSON array of
// findings from validation/rules.ts, the same shape the presign call sends on
// to asset.check_results. Stored as text alongside put_headers, for the same
// reason — SQLite has no json column and the row only ever hands it back.
export const SCHEMA_V3 = `
ALTER TABLE captures ADD COLUMN checks TEXT;
`;

// A capture refused on the device never becomes an outbox row and never
// reaches the server, so this is the only record that it happened. Kept per
// assignment so the worker can see what is being refused and why, rather than
// facing a counter that will not move.
export const SCHEMA_V4 = `
CREATE TABLE IF NOT EXISTS rejections (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  code          TEXT NOT NULL,
  message       TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rejections_assignment_idx ON rejections (assignment_id, created_at);
`;
