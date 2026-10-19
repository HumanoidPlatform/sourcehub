// Offers and reminders no longer go to the crowd by e-mail (db/550): they
// reach a crowd resource only through the app, as a bell row and a push to
// the phone they registered. Someone with no phone connected hears of new
// work only when they next open the app, so the roster must show the
// aggregator who that is, and say nothing where the server does not know.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
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

const worker = (over: Record<string, unknown> = {}) => ({
  id: "w1", reference_code: "CW-01", display_name: "Jitu", skills: ["shelf_capture"],
  status: "on_shift", trained: true, rating: null, rating_count: 0, email: "jitu@example.com",
  phone: null, user_id: "u1", invitation_status: "accepted", open_assignments: 0, app_connected: true,
  ...over,
});

function show(rows: unknown[]) {
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

/** The roster row that names this person. */
async function rowOf(name: string): Promise<HTMLElement> {
  return (await screen.findByText(name)).closest("tr") as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("who the crowd's offers can reach", () => {
  it("shows App or No app beside each signed-up crowd resource", async () => {
    show([
      worker(),
      worker({ id: "w2", reference_code: "CW-02", display_name: "Kabir", user_id: "u2", app_connected: false }),
    ]);
    const connected = await rowOf("Jitu");
    expect(within(connected).getByText("App")).toBeTruthy();
    expect(within(connected).queryByText("No app")).toBeNull();

    const unreachable = await rowOf("Kabir");
    expect(within(unreachable).getByText("No app")).toBeTruthy();
    // the reason it matters, on the pill itself
    expect(within(unreachable).getByTitle("Offers and reminders reach crowd resources only through the app.")).toBeTruthy();
  });

  it("says nothing where the server does not know", async () => {
    // no login yet, so nobody can have connected a phone
    show([worker({ user_id: null, invitation_status: "pending", app_connected: null })]);
    const row = await rowOf("Jitu");
    expect(within(row).getByText("Invited")).toBeTruthy();
    expect(within(row).queryByText("App")).toBeNull();
    expect(within(row).queryByText("No app")).toBeNull();
  });
});
