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
// scoreSubject and subjectFinding are pure and unit-tested; labelImage is the
// one native call, and it answers null wherever the labeller is not there
// (Expo Go, an older build) so the check is simply skipped.

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

const LABEL_TIMEOUT_MS = 2_000;

/** What ML Kit sees in the file; null when there is no labeller to ask.
 *
 * The module is required lazily: in Expo Go it does not exist and the import
 * would throw at startup. EXPO_PUBLIC_SUBJECT_STUB="Floor:0.9,Hand:0.6" makes
 * every photo "see" those labels, so the keep-or-retake flow can be tried in
 * Expo Go without a development build. */
export async function labelImage(uri: string): Promise<Label[] | null> {
  const stub = process.env.EXPO_PUBLIC_SUBJECT_STUB;
  if (stub) {
    return stub.split(",").map((s: string) => {
      const [text, conf] = s.split(":");
      return { text: text.trim(), confidence: Number(conf ?? 0.8) };
    });
  }
  let mod: { label(uri: string): Promise<Label[]> };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@react-native-ml-kit/image-labeling").default;
  } catch {
    return null;
  }
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), LABEL_TIMEOUT_MS));
    const labels = await Promise.race([mod.label(uri), timeout]);
    return labels ? labels.map((l) => ({ text: l.text, confidence: l.confidence })) : null;
  } catch {
    return null;
  }
}
