import { describe, expect, it } from "vitest";
import type { AssetRow } from "@api/types";
import type { Derived } from "./facts";
import { admit, groupRefusals, room, type AdmitContext } from "./intake";
import type { QueueItem, Refusal } from "./item";

const MB = 1024 * 1024;

// A File whose size is a claim rather than an allocation: the checks read
// .size, nothing here reads the bytes.
function file(name: string, size = 3 * MB, lastModified = 1_700_000_000_000): File {
  const f = new File([new Uint8Array(8)], name, { type: "image/jpeg", lastModified });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

// A probe that says every photo is a fine 12 MP landscape with EXIF.
const goodDerive = async (f: File, kind: "photo" | "video"): Promise<Derived> => ({
  facts: { kind, size: f.size, width: 4032, height: 3024, fix: null, tilt: null },
  mime: f.type || "image/jpeg",
  captured_at: "2026-09-16T10:00:00.000Z",
  captured_from_exif: true,
  lat: null,
  lon: null,
  duration: kind === "video" ? 30 : null,
  decoded: true,
});

function serverRow(status: string, id = `a-${status}`): AssetRow {
  return {
    id, task_id: "t", assignment_id: "as", submission_id: null, captured_by_user_id: "u", captured_by_name: null,
    filename: "x.jpg", mime_type: "image/jpeg", size_bytes: 1, sha256: "s".repeat(64), etag: null, status,
    quarantine_reason: null, captured_at: null, captured_lat: null, captured_lon: null, uploaded_at: null, created_at: "",
  };
}

function item(over: Partial<QueueItem>): QueueItem {
  return {
    id: "i", assignment_id: "as", file: null, filename: "q.jpg", mime: "image/jpeg", size: 1, captured_at: "", lat: null, lon: null,
    checks: [], sha256: null, asset_id: null, put_url: null, put_headers: null, url_expires_at: null, status: "captured",
    attempts: 0, next_attempt_at: 0, last_error: null, note: null, saw_offline: false, created_at: 0, ...over,
  };
}

const ctx = (over: Partial<AdmitContext> = {}): AdmitContext => ({
  spec: { media: ["photo"] }, targetUnit: "photos", quantity: 5, serverRows: [], queued: [], ...over,
});

const codes = (rs: Refusal[]) => rs.map((r) => r.findings.map((f) => f.code));

describe("room", () => {
  it("is unbounded when the assignment has no quantity", () => {
    expect(room({ quantity: 0, serverRows: [], queued: [] })).toBe(Number.POSITIVE_INFINITY);
  });
  // The server counts pending and quarantined too, so a presign that was
  // never followed by a PUT holds a slot until it is removed.
  it("counts every server row that is not rejected or erased", () => {
    const rows = [serverRow("ready"), serverRow("pending"), serverRow("quarantined"), serverRow("rejected"), serverRow("erased")];
    expect(room({ quantity: 5, serverRows: rows, queued: [] })).toBe(2);
  });
  it("counts queued items that have no asset yet, and not failed ones", () => {
    const queued = [item({ asset_id: null }), item({ asset_id: "a1" }), item({ asset_id: null, status: "failed" })];
    expect(room({ quantity: 5, serverRows: [], queued })).toBe(4);
  });
});

describe("admit", () => {
  it("splits accepted from refused, warnings riding with the accepted", async () => {
    const r = await admit("as", [file("a.jpg"), file("b.gif")], ctx({ spec: { media: ["photo"], max_tilt_deg: 10 } }), goodDerive);
    expect(r.accepted.map((a) => a.file.name)).toEqual(["a.jpg"]);
    expect(r.accepted[0]!.checks.map((c) => c.code)).toEqual(["tilt_unverified", "web_upload"]);
    expect(codes(r.refused)).toEqual([["file_type"]]);
  });

  it("refuses a blocked file with every block it broke", async () => {
    const r = await admit("as", [file("big.jpg", 30 * MB)], ctx({ spec: { media: ["video"] } }), goodDerive);
    expect(codes(r.refused)).toEqual([["media_kind", "size"]]);
    expect(r.accepted).toEqual([]);
  });

  it("skips a file already queued, or picked twice in one go", async () => {
    const twice = file("a.jpg");
    const queued = [item({ file: file("q.jpg") })];
    const r = await admit("as", [twice, twice, file("q.jpg")], ctx({ queued }), goodDerive);
    expect(r.accepted.map((a) => a.file.name)).toEqual(["a.jpg"]);
    expect(codes(r.refused)).toEqual([["duplicate"], ["duplicate"]]);
  });

  it("refuses beyond the room left, in the server's words, without deriving", async () => {
    let derived = 0;
    const counting = async (f: File, k: "photo" | "video") => {
      derived++;
      return goodDerive(f, k);
    };
    const r = await admit("as", [file("1.jpg"), file("2.jpg"), file("3.jpg")], ctx({ quantity: 3, serverRows: [serverRow("ready"), serverRow("pending")] }), counting);
    expect(r.accepted).toHaveLength(1);
    expect(codes(r.refused)).toEqual([["quantity"], ["quantity"]]);
    expect(r.refused[0]!.findings[0]!.message).toBe("This assignment is for 3 captures and already has 2. Remove one before adding another.");
    expect(derived).toBe(1);
  });
});

describe("groupRefusals", () => {
  it("counts by code, most common first", () => {
    const rs: Refusal[] = [
      { id: "1", assignment_id: "as", filename: "a", size: 1, at: 0, findings: [{ code: "orientation", severity: "block", message: "o" }] },
      { id: "2", assignment_id: "as", filename: "b", size: 1, at: 0, findings: [{ code: "orientation", severity: "block", message: "o" }, { code: "size", severity: "block", message: "s" }] },
      { id: "3", assignment_id: "as", filename: "c", size: 1, at: 0, findings: [{ code: "duration", severity: "block", message: "d" }] },
    ];
    expect(groupRefusals(rs).map((g) => [g.code, g.n])).toEqual([["orientation", 2], ["duration", 1], ["size", 1]]);
  });
});
