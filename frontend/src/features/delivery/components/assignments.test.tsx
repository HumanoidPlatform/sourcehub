// The Workers dialog as a campaign view: the offer panel must count how far
// the crowd has come, show what each recipient has been sent, and offer the
// two manual reminders — with the API's refusal shown in words, not lost.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Assignment, Task, TaskOffer } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
}));
vi.mock("@api/client", () => api);
vi.mock("./AssetGallery", () => ({
  AssetGallery: () => null,
  useTaskAssets: () => ({ data: [], isLoading: false }),
  useAssignmentAssets: () => ({ data: [], isLoading: false }),
}));

import { ToastProvider } from "@ds/primitives";
import { TaskAssignmentsDialog } from "./assignments";

const TASK = {
  id: "t1", reference_code: "TSK-07", title: "Metro shelf capture", status: "in_progress",
  target_unit: "photos", target_quantity: 30,
} as unknown as Task;

function assignment(over: Partial<Assignment>): Assignment {
  return {
    id: "a1", task_id: "t1", contract_id: "c1", supplier_org_id: "o1", worker_user_id: "u1",
    worker_name: "Priya Nair", worker_ref: "WKR-01", quantity: 10, status: "assigned",
    instructions: null, due_on: null, worker_note: null, decision_note: null,
    assigned_at: "2026-09-14T10:00:00Z", started_at: null, submitted_at: null, decided_at: null,
    reminder_count: 0, last_reminded_at: null,
    assets: { pending: 0, ready: 0, quarantined: 0, total: 0 },
    task: { id: "t1", reference_code: "TSK-07", title: "Metro shelf capture", instructions: null, capture_spec: {}, target_unit: "photos", due_on: null, status: "in_progress" },
    ...over,
  } as Assignment;
}

const OFFER: TaskOffer = {
  id: "o1", task_id: "t1", status: "open", effective_status: "open", worker_limit: 3, quantity: 10,
  accepted_count: 2, declined_count: 0, pending_count: 1, instructions: null, due_on: null,
  respond_by: "2026-10-05T10:00:00Z", created_at: "2026-09-21T10:00:00Z", closed_at: null,
  recipients: [
    { id: "r1", worker_user_id: "u1", worker_name: "Priya Nair", worker_ref: "WKR-01", email: "p@x", sent_at: "2026-09-21T10:00:00Z", send_error: null, response: "accepted", responded_at: "2026-09-21T11:00:00Z", assignment_id: "a1", reminders: [] },
    { id: "r2", worker_user_id: "u2", worker_name: "Arjun Rao", worker_ref: "WKR-02", email: "a@x", sent_at: "2026-09-21T10:00:00Z", send_error: null, response: "accepted", responded_at: "2026-09-21T12:00:00Z", assignment_id: "a2", reminders: [] },
    { id: "r3", worker_user_id: "u3", worker_name: "Meera Iyer", worker_ref: "WKR-03", email: "m@x", sent_at: "2026-09-21T10:00:00Z", send_error: null, response: null, responded_at: null, assignment_id: null,
      reminders: [{ kind: "offer_nudge", step: 0, sent_at: "2026-09-28T10:00:00Z", send_error: null, manual: false }] },
  ],
};

const ROWS = [
  assignment({ id: "a1", status: "assigned", reminder_count: 2, last_reminded_at: "2026-09-18T09:00:00Z" }),
  assignment({ id: "a2", worker_user_id: "u2", worker_name: "Arjun Rao", status: "submitted", submitted_at: "2026-09-20T10:00:00Z", assets: { pending: 0, ready: 10, quarantined: 0, total: 10 } }),
];

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <TaskAssignmentsDialog task={TASK} onClose={() => {}} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path.endsWith("/offers") ? [OFFER] : ROWS),
  );
  api.post.mockReset();
});

it("counts the funnel and shows each recipient's reminder history", async () => {
  show();
  expect(await screen.findByText("3 sent · 2 answered · 2 accepted · 1 started · 1 submitted")).toBeTruthy();
  expect(screen.getByText("reminded ×1")).toBeTruthy();
  // the assignments table: how often each worker has been chased
  expect(screen.getByText(/^2× · /)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Remind the silent (1)" })).toBeTruthy();
});

it("sends the manual reminders and shows the API's refusal", async () => {
  api.post.mockImplementation((path: string) =>
    path === "/offers/o1/remind"
      ? Promise.resolve(OFFER)
      : Promise.reject(new Error("Priya Nair was reminded 3 minutes ago.")),
  );
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Remind the silent (1)" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/offers/o1/remind", {}));
  expect(await screen.findByText("Reminders sent")).toBeTruthy();

  // one Remind per live, unsubmitted row: a1 (assigned) yes, a2 (submitted) no
  const remind = screen.getAllByRole("button", { name: "Remind" });
  expect(remind).toHaveLength(1);
  fireEvent.click(remind[0]!);
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/assignments/a1/remind", {}));
  expect(await screen.findByText("Priya Nair was reminded 3 minutes ago.")).toBeTruthy();
});
