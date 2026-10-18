// The device profile that rides with a capture, and the task's device
// requirements a phone is held to. Pure; expo-device is not read here.

import type { CaptureSpec } from "@/api/types";
import {
  type CameraCaps,
  cameraCaps,
  deviceFinding,
  deviceFindings,
  deviceRefusals,
  memoryGb,
  versionNumber,
} from "@/qa_pipeline/device/device";

describe("memoryGb", () => {
  it("rounds bytes to one decimal", () => {
    expect(memoryGb(2 * 1024 ** 3)).toBe(2);
    expect(memoryGb(3.47 * 1024 ** 3)).toBe(3.5);
  });

  it("says nothing when the OS said nothing", () => {
    expect(memoryGb(null)).toBeNull();
    expect(memoryGb(undefined)).toBeNull();
    expect(memoryGb(0)).toBeNull();
  });
});

describe("versionNumber", () => {
  it("reads the release to one decimal, as the client names it", () => {
    expect(versionNumber("12")).toBe(12);
    expect(versionNumber("8.1.0")).toBe(8.1);
    expect(versionNumber("17.2.1")).toBe(17.2);
    expect(versionNumber("12L")).toBe(12);
    expect(versionNumber("")).toBeNull();
    expect(versionNumber(null)).toBeNull();
  });
});

describe("deviceFinding", () => {
  it("is a measurement, never a verdict", () => {
    const f = deviceFinding({ model: "SM-A127F", os: "Android", osVersion: "13", totalMemory: 4 * 1024 ** 3 });
    expect(f.severity).toBe("info");
    expect(f.code).toBe("device_profile");
  });

  it("reads as a phone a person would recognise", () => {
    const f = deviceFinding({
      model: "SM-A127F",
      os: "Android",
      osVersion: "13",
      yearClass: 2021,
      totalMemory: 4 * 1024 ** 3,
    });
    expect(f.message).toBe("SM-A127F · Android 13 · 4 GB");
    expect(f.detail).toEqual({
      model: "SM-A127F",
      os: "Android",
      os_version: "13",
      api_level: null,
      os_build: null,
      year_class: 2021,
      memory_gb: 4,
      camera_max_mp: null,
    });
  });

  it("keeps the OS build string out of the message and in the detail", () => {
    // A real reading from a Galaxy S21 FE: Device.osName gave the whole build
    // fingerprint, which made the message longer than everything else combined.
    const fingerprint = "samsung/r9sxxx/r9s:16/BP2A.250605.031.A3/G990EXXUIHYJ2:user/release-keys";
    const f = deviceFinding({
      model: "SM-G990E",
      os: "Android",
      osVersion: "16",
      osBuild: fingerprint,
      totalMemory: 7.6 * 1024 ** 3,
    });
    expect(f.message).toBe("SM-G990E · Android 16 · 7.6 GB");
    expect(f.message).not.toContain("release-keys");
    expect(f.detail).toMatchObject({ os_build: fingerprint });
  });

  it("drops the parts the OS would not give", () => {
    expect(deviceFinding({ model: "Pixel 6", os: "Android" }).message).toBe("Pixel 6 · Android");
    expect(deviceFinding({}).message).toBe("Device did not say what it is.");
  });

  it("still records the nulls, so an absent figure is not an unasked question", () => {
    expect(deviceFinding({}).detail).toEqual({
      model: null,
      os: null,
      os_version: null,
      api_level: null,
      os_build: null,
      year_class: null,
      memory_gb: null,
      camera_max_mp: null,
    });
  });

  it("records the camera's largest picture when it has been probed", () => {
    const cam: CameraCaps = { maxPhotoMp: 12.2, sizes: ["4032x3024"], probedAt: "2026-10-16T00:00:00Z" };
    expect(deviceFinding({ apiLevel: 33 }, cam).detail).toMatchObject({ api_level: 33, camera_max_mp: 12.2 });
  });
});

describe("cameraCaps", () => {
  it("takes the largest size, in megapixels", () => {
    expect(cameraCaps(["1920x1080", "4000x3000", "640x480"], "t")?.maxPhotoMp).toBe(12);
  });

  it("is unknown when the list holds a preset rather than a size", () => {
    // iOS: the full-sensor "Photo" preset carries no number
    expect(cameraCaps(["Photo", "High", "hd4K3840x2160"], "t")).toBeNull();
    expect(cameraCaps([], "t")).toBeNull();
  });
});

