// The dataset catalogue, on the real pages.
//
// Pins what the console must get right around the rules the database already
// enforces: a signed-out visitor sees samples and a quote form, never a way to
// buy; each side of a deal sees only its own next move; a buyer cannot download
// until the licence is active; and every catalogue notification leads somewhere.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { notificationHref } from "@shared/notifications";
import type { NotificationRow } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  getText: vi.fn((_path: string): Promise<string> => Promise.resolve("")),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  put: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve()),
  xhrPut: vi.fn(() => Promise.resolve({ status: 201, body: null })),
  ApiError: class ApiError extends Error { status = 0; },
}));
vi.mock("@api/client", () => api);

const auth = vi.hoisted(() => ({
  session: null as null | Record<string, unknown>,
}));
vi.mock("@shared/auth", () => ({
  useSession: () => auth.session,
  useAuth: () => ({ session: auth.session, logout: () => Promise.resolve() }),
}));

import { DealPage, LicencesPage } from "./buyer";
import { PublicDatasetPage } from "./public";

const CLIENT = {
  full_name: "Priya Nair", org_id: "o-acme", org_name: "Acme Retail Analytics",
  org_kind: "client", role: "client", capabilities: ["catalogue.buy", "catalogue.quote", "catalogue.list"],
};

function show(path: string, routePath: string, element: React.ReactElement) {
  const router = createMemoryRouter([{ path: routePath, element }, { path: "*", element: <p>elsewhere</p> }], {
    initialEntries: [path],
  });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider><RouterProvider router={router} /></ToastProvider>
    </QueryClientProvider>,
  );
}

const PUBLIC = {
  slug: "street-abc123", title: "Street scenes, Pune", summary: "Shopfronts by day",
  description: null, category: "image", use_cases: [], regions: ["IN"], languages: [],
  permitted_uses: ["model_training"], licence_terms: "[terms]", indicative_price_text: null,
  seller_name: "Helix Data Collective", source: "contract", version_number: 1, item_count: 2400,
  total_bytes: 1_000_000, published_at: "2026-10-01T00:00:00Z",
  samples: [{ id: "i1", filename: "a.jpg", mime_type: "image/jpeg", size_bytes: 5, url: "https://signed/a.jpg" }],
};

const DEAL = {
  id: "k1", dataset_id: "d1", dataset_title: "Street scenes, Pune", dataset_slug: "street-abc123",
  version_id: "v1", version_number: 1, buyer_org_id: "o-acme", buyer_name: "Acme Retail Analytics",
  seller_org_id: "o-helix", seller_name: "Helix Data Collective", intended_use: "Train a detector",
  requested_uses: ["model_training"], message: null, status: "quoted", quote_amount: "5000.00",
  currency: "USD", quote_terms: "Training only", quote_uses: ["model_training"],
  quoted_at: "2026-10-02T00:00:00Z", decided_at: null, decision_note: null,
  created_at: "2026-10-01T00:00:00Z", licence_id: null, licence_status: null, my_side: "buyer",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.session = null;
});

