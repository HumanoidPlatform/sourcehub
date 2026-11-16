// The client's privacy terms as a crowd resource reads them, on the assignment
// brief and the offer card. Pure, so the words are tested without a phone; the
// screens only draw the lines this returns.
//
// The terms reach the phone inside the task's capture_spec (backend
// delivery.privacy_terms). Only the ones a person holding the camera acts on
// are said here: who may be in shot, children, and what must be removed. The
// lawful basis and the regulations bind the supplier, who reads them in the
// console, and would mean nothing in a shop aisle.

import type { PrivacyTerms } from "@/api/types";

const PEOPLE: Record<NonNullable<PrivacyTerms["people_in_frame"]>, string> = {
  none: "Nobody in shot. If someone is in it, the app asks before keeping it.",
  incidental: "Passers-by may appear, but people are not the subject.",
  consented: "People are the subject, and each of them must have agreed.",
};

const CHILDREN: Record<NonNullable<PrivacyTerms["minors_policy"]>, string> = {
  prohibited: "No children in shot.",
  with_parental_consent: "Children only with a parent's consent.",
};

// What must not leave the phone. Said as the client's requirement, not as
// what this app does: a build without the de-identification module cannot do
// it, and refuses the capture rather than pretend (qa_pipeline/privacy).
const REMOVED: Record<PrivacyTerms["deidentification"][number], string> = {
  blur_faces: "faces",
  redact_plates: "number plates",
  strip_gps: "the location in the files",
};

/** One line per term the client set, in the order a worker needs them. */
export function privacyLines(p: PrivacyTerms | null | undefined): string[] {
  if (!p) return [];
  const out: string[] = [];
  if (p.people_in_frame && PEOPLE[p.people_in_frame]) out.push(PEOPLE[p.people_in_frame]);
  if (p.minors_policy && CHILDREN[p.minors_policy]) out.push(CHILDREN[p.minors_policy]);
  const removed = p.deidentification.map((d) => REMOVED[d]).filter(Boolean);
  if (removed.length > 0) out.push(`Removed before upload: ${removed.join(", ")}.`);
  return out;
}
