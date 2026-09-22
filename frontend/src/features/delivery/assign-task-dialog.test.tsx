// Bug 26: the mandatory supplier field sat ninth, under the attachment picker.
//
// AssignTaskDialog is not exported, so this drives it the way a partner does —
// render the contract page, click "Assign task". That also pins the
// isPartner && status === "active" gate that puts the trigger on screen.
//
// Some of these fail on the pre-fix code and some do not; each says which it
// is. A test that passes before and after proves nothing about the bug, but it
// can still be the guard that stops the fix being undone.

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
  // The page reaches capture/uploader through AssetGallery, and that module
  // destructures xhrPut at import time — a mock without it fails collection
  // before a single test runs.
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

import { ContractDetailPage } from "./pages";

// partner_org_id must equal the session's org and status must be "active",
// or the "Assign task" trigger never renders (pages.tsx:153).
const CONTRACT = {
  id: "c1", reference_code: "CTR-01", request_id: "r1", request_ref: "RFP-1011",
  title: "Storefront photos, Pune", client_org_id: "o-acme", client_name: "Acme Retail Analytics",
  partner_org_id: "o-northstar", partner_name: "NorthStar Delivery Partners",
  value: "120000.00", currency: "INR", status: "active", milestone_pct: 50,
  platform_fee_pct: "8.0", rubric_snapshot: {}, delivery_due_on: "2026-10-25",
  started_at: null, delivered_at: null, completed_at: null,
  progress: { total: 0, done: 0, pct: 0, assets_accepted: 0, deliverable: false },
  tasks: [], ratings: [],
};

const CROWD = { id: "o-crowd", name: "Bengaluru Crowd Collective", reference_code: "AG-01",
  kind: "aggregator", status: "active", country: "IN", profile: { crowd_size: 480 } };

/** Routes every GET the page makes; `orgs` decides what the dropdown holds. */
function mockApi(orgs: { aggs?: unknown; bizs?: unknown } = {}) {
  const { aggs = [], bizs = [] } = orgs;
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/contracts/c1") return Promise.resolve(CONTRACT);
    if (path === "/organisations?kind=aggregator") return aggs as Promise<unknown>;
    if (path === "/organisations?kind=business") return bizs as Promise<unknown>;
    // null, never undefined — react-query v5 throws on undefined data.
    return Promise.resolve(null);
  });
}

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

/** Opens the dialog and returns its root. Click the page's "Assign task" while
 *  it is still the only button with that name — once the dialog is open there
 *  are two, the page action and the submit. */
async function openDialog() {
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Assign task" }));
  return await screen.findByRole("dialog");
}

const wrap = (v: unknown) => Promise.resolve(v);

beforeEach(() => {
  vi.clearAllMocks();
  mockApi({ aggs: wrap([CROWD]), bizs: wrap([]) });
});

describe("where the supplier field sits", () => {
  it("puts the mandatory supplier choice directly after the task title", async () => {
    // THE BUG. Before the fix this same query returned "Assign to" at index 8,
    // below "Attach to the instructions". A looser assertion — that the select
    // merely follows the title — was already true then and proves nothing, so
    // this has to be the whole ordered list.
    const dlg = await openDialog();
    const grid = dlg.querySelector(".formgrid") as HTMLElement;
    const labels = Array.from(grid.querySelectorAll(".field > label"))
      .map((l) => (l.textContent ?? "").replace("*", "").trim());

    expect(labels).toEqual([
      "Task title",
      "Assign to",
      "Due date",
      "Target",
      "Instructions for the field",
      "Subject",
      "Must show",
      "Must not show",
      "Attach to the instructions",
    ]);
  });

  it("still opens with focus in the title, not in the dropdown", async () => {
    // Guard, not a repro. Dialog focuses the first input in document order, so
    // moving the select one step further up would put focus inside it — where
    // an arrow key silently changes the assignee.
    const dlg = await openDialog();
    await waitFor(() =>
      expect(document.activeElement).toBe(within(dlg).getByLabelText(/Task title/)),
    );
  });
});

