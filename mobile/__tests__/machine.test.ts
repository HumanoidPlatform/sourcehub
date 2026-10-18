import { apiOutcome, applyResult, chunkOutcome, classify, planNext, putOutcome, type RowLike } from "../src/upload/machine";

const CHUNK = 8 * 1024 * 1024;

const base: RowLike = {
  status: "captured",
  sha256: null,
  url_expires_at: null,
  put_url: null,
  asset_id: null,
  attempts: 0,
  next_attempt_at: 0,
  size: 1000,
  upload_mode: null,
  upload_protocol: null,
  session_url: null,
  chunk_size: null,
  bytes_done: 0,
  parts_done: null,
  part_urls: null,
  needs_status: 0,
  restart: 0,
};

/** a four-part clip on the given provider, session ready */
const big = (over: Partial<RowLike> = {}): RowLike => ({
  ...base,
  status: "presigned",
  asset_id: "a",
  size: 3 * CHUNK + 5,
  upload_mode: "resumable",
  upload_protocol: "s3",
  chunk_size: CHUNK,
  ...over,
});

const NOW = 1_700_000_000_000;
const fresh = (n: number) => ({ [n]: { url: `u${n}`, expires_at: NOW + 600_000 } });

describe("planNext", () => {
  it("hashes before anything else", () => {
    expect(planNext(base, NOW)).toEqual({ type: "hash" });
  });
  it("presigns once the hash is known", () => {
    expect(planNext({ ...base, sha256: "ab" }, NOW)).toEqual({ type: "presign" });
  });
  it("never hashes a big file: the server names it by the phone's own id", () => {
    // reading a gigabyte into the JavaScript heap is what had the OS kill the app
    expect(planNext({ ...base, size: CHUNK + 1 }, NOW)).toEqual({ type: "presign" });
  });
  it("PUTs while the signed URL is fresh", () => {
    expect(planNext({ ...base, status: "presigned", sha256: "ab", put_url: "u", url_expires_at: NOW + 600_000 }, NOW)).toEqual({ type: "put" });
  });
  it("re-presigns when the URL is about to expire", () => {
    expect(planNext({ ...base, status: "presigned", sha256: "ab", put_url: "u", url_expires_at: NOW + 30_000 }, NOW)).toEqual({ type: "presign" });
  });
  it("confirms after the PUT", () => {
    expect(planNext({ ...base, status: "uploaded", asset_id: "a" }, NOW)).toEqual({ type: "confirm" });
  });
  it("waits out the backoff", () => {
    expect(planNext({ ...base, next_attempt_at: NOW + 5000 }, NOW)).toEqual({ type: "wait", until: NOW + 5000 });
  });
  it("does nothing with a finished or failed row", () => {
    expect(planNext({ ...base, status: "confirmed" }, NOW)).toEqual({ type: "none" });
    expect(planNext({ ...base, status: "failed" }, NOW)).toEqual({ type: "none" });
  });
});

