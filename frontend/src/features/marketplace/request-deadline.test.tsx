// The bidding deadline, on the real pages.
//
// The server refuses a late bid and a request published without a deadline;
// these pin that the console asks for the deadline, checks it the way the
// server will (future; on or before delivery, in UTC), sends it as an ISO
// instant, shows the countdown, hides Respond once the window has shut, and
// lets the client move the window through the one endpoint that allows it.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

const session = vi.hoisted(() => ({
  current: {
    full_name: "Priya Nair", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: [] as string[],
  },
}));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { OpportunitiesPage, RequestDetailPage, RequestNewPage } from "./pages";

// Far enough out that "in the future" holds for years; the runner's zone is
// unknown, so the delivery date sits days clear of every deadline used.
const RFP = {
  id: "r1", reference_code: "RFP-1011", title: "Storefront photos, Pune",
  category: "image", status: "published", stored_status: "published",
  client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  proposal_count: 0, geography: "Pune, India", compliance_notes: null,
  objective: "Shelf-level imagery.", use_case: "audit_compliance",
  spec: {
    quality: null, target_quantity: 4000, target_unit: "photos",
    capture: {}, countries: ["IN"], location_type: "public_outdoor", sampling_frame: {},
  },
  acceptance: null,
  quality: { thresholds: {}, rejection_policy: {} },
  compliance: {
    people_in_frame: "none", minors_policy: "prohibited", deidentification: [],
    regulations: [], lawful_basis: "legitimate_interest", permitted_uses: ["audit"],
    partner_reuse_allowed: false, biometric_processing: false,
  },
  people: { headcount: 0, training: null, experience: null, certification: null },
  budget_disclosed: true, currency: "USD",
  pricing: { basis: "total", unit: null, block: null, quantity: null, amount: "1500.00",
    estimated_total: "1500.00", currency: "USD", text: "USD 1,500.00" },
  pilot: { required: false, quantity: null, due_on: null },
  proposal_requirements: [], proposals_close_at: "2030-11-10T10:00:00Z", bidding_open: true,
  contact_user_id: null, starts_on: "2030-09-30", delivery_due_on: "2030-11-15", storage_target_id: null,
  created_at: "2026-09-01T00:00:00+00:00", attachments: [], proposals: [],
};

