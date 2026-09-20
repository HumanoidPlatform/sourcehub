// Confirm an action that must carry a reason — removing a supplier, rejecting a
// request.
//
// Replaces window.prompt, which these actions used: unstyled, unlike every other
// dialog in the console, and unvalidated, so a one- or two-character reason went
// to a server that requires three and came back as a raw 422.
//
// The dialog owns its errors and shows them inline, where the user is looking,
// and stays open so they can correct and retry. A caller should therefore NOT
// also toast failures for the mutation it hands in here, or a failure is
// reported twice.

import { useState, type ReactNode } from "react";
import { Button, Callout, Dialog, Field, textareaCls } from "@ds/primitives";

export function ReasonDialog({
  title,
  warning,
  confirmLabel,
  tone = "danger",
  minLength = 3,
  onConfirm,
  onClose,
}: {
  title: string;
  /** What happens if they go ahead. Shown above the reason. */
  warning?: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  /** Mirror the server's rule so the form refuses what the server would. */
  minLength?: number;
  /** Resolves when the action succeeded; the dialog then closes. */
  onConfirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = () => {
    const r = reason.trim();
    if (r.length < minLength) {
      setError("Give a reason — a few words the other party can act on.");
      return;
    }
    setBusy(true);
    setError(null);
    onConfirm(r)
      .then(onClose)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "That did not go through."))
      .finally(() => setBusy(false));
  };

  return (
    <Dialog
      title={title}
      onClose={onClose}
      busy={busy}
      foot={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={tone} onClick={confirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {warning && <Callout tone={tone === "danger" ? "critical" : "attention"} title="What this does">{warning}</Callout>}
      <div className="formgrid" style={{ marginTop: warning ? 12 : 0 }}>
        <Field label="Reason" required span hint="Recorded, and shown to the other party.">
          {(id) => (
            <textarea
              id={id}
              className={textareaCls}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
            />
          )}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}
