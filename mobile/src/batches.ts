// The batch round trip, as the screens need it (backend db/340).
//
// A worker sends what they have, as a batch, whenever they like, and goes on
// capturing. The aggregator answers each batch capture by capture: everything
// not marked to be shot again is accepted and stays accepted. The assignment
// itself sits in_progress through all of it, so where it stands — rework
// waiting, all sent and with the aggregator, more to capture — is read off the
// counts here rather than off its status. Pure, so it is tested without a
// phone.

import type { Assignment, AssetRow, AssetStage, Batch } from "@/api/types";

const NONE = { draft: 0, in_review: 0, accepted: 0, rework: 0 };

/** The counts, or a reading of the old fields from an API before batches. */
export function progressOf(a: Assignment) {
  if (a.progress) return a.progress;
  if (a.status === "accepted") return { ...NONE, accepted: a.assets.ready };
  if (a.status === "submitted") return { ...NONE, in_review: a.assets.ready };
  return { ...NONE, draft: a.assets.ready };
}

/** Units still to capture: the quantity less everything uploaded and not sent
 *  back, less what is still on the phone on its way up. A capture sent back
 *  frees its slot, so retaking it is capturing one of these. */
export function remaining(a: Assignment, onPhone: number): number {
  const p = progressOf(a);
  return Math.max(0, a.quantity - p.draft - p.in_review - p.accepted - onPhone);
}

export const isRevoked = (a: Assignment): boolean => a.revoked_at != null;

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
  if (isRevoked(a)) return a.status === "accepted" ? "accepted" : "reassigned";
  if (a.status === "assigned" || a.status === "accepted") return a.status;
  const p = progressOf(a);
  if (p.rework > 0) return "rejected";
  // everything there is to send has gone, and some of it is with the aggregator
  if (p.draft === 0 && p.in_review > 0 && p.in_review + p.accepted >= a.quantity) return "submitted";
  return "in_progress";
}

/** One line under the progress bar: the parts that are not zero. */
export function summary(a: Assignment): string {
  const p = progressOf(a);
  const unit = a.task.target_unit ?? "units";
  const parts = [`${p.accepted} of ${a.quantity} ${unit} accepted`];
  if (p.in_review) parts.push(`${p.in_review} in review`);
  if (p.draft) parts.push(`${p.draft} not sent`);
  if (p.rework) parts.push(`${p.rework} to retake`);
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
