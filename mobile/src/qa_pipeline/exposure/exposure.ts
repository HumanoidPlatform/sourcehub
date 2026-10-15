// Is the picture lit well enough to use? Pure and unit-tested, like rules.ts:
// the pixels come from clip/frames.ts greyImage(), at QUALITY_WIDTH wide.
//
// Two ways a capture is badly exposed, each by its mean grey or by how much of
// it has run out of range:
//
//   DARK    mean under DARK_MEAN, or most of the frame crushed to black
//   BRIGHT  mean over BRIGHT_MEAN, or a large part blown out to white
//
// Exposure only ever WARNS. A dim warehouse or a sunlit forecourt may be
// exactly what the client asked for, and the phone cannot tell a bad shot
// from a dark subject; the reviewer can. A clip that is mostly black is
// already refused by the black check (clip/clip.ts), so black frames are left
// out of a clip's count here.

import {
  BLACK_MEAN,
  BRIGHT_MEAN,
  CLIPPED_SHARE,
  CRUSHED_SHARE,
  DARK_MEAN,
  EXPOSURE_FRAMES_WARN_SHARE,
  MIN_SUBJECT_FRAMES,
} from "@/config";
import type { Sharpness } from "@/qa_pipeline/blur/blur";
import type { GreyImage } from "@/qa_pipeline/grey";
import type { Finding } from "@/qa_pipeline/rules/rules";

export interface Exposure {
  /** mean grey, 0..255 */
  mean: number;
  /** share of pixels at 5 or below */
  crushed: number;
  /** share of pixels at 250 or above */
  clipped: number;
}

export type Lighting = "dark" | "bright" | "ok";

export function measureExposure(img: GreyImage): Exposure {
  const n = img.data.length;
  if (n === 0) return { mean: 0, crushed: 0, clipped: 0 };
  let sum = 0;
  let crushed = 0;
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    const v = img.data[i];
    sum += v;
    if (v <= 5) crushed++;
    else if (v >= 250) clipped++;
  }
  return {
    mean: Math.round((sum / n) * 10) / 10,
    crushed: Number((crushed / n).toFixed(3)),
    clipped: Number((clipped / n).toFixed(3)),
  };
}

export function lighting(e: Exposure): Lighting {
  if (e.mean < DARK_MEAN || e.crushed >= CRUSHED_SHARE) return "dark";
  if (e.mean > BRIGHT_MEAN || e.clipped >= CLIPPED_SHARE) return "bright";
  return "ok";
}

/** The warning a photo's exposure becomes; null when it is lit well enough. */
export function exposureFinding(e: Exposure): Finding | null {
  const l = lighting(e);
  if (l === "ok") return null;
  return {
    code: "exposure",
    severity: "warn",
    message:
      l === "dark"
        ? "The photo is very dark; add light or move closer to it."
        : "The photo is overexposed; parts of it are washed out to white.",
    detail: { lighting: l, ...e },
  };
}

export function framesExposureFinding(perFrame: Exposure[]): Finding | null {
  const judged = perFrame.filter((e) => e.mean >= BLACK_MEAN);
  if (judged.length === 0) return null;
  const dark = judged.filter((e) => lighting(e) === "dark").length;
  const bright = judged.filter((e) => lighting(e) === "bright").length;
  const bad = dark + bright;
  if (bad < Math.min(MIN_SUBJECT_FRAMES, judged.length) || bad / judged.length < EXPOSURE_FRAMES_WARN_SHARE) return null;
  const l: Lighting = dark >= bright ? "dark" : "bright";
  return {
    code: "exposure",
    severity: "warn",
    message:
      l === "dark"
        ? `The clip is very dark in ${dark} of ${judged.length} frames; add light.`
        : `The clip is washed out in ${bright} of ${judged.length} frames.`,
    detail: { lighting: l, frames: judged.length, dark, bright },
  };
}

/** What the phone measured, recorded whether or not it had a complaint — the
 *  numbers BLUR_WARN, DARK_MEAN and the rest will be tuned from. Info: never
 *  shown to the worker, never a verdict. One finding for both checks, to stay
 *  well inside the server's twenty per capture. */
export function qualityMeasured(s: Sharpness, e: Exposure): Finding {
  return {
    code: "quality_measured",
    severity: "info",
    message: `Sharpness ${s.sharpness}, contrast ${s.contrast}, brightness ${e.mean}.`,
    detail: { ...s, ...e },
  };
}

/** A clip's measurements: the median of each across its frames. */
export function framesQualityMeasured(sharp: Sharpness[], expo: Exposure[]): Finding | null {
  if (sharp.length === 0 || expo.length === 0) return null;
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
  };
  const sharpness = median(sharp.map((s) => s.sharpness));
  const contrast = median(sharp.map((s) => s.contrast));
  const mean = median(expo.map((e) => e.mean));
  return {
    code: "quality_measured",
    severity: "info",
    message: `Median over ${sharp.length} frames: sharpness ${sharpness}, contrast ${contrast}, brightness ${mean}.`,
    detail: { frames: sharp.length, sharpness, contrast, mean },
  };
}

/** The checks could not read the pixels (an image the decoder refused). */
export function qualityUncheckedFinding(error?: string): Finding {
  return {
    code: "quality_unchecked",
    severity: "info",
    message: "Focus and exposure not checked on the phone (the image could not be read).",
    detail: error ? { error: error.slice(0, 200) } : {},
  };
}
