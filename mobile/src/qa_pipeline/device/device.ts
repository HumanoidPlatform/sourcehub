// Which phone took this.
//
// The QA pipeline is about to start asking whether a model can run on a
// worker's handset, and nobody can answer that today: we have never recorded
// what the crowd actually carries. An Android version and a memory figure
// decide whether a second inference runtime is affordable at all, and they
// cost a few dozen bytes per capture.
//
// It rides with the capture rather than going to an endpoint of its own. That
// is not only cheaper — no route, no table, no migration — it is also the
// better shape: a reviewer looking at a poor capture can see it came from a
// 2 GB device, which is a fact about that file and not only about that
// worker. One query over asset.check_results then answers the fleet question.
//
// Severity "info", like every other measurement here: never shown to the
// worker, never a verdict, recorded for whoever is deciding.
//
// expo-device reads these from the OS at startup and they never change, so
// this is a constant per install. Nothing here identifies a person beyond
// what the account already does.

//
// It is also a GATE now, before a task starts (deviceFindings below): a phone
// under the platform floor (config MIN_ANDROID_API, MIN_IOS_MAJOR, MIN_RAM_GB),
// or whose camera cannot reach the task's min_megapixels, is told so on the
// assignment screen — before the worker travels, not shot by shot at the site.
// A figure the OS would not give is never held against the phone.

import * as Device from "expo-device";
import { Platform } from "react-native";
import type { CaptureSpec } from "@/api/types";
import { MIN_ANDROID_API, MIN_IOS_MAJOR, MIN_RAM_GB, WARN_RAM_GB } from "@/config";
import { type Finding, mediaKinds, numeric } from "@/qa_pipeline/rules/rules";

/** What the back camera can take, probed once per install on the capture
 *  screen (qa_pipeline/device/camera.ts) — the camera has to be mounted to say. */
export interface CameraCaps {
  maxPhotoMp: number;
  sizes: string[];
  probedAt: string;
}

export interface DeviceFacts {
  model?: string | null;
  os?: string | null;
  osVersion?: string | null;
  /** Android's API level; null on iOS, where osVersion answers instead */
  apiLevel?: number | null;
  /** the OS's own build string, when it gives one — kept for a reviewer
   *  chasing a fault that only happens on one ROM, never for the message */
  osBuild?: string | null;
  /** expo-device's rough age band. Blunt: a 2021 Galaxy S21 FE reports 2016.
   *  Recorded because it costs nothing, but `totalMemory` is the number to
   *  judge capability by. */
  yearClass?: number | null;
  /** bytes, as the OS reports them */
  totalMemory?: number | null;
}

const OS_NAME: Record<string, string> = { android: "Android", ios: "iOS" };

/** What this phone is, read once from the OS. */
export function thisDevice(): DeviceFacts {
  return {
    model: Device.modelName,
    // Platform.OS, not Device.osName. On Android the latter can return the
    // whole build fingerprint — "samsung/r9sxxx/r9s:16/BP2A.250605.031.A3/
    // G990EXXUIHYJ2:user/release-keys" — which is true, useless in a one-line
    // message, and longer than the rest of the finding put together.
    os: OS_NAME[Platform.OS] ?? Platform.OS,
    osVersion: Device.osVersion,
    apiLevel: Platform.OS === "android" ? Device.platformApiLevel : null,
    osBuild: Device.osName,
    yearClass: Device.deviceYearClass,
    totalMemory: Device.totalMemory,
  };
}

const GB = 1024 * 1024 * 1024;

/** Bytes to gigabytes, one decimal; null when the OS would not say. */
export function memoryGb(bytes?: number | null): number | null {
  if (typeof bytes !== "number" || !(bytes > 0)) return null;
  return Math.round((bytes / GB) * 10) / 10;
}

export function deviceFinding(d: DeviceFacts, camera?: CameraCaps | null): Finding {
  const gb = memoryGb(d.totalMemory);
  const parts = [
    d.model,
    [d.os, d.osVersion].filter(Boolean).join(" ") || null,
    gb != null ? `${gb} GB` : null,
  ].filter((p): p is string => Boolean(p));
  return {
    code: "device_profile",
    severity: "info",
    message: parts.length > 0 ? parts.join(" · ") : "Device did not say what it is.",
    detail: {
      model: d.model ?? null,
      os: d.os ?? null,
      os_version: d.osVersion ?? null,
      api_level: d.apiLevel ?? null,
      os_build: d.osBuild ?? null,
      year_class: d.yearClass ?? null,
      memory_gb: gb,
      camera_max_mp: camera?.maxPhotoMp ?? null,
    },
  };
}

