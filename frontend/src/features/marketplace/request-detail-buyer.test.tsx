// Bug 23: the brief names the buyer, not the bidder.
//
// A partner deciding whether to bid saw exactly one organisation named on the
// whole page — their own, under a column headed "Partner" inside a panel
// headed "Your response". RLS hands a partner one proposal row, so that column
// and the QA rate beside it were always the reader's own figures.
//
// Both halves are worth pinning because each can regress on its own: the
// Client panel can vanish behind a permission change, and the two columns can
// come back with any edit to the table.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

const session = vi.hoisted(() => ({
  current: {
    full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Data Services",
    org_kind: "tenant", role: "partner", capabilities: [] as string[],
  },
}));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { RequestDetailPage } from "./pages";

const CLIENT = {
  id: "o-acme", name: "Acme Retail Analytics", reference_code: "ORG-ACME", kind: "client",
  country: "IN", residency_region: "in", status: "active",
  profile: { industry: "Retail", since: "2024-02-01" },
};

// The partner's own bid, which is all RLS ever returns to them.
const MY_BID = {
  id: "p1", reference_code: "PRO-01", partner_org_id: "o-northstar",
  partner_name: "NorthStar Data Services", partner_qa_pass_rate: 94,
  price: "120000.00", currency: "INR", duration_days: 21,
  methodology: "Four crews, two weeks of capture, one of QA.",
  status: "submitted", attachments: [],
};

// Shape taken from a live GET /requests/{id}, trimmed to the keys this page
// reads. The nested objects are not optional: the page dereferences
// spec.capture and quality.thresholds without a guard.
const RFP = {
  id: "r1", reference_code: "RFP-1011", title: "Storefront photos, Pune",
  category: "image", status: "published", stored_status: "published",
  client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  proposal_count: 1, geography: "Pune, India", compliance_notes: null,
  objective: "Shelf-level imagery for 400 kirana stores.", use_case: "audit_compliance",
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
  pricing_model_requested: "fixed", budget_disclosed: true,
  budget_min: "900.00", budget_max: "1500.00", currency: "USD",
  milestones: [], pilot: { required: false, quantity: null, due_on: null },
  proposal_requirements: [], proposals_close_at: null, contact_user_id: null,
  starts_on: "2026-09-30", delivery_due_on: "2026-10-25", storage_target_id: null,
  created_at: "2026-09-01T00:00:00+00:00",
  attachments: [], proposals: [MY_BID],
};

function show() {
  const router = createMemoryRouter(
    [
      { path: "/requests/:id", element: <RequestDetailPage /> },
      { path: "/opportunities", element: <p>board</p> },
    ],
    { initialEntries: ["/requests/r1"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  session.current = {
    full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Data Services",
    org_kind: "tenant", role: "partner", capabilities: [],
  };
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/requests/r1") return Promise.resolve(RFP);
    if (path === "/organisations/o-acme") return Promise.resolve(CLIENT);
    return Promise.resolve(null);
  });
});

describe("a partner reading an opportunity brief", () => {
  it("names the client who raised it", async () => {
    show();
    const panel = await screen.findByText("Client");
    const card = panel.closest(".panel") as HTMLElement;
    await waitFor(() => expect(within(card).getByText("Acme Retail Analytics")).toBeTruthy());
    expect(within(card).getByText("Retail")).toBeTruthy();
    expect(within(card).getByText("ORG-ACME")).toBeTruthy();
  });

  it("falls back to the name on the request while the profile is still loading", async () => {
    // /organisations never settles. The request already carries client_name,
    // so the panel is named from the first paint rather than blank.
    api.get.mockImplementation((path: string) =>
      path === "/requests/r1" ? Promise.resolve(RFP) : new Promise(() => {}),
    );
    show();
    const panel = await screen.findByText("Client");
    const card = panel.closest(".panel") as HTMLElement;
    await waitFor(() => expect(within(card).getByText("Acme Retail Analytics")).toBeTruthy());
  });

  it("says so plainly when the buyer is not disclosed", async () => {
    // An awarded or cancelled request: db/180 stops matching, and a partner
    // that never bid loses the row. Nothing on the request names them either.
    api.get.mockImplementation((path: string) =>
      path === "/requests/r1"
        ? Promise.resolve({ ...RFP, client_name: null, proposals: [] })
        : Promise.reject(new Error("Request failed (404)")),
    );
    show();
    expect(await screen.findByText("Buyer not disclosed")).toBeTruthy();
  });

  it("does not show the partner their own name or QA rate back", async () => {
    show();
    const heading = await screen.findByText("Your response");
    const card = heading.closest(".panel") as HTMLElement;
    await waitFor(() => expect(within(card).getByText("21")).toBeTruthy());
    expect(within(card).queryByText("NorthStar Data Services")).toBeNull();
    expect(within(card).queryByText(/94% QA pass/)).toBeNull();
    // the columns that carried them are gone, not merely empty
    expect(within(card).queryByText(/^Partner$/i)).toBeNull();
    expect(within(card).queryByText(/QA track record/i)).toBeNull();
  });
});

describe("the client reading their own request", () => {
  beforeEach(() => {
    session.current = {
      full_name: "Priya Nair", org_id: "o-acme", org_name: "Acme Retail Analytics",
      org_kind: "client", role: "client", capabilities: [],
    };
  });

  it("keeps the Partner and QA columns, and gains no Client panel", async () => {
    show();
    const heading = await screen.findByText("Proposals");
    const card = heading.closest(".panel") as HTMLElement;
    await waitFor(() => expect(within(card).getByText("NorthStar Data Services")).toBeTruthy());
    expect(within(card).getByText(/94% QA pass/)).toBeTruthy();
    expect(screen.queryByText("Who raised this request")).toBeNull();
    // and the org read is never even attempted for one's own organisation
    expect(api.get).not.toHaveBeenCalledWith("/organisations/o-acme");
  });
});
