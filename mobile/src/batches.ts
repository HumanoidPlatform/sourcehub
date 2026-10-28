// The batch round trip, as the screens need it (backend db/350).
//
// A worker sends what they have, as a batch, whenever they like, and goes on
// capturing. The aggregator answers each batch capture by capture: everything
// not marked to be shot again is accepted and stays accepted. The assignment
// itself sits in_progress through all of it, so where it stands — rework
// waiting, all sent and with the aggregator, more to capture — is read off the
// counts here rather than off its status. Pure, so it is tested without a
// phone.

import type { Assignment, AssetRow, AssetStage, Batch, CaptureSpec } from "@/api/types";

const NONE = { draft: 0, in_review: 0, accepted: 0, rework: 0 };

/** The counts, or a reading of the old fields from an API before batches. */
export function progressOf(a: Assignment) {
  if (a.progress) return a.progress;
  if (a.status === "accepted") return { ...NONE, accepted: a.assets.ready };
  if (a.status === "submitted") return { ...NONE, in_review: a.assets.ready };
  return { ...NONE, draft: a.assets.ready };
}

/** Whether the share is counted in captures or in hours of footage, where
 *  each clip is worth its running time (db/510). */
export function byDuration(a: Assignment): boolean {
  return (a.progress?.measure ?? (isHoursUnit(a.task.target_unit) ? "duration" : "count")) === "duration";
}

const isHoursUnit = (unit: string | null | undefined): boolean => unit === "hours" || unit === "audio_hours";

/** The four stages in the share's own unit: the counts, or hours of footage. */
export function unitsOf(a: Assignment) {
  const p = progressOf(a);
  if (!byDuration(a)) return p;
  return {
    draft: a.progress?.draft_units ?? 0,
    in_review: a.progress?.in_review_units ?? 0,
    accepted: a.progress?.accepted_units ?? 0,
    rework: a.progress?.rework_units ?? 0,
  };
}

/** What captures still on the phone come to in the share's unit: one each, or
 *  their running time in hours. */
export function localUnits(a: Assignment, rows: { duration_s?: number | null }[]): number {
  if (!byDuration(a)) return rows.length;
  return rows.reduce((h, r) => h + (r.duration_s ?? 0) / 3600, 0);
}

/** Units still to capture: the quantity less everything uploaded and not sent
 *  back, less what is still on the phone on its way up. A capture sent back
 *  frees its slot, so retaking it is capturing one of these. onPhone is in the
 *  share's unit (localUnits). */
export function remaining(a: Assignment, onPhone: number): number {
  const u = unitsOf(a);
  const left = a.quantity - u.draft - u.in_review - u.accepted - onPhone;
  // hours are sums of seconds: four places, so 0.00001 h is not "left"
  return Math.max(0, Math.round(left * 10000) / 10000);
}

const UNIT_WORDS: Record<string, [string, string]> = {
  photos: ["photo", "photos"],
  videos: ["video", "videos"],
  records: ["unit", "units"],
  hours: ["hour of footage", "hours of footage"],
  audio_clips: ["audio clip", "audio clips"],
  audio_hours: ["hour of audio", "hours of audio"],
  responses: ["response", "responses"],
  sites: ["site", "sites"],
};

/** The unit as a person reads it: "3 photos", "1 unit". Without n, the plural. */
export function unitText(unit: string | null | undefined, n?: number): string {
  const [one, many] = UNIT_WORDS[unit ?? ""] ?? [unit ?? "unit", unit ?? "units"];
  if (n == null) return many;
  return `${n} ${n === 1 ? one : many}`;
}

/** Hours of footage as a person reads them: "40 s", "12 min", "1 h 30 min". */
export function hoursText(h: number): string {
  const seconds = Math.round(h * 3600);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  if (hh && mm) return `${hh} h ${mm} min`;
  return hh ? `${hh} h` : `${mm} min`;
}

const clips = (n: number) => `${n} clip${n === 1 ? "" : "s"}`;

export const isRevoked = (a: Assignment): boolean => a.revoked_at != null;

/** Whether another capture may be taken: the share has room. `onPhone` is in
 *  the share's unit (localUnits). There is no other ceiling: a worker uploads
 *  whatever share the aggregator gave them. */
export function canCapture(a: Assignment, onPhone: number): boolean {
  if (isRevoked(a)) return false;
  if (!["assigned", "in_progress", "rejected"].includes(a.status)) return false;
  return remaining(a, onPhone) > 0;
}

