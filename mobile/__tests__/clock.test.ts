import { clockTone, formatClock } from "../src/capture/clock";

describe("the recording clock", () => {
  it("reads minutes and seconds", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9.9)).toBe("0:09");
    expect(formatClock(75)).toBe("1:15");
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(-3)).toBe("0:00");
  });

  it("says when the clip is still too short, fine, or about to stop", () => {
    expect(clockTone(3, 5, 60)).toBe("short");
    expect(clockTone(5, 5, 60)).toBe("ok");
    expect(clockTone(30, null, 60)).toBe("ok");
    expect(clockTone(50, 5, 60)).toBe("ending");
  });
});
