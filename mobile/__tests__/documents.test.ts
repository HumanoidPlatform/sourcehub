import type { Assignment, Attachment } from "../src/api/types";
import { describeFile, fmtSize, referenceSections } from "../src/documents";

const doc = (slot: string, filename: string, extra: Partial<Attachment> = {}): Attachment => ({
  id: `${slot}-${filename}`, slot, filename, content_type: null, size_bytes: 2048, ...extra,
});

const task = (extra: Partial<Assignment["task"]> = {}): Assignment["task"] => ({
  id: "t", reference_code: "TSK-01", title: "Shelf audit", instructions: null,
  capture_spec: {}, target_unit: "photos", due_on: null, status: "in_progress", ...extra,
});

describe("referenceSections", () => {
  it("is empty for a task with no files, so the card is not drawn", () => {
    expect(referenceSections(task())).toEqual([]);
    expect(referenceSections(task({ attachments: [], client_documents: [] }))).toEqual([]);
  });

  it("puts the coordinator's files first, then guidelines, examples, acceptance", () => {
    const got = referenceSections(task({
      attachments: [doc("instructions", "site-map.pdf")],
      // the server sends slots in its own order; the screen must not depend on it
      client_documents: [doc("acceptance", "criteria.docx"), doc("capture_examples", "good.jpg"), doc("guidelines", "field.pdf")],
    }));
    expect(got.map((x) => x.title)).toEqual([
      "From your coordinator", "Guidelines", "Capture examples", "What gets accepted",
    ]);
  });

  it("leaves out a section the server sent nothing for", () => {
    const got = referenceSections(task({ client_documents: [doc("guidelines", "field.pdf")] }));
    expect(got.map((x) => x.title)).toEqual(["Guidelines"]);
  });

  it("shows only the newest version of a document", () => {
    const got = referenceSections(task({
      client_documents: [
        doc("guidelines", "field.pdf", { id: "v2", version: 2, is_current: true }),
        doc("guidelines", "field.pdf", { id: "v1", version: 1, is_current: false }),
      ],
    }));
    expect(got[0]?.items.map((a) => a.id)).toEqual(["v2"]);
  });

  it("treats a row with no is_current flag as current", () => {
    const got = referenceSections(task({ attachments: [doc("instructions", "map.pdf")] }));
    expect(got[0]?.items).toHaveLength(1);
  });

  it("never invents a brief section, whatever arrives", () => {
    // The server does not send the brief to a worker. If it ever did, the app
    // still has nowhere to show it.
    const got = referenceSections(task({ client_documents: [doc("brief", "commercials.docx")] }));
    expect(got).toEqual([]);
  });
});

describe("describeFile", () => {
  it("names the type and the size", () => {
    expect(describeFile(doc("guidelines", "Field_Guidelines.pdf", { size_bytes: 3300 }))).toBe("PDF · 3 KB");
    expect(describeFile(doc("capture_examples", "good.bay.JPG", { size_bytes: 147742 }))).toBe("JPG · 144 KB");
  });

  it("copes with no extension and no size", () => {
    expect(describeFile(doc("guidelines", "README", { size_bytes: null }))).toBe("FILE");
    expect(describeFile(doc("guidelines", ".hidden", { size_bytes: 10 }))).toBe("FILE · 10 B");
    expect(describeFile(doc("guidelines", "trailing.", { size_bytes: 10 }))).toBe("FILE · 10 B");
  });
});

describe("fmtSize", () => {
  it("scales", () => {
    expect(fmtSize(512)).toBe("512 B");
    expect(fmtSize(4089)).toBe("4 KB");
    expect(fmtSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
