// identity — login, org choice, invitation acceptance, password reset,
// forced password change, the Terms gate, and a crowd resource answering a
// task offer from a link.

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, get, post, refreshSession, saveSession, type Session } from "@api/client";
import type { OfferPreview } from "@api/types";
import { Button, Callout, Dl, Field, inputCls, useToast } from "@ds/primitives";
import { TermsAcceptance, useCurrentTerms } from "@features/legal/terms";
import { fmtDate, fmtDateTime } from "@shared/format";
import { returnPath, useAuth, type OrgChoice } from "@shared/auth";
import { BrandMark, CAPTURE_APP, PRODUCT } from "@shared/brand";

// The anonymous screens — sign in, invitation, reset, task offer. The only
// place the company is named alongside the product: whoever is at this door may
// never have heard of either, and the privacy notice belongs within reach of
// the form rather than behind a sign-in.
function AuthFrame({
  title, sub, wide, children,
}: { title: string; sub?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--ground)", padding: 24 }}>
      {/* wide: the screens that carry the Terms */}
      <div style={{ width: wide ? 640 : 420, maxWidth: "100%" }}>
        <div className="panel">
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BrandMark byline />
            <div>
              <h1 style={{ margin: 0, fontSize: 19 }}>{title}</h1>
              {sub && <p className="small muted" style={{ margin: "4px 0 0" }}>{sub}</p>}
            </div>
            {children}
          </div>
        </div>
        <p className="small muted" style={{ textAlign: "center", margin: "12px 0 0" }}>
          <Link to="/terms">Terms &amp; Conditions</Link> · <Link to="/privacy">Privacy notice</Link>
        </p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, ended } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  // an offer link hands over the address it was sent to; the password is
  // always typed here
  const [email, setEmail] = useState(params.get("email") ?? "");
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
      else navigate(returnPath(location.state), { replace: true });
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

  // No password hint here. This page answers on the public internet, and a
  // credential printed above the form is a credential published.
  return (
    <AuthFrame title="Sign in" sub="Use the email and password issued to you.">
      <form onSubmit={(e) => void submit(e)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* The sign-in page used to appear with no explanation when a session
            ended on its own, which reads as the console having crashed. */}
        {ended === "expired" && (
          <Callout tone="attention" title="Your session has expired">
            Sign in again to pick up where you left off.
          </Callout>
        )}
        {ended === "elsewhere" && (
          <Callout tone="neutral" title="You have been signed out">
            Your session ended in another tab or window. Sign in again to continue.
          </Callout>
        )}
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
  useSignOutForToken();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMutation({
    mutationFn: () =>
      get<{
        email: string; org_name: string; role_code: string; valid: boolean;
        // the Terms to accept with the password; null for a crowd worker's invitation
        terms: { version: string; title: string } | null;
      }>(`/auth/invitation/${token}`),
  });
  if (token && preview.isIdle) preview.mutate();
  const p = preview.data;
  const terms = useCurrentTerms();
  const asksTerms = Boolean(p?.valid && p.terms);

  const accept = useMutation({
    mutationFn: () =>
      post("/auth/invitation/accept", {
        token, password, terms_version: asksTerms ? terms.data?.version : undefined,
      }),
    onSuccess: () => {
      toast(`Welcome to ${PRODUCT}`, "Your password is set — sign in to begin.", "success");
      navigate("/login");
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Could not accept");
      // replaced while the page was open: show the new text, ask again
      if (e instanceof ApiError && e.status === 422 && asksTerms) {
        setAgreed(false);
        void terms.refetch();
      }
    },
  });

  return (
    <AuthFrame
      title="Accept your invitation"
      sub={p ? `${p.org_name} · signing in as ${p.email}` : "Checking the invitation…"}
      wide={asksTerms}
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
            if (asksTerms && !agreed) return setError("Accept the Terms & Conditions to finish.");
            setError(null);
            accept.mutate();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {asksTerms && terms.data && (
            <TermsAcceptance terms={terms.data} checked={agreed} onChange={setAgreed} />
          )}
          {asksTerms && terms.isError && (
            <Callout tone="critical" title="The Terms & Conditions could not be loaded">
              Reload the page to try again.
            </Callout>
          )}
          <Field label="Choose a password" required hint={`At least 10 characters. Nobody at ${PRODUCT} ever sees it.`}>
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
          <Button
            variant="primary"
            type="submit"
            disabled={accept.isPending || (asksTerms && (!agreed || !terms.data))}
          >
            {accept.isPending ? "Setting up…" : "Set password and finish"}
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}

// A task offer link is addressed to a person, not to a browser: whoever is
// signed in here is signed out first, so the page never renders inside
// somebody else's workspace and reads as theirs. The email's Accept and
// Decline both land here (mail scanners follow links); only the button on
// this page answers.
export function TaskOfferPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const intent = params.get("intent");
  useSignOutForToken();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);

  const preview = useQuery({
    queryKey: ["offer", token],
    queryFn: () => get<OfferPreview>(`/offers/${token}`),
    enabled: !!token,
    retry: false,
  });

  const respond = useMutation({
    mutationFn: (action: "accept" | "decline") =>
      post<{ state: "accepted" | "declined" }>(`/offers/${token}/respond`, { action }),
    onSuccess: (r) => setDone(r.state),
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Could not record your answer");
      void preview.refetch(); // the state has moved on: show why
    },
  });

  const p = preview.data;
  const notFound = preview.error instanceof ApiError && preview.error.status === 404;
  const signIn = p ? `/login?email=${encodeURIComponent(p.worker_email)}` : "/login";

  let body: React.ReactNode;
  if (!token || notFound) {
    body = <Callout tone="critical" title="This link is not valid">Ask the organisation that sent it to offer the task again.</Callout>;
  } else if (preview.isLoading || !p) {
    body = <p className="small muted">Checking the offer…</p>;
  } else if (done === "accepted") {
    body = (
      <>
        <Callout tone="success" title="You're on it">
          {p.task.reference_code} is now in your assignments. Open the {CAPTURE_APP} app to start, or sign in here to upload files.
        </Callout>
        <Link to={signIn} className="btn" data-variant="primary">Sign in as {p.worker_email}</Link>
      </>
    );
  } else if (done === "declined") {
    body = <Callout tone="neutral" title="Declined">Thanks for answering — {p.org_name} will offer the place to someone else.</Callout>;
  } else {
    const closed: Record<string, [string, string]> = {
      responded: [
        p.response === "accepted" ? "You already accepted" : "You already declined",
        p.responded_at ? `On ${fmtDateTime(p.responded_at)}.` : "",
      ],
      filled: ["This task is closed", "All places have been taken."],
      closed: ["This task is closed", `${p.org_name} withdrew the offer.`],
      expired: ["This task is closed", `The time to respond ended ${fmtDateTime(p.respond_by)}.`],
      task_closed: ["This task is no longer taking anyone", ""],
      not_a_worker: ["You are no longer active for this organisation", ""],
    };
    const c = closed[p.state];
    body = (
      <>
        <Dl
          rows={[
            ["Task", `${p.task.reference_code} — ${p.task.title}`],
            ["Your share", `${p.quantity} ${p.task.target_unit ?? "units"}`],
            ["Due", fmtDate(p.due_on ?? p.task.due_on)],
            ["Places", `${p.worker_limit}, first come first served`],
            ["Respond by", fmtDateTime(p.respond_by)],
            ...(p.instructions ? ([["Instructions", p.instructions]] as [string, React.ReactNode][]) : []),
          ]}
        />
        {c ? (
          <>
            <Callout tone={p.state === "responded" && p.response === "accepted" ? "success" : "attention"} title={c[0]}>{c[1]}</Callout>
            {p.state === "responded" && p.response === "accepted" && (
              <Link to={signIn} className="btn" data-variant="primary">Sign in as {p.worker_email}</Link>
            )}
          </>
        ) : (
          <>
            {error && <Callout tone="critical" title={error} />}
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                autoFocus={intent !== "decline"}
                variant="primary"
                disabled={respond.isPending}
                onClick={() => respond.mutate("accept")}
              >
                {respond.isPending ? "Sending…" : "Accept"}
              </Button>
              <Button
                autoFocus={intent === "decline"}
                variant="quiet"
                disabled={respond.isPending}
                onClick={() => respond.mutate("decline")}
              >
                Decline
              </Button>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <AuthFrame
      title={p ? `A task for ${p.worker_name}` : "A task for you"}
      sub={p ? `${p.org_name} · sent to ${p.worker_email}` : undefined}
    >
      {body}
    </AuthFrame>
  );
}

// An invitation or a reset link is addressed to a person, not to a browser.
// If someone is already signed in here, end that session before the token flow
// begins — otherwise the page renders behind a live session and finishing it
// leaves two identities half-applied.
function useSignOutForToken(): void {
  const { session, logout } = useAuth();
  useEffect(() => {
    if (session) void logout();
  }, [session, logout]);
}

export function ResetPasswordPage() {
  useSignOutForToken();
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

/**
 * Shown as a blocking screen while the Terms are due (db/470): to everyone
 * signed in before they existed, and to everyone again when a new version
 * takes effect. Accept, or sign out; the API answers nothing else meanwhile.
 */
export function ForcedTermsAcceptance() {
  const { logout } = useAuth();
  const terms = useCurrentTerms();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useMutation({
    mutationFn: async (version: string) => {
      await post("/terms/accept", { version });
      // the stored token still says the Terms are due; the new one does not,
      // and the auth provider follows the refresh into the console
      if (!(await refreshSession())) throw new Error("Accepted — sign in again to continue.");
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Could not record your acceptance");
      // replaced while the page was open: show the new text, ask again
      if (e instanceof ApiError && e.status === 409) {
        setAgreed(false);
        void terms.refetch();
      }
    },
  });

  return (
    <AuthFrame
      title="Terms & Conditions"
      sub={`Read and accept the ${PRODUCT} Terms & Conditions to continue.`}
      wide
    >
      {terms.data && <TermsAcceptance terms={terms.data} checked={agreed} onChange={setAgreed} />}
      {terms.isPending && <p className="small muted" style={{ margin: 0 }}>Loading the Terms…</p>}
      {terms.isError && (
        <Callout tone="critical" title="The Terms & Conditions could not be loaded">
          Reload the page to try again.
        </Callout>
      )}
      {error && <Callout tone="critical" title={error} />}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="quiet" onClick={() => void logout()}>Sign out</Button>
        <Button
          variant="primary"
          disabled={!agreed || !terms.data || accept.isPending}
          onClick={() => terms.data && accept.mutate(terms.data.version)}
        >
          {accept.isPending ? "Recording…" : "I Accept"}
        </Button>
      </div>
    </AuthFrame>
  );
}
