// What is written in the frame, and whether it is big enough to read.
//
// "Price tags visible and legible" is a condition briefs ask for and the
// pipeline has never been able to check. The image labeller's vocabulary stops
// at "Shelf"; it has no idea whether the tags on that shelf carry readable
// numbers. ML Kit's text recogniser reads the frame and returns blocks, lines
// and words with their bounding boxes.
//
// IT MEASURES, IT DOES NOT JUDGE. The finding is severity "info": recorded for
// the reviewer and for calibration, never shown to the worker, never a
// refusal. There is no threshold here, deliberately. The height at which text
// stops being legible depends on what the client does with the file
// afterwards, and a number chosen today would be exactly the guess that made a
// laptop "not a laptop". The rubric sets the cut, once there are rubrics and
// once there is data to set one from.
//
// The React Native binding drops ML Kit's per-word confidence, so legibility
// is measured geometrically instead: how much text there is, and how tall the
// tallest line is as a share of the frame. That share is the useful number —
// a line under about 2% of frame height is where OCR starts failing on its own
// output, which is an anchor for whoever sets the threshold later.
//
// Photos only, for now. A clip already spends its whole budget labelling
// sampled frames, and doubling the per-frame cost inside FRAMES_BUDGET_MS
// would buy clip_unchecked rather than an answer.

import type { Finding } from "./rules";
import type { UnscoredReason } from "./subject";

/** A bounding box as ML Kit reports it, in the image's own pixels. */
export interface TextBox {
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface TextLineShape {
  text: string;
  frame?: TextBox;
}

export interface TextBlockShape {
  text: string;
  frame?: TextBox;
  lines: TextLineShape[];
}

export interface TextRead {
  text: string;
  blocks: TextBlockShape[];
}

export type TextResult = TextRead | { unscored: UnscoredReason; error?: string };

export interface TextScore {
  blocks: number;
  lines: number;
  /** characters ignoring whitespace: "how much writing is in it" */
  chars: number;
  /** the tallest line's height as a share of the frame height (0..1). Zero
   *  when no line carried a box, or when the frame height is not known — in
   *  which case the count still means something and this does not. */
  tallest: number;
}

export function scoreText(read: TextRead, frameHeight?: number | null): TextScore {
  const lines = read.blocks.flatMap((b) => b.lines);
  const heights = lines.map((l) => l.frame?.height ?? 0);
  const tallestPx = heights.length > 0 ? Math.max(...heights) : 0;
  const usable = typeof frameHeight === "number" && frameHeight > 0;
  return {
    blocks: read.blocks.length,
    lines: lines.length,
    chars: read.text.replace(/\s+/g, "").length,
    tallest: usable ? Number(Math.min(1, tallestPx / frameHeight).toFixed(4)) : 0,
  };
}

/** The measurement, as a finding. Always produced when the recogniser ran —
 *  including when it found nothing, because "no text in it" is a fact about
 *  the capture and a threshold set later needs the zeroes as much as the
 *  hits. */
export function textFinding(s: TextScore): Finding {
  const what =
    s.chars === 0
      ? "No text in it."
      : `Read ${s.chars} characters in ${s.lines} line${s.lines === 1 ? "" : "s"}.`;
  const tall = s.tallest > 0 ? ` Tallest line ${(s.tallest * 100).toFixed(1)}% of frame height.` : "";
  return {
    code: "text_measured",
    severity: "info",
    message: `${what}${tall}`,
    score: s.tallest,
    detail: { blocks: s.blocks, lines: s.lines, chars: s.chars, tallest: s.tallest },
  };
}

const REASON_TEXT: Record<UnscoredReason, string> = {
  no_labeller: "this build has no text recogniser",
  timeout: "the read took too long",
  error: "the text recogniser failed",
};

/** The phone did not look. Info, like the measurement it stands in for — the
 *  worker did nothing wrong and there is nothing for them to fix — but it is
 *  recorded, because a check that was skipped must never read as a check that
 *  ran and found nothing. */
export function textUnreadFinding(reason: UnscoredReason, error?: string): Finding {
  return {
    code: "text_unread",
    severity: "info",
    message: `Text not read on the phone (${REASON_TEXT[reason]}).`,
    detail: error ? { reason, error } : { reason },
  };
}

// Shorter than the labeller's six seconds. That budget exists for ML Kit's
// cold model load on the subject check, which is the one the worker is kept
// waiting for; this is a measurement, and a measurement that cannot be taken
// promptly is better recorded as missing than paid for at the shutter.
const TEXT_TIMEOUT_MS = 5_000;

/** What ML Kit reads in the file, or the reason it could not.
 *
 * Required lazily for the same reason the labeller is: in Expo Go the native
 * module does not exist and a top-level import would throw at startup. */
export async function recogniseText(uri: string): Promise<TextResult> {
  let mod: { recognize(uri: string): Promise<TextRead> } | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@react-native-ml-kit/text-recognition").default;
  } catch {
    mod = undefined;
  }
  if (!mod) return { unscored: "no_labeller" };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), TEXT_TIMEOUT_MS);
  });
  try {
    const read = await Promise.race([mod.recognize(uri), timeout]);
    if (read === "timeout") return { unscored: "timeout" };
    return { text: read.text ?? "", blocks: read.blocks ?? [] };
  } catch (e) {
    return { unscored: "error", error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
