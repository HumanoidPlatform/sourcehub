// DataHub's addresses. The data marketplace moved from /catalogue, /datasets and
// /ops/catalogue to /datahub, /datahub/public and /ops/datahub; links in emails,
// bookmarks and notifications sent before the move still arrive.
//
// Drives the real router and auth provider, as session.test.tsx does, with a
// stored session and a fetch that answers everything with nothing.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { AuthProvider } from "@shared/auth";
import { AppRouter } from "./router";

const SESSION = {
  access_token: "access-u1", refresh_token: "refresh-u1", user_id: "u1", full_name: "User u1",
  email: "u1@example.com", org_id: "o1", org_kind: "client", org_name: "Acme Retail Analytics",
  role: "client", scope: "owner", capabilities: ["catalogue.buy", "catalogue.list", "catalogue.quote"],
  must_change_password: false,
};

beforeEach(() => {
  localStorage.setItem("sourcehub.session", JSON.stringify(SESSION));
  vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL) => new Response(
    JSON.stringify(String(url).includes("/notifications") ? { unread: 0, items: [] } : []),
    { status: 200, headers: { "Content-Type": "application/json" } },
  )));
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function landAt(from: string) {
  const router = createMemoryRouter(
    [{ path: "*", element: <AuthProvider><ToastProvider><AppRouter /></ToastProvider></AuthProvider> }],
    { initialEntries: [from] },
  );
  const view = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, view };
}

describe("DataHub's old addresses", () => {
  it.each([
    ["/catalogue", "/datahub"],
    ["/catalogue/deals", "/datahub/deals"],
    ["/catalogue/deals/k1", "/datahub/deals/k1"],
    ["/catalogue/mine", "/datahub/mine"],
    ["/catalogue/mine/new", "/datahub/mine/new"],
    ["/catalogue/mine/d1", "/datahub/mine/d1"],
    ["/catalogue/street-abc123", "/datahub/street-abc123"],
    ["/ops/catalogue", "/ops/datahub"],
    ["/datasets", "/datahub/public"],
    ["/datasets/street-abc123", "/datahub/public/street-abc123"],
  ])("%s leads to %s", async (from, to) => {
    const { router, view } = landAt(from);
    await waitFor(() => expect(router.state.location.pathname).toBe(to));
    view.unmount();
  });

  it("the public page answers at its new address", async () => {
    const { router, view } = landAt("/datahub/public");
    expect(await view.findByRole("heading", { name: "DataHub" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/datahub/public");
    view.unmount();
  });
});
