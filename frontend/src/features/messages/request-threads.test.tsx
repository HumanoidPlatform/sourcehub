// The conversations panel on the real RFP page, for each role: the client
// sees every partner's thread and chooses one, a partner sees only its own,
// nobody else sees anything, and a bell deep link lands on the right thread.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import type { Thread, ThreadMessagePage } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve()),
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

import { RequestDetailPage } from "@features/marketplace/pages";

const asClient = () => {
  session.current = {
    full_name: "Priya Shah", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: [],
  };
};
const asPartner = () => {
  session.current = {
    full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Data Services",
    org_kind: "tenant", role: "partner", capabilities: [],
  };
};

const MY_BID = {
  id: "p1", reference_code: "PRO-01", partner_org_id: "o-northstar",
  partner_name: "NorthStar Data Services", partner_qa_pass_rate: 94,
  price: "120000.00", currency: "INR", duration_days: 21,
  methodology: "Four crews, two weeks of capture, one of QA.",
  status: "submitted", attachments: [],
};

// The shape the page dereferences without guards (see request-detail-buyer.test).
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
  budget_disclosed: true, currency: "USD",
  pricing: { basis: "total", unit: null, block: null, quantity: null, amount: "1500.00",
    estimated_total: "1500.00", currency: "USD", text: "USD 1,500.00" },
  pilot: { required: false, quantity: null, due_on: null },
  proposal_requirements: [], proposals_close_at: null, bidding_open: true, contact_user_id: null,
  starts_on: "2026-09-30", delivery_due_on: "2026-10-25", storage_target_id: null,
  created_at: "2026-09-01T00:00:00+00:00",
  attachments: [], proposals: [MY_BID],
};

const T_NS: Thread = {
  id: "t1", request_id: "r1", request_ref: "RFP-1011", request_title: RFP.title,
  client_org_id: "o-acme", client_org_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_org_name: "NorthStar Data Services",
  created_at: "2026-09-28T09:00:00Z", closed_at: null, closed_reason: null, closed_message: null,
  message_count: 1, last_seq: 1, last_message_at: "2026-09-28T09:00:00Z",
  last_message_preview: "Is drone footage acceptable?",
  client_read_seq: 0, partner_read_seq: 1, unread_count: 1,
};
// asked, never bid — and the newer of the two
const T_KIWI: Thread = {
  ...T_NS, id: "t2", partner_org_id: "o-kiwi", partner_org_name: "Kiwi Field Ops",
  last_message_at: "2026-09-28T10:00:00Z", last_message_preview: "Can we start in October?",
  message_count: 2, last_seq: 2, unread_count: 2,
};
const page = (t: Thread, body: string): ThreadMessagePage => ({
  items: [{
    id: `${t.id}-m1`, thread_id: t.id, seq: 1, sender_org_id: t.partner_org_id, sender_user_id: "u",
    sender_name: "Someone", body, created_at: t.created_at,
  }],
  has_more: false,
});

let threads: Thread[] = [T_NS, T_KIWI];
let rfp: Record<string, unknown> = RFP;

function show(entry = "/requests/r1") {
  const router = createMemoryRouter(
    [{ path: "/requests/:id", element: <RequestDetailPage /> }],
    { initialEntries: [entry] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  asClient();
  threads = [T_NS, T_KIWI];
  rfp = RFP;
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/requests/r1") return Promise.resolve(rfp);
    if (path === "/requests/r1/threads") return Promise.resolve({ items: threads });
    if (path.startsWith("/threads/t1/messages")) return Promise.resolve(page(T_NS, "Is drone footage acceptable?"));
    if (path.startsWith("/threads/t2/messages")) return Promise.resolve(page(T_KIWI, "Can we start in October?"));
    return Promise.resolve(null);
  });
  api.post.mockReset().mockImplementation(() => Promise.resolve(undefined));
});

const panel = async () => (await screen.findByText("Conversations")).closest(".panel") as HTMLElement;

