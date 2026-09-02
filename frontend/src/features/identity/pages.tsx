// identity — login, org choice, invitation acceptance, password reset,
// forced password change.

import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { get, post, saveSession, type Session } from "@api/client";
import { Button, Callout, Field, inputCls, useToast } from "@ds/primitives";
import { useAuth, type OrgChoice } from "@shared/auth";

function AuthFrame({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--ground)", padding: 24 }}>
      <div className="panel" style={{ width: 420, maxWidth: "100%" }}>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="mark">
            <span className="mark-glyph" aria-hidden="true">S</span>
            <span className="mark-name">SourceHub</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 19 }}>{title}</h1>
            {sub && <p className="small muted" style={{ margin: "4px 0 0" }}>{sub}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgs, setOrgs] = useState<OrgChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent, orgId?: string) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const choice = await login(email, password, orgId);
      if (choice) setOrgs(choice);
      else navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  if (orgs) {
    return (
      <AuthFrame title="Choose a workspace" sub="Your account belongs to more than one organisation.">
        <div className="col" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orgs.map((o) => (
            <button
              key={o.org_id}
              type="button"
              className="btn"
              style={{ justifyContent: "space-between", height: "auto", padding: "10px 13px" }}
              onClick={(e) => void submit(e as unknown as FormEvent, o.org_id)}
            >
              <span>{o.org_name}</span>
              <span className="chip">{o.role_code}</span>
            </button>
          ))}
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Sign in" sub="The demo seed uses SourceHub#2026 for every account.">
      <form onSubmit={(e) => void submit(e)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Email" required>
          {(id) => (
            <input id={id} className={inputCls} type="text" autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Field>
        <Field label="Password" required>
          {(id) => (
            <input id={id} className={inputCls} type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
        {error && <Callout tone="critical" title={error} />}
        <Button variant="primary" disabled={busy || !email || !password} onClick={undefined} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <button
          type="button"
          className="btn"
          data-variant="quiet"
          onClick={() => navigate("/reset-password")}
        >
          Forgotten password?
        </button>
      </form>
    </AuthFrame>
  );
}

export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = useMutation({
    mutationFn: () =>
      get<{ email: string; org_name: string; role_code: string; valid: boolean }>(
        `/auth/invitation/${token}`,
      ),
  });
  if (token && preview.isIdle) preview.mutate();

  const accept = useMutation({
    mutationFn: () => post("/auth/invitation/accept", { token, password }),
    onSuccess: () => {
      toast("Welcome to SourceHub", "Your password is set — sign in to begin.", "success");
      navigate("/login");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not accept"),
  });

  const p = preview.data;
  return (
    <AuthFrame
      title="Accept your invitation"
      sub={p ? `${p.org_name} · signing in as ${p.email}` : "Checking the invitation…"}
    >
      {p && !p.valid && (
        <Callout tone="critical" title="This invitation is no longer valid">
          Ask your platform administrator to resend it.
        </Callout>
      )}
      {p?.valid && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 10) return setError("Use at least 10 characters.");
            if (password !== confirm) return setError("Passwords do not match.");
            setError(null);
            accept.mutate();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Field label="Choose a password" required hint="At least 10 characters. Nobody at SourceHub ever sees it.">
            {(id) => (
              <input id={id} className={inputCls} type="password" autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <Field label="Repeat it" required>
            {(id) => (
              <input id={id} className={inputCls} type="password" autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            )}
          </Field>
          {error && <Callout tone="critical" title={error} />}
          <Button variant="primary" type="submit" disabled={accept.isPending}>
            {accept.isPending ? "Setting up…" : "Set password and finish"}
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthFrame title="Reset your password" sub="We will email a one-hour link to Mailpit (localhost:8025 in development).">
        {sent ? (
          <Callout tone="success" title="If that address exists, a link is on its way." />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void post("/auth/password-reset/request", { email }).then(() => setSent(true));
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Field label="Email" required>
              {(id) => (
                <input id={id} className={inputCls} value={email}
                  onChange={(e) => setEmail(e.target.value)} />
              )}
            </Field>
            <Button variant="primary" type="submit" disabled={!email}>Send reset link</Button>
          </form>
        )}
        <button type="button" className="btn" data-variant="quiet" onClick={() => navigate("/login")}>
          Back to sign in
        </button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Choose a new password">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void post("/auth/password-reset/confirm", { token, password })
            .then(() => {
              toast("Password changed", "Sign in with the new one.", "success");
              navigate("/login");
            })
            .catch((err: Error) => setError(err.message));
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <Field label="New password" required hint="At least 10 characters.">
          {(id) => (
            <input id={id} className={inputCls} type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
        {error && <Callout tone="critical" title={error} />}
        <Button variant="primary" type="submit" disabled={password.length < 10}>
          Change password
        </Button>
      </form>
    </AuthFrame>
  );
}

/** Shown as a blocking screen while must_change_password is set. */
export function ForcedPasswordChange({ session }: { session: Session }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  return (
    <AuthFrame
      title="Change your password"
      sub="This account was provisioned with a temporary password. Set your own to continue."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void post("/auth/change-password", { current_password: current, new_password: next })
            .then(() => {
              saveSession({ ...session, must_change_password: false });
              toast("Password changed", undefined, "success");
              window.location.reload();
            })
            .catch((err: Error) => setError(err.message));
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <Field label="Current password" required>
          {(id) => (
            <input id={id} className={inputCls} type="password" value={current}
              onChange={(e) => setCurrent(e.target.value)} />
          )}
        </Field>
        <Field label="New password" required hint="At least 10 characters.">
          {(id) => (
            <input id={id} className={inputCls} type="password" value={next}
              onChange={(e) => setNext(e.target.value)} />
          )}
        </Field>
        {error && <Callout tone="critical" title={error} />}
        <Button variant="primary" type="submit" disabled={next.length < 10 || !current}>
          Change password
        </Button>
      </form>
    </AuthFrame>
  );
}