describe("the disabled Assign task button", () => {
  it("names what is still missing, and stops once nothing is", async () => {
    // THE BUG's other half: before the fix the button carried no title at all,
    // so it sat dead and silent.
    const dlg = await openDialog();
    const d = within(dlg);
    const submit = d.getByRole("button", { name: "Assign task" }) as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute("title")).toBe("Name the task and choose a supplier");

    fireEvent.change(d.getByLabelText(/Task title/), { target: { value: "Kraków routes" } });
    expect(submit.getAttribute("title")).toBe("Choose a supplier");

    await waitFor(() => expect(d.getByRole("option", { name: /Bengaluru/ })).toBeTruthy());
    fireEvent.change(d.getByLabelText(/Assign to/), { target: { value: "o-crowd" } });
    expect(submit.disabled).toBe(false);
    expect(submit.getAttribute("title")).toBeNull();

    fireEvent.change(d.getByLabelText(/Task title/), { target: { value: "" } });
    expect(submit.getAttribute("title")).toBe("Name the task");
  });
});

describe("when the network has nobody in it", () => {
  const EMPTY = "No aggregators or business partners in your network yet. Onboard one on the Network page.";

  it("says so", async () => {
    // THE BUG: before the fix the select held only "Choose a supplier…", the
    // submit was permanently dead, and nothing on screen explained why.
    mockApi({ aggs: wrap([]), bizs: wrap([]) });
    const dlg = await openDialog();
    expect(await within(dlg).findByText(EMPTY)).toBeTruthy();
  });

  it("ties that line to the select, and does not blame the partner for it", async () => {
    // The first two assertions are the repro. The last two are the decision
    // lock: hint, not error — error paints the border critical red and sets
    // aria-invalid, for a state the partner did not cause and cannot clear.
    mockApi({ aggs: wrap([]), bizs: wrap([]) });
    const dlg = await openDialog();
    const select = within(dlg).getByLabelText(/Assign to/);
    const hint = await within(dlg).findByText(EMPTY);

    expect(select.getAttribute("aria-describedby")).toBe(hint.id);
    expect(select.getAttribute("aria-invalid")).toBeNull();
    expect(select.closest(".field")?.hasAttribute("data-invalid")).toBe(false);
  });

  it("stays quiet while the lists are still loading", async () => {
    // Guard. Passes on the pre-fix code because there was no message at all —
    // its job is to fail the naive `(data ?? []).length === 0`, which flashes
    // "you have no suppliers" on every first paint.
    mockApi({ aggs: new Promise(() => {}), bizs: new Promise(() => {}) });
    const dlg = await openDialog();
    expect(within(dlg).getByLabelText(/Assign to/)).toBeTruthy();
    expect(within(dlg).queryByText(EMPTY)).toBeNull();
  });

  it("stays quiet when only one kind is empty", async () => {
    // Guard against OR-ing the two checks. A partner with aggregators and no
    // business partners has a perfectly usable form.
    mockApi({ aggs: wrap([CROWD]), bizs: wrap([]) });
    const dlg = await openDialog();
    await waitFor(() => expect(within(dlg).getByRole("option", { name: /Bengaluru/ })).toBeTruthy());
    expect(within(dlg).queryByText(EMPTY)).toBeNull();
  });

  it("does not call a failed read an empty network", async () => {
    // THE BUG this would have introduced: "you have no suppliers" stated as
    // fact about a list that never arrived. Same defect as the DPA row that
    // read an absent key as "Not signed".
    mockApi({ aggs: Promise.reject(new Error("Request failed (403)")),
              bizs: Promise.reject(new Error("Request failed (403)")) });
    const dlg = await openDialog();
    expect(await within(dlg).findByText(
      "Could not load your network. Reload the page and try again.",
    )).toBeTruthy();
    expect(within(dlg).queryByText(EMPTY)).toBeNull();
  });
});

describe("submitting", () => {
  it("posts the supplier the partner chose", async () => {
    // Guard, not a repro. Test 1 checks label order only, so a cut-and-paste
    // that dropped value= or onChange= from the moved select would leave it
    // green while the form posted an empty assignee_org_id.
    const dlg = await openDialog();
    const d = within(dlg);
    fireEvent.change(d.getByLabelText(/Task title/), { target: { value: "Kraków routes" } });
    await waitFor(() => expect(d.getByRole("option", { name: /Bengaluru/ })).toBeTruthy());
    fireEvent.change(d.getByLabelText(/Assign to/), { target: { value: "o-crowd" } });
    fireEvent.click(d.getByRole("button", { name: "Assign task" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/contracts/c1/tasks",
        expect.objectContaining({ assignee_org_id: "o-crowd", title: "Kraków routes" }),
      ),
    );
  });
});
