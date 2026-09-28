// Does this capture look like the photos the client sent?
//
// A brief describes the job in words, and words are a poor specification for a
// picture. "Retail shelf" says nothing about how close to stand, how much
// aisle to include, or whether a trolley in the corner is a problem. The
// client usually knows exactly what they want and can show it — and often
// already has, in the request's "capture examples" slot.
//
// So when examples exist, the phone compares the capture against them instead
// of against a typed word list. The comparison uses the labeller already in
// the app: label each example once, label the capture, and measure how much
// the two label sets overlap. No new model, no download, nothing to ship.
//
// WHAT THIS BUYS AND WHAT IT DOES NOT. The labeller names ~400 coarse things,
// so this answers "is this the right KIND of picture" — a shelf rather than a
// floor, a workshop rather than a car park. It cannot tell one shelf from
// another, and it never will. It is still strictly better evidence than a
// hand-typed word list, because the examples carry framing, lighting and how
// much clutter the client considers normal, and none of that can be typed.
//
// A LOW SCORE NEVER DECIDES ON ITS OWN. The keep-or-retake prompt fires only
// when this AND the word check both miss — see useCapture. A brand-new check
// with no field data behind it does not get to throw away a worker's shot by
// itself, and the two scores are recorded separately on every capture so the
// rule can be moved once the reviewers' verdicts say which one to trust.
//
// Everything here is pure and unit-tested. The downloading and labelling of
// the examples themselves is capture/examples.ts.

import { EXAMPLE_OFF } from "@/config";
import type { Finding } from "./rules";
import type { Label, UnscoredReason } from "./subject";

/** One of the client's photos, as the labeller saw it. Stored on the device
 *  so it is labelled once per task rather than once per capture. */
export interface ExampleLabels {
  attachmentId: string;
  filename: string;
  labels: Label[];
}

/** What the phone has to compare against, and what it was supposed to have.
 *
 *  `expected` comes from the assignment payload, `ready` from the device
 *  store. They differ when a download failed or the worker was offline, and
 *  that difference has to be visible: a capture checked against nothing must
 *  never be recorded as a capture that matched. */
export interface ExampleSet {
  expected: number;
  ready: ExampleLabels[];
}

export interface ExampleScore {
  /** the best similarity across the examples, 0..1 */
  score: number;
  /** the example it looked most like */
  best: string | null;
  /** labels the capture shares with that example, most confident first */
  shared: string[];
  examples: number;
}

/** Labels as a sparse vector: lowercased text to the highest confidence seen.
 *  The labeller's vocabulary is fixed, so the raw text is a stable key and no
 *  stemming is wanted — unlike the word check, which has to meet phrases a
 *  person typed. */
function vectorOf(labels: Label[]): Map<string, number> {
  const v = new Map<string, number>();
  for (const l of labels) {
    const k = l.text.trim().toLowerCase();
    if (!k) continue;
    v.set(k, Math.max(v.get(k) ?? 0, l.confidence));
  }
  return v;
}

/** Cosine similarity of two label sets, 0..1.
 *
 *  Cosine rather than a plain count of shared labels because confidence
 *  carries real information: an example the labeller was 0.9 sure showed a
 *  shelf and a capture it was 0.2 sure about are not the same picture, even
 *  though both "have" the label. Both vectors are non-negative, so the result
 *  is already within 0..1 and needs no clamping. */
export function similarity(a: Label[], b: Label[]): number {
  const va = vectorOf(a);
  const vb = vectorOf(b);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, x] of va) {
    na += x * x;
    const y = vb.get(k);
    if (y) dot += x * y;
  }
  for (const [, y] of vb) nb += y * y;
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

/** The best match across the client's examples.
 *
 *  Best, not average: a client who sends a wide shot and a close-up is
 *  describing two acceptable pictures, not demanding the mean of them. */
export function scoreExamples(labels: Label[], examples: ExampleLabels[]): ExampleScore {
  let score = 0;
  let best: ExampleLabels | null = null;
  for (const ex of examples) {
    const s = similarity(labels, ex.labels);
    if (s > score || best === null) {
      score = s;
      best = ex;
    }
  }
  const mine = vectorOf(labels);
  const shared =
    best === null
      ? []
      : [...vectorOf(best.labels).keys()]
          .filter((k) => mine.has(k))
          .sort((x, y) => (mine.get(y) ?? 0) - (mine.get(x) ?? 0))
          .slice(0, 5);
  return {
    score: Number(score.toFixed(3)),
    best: best?.filename ?? null,
    shared,
    examples: examples.length,
  };
}

/** Did this capture miss the examples? Used by the AND rule, not on its own. */
export function missedExamples(r: ExampleScore): boolean {
  return r.examples > 0 && r.score < EXAMPLE_OFF;
}

/** The measurement, recorded on every capture — the ones that matched as much
 *  as the ones that did not. Without the passing scores there is no way to
 *  tell later whether EXAMPLE_OFF was set anywhere near right. */
export function examplesFinding(r: ExampleScore): Finding {
  const like = r.best ? ` Closest to ${r.best}.` : "";
  const shared = r.shared.length > 0 ? ` Shared: ${r.shared.join(", ").toLowerCase()}.` : "";
  return {
    code: "example_match",
    severity: "info",
    message: `Looks ${Math.round(r.score * 100)}% like the client's ${r.examples} example${r.examples === 1 ? "" : "s"}.${like}${shared}`,
    score: r.score,
    detail: { score: r.score, best: r.best, shared: r.shared, examples: r.examples },
  };
}

/** The same for a clip: how many of its sampled frames looked like an example. */
export interface ExampleFramesScore {
  frames: number;
  hits: number;
  share: number;
  /** the best single frame, which is what a reviewer scrubbing the clip will find */
  best: number;
}

export function scoreExampleFrames(perFrame: ExampleScore[]): ExampleFramesScore {
  const hits = perFrame.filter((r) => r.score >= EXAMPLE_OFF).length;
  return {
    frames: perFrame.length,
    hits,
    share: perFrame.length > 0 ? Number((hits / perFrame.length).toFixed(3)) : 0,
    best: perFrame.length > 0 ? Math.max(...perFrame.map((r) => r.score)) : 0,
  };
}

export function exampleFramesFinding(f: ExampleFramesScore): Finding {
  return {
    code: "example_match",
    severity: "info",
    message: `Looked like the client's examples in ${f.hits} of ${f.frames} frames (best ${Math.round(f.best * 100)}%).`,
    // The BEST frame, not the share. The share is a count of frames that
    // cleared a threshold and so carries no information the threshold does not
    // already hold — it rendered as "score 1.00" beside "best 54%", which read
    // as a contradiction. The similarity is the number a person compares.
    score: f.best,
    detail: { frames: f.frames, hits: f.hits, share: f.share, best: f.best },
  };
}

/** The phone was supposed to compare against examples and could not.
 *
 *  Info, because the worker did nothing wrong and there is nothing for them to
 *  do — but recorded, and the word check decides alone. A capture that was
 *  never compared must not be filed as one that matched. */
export function examplesUncheckedFinding(expected: number, reason?: UnscoredReason): Finding {
  const why = reason === "no_labeller" ? "this build has no image labeller" : "they could not be fetched";
  return {
    code: "examples_unchecked",
    severity: "info",
    message: `Not compared against the client's ${expected} example${expected === 1 ? "" : "s"} (${why}).`,
    detail: { expected, reason: reason ?? "unavailable" },
  };
}
