// Files nothing points at any more, cleared once per launch.
//
// A capture is moved into documents/captures/<assignment>/ before its checks
// run and before its outbox row exists (qa_pipeline/pipeline.ts). An app killed
// in between — or a check that threw — left the file there for good: no row,
// so no upload, no Settings count, and no way for the worker to see it. A
// chunk staged in cache/chunks by a lane that died mid-part is the same.
//
// Only files older than MIN_AGE_MS go, so a capture being checked at the very
// moment of the sweep is never touched.

import * as Legacy from "expo-file-system/legacy";
import { localUris } from "@/db/outbox";

export const MIN_AGE_MS = 10 * 60_000;

function tail(uri: string): string {
  const i = uri.lastIndexOf("/captures/");
  return i >= 0 ? uri.slice(i) : uri;
}

async function oldFiles(dir: string, now: number): Promise<string[]> {
  const info = await Legacy.getInfoAsync(dir);
  if (!info.exists || !info.isDirectory) return [];
  const out: string[] = [];
  for (const name of await Legacy.readDirectoryAsync(dir)) {
    const uri = `${dir}${name}`;
    const f = await Legacy.getInfoAsync(uri);
    if (!f.exists) continue;
    if (f.isDirectory) {
      out.push(...(await oldFiles(`${uri}/`, now)));
      continue;
    }
    // modificationTime is in seconds
    const at = "modificationTime" in f && typeof f.modificationTime === "number" ? f.modificationTime * 1000 : now;
    if (now - at > MIN_AGE_MS) out.push(uri);
  }
  return out;
}

/** returns how many files went; never throws */
export async function sweepOrphans(now = Date.now()): Promise<number> {
  try {
    // Compared from "captures/" on: a row written under one spelling of the
    // documents path (file:// or not, a trailing slash) must still protect its
    // file — a mismatch here would delete a capture waiting to upload.
    const keep = new Set([...(await localUris())].map(tail));
    const captures = (await oldFiles(`${Legacy.documentDirectory ?? ""}captures/`, now)).filter((u) => !keep.has(tail(u)));
    const chunks = await oldFiles(`${Legacy.cacheDirectory ?? ""}chunks/`, now);
    const gone = [...captures, ...chunks];
    for (const uri of gone) await Legacy.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
    return gone.length;
  } catch {
    return 0;
  }
}
