// What a sign-out leaves behind, cleared in one place. A session ends two ways
// — the worker signs out, or the refresh token is refused (api/client.ts) —
// and the second used to skip all of it: the next person on a shared phone
// saw the previous one's list until it refetched, their capture images in the
// image cache, their notifications in the tray, and their upload log.
//
// Unsent captures are NOT cleared: they wait for their owner (db/outbox.ts).

import { Image } from "expo-image";
import { forgetPush } from "@/notifications/push";
import { queryClient } from "@/query/queryClient";
import { clearUploadLog } from "@/upload/log";

export async function endSession(): Promise<void> {
  queryClient.clear();
  clearUploadLog();
  await Promise.all([
    forgetPush(),
    Image.clearMemoryCache().catch(() => false),
    Image.clearDiskCache().catch(() => false),
  ]);
}
