// Bug 32: /tasks?task=<id> opens that task.
//
// The bell's "New task" alert carries the task id and used to land on the
// plain list. Opening the task needed a mechanism, because nothing in this app
// opened a dialog from a URL — TasksPage held the open task purely in state.

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

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Asha Rao", org_id: "o-crowd", org_name: "Bengaluru Crowd Collective",
    org_kind: "aggregator", role: "supplier", capabilities: [] as string[],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { TasksPage } from "./pages";

const TASK = "774987d8-b61d-4740-b81c-7fc7df54b44a";
const OTHER = "11111111-2222-4333-8444-555555555555";

const task = (id: string, ref: string, title: string) => ({
  id, reference_code: ref, title, contract_id: "c1", contract_ref: "CTR-07",
  assignee_org_id: "o-crowd", assignee_name: "Bengaluru Crowd Collective",
  target: null, target_quantity: 10, target_unit: "photos", instructions: null,
  capture_spec: {}, subject: null, status: "in_progress", due_on: "2026-09-29",
  started_at: null, completed_at: null, created_at: "2026-09-22T09:16:00Z",
  assignment_summary: null, asset_summary: null, attachments: [],
});

const TASKS = [task(TASK, "TSK-14", "Testattop"), task(OTHER, "TSK-12", "warehouse agg 1")];

function show(at: string) {
  const router = createMemoryRouter([{ path: "/tasks", element: <TasksPage /> }], {
    initialEntries: [at],
  });
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
  vi.clearAllMocks();
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/tasks" ? TASKS : []),
  );
});

describe("arriving from a notification", () => {
  it("opens the task the alert was about", async () => {
    // THE BUG: the param was ignored entirely and the aggregator got the list.
    show(`/tasks?task=${TASK}`);
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText(/Testattop/)).toBeTruthy();
  });

  it("opens that one, not merely the first in the list", async () => {
    show(`/tasks?task=${OTHER}`);
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText(/warehouse agg 1/)).toBeTruthy();
    expect(within(dlg).queryByText(/Testattop/)).toBeNull();
  });

  it("drops the param when the dialog closes, so Back does not reopen it", async () => {
    const router = show(`/tasks?task=${TASK}`);
    const dlg = await screen.findByRole("dialog");
    // Two controls are named Close — the header × and the footer button.
    // Scope to the footer, which is the one a reader actually clicks.
    const foot = dlg.querySelector(".dialog-foot") as HTMLElement;
    fireEvent.click(within(foot).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(router.state.location.search).toBe("");
  });

  it("says so when the task is not in the list, rather than failing silently", async () => {
    // An old alert for a withdrawn task. Doing nothing here would reproduce
    // the very symptom this bug is about.
    show("/tasks?task=does-not-exist");
    expect(await screen.findByText(/not in your list/i)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("arriving normally", () => {
  it("opens no dialog", async () => {
    show("/tasks");
    await screen.findByText("TSK-14");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
