import { checksForServer } from "@/upload/checks";

const f = (over: Record<string, unknown> = {}) => ({ code: "c", severity: "info", message: "m", ...over });

describe("the checks a presign sends", () => {
  it("pass a well-formed row through unchanged", () => {
    const row = [f({ code: "subject_measured", score: 0.62, detail: { labels: ["Car"] } })];
    expect(checksForServer(JSON.stringify(row))).toEqual(row);
  });

  // what an earlier build queued: CLIP's margin as the score
  it("move a score outside 0..1 into detail rather than fail the upload", () => {
    const [c] = checksForServer(JSON.stringify([f({ code: "subject_clip_measured", score: -0.0123, detail: { ms: 80 } })]));
    expect(c.score).toBeUndefined();
    expect(c.detail).toEqual({ ms: 80, score_raw: -0.0123 });
    expect(checksForServer(JSON.stringify([f({ score: 1.5 })]))[0].detail).toEqual({ score_raw: 1.5 });
  });

  it("hold detail, message and count to the server's limits", () => {
    const [big] = checksForServer(JSON.stringify([f({ message: "x".repeat(400), detail: { s: "y".repeat(2000) } })]));
    expect(big.message).toHaveLength(300);
    expect(big.detail).toEqual({ truncated: true });

    const many = [...Array.from({ length: 25 }, (_, i) => f({ code: `i${i}` })), f({ code: "w", severity: "warn" })];
    const sent = checksForServer(JSON.stringify(many));
    expect(sent).toHaveLength(20);
    expect(sent[0].code).toBe("w");
  });

  it("drop what is not a check at all, and survive a column that is not JSON", () => {
    const row = [f(), f({ severity: "loud" }), f({ code: "" }), "text", null];
    expect(checksForServer(JSON.stringify(row))).toHaveLength(1);
    expect(checksForServer("{oops")).toEqual([]);
    expect(checksForServer(null)).toEqual([]);
  });
});
