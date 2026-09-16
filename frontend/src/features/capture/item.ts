// One file in the browser's upload queue: the phone's outbox row
// (mobile/src/db/outbox.ts CaptureRow) without the SQLite fields, plus what
// only a browser has to say — the File object itself, and the findings that
// ride with the presign.

import type { Finding } from "./rules";

export type ItemStatus = "captured" | "presigned" | "uploading" | "uploaded" | "confirmed" | "failed";

export interface QueueItem {
  id: string;
  assignment_id: string;
  /** null for an item adopted from the server after a refresh: the bytes are
   *  gone with the old page, and only confirm can still succeed. */
  file: File | null;
  filename: string;
  mime: string;
  size: number;
  /** ISO. From EXIF when the file has it, else the file's own modified time —
   *  never absent, because presign refuses a request without one. */
  captured_at: string;
  lat: number | null;
  lon: number | null;
  /** warn-severity findings only; a blocked file never becomes an item */
  checks: Finding[];
  sha256: string | null;
  asset_id: string | null;
  put_url: string | null;
  /** the headers the PUT must carry, as the API issued them */
  put_headers: Record<string, string> | null;
  url_expires_at: number | null;
  status: ItemStatus;
  attempts: number;
  next_attempt_at: number;
  last_error: string | null;
  /** a one-line note the row shows instead of an error, e.g. "already on the server" */
  note: string | null;
  /** the browser went offline at some point while this was in flight. A PUT
   *  that answers 0 with no offline ever seen is more likely a storage bucket
   *  refusing the origin (CORS) than a dropped connection. */
  saw_offline: boolean;
  created_at: number;
}

/** A file the browser refused before queueing, so the worker can see why the
 *  count did not move. In memory only, as the phone's tally is local. */
export interface Refusal {
  id: string;
  assignment_id: string;
  filename: string;
  size: number;
  findings: Finding[];
  at: number;
}
