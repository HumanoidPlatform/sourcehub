// What a picture or a clip has covered, and where (qa_pipeline/privacy/regions.ts).

import { FACE_PAD, grow, merge, pictureRegions, type Region, spans } from "@/qa_pipeline/privacy/regions";

const px = (x: number, y: number, w: number, h: number): Region => ({ box: { x, y, w, h }, style: "pixelate" });
const fill = (x: number, y: number, w: number, h: number): Region => ({ box: { x, y, w, h }, style: "fill" });

describe("grow", () => {
  it("grows a box on every side and keeps it inside the picture", () => {
    expect(grow({ x: 100, y: 100, w: 100, h: 100 }, 0.3, 1000, 1000)).toEqual({ x: 70, y: 70, w: 160, h: 160 });
    expect(grow({ x: 0, y: 0, w: 100, h: 100 }, 0.3, 120, 120)).toEqual({ x: 0, y: 0, w: 120, h: 120 });
  });
});

describe("merge", () => {
  it("joins overlapping regions and keeps apart ones apart", () => {
    expect(merge([px(0, 0, 10, 10), px(5, 5, 10, 10), px(100, 100, 10, 10)])).toEqual([
      px(0, 0, 15, 15),
      px(100, 100, 10, 10),
    ]);
  });

  it("lets a fill swallow a pixelation it overlaps: the stronger cover wins", () => {
    expect(merge([px(0, 0, 10, 10), fill(5, 5, 10, 10)])).toEqual([fill(0, 0, 15, 15)]);
  });

  it("drops empty boxes", () => {
    expect(merge([px(0, 0, 0, 10), px(1, 1, 5, 5)])).toEqual([px(1, 1, 5, 5)]);
  });
});

describe("pictureRegions", () => {
  it("pixelates faces and fills plates, each grown", () => {
    const r = pictureRegions([{ x: 100, y: 100, w: 100, h: 100 }], [{ x: 600, y: 600, w: 200, h: 50 }], 1000, 1000);
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({ box: grow({ x: 100, y: 100, w: 100, h: 100 }, FACE_PAD, 1000, 1000), style: "pixelate" });
    expect(r[1].style).toBe("fill");
  });

  it("covers nothing in a picture with neither", () => {
    expect(pictureRegions([], [], 1000, 1000)).toEqual([]);
  });
});

describe("spans", () => {
  it("covers the whole clip, from 0 to its end", () => {
    const s = spans(
      [
        { tMs: 500, regions: [px(0, 0, 10, 10)] },
        { tMs: 1000, regions: [] },
      ],
      3000,
      1920,
      1080,
    );
    expect(s[0]).toMatchObject({ fromMs: 0, toMs: 500 });
    expect(s[s.length - 1]).toMatchObject({ fromMs: 1000, toMs: 3000 });
    expect(s.every((x, i) => i === 0 || x.fromMs === s[i - 1].toMs)).toBe(true);
  });

  it("covers a frame between two looks with what BOTH looks saw", () => {
    // someone seen at the first look and gone by the second is still covered
    // until the second look
    const [between] = spans(
      [
        { tMs: 0, regions: [px(0, 0, 10, 10)] },
        { tMs: 500, regions: [] },
      ],
      1000,
      1920,
      1080,
    );
    expect(between).toMatchObject({ fromMs: 0, toMs: 500, regions: [px(0, 0, 10, 10)] });
  });

  it("covers the whole path of a face seen at both looks", () => {
    const [between] = spans(
      [
        { tMs: 0, regions: [px(100, 100, 50, 50)] },
        { tMs: 500, regions: [px(300, 120, 50, 50)] },
      ],
      500,
      1920,
      1080,
    );
    expect(between.regions).toEqual([px(100, 100, 250, 70)]);
  });

  it("does not bridge two faces too far apart to be one moving", () => {
    const [between] = spans(
      [
        { tMs: 0, regions: [px(0, 0, 50, 50)] },
        { tMs: 500, regions: [px(1800, 1000, 50, 50)] },
      ],
      500,
      1920,
      1080,
    );
    expect(between.regions).toHaveLength(2);
  });

  it("has nothing to say about a clip nobody looked at", () => {
    expect(spans([], 1000, 1920, 1080)).toEqual([]);
  });
});
