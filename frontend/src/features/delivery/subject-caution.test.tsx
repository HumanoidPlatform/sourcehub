// A subject typed as the MEDIUM — "video", "photo" — can never be matched.
//
// Five video tasks on the pilot database carry `subject.domain = "video"`,
// which made every clip raise the phone's keep-or-retake dialog: ML Kit labels
// what is in front of the lens (shelf, room, chair) and has no label for the
// word "video". The field now says what it is for and cautions when the
// medium is typed into it, without refusing — "video wall" is a real subject.
//
// Drives the dialog the way a partner does, in the manner of
// assign-task-dialog.test.tsx, so the caution is tested where it renders.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
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

import { ContractDetailPage, looksLikeMediaWord } from "./pages";

const CONTRACT = {
  id: "c1", reference_code: "CTR-01", request_id: "r1", request_ref: "RFP-1011",
  title: "Aisle clips, Bengaluru", client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_name: "NorthStar Delivery Partners",
  value: "120000.00", currency: "INR", status: "active", milestone_pct: 50,
  platform_fee_pct: "8.0", rubric_snapshot: {}, delivery_due_on: "2026-10-25",
  started_at: null, delivered_at: null, completed_at: null,
  progress: { total: 0, done: 0, pct: 0, assets_accepted: 0, deliverable: false },
  tasks: [], ratings: [],
};

const CROWD = { id: "o-crowd", name: "Bengaluru Crowd Collective", reference_code: "AG-01",
  kind: "aggregator", status: "active", country: "IN", profile: { crowd_size: 480 } };

function show() {
  const router = createMemoryRouter(
    [{ path: "/contracts/:id", element: <ContractDetailPage /> },
     { path: "/network", element: <p>network</p> }],
    { initialEntries: ["/contracts/c1"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function openDialog() {
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Assign task" }));
  return await screen.findByRole("dialog");
}

function typeSubject(dlg: HTMLElement, value: string) {
  const input = within(dlg).getByLabelText(/^Subject/);
  fireEvent.change(input, { target: { value } });
  return input;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation((path: string) => {
    if (path === "/contracts/c1") return Promise.resolve(CONTRACT);
    if (path === "/organisations?kind=aggregator") return Promise.resolve([CROWD]);
    if (path === "/organisations?kind=business") return Promise.resolve([]);
    return Promise.resolve(null);
  });
});

describe("looksLikeMediaWord", () => {
  it("names the media words a subject must not be", () => {
    for (const w of ["video", "Videos", " PHOTO ", "image", "clip", "footage", "audio", "media"]) {
      expect(looksLikeMediaWord(w)).toBe(true);
    }
  });

  it("leaves real subjects alone, including ones that contain a media word", () => {
    for (const w of ["retail shelf", "video wall", "picture frame", "warehouse aisle", "shop front", ""]) {
      expect(looksLikeMediaWord(w)).toBe(false);
    }
  });
});

describe("the Subject field", () => {
  it("says what the field is for: what the camera sees, not the medium", async () => {
    const dlg = await openDialog();
    const hint = within(dlg).getByText(/What the camera must SEE/);
    expect(hint.textContent).toMatch(/not the medium/);
  });

  it("cautions when the medium is typed into it, and names what was typed", async () => {
    const dlg = await openDialog();
    typeSubject(dlg, "video");
    const caution = within(dlg).getByTestId("subject-caution");
    expect(caution.textContent).toMatch(/can never see/);
    expect(caution.textContent).toMatch(/video/);
  });

  it("says nothing for a real subject", async () => {
    const dlg = await openDialog();
    typeSubject(dlg, "retail shelf");
    expect(within(dlg).queryByTestId("subject-caution")).toBeNull();
    typeSubject(dlg, "video wall");
    expect(within(dlg).queryByTestId("subject-caution")).toBeNull();
  });

  it("never blocks: the task can still be assigned with the medium as its subject", async () => {
    const dlg = await openDialog();
    fireEvent.change(within(dlg).getByLabelText(/^Task title/), { target: { value: "Aisle clips" } });
    // The supplier list arrives from its own query; selecting before the
    // option exists leaves the select on its placeholder and the button dead.
    await within(dlg).findByRole("option", { name: /Bengaluru Crowd Collective/ });
    fireEvent.change(within(dlg).getByLabelText(/^Assign to/), { target: { value: "o-crowd" } });
    typeSubject(dlg, "video");
    expect(within(dlg).getByTestId("subject-caution")).toBeTruthy();

    const assign = within(dlg).getByRole("button", { name: "Assign task" }) as HTMLButtonElement;
    expect(assign.disabled).toBe(false);
    fireEvent.click(assign);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/contracts/c1/tasks",
        expect.objectContaining({ subject: expect.objectContaining({ domain: "video" }) }),
      ),
    );
  });
});
