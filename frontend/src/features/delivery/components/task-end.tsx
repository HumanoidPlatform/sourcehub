// Ending a task before it passes QA (db/600): the supplier declines it or hands
// it back, the partner withdraws it or moves it to another supplier. Also the
// supplier picker both the Assign and the Move dialogs use, with what the
// partner has seen of each supplier: rating, open tasks, its QA pass rate.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { get, post } from "@api/client";
import type { Org, SupplierStats, Task, TaskEndKind } from "@api/types";
import { Button, Callout, Dialog, Field, inputCls, textareaCls, useToast } from "@ds/primitives";
import { fmtDate } from "@shared/format";
import { quantityWords } from "@shared/pricing";
import { ReasonDialog } from "@shared/reason-dialog";

/* --- what an ended task says ---------------------------------------------------- */

const ENDED_AS: Record<TaskEndKind, string> = {
  declined: "Declined",
  returned: "Handed back",
  withdrawn: "Withdrawn",
  moved: "Moved",
  contract_ended: "Ended with the contract",
};

/** "Declined by Bengaluru Crowd Collective" */
export function endedLabel(t: Task): string | null {
  if (!t.ended) return null;
  const by = t.ended.by_org_name && t.ended.kind !== "contract_ended" ? ` by ${t.ended.by_org_name}` : "";
  return `${ENDED_AS[t.ended.kind]}${by}`;
}

/** Under the status pill in a task list: how it ended and why, or what it replaces. */
export function TaskEndNote({ t }: { t: Task }) {
  if (t.ended) {
    return (
      <div className="cell-meta" title={t.ended.reason}>
        {endedLabel(t)}
        {t.moved_to ? ` → ${t.moved_to.reference_code}` : ""}
      </div>
    );
  }
  if (t.replaces) return <div className="cell-meta">Replaces {t.replaces.reference_code}</div>;
  return null;
}

/** Rows for a task's detail dialog. */
export function endedRows(t: Task): [string, ReactNode][] {
  const rows: [string, ReactNode][] = [];
  if (t.ended) {
    rows.push(["Ended", `${endedLabel(t)} · ${fmtDate(t.ended.at)}`]);
    rows.push(["Why", t.ended.reason]);
    if (t.moved_to) rows.push(["Now", `${t.moved_to.reference_code}, with another supplier`]);
  }
  if (t.replaces) rows.push(["Replaces", `${t.replaces.reference_code}, moved from another supplier`]);
  return rows;
}

/** A task that has not passed QA and has not ended: the partner may still withdraw or move it. */
export function partnerMayEnd(t: Task): boolean {
  return !["qa_passed", "cancelled"].includes(t.status);
}

/** The supplier's way out: decline before anyone started, hand back until it is with the partner. */
export function supplierEnd(t: Task): "decline" | "return" | null {
  if (t.status === "assigned" && !t.started_at) return "decline";
  if (["assigned", "in_progress", "qa_failed"].includes(t.status)) return "return";
  return null;
}

/* --- the reason dialog for decline, hand back and withdraw ---------------------- */

type EndAction = "decline" | "return" | "withdraw";

const COPY: Record<EndAction, { title: string; confirm: string; done: string }> = {
  decline: { title: "Decline", confirm: "Decline task", done: "Declined" },
  return: { title: "Hand back", confirm: "Hand back task", done: "Handed back" },
  withdraw: { title: "Withdraw", confirm: "Withdraw task", done: "Withdrawn" },
};

/** What ending the task stops, in words, for the dialog's warning. */
function stops(t: Task, action: EndAction): ReactNode {
  const crowd = (t.assignment_summary?.total ?? 0) - (t.assignment_summary?.cancelled ?? 0);
  return (
    <>
      {action === "withdraw"
        ? `${t.assignee_name ?? "The supplier"} stops work on ${t.reference_code}, and is told why.`
        : `The delivery partner is told why, and can give ${t.reference_code} to someone else.`}{" "}
      Its open offer closes{crowd > 0 ? ", and anyone capturing for it is told to stop" : ""}.
      {action === "withdraw" && t.status === "submitted" && (
        <> A submission is waiting for your QA: it is set aside and will not count. Review it first if you want that work counted.</>
      )}
      {" "}This cannot be undone.
    </>
  );
}

