// The request builder's unsaved-work guard, on the real page.
//
// The builder holds everything in component state with no autosave; clicking
// "Requests" in the rail used to discard the lot without a word. What makes
// this worth testing on the page itself is the baseline: loading a draft
// replaces the whole form, and that must not count as the person's edit.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, Link, Outlet, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { RequestNewPage } from "./pages";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Priya Nair", org_name: "Acme Retail Analytics", org_kind: "client",
    role: "client", capabilities: [],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

const DRAFT = {
  id: "r1", reference_code: "REQ-1", title: "Street photos, Pune", category: "image", status: "draft",
  spec: { target_quantity: 100, target_unit: "photos" }, attachments: [],
};

function renderBuilder(at: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <>
            <Link to="/requests">Requests</Link>
            <Outlet />
          </>
        ),
        children: [
          { path: "requests/new", element: <RequestNewPage /> },
          { path: "requests/:id/edit", element: <RequestNewPage /> },
          { path: "requests", element: <p>request list</p> },
          { path: "requests/:id", element: <p>saved request</p> },
        ],
      },
    ],
    { initialEntries: [at] },
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

const leave = () => fireEvent.click(screen.getByRole("link", { name: "Requests" }));

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/requests/r1" ? DRAFT : []),
  );
  api.post.mockReset().mockImplementation(() => Promise.resolve({ ...DRAFT, id: "r9", reference_code: "REQ-9" }));
  api.patch.mockReset().mockImplementation(() => Promise.resolve(DRAFT));
});

describe("request builder", () => {
  it("lets an untouched new request go without asking", async () => {
    const router = renderBuilder("/requests/new");
    await screen.findByRole("heading", { name: "New request" });
    leave();
    expect(await screen.findByText("request list")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/requests");
  });

  it("asks before throwing away a request being written", async () => {
    const router = renderBuilder("/requests/new");
    fireEvent.change(await screen.findByLabelText(/Request title/), { target: { value: "Shopfront photos" } });
    leave();
    expect(await screen.findByRole("dialog", { name: "Leave without saving?" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/requests/new");
  });

  it("does not count loading a saved draft as an edit", async () => {
    const router = renderBuilder("/requests/r1/edit");
    expect(await screen.findByDisplayValue("Street photos, Pune")).toBeTruthy();
    leave();
    expect(await screen.findByText("request list")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/requests");
  });

  it("asks once a loaded draft has been changed", async () => {
    renderBuilder("/requests/r1/edit");
    fireEvent.change(await screen.findByDisplayValue("Street photos, Pune"), { target: { value: "Street photos, Mumbai" } });
    leave();
    expect(await screen.findByRole("dialog", { name: "Leave without saving?" })).toBeTruthy();
  });

  it("goes straight to the saved request after Save as draft", async () => {
    const router = renderBuilder("/requests/new");
    fireEvent.change(await screen.findByLabelText(/Request title/), { target: { value: "Shopfront photos" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));
    expect(await screen.findByText("saved request")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/requests/r9");
    expect(screen.queryByRole("dialog", { name: "Leave without saving?" })).toBeNull();
  });
});
