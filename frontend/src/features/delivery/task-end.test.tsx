// CON-16 (db/600): a supplier declines a new task or hands one back; the
// partner withdraws one or moves it to another supplier. An ended task says how
// and why, and the supplier picker shows what the partner has seen of each
// supplier.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import type { Org, SupplierStats, Task } from "@api/types";

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

const who = vi.hoisted(() => ({ kind: "aggregator", org: "o-crowd", caps: ["task.start"] as string[] }));
vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Asha Rao", org_id: who.org, org_name: "Someone",
    org_kind: who.kind, role: "x", capabilities: who.caps,
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { ContractDetailPage, TasksPage } from "./pages";
import { partnerMayEnd, supplierEnd, supplierFigures } from "./components/task-end";

const task = (over: Partial<Task>): Task => ({
  id: "t1", reference_code: "TSK-07", title: "Shelf photos", contract_id: "c1", contract_ref: "CTR-07",
  assignee_org_id: "o-crowd", assignee_name: "Bengaluru Crowd Collective", assignee_kind: "aggregator",
  target: null, target_quantity: 10, target_unit: "photos", instructions: null,
  capture_spec: {}, status: "assigned", due_on: "2026-11-10", started_at: null,
  last_submission: null, assignment_summary: null, asset_summary: null, attachments: [],
  ...over,
});

function mount(element: JSX.Element, path: string, at: string) {
  const router = createMemoryRouter([{ path, element }], { initialEntries: [at] });
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
});

describe("who may end what", () => {
  it("lets the supplier decline only before anyone started, then hand back until QA", () => {
    expect(supplierEnd(task({ status: "assigned" }))).toBe("decline");
    expect(supplierEnd(task({ status: "assigned", started_at: "2026-10-20T10:00:00Z" }))).toBe("return");
    expect(supplierEnd(task({ status: "in_progress", started_at: "x" }))).toBe("return");
    expect(supplierEnd(task({ status: "qa_failed", started_at: "x" }))).toBe("return");
    for (const status of ["submitted", "qa_passed", "cancelled"]) {
      expect(supplierEnd(task({ status }))).toBeNull();
    }
  });

  it("lets the partner end anything that has not passed QA or ended", () => {
    for (const status of ["assigned", "in_progress", "submitted", "qa_failed"]) {
      expect(partnerMayEnd(task({ status }))).toBe(true);
    }
    expect(partnerMayEnd(task({ status: "qa_passed" }))).toBe(false);
    expect(partnerMayEnd(task({ status: "cancelled" }))).toBe(false);
  });

  it("describes a supplier by what is known of it, and a new one as new", () => {
    const org = { rating: 4.24, rating_count: 3 } as Org;
    const s: SupplierStats = { org_id: "x", open_tasks: 3, passed_tasks: 5, handed_back: 1, qa_decided: 6, qa_pass_rate: 83 };
    expect(supplierFigures(org, s)).toBe("★ 4.2 · 3 open · 83% pass QA · 1 handed back");
    expect(supplierFigures({ rating: null } as Org, undefined)).toBe("new to you");
  });
});

