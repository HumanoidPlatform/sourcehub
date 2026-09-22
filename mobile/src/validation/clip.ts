// What the phone can decide about a clip from a handful of its frames. Pure
// and unit-tested, like rules.ts: capture/frames.ts pulls the frames out of the
// file and shrinks each to a 16×16 grey patch; this says what the patches mean.
//
// Two things a clip gets wrong that a photo cannot:
//
//   BLACK   the lens was covered, the phone was in a pocket, the recording
//           started before the camera did. A patch whose mean grey is under
//           BLACK_MEAN shows nothing.
//   FROZEN  the encoder stalled or the "clip" is one still picture. Two
//           consecutive patches whose mean absolute difference is under
//           FROZEN_DIFF are the same picture; a hand-held phone moves a live
//           scene more than that between any two samples.
//
// Black over STILL_BLOCK_SHARE of the sampled frames refuses the clip the way
// rules.ts refuses a wrong-orientation photo: deleted, never queued, counted
// on the phone. Over STILL_WARN_SHARE it is kept and the reviewer is told.
// Under that it is an ordinary clip that panned past a dark corner.
//
// Frozen only ever WARNS. A phone on a tripod filming a still shelf produces
// exactly the same patches as a stalled encoder, and refusing that clip would
// throw away work a client may have asked for. The reviewer sees the share
// and the clip; the phone does not decide.

import { BLACK_MEAN, FRAME_EVERY_S, FROZEN_DIFF, MAX_FRAMES, MIN_FRAMES, STILL_BLOCK_SHARE, STILL_WARN_SHARE } from "@/config";
import type { Finding } from "./rules";

/** Where to sample: one frame every FRAME_EVERY_S, spread evenly so the last
 *  one lands near the end rather than at a round number; never fewer than
 *  MIN_FRAMES (a 4-second clip is still three looks) nor more than MAX_FRAMES
 *  (a 10-minute clip is not 120 native calls). Seconds, from the start. */
export function frameTimes(durationS: number): number[] {
  const d = Math.max(0, durationS);
  const n = Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, Math.floor(d / FRAME_EVERY_S)));
  // A hair in from either end: time 0 is often the black frame before the
  // sensor settles, and the very last timestamp can fall past the final
  // keyframe and come back empty.
  const first = Math.min(0.25, d / 2);
  const last = Math.max(first, d - 0.25);
  const times = Array.from({ length: n }, (_, i) => Number((first + ((last - first) * i) / (n - 1)).toFixed(3)));
  // A clip shorter than a second would sample the same instant twice, and
  // two looks at one instant would read as a frozen picture.
  return times.filter((t, i) => i === 0 || t - times[i - 1] >= 0.5);
}

/** Mean grey of an RGBA patch, 0..255. Rec. 601 weights; the exactness
 *  does not matter at 16×16, the stability across frames does. */
export function greyOf(rgba: ArrayLike<number>): Uint8Array {
  const n = Math.floor(rgba.length / 4);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.round(0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]);
  }
  return out;
}

function mean(xs: ArrayLike<number>): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i];
  return s / xs.length;
}

function meanDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 255;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
  return s / n;
}

export interface ClipVerdict {
  frames: number;
  black: number;
  /** frames that are the same picture as the one before; the first frame
   *  can never be one, so a two-frame clip has at most one */
  frozen: number;
  share: { black: number; frozen: number };
}

/** One grey patch per sampled frame, in time order. */
export function judgeFrames(greys: ArrayLike<number>[]): ClipVerdict {
  let black = 0;
  let frozen = 0;
  for (let i = 0; i < greys.length; i++) {
    if (mean(greys[i]) < BLACK_MEAN) black++;
    if (i > 0 && meanDiff(greys[i - 1], greys[i]) < FROZEN_DIFF) frozen++;
  }
  const n = greys.length;
  return {
    frames: n,
    black,
    frozen,
    share: { black: n > 0 ? black / n : 0, frozen: n > 1 ? frozen / (n - 1) : 0 },
  };
}

function severityFor(share: number): "block" | "warn" | null {
  if (share >= STILL_BLOCK_SHARE) return "block";
  if (share >= STILL_WARN_SHARE) return "warn";
  return null;
}

/** The findings a verdict becomes. A clip that is mostly black is reported as
 *  black, not also as frozen (black frames are identical to each other). */
export function stillFindings(v: ClipVerdict): Finding[] {
  const out: Finding[] = [];
  const black = severityFor(v.share.black);
  if (black) {
    out.push({
      code: "black",
      severity: black,
      message:
        black === "block"
          ? `The clip is dark in ${v.black} of ${v.frames} frames — was the lens covered?`
          : `${v.black} of ${v.frames} frames are dark.`,
      score: Number((1 - v.share.black).toFixed(3)),
      detail: { frames: v.frames, black: v.black, share: Number(v.share.black.toFixed(3)) },
    });
  }
  if (v.share.frozen >= STILL_WARN_SHARE && black !== "block") {
    out.push({
      code: "frozen",
      severity: "warn",
      message: `The picture stands still across ${v.frozen + 1} of ${v.frames} frames.`,
      score: Number((1 - v.share.frozen).toFixed(3)),
      detail: { frames: v.frames, frozen: v.frozen, share: Number(v.share.frozen.toFixed(3)) },
    });
  }
  return out;
}

/** The warning a sampling that ran out of time becomes: the clip is kept, the
 *  reviewer knows the phone only half looked. */
export function uncheckedFinding(done: number, wanted: number): Finding {
  return {
    code: "clip_unchecked",
    severity: "warn",
    message: `The phone checked ${done} of ${wanted} frames before running out of time.`,
    detail: { frames: done, wanted },
  };
}
