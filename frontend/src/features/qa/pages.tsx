// qa — two review queues. The delivery partner's gate 2 (one row per
// submission attempt) and the supplier's own gate 1 (one row per worker
// batch). Verdicts are appended, never edited: the gate that catches a
// defect decides who absorbs the rework.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { Gate1Row, QaQueueRow } from "@api/types";
import {
  Button, Callout, Dialog, Empty, Field, Metric, Panel, TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import { fmtDateTime } from "@shared/format";
import { AssetGallery, useTaskAssets } from "@features/delivery/components/AssetGallery";
import { DecideAssignmentDialog } from "@features/delivery/components/assignments";

/* --- gate 2: the delivery partner reviews a submission ------------------------ */

export function QaQueuePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [deciding, setDeciding] = useState<QaQueueRow | null>(null);

  const queue = useQuery({ queryKey: ["qa-queue"], queryFn: () => get<QaQueueRow[]>("/qa/queue") });
  const rows = queue.data ?? [];

  return (
    <View
      title="QA and delivery"
      sub="Gate 2. The gate that catches a defect decides who absorbs the rework — verdicts are appended, never edited."
    >
      <div className="g3">
        <Metric label="Awaiting review" value={rows.length} />
        <Metric label="Assets queued" value={rows.reduce((s, r) => s + r.asset_count, 0)} />
        <Metric label="Oldest wait" value={rows.length ? fmtDateTime(rows[0]!.submitted_at) : "—"} />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <Empty title="The queue is clear" hint="Suppliers' submissions land here for your verdict." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Task</th><th>Supplier</th><th>Attempt</th><th>Assets</th><th>Supplier note</th><th>Submitted</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.submission_id}>
                    <td className="cell-primary">{r.task_title}<div className="cell-meta id">{r.task_ref} · {r.contract_ref}</div></td>
                    <td>{r.supplier_name}</td>
                    <td className="num">{r.attempt_no}</td>
                    <td className="num">{r.asset_count}</td>
                    <td style={{ maxWidth: 300 }} className="small">{r.supplier_note ?? "—"}</td>
                    <td className="num">{fmtDateTime(r.submitted_at)}</td>
                    <td className="rowactions">
                      <Button size="sm" variant="primary" onClick={() => setDeciding(r)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {deciding && (
        <DecideDialog
          row={deciding}
          onClose={() => setDeciding(null)}
          onDone={(outcome) => {
            setDeciding(null);
            void qc.invalidateQueries();
            toast(
              outcome === "pass" ? "QA passed" : "Sent back for rework",
              outcome === "pass" ? "Ready to include in the delivery." : "The supplier has been notified.",
              outcome === "pass" ? "success" : "critical",
            );
          }}
        />
      )}
    </View>
  );
}

function DecideDialog({ row, onClose, onDone }: { row: QaQueueRow; onClose: () => void; onDone: (o: string) => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const assets = useTaskAssets(row.task_id);
  // the captures bundled into THIS attempt; a count-only submission has none
  const bundled = (assets.data ?? []).filter((a) => a.submission_id === row.submission_id);

  const decide = useMutation({
    mutationFn: (outcome: "pass" | "fail") =>
      post(`/qa/submissions/${row.submission_id}/decide`, { outcome, note: note || null }),
    onSuccess: (_d, outcome) => onDone(outcome),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not record the verdict"),
  });

  return (
    <Dialog
      size="wide"
      title={`Review ${row.task_ref}, attempt ${row.attempt_no}`}
      sub={`${row.supplier_name} · ${row.asset_count} assets`}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={decide.isPending} onClick={() => decide.mutate("fail")}>
            Fail — send back
          </Button>
          <Button variant="success" disabled={decide.isPending} onClick={() => decide.mutate("pass")}>
            Pass
          </Button>
        </>
      }
    >
      {row.supplier_note && (
        <Callout title="Supplier's note">{row.supplier_note}</Callout>
      )}
      {(bundled.length > 0 || assets.isLoading) && (
        <div style={{ marginTop: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Captures in this submission</div>
          <AssetGallery assets={bundled} loading={assets.isLoading} />
        </div>
      )}
      <div className="formgrid" style={{ marginTop: 12 }}>
        <Field
          label="Verdict note"
          span
          hint="Required on failure — say what must change; the supplier cannot act on a blank rejection."
        >
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

/* --- gate 1: the supplier reviews its own workers' batches ------------------- */

export function Gate1Page() {
  const toast = useToast();
  const [deciding, setDeciding] = useState<Gate1Row | null>(null);

  const queue = useQuery({ queryKey: ["gate1"], queryFn: () => get<Gate1Row[]>("/qa/gate1") });
  const rows = queue.data ?? [];

  return (
    <View
      title="Review"
      sub="Gate 1. Accept a worker's batch to include it in your submission; a rejection must say what to re-capture."
    >
      <div className="g3">
        <Metric label="Awaiting your review" value={rows.length} />
        <Metric label="Captures ready" value={rows.reduce((s, r) => s + r.ready_assets, 0)} />
        <Metric label="Oldest wait" value={rows.length ? fmtDateTime(rows[0]!.submitted_at) : "—"} />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <Empty title="Nothing to review" hint="A worker's batch lands here when they submit from the app." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Task</th><th>Worker</th><th>Units</th><th>Ready</th><th>Worker note</th><th>Submitted</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.assignment_id}>
                    <td className="cell-primary">{r.task_title}<div className="cell-meta id">{r.task_ref}</div></td>
                    <td>{r.worker_name ?? "—"}<div className="cell-meta id">{r.worker_ref ?? ""}</div></td>
                    <td className="num">{r.quantity}</td>
                    <td className="num">{r.ready_assets}</td>
                    <td style={{ maxWidth: 300 }} className="small">{r.worker_note ?? "—"}</td>
                    <td className="num">{fmtDateTime(r.submitted_at)}</td>
                    <td className="rowactions">
                      <Button size="sm" variant="primary" onClick={() => setDeciding(r)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {deciding && (
        <DecideAssignmentDialog
          target={{
            id: deciding.assignment_id, quantity: deciding.quantity, worker_name: deciding.worker_name,
            worker_note: deciding.worker_note, task_ref: deciding.task_ref, task_title: deciding.task_title,
          }}
          onClose={() => setDeciding(null)}
          onDone={(outcome) => {
            setDeciding(null);
            toast(
              outcome === "accept" ? "Batch accepted" : "Sent back to the worker",
              outcome === "accept" ? "It will be bundled when you submit the task." : "They can see your note in the app.",
              outcome === "accept" ? "success" : "critical",
            );
          }}
        />
      )}
    </View>
  );
}