describe("the supplier's task list", () => {
  const TASKS = [
    task({ id: "a", reference_code: "TSK-01", title: "New one" }),
    task({ id: "b", reference_code: "TSK-02", title: "Under way", status: "in_progress", started_at: "x" }),
    task({ id: "c", reference_code: "TSK-03", title: "With the partner", status: "submitted", started_at: "x" }),
    task({
      id: "d", reference_code: "TSK-04", title: "Gone", status: "cancelled",
      ended: { at: "2026-10-21T10:00:00Z", kind: "withdrawn", reason: "Scope narrowed.", by_org_id: "o-ns", by_org_name: "NorthStar" },
    }),
  ];

  beforeEach(() => {
    who.kind = "aggregator";
    who.org = "o-crowd";
    who.caps = ["task.start"];
    api.get.mockReset().mockImplementation((path: string) => Promise.resolve(path === "/tasks" ? TASKS : []));
  });

  const row = async (title: string) => (await screen.findByText(title)).closest("tr") as HTMLElement;

  it("offers Decline on a new task and Hand back once work started, nothing once with the partner", async () => {
    mount(<TasksPage />, "/tasks", "/tasks");
    expect(within(await row("New one")).getByRole("button", { name: "Decline" })).toBeTruthy();
    expect(within(await row("New one")).queryByRole("button", { name: "Hand back" })).toBeNull();
    expect(within(await row("Under way")).getByRole("button", { name: "Hand back" })).toBeTruthy();
    expect(within(await row("Under way")).queryByRole("button", { name: "Decline" })).toBeNull();
    const withPartner = await row("With the partner");
    expect(within(withPartner).queryByRole("button", { name: "Decline" })).toBeNull();
    expect(within(withPartner).queryByRole("button", { name: "Hand back" })).toBeNull();
  });

  it("offers neither Decline nor Hand back to a user without task.start", async () => {
    who.caps = [];
    mount(<TasksPage />, "/tasks", "/tasks");
    expect(within(await row("New one")).queryByRole("button", { name: "Decline" })).toBeNull();
    expect(within(await row("Under way")).queryByRole("button", { name: "Hand back" })).toBeNull();
  });

  it("shows an ended task as ended, by whom and why, with nothing to press but Details", async () => {
    mount(<TasksPage />, "/tasks", "/tasks");
    const gone = await row("Gone");
    expect(within(gone).getByText("Ended")).toBeTruthy();
    expect(within(gone).getByText("Withdrawn by NorthStar")).toBeTruthy();
    expect(within(gone).getByText("Scope narrowed.")).toBeTruthy();
    for (const name of ["Start", "Submit to partner", "Decline", "Hand back"]) {
      expect(within(gone).queryByRole("button", { name })).toBeNull();
    }
  });

  it("hands back with a reason, said to the partner", async () => {
    api.post.mockResolvedValue(TASKS[1]);
    mount(<TasksPage />, "/tasks", "/tasks");
    fireEvent.click(within(await row("Under way")).getByRole("button", { name: "Hand back" }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText(/The delivery partner is told why/)).toBeTruthy();
    fireEvent.click(within(dlg).getByRole("button", { name: "Hand back task" }));
    expect(await within(dlg).findByText(/Give a reason/)).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.change(within(dlg).getByLabelText(/Reason/), { target: { value: "  Two crews fell ill.  " } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Hand back task" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/tasks/b/return", { reason: "Two crews fell ill." }));
  });
});

describe("the partner's work breakdown", () => {
  const CROWD = { id: "o-crowd", name: "Bengaluru Crowd Collective", kind: "aggregator", rating: 4.5, rating_count: 2, profile: { crowd_size: 480 } };
  const COBALT = { id: "o-cobalt", name: "Cobalt Data Works", kind: "business", rating: null, rating_count: 0, profile: { specialty: "Records" } };
  const CONTRACT = {
    id: "c1", reference_code: "CTR-07", request_id: "r1", title: "Storefront photos",
    client_org_id: "o-acme", client_name: "Acme", partner_org_id: "o-ns", partner_name: "NorthStar",
    value: "1000.00", currency: "USD", status: "in_qa", rubric_snapshot: {}, delivery_due_on: "2026-11-30",
    progress: { total: 2, done: 1, ended: 1, pct: 50, assets_accepted: 0, deliverable: false },
    ratings: [],
    tasks: [
      task({ id: "a", reference_code: "TSK-01", title: "Live work", status: "submitted", started_at: "x" }),
      task({ id: "b", reference_code: "TSK-02", title: "Passed work", status: "qa_passed", started_at: "x" }),
      task({
        id: "c", reference_code: "TSK-03", title: "Declined work", status: "cancelled",
        ended: { at: "2026-10-21T10:00:00Z", kind: "declined", reason: "No crowd there.", by_org_id: "o-crowd", by_org_name: "Bengaluru Crowd Collective" },
      }),
    ],
  };

  beforeEach(() => {
    who.kind = "tenant";
    who.org = "o-ns";
    who.caps = ["task.assign"];
    api.get.mockReset().mockImplementation((path: string) => {
      if (path === "/contracts/c1") return Promise.resolve(CONTRACT);
      if (path === "/organisations?kind=aggregator") return Promise.resolve([CROWD]);
      if (path === "/organisations?kind=business") return Promise.resolve([COBALT]);
      if (path === "/suppliers/stats") {
        return Promise.resolve([{ org_id: "o-crowd", open_tasks: 2, passed_tasks: 1, handed_back: 1, qa_decided: 4, qa_pass_rate: 75 }]);
      }
      return Promise.resolve(null);
    });
  });

  const row = async (title: string) => (await screen.findByText(title)).closest("tr") as HTMLElement;

  it("offers Move and Withdraw on live tasks only, and says how an ended one ended", async () => {
    mount(<ContractDetailPage />, "/contracts/:id", "/contracts/c1");
    const live = await row("Live work");
    expect(within(live).getByRole("button", { name: "Move" })).toBeTruthy();
    expect(within(live).getByRole("button", { name: "Withdraw" })).toBeTruthy();
    for (const title of ["Passed work", "Declined work"]) {
      expect(within(await row(title)).queryByRole("button", { name: "Withdraw" })).toBeNull();
    }
    expect(within(await row("Declined work")).getByText("Declined by Bengaluru Crowd Collective")).toBeTruthy();
    expect(await screen.findByText(/1 ended before QA, not counted/)).toBeTruthy();
  });

  it("warns that a submission waiting for QA is set aside, and withdraws with a reason", async () => {
    api.post.mockResolvedValue({});
    mount(<ContractDetailPage />, "/contracts/:id", "/contracts/c1");
    fireEvent.click(within(await row("Live work")).getByRole("button", { name: "Withdraw" }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText(/A submission is waiting for your QA: it is set aside/)).toBeTruthy();
    fireEvent.change(within(dlg).getByLabelText(/Reason/), { target: { value: "Client narrowed scope." } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Withdraw task" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/tasks/a/withdraw", { reason: "Client narrowed scope." }));
  });

  it("moves to another supplier, never the current one, showing what is known of each", async () => {
    api.post.mockResolvedValue({ ended: CONTRACT.tasks[0], task: { ...CONTRACT.tasks[0], reference_code: "TSK-09", assignee_name: "Cobalt Data Works" } });
    mount(<ContractDetailPage />, "/contracts/:id", "/contracts/c1");
    fireEvent.click(within(await row("Live work")).getByRole("button", { name: "Move" }));
    const dlg = await screen.findByRole("dialog");
    const select = within(dlg).getByLabelText(/Move to/) as HTMLSelectElement;
    await waitFor(() => expect(within(select).getByText(/Cobalt Data Works/)).toBeTruthy());
    expect(within(select).queryByText(/Bengaluru Crowd Collective/)).toBeNull();
    expect(within(select).getByText(/Cobalt Data Works — Records · new to you/)).toBeTruthy();
    const move = within(dlg).getByRole("button", { name: "Move task" });
    expect((move as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(select, { target: { value: "o-cobalt" } });
    fireEvent.change(within(dlg).getByLabelText(/Target/), { target: { value: "8" } });
    fireEvent.change(within(dlg).getByLabelText(/Reason/), { target: { value: "Faster crew" } });
    fireEvent.click(move);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/tasks/a/move", {
      assignee_org_id: "o-cobalt", reason: "Faster crew", target_quantity: 8, due_on: "2026-11-10",
    }));
  });

  it("offers no Move or Withdraw to a partner user without task.assign", async () => {
    who.caps = [];
    mount(<ContractDetailPage />, "/contracts/:id", "/contracts/c1");
    const live = await row("Live work");
    expect(within(live).queryByRole("button", { name: "Move" })).toBeNull();
    expect(within(live).queryByRole("button", { name: "Withdraw" })).toBeNull();
  });

  it("shows the figures in the Assign task picker too", async () => {
    // Assign task shows while the contract reads active (nothing waiting for QA)
    const get = api.get.getMockImplementation()!;
    api.get.mockImplementation((path: string) =>
      path === "/contracts/c1" ? Promise.resolve({ ...CONTRACT, status: "active" }) : get(path));
    mount(<ContractDetailPage />, "/contracts/:id", "/contracts/c1");
    fireEvent.click(await screen.findByRole("button", { name: "Assign task" }));
    const dlg = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(within(dlg).getByText(/Bengaluru Crowd Collective — 480 crowd resources · ★ 4.5 · 2 open · 75% pass QA · 1 handed back/)).toBeTruthy(),
    );
  });
});
