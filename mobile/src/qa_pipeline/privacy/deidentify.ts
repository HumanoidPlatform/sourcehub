// Removing what the client asked to be removed before a capture leaves the
// phone: faces pixelated, Indian number plates filled, the file's location
// taken out (capture_spec.privacy.deidentification).
//
// Captures go straight to the client's bucket, so this is the only place it
// can happen, and it FAILS CLOSED: anything that goes wrong refuses the
// capture with a reason the worker can act on, and nothing uncleaned is ever
// queued. The server refuses a capture on such a task that does not say it
// was cleaned (backend media.presign_capture, 428).
//
// The deciding is here and pure where it can be (plates.ts, regions.ts); the
// finding and the drawing is the native module's (modules/deidentify).

import type { PrivacyTerms } from "@/api/types";
import type { Finding } from "@/qa_pipeline/rules/rules";
import {
  DEID_CLIP_TIMEOUT_FACTOR,
  DEID_CLIP_TIMEOUT_MIN_MS,
  DEID_FACE_EVERY_MS,
  DEID_MAX_LINES,
  DEID_PHOTO_TIMEOUT_MS,
  DEID_TEXT_EVERY_MS,
} from "@/config";
import { Deidentify, type Written } from "../../../modules/deidentify";
import { plateBoxes } from "./plates";
import { type Look, pictureRegions, spans } from "./regions";

/** The phone's account of what it removed, sent with the capture
 *  (presign `deidentified`) and recorded as asset.redaction. */
export interface Deidentified {
  version: number;
  /** the most faces in any one look: about how many people were covered */
  faces: number;
  plates: number;
  /** a clip's looks; null for a photo */
  frames: number | null;
  metadata_stripped: boolean;
}

export interface Asked {
  faces: boolean;
  plates: boolean;
  gps: boolean;
}

/** What the client asked to be removed. */
export function asked(privacy: PrivacyTerms | null | undefined): Asked {
  const d = new Set(privacy?.deidentification ?? []);
  return { faces: d.has("blur_faces"), plates: d.has("redact_plates"), gps: d.has("strip_gps") };
}

/** Does a capture on this task have to be cleaned before it is queued? */
export function needsDeidentification(privacy: PrivacyTerms | null | undefined): boolean {
  const a = asked(privacy);
  return a.faces || a.plates || a.gps;
}

/** Can this phone clean one at all? False on iOS and on builds before 0.5.0. */
export function canDeidentify(): boolean {
  return Deidentify != null;
}

/** A refusal the worker reads: the capture is deleted and they shoot again. */
export class DeidentifyFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeidentifyFailed";
  }
}

const UNABLE =
  "This phone cannot remove faces, number plates or the location before upload, which this task requires.";

async function within<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DeidentifyFailed(`${what} took too long. Shoot it again.`)), ms);
  });
  try {
    return await Promise.race([work, late]);
  } catch (e) {
    if (e instanceof DeidentifyFailed) throw e;
    // the module's own error says what broke; the worker needs what to do
    throw new DeidentifyFailed(`${what} failed (${e instanceof Error ? e.message : String(e)}). Shoot it again.`);
  } finally {
    clearTimeout(timer);
  }
}

export interface Cleaned {
  written: Written;
  summary: Deidentified;
}

/** A photo, cleaned, written to `out`. Always re-encoded, even with nothing
 *  to cover: that is what takes the location and every other EXIF field out
 *  (the module keeps only the orientation). */
export async function deidentifyPhoto(uri: string, privacy: PrivacyTerms, out: string): Promise<Cleaned> {
  const mod = Deidentify;
  if (!mod) throw new DeidentifyFailed(UNABLE);
  const a = asked(privacy);
  const pic = await within(mod.analyzeImage(uri, a.faces, a.plates), DEID_PHOTO_TIMEOUT_MS, "Finding faces and plates");
  const faces = a.faces ? pic.faces : [];
  const plates = a.plates ? plateBoxes(pic.lines) : [];
  const regions = pictureRegions(faces, plates, pic.width, pic.height);
  const written = await within(mod.redactImage(uri, regions, out, 0.92), DEID_PHOTO_TIMEOUT_MS, "Blurring the photo");
  if (!(written.bytes > 0)) throw new DeidentifyFailed("The cleaned photo came out empty. Shoot it again.");
  return {
    written,
    summary: { version: mod.version, faces: faces.length, plates: plates.length, frames: null, metadata_stripped: true },
  };
}

