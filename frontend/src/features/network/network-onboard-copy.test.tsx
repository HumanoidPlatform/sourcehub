// Bug 29: the partner's Network page said "Request an aggregator".
//
// The verb is now "Onboard" — the platform's own word for this act, and the
// one the Ops console already uses. What the surrounding copy says is
// deliberately unchanged: a partner cannot create an organisation, so the
// subtitle, the "Awaiting platform approval" panel and "Submit for approval"
// all still say who decides. Those are asserted here too, because they are
// what keeps the new verb honest.
//
// The dialog title is the other half. It used to interpolate the raw org kind
// — you clicked "Request a business partner" and were greeted by "Request a
// new business". Both now read one map, so the test is that they are equal.

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
    full_name: "Ravi Menon", org_id: "o-northstar", org_name: "NorthStar Delivery Partners",
    org_kind: "tenant", role: "partner", capabilities: [] as string[],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { NetworkPage } from "./pages";

/** tab label -> what the button and the dialog must BOTH say. */
const KINDS = [
  { tab: "Aggregators", phrase: "Onboard an aggregator" },
  { tab: "Business partners", phrase: "Onboard a business partner" },
  { tab: "Device sponsors", phrase: "Onboard a device sponsor" },
] as const;

function show() {
  const router = createMemoryRouter([{ path: "/network", element: <NetworkPage /> }], {
    initialEntries: ["/network"],
  });
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
  // An empty network and no pending requests: the plainest state, and the one
  // where the empty-state hint is on screen.
  api.get.mockReset().mockImplementation(() => Promise.resolve([]));
  api.post.mockReset().mockImplementation(() => Promise.resolve({}));
});

describe("the primary action on the Network page", () => {
  it("offers to onboard, per tab", async () => {
    // THE BUG: these read "Request an aggregator" and so on.
    show();
    for (const { tab, phrase } of KINDS) {
      fireEvent.click(await screen.findByRole("tab", { name: tab }));
      expect(await screen.findByRole("button", { name: phrase })).toBeTruthy();
    }
  });

  it("opens a dialog titled exactly what the button promised", async () => {
    // THE BUG's other half. The title interpolated the raw org kind, so the
    // last two tabs gave "Request a new business" and "Request a new sponsor"
    // against buttons reading "a business partner" and "a device sponsor".
    // Equality is the assertion — a substring check would have passed then.
    // One render for all three: mounting per iteration leaves the earlier
    // tablists in the document and every query goes ambiguous.
    show();
    for (const { tab, phrase } of KINDS) {
      fireEvent.click(await screen.findByRole("tab", { name: tab }));
      fireEvent.click(await screen.findByRole("button", { name: phrase }));
      const dlg = await screen.findByRole("dialog");
      const heading = within(dlg).getByRole("heading");
      expect(heading.textContent?.trim()).toBe(phrase);
      fireEvent.click(within(dlg).getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
  });

  it("still says who actually decides", async () => {
    // Guard, not a repro — all three of these are unchanged by this bug. They
    // are the reason "Onboard" is not a promise the partner cannot keep, so if
    // someone removes them the new verb quietly becomes a lie.
    show();
    expect(await screen.findByText(/New entries need platform approval/)).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Onboard an aggregator" }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByRole("button", { name: "Submit for approval" })).toBeTruthy();
  });

  it("tells an empty network to onboard, not to add", async () => {
    show();
    expect(await screen.findByText("Onboard one and the platform reviews it.")).toBeTruthy();
  });
});

describe("submitting", () => {
  it("still posts the request unchanged", async () => {
    // Guard: this bug was copy only. The payload, the endpoint and submit:true
    // must be exactly what they were.
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Onboard an aggregator" }));
    const dlg = within(await screen.findByRole("dialog"));

    fireEvent.change(dlg.getByLabelText(/Organisation name/), { target: { value: "Pune Field Crew" } });
    fireEvent.change(dlg.getByLabelText(/full name/i), { target: { value: "Asha Rao" } });
    fireEvent.change(dlg.getByLabelText(/email/i), { target: { value: "asha@pune.example" } });
    fireEvent.click(dlg.getByRole("button", { name: "Submit for approval" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/onboarding",
        expect.objectContaining({
          target_org_kind: "aggregator",
          proposed_name: "Pune Field Crew",
          submit: true,
          contact: { full_name: "Asha Rao", email: "asha@pune.example" },
        }),
      ),
    );
  });
});
