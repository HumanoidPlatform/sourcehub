// What the phone can decide about a capture on its own, before the file ever
// enters the outbox. Pure and unit-tested, in the manner of upload/machine.ts:
// the caller gathers the facts, this says what is wrong with them. Nothing in
// here touches the network, the file system, the database or a native module.
//
// A condition the client stated is a gate, not advice.
//
//   BLOCK every condition the client set in the request: the media kind, the
//   size cap, the megapixel floor, a clip's length and frame size, the
//   orientation, the tilt tolerance, and a GPS fix where one was required.
//   The capture is deleted and never queued, so nothing that breaks a stated
//   condition enters the system at all. (A clip's frames are judged the same
//   way, one step later, in validation/clip.ts.)
//
//   WARN on the two signals that describe the FIX rather than the image, and
//   that the worker cannot do anything about: a position that fell back to the
//   last known one, and a position too loose to mean much. location.ts gives up
//   on a fresh fix after five seconds, so blocking a slow satellite lock would
//   refuse good work, and indoor accuracy worse than MAX_FIX_ACCURACY_M is
//   ordinary rather than exceptional.
//
// A consequence worth stating: because a blocked capture is destroyed before it
// is queued, its finding never reaches the server. asset.check_results now sees
// only the two warnings above. The rejection is recorded on the device instead
// (db/outbox.ts recordRejections), which is the only place it can be.

import type { CaptureSpec } from "@/api/types";
import { MAX_FIX_ACCURACY_M, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from "@/config";

export type Kind = "photo" | "video";
export type Severity = "block" | "warn";

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
  /** a scored check says how sure it was (0..1) and what it saw */
  score?: number;
  detail?: Record<string, unknown>;
}

/** What is known about a capture at the moment it lands on disk. */
export interface Facts {
  kind: Kind;
  size: number;
  /** pixel dimensions of the stored frame, when the camera reported them */
  width?: number | null;
  height?: number | null;
  /** the EXIF Orientation tag, when the camera wrote one; see displayedSize */
  exifOrientation?: number | null;
  /** seconds of video, when known: the recording timer, or the gallery's metadata */
  duration?: number | null;
  /** null when no position could be obtained at all */
  fix?: { accuracy: number | null; stale: boolean } | null;
  /** null when the device has no accelerometer, or none was read in time */
  tilt?: { off: number } | null;
  /** how the phone was actually held, sampled while the shutter was open or
   *  the recording ran; null when nothing could be read (see capture/tilt.ts) */
  heldOrientation?: "portrait" | "landscape" | null;
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

/** The picture as a viewer shows it.
 *
 * An Android camera commonly stores every frame in the sensor's landscape
 * orientation and records the quarter turn in EXIF Orientation instead of
 * rotating the pixels — so a portrait shot arrives 4000×3000 with tag 6.
 * Orientations 5–8 are the ones stored a quarter turn from how they are
 * displayed; the others (1–4, or no tag) are upright or flipped in place.
 */
export function displayedSize(
  width: number,
  height: number,
  exifOrientation?: number | null,
): { width: number; height: number } {
  const turned = exifOrientation != null && exifOrientation >= 5 && exifOrientation <= 8;
  return turned ? { width: height, height: width } : { width, height };
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

  // Length, where the client bounded it. One second of tolerance either way:
  // the recording timer and the container disagree by a frame or two, and a
  // 29.6 s clip on a 30 s task is the task's own cap rounding, not a short
  // clip. The global cap is what the camera enforces while recording; a
  // gallery pick is the one way a longer file can get here.
  if (facts.kind === "video" && facts.duration != null) {
    const lo = numeric(spec?.min_duration_s);
    const hi = Math.min(numeric(spec?.max_duration_s) ?? MAX_VIDEO_SECONDS, MAX_VIDEO_SECONDS);
    const got = Math.round(facts.duration);
    if (lo != null && facts.duration < lo - 1) {
      out.push({
        code: "duration",
        severity: "block",
        message: `This task asks for clips of at least ${lo} s; that one is ${got} s.`,
      });
    } else if (facts.duration > hi + 1) {
      out.push({
        code: "duration",
        severity: "block",
        message: `This task takes clips of up to ${hi} s; that one is ${got} s.`,
      });
    }
  }

  // Frame size for a clip: "at least 1080p" is the short side of the frame,
  // whichever way the phone was held. The megapixel floor below is the photo
  // equivalent; a client states one or the other.
  const lines = numeric(spec?.min_video_lines);
  if (lines != null && facts.kind === "video" && facts.width && facts.height) {
    const short = Math.min(facts.width, facts.height);
    if (short < lines) {
      out.push({
        code: "video_lines",
        severity: "block",
        message: `This task asks for ${lines}p video; that clip is ${short}p.`,
      });
    }
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
        severity: "block",
        message: `This task asks for ${min} megapixels; that capture is ${mp.toFixed(1)}.`,
      });
    }
  }

  // Orientation, from how the phone was HELD where that was measured.
  //
  // A recording's own frame is not evidence: with the app locked to portrait
  // the encoder tags every clip portrait however the phone was turned, and
  // reading the first frame refused landscape clips that were shot correctly.
  // The accelerometer knows (capture/tilt.ts heldOrientation), and the capture
  // screen samples it for the length of the recording.
  //
  // A photo has no such history and does not need one: its EXIF Orientation
  // and stored size say how it will be displayed, which displayedSize reads.
  // A clip picked from the gallery has neither, so the frame is the fallback.
  const want = wantedOrientation(spec?.orientation);
  if (want) {
    const shown =
      facts.width && facts.height
        ? displayedSize(facts.width, facts.height, facts.exifOrientation)
        : null;
    const got =
      facts.kind === "video"
        ? (facts.heldOrientation ?? (shown ? (shown.width >= shown.height ? "landscape" : "portrait") : null))
        : shown
          ? shown.width >= shown.height
            ? "landscape"
            : "portrait"
          : null;
    if (got && got !== want) {
      out.push({
        code: "orientation",
        severity: "block",
        message: `This task asks for ${want} captures; the phone was held ${got}.`,
      });
    }
  }

  // Squareness, where the client asked for it. Silent otherwise: tilt means
  // nothing to a walkthrough video or a portrait of a person, and refusing a
  // capture over it unasked would stop work a client never questioned.
  const maxTilt = numeric(spec?.max_tilt_deg);
  if (maxTilt != null && facts.tilt && facts.tilt.off > maxTilt) {
    out.push({
      code: "tilt",
      severity: "block",
      message: `This task asks for captures within ${maxTilt}°; the phone was ${Math.round(facts.tilt.off)}° off square.`,
    });
  }

  if (spec?.require_gps) {
    const fix = facts.fix ?? null;
    if (!fix) {
      out.push({
        code: "gps_missing",
        severity: "block",
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
