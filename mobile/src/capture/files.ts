// Captures live in the app's private document directory until the server has
// confirmed them. No storage permission is needed for that, and an uninstall
// removes them — which is why Settings shows how many are still queued.

import * as Legacy from "expo-file-system/legacy";

export function capturesDir(assignmentId: string): string {
  return `${Legacy.documentDirectory ?? ""}captures/${assignmentId}/`;
}

export async function moveIntoPrivateDir(fromUri: string, assignmentId: string, name: string): Promise<{ uri: string; size: number }> {
  const dir = capturesDir(assignmentId);
  await Legacy.makeDirectoryAsync(dir, { intermediates: true });
  const to = dir + name;
  await Legacy.moveAsync({ from: fromUri, to });
  const info = await Legacy.getInfoAsync(to);
  const size = info.exists && "size" in info && typeof info.size === "number" ? info.size : 0;
  return { uri: to, size };
}

export async function deleteLocal(uri: string | null): Promise<void> {
  if (!uri) return;
  try {
    await Legacy.deleteAsync(uri, { idempotent: true });
  } catch {
    // already gone
  }
}
