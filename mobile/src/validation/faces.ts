// Is there a face in the frame?
//
// Two briefs need this and neither could be checked before. "No people in
// shot" is a condition clients state and the pipeline has been enforcing with
// the image labeller, which reports "Person" from a fixed vocabulary and is
// not much good at it. And consent: a capture with a stranger's face in it is
// a different object, legally, from one without, whether or not the brief
// mentioned people.
//
// A FACE IS NOT A PERSON, and the asymmetry decides the severity. Someone
// photographed from behind, or in a crowd at distance, or wearing a mask, has
// no detectable face. So a face found PROVES a person is in shot; no face
// found proves nothing at all. A check whose negative is meaningless must
// never refuse work, and the info variant below says "faces", not "people",
// for the same reason.
//
// The warning fires only when the brief forbade people. Otherwise the count
// is recorded as a measurement the reviewer can see and the worker never
// does — a passer-by walking into shot is not something a worker can always
// prevent, and the shelf is still the shelf.
//
// scoreFaces, forbidsPeople and facesFinding are pure and unit-tested;
// detectFaces is the one native call.

import type { SubjectSpec } from "@/api/types";
import type { Finding } from "./rules";
import { type UnscoredReason, words } from "./subject";

/** A face's bounding box as ML Kit reports it, in the image's own pixels. */
export interface FaceBox {
  width: number;
  height: number;
  top: number;
  left: number;
}

export type FaceResult = { faces: FaceBox[] } | { unscored: UnscoredReason; error?: string };

export interface FaceScore {
  count: number;
  /** the largest face's area as a share of the frame (0..1). Zero when the
   *  frame size is unknown — the count still means something, this does not.
   *  It separates "a portrait" from "a bystander forty feet away", which is
   *  most of what a reviewer wants to know. */
  largest: number;
}

export function scoreFaces(faces: FaceBox[], width?: number | null, height?: number | null): FaceScore {
  const usable = typeof width === "number" && typeof height === "number" && width > 0 && height > 0;
  const areas = faces.map((f) => Math.max(0, f.width) * Math.max(0, f.height));
  const biggest = areas.length > 0 ? Math.max(...areas) : 0;
  return {
    count: faces.length,
    largest: usable ? Number(Math.min(1, biggest / (width * height)).toFixed(4)) : 0,
  };
}

// The words a brief uses when it means "nobody in the picture". Stemmed
// through the same splitter the subject check uses, so "People" and "person"
// and "a passer-by" all land in the same place.
const PERSON = new Set(
  ["person", "people", "human", "face", "selfie", "portrait", "bystander", "crowd", "customer", "staff"].flatMap(
    words,
  ),
);

/** Did the brief ask for no people in shot? */
export function forbidsPeople(subject?: SubjectSpec | null): boolean {
  if (!subject) return false;
  return subject.must_not_show.flatMap(words).some((w) => PERSON.has(w));
}

/** A warning when the brief forbade people and a face is there; a measurement
 *  otherwise. Never a refusal, in either case — see the header. */
export function facesFinding(s: FaceScore, subject?: SubjectSpec | null): Finding {
  const many = `${s.count} face${s.count === 1 ? "" : "s"}`;
  if (s.count > 0 && forbidsPeople(subject)) {
    return {
      code: "person_in_frame",
      severity: "warn",
      message: `${many} in a capture that asked for no people in it.`,
      score: s.largest,
      detail: { faces: s.count, largest: s.largest },
    };
  }
  return {
    code: "faces_measured",
    severity: "info",
    message: s.count === 0 ? "No faces in it." : `${many} in it.`,
    score: s.largest,
    detail: { faces: s.count, largest: s.largest },
  };
}

const REASON_TEXT: Record<UnscoredReason, string> = {
  no_labeller: "this build has no face detector",
  timeout: "the check took too long",
  error: "the face detector failed",
};

/** The phone did not look. Info, because the measurement it stands in for is
 *  info — but recorded, so a skipped check never reads as a clean one. */
export function facesUncheckedFinding(reason: UnscoredReason, error?: string): Finding {
  return {
    code: "faces_unchecked",
    severity: "info",
    message: `Faces not checked on the phone (${REASON_TEXT[reason]}).`,
    detail: error ? { reason, error } : { reason },
  };
}

const FACE_TIMEOUT_MS = 5_000;

/** What ML Kit finds in the file, or the reason it could not look.
 *
 * "fast" performance mode and no landmarks, contours or classification: the
 * question is whether a face is there and how big, not whose it is or whether
 * they are smiling. minFaceSize stays at the library default of 0.1 — a head
 * a tenth of the frame wide — because a face smaller than that is a bystander
 * rather than a subject, and chasing them would cost time at the shutter for
 * a number nobody acts on. */
export async function detectFaces(uri: string): Promise<FaceResult> {
  let mod: { detect(uri: string, options?: Record<string, unknown>): Promise<{ frame: FaceBox }[]> } | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@react-native-ml-kit/face-detection").default;
  } catch {
    mod = undefined;
  }
  if (!mod) return { unscored: "no_labeller" };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), FACE_TIMEOUT_MS);
  });
  try {
    const faces = await Promise.race([mod.detect(uri, { performanceMode: "fast" }), timeout]);
    if (faces === "timeout") return { unscored: "timeout" };
    return { faces: faces.map((f) => f.frame).filter((f): f is FaceBox => f != null) };
  } catch (e) {
    return { unscored: "error", error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
