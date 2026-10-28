// CON-14 (db/610): the client, the partner or Ops ends a live contract with a
// reason; an ended contract says who, when and why, offers the client a way
// to tender the RFP again, and limits a fixed price to the accepted share.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import type { Contract } from "@api/types";

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

const who = vi.hoisted(() => ({ org: "o-acme", kind: "client", role: "client", caps: ["contract.approve", "rfp.create"] as string[] }));
vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Asha Rao", org_id: who.org, org_name: "Someone",
    org_kind: who.kind, role: who.role, capabilities: who.caps,
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { ContractDetailPage } from "./pages";
import { endedBy, mayEndContract } from "./components/contract-end";

const CONTRACT = (over: Partial<Contract> = {}): Contract => ({
  id: "c1", reference_code: "CTR-0003", request_id: "r1", request_ref: "RFP-0007", title: "Storefront photos",
  client_org_id: "o-acme", client_name: "Acme Retail", partner_org_id: "o-ns", partner_name: "NorthStar",
  value: "1500.00", currency: "USD", status: "active",
  pricing: { basis: "total", unit: null, block: null, quantity: null, amount: "1500.00",
    estimated_total: "1500.00", currency: "USD", text: "USD 1,500.00" },
  rubric_snapshot: {}, delivery_due_on: "2026-11-30", started_at: null, delivered_at: null, completed_at: null,
  progress: { total: 1, done: 0, pct: 0, assets_accepted: 0, deliverable: false },
  tasks: [], ratings: [],
  ...over,
} as unknown as Contract);

const ENDED = CONTRACT({
  status: "cancelled",
  ended: { at: "2026-10-22T10:00:00Z", by_party: "partner", by_org_name: "NorthStar", reason: "We cannot staff it." },
  invoicing: {
    invoiced_total: "0.00", paid_total: "0.00", outstanding_total: "0.00", invoiced_quantity: "0", count: 0,
    after_end: { accepted: 40, target: 100, unit: "photos", cap: "600.00", left: "600.00" },
  },
});

function show(c: Contract) {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/contracts/c1" ? c : path.startsWith("/invoices") ? [] : null),
  );
  const router = createMemoryRouter(
    [{ path: "/contracts/:id", element: <ContractDetailPage /> },
     { path: "/requests/:id/edit", element: <p>editing the draft</p> },
     { path: "/requests/:id", element: <p>the published copy</p> }],
    { initialEntries: ["/contracts/c1"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const as = (org: string, kind: string, role = "x", caps: string[] = []) => Object.assign(who, { org, kind, role, caps });

beforeEach(() => {
  vi.clearAllMocks();
  as("o-acme", "client", "x", ["contract.approve", "rfp.create"]);
});

describe("who may end a contract", () => {
  const session = (org: string, caps: string[] = []) => ({ org_id: org, capabilities: caps }) as never;

  it("is its client, its partner, or Ops, each by the capability the route checks, while it is live", () => {
    for (const status of ["active", "in_qa", "delivered", "disputed"]) {
      const c = CONTRACT({ status });
      expect(mayEndContract(c, session("o-acme", ["contract.approve"]))).toBe(true);
      expect(mayEndContract(c, session("o-ns", ["contract.deliver"]))).toBe(true);
      expect(mayEndContract(c, session("o-ops", ["dispute.arbitrate"]))).toBe(true);
      expect(mayEndContract(c, session("o-crowd"))).toBe(false);
      // a member of the right organisation without the capability gets no button
      expect(mayEndContract(c, session("o-acme"))).toBe(false);
      expect(mayEndContract(c, session("o-ns"))).toBe(false);
    }
    for (const status of ["completed", "cancelled"]) {
      expect(mayEndContract(CONTRACT({ status }), session("o-acme", ["contract.approve"]))).toBe(false);
    }
  });

  it("says who ended it, as which party, and when", () => {
    expect(endedBy(ENDED)).toBe("Ended by NorthStar (the delivery partner) on 22 Oct 2026");
    expect(endedBy(CONTRACT())).toBeNull();
  });
});

describe("the contract page", () => {
  it("ends a live contract with a reason, saying what it stops", async () => {
    api.post.mockResolvedValue(ENDED);
    show(CONTRACT({ tasks: [{ id: "t1", status: "in_progress" }, { id: "t2", status: "qa_passed" }] as never }));
    fireEvent.click(await screen.findByRole("button", { name: "End contract" }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText(/1 task not yet through QA ends with it/)).toBeTruthy();
    expect(within(dlg).getByText(/limited to the share of the price the accepted work bears/)).toBeTruthy();
    fireEvent.change(within(dlg).getByLabelText(/Reason/), { target: { value: "Budget withdrawn." } });
    fireEvent.click(within(dlg).getByRole("button", { name: "End contract" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/contracts/c1/end", { reason: "Budget withdrawn." }));
  });

  it("offers no End on a completed or ended contract, nor to a supplier", async () => {
    show(CONTRACT({ status: "completed" }));
    await screen.findByText("Storefront photos");
    expect(screen.queryByRole("button", { name: "End contract" })).toBeNull();
  });

  it("lets Ops end it", async () => {
    as("o-ops", "platform", "platform_admin", ["dispute.arbitrate"]);
    show(CONTRACT());
    expect(await screen.findByRole("button", { name: "End contract" })).toBeTruthy();
  });

  it("shows an ended contract's who, when and why, and the client a way to tender again", async () => {
    api.post.mockResolvedValue({ id: "r9", reference_code: "RFP-0012", stored_status: "draft" });
    show(ENDED);
    expect(await screen.findByText("Ended by NorthStar (the delivery partner) on 22 Oct 2026")).toBeTruthy();
    expect(screen.getByText(/We cannot staff it\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tender the RFP again" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/requests/r1/retender"));
    expect(await screen.findByText("editing the draft")).toBeTruthy();
  });

  it("opens a copy that was already published instead of editing it", async () => {
    api.post.mockResolvedValue({ id: "r9", reference_code: "RFP-0012", stored_status: "published" });
    show(ENDED);
    fireEvent.click(await screen.findByRole("button", { name: "Tender the RFP again" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/requests/r1/retender"));
    expect(await screen.findByText("the published copy")).toBeTruthy();
  });

  it("does not offer the partner the re-tender", async () => {
    as("o-ns", "tenant", "x", ["contract.deliver"]);
    show(ENDED);
    await screen.findByText("Ended by NorthStar (the delivery partner) on 22 Oct 2026");
    expect(screen.queryByRole("button", { name: "Tender the RFP again" })).toBeNull();
  });

  it("disables Raise invoice once nothing is left of an ended fixed price", async () => {
    as("o-ns", "tenant", "x", ["invoice.raise", "contract.deliver"]);
    show(CONTRACT({ ...ENDED, invoicing: { ...ENDED.invoicing!, after_end: { accepted: 40, target: 100, unit: "photos", cap: "600.00", left: "0.00" } } }));
    const raise = await screen.findByRole("button", { name: "Raise invoice" });
    expect((raise as HTMLButtonElement).disabled).toBe(true);
  });

  it("tells the partner how much of a fixed price is still to claim", async () => {
    as("o-ns", "tenant", "x", ["invoice.raise", "contract.deliver"]);
    show(ENDED);
    expect(await screen.findByText(/40 photos of 100 photos were accepted, so up to .*600.* of the agreed price may be invoiced/)).toBeTruthy();
  });
});
