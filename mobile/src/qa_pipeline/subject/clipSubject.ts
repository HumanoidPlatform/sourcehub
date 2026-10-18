// The subject check, the CLIP way: does this photo look more like the task's
// subject than like any of the things a wrong capture usually shows?
//
// ML Kit (subject.ts) can only answer from its fixed list of ~430 labels, so a
// subject whose words are not on it — "shop fronts", "laptop being operated" —
// can never pass, and a common label ("Building", "Plant") passes almost
// anything. CLIP compares the photo with the subject's own words instead. On
// the laptop test set (tools/subject_eval) it warned on 9% of good photos and
// let 2% of wrong ones through, against ML Kit's 28% and 15%.
//
// THIS IS ON TRIAL, IN DEVELOPMENT BUILDS ONLY. EXPO_PUBLIC_SUBJECT_CLIP picks
// what it does: unset/"off" nothing at all, "shadow" scores and records
// (subject_clip_measured) while ML Kit still decides, "decide" lets CLIP's
// verdict put the keep-or-retake question in ML Kit's place. Read under
// __DEV__ for the reason labelImage's stub is: `eas update` bundles the
// publishing machine's .env, and a trial must not reach workers' phones.
//
// The score is the one tools/subject_eval/evaluate.py computes ("margin"), so a
// threshold set there means the same here:
//   - each subject phrase (its labels, else domain + must_show) is embedded
//     through six templates, averaged; the same for each negative phrase;
//   - the photo is looked at as six views — the whole frame, its four
//     quarters, its centre 60% — each cut to its centred square, which is what
//     open_clip's preprocessing does before the model sees it;
//   - per view: mean similarity to the subject's phrases minus the best
//     similarity to any negative; the photo's margin is its best view's;
//   - a clip's margin is the mean of its best three frames'.
// A negative that shares a word with the subject is dropped, or it would
// argue with it ("a road" against "road traffic").
//
// The models are big (image ~350 MB, text ~250 MB, fp32) and download once on
// first use; until they are ready a capture records subject_clip_unscored and
// ML Kit decides as before. Nothing here ever blocks a capture.

import type { SubjectSpec } from "@/api/types";
import { CLIP_SUBJECT_MIN_MARGIN } from "@/config";
import type { Finding } from "@/qa_pipeline/rules/rules";
import { words } from "@/qa_pipeline/subject/subject";

export type ClipMode = "off" | "shadow" | "decide";

export function clipMode(): ClipMode {
  const v = __DEV__ ? process.env.EXPO_PUBLIC_SUBJECT_CLIP : undefined;
  return v === "shadow" || v === "decide" ? v : "off";
}

/** tools/subject_eval/score_clip.py TEMPLATES, in the same order */
export const TEMPLATES = [
  "a photo of {}.",
  "a photo showing {}.",
  "a close-up photo of {}.",
  "a wide photo of {}.",
  "a phone photo of {}.",
  "{}",
];

/** tools/subject_eval/negatives.txt. Changing one changes every score: keep
 *  the two lists the same, and re-run the evaluation if either moves. */
export const NEGATIVES = [
  "a floor", "a ceiling", "a blank wall", "the sky", "a road", "grass", "the inside of a pocket",
  "a dark room", "a black screen", "a blurry photo", "an out of focus photo",
  "a photo of a finger over the lens", "a screenshot", "a computer screen", "a phone screen",
  "a selfie", "a person's face", "a group of people", "a hand", "feet", "a document",
  "a piece of paper", "a car interior", "a bedroom", "a bathroom", "a kitchen", "a door",
  "a window", "a dog", "a cat", "food on a plate", "a tree", "a building", "a street",
  "an empty room", "a table",
];

/** The phrases the subject is, exactly the ones the ML Kit check matches. */
export function subjectPhrases(subject: SubjectSpec): string[] {
  const labels = (subject.labels ?? []).filter((p) => p.trim());
  if (labels.length > 0) return labels;
  return [subject.domain, ...subject.must_show].filter((p) => p && p.trim());
}

/** The negatives that do not name part of the subject. */
export function negativesFor(subject: SubjectSpec): string[] {
  const wanted = new Set(subjectPhrases(subject).flatMap(words));
  return NEGATIVES.filter((n) => !words(n).some((w) => wanted.has(w)));
}

export interface Rect {
  x: number;
  y: number;
  size: number;
}

/** The six views, each already cut to its centred square. */
export function views(width: number, height: number): Rect[] {
  const square = (x: number, y: number, w: number, h: number): Rect => {
    const size = Math.min(w, h);
    return { x: x + Math.floor((w - size) / 2), y: y + Math.floor((h - size) / 2), size };
  };
  const hw = Math.floor(width / 2);
  const hh = Math.floor(height / 2);
  return [
    square(0, 0, width, height),
    // the quarters in score_clip.py's order: x outer, y inner
    square(0, 0, hw, hh),
    square(0, hh, hw, hh),
    square(hw, 0, hw, hh),
    square(hw, hh, hw, hh),
    square(Math.floor(width * 0.2), Math.floor(height * 0.2), Math.floor(width * 0.6), Math.floor(height * 0.6)),
  ];
}

