// The upload state machine, pure and unit-tested. The uploader executes what
// planNext() says and feeds the result back through applyResult(); nothing in
// here touches the network, the file system or the database.
//
// A file up to CHUNK_BYTES goes up in one PUT:
//
//   captured --hash--> captured(sha) --presign--> presigned --put--> uploading
//   --put ok--> uploaded --confirm--> confirmed
//
// A bigger file is never hashed (the server names it by the phone's own id)
// and goes up in chunks against a session storage keeps:
//
//   captured --presign--> presigned --query--> uploading --chunk--> uploading …
//   --last chunk--> uploaded --confirm--> confirmed
//
// where `query` asks storage what it already holds, and is asked again after
// anything that could have left the two sides disagreeing: a presign, an app
// restart, the network returning. What storage says is the truth; the row's
// own count never is.
//
// A transient failure (network, 5xx, a stalled transfer) rolls a row back one
// step and schedules it with backoff — and keeps doing so for as long as the
// app runs. A capture is never failed for the connection being poor; only a
// definitive refusal (a 4xx that is not about a link, a file that is gone)
// parks it as 'failed' for the worker to retry or discard. A refused signed
// URL is asked for again under backoff and the same cap as before, since a
// destination refusing every link is broken, not expiring; the attempt
// counter survives the presign, and a landed PUT or chunk resets it.
//
// A 401 is about the session, not the row: the run halts and the row is left
// exactly as it was, for the next sign-in (apiOutcome).

import { CHUNK_BYTES, MAX_ATTEMPTS, PART_URL_BATCH, PRESIGN_SAFETY_MS } from "@/config";
import type { CaptureRow, CaptureStatus } from "@/db/outbox";
import { delayFor } from "./backoff";
import { bytesHeld, missingParts, nextGcsPart, parseParts, parseUrls, partCount } from "./parts";

export type RowLike = Pick<
  CaptureRow,
  | "status"
  | "sha256"
  | "url_expires_at"
  | "attempts"
  | "next_attempt_at"
  | "put_url"
  | "asset_id"
  | "size"
  | "upload_mode"
  | "upload_protocol"
  | "session_url"
  | "chunk_size"
  | "bytes_done"
  | "parts_done"
  | "part_urls"
  | "needs_status"
  | "restart"
>;

export type Action =
  | { type: "none" }
  | { type: "wait"; until: number }
  | { type: "hash" }
  | { type: "presign" }
  | { type: "put" }
  | { type: "confirm" }
  | { type: "query" } // ask storage where the chunked upload stands
  | { type: "part_urls"; parts: number[] } // signed URLs for these parts (Azure, S3)
  // send these parts; for Google `from` is the byte the chunk starts at — what
  // storage said it holds, which after a cut is not a part boundary
  | { type: "chunk"; parts: number[]; from?: number };

/** what presign says about a chunked upload */
export interface UploadPlan {
  protocol: "gcs" | "azure" | "s3";
  chunk_size: number;
  size: number;
  session_url: string | null;
}

export type Outcome =
  | { type: "hashed"; sha256: string }
  | {
      type: "presigned";
      asset_id: string;
      url: string | null;
      headers: Record<string, string>;
      expires_in: number;
      status: string;
      /** present when the server answered RESUMABLE */
      upload?: UploadPlan | null;
    }
  | { type: "put_started" }
  | { type: "put_ok" }
  | { type: "put_rejected" } // the signature was refused (expired): presign again
  | { type: "confirmed" }
  | { type: "not_in_storage" } // confirm says the bytes are not there: PUT again
  | { type: "status_known"; bytes_done: number | null; parts_done: number[] }
  | { type: "part_urls"; urls: Record<string, string>; expires_in: number; requested?: number[] }
  | { type: "chunk_ok"; bytes?: number; part?: number } // one chunk landed
  | { type: "part_rejected"; part: number } // its URL was refused: ask for a new one
  | { type: "session_lost" } // storage forgot the session: start this upload again
  | { type: "retryable"; error: string }
  | { type: "fatal"; error: string }
  | { type: "halt" }; // the session is gone: stop the run, write nothing to the row

/** a file this big is sent in chunks, if the server agrees */
export function wantsChunks(row: Pick<RowLike, "size">): boolean {
  return row.size > CHUNK_BYTES;
}

export function isChunked(row: Pick<RowLike, "upload_mode">): boolean {
  return row.upload_mode === "resumable";
}

/** whether storage holds every byte, from what the row last heard */
export function allLanded(row: RowLike): boolean {
  const chunk = row.chunk_size ?? CHUNK_BYTES;
  if (row.upload_protocol === "gcs") return row.bytes_done >= row.size;
  return missingParts(row.size, chunk, parseParts(row.parts_done)).length === 0;
}

