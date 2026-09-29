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
import type { CaptureSpec, SubjectSpec } from "@api/types";
import { mediaList } from "@shared/format";

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
  if (spec.notes) parts.push(spec.notes);
  return parts.length ? parts.join(" · ") : "No special capture constraints recorded";
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
 */
export function Brief({
  spec,
  instructions,
}: {
  spec: CaptureSpec | undefined;
  instructions?: string | null;
}) {
  const subject = subjectRows(spec?.subject);
  const hasSpec = spec != null && Object.keys(spec).length > 0;
  if (!hasSpec && !instructions) return null;
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
        ]}
      />
    </section>
  );
}
