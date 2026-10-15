// Is the picture in focus? Pure and unit-tested, like rules.ts: the pixels
// come from clip/frames.ts greyImage(), at QUALITY_WIDTH wide.
//
// SHARPNESS is the variance of the Laplacian — how hard the brightness bends
// from one pixel to the next. Edges in focus bend sharply; the same edges out
// of focus are smeared over several pixels and barely bend at all. It is
// measured per tile, on a 4×4 grid, and the capture is as sharp as its
// second-sharpest tile: a shelf shot with a plain wall beside it is judged by
// the shelf, and one noisy tile cannot vouch for a blurred photo alone.
//
// CONTRAST (the grey standard deviation) says whether there was anything to
// focus on. A plain wall, a sheet of paper, a clear sky are smooth because the
// scene is; their low sharpness is no evidence the lens missed. So a photo is
// refused for blur only when it has the contrast of a real scene and still no
// sharp tile — clearly out of focus — and otherwise at most warned about.
//
// A clip is never refused for blur. Panning blurs frames on purpose, so only a
// clip that is soft in most of its frames is warned about.

import {
  BLUR_BLOCK,
  BLUR_FRAMES_WARN_SHARE,
  BLUR_MIN_CONTRAST,
  BLUR_WARN,
  FEATURELESS_CONTRAST,
  MIN_SUBJECT_FRAMES,
} from "@/config";
import type { GreyImage } from "@/qa_pipeline/grey";
import type { Finding } from "@/qa_pipeline/rules/rules";

export interface Sharpness {
  /** Laplacian variance of the second-sharpest tile */
  sharpness: number;
  /** grey standard deviation over the whole image */
  contrast: number;
}

const GRID = 4;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function measureSharpness(img: GreyImage): Sharpness {
  const { width: w, height: h, data } = img;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    sumSq += data[i] * data[i];
  }
  const n = data.length;
  const contrast = n > 0 ? Math.sqrt(Math.max(0, sumSq / n - (sum / n) ** 2)) : 0;
  if (w < 3 || h < 3) return { sharpness: 0, contrast };

  // One pass over the interior, each Laplacian added to its tile's running sums.
  const tSum = new Float64Array(GRID * GRID);
  const tSq = new Float64Array(GRID * GRID);
  const tN = new Uint32Array(GRID * GRID);
  for (let y = 1; y < h - 1; y++) {
    const ty = Math.min(GRID - 1, Math.floor((y * GRID) / h));
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = data[i - 1] + data[i + 1] + data[i - w] + data[i + w] - 4 * data[i];
      const t = ty * GRID + Math.min(GRID - 1, Math.floor((x * GRID) / w));
      tSum[t] += lap;
      tSq[t] += lap * lap;
      tN[t]++;
    }
  }
  const variances: number[] = [];
  for (let t = 0; t < GRID * GRID; t++) {
    if (tN[t] > 0) variances.push(tSq[t] / tN[t] - (tSum[t] / tN[t]) ** 2);
  }
  variances.sort((a, b) => b - a);
  const sharpness = variances.length > 1 ? variances[1] : (variances[0] ?? 0);
  return { sharpness: round1(Math.max(0, sharpness)), contrast: round1(contrast) };
}

/** The finding a photo's sharpness becomes; null when it is in focus, or when
 *  it is too featureless for its smoothness to say anything. */
export function blurFinding(s: Sharpness): Finding | null {
  if (s.sharpness >= BLUR_WARN || s.contrast < FEATURELESS_CONTRAST) return null;
  const refuse = s.sharpness < BLUR_BLOCK && s.contrast >= BLUR_MIN_CONTRAST;
  return {
    code: "blur",
    severity: refuse ? "block" : "warn",
    message: refuse
      ? "The photo is out of focus. Hold steady, tap the subject to focus, and take it again."
      : "The photo looks soft; check it is in focus.",
    score: Number(Math.min(1, s.sharpness / BLUR_WARN).toFixed(3)),
    detail: { sharpness: s.sharpness, contrast: s.contrast },
  };
}

/** Frames with nothing in them to judge (black, a lens cap, a blank wall) are
 *  left out: the black check speaks for the first, nobody for the rest. */
export function framesBlurFinding(perFrame: Sharpness[]): Finding | null {
  const judged = perFrame.filter((s) => s.contrast >= FEATURELESS_CONTRAST);
  const soft = judged.filter((s) => s.sharpness < BLUR_WARN).length;
  if (judged.length === 0 || soft < Math.min(MIN_SUBJECT_FRAMES, judged.length)) return null;
  const share = soft / judged.length;
  if (share < BLUR_FRAMES_WARN_SHARE) return null;
  return {
    code: "blur",
    severity: "warn",
    message: `The picture is soft in ${soft} of ${judged.length} frames; check it is in focus.`,
    score: Number((1 - share).toFixed(3)),
    detail: { frames: judged.length, soft, share: Number(share.toFixed(3)) },
  };
}
