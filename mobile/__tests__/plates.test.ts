// Indian number plates read out of a picture's text (qa_pipeline/privacy/plates.ts).

import { compact, findPlate, hull, plateBoxes } from "@/qa_pipeline/privacy/plates";
import type { TextLine } from "@/qa_pipeline/privacy/regions";

const line = (text: string, x: number, y: number, w = 200, h = 40, block = 0): TextLine => ({
  text,
  box: { x, y, w, h },
  block,
});

describe("findPlate", () => {
  it.each([
    ["KA 01 AB 1234", "KA01AB1234"],
    ["ka-01-ab-1234", "KA01AB1234"],
    ["DL 3C AF 0001", "DL3CAF0001"],
    ["MH 12 1234", "MH121234"],
    ["TN 09 BX 4321", "TN09BX4321"],
    ["IND KA 05 MN 7788", "KA05MN7788"],
    ["22 BH 1234 AA", "22BH1234AA"],
    ["22 BH 1234 A", "22BH1234A"],
  ])("reads %s", (text, plate) => {
    expect(findPlate(text)).toBe(plate);
  });

  it.each([
    // the reader's usual confusions, undone by position
    ["KA O1 AB 1234", "KA01AB1234"],
    ["KA 01 AB I234", "KA01AB1234"],
    ["K4 01 AB 1234", null],
    ["MH 12 AB 12S4", "MH12AB1254"],
    ["22 8H 1234 AA", "22BH1234AA"],
  ])("undoes misreadings: %s", (text, plate) => {
    expect(findPlate(text)).toBe(plate);
  });

  it("finds a plate after other text on the same line", () => {
    expect(findPlate("HONDA KA 01 AB 1234")).toBe("KA01AB1234");
  });

  it.each(["MRP 120", "BEST BEFORE 2026", "SALE 50% OFF", "TN2020", "KA1", "XX 01 AB 1234", "", "Aisle 12"])(
    "is not fooled by %s",
    (text) => {
      expect(findPlate(text)).toBeNull();
    },
  );

  it("drops a high-security plate's IND and everything but letters and digits", () => {
    expect(compact(" IND·ka 01-ab 1234 ")).toBe("KA01AB1234");
  });
});

describe("plateBoxes", () => {
  it("returns the box of a line that is a plate, and nothing for other text", () => {
    const boxes = plateBoxes([line("KA 01 AB 1234", 10, 10), line("Fresh milk", 10, 100)]);
    expect(boxes).toEqual([{ x: 10, y: 10, w: 200, h: 40 }]);
  });

  it("joins a two-row plate, as a motorcycle carries it, into one box", () => {
    const boxes = plateBoxes([line("KA 01", 100, 100, 120, 40), line("AB 1234", 95, 145, 140, 40)]);
    expect(boxes).toEqual([hull([{ x: 100, y: 100, w: 120, h: 40 }, { x: 95, y: 145, w: 140, h: 40 }])]);
  });

  it("does not join two lines that are not one above the other", () => {
    const boxes = plateBoxes([line("KA 01", 0, 100, 120, 40), line("AB 1234", 900, 145, 140, 40)]);
    expect(boxes).toEqual([]);
  });

  it("finds nothing in a picture with no text", () => {
    expect(plateBoxes([])).toEqual([]);
  });
});
