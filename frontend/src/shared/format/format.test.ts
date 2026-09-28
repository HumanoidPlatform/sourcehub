import { describe, expect, it } from "vitest";
import { fmtAgo, fmtDateTimeZone, fmtUntil, isoToLocalInput, localInputToIso, utcDateOf } from ".";

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

describe("fmtUntil", () => {
  const now = Date.parse("2026-09-20T12:00:00Z");
  const ahead = (ms: number) => new Date(now + ms).toISOString();
  const MIN = 60_000;

  it("says how long is left, coarsening as it gets further away", () => {
    expect(fmtUntil(ahead(20_000), now)).toBe("in under a minute");
    expect(fmtUntil(ahead(12 * MIN), now)).toBe("in 12 min");
    expect(fmtUntil(ahead(5 * 60 * MIN), now)).toBe("in 5 h");
    expect(fmtUntil(ahead(47 * 60 * MIN), now)).toBe("in 47 h");
    expect(fmtUntil(ahead(3 * 24 * 60 * MIN), now)).toBe("in 3 days");
  });

  it("is closed at the deadline itself, as the server rules", () => {
    expect(fmtUntil(ahead(0), now)).toBe("closed");
    expect(fmtUntil(ahead(-MIN), now)).toBe("closed");
  });

  it("passes through what it cannot read", () => {
    expect(fmtUntil(null, now)).toBe("—");
    expect(fmtUntil("not a date", now)).toBe("not a date");
  });
});

describe("datetime-local round trip", () => {
  // Never assert on a particular zone: the test runner's is not the user's.
  it("survives input → ISO → input", () => {
    const local = "2026-10-05T18:00";
    const iso = localInputToIso(local);
    expect(iso).toMatch(/Z$/);
    expect(isoToLocalInput(iso)).toBe(local);
  });

  it("is blank or null for nothing, and for nonsense", () => {
    expect(localInputToIso("")).toBeNull();
    expect(localInputToIso("nope")).toBeNull();
    expect(isoToLocalInput(null)).toBe("");
    expect(isoToLocalInput("nope")).toBe("");
  });

  it("measures the delivery rule on the UTC date, as the database does", () => {
    const iso = localInputToIso("2026-10-25T22:00")!;
    expect(utcDateOf("2026-10-25T22:00")).toBe(iso.slice(0, 10));
    expect(utcDateOf("")).toBeNull();
  });

  it("shows a deadline with its year and zone", () => {
    const s = fmtDateTimeZone("2026-10-05T18:00:00Z");
    expect(s).toMatch(/2026/);
    expect(s).toMatch(/GMT|UTC|[A-Z]{2,5}T|\+\d/);
    expect(fmtDateTimeZone(null)).toBe("—");
  });
});
