import type { CaptureSpec } from "@/api/types";
import { blocking, checkCapture, mediaKinds, type Facts } from "@/validation/rules";

const MB = 1024 * 1024;

// A photo that nothing in the rules has any quarrel with.
const good: Facts = { kind: "photo", size: 4 * MB, width: 4032, height: 3024, fix: null };

const codes = (f: { code: string }[]) => f.map((x) => x.code);

describe("mediaKinds", () => {
  it("reads the list the server sends", () => {
    expect(mediaKinds({ media: ["photo"] })).toEqual(["photo"]);
    expect(mediaKinds({ media: ["video"] })).toEqual(["video"]);
    expect(mediaKinds({ media: ["photo", "video"] })).toEqual(["photo", "video"]);
  });

  // Tasks created before capture-spec inheritance carry a bare string, and
  // reading it as a list is what locked a video task into photo mode.
  it("still reads the older scalar", () => {
    expect(mediaKinds({ media: "video" })).toEqual(["video"]);
    expect(mediaKinds({ media: "both" })).toEqual(["photo", "video"]);
  });

  it("accepts the server's own vocabulary", () => {
    expect(mediaKinds({ media: ["image"] })).toEqual(["photo"]);
    expect(mediaKinds({ media: ["clips"] })).toEqual(["video"]);
  });

  it("falls back to the unit, then to anything visual", () => {
    expect(mediaKinds({}, "photos")).toEqual(["photo"]);
    expect(mediaKinds({}, "videos")).toEqual(["video"]);
    expect(mediaKinds({}, "sites")).toEqual(["photo", "video"]);
    expect(mediaKinds(null)).toEqual(["photo", "video"]);
  });

  it("ignores a value it does not recognise", () => {
    expect(mediaKinds({ media: ["hologram"] }, "photos")).toEqual(["photo"]);
  });
});

describe("checkCapture", () => {
  it("says nothing about a capture that meets the spec", () => {
    expect(checkCapture(good, { media: ["photo"] })).toEqual([]);
  });

  it("blocks the kind the server would refuse", () => {
    const f = checkCapture({ ...good, kind: "video" }, { media: ["photo"] });
    expect(codes(f)).toEqual(["media_kind"]);
    expect(f[0].severity).toBe("block");
  });

  it("blocks a photo over the cap before it costs a byte", () => {
    const f = checkCapture({ ...good, size: 26 * MB }, { media: ["photo"] });
    expect(codes(f)).toEqual(["size"]);
    expect(f[0].severity).toBe("block");
  });

  // The caps differ, and using the photo cap for a video would refuse
  // four fifths of the videos the server is happy to take.
  it("holds a video to the video cap", () => {
    const spec: CaptureSpec = { media: ["video"] };
    expect(checkCapture({ ...good, kind: "video", size: 40 * MB }, spec)).toEqual([]);
    expect(codes(checkCapture({ ...good, kind: "video", size: 101 * MB }, spec))).toEqual(["size"]);
  });

  it("refuses a capture below the megapixel floor", () => {
    const f = checkCapture({ ...good, width: 1280, height: 720 }, { media: ["photo"], min_megapixels: 12 });
    expect(codes(f)).toEqual(["resolution"]);
    expect(f[0].severity).toBe("block");
  });

  // A "12 MP" sensor gives 4032x3024 = 12.19 MP, but a 12 MP ask against a
  // 4000x3000 sensor is 12.0 exactly minus rounding — the tolerance is what
  // stops a client's own chosen camera failing its own requirement.
  it("does not flag a sensor that only just meets the floor", () => {
    expect(checkCapture({ ...good, width: 4000, height: 3000 }, { media: ["photo"], min_megapixels: 12 })).toEqual([]);
  });

  it("ignores the megapixel floor on a video and when dimensions are unknown", () => {
    const spec: CaptureSpec = { media: ["photo", "video"], min_megapixels: 12 };
    expect(checkCapture({ ...good, kind: "video", width: null, height: null }, spec)).toEqual([]);
    expect(checkCapture({ ...good, width: undefined, height: undefined }, spec)).toEqual([]);
  });

  it("refuses the wrong orientation", () => {
    const spec: CaptureSpec = { media: ["photo"], orientation: "landscape" };
    expect(checkCapture({ ...good, width: 3024, height: 4032 }, spec)[0]).toMatchObject({
      code: "orientation",
      severity: "block",
    });
    expect(checkCapture(good, spec)).toEqual([]);
  });

  it("says nothing about orientation when the client did not ask", () => {
    expect(checkCapture({ ...good, width: 3024, height: 4032 }, { media: ["photo"], orientation: "" })).toEqual([]);
  });
});

