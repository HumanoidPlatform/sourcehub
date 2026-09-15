// The capture outbox: one row per file from the moment the shutter fires
// until the server confirms the bytes. The uploader drains it; the screens
// subscribe to it.

import { getDb } from "./index";

export type CaptureStatus = "captured" | "presigned" | "uploading" | "uploaded" | "confirmed" | "failed";

export interface CaptureRow {
  id: string;
  user_id: string;
  assignment_id: string;
  local_uri: string | null;
  filename: string;
  mime: string;
  size: number;
  sha256: string | null;
  /** JSON: what validation/rules.ts found before this row was queued. */
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
  created_at: number;
  updated_at: number;
}

export type NewCapture = Pick<
  CaptureRow,
  "id" | "user_id" | "assignment_id" | "local_uri" | "filename" | "mime" | "size" | "captured_at" | "lat" | "lon" | "checks"
>;

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
  return db.getAllAsync<RejectionCount>(
    `SELECT code, count(*) AS n FROM rejections
     WHERE assignment_id = ? GROUP BY code ORDER BY n DESC, code`,
    [assignmentId],
  );
}

// --- writes ---------------------------------------------------------------

export async function insertCapture(c: NewCapture): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO captures (id, user_id, assignment_id, local_uri, filename, mime, size, captured_at,
                           lat, lon, checks, status, attempts, next_attempt_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'captured', 0, 0, ?, ?)`,
    [c.id, c.user_id, c.assignment_id, c.local_uri, c.filename, c.mime, c.size, c.captured_at, c.lat, c.lon, c.checks, now, now],
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

/** an app that died mid-PUT restarts the PUT rather than waiting forever */
export async function resetStuck(): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE captures SET status = 'presigned', updated_at = ? WHERE status = 'uploading'", [Date.now()]);
}

export async function retryFailed(assignmentId?: string): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync(
    `UPDATE captures SET status = 'captured', attempts = 0, next_attempt_at = 0, last_error = NULL,
                         put_url = NULL, url_expires_at = NULL, updated_at = ?
     WHERE status = 'failed' AND local_uri IS NOT NULL ${assignmentId ? "AND assignment_id = ?" : ""}`,
    assignmentId ? [Date.now(), assignmentId] : [Date.now()],
  );
  emitOutboxChange();
  return r.changes;
}

export async function discardFailed(assignmentId?: string): Promise<CaptureRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CaptureRow>(
    `SELECT * FROM captures WHERE status = 'failed' ${assignmentId ? "AND assignment_id = ?" : ""}`,
    assignmentId ? [assignmentId] : [],
  );
  await db.runAsync(
    `DELETE FROM captures WHERE status = 'failed' ${assignmentId ? "AND assignment_id = ?" : ""}`,
    assignmentId ? [assignmentId] : [],
  );
  emitOutboxChange();
  return rows;
}

export async function deleteCapture(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM captures WHERE id = ?", [id]);
  emitOutboxChange();
}

/** one failed capture back to the start of the pipeline */
export async function retryCapture(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE captures SET status = 'captured', attempts = 0, next_attempt_at = 0, last_error = NULL,
                         put_url = NULL, url_expires_at = NULL, updated_at = ?
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

/** a different person signed in on this phone: their predecessor's queue goes */
export async function purgeOtherUsers(userId: string): Promise<CaptureRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CaptureRow>("SELECT * FROM captures WHERE user_id <> ?", [userId]);
  await db.runAsync("DELETE FROM captures WHERE user_id <> ?", [userId]);
  if (rows.length) emitOutboxChange();
  return rows;
}

// --- reads ----------------------------------------------------------------

export async function listByAssignment(assignmentId: string): Promise<CaptureRow[]> {
  const db = await getDb();
  return db.getAllAsync<CaptureRow>(
    "SELECT * FROM captures WHERE assignment_id = ? ORDER BY created_at",
    [assignmentId],
  );
}

export async function nextRunnable(now: number): Promise<CaptureRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CaptureRow>(
    `SELECT * FROM captures
     WHERE status NOT IN ('confirmed','failed') AND next_attempt_at <= ?
     ORDER BY created_at LIMIT 1`,
    [now],
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
     FROM captures ${assignmentId ? "WHERE assignment_id = ?" : ""}`,
    assignmentId ? [assignmentId] : [],
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
     FROM captures GROUP BY assignment_id`,
  );
  const out: Record<string, OutboxSummary> = {};
  for (const r of rows) out[r.assignment_id] = { queued: r.queued, failed: r.failed, confirmed: r.confirmed };
  return out;
}
