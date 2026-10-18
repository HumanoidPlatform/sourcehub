// The CLIP subject check's arithmetic, from canned vectors. No model runs here.

import type { SubjectSpec } from "@/api/types";
import { CLIP_EXAMPLE_MIN_SIMILARITY, CLIP_SUBJECT_MIN_MARGIN } from "@/config";
import {
  clipExamplesFinding,
  clipExamplesUncheckedFinding,
  exampleSimilarity,
  examplesMissed,
  clipFinding,
  clipMeasured,
  clipMode,
  cropRgb,
  framesMargin,
  marginOf,
  meanUnit,
  NEGATIVES,
  negativesFor,
  subjectPhrases,
  views,
} from "@/qa_pipeline/subject/clipSubject";

const traffic: SubjectSpec = { domain: "road traffic", must_show: ["vehicles", "road"], must_not_show: [] };
const unit = (...xs: number[]) => meanUnit([Float32Array.from(xs)]);

describe("the phrases", () => {
  it("are the task's labels when it has them, else its domain and must_show", () => {
    expect(subjectPhrases(traffic)).toEqual(["road traffic", "vehicles", "road"]);
    expect(subjectPhrases({ ...traffic, labels: ["Car", " "] })).toEqual(["Car"]);
  });

  it("drop a negative that names part of the subject", () => {
    const kept = negativesFor(traffic);
    expect(kept).not.toContain("a road");
    expect(kept).toContain("a street");
    expect(kept).toHaveLength(NEGATIVES.length - 1);
  });

  it("match the laptop evaluation's list", () => {
    expect(NEGATIVES).toHaveLength(36);
  });
});

describe("the views", () => {
  it("are six centred squares, the whole frame first", () => {
    const v = views(448, 600);
    expect(v).toHaveLength(6);
    expect(v[0]).toEqual({ x: 0, y: 76, size: 448 });
    // quarters: x outer, y inner, as score_clip.py crops them
    expect(v[1]).toEqual({ x: 0, y: 38, size: 224 });
    expect(v[2]).toEqual({ x: 0, y: 338, size: 224 });
    expect(v[3]).toEqual({ x: 224, y: 38, size: 224 });
    for (const r of v) {
      expect(r.x + r.size).toBeLessThanOrEqual(448);
      expect(r.y + r.size).toBeLessThanOrEqual(600);
    }
  });

  it("crop RGB out of RGBA", () => {
    // 2x2 RGBA: red, green / blue, white
    const rgba = Uint8Array.from([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
    expect(Array.from(cropRgb(rgba, 2, { x: 1, y: 1, size: 1 }))).toEqual([255, 255, 255]);
    expect(Array.from(cropRgb(rgba, 2, { x: 0, y: 0, size: 2 }))).toEqual([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255]);
  });
});

describe("the margin", () => {
  const text = { subject: [unit(1, 0, 0)], negatives: [unit(0, 1, 0), unit(0, 0, 1)], negativePhrases: [] };

  it("is the subject's similarity minus the closest negative's, at the best view", () => {
    const m = marginOf([unit(0, 1, 0), unit(1, 0, 0)], text);
    expect(m.view).toBe(1);
    expect(m.margin).toBeCloseTo(1);
    expect(m.full).toBeCloseTo(-1);
  });

  it("averages the subject's phrases", () => {
    const two = { ...text, subject: [unit(1, 0, 0), unit(0, 1, 0)] };
    expect(marginOf([unit(1, 0, 0)], two).margin).toBeCloseTo(0.5 - 0);
  });

  it("of a clip is the mean of its best three frames", () => {
    expect(framesMargin([0.1, -0.5, 0.3, 0.2, -1])).toBeCloseTo(0.2);
    expect(framesMargin([0.4])).toBeCloseTo(0.4);
  });
});

describe("the findings", () => {
  it("warn under the pass mark, in ML Kit's code, and say nothing above it", () => {
    const miss = clipFinding(CLIP_SUBJECT_MIN_MARGIN - 0.01, traffic);
    expect(miss?.code).toBe("wrong_subject");
    expect(miss?.severity).toBe("warn");
    expect(miss?.message).toBe("Doesn't look like road traffic.");
    expect(clipFinding(CLIP_SUBJECT_MIN_MARGIN, traffic)).toBeNull();
  });

  it("record a pass as readily as a failure, and never as a complaint", () => {
    for (const m of [0.05, -0.05]) {
      const f = clipMeasured(m, {});
      expect(f.code).toBe("subject_clip_measured");
      expect(f.severity).toBe("info");
      expect(f.score).toBeCloseTo(m);
    }
  });
});

describe("the client's examples", () => {
  const shelf = { attachmentId: "a1", filename: "shelf.jpg", vec: unit(1, 0, 0) };
  const aisle = { attachmentId: "a2", filename: "aisle.jpg", vec: unit(0, 1, 0) };

  it("score the best match between any view and any example", () => {
    const s = exampleSimilarity([unit(0, 0, 1), unit(1, 1, 0)], [shelf, aisle]);
    expect(s.score).toBeCloseTo(Math.SQRT1_2);
    expect(s.best).toBe("shelf.jpg");
  });

  it("miss under the pass mark and match at it", () => {
    expect(examplesMissed(CLIP_EXAMPLE_MIN_SIMILARITY - 0.01)).toBe(true);
    expect(examplesMissed(CLIP_EXAMPLE_MIN_SIMILARITY)).toBe(false);
  });

  it("are recorded as information, never as a complaint", () => {
    const f = clipExamplesFinding(0.5, 3, { best: "shelf.jpg" });
    expect(f.code).toBe("subject_clip_examples");
    expect(f.severity).toBe("info");
    expect(f.detail).toMatchObject({ examples: 3, best: "shelf.jpg" });
    expect(clipExamplesUncheckedFinding(2).severity).toBe("info");
  });
});

describe("the trial switch", () => {
  const before = process.env.EXPO_PUBLIC_SUBJECT_CLIP;
  afterEach(() => {
    process.env.EXPO_PUBLIC_SUBJECT_CLIP = before;
  });

  it("is off unless set to shadow or decide", () => {
    process.env.EXPO_PUBLIC_SUBJECT_CLIP = "";
    expect(clipMode()).toBe("off");
    process.env.EXPO_PUBLIC_SUBJECT_CLIP = "yes";
    expect(clipMode()).toBe("off");
    process.env.EXPO_PUBLIC_SUBJECT_CLIP = "decide";
    expect(clipMode()).toBe("decide");
  });
});
