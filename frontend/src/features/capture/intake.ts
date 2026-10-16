// Admission: which of the files a worker just picked become queue items, and
// which are refused on the spot with a reason. Pure apart from the injected
// probe, so it is tested without a browser.
//
// Cheap refusals come first (a kind the server would refuse, a file already in
// the queue, no room left) so a doomed file is never decoded or hashed.

import type { AssetRow, CaptureSpec } from "@api/types";
import { webChecks } from "./checks";
import { deriveFacts, kindOf, type Derived } from "./facts";
import type { QueueItem, Refusal } from "./item";
import { blocking, type Finding } from "./rules";

export interface AdmitContext {
  spec: CaptureSpec | null | undefined;
  targetUnit: string | null | undefined;
  /** assignment.quantity; 0 or undefined means the server set no cap */
  quantity: number | null | undefined;
  /** what the server currently holds for this assignment */
  serverRows: AssetRow[];
  /** what is already queued for this assignment */
  queued: QueueItem[];
}

export interface Accepted {
  file: File;
  derived: Derived;
  /** the warnings that ride with the presign */
  checks: Finding[];
}

export interface Admission {
  accepted: Accepted[];
  refused: Refusal[];
}

/** Whether the share is hours of footage, counted by clip length (db/510). */
export const byDuration = (unit: string | null | undefined): boolean => unit === "hours" || unit === "audio_hours";

/** What one capture is worth in the share's unit: 1, or its running time in hours. */
const worth = (unit: string | null | undefined, durationS: number | null | undefined): number =>
  byDuration(unit) ? (durationS ?? 0) / 3600 : 1;

/** How much more the server would take, in the share's unit. It counts every
 *  asset that is not rejected or erased — pending and quarantined included —
 *  so a presign that was never followed by a PUT holds a slot until it is
 *  removed. Queue items that already have an asset_id are (or are about to
 *  be) in the server's count, so only the asset-less ones are added here. */
export function room(
  ctx: Pick<AdmitContext, "quantity" | "serverRows" | "queued"> & { targetUnit?: string | null },
): number {
  if (!ctx.quantity || ctx.quantity <= 0) return Number.POSITIVE_INFINITY;
  const onServer = ctx.serverRows
    .filter((r) => r.status !== "rejected" && r.status !== "erased")
    .reduce((n, r) => n + worth(ctx.targetUnit, r.duration_s), 0);
  const inQueue = ctx.queued
    .filter((i) => i.asset_id === null && i.status !== "failed")
    .reduce((n, i) => n + worth(ctx.targetUnit, i.duration_s), 0);
  return Math.round((ctx.quantity - onServer - inQueue) * 10000) / 10000;
}

function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

let seq = 0;
function refusal(assignment_id: string, file: File, findings: Finding[], at: number): Refusal {
  return { id: `r${at}-${++seq}`, assignment_id, filename: file.name, size: file.size, findings, at };
}

export async function admit(
  assignmentId: string,
  files: File[],
  ctx: AdmitContext,
  derive: (file: File, kind: "photo" | "video") => Promise<Derived> = deriveFacts,
  now: () => number = Date.now,
): Promise<Admission> {
  const accepted: Accepted[] = [];
  const refused: Refusal[] = [];
  let left = room(ctx);
  const seen: File[] = [];

  for (const file of files) {
    const kind = kindOf(file.name);
    if (!kind) {
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "(none)";
      refused.push(refusal(assignmentId, file, [{ code: "file_type", severity: "block", message: `Captures of type ${ext} are not accepted.` }], now()));
      continue;
    }

    const already = ctx.queued.some((i) => i.file && sameFile(i.file, file)) || seen.some((s) => sameFile(s, file));
    if (already) {
      refused.push(refusal(assignmentId, file, [{ code: "duplicate", severity: "block", message: `${file.name} is already in the queue.` }], now()));
      continue;
    }
    seen.push(file);

    if (left <= 0) {
      const q = ctx.quantity ?? 0;
      const taken = Math.round((q - room(ctx)) * 100) / 100;
      refused.push(refusal(assignmentId, file, [{
        code: "quantity",
        severity: "block",
        message: byDuration(ctx.targetUnit)
          ? `This assignment is for ${q} hours of footage and already has ${taken}. Remove a clip before adding another.`
          : `This assignment is for ${q} captures and already has ${taken}. Remove one before adding another.`,
      }], now()));
      continue;
    }

    const derived = await derive(file, kind);
    const findings = webChecks(derived, ctx.spec, ctx.targetUnit);
    // a share in hours is counted by clip length, and the server refuses a clip without one
    if (kind === "video" && byDuration(ctx.targetUnit) && derived.duration == null) {
      findings.push({
        code: "duration_unknown",
        severity: "block",
        message: "This task is counted in hours of footage, and this browser could not read how long the clip runs.",
      });
    }
    const blocks = blocking(findings);
    if (blocks.length > 0) {
      refused.push(refusal(assignmentId, file, blocks, now()));
      continue;
    }
    left -= worth(ctx.targetUnit, derived.duration);
    accepted.push({ file, derived, checks: findings.filter((f) => f.severity === "warn") });
  }

  return { accepted, refused };
}

/** The line the dialog shows: "3 refused: 2 × wrong orientation, 1 × too large". */
export function groupRefusals(rs: Refusal[]): { code: string; n: number; message: string }[] {
  const by = new Map<string, { n: number; message: string }>();
  for (const r of rs) {
    for (const f of r.findings) {
      const g = by.get(f.code);
      if (g) g.n += 1;
      else by.set(f.code, { n: 1, message: f.message });
    }
  }
  return [...by.entries()]
    .map(([code, g]) => ({ code, ...g }))
    .sort((a, b) => b.n - a.n || a.code.localeCompare(b.code));
}

/** The words a worker reads for a code. */
export const refusalLabel: Record<string, string> = {
  media_kind: "wrong media kind",
  file_type: "file type not accepted",
  size: "too large",
  resolution: "below the megapixel floor",
  orientation: "wrong orientation",
  duration: "wrong length of video",
  video_lines: "below the video size asked for",
  duplicate: "already added",
  quantity: "assignment already full",
};
