import type { Assignment, AssetRow, Batch } from "../src/api/types";
import {
  boardStatus, canCapture, cannotSend, handedOver, nextAction, ownNote, remaining, requirementLabels, sections, summary,
} from "../src/batches";

const base = (over: Partial<Assignment> = {}): Assignment =>
  ({
    id: "a1",
    task_id: "t1",
    quantity: 10,
    status: "in_progress",
    instructions: null,
    due_on: null,
    worker_note: null,
    decision_note: null,
    assigned_at: "2026-10-01T00:00:00Z",
    started_at: "2026-10-01T00:00:00Z",
    submitted_at: null,
    decided_at: null,
    assets: { pending: 0, ready: 0, quarantined: 0, total: 0 },
    progress: { draft: 0, in_review: 0, accepted: 0, rework: 0 },
    task: {
      id: "t1", reference_code: "TSK-1", title: "Shelves", instructions: null,
      capture_spec: {}, target_unit: "photos", due_on: null, status: "in_progress",
    },
    ...over,
  }) as Assignment;

const asset = (id: string, over: Partial<AssetRow>): AssetRow =>
  ({
    id, assignment_id: "a1", filename: `${id}.jpg`, mime_type: "image/jpeg", size_bytes: 1, sha256: id,
    status: "ready", quarantine_reason: null, captured_at: null, uploaded_at: null, created_at: "",
    ...over,
  }) as AssetRow;

describe("sending part of an assignment", () => {
  it("can send any number, and keep capturing while a batch is in review", () => {
    const a = base({ progress: { draft: 3, in_review: 4, accepted: 0, rework: 0 } });
    expect(cannotSend(a, 0, 0)).toBeNull();
    expect(canCapture(a, 0)).toBe(true);
    expect(remaining(a, 1)).toBe(2);
  });

  it("says why sending is not possible", () => {
    expect(cannotSend(base(), 0, 0)).toBe("Capture something new to send.");
    expect(cannotSend(base(), 2, 0)).toBe("Wait for the uploads to finish.");
    expect(cannotSend(base({ progress: { draft: 1, in_review: 0, accepted: 0, rework: 0 } }), 0, 1)).toMatch(/failed/);
    expect(cannotSend(base({ revoked_at: "2026-10-02T00:00:00Z", progress: { draft: 1, in_review: 0, accepted: 0, rework: 0 } }), 0, 0)).toMatch(/someone else/);
  });

  it("stops capturing at the quantity, and a capture sent back frees its slot", () => {
    const full = base({ progress: { draft: 0, in_review: 6, accepted: 4, rework: 0 } });
    expect(canCapture(full, 0)).toBe(false);
    const sentBack = base({ progress: { draft: 0, in_review: 5, accepted: 4, rework: 1 } });
    expect(canCapture(sentBack, 0)).toBe(true);
  });

  it("a reassigned worker captures nothing", () => {
    expect(canCapture(base({ revoked_at: "2026-10-02T00:00:00Z" }), 0)).toBe(false);
  });
});

describe("the board", () => {
  it("files by what needs the worker", () => {
    expect(boardStatus(base({ progress: { draft: 0, in_review: 2, accepted: 3, rework: 1 } }))).toBe("rejected");
    expect(boardStatus(base({ progress: { draft: 0, in_review: 4, accepted: 6, rework: 0 } }))).toBe("submitted");
    expect(boardStatus(base({ progress: { draft: 0, in_review: 4, accepted: 2, rework: 0 } }))).toBe("in_progress");
    expect(boardStatus(base({ status: "assigned" }))).toBe("assigned");
    expect(boardStatus(base({ revoked_at: "x" }))).toBe("reassigned");
    expect(boardStatus(base({ revoked_at: "x", status: "accepted" }))).toBe("reassigned");
  });

  it("summarises only what is not zero", () => {
    expect(summary(base({ progress: { draft: 1, in_review: 2, accepted: 3, rework: 0 } }))).toBe(
      "3 of 10 photos accepted · 2 in review · 1 not sent",
    );
  });

  it("reads an API from before batches", () => {
    const old = base({ progress: undefined, status: "submitted", assets: { pending: 0, ready: 10, quarantined: 0, total: 10 } });
    expect(boardStatus(old)).toBe("submitted");
  });
});