describe("the public dataset page", () => {
  it("shows a signed-out visitor the samples and the quote form, and nothing to buy", async () => {
    api.get.mockImplementation((p: string) =>
      Promise.resolve(p === "/public/catalogue/street-abc123" ? PUBLIC : null));
    show("/datasets/street-abc123", "/datasets/:slug", <PublicDatasetPage />);
    expect(await screen.findByRole("heading", { name: "Street scenes, Pune" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "a.jpg" }).getAttribute("src")).toBe("https://signed/a.jpg");
    expect(screen.getByRole("button", { name: "Send request" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Request a quote" })).toBeNull();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });

  it("sends a quote request to the public endpoint", async () => {
    api.get.mockImplementation(() => Promise.resolve(PUBLIC));
    show("/datasets/street-abc123", "/datasets/:slug", <PublicDatasetPage />);
    await screen.findByRole("button", { name: "Send request" });
    const fill = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fill(/Your name/, "A Buyer");
    fill(/Work email/, "a@lab.example");
    fill(/Organisation/, "Lab");
    fill(/What will you use it for/, "Evaluation");
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/public/catalogue/street-abc123/leads",
      expect.objectContaining({ email: "a@lab.example", company: "Lab", intended_use: "Evaluation" }),
    ));
    expect(await screen.findByText("Thank you")).toBeTruthy();
  });

  it("sends a signed-in visitor to the console instead of the form", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(() => Promise.resolve(PUBLIC));
    show("/datasets/street-abc123", "/datasets/:slug", <PublicDatasetPage />);
    const link = await screen.findByRole("link", { name: "Request a quote" });
    expect(link.getAttribute("href")).toBe("/catalogue/street-abc123");
    expect(screen.queryByRole("button", { name: "Send request" })).toBeNull();
  });
});

describe("the deal room", () => {
  it("offers the buyer accept and withdraw on a quote, and nothing of the seller's", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(() => Promise.resolve(DEAL));
    show("/catalogue/deals/k1", "/catalogue/deals/:id", <DealPage />);
    expect(await screen.findByRole("button", { name: "Accept the quote" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Send a quote|Revise the quote/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull();
  });

  it("offers the seller the quote and decline, and not accept", async () => {
    auth.session = { ...CLIENT, org_id: "o-helix", org_kind: "tenant", role: "tenant" };
    api.get.mockImplementation(() => Promise.resolve({ ...DEAL, status: "requested", quote_amount: null, my_side: "seller" }));
    show("/catalogue/deals/k1", "/catalogue/deals/:id", <DealPage />);
    expect(await screen.findByRole("button", { name: "Send a quote" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Decline" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept the quote" })).toBeNull();
  });

  it("accepts through the one endpoint, after showing the price", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(() => Promise.resolve(DEAL));
    show("/catalogue/deals/k1", "/catalogue/deals/:id", <DealPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept the quote" }));
    fireEvent.click(await screen.findByRole("button", { name: /Accept .*5,000/ }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/catalogue/deals/k1/accept"));
  });
});

describe("licences", () => {
  const LIC = {
    id: "l1", deal_id: "k1", dataset_id: "d1", dataset_title: "Street scenes, Pune", dataset_slug: "street-abc123",
    dataset_status: "published", version_id: "v1", version_number: 1, item_count: 2, total_bytes: 10,
    withdrawn_count: 0, buyer_org_id: "o-acme", buyer_name: "Acme", seller_org_id: "o-helix", seller_name: "Helix",
    permitted_uses: ["model_training"], terms_snapshot: null, amount: "5000.00", currency: "USD",
    status: "awaiting_payment", invoice_number: null, paid_at: null, revoked_at: null, revoked_reason: null,
    issued_at: "2026-10-02T00:00:00Z", my_side: "buyer",
  };

  it("gives a buyer no download until the seller marks it paid", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(() => Promise.resolve([LIC]));
    show("/catalogue/licences", "/catalogue/licences", <LicencesPage />);
    expect(await screen.findByText("Awaiting payment")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Manifest" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark paid" })).toBeNull();
  });

  it("gives the seller Mark paid, and the buyer the manifest once active", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(() => Promise.resolve([
      { ...LIC, id: "l2", my_side: "seller" },
      { ...LIC, id: "l3", status: "active", withdrawn_count: 1 },
    ]));
    show("/catalogue/licences", "/catalogue/licences", <LicencesPage />);
    expect(await screen.findByRole("button", { name: "Mark paid" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manifest" })).toBeTruthy();
    expect(screen.getByText(/1 file withdrawn from Street scenes, Pune/)).toBeTruthy();
  });
});

describe("catalogue notifications", () => {
  const n = (link_page: string, id?: string) =>
    ({ id: "n", body: "", link_page, link_params: id ? { id } : {} }) as unknown as NotificationRow;
  it("lead to the listing, the deal, the licences and the review page", () => {
    expect(notificationHref(n("catalogue_listing", "d1"))).toBe("/catalogue/mine/d1");
    expect(notificationHref(n("catalogue_deal", "k1"))).toBe("/catalogue/deals/k1");
    expect(notificationHref(n("catalogue_licences", "l1"))).toBe("/catalogue/licences");
    expect(notificationHref(n("catalogue_review"))).toBe("/ops/catalogue");
  });
});