describe("planNext · a chunked upload", () => {
  it("asks storage where things stand before sending a byte", () => {
    expect(planNext(big({ needs_status: 1 }), NOW)).toEqual({ type: "query" });
  });
  it("sends Google the next chunk after what it holds, one at a time", () => {
    const row = big({ upload_protocol: "gcs", session_url: "s", bytes_done: 2 * CHUNK });
    expect(planNext(row, NOW, 60_000, 3)).toEqual({ type: "chunk", parts: [3], from: 2 * CHUNK });
  });
  it("after a cut mid-chunk, Google's next chunk starts where Google stopped", () => {
    // storage answered that it holds 2 MiB of part 1: the chunk starts there,
    // not at byte 0 again (which Google refuses, and the clip was failed)
    const held = 2 * 1024 * 1024;
    const row = big({ upload_protocol: "gcs", session_url: "s", bytes_done: held });
    expect(planNext(row, NOW, 60_000, 3)).toEqual({ type: "chunk", parts: [1], from: held });
  });
  it("asks for a batch of part links before sending parts it has none for", () => {
    expect(planNext(big({ parts_done: "[1]" }), NOW)).toEqual({ type: "part_urls", parts: [2, 3, 4] });
    // a link about to expire counts as none
    const stale = big({ part_urls: JSON.stringify({ 1: { url: "u", expires_at: NOW + 1000 } }) });
    expect(planNext(stale, NOW).type).toBe("part_urls");
  });
  it("sends as many parts at once as the connection allows", () => {
    const row = big({ part_urls: JSON.stringify({ ...fresh(1), ...fresh(2), ...fresh(3), ...fresh(4) }) });
    expect(planNext(row, NOW, 60_000, 1)).toEqual({ type: "chunk", parts: [1] });
    expect(planNext(row, NOW, 60_000, 3)).toEqual({ type: "chunk", parts: [1, 2, 3] });
    expect(planNext({ ...row, parts_done: "[1,3]" }, NOW, 60_000, 3)).toEqual({ type: "chunk", parts: [2, 4] });
  });
  it("confirms once storage holds every part", () => {
    expect(planNext(big({ status: "uploading", parts_done: "[1,2,3,4]" }), NOW)).toEqual({ type: "confirm" });
    expect(planNext(big({ upload_protocol: "gcs", bytes_done: 3 * CHUNK + 5 }), NOW)).toEqual({ type: "confirm" });
  });
});

describe("apiOutcome · continuing a chunked upload", () => {
  it("starts again when the row it is continuing is gone from the server", () => {
    // the sweep removed a week-old half-sent clip, or the dev database was
    // reset: the file is still on the phone, so a fresh presign, not a failure
    expect(apiOutcome(404, "status", "Not found", true, true)).toEqual({ type: "session_lost" });
    expect(apiOutcome(404, "part links", "Not found", true, true)).toEqual({ type: "session_lost" });
    expect(apiOutcome(410, "status", "swept", true, true)).toEqual({ type: "session_lost" });
  });
  it("still fails a 404 that is not about a session", () => {
    // a presign for an assignment that is gone, or a single-PUT row
    expect(apiOutcome(404, "presign", "Not found", true, false).type).toBe("fatal");
    expect(apiOutcome(404, "status", "Not found", false, true).type).toBe("fatal");
    expect(apiOutcome(401, "status", "expired", true, true)).toEqual({ type: "halt" });
  });
});

