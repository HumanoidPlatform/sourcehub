// What the browser can learn about a picked file before deciding anything.
// The phone gets its facts from the camera at shutter time; here they have to
// be read back out of the file, and some of them cannot be (HEIC will not
// decode in most browsers, a video carries no EXIF). Everything that could not
// be learned is reported as null and left for checks.ts to name honestly.

import { parse } from "exifr";
import { PHOTO_EXTENSIONS, VIDEO_EXTENSIONS } from "./config";
import type { Facts, Kind } from "./rules";

/** the media kind, decided the way the server decides it: by extension */
export function kindOf(filename: string): Kind | null {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = filename.slice(dot).toLowerCase();
  if ((PHOTO_EXTENSIONS as readonly string[]).includes(ext)) return "photo";
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(ext)) return "video";
  return null;
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".heic": "image/heic",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

/** The browser's own type when it offers one; the extension's when it does
 *  not (Windows leaves .mov and .heic blank). The server stores this verbatim
 *  and storage records it on the PUT, so an empty string is not an option. */
export function mimeOf(file: File): string {
  if (file.type) return file.type;
  const dot = file.name.lastIndexOf(".");
  return (dot >= 0 && MIME_BY_EXT[file.name.slice(dot).toLowerCase()]) || "application/octet-stream";
}

export interface Dimensions {
  width: number;
  height: number;
}

/** The pieces of the browser a test can stand in for. */
export interface Probes {
  image(file: File): Promise<Dimensions | null>;
  video(file: File): Promise<(Dimensions & { duration: number }) | null>;
  exif(file: File): Promise<{ capturedAt: Date | null; lat: number | null; lon: number | null }>;
}

// imageOrientation: "from-image" applies the EXIF rotation before we read the
// size. Without it a portrait photo tagged orientation 6 reads as landscape —
// it is stored that way on disk — and the orientation check would refuse
// correctly-shot work.
async function imageProbe(file: File): Promise<Dimensions | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const d = { width: bmp.width, height: bmp.height };
    bmp.close();
    return d;
  } catch {
    return null; // HEIC, or a file the browser cannot decode: not our call to make
  }
}

async function videoProbe(file: File): Promise<(Dimensions & { duration: number }) | null> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      const done = (r: (Dimensions & { duration: number }) | null) => {
        v.onloadedmetadata = null;
        v.onerror = null;
        v.removeAttribute("src");
        resolve(r);
      };
      v.onloadedmetadata = () =>
        done({ width: v.videoWidth, height: v.videoHeight, duration: Number.isFinite(v.duration) ? v.duration : 0 });
      v.onerror = () => done(null);
      setTimeout(() => done(null), 10_000);
      v.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function exifProbe(file: File): Promise<{ capturedAt: Date | null; lat: number | null; lon: number | null }> {
  try {
    const tags = (await parse(file, { pick: ["DateTimeOriginal"], gps: true })) as
      | { DateTimeOriginal?: unknown; latitude?: unknown; longitude?: unknown }
      | undefined;
    const at = tags?.DateTimeOriginal;
    const lat = tags?.latitude;
    const lon = tags?.longitude;
    return {
      capturedAt: at instanceof Date && !Number.isNaN(at.getTime()) ? at : null,
      lat: typeof lat === "number" && Number.isFinite(lat) ? lat : null,
      lon: typeof lon === "number" && Number.isFinite(lon) ? lon : null,
    };
  } catch {
    return { capturedAt: null, lat: null, lon: null };
  }
}

export const browserProbes: Probes = { image: imageProbe, video: videoProbe, exif: exifProbe };

export interface Derived {
  facts: Facts;
  mime: string;
  /** ISO; EXIF when the file has it, else the file's modified time */
  captured_at: string;
  captured_from_exif: boolean;
  lat: number | null;
  lon: number | null;
  /** seconds, video only */
  duration: number | null;
  /** false when the dimensions could not be read (HEIC, a broken file) */
  decoded: boolean;
}

/** Everything the browser can say about a file. Never throws: a file that
 *  cannot be probed comes back with nulls, and checks.ts decides what that
 *  means. A file of no known kind is not a capture and is refused upstream by
 *  kindOf(); this takes a kind so it need not repeat that. */
export async function deriveFacts(file: File, kind: Kind, probes: Probes = browserProbes): Promise<Derived> {
  const video = kind === "video" ? await probes.video(file) : null;
  const dims = kind === "photo" ? await probes.image(file) : video;
  const exif = kind === "photo" ? await probes.exif(file) : { capturedAt: null, lat: null, lon: null };
  const hasGps = exif.lat != null && exif.lon != null;
  return {
    facts: {
      kind,
      size: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      duration: video?.duration ?? null,
      // an EXIF position has no accuracy figure; rules.ts treats a null
      // accuracy as "the platform withheld it", which is the right reading
      fix: hasGps ? { accuracy: null, stale: false } : null,
      tilt: null,
    },
    mime: mimeOf(file),
    captured_at: (exif.capturedAt ?? new Date(file.lastModified || Date.now())).toISOString(),
    captured_from_exif: exif.capturedAt != null,
    lat: exif.lat,
    lon: exif.lon,
    duration: video?.duration ?? null,
    decoded: dims != null,
  };
}
