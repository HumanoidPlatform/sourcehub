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
// post together. The first describes take the assignment route, where the rows
// come as one array; "the batch route" takes the paged gallery (db/530).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssetRow, GalleryRow } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
}));
vi.mock("@api/client", () => api);

import { ToastProvider } from "@ds/primitives";
import { DecideAssignmentDialog, type DecideTarget } from "./assignments";

const TARGET: DecideTarget = {
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

/** the slim row the paged route hands a tile, as the server builds it from the full one */
function galleryRow(a: AssetRow): GalleryRow {
  return {
    id: a.id, task_id: a.task_id, assignment_id: a.assignment_id, submission_id: a.submission_id,
    batch_id: "b1", batch_no: 2, status: a.status, stage: "in_review",
    filename: a.filename, mime_type: a.mime_type, duration_s: null,
    captured_at: a.captured_at, captured_by_name: a.captured_by_name, quarantine_reason: a.quarantine_reason,
    review_reason: a.review_reason ?? null, review_label: a.review_label ?? null, badge: null, thumb_url: null,
  };
}

const ASSETS = [
  asset({ id: "as1", filename: "shelf-1.jpg" }),
  asset({ id: "as2", filename: "shelf-2.jpg" }),
  asset({ id: "as3", filename: "shelf-3.jpg" }),
];

/** The API as both routes see it: the legacy array, one page of the batch,
 *  the preview's link, and the full row the paged gallery fetches for the
 *  one capture opened. */
const serve = (rows: AssetRow[]) => (path: string): Promise<unknown> => {
  if (path === "/assignments/a1/assets") return Promise.resolve(rows);
  if (path.startsWith("/batches/b1/assets?")) {
    return Promise.resolve({ items: rows.map(galleryRow), has_more: false, next_cursor: null, expires_in: 900, total: rows.length });
  }
  if (path.startsWith("/assets/") && path.endsWith("/url")) {
    return Promise.resolve({ url: "blob:x", filename: "x", mime_type: "image/jpeg", expires_in: 900 });
  }
  if (path.startsWith("/assets/")) {
    const id = path.slice("/assets/".length);
    return Promise.resolve(rows.find((a) => a.id === id) ?? asset({ id }));
  }
  return Promise.resolve([]);
};

const fresh = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function show(target: DecideTarget = TARGET, client = fresh()) {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <DecideAssignmentDialog target={target} onClose={() => {}} onDone={() => {}} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return client;
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
  api.get.mockReset().mockImplementation(serve(ASSETS));
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
        // the same body as the batch route; nothing blanket here
        all_retake: null,
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
    api.get.mockImplementation(serve([
      asset({ id: "as1", status: "rejected", review_reason: "blur",
              review_label: "Blur (variance of Laplacian)", review_note: "aisle 3 is soft" }),
      asset({ id: "as2", filename: "shelf-2.jpg" }),
    ]));
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
    show({ ...TARGET, capture_spec: {}, task_instructions: null });
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
    api.get.mockImplementation(serve([
      asset({
        id: "as1",
        device_checks: [
          { code: "wrong_subject", severity: "warn", message: "Doesn't look like retail shelf.",
            score: 0.12, detail: { veto: ["floor"], labels: ["Floor", "Hand"] } },
          { code: "tilt_measured", severity: "info", message: "Held 6° off square.",
            detail: { off: 6.3, roll: 6.3, pitch: -1.2 } },
        ],
      }),
    ]));
  });

  it("says which word vetoed it, and how square the phone was", async () => {
    show();
    await open("shelf-1.jpg");
    expect(await screen.findByText(/vetoed on floor/)).toBeTruthy();
    expect(screen.getByText(/saw Floor, Hand/)).toBeTruthy();
    expect(screen.getByText(/6.3° off square/)).toBeTruthy();
    expect(screen.getByText(/roll 6.3°, pitch -1.2°/)).toBeTruthy();
  });
});

