// network — the tenant's network (with onboarding requests replacing the
// prototype's instant add), equipment and loans, the crowd roster, capacity.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { EquipmentRow, LoanRow, OnboardingRow, Org, WorkerRow } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, inputCls, Metric, Panel, Pill,
  TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, titleCase } from "@shared/format";
import { OrgProfileDialog } from "@shared/org-profile";
import {
  equipmentStatus, invitationStatus, loanStatus, onboardingStatus, orgStatus, statusMeta, workerStatus,
} from "@shared/status";

/* --- entity detail dialogs (row-fed; RLS already decided what the list holds) --- */

function EquipmentDetailDialog({ e, onClose }: { e: EquipmentRow; onClose: () => void }) {
  const m = statusMeta(equipmentStatus, e.status);
  return (
    <Dialog
      title={e.equipment_type}
      sub={<span className="id">{e.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["Sponsor", e.sponsor_name],
        ["Total units", <span key="t" className="num">{e.total_units}</span>],
        ["On loan", <span key="l" className="num">{e.units_on_loan}</span>],
        ["Available", <span key="a" className="num">{e.units_available}</span>],
        ["Calibrated on", fmtDate(e.calibrated_on)],
        ["Calibration expires", fmtDate(e.calibration_expires_on)],
        ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
      ]} />
    </Dialog>
  );
}

function LoanDetailDialog({ l, onClose }: { l: LoanRow; onClose: () => void }) {
  const m = statusMeta(loanStatus, l.status);
  return (
    <Dialog
      title={`${l.equipment_type} · ${l.units} unit(s)`}
      sub={<span className="id">{l.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["Equipment", `${l.equipment_type} (${l.equipment_ref})`],
        ["Sponsor", l.sponsor_name],
        ["Requester", l.requester_name],
        ["Units", <span key="u" className="num">{l.units}</span>],
        ["Needed by", fmtDate(l.needed_by)],
        ["Note", l.note ?? "—"],
        ["Task", l.task_ref ?? "—"],
        ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
        ["Decision reason", l.decision_reason ?? "—"],
      ]} />
    </Dialog>
  );
}

function WorkerDetailDialog({ w, onClose }: { w: WorkerRow; onClose: () => void }) {
  const m = statusMeta(workerStatus, w.status);
  return (
    <Dialog
      title={w.display_name}
      sub={<span className="id">{w.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["Email", w.email ?? "—"],
        ["Phone", w.phone ?? "—"],
        ["App access", <Pill key="i" tone={statusMeta(invitationStatus, w.invitation_status).tone}>{statusMeta(invitationStatus, w.invitation_status).label}</Pill>],
        ["Open assignments", <span key="o" className="num">{w.open_assignments}</span>],
        ["Skill", w.skill ?? "—"],
        ["Trained", w.trained ? "Yes" : "No"],
        ["Rating", w.rating ?? "—"],
        ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
      ]} />
    </Dialog>
  );
}

/* --- tenant: network with approval-based onboarding --------------------------- */

type NetKind = "aggregator" | "business" | "sponsor";

const KIND_LABEL: Record<NetKind, string> = {
  aggregator: "Aggregators",
  business: "Business partners",
  sponsor: "Device sponsors",
};