describe("applyResult", () => {
  it("records the presign and leaves the attempt counter alone", () => {
    // a presign is the cheap half of every PUT retry; resetting on it is what
    // made a refused link an endless loop
    const p = applyResult({ ...base, attempts: 3 }, { type: "presigned", asset_id: "a", url: "u", headers: {}, expires_in: 900, status: "pending" }, NOW);
    expect(p).toMatchObject({ status: "presigned", asset_id: "a", put_url: "u", url_expires_at: NOW + 900_000, upload_mode: "single" });
    expect(p.attempts).toBeUndefined();
  });
  it("a PUT that lands resets the counter", () => {
    expect(applyResult({ ...base, status: "uploading", attempts: 5 }, { type: "put_ok" }, NOW)).toMatchObject({ status: "uploaded", attempts: 0 });
  });
  it("skips the PUT when the server already holds the file", () => {
    const p = applyResult(base, { type: "presigned", asset_id: "a", url: null, headers: {}, expires_in: 0, status: "ready" }, NOW);
    expect(p.status).toBe("uploaded");
  });
  it("rolls an interrupted PUT back to presigned with backoff", () => {
    const p = applyResult({ ...base, status: "uploading", attempts: 0 }, { type: "retryable", error: "net" }, NOW);
    expect(p.status).toBe("presigned");
    expect(p.attempts).toBe(1);
    expect(p.next_attempt_at).toBeGreaterThan(NOW);
  });
  it("keeps retrying a poor connection past the old cap, never failing the capture", () => {
    // a storage outage used to turn the whole queue into "failed" after a
    // quarter of an hour; the backoff tops out at five minutes instead
    const p = applyResult({ ...base, attempts: 7 }, { type: "retryable", error: "net" }, NOW, 8);
    expect(p.status).toBe("captured");
    expect(p.attempts).toBe(8);
    expect(p.next_attempt_at).toBeGreaterThan(NOW);
    expect(p.next_attempt_at).toBeLessThanOrEqual(NOW + 301_000);
  });
  it("keeps an uploaded row at uploaded on a retryable confirm error", () => {
    const p = applyResult({ ...base, status: "uploaded" }, { type: "retryable", error: "503" }, NOW);
    expect(p.status).toBe("uploaded");
  });
  it("goes back to PUT when storage has not got the bytes", () => {
    const p = applyResult({ ...base, status: "uploaded" }, { type: "not_in_storage" }, NOW);
    expect(p.status).toBe("presigned");
    expect(p.needs_status).toBe(0);
    // a chunked upload asks storage which parts it lacks instead
    expect(applyResult(big({ status: "uploaded" }), { type: "not_in_storage" }, NOW).needs_status).toBe(1);
  });
  it("re-presigns after a rejected signature, with backoff and a count", () => {
    const p = applyResult({ ...base, status: "uploading", put_url: "u" }, { type: "put_rejected" }, NOW);
    expect(p.status).toBe("captured");
    expect(p.put_url).toBeNull();
    expect(p.attempts).toBe(1);
    expect(p.next_attempt_at).toBeGreaterThan(NOW);
  });
  it("gives up on a destination that refuses every link", () => {
    // presign → PUT → 403 → presign … used to run flat out and for ever,
    // re-sending the whole file each time with the rest of the queue behind it
    const p = applyResult({ ...base, status: "uploading", put_url: "u", attempts: 7 }, { type: "put_rejected" }, NOW, 8);
    expect(p.status).toBe("failed");
    expect(p.last_error).toMatch(/refused 8 upload links/);
  });
  it("parks a fatal error as failed", () => {
    expect(applyResult(base, { type: "fatal", error: "422" }, NOW).status).toBe("failed");
  });
  it("a halt writes nothing", () => {
    expect(applyResult({ ...base, attempts: 2 }, { type: "halt" }, NOW)).toEqual({});
  });
  it("marks confirmed", () => {
    expect(applyResult({ ...base, status: "uploaded" }, { type: "confirmed" }, NOW).status).toBe("confirmed");
  });
});

