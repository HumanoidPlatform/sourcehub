import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { xhrPut } from "./client";

/** The parts of XMLHttpRequest xhrPut touches, driven by the test. */
class FakeXhr {
  static last: FakeXhr;
  method = "";
  url = "";
  headers: Record<string, string> = {};
  sent: unknown = null;
  status = 0;
  responseText = "";
  aborted = false;
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send(body: unknown) {
    this.sent = body;
  }
  abort() {
    this.aborted = true;
  }
  // test controls
  progress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }
  respond(status: number, body = "") {
    this.status = status;
    this.responseText = body;
    this.onload?.();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const blob = new Blob(["bytes"]);

describe("xhrPut", () => {
  it("resolves with whatever status storage answers, and the body", async () => {
    const p = xhrPut("https://s/1", blob, { "Content-Type": "image/jpeg", "x-ms-blob-type": "BlockBlob" });
    const x = FakeXhr.last;
    expect(x.method).toBe("PUT");
    expect(x.sent).toBe(blob);
    // exactly the presign's headers, no bearer — the URL is the credential
    expect(x.headers).toEqual({ "Content-Type": "image/jpeg", "x-ms-blob-type": "BlockBlob" });
    x.respond(201);
    await expect(p).resolves.toEqual({ status: 201, body: null });
  });

  it("carries a refusal body through", async () => {
    const p = xhrPut("https://s/1", blob, {});
    FakeXhr.last.respond(400, "InvalidBlobType");
    await expect(p).resolves.toEqual({ status: 400, body: "InvalidBlobType" });
  });

  it("reports a network error as status 0, never a rejection", async () => {
    const p = xhrPut("https://s/1", blob, {});
    FakeXhr.last.onerror?.();
    await expect(p).resolves.toEqual({ status: 0, body: null });
  });

  it("passes upload progress to the caller", async () => {
    const seen: [number, number][] = [];
    const p = xhrPut("https://s/1", blob, {}, { onProgress: (s, t) => seen.push([s, t]) });
    FakeXhr.last.progress(10, 100);
    FakeXhr.last.progress(100, 100);
    FakeXhr.last.respond(200);
    await p;
    expect(seen).toEqual([[10, 100], [100, 100]]);
  });

  it("cuts a socket that reports no progress, as a retryable 0", async () => {
    const p = xhrPut("https://s/1", blob, {}, { stallMs: 1000 });
    FakeXhr.last.progress(1, 100);
    await vi.advanceTimersByTimeAsync(900);
    FakeXhr.last.progress(2, 100); // still alive: the clock restarts
    await vi.advanceTimersByTimeAsync(900);
    expect(FakeXhr.last.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(FakeXhr.last.aborted).toBe(true);
    await expect(p).resolves.toEqual({ status: 0, body: null });
  });

  it("rejects only when the caller aborts", async () => {
    const ac = new AbortController();
    const p = xhrPut("https://s/1", blob, {}, { signal: ac.signal });
    ac.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
    expect(FakeXhr.last.aborted).toBe(true);
  });
});
