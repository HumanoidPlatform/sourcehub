// CON-2 / db/580: a client cancels a published RFP with a reason, and deletes
// a draft.
//
// Before this, a published RFP could not be withdrawn and a draft could not be
// deleted: one that drew no bids read Published for ever, and the bids on one
// the client had given up on stayed Submitted. What is pinned here:
//
//   * Cancel RFP exists for the client while the RFP is open, sends the reason,
//     and reports a refusal inside its dialog;
//   * nobody else gets the button, and an awarded RFP has none;
//   * a cancelled RFP says when and why, to the client and to a bidder, in
//     place of the stage rail, and offers no further actions;
//   * Delete draft exists only on a draft, deletes it and returns to the list;
//   * a partner's own response reads "RFP cancelled", with the reason.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const CLIENT_SESSION = {
  full_name: "Priya Nair", org_id: "o-acme", org_name: "Acme Retail Analytics",
  org_kind: "client", role: "client", capabilities: [] as string[],
};
const PARTNER_SESSION = {
  full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Data Services",
  org_kind: "tenant", role: "partner", capabilities: [] as string[],
};
const session = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { MyProposalsPage, RequestDetailPage } from "./pages";

const BID = {
  id: "p1", reference_code: "PRO-01", request_id: "r1", partner_org_id: "o-northstar",
  partner_name: "NorthStar Data Services", partner_qa_pass_rate: 94,
  price: "120000.00", currency: "INR", duration_days: 21,
  methodology: "Four crews, two weeks of capture, one of QA.", notes: null,
  status: "submitted", submitted_at: "2026-10-02T09:00:00+00:00", attachments: [],
};

// Shape of a live GET /requests/{id}, trimmed to the keys this page reads.
const RFP = {
  id: "r1", reference_code: "RFP-1011", title: "Storefront photos, Pune",
  category: "image", status: "proposals_received", stored_status: "published",
  client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  proposal_count: 1, compliance_notes: null,
  objective: "Shelf-level imagery for 400 kirana stores.", use_case: "audit_compliance",
  spec: {
    target_quantity: 4000, target_unit: "photos",
    capture: {}, countries: ["IN"], location_type: "public_outdoor",
  },
  acceptance: null,
  quality: { thresholds: {}, rejection_policy: {} },
  compliance: {
    people_in_frame: "none", minors_policy: "prohibited", deidentification: [],
    regulations: [], lawful_basis: "legitimate_interest", permitted_uses: ["audit"],
    partner_reuse_allowed: false, biometric_processing: false,
  },
  people_requirements: null,
  budget_disclosed: true, currency: "USD",
  pricing: { basis: "total", unit: null, block: null, quantity: null, amount: "1500.00",
    estimated_total: "1500.00", currency: "USD", text: "USD 1,500.00" },
  pilot: { required: false, quantity: null, due_on: null },
  proposals_close_at: null, bidding_open: true,
  starts_on: "2026-09-30", delivery_due_on: "2026-10-25", storage_target_id: null,
  created_at: "2026-09-01T00:00:00+00:00",
  cancelled_at: null, cancel_reason: null,
  attachments: [], proposals: [BID],
};

const CANCELLED = {
  ...RFP,
  status: "cancelled", stored_status: "cancelled",
  cancelled_at: "2026-10-05T10:30:00+00:00",
  cancel_reason: "Budget withdrawn for this quarter.",
  proposals: [{ ...BID, status: "cancelled" }],
};

function show(rfp: Record<string, unknown>, page: "detail" | "mine" = "detail") {
  api.get.mockImplementation((path: string) => {
    if (path === "/requests/r1") return Promise.resolve(rfp);
    if (path === "/proposals/mine") return Promise.resolve(rfp.proposals);
    return Promise.resolve(null);
  });
  const router = createMemoryRouter(
    [
      { path: "/requests/:id", element: <RequestDetailPage /> },
      { path: "/requests", element: <p>Your RFPs list</p> },
      { path: "/responses", element: <MyProposalsPage /> },
    ],
    { initialEntries: [page === "detail" ? "/requests/r1" : "/responses"] },
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
  session.current = { ...CLIENT_SESSION };
  api.get.mockReset();
  api.post.mockReset().mockResolvedValue({});
  api.del.mockReset().mockResolvedValue(undefined);
});

