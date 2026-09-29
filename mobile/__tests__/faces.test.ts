// The face measurement, from canned detector output. No native module runs here.

import type { SubjectSpec } from "@/api/types";
import { type FaceBox, facesFinding, facesUncheckedFinding, forbidsPeople, scoreFaces } from "@/validation/faces";

const box = (width: number, height: number): FaceBox => ({ width, height, top: 0, left: 0 });

const shelf: SubjectSpec = {
  domain: "retail shelf",
  must_show: ["supermarket shelf", "price tags"],
  must_not_show: ["person", "selfie", "screenshot"],
};

const street: SubjectSpec = {
  domain: "street furniture",
  must_show: ["bench"],
  must_not_show: ["screenshot"],
};

describe("scoreFaces", () => {
  it("counts faces and measures the largest against the frame", () => {
    const s = scoreFaces([box(100, 100), box(300, 300)], 1000, 900);
    expect(s.count).toBe(2);
    expect(s.largest).toBeCloseTo(90000 / 900000);
  });

  it("reports no size when the frame is unknown", () => {
    expect(scoreFaces([box(300, 300)], null, null)).toEqual({ count: 1, largest: 0 });
  });

  it("an empty frame is a measurement, not a gap", () => {
    expect(scoreFaces([], 1000, 900)).toEqual({ count: 0, largest: 0 });
  });

  it("never reports more than the whole frame", () => {
    expect(scoreFaces([box(4000, 4000)], 100, 100).largest).toBe(1);
  });
});

describe("forbidsPeople", () => {
  it("reads the brief's own words, stemmed", () => {
    expect(forbidsPeople(shelf)).toBe(true);
    expect(forbidsPeople({ ...shelf, must_not_show: ["people"] })).toBe(true);
    expect(forbidsPeople({ ...shelf, must_not_show: ["a passer-by's face"] })).toBe(true);
  });

  it("is false when the brief said nothing about people", () => {
    expect(forbidsPeople(street)).toBe(false);
    expect(forbidsPeople(null)).toBe(false);
    expect(forbidsPeople(undefined)).toBe(false);
  });
});

describe("facesFinding", () => {
  it("warns only when the brief forbade people AND a face is there", () => {
    const f = facesFinding(scoreFaces([box(100, 100)], 1000, 900), shelf);
    expect(f.code).toBe("person_in_frame");
    expect(f.severity).toBe("warn");
    expect(f.message).toBe("1 face in a capture that asked for no people in it.");
  });

  it("measures, without warning, when the brief did not forbid people", () => {
    const f = facesFinding(scoreFaces([box(100, 100), box(50, 50)], 1000, 900), street);
    expect(f.code).toBe("faces_measured");
    expect(f.severity).toBe("info");
    expect(f.message).toBe("2 faces in it.");
  });

  it("does not warn about an absence — no face proves no person", () => {
    const f = facesFinding(scoreFaces([], 1000, 900), shelf);
    expect(f.code).toBe("faces_measured");
    expect(f.severity).toBe("info");
    expect(f.message).toBe("No faces in it.");
  });

  it("never blocks, whatever the brief said", () => {
    for (const subject of [shelf, street, null]) {
      for (const faces of [[], [box(900, 900)]]) {
        expect(facesFinding(scoreFaces(faces, 1000, 900), subject).severity).not.toBe("block");
      }
    }
  });
});

describe("facesUncheckedFinding", () => {
  it("records that the phone did not look", () => {
    const f = facesUncheckedFinding("timeout");
    expect(f.code).toBe("faces_unchecked");
    expect(f.severity).toBe("info");
    expect(f.detail).toEqual({ reason: "timeout" });
  });
});
