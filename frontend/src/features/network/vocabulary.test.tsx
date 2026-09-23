// Bug 45: the console says "crowd resource", not "worker".
//
// Before this, exactly ONE production string containing "worker" was pinned by
// any test — "Add worker". Everything in assignments.tsx, qa/pages.tsx,
// delivery/pages.tsx and Shell.tsx was unpinned, so the rename would have gone
// green whether it was right or wrong. This sweeps the rendered text instead of
// naming individual strings, so it catches copy nobody thought to assert.
//
// The other half matters as much: the word is load-bearing underneath. The
// `worker` role code, the ["workers"] query key, /network/workers and
// worker_user_id all stay — changing the role code would not be a rename, it
// would flip every restrictive RLS policy open. So this also asserts the
// identifiers still work.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const session = vi.hoisted(() => ({
  current: {
    full_name: "Asha Rao", org_id: "o-crowd", org_name: "Bengaluru Crowd Collective",
    org_kind: "aggregator", role: "aggregator", capabilities: [] as string[],
  },
}));
vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { RosterPage } from "./pages";
import { TasksPage } from "@features/delivery/pages";
import { Gate1Page } from "@features/qa/pages";
import { WORKSPACE } from "@app/shell/Shell";

/** The word, as a standalone term. "workers" in a URL or a query key is fine;
 *  a reader seeing it is not. */
const SAYS_WORKER = /\bworkers?\b/i;

const WORKER = {
  id: "w1", reference_code: "WKR-01", display_name: "Jitu", skills: ["shelf_capture"],
  status: "on_shift", trained: true, rating: null, email: "jitu@example.com",
  phone: null, user_id: "u1", invitation_status: "accepted", open_assignments: 2,
};

const TASK = {
  id: "t1", reference_code: "TSK-01", title: "Shelf run", contract_id: "c1",
  contract_ref: "CTR-01", assignee_org_id: "o-crowd", assignee_name: "Bengaluru Crowd Collective",
  target: null, target_quantity: 10, target_unit: "photos", instructions: null,
  capture_spec: {}, subject: null, status: "assigned", due_on: "2026-09-29",
  started_at: null, completed_at: null, created_at: "2026-09-22T09:00:00Z",
  assignment_summary: { total: 2, cancelled: 0, accepted: 1, submitted: 1, quantity_assigned: 5 },
  asset_summary: null, attachments: [],
};

function show(element: React.ReactElement, path = "/x") {
  const router = createMemoryRouter([{ path, element }], { initialEntries: [path] });
  const r = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return r.container;
}

beforeEach(() => {
  vi.clearAllMocks();
  session.current = {
    full_name: "Asha Rao", org_id: "o-crowd", org_name: "Bengaluru Crowd Collective",
    org_kind: "aggregator", role: "aggregator", capabilities: [],
  };
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/network/workers") return Promise.resolve([WORKER]);
    if (path === "/tasks") return Promise.resolve([TASK]);
    if (path === "/qa/gate1") return Promise.resolve([]);
    return Promise.resolve([]);
  });
  api.post.mockReset().mockImplementation(() => Promise.resolve({}));
});

describe("what the aggregator reads", () => {
  it("never says worker on the crowd roster", async () => {
    const c = show(<RosterPage />, "/roster");
    await screen.findByText("Jitu");
    expect(c.textContent ?? "").not.toMatch(SAYS_WORKER);
    // and the new term is actually there, so an empty render cannot pass
    expect(c.textContent ?? "").toMatch(/crowd resource/i);
  });

  it("never says worker in the add dialog", async () => {
    show(<RosterPage />, "/roster");
    fireEvent.click(await screen.findByRole("button", { name: "Add crowd resource" }));
    const dlg = await screen.findByRole("dialog");
    expect(dlg.textContent ?? "").not.toMatch(SAYS_WORKER);
  });

  it("never says worker on the task list", async () => {
    const c = show(<TasksPage />, "/tasks");
    await screen.findByText("TSK-01");
    expect(c.textContent ?? "").not.toMatch(SAYS_WORKER);
  });

  it("never says worker in the crowd dialog or the assign dialog", async () => {
    show(<TasksPage />, "/tasks");
    await screen.findByText("TSK-01");
    fireEvent.click(await screen.findByRole("button", { name: "Crowd" }));
    const dlg = await screen.findByRole("dialog");
    expect(dlg.textContent ?? "").not.toMatch(SAYS_WORKER);

    // The assign dialog replaces rather than stacks, so wait for its own
    // content rather than for a second role="dialog".
    fireEvent.click(within(dlg).getByRole("button", { name: "Assign a crowd resource" }));
    await screen.findByText(/Choose a crowd resource/);
    expect(document.body.textContent ?? "").not.toMatch(SAYS_WORKER);
  });

  it("never says worker in the gate 1 queue", async () => {
    const c = show(<Gate1Page />, "/review");
    await screen.findByText(/Gate 1/);
    expect(c.textContent ?? "").not.toMatch(SAYS_WORKER);
  });
});

describe("what a crowd resource reads about themselves", () => {
  it("is labelled Crowd resource, not Crowd worker", () => {
    // The console's only worker-facing label. The KEY stays `worker` — it is
    // the backend role code that is_worker() reads out of app.role.
    expect(WORKSPACE.worker).toBe("Crowd resource");
    expect(Object.keys(WORKSPACE)).toContain("worker");
  });
});

describe("the identifiers underneath are untouched", () => {
  it("still fetches the roster from /network/workers", async () => {
    show(<RosterPage />, "/roster");
    await screen.findByText("Jitu");
    expect(api.get).toHaveBeenCalledWith("/network/workers");
  });

  it("still posts worker_user_id when assigning", async () => {
    show(<TasksPage />, "/tasks");
    await screen.findByText("TSK-01");
    fireEvent.click(await screen.findByRole("button", { name: "Crowd" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByRole("button", { name: "Assign a crowd resource" }));
    await screen.findByText(/Choose a crowd resource/);

    const select = screen.getByLabelText(/^Crowd resource/);
    // wait for a REAL option: the placeholder alone would satisfy a count check
    await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThan(1));
    fireEvent.change(select, { target: { value: "u1" } });
    fireEvent.change(screen.getByLabelText(/Units/), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /^Assign/ }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/tasks/t1/assignments",
        expect.objectContaining({ worker_user_id: "u1" }),
      ),
    );
  });
});
