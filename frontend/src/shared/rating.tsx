// Ratings — the one dialog and the one formatter every screen shares.
//
// Four kinds share one table (db/380_ratings.sql). The database works out who
// rates whom from the subject, so the dialog posts only a score and a comment
// to the subject's own URL; a wrong rater, a wrong state or a repeat comes
// back as a 409 carrying the database's sentence, shown as it is. A rating is
// never edited, and the dialog says so before the button is pressed.
//
// The URLs are written out one by one, not built from a prop: a test walks
// the console's literals to check every path it calls exists on the API.

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { post } from "@api/client";
import type { RatingKind } from "@api/types";
import { Button, Callout, Dialog, Field, inputCls, textareaCls, useToast } from "@ds/primitives";
import { COMPANY } from "@shared/brand";

/** The minimum the API enforces (network.RATING_COMMENT_MIN); a test keeps the two equal. */
export const RATING_COMMENT_MIN = 3;

/** "★ 4.3 (7)", or the honest alternative: no ratings is not a score of zero. */
export function stars(avg: number | string | null | undefined, count?: number | null): string {
  const n = typeof avg === "string" ? Number(avg) : avg;
  if (n == null || Number.isNaN(n) || !count) return "No ratings yet";
  return `★ ${n.toFixed(1)} (${count})`;
}

export const RATING_LABEL: Record<RatingKind, string> = {
  client_partner: "Client → Delivery partner",
  partner_client: "Delivery partner → Client",
  partner_supplier: "Delivery partner → Supplier",
  supplier_worker: "Supplier → Crowd resource",
};

export const SCORES: [string, string][] = [
  ["5", "5 — Excellent"],
  ["4", "4 — Good"],
  ["3", "3 — Fair"],
  ["2", "2 — Poor"],
  ["1", "1 — Unacceptable"],
];

export function ScoreField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          {SCORES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      )}
    </Field>
  );
}

/** Who is being rated, and the subject the rating hangs on. */
export type RateTarget =
  | { kind: "client"; contractId: string; name: string }
  | { kind: "supplier"; taskId: string; taskRef: string; name: string }
  | { kind: "worker"; assignmentId: string; name: string };

function privacy(t: RateTarget): string {
  switch (t.kind) {
    case "client":
      return `Seen by ${t.name} and ${COMPANY} operations. Other delivery partners see only ${t.name}'s average.`;
    case "supplier":
      return `Seen by ${t.name} and ${COMPANY} operations. Their average shows to you and to operations.`;
    case "worker":
      return `Seen only by your organisation and ${COMPANY} operations — never by ${t.name}, never by your delivery partner.`;
  }
}

function heading(t: RateTarget): { title: string; prompt: string } {
  switch (t.kind) {
    case "client":
      return { title: `Rate ${t.name}`, prompt: "How was this client to work for?" };
    case "supplier":
      return { title: `Rate ${t.name}`, prompt: `How did they deliver ${t.taskRef}?` };
    case "worker":
      return { title: `Rate ${t.name}`, prompt: "How was this assignment done?" };
  }
}

export function RateDialog({ target, onClose, onDone }: { target: RateTarget; onClose: () => void; onDone?: () => void }) {
  const [score, setScore] = useState("5");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();
  const ok = comment.trim().length >= RATING_COMMENT_MIN;
  const body = () => ({ score: Number(score), comment: comment.trim() });

  const rate = useMutation({
    mutationFn: () => {
      switch (target.kind) {
        case "client":
          return post(`/contracts/${target.contractId}/rating`, body());
        case "supplier":
          return post(`/tasks/${target.taskId}/rating`, body());
        case "worker":
          return post(`/assignments/${target.assignmentId}/rating`, body());
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Rating saved", `${target.name} rated ${score}/5.`, "success");
      onDone?.();
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save the rating"),
  });

  const h = heading(target);
  return (
    <Dialog
      title={h.title}
      sub="A rating cannot be changed once saved."
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="success"
            disabled={!ok || rate.isPending}
            title={ok ? undefined : `Say something — at least ${RATING_COMMENT_MIN} characters`}
            onClick={() => rate.mutate()}
          >
            Save rating
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <ScoreField label={h.prompt} value={score} onChange={setScore} />
        <Field label="Comment" required span hint={`${privacy(target)} At least ${RATING_COMMENT_MIN} characters.`}>
          {(id) => <textarea id={id} className={textareaCls} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}
