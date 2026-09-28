// One conversation, as each side sees it: the order, who said what, "Seen",
// the composer's rules, the read stamp, and what a closed thread says.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Thread, ThreadMessage, ThreadMessagePage } from "@api/types";

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

import { ThreadPanel } from "./ThreadPanel";
import type { Viewer } from "./hooks";

const THREAD: Thread = {
  id: "t1", request_id: "r1", request_ref: "RFP-1011", request_title: "Storefront photos, Pune",
  client_org_id: "o-acme", client_org_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_org_name: "NorthStar Data Services",
  created_at: "2026-09-28T09:00:00Z", closed_at: null, closed_reason: null, closed_message: null,
  message_count: 2, last_seq: 2, last_message_at: "2026-09-28T09:05:00Z",
  last_message_preview: "Yes, drone footage is fine.",
  client_read_seq: 2, partner_read_seq: 1, unread_count: 1,
};
const M1: ThreadMessage = {
  id: "m1", thread_id: "t1", seq: 1, sender_org_id: "o-northstar", sender_user_id: "u1",
  sender_name: "Ravi Menon", body: "Is drone footage acceptable?", created_at: "2026-09-28T09:00:00Z",
};
const M2: ThreadMessage = {
  id: "m2", thread_id: "t1", seq: 2, sender_org_id: "o-acme", sender_user_id: "u2",
  sender_name: "Priya Shah", body: "Yes, drone footage is fine.", created_at: "2026-09-28T09:05:00Z",
};
// the wire is newest first
const PAGE: ThreadMessagePage = { items: [M2, M1], has_more: false };

let qc: QueryClient;

function show(props: Partial<Parameters<typeof ThreadPanel>[0]> = {}) {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const viewer: Viewer = props.viewer ?? "partner";
  render(
    <QueryClientProvider client={qc}>
      <ThreadPanel thread={THREAD} viewer={viewer} requestId="r1" canStart={false} {...props} />
    </QueryClientProvider>,
  );
}

const readCalls = () => api.post.mock.calls.filter(([p]) => p === "/threads/t1/read");
/** The polling interval the messages query was configured with. */
const interval = () =>
  (qc.getQueryCache().find({ queryKey: ["thread-messages", "t1"] })?.options as
    { refetchInterval?: unknown } | undefined)?.refetchInterval;

beforeEach(() => {
  session.current = {
    full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Data Services",
    org_kind: "tenant", role: "partner", capabilities: [],
  };
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path.startsWith("/threads/t1/messages") ? PAGE : null),
  );
  api.post.mockReset().mockImplementation((path: string, body?: unknown) => {
    if (path === "/threads/t1/messages") {
      const { body: text } = body as { body: string };
      return Promise.resolve({ ...M1, id: "m3", seq: 3, body: text, created_at: "2026-09-28T09:10:00Z" });
    }
    if (path === "/requests/r1/threads") {
      const { body: text } = body as { body: string };
      return Promise.resolve({ thread: THREAD, message: { ...M1, body: text } });
    }
    return Promise.resolve(undefined);
  });
});

describe("the log", () => {
  it("shows the conversation oldest first, with who and when", async () => {
    show();
    const log = await screen.findByRole("log", { name: "Conversation with Acme Retail Analytics" });
    const items = await within(log).findAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Is drone footage acceptable?"),
      expect.stringContaining("Yes, drone footage is fine."),
    ]);
    expect(items[0]!.textContent).toContain("Ravi Menon");
    expect(items[0]!.textContent).toContain("NorthStar Data Services");
    expect(items[1]!.textContent).toContain("Priya Shah");
    expect(items[1]!.textContent).toContain("Acme Retail Analytics");
    expect(items[0]!.querySelector("time")?.getAttribute("datetime")).toBe(M1.created_at);
    // mine on the right, theirs on the left
    expect(items[0]!.hasAttribute("data-mine")).toBe(true);
    expect(items[1]!.hasAttribute("data-mine")).toBe(false);
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.getAttribute("tabindex")).toBe("0");
  });

  it("marks my last message Seen once the client's stamp passes it", async () => {
    show();
    const log = await screen.findByRole("log");
    const items = await within(log).findAllByRole("listitem");
    expect(within(items[0]!).getByText("Seen")).toBeTruthy();       // client_read_seq 2 ≥ 1
    expect(within(items[1]!).queryByText("Seen")).toBeNull();       // not mine
  });

  it("offers earlier messages only when there are some, and pages back from the oldest", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path.startsWith("/threads/t1/messages") ? { ...PAGE, has_more: true } : null),
    );
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Load earlier messages" }));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/threads/t1/messages?limit=50&before=m1"),
    );
  });
});

