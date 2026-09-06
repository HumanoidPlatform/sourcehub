// onboarding — the Ops approval queue. The flow the prototype never had:
// a tenant asks, the platform decides, and the decision trail survives.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { OnboardingRow } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, Metric, Panel, Pill, TableWrap,
  textareaCls, useToast, View,
} from "@ds/primitives";
import { fmtDateTime, titleCase } from "@shared/format";
import { onboardingStatus, statusMeta } from "@shared/status";

export function OnboardingQueuePage() {
  const [selected, setSelected] = useState<OnboardingRow | null>(null);
  const requests = useQuery({ queryKey: ["onboarding"], queryFn: () => get<OnboardingRow[]>("/onboarding") });

  const rows = requests.data ?? [];
  const open = rows.filter((r) => ["submitted", "under_review"].includes(r.status));
  const decided = rows.filter((r) => !["submitted", "under_review"].includes(r.status));

  return (
    <View
      title="Onboarding"
      sub="Every organisation on the platform arrived through this queue. Approval creates the org, its first user and an invitation — atomically."
    >
      <div className="g3">
        <Metric label="Awaiting decision" value={open.length} />
        <Metric label="Approved all-time" value={rows.filter((r) => r.status === "approved").length} />
        <Metric label="Rejected all-time" value={rows.filter((r) => r.status === "rejected").length} />
      </div>

      <Panel title="Queue" sub="Oldest first — a tenant is waiting on each of these.">
        {open.length === 0 ? (
          <Empty title="Nothing waiting" hint="Tenant requests to onboard aggregators, businesses and sponsors land here." />
        ) : (
          <QueueTable rows={open} onOpen={setSelected} />
        )}
      </Panel>

      {decided.length > 0 && (
        <Panel title="Decided">
          <QueueTable rows={decided} onOpen={setSelected} />
        </Panel>
      )}

      {selected && <DecideDialog row={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

function QueueTable({ rows, onOpen }: { rows: OnboardingRow[]; onOpen: (r: OnboardingRow) => void }) {
  return (
    <TableWrap>
      <table>
        <thead><tr><th>Reference</th><th>Proposed</th><th>Kind</th><th>Submitted</th><th>Status</th><th /></tr></thead>
        <tbody>
          {rows.map((r) => {
            const m = statusMeta(onboardingStatus, r.status);
            return (
              <tr key={r.id}>
                <td className="id">{r.reference_code}</td>
                <td className="cell-primary">{r.proposed_name}</td>
                <td>{titleCase(r.target_org_kind)}</td>
                <td className="num">{fmtDateTime(r.submitted_at)}</td>
                <td><Pill tone={m.tone}>{m.label}</Pill></td>
                <td className="rowactions"><Button size="sm" onClick={() => onOpen(r)}>Open</Button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrap>
  );
}

function DecideDialog({ row, onClose }: { row: OnboardingRow; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: ["onboarding", row.id],
    queryFn: () => get<OnboardingRow>(`/onboarding/${row.id}`),
  });

  const decide = useMutation({
    mutationFn: (decision: string) =>
      post(`/onboarding/${row.id}/decide`, { decision, reason: reason || null }),
    onSuccess: (_d, decision) => {
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
      toast(
        decision === "approved" ? "Approved and onboarded" : "Decision recorded",
        decision === "approved"
          ? "The organisation exists and its first user has been emailed an invitation."
          : "The requesting tenant has been notified.",
        decision === "approved" ? "success" : "neutral",
      );
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not decide"),
  });

  const d = detail.data ?? row;
  const payload = d.payload ?? {};
  const decidable = ["submitted", "under_review"].includes(d.status);

  return (
    <Dialog
      title={`${d.proposed_name} — ${titleCase(d.target_org_kind)}`}
      sub={`${d.reference_code} · requested ${fmtDateTime(d.submitted_at)}`}
      onClose={onClose}
      foot={
        decidable ? (
          <>
            <Button onClick={onClose}>Later</Button>
            <Button variant="danger" disabled={decide.isPending} onClick={() => {
              if (!reason.trim()) return setError("A rejection needs a reason the tenant can act on.");
              decide.mutate("rejected");
            }}>Reject</Button>
            <Button disabled={decide.isPending} onClick={() => {
              if (!reason.trim()) return setError("Say what must change before sending it back.");
              decide.mutate("changes_requested");
            }}>Request changes</Button>
            <Button variant="success" disabled={decide.isPending} onClick={() => decide.mutate("approved")}>
              Approve and onboard
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )
      }
    >
      <Dl rows={[
        ...Object.entries(payload).map(([k, v]) => [titleCase(k), String(v ?? "—")] as [string, string]),
        ["First user", `${d.contact?.full_name ?? "—"} · ${d.contact?.email ?? "—"}`],
      ]} />

      {(d.approvals ?? []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <b className="small">Decision trail</b>
          {(d.approvals ?? []).map((a, i) => (
            // NOT .event — that is the activity timeline's 22px dot column plus
            // content, and three children in it put the verdict and the date
            // into the 22px track, one word per line.
            <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid var(--line)" : undefined }}>
              <div className="small"><b>{titleCase(a.decision)}</b> · step {a.step}</div>
              {a.reason && <div className="small muted" style={{ marginTop: 2 }}>{a.reason}</div>}
              <div className="cell-meta">{fmtDateTime(a.decided_at)}</div>
            </div>
          ))}
        </div>
      )}

      {decidable && (
        <div className="formgrid" style={{ marginTop: 12 }}>
          <Field label="Reason" span hint="Required for reject and request-changes; recorded on the trail either way.">
            {(id) => <textarea id={id} className={textareaCls} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
        </div>
      )}
      {error && <Callout tone="critical" title={error} />}
      {d.status === "approved" && (
        <Callout tone="success" title="Approved">
          The organisation is active. If the invitation email went astray it can be resent from the API.
        </Callout>
      )}
    </Dialog>
  );
}
