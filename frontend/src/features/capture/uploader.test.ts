import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, type PutResult } from "@api/client";
import type { AssetRow, Presign } from "@api/types";
import type { Derived } from "./facts";
import type { QueueItem } from "./item";
import { UploadQueue, type Deps } from "./uploader";

const MB = 1024 * 1024;

function file(name: string, size = 3 * MB): File {
  const f = new File([new Uint8Array(8)], name, { type: "image/jpeg", lastModified: 1_700_000_000_000 });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

const derive = async (f: File, kind: "photo" | "video"): Promise<Derived> => ({
  facts: { kind, size: f.size, width: 4032, height: 3024, fix: null, tilt: null },
  mime: "image/jpeg",
  captured_at: "2026-09-16T10:00:00.000Z",
  captured_from_exif: true,
  lat: null,
  lon: null,
  duration: null,
  decoded: true,
});

function serverRow(over: Partial<AssetRow>): AssetRow {
  return {
    id: "asset-1", task_id: "t", assignment_id: "as", submission_id: null, captured_by_user_id: "u", captured_by_name: null,
    filename: "old.jpg", mime_type: "image/jpeg", size_bytes: 1, sha256: "sha-old.jpg", etag: null, status: "pending",
    quarantine_reason: null, captured_at: null, captured_lat: null, captured_lon: null, uploaded_at: null, created_at: "", ...over,
  };
}

/** A scripted backend. Each fake records its calls and can be told what to say next. */
function harness(over: Partial<Deps> = {}) {
  const calls: { presign: unknown[]; confirm: string[]; put: string[]; del: string[]; hash: string[] } = { presign: [], confirm: [], put: [], del: [], hash: [] };
  let presignReply: (body: { sha256: string }) => Presign | Error = (b) => ({
    asset_id: `asset-${b.sha256}`, storage_key: "k", url: `https://storage/${b.sha256}`, method: "PUT",
    headers: { "Content-Type": "image/jpeg", "x-ms-blob-type": "BlockBlob" }, expires_in: 900, status: "pending",
  });
  let confirmReply: (assetId: string) => Partial<AssetRow> | Error = () => ({ status: "ready" });
  let putReply: () => PutResult = () => ({ status: 201, body: null });
  let online = true;
  let inFlightNet = 0;
  let maxNet = 0;
  let inFlightHash = 0;
  let maxHash = 0;

  const deps: Deps = {
    post: (async (path: string, body?: unknown) => {
      inFlightNet++;
      maxNet = Math.max(maxNet, inFlightNet);
      try {
        await Promise.resolve();
        if (path.endsWith("/assets/presign")) {
          calls.presign.push(body);
          const r = presignReply(body as { sha256: string });
          if (r instanceof Error) throw r;
          return r;
        }
        const m = /^\/assets\/(.+)\/confirm$/.exec(path);
        if (m) {
          calls.confirm.push(m[1]!);
          const r = confirmReply(m[1]!);
          if (r instanceof Error) throw r;
          return serverRow({ id: m[1]!, ...r });
        }
        throw new Error(`unexpected post ${path}`);
      } finally {
        inFlightNet--;
      }
    }) as Deps["post"],
    del: async (path) => {
      calls.del.push(path);
    },
    xhrPut: async (url) => {
      inFlightNet++;
      maxNet = Math.max(maxNet, inFlightNet);
      try {
        await Promise.resolve();
        calls.put.push(url);
        return putReply();
      } finally {
        inFlightNet--;
      }
    },
    sha256Hex: async (blob) => {
      inFlightHash++;
      maxHash = Math.max(maxHash, inFlightHash);
      try {
        await Promise.resolve();
        calls.hash.push((blob as File).name);
        return `sha-${(blob as File).name}`;
      } finally {
        inFlightHash--;
      }
    },
    derive,
    hasSession: () => true,
    isOnline: () => online,
    now: () => Date.now(),
    ...over,
  };
  const q = new UploadQueue(deps);
  return {
    q,
    calls,
    stats: () => ({ maxNet, maxHash }),
    presign: (fn: typeof presignReply) => (presignReply = fn),
    confirm: (fn: typeof confirmReply) => (confirmReply = fn),
    put: (fn: typeof putReply) => (putReply = fn),
    setOnline: (v: boolean) => (online = v),
    items: () => q.getSnapshot().items,
    item: (name: string) => q.getSnapshot().items.find((i) => i.filename === name)!,
  };
}

const ctx = { spec: { media: ["photo"] }, targetUnit: "photos", quantity: 10, serverRows: [] };

/** let every pending promise and zero-delay timer run */
async function settle(rounds = 30) {
  for (let i = 0; i < rounds; i++) await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("UploadQueue", () => {
  it("takes three files from pick to confirmed, hashing one at a time and at most three on the network", async () => {
    const h = harness();
    const seen: QueueItem[] = [];
    h.q.onConfirmed((i) => seen.push(i));
    await h.q.add("as", [file("a.jpg"), file("b.jpg"), file("c.jpg")], ctx);
    await settle();
    expect(h.items().map((i) => i.status)).toEqual(["confirmed", "confirmed", "confirmed"]);
    expect(h.calls.hash).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
    expect(h.calls.put).toHaveLength(3);
    expect(h.calls.confirm).toHaveLength(3);
    expect(h.stats().maxHash).toBe(1);
    expect(h.stats().maxNet).toBeLessThanOrEqual(3);
    expect(seen).toHaveLength(3);
  });

  it("sends the warnings with the presign, and never a block", async () => {
    const h = harness();
    await h.q.add("as", [file("a.jpg")], { ...ctx, spec: { media: ["photo"], max_tilt_deg: 10 } });
    await settle();
    const body = h.calls.presign[0] as { checks: { code: string; severity: string }[]; captured_at: string; sha256: string };
    expect(body.checks.map((c) => c.code)).toEqual(["tilt_unverified", "web_upload"]);
    expect(body.checks.every((c) => c.severity === "warn")).toBe(true);
    expect(body.captured_at).toBe("2026-09-16T10:00:00.000Z");
    expect(body.sha256).toBe("sha-a.jpg");
  });

  it("skips the PUT when the server already holds the file", async () => {
    const h = harness();
    h.presign((b) => ({ asset_id: `asset-${b.sha256}`, storage_key: "k", url: null, method: "PUT", headers: {}, expires_in: 0, status: "ready" }));
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    expect(h.calls.put).toEqual([]);
    expect(h.calls.confirm).toEqual(["asset-sha-a.jpg"]);
    expect(h.item("a.jpg")).toMatchObject({ status: "confirmed", note: "Already on the server" });
  });

  it("re-presigns the same sha after an expired signature", async () => {
    const h = harness();
    let puts = 0;
    h.put(() => (++puts === 1 ? { status: 403, body: null } : { status: 201, body: null }));
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    expect(h.calls.presign).toHaveLength(2);
    expect((h.calls.presign as { sha256: string }[]).map((p) => p.sha256)).toEqual(["sha-a.jpg", "sha-a.jpg"]);
    expect(h.calls.put).toHaveLength(2);
    expect(h.item("a.jpg").status).toBe("confirmed");
  });

  it("PUTs again when confirm says storage has nothing", async () => {
    const h = harness();
    let confirms = 0;
    h.confirm(() => (++confirms === 1 ? new ApiError(409, "File not uploaded yet.") : { status: "ready" }));
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    await vi.advanceTimersByTimeAsync(6000); // the not_in_storage backoff
    await settle();
    expect(h.calls.put).toHaveLength(2);
    expect(h.calls.confirm).toHaveLength(2);
    expect(h.item("a.jpg").status).toBe("confirmed");
  });

  it("parks a full assignment with the server's own words and asks nothing more", async () => {
    const h = harness();
    const msg = "This assignment is for 3 captures and already has 3. Remove one before adding another.";
    h.presign(() => new ApiError(409, msg));
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    expect(h.item("a.jpg")).toMatchObject({ status: "failed", last_error: `presign: ${msg}` });
    expect(h.calls.put).toEqual([]);
    expect(h.calls.presign).toHaveLength(1);
  });

  it("backs off a flaky PUT and gives up at the cap", async () => {
    const h = harness();
    h.put(() => ({ status: 503, body: null }));
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    expect(h.item("a.jpg").status).toBe("presigned");
    expect(h.item("a.jpg").next_attempt_at).toBeGreaterThan(Date.now());
    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(310_000);
      await settle();
    }
    expect(h.item("a.jpg").status).toBe("failed");
    expect(h.item("a.jpg").last_error).toMatch(/Gave up after 8 attempts/);
    expect(h.calls.put).toHaveLength(8);
  });

  it("stops early with the CORS hint when storage answers nothing while online", async () => {
    const h = harness();
    h.put(() => ({ status: 0, body: null }));
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    await vi.advanceTimersByTimeAsync(6000);
    await settle();
    expect(h.calls.put).toHaveLength(2);
    expect(h.item("a.jpg").status).toBe("failed");
    expect(h.item("a.jpg").last_error).toMatch(/CORS/);
  });

  it("retry keeps the hash and goes round again", async () => {
    const h = harness();
    h.presign(() => new ApiError(422, "bad"));
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    expect(h.item("a.jpg").status).toBe("failed");
    h.presign((b) => ({ asset_id: `asset-${b.sha256}`, storage_key: "k", url: "u", method: "PUT", headers: {}, expires_in: 900, status: "pending" }));
    h.q.retry(h.item("a.jpg").id);
    await settle();
    expect(h.calls.hash).toEqual(["a.jpg"]);
    expect(h.item("a.jpg").status).toBe("confirmed");
  });

  it("discard deletes a presigned asset on the server, and not a confirmed one", async () => {
    const h = harness();
    h.put(() => ({ status: 503, body: null }));
    await h.q.add("as", [file("a.jpg"), file("b.jpg")], ctx);
    await settle();
    const a = h.item("a.jpg");
    expect(a.status).toBe("presigned");
    await h.q.discard(a.id);
    expect(h.calls.del).toEqual(["/assets/asset-sha-a.jpg"]);

    // b is not failed, only backing off; storage recovering is enough
    h.put(() => ({ status: 201, body: null }));
    await vi.advanceTimersByTimeAsync(6000);
    await settle();
    const b = h.item("b.jpg");
    expect(b.status).toBe("confirmed");
    await h.q.discard(b.id);
    expect(h.calls.del).toHaveLength(1);
    expect(h.items()).toEqual([]);
  });

  it("waits while offline and resumes on kick", async () => {
    const h = harness();
    h.setOnline(false);
    await h.q.add("as", [file("a.jpg")], ctx);
    await settle();
    expect(h.calls.hash).toEqual([]);
    h.setOnline(true);
    h.q.kick();
    await settle();
    expect(h.item("a.jpg").status).toBe("confirmed");
  });

  it("adopts a pending row from the server and confirms it without the bytes", async () => {
    const h = harness();
    h.q.adopt("as", [serverRow({ id: "asset-old", status: "pending" }), serverRow({ id: "asset-ready", status: "ready" })]);
    await settle();
    expect(h.calls.confirm).toEqual(["asset-old"]);
    expect(h.calls.presign).toEqual([]);
    expect(h.item("old.jpg").status).toBe("confirmed");
  });

  it("fails a leftover whose bytes never reached storage, with zero presigns", async () => {
    const h = harness();
    h.confirm(() => new ApiError(409, "File not uploaded yet."));
    h.q.adopt("as", [serverRow({ id: "asset-old", status: "pending" })]);
    await settle();
    await vi.advanceTimersByTimeAsync(6000);
    await settle();
    expect(h.item("old.jpg").status).toBe("failed");
    expect(h.item("old.jpg").last_error).toMatch(/pick it again/);
    expect(h.calls.presign).toEqual([]);
  });

  it("re-picking the leftover's file gives it its bytes back", async () => {
    const h = harness();
    h.confirm(() => new ApiError(409, "File not uploaded yet."));
    h.q.adopt("as", [serverRow({ id: "asset-old", status: "pending", sha256: "sha-old.jpg" })]);
    await settle();
    await vi.advanceTimersByTimeAsync(6000);
    await settle();
    expect(h.item("old.jpg").status).toBe("failed");

    h.confirm(() => ({ status: "ready" }));
    await h.q.add("as", [file("old.jpg")], ctx);
    await settle();
    expect(h.items()).toHaveLength(1);
    expect(h.item("old.jpg").status).toBe("confirmed");
    expect(h.calls.put).toHaveLength(1);
  });

  it("does not resurrect a leftover the worker removed", async () => {
    const h = harness();
    h.confirm(() => new ApiError(409, "File not uploaded yet."));
    h.q.adopt("as", [serverRow({ id: "asset-old", status: "pending" })]);
    await settle();
    await vi.advanceTimersByTimeAsync(6000);
    await settle();
    await h.q.discard(h.item("old.jpg").id);
    expect(h.calls.del).toEqual(["/assets/asset-old"]);
    h.q.adopt("as", [serverRow({ id: "asset-old", status: "pending" })]);
    expect(h.items()).toEqual([]);
  });

  it("refuses the same bytes picked under two names", async () => {
    const h = harness();
    const twin: Deps["sha256Hex"] = async () => "same";
    const h2 = harness({ sha256Hex: twin });
    void h;
    await h2.q.add("as", [file("a.jpg"), file("b.jpg")], ctx);
    await settle();
    expect(h2.items().map((i) => i.filename)).toEqual(["a.jpg"]);
    expect(h2.q.getSnapshot().refusals.map((r) => r.findings[0]!.code)).toEqual(["duplicate"]);
  });
});
