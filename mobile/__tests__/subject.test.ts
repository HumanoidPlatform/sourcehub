// The subject score, from canned labeller output. No native module runs here.

import type { SubjectSpec } from "@/api/types";
import { SUBJECT_OFF } from "@/config";
import { scoreSubject, subjectFinding, words } from "@/validation/subject";

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
