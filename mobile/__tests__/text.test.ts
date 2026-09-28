// The text measurement, from canned recogniser output. No native module runs here.

import { scoreText, type TextRead, textFinding, textUnreadFinding } from "@/validation/text";

const read = (text: string, lines: { text: string; height?: number }[]): TextRead => ({
  text,
  blocks: [
    {
      text,
      lines: lines.map((l) => ({
        text: l.text,
        frame: l.height == null ? undefined : { width: 100, height: l.height, top: 0, left: 0 },
      })),
    },
  ],
});

describe("scoreText", () => {
  it("counts blocks, lines and characters, ignoring whitespace", () => {
    const s = scoreText(read("£1.99 per kg", [{ text: "£1.99" }, { text: "per kg" }]), 1000);
    expect(s.blocks).toBe(1);
    expect(s.lines).toBe(2);
    expect(s.chars).toBe(10);
  });

  it("measures the tallest line as a share of the frame", () => {
    const s = scoreText(read("a b", [{ text: "a", height: 20 }, { text: "b", height: 45 }]), 900);
    expect(s.tallest).toBeCloseTo(0.05);
  });

  it("reports no height when the frame size is unknown", () => {
    const s = scoreText(read("a", [{ text: "a", height: 45 }]), null);
    expect(s.tallest).toBe(0);
    expect(s.chars).toBe(1);
  });

  it("never reports more than the whole frame", () => {
    const s = scoreText(read("a", [{ text: "a", height: 4000 }]), 900);
    expect(s.tallest).toBe(1);
  });

  it("an empty read is a real measurement, not a missing one", () => {
    const s = scoreText({ text: "", blocks: [] }, 900);
    expect(s).toEqual({ blocks: 0, lines: 0, chars: 0, tallest: 0 });
  });
});

describe("textFinding", () => {
  it("is always info — it measures, it does not judge", () => {
    expect(textFinding(scoreText(read("x", [{ text: "x", height: 10 }]), 900)).severity).toBe("info");
    expect(textFinding(scoreText({ text: "", blocks: [] }, 900)).severity).toBe("info");
  });

  it("says what it read, and how big", () => {
    const f = textFinding(scoreText(read("£1.99", [{ text: "£1.99", height: 90 }]), 900));
    expect(f.message).toBe("Read 5 characters in 1 line. Tallest line 10.0% of frame height.");
    expect(f.score).toBeCloseTo(0.1);
  });

  it("says so when there was nothing to read", () => {
    const f = textFinding(scoreText({ text: "", blocks: [] }, 900));
    expect(f.message).toBe("No text in it.");
    expect(f.detail).toMatchObject({ chars: 0, lines: 0 });
  });
});

describe("textUnreadFinding", () => {
  it("records that the phone did not look, without complaining to the worker", () => {
    const f = textUnreadFinding("no_labeller");
    expect(f.code).toBe("text_unread");
    expect(f.severity).toBe("info");
    expect(f.message).toContain("no text recogniser");
    expect(f.detail).toEqual({ reason: "no_labeller" });
  });

  it("carries the error when there was one", () => {
    expect(textUnreadFinding("error", "boom").detail).toEqual({ reason: "error", error: "boom" });
  });
});
