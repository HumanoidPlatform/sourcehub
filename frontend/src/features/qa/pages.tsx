// qa — the partner's review queue: gate 2 verdicts, one row per attempt.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { get, post } from "@api/client";
import type { QaQueueRow } from "@api/types";
import {
  Button, Callout, Dialog, Empty, Field, Metric, Panel, TableWrap, textareaCls, useToast, View,
} from "@ds/primitives";
import { fmtDateTime } from "@shared/format";

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

  const decide = useMutation({
    mutationFn: (outcome: "pass" | "fail") =>
      post(`/qa/submissions/${row.submission_id}/decide`, { outcome, note: note || null }),
    onSuccess: (_d, outcome) => onDone(outcome),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not record the verdict"),
  });

  return (
    <Dialog
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
