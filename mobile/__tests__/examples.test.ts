// Comparing a capture against the client's example photos. Canned labels only;
// nothing is downloaded and no native module runs here.

import { EXAMPLE_OFF, SUBJECT_FRAMES_MIN_SHARE } from "@/config";
import {
  exampleFramesFinding,
  type ExampleLabels,
  examplesFinding,
  examplesUncheckedFinding,
  missedExamples,
  scoreExampleFrames,
  scoreExamples,
  similarity,
} from "@/validation/examples";

const L = (...pairs: [string, number][]) => pairs.map(([text, confidence]) => ({ text, confidence }));

const shelfExample: ExampleLabels = {
  attachmentId: "a1",
  filename: "aisle-wide.jpg",
  labels: L(["Shelf", 0.92], ["Supermarket", 0.81], ["Product", 0.6]),
};

const closeUpExample: ExampleLabels = {
  attachmentId: "a2",
  filename: "tags-close.jpg",
  labels: L(["Price tag", 0.88], ["Text", 0.7], ["Shelf", 0.4]),
};

describe("similarity", () => {
  it("is 1 for the same labels", () => {
    expect(similarity(shelfExample.labels, shelfExample.labels)).toBeCloseTo(1);
  });

  it("is 0 when nothing is shared", () => {
    expect(similarity(L(["Dog", 0.9], ["Grass", 0.7]), shelfExample.labels)).toBe(0);
  });

  it("ignores case and whitespace in a label", () => {
    expect(similarity(L([" shelf ", 0.92], ["SUPERMARKET", 0.81], ["Product", 0.6]), shelfExample.labels)).toBeCloseTo(1);
  });

  it("weights by confidence, not just overlap", () => {
    const sure = similarity(L(["Shelf", 0.9]), L(["Shelf", 0.9]));
    const unsure = similarity(L(["Shelf", 0.9]), L(["Shelf", 0.2], ["Dog", 0.9]));
    expect(sure).toBeGreaterThan(unsure);
  });

  it("is 0 against an empty list rather than undefined", () => {
    expect(similarity([], shelfExample.labels)).toBe(0);
    expect(similarity(shelfExample.labels, [])).toBe(0);
  });
});

describe("scoreExamples", () => {
  it("takes the best example, not the average", () => {
    // A close-up of price tags matches the close-up example and barely the
    // wide one. Averaging would punish a client for sending both.
    const r = scoreExamples(L(["Price tag", 0.9], ["Text", 0.75]), [shelfExample, closeUpExample]);
    expect(r.best).toBe("tags-close.jpg");
    expect(r.score).toBeGreaterThan(0.8);
    expect(r.examples).toBe(2);
  });

  it("reports what the capture shared with the closest example", () => {
    const r = scoreExamples(L(["Shelf", 0.9], ["Supermarket", 0.8], ["Dog", 0.2]), [shelfExample]);
    expect(r.shared).toEqual(["shelf", "supermarket"]);
  });

  it("scores a floor shot near nothing", () => {
    const r = scoreExamples(L(["Floor", 0.95], ["Tile", 0.8]), [shelfExample, closeUpExample]);
    expect(r.score).toBe(0);
    expect(missedExamples(r)).toBe(true);
  });

  it("with no examples it never counts as a miss", () => {
    const r = scoreExamples(L(["Floor", 0.95]), []);
    expect(r.examples).toBe(0);
    expect(r.best).toBeNull();
    expect(missedExamples(r)).toBe(false);
  });

  it("a plainly matching capture is not a miss", () => {
    const r = scoreExamples(L(["Shelf", 0.9], ["Supermarket", 0.7]), [shelfExample]);
    expect(r.score).toBeGreaterThan(EXAMPLE_OFF);
    expect(missedExamples(r)).toBe(false);
  });
});

describe("examplesFinding", () => {
  it("is a measurement, recorded whether it matched or not", () => {
    const matched = examplesFinding(scoreExamples(L(["Shelf", 0.9]), [shelfExample]));
    const missed = examplesFinding(scoreExamples(L(["Floor", 0.9]), [shelfExample]));
    expect(matched.severity).toBe("info");
    expect(missed.severity).toBe("info");
    expect(matched.code).toBe("example_match");
    expect(missed.code).toBe("example_match");
  });

  it("names the example it looked most like", () => {
    const f = examplesFinding(scoreExamples(L(["Price tag", 0.9]), [shelfExample, closeUpExample]));
    expect(f.message).toContain("tags-close.jpg");
    expect(f.detail).toMatchObject({ examples: 2 });
  });
});

describe("scoreExampleFrames", () => {
  it("counts the frames that looked like an example", () => {
    const hit = scoreExamples(L(["Shelf", 0.9]), [shelfExample]);
    const miss = scoreExamples(L(["Floor", 0.9]), [shelfExample]);
    const f = scoreExampleFrames([hit, hit, miss, hit]);
    expect(f.frames).toBe(4);
    expect(f.hits).toBe(3);
    expect(f.share).toBeCloseTo(0.75);
    expect(f.best).toBeGreaterThan(EXAMPLE_OFF);
  });

  it("a clip that never matched is below the share floor", () => {
    const miss = scoreExamples(L(["Floor", 0.9]), [shelfExample]);
    const f = scoreExampleFrames([miss, miss, miss]);
    expect(f.share).toBe(0);
    expect(f.share).toBeLessThan(SUBJECT_FRAMES_MIN_SHARE);
  });

  it("no frames is not a miss by arithmetic accident", () => {
    expect(scoreExampleFrames([])).toEqual({ frames: 0, hits: 0, share: 0, best: 0 });
  });

  it("reports as info, like the photo measurement", () => {
    const hit = scoreExamples(L(["Shelf", 0.9]), [shelfExample]);
    expect(exampleFramesFinding(scoreExampleFrames([hit])).severity).toBe("info");
  });
});

describe("examplesUncheckedFinding", () => {
  it("records that the phone never compared, instead of implying a match", () => {
    const f = examplesUncheckedFinding(3);
    expect(f.code).toBe("examples_unchecked");
    expect(f.severity).toBe("info");
    expect(f.message).toContain("3 examples");
    expect(f.detail).toMatchObject({ expected: 3 });
  });
});
