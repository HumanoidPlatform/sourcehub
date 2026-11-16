// What a crowd resource reads of the client's privacy terms (src/privacy.ts).

import type { PrivacyTerms } from "@/api/types";
import { privacyLines } from "@/privacy";

const terms = (over: Partial<PrivacyTerms> = {}): PrivacyTerms => ({
  people_in_frame: null,
  minors_policy: null,
  deidentification: [],
  lawful_basis: null,
  regulations: [],
  biometric_processing: false,
  ...over,
});

describe("privacyLines", () => {
  it("says nothing for a task from before the terms travelled, or one that stated none", () => {
    expect(privacyLines(undefined)).toEqual([]);
    expect(privacyLines(null)).toEqual([]);
    expect(privacyLines(terms())).toEqual([]);
  });

  it("names who may be in shot, children, and what must go, in that order", () => {
    expect(
      privacyLines(
        terms({
          people_in_frame: "none",
          minors_policy: "prohibited",
          deidentification: ["blur_faces", "redact_plates", "strip_gps"],
        }),
      ),
    ).toEqual([
      "Nobody in shot. If someone is in it, the app asks before keeping it.",
      "No children in shot.",
      "Removed before upload: faces, number plates, the location in the files.",
    ]);
  });

  it("tells passers-by from subjects", () => {
    expect(privacyLines(terms({ people_in_frame: "incidental" }))[0]).toMatch(/Passers-by may appear/);
    expect(privacyLines(terms({ people_in_frame: "consented" }))[0]).toMatch(/must have agreed/);
    expect(privacyLines(terms({ minors_policy: "with_parental_consent" }))).toEqual([
      "Children only with a parent's consent.",
    ]);
  });

  it("leaves the supplier's legal terms off the phone", () => {
    const lines = privacyLines(
      terms({ lawful_basis: "consent", regulations: ["DPDP"], biometric_processing: true }),
    );
    expect(lines).toEqual([]);
  });
});