export function EndTaskDialog({
  task, action, onClose,
}: { task: Task; action: EndAction; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const copy = COPY[action];
  return (
    <ReasonDialog
      title={`${copy.title} ${task.reference_code}`}
      warning={stops(task, action)}
      confirmLabel={copy.confirm}
      dismissLabel="Keep the task"
      minLength={3}
      onConfirm={async (reason) => {
        await post<Task>(`/tasks/${task.id}/${action}`, { reason });
        // a waiting submission is superseded: the partner's QA queue changes too
        for (const queryKey of [["tasks"], ["contract"], ["contracts"], ["activity"], ["overview"], ["supplier-stats"], ["qa-queue"]]) {
          void qc.invalidateQueries({ queryKey });
        }
        toast(copy.done, `${task.reference_code} has ended.`, "success");
      }}
      onClose={onClose}
    />
  );
}

/* --- the supplier picker -------------------------------------------------------- */

/** The partner's network, aggregators and businesses, with the figures it has on each. */
export function useSuppliers() {
  const aggs = useQuery({ queryKey: ["orgs", "aggregator"], queryFn: () => get<Org[]>("/organisations?kind=aggregator") });
  const bizs = useQuery({ queryKey: ["orgs", "business"], queryFn: () => get<Org[]>("/organisations?kind=business") });
  const stats = useQuery({ queryKey: ["supplier-stats"], queryFn: () => get<SupplierStats[]>("/suppliers/stats") });
  const byId = new Map((stats.data ?? []).map((s) => [s.org_id, s]));
  return { aggs, bizs, stats: byId };
}

/** "★ 4.2 · 3 open · 92% pass QA" — only what is known; a new supplier reads "new". */
export function supplierFigures(o: Org, s: SupplierStats | undefined): string {
  const parts: string[] = [];
  if (o.rating != null) parts.push(`★ ${o.rating.toFixed(1)}`);
  if (s?.open_tasks) parts.push(`${s.open_tasks} open`);
  if (s?.qa_pass_rate != null) parts.push(`${s.qa_pass_rate}% pass QA`);
  if (s?.handed_back) parts.push(`${s.handed_back} handed back`);
  return parts.length ? parts.join(" · ") : "new to you";
}

export function SupplierSelect({
  id, value, onChange, exclude,
}: { id: string; value: string; onChange: (v: string) => void; exclude?: string }) {
  const { aggs, bizs, stats } = useSuppliers();
  const a = (aggs.data ?? []).filter((o) => o.id !== exclude);
  const b = (bizs.data ?? []).filter((o) => o.id !== exclude);
  return (
    <select id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose a supplier…</option>
      {a.length > 0 && (
        <optgroup label="Aggregators">
          {a.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {(o.profile.crowd_size as number) ?? "?"} crowd resources · {supplierFigures(o, stats.get(o.id))}
            </option>
          ))}
        </optgroup>
      )}
      {b.length > 0 && (
        <optgroup label="Business partners">
          {b.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {(o.profile.specialty as string) ?? ""} · {supplierFigures(o, stats.get(o.id))}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

/* --- move ------------------------------------------------------------------------ */

export function MoveTaskDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [to, setTo] = useState("");
  const [qty, setQty] = useState(task.target_quantity != null ? String(task.target_quantity) : "");
  const [due, setDue] = useState(task.due_on ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const move = useMutation({
    mutationFn: () =>
      post<{ ended: Task; task: Task }>(`/tasks/${task.id}/move`, {
        assignee_org_id: to,
        reason: reason.trim(),
        target_quantity: qty ? Number(qty) : null,
        due_on: due || null,
      }),
    onSuccess: (r) => {
      for (const queryKey of [["contract"], ["contracts"], ["activity"], ["overview"], ["supplier-stats"], ["qa-queue"]]) {
        void qc.invalidateQueries({ queryKey });
      }
      toast("Moved", `${task.reference_code} ended; ${r.task.reference_code} is with ${r.task.assignee_name ?? "the new supplier"}.`, "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not move the task"),
  });

  const missing = !to ? "Choose a supplier" : reason.trim().length < 3 ? "Say why" : undefined;
  return (
    <Dialog
      title={`Move ${task.reference_code} to another supplier`}
      sub={task.title}
      onClose={onClose}
      busy={move.isPending}
      foot={
        <>
          <Button onClick={onClose} disabled={move.isPending}>Keep it where it is</Button>
          <Button variant="primary" disabled={!!missing || move.isPending} title={missing} onClick={() => move.mutate()}>
            Move task
          </Button>
        </>
      }
    >
      <Callout tone="attention" title="What this does">
        {task.reference_code} ends with {task.assignee_name ?? "its supplier"}, who is told why; its open offer
        closes and anyone capturing for it is told to stop. A new task with the same brief, capture rules and files
        goes to the supplier you choose. Captures already sent stay with the old task and do not carry over.
        {task.status === "submitted" && " A submission waiting for your QA is set aside: review it first if you want that work counted."}
      </Callout>
      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field label="Reason" required span hint="Recorded, and shown to the supplier it is taken from.">
          {(id) => (
            <textarea id={id} className={textareaCls} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} />
          )}
        </Field>
        <Field label="Move to" required span hint="Your network, with what you have seen of each: rating, open tasks with you, how often its work passed your QA.">
          {(id) => <SupplierSelect id={id} value={to} onChange={setTo} exclude={task.assignee_org_id} />}
        </Field>
        <Field label="Target" hint={task.target_quantity != null ? `Was ${quantityWords(task.target_quantity, task.target_unit)}.` : undefined}>
          {(id) => (
            <input
              id={id} className={inputCls} type="number"
              min={task.target_unit === "hours" ? 0.01 : 1} step={task.target_unit === "hours" ? 0.01 : 1}
              value={qty} onChange={(e) => setQty(e.target.value)}
            />
          )}
        </Field>
        <Field label="Due date">
          {(id) => <input id={id} className={inputCls} type="date" value={due} onChange={(e) => setDue(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}
