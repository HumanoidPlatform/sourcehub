// The client's landing page. Two invariants it exists to defend:
//
//   1. A failed request must NOT look like an empty account. The page this
//      replaced never checked isError, so a client with five live contracts
//      was told to "publish your first request" whenever the API hiccuped.
//   2. "Waiting on you" must only ever list things the client can act on —
//      the moment it lists work in flight, people stop reading it.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Overview } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
}));
vi.mock("@api/client", () => api);
vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Priya Nair",
    org_name: "Acme Retail Analytics",
    org_kind: "client",
    role: "client",
    capabilities: [],
  }),
}));

import { ClientOverview } from "./client";

const OVERVIEW: Overview = {
  generated_at: "2026-09-20T10:00:00Z",
  requests: { by_status: { draft: 2, in_progress: 4, completed: 1 }, total: 7 },
  deliveries: [
    {
      contract_id: "c1",
      reference_code: "CTR-01",
      partner_name: "NorthStar Delivery Partners",
      value: "100.00",
      currency: "USD",
      status: "active",
      delivery_due_on: null,
      total: 4,
      done: 1,
      pct: 25,
      assets_accepted: 50,
    },
    {
      contract_id: "c3",
      reference_code: "CTR-03",
      partner_name: "NorthStar Delivery Partners",
      value: "80.00",
      currency: "USD",
      status: "completed",
      delivery_due_on: null,
      total: 1,
      done: 1,
      pct: 100,
      assets_accepted: 2,
    },
  ],
  delivery: { live: 1, tasks_total: 4, tasks_done: 1, pct: 25 },
  money: { committed: "100.00", paid: "80.00", outstanding: "6096.50", currency: "USD" },
  captures: { accepted: 52, days: 30, series: [{ day: "2026-09-15", count: 52 }] },
  attention: [
    {
      kind: "review_proposals",
      entity_id: "r7",
      reference_code: "RFP-1007",
      title: "Shelf audit",
      count: 3,
      due_on: null,
    },
  ],
};

const EMPTY: Overview = {
  generated_at: "2026-09-20T10:00:00Z",
  requests: { by_status: {}, total: 0 },
  deliveries: [],
  delivery: { live: 0, tasks_total: 0, tasks_done: 0, pct: 0 },
  money: { committed: "0", paid: "0", outstanding: "0", currency: "USD" },
  captures: { accepted: 0, days: 30, series: [] },
  attention: [],
};

function show() {
  const router = createMemoryRouter(
    [
      { path: "/", element: <ClientOverview /> },
      { path: "/requests", element: <p>requests page</p> },
      { path: "/requests/:id", element: <p>request detail</p> },
    ],
    { initialEntries: ["/"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

function serve(overview: Overview | Error, activity: unknown[] = []) {
  api.get.mockReset().mockImplementation((path: string) => {
    if (String(path).startsWith("/overview")) {
      return overview instanceof Error ? Promise.reject(overview) : Promise.resolve(overview);
    }
    return Promise.resolve(activity);
  });
}

/** The number under a KPI label — "1" on its own matches three things. */
function metric(label: string): string {
  const el = screen.getByText(label).closest(".metric");
  return el?.querySelector(".val")?.textContent?.trim() ?? "";
}

beforeEach(() => api.get.mockReset());

describe("client overview", () => {
  it("shows the four headline numbers from one call", async () => {
    serve(OVERVIEW);
    show();
    // A panel title renders before its query resolves — wait for the data.
    await screen.findByText("CTR-01");
    expect(metric("Needs you")).toBe("1");
    expect(metric("In delivery")).toBe("1");
    expect(metric("Captures accepted")).toBe("52");
    // Committed is work in flight — CTR-03 is finished and must not be in it.
    expect(metric("Committed")).toBe("$100");
    expect(screen.getByText(/\$80 paid · \$6,096.50 outstanding/)).toBeTruthy();
  });

  it("lists only live contracts under delivery progress", async () => {
    serve(OVERVIEW);
    show();
    expect(await screen.findByText("CTR-01")).toBeTruthy();
    // CTR-03 is completed — it still counts towards captures, but it is not
    // "in delivery" and must not sit in the progress list for ever.
    expect(screen.queryByText("CTR-03")).toBeNull();
  });

  it("asks for the decision it needs, with a way to make it", async () => {
    serve(OVERVIEW);
    show();
    expect(await screen.findByText(/3 proposals in on RFP-1007/)).toBeTruthy();
    const cta = screen.getByRole("link", { name: "Review" });
    expect(cta.getAttribute("href")).toBe("/requests/r7");
  });

  it("says nothing needs you when nothing does", async () => {
    serve({ ...OVERVIEW, attention: [] });
    show();
    expect(await screen.findByText("Nothing needs you")).toBeTruthy();
  });

  it("a failed load reads as a failure, never as an empty account", async () => {
    serve(new Error("Service unavailable"));
    show();
    expect(await screen.findAllByText(/Could not load/)).toBeTruthy();
    // The regression that motivated this page: these are what a brand new
    // client sees, and a client whose request merely failed must not.
    expect(screen.queryByText("No requests yet")).toBeNull();
    expect(screen.queryByText("Nothing in delivery yet")).toBeNull();
    expect(screen.queryByText("Nothing needs you")).toBeNull();
  });

  it("a genuinely new client gets somewhere to start", async () => {
    serve(EMPTY);
    show();
    expect(await screen.findByText("No requests yet")).toBeTruthy();
    expect(screen.getByText("Nothing in delivery yet")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "New request" }).length).toBeGreaterThan(0);
  });

  it("describes the capture chart in words, for anyone who cannot see it", async () => {
    serve(OVERVIEW);
    show();
    const chart = await screen.findByRole("img", { name: /52 captures over 30 days/ });
    expect(chart).toBeTruthy();
  });
});