export function planNext(row: RowLike, now: number, safetyMs = PRESIGN_SAFETY_MS, inFlight = 1): Action {
  if (row.status === "confirmed" || row.status === "failed") return { type: "none" };
  if (row.next_attempt_at > now) return { type: "wait", until: row.next_attempt_at };
  switch (row.status) {
    case "captured":
      // a big file is never read whole: the server names it by the phone's id
      return wantsChunks(row) || row.sha256 ? { type: "presign" } : { type: "hash" };
    case "presigned":
    case "uploading":
      if (!isChunked(row)) {
        if (row.status === "uploading") {
          // only reached after resetStuck() at boot turned it back into presigned;
          // seeing it here means a crash mid-step — treat as a fresh PUT
          return { type: "put" };
        }
        if (!row.put_url || row.url_expires_at == null || row.url_expires_at - now < safetyMs) {
          return { type: "presign" };
        }
        return { type: "put" };
      }
      return planChunk(row, now, safetyMs, inFlight);
    case "uploaded":
      return { type: "confirm" };
    default:
      return { type: "none" };
  }
}

function planChunk(row: RowLike, now: number, safetyMs: number, inFlight: number): Action {
  if (row.needs_status) return { type: "query" };
  if (allLanded(row)) return { type: "confirm" };
  const chunk = row.chunk_size ?? CHUNK_BYTES;
  if (row.upload_protocol === "gcs") {
    // Google takes its chunks in order, one at a time, at the session URL,
    // each starting exactly where the last answer said it holds
    return { type: "chunk", parts: [nextGcsPart(row.bytes_done, chunk)], from: row.bytes_done };
  }
  const missing = missingParts(row.size, chunk, parseParts(row.parts_done));
  const next = missing.slice(0, Math.max(1, inFlight));
  const urls = parseUrls(row.part_urls);
  const stale = next.some((n) => !urls[n] || urls[n].expires_at - now < safetyMs);
  // a batch of URLs for the parts ahead, so the next few chunks need no round trip
  if (stale) return { type: "part_urls", parts: missing.slice(0, PART_URL_BATCH) };
  return { type: "chunk", parts: next };
}

/** 0/network, 408, 425, 429 and 5xx are worth another go; other 4xx are not */
export function classify(status: number | null | undefined): "retryable" | "fatal" {
  if (status == null || status === 0) return "retryable";
  if (status === 408 || status === 425 || status === 429) return "retryable";
  if (status >= 500) return "retryable";
  return "fatal";
}

/** What an API error during a step means for the row. `label` names the step.
 *
 * 401 is the session, not the capture. A refresh that cannot be done clears
 * the session (api/client.ts), and the loop used to read the resulting 401 as
 * a fatal error on whichever row was in flight — then take the next row and
 * do the same, until a worker whose session had expired found their whole
 * queue marked failed. The run halts instead; the rows wait for the sign-in.
 *
 * 410 is the server saying the thing is gone for good; on a chunked upload
 * that is the storage session, and the upload starts again from a fresh one.
 * So is a 404 while continuing one (`resuming`: the status and part-URL
 * steps): the row the phone is continuing is no longer there — swept, or the
 * server's database reset — and the file is still on the phone, so a fresh
 * presign is the answer rather than a failure. Every other status goes by
 * classify(). */
export function apiOutcome(
  status: number,
  label: string,
  message: string,
  chunked = false,
  resuming = false,
): Outcome {
  if (status === 401) return { type: "halt" };
  if (status === 410) return chunked ? { type: "session_lost" } : { type: "fatal", error: `${label}: ${message}` };
  if (status === 404 && chunked && resuming) return { type: "session_lost" };
  return classify(status) === "retryable"
    ? { type: "retryable", error: `${label}: ${message}` }
    : { type: "fatal", error: `${label}: ${message}` };
}

/** What a storage PUT's status code means. Pure, so it can be tested.
 *
 * Any 2xx is a stored object: Azure Blob answers 201 Created to a PUT Blob
 * where S3 and MinIO answer 200, and a capture goes to whichever of the two
 * the client named. This lived inline in uploader.ts as `status === 200 ||
 * status === 204`, which is why no test caught it rejecting every Azure
 * upload that had actually succeeded.
 *
 * 403 is the expired signature, not a refusal of the bytes — re-presign.
 * Google Cloud Storage says the same thing as a 400 with ExpiredToken in the
 * body; every other 400 is still a refusal.
 */
export function putOutcome(status: number | null | undefined, body?: string | null): Outcome {
  const s = status ?? 0;
  if (s >= 200 && s < 300) return { type: "put_ok" };
  if (s === 403 || (s === 400 && /ExpiredToken/.test(body ?? ""))) return { type: "put_rejected" };
  const detail = body ? `: ${body.slice(0, 120)}` : "";
  return classify(s) === "retryable"
    ? { type: "retryable", error: `upload: storage answered ${s}` }
    : { type: "fatal", error: `upload: storage refused the file (${s}${detail})` };
}