describe("the client", () => {
  it("sees every partner's thread, the newest chosen, with unread counts", async () => {
    show();
    const card = await panel();
    expect(await within(card).findByText("3 unread")).toBeTruthy();
    const list = within(card).getByRole("list", { name: "Conversations" });
    const rows = within(list).getAllByRole("button");
    expect(rows.map((b) => b.textContent)).toEqual([
      expect.stringContaining("Kiwi Field Ops"),
      expect.stringContaining("NorthStar Data Services"),
    ]);
    // Kiwi asked but never responded to the RFP
    expect(rows[0]!.textContent).toContain("No response");
    expect(rows[1]!.textContent).not.toContain("No response");
    expect(rows[0]!.getAttribute("aria-current")).toBe("true");
    await within(card).findByText("Can we start in October?");
  });

  it("switches threads from the list", async () => {
    show();
    const card = await panel();
    const list = await within(card).findByRole("list", { name: "Conversations" });
    fireEvent.click(within(list).getByRole("button", { name: /NorthStar/ }));
    await within(card).findByText("Is drone footage acceptable?");
    expect(within(list).getByRole("button", { name: /NorthStar/ }).getAttribute("aria-current")).toBe("true");
  });

  it("reaches a partner's thread from its bid row", async () => {
    show();
    const proposals = (await screen.findByText("Proposals")).closest(".panel") as HTMLElement;
    const btn = await within(proposals).findByRole("button", {
      name: "Messages with NorthStar Data Services, 1 unread",
    });
    expect(btn.textContent).toBe("Messages (1)");
    fireEvent.click(btn);
    const card = await panel();
    const list = await within(card).findByRole("list", { name: "Conversations" });
    await waitFor(() =>
      expect(within(list).getByRole("button", { name: /NorthStar/ }).getAttribute("aria-current")).toBe("true"),
    );
    // the panel is where the click lands
    expect(document.activeElement?.id).toBe("conversations");
  });

  it("has no panel on a draft", async () => {
    rfp = { ...RFP, status: "draft", stored_status: "draft", proposals: [] };
    show();
    await screen.findByText("Proposals");
    expect(screen.queryByText("Conversations")).toBeNull();
  });

  it("is told when a partner has not asked anything", async () => {
    threads = [];
    show();
    const card = await panel();
    expect(within(card).getByText("No conversations yet")).toBeTruthy();
  });
});

describe("the deep link", () => {
  it("selects that thread, then drops the param", async () => {
    const router = show("/requests/r1?thread=t1");
    const card = await panel();
    const list = await within(card).findByRole("list", { name: "Conversations" });
    await waitFor(() =>
      expect(within(list).getByRole("button", { name: /NorthStar/ }).getAttribute("aria-current")).toBe("true"),
    );
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("says so when the thread is not on this RFP", async () => {
    show("/requests/r1?thread=nope");
    expect(await screen.findByText("That conversation is not on this RFP")).toBeTruthy();
  });
});

describe("a partner", () => {
  beforeEach(() => {
    asPartner();
    threads = [T_NS];   // RLS: its own only
  });

  it("sees only its own thread, under its own heading", async () => {
    show();
    const card = (await screen.findByText("Questions to the client")).closest(".panel") as HTMLElement;
    await within(card).findByText("Is drone footage acceptable?");
    expect(screen.queryByText("Conversations")).toBeNull();
    expect(screen.queryByRole("list", { name: "Conversations" })).toBeNull();
    expect(within(card).getByLabelText("Your message")).toBeTruthy();
  });

  it("can ask before it has a thread, while the RFP is open", async () => {
    threads = [];
    show();
    const card = (await screen.findByText("Questions to the client")).closest(".panel") as HTMLElement;
    expect(within(card).getByRole("button", { name: "Ask a question" })).toBeTruthy();
  });

  it("gets no panel, and a straight answer, when it never asked and the RFP is awarded", async () => {
    threads = [];
    rfp = { ...RFP, status: "accepted", stored_status: "accepted", proposals: [] };
    show();
    await screen.findByText("Your response");
    expect(screen.queryByText("Questions to the client")).toBeNull();
    expect(screen.getByText("This RFP has been awarded.")).toBeTruthy();
  });

  it("keeps a read-only thread after losing the award", async () => {
    threads = [{ ...T_NS, closed_at: "2026-09-29T00:00:00Z", closed_reason: "awarded_elsewhere" }];
    rfp = { ...RFP, status: "accepted", stored_status: "accepted", proposals: [] };
    show();
    const card = (await screen.findByText("Questions to the client")).closest(".panel") as HTMLElement;
    expect(await within(card).findByText("The RFP was awarded to another partner.")).toBeTruthy();
    expect(within(card).queryByRole("textbox")).toBeNull();
  });
});

describe("everyone else", () => {
  it("an aggregator gets no panel and no request for threads", async () => {
    session.current = {
      full_name: "Asha Rao", org_id: "o-crowd", org_name: "Bengaluru Crowd Collective",
      org_kind: "aggregator", role: "supplier", capabilities: [],
    };
    show();
    await screen.findByText("Your response");
    expect(screen.queryByText("Conversations")).toBeNull();
    expect(screen.queryByText("Questions to the client")).toBeNull();
    expect(api.get.mock.calls.some(([p]) => p === "/requests/r1/threads")).toBe(false);
  });

  it("Ops reads every thread and writes in none", async () => {
    session.current = {
      full_name: "Ops", org_id: "o-platform", org_name: "Platform", org_kind: "platform",
      role: "platform_admin", capabilities: [],
    };
    show();
    const card = await panel();
    expect(within(card).getByText("Every partner's conversation on this RFP.")).toBeTruthy();
    expect(await within(card).findByRole("list", { name: "Conversations" })).toBeTruthy();
    await within(card).findByText("Read-only for platform operations");
    expect(within(card).queryByRole("textbox")).toBeNull();
    expect(api.post.mock.calls.some(([p]) => String(p).endsWith("/read"))).toBe(false);
  });
});
