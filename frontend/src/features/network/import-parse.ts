// Reading a crowd roster out of a spreadsheet.
//
// The file is parsed HERE, in the browser, and the server is sent plain rows:
// the API takes JSON and nothing else, and a roster file is small. Everything
// in this module is pure apart from the two FileReader wrappers, so the rules
// — which columns count, how skills and yes/no are read, where the row limit
// falls — are tested without a browser.
//
// The Excel parser (SheetJS) is loaded only when an .xlsx is picked or the
// Excel template is asked for, through a dynamic import, so the main bundle
// carries none of it.

import type { Skill } from "@api/types";
import { SKILLS } from "./vocabularies";

/** Rows per file the server will judge in one request (IMPORT_CHECK_LIMIT). */
export const FILE_ROW_LIMIT = 1000;
/** Rows per import request; each batch is its own transaction and mail connection. */
export const IMPORT_BATCH = 50;

export const TEMPLATE_HEADERS = ["name", "email", "phone", "skills", "trained"] as const;

/** A row as the server takes it (ImportRowIn). `row` is the spreadsheet row
 *  number, header included, so a reason can say "row 14" and mean it. */
export interface ImportRow {
  row: number;
  display_name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  trained: boolean;
}

export interface Verdict {
  row: number;
  status: "ready" | "warning" | "error" | "skipped";
  reasons: string[];
  normalized: ImportRow;
}

export interface CheckResult {
  rows: Verdict[];
  counts: { ready: number; warning: number; error: number; skipped: number };
}

export interface ImportResultRow {
  row: number;
  outcome: "added" | "invited" | "skipped";
  reason?: string;
  worker_id?: string;
  invitation_error?: string;
}

export interface ImportResult {
  added: number;
  invited: number;
  skipped: number;
  invitation_failures: number;
  rows: ImportResultRow[];
}

/* --- CSV ---------------------------------------------------------------------- */

/** RFC 4180, leniently: quotes, commas and newlines inside quotes, doubled
 *  quotes, CRLF or LF, a BOM, and blank lines (dropped). Cells are trimmed. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows
    .map((r) => r.map((v) => v.trim()))
    .filter((r) => r.some((v) => v !== ""));
}

/** One CSV text from rows, quoting what needs it. Used for the template and
 *  the error report — the console's first generated files. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  const q = (v: string | number | boolean | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";
}

/* --- reading a File ------------------------------------------------------------- */
// FileReader, not Blob.text(): every browser this console targets has both, but
// the test DOM has only the first.

export function readText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error ?? new Error("Could not read the file"));
    r.readAsText(file);
  });
}

export function readBuffer(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error ?? new Error("Could not read the file"));
    r.readAsArrayBuffer(file);
  });
}

/** The first sheet of an .xlsx as rows of strings. Loads SheetJS on demand. */
export async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const book = XLSX.read(buffer, { type: "array" });
  const first = book.SheetNames[0];
  if (!first) return [];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[first]!, { header: 1, raw: true, defval: "" });
  return grid
    .map((r) => r.map((v) => (v == null ? "" : String(v).trim())))
    .filter((r) => r.some((v) => v !== ""));
}

/** An .xlsx file of the given rows, for the template. */
export async function xlsxBlob(rows: (string | number | boolean)[][], sheet = "Crowd"): Promise<Blob> {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), sheet);
  const out = XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* --- columns and values ------------------------------------------------------------ */

type Col = "name" | "email" | "phone" | "skills" | "trained";

const ALIASES: Record<Col, string[]> = {
  name: ["name", "fullname", "displayname", "crowdresource", "resource", "person"],
  email: ["email", "emailaddress", "mail"],
  phone: ["phone", "phonenumber", "mobile", "mobilenumber", "contact", "contactnumber", "whatsapp"],
  skills: ["skills", "skill", "capabilities"],
  trained: ["trained", "training", "completedtraining", "capturemodule"],
};

const key = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

/** Which column holds what, by header; a header the template did not use is
 *  ignored. `null` when there is no name column at all. */