describe("the read stamp", () => {
  it("is the newest message rendered, sent once on open", async () => {
    show();
    await waitFor(() => expect(readCalls()).toHaveLength(1));
    expect(readCalls()[0]![1]).toEqual({ last_seen_message_id: "m2" });
  });

  it("is sent again when a poll brings a new message from the other side", async () => {
    show();
    await waitFor(() => expect(readCalls()).toHaveLength(1));
    const M3 = { ...M2, id: "m3", seq: 3, body: "One more thing." };
    qc.setQueryData(["thread-messages", "t1"], {
      pages: [{ items: [M3, M2, M1], has_more: false }], pageParams: [null],
    });
    await waitFor(() => expect(readCalls()).toHaveLength(2));
    expect(readCalls()[1]![1]).toEqual({ last_seen_message_id: "m3" });
  });

  it("is never sent by Ops, who also gets no composer and no timer", async () => {
    session.current = {
      full_name: "Ops", org_id: "o-platform", org_name: "Platform", org_kind: "platform",
      role: "platform_admin", capabilities: [],
    };
    show({ viewer: "ops" });
    await screen.findByRole("log");
    expect(screen.getByText("Read-only for platform operations")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(readCalls()).toHaveLength(0);
    expect(interval()).toBe(false);
  });

  it("polls every ten seconds for a party on an open thread, and not on a closed one", async () => {
    show();
    await screen.findByRole("log");
    expect(interval()).toBe(10_000);
  });
});

describe("the composer", () => {
  it("sends with Ctrl+Enter, not Enter, and never sends a blank", async () => {
    show();
    const box = await screen.findByLabelText("Your message");
    const send = screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(box, { target: { value: "Thanks!" } });
    expect(screen.getByText("7 / 4000 · Ctrl+Enter to send")).toBeTruthy();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(api.post.mock.calls.some(([p]) => p === "/threads/t1/messages")).toBe(false);
    fireEvent.keyDown(box, { key: "Enter", ctrlKey: true });
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/threads/t1/messages", { body: "Thanks!" }));
    // the reply appears and the box is cleared for the next one
    await screen.findByText("Thanks!");
    expect((box as HTMLTextAreaElement).value).toBe("");
  });

  it("keeps the text when the server refuses", async () => {
    api.post.mockImplementation((path: string) =>
      path === "/threads/t1/messages"
        ? Promise.reject(new Error("This conversation is read-only: the request was awarded to another partner."))
        : Promise.resolve(undefined),
    );
    show();
    const box = await screen.findByLabelText("Your message");
    fireEvent.change(box, { target: { value: "Still here?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/awarded to another partner/)).toBeTruthy();
    expect(screen.getByText("Could not send")).toBeTruthy();
    expect((box as HTMLTextAreaElement).value).toBe("Still here?");
  });

  it("opens the thread with the partner's first question", async () => {
    show({ thread: null, canStart: true });
    expect(screen.getByText(/Ask the client anything about this RFP/)).toBeTruthy();
    const box = screen.getByLabelText("Your question");
    fireEvent.change(box, { target: { value: "Is drone footage acceptable?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask a question" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/requests/r1/threads", { body: "Is drone footage acceptable?" }),
    );
    expect(api.post.mock.calls.some(([p]) => p === "/threads/t1/messages")).toBe(false);
  });
});

describe("a closed thread", () => {
  const lost: Thread = { ...THREAD, closed_at: "2026-09-29T00:00:00Z", closed_reason: "awarded_elsewhere" };

  it("shows the history and the reason, with no composer — for the partner", async () => {
    show({ thread: lost });
    await screen.findByRole("log");
    expect(screen.getByText("This conversation is read-only")).toBeTruthy();
    expect(screen.getByText("The RFP was awarded to another partner.")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(interval()).toBe(false);
  });

  it("and for the client", async () => {
    session.current = {
      full_name: "Priya Shah", org_id: "o-acme", org_name: "Acme Retail Analytics",
      org_kind: "client", role: "client", capabilities: [],
    };
    show({ thread: lost, viewer: "client" });
    await screen.findByRole("log", { name: "Conversation with NorthStar Data Services" });
    expect(screen.getByText("You awarded this RFP to another partner.")).toBeTruthy();
  });

  it("says so after delivery too", async () => {
    show({ thread: { ...THREAD, closed_at: "x", closed_reason: "contract_completed" } });
    await screen.findByRole("log");
    expect(screen.getByText("Delivery is complete.")).toBeTruthy();
  });
});
