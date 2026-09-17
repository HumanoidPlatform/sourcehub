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
import { SUBJECT_DIALOG } from "@/config";
import { insertCapture, recordRejections } from "@/db/outbox";
import { uploader } from "@/upload/uploader";
import { blocking, checkCapture, type Finding } from "@/validation/rules";
import { labelImage, scoreSubject, subjectFinding } from "@/validation/subject";
import { deleteLocal, moveIntoPrivateDir } from "./files";
import { currentFix } from "./location";
import type { Tilt } from "./tilt";

export interface CameraResult {
  uri: string;
  /** expo-camera reports these on a photo; a recording does not carry them */
  width?: number;
  height?: number;
  /** EXIF Orientation of the photo, when the camera wrote one */
  exifOrientation?: number | null;
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
  | { kept: true; findings: Finding[] }
  | { kept: false; finding: Finding; keep(): Promise<Finding[]>; retake(): Promise<void> };

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
    async (result: CameraResult, kind: "photo" | "video", tilt?: Tilt | null): Promise<CaptureOutcome> => {
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

      const findings = checkCapture(
        {
          kind,
          size: moved.size,
          width: result.width,
          height: result.height,
          exifOrientation: result.exifOrientation,
          fix: fix ? { accuracy: fix.accuracy, stale: fix.stale } : null,
          tilt: tilt ?? null,
        },
        spec,
        targetUnit,
      );
      const blocked = blocking(findings);
      if (blocked.length > 0) {
        // The refusal is written first. Nothing else will remember it: the file
        // is about to go, no outbox row is created, and the server never hears
        // of a capture that did not reach it.
        await recordRejections(session.user_id, assignmentId, blocked);
        // Nothing is queued, so the file has no other owner: take it with us.
        await deleteLocal(moved.uri);
        throw new CaptureRejected(blocked);
      }

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

      // The subject check, photos only (a video's frames are the server's
      // problem). A task without a subject, or a build without the labeller,
      // skips it; a low score hands the decision to the worker.
      const subject = spec?.subject;
      if (kind === "photo" && subject) {
        const labels = await labelImage(moved.uri);
        const finding = labels ? subjectFinding(scoreSubject(labels, subject), subject) : null;
        if (finding) {
          findings.push(finding);
          if (SUBJECT_DIALOG) {
            return {
              kept: false,
              finding,
              keep: () => queue(findings),
              retake: async () => {
                await recordRejections(session.user_id, assignmentId, [finding]);
                await deleteLocal(moved.uri);
              },
            };
          }
        }
      }

      return { kept: true, findings: await queue(findings) };
    },
    [assignmentId, taskRef, spec, targetUnit],
  );
}
