// What to read before capturing, grouped for the assignment screen. Pure, so
// it can be tested without a phone — the component in components/DocumentList
// only draws what this returns.

import type { Assignment, Attachment } from "@/api/types";

export interface DocumentSection {
  title: string;
  items: Attachment[];
}

// The ones a person about to capture reaches for first at the top. A slot the
// server did not send (it decides who may read what) simply has no section.
const CLIENT_SLOTS: readonly (readonly [slot: string, title: string])[] = [
  ["guidelines", "Guidelines"],
  ["capture_examples", "Capture examples"],
  ["acceptance", "What gets accepted"],
  ["compliance", "Compliance"],
];

/** Only the newest version of each document: someone in a shop aisle needs the
 *  rules as they stand, not the history the console keeps for disputes. */
const current = (rows: Attachment[] | undefined): Attachment[] =>
  (rows ?? []).filter((a) => a.is_current !== false);

export function referenceSections(task: Assignment["task"]): DocumentSection[] {
  const fromClient = current(task.client_documents);
  const sections: DocumentSection[] = [
    { title: "From your coordinator", items: current(task.attachments) },
    ...CLIENT_SLOTS.map(([slot, title]) => ({ title, items: fromClient.filter((a) => a.slot === slot) })),
  ];
  return sections.filter((sec) => sec.items.length > 0);
}

/** "PDF · 3 KB" — what it is and whether it is worth opening on mobile data. */
export function describeFile(a: Attachment): string {
  const dot = a.filename.lastIndexOf(".");
  const kind = dot > 0 && dot < a.filename.length - 1 ? a.filename.slice(dot + 1).toUpperCase() : "FILE";
  return a.size_bytes == null ? kind : `${kind} · ${fmtSize(a.size_bytes)}`;
}

export function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
