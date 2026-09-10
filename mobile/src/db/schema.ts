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