describe("the captures, by where they stand", () => {
  it("separates rework, what is not sent, each batch in review and what is accepted", () => {
    const batches = [
      { id: "b1", batch_no: 1, status: "reviewed" } as Batch,
      { id: "b2", batch_no: 2, status: "in_review" } as Batch,
      { id: "b3", batch_no: 3, status: "in_review" } as Batch,
    ];
    const s = sections(
      [
        asset("x1", { stage: "accepted", batch_no: 1 }),
        asset("x2", { stage: "rework", status: "rejected", batch_no: 1 }),
        asset("x3", { stage: "replaced", status: "rejected", batch_no: 1 }),
        asset("x4", { stage: "in_review", batch_no: 2 }),
        asset("x5", { stage: "in_review", batch_no: 3 }),
        asset("x6", { stage: "draft" }),
      ],
      batches,
    );
    expect(s.rework.map((x) => x.id)).toEqual(["x2"]);
    expect(s.draft.map((x) => x.id)).toEqual(["x6"]);
    expect(s.inReview.map((g) => g.batch_no)).toEqual([3, 2]);
    expect(s.inReview[0].batch?.id).toBe("b3");
    expect(s.accepted).toHaveLength(1);
    expect(s.accepted[0].assets.map((x) => x.id)).toEqual(["x1"]);
  });
});

describe("the one thing to do next", () => {
  const p = (draft: number, in_review: number, accepted: number, rework: number) => ({ draft, in_review, accepted, rework });

  it("retake first, then send, then capture", () => {
    expect(nextAction(base({ progress: p(2, 2, 2, 1) }), 0, 0)).toMatchObject({ primary: "retake", secondary: "send" });
    expect(nextAction(base({ progress: p(2, 2, 2, 0) }), 0, 0)).toMatchObject({ primary: "send", secondary: "capture" });
    expect(nextAction(base({ progress: p(0, 2, 2, 0) }), 0, 0)).toMatchObject({ primary: "capture", secondary: null });
  });

  it("start before anything else, and nothing once reassigned or accepted", () => {
    expect(nextAction(base({ status: "assigned" }), 0, 0).primary).toBe("start");
    expect(nextAction(base({ revoked_at: "x" }), 0, 0).primary).toBeNull();
    expect(nextAction(base({ status: "accepted" }), 0, 0).primary).toBeNull();
  });

  it("everything sent and nothing back: waiting, no button", () => {
    expect(nextAction(base({ progress: p(0, 6, 4, 0) }), 0, 0)).toEqual({ primary: null, secondary: null, waiting: "Waiting for review" });
    expect(nextAction(base({ progress: p(0, 6, 4, 0) }), 0, 0).waiting).toBe("Waiting for review");
  });
});

describe("words for the worker", () => {
  it("reads the capture rules as a person would", () => {
    expect(requirementLabels({ media: ["photo"], require_gps: true, min_megapixels: 12 })).toEqual([
      "Photos only", "Location on", "12 MP minimum",
    ]);
    expect(requirementLabels({ media: ["video"], min_duration_s: 10, max_duration_s: 50, max_tilt_deg: 10 })).toEqual([
      "Videos only", "10–50 s per clip", "Within 10° of level",
    ]);
  });

  it("drops the note the console wrote from the marks, keeps the reviewer's own", () => {
    expect(ownNote("1 to retake: 1 something else.")).toBeNull();
    expect(ownNote("Shelf 3 is cut off on the left.")).toBe("Shelf 3 is cut off on the left.");
    expect(ownNote(null)).toBeNull();
  });

  it("tells a reassigned worker what they handed over", () => {
    const a = base({ revoked_at: "x", progress: { draft: 0, in_review: 2, accepted: 3, rework: 0 } });
    expect(handedOver(a)).toBe("Your 5 photos were handed over for review: 3 accepted, 2 in review.");
    expect(summary(a)).toBe("Handed over · 5 photos");
  });
});
