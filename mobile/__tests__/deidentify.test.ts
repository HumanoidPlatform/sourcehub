// Cleaning a capture before it queues (qa_pipeline/privacy/deidentify.ts), with
// the native module replaced by a fake: what is covered, and that anything
// going wrong refuses the capture rather than letting it through.

import type { PrivacyTerms } from "@/api/types";
import { UncleanedCapture, insertCapture } from "@/db/outbox";
import {
  asked,
  DeidentifyFailed,
  deidentifyClip,
  deidentifyPhoto,
  needsDeidentification,
  privacyPhoneFinding,
} from "@/qa_pipeline/privacy/deidentify";

// jest.mock is hoisted above the imports, so these replace the real modules

const mockNative: { current: Record<string, jest.Mock | number> | null } = { current: null };
jest.mock("../modules/deidentify", () => ({
  get Deidentify() {
    return mockNative.current;
  },
}));

jest.mock("../src/db/index", () => ({
  getDb: () => {
    throw new Error("no database in this test");
  },
}));

const terms = (deidentification: PrivacyTerms["deidentification"]): PrivacyTerms => ({
  people_in_frame: null,
  minors_policy: null,
  deidentification,
  lawful_basis: null,
  regulations: [],
  biometric_processing: false,
});

const face = { x: 100, y: 100, w: 100, h: 100 };
const plateLine = { text: "KA 01 AB 1234", box: { x: 600, y: 700, w: 200, h: 50 }, block: 0 };
const otherLine = { text: "Fresh milk", box: { x: 10, y: 10, w: 100, h: 20 }, block: 1 };

function fake(over: Record<string, jest.Mock> = {}) {
  const listeners: ((e: { job: string; done: number; total: number }) => void)[] = [];
  const mod = {
    version: 1,
    analyzeImage: jest.fn().mockResolvedValue({ width: 1000, height: 1000, faces: [face], lines: [plateLine, otherLine] }),
    redactImage: jest.fn().mockResolvedValue({ uri: "file:///out.jpg", width: 1000, height: 1000, bytes: 1234 }),
    analyzeVideo: jest.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      durationMs: 3000,
      hdr: false,
      samples: [
        { tMs: 0, faces: [face], lines: [] },
        { tMs: 1000, faces: [face, { x: 900, y: 500, w: 80, h: 80 }], lines: [plateLine] },
      ],
    }),
    redactVideo: jest.fn().mockResolvedValue({ uri: "file:///out.mp4", width: 1920, height: 1080, bytes: 999, durationMs: 3000 }),
    remuxVideo: jest.fn().mockResolvedValue({ uri: "file:///out.mp4", width: 1920, height: 1080, bytes: 999, durationMs: 3000 }),
    addListener: jest.fn((_name: string, fn: (e: { job: string; done: number; total: number }) => void) => {
      listeners.push(fn);
      return { remove: jest.fn() };
    }),
    ...over,
  };
  mockNative.current = mod;
  return { mod, listeners };
}

beforeEach(() => {
  mockNative.current = null;
});

describe("what the client asked to be removed", () => {
  it("reads the three terms", () => {
    expect(asked(terms(["blur_faces", "strip_gps"]))).toEqual({ faces: true, plates: false, gps: true });
    expect(needsDeidentification(terms([]))).toBe(false);
    expect(needsDeidentification(null)).toBe(false);
    expect(needsDeidentification(terms(["redact_plates"]))).toBe(true);
  });

  it("warns before the task on a phone that cannot do it, and only then", () => {
    expect(privacyPhoneFinding(terms(["blur_faces"]), false)?.code).toBe("deidentify_unavailable");
    expect(privacyPhoneFinding(terms(["blur_faces"]), true)).toBeNull();
    expect(privacyPhoneFinding(terms([]), false)).toBeNull();
  });
});

