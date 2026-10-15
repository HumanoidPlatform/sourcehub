// Focus and exposure, on synthetic grey images. No native module runs here.

import { BLUR_BLOCK, BLUR_MIN_CONTRAST, BLUR_WARN, DARK_MEAN } from "@/config";
import { blurFinding, framesBlurFinding, measureSharpness, type Sharpness } from "@/qa_pipeline/blur/blur";
import {
  exposureFinding,
  framesExposureFinding,
  framesQualityMeasured,
  lighting,
  measureExposure,
  qualityMeasured,
  qualityUncheckedFinding,
} from "@/qa_pipeline/exposure/exposure";
import { type GreyImage, patchOf } from "@/qa_pipeline/grey";

const W = 320;
const H = 240;

function image(f: (x: number, y: number) => number): GreyImage {
  const data = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data[y * W + x] = Math.max(0, Math.min(255, Math.round(f(x, y))));
  return { width: W, height: H, data };
}

/** black and white squares, `size` pixels a side: hard edges everywhere */
const squares = (size: number) => image((x, y) => ((Math.floor(x / size) + Math.floor(y / size)) % 2 ? 230 : 25));

/** a box blur of radius r, run three times — close to a Gaussian, i.e. defocus */
function defocus(img: GreyImage, r: number): GreyImage {
  let src = Float64Array.from(img.data);
  for (let pass = 0; pass < 3; pass++) {
    const tmp = new Float64Array(src.length);
    const out = new Float64Array(src.length);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0;
        let n = 0;
        for (let k = -r; k <= r; k++) {
          const xx = x + k;
          if (xx >= 0 && xx < W) { s += src[y * W + xx]; n++; }
        }
        tmp[y * W + x] = s / n;
      }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0;
        let n = 0;
        for (let k = -r; k <= r; k++) {
          const yy = y + k;
          if (yy >= 0 && yy < H) { s += tmp[yy * W + x]; n++; }
        }
        out[y * W + x] = s / n;
      }
    src = out;
  }
  return { width: W, height: H, data: Uint8Array.from(src, (v) => Math.round(v)) };
}

