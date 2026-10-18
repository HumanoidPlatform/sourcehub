import { describe, expect, it } from "vitest";
import type { Assignment } from "@api/types";
import { room } from "@features/capture/intake";
import { mediaKinds } from "@features/capture/rules";
import { amountWords, byDuration, deviceWords, unitPlural, unitsOf } from "./units";

const assignment = (progress: Assignment["progress"]): Assignment => ({ quantity: 0.5, progress }) as Assignment;

describe("a share in hours of footage (db/510)", () => {
  it("reads progress in hours, not clips", () => {
    const a = assignment({
      draft: 1, in_review: 2, accepted: 10, rework: 0,
      draft_units: 0.01, in_review_units: 0.05, accepted_units: 0.1, rework_units: 0, measure: "duration",
    });
    expect(unitsOf(a)).toEqual({ draft: 0.01, in_review: 0.05, accepted: 0.1, rework: 0 });
  });

  it("falls back to the counts for a counted share, or an older API", () => {
    expect(unitsOf(assignment({ draft: 1, in_review: 2, accepted: 3, rework: 0 })).accepted).toBe(3);
    expect(unitsOf(assignment({ draft: 1, in_review: 2, accepted: 3, rework: 0, accepted_units: 3, measure: "count" })).accepted).toBe(3);
  });

  it("names units in words", () => {
    expect(byDuration("hours")).toBe(true);
    expect(byDuration("videos")).toBe(false);
    expect(unitPlural("hours")).toBe("hours of footage");
    expect(amountWords(1.257, "hours")).toBe("1.26 hours of footage");
    expect(amountWords(1, "photos")).toBe("1 photo");
  });

  it("leaves room by running time in the browser upload too", () => {
    const rows = [{ status: "ready", duration_s: 900 }, { status: "rejected", duration_s: 900 }] as never[];
    // 30 minutes asked, 15 held: 15 left, however many clips that is
    expect(room({ quantity: 0.5, serverRows: rows, queued: [], targetUnit: "hours" })).toBe(0.25);
    expect(room({ quantity: 5, serverRows: rows, queued: [], targetUnit: "videos" })).toBe(4);
  });

  it("an hours task takes video only", () => {
    expect(mediaKinds({}, "hours")).toEqual(["video"]);
  });
});

describe("the phone a task demands", () => {
  it("reads as the brief says it, or nothing", () => {
    expect(deviceWords({ min_android_version: 12, min_ios_version: 16, min_ram_gb: 4 })).toBe("Android 12+ · iOS 16+ · 4 GB RAM or more");
    expect(deviceWords({ min_ram_gb: 4 })).toBe("4 GB RAM or more");
    // the free text is not a floor: a phone cannot check "LiDAR" about itself
    expect(deviceWords({ notes: "LiDAR-capable" })).toBeNull();
    expect(deviceWords(null)).toBeNull();
  });
});
