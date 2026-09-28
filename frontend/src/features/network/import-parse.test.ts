// The rules for reading a roster out of a spreadsheet. Pure, so no browser.

import { describe, expect, it } from "vitest";
import {
  FILE_ROW_LIMIT, ImportFileError, mapHeaders, normaliseRows, parseCsv, parseSkills, parseTrained,
  reportRows, templateRows, toCsv,
} from "./import-parse";

describe("parseCsv", () => {
  it("reads quotes, embedded commas and newlines, doubled quotes, CRLF and a BOM", () => {
    const text = '﻿name,email,phone\r\n"Rao, Asha",asha@example.com,"+91 ""98765"""\r\n"Multi\nline",,\n';
    expect(parseCsv(text)).toEqual([
      ["name", "email", "phone"],
      ["Rao, Asha", "asha@example.com", '+91 "98765"'],
      ["Multi\nline", "", ""],
    ]);
  });

  it("drops blank lines and trims cells", () => {
    expect(parseCsv("a , b\n\n  \nc,d\n")).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("round-trips through toCsv", () => {
    const rows = [["name", "note"], ["Rao, Asha", 'says "hi"\nthen leaves'], ["Dev", ""]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("headers", () => {
  it("finds the template's columns whatever their case or spacing", () => {
    expect(mapHeaders(["Full Name", "E-mail", "Mobile number", "Skills", "Trained?"])).toEqual({
      name: 0, email: 1, phone: 2, skills: 3, trained: 4,
    });
  });

  it("ignores columns it does not know and needs a name column", () => {
    expect(mapHeaders(["id", "name", "notes"])).toEqual({ name: 1 });
    expect(mapHeaders(["id", "notes"])).toBeNull();
  });
});

describe("values", () => {
  it("reads skills by label or code, with ; | or / between them", () => {
    expect(parseSkills("Shelf capture; retail_audit | Night driving / voice capture")).toEqual([
      "shelf_capture", "retail_audit", "night_driving", "voice_capture",
    ]);
  });

  it("passes an unknown skill through for the server to name, and drops repeats", () => {
    expect(parseSkills("Shelf capture; juggling; shelf_capture")).toEqual(["shelf_capture", "juggling"]);
    expect(parseSkills("")).toEqual([]);
  });

  it("reads trained as a yes/no word", () => {
    for (const v of ["yes", "Y", "TRUE", "1", "done", "Completed"]) expect(parseTrained(v)).toBe(true);
    for (const v of ["no", "n", "false", "0", "", "later"]) expect(parseTrained(v)).toBe(false);
  });
});

describe("normaliseRows", () => {
  const grid = [
    ["Name", "Email", "Phone", "Skills", "Trained"],
    ["Asha Rao", "asha@example.com", "+91 98765 43210", "Shelf capture", "yes"],
    ["Dev", "", "", "", ""],
  ];

  it("numbers rows as the spreadsheet does, header included", () => {
    expect(normaliseRows(grid)).toEqual([
      { row: 2, display_name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210", skills: ["shelf_capture"], trained: true },
      { row: 3, display_name: "Dev", email: null, phone: null, skills: [], trained: false },
    ]);
  });

  it("refuses an empty file, a headerless one, and one over the limit", () => {
    expect(() => normaliseRows([])).toThrow(ImportFileError);
    expect(() => normaliseRows([["id", "notes"], ["1", "x"]])).toThrow(/name/);
    expect(() => normaliseRows([grid[0]!])).toThrow(/no rows/);
    const big = [grid[0]!, ...Array.from({ length: FILE_ROW_LIMIT + 1 }, (_, i) => [`P${i}`, "", "", "", ""])];
    expect(() => normaliseRows(big)).toThrow(/1000/);
  });
});

describe("the template and the report", () => {
  it("starts with the server's five columns and lists every skill", () => {
    const rows = templateRows();
    expect(rows[0]).toEqual(["name", "email", "phone", "skills", "trained"]);
    expect(rows.some((r) => r.join(" ").includes("Drone operation"))).toBe(true);
  });

  it("reports what was not imported, and invitations that did not go out", () => {
    const verdicts = [
      { row: 2, status: "ready" as const, reasons: [], normalized: { row: 2, display_name: "A", email: "a@x.example", phone: null, skills: [], trained: false } },
      { row: 3, status: "error" as const, reasons: ["Not an email address: nope."], normalized: { row: 3, display_name: "B", email: null, phone: null, skills: [], trained: false } },
      { row: 4, status: "skipped" as const, reasons: ["Already on your roster."], normalized: { row: 4, display_name: "C", email: "c@x.example", phone: null, skills: [], trained: false } },
    ];
    const results = [
      { row: 2, outcome: "invited" as const, worker_id: "w", invitation_error: "Mailbox full" },
      { row: 3, outcome: "skipped" as const, reason: "Not an email address: nope." },
      { row: 4, outcome: "skipped" as const, reason: "Already on your roster." },
    ];
    expect(reportRows(verdicts, results)).toEqual([
      ["row", "name", "email", "outcome", "reason"],
      [3, "B", "", "error", "Not an email address: nope."],
      [4, "C", "c@x.example", "skipped", "Already on your roster."],
      [2, "A", "a@x.example", "invitation not sent", "Mailbox full"],
    ]);
  });
});