describe("deidentifyPhoto", () => {
  it("pixelates faces and fills plates, and says what it covered", async () => {
    const { mod } = fake();
    const r = await deidentifyPhoto("file:///in.jpg", terms(["blur_faces", "redact_plates"]), "file:///in.jpg.part");
    const regions = (mod.redactImage as jest.Mock).mock.calls[0][1];
    expect(regions.map((x: { style: string }) => x.style).sort()).toEqual(["fill", "pixelate"]);
    expect(r.summary).toEqual({ version: 1, faces: 1, plates: 1, frames: null, metadata_stripped: true });
  });

  it("covers only what was asked", async () => {
    const { mod } = fake();
    await deidentifyPhoto("file:///in.jpg", terms(["redact_plates"]), "file:///p");
    const regions = (mod.redactImage as jest.Mock).mock.calls[0][1];
    expect(regions).toHaveLength(1);
    expect(regions[0].style).toBe("fill");
  });

  it("re-encodes even with nothing to cover: that is what takes the location out", async () => {
    const { mod } = fake();
    const r = await deidentifyPhoto("file:///in.jpg", terms(["strip_gps"]), "file:///p");
    expect(mod.redactImage).toHaveBeenCalledWith("file:///in.jpg", [], "file:///p", expect.any(Number));
    expect(r.summary.metadata_stripped).toBe(true);
  });

  it("refuses on a phone without the module", async () => {
    await expect(deidentifyPhoto("file:///in.jpg", terms(["blur_faces"]), "file:///p")).rejects.toBeInstanceOf(
      DeidentifyFailed,
    );
  });

  it("refuses when the module fails, saying what to do", async () => {
    fake({ analyzeImage: jest.fn().mockRejectedValue(new Error("decode failed")) });
    await expect(deidentifyPhoto("file:///in.jpg", terms(["blur_faces"]), "file:///p")).rejects.toThrow(
      /decode failed.*Shoot it again/,
    );
  });

  it("refuses an empty result", async () => {
    fake({ redactImage: jest.fn().mockResolvedValue({ uri: "file:///p", width: 1, height: 1, bytes: 0 }) });
    await expect(deidentifyPhoto("file:///in.jpg", terms(["blur_faces"]), "file:///p")).rejects.toBeInstanceOf(
      DeidentifyFailed,
    );
  });
});

describe("deidentifyClip", () => {
  it("covers every stretch of the clip with what the looks either side saw", async () => {
    const { mod } = fake();
    const r = await deidentifyClip("file:///in.mp4", terms(["blur_faces", "redact_plates"]), "file:///p", 3, "job1");
    const spans = (mod.redactVideo as jest.Mock).mock.calls[0][1];
    expect(spans[0].fromMs).toBe(0);
    expect(spans[spans.length - 1].toMs).toBe(3000);
    expect(r.summary).toEqual({ version: 1, faces: 2, plates: 1, frames: 2, metadata_stripped: true });
  });

  it("copies a clip without its metadata where only the location must go", async () => {
    const { mod } = fake();
    await deidentifyClip("file:///in.mp4", terms(["strip_gps"]), "file:///p", 3, "job1");
    expect(mod.remuxVideo).toHaveBeenCalled();
    expect(mod.analyzeVideo).not.toHaveBeenCalled();
  });

  it("refuses an HDR clip, whose colours cannot be kept", async () => {
    fake({
      analyzeVideo: jest.fn().mockResolvedValue({ width: 1920, height: 1080, durationMs: 3000, hdr: true, samples: [] }),
    });
    await expect(deidentifyClip("file:///in.mp4", terms(["blur_faces"]), "file:///p", 3, "j")).rejects.toThrow(/HDR/);
  });

  it("refuses a clip that came out the wrong length: frames nobody covered", async () => {
    fake({
      redactVideo: jest
        .fn()
        .mockResolvedValue({ uri: "file:///p", width: 1920, height: 1080, bytes: 10, durationMs: 1000 }),
    });
    await expect(deidentifyClip("file:///in.mp4", terms(["blur_faces"]), "file:///p", 3, "j")).rejects.toThrow(
      /came out wrong/,
    );
  });

  it("refuses a clip it could not look at", async () => {
    fake({
      analyzeVideo: jest.fn().mockResolvedValue({ width: 1920, height: 1080, durationMs: 3000, hdr: false, samples: [] }),
    });
    await expect(deidentifyClip("file:///in.mp4", terms(["blur_faces"]), "file:///p", 3, "j")).rejects.toThrow(
      /could not be read/,
    );
  });

  it("reports progress for its own job only, and stops listening after", async () => {
    const { mod, listeners } = fake();
    const seen: number[] = [];
    (mod.analyzeVideo as jest.Mock).mockImplementation(async () => {
      listeners.forEach((l) => l({ job: "mine", done: 1, total: 2 }));
      listeners.forEach((l) => l({ job: "other", done: 9, total: 9 }));
      return { width: 1920, height: 1080, durationMs: 3000, hdr: false, samples: [{ tMs: 0, faces: [], lines: [] }] };
    });
    await deidentifyClip("file:///in.mp4", terms(["blur_faces"]), "file:///p", 3, "mine", (_p, done) => seen.push(done));
    expect(seen).toEqual([1]);
    const sub = (mod.addListener as jest.Mock).mock.results[0].value;
    expect(sub.remove).toHaveBeenCalled();
  });
});

describe("the outbox's last line", () => {
  it("refuses to queue an uncleaned capture on a task that asked for cleaning", async () => {
    await expect(
      insertCapture({
        id: "c1", user_id: "u1", assignment_id: "a1", local_uri: "file:///x.jpg", filename: "x.jpg",
        mime: "image/jpeg", size: 1, captured_at: "2026-10-22T00:00:00Z", lat: null, lon: null, checks: null,
        requires_deidentification: true, deidentified: null,
      }),
    ).rejects.toBeInstanceOf(UncleanedCapture);
  });
});