/** An RGB square out of an RGBA image, row by row. */
export function cropRgb(rgba: Uint8Array, width: number, r: Rect): Uint8Array {
  const out = new Uint8Array(r.size * r.size * 3);
  let o = 0;
  for (let y = r.y; y < r.y + r.size; y++) {
    let i = (y * width + r.x) * 4;
    for (let x = 0; x < r.size; x++, i += 4) {
      out[o++] = rgba[i];
      out[o++] = rgba[i + 1];
      out[o++] = rgba[i + 2];
    }
  }
  return out;
}

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** The unit-length mean of unit vectors: one phrase through its templates. */
export function meanUnit(vs: Float32Array[]): Float32Array {
  const out = new Float32Array(vs[0].length);
  for (const v of vs) for (let i = 0; i < v.length; i++) out[i] += v[i];
  const n = Math.hypot(...out) || 1;
  for (let i = 0; i < out.length; i++) out[i] /= n;
  return out;
}

export interface TextVectors {
  subject: Float32Array[];
  negatives: Float32Array[];
  /** the negatives kept, for the record */
  negativePhrases: string[];
}

export interface ViewsMargin {
  /** the best view's margin */
  margin: number;
  /** which view gave it: 0 the whole frame, 1-4 the quarters, 5 the centre */
  view: number;
  /** the whole frame's margin, for the record */
  full: number;
}

export function marginOf(viewVecs: Float32Array[], text: TextVectors): ViewsMargin {
  const per = viewVecs.map((v) => {
    const sim = text.subject.reduce((s, t) => s + dot(v, t), 0) / text.subject.length;
    const neg = text.negatives.length > 0 ? Math.max(...text.negatives.map((t) => dot(v, t))) : -1;
    return sim - neg;
  });
  let view = 0;
  per.forEach((m, i) => {
    if (m > per[view]) view = i;
  });
  return { margin: per[view], view, full: per[0] };
}

/** A clip: the mean of its best three frames' margins. */
export function framesMargin(margins: number[]): number {
  const best = [...margins].sort((a, b) => b - a).slice(0, 3);
  return best.reduce((s, m) => s + m, 0) / best.length;
}

const VIEW_NAME = ["whole frame", "top-left", "bottom-left", "top-right", "bottom-right", "centre"];

/** What CLIP saw, recorded pass or fail. Never shown to the worker. */
export function clipMeasured(margin: number, detail: Record<string, unknown>): Finding {
  const verdict = margin >= CLIP_SUBJECT_MIN_MARGIN ? "pass" : "warn";
  return {
    code: "subject_clip_measured",
    severity: "info",
    message: `CLIP margin ${margin.toFixed(4)} (${verdict} at ${CLIP_SUBJECT_MIN_MARGIN}).`,
    score: Number(margin.toFixed(4)),
    detail: { model: "clip-vit-b32", threshold: CLIP_SUBJECT_MIN_MARGIN, ...detail },
  };
}

export function photoDetail(m: ViewsMargin, ms: number): Record<string, unknown> {
  return { margin: Number(m.margin.toFixed(4)), full: Number(m.full.toFixed(4)), view: VIEW_NAME[m.view], ms };
}

/** CLIP's verdict as the warning the keep-or-retake question is asked about;
 *  null when the subject looks present. The same code as ML Kit's, so the
 *  dialog and gate 1's ordering need nothing new. */
export function clipFinding(margin: number, subject: SubjectSpec, frames?: { frames: number }): Finding | null {
  if (margin >= CLIP_SUBJECT_MIN_MARGIN) return null;
  return {
    code: "wrong_subject",
    severity: "warn",
    message: frames
      ? `${subject.domain} doesn't seem to be in this clip.`
      : `Doesn't look like ${subject.domain}.`,
    score: Number(margin.toFixed(4)),
    detail: { model: "clip-vit-b32", margin: Number(margin.toFixed(4)), ...(frames ?? {}) },
  };
}

export type ClipUnscored = "loading" | "no_model" | "error";

/** Why CLIP gave no answer. Info, not a warning: on trial, ML Kit decided. */
export function clipUnscoredFinding(reason: ClipUnscored, error?: string): Finding {
  return {
    code: "subject_clip_unscored",
    severity: "info",
    message: `CLIP did not score this capture (${reason}).`,
    detail: error ? { reason, error } : { reason },
  };
}

// ---------------------------------------------------------------------------
// The native side: react-native-executorch, required lazily so a build without
// it (Expo Go, an older binary reached by an OTA update) loads and says why.
// ---------------------------------------------------------------------------

interface Embedder<I> {
  embed(input: I): Promise<Float32Array>;
}
type ImageBuffer = { data: Uint8Array; width: number; height: number; format: "rgb"; layout: "hwc" };

export type ClipStatus =
  | { state: "off" }
  | { state: "downloading"; progress: number }
  | { state: "loading" }
  | { state: "ready" }
  | { state: "failed"; error: string };