export function NetworkPage() {
  const [tab, setTab] = useState<NetKind>("aggregator");
  const [requesting, setRequesting] = useState(false);
  const [viewing, setViewing] = useState<Org | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const orgs = useQuery({
    queryKey: ["orgs", tab],
    queryFn: () => get<Org[]>(`/organisations?kind=${tab}`),
  });
  const pending = useQuery({
    queryKey: ["onboarding-mine"],
    queryFn: () => get<OnboardingRow[]>("/onboarding"),
  });

  const suspend = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      post(`/organisations/${vars.id}/suspend`, { reason: vars.reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orgs", tab] });
      toast("Removed from your network", "The organisation and its history remain on record.", "neutral");
    },
    onError: (e) => toast("Could not remove", e instanceof Error ? e.message : "", "critical"),
  });

  const openRequests = (pending.data ?? []).filter((r) =>
    ["submitted", "under_review", "changes_requested"].includes(r.status),
  );

  return (
    <View
      title="Network"
      sub="Registered under you — Cosarathi does not bill these accounts. New entries need platform approval."
      actions={<Button variant="primary" onClick={() => setRequesting(true)}>Request onboarding</Button>}
    >
      <div className="btnrow" role="tablist">
        {(Object.keys(KIND_LABEL) as NetKind[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className="btn"
            data-variant={tab === k ? "primary" : undefined}
            onClick={() => setTab(k)}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {openRequests.length > 0 && (
        <Panel title="Awaiting platform approval" sub="The request goes to Cosarathi operations; you are notified of the decision.">
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Proposed</th><th>Kind</th><th>Status</th><th>Latest reason</th></tr></thead>
              <tbody>
                {openRequests.map((r) => {
                  const m = statusMeta(onboardingStatus, r.status);
                  return (
                    <tr key={r.id}>
                      <td className="id">{r.reference_code}</td>
                      <td className="cell-primary">{r.proposed_name}</td>
                      <td>{titleCase(r.target_org_kind)}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td className="small muted">{r.approvals?.at(-1)?.reason ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      <Panel title={KIND_LABEL[tab]}>
        {(orgs.data ?? []).length === 0 ? (
          <Empty title={`No ${KIND_LABEL[tab].toLowerCase()} yet`} hint="Request onboarding and the platform reviews it." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Reference</th><th>Name</th>
                  {tab === "aggregator" && <><th>Crowd</th><th>Region</th><th>Focus</th></>}
                  {tab === "business" && <><th>Specialty</th><th>Capacity</th></>}
                  {tab === "sponsor" && <th>Contact</th>}
                  <th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {(orgs.data ?? []).map((o) => {
                  const m = statusMeta(orgStatus, o.status);
                  return (
                    <tr key={o.id} className="tap" onClick={() => setViewing(o)}>
                      <td className="id">{o.reference_code}</td>
                      <td className="cell-primary">{o.name}</td>
                      {tab === "aggregator" && (
                        <>
                          <td className="num">{(o.profile.crowd_size as number) ?? "—"}</td>
                          <td>{(o.profile.region as string) ?? "—"}</td>
                          <td>{(o.profile.focus as string) ?? "—"}</td>
                        </>
                      )}
                      {tab === "business" && (
                        <>
                          <td>{(o.profile.specialty as string) ?? "—"}</td>
                          <td>{(o.profile.capacity as string) ?? "—"}</td>
                        </>
                      )}
                      {tab === "sponsor" && <td>{(o.profile.contact_email as string) ?? "—"}</td>}
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td className="rowactions" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" onClick={() => setViewing(o)}>Details</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            const reason = window.prompt(
                              `Remove ${o.name} from your network? They lose access to your contracts immediately.\n\nReason:`,
                            );
                            if (reason?.trim()) suspend.mutate({ id: o.id, reason });
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {requesting && <OnboardRequestDialog kind={tab} onClose={() => setRequesting(false)} />}
      {viewing && <OrgProfileDialog orgId={viewing.id} seedName={viewing.name} onClose={() => setViewing(null)} />}
    </View>
  );
}

function OnboardRequestDialog({ kind, onClose }: { kind: NetKind; onClose: () => void }) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [extra1, setExtra1] = useState("");
  const [extra2, setExtra2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const payload: Record<string, unknown> =
    kind === "aggregator"
      ? { crowd_size: Number(extra1) || 0, region: extra2 }
      : kind === "business"
        ? { specialty: extra1, capacity: extra2 }
        : { contact_email: contactEmail };

  const submit = useMutation({
    mutationFn: () =>
      post("/onboarding", {
        target_org_kind: kind,
        proposed_name: name,
        payload,
        contact: { full_name: contactName, email: contactEmail },
        submit: true,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["onboarding-mine"] });
      toast("Request submitted", "Cosarathi operations will review it.", "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <Dialog
      title={`Request a new ${kind}`}
      sub="Unlike the prototype, nothing joins your network without platform approval — the request goes to Ops."
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || !contactName.trim() || !contactEmail.trim() || submit.isPending} onClick={() => submit.mutate()}>
            Submit for approval
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Organisation name" required span>
          {(id) => <input id={id} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "aggregator" ? "Pune Field Crew" : kind === "business" ? "Atlas Survey Group" : "Northwind Optics"} />}
        </Field>
        {kind === "aggregator" && (
          <>
            <Field label="Crowd size">{(id) => <input id={id} className={inputCls} type="number" value={extra1} onChange={(e) => setExtra1(e.target.value)} />}</Field>
            <Field label="Region">{(id) => <input id={id} className={inputCls} value={extra2} onChange={(e) => setExtra2(e.target.value)} />}</Field>
          </>
        )}
        {kind === "business" && (
          <>
            <Field label="Specialty">{(id) => <input id={id} className={inputCls} value={extra1} onChange={(e) => setExtra1(e.target.value)} />}</Field>
            <Field label="Capacity">{(id) => <input id={id} className={inputCls} value={extra2} onChange={(e) => setExtra2(e.target.value)} />}</Field>
          </>
        )}
        <Field label="First user — full name" required hint="Approval creates this person and emails them an invitation.">
          {(id) => <input id={id} className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} />}
        </Field>
        <Field label="First user — email" required>
          {(id) => <input id={id} className={inputCls} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- equipment (supplier browse + sponsor inventory) --------------------------- */

export function EquipmentPage() {
  const session = useSession();
  const isSponsor = session.org_kind === "sponsor";
  const qc = useQueryClient();
  const toast = useToast();
  const [borrowing, setBorrowing] = useState<EquipmentRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [viewingEq, setViewingEq] = useState<EquipmentRow | null>(null);
  const [viewingLoan, setViewingLoan] = useState<LoanRow | null>(null);

  const equipment = useQuery({ queryKey: ["equipment"], queryFn: () => get<EquipmentRow[]>("/network/equipment") });
  const loans = useQuery({ queryKey: ["loans"], queryFn: () => get<LoanRow[]>("/network/loans") });

  const cycle = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      post(`/network/equipment/${vars.id}/status`, { status: vars.status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["equipment"] }),
  });

  const myLoans = isSponsor ? [] : (loans.data ?? []);

  return (
    <View
      title={isSponsor ? "Inventory" : "Equipment"}
      sub={isSponsor
        ? "Your fleet. Calibration expiry blocks new loans automatically."
        : "Drawn from the device sponsors registered in your network, released on their approval."}
      actions={isSponsor && <Button variant="primary" onClick={() => setAdding(true)}>Add equipment</Button>}
    >
      <Panel title={isSponsor ? "Equipment types" : "Available from your network"}>
        {(equipment.data ?? []).length === 0 ? (
          <Empty title="No equipment" hint={isSponsor ? "Add your first equipment type." : "No sponsors registered in your network yet."} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Ref</th><th>Type</th>{!isSponsor && <th>Sponsor</th>}<th>Units</th>
                  <th>On loan</th><th>Available</th><th>Calibrated</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {(equipment.data ?? []).map((e) => {
                  const m = statusMeta(equipmentStatus, e.status);
                  return (
                    <tr key={e.id} className="tap" onClick={() => setViewingEq(e)}>
                      <td className="id">{e.reference_code}</td>
                      <td className="cell-primary">{e.equipment_type}</td>
                      {!isSponsor && <td>{e.sponsor_name}</td>}
                      <td className="num">{e.total_units}</td>
                      <td className="num">{e.units_on_loan}</td>
                      <td className="num">{e.units_available}</td>
                      <td className="num">{fmtDate(e.calibrated_on)}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td className="rowactions" onClick={(ev) => ev.stopPropagation()}>
                        <Button size="sm" onClick={() => setViewingEq(e)}>Details</Button>
                        {isSponsor ? (
                          <Button size="sm" onClick={() => {
                            const order = ["available", "in_use", "maintenance", "available"];
                            const next = order[order.indexOf(e.status) + 1] ?? "available";
                            cycle.mutate({ id: e.id, status: next });
                          }}>
                            Cycle status
                          </Button>
                        ) : (
                          <Button size="sm" variant="primary" disabled={e.units_available < 1} onClick={() => setBorrowing(e)}>
                            Request
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {!isSponsor && (
        <Panel title="Your requests">
          {myLoans.length === 0 ? (
            <Empty title="No equipment requests" />
          ) : (
            <TableWrap>
              <table>
                <thead><tr><th>Ref</th><th>Equipment</th><th>Sponsor</th><th>Units</th><th>Needed by</th><th>Status</th><th>Reason</th><th /></tr></thead>
                <tbody>
                  {myLoans.map((l) => {
                    const m = statusMeta(loanStatus, l.status);
                    return (
                      <tr key={l.id} className="tap" onClick={() => setViewingLoan(l)}>
                        <td className="id">{l.reference_code}</td>
                        <td>{l.equipment_type}</td>
                        <td>{l.sponsor_name}</td>
                        <td className="num">{l.units}</td>
                        <td className="num">{fmtDate(l.needed_by)}</td>
                        <td><Pill tone={m.tone}>{m.label}</Pill></td>
                        <td className="small muted">{l.decision_reason ?? "—"}</td>
                        <td className="rowactions" onClick={(ev) => ev.stopPropagation()}>
                          <Button size="sm" onClick={() => setViewingLoan(l)}>Details</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>
      )}

      {borrowing && (
        <BorrowDialog equipment={borrowing} onClose={() => setBorrowing(null)} onDone={() => {
          setBorrowing(null);
          void qc.invalidateQueries();
          toast("Request sent", "The sponsor decides; you are notified either way.", "success");
        }} />
      )}
      {adding && (
        <AddEquipmentDialog onClose={() => setAdding(false)} onDone={() => {
          setAdding(false);
          void qc.invalidateQueries({ queryKey: ["equipment"] });
          toast("Equipment added", undefined, "success");
        }} />
      )}
      {viewingEq && <EquipmentDetailDialog e={viewingEq} onClose={() => setViewingEq(null)} />}
      {viewingLoan && <LoanDetailDialog l={viewingLoan} onClose={() => setViewingLoan(null)} />}
    </View>
  );
}

function BorrowDialog({ equipment, onClose, onDone }: { equipment: EquipmentRow; onClose: () => void; onDone: () => void }) {
  const [units, setUnits] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      post("/network/loans", {
        equipment_id: equipment.id, units: Number(units),
        needed_by: neededBy || null, note: note || null,
      }),
    onSuccess: onDone,
    onError: (e) => setError(e instanceof Error ? e.message : "Could not request"),
  });

  return (
    <Dialog
      title={`Request ${equipment.equipment_type}`}
      sub={`${equipment.sponsor_name} · ${equipment.units_available} of ${equipment.total_units} available`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!units || Number(units) < 1 || submit.isPending} onClick={() => submit.mutate()}>
            Send request
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Units" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} max={equipment.units_available} value={units} onChange={(e) => setUnits(e.target.value)} />}
        </Field>
        <Field label="Needed by">
          {(id) => <input id={id} className={inputCls} type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />}
        </Field>
        <Field label="Note to the sponsor" span>
          {(id) => <textarea id={id} className={textareaCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Night-route capture, 8-week loan." />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

function AddEquipmentDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState("");
  const [units, setUnits] = useState("");
  const [calibrated, setCalibrated] = useState("");
  const [expires, setExpires] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      post("/network/equipment", {
        equipment_type: type, total_units: Number(units),
        calibrated_on: calibrated || null, calibration_expires_on: expires || null,
      }),
    onSuccess: onDone,
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add"),
  });

  return (
    <Dialog
      title="Add equipment"
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!type.trim() || !units || submit.isPending} onClick={() => submit.mutate()}>
            Add to inventory
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Equipment type" required span>
          {(id) => <input id={id} className={inputCls} value={type} onChange={(e) => setType(e.target.value)} placeholder="Helmet camera, 4K" />}
        </Field>
        <Field label="Units" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={units} onChange={(e) => setUnits(e.target.value)} />}
        </Field>
        <Field label="Calibrated on">
          {(id) => <input id={id} className={inputCls} type="date" value={calibrated} onChange={(e) => setCalibrated(e.target.value)} />}
        </Field>
        <Field label="Calibration expires" hint="Expired calibration blocks new loans automatically.">
          {(id) => <input id={id} className={inputCls} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- sponsor: loan queue -------------------------------------------------------- */

export function LoanQueuePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [viewing, setViewing] = useState<LoanRow | null>(null);
  const loans = useQuery({ queryKey: ["loans"], queryFn: () => get<LoanRow[]>("/network/loans") });

  const decide = useMutation({
    mutationFn: (vars: { id: string; decision: string; reason?: string }) =>
      post(`/network/loans/${vars.id}/decide`, { decision: vars.decision, reason: vars.reason ?? null }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Decision recorded", "The requester has been notified.", "success");
    },
    onError: (e) => toast("Refused", e instanceof Error ? e.message : "", "critical"),
  });

  const rows = loans.data ?? [];
  const pending = rows.filter((l) => l.status === "pending");

  return (
    <View title="Requests" sub="Approving marks the type in use; a rejection needs a reason the requester can act on.">
      <div className="g3">
        <Metric label="Awaiting decision" value={pending.length} />
        <Metric label="Units requested" value={pending.reduce((s, l) => s + l.units, 0)} />
        <Metric label="All-time requests" value={rows.length} />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No requests yet" hint="Suppliers in your tenant's network can request loans." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Ref</th><th>Equipment</th><th>Requester</th><th>Units</th><th>Needed by</th><th>Note</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map((l) => {
                  const m = statusMeta(loanStatus, l.status);
                  return (
                    <tr key={l.id} className="tap" onClick={() => setViewing(l)}>
                      <td className="id">{l.reference_code}</td>
                      <td>{l.equipment_type}</td>
                      <td>{l.requester_name}</td>
                      <td className="num">{l.units}</td>
                      <td className="num">{fmtDate(l.needed_by)}</td>
                      <td className="small" style={{ maxWidth: 220 }}>{l.note ?? "—"}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td className="rowactions" onClick={(ev) => ev.stopPropagation()}>
                        <Button size="sm" onClick={() => setViewing(l)}>Details</Button>
                        {l.status === "pending" && (
                          <>
                            <Button size="sm" variant="success" onClick={() => decide.mutate({ id: l.id, decision: "approved" })}>Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => {
                              const reason = window.prompt("Reason for rejecting — the requester cannot act on a blank one:");
                              if (reason?.trim()) decide.mutate({ id: l.id, decision: "rejected", reason });
                            }}>Reject</Button>
                          </>
                        )}
                        {["approved", "issued", "overdue"].includes(l.status) && (
                          <Button size="sm" onClick={() => decide.mutate({ id: l.id, decision: "returned" })}>Mark returned</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
      {viewing && <LoanDetailDialog l={viewing} onClose={() => setViewing(null)} />}
    </View>
  );
}

/* --- aggregator: roster ---------------------------------------------------------- */

export function RosterPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<WorkerRow | null>(null);
  const workers = useQuery({ queryKey: ["workers"], queryFn: () => get<WorkerRow[]>("/network/workers") });

  const setStatus = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      post(`/network/workers/${vars.id}/status`, { status: vars.status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["workers"] }),
  });
  const resend = useMutation({
    mutationFn: (id: string) => post(`/network/workers/${id}/resend-invitation`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["workers"] });
      toast("Invitation sent again", undefined, "success");
    },
    onError: (e) => toast("Could not resend", e instanceof Error ? e.message : "", "critical"),
  });

  const rows = workers.data ?? [];
  const onShift = rows.filter((w) => w.status === "on_shift").length;
  const signedUp = rows.filter((w) => w.invitation_status === "accepted").length;
  const invited = rows.filter((w) => w.invitation_status === "pending" || w.invitation_status === "expired").length;

  return (
    <View
      title="Crowd roster"
      sub="Invite a worker by email; they set a password and sign in to the capture app. Task units can be assigned to anyone who has signed up."
      actions={<Button variant="primary" onClick={() => setAdding(true)}>Add worker</Button>}
    >
      <div className="g4">
        <Metric label="Roster" value={rows.length} />
        <Metric label="On shift" value={onShift} />
        <Metric label="Signed up" value={signedUp} />
        <Metric label="Invited, not yet signed up" value={invited} />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No workers on the roster" hint="Add a worker with their email to invite them to the app." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Ref</th><th>Name</th><th>Email</th><th>Skill</th><th>App access</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map((w) => {
                  const m = statusMeta(workerStatus, w.status);
                  const inv = statusMeta(invitationStatus, w.invitation_status);
                  const canResend = (w.invitation_status === "pending" || w.invitation_status === "expired") && w.status !== "offboarded";
                  return (
                    <tr key={w.id} className="tap" onClick={() => setViewing(w)}>
                      <td className="id">{w.reference_code}</td>
                      <td className="cell-primary">
                        {w.display_name}
                        {w.open_assignments > 0 && (
                          <div className="cell-meta">{w.open_assignments} open assignment{w.open_assignments === 1 ? "" : "s"}</div>
                        )}
                      </td>
                      <td className="small">{w.email ?? "—"}</td>
                      <td>{w.skill ?? "—"}</td>
                      <td><Pill tone={inv.tone}>{inv.label}</Pill></td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td className="rowactions" onClick={(ev) => ev.stopPropagation()}>
                        <Button size="sm" onClick={() => setViewing(w)}>Details</Button>
                        {canResend && (
                          <Button size="sm" disabled={resend.isPending} onClick={() => resend.mutate(w.id)}>Resend invite</Button>
                        )}
                        {w.status !== "offboarded" && (
                          <>
                            <Button size="sm" onClick={() => setStatus.mutate({ id: w.id, status: w.status === "on_shift" ? "on_break" : "on_shift" })}>
                              {w.status === "on_shift" ? "Break" : "On shift"}
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setStatus.mutate({ id: w.id, status: "offboarded" })}>
                              Offboard
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {adding && (
        <AddWorkerDialog
          onClose={() => setAdding(false)}
          onDone={(invited) => {
            setAdding(false);
            void qc.invalidateQueries({ queryKey: ["workers"] });
            toast(
              invited ? "Invitation emailed" : "Added to the roster",
              invited ? "They set a password from the link, then sign in to the app." : undefined,
              "success",
            );
          }}
        />
      )}
      {viewing && <WorkerDetailDialog w={viewing} onClose={() => setViewing(null)} />}
    </View>
  );
}

function AddWorkerDialog({ onClose, onDone }: { onClose: () => void; onDone: (invited: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skill, setSkill] = useState("");
  const [trained, setTrained] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = useMutation({
    mutationFn: () =>
      post("/network/workers", {
        display_name: name, email: email.trim() || null, phone: phone.trim() || null,
        skill: skill || null, trained,
      }),
    onSuccess: () => onDone(!!email.trim()),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add the worker"),
  });
  return (
    <Dialog
      title="Add a crowd worker"
      sub="With an email they are invited to the capture app; without one this is a roster record only."
      onClose={onClose}
      foot={<>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!name.trim() || submit.isPending} onClick={() => submit.mutate()}>
          {email.trim() ? "Add and invite" : "Add"}
        </Button>
      </>}
    >
      <div className="formgrid">
        <Field label="Name" required span>{(id) => <input id={id} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Email" hint="The invitation goes here; it is also their sign-in.">
          {(id) => <input id={id} className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@example.com" />}
        </Field>
        <Field label="Phone">{(id) => <input id={id} className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
        <Field label="Skill">{(id) => <input id={id} className={inputCls} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Street imagery" />}</Field>
        <Field label="Trained">
          {(id) => (
            <label className="checkline">
              <input id={id} type="checkbox" checked={trained} onChange={(e) => setTrained(e.target.checked)} />
              <span>Completed the capture module</span>
            </label>
          )}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- business: capacity ----------------------------------------------------------- */

export function CapacityPage() {
  const me = useQuery({ queryKey: ["org-me"], queryFn: () => get<Org>("/organisations/me") });
  const o = me.data;
  return (
    <View title="Capacity" sub="Your company profile as your delivery partner and their clients see it.">
      <Panel title={o?.name ?? "…"}>
        {o && (
          <Dl rows={[
            ["Reference", o.reference_code],
            ["Specialty", (o.profile.specialty as string) ?? "—"],
            ["Capacity", (o.profile.capacity as string) ?? "—"],
            ["Rating", o.rating ?? "—"],
            ["Status", titleCase(o.status)],
          ]} />
        )}
      </Panel>
    </View>
  );
}
