// What the subject check shares with the other checks.
//
// The check itself is CLIP's (clipSubject.ts). It replaced ML Kit's image
// labeller, whose fixed vocabulary could not name most subjects. This file
// keeps the pieces other checks lean on: the word stemmer (the CLIP negatives'
// word filter, and the face check's "no people" reading of must_not_show),
// the reasons a check could not look, and the subject_unscored warning that
// says so.
//
// Wherever the subject check cannot answer — an older build without the
// model, the model still downloading, a native error — it says WHY, and that
// reason rides with the upload as a warning of its own. A skipped check that
// looks exactly like a passed one cost a day of "is the pipeline even
// there?"; it is not allowed to be silent again.

import type { Finding } from "@/qa_pipeline/rules/rules";

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

/** Why an on-device ML Kit check (faces, text) gave no answer; `no_labeller`
 *  is its native module missing from the build. */
export type ModuleUnscored = "no_labeller" | "timeout" | "error";

/** Why any check gave no answer: the ML Kit checks' reasons, and the subject
 *  check's model still downloading or missing from the build. */
export type UnscoredReason = ModuleUnscored | "loading" | "no_model";

const REASON_TEXT: Record<UnscoredReason, string> = {
  no_labeller: "this build cannot run the check",
  timeout: "the check took too long",
  error: "the check failed",
  loading: "the subject model is still downloading",
  no_model: "this build has no subject model",
};

/** The warning a skipped subject check becomes. It never blocks and never
 *  asks the worker anything — they did nothing wrong — but the reviewer at
 *  gate 1 can see the phone did not look, instead of assuming it looked and
 *  approved. */
export function unscoredFinding(reason: UnscoredReason, error?: string): Finding {
  return {
    code: "subject_unscored",
    severity: "warn",
    message: `Subject not checked on the phone (${REASON_TEXT[reason]}).`,
    detail: error ? { reason, error } : { reason },
  };
}