export type ClipProgress = (phase: "finding" | "covering", done: number, total: number) => void;

/** A clip, cleaned, written to `out`. Faces and plates are found in looks
 *  across it and covered between them (regions.ts spans); a clip that needs
 *  only its location taken out is copied without its metadata. */
export async function deidentifyClip(
  uri: string,
  privacy: PrivacyTerms,
  out: string,
  durationS: number,
  job: string,
  onProgress?: ClipProgress,
): Promise<Cleaned> {
  const mod = Deidentify;
  if (!mod) throw new DeidentifyFailed(UNABLE);
  const a = asked(privacy);
  const limit = Math.max(DEID_CLIP_TIMEOUT_MIN_MS, DEID_CLIP_TIMEOUT_FACTOR * durationS * 1000);

  if (!a.faces && !a.plates) {
    const written = await within(mod.remuxVideo(uri, out), limit, "Removing the clip's location");
    return { written, summary: { version: mod.version, faces: 0, plates: 0, frames: 0, metadata_stripped: true } };
  }

  let phase: "finding" | "covering" = "finding";
  const sub = mod.addListener("onProgress", (e) => {
    if (e.job === job) onProgress?.(phase, e.done, e.total);
  });
  try {
    const clip = await within(
      mod.analyzeVideo(uri, DEID_FACE_EVERY_MS, DEID_TEXT_EVERY_MS, a.faces, a.plates, job),
      limit,
      "Finding faces and plates in the clip",
    );
    if (clip.hdr) {
      throw new DeidentifyFailed("This clip is HDR, which cannot be cleaned on the phone. Record it in the app.");
    }
    if (clip.samples.length === 0) throw new DeidentifyFailed("The clip could not be read. Record it again.");
    const looks: Look[] = clip.samples.map((s) => ({
      tMs: s.tMs,
      regions: pictureRegions(a.faces ? s.faces : [], a.plates ? plateBoxes(s.lines) : [], clip.width, clip.height),
    }));
    phase = "covering";
    const written = await within(
      mod.redactVideo(uri, spans(looks, clip.durationMs, clip.width, clip.height), out, DEID_MAX_LINES, job),
      limit,
      "Blurring the clip",
    );
    // the cleaned clip must be the clip: a short one has lost frames nobody covered
    if (!(written.bytes > 0) || Math.abs((written.durationMs ?? clip.durationMs) - clip.durationMs) > 1_500) {
      throw new DeidentifyFailed("The cleaned clip came out wrong. Record it again.");
    }
    const most = (counts: number[]) => (counts.length ? Math.max(...counts) : 0);
    return {
      written,
      summary: {
        version: mod.version,
        faces: a.faces ? most(clip.samples.map((s) => s.faces.length)) : 0,
        plates: a.plates ? most(clip.samples.map((s) => plateBoxes(s.lines).length)) : 0,
        frames: clip.samples.length,
        metadata_stripped: true,
      },
    };
  } finally {
    sub.remove();
  }
}

/** Said before the task, beside the phone's other shortfalls (device.ts): a
 *  phone that cannot clean a capture will have every one refused at the
 *  shutter on a task that asks for it. */
export function privacyPhoneFinding(
  privacy: PrivacyTerms | null | undefined,
  available: boolean = canDeidentify(),
): Finding | null {
  if (!needsDeidentification(privacy) || available) return null;
  return {
    code: "deidentify_unavailable",
    severity: "warn",
    message: "This phone cannot remove faces, number plates or the location before upload, which this task requires.",
  };
}
