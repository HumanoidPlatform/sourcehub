// The domain check: does this photo show what the task is about?
//
// The phone cannot judge a shelf the way a reviewer can, but it can tell a
// shelf from a dog, a floor, a selfie or a screenshot — which is most of what
// an off-subject capture is. ML Kit's on-device image labeller names what it
// sees from a fixed vocabulary of ~400 things ("Shelf", "Supermarket",
// "Person", "Screenshot"); scoreSubject compares those names with the words
// the task's subject profile uses (capture_spec.subject, typed by the
// aggregator in the console) and gives a number from 0 to 1.
//
// The number only ever WARNS. Below SUBJECT_OFF the capture screen asks the
// worker to keep or retake; the finding rides with the upload for the
// reviewer either way. Nothing here deletes work on its own: the device is
// not trusted to judge its own captures, and a false refusal is invisible
// and unpaid while a false pass is caught at gate 1.
//
// scoreSubject, subjectFinding and unscoredFinding are pure and unit-tested;
// labelImage is the one native call. Wherever it cannot answer — Expo Go, an
// older build, a native error, a slow first run — it says WHY, and that
// reason rides with the upload as a warning of its own. A skipped check that
// looks exactly like a passed one cost a day of "is the pipeline even there?";
// it is not allowed to be silent again.

import type { SubjectSpec } from "@/api/types";
import { SUBJECT_OFF } from "@/config";
import type { Finding } from "./rules";

export interface Label {
  text: string;
  confidence: number;
}

export interface SubjectScore {
  /** clamp(best matching label − best forbidden label, 0, 1) */
  score: number;
  /** labels that matched must_show / domain / labels, best first */
  hit: string[];
  /** labels that matched must_not_show */
  veto: string[];
  /** what the labeller saw, best first, at most five */
  seen: string[];
}

const STOP = new Set(["a", "an", "the", "of", "with", "and", "or", "in", "on", "at", "no", "not"]);

/** "Price tags" → ["price", "tag"]; "shelves" → ["shelf"]. Enough stemming
 *  for the plural of a thing to meet its singular, no more. */
export function words(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => (w.endsWith("ves") ? `${w.slice(0, -3)}f` : w.endsWith("ies") ? `${w.slice(0, -3)}y` : w.endsWith("ss") ? w : w.replace(/s$/, "")));
}

function matches(label: string, vocabulary: Set<string>): boolean {
  return words(label).some((w) => vocabulary.has(w));
}

export function scoreSubject(labels: Label[], subject: SubjectSpec): SubjectScore {
  const wanted = new Set(
    (subject.labels?.length ? subject.labels : [subject.domain, ...subject.must_show]).flatMap(words),
  );
  const forbidden = new Set(subject.must_not_show.flatMap(words));
  const sorted = [...labels].sort((a, b) => b.confidence - a.confidence);
  const hit = sorted.filter((l) => matches(l.text, wanted));
  const veto = sorted.filter((l) => matches(l.text, forbidden));
  const best = (xs: Label[]) => (xs.length > 0 ? xs[0].confidence : 0);
  return {
    score: Math.max(0, Math.min(1, best(hit) - best(veto))),
    hit: hit.map((l) => l.text),
    veto: veto.map((l) => l.text),
    seen: sorted.slice(0, 5).map((l) => l.text),
  };
}

/** The warning a low score becomes; null when the photo looks on-subject. */
export function subjectFinding(r: SubjectScore, subject: SubjectSpec): Finding | null {
  if (r.score >= SUBJECT_OFF) return null;
  const saw = r.seen.length > 0 ? `Saw: ${r.seen.join(", ").toLowerCase()}.` : "Nothing recognisable in it.";
  return {
    code: "wrong_subject",
    severity: "warn",
    message: `Doesn't look like ${subject.domain}. ${saw}`,
    score: Number(r.score.toFixed(3)),
    detail: { labels: r.seen, hit: r.hit, veto: r.veto },
  };
}

/** Why the labeller gave no answer. */
export type UnscoredReason = "no_labeller" | "timeout" | "error";

export type LabelResult = { labels: Label[] } | { unscored: UnscoredReason; error?: string };

const REASON_TEXT: Record<UnscoredReason, string> = {
  no_labeller: "this build has no image labeller",
  timeout: "the check took too long",
  error: "the image labeller failed",
};

/** The warning a skipped check becomes. It never blocks and never asks the
 *  worker anything — they did nothing wrong — but the reviewer at gate 1 can
 *  see the phone did not look, instead of assuming it looked and approved. */
export function unscoredFinding(reason: UnscoredReason, error?: string): Finding {
  return {
    code: "subject_unscored",
    severity: "warn",
    message: `Subject not checked on the phone (${REASON_TEXT[reason]}).`,
    detail: error ? { reason, error } : { reason },
  };
}

// The first call on a phone loads the model and decodes a full-resolution
// JPEG; on a mid-range device that alone can pass two seconds. Six is long
// enough for that one cold start and short enough that a hung native call
// does not hold the shutter hostage.
const LABEL_TIMEOUT_MS = 6_000;

/** What ML Kit sees in the file, or the reason it could not look.
 *
 * The module is required lazily: in Expo Go it does not exist and the import
 * would throw at startup. EXPO_PUBLIC_SUBJECT_STUB="Floor:0.9,Hand:0.6" makes
 * every photo "see" those labels, so the keep-or-retake flow can be tried in
 * Expo Go without a development build.
 *
 * Development bundles only. `eas update` bundles with the publishing machine's
 * .env, so without the __DEV__ guard one update published from a laptop that
 * had the stub set would make every worker's phone "see" floors and hands. */
export async function labelImage(uri: string): Promise<LabelResult> {
  const stub = __DEV__ ? process.env.EXPO_PUBLIC_SUBJECT_STUB : undefined;
  if (stub) {
    return {
      labels: stub.split(",").map((s: string) => {
        const [text, conf] = s.split(":");
        return { text: text.trim(), confidence: Number(conf ?? 0.8) };
      }),
    };
  }
  let mod: { label(uri: string): Promise<Label[]> } | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@react-native-ml-kit/image-labeling").default;
  } catch {
    mod = undefined;
  }
  if (!mod) return { unscored: "no_labeller" };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), LABEL_TIMEOUT_MS);
  });
  try {
    const labels = await Promise.race([mod.label(uri), timeout]);
    if (labels === "timeout") return { unscored: "timeout" };
    return { labels: labels.map((l) => ({ text: l.text, confidence: l.confidence })) };
  } catch (e) {
    return { unscored: "error", error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