// db/530: a batch is paged from the server and judged against its own count,
// and "all of it again" is one field the server expands rather than a mark per
// row in the browser — a batch of 201 used to be unsendable as a whole.
describe("the batch route", () => {
  const BATCH: DecideTarget = { ...TARGET, batch_id: "b1", batch_no: 2, task_id: "t1", in_batch: 3 };
  const allReason = () => screen.getByLabelText("Reason for sending the whole batch back") as HTMLSelectElement;
  const markAll = () => fireEvent.click(screen.getByRole("button", { name: "Mark all to retake" }));
  const sendBack = () => fireEvent.click(screen.getByRole("button", { name: "Send back" }));
  const note = () => screen.getByLabelText(/Verdict note/) as HTMLTextAreaElement;
  const tally = () => screen.getByTestId("mark-tally").textContent;

  it("pages the batch itself, counts from the row that opened it, and fetches the one capture opened", async () => {
    show({ ...BATCH, in_batch: 7 });
    await open("shelf-1.jpg");
    expect(api.get).toHaveBeenCalledWith("/batches/b1/assets?limit=60");
    expect(api.get).not.toHaveBeenCalledWith("/assignments/a1/assets");
    // the header reads the batch's count, not how many rows a page brought
    expect(screen.getByText(/7 in this batch/)).toBeTruthy();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/assets/as1"));
    await screen.findByTestId("preview-position");
    expect(api.get).toHaveBeenCalledWith("/assets/as1/url");
  });

  it("sends the whole batch back as one field, not a mark per row", async () => {
    show(BATCH);
    await screen.findByRole("button", { name: /^shelf-1\.jpg/ });
    fireEvent.change(allReason(), { target: { value: "blur" } });
    markAll();
    expect(screen.getByTestId("mark-tally").textContent).toBe("3 to retake · 0 keep · 0 unmarked");
    expect(acceptBtn().disabled).toBe(true);

    sendBack();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/batches/b1/decide", {
        outcome: "reject", note: "3 to retake: 3 blurred.", marks: [], all_retake: { reason: "blur", note: null },
      }),
    );
  });

  it("lets a Keep after Mark all stand, as an explicit mark beside the blanket", async () => {
    show(BATCH);
    await screen.findByRole("button", { name: /^shelf-1\.jpg/ });
    fireEvent.change(allReason(), { target: { value: "blur" } });
    markAll();
    await open("shelf-2.jpg");
    fireEvent.click(await screen.findByRole("button", { name: "Keep" }));
    expect(screen.getByTestId("mark-tally").textContent).toBe("2 to retake · 1 keep · 0 unmarked");

    sendBack();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/batches/b1/decide", expect.objectContaining({
        marks: [{ asset_id: "as2", outcome: "keep", reason: null, note: null }],
        all_retake: { reason: "blur", note: null },
      })),
    );
  });

  it("re-picking the reason after Mark all moves the blanket and the note with it", async () => {
    show(BATCH);
    await screen.findByRole("button", { name: /^shelf-1\.jpg/ });
    fireEvent.change(allReason(), { target: { value: "blur" } });
    markAll();
    expect(note().value).toBe("3 to retake: 3 blurred.");
    // The picker is the blanket's reason. Changing it must not leave the note
    // saying blurred while the server is told obscured.
    fireEvent.change(allReason(), { target: { value: "occlusion" } });
    expect(note().value).toBe("3 to retake: 3 obscured or badly framed.");

    sendBack();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/batches/b1/decide", expect.objectContaining({
        note: "3 to retake: 3 obscured or badly framed.", all_retake: { reason: "occlusion", note: null },
      })),
    );
  });

  it("picking the placeholder after Mark all lifts the blanket, not just the picker", async () => {
    show(BATCH);
    await screen.findByRole("button", { name: /^shelf-1\.jpg/ });
    fireEvent.change(allReason(), { target: { value: "blur" } });
    markAll();
    expect(tally()).toBe("3 to retake · 0 keep · 0 unmarked");

    // The picker shows nothing, so nothing may stay armed behind it.
    fireEvent.change(allReason(), { target: { value: "" } });
    expect(tally()).not.toMatch(/\d+ to retake/);
    expect(note().value).toBe("");
    expect(acceptBtn().disabled).toBe(false);
    expect(screen.queryByRole("button", { name: "Unmark all" })).toBeNull();

    // and a single mark then goes back on its own, with no blanket beside it
    await open("shelf-1.jpg");
    fireEvent.change(await screen.findByLabelText("Send this capture back to be shot again"), { target: { value: "blur" } });
    sendBack();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/batches/b1/decide", expect.objectContaining({
        marks: [{ asset_id: "as1", outcome: "retake", reason: "blur", note: null }], all_retake: null,
      })),
    );
  });

  it("sends all_retake: null with per-capture marks", async () => {
    show(BATCH);
    await open("shelf-1.jpg");
    fireEvent.change(await screen.findByLabelText("Send this capture back to be shot again"), { target: { value: "blur" } });
    sendBack();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/batches/b1/decide", {
        outcome: "reject", note: "1 to retake: 1 blurred.",
        marks: [{ asset_id: "as1", outcome: "retake", reason: "blur", note: null }],
        all_retake: null,
      }),
    );
  });

  it("refreshes the named queries after a verdict, never everything", async () => {
    const qc = show(BATCH);
    const spy = vi.spyOn(qc, "invalidateQueries");
    await screen.findByRole("button", { name: /^shelf-1\.jpg/ });
    fireEvent.change(allReason(), { target: { value: "blur" } });
    markAll();
    sendBack();
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ["activity"] }));

    const keys = spy.mock.calls.map(([f]) => f?.queryKey);
    expect(keys).toEqual(expect.arrayContaining([
      ["gallery", "batch", "b1"], ["gallery", "task", "t1"], ["assignments", "t1"], ["reviews", "t1"],
      ["assignment-assets", "a1"], ["asset"], ["gate1"], ["tasks"], ["activity"],
      // the roster's open_assignments move with the verdict, as on every other crowd change
      ["workers"],
    ]));
    // a bare call would refetch every loaded page and re-sign every link in view
    expect(spy.mock.calls.every(([f]) => Array.isArray(f?.queryKey))).toBe(true);
  });
});
