// The task dialog's phone-check line (db/530): counted on the server and read
// off one payload, where it used to load every capture of the task, checks and
// all, to add them up. The pure functions first, then the dialog itself: it
// asks for the summary and the first page, never the whole array.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckSummary, Task } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  putFile: vi.fn(() => Promise.resolve()),
  // the page reaches capture/uploader, which destructures xhrPut at import time
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
    org_kind: "aggregator", role: "aggregator", capabilities: [] as string[],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

import { ToastProvider } from "@ds/primitives";
import { deviceCheckList, deviceCheckSummary, TasksPage } from "./pages";

const SUMMARY: CheckSummary = {
  captures: 12, with_checks: 10, warnings: 3, blockers: 1, measurements: 24,
  by_code: { wrong_subject: 2, subject_unscored: 1, black: 1, tilt_measured: 20 },
  complaints_total: 4,
  complaints: [
    { asset_id: "as1", filename: "shelf-1.jpg", code: "wrong_subject", severity: "warn",
      message: "Doesn't look like retail shelf.", score: 0.12 },
    { asset_id: "as2", filename: null, code: "black", severity: "warn",
      message: "Dark for part of its length.", score: null },
  ],
};

describe("the summary line", () => {
  it("says it is loading, or that nothing was recorded", () => {
    expect(deviceCheckSummary(undefined, true)).toBe("Loading capture checks…");
    expect(deviceCheckSummary(undefined, false)).toBe("No device checks recorded");
    expect(deviceCheckSummary({ ...SUMMARY, with_checks: 0 }, false)).toBe("No device checks recorded");
  });

  it("counts the complaints first, then the flags, then the measurements", () => {
    expect(deviceCheckSummary(SUMMARY, false))
      .toBe("3 warnings · 1 blocker · 2 off-subject flags · 1 unscored capture · 24 measurements");
  });

  it("says No warnings when the only findings are measurements", () => {
    const quiet = { ...SUMMARY, warnings: 0, blockers: 0, by_code: { tilt_measured: 20 }, complaints_total: 0, complaints: [] };
    expect(deviceCheckSummary(quiet, false)).toBe("No warnings · 24 measurements");
  });
});

describe("the complaint list", () => {
  it("names the capture and says how many more there are to read in the previews", () => {
    render(<>{deviceCheckList({ ...SUMMARY, complaints_total: 10 })}</>);
    expect(screen.getByText("shelf-1.jpg")).toBeTruthy();
    expect(screen.getByText("Capture")).toBeTruthy();
    expect(screen.getByText(/score 0\.12/)).toBeTruthy();
    expect(screen.getByText("+8 more in the asset previews.")).toBeTruthy();
  });

  it("is nothing when there is nothing to list", () => {
    expect(deviceCheckList(undefined)).toBeNull();
    expect(deviceCheckList({ ...SUMMARY, complaints: [] })).toBeNull();
  });
});

/* --- the dialog itself ---------------------------------------------------------- */

const TASK = {
  id: "t1", reference_code: "TSK-01", title: "Shelf run", contract_id: "c1",
  contract_ref: "CTR-01", assignee_org_id: "o-crowd", assignee_name: "Bengaluru Crowd Collective",
  assignee_kind: "aggregator", target: null, target_quantity: 10, target_unit: "photos", instructions: null,
  capture_spec: {}, status: "in_progress", due_on: "2026-09-29", last_submission: null,
  assignment_summary: { total: 2, cancelled: 0, accepted: 1, submitted: 1, quantity_assigned: 5 },
  asset_summary: { pending: 0, ready: 9, quarantined: 1, bundled: 0, submittable: 0 }, attachments: [],
} as unknown as Task;

const EMPTY_PAGE = { items: [], has_more: false, next_cursor: null, expires_in: 900, total: 0 };

function showTasks() {
  const router = createMemoryRouter([{ path: "/tasks", element: <TasksPage /> }], { initialEntries: ["/tasks"] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function openDetails() {
  fireEvent.click(await screen.findByRole("button", { name: "Details" }));
  return screen.findByRole("dialog");
}

describe("the task dialog", () => {
  beforeEach(() => {
    api.get.mockReset().mockImplementation((path: string) => {
      if (path === "/tasks") return Promise.resolve([TASK]);
      if (path === "/tasks/t1/check-summary") return Promise.resolve(SUMMARY);
      if (path.startsWith("/tasks/t1/assets?")) return Promise.resolve(EMPTY_PAGE);
      return Promise.resolve([]);
    });
  });

  it("reads its counts from the server and pages the gallery, never the whole array", async () => {
    showTasks();
    const dlg = await openDetails();
    expect(await within(dlg).findByText(
      "3 warnings · 1 blocker · 2 off-subject flags · 1 unscored capture · 24 measurements",
    )).toBeTruthy();
    expect(within(dlg).getByText("9 ready · 1 quarantined")).toBeTruthy();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/tasks/t1/assets?limit=60"));
    expect(api.get).not.toHaveBeenCalledWith("/tasks/t1/assets");
  });

  it("filters to what the phone flagged on request", async () => {
    showTasks();
    const dlg = await openDetails();
    const toggle = within(dlg).getByRole("button", { name: "Flagged only" });
    fireEvent.click(toggle);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/tasks/t1/assets?limit=60&flagged=true"));
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });
});
