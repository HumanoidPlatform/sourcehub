// delivery — contracts and deliveries, the work breakdown, the two handovers,
// and the supplier's task board.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, post } from "@api/client";
import type { ActivityRow, Assignment, CaptureSpec, Contract, Org, Rfp, SubjectSpec, Task } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, inputCls, Loadable, Meter, Metric, Panel,
  Pill, TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import {
  AttachmentList, AttachmentsField, attachmentPayload, slotRows, type AttachmentDraft,
} from "@shared/attachments";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, mediaList, money, taskTarget } from "@shared/format";
import { assignmentStatus, contractStatus, statusMeta, taskStatus, waitingOn } from "@shared/status";
import { AssignmentUploadDialog } from "@features/capture/dialog";
import { useUploadActivity } from "@features/capture/hooks";
import { AssetGallery, useTaskAssets } from "./components/AssetGallery";
import { SubmitToPartnerDialog, TaskAssignmentsDialog } from "./components/assignments";

/* --- contracts / deliveries list --------------------------------------------- */

export function ContractsPage() {
  const session = useSession();
  const isClient = session.org_kind === "client";
  const contracts = useQuery({ queryKey: ["contracts"], queryFn: () => get<Contract[]>("/contracts") });

  return (
    <View
      title={isClient ? "Deliveries" : "Contracts"}
      sub={isClient
        ? "Work in flight against your requests. Approving a delivery releases payment."
        : "Break each contract into tasks; deliver once every task clears QA."}
    >
      {/* One row per contract, like every other list in the product. Expanded
          cards were unreadable past two or three and buried the one thing you
          scan for — which contract needs attention. The detail page has the
          metrics; this page has to be scannable. */}
      <Panel>
        <Loadable q={contracts} what={isClient ? "your deliveries" : "your contracts"}>
          {(contracts.data ?? []).length === 0 ? (
            <Empty
              title={isClient ? "Nothing in delivery" : "No contracts yet"}
              hint={isClient ? "Award a proposal to open a contract." : "Win a proposal to open one."}
            />
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Reference</th><th>Title</th><th>{isClient ? "Partner" : "Client"}</th>
                    <th>Value</th><th>Tasks</th><th>Progress</th><th>Delivery due</th>
                    <th>Status</th><th />
                  </tr>
                </thead>
                <tbody>
                  {(contracts.data ?? []).map((c) => {
                    const meta = statusMeta(contractStatus, c.status);
                    const to = isClient ? `/deliveries/${c.id}` : `/contracts/${c.id}`;
                    return (
                      <tr key={c.id}>
                        <td className="id">{c.reference_code}</td>
                        <td className="cell-primary">{c.title ?? c.reference_code}</td>
                        <td>{isClient ? c.partner_name : c.client_name}</td>
                        <td className="num" style={{ whiteSpace: "nowrap" }}>{money(c.value)}</td>
                        <td className="num">{c.progress.done} / {c.progress.total}</td>
                        <td style={{ minWidth: 96 }}>
                          <Meter pct={c.progress.pct} tone={c.progress.pct === 100 ? "success" : undefined} />
                        </td>
                        <td className="num" style={{ whiteSpace: "nowrap" }}>{fmtDate(c.delivery_due_on)}</td>
                        <td><Pill tone={meta.tone}>{meta.label}</Pill></td>
                        <td className="right">
                          <div className="rowactions">
                            <Link className="btn" data-size="sm" to={to}>Open</Link>
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
    </View>
  );
}

/* --- contract detail ---------------------------------------------------------- */

export function ContractDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const [assigning, setAssigning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const contract = useQuery({
    queryKey: ["contract", id],
    queryFn: () => get<Contract>(`/contracts/${id}`),
    enabled: !!id,
  });
  const trail = useQuery({
    queryKey: ["activity", id],
    queryFn: () => get<ActivityRow[]>(`/activity?scope_id=${id}&limit=15`),
    enabled: !!id,
  });
  // The request this contract came from, for the documents the client attached
  // to it. Once awarded the request leaves Opportunities, and this page is
  // where the partner works — without this the brief they priced and the rules
  // they are judged against were three clicks away through Proposals. Same key
  // as AssignTaskDialog, so the two share one response.
  const requestId = contract.data?.request_id;
  const brief = useQuery({
    queryKey: ["request", requestId],
    queryFn: () => get<Rfp>(`/requests/${requestId}`),
    enabled: !!requestId,
  });

  const deliver = useMutation({
    mutationFn: () => post<Contract>(`/contracts/${id}/deliver`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contract", id] });
      toast("Delivered", "The client has been asked to approve.", "success");
    },
    onError: (e) => toast("Cannot deliver", e instanceof Error ? e.message : "", "critical"),
  });

  const c = contract.data;
  if (!c) return <View title="Contract"><p className="muted">Loading…</p></View>;

  const meta = statusMeta(contractStatus, c.status);
  const isPartner = session.org_id === c.partner_org_id;
  const isClient = session.org_id === c.client_org_id;
  const rubric = (c.rubric_snapshot ?? {}) as { acceptance?: string; compliance?: string };
  // A slot with no files renders no row, and no documents at all no panel.
  const clientDocRows = slotRows(brief.data?.attachments);

  return (
    <View
      title={c.title ?? c.reference_code}
      sub={<span className="id">{c.reference_code} · client {c.client_name} · partner {c.partner_name}</span>}
      actions={
        <>
          <Pill tone={meta.tone}>{meta.label}</Pill>
          {isPartner && c.status === "active" && (
            <>
              <Button onClick={() => setAssigning(true)}>Assign task</Button>
              <Button variant="success" disabled={!c.progress.deliverable} onClick={() => deliver.mutate()}
                title={c.progress.deliverable ? undefined : "Every task must clear QA first"}>
                Deliver to client
              </Button>
            </>
          )}
          {isClient && c.status === "delivered" && (
            <Button variant="success" onClick={() => setApproving(true)}>Approve and release payment</Button>
          )}
        </>
      }
    >
      <div className="g4">
        <Metric label="Value" value={money(c.value)} sub={`fee ${c.platform_fee_pct}% on completion`} />
        <Metric label="Progress" value={`${c.progress.pct}%`} sub={`${c.progress.done} of ${c.progress.total} tasks QA-passed`} />
        <Metric label="Waiting on" value={waitingOn(meta, isClient ? "client" : "partner")} />
        <Metric label="Delivery due" value={fmtDate(c.delivery_due_on)} />
      </div>

      <Panel title="Work breakdown" sub={isClient ? "Fulfilled by the partner's own network — provenance you can audit." : "Only partners in your own network can be assigned."}>
        {(c.tasks ?? []).length === 0 ? (
          <Empty title="No tasks yet" hint={isPartner ? "Break the contract into tasks to begin." : "The partner is planning the work."} />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Task</th><th>Fulfilled by</th><th>Target</th><th>Attempt</th><th>Assets</th><th>Due</th><th>Status</th><th /></tr></thead>
              <tbody>
                {(c.tasks ?? []).map((t) => {
                  const tm = statusMeta(taskStatus, t.status);
                  return (
                    <tr key={t.id} className="tap" onClick={() => setViewingTask(t)}>
                      <td className="cell-primary">{t.title}<div className="cell-meta id">{t.reference_code}</div></td>
                      <td>{t.assignee_name}<div className="cell-meta">{t.assignee_kind}</div></td>
                      <td>{taskTarget(t)}</td>
                      <td className="num">{t.last_submission?.attempt_no ?? "—"}</td>
                      <td className="num">{t.last_submission?.asset_count ?? 0}</td>
                      <td className="num">{fmtDate(t.due_on)}</td>
                      <td><Pill tone={tm.tone}>{tm.label}</Pill></td>
                      <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                        <Button size="sm" onClick={() => setViewingTask(t)}>Details</Button>
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

      {clientDocRows.length > 0 && (
        <Panel
          title="Client's documents"
          sub={isClient
            ? "What you attached to the request. The partner works from these."
            : "What the client attached to the request — the brief you priced and the rules the work is judged against."}
          actions={<Link className="btn" data-size="sm" to={`/requests/${c.request_id}`}>Open request</Link>}
        >
          <Dl rows={clientDocRows} />
        </Panel>
      )}

      <div className="g2">
        <Panel title="Rubric snapshot" sub="Frozen at award. Disputes are arbitrated against this, not the request as it reads today.">
          <Dl rows={[
            ["Acceptance", rubric.acceptance ?? "—"],
            ["Compliance", rubric.compliance ?? "—"],
            ["Milestone held", `${c.milestone_pct}% at award`],
          ]} />
        </Panel>
        <Panel title="Audit trail">
          <div className="timeline">
            {(trail.data ?? []).map((a) => (
              // .event is a 22px dot column plus content. Without the dot the
              // summary lands in the 22px track, one word per line.
              <div key={a.id} className="event">
                <span className="spine" aria-hidden="true" />
                <span className="dot" aria-hidden="true">·</span>
                <div>
                  <div className="what">{a.summary}</div>
                  <div className="who">{fmtDateTime(a.occurred_at)}</div>
                </div>
              </div>
            ))}
            {!trail.data?.length && <p className="muted small">Nothing yet.</p>}
          </div>
        </Panel>
      </div>

      {(c.ratings ?? []).length > 0 && (
        <Panel title="Ratings">
          {(c.ratings ?? []).map((r) => (
            <div key={r.id} className="event">
              <span className="spine" aria-hidden="true" />
              <span className="dot" aria-hidden="true">·</span>
              <div>
                <div className="what"><b>{r.from_name} → {r.to_name}: {r.score}/5</b></div>
                <div className="who">{r.comment}</div>
              </div>
            </div>
          ))}
        </Panel>
      )}

      {assigning && id && (
        <AssignTaskDialog contractId={id} requestId={c?.request_id} onClose={() => setAssigning(false)} />
      )}
      {approving && id && (
        <ApproveDialog contract={c} onClose={() => setApproving(false)} />
      )}
      {viewingTask && <TaskDetailDialog t={viewingTask} onClose={() => setViewingTask(null)} />}
    </View>
  );
}

function AssignTaskDialog({
  contractId, requestId, onClose,
}: { contractId: string; requestId?: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("photos");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState<AttachmentDraft[]>([]);
  // The subject: what every capture must show. The worker reads it before the
  // shutter and their phone checks each photo against it; a task without one
  // gets no check. Prefilled from the brief, kept as the partner's own words.
  const [domain, setDomain] = useState("");
  const [mustShow, setMustShow] = useState("");
  const [mustNotShow, setMustNotShow] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  // What the client asked for. A task inherits capture_spec and target_unit
  // from the request unless this form overrides them (backend
  // delivery.create_task), and what a worker's phone will accept follows from
  // that — so the partner should be able to see what they are inheriting
  // rather than discovering it when an upload is refused.
  const brief = useQuery({
    queryKey: ["request", requestId],
    queryFn: () => get<Rfp>(`/requests/${requestId}`),
    enabled: !!requestId,
  });
  const wantedMedia = mediaList(brief.data?.spec.capture);
  const wantedUnit = brief.data?.spec.target_unit ?? null;
  useEffect(() => {
    if (!brief.data || domain) return;
    const d = draftSubject(brief.data);
    setDomain(d.domain);
    setMustShow(d.must_show.join(", "));
    setMustNotShow(d.must_not_show.join(", "));
    // prefill once, when the brief arrives; the partner's edits stand after
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.data]);

  const aggs = useQuery({ queryKey: ["orgs", "aggregator"], queryFn: () => get<Org[]>("/organisations?kind=aggregator") });
  const bizs = useQuery({ queryKey: ["orgs", "business"], queryFn: () => get<Org[]>("/organisations?kind=business") });

  const create = useMutation({
    mutationFn: () =>
      post(`/contracts/${contractId}/tasks`, {
        assignee_org_id: assignee, title, due_on: due || null,
        target_quantity: qty ? Number(qty) : null, target_unit: qty ? unit : null,
        instructions: instructions || null,
        subject: domain.trim()
          ? { domain: domain.trim(), must_show: phrases(mustShow), must_not_show: phrases(mustNotShow) }
          : null,
        attachments: attachmentPayload(files, "instructions"),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contract", contractId] });
      toast("Task assigned", "The supplier has been notified.", "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not assign"),
  });

  return (
    <Dialog
      title="Assign a task"
      sub="Only partners in your own network appear here."
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!title.trim() || !assignee || create.isPending} onClick={() => create.mutate()}>
            Assign task
          </Button>
        </>
      }
    >
      <div className="formgrid">
        {(wantedMedia.length > 0 || wantedUnit) && (
          // Across both columns, like the spanning fields below it: a callout
          // in one grid cell squeezes its title into three lines.
          <div className="span">
            <Callout tone="attention" title="Inherited from the request">
              {wantedMedia.length > 0
                ? `Workers on this task may upload ${wantedMedia.join(" and ")} only`
                : "Workers on this task may upload anything visual"}
              {wantedUnit ? `, counted in ${wantedUnit.replace(/_/g, " ")}` : ""}.
              {" "}Setting a target below overrides the unit.
            </Callout>
          </div>
        )}
        <Field label="Task title" required span>
          {(id) => <input id={id} className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kraków and Warsaw routes" />}
        </Field>
        <Field label="Due date">
          {(id) => <input id={id} className={inputCls} type="date" value={due} onChange={(e) => setDue(e.target.value)} />}
        </Field>
        <Field label="Target" hint="How much this task is for — a number of photos or videos, or hours of footage.">
          {(id) => (
            <div style={{ display: "flex", gap: 8 }}>
              <input id={id} className={inputCls} type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="100" style={{ flex: 1 }} />
              <select className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit" style={{ width: 130 }}>
                <option value="photos">photos</option>
                <option value="videos">videos</option>
                <option value="records">records</option>
                <option value="hours">hours</option>
              </select>
            </div>
          )}
        </Field>
        <Field label="Instructions for the field" span hint="Shown to every worker on their phone.">
          {(id) => <textarea id={id} className={textareaCls} rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Full shelf in frame, no shoppers, landscape." />}
        </Field>
        <Field label="Subject" span hint="What every capture must show, in a few words. The worker's phone checks each photo against this and suggests a retake when nothing matches. Leave empty for no check.">
          {(id) => <input id={id} className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="retail shelf" maxLength={80} />}
        </Field>
        <Field label="Must show" hint="Comma-separated words.">
          {(id) => <input id={id} className={inputCls} value={mustShow} onChange={(e) => setMustShow(e.target.value)} placeholder="shelf, products, price tags" />}
        </Field>
        <Field label="Must not show" hint="Comma-separated words.">
          {(id) => <input id={id} className={inputCls} value={mustNotShow} onChange={(e) => setMustNotShow(e.target.value)} placeholder="person, selfie, screenshot" />}
        </Field>
        <AttachmentsField
          label="Attach to the instructions"
          span
          hint="A shot list, a site map, an example frame. Workers on this task can open these on their phone."
          items={files}
          onChange={setFiles}
        />
        <Field label="Assign to" required span>
          {(id) => (
            <select id={id} className={inputCls} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Choose a supplier…</option>
              {(aggs.data ?? []).length > 0 && (
                <optgroup label="Aggregators">
                  {(aggs.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {(a.profile.crowd_size as number) ?? "?"} crowd workers
                    </option>
                  ))}
                </optgroup>
              )}
              {(bizs.data ?? []).length > 0 && (
                <optgroup label="Business partners">
                  {(bizs.data ?? []).map((b) => (
                    <option key={b.id} value={b.id}>{b.name} — {(b.profile.specialty as string) ?? ""}</option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/** "shelf, products,, price tags" -> ["shelf", "products", "price tags"]; at most 12 */
function phrases(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12);
}

const words = (s: string | null | undefined) => (s ?? "").replace(/_/g, " ").trim();

/** A first draft of the subject from the client's own brief. Deterministic:
 *  it saves the partner typing, it never decides anything. */
function draftSubject(r: Rfp): SubjectSpec {
  const subject = words(r.spec.sampling_frame?.subject_type);
  const place = words(r.spec.location_type);
  return {
    domain: subject || words(r.category),
    must_show: [subject, place].filter(Boolean),
    must_not_show: ["person", "selfie", "screenshot"],
  };
}

function ApproveDialog({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const [score, setScore] = useState("5");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const approve = useMutation({
    mutationFn: () =>
      post(`/contracts/${contract.id}/approve`, { score: Number(score), comment }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Contract completed", `${money(contract.value)} released to ${contract.partner_name}.`, "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not approve"),
  });

  // Approval is irreversible and releases money, so the client needs a way to
  // say no. Without one the only refusal was silence, and the partner had no
  // idea what to fix.
  const dispute = useMutation({
    mutationFn: () => post(`/contracts/${contract.id}/dispute`, { reason: comment }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Sent back", `${contract.partner_name} has been told what to change.`, "attention");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not send it back"),
  });

  return (
    <Dialog
      title="Review the delivery"
      sub={`${contract.title} · ${money(contract.value)}`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!comment.trim() || dispute.isPending || approve.isPending}
            title={comment.trim() ? undefined : "Say what needs to change"}
            onClick={() => dispute.mutate()}
          >
            Send back
          </Button>
          <Button variant="success" disabled={!comment.trim() || approve.isPending || dispute.isPending} onClick={() => approve.mutate()}>
            Approve and release payment
          </Button>
        </>
      }
    >
      <Callout tone="attention" title="Approving releases payment">
        {contract.partner_name} is paid {money(contract.value)} less the platform fee, and the
        contract closes. This cannot be undone.
      </Callout>
      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field label="Rate your delivery partner">
          {(id) => (
            <select id={id} className={inputCls} value={score} onChange={(e) => setScore(e.target.value)}>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Fair</option>
              <option value="2">2 — Poor</option>
              <option value="1">1 — Unacceptable</option>
            </select>
          )}
        </Field>
        <Field label="Comment" required span hint="Shared with the partner and shown on their profile. Ratings without one are not published.">
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- task detail --------------------------------------------------------------- */

// One dialog for both task tables — the contract work breakdown and the
// supplier's board. Row data carries everything but the QA trail, which the
// existing reviews endpoint provides.
function subjectRows(s: SubjectSpec | null | undefined): [string, React.ReactNode][] {
  if (!s) return [];
  return [[
    "Subject",
    <span key="subj">
      <b>{s.domain}</b>
      {s.must_show.length > 0 && <> · must show {s.must_show.join(", ")}</>}
      {s.must_not_show.length > 0 && <> · not {s.must_not_show.join(", ")}</>}
    </span>,
  ]];
}

function TaskDetailDialog({ t, onClose }: { t: Task; onClose: () => void }) {
  const tm = statusMeta(taskStatus, t.status);
  const reviews = useQuery({
    queryKey: ["reviews", t.id],
    queryFn: () =>
      get<{ gate: string; outcome: string; note: string | null; worker_name: string | null }[]>(`/tasks/${t.id}/reviews`),
  });
  const assets = useTaskAssets(t.id);
  const sub = t.last_submission;
  const summary = t.assignment_summary;
  const unit = t.target_unit ?? "units";
  return (
    <Dialog
      size="wide"
      title={t.title}
      sub={<span className="id">{t.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["Contract", t.contract_ref ?? "—"],
        ...(t.assignee_name
          ? ([["Fulfilled by", `${t.assignee_name}${t.assignee_kind ? ` (${t.assignee_kind})` : ""}`]] as [string, React.ReactNode][])
          : []),
        ["Target", t.target_quantity != null
          ? `${t.target_quantity} ${unit}${t.target ? ` · ${t.target}` : ""}`
          : t.target ?? "—"],
        ...(t.instructions ? ([["Instructions", t.instructions]] as [string, React.ReactNode][]) : []),
        ...subjectRows((t.capture_spec as CaptureSpec).subject),
        // The shot list or map the instructions refer to. A worker on
        // this task can open these too — the policy follows the task.
        ...((t.attachments ?? []).length
          ? ([["Attached", <AttachmentList key="ta" items={t.attachments ?? []} />]] as [string, React.ReactNode][])
          : []),
        // What the client attached for whoever does the work. The server
        // decides which of these this viewer gets: never the brief, and the
        // compliance papers stop at the aggregator.
        ...slotRows(t.client_documents),
        ["Due", fmtDate(t.due_on)],
        ["Status", <Pill key="s" tone={tm.tone}>{tm.label}</Pill>],
        ...(summary && summary.total - summary.cancelled > 0
          ? ([["Workers", `${summary.total - summary.cancelled} assigned · ${summary.accepted} accepted · ${summary.submitted} awaiting review`]] as [string, React.ReactNode][])
          : []),
        ["Last submission", sub
          ? `Attempt ${sub.attempt_no} · ${sub.asset_count} asset(s) · ${fmtDateTime(sub.submitted_at)}`
          : "None yet"],
        ...(sub?.supplier_note
          ? ([["Supplier note", sub.supplier_note]] as [string, React.ReactNode][])
          : []),
        ["QA reviews", (reviews.data ?? []).length === 0
          ? "None yet"
          : (
            <div key="qa" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(reviews.data ?? []).map((r, i) => (
                <div key={i} className="small">
                  <b>{r.gate === "gate1_supplier" ? "Gate 1" : "Gate 2"} · {r.outcome === "fail" ? "Fail" : "Pass"}</b>
                  {r.worker_name ? ` · ${r.worker_name}` : ""}
                  {r.note ? ` — ${r.note}` : ""}
                </div>
              ))}
            </div>
          )],
      ]} />
      <div style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Captured assets</div>
        <AssetGallery
          assets={assets.data ?? []}
          loading={assets.isLoading}
          emptyHint="Files confirmed from the capture app appear here."
        />
      </div>
    </Dialog>
  );
}

/* --- supplier: tasks ----------------------------------------------------------- */

export function TasksPage() {
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const isAggregator = session.org_kind === "aggregator";
  const [submitting, setSubmitting] = useState<Task | null>(null);
  const [viewing, setViewing] = useState<Task | null>(null);
  const [workersFor, setWorkersFor] = useState<Task | null>(null);

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => get<Task[]>("/tasks") });

  const start = useMutation({
    mutationFn: (tid: string) => post(`/tasks/${tid}/start`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast("Cannot start", e instanceof Error ? e.message : "", "critical"),
  });

  const label = session.org_kind === "business" ? "Engagements" : "Tasks";
  const sub = isAggregator
    ? "Assign units to your crowd, review their captures at gate 1, then submit the accepted set to your delivery partner."
    : "Start a task, capture, submit for the partner's QA. A rejection always says what must change.";

  // a dialog reads the live row, so its counts move as uploads and verdicts land
  const live = (t: Task) => (tasks.data ?? []).find((x) => x.id === t.id) ?? t;

  return (
    <View title={label} sub={sub}>
      <Panel>
        <Loadable q={tasks} what="your tasks">
          {(tasks.data ?? []).length === 0 ? (
            <Empty title="Nothing assigned" hint="Your delivery partner assigns work here." />
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Task</th><th>Contract</th><th>Target</th>
                    {isAggregator && <th>Workers</th>}
                    <th>Due</th><th>Status</th><th>Last note</th><th />
                  </tr>
                </thead>
                <tbody>
                  {(tasks.data ?? []).map((t) => {
                    const tm = statusMeta(taskStatus, t.status);
                    const s = t.assignment_summary;
                    const a = t.asset_summary;
                    const workers = s ? s.total - s.cancelled : 0;
                    return (
                      <tr key={t.id} className="tap" onClick={() => setViewing(t)}>
                        <td className="cell-primary">{t.title}<div className="cell-meta id">{t.reference_code}</div></td>
                        <td className="id">{t.contract_ref}</td>
                        <td>{taskTarget(t)}</td>
                        {isAggregator && (
                          <td>
                            {workers > 0 ? (
                              <>
                                {workers} worker{workers === 1 ? "" : "s"}
                                <div className="cell-meta">
                                  {a?.ready ?? 0}{t.target_quantity ? ` / ${t.target_quantity}` : ""} ready
                                  {s?.submitted ? ` · ${s.submitted} to review` : ""}
                                </div>
                              </>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        )}
                        <td className="num">{fmtDate(t.due_on)}</td>
                        <td><Pill tone={tm.tone}>{tm.label}</Pill></td>
                        <td style={{ maxWidth: 260 }} className="small muted">
                          {t.status === "qa_failed" ? <QaNote taskId={t.id} /> : t.last_submission?.supplier_note ?? "—"}
                        </td>
                        <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                          <Button size="sm" onClick={() => setViewing(t)}>Details</Button>
                          {isAggregator && (
                            <Button size="sm" onClick={() => setWorkersFor(t)}>Workers</Button>
                          )}
                          {["assigned", "qa_failed"].includes(t.status) && (
                            <Button size="sm" onClick={() => start.mutate(t.id)}>Start</Button>
                          )}
                          {["in_progress", "qa_failed", "assigned"].includes(t.status) && (
                            <Button size="sm" variant="primary" onClick={() => setSubmitting(t)}>
                              {isAggregator ? "Submit to partner" : "Submit"}
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
        </Loadable>
      </Panel>

      {submitting && isAggregator && (
        <SubmitToPartnerDialog
          task={live(submitting)}
          onClose={() => setSubmitting(null)}
          onDone={() => {
            setSubmitting(null);
            void qc.invalidateQueries();
            toast("Submitted for QA", "The delivery partner has been notified.", "success");
          }}
        />
      )}
      {submitting && !isAggregator && (
        <SubmitDialog
          task={submitting}
          onClose={() => setSubmitting(null)}
          onDone={() => {
            setSubmitting(null);
            void qc.invalidateQueries({ queryKey: ["tasks"] });
            toast("Submitted for QA", "The delivery partner has been notified.", "success");
          }}
        />
      )}
      {workersFor && <TaskAssignmentsDialog task={live(workersFor)} onClose={() => setWorkersFor(null)} />}
      {viewing && <TaskDetailDialog t={viewing} onClose={() => setViewing(null)} />}
    </View>
  );
}

function QaNote({ taskId }: { taskId: string }) {
  const reviews = useQuery({
    queryKey: ["reviews", taskId],
    queryFn: () => get<{ outcome: string; note: string | null }[]>(`/tasks/${taskId}/reviews`),
  });
  const lastFail = [...(reviews.data ?? [])].reverse().find((r) => r.outcome === "fail");
  return <span style={{ color: "var(--t-critical)" }}>{lastFail?.note ?? "Sent back for rework"}</span>;
}

function SubmitDialog({ task, onClose, onDone }: { task: Task; onClose: () => void; onDone: () => void }) {
  const [count, setCount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => post(`/tasks/${task.id}/submit`, { asset_count: Number(count), note: note || null }),
    onSuccess: onDone,
    onError: (e) => setError(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <Dialog
      title={`Submit ${task.reference_code}`}
      sub={task.title}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!count || Number(count) < 1 || submit.isPending} onClick={() => submit.mutate()}>
            Submit for QA
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Assets in this submission" required hint="File upload arrives with the media plane; the count drives QA sampling today.">
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} />}
        </Field>
        <Field label="Note to QA" span hint="Your account of the work — it is never overwritten by the verdict.">
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- a worker who signs in on the web ---------------------------------------- */

// Capture happens in the phone app, and files a worker already holds are
// uploaded from here: a row opens the same presign → PUT → confirm → submit
// flow the phone runs, in a dialog. The row keeps reporting while the dialog
// is closed, because the upload queue outlives it.
export function WorkerAssignmentsPage() {
  const session = useSession();
  // polls like the phone does, so a place accepted from an email in another
  // tab shows up here without a reload
  const rows = useQuery({
    queryKey: ["my-assignments"],
    queryFn: () => get<Assignment[]>("/me/assignments"),
    refetchInterval: 30_000,
  });
  const list = rows.data ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const activity = useUploadActivity();
  // the live row, so the dialog's status follows a start or submit
  const open = openId ? list.find((a) => a.id === openId) ?? null : null;

  const action = (a: Assignment): string => {
    if (a.status === "assigned") return "Start & upload";
    if (a.status === "rejected") return "Reopen & upload";
    if (a.status === "in_progress") return "Upload";
    return "View";
  };

  return (
    <View
      title={`Good day, ${session.full_name ?? session.email ?? "there"}`}
      sub={`Your assignments at ${session.org_name}.`}
    >
      <Callout tone="attention" title="Capture on the phone, or upload files here">
        The Cosarathi Capture app checks a shot as you take it. Files you already hold can be uploaded
        from this page instead — open an assignment to add them; whatever the browser cannot verify is
        left for your supplier to judge.
      </Callout>
      <Panel>
        <Loadable q={rows} what="your assignments">
          {list.length === 0 ? (
            <Empty title="Nothing assigned yet" hint="Your aggregator assigns work to you here." />
          ) : (
            <TableWrap>
              <table>
                <thead><tr><th>Task</th><th>Ready</th><th>Status</th><th>Due</th><th>Note</th><th></th></tr></thead>
                <tbody>
                  {list.map((a) => {
                    const m = statusMeta(assignmentStatus, a.status);
                    const act = activity.get(a.id);
                    return (
                      <tr key={a.id}>
                        <td className="cell-primary">{a.task.title}<div className="cell-meta id">{a.task.reference_code}</div></td>
                        <td className="num">{a.assets.ready} / {a.quantity}</td>
                        <td>
                          <Pill tone={m.tone}>{m.label}</Pill>
                          {act && act.active > 0 && <span className="chip" style={{ marginLeft: 6 }}>{act.active} uploading</span>}
                          {act && act.active === 0 && act.failed > 0 && <span className="chip" style={{ marginLeft: 6 }}>{act.failed} failed</span>}
                        </td>
                        <td className="num">{fmtDate(a.due_on ?? a.task.due_on)}</td>
                        <td className="small muted" style={{ maxWidth: 260 }}>
                          {a.status === "rejected" ? a.decision_note : a.instructions ?? a.task.instructions ?? "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Button size="sm" variant={a.status === "accepted" || a.status === "submitted" ? undefined : "primary"} onClick={() => setOpenId(a.id)}>
                            {action(a)}
                          </Button>
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
      {open && <AssignmentUploadDialog assignment={open} onClose={() => setOpenId(null)} />}
    </View>
  );
}
