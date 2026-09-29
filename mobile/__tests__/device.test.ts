// The device profile that rides with a capture. Pure; expo-device is not read here.

import { deviceFinding, memoryGb } from "@/capture/device";

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
      os_build: null,
      year_class: 2021,
      memory_gb: 4,
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
      os_build: null,
      year_class: null,
      memory_gb: null,
    });
  });
});
