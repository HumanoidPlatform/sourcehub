import { describe, expect, it } from "vitest";
import { fmtAgo } from ".";

describe("fmtAgo", () => {
  const now = Date.parse("2026-09-20T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const MIN = 60_000;

  it("says how long ago, coarsening as it gets older", () => {
    expect(fmtAgo(ago(20_000), now)).toBe("just now");
    expect(fmtAgo(ago(5 * MIN), now)).toBe("5 min ago");
    expect(fmtAgo(ago(59 * MIN), now)).toBe("59 min ago");
    expect(fmtAgo(ago(60 * MIN), now)).toBe("1 h ago");
    expect(fmtAgo(ago(23 * 60 * MIN), now)).toBe("23 h ago");
    expect(fmtAgo(ago(30 * 60 * MIN), now)).toBe("yesterday");
    // ICU versions differ on "Sep" and "Sept"
    expect(fmtAgo(ago(5 * 24 * 60 * MIN), now)).toMatch(/^15 Sept? 2026$/);
  });

  it("passes through what it cannot read", () => {
    expect(fmtAgo(null, now)).toBe("—");
    expect(fmtAgo("not a date", now)).toBe("not a date");
  });
});
