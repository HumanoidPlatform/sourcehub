// Token refresh must recover from a refresh request that throws.
//
// It used to reset its in-flight promise only after `await fetch(...)`
// succeeded, so one network failure during a refresh left a rejected promise in
// place for the life of the tab: every later 401 was handed the same rejection
// and the console failed everywhere until a reload.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "./client";

const SESSION = {
  access_token: "old-access",
  refresh_token: "refresh-1",
  user_id: "u1",
  org_id: "o1",
  org_kind: "client",
  org_name: "Acme",
  role: "client",
  scope: "owner",
  capabilities: [],
  must_change_password: false,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  localStorage.setItem("sourcehub.session", JSON.stringify(SESSION));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("token refresh", () => {
  it("recovers on the next request after a refresh that threw", async () => {
    const fetchMock = vi
      .fn()
      // first request: token expired, and the refresh call itself fails at the network
      .mockResolvedValueOnce(json(401, { detail: "Invalid or expired token" }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      // second request: still expired, but this time the refresh goes through
      .mockResolvedValueOnce(json(401, { detail: "Invalid or expired token" }))
      .mockResolvedValueOnce(json(200, { ...SESSION, access_token: "new-access" }))
      .mockResolvedValueOnce(json(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(get("/things")).rejects.toThrow("Failed to fetch");

    // Before the fix this rejected instantly with the same stale error and never
    // called fetch again.
    await expect(get("/things")).resolves.toEqual({ ok: true });

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh"));
    expect(refreshCalls).toHaveLength(2);
    // the retried request carried the new token
    const lastInit = fetchMock.mock.calls.at(-1)![1] as RequestInit;
    expect((lastInit.headers as Record<string, string>).Authorization).toBe("Bearer new-access");
  });

  it("keeps the session when the refresh fails at the network, rather than signing you out", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json(401, { detail: "Invalid or expired token" }))
        .mockRejectedValueOnce(new TypeError("Failed to fetch")),
    );

    await expect(get("/things")).rejects.toThrow();
    // a dropped connection is not a revoked session
    expect(localStorage.getItem("sourcehub.session")).not.toBeNull();
  });
});
