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

import * as Device from "expo-device";
import { Platform } from "react-native";
import type { Finding } from "@/validation/rules";

export interface DeviceFacts {
  model?: string | null;
  os?: string | null;
  osVersion?: string | null;
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

export function deviceFinding(d: DeviceFacts): Finding {
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
      os_build: d.osBuild ?? null,
      year_class: d.yearClass ?? null,
      memory_gb: gb,
    },
  };
}
