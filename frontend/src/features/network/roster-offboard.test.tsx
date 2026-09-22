// Bug 35: Offboard was a red button that fired on the first click, sitting
// beside a shift toggle that shares the very same mutation and is harmless.
//
// Offboarding revokes the worker's role grant. There is no reinstate route,
// the same email cannot be re-invited, and setting them "On shift" again
// restores the roster status but not the grant — so it is a delete in
// everything but name, and it asked nothing.
//
// The guard that matters as much as the fix: the shift toggle must STAY a
// single click. The easy over-fix is to confirm every status change, which
// puts a dialog in front of a button an aggregator presses all day.

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

import { RosterPage } from "./pages";

const worker = (over: Partial<Record<string, unknown>> = {}) => ({
  id: "w1", reference_code: "CW-01", display_name: "Jitu", skills: ["shelf_capture"],
  status: "on_shift", trained: true, rating: null, email: "jitu@example.com",
  phone: null, user_id: "u1", invitation_status: "accepted", open_assignments: 2,
  ...over,
});

function show(rows: unknown[] = [worker()]) {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/network/workers" ? rows : []),
  );
  const router = createMemoryRouter([{ path: "/roster", element: <RosterPage /> }], {
    initialEntries: ["/roster"],
  });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const clickOffboard = async () => {
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Offboard" }));
  return await screen.findByRole("dialog");
};

beforeEach(() => {
  vi.clearAllMocks();
  api.post.mockReset().mockImplementation(() => Promise.resolve({}));
});

describe("offboarding a worker", () => {
  it("asks before doing anything", async () => {
    // THE BUG: this posted straight away, on the first click.
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Offboard" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("says it cannot be undone, and names what gets stranded", async () => {
    const dlg = await clickOffboard();
    expect(within(dlg).getByText(/cannot be undone/i)).toBeTruthy();
    // the heading, not just any mention — the name is in the body too
    expect(within(dlg).getByRole("heading").textContent).toContain("Offboard Jitu?");
    // the worker has 2 open assignments, which the row already knows about
    expect(within(dlg).getByText(/2 open assignments/)).toBeTruthy();
    expect(within(dlg).getByText(/nobody else can pick them up/i)).toBeTruthy();
    expect(within(dlg).getByText(/already submitted is kept/i)).toBeTruthy();
  });

  it("says nothing about stranded work when there is none", async () => {
    show([worker({ open_assignments: 0 })]);
    fireEvent.click(await screen.findByRole("button", { name: "Offboard" }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).queryByText(/open assignment/)).toBeNull();
    expect(within(dlg).getByText(/cannot be undone/i)).toBeTruthy();
  });

  it("does nothing at all when cancelled", async () => {
    const dlg = await clickOffboard();
    fireEvent.click(within(dlg).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByText("Jitu")).toBeTruthy();
  });

  it("still offboards when confirmed", async () => {
    // Guard: the dialog must not have broken the thing it guards.
    const dlg = await clickOffboard();
    fireEvent.click(within(dlg).getByRole("button", { name: "Offboard" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/network/workers/w1/status", { status: "offboarded" }),
    );
  });

  it("surfaces a refusal instead of failing in silence", async () => {
    // The mutation had no onError, so a 409 showed nothing and the row just
    // re-rendered unchanged.
    // invented here, not a real server string — the point is only that whatever
    // the server says reaches the screen.
    api.post.mockImplementation(() => Promise.reject(new Error("They have open assignments.")));
    const dlg = await clickOffboard();
    fireEvent.click(within(dlg).getByRole("button", { name: "Offboard" }));
    expect(await screen.findByText(/They have open assignments\./)).toBeTruthy();
  });
});

describe("the shift toggle beside it", () => {
  it("still takes one click, with no dialog", async () => {
    // Guard against the over-fix. This button is pressed all day.
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Break" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/network/workers/w1/status", { status: "on_break" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
