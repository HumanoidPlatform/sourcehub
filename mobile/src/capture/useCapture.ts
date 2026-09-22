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
import { FRAMES_BUDGET_MS, SUBJECT_DIALOG } from "@/config";
import { insertCapture, recordRejections } from "@/db/outbox";
import { uploader } from "@/upload/uploader";
import { frameTimes, judgeFrames, stillFindings, uncheckedFinding } from "@/validation/clip";
import { blocking, checkCapture, type Finding } from "@/validation/rules";
import {
  framesFinding,
  labelImage,
  scoreFrames,
  scoreSubject,
  subjectFinding,
  type SubjectScore,
  unscoredFinding,
  type UnscoredReason,
} from "@/validation/subject";
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

      // The subject check. A task without a subject skips it. A phone that
      // could not look says so with a warning of its own and the capture is
      // kept; a low score hands the decision to the worker.
      //
      // A clip is looked at through its sampled frames, and those frames
      // answer two questions at once: is the picture there at all (black,
      // frozen — clip.ts, and a block like any other), and does it show the
      // subject (subject.ts, a warning like a photo's).
      const subject = spec?.subject;
      let onSubject = false;
      let finding: Finding | null = null;
      if (kind === "video") {
        const times = frameTimes(result.duration ?? 0);
        const greys: Uint8Array[] = [];
        const scores: SubjectScore[] = [];
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
            if (!subject || noLabeller) return;
            const seen = await labelImage(frame.uri);
            if ("unscored" in seen) {
              lastMiss = { reason: seen.unscored, error: seen.error };
              if (seen.unscored === "no_labeller") noLabeller = true;
            } else {
              scores.push(scoreSubject(seen.labels, subject));
            }
          },
          onProgress,
        );
        if (sampled.timedOut) findings.push(uncheckedFinding(sampled.done, times.length));
        const still = stillFindings(judgeFrames(greys));
        findings.push(...still);
        const stuck = blocking(still);
        if (stuck.length > 0) await refuse(session.user_id, assignmentId, moved.uri, stuck);
        if (subject) {
          if (scores.length > 0) {
            finding = framesFinding(scoreFrames(scores), subject);
            onSubject = finding === null;
          } else {
            const miss: { reason: UnscoredReason; error?: string } = lastMiss ?? { reason: "timeout" };
            findings.push(unscoredFinding(miss.reason, miss.error));
          }
        }
      } else if (subject) {
        const seen = await labelImage(moved.uri);
        if ("unscored" in seen) {
          findings.push(unscoredFinding(seen.unscored, seen.error));
          return { kept: true, findings: await queue(findings) };
        }
        finding = subjectFinding(scoreSubject(seen.labels, subject), subject);
        onSubject = finding === null;
      }

      if (finding) {
        findings.push(finding);
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
    [assignmentId, taskRef, spec, targetUnit],
  );
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
