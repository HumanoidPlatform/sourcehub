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
import type { CaptureSpec } from "@/api/types";
import { FRAMES_BUDGET_MS, MIN_SUBJECT_FRAMES, SUBJECT_DIALOG, SUBJECT_FRAMES_MIN_SHARE } from "@/config";
import { insertCapture, recordRejections } from "@/db/outbox";
import { uploader } from "@/upload/uploader";
import { frameTimes, judgeFrames, stillFindings, uncheckedFinding } from "@/validation/clip";
import {
  exampleFramesFinding,
  type ExampleScore,
  examplesFinding,
  type ExampleSet,
  examplesUncheckedFinding,
  missedExamples,
  scoreExampleFrames,
  scoreExamples,
} from "@/validation/examples";
import { detectFaces, facesFinding, facesUncheckedFinding, scoreFaces } from "@/validation/faces";
import { blocking, checkCapture, displayedSize, type Finding } from "@/validation/rules";
import { recogniseText, scoreText, textFinding, textUnreadFinding } from "@/validation/text";
import {
  forbiddenFinding,
  framesFinding,
  labelImage,
  scoreFrames,
  scoreSubject,
  subjectFinding,
  subjectMeasured,
  type SubjectScore,
  unscoredFinding,
  type UnscoredReason,
} from "@/validation/subject";
import { deviceFinding, thisDevice } from "./device";
import { deleteLocal, moveIntoPrivateDir } from "./files";
import { frameAt, sampleFrames } from "./frames";
import { currentFix } from "./location";
import type { Tilt } from "./tilt";

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
  /** the client's example photos as the phone labelled them, loaded by the
   *  assignment screen. Absent on a task with none, and on a phone that never
   *  managed to fetch them — the two are told apart inside. */
  examples?: ExampleSet | null,
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
        currentFix(),
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
      findings.push(deviceFinding(thisDevice()));
      if (kind === "photo") {
        const shown = width && height ? displayedSize(width, height, result.exifOrientation) : null;
        const [read, faces] = await Promise.all([recogniseText(moved.uri), detectFaces(moved.uri)]);
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
      }

      // The subject check. A task without a subject skips it. A phone that
      // could not look says so with a warning of its own and the capture is
      // kept; a low score hands the decision to the worker.
      //
      // A clip is looked at through its sampled frames, and those frames
      // answer two questions at once: is the picture there at all (black,
      // frozen — clip.ts, and a block like any other), and does it show the
      // subject (subject.ts, a warning like a photo's).
      const subject = spec?.subject;

      // The client's own photos, when they sent any AND the phone managed to
      // read them beforehand (capture/examples.ts, on the assignment screen).
      // `usable` is what matters below: examples the task carries but this
      // phone never fetched are worse than none at all, because comparing
      // against an empty set would score every capture zero and refuse
      // everything. The gap is recorded instead.
      const usable = examples && examples.ready.length > 0 ? examples.ready : null;
      if (examples && examples.expected > 0 && !usable) {
        findings.push(examplesUncheckedFinding(examples.expected));
      }

      let onSubject = false;
      let finding: Finding | null = null;
      if (kind === "video") {
        const times = frameTimes(result.duration ?? 0);
        const greys: Uint8Array[] = [];
        const scores: SubjectScore[] = [];
        const exampleScores: ExampleScore[] = [];
        // One frame the labeller could not answer is skipped, not the clip:
        // a slow frame among thirty says nothing about the other twenty-nine.
        // Only a build with no labeller at all stops asking.
        let noLabeller = false;
        let lastMiss: { reason: UnscoredReason; error?: string } | null = null;
        const sampled = await sampleFrames(
          moved.uri,
          times,
          FRAMES_BUDGET_MS,
          async (frame) => {
            greys.push(frame.grey);
            if ((!subject && !usable) || noLabeller) return;
            const seen = await labelImage(frame.uri);
            if ("unscored" in seen) {
              lastMiss = { reason: seen.unscored, error: seen.error };
              if (seen.unscored === "no_labeller") noLabeller = true;
            } else {
              // One set of labels, two questions. Comparing against the
              // examples is arithmetic on labels this frame already cost us,
              // so a clip pays nothing extra for the second check.
              if (subject) scores.push(scoreSubject(seen.labels, subject));
              if (usable) exampleScores.push(scoreExamples(seen.labels, usable));
            }
          },
          onProgress,
        );
        if (sampled.timedOut) findings.push(uncheckedFinding(sampled.done, times.length));
        const still = stillFindings(judgeFrames(greys));
        findings.push(...still);
        const stuck = blocking(still);
        if (stuck.length > 0) await refuse(session.user_id, assignmentId, moved.uri, stuck);

        let wordMiss: Finding | null = null;
        if (subject) {
          if (scores.length > 0) {
            const across = scoreFrames(scores);
            // Recorded whether it passed or not. Without this a clip that was
            // accepted filed no score and no labels, and the only way to find
            // out why was to shoot it again.
            findings.push(subjectMeasured(scores[0], across));
            wordMiss = framesFinding(across, subject);
          } else {
            const miss: { reason: UnscoredReason; error?: string } = lastMiss ?? { reason: "timeout" };
            findings.push(unscoredFinding(miss.reason, miss.error));
          }
        }
        let exampleMiss = false;
        if (usable && exampleScores.length > 0) {
          const shot = scoreExampleFrames(exampleScores);
          findings.push(exampleFramesFinding(shot));
          // The same rule as the word check, for the same reason: at three
          // samples a 0.3 share is one frame, and one frame is an accident.
          exampleMiss =
            shot.hits < Math.min(MIN_SUBJECT_FRAMES, shot.frames) || shot.share < SUBJECT_FRAMES_MIN_SHARE;
        }
        if (wordMiss) findings.push(wordMiss);
        finding = prompted(wordMiss, exampleMiss, usable !== null);
        onSubject = wordMiss === null && !exampleMiss;
      } else if (subject || usable) {
        const seen = await labelImage(moved.uri);
        if ("unscored" in seen) {
          findings.push(unscoredFinding(seen.unscored, seen.error));
          return { kept: true, findings: await queue(findings) };
        }
        let wordMiss: Finding | null = null;
        if (subject) {
          const scored = scoreSubject(seen.labels, subject);
          // Prohibition is its own question now, and its own warning: it rides
          // with the upload for the reviewer but never puts the keep-or-retake
          // question to the worker, who often cannot prevent it — a passer-by
          // walks into shot and the shelf is still the shelf.
          const banned = forbiddenFinding(scored, subject);
          if (banned) findings.push(banned);
          findings.push(subjectMeasured(scored));
          wordMiss = subjectFinding(scored, subject);
          if (wordMiss) findings.push(wordMiss);
        }
        let exampleMiss = false;
        if (usable) {
          const ex = scoreExamples(seen.labels, usable);
          findings.push(examplesFinding(ex));
          exampleMiss = missedExamples(ex);
        }
        finding = prompted(wordMiss, exampleMiss, usable !== null);
        onSubject = wordMiss === null && !exampleMiss;
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
    [assignmentId, taskRef, spec, targetUnit, examples],
  );
}

// Which miss, if any, is put to the worker.
//
// BOTH CHECKS MUST AGREE before anyone is asked. The word check alone decides
// when the client sent no examples — today's behaviour, unchanged. The example
// check never decides alone, not even when it is the only one that ran: a
// brand-new comparison with no field data behind it does not get to throw away
// a worker's shot, which is precisely how the original complaint happened.
//
// Both scores are recorded either way, so the rule can be moved on evidence.
// The number that decides whether to move it is how often this function
// returned null with a real wordMiss in hand — captures the sample check would
// have queried and the word check let through. If gate 1 keeps rejecting
// those, the weak check is vetoing the strong one.
//
// The finding handed back is the word check's, because it carries the sentence
// a worker can act on ("Doesn't look like retail shelf. Saw: floor…"). The
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
