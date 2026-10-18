// Dropping captures this phone will not send.
//
// Three things hold a capture: the outbox row, the file, and — once presign
// has run — a pending row on the server, which counts against the share until
// it is confirmed or deleted (media/service.py HELD_SQL). The discard paths
// used to remove the row and the file and leave the third, so a worker who
// discarded a failed upload found the server refusing their next capture with
// a slot the phone could not see. Every discard goes through here so all
// three go together.

import { del } from "@/api/client";
import { deleteLocal } from "@/capture/files";
import type { CaptureRow } from "@/db/outbox";

/** Frees the server slot of each row that has one, then deletes the file.
 *  The rows themselves are already gone: callers remove them first
 *  (db/outbox.ts) and hand back what they removed.
 *
 *  The server call is best effort. A refusal is not a reason to keep the
 *  file — 404 means the asset is already gone, 409 that it is part of the
 *  record — and neither is being offline: a pending row the phone never
 *  follows up on stops counting on the server after a day. */
export async function dropCaptures(rows: CaptureRow[]): Promise<void> {
  await Promise.all(
    rows.map(async (r) => {
      if (r.asset_id) {
        try {
          await del(`/assets/${r.asset_id}`);
        } catch {
          // offline, already gone, or no longer the worker's to remove
        }
      }
      await deleteLocal(r.local_uri);
    }),
  );
}
