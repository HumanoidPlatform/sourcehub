import { retryText, uploadsLine } from "../src/upload/words";

const NOW = 1_700_000_000_000;

describe("retryText", () => {
  it("says when the next try is, and how many there have been", () => {
    expect(retryText({ status: "presigned", next_attempt_at: NOW + 40_000, attempts: 1 }, NOW)).toBe("Retrying in 40 s");
    expect(retryText({ status: "uploading", next_attempt_at: NOW + 180_000, attempts: 4 }, NOW)).toBe("Retrying in 3 min · 4 tries");
  });
  it("says nothing for a row that is not waiting", () => {
    expect(retryText({ status: "presigned", next_attempt_at: 0, attempts: 0 }, NOW)).toBeNull();
    expect(retryText({ status: "failed", next_attempt_at: NOW + 5000, attempts: 9 }, NOW)).toBeNull();
    expect(retryText({ status: "confirmed", next_attempt_at: 0, attempts: 0 }, NOW)).toBeNull();
  });
});

describe("uploadsLine", () => {
  it("is the notification's one line", () => {
    expect(uploadsLine(3, 0.451)).toBe("3 left · 45%");
    expect(uploadsLine(1, 1.2)).toBe("1 left · 100%");
  });
});
