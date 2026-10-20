// From a camera result to an outbox row: move the file into private storage,
// record when and where, check it against what the task asked for, enqueue,
// kick the uploader. Works offline; the upload happens whenever it can.
//
// The check happens here, after the file is on disk with a known size and the
// fix has resolved, and before anything enters the queue — the one moment when
// a capture can be refused without having cost a byte of the worker's data.

import * as Crypto from "expo-crypto";
import { useCallback } from "react";
import { loadSession } from "@/api/client";
import type { CaptureSpec, SubjectSpec } from "@/api/types";
import { CLIP_IMAGE_WIDTH, FRAMES_BUDGET_MS, SUBJECT_DIALOG } from "@/config";
import { insertCapture, recordRejections } from "@/db/outbox";
import { uploader } from "@/upload/uploader";
import { frameTimes, judgeFrames, stillFindings, uncheckedFinding } from "@/qa_pipeline/clip/clip";
import { detectFaces, facesFinding, facesUncheckedFinding, scoreFaces } from "@/qa_pipeline/faces/faces";
import { blocking, checkCapture, displayedSize, type Finding } from "@/qa_pipeline/rules/rules";
import { recogniseText, scoreText, textFinding, textUnreadFinding } from "@/qa_pipeline/text/text";
import {
  type ClipExampleSet,
  clipExamplesFinding,
  clipExamplesUncheckedFinding,
  clipFinding,
  clipMeasured,
  type ClipResult,
  clipUnscoredFinding,
  exampleSimilarity,
  examplesMissed,
  forbiddenFinding,
  type ForbiddenMargin,
  framesForbidden,
  framesMargin,
  photoDetail,
  scoreImage,
} from "@/qa_pipeline/subject/clipSubject";
import { cachedCamera } from "@/qa_pipeline/device/camera";
import { deviceFinding, deviceRefusals, thisDevice } from "@/qa_pipeline/device/device";
import { deleteLocal, moveIntoPrivateDir } from "@/capture/files";
import { frameAt, greyImage, rgbaImage, sampleFrames } from "@/qa_pipeline/clip/frames";
import { blurFinding, framesBlurFinding, measureSharpness, type Sharpness } from "@/qa_pipeline/blur/blur";
import {
  type Exposure,
  exposureFinding,
  framesExposureFinding,
  framesQualityMeasured,
  measureExposure,
  qualityMeasured,
  qualityUncheckedFinding,
} from "@/qa_pipeline/exposure/exposure";
import { currentFix, type Fix } from "@/qa_pipeline/location/location";
import type { Tilt } from "@/qa_pipeline/tilt/tilt";

export interface CameraResult {
  uri: string;
  /** expo-camera reports these on a photo; a recording does not carry them,
   *  a gallery pick does — for a clip without them the first frame answers */
  width?: number;
  height?: number;
  /** EXIF Orientation of the photo, when the camera wrote one */
  exifOrientation?: number | null;
  /** seconds of video: the capture screen's timer, or the gallery's metadata */
  duration?: number | null;
}

/** thrown when the server would certainly refuse the file; the capture screen
 *  renders the message over the viewfinder and the counter does not advance */
export class CaptureRejected extends Error {
  constructor(public readonly findings: Finding[]) {
    super(findings.map((f) => f.message).join(" "));
    this.name = "CaptureRejected";
  }
}

/** What became of a capture.
 *
 * `kept` is the ordinary case: queued, with any warnings. `unsure` is the
 * subject check's verdict — the file is on disk but NOT queued, and the
 * caller asks the worker: keep() queues it with the warning attached,
 * retake() records the refusal and deletes it. Both must be called at most
 * once; neither, and the file is an orphan until the app is reinstalled. */
export type CaptureOutcome =
  | {
      kept: true;
      findings: Finding[];
      /** the phone looked and the photo passed the subject check — worth a
       *  word on screen, or a silent pass is indistinguishable from no check */
      onSubject?: boolean;
    }
  | {
      kept: false;
      /** the subject verdict the worker is being asked about */
      finding: Finding;
      /** everything the phone found, so the screen can show the rest while it asks */
      findings: Finding[];
      keep(): Promise<Finding[]>;
      retake(): Promise<void>;
    };

/** Told while a clip's frames are being looked at, so the screen can say
 *  "Checking clip… 12/40" instead of standing still for half a minute. */
