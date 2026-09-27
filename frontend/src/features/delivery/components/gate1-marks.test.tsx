// Gate 1 can name the capture, not just the batch.
//
// The aggregator's only move used to be Accept or Send back for the whole of a
// worker's batch: nine good frames and one bad one meant sending back all ten
// and the worker re-shooting the lot. A mark says "this frame again", and its
// effect on the server is asset.status = 'rejected' — the value that makes the
// capture stop counting toward the quantity owed and never reach the partner.
//
// Drives the real dialog with the real gallery, because what is being tested is
// which control appears on which capture and what the two halves of the verdict
// post together.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssetRow } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
}));
vi.mock("@api/client", () => api);

import { ToastProvider } from "@ds/primitives";
import { DecideAssignmentDialog } from "./assignments";

const TARGET = {
  id: "a1", quantity: 3, worker_name: "Sana Kulkarni", worker_note: null,
  task_ref: "TSK-14", task_title: "Aisle clips, Bengaluru",
};

function asset(over: Partial<AssetRow>): AssetRow {
  return {
    id: "as1", task_id: "t1", assignment_id: "a1", submission_id: null,
    captured_by_user_id: "u1", captured_by_name: "Sana Kulkarni",
    filename: "shelf-1.jpg", mime_type: "image/jpeg", size_bytes: 2_400_000,
    sha256: "a".repeat(64), etag: null, status: "ready", quarantine_reason: null,
    captured_at: "2026-09-24T09:00:00Z", captured_lat: null, captured_lon: null,
    uploaded_at: "2026-09-24T09:01:00Z", created_at: "2026-09-24T09:01:00Z",
    ...over,
  } as AssetRow;
}

const ASSETS = [
  asset({ id: "as1", filename: "shelf-1.jpg" }),
  asset({ id: "as2", filename: "shelf-2.jpg" }),
  asset({ id: "as3", filename: "shelf-3.jpg" }),
];

function show(done: (o: "accept" | "reject") => void = () => {}) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <DecideAssignmentDialog target={TARGET} onClose={() => {}} onDone={done} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

/** Open a capture's preview: the verdict is taken beside the picture. */
async function open(filename: string) {
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(`^${filename}`) }));
}

/** The reason picker on the open preview. Choosing a reason IS choosing retake. */
const retake = () =>
  screen.getByLabelText("Send this capture back to be shot again") as HTMLSelectElement;

const acceptBtn = () => screen.getByRole("button", { name: "Accept" }) as HTMLButtonElement;

beforeEach(() => {
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/assignments/a1/assets") return Promise.resolve(ASSETS);
    if (path.startsWith("/assets/")) {
      return Promise.resolve({ url: "blob:x", filename: "x", mime_type: "image/jpeg", expires_in: 900 });
    }
    return Promise.resolve([]);
  });
  api.post.mockReset().mockImplementation(() => Promise.resolve({}));
});

describe("marking captures at gate 1", () => {
  it("posts the marks with the verdict, so the two cannot disagree", async () => {
    show();
    await open("shelf-1.jpg");
    fireEvent.change(retake(), { target: { value: "blur" } });
    fireEvent.change(screen.getByLabelText("What to change about this capture"), {
      target: { value: "the whole shelf is soft" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send back" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/assignments/a1/decide", expect.objectContaining({
        outcome: "reject",
        marks: [{ asset_id: "as1", outcome: "retake", reason: "blur", note: "the whole shelf is soft" }],
      })),
    );
  });

  it("will not accept a batch with a capture marked to be shot again", async () => {
    show();
    expect(acceptBtn().disabled).toBe(false);
    await open("shelf-2.jpg");
    fireEvent.change(retake(), { target: { value: "wrong_subject" } });

    expect(acceptBtn().disabled).toBe(true);
    expect(acceptBtn().title).toMatch(/send the batch back, or keep them/);
  });

  it("keeps a capture without blocking the batch, and counts what is marked", async () => {
    show();
    await open("shelf-1.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(acceptBtn().disabled).toBe(false);
    expect(screen.getByTestId("mark-tally").textContent).toBe("0 to retake · 1 keep · 2 unmarked");
  });

  it("writes the note out of the marks, and lets the reviewer take it over", async () => {
    show();
    const note = () => screen.getByLabelText(/Verdict note/) as HTMLTextAreaElement;
    expect(note().value).toBe("");

    await open("shelf-1.jpg");
    fireEvent.change(retake(), { target: { value: "blur" } });
    await open("shelf-2.jpg");
    fireEvent.change(retake(), { target: { value: "blur" } });
    await open("shelf-3.jpg");
    fireEvent.change(retake(), { target: { value: "wrong_subject" } });
    expect(note().value).toBe("3 to retake: 2 blurred, 1 wrong subject or place.");

    // Once they type, it is theirs: a later mark must not overwrite their words.
    fireEvent.change(note(), { target: { value: "Shoot the whole aisle again, morning light." } });
    fireEvent.change(retake(), { target: { value: "occlusion" } });
    expect(note().value).toBe("Shoot the whole aisle again, morning light.");
  });

  it("clearing a mark takes it off the tally and frees Accept again", async () => {
    show();
    await open("shelf-1.jpg");
    fireEvent.change(retake(), { target: { value: "blur" } });
    expect(acceptBtn().disabled).toBe(true);

    fireEvent.change(retake(), { target: { value: "" } });
    expect(acceptBtn().disabled).toBe(false);
    expect(screen.getByTestId("mark-tally").textContent).toMatch(/^Open a capture/);
  });
});

describe("a capture sent back in an earlier round", () => {
  beforeEach(() => {
    api.get.mockImplementation((path: string) => {
      if (path === "/assignments/a1/assets") {
        return Promise.resolve([
          asset({ id: "as1", status: "rejected", review_reason: "blur",
                  review_label: "Blur (variance of Laplacian)", review_note: "aisle 3 is soft" }),
          asset({ id: "as2", filename: "shelf-2.jpg" }),
        ]);
      }
      if (path.startsWith("/assets/")) {
        return Promise.resolve({ url: "blob:x", filename: "x", mime_type: "image/jpeg", expires_in: 900 });
      }
      return Promise.resolve([]);
    });
  });

  it("can still be opened, and says why it went back", async () => {
    // The signed URL is allowed for the supplier's own people precisely so the
    // worker can see which frame to shoot again.
    show();
    await open("shelf-1.jpg");
    expect(screen.getByText("Blur (variance of Laplacian)")).toBeTruthy();
    expect(screen.getByText(/aisle 3 is soft/)).toBeTruthy();
    // and it says so on the tile too, where the reviewer is working
    expect(screen.getAllByText("Sent back").length).toBeGreaterThan(1);
  });
});