/** What storage's answer to one chunk means.
 *
 * Google: 308 is "more to come", and its Range header says how much it now
 * holds — that count, not the phone's, is what the row records. A 2xx is the
 * last chunk landing. 403, 404 and 410 on the session URL mean the session is
 * gone (they never expire inside a transfer), so the upload starts again.
 *
 * Azure and S3: a 2xx is the part staged; 403 is the part's signed URL
 * refused (expired), so a new one is asked for; 404 is the upload itself gone,
 * so it starts again; a 400 naming the digest means
 * the bytes were damaged in flight and the part is simply sent again. */
export function chunkOutcome(
  protocol: "gcs" | "azure" | "s3",
  part: number,
  size: number,
  status: number | null | undefined,
  headers?: Record<string, string> | null,
  body?: string | null,
): Outcome {
  const s = status ?? 0;
  if (protocol === "gcs") {
    if (s === 308) return { type: "chunk_ok", bytes: bytesHeld(header(headers, "range")) };
    if (s >= 200 && s < 300) return { type: "chunk_ok", bytes: size };
    if (s === 403 || s === 404 || s === 410) return { type: "session_lost" };
  } else {
    if (s >= 200 && s < 300) return { type: "chunk_ok", part };
    if (s === 403) return { type: "part_rejected", part };
    // S3's NoSuchUpload: the multipart upload was aborted (a lifecycle rule,
    // the server replacing it). The upload starts again, not fails.
    if (s === 404) return { type: "session_lost" };
    if (s === 400 && /BadDigest|Md5Mismatch|InvalidDigest/i.test(body ?? "")) {
      return { type: "retryable", error: `chunk ${part}: storage read different bytes than were sent` };
    }
  }
  const detail = body ? `: ${body.slice(0, 120)}` : "";
  return classify(s) === "retryable"
    ? { type: "retryable", error: `chunk ${part}: storage answered ${s}` }
    : { type: "fatal", error: `chunk ${part}: storage refused the upload (${s}${detail})` };
}

function header(headers: Record<string, string> | null | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? headers[key] : undefined;
}

/** the server answered without what the next step needs: wait, and after
 *  maxAttempts in a row give the worker a failed capture to see */
function giveUpOrWait(row: RowLike, now: number, maxAttempts: number, why: string): Partial<CaptureRow> {
  const attempts = row.attempts + 1;
  if (attempts >= maxAttempts) return { status: "failed", attempts, last_error: `${why} Try again later.` };
  return { attempts, next_attempt_at: now + delayFor(attempts), last_error: why };
}

function rollback(status: CaptureStatus): CaptureStatus {
  return status === "uploading" ? "presigned" : status;
}

