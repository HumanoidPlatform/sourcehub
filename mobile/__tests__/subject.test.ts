// What the subject check shares with the other checks. The check itself is
// CLIP's and is tested in clipSubject.test.ts.

import { unscoredFinding, words } from "@/qa_pipeline/subject/subject";

describe("words", () => {
  it("lowercases, splits, stems plurals and drops filler", () => {
    expect(words("Price tags")).toEqual(["price", "tag"]);
    expect(words("shelves")).toEqual(["shelf"]);
    expect(words("a photo of the Groceries")).toEqual(["photo", "grocery"]);
    expect(words("glass")).toEqual(["glass"]);
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
    expect(unscoredFinding("error", "embed failed").detail).toEqual({ reason: "error", error: "embed failed" });
  });

  it("says when the model is still downloading, or missing from the build", () => {
    expect(unscoredFinding("loading").message).toBe(
      "Subject not checked on the phone (the subject model is still downloading).",
    );
    expect(unscoredFinding("no_model").message).toBe("Subject not checked on the phone (this build has no subject model).");
  });
});
