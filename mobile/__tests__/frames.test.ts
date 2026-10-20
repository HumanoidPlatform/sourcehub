// sampleFrames with the native pieces mocked: a frame that will not decode is
// skipped like one the thumbnailer never produced, never the end of the clip.

const mockDeleted: string[] = [];
const mockBadUris = new Set<string>();

jest.mock("expo-video-thumbnails", () => ({
  getThumbnailAsync: jest.fn(async (_uri: string, o: { time: number }) => ({ uri: `frame-${o.time}`, width: 4, height: 4 })),
}));

jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: (uri: string) => ({
      release: () => {},
      resize: () => ({
        renderAsync: async () => {
          if (mockBadUris.has(uri)) throw new Error("cannot decode");
          return { release: () => {}, saveAsync: async () => ({ uri: `${uri}-small`, base64: "AAAA" }) };
        },
      }),
    }),
  },
}));

jest.mock("jpeg-js", () => ({
  decode: () => ({ width: 2, height: 2, data: new Uint8Array(16).fill(128) }),
}));

jest.mock("../src/capture/files", () => ({
  deleteLocal: jest.fn(async (uri: string | null) => {
    if (uri) mockDeleted.push(uri);
  }),
}));

import { sampleFrames } from "@/qa_pipeline/clip/frames";

beforeEach(() => {
  mockDeleted.length = 0;
  mockBadUris.clear();
});

describe("sampleFrames", () => {
  it("skips a frame that will not decode and checks the rest", async () => {
    mockBadUris.add("frame-2000");
    const seen: number[] = [];
    const r = await sampleFrames("clip.mp4", [1, 2, 3], 10_000, async (f) => {
      seen.push(f.time);
    });
    expect(seen).toEqual([1, 3]);
    expect(r).toEqual({ done: 2, timedOut: false });
    // the bad frame's JPEG is still cleaned up
    expect(mockDeleted).toContain("frame-2000");
  });
});
