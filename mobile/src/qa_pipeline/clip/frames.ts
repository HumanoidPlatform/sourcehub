// Frames out of a clip, and pixels out of any image, for the checks to judge.
// The one file that touches the three native pieces this needs:
// expo-video-thumbnails pulls a frame at a timestamp, expo-image-manipulator
// shrinks it to QUALITY_WIDTH wide, jpeg-js (pure JS) turns that into pixels
// — React Native has no other way to read them. The grey image feeds blur/
// and exposure/; its 16×16 average feeds clip.ts. Nothing here decides
// anything; it produces pixels and cleans up after itself.
//
// A budget, not a count: each frame is two native calls plus the labeller,
// and a ten-minute clip on a slow phone must still answer in the time a
// worker will wait with the shutter blocked. The clock is checked between
// frames — a native call cannot be interrupted, so the budget can overrun by
// one frame's worth.

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";
import { decode } from "jpeg-js";
import { QUALITY_WIDTH } from "@/config";
import { greyOf } from "@/qa_pipeline/clip/clip";
import { type GreyImage, patchOf } from "@/qa_pipeline/grey";
import { deleteLocal } from "@/capture/files";

export interface Frame {
  /** seconds from the start */
  time: number;
  /** a JPEG of the frame at the clip's own size, on disk until `each` returns */
  uri: string;
  width: number;
  height: number;
  /** 256 grey values, the 16×16 patch row by row */
  grey: Uint8Array;
  /** the frame QUALITY_WIDTH wide, in grey, for the focus and exposure checks */
  image: GreyImage;
}

const PATCH = 16;

function bytesOf(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** The frame at `timeS`, as a JPEG at the clip's displayed size — the
 *  thumbnailer applies the container's rotation, so a portrait recording
 *  comes back taller than wide, which is what rules.ts needs to know. */
export async function frameAt(videoUri: string, timeS: number): Promise<{ uri: string; width: number; height: number }> {
  return VideoThumbnails.getThumbnailAsync(videoUri, { time: Math.round(timeS * 1000), quality: 0.6 });
}

/** The image `width` pixels wide (height to scale), in grey. Saved at full
 *  JPEG quality: compression artefacts are exactly the small sharp edges the
 *  blur check would otherwise mistake for focus. */
export async function greyImage(imageUri: string, width = QUALITY_WIDTH): Promise<GreyImage> {
  const ctx = ImageManipulator.manipulate(imageUri);
  let saved: string | null = null;
  try {
    const ref = await ctx.resize({ width }).renderAsync();
    try {
      const out = await ref.saveAsync({ base64: true, format: SaveFormat.JPEG, compress: 1 });
      saved = out.uri;
      if (!out.base64) throw new Error("no pixels back from the resize");
      const img = decode(bytesOf(out.base64), { useTArray: true, formatAsRGBA: true });
      return { width: img.width, height: img.height, data: greyOf(img.data) };
    } finally {
      ref.release();
    }
  } finally {
    ctx.release();
    await deleteLocal(saved);
  }
}

export interface Sampled {
  /** frames handed to `each`, in time order */
  done: number;
  /** the budget ran out before every time was visited */
  timedOut: boolean;
}

/** Visit the clip at each time, in order, calling `each` with the frame while
 *  its JPEG is still on disk; the JPEG is deleted afterwards. Stops early
 *  when the budget is spent. A frame the thumbnailer cannot produce (a time
 *  past the last keyframe, a corrupt stretch) is skipped, not fatal. */
export async function sampleFrames(
  videoUri: string,
  times: number[],
  budgetMs: number,
  each: (frame: Frame, index: number) => Promise<void>,
  onProgress?: (done: number, total: number) => void,
): Promise<Sampled> {
  const started = Date.now();
  let done = 0;
  for (let i = 0; i < times.length; i++) {
    if (Date.now() - started > budgetMs) return { done, timedOut: true };
    let shot: { uri: string; width: number; height: number };
    try {
      shot = await frameAt(videoUri, times[i]);
    } catch {
      continue;
    }
    try {
      // One resize serves every pixel check: the 16×16 patch is the quality
      // image averaged down, not a second trip through the native resizer.
      const image = await greyImage(shot.uri);
      const grey = patchOf(image, PATCH);
      await each({ time: times[i], uri: shot.uri, width: shot.width, height: shot.height, grey, image }, i);
      done++;
      onProgress?.(done, times.length);
    } finally {
      await deleteLocal(shot.uri);
    }
  }
  return { done, timedOut: false };
}