/** The camera's sizes as expo-camera lists them ("4000x3000") read as its
 *  largest picture. Null when any entry is not a size: iOS answers with
 *  presets ("Photo", "High", "hd4K3840x2160"), and the full-sensor "Photo"
 *  preset has no number in it — taking the largest number that IS listed
 *  would understate the camera and refuse a phone that is fine. */
export function cameraCaps(sizes: string[], probedAt: string): CameraCaps | null {
  let best = 0;
  for (const raw of sizes) {
    const m = /^\s*(\d+)\s*x\s*(\d+)\s*$/i.exec(raw);
    if (!m) return null;
    best = Math.max(best, Number(m[1]) * Number(m[2]));
  }
  if (best <= 0) return null;
  return { maxPhotoMp: Math.round(best / 1e5) / 10, sizes, probedAt };
}

/** The release a worker knows by name, for the API levels near the floor. */
const ANDROID_RELEASE: Record<number, string> = { 26: "8", 27: "8.1", 28: "9", 29: "10", 30: "11", 31: "12", 32: "12L", 33: "13", 34: "14", 35: "15", 36: "16" };

function androidName(api: number): string {
  return ANDROID_RELEASE[api] ?? `API ${api}`;
}

/** The leading number of a version string: "17.2.1" is 17. */
function majorOf(v?: string | null): number | null {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Whether this phone can do this task, asked before it starts.
 *
 * BLOCK where the phone clearly cannot: an OS under the platform floor, memory
 * under MIN_RAM_GB, or a camera whose largest picture is under the task's
 * min_megapixels on a photo-only task — every photo it took would be refused
 * by rules.ts at the shutter anyway. On a task that also takes clips the
 * camera shortfall is a WARN: the worker can still do the work in video.
 *
 * WARN on memory under WARN_RAM_GB: the phone will manage, slowly.
 *
 * Nothing where a figure is missing. A camera not yet probed (a fresh install
 * that has never opened the capture screen) is asked again there, before the
 * first shot. Clip resolution is not judged here at all: expo-camera has no
 * way to list what a phone can record, so min_video_lines stays a capture-time
 * check in rules.ts. */
export function deviceFindings(
  d: DeviceFacts,
  camera: CameraCaps | null,
  spec: CaptureSpec | null | undefined,
  targetUnit?: string | null,
): Finding[] {
  const out: Finding[] = [];

  const os = d.os === "iOS" ? majorOf(d.osVersion) : (d.apiLevel ?? null);
  const floor = d.os === "iOS" ? MIN_IOS_MAJOR : MIN_ANDROID_API;
  if (os != null && (d.os === "iOS" || d.os === "Android") && os < floor) {
    out.push({
      code: "device_os",
      severity: "block",
      message:
        d.os === "iOS"
          ? `This phone runs iOS ${d.osVersion}; tasks need iOS ${MIN_IOS_MAJOR} or newer.`
          : `This phone runs Android ${d.osVersion ?? androidName(os)}; tasks need Android ${androidName(floor)} or newer.`,
      detail: { os: d.os, os_version: d.osVersion ?? null, api_level: d.apiLevel ?? null, floor },
    });
  }

  const gb = memoryGb(d.totalMemory);
  if (gb != null && gb < WARN_RAM_GB) {
    const refuse = gb < MIN_RAM_GB;
    out.push({
      code: "device_memory",
      severity: refuse ? "block" : "warn",
      message: refuse
        ? `This phone has ${gb} GB of memory; tasks need at least ${MIN_RAM_GB} GB.`
        : `This phone has ${gb} GB of memory, so checking each capture may be slow.`,
      detail: { memory_gb: gb, min_gb: MIN_RAM_GB, warn_gb: WARN_RAM_GB },
    });
  }

  const min = numeric(spec?.min_megapixels);
  const kinds = mediaKinds(spec, targetUnit);
  if (min != null && camera && kinds.includes("photo") && camera.maxPhotoMp < min - 0.05) {
    const videoToo = kinds.includes("video");
    out.push({
      code: "device_camera",
      severity: videoToo ? "warn" : "block",
      message: `This task needs a ${min} MP camera; this phone's camera takes up to ${camera.maxPhotoMp} MP.${
        videoToo ? " Its photos will be refused; record clips instead." : ""
      }`,
      detail: { camera_max_mp: camera.maxPhotoMp, min_megapixels: min },
    });
  }

  return out;
}
