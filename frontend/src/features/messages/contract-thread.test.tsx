// The conversation continues on the contract page — for the client at
// /deliveries/:id and the partner at /contracts/:id — until the delivery is
// approved, and a winner that never asked can still start one there.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import type { Thread } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  putFile: vi.fn(() => Promise.resolve()),
  // the page reaches capture/uploader through AssetGallery, which destructures
  // xhrPut at import time
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
    full_name: "Priya Shah", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: [] as string[],
  },
}));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { ContractDetailPage } from "@features/delivery/pages";

const CONTRACT = {
  id: "c1", reference_code: "CTR-01", request_id: "r1", request_ref: "RFP-1011",
  title: "Storefront photos, Pune", client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_name: "NorthStar Data Services",
  value: "120000.00", currency: "INR", status: "active",
  pricing: { basis: "total", unit: null, block: null, quantity: null, amount: "120000.00",
    estimated_total: "120000.00", currency: "INR", text: "INR 120,000.00" },
  rubric_snapshot: {}, delivery_due_on: "2026-10-25",
  started_at: null, delivered_at: null, completed_at: null,
  progress: { total: 0, done: 0, pct: 0, assets_accepted: 0, deliverable: false },
  tasks: [], ratings: [],
};

const T_NS: Thread = {
  id: "t1", request_id: "r1", request_ref: "RFP-1011", request_title: CONTRACT.title,
  client_org_id: "o-acme", client_org_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_org_name: "NorthStar Data Services",
  created_at: "2026-09-28T09:00:00Z", closed_at: null, closed_reason: null, closed_message: null,
  message_count: 1, last_seq: 1, last_message_at: "2026-09-28T09:00:00Z",
  last_message_preview: "Is drone footage acceptable?",
  client_read_seq: 1, partner_read_seq: 1, unread_count: 0,
};
const PAGE = {
  items: [{
    id: "m1", thread_id: "t1", seq: 1, sender_org_id: "o-northstar", sender_user_id: "u",
    sender_name: "Ravi Menon", body: "Is drone footage acceptable?", created_at: "2026-09-28T09:00:00Z",
  }],
  has_more: false,
};

let threads: Thread[] = [T_NS];
let contract: Record<string, unknown> = CONTRACT;

function show(entry: string) {
  const router = createMemoryRouter(
    [
      { path: "/contracts/:id", element: <ContractDetailPage /> },
      { path: "/deliveries/:id", element: <ContractDetailPage /> },
    ],
    { initialEntries: [entry] },
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
    full_name: "Priya Shah", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: [],
  };
  threads = [T_NS];
  contract = CONTRACT;
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/contracts/c1") return Promise.resolve(contract);
    if (path === "/requests/r1/threads") return Promise.resolve({ items: threads });
    if (path.startsWith("/threads/t1/messages")) return Promise.resolve(PAGE);
    return Promise.resolve(null);
  });
  api.post.mockReset().mockImplementation(() => Promise.resolve(undefined));
});

const panel = async () => (await screen.findByText("Conversation")).closest(".panel") as HTMLElement;

describe("the client", () => {
  it("finds the winner's thread beside the delivery", async () => {
    show("/deliveries/c1");
    const card = await panel();
    expect(within(card).getByText("With NorthStar Data Services. Continued from the RFP.")).toBeTruthy();
    await within(card).findByText("Is drone footage acceptable?");
    expect(within(card).getByLabelText("Your message")).toBeTruthy();
  });

  it("sees no panel when the partner never asked", async () => {
    threads = [];
    show("/deliveries/c1");
    await screen.findByText("Work breakdown");
    expect(screen.queryByText("Conversation")).toBeNull();
  });

  it("reads a completed contract's thread without a composer", async () => {
    contract = { ...CONTRACT, status: "completed", completed_at: "2026-11-01T00:00:00Z" };
    threads = [{ ...T_NS, closed_at: "2026-11-01T00:00:00Z", closed_reason: "contract_completed" }];
    show("/deliveries/c1");
    const card = await panel();
    expect(await within(card).findByText("Delivery is complete.")).toBeTruthy();
    expect(within(card).queryByRole("textbox")).toBeNull();
  });
});

describe("the partner", () => {
  beforeEach(() => {
    session.current = {
      full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Data Services",
      org_kind: "tenant", role: "partner", capabilities: [],
    };
  });

  it("continues its own thread on the contract", async () => {
    show("/contracts/c1");
    const card = await panel();
    expect(within(card).getByText("With Acme Retail Analytics. Continued from the RFP.")).toBeTruthy();
    await within(card).findByText("Is drone footage acceptable?");
  });

  it("can still start one during delivery if it never asked before", async () => {
    threads = [];
    show("/contracts/c1");
    const card = await panel();
    expect(within(card).getByRole("button", { name: "Ask a question" })).toBeTruthy();
  });
});
