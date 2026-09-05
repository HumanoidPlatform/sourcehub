import { delayFor } from "../src/upload/backoff";

describe("delayFor", () => {
  it("doubles from four seconds", () => {
    expect(delayFor(1, () => 0)).toBe(4000);
    expect(delayFor(2, () => 0)).toBe(8000);
    expect(delayFor(3, () => 0)).toBe(16000);
  });
  it("caps at five minutes", () => {
    expect(delayFor(20, () => 0)).toBe(300_000);
  });
  it("adds under a second of jitter", () => {
    expect(delayFor(1, () => 0.999)).toBeLessThan(5000);
  });
});
