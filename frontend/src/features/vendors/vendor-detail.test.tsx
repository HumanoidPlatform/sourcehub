// One vendor's page: who they are, what they say they do, what their record
// amounts to, and the client's own history with them. Also how a delivery
// partner sees itself as clients do.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import type { Contract, RatingRow, Vendor } from "@api/types";
import { HELIX, NORTHSTAR } from "./fixtures";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
}));
vi.mock("@api/client", () => api);

const session = vi.hoisted(() => ({
  current: {
    full_name: "Priya Shah", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: ["vendor.read"],
  },
}));
vi.mock("@shared/auth", () => ({ useSession: () => session.current }));

import { VendorDetailPage } from "./pages";

const DETAIL: Vendor = {
  ...NORTHSTAR,
  performance: {
    ...NORTHSTAR.performance,
    rating_distribution: [
      { score: 5, count: 8 }, { score: 4, count: 3 }, { score: 3, count: 0 },
      { score: 2, count: 1 }, { score: 1, count: 0 },
    ],
  },
};

const contract = (over: Partial<Contract>): Contract => ({
  id: "c1", reference_code: "CTR-01", request_id: "r1", request_ref: "RFP-1001",
  title: "Shelf audit, 40 stores", client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  partner_org_id: "v-ns", partner_name: NORTHSTAR.name, value: "120000.00", currency: "INR",
  status: "completed", milestone_pct: 50, platform_fee_pct: "9.00", rubric_snapshot: null,
  delivery_due_on: "2026-09-10", started_at: null, delivered_at: "2026-09-09T10:00:00Z",
  completed_at: "2026-09-12T10:00:00Z",
  progress: { total: 1, done: 1, deliverable: true } as Contract["progress"],
  ...over,
});

const RATING: RatingRow = {
  id: "g1", contract_id: "c1", score: 5, comment: "On time and complete.",
  created_at: "2026-09-12T10:00:00Z", from_name: "Acme Retail Analytics", to_name: NORTHSTAR.name,
};

let vendor: Vendor | null = DETAIL;
let contracts: Contract[] = [];

