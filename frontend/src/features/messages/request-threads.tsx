// messages — the conversations panel on the RFP page, for every role:
//   partner  "Questions to the client": its own thread, or the composer that
//            opens one while the RFP is still open for proposals;
//   client   "Conversations": every partner's thread, with unread counts;
//   Ops      the same list, read-only.
// A bell notification lands here as /requests/{id}?thread=<id>.

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { Rfp, Thread } from "@api/types";
import { Empty, Loadable, Panel, Pill, useToast } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { ThreadList } from "./ThreadList";
import { ThreadPanel } from "./ThreadPanel";
import { useThreads, viewerOf } from "./hooks";
import { unreadTotal } from "./state";

// effective statuses: a stored 'published' shows as either of the first two
const OPEN = ["published", "proposals_received"];
const TERMINAL = ["completed", "cancelled"];

const newest = (ts: Thread[]): Thread =>
  [...ts].sort((a, b) =>
    (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at),
  )[0]!;

export function RequestThreadsPanel({
  r,
  selected,
  onSelect,
}: {
  r: Rfp;
  /** the client's chosen thread; the page owns it so a bid row can choose too */
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const session = useSession();
  const viewer = viewerOf(session);
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const wanted = sp.get("thread");
  const rootRef = useRef<HTMLDivElement>(null);
  const tried = useRef<string | null>(null);

  const threads = useThreads(viewer ? r.id : undefined, viewer !== "ops" && !TERMINAL.includes(r.status));
  const list = threads.data ?? [];
  const mine = viewer === "partner" ? (list.find((t) => t.partner_org_id === session.org_id) ?? null) : null;
  // Award is the cut-off, not the bidding deadline: a partner may still ask
  // about a request whose window has closed while the client is deciding.
  const canStart = viewer === "partner" && OPEN.includes(r.status);

  const focusPanel = () => {
    rootRef.current?.scrollIntoView?.({ block: "start" });
    rootRef.current?.focus();
  };

  // The deep link, once per id, then the param is dropped so Back does not
  // re-select (the TasksPage pattern); otherwise the newest thread is chosen
  // for the client so the panel never opens on an empty right-hand side.
  useEffect(() => {
    if (!viewer || !threads.isSuccess) return;
    if (wanted) {
      if (tried.current === wanted) return;
      tried.current = wanted;
      if (viewer === "partner") {
        if (mine) focusPanel();
      } else {
        const t = list.find((x) => x.id === wanted);
        if (t) {
          onSelect(t.id);
          focusPanel();
        } else {
          toast("That conversation is not on this RFP", undefined, "neutral");
        }
      }
      const next = new URLSearchParams(sp);
      next.delete("thread");
      setSp(next, { replace: true });
      return;
    }
    if (viewer !== "partner" && selected === null && list.length > 0) onSelect(newest(list).id);
  }, [viewer, threads.isSuccess, wanted, list, mine, selected, onSelect, sp, setSp, toast]);

  if (!viewer) return null;

  if (viewer === "partner") {
    if (!mine && !canStart) return null;
    return (
      <div id="conversations" tabIndex={-1} ref={rootRef} style={{ outline: "none" }}>
        <Panel
          title="Questions to the client"
          sub="Only you and the client can read this. Ask before you respond, or while your response is being considered."
        >
          <ThreadPanel thread={mine} viewer="partner" requestId={r.id} canStart={canStart} clientName={r.client_name} />
        </Panel>
      </div>
    );
  }

  if (r.status === "draft") return null;
  const unread = unreadTotal(list);
  const current = list.find((t) => t.id === selected) ?? null;
  return (
    <div id="conversations" tabIndex={-1} ref={rootRef} style={{ outline: "none" }}>
      <Panel
        title={<>Conversations {unread > 0 && <Pill tone="attention">{unread} unread</Pill>}</>}
        sub={viewer === "ops"
          ? "Every partner's conversation on this RFP."
          : "Each partner sees only its own conversation with you."}
      >
        <Loadable q={threads} what="conversations">
          {list.length === 0 ? (
            <Empty title="No conversations yet" hint="When a partner asks a question about this RFP, it appears here." />
          ) : list.length === 1 ? (
            <ThreadPanel thread={list[0]!} viewer={viewer} requestId={r.id} canStart={false} />
          ) : (
            <div className="convo">
              <ThreadList threads={list} selected={current?.id ?? null} onSelect={onSelect} proposals={r.proposals ?? []} />
              {current ? (
                <ThreadPanel thread={current} viewer={viewer} requestId={r.id} canStart={false} />
              ) : (
                <p className="small muted">Choose a conversation.</p>
              )}
            </div>
          )}
        </Loadable>
      </Panel>
    </div>
  );
}
