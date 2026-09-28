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
  capture_spec: {
    media: ["photo"], orientation: "landscape", max_tilt_deg: 10, min_megapixels: 8,
    require_gps: true,
    subject: { domain: "retail shelf", must_show: ["shelf"], must_not_show: ["floor"], labels: [] },
  },
  task_instructions: "Start at the far end of aisle 3.",
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

  // The phone has measured squareness on every capture since this was written,
  // and the degrees now reach the reviewer — so the reason list has to be able
  // to name it. Before, a visibly crooked frame could only go back as "other".
  it("offers tilt as a reason, so a crooked capture need not go back as other", async () => {
    show();
    await open("shelf-1.jpg");
    const reasons = Array.from(retake().options).map((o) => o.value);
    expect(reasons).toContain("tilt");

    fireEvent.change(retake(), { target: { value: "tilt" } });
    fireEvent.click(screen.getByRole("button", { name: "Send back" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/assignments/a1/decide",
        expect.objectContaining({
          outcome: "reject",
          marks: [expect.objectContaining({ asset_id: "as1", outcome: "retake", reason: "tilt" })],
        }),
      ),
    );
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

// The reviewer used to judge frames against conditions that were nowhere on the
// screen: no subject, no orientation, no tilt tolerance, no instructions. The
// verdict is the only quality mechanism that works today, so it is taken against
// the stated brief or it is taken from memory.
describe("the brief beside the captures", () => {
  it("shows what the captures were meant to satisfy", async () => {
    show();
    const brief = await screen.findByTestId("review-brief");
    expect(brief.textContent).toContain("retail shelf");
    expect(brief.textContent).toContain("must show shelf");
    expect(brief.textContent).toContain("not floor");
    expect(brief.textContent).toContain("Squareness within 10 degrees");
    expect(brief.textContent).toContain("Orientation: landscape");
    expect(brief.textContent).toContain("Minimum 8 MP");
    expect(brief.textContent).toContain("GPS required");
    expect(brief.textContent).toContain("Start at the far end of aisle 3.");
  });

  it("renders nothing at all on a task that recorded no brief", () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ToastProvider>
          <DecideAssignmentDialog
            target={{ ...TARGET, capture_spec: {}, task_instructions: null }}
            onClose={() => {}}
            onDone={() => {}}
          />
        </ToastProvider>
      </QueryClientProvider>,
    );
    // An empty panel would promise conditions that were never set.
    expect(screen.queryByTestId("review-brief")).toBeNull();
  });
});

// Fifty captures used to mean fifty open/close cycles.
describe("walking the batch", () => {
  it("steps with the arrow keys and says where you are", async () => {
    show();
    await open("shelf-1.jpg");
    expect(screen.getByTestId("preview-position").textContent).toBe("1 of 3");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByTestId("preview-position").textContent).toBe("2 of 3");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("preview-position").textContent).toBe("1 of 3");
  });

  it("does not step past either end", async () => {
    show();
    await open("shelf-1.jpg");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("preview-position").textContent).toBe("1 of 3");
    expect((screen.getByRole("button", { name: "Previous capture" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("leaves the arrows alone while the reviewer is in a control", async () => {
    // Choosing a reason uses the arrow keys itself; stealing them there would
    // move the preview out from under the mark being made.
    show();
    await open("shelf-1.jpg");
    fireEvent.keyDown(retake(), { key: "ArrowRight" });
    expect(screen.getByTestId("preview-position").textContent).toBe("1 of 3");
  });
});

// Recorded since the checks existed, shown nowhere until now.
describe("the evidence behind a flag", () => {
  beforeEach(() => {
    api.get.mockImplementation((path: string) => {
      if (path === "/assignments/a1/assets") {
        return Promise.resolve([
          asset({
            id: "as1",
            device_checks: [
              { code: "wrong_subject", severity: "warn", message: "Doesn't look like retail shelf.",
                score: 0.12, detail: { veto: ["floor"], labels: ["Floor", "Hand"] } },
              { code: "tilt_measured", severity: "info", message: "Held 6\u00b0 off square.",
                detail: { off: 6.3, roll: 6.3, pitch: -1.2 } },
            ],
          }),
        ]);
      }
      if (path.startsWith("/assets/")) {
        return Promise.resolve({ url: "blob:x", filename: "x", mime_type: "image/jpeg", expires_in: 900 });
      }
      return Promise.resolve([]);
    });
  });

  it("says which word vetoed it, and how square the phone was", async () => {
    show();
    await open("shelf-1.jpg");
    expect(await screen.findByText(/vetoed on floor/)).toBeTruthy();
    expect(screen.getByText(/saw Floor, Hand/)).toBeTruthy();
    expect(screen.getByText(/6.3\u00b0 off square/)).toBeTruthy();
    expect(screen.getByText(/roll 6.3\u00b0, pitch -1.2\u00b0/)).toBeTruthy();
  });
});
