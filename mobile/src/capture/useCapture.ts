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
import { insertCapture } from "@/db/outbox";
import { uploader } from "@/upload/uploader";
import { blocking, checkCapture, type Finding } from "@/validation/rules";
import { deleteLocal, moveIntoPrivateDir } from "./files";
import { currentFix } from "./location";

export interface CameraResult {
  uri: string;
  /** expo-camera reports these on a photo; a recording does not carry them */
  width?: number;
  height?: number;
}

/** thrown when the server would certainly refuse the file; the capture screen
 *  renders the message over the viewfinder and the counter does not advance */
export class CaptureRejected extends Error {
  constructor(public readonly findings: Finding[]) {
    super(findings.map((f) => f.message).join(" "));
    this.name = "CaptureRejected";
  }
}

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
    async (result: CameraResult, kind: "photo" | "video"): Promise<Finding[]> => {
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
          fix: fix ? { accuracy: fix.accuracy, stale: fix.stale } : null,
        },
        spec,
        targetUnit,
      );
      const blocked = blocking(findings);
      if (blocked.length > 0) {
        // Nothing is queued, so the file has no other owner: take it with us.
        await deleteLocal(moved.uri);
        throw new CaptureRejected(blocked);
      }

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
        checks: findings.length > 0 ? JSON.stringify(findings) : null,
      });
      uploader.kick();
      return findings;
    },
    [assignmentId, taskRef, spec, targetUnit],
  );
}
