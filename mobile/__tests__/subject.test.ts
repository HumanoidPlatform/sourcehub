// The subject score, from canned labeller output. No native module runs here.

import type { SubjectSpec } from "@/api/types";
import { SUBJECT_OFF } from "@/config";
import { forbiddenFinding, framesFinding, scoreFrames, scoreSubject, subjectFinding, unscoredFinding, words } from "@/validation/subject";

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

  // The score used to be best(hit) MINUS best(veto), which is not an operation
  // two independent label confidences support, and which made any subject that
  // co-occurs with a forbidden thing unpassable however plainly it was shown.
  // Presence and prohibition are separate questions now, and get separate
  // answers.
  it("a forbidden label no longer drags the subject score down", () => {
    const r = scoreSubject(L(["Shelf", 0.7], ["Person", 0.9]), shelf);
    expect(r.score).toBeCloseTo(0.7);
    expect(r.forbidden).toBeCloseTo(0.9);
    expect(r.veto).toEqual(["Person"]);
  });

  it("reports the forbidden confidence on its own", () => {
    const clean = scoreSubject(L(["Shelf", 0.9]), shelf);
    expect(clean.forbidden).toBe(0);
    expect(scoreSubject(L(["Shelf", 0.9], ["Person", 0.5]), shelf).score).toBeCloseTo(0.9);
  });

  // The bug: hit and veto are independent filters over the same labels, and a
  // match is any shared word. "laptop" in the domain and in must_not_show put
  // the same label in both lists, and best(hit) - best(veto) was exactly zero
  // — every capture flagged, for ever, with no way for the worker to comply.
  it("a word wanted by the subject cannot also forbid it", () => {
    const laptop: SubjectSpec = {
      domain: "laptop",
      must_show: [],
      must_not_show: ["laptop bag"],
    };
    const r = scoreSubject(L(["Laptop", 0.8]), laptop);
    expect(r.score).toBeCloseTo(0.8);
    expect(r.veto).toEqual([]);
    expect(r.forbidden).toBe(0);
  });

  it("still forbids the part of the phrase that is not wanted", () => {
    const laptop: SubjectSpec = { domain: "laptop", must_show: [], must_not_show: ["laptop bag"] };
    const r = scoreSubject(L(["Laptop", 0.8], ["Bag", 0.6]), laptop);
    expect(r.score).toBeCloseTo(0.8);
    expect(r.veto).toEqual(["Bag"]);
    expect(r.forbidden).toBeCloseTo(0.6);
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

describe("scoreFrames: a clip is judged by how often the subject appears", () => {
  const on = { score: 0.8, forbidden: 0, hit: ["Shelf"], veto: [], seen: ["Shelf", "Supermarket"] };
  const off = { score: 0.1, forbidden: 0, hit: [], veto: [], seen: ["Floor", "Tile"] };

  it("counts the frames at or over SUBJECT_OFF", () => {
    const f = scoreFrames([on, on, off, { ...off, score: SUBJECT_OFF }]);
    expect(f).toMatchObject({ frames: 4, hits: 3, share: 0.75 });
  });

  it("names what was seen most often across the clip, most often first", () => {
    const f = scoreFrames([on, off, off]);
    expect(f.seen.slice(0, 2)).toEqual(["Floor", "Tile"]);
    expect(f.hit).toEqual(["Shelf"]);
  });

  // The rule used to be a MAJORITY of frames, which failed a clip that was
  // plainly about its subject for the moments a hand covered it or a pan moved
  // off it. Presence is the question: was the thing there often enough to say
  // the clip is about it.
  it("keeps a clip whose subject is hidden for most of it but plainly there", () => {
    const frames = [on, on, on, on, off, off, off, off, off, off]; // 4 of 10
    expect(framesFinding(scoreFrames(frames), shelf)).toBeNull();
  });

  it("passes at exactly the share asked for and warns just under it", () => {
    const three = [on, on, on, off, off, off, off, off, off, off]; // 3 of 10
    expect(framesFinding(scoreFrames(three), shelf)).toBeNull();
    const f = framesFinding(scoreFrames([on, on, off, off, off, off, off, off, off, off]), shelf); // 2 of 10
    expect(f).toMatchObject({
      code: "wrong_subject",
      severity: "warn",
      score: 0.2,
      message: "retail shelf appeared in only 2 of 10 frames. Saw: floor, tile, shelf, supermarket.",
    });
    expect(f?.detail).toMatchObject({ frames: 10, hits: 2 });
  });

  it("says so when nothing at all was recognised", () => {
    const f = framesFinding(scoreFrames([{ score: 0, forbidden: 0, hit: [], veto: [], seen: [] }]), shelf);
    expect(f?.message).toBe("retail shelf appeared in only 0 of 1 frames. Nothing recognisable in it.");
  });
});

describe("forbiddenFinding", () => {
  it("says nothing when the forbidden thing is only a faint guess", () => {
    // The labeller reports low-confidence guesses now that its floor is
    // patched down, so a prohibited thing has to be clearly there.
    expect(forbiddenFinding(scoreSubject(L(["Shelf", 0.9], ["Person", 0.2]), shelf), shelf)).toBeNull();
  });

  it("warns, separately from the subject, when it is clearly there", () => {
    const r = scoreSubject(L(["Shelf", 0.9], ["Person", 0.8]), shelf);
    expect(subjectFinding(r, shelf)).toBeNull();
    const f = forbiddenFinding(r, shelf);
    expect(f).toMatchObject({ code: "forbidden_subject", severity: "warn", score: 0.8 });
    expect(f?.message).toContain("person");
    expect(f?.detail).toMatchObject({ veto: ["Person"] });
  });

  it("says nothing when nothing is forbidden", () => {
    expect(forbiddenFinding(scoreSubject(L(["Shelf", 0.9]), shelf), shelf)).toBeNull();
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
