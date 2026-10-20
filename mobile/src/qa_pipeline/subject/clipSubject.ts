// The subject check: does this photo look more like the task's subject than
// like any of the things a wrong capture usually shows?
//
// It replaced ML Kit's image labeller, which could only answer from a fixed
// list of ~430 labels: a subject whose words were not on it — "shop fronts",
// "laptop being operated", a ceiling fan — could never pass, and a common
// label ("Building", "Plant") passed almost anything. CLIP compares the photo
// with the subject's own words instead. On the laptop test set
// (tools/subject_eval) it warns on 5% of good photos and lets 2% of wrong ones
// through, where ML Kit managed 28% and 15%.
//
// It only ever WARNS. A miss puts the keep-or-retake question to the worker
// (pipeline.ts); the verdict rides with the upload for the reviewer either way.
// The device is not trusted to judge its own work, and a false refusal is
// invisible and unpaid while a false pass is caught at gate 1.
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
// argue with it ("a road" against "road traffic"); so is the one nearest it in
// meaning ("grass" against "crop field, plants, soil": withoutNearest).
//
// The task's must_not_show phrases are scored the same way, each against the
// negatives that share no word with it (forbiddenMargins), and one that
// clearly shows is a warning for the reviewer that never asks the worker:
// a passer-by walks into shot and the shelf is still the shelf.
//
// The models are big (image ~350 MB, text ~250 MB, fp32) and download once,
// when the worker first opens an assignment; until they are ready a capture
// records subject_unscored and is kept unasked. Nothing here blocks a capture.

import type { SubjectSpec } from "@/api/types";
import {
  CLIP_EXAMPLE_MIN_SIMILARITY,
  CLIP_FORBIDDEN_MIN_MARGIN,
  CLIP_IGNORE_NEAREST_NEGATIVES,
  CLIP_SUBJECT_MIN_MARGIN,
} from "@/config";
import type { Finding } from "@/qa_pipeline/rules/rules";
import { type UnscoredReason, unscoredFinding, words } from "@/qa_pipeline/subject/subject";

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

/** The phrases the subject is: its labels when the task lists them, else its
 *  domain and must_show. */
export function subjectPhrases(subject: SubjectSpec): string[] {
  const labels = (subject.labels ?? []).filter((p) => p.trim());
  if (labels.length > 0) return labels;
  return [subject.domain, ...subject.must_show].filter((p) => p && p.trim());
}

/** The negatives that do not name part of these phrases. */
export function negativesAgainst(phrases: string[]): string[] {
  const wanted = new Set(phrases.flatMap(words));
  return NEGATIVES.filter((n) => !words(n).some((w) => wanted.has(w)));
}

/** The negatives that do not name part of the subject. */
export function negativesFor(subject: SubjectSpec): string[] {
  return negativesAgainst(subjectPhrases(subject));
}

/** The must_not_show phrases, as the task lists them. */
export function forbiddenPhrases(subject: SubjectSpec): string[] {
  return (subject.must_not_show ?? []).filter((p) => p && p.trim());
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
  /** the negatives ignored for being nearest the subject (withoutNearest) */
  ignored?: string[];
  /** the must_not_show phrases, each with the negatives it is measured against */
  forbidden?: ForbiddenVectors[];
}

/** One must_not_show phrase, ready to score. Its negatives are its own:
 *  "selfie" measured against the negative "a selfie" could never show. */
export interface ForbiddenVectors {
  phrase: string;
  vec: Float32Array;
  negatives: Float32Array[];
}

export interface ForbiddenMargin {
  phrase: string;
  margin: number;
}

/** Each must_not_show phrase's margin over its negatives, at its best view. */
export function forbiddenMargins(viewVecs: Float32Array[], forbidden: ForbiddenVectors[]): ForbiddenMargin[] {
  return forbidden.map((f) => ({
    phrase: f.phrase,
    margin: Math.max(
      ...viewVecs.map((v) => dot(v, f.vec) - (f.negatives.length > 0 ? Math.max(...f.negatives.map((n) => dot(v, n))) : -1)),
    ),
  }));
}

/** A clip's per-phrase margins: each phrase's mean over its best three frames,
 *  as the subject's is (framesMargin). */
export function framesForbidden(perFrame: ForbiddenMargin[][]): ForbiddenMargin[] {
  if (perFrame.length === 0) return [];
  return perFrame[0].map((f, i) => ({ phrase: f.phrase, margin: framesMargin(perFrame.map((fr) => fr[i].margin)) }));
}

