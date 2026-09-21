// The subject score, from canned labeller output. No native module runs here.

import type { SubjectSpec } from "@/api/types";
import { SUBJECT_OFF } from "@/config";
import { scoreSubject, subjectFinding, unscoredFinding, words } from "@/validation/subject";

const shelf: SubjectSpec = {
  domain: "retail shelf",
  must_show: ["supermarket shelf", "products", "price tags"],
  must_not_show: ["person", "selfie", "screenshot"],
};

const L = (...pairs: [string, number][]) => pairs.map(([text, confidence]) => ({ text, confidence }));

describe("words", () => {
  it("lowercases, splits, stems plurals and drops filler", () => {
    expect(words("Price tags")).toEqual(["price", "tag"]);
    expect(words("shelves")).toEqual(["shelf"]);
    expect(words("a photo of the Groceries")).toEqual(["photo", "grocery"]);
    expect(words("glass")).toEqual(["glass"]);
  });
});

describe("scoreSubject", () => {
  it("a shelf photo scores by its best matching label", () => {
    const r = scoreSubject(L(["Shelf", 0.91], ["Supermarket", 0.8], ["Floor", 0.3]), shelf);
    expect(r.score).toBeCloseTo(0.91);
    expect(r.hit).toEqual(["Shelf", "Supermarket"]);
    expect(r.veto).toEqual([]);
    expect(r.seen).toEqual(["Shelf", "Supermarket", "Floor"]);
  });

  it("a dog scores nothing", () => {
    const r = scoreSubject(L(["Dog", 0.97], ["Grass", 0.6]), shelf);
    expect(r.score).toBe(0);
    expect(r.hit).toEqual([]);
  });

  it("a forbidden label pulls the score down", () => {
    const r = scoreSubject(L(["Shelf", 0.7], ["Person", 0.9]), shelf);
    expect(r.score).toBe(0);
    expect(r.veto).toEqual(["Person"]);
    expect(scoreSubject(L(["Shelf", 0.9], ["Person", 0.5]), shelf).score).toBeCloseTo(0.4);
  });

  it("no labels at all is a zero, not a pass", () => {
    expect(scoreSubject([], shelf).score).toBe(0);
  });

  it("an explicit vocabulary replaces the words of the profile", () => {
    const strict = { ...shelf, labels: ["Bottle"] };
    expect(scoreSubject(L(["Shelf", 0.9]), strict).score).toBe(0);
    expect(scoreSubject(L(["Bottle", 0.6]), strict).score).toBeCloseTo(0.6);
  });

  it("keeps at most five seen labels, best first", () => {
    const many = L(["A", 0.1], ["B", 0.9], ["C", 0.5], ["D", 0.7], ["E", 0.3], ["F", 0.2]);
    expect(scoreSubject(many, shelf).seen).toEqual(["B", "D", "C", "E", "F"]);
  });
});

describe("subjectFinding", () => {
  it("is silent at or above the cut", () => {
    expect(subjectFinding(scoreSubject(L(["Shelf", SUBJECT_OFF]), shelf), shelf)).toBeNull();
  });

  it("warns, never blocks, below it — and says what it saw", () => {
    const f = subjectFinding(scoreSubject(L(["Dog", 0.97], ["Grass", 0.6]), shelf), shelf);
    expect(f).toMatchObject({ code: "wrong_subject", severity: "warn", score: 0 });
    expect(f?.message).toBe("Doesn't look like retail shelf. Saw: dog, grass.");
    expect(f?.detail).toEqual({ labels: ["Dog", "Grass"], hit: [], veto: [] });
  });

  it("says so when the labeller saw nothing", () => {
    expect(subjectFinding(scoreSubject([], shelf), shelf)?.message).toBe(
      "Doesn't look like retail shelf. Nothing recognisable in it.",
    );
  });
});

describe("unscoredFinding", () => {
  it("is a warning that names the reason, never a block", () => {
    expect(unscoredFinding("timeout")).toEqual({
      code: "subject_unscored",
      severity: "warn",
      message: "Subject not checked on the phone (the check took too long).",
      detail: { reason: "timeout" },
    });
    expect(unscoredFinding("no_labeller").message).toBe(
      "Subject not checked on the phone (this build has no image labeller).",
    );
    expect(unscoredFinding("error", "Image labeling failed").detail).toEqual({
      reason: "error",
      error: "Image labeling failed",
    });
  });
});

describe("labelImage", () => {
  const ML_KIT = "@react-native-ml-kit/image-labeling";

  // labelImage requires the native package lazily, at call time, from the
  // live module registry — so each case empties that registry and installs
  // its own stand-in before loading subject.ts.
  const load = (): typeof import("@/validation/subject") => require("@/validation/subject");

  beforeEach(() => jest.resetModules());
  afterEach(() => {
    jest.dontMock(ML_KIT);
    jest.useRealTimers();
  });

  it("names a build without the labeller (Expo Go, an older APK)", async () => {
    jest.doMock(ML_KIT, () => {
      throw new Error("not linked");
    });
    expect(await load().labelImage("file:///x.jpg")).toEqual({ unscored: "no_labeller" });
  });

  it("names a native failure and keeps its message", async () => {
    jest.doMock(ML_KIT, () => ({
      default: { label: () => Promise.reject(new Error("Image labeling failed")) },
    }));
    expect(await load().labelImage("file:///x.jpg")).toEqual({
      unscored: "error",
      error: "Image labeling failed",
    });
  });

  it("gives the model six seconds, then says it ran out of time", async () => {
    jest.useFakeTimers();
    jest.doMock(ML_KIT, () => ({ default: { label: () => new Promise(() => {}) } }));
    const answer = load().labelImage("file:///x.jpg");
    jest.advanceTimersByTime(5_999);
    await Promise.resolve();
    jest.advanceTimersByTime(1);
    expect(await answer).toEqual({ unscored: "timeout" });
  });

  it("passes the labels through, dropping the index", async () => {
    jest.doMock(ML_KIT, () => ({
      default: { label: async () => [{ text: "Shelf", confidence: 0.91, index: 7 }] },
    }));
    expect(await load().labelImage("file:///x.jpg")).toEqual({
      labels: [{ text: "Shelf", confidence: 0.91 }],
    });
  });
});
