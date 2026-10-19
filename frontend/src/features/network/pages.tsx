// network — the tenant's network (with onboarding requests replacing the
// prototype's instant add), equipment and loans, the crowd roster, capacity.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { get, patch, post } from "@api/client";
import type { Attachment, EquipmentRow, LoanRow, OnboardingRow, Org, Skill, WorkerRow } from "@api/types";
import {
  AttachmentList, AttachmentsField, attachmentPayload, DOCUMENT_ACCEPT, fromServer, PHOTO_ACCEPT,
  type AttachmentDraft,
} from "@shared/attachments";
import { labelsOf } from "@features/marketplace/vocabularies";
import { ImportCrowdDialog } from "./import";
import { SKILLS } from "./vocabularies";
import {
  Button, Callout, CheckGroup, Dialog, Dl, Empty, Field, inputCls, Loadable, Metric, Panel, Pill, selectCls,
  TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { COMPANY } from "@shared/brand";
import { fmtDate, titleCase } from "@shared/format";
import { OrgProfileDialog } from "@shared/org-profile";
import { stars } from "@shared/rating";
import { ReasonDialog } from "@shared/reason-dialog";
import {
  invitationStatus, loanStatus, onboardingStatus, orgStatus, statusMeta, type Tone, workerStatus,
} from "@shared/status";

/* --- entity detail dialogs (row-fed; RLS already decided what the list holds) --- */

/** "GoPro HERO12 Black", or null when the sponsor has given neither. */
function makeModel(e: Pick<EquipmentRow, "make" | "model">): string | null {
  return [e.make, e.model].filter(Boolean).join(" ") || null;
}

/** The device's first photo, small, beside its name in a list. The URL comes
 *  signed with the list (photo_url), so a table draws every thumbnail without
 *  asking for one per row. No photo, or a URL that has lapsed while the page
 *  sat open, shows the same quiet camera outline instead of a broken image. */
function DeviceThumb({ url }: { url?: string | null }) {
  const [broken, setBroken] = useState(false);
  // A refetch brings a freshly signed URL: try again rather than keep the placeholder.
  useEffect(() => setBroken(false), [url]);
  if (url && !broken) {
    // Decorative: the device's name is beside it and says what it is.
    return <img className="devthumb" src={url} alt="" loading="lazy" onError={() => setBroken(true)} />;
  }
  return (
    <span className="devthumb devthumb-empty" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    </span>
  );
}

/** The newest version of each file in one of a device's two fields. */
function inSlot(rows: Attachment[] | undefined, slot: "photos" | "documentation"): Attachment[] {
  return (rows ?? []).filter((a) => a.slot === slot && a.is_current !== false);
}

/** A device's photos, signed when the dialog opens rather than once per table
 *  row: storage is private, an <img> cannot send the bearer token, and a
 *  signed URL per row would be a request per device just to draw the list. */
function PhotoStrip({ photos }: { photos: Attachment[] }) {
  const signed = useQuery({
    queryKey: ["equipment-photos", photos.map((p) => p.id)],
    queryFn: () => Promise.all(photos.map((p) => get<{ url: string }>(`/attachments/${p.id}/url`))),
    staleTime: 60_000,
  });
  return (
    <div className="photostrip">
      {photos.map((p, i) => {
        const url = signed.data?.[i]?.url;
        return url ? (
          <a key={p.id} href={url} target="_blank" rel="noopener" className="photostrip-item">
            <img src={url} alt={p.filename} loading="lazy" />
          </a>
        ) : (
          <span key={p.id} className="photostrip-item" aria-busy={signed.isLoading}>
            <span className="small muted">{signed.isError ? "Could not load" : p.filename}</span>
          </span>
        );
      })}
    </div>
  );
}

function EquipmentDetailDialog({ e, onClose }: { e: EquipmentRow; onClose: () => void }) {
  const photos = inSlot(e.attachments, "photos");
  const documents = inSlot(e.attachments, "documentation");
  const details = Object.entries(e.specifications ?? {});
  return (
    <Dialog
      title={e.equipment_type}
      sub={<span className="id">{e.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      {photos.length > 0 && <PhotoStrip photos={photos} />}
      <Dl rows={[
        ["Sponsor", e.sponsor_name],
        ["Make and model", makeModel(e) ?? "—"],
        ["Kept at", e.location ?? "—"],
        ["Total units", <span key="t" className="num">{e.total_units}</span>],
        ["On loan", <span key="l" className="num">{e.units_on_loan}</span>],
        ["Available", <span key="a" className="num">{e.units_available}</span>],
        ["Calibrated on", fmtDate(e.calibrated_on)],
        ["Calibration expires", fmtDate(e.calibration_expires_on)],
        ...(details.length
          ? [["Details", <Dl key="d" rows={details} />] as [string, React.ReactNode]]
          : []),
        ...(documents.length
          ? [["Documentation", <AttachmentList key="doc" items={documents} />] as [string, React.ReactNode]]
          : []),
      ]} />
    </Dialog>
  );
}

function LoanDetailDialog({ l, onClose }: { l: LoanRow; onClose: () => void }) {
  const m = statusMeta(loanStatus, l.status);
  return (
    <Dialog
      title={`Request ${l.reference_code}`}
      sub={`${l.equipment_type} · ${l.units} unit${l.units === 1 ? "" : "s"}`}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["Request reference", <span key="r" className="id">{l.reference_code}</span>],
        ["Equipment", l.equipment_type],
        ["Equipment reference", <span key="e" className="id">{l.equipment_ref}</span>],
        ["Requester", l.requester_name],
        ["Sponsor", l.sponsor_name],
        ["Requested units", <span key="u" className="num">{l.units}</span>],
        ["Needed by", fmtDate(l.needed_by)],
        ["Linked task", l.task_ref ?? "—"],
        ["Requester note", l.note ?? "—"],
        ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
        ["Decision reason", l.decision_reason ?? "—"],
      ]} />
    </Dialog>
  );
}

/** Whether a crowd resource can be reached by push: "App" with a phone
 *  connected, "No app" without one. Offers and reminders are never e-mailed
 *  to the crowd (db/550), so someone with no app hears of new work only when
 *  they next open it. Nothing for a person with no login yet, whose answer
 *  the server does not know (null), or for one who has left the roster. */
function AppReach({ w }: { w: WorkerRow }) {
  if (w.app_connected == null || w.status === "offboarded") return null;
  return (
    <span title="Offers and reminders reach crowd resources only through the app." style={{ marginLeft: 6 }}>
      <Pill tone={w.app_connected ? "success" : "attention"}>{w.app_connected ? "App" : "No app"}</Pill>
    </span>
  );
}

function WorkerDetailDialog({ w, onClose }: { w: WorkerRow; onClose: () => void }) {
  const m = statusMeta(workerStatus, w.status);
  const qc = useQueryClient();
  const toast = useToast();
  // Skills were settable only when the crowd resource was added, so anyone already on
  // a roster was stuck with whatever was typed the first time — and there is
  // no way back through offboarding, which is irreversible and blocks the same
  // email. This is the only edit path a roster row has.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Skill[]>(w.skills);
  const save = useMutation({
    mutationFn: () => patch(`/network/workers/${w.id}`, { skills: draft }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["workers"] });
      toast("Skills updated", undefined, "success");
      setEditing(false);
    },
    onError: (e) => toast("Could not save", e instanceof Error ? e.message : "", "critical"),
  });

  return (
    <Dialog
      title={w.display_name}
      sub={<span className="id">{w.reference_code}</span>}
      busy={save.isPending}
      onClose={onClose}
      foot={
        editing ? (
          <>
            <Button onClick={() => { setDraft(w.skills); setEditing(false); }} disabled={save.isPending}>Cancel</Button>
            <Button variant="primary" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save skills"}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setEditing(true)}>Edit skills</Button>
            <Button onClick={onClose}>Close</Button>
          </>
        )
      }
    >
      <Dl rows={[
        ["Email", w.email ?? "—"],
        ["Phone", w.phone ?? "—"],
        ["App access", (
          <span key="i">
            <Pill tone={statusMeta(invitationStatus, w.invitation_status).tone}>{statusMeta(invitationStatus, w.invitation_status).label}</Pill>
            <AppReach w={w} />
          </span>
        )],
        ["Open assignments", <span key="o" className="num">{w.open_assignments}</span>],
        ...(editing ? [] : [["Skills", labelsOf(SKILLS, w.skills)] as [string, React.ReactNode]]),
        ["Trained", w.trained ? "Yes" : "No"],
        ["Rating", w.rating_count ? `★ ${w.rating?.toFixed(1)} from ${w.rating_count} assignment${w.rating_count === 1 ? "" : "s"}` : "Not rated yet"],
        ["Status", <Pill key="s" tone={m.tone}>{m.label}</Pill>],
      ]} />
      {editing && (
        <div className="formgrid" style={{ marginTop: 12 }}>
          <CheckGroup
            label="Skills"
            options={SKILLS}
            value={draft}
            onChange={setDraft}
            hint="What they can be sent to do."
            columns={3}
          />
        </div>
      )}
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

// The singular of each tab. The button and the dialog title both read it,
// so they cannot drift apart -- the title used to interpolate the raw org
// kind and greeted you with "a new business" after you clicked "a business
// partner".
const KIND_ONE: Record<NetKind, string> = {
  aggregator: "an aggregator",
  business: "a business partner",
  sponsor: "a device sponsor",
};

export function NetworkPage() {
  const [tab, setTab] = useState<NetKind>("aggregator");
  const [requesting, setRequesting] = useState(false);
  const [editing, setEditing] = useState<OnboardingRow | null>(null);
  const [viewing, setViewing] = useState<Org | null>(null);
  const [removing, setRemoving] = useState<Org | null>(null);
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
    // no onError: ReasonDialog shows the failure inline and stays open for a retry
  });

  const openRequests = (pending.data ?? []).filter((r) =>
    ["submitted", "under_review", "changes_requested"].includes(r.status),
  );

  return (
    <View
      title="Network"
      sub={`Registered under you — ${COMPANY} does not bill these accounts. New entries need platform approval.`}
      actions={<Button variant="primary" onClick={() => setRequesting(true)}>Onboard {KIND_ONE[tab]}</Button>}
    >
      {openRequests.length > 0 && (
        <Panel title="Awaiting platform approval" sub={`The request goes to ${COMPANY} operations; you are notified of the decision.`}>
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Proposed</th><th>Kind</th><th>Status</th><th>Latest reason</th><th /></tr></thead>
              <tbody>
                {openRequests.map((r) => {
                  const m = statusMeta(onboardingStatus, r.status);
                  return (
                    <tr key={r.id}>
                      <td className="id">{r.reference_code}</td>
                      <td className="cell-primary">{r.proposed_name}</td>
                      <td>{titleCase(r.target_org_kind)}</td>
                      <td><Pill tone={m.tone}>{m.label}</Pill></td>
                      <td className="small muted" style={{ maxWidth: 340 }}>
                        {r.approvals?.at(-1)?.reason ?? "—"}
                      </td>
                      <td className="right"><div className="rowactions">
                        {r.status === "changes_requested" && (
                          <Button size="sm" variant="primary" onClick={() => setEditing(r)}>
                            Edit and resubmit
                          </Button>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      {/* no title: the active tab already names the table, and the prototype
          frames the tablist as the panel head rather than sitting under one. */}
      <Panel
        flush
        tabs={
          <div role="tablist" aria-label="Network type">
            {(Object.keys(KIND_LABEL) as NetKind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`tab_${k}`}
                aria-selected={tab === k}
                aria-controls="netpanel"
                onClick={() => setTab(k)}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        }
      >
        <div id="netpanel" role="tabpanel" aria-labelledby={`tab_${tab}`}>
        <Loadable q={orgs} what="your network">
          {(orgs.data ?? []).length === 0 ? (
            <Empty title={`No ${KIND_LABEL[tab].toLowerCase()} yet`} hint="Onboard one and the platform reviews it." />
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
                        <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                          <Button size="sm" onClick={() => setViewing(o)}>Details</Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setRemoving(o)}
                          >
                            Remove
                          </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Loadable>
        </div>
      </Panel>

      {requesting && <OnboardRequestDialog kind={tab} onClose={() => setRequesting(false)} />}
      {editing && <ResubmitDialog row={editing} onClose={() => setEditing(null)} />}
      {viewing && <OrgProfileDialog orgId={viewing.id} seedName={viewing.name} onClose={() => setViewing(null)} />}
      {removing && (
        <ReasonDialog
          title={`Remove ${removing.name} from your network`}
          warning="They lose access to your contracts immediately. The organisation and its history stay on record."
          confirmLabel="Remove"
          onConfirm={(reason) => suspend.mutateAsync({ id: removing.id, reason })}
          onClose={() => setRemoving(null)}
        />
      )}
    </View>
  );
}

// Shape only. A typo in the domain is still a valid address and no amount of
// checking here will catch it — that is what the invitation email proves.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A returned request is editable and can go round again — update_draft and
// submit_request both accept changes_requested. Until now the API allowed it
// and the console offered no way to do it, so a returned request was a dead end.
function ResubmitDialog({ row, onClose }: { row: OnboardingRow; onClose: () => void }) {
  const p = (row.payload ?? {}) as Record<string, unknown>;
  const [name, setName] = useState(row.proposed_name ?? "");
  const [contactName, setContactName] = useState(row.contact?.full_name ?? "");
  const [contactEmail, setContactEmail] = useState(row.contact?.email ?? "");
  const [extra1, setExtra1] = useState(String(p.crowd_size ?? p.specialty ?? p.contact_email ?? ""));
  const [extra2, setExtra2] = useState(String(p.region ?? p.capacity ?? ""));
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();
  const kind = row.target_org_kind as NetKind;
  const why = row.approvals?.at(-1)?.reason;

  const payload: Record<string, unknown> =
    kind === "aggregator"
      ? { crowd_size: Number(extra1) || 0, region: extra2 }
      : kind === "business"
        ? { specialty: extra1, capacity: extra2 }
        : { contact_email: contactEmail };

  const save = useMutation({
    mutationFn: async () => {
      await patch(`/onboarding/${row.id}`, {
        proposed_name: name,
        payload,
        contact: { full_name: contactName, email: contactEmail },
      });
      return post(`/onboarding/${row.id}/submit`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["onboarding-mine"] });
      toast("Resubmitted", `${COMPANY} operations will review it again.`, "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not resubmit"),
  });

  return (
    <Dialog
      title={`Resubmit ${row.proposed_name}`}
      sub={<span className="id">{row.reference_code}</span>}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!name.trim() || !contactName.trim() || !EMAIL.test(contactEmail.trim()) || save.isPending}
            onClick={() => save.mutate()}
          >
            Resubmit for approval
          </Button>
        </>
      }
    >
      {why && <Callout tone="attention" title={`${COMPANY} operations asked for changes`}>{why}</Callout>}
      <div className="formgrid">
        <Field label="Organisation name" required span>
          {(id) => <input id={id} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Contact name" required>
          {(id) => <input id={id} className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} />}
        </Field>
        <Field label="Contact email" required>
          {(id) => <input id={id} type="email" className={inputCls} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />}
        </Field>
        <Field label={kind === "aggregator" ? "Crowd size" : kind === "business" ? "Specialty" : "Contact email"}>
          {(id) => <input id={id} className={inputCls} value={extra1} onChange={(e) => setExtra1(e.target.value)} />}
        </Field>
        {kind !== "sponsor" && (
          <Field label={kind === "aggregator" ? "Region" : "Capacity"}>
            {(id) => <input id={id} className={inputCls} value={extra2} onChange={(e) => setExtra2(e.target.value)} />}
          </Field>
        )}
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
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
      toast("Sent for approval", `${COMPANY} operations will review it.`, "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <Dialog
      title={`Onboard ${KIND_ONE[kind]}`}
      sub="Unlike the prototype, nothing joins your network without platform approval — the request goes to Ops."
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || !contactName.trim() || !EMAIL.test(contactEmail.trim()) || submit.isPending} onClick={() => submit.mutate()}>
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
          {(id) => <input id={id} type="email" className={inputCls} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="ops@example.com" />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- equipment (supplier browse + sponsor inventory) --------------------------- */

type InventoryFilter = "all" | "on_loan" | "calibration_due";
const CALIBRATION_EXPIRING_DAYS = 30;

function equipmentSearchText(e: EquipmentRow): string {
  return [
    e.reference_code,
    e.equipment_type,
    e.sponsor_name,
    e.make,
    e.model,
    e.location,
    e.total_units,
    e.units_available,
    e.units_on_loan,
    e.calibrated_on,
    e.calibration_expires_on,
  ].join(" ").toLowerCase();
}

function isoDateDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function matchesInventoryFilter(e: EquipmentRow, filter: InventoryFilter, expiringBy: string): boolean {
  if (filter === "all") return true;
  if (filter === "on_loan") return e.units_on_loan > 0;
  // calibration_due: the only remaining filter that is not "all" or "on_loan"
  return e.calibration_expires_on !== null && e.calibration_expires_on <= expiringBy;
}

function calibrationMeta(e: EquipmentRow, today: string, expiringBy: string): { date: string; label?: string; tone?: Tone } {
  const date = fmtDate(e.calibration_expires_on ?? e.calibrated_on);
  if (e.calibration_expires_on === null) return { date };
  if (e.calibration_expires_on <= today) return { date, label: "Expired", tone: "critical" };
  if (e.calibration_expires_on <= expiringBy) return { date, label: "Expiring Soon", tone: "attention" };
  return { date };
}

export function EquipmentPage() {
  const session = useSession();
  const isSponsor = session.org_kind === "sponsor";
  const qc = useQueryClient();
  const toast = useToast();
  const [borrowing, setBorrowing] = useState<EquipmentRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [viewingEq, setViewingEq] = useState<EquipmentRow | null>(null);
  const [editingEq, setEditingEq] = useState<EquipmentRow | null>(null);
  const [viewingLoan, setViewingLoan] = useState<LoanRow | null>(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");

  const equipment = useQuery({ queryKey: ["equipment"], queryFn: () => get<EquipmentRow[]>("/network/equipment") });
  const loans = useQuery({ queryKey: ["loans"], queryFn: () => get<LoanRow[]>("/network/loans") });

  const myLoans = isSponsor ? [] : (loans.data ?? []);
  const equipmentRows = equipment.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const expiringBy = isoDateDaysFromNow(CALIBRATION_EXPIRING_DAYS);
  const inventoryNeedle = inventorySearch.trim().toLowerCase();
  const shownEquipment = isSponsor
    ? equipmentRows.filter((e) =>
      matchesInventoryFilter(e, inventoryFilter, expiringBy)
      && (!inventoryNeedle || equipmentSearchText(e).includes(inventoryNeedle)))
    : equipmentRows;
  const inventoryFiltered = inventoryNeedle || inventoryFilter !== "all";

  return (
    <View
      title={isSponsor ? "Inventory" : "Equipment"}
      sub={isSponsor
        ? "Your fleet. Calibration expiry blocks new loans automatically."
        : "Drawn from the device sponsors registered in your network, released on their approval."}
      actions={isSponsor && <Button variant="primary" onClick={() => setAdding(true)}>Add equipment</Button>}
    >
      <Panel title={isSponsor ? "Equipment types" : "Available from your network"}>
        <Loadable q={equipment} what="equipment">
          {equipmentRows.length === 0 ? (
            <Empty title="No equipment" hint={isSponsor ? "Add your first equipment type." : "No sponsors registered in your network yet."} />
          ) : (
            <>
              {isSponsor && (
                <div className="tablebar">
                  <input
                    className={inputCls}
                    type="search"
                    aria-label="Search inventory"
                    placeholder="Search inventory"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                  <select
                    className={selectCls}
                    aria-label="Filter inventory"
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value as InventoryFilter)}
                    style={{ maxWidth: 190 }}
                  >
                    <option value="all">All inventory</option>
                    <option value="on_loan">On Loan</option>
                    <option value="calibration_due">Calibration Due</option>
                  </select>
                  <span className="small muted" role="status">
                    {inventoryFiltered ? `${shownEquipment.length} of ${equipmentRows.length}` : ""}
                  </span>
                </div>
              )}
              {shownEquipment.length === 0 ? (
                <Empty title="Nothing matches that" hint="Clear the search or choose All inventory." />
              ) : (
                <TableWrap>
                  <table>
                    <thead>
                      {isSponsor ? (
                        <tr>
                          <th>Equipment</th><th>Make/Model</th><th>Location</th><th>Total</th>
                          <th>Available</th><th>On Loan</th><th>Calibration</th><th>Action</th>
                        </tr>
                      ) : (
                        <tr>
                          <th>Ref</th><th>Type</th><th>Sponsor</th><th>Units</th>
                          <th>On loan</th><th>Available</th><th>Calibrated</th><th />
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {shownEquipment.map((e) => {
                        const calibration = calibrationMeta(e, today, expiringBy);
                        return (
                          <tr key={e.id} className="tap" title="Open equipment details" onClick={() => setViewingEq(e)}>
                            {isSponsor ? (
                              <>
                                <td className="cell-primary" title="Open equipment details">
                                  <div className="devcell">
                                    <DeviceThumb url={e.photo_url} />
                                    <span>{e.equipment_type}</span>
                                  </div>
                                </td>
                                <td>{makeModel(e) ?? "—"}</td>
                                <td>{e.location ?? "—"}</td>
                                <td className="num">{e.total_units}</td>
                                <td className="num">{e.units_available}</td>
                                <td className="num">{e.units_on_loan}</td>
                                <td>
                                  <span className="num">{calibration.date}</span>
                                  {calibration.label && (
                                    <>
                                      {" "}
                                      <Pill tone={calibration.tone}>{calibration.label}</Pill>
                                    </>
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="id">{e.reference_code}</td>
                                <td className="cell-primary" title="Open equipment details">
                                  <div className="devcell">
                                    <DeviceThumb url={e.photo_url} />
                                    <span>
                                      {e.equipment_type}
                                      {makeModel(e) && <div className="cell-meta">{makeModel(e)}</div>}
                                    </span>
                                  </div>
                                </td>
                                <td>{e.sponsor_name}</td>
                                <td className="num">{e.total_units}</td>
                                <td className="num">{e.units_on_loan}</td>
                                <td className="num">{e.units_available}</td>
                                <td className="num">{fmtDate(e.calibrated_on)}</td>
                              </>
                            )}
                            <td className="right" onClick={(ev) => ev.stopPropagation()}><div className="rowactions">
                              <Button size="sm" onClick={() => setViewingEq(e)}>Details</Button>
                              {isSponsor && (
                                <Button size="sm" onClick={() => setEditingEq(e)}>Edit</Button>
                              )}
                              {!isSponsor && (
                                <Button size="sm" variant="primary" disabled={e.units_available < 1} onClick={() => setBorrowing(e)}>
                                  Request
                                </Button>
                              )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </>
          )}
        </Loadable>
      </Panel>

      {!isSponsor && (
        <Panel title="Your requests">
          <Loadable q={loans} what="your equipment requests">
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
                          <td className="right" onClick={(ev) => ev.stopPropagation()}><div className="rowactions">
                            <Button size="sm" onClick={() => setViewingLoan(l)}>Details</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Loadable>
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
      {editingEq && (
        <EditEquipmentDialog e={editingEq} onClose={() => {
          setEditingEq(null);
          // A file removed in the dialog is gone at once, saved or not.
          void qc.invalidateQueries({ queryKey: ["equipment"] });
        }} onDone={() => {
          setEditingEq(null);
          void qc.invalidateQueries({ queryKey: ["equipment"] });
          toast("Equipment updated", undefined, "success");
        }} />
      )}
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

/* What a sponsor may say about a device beyond its type and stock (db/520).
   The server holds the same bounds; these keep most refusals in the browser. */
const DETAIL_MAX = 200;
const MAX_DETAILS = 20;
const DETAIL_LABEL_MAX = 60;
const MAX_FILES_PER_FIELD = 10;
const DETAIL_SUGGESTIONS = [
  "Year", "Resolution", "Frame rate", "Battery life", "Power", "Connectivity", "Storage", "Weight", "Mount",
];

interface DetailRow { label: string; value: string }

function detailRows(specs: Record<string, string> | undefined): DetailRow[] {
  return Object.entries(specs ?? {}).map(([label, value]) => ({ label, value }));
}

/** The map the server stores: labels and values trimmed, a row with no value
 *  dropped. Every row is sent, so a label removed here is removed there. */
function detailMap(rows: DetailRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    const label = r.label.trim().replace(/\s+/g, " ");
    const value = r.value.trim().replace(/\s+/g, " ");
    if (value) out[label] = value;
  }
  return out;
}

/** Why the details cannot be saved as they stand, or null. */
function detailProblem(rows: DetailRow[]): string | null {
  const seen = new Set<string>();
  for (const r of rows) {
    const label = r.label.trim().replace(/\s+/g, " ");
    if (!r.value.trim()) continue;
    if (!label) return "Every detail needs a label.";
    const key = label.toLocaleLowerCase();
    if (seen.has(key)) return `${label} is listed twice.`;
    seen.add(key);
  }
  return null;
}

const sameDetails = (a: Record<string, string>, b: Record<string, string>) =>
  JSON.stringify(Object.entries(a)) === JSON.stringify(Object.entries(b));

function DetailsEditor({ rows, onChange }: { rows: DetailRow[]; onChange: (rows: DetailRow[]) => void }) {
  const problem = detailProblem(rows);
  const set = (i: number, part: Partial<DetailRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...part } : r)));
  return (
    // A group of label/value pairs has no single control to label: fieldset
    // and legend, the way CheckGroup does it.
    <fieldset className="field span" style={{ border: 0, padding: 0, margin: 0 }} data-invalid={problem ? "" : undefined}>
      <legend>Details</legend>
      <span className="hint" style={{ display: "block", marginBottom: 6 }}>
        Anything a borrower asks about: resolution, battery life, how it connects.
      </span>
      <div className="detailrows">
        {rows.map((r, i) => (
          <div key={i} className="detailrow">
            <input
              className={inputCls}
              aria-label={`Detail ${i + 1}, label`}
              list="equipment-detail-labels"
              maxLength={DETAIL_LABEL_MAX}
              placeholder="Label"
              value={r.label}
              onChange={(ev) => set(i, { label: ev.target.value })}
            />
            <input
              className={inputCls}
              aria-label={`Detail ${i + 1}, value`}
              maxLength={DETAIL_MAX}
              placeholder="Value"
              value={r.value}
              onChange={(ev) => set(i, { value: ev.target.value })}
            />
            <Button
              size="sm"
              aria-label={`Remove ${r.label.trim() || `detail ${i + 1}`}`}
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
            >
              Remove
            </Button>
          </div>
        ))}
        <datalist id="equipment-detail-labels">
          {DETAIL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
        <div>
          <Button
            size="sm"
            disabled={rows.length >= MAX_DETAILS}
            onClick={() => onChange([...rows, { label: "", value: "" }])}
          >
            Add a detail
          </Button>
        </div>
      </div>
      {problem && <span className="err" role="alert">{problem}</span>}
    </fieldset>
  );
}

/** The fields both dialogs share after type and units: which device, where,
 *  its details, and its files. */
function DeviceFields({
  make, setMake, model, setModel, location, setLocation, rows, setRows, photos, setPhotos, docs, setDocs,
}: {
  make: string; setMake: (v: string) => void;
  model: string; setModel: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  rows: DetailRow[]; setRows: (rows: DetailRow[]) => void;
  photos: AttachmentDraft[]; setPhotos: React.Dispatch<React.SetStateAction<AttachmentDraft[]>>;
  docs: AttachmentDraft[]; setDocs: React.Dispatch<React.SetStateAction<AttachmentDraft[]>>;
}) {
  return (
    <>
      <Field label="Make">
        {(id) => <input id={id} className={inputCls} maxLength={DETAIL_MAX} value={make} onChange={(ev) => setMake(ev.target.value)} placeholder="GoPro" />}
      </Field>
      <Field label="Model">
        {(id) => <input id={id} className={inputCls} maxLength={DETAIL_MAX} value={model} onChange={(ev) => setModel(ev.target.value)} placeholder="HERO12 Black" />}
      </Field>
      <Field label="Kept at" span hint="Where the units are stored or collected from.">
        {(id) => <input id={id} className={inputCls} maxLength={DETAIL_MAX} value={location} onChange={(ev) => setLocation(ev.target.value)} placeholder="Indiranagar depot, Bengaluru" />}
      </Field>
      <DetailsEditor rows={rows} onChange={setRows} />
      <AttachmentsField
        label="Photos"
        span
        hint="PNG, JPEG or WebP. Borrowers see these when they open the device."
        items={photos}
        onChange={setPhotos}
        max={MAX_FILES_PER_FIELD}
        accept={PHOTO_ACCEPT}
        pickLabel="Add photos"
      />
      <AttachmentsField
        label="Documentation"
        span
        hint="Manuals, calibration certificates, spec sheets."
        items={docs}
        onChange={setDocs}
        max={MAX_FILES_PER_FIELD}
        accept={DOCUMENT_ACCEPT}
        pickLabel="Add documents"
      />
    </>
  );
}

const busy = (...lists: AttachmentDraft[][]) => lists.some((l) => l.some((a) => a.status === "uploading"));

const newFiles = (photos: AttachmentDraft[], docs: AttachmentDraft[]) => [
  ...attachmentPayload(photos, "photos"),
  ...attachmentPayload(docs, "documentation"),
];

function AddEquipmentDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState("");
  const [units, setUnits] = useState("");
  // Blank, never pre-filled: a device that has not been calibrated has no
  // dates, and an invented expiry would decide whether it may be lent.
  const [calibrated, setCalibrated] = useState("");
  const [expires, setExpires] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");
  const [rows, setRows] = useState<DetailRow[]>([]);
  const [photos, setPhotos] = useState<AttachmentDraft[]>([]);
  const [docs, setDocs] = useState<AttachmentDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    // One save: the device, its details and its files together. A file the
    // server will not take refuses the whole save, so a device never exists
    // with half its photos.
    mutationFn: () =>
      post("/network/equipment", {
        equipment_type: type.trim(), total_units: Number(units),
        calibrated_on: calibrated || null, calibration_expires_on: expires || null,
        make: make.trim() || null, model: model.trim() || null, location: location.trim() || null,
        specifications: detailMap(rows),
        attachments: newFiles(photos, docs),
      }),
    onSuccess: onDone,
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add"),
  });

  const uploading = busy(photos, docs);
  const ready = type.trim().length >= 2 && Number(units) >= 1 && !detailProblem(rows) && !uploading;

  return (
    <Dialog
      title="Add equipment"
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!ready || submit.isPending} onClick={() => submit.mutate()}>
            {uploading ? "Uploading…" : "Add to inventory"}
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
        <span aria-hidden="true" />
        <Field label="Calibrated on" hint="Leave blank if it is not calibrated.">
          {(id) => <input id={id} className={inputCls} type="date" value={calibrated} onChange={(e) => setCalibrated(e.target.value)} />}
        </Field>
        <Field label="Calibration expires" hint="Expired calibration blocks new loans automatically.">
          {(id) => <input id={id} className={inputCls} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />}
        </Field>
        <DeviceFields
          make={make} setMake={setMake} model={model} setModel={setModel}
          location={location} setLocation={setLocation} rows={rows} setRows={setRows}
          photos={photos} setPhotos={setPhotos} docs={docs} setDocs={setDocs}
        />
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

function EditEquipmentDialog({ e, onClose, onDone }: { e: EquipmentRow; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState(e.equipment_type);
  const [units, setUnits] = useState(String(e.total_units));
  const [calibrated, setCalibrated] = useState(e.calibrated_on ?? "");
  const [expires, setExpires] = useState(e.calibration_expires_on ?? "");
  const [make, setMake] = useState(e.make ?? "");
  const [model, setModel] = useState(e.model ?? "");
  const [location, setLocation] = useState(e.location ?? "");
  const [rows, setRows] = useState<DetailRow[]>(() => detailRows(e.specifications));
  // The files already on the device, newest version of each; removing one
  // deletes it at once (AttachmentsField), so the save only carries new ones.
  const [photos, setPhotos] = useState<AttachmentDraft[]>(() => fromServer(inSlot(e.attachments, "photos")));
  const [docs, setDocs] = useState<AttachmentDraft[]>(() => fromServer(inSlot(e.attachments, "documentation")));
  const [error, setError] = useState<string | null>(null);

  // Only what differs from the row is sent: an untouched field is left alone
  // and a cleared date or detail goes as null. The server applies exactly the
  // fields present, so nothing to send means nothing to save.
  const changes: Record<string, unknown> = {};
  if (type.trim() !== e.equipment_type) changes.equipment_type = type.trim();
  if (Number(units) !== e.total_units) changes.total_units = Number(units);
  if ((calibrated || null) !== e.calibrated_on) changes.calibrated_on = calibrated || null;
  if ((expires || null) !== e.calibration_expires_on) changes.calibration_expires_on = expires || null;
  if ((make.trim() || null) !== (e.make ?? null)) changes.make = make.trim() || null;
  if ((model.trim() || null) !== (e.model ?? null)) changes.model = model.trim() || null;
  if ((location.trim() || null) !== (e.location ?? null)) changes.location = location.trim() || null;
  const details = detailMap(rows);
  if (!sameDetails(details, e.specifications ?? {})) changes.specifications = details;
  const files = newFiles(photos, docs);
  if (files.length) changes.attachments = files;
  const dirty = Object.keys(changes).length > 0;
  const uploading = busy(photos, docs);
  const valid = type.trim().length >= 2 && Number(units) >= 1 && !detailProblem(rows) && !uploading;

  const submit = useMutation({
    mutationFn: () => patch(`/network/equipment/${e.id}`, changes),
    onSuccess: onDone,
    // The refusals worth reading arrive here — "10 units are out on loan" —
    // so they stay in the dialog, beside the field that caused them.
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save"),
  });

  return (
    <Dialog
      title={`Edit ${e.equipment_type}`}
      sub={<span className="id">{e.reference_code}</span>}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>{dirty ? "Cancel" : "Close"}</Button>
          <Button variant="primary" disabled={!dirty || !valid || submit.isPending} onClick={() => submit.mutate()}>
            {uploading ? "Uploading…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Equipment type" required span>
          {(id) => <input id={id} className={inputCls} value={type} onChange={(ev) => setType(ev.target.value)} />}
        </Field>
        <Field
          label="Units"
          required
          hint={e.units_on_loan > 0 ? `${e.units_on_loan} out on loan — the total cannot go below that.` : undefined}
        >
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={units} onChange={(ev) => setUnits(ev.target.value)} />}
        </Field>
        <span aria-hidden="true" />
        <Field label="Calibrated on">
          {(id) => <input id={id} className={inputCls} type="date" value={calibrated} onChange={(ev) => setCalibrated(ev.target.value)} />}
        </Field>
        <Field label="Calibration expires" hint="Expired calibration blocks new loans automatically.">
          {(id) => <input id={id} className={inputCls} type="date" value={expires} onChange={(ev) => setExpires(ev.target.value)} />}
        </Field>
        <DeviceFields
          make={make} setMake={setMake} model={model} setModel={setModel}
          location={location} setLocation={setLocation} rows={rows} setRows={setRows}
          photos={photos} setPhotos={setPhotos} docs={docs} setDocs={setDocs}
        />
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- sponsor: loan queue -------------------------------------------------------- */

const REQUEST_STATUS_ORDER = ["pending", "approved", "issued", "overdue", "returned", "rejected"];

function requestSearchText(l: LoanRow): string {
  return [
    l.reference_code,
    l.equipment_type,
    l.equipment_ref,
    l.requester_name,
    l.sponsor_name,
    l.status,
    l.units,
    l.needed_by,
    l.note,
    l.decision_reason,
    l.task_ref,
  ].join(" ").toLowerCase();
}

export function LoanQueuePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [viewing, setViewing] = useState<LoanRow | null>(null);
  const [rejecting, setRejecting] = useState<LoanRow | null>(null);
  const [requestFilter, setRequestFilter] = useState("all");
  const [requestSearch, setRequestSearch] = useState("");
  const loans = useQuery({ queryKey: ["loans"], queryFn: () => get<LoanRow[]>("/network/loans") });

  const decide = useMutation({
    mutationFn: (vars: { id: string; decision: string; reason?: string }) =>
      post(`/network/loans/${vars.id}/decide`, { decision: vars.decision, reason: vars.reason ?? null }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Decision recorded", "The requester has been notified.", "success");
    },
  });
  // For the buttons that act immediately. Reject goes through ReasonDialog,
  // which reports its own failures, so this is not on the mutation itself —
  // there it would report a failed rejection twice.
  const toastRefusal = (e: unknown) => toast("Refused", e instanceof Error ? e.message : "", "critical");

  const rows = loans.data ?? [];
  const pending = rows.filter((l) => l.status === "pending");
  const statuses = Array.from(new Set(rows.map((l) => l.status))).sort((a, b) => {
    const ai = REQUEST_STATUS_ORDER.indexOf(a);
    const bi = REQUEST_STATUS_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const requestNeedle = requestSearch.trim().toLowerCase();
  const shownRows = rows.filter((l) =>
    (requestFilter === "all" || l.status === requestFilter)
    && (!requestNeedle || requestSearchText(l).includes(requestNeedle)));
  const requestsFiltered = requestFilter !== "all" || Boolean(requestNeedle);

  return (
    <View title="Requests" sub="Approving reserves the units; a rejection needs a reason the requester can act on.">
      <div className="g3">
        <Metric label="Awaiting decision" value={pending.length} loading={loans.isLoading} />
        <Metric label="Units requested" value={pending.reduce((s, l) => s + l.units, 0)} loading={loans.isLoading} />
        <Metric label="All-time requests" value={rows.length} loading={loans.isLoading} />
      </div>
      <Panel>
        <Loadable q={loans} what="loan requests">
          {rows.length === 0 ? (
            <Empty title="No requests yet" hint="Suppliers in your tenant's network can request loans." />
          ) : (
            <>
              <div className="tablebar">
                <input
                  className={inputCls}
                  type="search"
                  aria-label="Search requests"
                  placeholder="Search requests"
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                />
                <select
                  className={selectCls}
                  aria-label="Filter requests"
                  value={requestFilter}
                  onChange={(e) => setRequestFilter(e.target.value)}
                  style={{ maxWidth: 190 }}
                >
                  <option value="all">All requests</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{statusMeta(loanStatus, status).label}</option>
                  ))}
                </select>
                <span className="small muted" role="status">
                  {requestsFiltered ? `${shownRows.length} of ${rows.length}` : ""}
                </span>
              </div>
              {shownRows.length === 0 ? (
                <Empty title="No requests match" hint="Clear the search or choose All requests." />
              ) : (
                <TableWrap>
                  <table>
                    <thead><tr><th>Ref</th><th>Equipment</th><th>Requester</th><th>Units</th><th>Needed by</th><th>Note</th><th>Status</th><th /></tr></thead>
                    <tbody>
                      {shownRows.map((l) => {
                        const m = statusMeta(loanStatus, l.status);
                        return (
                          <tr key={l.id} className="tap" title="Open request details" onClick={() => setViewing(l)}>
                            <td className="id">{l.reference_code}</td>
                            <td className="cell-primary" title="Open request details">{l.equipment_type}</td>
                            <td>{l.requester_name}</td>
                            <td className="num">{l.units}</td>
                            <td className="num">{fmtDate(l.needed_by)}</td>
                            <td className="small" style={{ maxWidth: 220 }}>{l.note ?? "—"}</td>
                            <td><Pill tone={m.tone}>{m.label}</Pill></td>
                            <td className="right" onClick={(ev) => ev.stopPropagation()}><div className="rowactions">
                              <Button size="sm" onClick={() => setViewing(l)}>Details</Button>
                              {l.status === "pending" && (
                                <>
                                  <Button size="sm" variant="success" onClick={() => decide.mutate({ id: l.id, decision: "approved" }, { onError: toastRefusal })}>Approve</Button>
                                  <Button size="sm" variant="danger" onClick={() => setRejecting(l)}>Reject</Button>
                                </>
                              )}
                              {["approved", "issued", "overdue"].includes(l.status) && (
                                <Button size="sm" onClick={() => decide.mutate({ id: l.id, decision: "returned" }, { onError: toastRefusal })}>Mark returned</Button>
                              )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </>
          )}
        </Loadable>
      </Panel>
      {viewing && <LoanDetailDialog l={viewing} onClose={() => setViewing(null)} />}
      {rejecting && (
        <ReasonDialog
          title="Reject this equipment request"
          warning="The requester is told it was rejected and sees your reason, so say what would change the answer."
          confirmLabel="Reject"
          onConfirm={(reason) => decide.mutateAsync({ id: rejecting.id, decision: "rejected", reason })}
          onClose={() => setRejecting(null)}
        />
      )}
    </View>
  );
}

/* --- aggregator: roster ---------------------------------------------------------- */

export function RosterPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [viewing, setViewing] = useState<WorkerRow | null>(null);
  const [offboarding, setOffboarding] = useState<WorkerRow | null>(null);
  const workers = useQuery({ queryKey: ["workers"], queryFn: () => get<WorkerRow[]>("/network/workers") });

  const setStatus = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      post(`/network/workers/${vars.id}/status`, { status: vars.status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["workers"] });
      setOffboarding(null);
    },
    // There was no onError at all, so a refused change — this one or the
    // harmless shift toggle beside it — failed in silence and the row simply
    // re-rendered unchanged.
    onError: (e) => toast("Could not update the crowd resource", e instanceof Error ? e.message : "", "critical"),
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
      sub="Invite a crowd resource by email; they set a password and sign in to the capture app. Task units can be assigned to anyone who has signed up."
      actions={
        <>
          <Button onClick={() => setImporting(true)}>Import crowd</Button>
          <Button variant="primary" onClick={() => setAdding(true)}>Add crowd resource</Button>
        </>
      }
    >
      <div className="g4">
        <Metric label="Roster" value={rows.length} loading={workers.isLoading} />
        <Metric label="On shift" value={onShift} loading={workers.isLoading} />
        <Metric label="Signed up" value={signedUp} loading={workers.isLoading} />
        <Metric label="Invited, not yet signed up" value={invited} loading={workers.isLoading} />
      </div>
      <Panel>
        <Loadable q={workers} what="the roster">
          {rows.length === 0 ? (
            <Empty title="Nobody on the roster" hint="Add a crowd resource with their email to invite them to the app." />
          ) : (
            <TableWrap>
              <table>
                <thead><tr><th>Ref</th><th>Name</th><th>Email</th><th>Skills</th><th>Rating</th><th>App access</th><th>Status</th><th /></tr></thead>
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
                        <td>{labelsOf(SKILLS, w.skills)}</td>
                        <td className="num">{stars(w.rating, w.rating_count)}</td>
                        <td><Pill tone={inv.tone}>{inv.label}</Pill><AppReach w={w} /></td>
                        <td><Pill tone={m.tone}>{m.label}</Pill></td>
                        <td className="right" onClick={(ev) => ev.stopPropagation()}><div className="rowactions">
                          <Button size="sm" onClick={() => setViewing(w)}>Details</Button>
                          {canResend && (
                            <Button size="sm" disabled={resend.isPending} onClick={() => resend.mutate(w.id)}>Resend invite</Button>
                          )}
                          {w.status !== "offboarded" && (
                            <>
                              <Button size="sm" onClick={() => setStatus.mutate({ id: w.id, status: w.status === "on_shift" ? "on_break" : "on_shift" })}>
                                {w.status === "on_shift" ? "Break" : "On shift"}
                              </Button>
                              {/* Ask first. This one revokes their grant and there
                                  is no way back — no reinstate route, the same
                                  email cannot be re-invited, and setting them
                                  "On shift" again restores the roster status but
                                  not the grant. The shift toggle beside it stays
                                  a single click: it is pressed all day. */}
                              <Button size="sm" variant="danger" onClick={() => setOffboarding(w)}>
                                Offboard
                              </Button>
                            </>
                          )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Loadable>
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
      {importing && <ImportCrowdDialog onClose={() => setImporting(false)} />}
      {viewing && <WorkerDetailDialog w={viewing} onClose={() => setViewing(null)} />}
      {offboarding && (
        <Dialog
          title={`Offboard ${offboarding.display_name}?`}
          sub={offboarding.reference_code}
          busy={setStatus.isPending}
          onClose={() => setOffboarding(null)}
          foot={
            <>
              <Button onClick={() => setOffboarding(null)} disabled={setStatus.isPending}>Cancel</Button>
              <Button
                variant="danger"
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate({ id: offboarding.id, status: "offboarded" })}
              >
                {setStatus.isPending ? "Offboarding…" : "Offboard"}
              </Button>
            </>
          }
        >
          <Callout tone="critical" title="This cannot be undone">
            {offboarding.display_name} loses access to the capture app at their next sign-in, and you
            cannot add them back — the same email address cannot be invited twice.
            {offboarding.open_assignments > 0 && (
              <>
                {" "}Their {offboarding.open_assignments} open assignment
                {offboarding.open_assignments === 1 ? "" : "s"} stay assigned to them, and nobody else can
                pick {offboarding.open_assignments === 1 ? "it" : "them"} up.
              </>
            )}
            {" "}Work they have already submitted is kept.
          </Callout>
        </Dialog>
      )}
    </View>
  );
}

function AddWorkerDialog({ onClose, onDone }: { onClose: () => void; onDone: (invited: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [trained, setTrained] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = useMutation({
    mutationFn: () =>
      post("/network/workers", {
        display_name: name, email: email.trim() || null, phone: phone.trim() || null,
        skills, trained,
      }),
    onSuccess: () => onDone(!!email.trim()),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add the crowd resource"),
  });
  return (
    <Dialog
      title="Add a crowd resource"
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
        {/* CheckGroup is its own fieldset.field.span, not a Field — a group of
            boxes has no single control for a label to point at — so it spans
            the grid and needs no wrapper. */}
        <CheckGroup
          label="Skills"
          options={SKILLS}
          value={skills}
          onChange={setSkills}
          hint="What they can be sent to do. Leave all unticked if you do not know yet."
          columns={3}
        />
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
            ["Rating", stars(o.rating, o.rating_count)],
            ["Status", titleCase(o.status)],
          ]} />
        )}
      </Panel>
    </View>
  );
}
