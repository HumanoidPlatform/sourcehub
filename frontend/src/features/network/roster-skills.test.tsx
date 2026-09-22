// Bug 37: Skill was a free-text box. Across four workers on the pilot
// database it collected 'Proficient', 'work', 'all' and nothing — not one a
// skill. It is now a fixed list of nine, ticked, stored as text[].
//
// Two things beyond the picker itself are worth pinning: skills can now be
// edited after the fact (the roster row had no UPDATE path at all, so whatever
// was typed on day one was permanent), and the places that render a worker's
// skills must join them — an array dropped into JSX renders with no separator.

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
import { SKILLS } from "./vocabularies";

const worker = (over: Record<string, unknown> = {}) => ({
  id: "w1", reference_code: "WKR-01", display_name: "Jitu",
  skills: ["shelf_capture", "retail_audit"],
  status: "on_shift", trained: true, rating: null, email: "jitu@example.com",
  phone: null, user_id: "u1", invitation_status: "accepted", open_assignments: 0,
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

const openAdd = async () => {
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Add crowd resource" }));
  return await screen.findByRole("dialog");
};

beforeEach(() => {
  vi.clearAllMocks();
  api.post.mockReset().mockImplementation(() => Promise.resolve({}));
  api.patch.mockReset().mockImplementation(() => Promise.resolve({}));
});

describe("adding a crowd resource", () => {
  it("offers the skills as a list, not a text box", async () => {
    // THE BUG: this was <input placeholder="Street imagery"> and accepted
    // anything at all.
    const dlg = await openAdd();
    for (const s of SKILLS) {
      expect(within(dlg).getByRole("checkbox", { name: new RegExp(s.label) })).toBeTruthy();
    }
    // no free-text control called Skill survives
    expect(within(dlg).queryByLabelText(/^Skills?$/)).toBeNull();
  });

  it("posts the ticked ones as an array", async () => {
    const dlg = await openAdd();
    fireEvent.change(within(dlg).getByLabelText(/Name/), { target: { value: "Asha Rao" } });
    fireEvent.click(within(dlg).getByRole("checkbox", { name: /Shelf capture/ }));
    fireEvent.click(within(dlg).getByRole("checkbox", { name: /Night driving/ }));
    fireEvent.click(within(dlg).getByRole("button", { name: /^Add/ }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/network/workers",
        expect.objectContaining({ skills: ["shelf_capture", "night_driving"] }),
      ),
    );
  });

  it("posts an empty array when none are ticked, never null", async () => {
    // Absence is [], the way every text[] column in this schema represents it.
    const dlg = await openAdd();
    fireEvent.change(within(dlg).getByLabelText(/Name/), { target: { value: "Asha Rao" } });
    fireEvent.click(within(dlg).getByRole("button", { name: /^Add/ }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/network/workers",
        expect.objectContaining({ skills: [] }),
      ),
    );
  });
});

describe("the roster table", () => {
  it("joins the labels instead of running them together", async () => {
    // An array in JSX renders with no separator at all — "Shelf captureRetail
    // audit" — which is what a naive shape change would have produced.
    show();
    expect(await screen.findByText("Shelf capture, Retail audit")).toBeTruthy();
  });

  it("shows an em dash for a worker with no skills", async () => {
    // [] is not nullish, so `?? "—"` would have rendered nothing at all here.
    show([worker({ skills: [] })]);
    await screen.findByText("Jitu");
    const row = screen.getByText("WKR-01").closest("tr") as HTMLElement;
    expect(within(row).getByText("—")).toBeTruthy();
  });
});

describe("editing a worker already on the roster", () => {
  it("saves a changed set through PATCH", async () => {
    // THE BUG's other half: skills could only ever be set at creation. There
    // was no PATCH route, no edit dialog and no UPDATE statement anywhere, so
    // the four existing workers could never be corrected.
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Details" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByRole("button", { name: "Edit skills" }));

    fireEvent.click(await within(dlg).findByRole("checkbox", { name: /Drone operation/ }));
    fireEvent.click(within(dlg).getByRole("button", { name: "Save skills" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/network/workers/w1", {
        skills: ["shelf_capture", "retail_audit", "drone_operation"],
      }),
    );
  });

  it("cancelling an edit changes nothing", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Details" }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByRole("button", { name: "Edit skills" }));
    fireEvent.click(await within(dlg).findByRole("checkbox", { name: /Drone operation/ }));
    fireEvent.click(within(dlg).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(within(dlg).queryByRole("checkbox")).toBeNull());
    expect(api.patch).not.toHaveBeenCalled();
  });
});
