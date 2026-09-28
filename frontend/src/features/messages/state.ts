// messages — the pure rules the panels read: what a thread's state means to
// each viewer, and which stamp says a message was seen.

import type { Thread, ThreadMessage } from "@api/types";
import type { Viewer } from "./hooks";

export const isReadOnly = (t: Thread | null): boolean => !!t?.closed_at;

/** The sentence under a read-only thread, from the reader's side of it. */
export function readOnlyNote(t: Thread, viewer: Viewer): string {
  if (t.closed_reason === "awarded_elsewhere") {
    return viewer === "client"
      ? "You awarded this RFP to another partner."
      : "The RFP was awarded to another partner.";
  }
  if (t.closed_reason === "contract_completed") return "Delivery is complete.";
  return t.closed_message ?? "This conversation is read-only.";
}

export const unreadTotal = (ts: Thread[]): number => ts.reduce((n, t) => n + t.unread_count, 0);

export const threadFor = (ts: Thread[], partnerOrgId: string): Thread | null =>
  ts.find((t) => t.partner_org_id === partnerOrgId) ?? null;

/** The other organisation's name, as the viewer would say it. */
export function counterpartName(
  t: Thread | null, viewer: Viewer, fallbackClient?: string | null,
): string {
  if (viewer === "partner") return t?.client_org_name ?? fallbackClient ?? "the client";
  return t?.partner_org_name ?? "the partner";
}

/** Whether the OTHER organisation has opened the thread since this message:
 *  its stamp is at or past the message's number. */
export function seenByOtherSide(t: Thread, m: ThreadMessage): boolean {
  const stamp = m.sender_org_id === t.client_org_id ? t.partner_read_seq : t.client_read_seq;
  return m.seq <= stamp;
}

/** The newest message from anyone but my organisation — what a fresh page
 *  must stamp as read. */
export function newestFromOthers(messages: ThreadMessage[], myOrgId: string): ThreadMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.sender_org_id !== myOrgId) return m;
  }
  return null;
}
