// Listing a contract's captures in the dataset catalogue is the partner's
// choice, offered only once the client has approved a non-exclusive delivery.
// Delivering lists nothing (catalogue/service.py relist_contract).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  putFile: vi.fn(() => Promise.resolve()),
  xhrPut: vi.fn(() => Promise.resolve({ ok: true })),
  api: vi.fn(() => Promise.resolve(null)),
  ApiError: class extends Error {},
  loadSession: vi.fn(() => null),
  saveSession: vi.fn(),
  bindSessionListener: vi.fn(),
  SESSION_KEY: "sourcehub.session",
}));
vi.mock("@api/client", () => api);

const PARTNER = {
  full_name: "Ravi Menon", org_id: "o-north", org_name: "NorthStar", org_kind: "tenant", role: "tenant",
  capabilities: ["catalogue.list", "catalogue.quote", "catalogue.buy"],
};
const auth = vi.hoisted(() => ({ session: null as null | Record<string, unknown> }));
vi.mock("@shared/auth", () => ({
  useSession: () => auth.session,
  useAuth: () => ({ session: auth.session, logout: () => Promise.resolve() }),
}));

import { ContractDetailPage } from "./pages";

const CONTRACT = {
  id: "c1", reference_code: "CTR-09", request_id: "r1", request_ref: "RFP-09", title: "Shelf photos",
  client_org_id: "o-acme", client_name: "Acme", partner_org_id: "o-north", partner_name: "NorthStar",
  value: "1000.00", currency: "USD", status: "completed",
  pricing: { basis: "fixed", unit: null, block: null, quantity: null, estimated_total: "1000.00" },
  rubric_snapshot: null, delivery_due_on: null, started_at: null, delivered_at: null, completed_at: null,
  progress: { total: 1, done: 1, pct: 100, assets_accepted: 4, deliverable: true },
  partner_reuse_allowed: true, catalogue_dataset_id: null as string | null, tasks: [],
};

function show(contract: Record<string, unknown>) {
  api.get.mockImplementation((p: string) => Promise.resolve(p === "/contracts/c1" ? contract : []));
  const router = createMemoryRouter(
    [{ path: "/contracts/:id", element: <ContractDetailPage /> }, { path: "*", element: <p>elsewhere</p> }],
    { initialEntries: ["/contracts/c1"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider><RouterProvider router={router} /></ToastProvider>
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.session = PARTNER;
});

describe("List in DataHub", () => {
  it("is offered to the partner on an approved, non-exclusive contract, and opens the draft", async () => {
    api.post.mockResolvedValue({ dataset_id: "d9" });
    const router = show(CONTRACT);
    fireEvent.click(await screen.findByRole("button", { name: "List in DataHub" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/catalogue/contracts/c1/list"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/datahub/mine/d9"));
  });

  it("is not offered before the client approves", async () => {
    show({ ...CONTRACT, status: "delivered" });
    await screen.findByText("CTR-09", { exact: false });
    expect(screen.queryByRole("button", { name: "List in DataHub" })).toBeNull();
  });

  it("is not offered on an exclusive contract", async () => {
    show({ ...CONTRACT, partner_reuse_allowed: false });
    await screen.findByText("CTR-09", { exact: false });
    expect(screen.queryByRole("button", { name: "List in DataHub" })).toBeNull();
  });

  it("is not offered to the client", async () => {
    auth.session = { ...PARTNER, org_id: "o-acme", org_kind: "client", role: "client" };
    show(CONTRACT);
    await screen.findByText("CTR-09", { exact: false });
    expect(screen.queryByRole("button", { name: "List in DataHub" })).toBeNull();
  });

  it("becomes Open listing once listed", async () => {
    show({ ...CONTRACT, catalogue_dataset_id: "d9" });
    const link = await screen.findByRole("link", { name: "Open listing" });
    expect(link.getAttribute("href")).toBe("/datahub/mine/d9");
    expect(screen.queryByRole("button", { name: "List in DataHub" })).toBeNull();
  });
});