/** Why Send is not offered, or null when it is. */
export function cannotSend(a: Assignment, pendingLocal: number, failedLocal: number): string | null {
  if (isRevoked(a)) return "This task was given to someone else.";
  if (!["in_progress", "rejected"].includes(a.status)) return "Start the assignment first.";
  if (progressOf(a).draft < 1) {
    return pendingLocal > 0 ? "Wait for the uploads to finish." : "Capture something new to send.";
  }
  if (failedLocal > 0) return "Retry or discard the failed captures first.";
  return null;
}

/** Where the board files an assignment: what needs the worker first. */
export type BoardStatus = "rejected" | "in_progress" | "assigned" | "submitted" | "accepted" | "reassigned";

export function boardStatus(a: Assignment): BoardStatus {
  // Reassigned is what the worker needs to know, accepted or not: the server
  // accepts a handed-over share once it is reviewed, but to the person who
  // was taken off the task that reads as a job finished, which it was not.
  if (isRevoked(a)) return "reassigned";
  if (a.status === "assigned" || a.status === "accepted") return a.status;
  const p = progressOf(a);
  const u = unitsOf(a);
  if (p.rework > 0) return "rejected";
  // everything there is to send has gone, and some of it is with the aggregator
  if (p.draft === 0 && p.in_review > 0 && u.in_review + u.accepted >= a.quantity) return "submitted";
  return "in_progress";
}

/** One line under the progress bar: the parts that are not zero. In hours,
 *  the share is time and the parts are clips. */
export function summary(a: Assignment): string {
  const p = progressOf(a);
  const u = unitsOf(a);
  const hours = byDuration(a);
  if (isRevoked(a)) {
    return hours
      ? `Handed over · ${hoursText(u.in_review + u.accepted)}`
      : `Handed over · ${unitText(a.task.target_unit, p.in_review + p.accepted)}`;
  }
  const parts = [
    hours
      ? `${hoursText(u.accepted)} of ${hoursText(a.quantity)} accepted`
      : `${p.accepted} of ${a.quantity} ${unitText(a.task.target_unit)} accepted`,
  ];
  const n = (k: number) => (hours ? clips(k) : String(k));
  if (p.in_review) parts.push(`${n(p.in_review)} in review`);
  if (p.draft) parts.push(`${n(p.draft)} not sent`);
  if (p.rework) parts.push(`${n(p.rework)} to retake`);
  return parts.join(" · ");
}

export interface BatchGroup {
  batch: Batch | null;
  batch_no: number | null;
  assets: AssetRow[];
}

export interface Sections {
  /** on the server, not sent yet — plus any still finishing its upload */
  draft: AssetRow[];
  rework: AssetRow[];
  /** newest batch first */
  inReview: BatchGroup[];
  accepted: BatchGroup[];
}

/** The server's captures, sorted into what the worker can still act on and
 *  what is settled. A capture replaced by a retake is left out: the retake
 *  stands in its place. An API from before batches sends no stage, and its
 *  captures read as the old screen read them. */
export function sections(assets: AssetRow[], batches: Batch[] = []): Sections {
  const byNo = new Map(batches.map((b) => [b.batch_no, b]));
  const out: Sections = { draft: [], rework: [], inReview: [], accepted: [] };
  const group = (list: BatchGroup[], x: AssetRow) => {
    const no = x.batch_no ?? null;
    let g = list.find((y) => y.batch_no === no);
    if (!g) {
      g = { batch: no != null ? (byNo.get(no) ?? null) : null, batch_no: no, assets: [] };
      list.push(g);
    }
    g.assets.push(x);
  };
  for (const x of assets) {
    const st: AssetStage = x.stage ?? (x.status === "rejected" ? "rework" : x.status === "ready" ? "draft" : "uploading");
    if (st === "replaced") continue;
    if (st === "rework") out.rework.push(x);
    else if (st === "in_review") group(out.inReview, x);
    else if (st === "accepted") group(out.accepted, x);
    else out.draft.push(x);
  }
  const newest = (p: BatchGroup, q: BatchGroup) => (q.batch_no ?? 0) - (p.batch_no ?? 0);
  out.inReview.sort(newest);
  out.accepted.sort(newest);
  return out;
}

/** What a reassigned worker is told about the captures they handed over. */
export function handedOver(a: Assignment): string {
  const p = progressOf(a);
  const n = p.in_review + p.accepted;
  if (n === 0) return "Nothing you captured was sent. Nothing more is needed from you on it.";
  const parts = [`${p.accepted} accepted`];
  if (p.in_review) parts.push(`${p.in_review} in review`);
  const what = byDuration(a)
    ? `${clips(n)} (${hoursText(unitsOf(a).in_review + unitsOf(a).accepted)})`
    : unitText(a.task.target_unit, n);
  return `Your ${what} ${n === 1 ? "was" : "were"} handed over for review: ${parts.join(", ")}.`;
}

