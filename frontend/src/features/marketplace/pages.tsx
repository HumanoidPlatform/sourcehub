// marketplace — the five-step request builder, requests, opportunities,
// proposal comparison and the award.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, patch, post, putFile } from "@api/client";
import type { ClientProfile, Org, Proposal, Rfp, SamplePresign } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, FileField, inputCls, Panel, Pill, RowMenu,
  StageRail, TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, money, titleCase } from "@shared/format";
import { OrgProfileDialog } from "@shared/org-profile";
import {
  LIFECYCLE, proposalStatus, requestStatus, statusMeta, waitingOn,
} from "@shared/status";

const CATEGORIES = [
  ["image", "Image"],
  ["video", "Video"],
  ["structured_data", "Structured data"],
  ["unstructured_data", "Unstructured data"],
  ["people_deliverable", "People-based deliverable"],
] as const;

/* --- client: requests list -------------------------------------------------- */

export function RequestsPage() {
  const [q, setQ] = useState("");
  const requests = useQuery({ queryKey: ["requests"], queryFn: () => get<Rfp[]>("/requests") });
  const rows = (requests.data ?? []).filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.reference_code.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <View
      title="Requests"
      sub="Everything you have drafted, published or seen through to completion."
      actions={<Link to="/requests/new" className="btn" data-variant="primary">New request</Link>}
    >
      <input
        className={inputCls}
        placeholder="Filter by title or reference…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 360 }}
        aria-label="Filter requests"
      />
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No requests yet" hint="Publish one and every delivery partner is notified." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Reference</th><th>Title</th><th>Category</th><th>Budget</th>
                  <th>Status</th><th>Waiting on</th><th>Proposals</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const meta = statusMeta(requestStatus, r.status);
                  return (
                    <tr key={r.id}>
                      <td className="id">{r.reference_code}</td>
                      <td className="cell-primary">{r.title}</td>
                      <td>{titleCase(r.category)}</td>
                      <td className="num" style={{ whiteSpace: "nowrap" }}>{money(r.budget_min)} – {money(r.budget_max)}</td>
                      <td><Pill tone={meta.tone}>{meta.label}</Pill></td>
                      <td>{waitingOn(meta, "client")}</td>
                      <td className="num">{r.proposal_count}</td>
                      <td className="right"><div className="rowactions">
                        {r.status === "draft" && (
                          <Link className="btn" data-size="sm" to={`/requests/${r.id}/edit`}>Edit</Link>
                        )}
                        <Link className="btn" data-size="sm" to={`/requests/${r.id}`}>Open</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </View>
  );
}

/* --- client: the five-step builder ------------------------------------------ */

const STEPS = ["Basics", "Specification", "People", "Commercials", "Review"] as const;

interface Draft {
  title: string; category: string; geography: string; compliance_notes: string;
  spec_format: string; spec_quantity: string; spec_quality: string; acceptance: string;
  people_headcount: string; people_training: string; people_experience: string; people_certification: string;
  budget_min: string; budget_max: string; starts_on: string; delivery_due_on: string;
}

const BLANK: Draft = {
  title: "", category: "image", geography: "", compliance_notes: "",
  spec_format: "", spec_quantity: "", spec_quality: "", acceptance: "",
  people_headcount: "", people_training: "", people_experience: "", people_certification: "",
  budget_min: "", budget_max: "", starts_on: "", delivery_due_on: "",
};

// Mirrors the server's rules (marketplace service) so most violations are
// caught before a byte moves. The server re-checks everything.
const MAX_SAMPLE_BYTES = 25 * 1024 * 1024;
const MAX_SAMPLES = 5;
const SAMPLE_ACCEPT =
  ".csv,.tsv,.json,.jsonl,.xml,.txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.mp3,.wav,.zip,.xlsx,.docx,.parquet";

interface SampleDraft {
  key: string; // storage_key once presigned; empty for files already attached
  /** already on the request — shown in the editor, never re-sent on save */
  existing?: boolean;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  status: "uploading" | "done" | "error";
}

