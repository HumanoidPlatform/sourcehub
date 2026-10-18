// The capture outbox: one row per file from the moment the shutter fires
// until the server confirms the bytes. The uploader drains it; the screens
// subscribe to it.

import { currentUserId } from "@/api/client";
import { getDb } from "./index";

/** Every read and bulk write is the signed-in worker's alone. A shared phone
 *  keeps a colleague's unsent captures for when they sign back in; until then
 *  nothing lists, counts, retries or uploads them under someone else's token.
 *  Signed out, the owner matches no row. */
function owner(): string {
  return currentUserId() ?? "";
}

export type CaptureStatus = "captured" | "presigned" | "uploading" | "uploaded" | "confirmed" | "failed";
/** how a file is sent: one PUT, or chunks against a session storage keeps */
export type UploadMode = "single" | "resumable";
export type UploadProtocol = "gcs" | "azure" | "s3";

export interface CaptureRow {
  id: string;
  user_id: string;
  assignment_id: string;
  local_uri: string | null;
  filename: string;
  mime: string;
  size: number;
  sha256: string | null;
  /** JSON: what qa_pipeline/rules/rules.ts found before this row was queued. */
  checks: string | null;
  captured_at: string;
  lat: number | null;
  lon: number | null;
  asset_id: string | null;
  put_url: string | null;
  /** JSON: the headers the PUT must carry, as the API issued them. */
  put_headers: string | null;
  url_expires_at: number | null;
  status: CaptureStatus;
  attempts: number;
  next_attempt_at: number;
  last_error: string | null;
  /** A retake: the server's id of the capture sent back that this replaces. */
  replaces_asset_id: string | null;
  /** A clip's running time in seconds; null for a photo. */
  duration_s: number | null;
  // --- a chunked, resumable upload (upload/chunks.ts); null or 0 for one PUT ---
  /** set by the presign's answer: how this file is being sent */
  upload_mode: UploadMode | null;
  upload_protocol: UploadProtocol | null;
  /** Google's session URL, which every chunk goes to; the other two sign a URL per part */
  session_url: string | null;
  chunk_size: number | null;
  /** what storage holds, as it last said: bytes (Google) */
  bytes_done: number;
  /** JSON number[]: the parts storage holds (Azure, S3) */
  parts_done: string | null;
  /** JSON {n: {url, expires_at}}: signed URLs for parts not yet sent */
  part_urls: string | null;
  /** 1: ask storage where the upload stands before sending another byte */
  needs_status: number;
  /** 1: the session is gone; the next presign must open a fresh one */
  restart: number;
  created_at: number;
  updated_at: number;
}

export type NewCapture = Pick<
  CaptureRow,
  "id" | "user_id" | "assignment_id" | "local_uri" | "filename" | "mime" | "size" | "captured_at" | "lat" | "lon" | "checks"
> & { replaces_asset_id?: string | null; duration_s?: number | null };

// --- a tiny change bus, so screens re-read after the uploader moves a row ---

const subscribers = new Set<() => void>();

