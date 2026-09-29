// Captures live in the app's private document directory until the server has
// confirmed them. No storage permission is needed for that, and an uninstall
// removes them — which is why Settings shows how many are still queued.

import * as Legacy from "expo-file-system/legacy";

export function capturesDir(assignmentId: string): string {
  return `${Legacy.documentDirectory ?? ""}captures/${assignmentId}/`;
}

function sizeOf(info: Awaited<ReturnType<typeof Legacy.getInfoAsync>>): number {
  return info.exists && "size" in info && typeof info.size === "number" ? info.size : 0;
}

/** Wait for a just-recorded file to stop growing. Best effort, never fatal.
 *
 *  expo-camera's recordAsync resolves when recording STOPS, but the muxer may
 *  still be finishing the MP4 — so for a moment the URI it hands back can name
 *  a file that is not there yet, or one still being written. That is the race
 *  behind "could not be moved to": roughly one capture in three, never the
 *  same one twice.
 *
 *  Two equal non-zero readings is as close to "closed" as the file system will
 *  say. If the time runs out this returns anyway and says nothing: getInfoAsync
 *  and moveAsync need not agree about a URI the camera produced, and the move
 *  is the opinion that counts. A stat that is wrong must never be the reason a
 *  worker loses a shot. */
async function settle(uri: string, timeoutMs = 8_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let previous = -1;
  while (Date.now() < deadline) {
    const size = sizeOf(await Legacy.getInfoAsync(uri));
    if (size > 0 && size === previous) return;
    previous = size;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

export async function moveIntoPrivateDir(fromUri: string, assignmentId: string, name: string): Promise<{ uri: string; size: number }> {
  const dir = capturesDir(assignmentId);
  await Legacy.makeDirectoryAsync(dir, { intermediates: true });
  const to = dir + name;

  // ATTEMPT FIRST, RECOVER SECOND — and in that order deliberately. Asking the
  // file system whether the recording is ready before trying to save it costs
  // a capture every time the answer is wrong, and it is the worker who pays.
  // So the ordinary path is one move and nothing else; the checking only
  // happens once something has actually gone wrong.
  try {
    await Legacy.moveAsync({ from: fromUri, to });
  } catch (first) {
    await settle(fromUri);
    try {
      await Legacy.moveAsync({ from: fromUri, to });
    } catch {
      try {
        // A rename cannot cross a mount point and on some devices the camera's
        // cache sits on one. Safe only after settle(): copying a half-written
        // clip yields a playable file with the end missing, which is worse
        // than failing outright.
        await Legacy.copyAsync({ from: fromUri, to });
        await deleteLocal(fromUri);
      } catch {
        // Report what the file system said the FIRST time. Everything after it
        // was recovery, and its error describes the recovery rather than the
        // fault.
        throw new Error(
          `The phone could not save the recording (${first instanceof Error ? first.message : String(first)}).`,
        );
      }
    }
  }

  const size = sizeOf(await Legacy.getInfoAsync(to));
  if (size <= 0) throw new Error("The recording did not survive being saved.");
  return { uri: to, size };
}

/** Pull a file the server signed a URL for into a scratch directory.
 *
 *  The cache directory, not documents: this is a working copy that exists only
 *  long enough to be looked at, and the OS is welcome to reclaim it. Callers
 *  delete it themselves the moment they are done (capture/examples.ts labels
 *  the image and throws it away), so nothing server-originated accumulates on
 *  a worker's phone.
 *
 *  The first download of anything in this app. Captures move out; this is the
 *  only thing that comes in. */
export async function downloadToScratch(url: string, name: string): Promise<string> {
  const dir = `${Legacy.cacheDirectory ?? ""}examples/`;
  await Legacy.makeDirectoryAsync(dir, { intermediates: true });
  const to = dir + name;
  await Legacy.deleteAsync(to, { idempotent: true });
  const { uri, status } = await Legacy.downloadAsync(url, to);
  if (status >= 400) {
    await Legacy.deleteAsync(uri, { idempotent: true });
    throw new Error(`Download failed (${status}).`);
  }
  return uri;
}

export async function deleteLocal(uri: string | null): Promise<void> {
  if (!uri) return;
  try {
    await Legacy.deleteAsync(uri, { idempotent: true });
  } catch {
    // already gone
  }
}
