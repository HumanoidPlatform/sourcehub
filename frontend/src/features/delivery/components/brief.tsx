// What a capture was asked to satisfy, in one place.
//
// This used to live privately inside features/delivery/pages.tsx, where the
// task dialog showed it to whoever opened a task. The gate-1 review dialog —
// the one place a person actually judges a frame — showed none of it: the
// reviewer had the captures and not the conditions, and was deciding whether a
// photograph met a tilt tolerance, an orientation and a subject that were never
// on screen. Moving it here lets both read the same brief, and keeps pages.tsx
// from importing a component that imports pages.tsx.

import { Dl } from "@ds/primitives";
import type { CaptureSpec, PrivacyTerms, SubjectSpec } from "@api/types";
import {
  DEIDENTIFICATION, LAWFUL_BASES, labelOf, labelsOf, MINORS_POLICIES, PEOPLE_IN_FRAME,
} from "@features/marketplace/vocabularies";
import { mediaList } from "@shared/format";
import { deviceWords } from "@shared/units";

/** The stated conditions as one line. Anything the client left blank is absent
 *  rather than shown as "none": an unset tolerance is not a tolerance of zero. */
export function captureRequirementText(spec: CaptureSpec): string {
  const parts: string[] = [];
  const media = mediaList(spec);
  if (media.length) parts.push(`Media: ${media.join(", ")}`);
  if (spec.languages?.length) parts.push(`Languages: ${spec.languages.join(", ")}`);
  if (spec.require_gps) parts.push("GPS required");
  if (spec.orientation) parts.push(`Orientation: ${spec.orientation}`);
  if (spec.min_megapixels) parts.push(`Minimum ${spec.min_megapixels} MP`);
  if (spec.max_tilt_deg) parts.push(`Squareness within ${spec.max_tilt_deg} degrees`);
  if (spec.max_duration_s) parts.push(`Maximum ${spec.max_duration_s}s`);
  const device = deviceWords(spec);
  if (device) parts.push(device);
  if (spec.notes) parts.push(spec.notes);
  return parts.length ? parts.join(" · ") : "No special capture constraints recorded";
}

/** The client's privacy terms as a task carries them (capture_spec.privacy),
 *  in words. The rules a frame is judged by come first: who may be in it,
 *  children, what is removed before upload. `legal` adds the terms a supplier
 *  is bound by but a reviewer does not judge a frame on. Anything the client
 *  left blank is absent, as in captureRequirementText. */
export function privacyRows(
  p: PrivacyTerms | null | undefined,
  { legal = false }: { legal?: boolean } = {},
): [string, React.ReactNode][] {
  if (!p) return [];
  const rows: [string, React.ReactNode][] = [];
  const people = PEOPLE_IN_FRAME.find((o) => o.value === p.people_in_frame);
  if (people) rows.push(["People in frame", `${people.label}: ${people.hint}`]);
  if (p.minors_policy) rows.push(["Children", labelOf(MINORS_POLICIES, p.minors_policy)]);
  if (p.deidentification.length) {
    rows.push(["Removed before upload", labelsOf(DEIDENTIFICATION, p.deidentification)]);
  }
  if (legal) {
    if (p.lawful_basis) rows.push(["Lawful basis", labelOf(LAWFUL_BASES, p.lawful_basis)]);
    if (p.regulations.length) rows.push(["Regulations", p.regulations.join(", ")]);
    if (p.biometric_processing) rows.push(["Biometric processing", "Yes: a stricter regime applies"]);
  }
  return rows;
}

export function subjectRows(s: SubjectSpec | null | undefined): [string, React.ReactNode][] {
  if (!s) return [];
  return [[
    "Subject",
    <span key="subj">
      <b>{s.domain}</b>
      {s.must_show.length > 0 && <> · must show {s.must_show.join(", ")}</>}
      {s.must_not_show.length > 0 && <> · not {s.must_not_show.join(", ")}</>}
    </span>,
  ]];
}

/** The brief beside the frames, for a reviewer deciding a batch.
 *
 * Deliberately compact: it is reference material read at a glance while the
 * eye is on the pictures, not the task dialog's full account. A task carrying
 * no spec at all renders nothing rather than an empty panel promising
 * conditions that were never set.
 *
 * The acceptance criteria are the client's, frozen at award (db/560). The
 * reviewer is deciding whether captures meet them, and until now the words
 * were on the contract page only, which a supplier never opens.
 */
export function Brief({
  spec,
  instructions,
  acceptance,
}: {
  spec: CaptureSpec | undefined;
  instructions?: string | null;
  acceptance?: string | null;
}) {
  const subject = subjectRows(spec?.subject);
  const privacy = privacyRows(spec?.privacy);
  // every task carries `privacy` now, stated or not: it is not a capture
  // condition, and a spec holding nothing else states none
  const hasSpec = spec != null && Object.keys(spec).some((k) => k !== "privacy");
  if (!hasSpec && !instructions && !acceptance && privacy.length === 0) return null;
  return (
    <section data-testid="review-brief">
      <div className="eyebrow" style={{ marginBottom: 8 }}>What was asked</div>
      <Dl
        rows={[
          ...subject,
          ...(hasSpec
            ? ([["Capture requirements", captureRequirementText(spec)]] as [string, React.ReactNode][])
            : []),
          ...(instructions ? ([["Task instructions", instructions]] as [string, React.ReactNode][]) : []),
          ...(acceptance ? ([["Acceptance criteria", acceptance]] as [string, React.ReactNode][]) : []),
          ...privacy,
        ]}
      />
    </section>
  );
}
