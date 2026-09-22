import { describe, expect, it } from "vitest";
import type { CaptureSpec } from "@api/types";
import { toCheckPayload, webChecks } from "./checks";
import type { Derived } from "./facts";
import { blocking } from "./rules";

const MB = 1024 * 1024;

function derived(over: Partial<Derived> = {}, facts: Partial<Derived["facts"]> = {}): Derived {
  return {
    facts: { kind: "photo", size: 4 * MB, width: 4032, height: 3024, fix: null, tilt: null, duration: over.duration ?? null, ...facts },
    mime: "image/jpeg",
    captured_at: "2026-09-16T10:00:00.000Z",
    captured_from_exif: true,
    lat: null,
    lon: null,
    duration: null,
    decoded: true,
    ...over,
  };
}

const codes = (f: { code: string }[]) => f.map((x) => x.code);

describe("webChecks", () => {
  it("always marks a web upload, and nothing else on a clean file", () => {
    expect(codes(webChecks(derived(), { media: ["photo"] }))).toEqual(["web_upload"]);
  });

  it("keeps the phone's blocks exactly", () => {
    const f = webChecks(derived({}, { width: 3024, height: 4032 }), { media: ["photo"], orientation: "landscape" });
    expect(codes(blocking(f))).toEqual(["orientation"]);
  });

  // The phone refuses a shot with no fix. A browser has no fix to offer, so
  // the same condition becomes a reviewer's question rather than a refusal.
  it("turns a required-but-missing fix into a warning", () => {
    const spec: CaptureSpec = { media: ["photo"], require_gps: true };
    const f = webChecks(derived(), spec);
    expect(codes(f)).toContain("gps_unverified");
    expect(codes(f)).not.toContain("gps_missing");
    expect(blocking(f)).toEqual([]);
  });

  it("is satisfied by an EXIF position", () => {
    const spec: CaptureSpec = { media: ["photo"], require_gps: true };
    const f = webChecks(derived({ lat: 1, lon: 2 }, { fix: { accuracy: null, stale: false } }), spec);
    expect(codes(f)).not.toContain("gps_unverified");
  });

  it("names tilt as unverifiable only when the client asked for it", () => {
    expect(codes(webChecks(derived(), { media: ["photo"], max_tilt_deg: 10 }))).toContain("tilt_unverified");
    expect(codes(webChecks(derived(), { media: ["photo"] }))).not.toContain("tilt_unverified");
    expect(codes(webChecks(derived(), { media: ["photo"], max_tilt_deg: null }))).not.toContain("tilt_unverified");
  });

  it("refuses a video over the duration cap", () => {
    const d = derived({ duration: 700 }, { kind: "video", width: 1920, height: 1080 });
    const f = webChecks(d, { media: ["video"] });
    expect(codes(blocking(f))).toEqual(["duration"]);
    expect(f.find((x) => x.code === "duration")?.message).toContain("600");
  });

  it("honours the range the client stated, never a cap above the global one", () => {
    const d = derived({ duration: 45 }, { kind: "video", width: 1920, height: 1080 });
    expect(codes(blocking(webChecks(d, { media: ["video"], max_duration_s: 30 })))).toEqual(["duration"]);
    expect(codes(blocking(webChecks(d, { media: ["video"], min_duration_s: 60 })))).toEqual(["duration"]);
    expect(blocking(webChecks(d, { media: ["video"], min_duration_s: 30, max_duration_s: 120 }))).toHaveLength(0);
    expect(blocking(webChecks(derived({ duration: 900 }, { kind: "video" }), { media: ["video"], max_duration_s: 1200 }))).toHaveLength(1);
  });

  it("holds a clip's short side to the lines the client asked for", () => {
    const d = derived({ duration: 45 }, { kind: "video", width: 1280, height: 720 });
    expect(codes(blocking(webChecks(d, { media: ["video"], min_video_lines: 1080 })))).toEqual(["video_lines"]);
    expect(blocking(webChecks(derived({ duration: 45 }, { kind: "video", width: 1080, height: 1920 }), { media: ["video"], min_video_lines: 1080 }))).toHaveLength(0);
  });

  it("says when it could not look, rather than passing silently", () => {
    const f = webChecks(derived({ decoded: false }, { width: null, height: null }), { media: ["photo"], min_megapixels: 12 });
    expect(codes(f)).toContain("dimensions_unknown");
    expect(codes(blocking(f))).toEqual([]);
  });

  it("flags an inferred capture time", () => {
    expect(codes(webChecks(derived({ captured_from_exif: false }), { media: ["photo"] }))).toContain("captured_at_inferred");
  });
});

describe("toCheckPayload", () => {
  it("sends only warnings, within the server's limits", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      code: `c${i}`.padEnd(50, "x"),
      severity: "warn" as const,
      message: "m".repeat(400),
    }));
    const out = toCheckPayload([{ code: "size", severity: "block", message: "too big" }, ...many]);
    expect(out).toHaveLength(20);
    expect(out.every((c) => c.severity === "warn")).toBe(true);
    expect(out[0]!.code).toHaveLength(40);
    expect(out[0]!.message).toHaveLength(300);
  });
});
