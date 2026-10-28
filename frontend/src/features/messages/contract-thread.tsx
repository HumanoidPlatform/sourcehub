// messages — the awarded partner's conversation, continued on the contract
// page for both sides until the delivery is approved.

import type { Contract } from "@api/types";
import { Panel } from "@ds/primitives";
import { useSession } from "@shared/auth";
import { ThreadPanel } from "./ThreadPanel";
import { useThreads, viewerOf } from "./hooks";
import { threadFor } from "./state";

export function ContractThreadPanel({ c }: { c: Contract }) {
  const session = useSession();
  const viewer = viewerOf(session);
  // an ended contract (db/610) closes its conversation as completion does
  const closed = c.status === "completed" || c.status === "cancelled";
  const threads = useThreads(viewer ? c.request_id : undefined, viewer !== "ops" && !closed);
  if (!viewer || threads.isLoading) return null;
  const t = threadFor(threads.data ?? [], c.partner_org_id);
  // A winner that never asked before award can still start here — the
  // request's own page has closed its composer by then.
  const canStart = viewer === "partner" && session.org_id === c.partner_org_id && !closed;
  if (!t && !canStart) return null;
  const withName = viewer === "partner" ? c.client_name : c.partner_name;
  return (
    <Panel title="Conversation" sub={`With ${withName ?? "the other party"}. Continued from the RFP.`}>
      <ThreadPanel thread={t} viewer={viewer} requestId={c.request_id} canStart={canStart} clientName={c.client_name} />
    </Panel>
  );
}
