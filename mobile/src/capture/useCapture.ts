// From a camera result to an outbox row: move the file into private storage,
// record when and where, enqueue, kick the uploader. Works offline; the
// upload happens whenever it can.

import * as Crypto from "expo-crypto";
import { useCallback } from "react";
import { loadSession } from "@/api/client";
import { insertCapture } from "@/db/outbox";
import { uploader } from "@/upload/uploader";
import { moveIntoPrivateDir } from "./files";
import { currentFix } from "./location";

export interface CameraResult {
  uri: string;
}

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function useCapture(assignmentId: string, taskRef: string) {
  return useCallback(
    async (result: CameraResult, kind: "photo" | "video"): Promise<void> => {
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
      });
      uploader.kick();
    },
    [assignmentId, taskRef],
  );
}