describe("checkCapture · location", () => {
  const spec: CaptureSpec = { media: ["photo"], require_gps: true };

  it("is silent when the task does not ask for a fix", () => {
    expect(checkCapture({ ...good, fix: null }, { media: ["photo"] })).toEqual([]);
  });

  // require_gps is a condition the client stated, so it gates like the rest.
  // A worker indoors cannot capture at all on such a task — deliberate, and
  // the reason the two fix-QUALITY signals below stay advisory.
  it("refuses a capture when a required fix is missing", () => {
    const f = checkCapture({ ...good, fix: null }, spec);
    expect(codes(f)).toEqual(["gps_missing"]);
    expect(codes(blocking(f))).toEqual(["gps_missing"]);
  });

  // These two describe the FIX, not the image, and the worker can do nothing
  // about either: location.ts gives up on a fresh position after five seconds,
  // and indoor accuracy is routinely poor. They stay advisory even though
  // everything a client actually asked for now gates — pinned here so the
  // distinction cannot quietly erode.
  it("keeps a capture whose fix is the last known one, with a warning", () => {
    const f = checkCapture({ ...good, fix: { accuracy: 8, stale: true } }, spec);
    expect(codes(f)).toEqual(["gps_stale"]);
    expect(f[0].severity).toBe("warn");
    expect(blocking(f)).toEqual([]);
  });

  it("keeps a capture whose fix is too loose, with a warning", () => {
    const f = checkCapture({ ...good, fix: { accuracy: 2000, stale: false } }, spec);
    expect(codes(f)).toEqual(["gps_accuracy"]);
    expect(f[0].severity).toBe("warn");
    expect(blocking(f)).toEqual([]);
  });

  it("accepts a good fix, and one whose accuracy the platform withheld", () => {
    expect(checkCapture({ ...good, fix: { accuracy: 9, stale: false } }, spec)).toEqual([]);
    expect(checkCapture({ ...good, fix: { accuracy: null, stale: false } }, spec)).toEqual([]);
  });
});

describe("checkCapture · tilt", () => {
  const spec: CaptureSpec = { media: ["photo"], max_tilt_deg: 10 };

  it("is silent when the client did not ask for squareness", () => {
    expect(checkCapture({ ...good, tilt: { off: 40 } }, { media: ["photo"] })).toEqual([]);
  });

  it("accepts a capture within tolerance", () => {
    expect(checkCapture({ ...good, tilt: { off: 6 } }, spec)).toEqual([]);
  });

  it("refuses a capture beyond the tolerance", () => {
    const f = checkCapture({ ...good, tilt: { off: 23 } }, spec);
    expect(codes(f)).toEqual(["tilt"]);
    expect(f[0].severity).toBe("block");
    expect(f[0].message).toContain("23");
  });

  // A device with no accelerometer, or one that reported nothing usable in
  // time, must not be treated as a tilted capture.
  it("says nothing when no reading was taken", () => {
    expect(checkCapture({ ...good, tilt: null }, spec)).toEqual([]);
    expect(checkCapture({ ...good }, spec)).toEqual([]);
  });
});

describe("blocking", () => {
  // Every condition the client stated is a gate now, so a capture breaking
  // three of them is refused three times over and reaches nothing.
  it("keeps every stated condition", () => {
    const f = checkCapture(
      { kind: "video", size: 200 * MB, width: 640, height: 480, fix: null },
      { media: ["photo"], min_megapixels: 12, require_gps: true },
    );
    expect(codes(f)).toEqual(["media_kind", "size", "gps_missing"]);
    expect(codes(blocking(f))).toEqual(["media_kind", "size", "gps_missing"]);
  });

  it("drops the two fix-quality warnings and nothing else", () => {
    const f = checkCapture(
      { ...good, width: 3024, height: 4032, fix: { accuracy: 8, stale: true } },
      { media: ["photo"], orientation: "landscape", require_gps: true },
    );
    expect(codes(f)).toEqual(["orientation", "gps_stale"]);
    expect(codes(blocking(f))).toEqual(["orientation"]);
  });
});