function show(at: string) {
  const router = createMemoryRouter(
    [
      { path: "/requests/:id", element: <RequestDetailPage /> },
      { path: "/requests/:id/edit", element: <RequestNewPage /> },
      { path: "/requests", element: <p>request list</p> },
      { path: "/opportunities", element: <OpportunitiesPage /> },
    ],
    { initialEntries: [at] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const setDeadline = (v: string) => fireEvent.change(screen.getByLabelText(/Bids close on/), { target: { value: v } });

beforeEach(() => {
  session.current = {
    full_name: "Priya Nair", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: [],
  };
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/requests/r1" ? RFP : path === "/opportunities" ? [] : []),
  );
  api.post.mockReset().mockImplementation(() => Promise.resolve({ ...RFP }));
  api.patch.mockReset().mockImplementation(() => Promise.resolve({ ...RFP }));
});

describe("the builder", () => {
  const DRAFT = { ...RFP, status: "draft", stored_status: "draft", proposals_close_at: null, bidding_open: true };
  const openStep2 = async () => {
    show("/requests/r1/edit");
    await screen.findByRole("heading", { name: /Edit RFP-1011/ });
    click("Continue");
    click("Continue");
    await screen.findByLabelText(/Bids close on/);
  };

  it("will not publish without a deadline, and says why", async () => {
    api.get.mockImplementation((path: string) => Promise.resolve(path === "/requests/r1" ? DRAFT : []));
    await openStep2();
    click("Continue");
    click("Publish to partners");
    expect(await screen.findByText(/Say when bidding closes/)).toBeTruthy();
  });

  it("refuses a past time and one after the delivery date, in UTC", async () => {
    api.get.mockImplementation((path: string) => Promise.resolve(path === "/requests/r1" ? DRAFT : []));
    await openStep2();
    setDeadline("2020-01-01T10:00");
    click("Continue");
    expect(await screen.findByText("Choose a time in the future.")).toBeTruthy();
    setDeadline("2030-11-20T10:00"); // five days after delivery in any zone
    click("Continue");
    expect(await screen.findByText(/On or before the delivery deadline/)).toBeTruthy();
  });

  it("sends the deadline as an ISO instant and shows it on the review", async () => {
    api.get.mockImplementation((path: string) => Promise.resolve(path === "/requests/r1" ? DRAFT : []));
    await openStep2();
    setDeadline("2030-11-10T10:00");
    click("Continue");
    expect(await screen.findByText("Bids close")).toBeTruthy();
    click("Save as draft");
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    const body = api.patch.mock.calls[0]![1] as { proposals_close_at: string };
    expect(body.proposals_close_at).toBe(new Date("2030-11-10T10:00").toISOString());
    expect(body.proposals_close_at).toMatch(/Z$/);
  });

  it("loads a saved deadline back into the field", async () => {
    await openStep2();
    const input = screen.getByLabelText(/Bids close on/) as HTMLInputElement;
    // the local rendering of the fixture's instant, whatever the runner's zone
    const d = new Date(RFP.proposals_close_at);
    const p = (n: number) => String(n).padStart(2, "0");
    expect(input.value).toBe(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`);
  });
});

describe("a partner reading the RFP", () => {
  beforeEach(() => {
    session.current = {
      full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Data Services",
      org_kind: "tenant", role: "partner", capabilities: [],
    };
  });

  it("sees the deadline with a countdown and may respond while it is open", async () => {
    show("/requests/r1");
    await screen.findByRole("heading", { name: RFP.title });
    expect(screen.getByRole("button", { name: "Respond" })).toBeTruthy();
    const row = screen.getByText("Bids close").nextElementSibling as HTMLElement;
    expect(row.textContent).toMatch(/2030/);
    expect(row.textContent).toMatch(/in \d+ days/);
  });

  it("cannot respond once bidding has closed, and is told so", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/requests/r1"
        ? { ...RFP, proposals_close_at: "2026-09-01T12:00:00Z", bidding_open: false }
        : []),
    );
    show("/requests/r1");
    await screen.findByRole("heading", { name: RFP.title });
    expect(screen.queryByRole("button", { name: "Respond" })).toBeNull();
    expect(screen.getByText(/^Bidding closed on /)).toBeTruthy();
    expect(screen.getByText("Bidding closed · no proposals")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Change deadline" })).toBeNull();
  });
});

describe("the client moving the deadline", () => {
  it("changes it through the deadline endpoint alone", async () => {
    show("/requests/r1");
    await screen.findByRole("heading", { name: RFP.title });
    click("Change deadline");
    const dlg = await screen.findByRole("dialog", { name: "Change the bidding deadline" });
    fireEvent.change(within(dlg).getByLabelText(/Bids close on/), { target: { value: "2030-11-12T09:30" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Save deadline" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/requests/r1/bidding-deadline", {
      proposals_close_at: new Date("2030-11-12T09:30").toISOString(),
    }));
    expect(api.patch).toHaveBeenCalledTimes(1);
  });

  it("is checked in the dialog before anything is sent", async () => {
    show("/requests/r1");
    await screen.findByRole("heading", { name: RFP.title });
    click("Change deadline");
    const dlg = await screen.findByRole("dialog", { name: "Change the bidding deadline" });
    fireEvent.change(within(dlg).getByLabelText(/Bids close on/), { target: { value: "2030-11-20T09:30" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Save deadline" }));
    expect(await within(dlg).findByText(/On or before the delivery deadline/)).toBeTruthy();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("is offered only while the request is published", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/requests/r1" ? { ...RFP, status: "accepted", stored_status: "accepted" } : []),
    );
    show("/requests/r1");
    await screen.findByRole("heading", { name: RFP.title });
    expect(screen.queryByRole("button", { name: "Change deadline" })).toBeNull();
  });
});

describe("the opportunities board", () => {
  it("shows how long is left and lists the soonest deadline first", async () => {
    session.current = { ...session.current, org_kind: "tenant", role: "partner" };
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/opportunities"
        ? [
            { ...RFP, id: "later", reference_code: "RFP-2", title: "Later", proposals_close_at: "2030-12-01T10:00:00Z" },
            { ...RFP, id: "soon", reference_code: "RFP-1", title: "Soon", proposals_close_at: "2030-10-01T10:00:00Z" },
            { ...RFP, id: "none", reference_code: "RFP-3", title: "Open-ended", proposals_close_at: null },
          ]
        : []),
    );
    show("/opportunities");
    await screen.findByText("Soon");
    expect(screen.getByRole("columnheader", { name: "Bids close" })).toBeTruthy();
    const titles = screen.getAllByRole("row").slice(1).map((tr) => within(tr).getAllByRole("cell")[1]!.textContent);
    expect(titles).toEqual(["Soon", "Later", "Open-ended"]);
    expect(screen.getAllByText(/in \d+ days/).length).toBe(2);
    expect(screen.getByText("Open until awarded")).toBeTruthy();
  });
});