/** The warning a clearly shown must_not_show thing becomes; null when none
 *  is. For the reviewer only — the worker is never asked about it. */
export function forbiddenFinding(margins: ForbiddenMargin[], clip = false): Finding | null {
  const worst = margins.reduce<ForbiddenMargin | null>((w, m) => (w && w.margin >= m.margin ? w : m), null);
  if (!worst || worst.margin < CLIP_FORBIDDEN_MIN_MARGIN) return null;
  return {
    code: "forbidden_subject",
    severity: "warn",
    message: `This ${clip ? "clip" : "capture"} seems to show ${worst.phrase}, which the task asked to keep out.`,
    detail: {
      model: "clip-vit-b32",
      phrase: worst.phrase,
      margin: Number(worst.margin.toFixed(4)),
      threshold: CLIP_FORBIDDEN_MIN_MARGIN,
    },
  };
}

/** The negatives less the `k` that mean most nearly what the subject does:
 *  each negative's nearness is its similarity to the closest subject phrase,
 *  and the nearest go. The word filter (negativesFor) has already dropped the
 *  ones that share a word; this catches the ones that share a meaning. */
export function withoutNearest(text: TextVectors, k: number): TextVectors {
  if (k <= 0 || text.negatives.length <= k) return text;
  const near = text.negatives.map((n, i) => ({ i, s: Math.max(...text.subject.map((t) => dot(n, t))) }));
  const gone = new Set(
    near
      .sort((a, b) => b.s - a.s)
      .slice(0, k)
      .map((x) => x.i),
  );
  const keep = (_: unknown, i: number) => !gone.has(i);
  return {
    subject: text.subject,
    negatives: text.negatives.filter(keep),
    negativePhrases: text.negativePhrases.filter(keep),
    ignored: text.negativePhrases.filter((_, i) => gone.has(i)),
  };
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

/** What CLIP saw, recorded pass or fail. Never shown to the worker.
 *
 *  The margin rides in detail, never in `score`: a finding's score is a
 *  confidence from 0 to 1 (the server's DeviceCheck refuses anything else),
 *  and a margin is negative whenever the photo looks more like a mistake than
 *  the subject. Sent as the score, every such capture was refused at presign. */
export function clipMeasured(margin: number, detail: Record<string, unknown>): Finding {
  const verdict = margin >= CLIP_SUBJECT_MIN_MARGIN ? "pass" : "warn";
  return {
    code: "subject_clip_measured",
    severity: "info",
    message: `CLIP margin ${margin.toFixed(4)} (${verdict} at ${CLIP_SUBJECT_MIN_MARGIN}).`,
    detail: { model: "clip-vit-b32", threshold: CLIP_SUBJECT_MIN_MARGIN, ...detail, margin: Number(margin.toFixed(4)) },
  };
}

export function photoDetail(m: ViewsMargin, ms: number): Record<string, unknown> {
  return { margin: Number(m.margin.toFixed(4)), full: Number(m.full.toFixed(4)), view: VIEW_NAME[m.view], ms };
}

/** CLIP's verdict as the warning the keep-or-retake question is asked about;
 *  null when the subject looks present. wrong_subject is the code the
 *  dialog, gate 1's ordering and the console's badge all read. */
export function clipFinding(margin: number, subject: SubjectSpec, frames?: { frames: number }): Finding | null {
  if (margin >= CLIP_SUBJECT_MIN_MARGIN) return null;
  return {
    code: "wrong_subject",
    severity: "warn",
    message: frames
      ? `${subject.domain} doesn't seem to be in this clip.`
      : `Doesn't look like ${subject.domain}.`,
    detail: { model: "clip-vit-b32", margin: Number(margin.toFixed(4)), ...(frames ?? {}) },
  };
}

// ---------------------------------------------------------------------------
// The client's example photos.
//
// CLIP compares the pictures themselves: each example is embedded once, whole
// frame, and a capture's similarity is the best match between any of its six
// views and any example. It rides beside the word check — the keep-or-retake
// question is asked only when BOTH miss (pipeline.ts prompted) — so the
// examples can rescue a shot the words got wrong but never condemn one on
// their own.
//
// CLIP_EXAMPLE_MIN_SIMILARITY was set on the laptop test set with three
// examples per subject: words alone warned on 11% of good photos and passed
// 3% of wrong ones; words OR examples at 0.74 warned on 4% and passed 5%.
// ---------------------------------------------------------------------------

export interface ClipExample {
  attachmentId: string;
  filename: string;
  /** the example's whole frame, as one unit vector */
  vec: Float32Array;
}

/** What the phone holds for a task: `expected` from the assignment, `ready`
 *  embedded. They differ while the models download or when an example could
 *  not be fetched, and that gap is recorded, never read as a match. */
export interface ClipExampleSet {
  expected: number;
  ready: ClipExample[];
}

export interface ExampleSimilarity {
  /** the best cosine similarity between any view and any example */
  score: number;
  /** the example it looked most like */
  best: string | null;
}

export function exampleSimilarity(viewVecs: Float32Array[], examples: ClipExample[]): ExampleSimilarity {
  let score = -1;
  let best: string | null = null;
  for (const e of examples) {
    for (const v of viewVecs) {
      const s = dot(v, e.vec);
      if (s > score) {
        score = s;
        best = e.filename;
      }
    }
  }
  return { score, best };
}

export function examplesMissed(score: number): boolean {
  return score < CLIP_EXAMPLE_MIN_SIMILARITY;
}

/** How much the capture looks like the client's examples, recorded pass or
 *  fail. Info: the worker is asked only when the words miss too. */
export function clipExamplesFinding(score: number, examples: number, detail: Record<string, unknown>): Finding {
  return {
    code: "subject_clip_examples",
    severity: "info",
    message: `Looks ${Math.round(score * 100)}% like the client's examples (${
      examplesMissed(score) ? "miss" : "match"
    } at ${CLIP_EXAMPLE_MIN_SIMILARITY}).`,
    // a cosine, so in principle down to -1; the score field takes 0..1
    score: Number(Math.min(1, Math.max(0, score)).toFixed(4)),
    detail: { model: "clip-vit-b32", threshold: CLIP_EXAMPLE_MIN_SIMILARITY, examples, ...detail },
  };
}

/** The task has examples and CLIP could not compare against any of them. */
export function clipExamplesUncheckedFinding(expected: number): Finding {
  return {
    code: "subject_clip_examples_unchecked",
    severity: "info",
    message: `CLIP did not compare this capture with the client's ${expected} example photo${expected === 1 ? "" : "s"}.`,
    detail: { expected },
  };
}

export type ClipUnscored = Extract<UnscoredReason, "loading" | "no_model" | "error">;

/** Why CLIP gave no answer, as the subject_unscored warning the reviewer and
 *  gate 1's ordering already know: the capture is kept and nobody is asked. */
export function clipUnscoredFinding(reason: ClipUnscored, error?: string): Finding {
  return unscoredFinding(reason, error);
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

// Only the image model stays in memory. The text model (~250 MB) is needed
// just long enough to embed a subject's phrases — a few seconds, once per
// subject — so it is loaded for that and disposed after (withText): holding
// both is what a phone with 8 GB ran out of while checking a clip.
type TextModel = Embedder<string> & { dispose(): void };
let models: Promise<{ image: Embedder<ImageBuffer> }> | null = null;
let ready: { image: Embedder<ImageBuffer>; loadText: () => Promise<TextModel> } | null = null;

/** Start the download and load, once. Resolves when the image model is ready
 *  and the text model is on disk. A failure (no signal halfway through the
 *  download) is retried by the next call, from the next screen that asks. */
export function warmClip(): Promise<unknown> {
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
    const image = await createImageEmbedder(imgModel);
    console.log(`[clip] image model loaded in ${Date.now() - t0} ms`);
    ready = { image, loadText: () => createTextEmbedder(txtModel) };
    setStatus({ state: "ready" });
    return ready;
  })();
  models.catch((e: unknown) => {
    const error = e instanceof Error ? e.message : String(e);
    console.warn(`[clip] unavailable: ${error}`);
    setStatus({ state: "failed", error });
    models = null;
  });
  return models;
}

