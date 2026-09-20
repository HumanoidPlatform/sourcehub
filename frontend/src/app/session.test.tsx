// How a session ends, and what the next person to sign in sees.
//
// These drive the real router and auth provider over a stubbed fetch. They pin:
// the sign-in page saying WHY it appeared, returning to the page the user was
// on, a server error during refresh NOT signing anyone out, the query cache not
// carrying one person's data into the next person's session, and a tab
// following a sign-out made in another tab.

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { AuthProvider, returnPath, useAuth } from "@shared/auth";
import { AppRouter } from "./router";

const session = (user: string, org = "o1") => ({
  access_token: `access-${user}`,
  refresh_token: `refresh-${user}`,
  user_id: user,
  full_name: `User ${user}`,
  email: `${user}@example.com`,
  org_id: org,
  org_kind: "client",
  org_name: "Acme Retail Analytics",
  role: "client",
  scope: "owner",
  capabilities: [],
  must_change_password: false,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const stored = () => localStorage.getItem("sourcehub.session");

/**
 * The API as these tests need it. `refresh` decides what /auth/refresh answers;
 * until someone signs in again, every other request is refused as expired.
 */
function stubApi(refresh: number) {
  let signedInAgain = false;
  const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    const u = String(url);
    if (u.endsWith("/auth/login")) {
      signedInAgain = true;
      return json(200, session("u1"));
    }
    if (u.endsWith("/auth/refresh")) {
      return refresh === 200 ? json(200, session("u1")) : json(refresh, { detail: "refused" });
    }
    if (!signedInAgain) return json(401, { detail: "Invalid or expired token" });
    if (u.includes("/notifications")) return json(200, { unread: 0, items: [] });
    return json(200, []);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function Where() {
  const l = useLocation();
  return <output data-testid="where">{l.pathname + l.search}</output>;
}

// The same shape as main.tsx: a data router whose single splat route renders
// AppRouter, so these flows run under the router production uses.
function renderApp(at: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <AuthProvider>
            <ToastProvider>
              <AppRouter />
              <Where />
            </ToastProvider>
          </AuthProvider>
        ),
      },
    ],
    { initialEntries: [at] },
  );
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

async function signIn() {
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "u1@example.com" } });
  fireEvent.change(screen.getByLabelText(/Password/), { target: { value: "correct horse" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

const where = () => screen.getByTestId("where").textContent;

beforeEach(() => {
  localStorage.clear();
  listOwner = "u1";
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("when a session expires", () => {
  it("says so on the sign-in page, then returns the user to the page they were on", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("u1")));
    stubApi(401);
    renderApp("/requests?status=open");

    expect(await screen.findByText("Your session has expired")).toBeTruthy();
    expect(where()).toBe("/login");
    expect(stored()).toBeNull();

    await signIn();
    await waitFor(() => expect(where()).toBe("/requests?status=open"));
    expect(screen.queryByText("Your session has expired")).toBeNull();
  });

  it("does not sign anyone out when the refresh fails with a server error", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("u1")));
    const fetchMock = stubApi(502);
    renderApp("/requests");

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith("/auth/refresh"))).toBe(true),
    );
    // a restarting API is not a revoked session
    expect(stored()).not.toBeNull();
    expect(where()).toBe("/requests");
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  });
});

describe("a link followed while signed out", () => {
  it("leads to sign-in and then to the linked page, with no expiry message", async () => {
    stubApi(401);
    renderApp("/requests/r-42");
    expect(where()).toBe("/login");
    expect(screen.queryByText("Your session has expired")).toBeNull();

    await signIn();
    await waitFor(() => expect(where()).toBe("/requests/r-42"));
  });
});

describe("the sign-in card", () => {
  it("shows the name but does not link it — there is no workspace to go to yet", () => {
    stubApi(401);
    renderApp("/login");
    expect(screen.getByText("DataMind360")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "DataMind360 home" })).toBeNull();
  });
});

describe("returnPath", () => {
  it("honours only a path on this site", () => {
    expect(returnPath({ from: "/requests?status=open" })).toBe("/requests?status=open");
    expect(returnPath({ from: "//evil.example/phish" })).toBe("/");
    expect(returnPath({ from: "https://evil.example" })).toBe("/");
    expect(returnPath({ from: "/login" })).toBe("/");
    expect(returnPath({ from: 42 })).toBe("/");
    expect(returnPath(null)).toBe("/");
  });
});

