// Where an assignment stands, read off its batches: the server keeps it
// in_progress through every round (db/340), so the console must not file a
// worker with rework waiting, or one with everything sent, as merely "in
// progress".

import { describe, expect, it } from "vitest";
import type { Assignment, Batch } from "@api/types";
import { assignmentState, openBatch } from "./assignments";

const a = (over: Partial<Assignment>): Assignment =>
  ({
    id: "a1", quantity: 10, status: "in_progress", revoked_at: null,
    progress: { draft: 0, in_review: 0, accepted: 0, rework: 0 }, batches: [],
    ...over,
  }) as Assignment;

const b = (no: number, status: Batch["status"]): Batch =>
  ({ id: `b${no}`, batch_no: no, status }) as Batch;

describe("an assignment's state, from its batches", () => {
  it("shows rework first, then everything-sent as awaiting review", () => {
    expect(assignmentState(a({ progress: { draft: 0, in_review: 2, accepted: 5, rework: 1 } }))).toBe("rejected");
    expect(assignmentState(a({ progress: { draft: 0, in_review: 4, accepted: 6, rework: 0 } }))).toBe("submitted");
    expect(assignmentState(a({ progress: { draft: 1, in_review: 4, accepted: 5, rework: 0 } }))).toBe("in_progress");
  });

  it("names a reassigned assignment reassigned, even once accepted", () => {
    expect(assignmentState(a({ revoked_at: "2026-10-06T00:00:00Z" }))).toBe("reassigned");
    expect(assignmentState(a({ revoked_at: "2026-10-06T00:00:00Z", status: "accepted" }))).toBe("reassigned");
  });

  it("reviews the oldest batch still waiting", () => {
    expect(openBatch(a({ batches: [b(3, "in_review"), b(2, "in_review"), b(1, "reviewed")] }))?.batch_no).toBe(2);
    expect(openBatch(a({ batches: [b(1, "reviewed")] }))).toBeNull();
  });
});