let status: ClipStatus = { state: "off" };
const listeners = new Set<(s: ClipStatus) => void>();

function setStatus(s: ClipStatus) {
  status = s;
  for (const l of listeners) l(s);
}

export function clipStatus(): ClipStatus {
  return status;
}

export function onClipStatus(l: (s: ClipStatus) => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

let models: Promise<{ image: Embedder<ImageBuffer>; text: Embedder<string> }> | null = null;
let ready: { image: Embedder<ImageBuffer>; text: Embedder<string> } | null = null;

/** Start the download and load, once. Resolves when both models are ready. */
export function warmClip(): Promise<unknown> | null {
  if (clipMode() === "off") return null;
  if (models) return models;
  models = (async () => {
    let lib: typeof import("react-native-executorch");
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      lib = require("react-native-executorch");
    } catch (e) {
      throw new Error(`no_model: ${e instanceof Error ? e.message : String(e)}`);
    }
    const { download, createImageEmbedder, createTextEmbedder, models: m } = lib;
    setStatus({ state: "downloading", progress: 0 });
    let logged = -1;
    const onProgress = (p: number) => {
      setStatus({ state: "downloading", progress: p });
      const tenth = Math.floor(p * 10);
      if (tenth !== logged) {
        logged = tenth;
        console.log(`[clip] download ${Math.round(p * 100)}%`);
      }
    };
    // fp32 on the CPU: the build the laptop evaluation scored, so its
    // threshold carries over
    const [imgModel, txtModel] = await Promise.all([
      download(m.imageEmbeddings.CLIP_VIT_BASE_PATCH32.XNNPACK_FP32, { onProgress }),
      download(m.textEmbeddings.CLIP_VIT_BASE_PATCH32_TEXT.XNNPACK_FP32),
    ]);
    setStatus({ state: "loading" });
    const t0 = Date.now();
    const [image, text] = await Promise.all([createImageEmbedder(imgModel), createTextEmbedder(txtModel)]);
    console.log(`[clip] models loaded in ${Date.now() - t0} ms`);
    ready = { image, text };
    setStatus({ state: "ready" });
    return ready;
  })();
  models.catch((e: unknown) => {
    const error = e instanceof Error ? e.message : String(e);
    console.warn(`[clip] unavailable: ${error}`);
    setStatus({ state: "failed", error });
  });
  return models;
}

const textCache = new Map<string, Promise<TextVectors>>();

async function embedPhrase(text: Embedder<string>, phrase: string): Promise<Float32Array> {
  const vs: Float32Array[] = [];
  // one at a time: the runner refuses a second call while one is running
  for (const t of TEMPLATES) vs.push(await text.embed(t.replace("{}", phrase)));
  return meanUnit(vs);
}

/** The subject's and the negatives' vectors, computed once per subject. */
export function textVectors(subject: SubjectSpec): Promise<TextVectors> | null {
  if (!ready) return null;
  const { text } = ready;
  const phrases = subjectPhrases(subject);
  const key = JSON.stringify(phrases);
  let v = textCache.get(key);
  if (!v) {
    v = (async () => {
      const t0 = Date.now();
      const negativePhrases = negativesFor(subject);
      const sub: Float32Array[] = [];
      for (const p of phrases) sub.push(await embedPhrase(text, p));
      const neg: Float32Array[] = [];
      for (const p of negativePhrases) neg.push(await embedPhrase(text, p));
      console.log(`[clip] ${phrases.length} subject + ${neg.length} negative phrases in ${Date.now() - t0} ms`);
      return { subject: sub, negatives: neg, negativePhrases };
    })();
    v.catch(() => textCache.delete(key));
    textCache.set(key, v);
  }
  return v;
}

export type ClipResult = { margins: ViewsMargin; ms: number } | { unscored: ClipUnscored; error?: string };

/** Score one image (RGBA, already decoded) against the subject. */
export async function scoreImage(
  rgba: { width: number; height: number; data: Uint8Array },
  subject: SubjectSpec,
): Promise<ClipResult> {
  if (status.state === "failed") {
    return { unscored: status.error.startsWith("no_model") ? "no_model" : "error", error: status.error };
  }
  if (!ready) return { unscored: "loading" };
  try {
    const t0 = Date.now();
    const text = await textVectors(subject)!;
    const vecs: Float32Array[] = [];
    for (const r of views(rgba.width, rgba.height)) {
      const data = cropRgb(rgba.data, rgba.width, r);
      vecs.push(await ready.image.embed({ data, width: r.size, height: r.size, format: "rgb", layout: "hwc" }));
    }
    const margins = marginOf(vecs, text);
    const ms = Date.now() - t0;
    console.log(`[clip] margin ${margins.margin.toFixed(4)} (${VIEW_NAME[margins.view]}) in ${ms} ms`);
    return { margins, ms };
  } catch (e) {
    return { unscored: "error", error: e instanceof Error ? e.message : String(e) };
  }
}
