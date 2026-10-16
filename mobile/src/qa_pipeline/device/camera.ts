// What the back camera can take, asked once per install.
//
// expo-camera only answers through a mounted CameraView, so the question is
// put on the capture screen (onCameraReady) and the answer kept in the device
// store for the assignment screen, which has no camera. A camera does not
// change, so once answered it is never asked again.
//
// Every failure reads as "unknown", and unknown is never held against the
// phone (device.ts deviceFindings).

import type { CameraView } from "expo-camera";
import { getKv, setKv } from "@/db/kv";
import { type CameraCaps, cameraCaps } from "@/qa_pipeline/device/device";

const KEY = "camera_caps";

export async function cachedCamera(): Promise<CameraCaps | null> {
  try {
    const raw = await getKv(KEY);
    if (!raw) return null;
    const caps = JSON.parse(raw) as CameraCaps;
    return typeof caps?.maxPhotoMp === "number" && caps.maxPhotoMp > 0 ? caps : null;
  } catch {
    return null;
  }
}

/** The cached answer, or the camera's own when there is none yet. */
export async function probeCamera(cam: CameraView): Promise<CameraCaps | null> {
  const known = await cachedCamera();
  if (known) return known;
  try {
    const caps = cameraCaps(await cam.getAvailablePictureSizesAsync(), new Date().toISOString());
    if (caps) await setKv(KEY, JSON.stringify(caps));
    return caps;
  } catch {
    return null;
  }
}