describe("applyResult · a chunked upload", () => {
  it("records the session and asks storage first", () => {
    const p = applyResult(
      { ...base, size: 3 * CHUNK },
      { type: "presigned", asset_id: "a", url: null, headers: { "Content-Type": "video/mp4" }, expires_in: 900, status: "pending", upload: { protocol: "gcs", chunk_size: CHUNK, size: 3 * CHUNK, session_url: "https://session" } },
      NOW,
    );
    expect(p).toMatchObject({ status: "presigned", upload_mode: "resumable", upload_protocol: "gcs", session_url: "https://session", chunk_size: CHUNK, needs_status: 1, restart: 0, put_url: null });
  });
  it("takes storage's word for what landed, and finishes when it has it all", () => {
    const some = applyResult(big({ needs_status: 1 }), { type: "status_known", bytes_done: null, parts_done: [1, 2] }, NOW);
    expect(some).toMatchObject({ status: "uploading", needs_status: 0, parts_done: "[1,2]" });
    const all = applyResult(big({ needs_status: 1 }), { type: "status_known", bytes_done: null, parts_done: [1, 2, 3, 4] }, NOW);
    expect(all.status).toBe("uploaded");
    const gcs = applyResult(big({ upload_protocol: "gcs", needs_status: 1 }), { type: "status_known", bytes_done: CHUNK, parts_done: [] }, NOW);
    expect(gcs).toMatchObject({ status: "uploading", bytes_done: CHUNK });
  });
  it("keeps the part links it was given, stamped with when they expire", () => {
    const p = applyResult(big(), { type: "part_urls", urls: { "1": "u1", "2": "u2" }, expires_in: 900 }, NOW);
    expect(JSON.parse(p.part_urls!)).toEqual({ 1: { url: "u1", expires_at: NOW + 900_000 }, 2: { url: "u2", expires_at: NOW + 900_000 } });
  });
  it("records a landed part, drops its link, resets the counter, and finishes on the last", () => {
    const row = big({ status: "uploading", attempts: 3, parts_done: "[1,2]", part_urls: JSON.stringify({ ...fresh(3), ...fresh(4) }) });
    const p = applyResult(row, { type: "chunk_ok", part: 3 }, NOW);
    expect(p).toMatchObject({ status: "uploading", parts_done: "[1,2,3]", attempts: 0 });
    expect(JSON.parse(p.part_urls!)).toEqual(fresh(4));
    expect(applyResult({ ...row, ...p }, { type: "chunk_ok", part: 4 }, NOW).status).toBe("uploaded");
  });
  it("records Google's count, not its own, and finishes at the size", () => {
    const row = big({ upload_protocol: "gcs", session_url: "s", status: "uploading" });
    expect(applyResult(row, { type: "chunk_ok", bytes: 2 * CHUNK }, NOW)).toMatchObject({ status: "uploading", bytes_done: 2 * CHUNK });
    expect(applyResult(row, { type: "chunk_ok", bytes: 3 * CHUNK + 5 }, NOW).status).toBe("uploaded");
  });
  it("asks for a new link when a part's was refused, under backoff", () => {
    const row = big({ part_urls: JSON.stringify({ ...fresh(1), ...fresh(2) }) });
    const p = applyResult(row, { type: "part_rejected", part: 1 }, NOW);
    expect(JSON.parse(p.part_urls!)).toEqual(fresh(2));
    expect(p.attempts).toBe(1);
    expect(p.next_attempt_at).toBeGreaterThan(NOW);
    expect(p.status).toBeUndefined();
  });
  it("starts again from a fresh session when storage forgot the old one", () => {
    const row = big({ status: "uploading", session_url: "s", bytes_done: CHUNK, parts_done: "[1]", part_urls: JSON.stringify(fresh(2)) });
    const p = applyResult(row, { type: "session_lost" }, NOW);
    expect(p).toMatchObject({ status: "captured", restart: 1, session_url: null, bytes_done: 0, parts_done: null, part_urls: null, attempts: 1 });
    expect(p.next_attempt_at).toBeGreaterThan(NOW);
    expect(applyResult({ ...row, attempts: 7 }, { type: "session_lost" }, NOW, 8).status).toBe("failed");
  });
});

describe("classify", () => {
  it("retries network, throttling and server errors", () => {
    for (const s of [0, null, undefined, 408, 425, 429, 500, 502, 503]) expect(classify(s)).toBe("retryable");
  });
  it("does not retry client errors", () => {
    for (const s of [400, 401, 403, 404, 409, 413, 422]) expect(classify(s)).toBe("fatal");
  });
});

describe("apiOutcome", () => {
  it("halts the run on a 401 instead of failing the row", () => {
    // the session is what expired, not the capture; the old reading marked
    // every queued row failed, one after another, until the worker signed in
    expect(apiOutcome(401, "presign", "Request failed (401).")).toEqual({ type: "halt" });
  });
  it("labels every other error with its step", () => {
    expect(apiOutcome(410, "hash", "gone")).toEqual({ type: "fatal", error: "hash: gone" });
    expect(apiOutcome(409, "presign", "full")).toEqual({ type: "fatal", error: "presign: full" });
    expect(apiOutcome(503, "confirm", "busy")).toEqual({ type: "retryable", error: "confirm: busy" });
    expect(apiOutcome(0, "presign", "offline")).toEqual({ type: "retryable", error: "presign: offline" });
  });
  it("reads a 410 on a chunked upload as the session being gone", () => {
    expect(apiOutcome(410, "status", "expired", true)).toEqual({ type: "session_lost" });
  });
});

