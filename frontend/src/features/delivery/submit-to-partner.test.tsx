// Submit to partner (db/530): what the submission would bundle is counted on
// the server into the task row's asset_summary.submittable. The dialog used to
// load every capture of the task to count the ready ones on accepted
// assignments; now it loads nothing but the assignments it already needed.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Assignment, Task } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
}));
vi.mock("@api/client", () => api);

import { SubmitToPartnerDialog } from "./components/assignments";

const task = (submittable: number) => ({
  id: "t1", reference_code: "TSK-01", title: "Shelf run", status: "in_progress",
  target_unit: "photos", target_quantity: 10,
  asset_summary: { pending: 0, ready: 7, quarantined: 0, bundled: 0, submittable },
}) as unknown as Task;

const ACCEPTED = [
  { id: "a1", task_id: "t1", status: "accepted", quantity: 10, worker_name: "Priya Nair" },
] as unknown as Assignment[];

function show(t: Task) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SubmitToPartnerDialog task={t} onClose={() => {}} onDone={() => {}} />
    </QueryClientProvider>,
  );
}

const submitBtn = () => screen.getByRole("button", { name: "Submit for partner QA" }) as HTMLButtonElement;

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) =>
    Promise.resolve(path === "/tasks/t1/assignments" ? ACCEPTED : []),
  );
  api.post.mockReset().mockImplementation(() => Promise.resolve({}));
});

describe("submitting to the partner", () => {
  it("counts the bundle from the task row and never loads the captures", async () => {
    show(task(7));
    await screen.findByText("1 accepted");
    expect(screen.getByText("7")).toBeTruthy();
    await waitFor(() => expect(submitBtn().disabled).toBe(false));
    expect(api.get.mock.calls.some(([p]) => p.includes("/assets"))).toBe(false);

    fireEvent.click(submitBtn());
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/tasks/t1/submit", { note: null }));
  });

  it("will not submit when nothing is bundled, and says so", async () => {
    show(task(0));
    await screen.findByText("1 accepted");
    expect(screen.getByText("Nothing to submit")).toBeTruthy();
    expect(submitBtn().disabled).toBe(true);
  });
});
