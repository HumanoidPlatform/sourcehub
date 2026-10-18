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
// It is also held to the TASK's device requirements (deviceFindings below):
// the client's capture_spec.min_android_version, min_ios_version, min_ram_gb
// ("Android 12+" from the RFP's Device Specifications) and min_megapixels.
// There is no platform floor of our own: a task that names no requirement
// asks nothing of any phone. Before the task, the assignment and offer screens
// show where the phone falls short as a warning — the worker may still accept
// and start. At the shutter the same shortfall refuses the capture
// (pipeline.ts, deviceRefusals), so a phone that cannot meet the brief never
// sends a capture that would be sent back. A figure the OS would not give is
// never held against the phone.

import * as Device from "expo-device";
import { Platform } from "react-native";
import type { CaptureSpec } from "@/api/types";
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

/** The release a version string names, to one decimal: "8.1.0" is 8.1,
 *  "17.2.1" is 17.2, "12" is 12. The client's floor is a number like 8.1, so
 *  the major alone would read an 8.1 phone as short of it. Null when the
 *  string holds no number. */
export function versionNumber(v?: string | null): number | null {
  const m = /^\s*(\d+)(?:\.(\d+))?/.exec(String(v ?? ""));
  return m ? Number(`${m[1]}.${m[2] ?? "0"}`) : null;
}

/** Where this phone falls short of what the TASK asks of it. Nothing is asked
 * that the client did not: a spec with no device fields yields nothing for
 * any phone.
 *
 * BLOCK where a capture from this phone would be refused: an OS under the
 * task's min_android_version / min_ios_version (release numbers), memory under
 * its min_ram_gb, or a camera whose largest picture is under its
 * min_megapixels on a photo-only task — every photo it took would be refused
 * by rules.ts at the shutter anyway. On a task that also takes clips the
 * camera shortfall is a WARN: the worker can still do the work in video.
 *
 * None of these stops the worker accepting or starting the task: the screens
 * before it show them as a warning. At the shutter, the OS and memory ones
 * refuse the capture (deviceRefusals, pipeline.ts).
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

  // The OS, in the release a client names ("Android 12+")
  const release = versionNumber(d.osVersion);
  const taskOs = numeric(d.os === "iOS" ? spec?.min_ios_version : spec?.min_android_version);
  if ((d.os === "iOS" || d.os === "Android") && taskOs != null && release != null && release < taskOs) {
    out.push({
      code: "device_os",
      severity: "block",
      message: `This task needs ${d.os} ${taskOs} or newer; this phone runs ${d.os} ${d.osVersion}.`,
      detail: { os: d.os, os_version: d.osVersion ?? null, api_level: d.apiLevel ?? null, floor: taskOs, source: "task" },
    });
  }

  const gb = memoryGb(d.totalMemory);
  const taskGb = numeric(spec?.min_ram_gb);
  if (gb != null && taskGb != null && gb < taskGb) {
    out.push({
      code: "device_memory",
      severity: "block",
      message: `This task needs at least ${taskGb} GB of memory; this phone has ${gb} GB.`,
      detail: { memory_gb: gb, min_gb: taskGb, source: "task" },
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

/** What refuses a capture at the shutter: the OS and memory shortfalls. The
 *  camera is judged on the photo itself there (rules.ts min_megapixels), so
 *  it is not repeated; the capture screen only says so beforehand. */
export function deviceRefusals(d: DeviceFacts, spec: CaptureSpec | null | undefined): Finding[] {
  return deviceFindings(d, null, spec).filter((f) => f.code === "device_os" || f.code === "device_memory");
}
