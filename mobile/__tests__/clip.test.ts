// What the phone decides about a clip from its frames, on synthetic patches.
// No native module runs here.

import { BLACK_MEAN, FRAME_EVERY_S, FROZEN_DIFF, MAX_FRAMES, MIN_FRAMES } from "@/config";
import { frameTimes, greyOf, judgeFrames, stillFindings, uncheckedFinding } from "@/validation/clip";

/** a 16×16 patch of one grey, with an optional per-pixel wobble */
function patch(grey: number, wobble = 0): Uint8Array {
  return Uint8Array.from({ length: 256 }, (_, i) => Math.max(0, Math.min(255, grey + (i % 2 === 0 ? wobble : -wobble))));
}

describe("frameTimes", () => {
  it("looks three times at a clip too short for more", () => {
    const t = frameTimes(7);
    expect(t).toHaveLength(MIN_FRAMES);
    expect(t[0]).toBeGreaterThan(0);
    expect(t[t.length - 1]).toBeLessThan(7);
  });

  it("takes one frame per FRAME_EVERY_S, spread over the whole clip", () => {
    const t = frameTimes(60);
    expect(t).toHaveLength(60 / FRAME_EVERY_S);
    expect(t[0]).toBeCloseTo(0.25, 2);
    expect(t[t.length - 1]).toBeCloseTo(59.75, 2);
    const gaps = t.slice(1).map((x, i) => x - t[i]);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.01);
  });

  it("stops at MAX_FRAMES however long the clip", () => {
    expect(frameTimes(600)).toHaveLength(MAX_FRAMES);
    expect(frameTimes(3600)).toHaveLength(MAX_FRAMES);
  });

  it("never samples the same instant twice", () => {
    expect(frameTimes(0.3)).toHaveLength(1);
    expect(frameTimes(0)).toEqual([0]);
    const t = frameTimes(1.2);
    expect(new Set(t).size).toBe(t.length);
  });
});

describe("greyOf", () => {
  it("weights the channels the way a viewer sees them", () => {
    expect(greyOf([255, 255, 255, 255])).toEqual(Uint8Array.from([255]));
    expect(greyOf([0, 0, 0, 255])).toEqual(Uint8Array.from([0]));
    expect(greyOf([0, 255, 0, 255])[0]).toBe(150);
  });
});

describe("judgeFrames", () => {
  it("sees nothing wrong with a clip whose picture moves and is lit", () => {
    const v = judgeFrames([patch(100), patch(120), patch(90), patch(140)]);
    expect(v).toMatchObject({ frames: 4, black: 0, frozen: 0, share: { black: 0, frozen: 0 } });
  });

  it("counts dark frames and consecutive identical ones", () => {
    const v = judgeFrames([patch(BLACK_MEAN - 1), patch(BLACK_MEAN - 1), patch(120), patch(120), patch(130)]);
    expect(v.black).toBe(2);
    // patches 0→1 and 2→3 are the same picture
    expect(v.frozen).toBe(2);
    expect(v.share).toEqual({ black: 0.4, frozen: 0.5 });
  });

  it("does not call a live scene frozen over the noise it moves by", () => {
    const v = judgeFrames([patch(100, FROZEN_DIFF + 1), patch(100, -(FROZEN_DIFF + 1))]);
    expect(v.frozen).toBe(0);
  });

  it("is quiet on an empty or single frame", () => {
    expect(judgeFrames([]).share).toEqual({ black: 0, frozen: 0 });
    expect(judgeFrames([patch(100)]).share).toEqual({ black: 0, frozen: 0 });
  });
});

describe("stillFindings", () => {
  const dark = patch(0);
  const lit = (g: number) => patch(g, 5);

  it("refuses a clip that is dark for half its frames", () => {
    const f = stillFindings(judgeFrames([dark, dark, dark, lit(100), lit(120), lit(140)]));
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({
      code: "black",
      severity: "block",
      message: "The clip is dark in 3 of 6 frames — was the lens covered?",
      score: 0.5,
    });
  });

  it("warns about a clip that passed through the dark", () => {
    const f = stillFindings(judgeFrames([dark, lit(100), lit(120), lit(140), lit(90), lit(110)]));
    expect(f[0]).toMatchObject({ code: "black", severity: "warn", message: "1 of 6 frames are dark." });
  });

  it("says nothing about one dark frame in a long clip", () => {
    expect(stillFindings(judgeFrames([dark, ...Array.from({ length: 9 }, (_, i) => lit(100 + i * 7))]))).toEqual([]);
  });

  it("only ever warns about a still picture, and not on top of a black one", () => {
    const still = stillFindings(judgeFrames([patch(100), patch(100), patch(100), patch(100)]));
    expect(still).toHaveLength(1);
    expect(still[0]).toMatchObject({ code: "frozen", severity: "warn", message: "The picture stands still across 4 of 4 frames." });
    const black = stillFindings(judgeFrames([dark, dark, dark, dark]));
    expect(black.map((x) => x.code)).toEqual(["black"]);
  });
});

describe("uncheckedFinding", () => {
  it("tells the reviewer how far the phone got", () => {
    expect(uncheckedFinding(12, 40)).toMatchObject({
      code: "clip_unchecked",
      severity: "warn",
      message: "The phone checked 12 of 40 frames before running out of time.",
    });
  });
});
