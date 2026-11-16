// Which lines of text in a picture are Indian number plates.
//
// The phone has no plate detector. It has a text reader (ML Kit, run by the
// deidentify module), and a plate is text in a known shape, so a plate is a
// line whose characters fit one of the registration formats once the reader's
// usual confusions are undone. What this cannot find, it cannot cover: a plate
// too small, too blurred or too oblique to read is missed, and the RFP's hint
// says so. A missed plate is a reviewer's "Face or plate not blurred".
//
// Pure and unit-tested; the plate text itself is never logged or sent.
//
// Formats, India first (the user's decision for the pilot):
//   standard   SS RR LLL NNNN   KA 01 AB 1234, DL 3C AF 0001, MH 12 1234
//              a state code, a one- or two-digit RTO, up to three series
//              letters, a number of up to four digits (zero-padded on new plates)
//   BH series  YY BH NNNN LL     22 BH 1234 AA
// The "IND" a high-security plate carries beside the characters is dropped.

import type { Box, TextLine } from "./regions";

/** The state and union-territory codes a plate starts with, old and new. */
const STATES = new Set([
  "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ", "HP", "HR", "JH", "JK",
  "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "OR", "PB", "PY", "RJ", "SK",
  "TG", "TN", "TR", "TS", "UA", "UK", "UP", "WB",
]);

// What the text reader confuses, by what the position must hold.
const AS_LETTER: Record<string, string> = { "0": "O", "1": "I", "2": "Z", "5": "S", "6": "G", "8": "B" };
const AS_DIGIT: Record<string, string> = { O: "0", D: "0", Q: "0", I: "1", L: "1", Z: "2", S: "5", G: "6", B: "8" };

const letters = (s: string) => [...s].map((c) => AS_LETTER[c] ?? c).join("");
const digits = (s: string) => [...s].map((c) => AS_DIGIT[c] ?? c).join("");

// Permissive classes, so a misread character still fits its position; the
// fix-up above then decides what it was. The series stays letters only, and
// never I or O, which Indian series do not use for exactly this confusion: a
// series letter read as a digit then lands in the number, which still finds
// the plate, where a permissive series would swallow the number's first digit.
const L = "[A-Z012568]";
const D = "[0-9ODQILZSGB]";
const SERIES = "[A-HJ-NP-Z]";
const STANDARD = new RegExp(`(${L}{2})(${D}{1,2})(${SERIES}{0,3})(${D}{1,4})`);
const BHARAT = new RegExp(`(${D}{2})(BH|8H)(${D}{4})(${L}{1,2})`);

/** Letters and digits only, upper case, with a high-security plate's "IND" dropped. */
export function compact(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^IND/, "");
}

/** The plate this text holds, normalised (KA01AB1234), or null. */
export function findPlate(text: string): string | null {
  const s = compact(text);
  // a line may carry a make or a dealer's name beside the plate; a whole
  // paragraph is not a plate
  if (s.length < 5 || s.length > 40) return null;
  const bh = BHARAT.exec(s);
  if (bh) return `${digits(bh[1])}BH${digits(bh[3])}${letters(bh[4])}`;
  // Every place the shape could start, so leading noise ("HONDA KA01…") does
  // not hide a plate after it.
  for (let i = 0; i + 5 <= s.length; i++) {
    const m = STANDARD.exec(s.slice(i));
    if (!m || m.index !== 0) continue;
    const state = letters(m[1]);
    if (!STATES.has(state)) continue;
    const series = m[3];
    const number = digits(m[4]);
    if (!/^\d+$/.test(number)) continue;
    // a bare "KA1" is a word, not a plate: the series or a full number must be there
    if (series.length === 0 && number.length < 4) continue;
    return `${state}${digits(m[2])}${series}${number}`;
  }
  return null;
}

/** The union of boxes: the smallest box covering all of them. */
export function hull(boxes: Box[]): Box {
  const x1 = Math.min(...boxes.map((b) => b.x));
  const y1 = Math.min(...boxes.map((b) => b.y));
  const x2 = Math.max(...boxes.map((b) => b.x + b.w));
  const y2 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Two lines read as one plate: the second under the first, overlapping it
 *  across. A motorcycle's two-row plate reads that way, "KA 01" over "AB 1234". */
function stacked(top: TextLine, under: TextLine): boolean {
  const a = top.box;
  const b = under.box;
  const overlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const gap = b.y - (a.y + a.h);
  return overlap > 0.3 * Math.min(a.w, b.w) && gap > -0.5 * a.h && gap < 1.5 * a.h;
}

/** The boxes of every plate among these lines: a line that holds one, and two
 *  stacked lines that hold one between them. */
export function plateBoxes(lines: TextLine[]): Box[] {
  const found: Box[] = [];
  const used = new Set<number>();
  lines.forEach((line, i) => {
    if (findPlate(line.text)) {
      found.push(line.box);
      used.add(i);
    }
  });
  lines.forEach((top, i) => {
    if (used.has(i)) return;
    lines.forEach((under, j) => {
      if (i === j || used.has(j) || !stacked(top, under)) return;
      if (findPlate(`${top.text} ${under.text}`)) {
        found.push(hull([top.box, under.box]));
        used.add(i);
        used.add(j);
      }
    });
  });
  return found;
}
