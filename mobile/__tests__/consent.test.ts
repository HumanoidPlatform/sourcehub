import {
  CONSENT_DOCUMENT, NOTICE, POLICY_URL, PRIVACY_NOTICE_VERSION,
  consentKey, isCurrent, makeRecord, parseConsent,
} from "../src/consent";
import { PRODUCTION_API_URL } from "../src/config";

const at = new Date("2026-09-19T10:30:00.000Z");

describe("the consent record", () => {
  it("has exactly the five fields the server-side table will want", () => {
    // If this changes, the record a pilot worker already holds no longer
    // uploads cleanly when user_consent arrives — and they get asked twice.
    expect(makeRecord(at, "0.1.0", "android")).toEqual({
      document: "worker_privacy_notice",
      version: PRIVACY_NOTICE_VERSION,
      accepted_at: "2026-09-19T10:30:00.000Z",
      app_version: "0.1.0",
      platform: "android",
    });
  });

  it("is kept per user, so a shared phone asks each person", () => {
    expect(consentKey("u1")).not.toBe(consentKey("u2"));
  });

  it("survives a round trip through storage", () => {
    const rec = makeRecord(at, "0.1.0", "android");
    expect(parseConsent(JSON.stringify(rec))).toEqual(rec);
  });
});

describe("parseConsent", () => {
  it("treats anything unreadable as 'not accepted', never as agreement", () => {
    for (const raw of [null, undefined, "", "not json", "{", "null", "[]", "42", '"yes"', "true"]) {
      expect(parseConsent(raw as string | null)).toBeNull();
    }
  });

  it("rejects a record for some other document", () => {
    expect(parseConsent(JSON.stringify({ ...makeRecord(at, null, "ios"), document: "terms" }))).toBeNull();
  });

  it("rejects a record with no usable date", () => {
    expect(parseConsent(JSON.stringify({ ...makeRecord(at, null, "ios"), accepted_at: "yesterday" }))).toBeNull();
    expect(parseConsent(JSON.stringify({ document: CONSENT_DOCUMENT, version: "1" }))).toBeNull();
  });

  it("tolerates missing optional fields", () => {
    const got = parseConsent(JSON.stringify({ document: CONSENT_DOCUMENT, version: "1", accepted_at: at.toISOString() }));
    expect(got).toMatchObject({ app_version: null, platform: "unknown" });
  });
});

describe("isCurrent", () => {
  it("is false with no record", () => {
    expect(isCurrent(null)).toBe(false);
  });

  it("is true for this version of the notice", () => {
    expect(isCurrent(makeRecord(at, null, "android"))).toBe(true);
  });

  it("asks again when the notice has changed", () => {
    const old = { ...makeRecord(at, null, "android"), version: "0" };
    expect(isCurrent(old)).toBe(false);
    expect(isCurrent(old, "0")).toBe(true);
  });
});

describe("the notice", () => {
  it("says what is collected, who gets it, and how to ask for deletion", () => {
    const text = NOTICE.sections.map((x) => `${x.heading} ${x.body}`).join(" ").toLowerCase();
    for (const word of ["photos", "location", "name", "email", "client", "deleted"]) {
      expect(text).toContain(word);
    }
  });

  it("promises nothing the platform does not do", () => {
    // No automatic deletion exists, and strip-GPS / blur-faces / redact-plates
    // are not implemented. If one of these words appears, read consent.ts first.
    const text = NOTICE.sections.map((x) => x.body).join(" ").toLowerCase();
    for (const claim of ["automatically deleted", "blur", "anonymis", "anonymiz", "stripped", "never shared"]) {
      expect(text).not.toContain(claim);
    }
  });

  it("links to the policy on the production HTTPS address", () => {
    expect(POLICY_URL).toBe(`${PRODUCTION_API_URL}/privacy`);
    expect(POLICY_URL.startsWith("https://")).toBe(true);
  });
});