describe("a client cancelling an open RFP", () => {
  it("asks for a reason and sends it", async () => {
    show(RFP);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel RFP" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Cancel RFP-1011?")).toBeTruthy();
    // the dismiss button does not read "Cancel" next to "Cancel RFP"
    expect(within(dialog).getByRole("button", { name: "Keep it open" })).toBeTruthy();
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "Budget withdrawn for this quarter." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel RFP" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/requests/r1/cancel", {
        reason: "Budget withdrawn for this quarter.",
      }),
    );
  });

  it("shows the server's refusal inside the dialog", async () => {
    api.post.mockRejectedValueOnce(new Error("An awarded RFP cannot be cancelled: it has a contract."));
    show(RFP);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel RFP" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "No longer needed." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel RFP" }));
    expect(
      await within(dialog).findByText("An awarded RFP cannot be cancelled: it has a contract."),
    ).toBeTruthy();
  });

  it("offers no Cancel RFP once the RFP is awarded", async () => {
    show({ ...RFP, status: "accepted", stored_status: "accepted" });
    await screen.findByText("Storefront photos, Pune");
    expect(screen.queryByRole("button", { name: "Cancel RFP" })).toBeNull();
  });

  it("never offers it to a partner", async () => {
    session.current = { ...PARTNER_SESSION };
    show(RFP);
    await screen.findByText("Storefront photos, Pune");
    expect(screen.queryByRole("button", { name: "Cancel RFP" })).toBeNull();
  });
});

describe("a cancelled RFP", () => {
  it("tells the client when and why, and offers nothing more", async () => {
    show(CANCELLED);
    expect(await screen.findByText("Budget withdrawn for this quarter.")).toBeTruthy();
    expect(screen.getByText(/^Cancelled /)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel RFP" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Change deadline" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Award" })).toBeNull();
  });

  it("tells a bidder why, and offers no Respond", async () => {
    session.current = { ...PARTNER_SESSION };
    show(CANCELLED);
    expect(await screen.findByText("Budget withdrawn for this quarter.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Respond" })).toBeNull();
  });
});

describe("a client deleting a draft", () => {
  it("deletes it and returns to the list", async () => {
    show({ ...RFP, status: "draft", stored_status: "draft", proposal_count: 0, proposals: [] });
    fireEvent.click(await screen.findByRole("button", { name: "Delete draft" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Delete this draft?")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete draft" }));
    await waitFor(() => expect(api.del).toHaveBeenCalledWith("/requests/r1"));
    expect(await screen.findByText("Your RFPs list")).toBeTruthy();
  });

  it("offers no Delete draft once published", async () => {
    show(RFP);
    await screen.findByRole("button", { name: "Cancel RFP" });
    expect(screen.queryByRole("button", { name: "Delete draft" })).toBeNull();
  });
});

describe("a partner's own response on a cancelled RFP", () => {
  it("reads RFP cancelled, with the client's reason", async () => {
    session.current = { ...PARTNER_SESSION };
    show({
      ...CANCELLED,
      proposals: [{
        ...BID, status: "cancelled", request_title: "Storefront photos, Pune",
        request_ref: "RFP-1011", request_status: "cancelled",
        request_cancel_reason: "Budget withdrawn for this quarter.",
      }],
    }, "mine");
    expect(await screen.findByText("RFP cancelled")).toBeTruthy();
    fireEvent.click(screen.getByText("Storefront photos, Pune"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Why the RFP was cancelled")).toBeTruthy();
    expect(within(dialog).getByText("Budget withdrawn for this quarter.")).toBeTruthy();
  });

  const withdrawnOn = (requestStatus: string) => ({
    ...BID, status: "withdrawn", request_title: "Storefront photos, Pune",
    request_ref: "RFP-1011", request_status: requestStatus, request_cancel_reason: null,
  });

  it("offers no Respond again on a withdrawn bid once the RFP is cancelled", async () => {
    session.current = { ...PARTNER_SESSION };
    show({ ...CANCELLED, proposals: [withdrawnOn("cancelled")] }, "mine");
    fireEvent.click(await screen.findByRole("button", { name: "Actions for PRO-01" }));
    expect(await screen.findByRole("menuitem", { name: "View response" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Respond again" })).toBeNull();
  });

  it("still offers Respond again on a withdrawn bid while the RFP is open", async () => {
    session.current = { ...PARTNER_SESSION };
    show({ ...RFP, proposals: [withdrawnOn("published")] }, "mine");
    fireEvent.click(await screen.findByRole("button", { name: "Actions for PRO-01" }));
    expect(await screen.findByRole("menuitem", { name: "Respond again" })).toBeTruthy();
  });
});
