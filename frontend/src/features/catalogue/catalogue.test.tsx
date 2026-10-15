// The dataset catalogue, on the real pages.
//
// Pins what the console must get right around the rules the database already
// enforces: a signed-out visitor sees samples and a quote form, never a way to
// buy; each side of a deal sees only its own next move; a public quote request
// is the seller's to answer; and every catalogue notification leads somewhere.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

import { CataloguePage, DatasetPage, DealPage } from "./buyer";
import { MyDatasetsPage } from "./seller";
import { CatalogueReviewPage } from "./ops";
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
  seller_name: "Helix Data Collective", source: "contract", file_count: 2400,
  total_bytes: 1_000_000, published_at: "2026-10-01T00:00:00Z",
  samples: [{ id: "i1", filename: "a.jpg", mime_type: "image/jpeg", size_bytes: 5, url: "https://signed/a.jpg" }],
};

const DEAL = {
  id: "k1", dataset_id: "d1", dataset_title: "Street scenes, Pune", dataset_slug: "street-abc123",
  file_count: 2400, buyer_org_id: "o-acme", buyer_name: "Acme Retail Analytics",
  channel: "account", contact_name: null, contact_email: null, contact_company: null,
  seller_org_id: "o-helix", seller_name: "Helix Data Collective", intended_use: "Train a detector",
  requested_uses: ["model_training"], requested_quantity: 500, message: null, status: "quoted",
  quote_amount: "5000.00", currency: "USD", quote_terms: "Training only", quote_uses: ["model_training"],
  quote_quantity: 500, quoted_at: "2026-10-02T00:00:00Z", decided_at: null, decision_note: null,
  invoice_number: null, paid_at: null, delivered_at: null,
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-02T00:00:00Z", message_count: 1, my_side: "buyer",
};

const MESSAGES = [
  { id: "m1", seq: 1, sender_org_id: "o-acme", sender_name: "Priya Nair", body: "Could we take 500 from Pune?",
    created_at: "2026-10-01T00:00:00Z", mine: true },
];

/** The deal page reads the deal and its chat. */
const dealRoom = (deal: Record<string, unknown>) => (p: string) =>
  Promise.resolve(p.endsWith("/messages") ? MESSAGES : deal);

const SELLER = { ...CLIENT, org_id: "o-helix", org_kind: "tenant", role: "tenant" };

beforeEach(() => {
  vi.clearAllMocks();
  auth.session = null;
});