export type Progress = (done: number, total: number) => void;

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function useCapture(
  assignmentId: string,
  taskRef: string,
  spec?: CaptureSpec | null,
  targetUnit?: string | null,
  /** a retake: the server's id of the capture sent back that this replaces */
  replacesAssetId?: string | null,
  /** the position the camera screen keeps warm (location.watchFix), read at
   *  the shutter; a stable getter, so a new reading does not rebuild this */
  warmFix?: () => Fix | null,
  /** the client's example photos as CLIP embedded them (a stable getter, read
   *  at the shutter, so a late download is still used). Absent or empty on a
   *  task with none; `expected` tells that apart from examples not yet fetched. */
  clipExamples?: () => ClipExampleSet | null,
) {
  return useCallback(
    // tilt is sampled by the caller, not read here: an async read after the
    // shutter measures where the phone ended up, not where it was.
    async (
      result: CameraResult,
      kind: "photo" | "video",
      tilt?: Tilt | null,
      onProgress?: Progress,
      heldOrientation?: "portrait" | "landscape" | null,
    ): Promise<CaptureOutcome> => {
      const session = await loadSession();
      if (!session) throw new Error("Signed out.");
      const id = Crypto.randomUUID();
      const capturedAt = new Date();
      const ext = kind === "video" ? "mp4" : "jpg";
      const filename = `${taskRef}-${stamp(capturedAt)}-${id.slice(0, 8)}.${ext}`;
      const [fix, moved] = await Promise.all([
        currentFix(warmFix?.() ?? null),
        moveIntoPrivateDir(result.uri, assignmentId, filename),
      ]);

      // A recording carries no dimensions; its first frame does, the right way
      // up. A clip the thumbnailer cannot open at all is refused as unreadable
      // rather than uploaded blind.
      let { width, height } = result;
      if (kind === "video" && !(width && height)) {
        try {
          const first = await frameAt(moved.uri, 0.25);
          width = first.width;
          height = first.height;
          await deleteLocal(first.uri);
        } catch (e) {
          await refuse(session.user_id, assignmentId, moved.uri, [
            {
              code: "unreadable",
              severity: "block",
              message: `The phone cannot read that clip (${e instanceof Error ? e.message : "no frame"}).`,
            },
          ]);
        }
      }

      const findings = checkCapture(
        {
          kind,
          size: moved.size,
          width,
          height,
          exifOrientation: result.exifOrientation,
          duration: result.duration,
          fix: fix ? { accuracy: fix.accuracy, stale: fix.stale } : null,
          tilt: tilt ?? null,
          heldOrientation: heldOrientation ?? tilt?.held ?? null,
        },
        spec,
        targetUnit,
      );
      // The phone itself, against the task's device requirements: a capture
      // from a phone under them is refused here like any other, after the
      // worker was warned on the assignment screen (device.ts).
      findings.push(...deviceRefusals(thisDevice(), spec));
      const blocked = blocking(findings);
      if (blocked.length > 0) await refuse(session.user_id, assignmentId, moved.uri, blocked);

      const queue = async (checks: Finding[]) => {
        await insertCapture({
          id,
          user_id: session.user_id,
          assignment_id: assignmentId,
          local_uri: moved.uri,
          filename,
          mime: kind === "video" ? "video/mp4" : "image/jpeg",
          size: moved.size,
          captured_at: capturedAt.toISOString(),
          lat: fix?.lat ?? null,
          lon: fix?.lon ?? null,
          checks: checks.length > 0 ? JSON.stringify(checks) : null,
          replaces_asset_id: replacesAssetId ?? null,
          // what a share in hours is counted in (db/510)
          duration_s: kind === "video" && result.duration && result.duration > 0 ? result.duration : null,
        });
        uploader.kick();
        return checks;
      };

      // The instruments that need no subject profile: what is written in the
      // frame and how tall it is, whether a face is in it, and which phone
      // took it. All three MEASURE — info findings the worker is never shown —
      // with one exception: a face in a capture whose brief forbade people is
      // a warning the reviewer should have.
      //
      // Photos only. A clip already spends its whole budget labelling sampled
      // frames, and a second native call per frame would buy clip_unchecked
      // rather than an answer.
      //
      // Run together rather than in sequence: they are independent, and at the
      // shutter the worker waits for the sum of whatever happens here.
      //
      // Boxes come back in the orientation ML Kit decoded, which is the
      // displayed one — so the frame they are measured against has to be too.
      findings.push(deviceFinding(thisDevice(), await cachedCamera()));
      if (kind === "photo") {
        const shown = width && height ? displayedSize(width, height, result.exifOrientation) : null;
        const [read, faces, pixels] = await Promise.all([
          recogniseText(moved.uri),
          detectFaces(moved.uri),
          greyImage(moved.uri).catch((e: unknown) => (e instanceof Error ? e : new Error(String(e)))),
        ]);
        findings.push(
          "unscored" in read
            ? textUnreadFinding(read.unscored, read.error)
            : textFinding(scoreText(read, shown?.height)),
        );
        findings.push(
          "unscored" in faces
            ? facesUncheckedFinding(faces.unscored, faces.error)
            : facesFinding(scoreFaces(faces.faces, shown?.width, shown?.height), spec?.subject),
        );
        // Focus and light. A photo clearly out of focus is refused here, like
        // any rules.ts block — before the labeller spends seconds on it.
        if (pixels instanceof Error) {
          findings.push(qualityUncheckedFinding(pixels.message));
        } else {
          const sharp = measureSharpness(pixels);
          const expo = measureExposure(pixels);
          findings.push(qualityMeasured(sharp, expo));
          const soft = blurFinding(sharp);
          const lit = exposureFinding(expo);
          if (lit) findings.push(lit);
          if (soft) {
            findings.push(soft);
            if (soft.severity === "block") await refuse(session.user_id, assignmentId, moved.uri, [soft]);
          }
        }
      }

      // The subject check (CLIP, subject/clipSubject.ts). A task without a
      // subject or example photos skips it. A phone that could not look says
      // so with a warning of its own and the capture is kept; a miss hands the
      // decision to the worker.
      //
      // A clip is looked at through its sampled frames, and those frames
      // answer two questions at once: is the picture there at all (black,
      // frozen — clip.ts, and a block like any other), and does it show the
      // subject (a warning like a photo's).
      const subject = spec?.subject ?? null;

      // The client's own photos, as CLIP embedded them on the camera screen
      // (subject/clipExamples.ts). Examples the task carries but this phone
      // has not embedded are recorded as not compared, never read as a match.
      const exSet = clipExamples?.() ?? null;
      const withExamples = exSet != null && exSet.expected > 0;
      const looks = subject != null || withExamples;

      let onSubject = false;
      let finding: Finding | null = null;
      if (kind === "video") {
        const times = frameTimes(result.duration ?? 0);
        const greys: Uint8Array[] = [];
        const sharps: Sharpness[] = [];
        const expos: Exposure[] = [];
        // one CLIP look per frame: the subject's margin, each banned phrase's,
        // and the likeness to the examples, all from the same six views
        const margins: number[] = [];
        const banned: ForbiddenMargin[][] = [];
        const exSims: number[] = [];
        let miss: Exclude<ClipResult, { vecs: unknown }> | null = null;
        let ms = 0;
        const sampled = await sampleFrames(
          moved.uri,
          times,
          FRAMES_BUDGET_MS,
          async (frame) => {
            greys.push(frame.grey);
            sharps.push(measureSharpness(frame.image));
            expos.push(measureExposure(frame.image));
            // A frame CLIP could not answer is skipped, not the clip: a slow
            // frame among thirty says nothing about the other twenty-nine.
            if (!looks || (miss && miss.unscored !== "error")) return;
            const r = await clipScore(frame.uri, subject);
            if ("unscored" in r) {
              miss = r;
              return;
            }
            ms += r.ms;
            if (r.margins) margins.push(r.margins.margin);
            banned.push(r.forbidden);
            if (exSet && exSet.ready.length > 0) exSims.push(exampleSimilarity(r.vecs, exSet.ready).score);
          },
          onProgress,
        );
        if (sampled.timedOut) findings.push(uncheckedFinding(sampled.done, times.length));
        const still = stillFindings(judgeFrames(greys));
        findings.push(...still);
        const stuck = blocking(still);
        if (stuck.length > 0) await refuse(session.user_id, assignmentId, moved.uri, stuck);
        // Focus and light across the frames: warnings only, never a refusal.
        const measured = framesQualityMeasured(sharps, expos);
        if (measured) findings.push(measured);
        const soft = framesBlurFinding(sharps);
        if (soft) findings.push(soft);
        const lit = framesExposureFinding(expos);
        if (lit) findings.push(lit);

        let wordMiss: Finding | null = null;
        if (subject) {
          if (margins.length > 0) {
            const m = framesMargin(margins);
            // Recorded whether it passed or not, so a clip that was accepted
            // still says what CLIP made of it.
            findings.push(
              clipMeasured(m, {
                frames: margins.length,
                per_frame: margins.map((x) => Number(x.toFixed(4))),
                ms,
              }),
            );
            const ban = forbiddenFinding(framesForbidden(banned), true);
            if (ban) findings.push(ban);
            wordMiss = clipFinding(m, subject, { frames: margins.length });
            if (wordMiss) findings.push(wordMiss);
          } else {
            const why: Exclude<ClipResult, { vecs: unknown }> = miss ?? { unscored: "error", error: "no frame scored" };
            findings.push(clipUnscoredFinding(why.unscored, why.error));
          }
        }
        const cx = clipExamplesCheck(exSet, exSims.length > 0 ? framesMargin(exSims) : null, findings, {
          frames: exSims.length,
        });
        finding = prompted(wordMiss, cx.miss, cx.used);
        // "Looks like the subject" only where a check actually looked and
        // passed. A clip with nothing to check against, or whose frames could
        // not be scored, was never judged and must not be praised.
        const wordsPassed = subject ? margins.length > 0 && wordMiss === null : cx.used;
        onSubject = looks && wordsPassed && !cx.miss;
      } else if (looks) {
        const r = await clipScore(moved.uri, subject);
        if ("unscored" in r) {
          if (subject) findings.push(clipUnscoredFinding(r.unscored, r.error));
          // The same missing look costs the example comparison; say so rather
          // than leave a capture that was never compared looking like a match.
          if (exSet && withExamples) findings.push(clipExamplesUncheckedFinding(exSet.expected));
          return { kept: true, findings: await queue(findings) };
        }
        let wordMiss: Finding | null = null;
        if (subject && r.margins) {
          findings.push(clipMeasured(r.margins.margin, photoDetail(r.margins, r.ms)));
          // Prohibition is its own question and its own warning: it rides with
          // the upload for the reviewer but never puts the keep-or-retake
          // question to the worker, who often cannot prevent it — a passer-by
          // walks into shot and the shelf is still the shelf.
          const ban = forbiddenFinding(r.forbidden);
          if (ban) findings.push(ban);
          wordMiss = clipFinding(r.margins.margin, subject);
          if (wordMiss) findings.push(wordMiss);
        }
        // the examples, compared against the six views CLIP already has
        const sim = exSet && exSet.ready.length > 0 ? exampleSimilarity(r.vecs, exSet.ready) : null;
        const cx = clipExamplesCheck(exSet, sim?.score ?? null, findings, { best: sim?.best ?? null });
        finding = prompted(wordMiss, cx.miss, cx.used);
        onSubject = (subject != null || cx.used) && wordMiss === null && !cx.miss;
      }

      if (finding) {
        if (SUBJECT_DIALOG) {
          const asked = finding;
          return {
            kept: false,
            finding: asked,
            findings,
            keep: () => queue(findings),
            retake: async () => {
              await recordRejections(session.user_id, assignmentId, [asked]);
              await deleteLocal(moved.uri);
            },
          };
        }
      }

      return { kept: true, findings: await queue(findings), onSubject };
    },
    [assignmentId, taskRef, spec, targetUnit, replacesAssetId, warmFix, clipExamples],
  );
}