export function mapHeaders(header: string[]): Partial<Record<Col, number>> | null {
  const map: Partial<Record<Col, number>> = {};
  header.forEach((h, i) => {
    const k = key(h);
    for (const col of Object.keys(ALIASES) as Col[]) {
      if (map[col] === undefined && ALIASES[col].includes(k)) map[col] = i;
    }
  });
  return map.name === undefined ? null : map;
}

const SKILL_BY_KEY = new Map<string, Skill>();
for (const s of SKILLS) {
  SKILL_BY_KEY.set(key(s.label), s.value);
  SKILL_BY_KEY.set(key(s.value), s.value);
}

/** "Shelf capture; retail_audit | Night driving" → codes; anything not on the
 *  list is passed through as typed, for the server to name in its warning. */
export function parseSkills(cell: string): string[] {
  const out: string[] = [];
  for (const part of cell.split(/[;|/]/)) {
    const p = part.trim();
    if (!p) continue;
    const code = SKILL_BY_KEY.get(key(p)) ?? p;
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

const YES = new Set(["yes", "y", "true", "1", "trained", "done", "completed"]);

export function parseTrained(cell: string): boolean {
  return YES.has(cell.trim().toLowerCase());
}

export class ImportFileError extends Error {}

/** Parsed rows → the rows the server takes. Throws ImportFileError for a file
 *  that cannot be read as a roster at all: no rows, no name column, too long. */
export function normaliseRows(grid: string[][]): ImportRow[] {
  const [header, ...body] = grid;
  if (!header) throw new ImportFileError("The file is empty.");
  const map = mapHeaders(header);
  if (!map) {
    throw new ImportFileError(
      "No 'name' column. The first row must be headers — download the template to see them.",
    );
  }
  if (body.length === 0) throw new ImportFileError("The file has headers but no rows.");
  if (body.length > FILE_ROW_LIMIT) {
    throw new ImportFileError(
      `${body.length} rows is more than the ${FILE_ROW_LIMIT} one file may hold. Split it and import each part.`,
    );
  }
  const at = (r: string[], col: Col) => (map[col] === undefined ? "" : (r[map[col]!] ?? "").trim());
  return body.map((r, i) => ({
    row: i + 2, // 1-based, header is row 1
    display_name: at(r, "name"),
    email: at(r, "email") || null,
    phone: at(r, "phone") || null,
    skills: parseSkills(at(r, "skills")),
    trained: parseTrained(at(r, "trained")),
  }));
}

/** The template's rows: the headers, one example, and the skill names to copy. */
export function templateRows(): string[][] {
  return [
    [...TEMPLATE_HEADERS],
    ["Asha Rao", "asha@example.com", "+91 98765 43210", "Shelf capture; Retail audit", "yes"],
    ["", "", "", "", ""],
    ["Skills you can use (separate several with ;):", SKILLS.map((s) => s.label).join("; "), "", "", ""],
    ["trained: yes or no", "email: optional — without one the person is on the roster but cannot be offered work", "", "", ""],
  ];
}

/** Rows for the error report: what was not imported, and why. */
export function reportRows(
  verdicts: Verdict[], results: ImportResultRow[],
): (string | number)[][] {
  const byRow = new Map(verdicts.map((v) => [v.row, v]));
  const out: (string | number)[][] = [["row", "name", "email", "outcome", "reason"]];
  for (const v of verdicts) {
    if (v.status === "error" || v.status === "skipped") {
      out.push([v.row, v.normalized.display_name, v.normalized.email ?? "", v.status, v.reasons.join(" ")]);
    }
  }
  for (const r of results) {
    const v = byRow.get(r.row);
    if (r.outcome === "skipped" && v && v.status !== "error" && v.status !== "skipped") {
      out.push([r.row, v.normalized.display_name, v.normalized.email ?? "", "skipped", r.reason ?? ""]);
    } else if (r.invitation_error && v) {
      out.push([r.row, v.normalized.display_name, v.normalized.email ?? "", "invitation not sent", r.invitation_error]);
    }
  }
  return out;
}

/** Hand the browser a file to save. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
