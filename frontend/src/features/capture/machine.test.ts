import { describe, expect, it } from "vitest";
import { applyResult, classify, planNext, putOutcome, type RowLike } from "./machine";

const base: RowLike = {
  status: "captured",
  sha256: null,
  url_expires_at: null,
  put_url: null,
  asset_id: null,
  attempts: 0,
  next_attempt_at: 0,
};

const NOW = 1_700_000_000_000;

describe("planNext", () => {
  it("hashes before anything else", () => {
    expect(planNext(base, NOW)).toEqual({ type: "hash" });
  });
  it("presigns once the hash is known", () => {
    expect(planNext({ ...base, sha256: "ab" }, NOW)).toEqual({ type: "presign" });
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

describe("applyResult", () => {
  it("records the presign and resets the attempt counter", () => {
    const p = applyResult({ ...base, attempts: 3 }, { type: "presigned", asset_id: "a", url: "u", headers: {}, expires_in: 900, status: "pending" }, NOW);
    expect(p).toMatchObject({ status: "presigned", asset_id: "a", put_url: "u", url_expires_at: NOW + 900_000, attempts: 0 });
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
  it("keeps an uploaded row at uploaded on a retryable confirm error", () => {
    const p = applyResult({ ...base, status: "uploaded" }, { type: "retryable", error: "503" }, NOW);
    expect(p.status).toBe("uploaded");
  });
  it("goes back to PUT when storage has not got the bytes", () => {
    const p = applyResult({ ...base, status: "uploaded" }, { type: "not_in_storage" }, NOW);
    expect(p.status).toBe("presigned");
  });
  it("re-presigns after a rejected signature", () => {
    const p = applyResult({ ...base, status: "uploading", put_url: "u" }, { type: "put_rejected" }, NOW);
    expect(p.status).toBe("captured");
    expect(p.put_url).toBeNull();
  });
  it("parks a fatal error as failed", () => {
    expect(applyResult(base, { type: "fatal", error: "422" }, NOW).status).toBe("failed");
  });
  it("gives up after the attempt cap", () => {
    const p = applyResult({ ...base, attempts: 7 }, { type: "retryable", error: "net" }, NOW, 8);
    expect(p.status).toBe("failed");
  });
  it("marks confirmed", () => {
    expect(applyResult({ ...base, status: "uploaded" }, { type: "confirmed" }, NOW).status).toBe("confirmed");
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

// The one place this port differs from the phone: SQLite needed a JSON
// string, the browser keeps the object the API sent.
describe("applyResult · browser headers", () => {
  it("keeps the presign headers as an object", () => {
    const p = applyResult(base, { type: "presigned", asset_id: "a", url: "u", headers: { "x-ms-blob-type": "BlockBlob" }, expires_in: 900, status: "pending" }, NOW);
    expect(p.put_headers).toEqual({ "x-ms-blob-type": "BlockBlob" });
  });
  it("notes a file the server already held", () => {
    const p = applyResult(base, { type: "presigned", asset_id: "a", url: null, headers: {}, expires_in: 0, status: "ready" }, NOW);
    expect(p.note).toBe("Already on the server");
  });
});
