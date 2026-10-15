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

// The record stays on the phone: relisting no longer asks the worker (db/400),
// so nothing is sent to the server.
const mockPost = jest.fn(async (_path: string, _body?: unknown): Promise<unknown> => ({}));
jest.mock("../src/api/client", () => ({ post: (p: string, b?: unknown) => mockPost(p, b) }));

import { PRIVACY_NOTICE_VERSION, consentKey, isCurrent } from "../src/consent";
import { _resetConsentCache, acceptConsent, loadConsent } from "../src/consentStore";

beforeEach(() => {
  mockKv.clear();
  mockState.failWrites = false;
  mockState.readGate = null;
  mockPost.mockReset();
  _resetConsentCache();
});

describe("the record stays on the phone", () => {
  it("accepting and reading send nothing to the server", async () => {
    await acceptConsent("u1");
    _resetConsentCache();
    await loadConsent("u1");
    await Promise.resolve();
    expect(mockPost).not.toHaveBeenCalled();
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

  it("writes the five-field record", async () => {
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
