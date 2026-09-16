import { describe, expect, it } from "vitest";
import { deriveFacts, kindOf, mimeOf, type Probes } from "./facts";

function file(name: string, opts: { type?: string; size?: number; lastModified?: number } = {}): File {
  const f = new File([new Uint8Array(opts.size ?? 10)], name, { type: opts.type ?? "", lastModified: opts.lastModified ?? 1_700_000_000_000 });
  return f;
}

const silent: Probes = {
  image: async () => null,
  video: async () => null,
  exif: async () => ({ capturedAt: null, lat: null, lon: null }),
};

describe("kindOf", () => {
  it("decides by extension, the way the server does", () => {
    expect(kindOf("a.jpg")).toBe("photo");
    expect(kindOf("a.JPEG")).toBe("photo");
    expect(kindOf("shelf.HEIC")).toBe("photo");
    expect(kindOf("clip.MOV")).toBe("video");
    expect(kindOf("clip.mp4")).toBe("video");
  });
  it("refuses what the server would refuse", () => {
    expect(kindOf("a.gif")).toBeNull();
    expect(kindOf("a.pdf")).toBeNull();
    expect(kindOf("noext")).toBeNull();
  });
});

describe("mimeOf", () => {
  it("prefers the browser's own type", () => {
    expect(mimeOf(file("a.jpg", { type: "image/jpeg" }))).toBe("image/jpeg");
  });
  // Windows leaves .mov and .heic blank, and the server stores this verbatim.
  it("fills a blank type from the extension", () => {
    expect(mimeOf(file("a.mov"))).toBe("video/quicktime");
    expect(mimeOf(file("a.heic"))).toBe("image/heic");
  });
});

describe("deriveFacts", () => {
  it("reads dimensions and EXIF for a photo", async () => {
    const probes: Probes = {
      ...silent,
      image: async () => ({ width: 3024, height: 4032 }),
      exif: async () => ({ capturedAt: new Date("2026-09-01T08:00:00Z"), lat: 12.97, lon: 77.59 }),
    };
    const d = await deriveFacts(file("a.jpg", { type: "image/jpeg", size: 5 }), "photo", probes);
    expect(d.facts).toMatchObject({ kind: "photo", size: 5, width: 3024, height: 4032, fix: { accuracy: null, stale: false }, tilt: null });
    expect(d.captured_at).toBe("2026-09-01T08:00:00.000Z");
    expect(d.captured_from_exif).toBe(true);
    expect(d.lat).toBe(12.97);
    expect(d.decoded).toBe(true);
  });

  // presign refuses a request without captured_at, so the fallback is not optional
  it("falls back to the file's modified time when there is no EXIF", async () => {
    const d = await deriveFacts(file("a.png", { lastModified: 1_700_000_000_000 }), "photo", silent);
    expect(d.captured_at).toBe(new Date(1_700_000_000_000).toISOString());
    expect(d.captured_from_exif).toBe(false);
    expect(d.facts.fix).toBeNull();
    expect(d.decoded).toBe(false);
    expect(d.facts.width).toBeNull();
  });

  it("takes duration from a video and never asks it for EXIF", async () => {
    let exifCalls = 0;
    const probes: Probes = {
      ...silent,
      video: async () => ({ width: 1920, height: 1080, duration: 42.5 }),
      exif: async () => {
        exifCalls++;
        return { capturedAt: null, lat: null, lon: null };
      },
    };
    const d = await deriveFacts(file("c.mp4"), "video", probes);
    expect(d.duration).toBe(42.5);
    expect(d.facts.width).toBe(1920);
    expect(exifCalls).toBe(0);
  });
});