export function onOutboxChange(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function emitOutboxChange(): void {
  subscribers.forEach((fn) => fn());
}

// --- rejections -----------------------------------------------------------
//
// A capture the phone refuses is deleted before it is queued, so it leaves no
// outbox row and the server never hears of it. These rows are the only trace,
// and they are what stops a worker facing a counter that will not move with no
// idea why.

export interface RejectionCount {
  code: string;
  n: number;
  /** what the phone actually said, from the most recent refusal of this kind.
   *  The code alone gives a worker "beyond the tilt allowed" and no idea by how
   *  much; the message has carried the number all along and nothing read it. */
  message: string | null;
}

export async function recordRejections(
  userId: string,
  assignmentId: string,
  findings: { code: string; message: string }[],
): Promise<void> {
  if (findings.length === 0) return;
  const db = await getDb();
  const now = Date.now();
  for (const f of findings) {
    await db.runAsync(
      `INSERT INTO rejections (id, user_id, assignment_id, code, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`${now}-${Math.random().toString(36).slice(2, 10)}`, userId, assignmentId, f.code, f.message, now],
    );
  }
  emitOutboxChange();
}

export async function rejectionsByAssignment(assignmentId: string): Promise<RejectionCount[]> {
  const db = await getDb();
  // The latest message per code: SQLite's bare-column rule inside an aggregate
  // group takes the value from the row that produced max(created_at), which is
  // exactly the one wanted here.
  return db.getAllAsync<RejectionCount>(
    `SELECT code, count(*) AS n, message, max(created_at) AS latest FROM rejections
     WHERE assignment_id = ? AND user_id = ? GROUP BY code ORDER BY n DESC, code`,
    [assignmentId, owner()],
  );
}

// --- writes ---------------------------------------------------------------

export async function insertCapture(c: NewCapture): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO captures (id, user_id, assignment_id, local_uri, filename, mime, size, captured_at,
                           lat, lon, checks, replaces_asset_id, duration_s, status, attempts, next_attempt_at,
                           created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'captured', 0, 0, ?, ?)`,
    [
      c.id, c.user_id, c.assignment_id, c.local_uri, c.filename, c.mime, c.size, c.captured_at, c.lat, c.lon, c.checks,
      c.replaces_asset_id ?? null, c.duration_s ?? null, now, now,
    ],
  );
  emitOutboxChange();
}

export async function patchCapture(id: string, patch: Partial<CaptureRow>): Promise<void> {
  const keys = Object.keys(patch).filter((k) => k !== "id") as (keyof CaptureRow)[];
  if (keys.length === 0) return;
  const db = await getDb();
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => patch[k] as string | number | null);
  await db.runAsync(`UPDATE captures SET ${sets}, updated_at = ? WHERE id = ?`, [...values, Date.now(), id]);
  emitOutboxChange();
}

/** An app that died mid-upload. One PUT restarts rather than waiting for ever;
 *  a chunked upload asks storage what landed before sending another byte. */
export async function resetStuck(): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    "UPDATE captures SET needs_status = 1, updated_at = ? WHERE status = 'uploading' AND upload_mode = 'resumable'",
    [now],
  );
  await db.runAsync(
    "UPDATE captures SET status = 'presigned', updated_at = ? WHERE status = 'uploading' AND upload_mode IS NOT 'resumable'",
    [now],
  );
}

/** The network came back: every chunked upload in flight asks storage where
 *  it stands rather than trusting its own count across the gap. */
export async function flagResumableForStatus(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE captures SET needs_status = 1, updated_at = ? WHERE status IN ('presigned','uploading') AND upload_mode = 'resumable'",
    [Date.now()],
  );
  emitOutboxChange();
}

/** The worker says now, not after the backoff: every waiting row may go at once. */
export async function retryNow(): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync(
    "UPDATE captures SET next_attempt_at = 0, updated_at = ? WHERE status NOT IN ('confirmed','failed') AND next_attempt_at > ? AND user_id = ?",
    [Date.now(), Date.now(), owner()],
  );
  if (r.changes) emitOutboxChange();
  return r.changes;
}

export async function retryFailed(assignmentId?: string): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync(
    `UPDATE captures SET status = 'captured', attempts = 0, next_attempt_at = 0, last_error = NULL,
                         put_url = NULL, url_expires_at = NULL, needs_status = 1, updated_at = ?
     WHERE status = 'failed' AND local_uri IS NOT NULL AND user_id = ? ${assignmentId ? "AND assignment_id = ?" : ""}`,
    assignmentId ? [Date.now(), owner(), assignmentId] : [Date.now(), owner()],
  );
  emitOutboxChange();
  return r.changes;
}

export async function discardFailed(assignmentId?: string): Promise<CaptureRow[]> {
  return deleteWhere(
    `status = 'failed' AND user_id = ? ${assignmentId ? "AND assignment_id = ?" : ""}`,
    assignmentId ? [owner(), assignmentId] : [owner()],
  );
}

/** Selects then deletes exactly the rows it selected, in one transaction: a
 *  lane writing 'failed' between the two can no longer lose a row whose file
 *  and server slot the caller was handed nothing to clean up. */
async function deleteWhere(where: string, params: (string | number)[]): Promise<CaptureRow[]> {
  const db = await getDb();
  let rows: CaptureRow[] = [];
  await db.withTransactionAsync(async () => {
    rows = await db.getAllAsync<CaptureRow>(`SELECT * FROM captures WHERE ${where}`, params);
    for (const r of rows) await db.runAsync("DELETE FROM captures WHERE id = ?", [r.id]);
  });
  if (rows.length) emitOutboxChange();
  return rows;
}

/** removes one capture's row, whatever its state, and hands it back so the
 *  caller can drop the file and the server's slot with it (upload/drop.ts) */
