// The store behind the privacy notice, with the phone's key-value table mocked.
// What matters here is ordering: the layout redirects on this state, so a
// stale answer for even one read sends a worker who agreed back to the notice.

// jest hoists jest.mock above everything, and only lets the factory see
// variables whose names start with "mock".
const mockKv = new Map<string, string>();
const mockState: { failWrites: boolean; readGate: Promise<void> | null } = { failWrites: false, readGate: null };

jest.mock("../src/db/kv", () => ({
  getKv: jest.fn(async (k: string) => {
    if (mockState.readGate) await mockState.readGate; // lets a test hold a read "in flight"
    return mockKv.get(k) ?? null;
  }),
  setKv: jest.fn(async (k: string, v: string) => {
    if (mockState.failWrites) throw new Error("disk full");
    mockKv.set(k, v);
  }),
}));

const mockPost = jest.fn(async (_path: string, _body?: unknown): Promise<unknown> => ({}));
jest.mock("../src/api/client", () => ({ post: (p: string, b?: unknown) => mockPost(p, b) }));

import { PRIVACY_NOTICE_VERSION, consentKey, isCurrent, makeRecord } from "../src/consent";
import { _resetConsentCache, acceptConsent, loadConsent, uploadConsent } from "../src/consentStore";

beforeEach(() => {
  mockKv.clear();
  mockState.failWrites = false;
  mockState.readGate = null;
  mockPost.mockReset();
  mockPost.mockImplementation(async () => ({}));
  _resetConsentCache();
});

describe("the server copy", () => {
  it("accepting sends the record to the server, with the version as a number", async () => {
    const rec = await acceptConsent("u1");
    await Promise.resolve();
    expect(mockPost).toHaveBeenCalledWith("/me/consents", {
      document: "worker_privacy_notice",
      version: Number(PRIVACY_NOTICE_VERSION),
      accepted_at: rec.accepted_at,
      app_version: rec.app_version,
      platform: rec.platform,
    });
  });

  it("no signal never blocks the worker, and the next read sends it again", async () => {
    mockPost.mockImplementation(async () => {
      throw new Error("offline");
    });
    const rec = await acceptConsent("u1");
    expect(isCurrent(rec)).toBe(true);
    await Promise.resolve();
    mockPost.mockReset();
    mockPost.mockImplementation(async () => ({}));
    _resetConsentCache();
    await loadConsent("u1");
    await Promise.resolve();
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("sends a record once per session, not on every read", async () => {
    const rec = makeRecord(new Date(), "1.0.0", "android");
    expect(await uploadConsent("u1", rec)).toBe(true);
    expect(await uploadConsent("u1", rec)).toBe(true);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});

describe("consent store", () => {
  it("reports 'not accepted' for someone who has never been asked", async () => {
    expect(await loadConsent("u1")).toBeNull();
  });

  it("accepting records this version of the notice", async () => {
    const rec = await acceptConsent("u1");
    expect(rec.version).toBe(PRIVACY_NOTICE_VERSION);
    expect(isCurrent(rec)).toBe(true);
    expect(isCurrent(await loadConsent("u1"))).toBe(true);
  });

  it("writes the five-field record the server will want", async () => {
    await acceptConsent("u1");
    const saved = JSON.parse(mockKv.get(consentKey("u1"))!);
    expect(Object.keys(saved).sort()).toEqual(["accepted_at", "app_version", "document", "platform", "version"]);
    expect(saved.document).toBe("worker_privacy_notice");
  });

  it("an accept that lands while a read is in flight is not overwritten by it", async () => {
    // The bug this store was rewritten for: the read started first and finishes
    // last, carrying "nothing saved" — and must not win.
    let release!: () => void;
    mockState.readGate = new Promise<void>((r) => (release = r));
    const slowRead = loadConsent("u1"); // in flight, will see an empty store
    mockState.readGate = null;
    await acceptConsent("u1");
    release();
    const got = await slowRead;
    expect(isCurrent(got)).toBe(true);
  });

  it("survives an app restart: a fresh cache reads the saved answer back", async () => {
    await acceptConsent("u1");
    _resetConsentCache(); // what a cold start looks like
    expect(isCurrent(await loadConsent("u1"))).toBe(true);
  });

  it("a failed write is reported and leaves the worker un-accepted", async () => {
    mockState.failWrites = true;
    await expect(acceptConsent("u1")).rejects.toThrow("disk full");
    mockState.failWrites = false;
    expect(await loadConsent("u1")).toBeNull();
  });

  it("is per person: one worker agreeing says nothing about the next on a shared phone", async () => {
    await acceptConsent("u1");
    expect(await loadConsent("u2")).toBeNull();
    expect(isCurrent(await loadConsent("u1"))).toBe(true);
  });

  it("treats a corrupted saved value as 'ask again'", async () => {
    mockKv.set(consentKey("u1"), "{not json");
    expect(await loadConsent("u1")).toBeNull();
  });
});
