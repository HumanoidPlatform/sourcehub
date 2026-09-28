// messages — the client's (and Ops') list of partners in conversation on an
// RFP: who, how many unread, the last line, and whether they ever bid.

import type { Proposal, Thread } from "@api/types";
import { Pill } from "@ds/primitives";
import { fmtAgo, fmtDateTime } from "@shared/format";
import { useNow } from "@shared/now";

export function ThreadList({
  threads,
  selected,
  onSelect,
  proposals,
}: {
  threads: Thread[];
  selected: string | null;
  onSelect: (id: string) => void;
  /** the RFP's bids, to mark a partner that asked but never responded */
  proposals: Proposal[];
}) {
  const now = useNow(30_000);
  const bidders = new Set(proposals.filter((p) => p.status !== "withdrawn").map((p) => p.partner_org_id));
  const rows = [...threads].sort((a, b) =>
    (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at),
  );
  return (
    <ul className="tlist" aria-label="Conversations">
      {rows.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            aria-current={selected === t.id ? "true" : undefined}
            onClick={() => onSelect(t.id)}
          >
            <span className="who">
              {t.partner_org_name ?? "A partner"}
              {t.unread_count > 0 && <Pill tone="attention">{t.unread_count} unread</Pill>}
              {!bidders.has(t.partner_org_id) && <span className="chip">No response</span>}
            </span>
            <span className="preview">
              {t.last_message_preview ?? "No messages yet"}
              {t.last_message_at && (
                <>
                  {" · "}
                  <time dateTime={t.last_message_at} title={fmtDateTime(t.last_message_at)}>
                    {fmtAgo(t.last_message_at, now)}
                  </time>
                </>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
