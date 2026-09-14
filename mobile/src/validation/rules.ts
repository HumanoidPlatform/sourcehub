// What the phone can decide about a capture on its own, before the file ever
// enters the outbox. Pure and unit-tested, in the manner of upload/machine.ts:
// the caller gathers the facts, this says what is wrong with them. Nothing in
// here touches the network, the file system, the database or a native module.
//
// The line between block and warn is deliberate and narrow.
//
//   BLOCK only what the server is certain to refuse — the media kind and the
//   size cap, both enforced in backend modules/media/service.py. The upload is
//   provably wasted, so refusing here costs the worker a message instead of a
//   file over a field connection.
//
//   WARN on everything else: a requirement the client stated that the server
//   does not enforce, where a reviewer may still accept the capture. A hard
//   block there would throw away real work a worker often cannot retake — the
//   phone indoors with no fix, the only camera they have.

import type { CaptureSpec } from "@/api/types";
import { MAX_FIX_ACCURACY_M, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from "@/config";

export type Kind = "photo" | "video";
export type Severity = "block" | "warn";

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
}

/** What is known about a capture at the moment it lands on disk. */
export interface Facts {
  kind: Kind;
  size: number;
  /** pixel dimensions, when the camera reported them */
  width?: number | null;
  height?: number | null;
  /** null when no position could be obtained at all */
  fix?: { accuracy: number | null; stale: boolean } | null;
}

/** The kinds this task accepts.
 *
 * Mirrors _allowed_kinds in backend modules/media/service.py, including its
 * tolerance of the older shape: media has been a LIST since a task began
 * inheriting the client's capture spec, and tasks created before that carry a
 * bare string. The server's vocabulary is image/video, the phone's is
 * photo/video; the words differ, the rule does not.
 */
export function mediaKinds(spec: CaptureSpec | null | undefined, targetUnit?: string | null): Kind[] {
  const raw = spec?.media;
  const listed = typeof raw === "string" ? [raw] : Array.isArray(raw) ? raw : [];
  const kinds = new Set<Kind>();
  for (const m of listed) {
    const v = String(m).trim().toLowerCase();
    if (v === "both") {
      kinds.add("photo");
      kinds.add("video");
    } else if (v.startsWith("photo") || v.startsWith("image")) {
      kinds.add("photo");
    } else if (v.startsWith("video") || v.startsWith("clip")) {
      kinds.add("video");
    }
  }
  if (kinds.size > 0) return [...kinds];
  const unit = (targetUnit ?? "").toLowerCase();
  if (unit.startsWith("photo") || unit.startsWith("image")) return ["photo"];
  if (unit.startsWith("video") || unit.startsWith("clip")) return ["video"];
  return ["photo", "video"];
}

function mb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/** a positive finite number, or null for "the client did not say" */
function numeric(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function wantedOrientation(v: unknown): "landscape" | "portrait" | null {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "landscape" || s === "portrait" ? s : null;
}

export function checkCapture(
  facts: Facts,
  spec: CaptureSpec | null | undefined,
  targetUnit?: string | null,
): Finding[] {
  const out: Finding[] = [];

  const allowed = mediaKinds(spec, targetUnit);
  if (!allowed.includes(facts.kind)) {
    out.push({
      code: "media_kind",
      severity: "block",
      message: `This task takes ${allowed.join(" or ")} captures; that one is a ${facts.kind}.`,
    });
  }

  const cap = facts.kind === "video" ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
  if (facts.size > cap) {
    out.push({
      code: "size",
      severity: "block",
      message: `A ${facts.kind} is capped at ${Math.round(cap / (1024 * 1024))} MB; that one is ${mb(facts.size)} MB.`,
    });
  }

  // Resolution and orientation both need dimensions, and the megapixel floor
  // is asked for photos only — the console labels the field "Photo only".
  const min = numeric(spec?.min_megapixels);
  if (min != null && facts.kind === "photo" && facts.width && facts.height) {
    const mp = (facts.width * facts.height) / 1_000_000;
    // A "12 MP" sensor produces a hair under 12 million actual pixels, so a
    // client asking for 12 would otherwise flag every shot from the very
    // camera they meant to specify.
    if (mp < min - 0.05) {
      out.push({
        code: "resolution",
        severity: "warn",
        message: `This task asks for ${min} megapixels; that capture is ${mp.toFixed(1)}.`,
      });
    }
  }

  const want = wantedOrientation(spec?.orientation);
  if (want && facts.width && facts.height) {
    const got = facts.width >= facts.height ? "landscape" : "portrait";
    if (got !== want) {
      out.push({
        code: "orientation",
        severity: "warn",
        message: `This task asks for ${want} captures; the phone was held ${got}.`,
      });
    }
  }

  if (spec?.require_gps) {
    const fix = facts.fix ?? null;
    if (!fix) {
      out.push({
        code: "gps_missing",
        severity: "warn",
        message: "This task needs a location on every capture and the phone has no fix.",
      });
    } else if (fix.stale) {
      // location.ts falls back to the last known position when a fresh one
      // does not arrive in time, and that may be from anywhere the phone
      // has been today.
      out.push({
        code: "gps_stale",
        severity: "warn",
        message: "No fresh fix arrived; this capture carries the phone's last known location.",
      });
    } else if (fix.accuracy != null && fix.accuracy > MAX_FIX_ACCURACY_M) {
      out.push({
        code: "gps_accuracy",
        severity: "warn",
        message: `The fix is only accurate to about ${Math.round(fix.accuracy)} m.`,
      });
    }
  }

  return out;
}

export function blocking(findings: Finding[]): Finding[] {
  return findings.filter((f) => f.severity === "block");
}