describe("deviceFindings", () => {
  const GB = 1024 ** 3;
  const good = { os: "Android", osVersion: "14", apiLevel: 34, totalMemory: 6 * GB };
  // an old, small phone: nothing is asked of it unless the task asks
  const old = { os: "Android", osVersion: "8.1.0", apiLevel: 27, totalMemory: 1 * GB };
  const cam = (mp: number): CameraCaps => ({ maxPhotoMp: mp, sizes: [], probedAt: "t" });
  const photo12: CaptureSpec = { media: ["photo"], min_megapixels: 12 };
  const codes = (f: { code: string; severity: string }[]) => f.map((x) => `${x.code}:${x.severity}`);

  it("says nothing about a phone that is fine", () => {
    expect(deviceFindings(good, cam(48), photo12)).toEqual([]);
  });

  it("asks nothing of any phone when the task sets no device requirement", () => {
    // there is no platform floor: the client's spec is the only rule
    expect(deviceFindings(old, cam(2), { media: ["photo", "video"] })).toEqual([]);
    expect(deviceFindings(old, cam(2), null)).toEqual([]);
    expect(deviceFindings({ os: "iOS", osVersion: "12.5", totalMemory: 1 * GB }, null, {})).toEqual([]);
  });

  it("refuses under the task's Android requirement, in the client's words", () => {
    const task: CaptureSpec = { media: ["video"], min_android_version: 12 };
    const f = deviceFindings({ ...good, osVersion: "11", apiLevel: 30 }, null, task);
    expect(codes(f)).toEqual(["device_os:block"]);
    expect(f[0].message).toBe("This task needs Android 12 or newer; this phone runs Android 11.");
    expect(f[0].detail).toMatchObject({ source: "task", floor: 12 });
    expect(deviceFindings({ ...good, osVersion: "12", apiLevel: 31 }, null, task)).toEqual([]);
    // the client's figure may carry a decimal: 8.1 meets 8.1, 8.0 does not
    const point: CaptureSpec = { media: ["video"], min_android_version: 8.1 };
    expect(deviceFindings(old, null, point)).toEqual([]);
    expect(codes(deviceFindings({ ...old, osVersion: "8.0.0", apiLevel: 26 }, null, point))).toEqual(["device_os:block"]);
  });

  it("reads iOS by its release number against the task's", () => {
    const ios: CaptureSpec = { media: ["video"], min_ios_version: 16 };
    expect(codes(deviceFindings({ os: "iOS", osVersion: "15.7", totalMemory: 4 * GB }, null, ios))).toEqual(["device_os:block"]);
    expect(deviceFindings({ os: "iOS", osVersion: "16.0", totalMemory: 4 * GB }, null, ios)).toEqual([]);
    // an Android floor says nothing about an iPhone, and the other way round
    expect(deviceFindings({ os: "iOS", osVersion: "12.0", totalMemory: 4 * GB }, null, { media: ["video"], min_android_version: 14 })).toEqual([]);
    expect(deviceFindings(old, null, ios)).toEqual([]);
  });

  it("refuses under the task's memory requirement, and names the task's figure", () => {
    const task: CaptureSpec = { media: ["video"], min_ram_gb: 4 };
    const f = deviceFindings({ ...good, totalMemory: 3.5 * GB }, null, task);
    expect(codes(f)).toEqual(["device_memory:block"]);
    expect(f[0].message).toBe("This task needs at least 4 GB of memory; this phone has 3.5 GB.");
    expect(f[0].detail).toMatchObject({ source: "task", min_gb: 4 });
    expect(deviceFindings({ ...good, totalMemory: 4 * GB }, null, task)).toEqual([]);
  });

  it("never holds a missing figure against the phone, whatever the task says", () => {
    const strict: CaptureSpec = { media: ["photo"], min_android_version: 12, min_ram_gb: 4, min_megapixels: 12 };
    expect(deviceFindings({}, null, strict)).toEqual([]);
    expect(deviceFindings({ os: "Android" }, null, strict)).toEqual([]);
    expect(deviceFindings({ os: "Android", osVersion: "14", apiLevel: null, totalMemory: null }, null, strict)).toEqual([]);
  });

  it("refuses a camera under the task's floor, with the same slack as rules.ts", () => {
    expect(codes(deviceFindings(good, cam(8), photo12))).toEqual(["device_camera:block"]);
    expect(deviceFindings(good, cam(8), photo12)[0].message).toBe(
      "This task needs a 12 MP camera; this phone's camera takes up to 8 MP.",
    );
    expect(deviceFindings(good, cam(11.96), photo12)).toEqual([]);
    expect(codes(deviceFindings(good, cam(11.9), photo12))).toEqual(["device_camera:block"]);
  });

  it("only warns about the camera when the task takes clips too", () => {
    const both: CaptureSpec = { media: ["photo", "video"], min_megapixels: 12 };
    expect(codes(deviceFindings(good, cam(8), both))).toEqual(["device_camera:warn"]);
  });

  it("says nothing about a camera not yet probed, or a task with no floor", () => {
    expect(deviceFindings(good, null, photo12)).toEqual([]);
    expect(deviceFindings(good, cam(2), { media: ["photo"] })).toEqual([]);
    expect(deviceFindings(good, cam(2), { media: ["video"], min_megapixels: 12 })).toEqual([]);
  });
});

describe("deviceRefusals", () => {
  const GB = 1024 ** 3;
  const strict: CaptureSpec = { media: ["photo"], min_android_version: 12, min_ram_gb: 4, min_megapixels: 12 };

  it("is what refuses a capture at the shutter: the OS and memory shortfalls, never the camera", () => {
    // the camera is judged on the photo itself by rules.ts; here it would only repeat that
    const short = { os: "Android", osVersion: "11", apiLevel: 30, totalMemory: 3 * GB };
    expect(deviceRefusals(short, strict).map((f) => `${f.code}:${f.severity}`)).toEqual([
      "device_os:block",
      "device_memory:block",
    ]);
    expect(deviceRefusals({ os: "Android", osVersion: "14", apiLevel: 34, totalMemory: 6 * GB }, strict)).toEqual([]);
  });

  it("refuses nothing when the task asks nothing, or the phone would not say", () => {
    expect(deviceRefusals({ os: "Android", osVersion: "8.1.0", totalMemory: 1 * GB }, { media: ["photo"] })).toEqual([]);
    expect(deviceRefusals({ os: "Android" }, strict)).toEqual([]);
  });
});