/** the row cleared of everything a storage session gave it */
const NO_SESSION: Partial<CaptureRow> = {
  session_url: null,
  bytes_done: 0,
  parts_done: null,
  part_urls: null,
  needs_status: 0,
};

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
      if (ev.upload) {
        // A chunked upload. Storage is asked what it holds before the first
        // byte goes: on a fresh session that is nothing, on a resumed one it
        // is what landed before the cut — either way the truth, not a guess.
        // What an earlier session gave is dropped first: part URLs signed for
        // an upload the server may have just replaced were reused while they
        // had time left, and refused as an upload that no longer exists.
        return {
          ...NO_SESSION,
          status: "presigned",
          asset_id: ev.asset_id,
          put_url: null,
          put_headers: JSON.stringify(ev.headers ?? {}),
          url_expires_at: null,
          upload_mode: "resumable",
          upload_protocol: ev.upload.protocol,
          session_url: ev.upload.session_url,
          chunk_size: ev.upload.chunk_size,
          needs_status: 1,
          restart: 0,
          last_error: null,
        };
      }
      // No link, or one that expires inside the safety margin: planNext would
      // ask again at once, and the lane hammered the API. Waited on and
      // capped like a refused link.
      if (!ev.url || ev.expires_in * 1000 <= PRESIGN_SAFETY_MS) {
        return giveUpOrWait(row, now, maxAttempts, "The server issued no usable upload link.");
      }
      // The attempt counter is NOT reset here: a presign is the cheap half of
      // every PUT retry, and resetting on it made the refused-link loop below
      // endless. A PUT that lands resets it.
      return {
        status: "presigned",
        asset_id: ev.asset_id,
        put_url: ev.url,
        // Kept with the URL they were issued for: which headers an upload
        // needs depends on the client bucket this capture is bound for.
        put_headers: JSON.stringify(ev.headers ?? {}),
        url_expires_at: now + ev.expires_in * 1000,
        upload_mode: "single",
        last_error: null,
      };
    case "put_started":
      return { status: "uploading" };
    case "put_ok":
      return { status: "uploaded", attempts: 0, last_error: null };
    case "put_rejected":
    case "part_rejected": {
      // Usually an expired signature, occasionally a destination that will
      // refuse every link: a new URL is asked for, but with backoff and the
      // same cap as any other failure, so the second kind ends as a failed
      // capture the worker can see rather than a loop nobody can.
      const attempts = row.attempts + 1;
      if (attempts >= maxAttempts) {
        return {
          status: "failed",
          attempts,
          last_error: `Storage refused ${attempts} upload links in a row. The destination may have changed; try again later.`,
        };
      }
      if (ev.type === "part_rejected") {
        const urls = parseUrls(row.part_urls);
        delete urls[ev.part];
        return { part_urls: JSON.stringify(urls), attempts, next_attempt_at: now + delayFor(attempts), last_error: "Upload link refused; asking for a new one." };
      }
      return {
        status: "captured",
        put_url: null,
        put_headers: null,
        url_expires_at: null,
        attempts,
        next_attempt_at: now + delayFor(attempts),
        last_error: "Upload link refused; asking for a new one.",
      };
    }
    case "confirmed":
      return { status: "confirmed", last_error: null };
    case "not_in_storage": {
      // one PUT: send it again; chunks: ask storage which parts it lacks.
      // Capped: this is the server's word about storage, not the connection,
      // and uncapped it looped upload → confirm for ever with the Android
      // service and its notification held the whole time.
      const attempts = row.attempts + 1;
      if (attempts >= maxAttempts) {
        return { status: "failed", attempts, last_error: `Storage still had not received the file after ${attempts} uploads. Try again later.` };
      }
      return { status: "presigned", needs_status: isChunked(row) ? 1 : 0, attempts, next_attempt_at: now + delayFor(attempts), last_error: "Storage has not received the file yet." };
    }
    case "status_known": {
      const next: Partial<CaptureRow> = {
        needs_status: 0,
        bytes_done: ev.bytes_done ?? row.bytes_done,
        parts_done: JSON.stringify(ev.parts_done),
        last_error: null,
      };
      next.status = allLanded({ ...row, ...next }) ? "uploaded" : "uploading";
      return next;
    }
    case "part_urls": {
      // Every part asked for, with time to use it — or planChunk asks again
      // at once, which is the same hammering as a presign with no link.
      const short = ev.requested?.some((n) => !(String(n) in ev.urls)) ?? false;
      if (short || ev.expires_in * 1000 <= PRESIGN_SAFETY_MS) {
        return giveUpOrWait(row, now, maxAttempts, "The server issued no usable upload links.");
      }
      const urls = parseUrls(row.part_urls);
      for (const [n, url] of Object.entries(ev.urls)) urls[Number(n)] = { url, expires_at: now + ev.expires_in * 1000 };
      return { part_urls: JSON.stringify(urls), last_error: null };
    }
    case "chunk_ok": {
      const next: Partial<CaptureRow> = { attempts: 0, last_error: null };
      if (ev.bytes != null) next.bytes_done = ev.bytes;
      if (ev.part != null) {
        const done = parseParts(row.parts_done);
        if (!done.includes(ev.part)) done.push(ev.part);
        next.parts_done = JSON.stringify(done.sort((a, b) => a - b));
        const urls = parseUrls(row.part_urls);
        delete urls[ev.part];
        next.part_urls = JSON.stringify(urls);
      }
      next.status = allLanded({ ...row, ...next }) ? "uploaded" : "uploading";
      return next;
    }
    case "session_lost": {
      // Everything the session gave is void, including what the row thought
      // had landed. The next presign asks for a fresh one; under backoff and
      // the cap, since a destination that loses every session is broken.
      const attempts = row.attempts + 1;
      if (attempts >= maxAttempts) {
        return { status: "failed", attempts, last_error: `The upload session was lost ${attempts} times in a row. Try again later.` };
      }
      return {
        ...NO_SESSION,
        status: "captured",
        restart: 1,
        attempts,
        next_attempt_at: now + delayFor(attempts),
        last_error: "The upload session expired; starting this upload again.",
      };
    }
    case "retryable": {
      // No cap: a poor connection is not a reason to give up on a capture.
      // The backoff tops out at five minutes, and the worker can say "now".
      const attempts = row.attempts + 1;
      return { status: rollback(row.status), attempts, next_attempt_at: now + delayFor(attempts), last_error: ev.error };
    }
    case "fatal":
      return { status: "failed", attempts: row.attempts + 1, last_error: ev.error };
    case "halt":
      return {};
    default:
      return {};
  }
}

/** how many parts of this upload exist, for the screens */
export function partsOf(row: Pick<RowLike, "size" | "chunk_size">): number {
  return partCount(row.size, row.chunk_size ?? CHUNK_BYTES);
}
