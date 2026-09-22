// Frames out of a clip, for validation/clip.ts and validation/subject.ts to
// judge. The one file that touches the three native pieces this needs:
// expo-video-thumbnails pulls a frame at a timestamp, expo-image-manipulator
// shrinks it to a 16×16 patch, jpeg-js (pure JS) turns that patch into pixels
// — React Native has no other way to read them. Nothing here decides
// anything; it produces frames and cleans up after itself.
//
// A budget, not a count: each frame is two native calls plus the labeller,
// and a ten-minute clip on a slow phone must still answer in the time a
// worker will wait with the shutter blocked. The clock is checked between
// frames — a native call cannot be interrupted, so the budget can overrun by
// one frame's worth.

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";
import { decode } from "jpeg-js";
import { greyOf } from "@/validation/clip";
import { deleteLocal } from "./files";

export interface Frame {
  /** seconds from the start */
  time: number;
  /** a JPEG of the frame at the clip's own size, on disk until `each` returns */
  uri: string;
  width: number;
  height: number;
  /** 256 grey values, the 16×16 patch row by row */
  grey: Uint8Array;
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

async function greyPatch(frameUri: string): Promise<Uint8Array> {
  const ctx = ImageManipulator.manipulate(frameUri);
  let saved: string | null = null;
  try {
    const ref = await ctx.resize({ width: PATCH, height: PATCH }).renderAsync();
    try {
      const out = await ref.saveAsync({ base64: true, format: SaveFormat.JPEG, compress: 0.9 });
      saved = out.uri;
      if (!out.base64) throw new Error("no pixels back from the resize");
      const img = decode(bytesOf(out.base64), { useTArray: true, formatAsRGBA: true });
      return greyOf(img.data);
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
      const grey = await greyPatch(shot.uri);
      await each({ time: times[i], uri: shot.uri, width: shot.width, height: shot.height, grey }, i);
      done++;
      onProgress?.(done, times.length);
    } finally {
      await deleteLocal(shot.uri);
    }
  }
  return { done, timedOut: false };
}
