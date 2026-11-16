// Gate 2 at scale (db/530). The partner's review used to load every capture of
// the task and keep the ones of this attempt; now it pages the submission's
// own rows, counts from the queue row it opened with, and a verdict refreshes
// the queries it changes by name rather than everything in the cache.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QaQueueRow } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  patch: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
  del: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  // the dialog's evidence field reaches the upload helpers at import time
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

import { ToastProvider } from "@ds/primitives";
import { QaQueuePage } from "./pages";

const ROW: QaQueueRow = {
  submission_id: "s1", attempt_no: 1, asset_count: 12, supplier_note: "Aisles 1 to 4.",
  submitted_at: "2026-10-10T09:00:00Z", task_id: "t1", task_ref: "TSK-14", task_title: "Aisle clips",
  target: null, contract_id: "c1", contract_ref: "CTR-01", supplier_name: "Bengaluru Crowd Collective",
};

const EMPTY_PAGE = { items: [], has_more: false, next_cursor: null, expires_in: 900, total: 0 };

function show(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <QaQueuePage />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return client;
}

async function openReview() {
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  return screen.findByRole("dialog");
}

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/qa/queue") return Promise.resolve([ROW]);
    if (path.startsWith("/submissions/s1/assets?")) return Promise.resolve(EMPTY_PAGE);
    return Promise.resolve([]);
  });
  api.post.mockReset().mockImplementation(() => Promise.resolve({}));
});

describe("the gate-2 review", () => {
  it("pages the submission's own captures and counts from the queue row", async () => {
    show();
    const dlg = await openReview();
    expect(within(dlg).getByText(/12 assets/)).toBeTruthy();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/submissions/s1/assets?limit=60"));
    // never the task's whole array, bare or paged
    expect(api.get.mock.calls.some(([p]) => p.startsWith("/tasks/t1/assets"))).toBe(false);
  });

  it("shows what was asked and what will be accepted, above the captures", async () => {
    // review_queue always sent the brief; the dialog never showed it, so a
    // partner judged a bundle without the conditions or the client's criteria
    api.get.mockImplementation((path: string) => {
      if (path === "/qa/queue") {
        return Promise.resolve([{
          ...ROW, capture_spec: { media: ["video"], orientation: "landscape" },
          task_instructions: "Walk each aisle end to end.",
          task_acceptance: "Every aisle filmed end to end, labels readable.",
        }]);
      }
      return Promise.resolve(path.startsWith("/submissions/s1/assets?") ? EMPTY_PAGE : []);
    });
    show();
    const brief = within(await openReview()).getByTestId("review-brief");
    expect(within(brief).getByText("Walk each aisle end to end.")).toBeTruthy();
    expect(within(brief).getByText("Acceptance criteria")).toBeTruthy();
    expect(within(brief).getByText("Every aisle filmed end to end, labels readable.")).toBeTruthy();
  });

  it("shows the client's privacy terms the captures are judged by", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/qa/queue"
        ? [{
            ...ROW,
            capture_spec: {
              media: ["photo"],
              privacy: {
                people_in_frame: "none", minors_policy: "prohibited",
                deidentification: ["blur_faces", "strip_gps"], lawful_basis: "consent",
                regulations: ["DPDP"], biometric_processing: false,
              },
            },
          }]
        : path.startsWith("/submissions/s1/assets?") ? EMPTY_PAGE : []),
    );
    show();
    const brief = within(await openReview()).getByTestId("review-brief");
    expect(within(brief).getByText("People in frame")).toBeTruthy();
    expect(within(brief).getByText(/^Nobody: Capture must not include people at all/)).toBeTruthy();
    expect(within(brief).getByText("Not permitted")).toBeTruthy();
    expect(within(brief).getByText("Blur faces, Strip GPS from files")).toBeTruthy();
    // the legal terms bind the supplier; a reviewer does not judge a frame by them
    expect(within(brief).queryByText("Lawful basis")).toBeNull();
  });

  it("shows no brief for a task whose spec holds only empty privacy terms", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/qa/queue"
        ? [{
            ...ROW,
            capture_spec: {
              privacy: {
                people_in_frame: null, minors_policy: null, deidentification: [], lawful_basis: null,
                regulations: [], biometric_processing: false,
              },
            },
          }]
        : path.startsWith("/submissions/s1/assets?") ? EMPTY_PAGE : []),
    );
    show();
    expect(within(await openReview()).queryByTestId("review-brief")).toBeNull();
  });

  it("shows no brief for a row that carries none", async () => {
    show();
    expect(within(await openReview()).queryByTestId("review-brief")).toBeNull();
  });

  it("shows the criteria even on a task that stated no capture conditions", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/qa/queue"
        ? [{ ...ROW, capture_spec: {}, task_instructions: null, task_acceptance: "Labels readable." }]
        : path.startsWith("/submissions/s1/assets?") ? EMPTY_PAGE : []),
    );
    show();
    const brief = within(await openReview()).getByTestId("review-brief");
    expect(within(brief).getByText("Labels readable.")).toBeTruthy();
    expect(within(brief).queryByText("Capture requirements")).toBeNull();
  });

  it("shows no gallery for a count-only submission", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(path === "/qa/queue" ? [{ ...ROW, asset_count: 0 }] : []),
    );
    show();
    await openReview();
    expect(screen.queryByText("Captures in this submission")).toBeNull();
    expect(api.get.mock.calls.some(([p]) => p.includes("/assets"))).toBe(false);
  });

  it("refreshes the named queries after a verdict, never everything", async () => {
    const qc = show();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const dlg = await openReview();
    fireEvent.click(within(dlg).getByRole("button", { name: "Pass" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/qa/submissions/s1/decide", expect.objectContaining({ outcome: "pass" })),
    );
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ["activity"] }));

    const keys = spy.mock.calls.map(([f]) => f?.queryKey);
    expect(keys).toEqual(expect.arrayContaining([
      ["qa-queue"], ["tasks"], ["contracts"], ["contract"], ["reviews", "t1"],
      ["gallery", "submission", "s1"], ["gallery", "task", "t1"], ["invoices"], ["activity"], ["overview"],
    ]));
    // a bare call would refetch every loaded page and re-sign every link in view
    expect(spy.mock.calls.every(([f]) => Array.isArray(f?.queryKey))).toBe(true);
  });
});