function show(id = "v-ns", state?: unknown) {
  const router = createMemoryRouter(
    [{ path: "/vendors/:id", element: <VendorDetailPage /> }],
    { initialEntries: [{ pathname: `/vendors/${id}`, state }] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

// The loading page has a heading of its own; wait for the one with the name.
const loaded = (name = NORTHSTAR.name) => screen.findByRole("heading", { level: 1, name });

const panel = (title: string) =>
  within(screen.getByRole("heading", { name: title }).closest(".panel") as HTMLElement);

beforeEach(() => {
  session.current = {
    full_name: "Priya Shah", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: ["vendor.read"],
  };
  vendor = DETAIL;
  contracts = [];
  api.get.mockReset().mockImplementation((path: string) => {
    if (path.startsWith("/vendors/")) {
      return vendor ? Promise.resolve(vendor) : Promise.reject(new Error("Request failed (404)"));
    }
    if (path === "/contracts") return Promise.resolve(contracts);
    if (path === "/network/ratings") return Promise.resolve([RATING]);
    if (path.endsWith("/logo-url")) return Promise.resolve({ url: "https://blob.example/l.png", expires_in: 900 });
    return Promise.resolve(null);
  });
});

describe("a client reading a vendor", () => {
  it("names the vendor and says where and since when", async () => {
    show();
    expect(await screen.findByRole("heading", { level: 1, name: NORTHSTAR.name })).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/vendors/v-ns");
    expect(screen.getAllByText("Pune, India").length).toBeGreaterThan(0);
    expect(screen.getByText(/On DataMind360 since/)).toBeTruthy();
    expect(screen.getByText("Fair work attested")).toBeTruthy();
    expect(screen.getByText(/Field data collection across South Asia/)).toBeTruthy();
    expect(document.title).toContain(NORTHSTAR.name);
  });

  it("groups the expertise by kind, in words", async () => {
    show();
    await loaded();
    const p = panel("Expertise");
    for (const heading of ["Data types", "Domains", "Regions", "Languages", "Certifications", "Other certifications"]) {
      expect(p.getByRole("heading", { name: heading })).toBeTruthy();
    }
    for (const value of ["Video", "Image", "Retail", "India", "United States", "English", "Hindi", "ISO 27001", "TISAX"]) {
      expect(p.getByText(value)).toBeTruthy();
    }
  });

  it("leaves out a kind of expertise the vendor has not listed", async () => {
    vendor = { ...DETAIL, expertise: { ...DETAIL.expertise, languages: [], other_certifications: null } };
    show();
    await loaded();
    const p = panel("Expertise");
    expect(p.queryByRole("heading", { name: "Languages" })).toBeNull();
    expect(p.queryByRole("heading", { name: "Other certifications" })).toBeNull();
    expect(p.getByRole("heading", { name: "Regions" })).toBeTruthy();
  });

  it("shows the four figures and what each one is made of", async () => {
    show();
    await loaded();
    const p = panel("Performance");
    expect(p.getByText(/Calculated from 14 projects completed/)).toBeTruthy();
    expect(p.getByRole("img", { name: "4.6 out of 5, 12 ratings" })).toBeTruthy();
    for (const [label, value] of [["On time", "94%"], ["Accepted first time", "92%"], ["QA pass at its own gate", "88%"]]) {
      expect(p.getByText(label!)).toBeTruthy();
      expect(p.getByText(value!)).toBeTruthy();
    }
    // whose verdict the last one is
    expect(p.getByText(/Its own verdict, not a client's/)).toBeTruthy();
  });

  it("shows how the scores were spread, five first", async () => {
    show();
    await loaded();
    const rows = within(screen.getByRole("list", { name: "How clients scored this vendor" })).getAllByRole("listitem");
    expect(rows.map((r) => r.textContent)).toEqual(["5 ★8", "4 ★3", "3 ★0", "2 ★1", "1 ★0"]);
    // 8 of 12 is 67%
    expect(within(rows[0]!).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("67");
  });

  it("says a vendor is new instead of showing a record of zero", async () => {
    vendor = HELIX;
    show("v-hx");
    await screen.findByRole("heading", { level: 1, name: HELIX.name });
    const p = panel("Performance");
    expect(p.getByText("New on DataMind360")).toBeTruthy();
    expect(p.queryByText("On time")).toBeNull();
    expect(p.queryByText("0%")).toBeNull();
    expect(screen.queryByRole("list", { name: "How clients scored this vendor" })).toBeNull();
  });

  it("shows the company's details and no commercial one", async () => {
    vendor = { ...DETAIL, plan: "Partner Pro", billing_status: "overdue", legal_name: "NS Holdings" } as Vendor;
    show();
    await loaded();
    const p = panel("Company");
    expect(p.getByText("51-200 people")).toBeTruthy();
    expect(p.getByText("2016")).toBeTruthy();
    expect(p.getByText("1 MG Road, Pune, India")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Partner Pro|overdue|NS Holdings|Billing|Plan\b/);
  });

  it("says the vendor is not available when the API has no such vendor", async () => {
    vendor = null;
    show();
    expect(await screen.findByText("This vendor is not available")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to vendors" }).getAttribute("href")).toBe("/vendors");
  });
});

describe("the client's own work with the vendor", () => {
  it("lists its contracts with this vendor and no other", async () => {
    contracts = [
      contract({}),
      contract({ id: "c2", reference_code: "CTR-02", title: "Another partner's job", partner_org_id: "v-other" }),
      contract({ id: "c3", reference_code: "CTR-03", title: "Planogram photos", status: "active", completed_at: null }),
    ];
    show();
    await loaded();
    const p = panel("Your work with this vendor");
    await waitFor(() => expect(p.getAllByRole("listitem")).toHaveLength(2));
    expect(p.getByRole("link", { name: "Shelf audit, 40 stores" }).getAttribute("href")).toBe("/deliveries/c1");
    expect(p.getByText("You rated it ★ 5")).toBeTruthy();
    expect(p.getByText("Planogram photos")).toBeTruthy();
    expect(p.queryByText("Another partner's job")).toBeNull();
    // the score is shown; the words of a rating are the contract page's
    expect(p.queryByText("On time and complete.")).toBeNull();
  });

  it("says so when there is none", async () => {
    show();
    await loaded();
    expect(await panel("Your work with this vendor").findByText(/You have not worked with NorthStar/)).toBeTruthy();
  });
});

describe("the way back", () => {
  it("returns to the directory as it was filtered", async () => {
    show("v-ns", { back: "/vendors?type=video" });
    const back = await screen.findByRole("link", { name: "Back to vendors" });
    expect(back.getAttribute("href")).toBe("/vendors?type=video");
  });

  it("ignores a way back that does not lead to the directory", async () => {
    show("v-ns", { back: "https://elsewhere.example/" });
    const back = await screen.findByRole("link", { name: "Back to vendors" });
    expect(back.getAttribute("href")).toBe("/vendors");
  });
});

describe("a delivery partner looking at its own page", () => {
  beforeEach(() => {
    session.current = {
      full_name: "Ravi Menon", org_id: "v-ns", org_name: NORTHSTAR.name,
      org_kind: "tenant", role: "tenant", capabilities: ["profile.manage"],
    };
  });

  it("is told it is seeing what clients see, and where to change it", async () => {
    show();
    expect(await screen.findByText("This is your page, as clients see it")).toBeTruthy();
    expect(screen.getByRole("link", { name: "organisation profile" }).getAttribute("href")).toBe("/organisation");
    expect(screen.getByRole("link", { name: "Back to your profile" }).getAttribute("href")).toBe("/organisation");
    expect(screen.queryByRole("link", { name: "Back to vendors" })).toBeNull();
  });

  it("is shown no client's work, and asks for none", async () => {
    show();
    await loaded();
    expect(screen.queryByText("Your work with this vendor")).toBeNull();
    expect(api.get).not.toHaveBeenCalledWith("/contracts");
    expect(api.get).not.toHaveBeenCalledWith("/network/ratings");
  });
});