/** CLIP's look at one image file — the subject's margin when there is a
 *  subject, the banned phrases' and the six views' vectors — or why there is
 *  none. Never throws. */
async function clipScore(uri: string, subject: SubjectSpec | null): Promise<ClipResult> {
  try {
    return await scoreImage(await rgbaImage(uri, CLIP_IMAGE_WIDTH), subject);
  } catch (e) {
    return { unscored: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

/** CLIP's example verdict, recorded either way: `used` when there were
 *  examples to compare against and a score came back, `miss` when it fell
 *  short. A task with examples that could not be compared says so. */
function clipExamplesCheck(
  set: ClipExampleSet | null,
  score: number | null,
  findings: Finding[],
  detail: Record<string, unknown>,
): { used: boolean; miss: boolean } {
  if (!set || set.expected === 0) return { used: false, miss: false };
  if (set.ready.length === 0 || score == null) {
    findings.push(clipExamplesUncheckedFinding(set.expected));
    return { used: false, miss: false };
  }
  findings.push(clipExamplesFinding(score, set.ready.length, detail));
  return { used: true, miss: examplesMissed(score) };
}

// Which miss, if any, is put to the worker.
//
// BOTH CHECKS MUST AGREE before anyone is asked. The word check alone decides
// when the client sent no examples. The example check never decides alone,
// not even when it is the only one that ran: a comparison with no field data
// behind it does not get to throw away a worker's shot.
//
// Both scores are recorded either way, so the rule can be moved on evidence.
// The number that decides whether to move it is how often this function
// returned null with a real wordMiss in hand — captures the sample check would
// have queried and the word check let through. If gate 1 keeps rejecting
// those, the weak check is vetoing the strong one.
//
// The finding handed back is the word check's, because it carries the sentence
// a worker can act on ("Doesn't look like retail shelf."). The
// example score reaches the reviewer as its own measurement.
function prompted(wordMiss: Finding | null, exampleMiss: boolean, usedExamples: boolean): Finding | null {
  if (!usedExamples) return wordMiss;
  return wordMiss && exampleMiss ? wordMiss : null;
}

// The refusal is written first. Nothing else will remember it: the file is
// about to go, no outbox row is created, and the server never hears of a
// capture that did not reach it. Nothing is queued, so the file has no other
// owner: take it with us.
async function refuse(userId: string, assignmentId: string, uri: string, blocked: Finding[]): Promise<never> {
  await recordRejections(userId, assignmentId, blocked);
  await deleteLocal(uri);
  throw new CaptureRejected(blocked);
}