// Doubles as the draft editor: with an :id in the path it loads that draft and
// PATCHes instead of POSTing. Same fields, same validation — a second form for
// editing would be the same form, drifting.
export function RequestNewPage() {
  const { id } = useParams();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(BLANK);
  const [samples, setSamples] = useState<SampleDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const existing = useQuery({
    queryKey: ["request", id],
    queryFn: () => get<Rfp>(`/requests/${id}`),
    enabled: !!id,
  });

  // populate once, so typing is never overwritten by a refetch
  if (id && existing.data && !loaded) {
    const r = existing.data;
    setD({
      title: r.title ?? "", category: r.category ?? "image",
      geography: r.geography ?? "", compliance_notes: r.compliance_notes ?? "",
      spec_format: r.spec?.format ?? "", spec_quantity: r.spec?.quantity ?? "",
      spec_quality: r.spec?.quality ?? "", acceptance: r.acceptance ?? "",
      people_headcount: String(r.people?.headcount ?? ""),
      people_training: r.people?.training ?? "",
      people_experience: r.people?.experience ?? "",
      people_certification: r.people?.certification ?? "",
      budget_min: r.budget_min ?? "", budget_max: r.budget_max ?? "",
      starts_on: r.starts_on ?? "", delivery_due_on: r.delivery_due_on ?? "",
    });
    // files already attached, so the editor shows what the draft actually has
    setSamples(
      (r.samples ?? []).map((x) => ({
        key: "", filename: x.filename,
        content_type: x.content_type, size_bytes: x.size_bytes,
        status: "done" as const, existing: true,
      })),
    );
    setLoaded(true);
  }

  const set = (k: keyof Draft) => (e: { target: { value: string } }) =>
    setD((x) => ({ ...x, [k]: e.target.value }));

  const pickSamples = (files: FileList) => {
    setError(null);
    const room = MAX_SAMPLES - samples.length;
    const picked = Array.from(files);
    if (picked.length > room) {
      setError(`At most ${MAX_SAMPLES} sample files per request.`);
      return;
    }
    for (const file of picked) {
      if (file.size > MAX_SAMPLE_BYTES) {
        setError(`${file.name} is over the 25 MB cap.`);
        continue;
      }
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!SAMPLE_ACCEPT.split(",").includes(ext)) {
        setError(`Files of type ${ext} are not accepted.`);
        continue;
      }
      const draft: SampleDraft = {
        key: "", filename: file.name, content_type: file.type || null,
        size_bytes: file.size, status: "uploading",
      };
      setSamples((xs) => [...xs, draft]);
      void (async () => {
        try {
          const p = await post<SamplePresign>("/requests/samples/presign", {
            filename: file.name, content_type: file.type || null, size_bytes: file.size,
          });
          await putFile(p.url, file);
          setSamples((xs) =>
            xs.map((s) => (s === draft ? { ...s, key: p.storage_key, filename: p.filename, status: "done" } : s)),
          );
        } catch (err) {
          setSamples((xs) => xs.map((s) => (s === draft ? { ...s, status: "error" } : s)));
          setError(err instanceof Error ? err.message : `Could not upload ${file.name}`);
        }
      })();
    }
  };

  const doneSamples = samples.filter((s) => s.status === "done");
  const newSamples = doneSamples.filter((s) => !s.existing);

  const save = useMutation({
    mutationFn: (publish: boolean) =>
      (id ? patch<Rfp> : post<Rfp>)(id ? `/requests/${id}` : "/requests", {
        ...d,
        people_headcount: Number(d.people_headcount) || 0,
        budget_min: d.budget_min || null,
        budget_max: d.budget_max || null,
        starts_on: d.starts_on || null,
        delivery_due_on: d.delivery_due_on || null,
        publish,
        samples: newSamples.map((s) => ({
          storage_key: s.key, filename: s.filename,
          content_type: s.content_type, size_bytes: s.size_bytes,
        })),
      }),
    onSuccess: (r, publish) => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
      toast(
        publish ? "Request published" : id ? "Draft updated" : "Draft saved",
        publish ? "Every delivery partner has been notified." : `${r.reference_code} is waiting in your requests.`,
        "success",
      );
      navigate(`/requests/${r.id}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  // Every problem on this step, not the first one found: fixing one field and
  // being told about the next is a worse form than being told both at once.
  const validateStep = (): string[] => {
    const problems: string[] = [];
    if (step === 0 && !d.title.trim()) problems.push("Give the request a title.");
    if (step === 0 && !d.category.trim()) problems.push("Choose a category.");
    if (step === 1 && !d.spec_quantity.trim())
      problems.push("Say how much you need — partners cannot price a blank quantity.");
    if ((step === 1 || step === 4) && samples.some((s) => s.status === "uploading"))
      problems.push("Wait for sample uploads to finish.");
    if (step === 3) {
      if (d.budget_min && d.budget_max && Number(d.budget_max) < Number(d.budget_min))
        problems.push("Budget maximum must be at least the minimum.");
      if (d.starts_on && d.delivery_due_on && d.delivery_due_on < d.starts_on)
        problems.push("Delivery must be on or after the start.");
    }
    return problems;
  };

  const next = () => {
    const problems = validateStep();
    if (problems.length) return setError(problems.join(" "));
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <View title="New request" sub="Five steps, and the defaults are honest — anything you skip is marked 'to be agreed', never hidden.">
      <div className="chip" aria-hidden="true">Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
      <Panel>
        {step === 0 && (
          <div className="formgrid">
            <Field label="Request title" required span>
              {(id) => <input id={id} className={inputCls} value={d.title} onChange={set("title")} placeholder="Retail shelf imagery across 12 metro markets" />}
            </Field>
            <Field label="Category" required>
              {(id) => (
                <select id={id} className={inputCls} value={d.category} onChange={set("category")}>
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Geography">
              {(id) => <input id={id} className={inputCls} value={d.geography} onChange={set("geography")} placeholder="United States — 12 metro areas" />}
            </Field>
            <Field label="Compliance notes" span>
              {(id) => <textarea id={id} className={textareaCls} rows={3} value={d.compliance_notes} onChange={set("compliance_notes")} placeholder="No shoppers or faces in frame." />}
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="formgrid">
            <Field label="Deliverable format">
              {(id) => <input id={id} className={inputCls} value={d.spec_format} onChange={set("spec_format")} placeholder="JPEG, minimum 12MP" />}
            </Field>
            <Field label="Quantity" required>
              {(id) => <input id={id} className={inputCls} value={d.spec_quantity} onChange={set("spec_quantity")} placeholder="25,000 images" />}
            </Field>
            <Field label="Resolution, duration and quality bar" span>
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.spec_quality} onChange={set("spec_quality")} />}
            </Field>
            <Field label="Acceptance criteria" span hint="Frozen into the contract at award — disputes are arbitrated against this.">
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.acceptance} onChange={set("acceptance")} placeholder="95% or better pass on the automated blur check; 5% manual audit sample" />}
            </Field>
            <Field label="Sample data (optional)" span hint={`Reference material, not the deliverable — a spec sheet, a style guide, examples of what good looks like. Up to ${MAX_SAMPLES} files, 25 MB each.`}>
              {() => (
                <FileField
                  label="Attach sample files"
                  accept={SAMPLE_ACCEPT}
                  disabled={samples.length >= MAX_SAMPLES}
                  files={samples.map((s) => ({ name: s.filename, size: s.size_bytes, status: s.status }))}
                  onPick={pickSamples}
                  onRemove={(i) => setSamples((xs) => xs.filter((_, j) => j !== i))}
                />
              )}
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="formgrid">
            <Field label="Headcount required">
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.people_headcount} onChange={set("people_headcount")} />}
            </Field>
            <Field label="Certification required">
              {(id) => <input id={id} className={inputCls} value={d.people_certification} onChange={set("people_certification")} />}
            </Field>
            <Field label="Training required" span>
              {(id) => <input id={id} className={inputCls} value={d.people_training} onChange={set("people_training")} />}
            </Field>
            <Field label="Experience required" span>
              {(id) => <input id={id} className={inputCls} value={d.people_experience} onChange={set("people_experience")} />}
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="formgrid">
            <Field label="Budget minimum (USD)">
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_min} onChange={set("budget_min")} />}
            </Field>
            <Field label="Budget maximum (USD)">
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_max} onChange={set("budget_max")} />}
            </Field>
            <Field label="Project start">
              {(id) => <input id={id} className={inputCls} type="date" value={d.starts_on} onChange={set("starts_on")} />}
            </Field>
            <Field label="Delivery deadline">
              {(id) => <input id={id} className={inputCls} type="date" value={d.delivery_due_on} onChange={set("delivery_due_on")} />}
            </Field>
          </div>
        )}
        {step === 4 && (
          <Dl rows={[
            ["Title", d.title || "—"],
            ["Category", titleCase(d.category)],
            ["Quantity", d.spec_quantity || "To be agreed"],
            ["Headcount", d.people_headcount || "0"],
            ["Budget", `${money(d.budget_min || null)} – ${money(d.budget_max || null)}`],
            ["Timeline", `${fmtDate(d.starts_on || null)} → ${fmtDate(d.delivery_due_on || null)}`],
            ["Acceptance", d.acceptance || "Client review on delivery"],
            ["Compliance", d.compliance_notes || "None specified"],
            ["Sample files", doneSamples.length ? doneSamples.map((s) => s.filename).join(", ") : "None"],
          ]} />
        )}
        {error && <Callout tone="critical" title={error} />}
      </Panel>
      <div className="btnrow">
        {step > 0 && <Button onClick={() => { setError(null); setStep((s) => s - 1); }}>Back</Button>}
        {step < STEPS.length - 1 && <Button variant="primary" onClick={next}>Continue</Button>}
        {step === STEPS.length - 1 && (
          <>
            <Button onClick={() => save.mutate(false)} disabled={save.isPending || samples.some((s) => s.status === "uploading")}>Save as draft</Button>
            <Button variant="primary" onClick={() => save.mutate(true)} disabled={save.isPending || samples.some((s) => s.status === "uploading")}>
              Publish to partners
            </Button>
          </>
        )}
      </div>
    </View>
  );
}

/* --- request detail: brief + proposal comparison + award --------------------- */

export function RequestDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [awarding, setAwarding] = useState<Proposal | null>(null);
  const [viewing, setViewing] = useState<Proposal | null>(null);
  const [proposing, setProposing] = useState(false);

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => get<Rfp>(`/requests/${id}`),
    enabled: !!id,
  });

  const publish = useMutation({
    mutationFn: () => post<Rfp>(`/requests/${id}/publish`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["request", id] });
      toast("Published", "Every delivery partner has been notified.", "success");
    },
  });

  const award = useMutation({
    mutationFn: (proposalId: string) => post<{ id: string; reference_code: string }>(`/proposals/${proposalId}/award`),
    onSuccess: (c) => {
      toast("Contract awarded", `${c.reference_code} is open.`, "success");
      setAwarding(null);
      navigate(`/deliveries/${c.id}`);
    },
    onError: (e) => toast("Could not award", e instanceof Error ? e.message : "", "critical"),
  });

  const r = request.data;
  if (!r) return <View title="Request">{request.isError ? <Callout tone="critical" title="Not found or not yours to see" /> : <p className="muted">Loading…</p>}</View>;

  const meta = statusMeta(requestStatus, r.status);
  const isClient = session.org_kind === "client";
  const proposals = r.proposals ?? [];
  const lowest = proposals.length ? Math.min(...proposals.map((p) => Number(p.price))) : null;
  const fastest = proposals.length ? Math.min(...proposals.map((p) => p.duration_days)) : null;
  const canAward = isClient && ["published", "proposals_received"].includes(r.status);
  const alreadyMine = proposals.some((p) => p.partner_org_id === session.org_id);

  return (
    <View
      title={r.title}
      sub={<span className="id">{r.reference_code} · {titleCase(r.category)}</span>}
      actions={
        <>
          {isClient && r.status === "draft" && (
            <Button variant="primary" onClick={() => publish.mutate()}>Publish</Button>
          )}
          {session.org_kind === "tenant" && ["published", "proposals_received"].includes(r.status) && !alreadyMine && (
            <Button variant="primary" onClick={() => setProposing(true)}>Propose</Button>
          )}
        </>
      }
    >
      <Panel><StageRail stages={LIFECYCLE} current={r.status} /></Panel>

      <div className="g2">
        <Panel title="Specification">
          <Dl rows={[
            ["Format", r.spec.format ?? "—"],
            ["Quantity", r.spec.quantity ?? "—"],
            ["Quality bar", r.spec.quality ?? "—"],
            ["Acceptance", r.acceptance ?? "—"],
            ["Compliance", r.compliance_notes ?? "—"],
            ["Geography", r.geography ?? "—"],
          ]} />
        </Panel>
        <Panel title="People, budget and timeline">
          <Dl rows={[
            ["Headcount", String(r.people.headcount)],
            ["Training", r.people.training ?? "—"],
            ["Experience", r.people.experience ?? "—"],
            ["Certification", r.people.certification ?? "—"],
            ["Budget", `${money(r.budget_min)} – ${money(r.budget_max)}`],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Status", <Pill key="s" tone={meta.tone}>{meta.label}</Pill>],
          ]} />
        </Panel>
      </div>

      {(r.samples ?? []).length > 0 && (
        <Panel title="Sample data" sub="Provided by the client to gauge the work. Download links are single-use and expire.">
          <TableWrap>
            <table>
              <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th /></tr></thead>
              <tbody>
                {(r.samples ?? []).map((s) => (
                  <tr key={s.id}>
                    <td className="cell-primary">{s.filename}</td>
                    <td className="small muted">{s.content_type ?? "—"}</td>
                    <td className="num">{(s.size_bytes / (1024 * 1024)).toFixed(s.size_bytes < 1024 * 1024 ? 2 : 1)} MB</td>
                    <td className="num">{fmtDate(s.uploaded_at)}</td>
                    <td className="right"><div className="rowactions">
                      <Button
                        size="sm"
                        onClick={() => {
                          void get<{ url: string }>(`/requests/${r.id}/samples/${s.id}/download`)
                            .then(({ url }) => window.open(url, "_blank", "noopener"))
                            .catch((e) => toast("Download failed", e instanceof Error ? e.message : "", "critical"));
                        }}
                      >
                        Download
                      </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      <Panel
        title={isClient ? "Proposals" : "Your proposal"}
        sub={isClient ? "Competitors never see each other's bids — only you compare them." : undefined}
      >
        {proposals.length === 0 ? (
          <Empty title="No proposals yet" hint={r.status === "draft" ? "Publish the request first." : "Partners have been notified."} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Partner</th><th>Price</th><th>Days</th><th>QA track record</th>
                  <th>Methodology</th><th>Status</th>{isClient && <th />}
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const pm = statusMeta(proposalStatus, p.status);
                  return (
                    <tr key={p.id}>
                      <td className="cell-primary">
                        {p.partner_name ?? "—"}
                        {/* comparison, not decoration: meaningless to a partner
                            who sees only its own bid, and to a sole bid. */}
                        {isClient && proposals.length > 1 && (
                          <div className="cell-meta">
                            {Number(p.price) === lowest && <span className="chip">Lowest price</span>}{" "}
                            {p.duration_days === fastest && <span className="chip">Fastest</span>}
                          </div>
                        )}
                      </td>
                      <td className="num">{money(p.price)}</td>
                      <td className="num">{p.duration_days}</td>
                      <td className="num">{p.partner_qa_pass_rate != null ? `${p.partner_qa_pass_rate}% QA pass` : "—"}</td>
                      <td style={{ maxWidth: 380 }}>{p.methodology}</td>
                      <td><Pill tone={pm.tone}>{pm.label}</Pill></td>
                      {isClient && (
                        <td className="right"><div className="rowactions">
                          <Button size="sm" onClick={() => setViewing(p)}>Profile</Button>
                          {canAward && p.status === "submitted" && (
                            <Button size="sm" variant="primary" onClick={() => setAwarding(p)}>Award</Button>
                          )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {viewing && <PartnerProfileDialog proposal={viewing} onClose={() => setViewing(null)} />}

      {awarding && (
        <Dialog
          title={`Award to ${awarding.partner_name}?`}
          sub={`${money(awarding.price)} · ${awarding.duration_days} days`}
          onClose={() => setAwarding(null)}
          foot={
            <>
              <Button onClick={() => setAwarding(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => award.mutate(awarding.id)} disabled={award.isPending}>
                Award contract
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Awarding opens a contract and invoices milestone 1">
            Every other proposal is automatically declined and its partner notified. 50% of the
            value is invoiced to you and held in escrow until you approve the delivery.
          </Callout>
        </Dialog>
      )}

      {proposing && id && (
        <ProposeDialog requestId={id} title={r.title} onClose={() => setProposing(false)} />
      )}
    </View>
  );
}

/* --- the partner behind a proposal -------------------------------------------- */

// A bidder is disclosed to the client it bids to and to nobody else — the
// database says so (org_visible_via_proposal, db/110_auth_functions.sql).
// The shared OrgProfileDialog asks for the org and lets a 404 mean "not
// yours to see"; the proposal seeds the name and QA rate.
function PartnerProfileDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  return (
    <OrgProfileDialog
      orgId={proposal.partner_org_id}
      seedName={proposal.partner_name ?? "Delivery partner"}
      seedQa={proposal.partner_qa_pass_rate}
      onClose={onClose}
    />
  );
}

/* --- tenant: opportunities + propose ----------------------------------------- */

function ProposeDialog({ requestId, title, onClose }: { requestId: string; title: string; onClose: () => void }) {
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [methodology, setMethodology] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: () =>
      post(`/requests/${requestId}/proposals`, {
        price: Number(price),
        duration_days: Number(days),
        methodology,
        notes: notes || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Proposal submitted", "The client has been notified.", "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <Dialog
      title="Submit a proposal"
      sub={title}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={submit.isPending || !price || !days || !methodology.trim()}
            onClick={() => {
              // the backend requires a real methodology (min 10 chars) — say so
              // instead of silently disabling the button
              if (methodology.trim().length < 10) {
                setError("Describe your methodology in at least 10 characters — it is the main thing the client compares.");
                return;
              }
              setError(null);
              submit.mutate();
            }}
          >
            Submit proposal
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Price (USD)" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />}
        </Field>
        <Field label="Delivery time (days)" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />}
        </Field>
        <Field label="Methodology" required span
          hint="At least 10 characters. Immutable once submitted — this is what the client compares."
          error={methodology.trim() && methodology.trim().length < 10 ? "A few words more — 10 characters minimum." : null}>
          {(id) => <textarea id={id} className={textareaCls} rows={4} value={methodology} onChange={(e) => setMethodology(e.target.value)} />}
        </Field>
        <Field label="Notes" span>
          {(id) => <textarea id={id} className={textareaCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

export function OpportunitiesPage() {
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => get<Rfp[]>("/opportunities") });
  return (
    <View title="Opportunities" sub="Published requests you can still bid on. First proposal in moves it to 'proposals received'.">
      <Panel>
        {(opps.data ?? []).length === 0 ? (
          <Empty title="Nothing open right now" hint="You are notified the moment a client publishes." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Title</th><th>Category</th><th>Budget</th><th>Delivery</th><th /></tr></thead>
              <tbody>
                {(opps.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="id">{r.reference_code}</td>
                    <td className="cell-primary">{r.title}</td>
                    <td>{titleCase(r.category)}</td>
                    <td className="num">{money(r.budget_min)} – {money(r.budget_max)}</td>
                    <td className="num">{fmtDate(r.delivery_due_on)}</td>
                    <td className="right"><div className="rowactions"><Link className="btn" data-size="sm" to={`/requests/${r.id}`}>Brief</Link></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </View>
  );
}

function ProposalDetailDialog({ p, onClose }: { p: Proposal; onClose: () => void }) {
  const pm = statusMeta(proposalStatus, p.status);
  return (
    <Dialog
      title={p.request_title ?? p.request_ref ?? "Proposal"}
      sub={<span className="id">{p.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["Request", <Link key="r" to={`/requests/${p.request_id}`}>{p.request_title ?? p.request_ref ?? "Open request"}</Link>],
        ["Price", `${money(p.price, p.currency)}`],
        ["Delivery time", `${p.duration_days} days`],
        ["Methodology", p.methodology],
        ["Notes", p.notes ?? "—"],
        ["Status", <Pill key="s" tone={pm.tone}>{pm.label}</Pill>],
        ["Submitted", fmtDateTime(p.submitted_at)],
      ]} />
    </Dialog>
  );
}

export function MyProposalsPage() {
  const [viewing, setViewing] = useState<Proposal | null>(null);
  const [viewingBrief, setViewingBrief] = useState<Proposal | null>(null);
  const mine = useQuery({ queryKey: ["proposals-mine"], queryFn: () => get<Proposal[]>("/proposals/mine") });
  const withdraw = useMutation({
    mutationFn: (pid: string) => post(`/proposals/${pid}/withdraw`),
  });
  const qc = useQueryClient();
  const wins = useMemo(
    () => (mine.data ?? []).filter((p) => p.status === "accepted").length,
    [mine.data],
  );
  return (
    <View title="Proposals" sub={`${mine.data?.length ?? 0} submitted · ${wins} won`}>
      <Panel>
        {(mine.data ?? []).length === 0 ? (
          <Empty title="No proposals yet" hint="Open an opportunity and propose." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Request</th><th>Price</th><th>Days</th><th>Status</th><th /></tr></thead>
              <tbody>
                {(mine.data ?? []).map((p) => {
                  const pm = statusMeta(proposalStatus, p.status);
                  return (
                    <tr key={p.id} className="tap" onClick={() => setViewing(p)}>
                      <td className="id">{p.reference_code}</td>
                      <td className="cell-primary">{p.request_title ?? p.request_ref}</td>
                      <td className="num">{money(p.price)}</td>
                      <td className="num">{p.duration_days}</td>
                      <td><Pill tone={pm.tone}>{pm.label}</Pill></td>
                      <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                        <RowMenu
                          label={`Actions for ${p.reference_code}`}
                          items={[
                            { label: "View bid", onSelect: () => setViewing(p) },
                            { label: "View client & request", onSelect: () => setViewingBrief(p) },
                            ...(p.status === "submitted"
                              ? [{
                                  label: "Withdraw",
                                  tone: "danger" as const,
                                  onSelect: () => withdraw.mutate(p.id, {
                                    onSuccess: () => void qc.invalidateQueries({ queryKey: ["proposals-mine"] }),
                                  }),
                                }]
                              : []),
                          ]}
                        />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
      {viewing && <ProposalDetailDialog p={viewing} onClose={() => setViewing(null)} />}
      {viewingBrief && (
        <ClientAndRequestDialog proposal={viewingBrief} onClose={() => setViewingBrief(null)} />
      )}
    </View>
  );
}

/* --- the client and the RFP behind one of my proposals ------------------------ */
// Distinct from ProposalDetailDialog above, which shows the bid's own terms:
// this answers "who is buying, and what did they actually ask for".

// Two independent reads, both arbitrated by RLS: request_select_bidder keeps the
// RFP visible to whoever bid on it, and Fix 9 makes the buyer visible the same
// way. Either can 404, and a 404 means exactly "not yours to see".
function ClientAndRequestDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const rfp = useQuery({
    queryKey: ["request", proposal.request_id],
    queryFn: () => get<Rfp>(`/requests/${proposal.request_id}`),
  });
  const client = useQuery({
    queryKey: ["org", proposal.client_org_id],
    queryFn: () => get<Org>(`/organisations/${proposal.client_org_id}`),
    enabled: !!proposal.client_org_id,
  });

  const r = rfp.data;
  const o = client.data;
  const cp = (o?.profile ?? {}) as Partial<ClientProfile>;
  const pm = statusMeta(proposalStatus, proposal.status);

  return (
    <Dialog
      title={proposal.request_title ?? proposal.request_ref ?? "Proposal"}
      sub={
        <>
          <span className="id">{proposal.reference_code}</span>
          {" · "}{money(proposal.price)} · {proposal.duration_days} days{" "}
          <Pill tone={pm.tone}>{pm.label}</Pill>
        </>
      }
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Panel title="Client">
        {client.isError ? (
          <Callout tone="critical" title="Client not available">
            A buyer is visible to you through your proposal. If it has been withdrawn from the
            record, so has your view of them.
          </Callout>
        ) : !o ? (
          <p className="muted">Loading…</p>
        ) : (
          <Dl rows={[
            ["Name", o.name],
            ["Reference", o.reference_code],
            ["Country", o.country ?? "—"],
            ["Industry", cp.industry ?? "—"],
            ["Client since", fmtDate(cp.since)],
          ]} />
        )}
      </Panel>

      <Panel title="The request">
        {rfp.isError ? (
          <Callout tone="critical" title="Request not available" />
        ) : !r ? (
          <p className="muted">Loading…</p>
        ) : (
          <Dl rows={[
            ["Reference", r.reference_code],
            ["Category", titleCase(r.category)],
            ["Format", r.spec.format ?? "—"],
            ["Quantity", r.spec.quantity ?? "—"],
            ["Quality bar", r.spec.quality ?? "—"],
            ["Acceptance", r.acceptance ?? "—"],
            ["Budget", `${money(r.budget_min)} – ${money(r.budget_max)}`],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Geography", r.geography ?? "—"],
            ["Compliance", r.compliance_notes ?? "—"],
          ]} />
        )}
      </Panel>
    </Dialog>
  );
}
