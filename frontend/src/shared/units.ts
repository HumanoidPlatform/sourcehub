// Crowd work in its task's own unit (db/510).
//
// A share of photos, videos or units is counted one capture at a time; a share
// of hours of footage adds up its clips' running time. The server sends both
// readings of an assignment's progress (the capture counts, and the same four
// in the task's unit as *_units); these pick the one that measures the share.

import type { Assignment, CaptureSpec } from "@api/types";
import { quantityWords } from "@shared/pricing";

/** The phone a task demands, as the brief reads it: "Android 12+ · iOS 16+ ·
 *  4 GB RAM or more". Null when the client set no device requirement, and
 *  then nothing is asked of any phone. The worker's phone warns of a shortfall
 *  before the task and refuses captures that fall short (mobile
 *  qa_pipeline/device/device.ts); the free-text notes it cannot check. */
export function deviceWords(spec: CaptureSpec | null | undefined): string | null {
  if (!spec) return null;
  const parts: string[] = [];
  if (spec.min_android_version) parts.push(`Android ${spec.min_android_version}+`);
  if (spec.min_ios_version) parts.push(`iOS ${spec.min_ios_version}+`);
  if (spec.min_ram_gb) parts.push(`${spec.min_ram_gb} GB RAM or more`);
  return parts.length ? parts.join(" · ") : null;
}

/** Whether a unit is measured by running time rather than counted. */
export const byDuration = (unit: string | null | undefined): boolean => unit === "hours" || unit === "audio_hours";

/** At most two places: what a share of hours is stored to. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** "photos", "hours of footage": the unit as it reads after a number. */
export function unitPlural(unit: string | null | undefined): string {
  return quantityWords(2, unit).replace(/^2 /, "");
}

/** "3 photos", "1.25 hours of footage". */
export function amountWords(n: number, unit: string | null | undefined): string {
  return quantityWords(round2(n), unit);
}

/** An assignment's four stages in its task's unit. An API from before db/510
 *  sends no units, and the counts are then the only reading there is. */
export function unitsOf(a: Assignment): { draft: number; in_review: number; accepted: number; rework: number } {
  const p = a.progress ?? { draft: 0, in_review: 0, accepted: 0, rework: 0 };
  if (p.measure !== "duration") return p;
  return {
    draft: p.draft_units ?? 0,
    in_review: p.in_review_units ?? 0,
    accepted: p.accepted_units ?? 0,
    rework: p.rework_units ?? 0,
  };
}