const textCache = new Map<string, Promise<TextVectors>>();
/** a phrase's vector, whichever subject asked first: the negatives are the
 *  same for every subject, so a second subject embeds only its own words */
const phraseCache = new Map<string, Float32Array>();

async function embedPhrase(text: Embedder<string>, phrase: string): Promise<Float32Array> {
  const hit = phraseCache.get(phrase);
  if (hit) return hit;
  const vs: Float32Array[] = [];
  // one at a time: the runner refuses a second call while one is running
  for (const t of TEMPLATES) vs.push(await text.embed(t.replace("{}", phrase)));
  const v = meanUnit(vs);
  phraseCache.set(phrase, v);
  return v;
}

/** Text work, one job at a time, with the text model loaded for the job and
 *  disposed after it. */
let textQueue: Promise<unknown> = Promise.resolve();
function withText<T>(job: (text: Embedder<string>) => Promise<T>): Promise<T> {
  const run = textQueue.then(async () => {
    const text = await ready!.loadText();
    try {
      return await job(text);
    } finally {
      text.dispose();
    }
  });
  textQueue = run.catch(() => undefined);
  return run;
}

/** The subject's, the negatives' and the must_not_show phrases' vectors,
 *  computed once per subject. */
export function textVectors(subject: SubjectSpec): Promise<TextVectors> | null {
  if (!ready) return null;
  const phrases = subjectPhrases(subject);
  const banned = forbiddenPhrases(subject);
  const key = JSON.stringify([phrases, banned]);
  let v = textCache.get(key);
  if (!v) {
    v = withText(async (text) => {
      const t0 = Date.now();
      const embedAll = async (ps: string[]) => {
        const out: Float32Array[] = [];
        for (const p of ps) out.push(await embedPhrase(text, p));
        return out;
      };
      const negativePhrases = negativesFor(subject);
      const out = withoutNearest(
        { subject: await embedAll(phrases), negatives: await embedAll(negativePhrases), negativePhrases },
        CLIP_IGNORE_NEAREST_NEGATIVES,
      );
      // each banned phrase against its own negatives, by the subject's rule
      const forbidden: ForbiddenVectors[] = [];
      for (const phrase of banned) {
        const own = negativesAgainst([phrase]);
        const vec = await embedPhrase(text, phrase);
        const kept = withoutNearest(
          { subject: [vec], negatives: await embedAll(own), negativePhrases: own },
          CLIP_IGNORE_NEAREST_NEGATIVES,
        );
        forbidden.push({ phrase, vec, negatives: kept.negatives });
      }
      console.log(
        `[clip] ${phrases.length} subject + ${out.negatives.length} negative + ${banned.length} banned phrases in ` +
          `${Date.now() - t0} ms` +
          (out.ignored?.length ? `; ignoring ${out.ignored.join(", ")}` : ""),
      );
      return { ...out, forbidden };
    });
    v.catch(() => textCache.delete(key));
    textCache.set(key, v);
  }
  return v;
}

