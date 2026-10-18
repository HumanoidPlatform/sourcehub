// Mounts the upload loop for the life of the app and keeps it going when the
// worker looks away. On Android that is the foreground service (service.ts),
// which the loop itself takes the moment a step begins while the app is in
// front, so that locking the phone or switching apps no longer stops the
// queue; this component feeds its notification with how far along things
// are. On iOS, where there is no such service here, the screen is kept on
// while a lane is uploading instead —
// not while the queue waits out a backoff or for a connection, where a lit
// screen would cost battery for nothing. Rendered once in the root layout;
// renders nothing.

import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";
import { useOutboxSummary } from "@/query/hooks";
import { useUploadProgress } from "./progress";
import { uploadService } from "./service";
import { uploader } from "./uploader";

const TAG = "uploads";

export function UploaderMount() {
  useEffect(() => {
    uploader.start();
    const off = uploader.onBusy((busy) => {
      // Android: the loop holds and releases its own service (uploader.ts, service.ts)
      if (uploadService.available) return;
      // best effort: a phone that refuses is a phone that locks, as before
      void (busy ? activateKeepAwakeAsync(TAG) : deactivateKeepAwake(TAG)).catch(() => undefined);
    });
    return () => {
      off();
      void deactivateKeepAwake(TAG).catch(() => undefined);
      uploader.stop();
    };
  }, []);

  // The notification line: how many captures are still to send, and how far
  // the one in flight has got. Throttled inside the service.
  const box = useOutboxSummary();
  const progress = useUploadProgress();
  useEffect(() => {
    if (!uploadService.available) return;
    let left = 0;
    for (const s of Object.values(box)) left += s.queued;
    let fraction = 0;
    progress.forEach((f) => (fraction = Math.max(fraction, f)));
    uploadService.report(left, fraction);
  }, [box, progress]);

  return null;
}
