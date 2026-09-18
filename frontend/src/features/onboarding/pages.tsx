// onboarding — the Ops approval queue. The flow the prototype never had:
// a tenant asks, the platform decides, and the decision trail survives.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { OnboardingRow } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, inputCls, Metric, Panel, Pill, selectCls, TableWrap,
  textareaCls, useToast, View,
} from "@ds/primitives";
import { fmtDateTime, titleCase } from "@shared/format";
import { onboardingStatus, statusMeta } from "@shared/status";

export function OnboardingQueuePage() {
  const [selected, setSelected] = useState<OnboardingRow | null>(null);
  const [creating, setCreating] = useState(false);
  const requests = useQuery({ queryKey: ["onboarding"], queryFn: () => get<OnboardingRow[]>("/onboarding") });

  const rows = requests.data ?? [];
  const open = rows.filter((r) => ["submitted", "under_review"].includes(r.status));
  const decided = rows.filter((r) => !["submitted", "under_review"].includes(r.status));

  return (
    <View
      title="Onboarding"
      sub="Every organisation on the platform arrived through this queue. Approval creates the org, its first user and an invitation — atomically."
      // Tenants raise their own network requests from the Network page. Nobody
      // could raise the two kinds the platform itself sells to, so clients and
      // delivery partners had to be inserted by hand.
      actions={<Button variant="primary" onClick={() => setCreating(true)}>Onboard a client or partner</Button>}
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
      {creating && <NewOnboardingDialog onClose={() => setCreating(false)} />}
    </View>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The two kinds the platform registers and bills directly. Aggregators,
// businesses and sponsors belong to a partner's own network and are raised by
// that partner from the Network page, never here.
type TopKind = "client" | "tenant";

function NewOnboardingDialog({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<TopKind>("client");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [residency, setResidency] = useState("");
  const [plan, setPlan] = useState("");
  // industry for a client, HQ for a partner — same slot, different question
  const [trait, setTrait] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const isClient = kind === "client";

  // These keys are not decorative: approve_onboarding_request() reads exactly
  // country, residency_region, and then industry/plan for a client or
  // hq/plan/capabilities for a tenant (db/030_onboarding.sql). Anything else
  // lands in the request payload and is silently dropped at approval.
  const payload: Record<string, unknown> = {
    country: country.trim() || null,
    residency_region: residency || null,
    plan: plan.trim() || null,
    ...(isClient ? { industry: trait.trim() || null } : { hq: trait.trim() || null, capabilities: capabilities.trim() || null }),
  };

  const submit = useMutation({
    mutationFn: () =>
      post("/onboarding", {
        target_org_kind: kind,
        proposed_name: name.trim(),
        payload,
        contact: { full_name: contactName.trim(), email: contactEmail.trim() },
        submit: true,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
      toast(
        "Request raised",
        "It is in the queue below. Approving it creates the organisation and emails the first user.",
        "success",
      );
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not raise the request"),
  });

  const ready = name.trim() && contactName.trim() && EMAIL.test(contactEmail.trim());

  return (
    <Dialog
      title="Onboard a client or delivery partner"
      sub="This raises a request in the queue below — it does not create the organisation. Approving it does."
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!ready || submit.isPending} onClick={() => submit.mutate()}>
            Raise request
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Kind" required>
          {(id) => (
            <select id={id} className={selectCls} value={kind} onChange={(e) => setKind(e.target.value as TopKind)}>
              <option value="client">Client — buys data</option>
              <option value="tenant">Delivery partner — fulfils it</option>
            </select>
          )}
        </Field>
        <Field label="Plan" hint={isClient ? "Enterprise or Growth" : "Partner Pro or Partner Starter"}>
          {(id) => <input id={id} className={inputCls} value={plan} onChange={(e) => setPlan(e.target.value)} />}
        </Field>
        <Field label="Organisation name" required span>
          {(id) => (
            <input
              id={id}
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isClient ? "Meridian Grocery Group" : "Harbour Field Services"}
            />
          )}
        </Field>
        <Field label={isClient ? "Industry" : "Headquarters"}>
          {(id) => <input id={id} className={inputCls} value={trait} onChange={(e) => setTrait(e.target.value)} />}
        </Field>
        <Field label="Country">
          {(id) => <input id={id} className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />}
        </Field>
        {!isClient && (
          <Field label="Capabilities" span hint="What this partner can deliver — free text, shown on their profile.">
            {(id) => <input id={id} className={inputCls} value={capabilities} onChange={(e) => setCapabilities(e.target.value)} />}
          </Field>
        )}
        <Field label="Data residency" hint="Pins where captured data is stored.">
          {(id) => (
            <select id={id} className={selectCls} value={residency} onChange={(e) => setResidency(e.target.value)}>
              <option value="">Not set</option>
              <option value="US">US</option>
              <option value="EU">EU</option>
              <option value="APAC">APAC</option>
            </select>
          )}
        </Field>
        <Field label="First user — full name" required hint="Approval creates this person and emails them an invitation.">
          {(id) => <input id={id} className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} />}
        </Field>
        <Field label="First user — email" required span>
          {(id) => <input id={id} type="email" className={inputCls} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
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
                <td className="right"><div className="rowactions"><Button size="sm" onClick={() => onOpen(r)}>Open</Button></div></td>
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

  // The endpoint has always existed; the dialog used to tell the operator to go
  // and call it themselves. An invitation that went astray is the one thing
  // standing between an approved organisation and its first sign-in, so it is
  // the last place to send someone to the API.
  const resend = useMutation({
    mutationFn: () => post(`/onboarding/${row.id}/resend-invitation`),
    onSuccess: () => toast("Invitation resent", "A fresh link is on its way; the previous one is now void.", "success"),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not resend the invitation"),
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
          <>
            {d.status === "approved" && (
              <Button disabled={resend.isPending} onClick={() => resend.mutate()}>
                Resend invitation
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </>
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
          The organisation is active and its first user has been invited. If that email went astray,
          Resend invitation issues a fresh link.
        </Callout>
      )}
    </Dialog>
  );
}