export type ClipResult =
  | {
      /** null on a task with example photos but no subject */
      margins: ViewsMargin | null;
      ms: number;
      /** the six views' vectors, kept so the examples cost no second pass */
      vecs: Float32Array[];
      /** each must_not_show phrase's margin, from the same views */
      forbidden: ForbiddenMargin[];
    }
  | { unscored: ClipUnscored; error?: string };

/** One image's whole frame, as one unit vector: what an example is stored as.
 *  Null until the models are ready. */
export async function embedWhole(rgba: { width: number; height: number; data: Uint8Array }): Promise<Float32Array | null> {
  if (!ready) return null;
  const r = views(rgba.width, rgba.height)[0];
  return ready.image.embed({
    data: cropRgb(rgba.data, rgba.width, r),
    width: r.size,
    height: r.size,
    format: "rgb",
    layout: "hwc",
  });
}

/** Look at one image (RGBA, already decoded): its six views' vectors, and,
 *  when the task has a subject, the subject's and banned phrases' margins. */
export async function scoreImage(
  rgba: { width: number; height: number; data: Uint8Array },
  subject: SubjectSpec | null,
): Promise<ClipResult> {
  if (status.state === "failed") {
    return { unscored: status.error.startsWith("no_model") ? "no_model" : "error", error: status.error };
  }
  if (!ready) return { unscored: "loading" };
  try {
    const t0 = Date.now();
    const text = subject ? await textVectors(subject)! : null;
    const vecs: Float32Array[] = [];
    for (const r of views(rgba.width, rgba.height)) {
      const data = cropRgb(rgba.data, rgba.width, r);
      vecs.push(await ready.image.embed({ data, width: r.size, height: r.size, format: "rgb", layout: "hwc" }));
    }
    const margins = text ? marginOf(vecs, text) : null;
    const forbidden = forbiddenMargins(vecs, text?.forbidden ?? []);
    const ms = Date.now() - t0;
    if (margins) console.log(`[clip] margin ${margins.margin.toFixed(4)} (${VIEW_NAME[margins.view]}) in ${ms} ms`);
    return { margins, ms, vecs, forbidden };
  } catch (e) {
    return { unscored: "error", error: e instanceof Error ? e.message : String(e) };
  }
}