describe("putOutcome", () => {
  it("treats every 2xx as a stored object", () => {
    // 200 = S3/MinIO, 201 = Azure Blob PUT Blob, 204 = some gateways.
    // Azure's 201 was once read as a refusal, failing uploads that had worked.
    for (const s of [200, 201, 202, 204]) {
      expect(putOutcome(s)).toEqual({ type: "put_ok" });
    }
  });

  it("re-presigns on an expired signature", () => {
    expect(putOutcome(403)).toEqual({ type: "put_rejected" });
  });

  it("re-presigns on Google's expired signature, a 400 naming ExpiredToken", () => {
    const body = "<?xml version='1.0' encoding='UTF-8'?><Error><Code>ExpiredToken</Code></Error>";
    expect(putOutcome(400, body)).toEqual({ type: "put_rejected" });
    expect(putOutcome(400, "<Error><Code>InvalidArgument</Code></Error>").type).toBe("fatal");
  });

  it("retries network and server failures", () => {
    for (const s of [0, null, undefined, 429, 500, 503]) {
      expect(putOutcome(s).type).toBe("retryable");
    }
  });

  it("parks a genuine client-side refusal", () => {
    for (const s of [400, 404, 409, 413]) {
      expect(putOutcome(s).type).toBe("fatal");
    }
  });

  it("carries the storage response body into a fatal error", () => {
    const o = putOutcome(400, "InvalidBlobType");
    expect(o.type).toBe("fatal");
    expect("error" in o && o.error).toContain("InvalidBlobType");
  });
});

describe("chunkOutcome", () => {
  const SIZE = 3 * CHUNK + 5;
  it("reads Google's 308 as the count it now holds, and a 2xx as the end", () => {
    expect(chunkOutcome("gcs", 2, SIZE, 308, { Range: `bytes=0-${2 * CHUNK - 1}` })).toEqual({ type: "chunk_ok", bytes: 2 * CHUNK });
    expect(chunkOutcome("gcs", 2, SIZE, 308, { range: `bytes=0-${2 * CHUNK - 1}` })).toEqual({ type: "chunk_ok", bytes: 2 * CHUNK });
    expect(chunkOutcome("gcs", 4, SIZE, 200)).toEqual({ type: "chunk_ok", bytes: SIZE });
  });
  it("reads a dead Google session as lost, and the network as a retry", () => {
    for (const s of [403, 404, 410]) expect(chunkOutcome("gcs", 1, SIZE, s)).toEqual({ type: "session_lost" });
    expect(chunkOutcome("gcs", 1, SIZE, 0).type).toBe("retryable");
    expect(chunkOutcome("gcs", 1, SIZE, 503).type).toBe("retryable");
    expect(chunkOutcome("gcs", 1, SIZE, 400, {}, "bad").type).toBe("fatal");
  });
  it("stages an S3 or Azure part on 2xx, asks for a new link on 403, re-sends on a bad digest", () => {
    expect(chunkOutcome("s3", 3, SIZE, 200, { ETag: '"e3"' })).toEqual({ type: "chunk_ok", part: 3 });
    expect(chunkOutcome("azure", 3, SIZE, 201)).toEqual({ type: "chunk_ok", part: 3 });
    expect(chunkOutcome("s3", 3, SIZE, 403)).toEqual({ type: "part_rejected", part: 3 });
    expect(chunkOutcome("s3", 3, SIZE, 400, {}, "<Code>BadDigest</Code>").type).toBe("retryable");
    expect(chunkOutcome("azure", 3, SIZE, 400, {}, "<Code>Md5Mismatch</Code>").type).toBe("retryable");
    expect(chunkOutcome("s3", 3, SIZE, 400, {}, "<Code>InvalidArgument</Code>").type).toBe("fatal");
    expect(chunkOutcome("s3", 3, SIZE, 503).type).toBe("retryable");
  });
});