// Harness for the provider on its own: a list that is cached for good, shown
// only while someone is signed in.
let listOwner = "u1"; // reset before each test
function List() {
  const q = useQuery({ queryKey: ["list"], queryFn: async () => `${listOwner}'s list`, staleTime: Infinity });
  return <p>{q.data ?? "loading"}</p>;
}
function Harness() {
  const { session, ended, login, logout } = useAuth();
  return (
    <>
      {session && <List />}
      <p data-testid="ended">{ended ?? "none"}</p>
      <button type="button" onClick={() => void logout()}>out</button>
      <button type="button" onClick={() => void login("u2@example.com", "pw")}>in as u2</button>
    </>
  );
}
function renderProvider() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <Harness />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("the query cache across people", () => {
  it("does not show the previous person's data to the next one", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("u1")));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL) =>
        String(url).endsWith("/auth/login") ? json(200, session("u2")) : new Response(null, { status: 204 }),
      ),
    );
    renderProvider();
    expect(await screen.findByText("u1's list")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "out" }));
    await waitFor(() => expect(stored()).toBeNull());

    listOwner = "u2";
    fireEvent.click(screen.getByRole("button", { name: "in as u2" }));
    await waitFor(() => expect(screen.queryByText("loading") ?? screen.queryByText("u2's list")).toBeTruthy());
    // Before the fix the cached list was handed straight to u2 and, being
    // fresh, never refetched.
    expect(screen.queryByText("u1's list")).toBeNull();
    expect(await screen.findByText("u2's list")).toBeTruthy();
  });
});

describe("another tab", () => {
  it("signing out there signs this tab out too, and says where it happened", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("u1")));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    renderProvider();
    expect(await screen.findByText("u1's list")).toBeTruthy();

    // what the other tab's sign-out looks like from here
    localStorage.removeItem("sourcehub.session");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "sourcehub.session" }));
    });
    expect(screen.queryByText("u1's list")).toBeNull();
    expect(screen.getByTestId("ended").textContent).toBe("elsewhere");
  });

  it("signing in there as someone else replaces what this tab is showing", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("u1")));
    // the API answers as whoever's token arrives
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        const u = String(url);
        const who = (init?.headers as Record<string, string> | undefined)?.Authorization?.replace("Bearer access-", "");
        if (u.includes("/notifications")) return json(200, { unread: 0, items: [] });
        if (u.endsWith("/requests")) {
          return json(200, [{
            id: `r-${who}`, reference_code: `REQ-${who}`, title: `${who}'s request`, category: "data",
            budget_min: 1, budget_max: 2, proposal_count: 0, status: "open",
          }]);
        }
        return json(200, []);
      }),
    );
    renderApp("/requests");
    expect(await screen.findByText("u1's request")).toBeTruthy();
    // something only u1 did: narrow the list
    fireEvent.change(screen.getByLabelText("Filter requests"), { target: { value: "REQ-u1" } });

    localStorage.setItem("sourcehub.session", JSON.stringify(session("u2")));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "sourcehub.session" }));
    });
    // u1's data is gone at once, and u2's page starts over: u1's filter would
    // otherwise hide every one of u2's requests behind "Nothing matches that".
    expect(screen.queryByText("u1's request")).toBeNull();
    expect(await screen.findByText("u2's request")).toBeTruthy();
    expect((screen.getByLabelText("Filter requests") as HTMLInputElement).value).toBe("");
  });

  it("a token refresh there changes nothing here", async () => {
    localStorage.setItem("sourcehub.session", JSON.stringify(session("u1")));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    renderProvider();
    expect(await screen.findByText("u1's list")).toBeTruthy();

    listOwner = "changed";
    localStorage.setItem("sourcehub.session", JSON.stringify({ ...session("u1"), access_token: "rotated" }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "sourcehub.session" }));
    });
    // same person, same organisation: the cache is kept and nothing refetches
    expect(screen.getByText("u1's list")).toBeTruthy();
    expect(screen.getByTestId("ended").textContent).toBe("none");
  });
});
