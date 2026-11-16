// The face measurement, from canned detector output. No native module runs here.

import type { PrivacyTerms, SubjectSpec } from "@/api/types";
import {
  asksAboutPeople,
  type FaceBox,
  facesFinding,
  facesUncheckedFinding,
  forbidsPeople,
  framesFacesFinding,
  scoreFaces,
  wantsNobody,
} from "@/qa_pipeline/faces/faces";

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

// The client's privacy terms (capture_spec.privacy): "nobody in frame" is the
// client's own term, stronger than a subject's Must not show, and the only one
// the worker is asked about (pipeline.ts).
const terms = (people: PrivacyTerms["people_in_frame"]): PrivacyTerms => ({
  people_in_frame: people, minors_policy: null, deidentification: [], lawful_basis: null,
  regulations: [], biometric_processing: false,
});

describe("the client's no-people term", () => {
  it("is read from the privacy terms, not from the subject", () => {
    expect(wantsNobody(terms("none"))).toBe(true);
    expect(wantsNobody(terms("incidental"))).toBe(false);
    expect(wantsNobody(terms(null))).toBe(false);
    expect(wantsNobody(null)).toBe(false);
  });

  it("warns, marked as the client's, when a face is in a nobody-in-frame shot", () => {
    const f = facesFinding({ count: 2, largest: 0.1 }, street, terms("none"));
    expect(f).toMatchObject({ code: "person_in_frame", severity: "warn", detail: { rule: "privacy" } });
    expect(f.message).toMatch(/client wants nobody/);
    expect(asksAboutPeople(f)).toBe(true);
  });

  it("wins over the subject's own rule, which the worker is never asked about", () => {
    const client = facesFinding({ count: 1, largest: 0.2 }, shelf, terms("none"));
    expect(asksAboutPeople(client)).toBe(true);
    const subjectOnly = facesFinding({ count: 1, largest: 0.2 }, shelf, terms("incidental"));
    expect(subjectOnly.code).toBe("person_in_frame");
    expect(asksAboutPeople(subjectOnly)).toBe(false);
  });

  it("measures, without warning, where people may be in shot", () => {
    for (const p of ["incidental", "consented"] as const) {
      expect(facesFinding({ count: 3, largest: 0.3 }, street, terms(p)).code).toBe("faces_measured");
    }
  });

  it("says nothing about an empty frame, whatever the client said", () => {
    expect(facesFinding({ count: 0, largest: 0 }, street, terms("none")).code).toBe("faces_measured");
  });
});

describe("framesFacesFinding", () => {
  it("warns on a clip where any checked frame showed a face", () => {
    const f = framesFacesFinding([0, 1, 0, 2], terms("none"));
    expect(f).toMatchObject({ code: "person_in_frame", severity: "warn" });
    expect(f?.detail).toEqual({ frames_with_faces: 2, frames: 4, rule: "privacy" });
    expect(asksAboutPeople(f)).toBe(true);
  });

  it("measures a clip with no face in any checked frame", () => {
    expect(framesFacesFinding([0, 0, 0], terms("none"))?.code).toBe("faces_measured");
  });

  it("has nothing to say when no frame was checked", () => {
    expect(framesFacesFinding([], terms("none"))).toBeNull();
  });

  it("never warns where people may be in shot", () => {
    expect(framesFacesFinding([3, 2], terms("incidental"))?.code).toBe("faces_measured");
  });
});