/** What a worker is told on an assignment no longer on their list: its task
 *  ended (db/600) or their share was cancelled. unsent is how many captures
 *  for it are still on the phone; they can never be sent, and the worker
 *  removes them (the phone never deletes them on its own: a list fetched for
 *  another organisation the worker belongs to would look the same). */
export function takenOff(unsent: number): string {
  const head = "This work was taken off you: the task ended or your share was cancelled. Nothing more is needed from you on it.";
  if (!unsent) return head;
  return `${head} ${unsent} capture${unsent === 1 ? "" : "s"} still on this phone can never be sent.`;
}

/** Assignments with captures queued on this phone that are no longer on the
 *  worker's list: work taken off them, whose captures can never be sent. */
export function strandedAssignments(
  outbox: Record<string, { queued: number; failed: number }>,
  listed: readonly { id: string }[],
): string[] {
  const held = new Set(listed.map((a) => a.id));
  return Object.entries(outbox)
    .filter(([id, n]) => !held.has(id) && n.queued + n.failed > 0)
    .map(([id]) => id);
}

/** The one thing to do next on an assignment, and the quieter second one.
 *  primary null means there is nothing for the worker to do right now. */
export type Action = "retake" | "send" | "capture" | "start";

export interface NextAction {
  primary: Action | null;
  secondary: Action | null;
  /** shown in place of a button when there is none */
  waiting: string | null;
}

/** onPhoneUnits: what the captures still on the phone come to in the share's
 *  unit (localUnits); for a counted share, simply how many there are. */
export function nextAction(
  a: Assignment,
  pendingLocal: number,
  failedLocal: number,
  onPhoneUnits: number = pendingLocal + failedLocal,
): NextAction {
  const none = { primary: null, secondary: null, waiting: null };
  if (isRevoked(a) || a.status === "accepted" || a.status === "cancelled") return none;
  if (a.status === "assigned") return { primary: "start", secondary: null, waiting: null };
  const p = progressOf(a);
  const can: Action[] = [];
  if (p.rework > 0) can.push("retake");
  if (cannotSend(a, pendingLocal, failedLocal) == null) can.push("send");
  if (canCapture(a, onPhoneUnits)) can.push("capture");
  const waiting =
    can.length === 0
      ? pendingLocal > 0
        ? "Uploading…"
        : p.in_review > 0
          ? "Waiting for review"
          : null
      : null;
  return { primary: can[0] ?? null, secondary: can[1] ?? null, waiting };
}

/** The capture rules a worker reads, in words rather than keys. */
export function requirementLabels(spec: CaptureSpec | null | undefined): string[] {
  if (!spec) return [];
  const out: string[] = [];
  const media = Array.isArray(spec.media) ? spec.media : spec.media ? [spec.media] : [];
  const kinds = media.map((m) => String(m).toLowerCase());
  if (kinds.includes("photo") && kinds.includes("video")) out.push("Photos or videos");
  else if (kinds.includes("photo")) out.push("Photos only");
  else if (kinds.includes("video")) out.push("Videos only");
  if (spec.min_duration_s && spec.max_duration_s) out.push(`${spec.min_duration_s}–${spec.max_duration_s} s per clip`);
  else if (spec.max_duration_s) out.push(`Up to ${spec.max_duration_s} s per clip`);
  if (spec.orientation === "portrait" || spec.orientation === "landscape") out.push(`Hold it ${spec.orientation}`);
  if (spec.require_gps) out.push("Location on");
  if (spec.min_megapixels) out.push(`${spec.min_megapixels} MP minimum`);
  if (spec.min_video_lines) out.push(`${spec.min_video_lines}p minimum`);
  if (spec.max_tilt_deg) out.push(`Within ${spec.max_tilt_deg}° of level`);
  if (spec.allow_library) out.push("Clips from the gallery allowed");
  // the phone the task demands; qa_pipeline/device/device.ts holds the worker to it before the start
  if (spec.min_android_version) out.push(`Android ${spec.min_android_version}+`);
  if (spec.min_ios_version) out.push(`iOS ${spec.min_ios_version}+`);
  if (spec.min_ram_gb) out.push(`${spec.min_ram_gb} GB RAM or more`);
  return out;
}

/** A review note the console wrote from the marks ("2 to retake: 1 blurred,
 *  1 other."): it repeats the reasons each capture already carries, so the
 *  screen shows only a note the reviewer wrote themselves. */
export function ownNote(note: string | null | undefined): string | null {
  const n = (note ?? "").trim();
  if (!n || /^\d+ to (retake|shoot again)\b/i.test(n)) return null;
  return n;
}
