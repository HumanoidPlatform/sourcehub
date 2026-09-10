// The upload state machine, pure and unit-tested. The uploader executes what
// planNext() says and feeds the result back through applyResult(); nothing in
// here touches the network, the file system or the database.
//
//   captured --hash--> captured(sha) --presign--> presigned --put--> uploading
//   --put ok--> uploaded --confirm--> confirmed
//
// A retryable failure rolls a row back one step and schedules it with
// backoff; a fatal one parks it as 'failed' for the worker to retry or
// discard. A signed URL close to expiry is simply re-presigned: the server
// dedupes on (assignment, sha256), so this costs nothing.

import { MAX_ATTEMPTS, PRESIGN_SAFETY_MS } from "@/config";
import type { CaptureRow, CaptureStatus } from "@/db/outbox";
import { delayFor } from "./backoff";

export type RowLike = Pick<
  CaptureRow,
  "status" | "sha256" | "url_expires_at" | "attempts" | "next_attempt_at" | "put_url" | "asset_id"
>;

export type Action =
  | { type: "none" }
  | { type: "wait"; until: number }
  | { type: "hash" }
  | { type: "presign" }
  | { type: "put" }
  | { type: "confirm" };

export type Outcome =
  | { type: "hashed"; sha256: string }
  | {
      type: "presigned";
      asset_id: string;
      url: string | null;
      headers: Record<string, string>;
      expires_in: number;
      status: string;
    }
  | { type: "put_started" }
  | { type: "put_ok" }
  | { type: "put_rejected" } // the signature was refused (expired): presign again
  | { type: "confirmed" }
  | { type: "not_in_storage" } // confirm says the bytes are not there: PUT again
  | { type: "retryable"; error: string }
  | { type: "fatal"; error: string };

export function planNext(row: RowLike, now: number, safetyMs = PRESIGN_SAFETY_MS): Action {
  if (row.status === "confirmed" || row.status === "failed") return { type: "none" };
  if (row.next_attempt_at > now) return { type: "wait", until: row.next_attempt_at };
  switch (row.status) {
    case "captured":
      return row.sha256 ? { type: "presign" } : { type: "hash" };
    case "presigned":
      if (!row.put_url || row.url_expires_at == null || row.url_expires_at - now < safetyMs) {
        return { type: "presign" };
      }
      return { type: "put" };
    case "uploading":
      // only reached after resetStuck() at boot turned it back into presigned;
      // seeing it here means a crash mid-step — treat as a fresh PUT
      return { type: "put" };
    case "uploaded":
      return { type: "confirm" };
    default:
      return { type: "none" };
  }
}

/** 0/network, 408, 425, 429 and 5xx are worth another go; other 4xx are not */
export function classify(status: number | null | undefined): "retryable" | "fatal" {
  if (status == null || status === 0) return "retryable";
  if (status === 408 || status === 425 || status === 429) return "retryable";
  if (status >= 500) return "retryable";
  return "fatal";
}

function rollback(status: CaptureStatus): CaptureStatus {
  return status === "uploading" ? "presigned" : status;
}

export function applyResult(
  row: RowLike,
  ev: Outcome,
  now: number,
  maxAttempts = MAX_ATTEMPTS,
): Partial<CaptureRow> {
  switch (ev.type) {
    case "hashed":
      return { sha256: ev.sha256 };
    case "presigned":
      if (ev.status === "ready") {
        // the server already holds this exact file: skip straight to confirm
        return { status: "uploaded", asset_id: ev.asset_id, put_url: null, put_headers: null, url_expires_at: null, attempts: 0, last_error: null };
      }
      return {
        status: "presigned",
        asset_id: ev.asset_id,
        put_url: ev.url,
        // Kept with the URL they were issued for: which headers an upload
        // needs depends on the client bucket this capture is bound for.
        put_headers: JSON.stringify(ev.headers ?? {}),
        url_expires_at: now + ev.expires_in * 1000,
        attempts: 0,
        last_error: null,
      };
    case "put_started":
      return { status: "uploading" };
    case "put_ok":
      return { status: "uploaded", last_error: null };
    case "put_rejected":
      return { status: "captured", put_url: null, put_headers: null, url_expires_at: null, attempts: row.attempts + 1, last_error: "Upload link expired; asking for a new one." };
    case "confirmed":
      return { status: "confirmed", last_error: null };
    case "not_in_storage":
      return { status: "presigned", attempts: row.attempts + 1, next_attempt_at: now + delayFor(row.attempts + 1), last_error: "Storage has not received the file yet." };
    case "retryable": {
      const attempts = row.attempts + 1;
      if (attempts >= maxAttempts) {
        return { status: "failed", attempts, last_error: `Gave up after ${attempts} attempts: ${ev.error}` };
      }
      return { status: rollback(row.status), attempts, next_attempt_at: now + delayFor(attempts), last_error: ev.error };
    }
    case "fatal":
      return { status: "failed", attempts: row.attempts + 1, last_error: ev.error };
    default:
      return {};
  }
}
