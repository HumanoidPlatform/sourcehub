// Changing your own password, reached from the account menu.
//
// POST /auth/change-password has always existed, but the only screen that
// called it was ForcedPasswordChange, for an account provisioned with a
// temporary password. A signed-in user who simply wanted a new password had no
// way to set one short of the reset-by-email flow.

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { post } from "@api/client";
import { Button, Callout, Dialog, Field, inputCls, useToast } from "@ds/primitives";

// Mirrors ChangePasswordIn.new_password = Field(min_length=10) in
// backend/src/sourcehub/api/v1/auth.py, so the form refuses what the server would.
const MIN_LENGTH = 10;

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const formId = useId();

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const unchanged = next.length > 0 && next === current;
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = current.length > 0 && next.length >= MIN_LENGTH && !unchanged && confirm === next;

  const submit = () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    post("/auth/change-password", { current_password: current, new_password: next })
      .then(() => {
        toast("Password changed", "Use the new one the next time you sign in.", "success");
        onClose();
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not change the password."))
      .finally(() => setBusy(false));
  };

  // Portalled to <body>. This is opened from the account menu, which lives in
  // the topbar — position:sticky with z-index:50, a stacking context of its own.
  // Rendered in place, the dialog and its backdrop would be trapped in that
  // layer and draw UNDER the sidebar (.rail is z-index:60). Every other dialog
  // in the app renders inside <main>, which forms no such context.
  return createPortal(
    <Dialog
      title="Change password"
      onClose={onClose}
      busy={busy}
      foot={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} disabled={!ready || busy}>
            {busy ? "Changing…" : "Change password"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="formgrid"
      >
        {/* The autoComplete hints are what let a password manager offer to fill
            the current password and save the new one. */}
        <Field label="Current password" required span>
          {(id) => (
            <input id={id} className={inputCls} type="password" autoComplete="current-password"
              value={current} onChange={(e) => setCurrent(e.target.value)} />
          )}
        </Field>
        <Field
          label="New password"
          required
          span
          hint={`At least ${MIN_LENGTH} characters.`}
          error={tooShort ? `At least ${MIN_LENGTH} characters.` : unchanged ? "Choose a password you are not already using." : null}
        >
          {(id) => (
            <input id={id} className={inputCls} type="password" autoComplete="new-password"
              value={next} onChange={(e) => setNext(e.target.value)} />
          )}
        </Field>
        <Field label="Confirm new password" required span error={mismatch ? "The two passwords do not match." : null}>
          {(id) => (
            <input id={id} className={inputCls} type="password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          )}
        </Field>
      </form>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>,
    document.body,
  );
}
