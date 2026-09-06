// delivery/components — the aggregator's side of the field half: splitting a
// task among crowd workers, reviewing each worker's batch at gate 1, and
// bundling the accepted captures into the submission the delivery partner
// reviews at gate 2.
//
// At most one dialog is mounted at a time: the assignments dialog hides itself
// while a child dialog (assign, review) is open, so Escape and the backdrop
// never close two layers at once.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { Assignment, Task, WorkerRow } from "@api/types";
import {
  Button, Callout, Dialog, Empty, Field, inputCls, Meter, Metric, Pill, TableWrap, textareaCls,
} from "@ds/primitives";
import { fmtDate, fmtDateTime } from "@shared/format";
import { assignmentStatus, statusMeta } from "@shared/status";
import { AssetGallery, useAssignmentAssets, useTaskAssets } from "./AssetGallery";

export function useTaskAssignments(taskId: string | null | undefined) {
  return useQuery({
    queryKey: ["assignments", taskId],
    queryFn: () => get<Assignment[]>(`/tasks/${taskId}/assignments`),
    enabled: !!taskId,
  });
}

const OPEN = new Set(["assigned", "in_progress", "submitted", "rejected"]);

/* --- assign units of a task to one worker ------------------------------------- */

export function AssignWorkersDialog({ task, onClose, onDone }: { task: Task; onClose: () => void; onDone: () => void }) {
  const qc = useQueryClient();
  const workers = useQuery({ queryKey: ["workers"], queryFn: () => get<WorkerRow[]>("/network/workers") });
  const eligible = (workers.data ?? []).filter(
    (w) => w.invitation_status === "accepted" && w.status !== "offboarded" && w.user_id,
  );
  const remaining =
    task.target_quantity != null
      ? Math.max(0, task.target_quantity - (task.assignment_summary?.quantity_assigned ?? 0))
      : null;

  const [worker, setWorker] = useState("");
  const [qty, setQty] = useState(remaining != null && remaining > 0 ? String(remaining) : "");
  const [instructions, setInstructions] = useState(task.instructions ?? "");
  const [due, setDue] = useState(task.due_on ?? "");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      post(`/tasks/${task.id}/assignments`, {
        worker_user_id: worker, quantity: Number(qty),
        instructions: instructions || null, due_on: due || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignments", task.id] });
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["workers"] });
      onDone();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not assign"),
  });

  const unit = task.target_unit ?? "units";
  return (
    <Dialog
      title="Assign to a worker"
      sub={`${task.reference_code} · ${task.title}`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!worker || !qty || Number(qty) < 1 || create.isPending} onClick={() => create.mutate()}>
            Assign
          </Button>
        </>
      }
    >
      {eligible.length === 0 && !workers.isLoading && (
        <Callout tone="attention" title="No workers can take work yet">
          Invite workers from the Crowd roster first. Only people who have accepted their invitation appear here.
        </Callout>
      )}
      <div className="formgrid" style={{ marginTop: eligible.length === 0 ? 12 : 0 }}>
        <Field label="Worker" required span>
          {(id) => (
            <select id={id} className={inputCls} value={worker} onChange={(e) => setWorker(e.target.value)}>
              <option value="">Choose a worker…</option>
              {eligible.map((w) => (
                <option key={w.id} value={w.user_id ?? ""}>
                  {w.display_name}{w.skill ? ` — ${w.skill}` : ""}{w.open_assignments ? ` (${w.open_assignments} open)` : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          label={`Units (${unit})`}
          required
          hint={remaining != null ? `${remaining} of ${task.target_quantity} ${unit} still unassigned.` : "The task has no countable target; give the worker a number anyway."}
        >
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />}
        </Field>
        <Field label="Due">
          {(id) => <input id={id} className={inputCls} type="date" value={due} onChange={(e) => setDue(e.target.value)} />}
        </Field>
        <Field label="Instructions" span hint="Shown on the worker's phone with the task's own instructions.">
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- gate 1: the supplier's own verdict on one worker's batch ------------------ */

export interface DecideTarget {
  id: string;
  quantity: number;
  worker_name: string | null;
  worker_note: string | null;
  task_ref: string;
  task_title: string;
}

export function DecideAssignmentDialog({
  target,
  onClose,
  onDone,
}: {
  target: DecideTarget;
  onClose: () => void;
  onDone: (outcome: "accept" | "reject") => void;
}) {
  const qc = useQueryClient();
  const assets = useAssignmentAssets(target.id);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ready = (assets.data ?? []).filter((a) => a.status === "ready");

  const decide = useMutation({
    mutationFn: (outcome: "accept" | "reject") =>
      post(`/assignments/${target.id}/decide`, { outcome, note: note || null }),
    onSuccess: (_d, outcome) => {
      void qc.invalidateQueries();
      onDone(outcome);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not record the verdict"),
  });

  return (
    <Dialog
      size="wide"
      title={`Review ${target.worker_name ?? "the worker"}'s batch`}
      sub={`${target.task_ref} · ${target.task_title} · ${ready.length} of ${target.quantity} ready`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={decide.isPending || !note.trim()} title={note.trim() ? undefined : "Say what must be retaken"} onClick={() => decide.mutate("reject")}>
            Send back
          </Button>
          <Button variant="success" disabled={decide.isPending} onClick={() => decide.mutate("accept")}>
            Accept
          </Button>
        </>
      }
    >
      {target.worker_note && <Callout title="Worker's note">{target.worker_note}</Callout>}
      <div style={{ marginTop: 12 }}>
        <AssetGallery
          assets={assets.data ?? []}
          loading={assets.isLoading}
          emptyHint="Nothing has been uploaded on this assignment."
        />
      </div>
      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field label="Verdict note" span hint="Required to send back — the worker cannot act on a blank rejection.">
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Retake aisle 3 with less glare." />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- the task's workers: progress, gate 1, cancel, reopen ---------------------- */

export function TaskAssignmentsDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const qc = useQueryClient();
  const rows = useTaskAssignments(task.id);
  const taskAssets = useTaskAssets(task.id);
  const [assigning, setAssigning] = useState(false);
  const [deciding, setDeciding] = useState<Assignment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: (v: { id: string; action: "cancel" | "reopen" }) => post(`/assignments/${v.id}/${v.action}`, {}),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not update the assignment"),
  });

  if (assigning) {
    return <AssignWorkersDialog task={task} onClose={() => setAssigning(false)} onDone={() => setAssigning(false)} />;
  }
  if (deciding) {
    return (
      <DecideAssignmentDialog
        target={{
          id: deciding.id, quantity: deciding.quantity, worker_name: deciding.worker_name,
          worker_note: deciding.worker_note, task_ref: task.reference_code, task_title: task.title,
        }}
        onClose={() => setDeciding(null)}
        onDone={() => setDeciding(null)}
      />
    );
  }

  const list = rows.data ?? [];
  const live = list.filter((a) => a.status !== "cancelled");
  const awaiting = list.filter((a) => a.status === "submitted").length;
  const unitsAssigned = live.reduce((s, a) => s + a.quantity, 0);
  const ready = list.reduce((s, a) => s + a.assets.ready, 0);
  const canAssign = ["assigned", "in_progress", "qa_failed"].includes(task.status);
  const unit = task.target_unit ?? "units";

  return (
    <Dialog
      size="wide"
      title="Workers on this task"
      sub={`${task.reference_code} · ${task.title}`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" disabled={!canAssign} title={canAssign ? undefined : `A ${task.status.replace("_", " ")} task cannot take new assignments`} onClick={() => setAssigning(true)}>
            Assign a worker
          </Button>
        </>
      }
    >
      <div className="g4">
        <Metric label="Workers" value={live.length} />
        <Metric label={`${unit} assigned`} value={task.target_quantity != null ? `${unitsAssigned} / ${task.target_quantity}` : unitsAssigned} />
        <Metric label="Captures ready" value={ready} />
        <Metric label="Awaiting your review" value={awaiting} />
      </div>
      {list.length === 0 ? (
        <Empty title="No workers assigned yet" hint="Split the task among your crowd; each worker captures on their phone." />
      ) : (
        <TableWrap>
          <table>
            <thead><tr><th>Worker</th><th>Units</th><th>Progress</th><th>Status</th><th>Submitted</th><th>Note</th><th /></tr></thead>
            <tbody>
              {list.map((a) => {
                const m = statusMeta(assignmentStatus, a.status);
                const pct = a.quantity ? Math.min(100, Math.round((100 * a.assets.ready) / a.quantity)) : 0;
                return (
                  <tr key={a.id}>
                    <td className="cell-primary">{a.worker_name ?? "—"}<div className="cell-meta id">{a.worker_ref ?? ""}</div></td>
                    <td className="num">{a.quantity}</td>
                    <td style={{ minWidth: 140 }}>
                      <Meter pct={pct} tone={pct >= 100 ? "success" : undefined} />
                      <div className="cell-meta">{a.assets.ready} ready{a.assets.pending ? ` · ${a.assets.pending} uploading` : ""}{a.assets.quarantined ? ` · ${a.assets.quarantined} quarantined` : ""}</div>
                    </td>
                    <td><Pill tone={m.tone}>{m.label}</Pill></td>
                    <td className="num">{a.submitted_at ? fmtDateTime(a.submitted_at) : fmtDate(a.due_on) === "—" ? "—" : `due ${fmtDate(a.due_on)}`}</td>
                    <td style={{ maxWidth: 240 }} className="small muted">{a.status === "rejected" ? a.decision_note : a.worker_note ?? "—"}</td>
                    <td className="right"><div className="rowactions">
                      {a.status === "submitted" && (
                        <Button size="sm" variant="primary" onClick={() => setDeciding(a)}>Review</Button>
                      )}
                      {OPEN.has(a.status) && a.status !== "submitted" && (
                        <Button size="sm" variant="danger" disabled={act.isPending} onClick={() => act.mutate({ id: a.id, action: "cancel" })}>Cancel</Button>
                      )}
                      {a.status === "accepted" && task.status === "qa_failed" && (
                        <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ id: a.id, action: "reopen" })}>Send back</Button>
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
      {error && <Callout tone="critical" title={error} />}
      <div style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Captured so far</div>
        <AssetGallery assets={taskAssets.data ?? []} loading={taskAssets.isLoading} emptyHint="Files uploaded from the capture app appear here as they are confirmed." />
      </div>
    </Dialog>
  );
}

/* --- bundle the accepted captures and hand the task to the partner ------------ */

export function SubmitToPartnerDialog({ task, onClose, onDone }: { task: Task; onClose: () => void; onDone: () => void }) {
  const rows = useTaskAssignments(task.id);
  const assets = useTaskAssets(task.id);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const list = (rows.data ?? []).filter((a) => a.status !== "cancelled");
  const accepted = new Set(list.filter((a) => a.status === "accepted").map((a) => a.id));
  const open = list.filter((a) => a.status !== "accepted");
  const bundled = (assets.data ?? []).filter((a) => a.status === "ready" && a.assignment_id && accepted.has(a.assignment_id)).length;
  const blocked = open.length > 0 || bundled === 0;

  const submit = useMutation({
    mutationFn: () => post(`/tasks/${task.id}/submit`, { note: note || null }),
    onSuccess: onDone,
    onError: (e) => setError(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <Dialog
      title={`Submit ${task.reference_code} to your delivery partner`}
      sub={task.title}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={blocked || submit.isPending || rows.isLoading} onClick={() => submit.mutate()}>
            Submit for partner QA
          </Button>
        </>
      }
    >
      <div className="g2">
        <Metric label="Captures in this submission" value={bundled} sub="ready files from accepted assignments" />
        <Metric label="Assignments" value={`${accepted.size} accepted`} sub={open.length ? `${open.length} still open` : "none open"} />
      </div>
      {open.length > 0 && (
        <Callout tone="attention" title="Review every worker first">
          {open.length} assignment{open.length === 1 ? " is" : "s are"} not accepted yet. Accept or cancel them at gate 1, then submit.
        </Callout>
      )}
      {open.length === 0 && bundled === 0 && !assets.isLoading && (
        <Callout tone="attention" title="Nothing to submit">No accepted assignment has ready captures.</Callout>
      )}
      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field label="Note to QA" span hint="Your account of the work — it is never overwritten by the verdict.">
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}
