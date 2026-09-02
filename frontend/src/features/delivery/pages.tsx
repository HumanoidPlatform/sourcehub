// delivery — contracts and deliveries, the work breakdown, the two handovers,
// and the supplier's task board.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, post } from "@api/client";
import type { ActivityRow, Contract, Org, Task } from "@api/types";
import {
  Button, Callout, Dialog, Dl, Empty, Field, inputCls, Meter, Metric, Panel,
  Pill, TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, money } from "@shared/format";
import { contractStatus, statusMeta, taskStatus, waitingOn } from "@shared/status";

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
      {(contracts.data ?? []).length === 0 ? (
        <Panel><Empty title={isClient ? "Nothing in delivery" : "No contracts yet"} hint={isClient ? "Award a proposal to open a contract." : "Win a proposal to open one."} /></Panel>
      ) : (
        (contracts.data ?? []).map((c) => {
          const meta = statusMeta(contractStatus, c.status);
          return (
            <Panel
              key={c.id}
              title={<Link to={isClient ? `/deliveries/${c.id}` : `/contracts/${c.id}`}>{c.title ?? c.reference_code}</Link>}
              sub={<span className="id">{c.reference_code} · {isClient ? c.partner_name : c.client_name}</span>}
              actions={<Pill tone={meta.tone}>{meta.label}</Pill>}
            >
              <div className="g4">
                <Metric label="Contract value" value={money(c.value)} />
                <Metric label="Tasks cleared" value={`${c.progress.done} / ${c.progress.total}`} />
                <Metric label="Assets accepted" value={c.progress.assets_accepted} />
                <Metric label="Delivery due" value={fmtDate(c.delivery_due_on)} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Meter pct={c.progress.pct} tone={c.progress.pct === 100 ? "success" : undefined} />
              </div>
            </Panel>
          );
        })
      )}
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
              <thead><tr><th>Task</th><th>Fulfilled by</th><th>Target</th><th>Attempt</th><th>Assets</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {(c.tasks ?? []).map((t) => {
                  const tm = statusMeta(taskStatus, t.status);
                  return (
                    <tr key={t.id}>
                      <td className="cell-primary">{t.title}<div className="cell-meta id">{t.reference_code}</div></td>
                      <td>{t.assignee_name}<div className="cell-meta">{t.assignee_kind}</div></td>
                      <td>{t.target ?? "—"}</td>
                      <td className="num">{t.last_submission?.attempt_no ?? "—"}</td>
                      <td className="num">{t.last_submission?.asset_count ?? 0}</td>
                      <td className="num">{fmtDate(t.due_on)}</td>
                      <td><Pill tone={tm.tone}>{tm.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

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
              <div key={a.id} className="event">
                <div>{a.summary}</div>
                <div className="cell-meta">{fmtDateTime(a.occurred_at)}</div>
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
              <b>{r.from_name} → {r.to_name}: {r.score}/5</b>
              <div className="small muted">{r.comment}</div>
            </div>
          ))}
        </Panel>
      )}

      {assigning && id && (
        <AssignTaskDialog contractId={id} onClose={() => setAssigning(false)} />
      )}
      {approving && id && (
        <ApproveDialog contract={c} onClose={() => setApproving(false)} />
      )}
    </View>
  );
}

function AssignTaskDialog({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const aggs = useQuery({ queryKey: ["orgs", "aggregator"], queryFn: () => get<Org[]>("/organisations?kind=aggregator") });
  const bizs = useQuery({ queryKey: ["orgs", "business"], queryFn: () => get<Org[]>("/organisations?kind=business") });

  const create = useMutation({
    mutationFn: () =>
      post(`/contracts/${contractId}/tasks`, {
        assignee_org_id: assignee, title, target: target || null, due_on: due || null,
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
        <Field label="Task title" required span>
          {(id) => <input id={id} className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kraków and Warsaw routes" />}
        </Field>
        <Field label="Target volume">
          {(id) => <input id={id} className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="300 hours · 5,000 images" />}
        </Field>
        <Field label="Due date">
          {(id) => <input id={id} className={inputCls} type="date" value={due} onChange={(e) => setDue(e.target.value)} />}
        </Field>
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

  return (
    <Dialog
      title="Approve the delivery"
      sub={`${contract.title} · ${money(contract.value)}`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="success" disabled={!comment.trim() || approve.isPending} onClick={() => approve.mutate()}>
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

/* --- supplier: tasks ----------------------------------------------------------- */

export function TasksPage() {
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const [submitting, setSubmitting] = useState<Task | null>(null);

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => get<Task[]>("/tasks") });

  const start = useMutation({
    mutationFn: (tid: string) => post(`/tasks/${tid}/start`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const label = session.org_kind === "business" ? "Engagements" : "Tasks";

  return (
    <View title={label} sub="Start a task, capture, submit for the partner's QA. A rejection always says what must change.">
      <Panel>
        {(tasks.data ?? []).length === 0 ? (
          <Empty title="Nothing assigned" hint="Your delivery partner assigns work here." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Task</th><th>Contract</th><th>Target</th><th>Due</th><th>Status</th><th>Last note</th><th /></tr></thead>
              <tbody>
                {(tasks.data ?? []).map((t) => {
                  const tm = statusMeta(taskStatus, t.status);
                  return (
                    <tr key={t.id}>
                      <td className="cell-primary">{t.title}<div className="cell-meta id">{t.reference_code}</div></td>
                      <td className="id">{t.contract_ref}</td>
                      <td>{t.target ?? "—"}</td>
                      <td className="num">{fmtDate(t.due_on)}</td>
                      <td><Pill tone={tm.tone}>{tm.label}</Pill></td>
                      <td style={{ maxWidth: 260 }} className="small muted">
                        {t.status === "qa_failed" ? <QaNote taskId={t.id} /> : t.last_submission?.supplier_note ?? "—"}
                      </td>
                      <td className="rowactions">
                        {["assigned", "qa_failed"].includes(t.status) && (
                          <Button size="sm" onClick={() => start.mutate(t.id)}>Start</Button>
                        )}
                        {["in_progress", "qa_failed", "assigned"].includes(t.status) && (
                          <Button size="sm" variant="primary" onClick={() => setSubmitting(t)}>Submit</Button>
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

      {submitting && (
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
