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

/** How many more captures the server would take. It counts every asset that
 *  is not rejected or erased — pending and quarantined included — so a
 *  presign that was never followed by a PUT holds a slot until it is removed.
 *  Queue items that already have an asset_id are (or are about to be) in the
 *  server's count, so only the asset-less ones are added here. */
export function room(ctx: Pick<AdmitContext, "quantity" | "serverRows" | "queued">): number {
  if (!ctx.quantity || ctx.quantity <= 0) return Number.POSITIVE_INFINITY;
  const onServer = ctx.serverRows.filter((r) => r.status !== "rejected" && r.status !== "erased").length;
  const inQueue = ctx.queued.filter((i) => i.asset_id === null && i.status !== "failed").length;
  return ctx.quantity - onServer - inQueue;
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
      const taken = q - room(ctx);
      refused.push(refusal(assignmentId, file, [{
        code: "quantity",
        severity: "block",
        message: `This assignment is for ${q} captures and already has ${taken}. Remove one before adding another.`,
      }], now()));
      continue;
    }

    const derived = await derive(file, kind);
    const findings = webChecks(derived, ctx.spec, ctx.targetUnit);
    const blocks = blocking(findings);
    if (blocks.length > 0) {
      refused.push(refusal(assignmentId, file, blocks, now()));
      continue;
    }
    left -= 1;
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
  duration: "video too long",
  duplicate: "already added",
  quantity: "assignment already full",
};
