// The partner's two ratings on the contract page (db/380): of the client once
// the contract completed, of a supplier once its task passed QA. Each shows
// once, to the partner holding rating.write, and goes once the row exists. And
// the client's approve dialog no longer claims the comment is published.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
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

const session = vi.hoisted(() => ({
  current: {
    full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Delivery Partners",
    org_kind: "tenant", role: "partner", capabilities: ["rating.write"] as string[],
  },
}));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { ContractDetailPage } from "./pages";

const TASK = {
  id: "t1", reference_code: "TSK-01", title: "Shelf capture", contract_id: "c1", contract_ref: "CTR-01",
  assignee_org_id: "o-crowd", assignee_name: "Bengaluru Crowd Collective", assignee_kind: "aggregator",
  status: "qa_passed", target: "4 photos", target_quantity: 4, target_unit: "photos", due_on: "2026-10-20",
  instructions: null, capture_spec: {}, attachments: [], client_documents: null,
  last_submission: { id: "s1", attempt_no: 1, status: "accepted", supplier_note: null, asset_count: 4, submitted_at: "2026-10-12T10:00:00Z" },
  assignment_summary: null, asset_summary: null, supplier_rating: null, created_at: "2026-10-01T00:00:00Z",
};

const CONTRACT = {
  id: "c1", reference_code: "CTR-01", request_id: "r1", request_ref: "RFP-1011",
  title: "Storefront photos, Pune", client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_name: "NorthStar Delivery Partners",
  value: "120000.00", currency: "INR", status: "completed",
  pricing: { basis: "total", unit: null, block: null, quantity: null, amount: "120000.00",
    estimated_total: "120000.00", currency: "INR", text: "INR 120,000.00" },
  rubric_snapshot: {}, delivery_due_on: "2026-10-25",
  started_at: null, delivered_at: "2026-10-12T00:00:00Z", completed_at: "2026-10-13T00:00:00Z",
  progress: { total: 1, done: 1, pct: 100, assets_accepted: 4, deliverable: true },
  tasks: [TASK],
  ratings: [{
    id: "g1", kind: "client_partner", contract_id: "c1", task_id: null, assignment_id: null,
    from_org_id: "o-acme", to_org_id: "o-northstar", to_user_id: null, score: 5,
    comment: "Delivered ahead of schedule.", created_at: "2026-10-13T00:00:00Z",
    from_name: "Acme Retail Analytics", to_name: "NorthStar Delivery Partners",
  }],
};

function mockApi(contract: unknown) {
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/contracts/c1") return Promise.resolve(contract);
    return Promise.resolve(null);
  });
}

function show() {
  const router = createMemoryRouter(
    [{ path: "/contracts/:id", element: <ContractDetailPage /> }],
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

beforeEach(() => {
  vi.clearAllMocks();
  session.current = { ...session.current, org_id: "o-northstar", org_kind: "tenant", role: "partner", capabilities: ["rating.write"] };
  mockApi(CONTRACT);
});

describe("the partner rates the client", () => {
  it("offers it on a completed contract and posts to the contract's rating URL", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Rate the client" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Rate Acme Retail Analytics/)).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText(/Comment/), { target: { value: "Clear brief, prompt answers." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save rating" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/contracts/c1/rating", { score: 5, comment: "Clear brief, prompt answers." }));
  });

  it("goes once the client has been rated", async () => {
    mockApi({ ...CONTRACT, ratings: [...CONTRACT.ratings, { ...CONTRACT.ratings[0], id: "g2", kind: "partner_client", from_org_id: "o-northstar", to_org_id: "o-acme", from_name: "NorthStar Delivery Partners", to_name: "Acme Retail Analytics" }] });
    show();
    await screen.findAllByText(/Delivered ahead of schedule/);
    expect(screen.queryByRole("button", { name: "Rate the client" })).toBeNull();
    // and the panel names each direction
    expect(screen.getByText(/Delivery partner → Client/)).toBeTruthy();
    expect(screen.getByText(/Client → Delivery partner/)).toBeTruthy();
  });

  it("is not the client's to give, nor a partner's without the capability", async () => {
    session.current = { ...session.current, org_id: "o-acme", org_kind: "client", role: "client", capabilities: ["contract.approve"] };
    show();
    await screen.findAllByText(/Delivered ahead of schedule/);
    expect(screen.queryByRole("button", { name: "Rate the client" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Rate supplier" })).toBeNull();
  });
});

describe("the partner rates the supplier", () => {
  it("offers it on a task that passed QA and posts to the task's rating URL", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Rate supplier" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/How did they deliver TSK-01/)).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText(/Comment/), { target: { value: "Fast and tidy." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save rating" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/tasks/t1/rating", { score: 5, comment: "Fast and tidy." }));
  });

  it("shows the given rating instead once the task is rated, and not before QA", async () => {
    mockApi({ ...CONTRACT, tasks: [{ ...TASK, supplier_rating: { score: 4, comment: "Fast and tidy.", created_at: "2026-10-13T00:00:00Z" } }] });
    show();
    await screen.findByText(/rated ★ 4/);
    expect(screen.queryByRole("button", { name: "Rate supplier" })).toBeNull();

    mockApi({ ...CONTRACT, status: "active", tasks: [{ ...TASK, status: "submitted" }] });
    show();
    await screen.findAllByText("Shelf capture");
    expect(screen.queryByRole("button", { name: "Rate supplier" })).toBeNull();
  });
});

describe("the client's approve dialog", () => {
  it("no longer claims the words are published, and holds both buttons until there are some", async () => {
    session.current = { ...session.current, org_id: "o-acme", org_kind: "client", role: "client", capabilities: ["contract.approve"] };
    mockApi({ ...CONTRACT, status: "delivered", ratings: [] });
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Approve delivery" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/shown on their profile/)).toBeNull();
    expect(within(dialog).getByText(/your words are never shown there/)).toBeTruthy();
    const approve = within(dialog).getByRole("button", { name: "Approve delivery" }) as HTMLButtonElement;
    const back = within(dialog).getByRole("button", { name: "Send back" }) as HTMLButtonElement;
    fireEvent.change(within(dialog).getByLabelText(/Comment/), { target: { value: "ab" } });
    expect(approve.disabled).toBe(true);
    expect(back.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(/Comment/), { target: { value: "abc" } });
    expect(approve.disabled).toBe(false);
    expect(back.disabled).toBe(false);
  });
});