export async function deleteCapture(id: string): Promise<CaptureRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CaptureRow>("SELECT * FROM captures WHERE id = ?", [id]);
  if (!row) return null;
  await db.runAsync("DELETE FROM captures WHERE id = ?", [id]);
  emitOutboxChange();
  return row;
}

/** one failed capture back to the start of the pipeline */
export async function retryCapture(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE captures SET status = 'captured', attempts = 0, next_attempt_at = 0, last_error = NULL,
                         put_url = NULL, url_expires_at = NULL, needs_status = 1, updated_at = ?
     WHERE id = ? AND status = 'failed' AND local_uri IS NOT NULL`,
    [Date.now(), id],
  );
  emitOutboxChange();
}

/** removes one failed capture's row; the caller deletes the file */
export async function discardCapture(id: string): Promise<CaptureRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CaptureRow>("SELECT * FROM captures WHERE id = ? AND status = 'failed'", [id]);
  if (!row) return null;
  await db.runAsync("DELETE FROM captures WHERE id = ?", [id]);
  emitOutboxChange();
  return row;
}

/** Another account's unsent captures, removed only when the person signed in
 *  says so (Settings). They used to go silently at the next sign-in, while the
 *  sign-out dialog promised they would wait. The caller drops files and slots
 *  it can (upload/drop.ts needs the owner's token, so here only the files). */
export async function discardOthers(): Promise<CaptureRow[]> {
  return deleteWhere("user_id <> ? AND status <> 'confirmed'", [owner()]);
}

/** how many captures on this phone belong to someone not signed in */
export async function othersWaiting(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT count(*) AS n FROM captures WHERE user_id <> ? AND status <> 'confirmed'",
    [owner()],
  );
  return row?.n ?? 0;
}

// --- reads ----------------------------------------------------------------

export async function listByAssignment(assignmentId: string): Promise<CaptureRow[]> {
  const db = await getDb();
  return db.getAllAsync<CaptureRow>(
    "SELECT * FROM captures WHERE assignment_id = ? AND user_id = ? ORDER BY created_at",
    [assignmentId, owner()],
  );
}

export type QueueOrder = "oldest" | "smallest";

/** The next row that can move, skipping any another lane holds. "oldest" is
 *  the queue's natural order; "smallest" lets the photos pass a clip that is
 *  taking its time (upload/uploader.ts runs one lane of each). */
export async function nextRunnable(now: number, exclude: string[] = [], order: QueueOrder = "oldest"): Promise<CaptureRow | null> {
  const db = await getDb();
  const skip = exclude.length ? `AND id NOT IN (${exclude.map(() => "?").join(", ")})` : "";
  const row = await db.getFirstAsync<CaptureRow>(
    `SELECT * FROM captures
     WHERE status NOT IN ('confirmed','failed') AND next_attempt_at <= ? AND user_id = ? ${skip}
     ORDER BY ${order === "smallest" ? "size, created_at" : "created_at"} LIMIT 1`,
    [now, owner(), ...exclude],
  );
  return row ?? null;
}

export interface OutboxSummary {
  queued: number; // captured | presigned | uploading | uploaded
  failed: number;
  confirmed: number;
}

export async function summary(assignmentId?: string): Promise<OutboxSummary> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ queued: number; failed: number; confirmed: number }>(
    `SELECT
       sum(CASE WHEN status IN ('captured','presigned','uploading','uploaded') THEN 1 ELSE 0 END) AS queued,
       sum(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       sum(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
     FROM captures WHERE user_id = ? ${assignmentId ? "AND assignment_id = ?" : ""}`,
    assignmentId ? [owner(), assignmentId] : [owner()],
  );
  return { queued: row?.queued ?? 0, failed: row?.failed ?? 0, confirmed: row?.confirmed ?? 0 };
}

export async function summaryByAssignment(): Promise<Record<string, OutboxSummary>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ assignment_id: string; queued: number; failed: number; confirmed: number }>(
    `SELECT assignment_id,
       sum(CASE WHEN status IN ('captured','presigned','uploading','uploaded') THEN 1 ELSE 0 END) AS queued,
       sum(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       sum(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
     FROM captures WHERE user_id = ? GROUP BY assignment_id`,
    [owner()],
  );
  const out: Record<string, OutboxSummary> = {};
  for (const r of rows) out[r.assignment_id] = { queued: r.queued, failed: r.failed, confirmed: r.confirmed };
  return out;
}