describe("measureSharpness", () => {
  it("reads hard edges as sharp and the same scene defocused as soft", () => {
    const sharp = measureSharpness(squares(20));
    const soft = measureSharpness(defocus(squares(20), 6));
    expect(sharp.sharpness).toBeGreaterThan(BLUR_WARN * 10);
    expect(soft.sharpness).toBeLessThan(BLUR_BLOCK);
    // defocus smears the edges, it does not take the scene away
    expect(soft.contrast).toBeGreaterThan(BLUR_MIN_CONTRAST);
  });

  it("judges by the sharp part of the picture, not the plain wall beside it", () => {
    // a third of the frame has the detail, the rest is one grey
    const shelfBesideWall = image((x, y) => (x < W / 3 ? ((Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? 230 : 25) : 128));
    expect(measureSharpness(shelfBesideWall).sharpness).toBeGreaterThan(BLUR_WARN);
  });

  it("finds no contrast and no sharpness in one flat grey", () => {
    expect(measureSharpness(image(() => 128))).toEqual({ sharpness: 0, contrast: 0 });
  });
});

describe("blurFinding", () => {
  it("is silent on a photo in focus", () => {
    expect(blurFinding(measureSharpness(squares(20)))).toBeNull();
  });

  it("refuses a photo of a real scene that is clearly out of focus", () => {
    const f = blurFinding(measureSharpness(defocus(squares(20), 6)));
    expect(f).toMatchObject({ code: "blur", severity: "block" });
    expect(f?.message).toContain("out of focus");
  });

  it("only warns when there is too little contrast to be sure", () => {
    const s: Sharpness = { sharpness: BLUR_BLOCK - 1, contrast: BLUR_MIN_CONTRAST - 1 };
    expect(blurFinding(s)).toMatchObject({ code: "blur", severity: "warn" });
  });

  it("only warns between the two lines", () => {
    const s: Sharpness = { sharpness: (BLUR_BLOCK + BLUR_WARN) / 2, contrast: 60 };
    expect(blurFinding(s)?.severity).toBe("warn");
  });

  it("says nothing about a featureless frame — a plain wall is smooth because it is", () => {
    expect(blurFinding(measureSharpness(image(() => 128)))).toBeNull();
  });
});

describe("framesBlurFinding: a clip is never refused for blur", () => {
  const sharp: Sharpness = { sharpness: 900, contrast: 60 };
  const soft: Sharpness = { sharpness: 5, contrast: 60 };
  const black: Sharpness = { sharpness: 0, contrast: 1 };

  it("lets a pan blur a few frames", () => {
    expect(framesBlurFinding([sharp, soft, sharp, sharp])).toBeNull();
  });

  it("warns when most frames are soft — and never blocks", () => {
    const f = framesBlurFinding([soft, soft, sharp, soft]);
    expect(f).toMatchObject({ code: "blur", severity: "warn", detail: { frames: 4, soft: 3 } });
  });

  it("leaves black frames to the black check", () => {
    expect(framesBlurFinding([black, black, black, sharp])).toBeNull();
  });
});

describe("exposure", () => {
  it("passes an ordinary picture", () => {
    expect(exposureFinding(measureExposure(squares(20)))).toBeNull();
  });

  it("warns on a dark one, and on one crushed to black", () => {
    expect(lighting(measureExposure(image(() => DARK_MEAN - 10)))).toBe("dark");
    const night = image((x) => (x < W * 0.6 ? 2 : 160)); // most of it pure black
    expect(exposureFinding(measureExposure(night))).toMatchObject({ code: "exposure", severity: "warn" });
  });

  it("warns on a washed-out one", () => {
    const blown = image((x) => (x < W * 0.4 ? 255 : 120));
    const f = exposureFinding(measureExposure(blown));
    expect(f).toMatchObject({ code: "exposure", severity: "warn", detail: { lighting: "bright" } });
  });

  it("measures mean, crushed and clipped shares", () => {
    expect(measureExposure(image((x) => (x < W / 2 ? 0 : 255)))).toEqual({ mean: 127.5, crushed: 0.5, clipped: 0.5 });
  });

  it("judges a clip by most of its frames, leaving black ones to the black check", () => {
    const ok = { mean: 120, crushed: 0, clipped: 0 };
    const dim = { mean: 30, crushed: 0.1, clipped: 0 };
    const black = { mean: 3, crushed: 0.99, clipped: 0 };
    expect(framesExposureFinding([ok, dim, ok, ok])).toBeNull();
    expect(framesExposureFinding([dim, dim, ok, black, black])).toMatchObject({
      code: "exposure",
      severity: "warn",
      detail: { lighting: "dark", frames: 3, dark: 2 },
    });
    expect(framesExposureFinding([black, black])).toBeNull();
  });
});

describe("the measurements are recorded either way", () => {
  it("files one info finding for a photo", () => {
    const f = qualityMeasured({ sharpness: 400, contrast: 50 }, { mean: 120, crushed: 0, clipped: 0 });
    expect(f).toMatchObject({ code: "quality_measured", severity: "info", detail: { sharpness: 400, mean: 120 } });
  });

  it("and the medians for a clip", () => {
    const f = framesQualityMeasured(
      [{ sharpness: 10, contrast: 40 }, { sharpness: 300, contrast: 50 }, { sharpness: 500, contrast: 60 }],
      [{ mean: 100, crushed: 0, clipped: 0 }, { mean: 110, crushed: 0, clipped: 0 }, { mean: 90, crushed: 0, clipped: 0 }],
    );
    expect(f?.detail).toEqual({ frames: 3, sharpness: 300, contrast: 50, mean: 100 });
    expect(framesQualityMeasured([], [])).toBeNull();
  });

  it("says so when the pixels could not be read", () => {
    expect(qualityUncheckedFinding("bad jpeg")).toMatchObject({ code: "quality_unchecked", severity: "info" });
  });
});

describe("patchOf", () => {
  it("averages the image down to the 16×16 patch the clip checks compare", () => {
    const p = patchOf(image((x) => (x < W / 2 ? 0 : 200)), 16);
    expect(p).toHaveLength(256);
    expect(p[0]).toBe(0);
    expect(p[15]).toBe(200);
    expect(p[7]).toBe(0);
    expect(p[8]).toBe(200);
  });
});
