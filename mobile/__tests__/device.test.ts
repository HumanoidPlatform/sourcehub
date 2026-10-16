// The device profile that rides with a capture. Pure; expo-device is not read here.

import type { CaptureSpec } from "@/api/types";
import { type CameraCaps, cameraCaps, deviceFinding, deviceFindings, memoryGb } from "@/qa_pipeline/device/device";

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
  const cam = (mp: number): CameraCaps => ({ maxPhotoMp: mp, sizes: [], probedAt: "t" });
  const photo12: CaptureSpec = { media: ["photo"], min_megapixels: 12 };
  const codes = (f: { code: string; severity: string }[]) => f.map((x) => `${x.code}:${x.severity}`);

  it("says nothing about a phone that is fine", () => {
    expect(deviceFindings(good, cam(48), photo12)).toEqual([]);
  });

  it("refuses an Android under the floor, and only under it", () => {
    expect(codes(deviceFindings({ ...good, osVersion: "9", apiLevel: 28 }, null, null))).toEqual(["device_os:block"]);
    expect(deviceFindings({ ...good, osVersion: "10", apiLevel: 29 }, null, null)).toEqual([]);
    expect(deviceFindings({ ...good, osVersion: "9", apiLevel: 28 }, null, null)[0].message).toContain("Android 10 or newer");
  });

  it("reads iOS by its major version", () => {
    expect(codes(deviceFindings({ os: "iOS", osVersion: "14.8.1", totalMemory: 4 * GB }, null, null))).toEqual(["device_os:block"]);
    expect(deviceFindings({ os: "iOS", osVersion: "15.0", totalMemory: 4 * GB }, null, null)).toEqual([]);
  });

  it("refuses under 2 GB, warns under 3, and is silent above", () => {
    expect(codes(deviceFindings({ ...good, totalMemory: 1.9 * GB }, null, null))).toEqual(["device_memory:block"]);
    expect(codes(deviceFindings({ ...good, totalMemory: 2.5 * GB }, null, null))).toEqual(["device_memory:warn"]);
    expect(deviceFindings({ ...good, totalMemory: 3.1 * GB }, null, null)).toEqual([]);
  });

  it("never holds a missing figure against the phone", () => {
    expect(deviceFindings({}, null, photo12)).toEqual([]);
    expect(deviceFindings({ os: "Android", osVersion: "14", apiLevel: null, totalMemory: null }, null, photo12)).toEqual([]);
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
