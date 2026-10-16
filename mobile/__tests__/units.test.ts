// A share in hours of footage (db/510): clips add up their running time, and
// the screens read the share as time while the buttons still act on clips.

import type { Assignment } from "../src/api/types";
import {
  boardStatus, byDuration, canCapture, handedOver, hoursText, localUnits, nextAction, remaining, summary, unitsOf, unitText,
} from "../src/batches";
import { mediaKinds } from "../src/qa_pipeline/rules/rules";

const hours = (progress: Partial<NonNullable<Assignment["progress"]>> = {}, over: Partial<Assignment> = {}): Assignment =>
  ({
    id: "a1",
    task_id: "t1",
    quantity: 0.5, // 30 minutes
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
    progress: {
      draft: 0, in_review: 0, accepted: 0, rework: 0,
      draft_units: 0, in_review_units: 0, accepted_units: 0, rework_units: 0,
      measure: "duration",
      ...progress,
    },
    task: {
      id: "t1", reference_code: "TSK-1", title: "Street footage", instructions: null,
      capture_spec: {}, target_unit: "hours", due_on: null, status: "in_progress",
    },
    ...over,
  }) as Assignment;

describe("a share in hours of footage", () => {
  it("counts the clips' running time, not the clips", () => {
    // 10 clips accepted, but only 6 minutes of footage
    const a = hours({ accepted: 10, accepted_units: 0.1 });
    expect(byDuration(a)).toBe(true);
    expect(unitsOf(a).accepted).toBe(0.1);
    expect(remaining(a, 0)).toBe(0.4);
    expect(canCapture(a, 0)).toBe(true);
  });

  it("is met by the time captured, however many clips that took", () => {
    const a = hours({ in_review: 3, in_review_units: 0.2, accepted: 2, accepted_units: 0.3 });
    expect(remaining(a, 0)).toBe(0);
    expect(canCapture(a, 0)).toBe(false);
    expect(boardStatus(a)).toBe("submitted");
  });

  it("takes clips still on the phone by their length", () => {
    const a = hours({ accepted: 1, accepted_units: 0.25 });
    const onPhone = localUnits(a, [{ duration_s: 450 }, { duration_s: 450 }]); // 15 minutes
    expect(onPhone).toBeCloseTo(0.25);
    expect(remaining(a, onPhone)).toBe(0);
    expect(nextAction(a, 2, 0, onPhone).primary).toBeNull();
    // counted as two units it would have looked like hours left
    expect(nextAction(a, 2, 0).secondary).not.toBe("capture");
  });

  it("reads as time, with the parts in clips", () => {
    const a = hours({ accepted: 4, accepted_units: 0.2, in_review: 2, in_review_units: 0.05, draft: 1, draft_units: 0.01 });
    expect(summary(a)).toBe("12 min of 30 min accepted · 2 clips in review · 1 clip not sent");
    expect(handedOver(hours({ accepted: 3, accepted_units: 0.1 }, { revoked_at: "x" }))).toBe(
      "Your 3 clips (6 min) were handed over for review: 3 accepted.",
    );
  });

  it("an API from before db/510 sends no units: an hours task still reads as one", () => {
    const old = hours({}, {});
    delete old.progress!.measure;
    expect(byDuration(old)).toBe(true);
  });

  it("an hours task takes video only", () => {
    expect(mediaKinds({}, "hours")).toEqual(["video"]);
    expect(mediaKinds({ media: ["photo"] }, "hours")).toEqual(["photo"]); // the spec, when set, decides
  });
});

describe("a counted share is unchanged", () => {
  it("counts captures, and units read as words", () => {
    const a = hours({ accepted: 2, accepted_units: 2, measure: "count" }, { quantity: 5 });
    a.task.target_unit = "photos";
    expect(byDuration(a)).toBe(false);
    expect(remaining(a, 1)).toBe(2);
    expect(summary(a)).toBe("2 of 5 photos accepted");
    expect(unitText("records", 1)).toBe("1 unit");
    expect(unitText("hours")).toBe("hours of footage");
  });
});

describe("hoursText", () => {
  it("reads hours as a person would", () => {
    expect(hoursText(0.01)).toBe("36 s");
    expect(hoursText(0.2)).toBe("12 min");
    expect(hoursText(1.5)).toBe("1 h 30 min");
    expect(hoursText(2)).toBe("2 h");
  });
});