describe("the public dataset page", () => {
  it("shows a signed-out visitor the samples and the quote form, and nothing to buy", async () => {
    api.get.mockImplementation((p: string) =>
      Promise.resolve(p === "/public/catalogue/street-abc123" ? PUBLIC : null));
    show("/datahub/public/street-abc123", "/datahub/public/:slug", <PublicDatasetPage />);
    expect(await screen.findByRole("heading", { name: "Street scenes, Pune" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "a.jpg" }).getAttribute("src")).toBe("https://signed/a.jpg");
    expect(screen.getByRole("button", { name: "Send request" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Request a quote" })).toBeNull();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });

  it("sends a quote request to the public endpoint", async () => {
    api.get.mockImplementation(() => Promise.resolve(PUBLIC));
    show("/datahub/public/street-abc123", "/datahub/public/:slug", <PublicDatasetPage />);
    await screen.findByRole("button", { name: "Send request" });
    const fill = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fill(/Your name/, "A Buyer");
    fill(/^Email/, "a@gmail.com");
    fill(/Organisation/, "Lab");
    fill(/What will you use it for/, "Evaluation");
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/public/catalogue/street-abc123/leads",
      expect.objectContaining({ email: "a@gmail.com", company: "Lab", intended_use: "Evaluation" }),
    ));
    expect(await screen.findByText("Thank you")).toBeTruthy();
  });

  it("sends a signed-in visitor to the console instead of the form", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(() => Promise.resolve(PUBLIC));
    show("/datahub/public/street-abc123", "/datahub/public/:slug", <PublicDatasetPage />);
    const link = await screen.findByRole("link", { name: "Request a quote" });
    expect(link.getAttribute("href")).toBe("/datahub/street-abc123");
    expect(screen.queryByRole("button", { name: "Send request" })).toBeNull();
  });
});

describe("the deal room", () => {
  it("offers the buyer accept and withdraw on a quote, and nothing of the seller's", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(dealRoom(DEAL));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    expect(await screen.findByRole("button", { name: "Accept the quote" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Send a quote|Revise the quote/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Mark paid|Mark delivered/ })).toBeNull();
  });

  it("offers the seller the quote and decline, and not accept", async () => {
    auth.session = SELLER;
    api.get.mockImplementation(dealRoom({ ...DEAL, status: "requested", quote_amount: null, my_side: "seller" }));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    expect(await screen.findByRole("button", { name: "Send a quote" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Decline" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept the quote" })).toBeNull();
  });

  it("accepts through the one endpoint, after showing the price and the files", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(dealRoom(DEAL));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept the quote" }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText("500 files")).toBeTruthy();
    fireEvent.click(within(dlg).getByRole("button", { name: /Accept .*5,000/ }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/catalogue/deals/k1/accept"));
  });

  // db/450: accepting issued an invoice; the buyer marks it paid, the seller
  // acknowledges, and that makes the deal paid. The seller has no Mark paid.
  const INVOICE = {
    id: "i1", reference_code: "INV-07", contract_id: null, contract_ref: null, deal_id: "k1",
    dataset_title: "Street scenes, Pune", request_id: null, request_title: null,
    client_org_id: "o-acme", client_name: "Acme Retail Analytics",
    partner_org_id: "o-helix", partner_name: "Helix Data Collective", currency: "USD",
    quantity: null, unit: null, block: null, rate: null, amount: "5000.00", line_text: null,
    accepted_assets_at_issue: null, note: null, status: "issued", issued_at: "2026-10-03T00:00:00Z",
    issued_by: null, paid_at: null, paid_by: null, payment_reference: null, acknowledged_at: null,
    acknowledged_by: null, withdrawn_at: null, withdrawn_by: null, withdrawn_reason: null,
  };
  const invoiced = (deal: Record<string, unknown>, invoice: Record<string, unknown>) => (p: string) =>
    Promise.resolve(p === "/invoices" ? [invoice] : p.endsWith("/messages") ? MESSAGES : deal);
  const accepted = { ...DEAL, status: "accepted", invoice_id: "i1", invoice_reference: "INV-07" };

  it("shows the buyer the invoice to mark paid, and no withdraw", async () => {
    auth.session = { ...CLIENT, capabilities: [...CLIENT.capabilities, "invoice.pay"] };
    api.get.mockImplementation(invoiced({ ...accepted, invoice_status: "issued" }, INVOICE));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    expect(await screen.findByRole("button", { name: "Mark paid" })).toBeTruthy();
    expect(screen.getAllByText(/INV-07/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Withdraw" })).toBeNull();
  });

  it("gives the seller Acknowledge payment once the buyer has paid, and no Mark paid of its own", async () => {
    auth.session = { ...SELLER, capabilities: [...SELLER.capabilities, "invoice.acknowledge"] };
    api.get.mockImplementation(invoiced(
      { ...accepted, invoice_status: "paid", my_side: "seller" },
      { ...INVOICE, status: "paid", paid_at: "2026-10-04T00:00:00Z" }));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Acknowledge payment" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/invoices/i1/acknowledge"));
    expect(screen.queryByRole("button", { name: "Mark paid" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Withdraw" })).toBeNull();
  });

  it("gives the seller Mark delivered once paid", async () => {
    auth.session = SELLER;
    api.get.mockImplementation(dealRoom({ ...DEAL, status: "paid", paid_at: "2026-10-03T00:00:00Z", my_side: "seller" }));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Mark delivered" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/catalogue/deals/k1/delivered"));
  });

  it("tells the buyer the seller hands the files over once paid", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(dealRoom({ ...DEAL, status: "paid", paid_at: "2026-10-03T00:00:00Z" }));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    expect(await screen.findByText(/hand the files over to you directly/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Mark delivered" })).toBeNull();
  });
});

describe("the deal chat", () => {
  it("shows the conversation and sends a message", async () => {
    auth.session = CLIENT;
    api.get.mockImplementation(dealRoom(DEAL));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    expect(await screen.findByText("Could we take 500 from Pune?")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "  Any from Mumbai too?  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/catalogue/deals/k1/messages", { body: "Any from Mumbai too?" },
    ));
  });

  it("is read-only for operations and on a closed deal", async () => {
    auth.session = { ...CLIENT, org_id: "o-platform", org_kind: "platform", role: "platform_admin" };
    api.get.mockImplementation(dealRoom({ ...DEAL, my_side: "operations" }));
    show("/datahub/deals/k1", "/datahub/deals/:id", <DealPage />);
    await screen.findByText("Could we take 500 from Pune?");
    expect(screen.queryByLabelText("Message")).toBeNull();
  });
});

describe("a delivery partner as a buyer", () => {
  const DATASET = {
    id: "d1", slug: "street-abc123", title: "Street scenes, Pune", summary: null, description: null,
    category: "image", owner_org_id: "o-helix", owner_name: "Helix Data Collective", source: "contract",
    status: "published", is_owner: false, use_cases: [], regions: [], languages: [], permitted_uses: [],
    licence_terms: null, indicative_price_text: null, file_count: 3000, total_bytes: null, sample_count: 0,
    samples: [], my_deal: null,
  };

  it("may ask for a quote on another seller's dataset, for all or part of it", async () => {
    auth.session = {
      full_name: "Ravi Menon", org_id: "o-north", org_name: "NorthStar", org_kind: "tenant", role: "tenant",
      capabilities: ["catalogue.buy", "catalogue.quote", "catalogue.list"],
    };
    api.get.mockImplementation(() => Promise.resolve(DATASET));
    api.post.mockResolvedValue({ id: "k9" });
    show("/datahub/street-abc123", "/datahub/:slug", <DatasetPage />);
    expect(await screen.findAllByText("3,000 files")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Request a quote" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByLabelText("Some of it"));
    fireEvent.change(within(dlg).getByLabelText(/Number of files/), { target: { value: "500" } });
    fireEvent.change(within(dlg).getByLabelText(/What will you use it for/), { target: { value: "Benchmark" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Send to the seller" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/catalogue/datasets/d1/deals",
      expect.objectContaining({ requested_quantity: 500, intended_use: "Benchmark" }),
    ));
  });
});

describe("catalogue notifications", () => {
  const n = (link_page: string, id?: string) =>
    ({ id: "n", body: "", link_page, link_params: id ? { id } : {} }) as unknown as NotificationRow;
  it("lead to the listing, the deal and the review page", () => {
    expect(notificationHref(n("catalogue_listing", "d1"))).toBe("/datahub/mine/d1");
    expect(notificationHref(n("catalogue_deal", "k1"))).toBe("/datahub/deals/k1");
    // licences went with db/420: an old licence alert opens the deals
    expect(notificationHref(n("catalogue_licences", "l1"))).toBe("/datahub/deals");
    expect(notificationHref(n("catalogue_review"))).toBe("/ops/datahub");
    expect(notificationHref(n("catalogue_leads"))).toBe("/datahub/deals");
  });
});

describe("a quote request from the public page", () => {
  const PUBLIC_DEAL = {
    ...DEAL, id: "p1", buyer_org_id: null, buyer_name: "Lab Co", channel: "public",
    contact_name: "A Buyer", contact_email: "a@gmail.com", contact_company: "Lab Co",
    intended_use: "Evaluation", message: "Daytime only?", requested_quantity: null, status: "requested",
    quote_amount: null, currency: null, quote_terms: null, quote_uses: [], quote_quantity: null, quoted_at: null,
    message_count: 0, my_side: "seller",
  };
  const REPLY = {
    id: "m9", seq: 1, sender_org_id: "o-helix", sender_name: "Achieng Otieno", body: "Yes, USD 2,000 for 200.",
    emailed_to: "a@gmail.com", created_at: "2026-10-15T01:00:00Z", mine: true,
  };
  const room = (deal: Record<string, unknown>, msgs: unknown[]) => (p: string) =>
    Promise.resolve(p.endsWith("/messages") ? msgs : deal);

  it("shows the seller the visitor and a reply by email, and no quote", async () => {
    auth.session = SELLER;
    api.get.mockImplementation(room(PUBLIC_DEAL, []));
    api.post.mockResolvedValue(REPLY);
    show("/datahub/deals/p1", "/datahub/deals/:id", <DealPage />);
    expect(await screen.findByText("a@gmail.com")).toBeTruthy();
    expect(screen.getByText("Daytime only?")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Send a quote/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Accept/ })).toBeNull();
    fireEvent.change(screen.getByLabelText("Reply by email"), { target: { value: "Yes, USD 2,000 for 200." } });
    fireEvent.click(screen.getByRole("button", { name: "Send email" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/catalogue/deals/p1/messages", { body: "Yes, USD 2,000 for 200." }));
    expect(screen.getByRole("button", { name: "Close the request" })).toBeTruthy();
  });

  it("is read-only for operations, who see the emailed reply", async () => {
    auth.session = { ...CLIENT, org_kind: "platform", role: "platform_admin", capabilities: ["catalogue.review"] };
    api.get.mockImplementation(room({ ...PUBLIC_DEAL, my_side: "operations", message_count: 1 }, [{ ...REPLY, mine: false }]));
    show("/datahub/deals/p1", "/datahub/deals/:id", <DealPage />);
    expect(await screen.findByText("Yes, USD 2,000 for 200.")).toBeTruthy();
    expect(screen.getByText(/emailed to a@gmail.com/)).toBeTruthy();
    expect(screen.getByText("Contacted")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send email" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Close the request" })).toBeNull();
  });

  it("is listed on the Ops page with its seller, opening the deal", async () => {
    auth.session = { ...CLIENT, org_kind: "platform", role: "platform_admin", capabilities: ["catalogue.review"] };
    api.get.mockImplementation((p: string) => Promise.resolve(
      p === "/catalogue/deals" ? [{ ...PUBLIC_DEAL, my_side: "operations" }, DEAL] : []));
    show("/ops/datahub", "/ops/datahub", <CatalogueReviewPage />);
    fireEvent.click(await screen.findByRole("tab", { name: /Public quote requests/ }));
    expect(await screen.findByText("a@gmail.com")).toBeTruthy();
    expect(screen.getByText("Helix Data Collective")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open" }).getAttribute("href")).toBe("/datahub/deals/p1");
    expect(screen.queryByText("Acme Retail Analytics")).toBeNull();
  });
});

describe("an aggregator", () => {
  const AGGREGATOR = {
    full_name: "Anita", org_id: "o-crowd", org_name: "Bengaluru Crowd", org_kind: "aggregator",
    role: "aggregator", capabilities: ["task.read", "roster.manage"],
  };

  it("is told the catalogue is not part of its workspace, and nothing is fetched", async () => {
    auth.session = AGGREGATOR;
    show("/datahub", "/datahub", <CataloguePage />);
    expect(await screen.findByText("DataHub is not part of your workspace")).toBeTruthy();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("gets the same on its old My listings link", async () => {
    auth.session = AGGREGATOR;
    show("/datahub/mine", "/datahub/mine", <MyDatasetsPage />);
    expect(await screen.findByText("DataHub is not part of your workspace")).toBeTruthy();
    expect(api.get).not.toHaveBeenCalled();
  });
});
