// Ending a contract early (db/610): its client, its partner or Ops ends it,
// alone and at once, with a reason. Every task that has not passed QA ends
// with it, the conversation closes, and the client may tender the RFP again.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { post, type Session } from "@api/client";
import type { Contract, Rfp } from "@api/types";
import { Button, Callout, useToast } from "@ds/primitives";
import { fmtDate } from "@shared/format";
import { useSession } from "@shared/auth";
import { ReasonDialog } from "@shared/reason-dialog";
import { can } from "@shared/rbac";

const LIVE = new Set(["active", "in_qa", "delivered", "disputed"]);

const PARTY: Record<string, string> = { client: "the client", partner: "the delivery partner", ops: "operations" };

/** Who may end it, while it is live: the client with contract.approve, the
 *  partner with contract.deliver, Ops with dispute.arbitrate (the route's guard). */
export function mayEndContract(c: Contract, session: Session): boolean {
  if (!LIVE.has(c.status)) return false;
  if (session.org_id === c.client_org_id) return can(session, "contract.approve");
  if (session.org_id === c.partner_org_id) return can(session, "contract.deliver");
  return can(session, "dispute.arbitrate");
}

/** "Ended by Acme Retail (the client) on 22 Oct 2026" */
export function endedBy(c: Contract): string | null {
  if (!c.ended) return null;
  const who = c.ended.by_org_name ? `${c.ended.by_org_name} (${PARTY[c.ended.by_party]})` : PARTY[c.ended.by_party];
  return `Ended by ${who} on ${fmtDate(c.ended.at)}`;
}

export function EndContractDialog({ c, onClose }: { c: Contract; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const live = (c.tasks ?? []).filter((t) => !["qa_passed", "cancelled"].includes(t.status)).length;
  const fixed = c.pricing?.basis !== "per_unit";
  return (
    <ReasonDialog
      title={`End ${c.reference_code}`}
      warning={
        <>
          The contract ends now, for everyone.{" "}
          {live > 0
            ? `${live} task${live === 1 ? "" : "s"} not yet through QA end${live === 1 ? "s" : ""} with it, and the suppliers and anyone capturing are told to stop.`
            : "No task is still in progress."}{" "}
          Work that passed QA stays accepted and invoices already raised stay payable;
          {fixed
            ? " further invoices are limited to the share of the price the accepted work bears."
            : " further invoices are limited to the accepted work."}{" "}
          The conversation closes, and the client can tender the RFP again. This cannot be undone.
        </>
      }
      confirmLabel="End contract"
      dismissLabel="Keep the contract"
      minLength={3}
      onConfirm={async (reason) => {
        await post<Contract>(`/contracts/${c.id}/end`, { reason });
        for (const queryKey of [["contract"], ["contracts"], ["tasks"], ["activity"], ["overview"], ["invoices"], ["requests"], ["request"], ["qa-queue"]]) {
          void qc.invalidateQueries({ queryKey });
        }
        toast("Contract ended", `${c.reference_code} has ended; everyone it reached has been told.`, "success");
      }}
      onClose={onClose}
    />
  );
}

/** At the top of an ended contract: who ended it, when and why; for the client, the way on. */
export function ContractEndedBanner({ c, isClient }: { c: Contract; isClient: boolean }) {
  if (!c.ended) return null;
  return (
    <Callout tone="neutral" title={endedBy(c) ?? "Ended"}>
      {c.ended.reason}
      {isClient && (
        <div style={{ marginTop: 8 }}>
          <RetenderButton requestId={c.request_id} />
        </div>
      )}
    </Callout>
  );
}

/** Copy the RFP into a new draft and open it. Asking again returns the copy
 *  already made, which may have been published since: that one is opened, not
 *  edited. Only for someone who may draft RFPs (rfp.create). */
export function RetenderButton({ requestId, label = "Tender the RFP again" }: { requestId: string; label?: string }) {
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const go = useMutation({
    mutationFn: () => post<Rfp>(`/requests/${requestId}/retender`),
    onSuccess: (copy) => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
      void qc.invalidateQueries({ queryKey: ["request", requestId] });
      if (copy.stored_status === "draft") {
        toast("Draft ready", `${copy.reference_code} is a copy of the RFP. Check the dates and publish it.`, "success");
        navigate(`/requests/${copy.id}/edit`);
      } else {
        toast("Already tendered again", `${copy.reference_code} was copied from this RFP.`, "neutral");
        navigate(`/requests/${copy.id}`);
      }
    },
    onError: (e) => toast("Cannot tender it again", e instanceof Error ? e.message : "", "critical"),
  });
  if (!can(session, "rfp.create")) return null;
  return (
    <Button size="sm" variant="primary" onClick={() => go.mutate()} disabled={go.isPending}>
      {label}
    </Button>
  );
}
