// onboarding — raising a request to onboard a client or a delivery partner.
//
// A page, not the dialog it used to be: the request now carries the company's
// public profile (website, legal name, registered address, logo) as well as its
// plan and first user, and twenty fields in a modal is a form nobody finishes.
// It follows the RFP builder's shape — steps on a StageRail, checked one at a
// time, and a leave guard for the work in progress.
//
// Raising a request does not create the organisation. Ops approves it from the
// queue, and approval creates the organisation, files the logo and emails the
// first user. A request sent back for changes reopens here, at
// /onboarding/:id/edit.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { get, patch, post } from "@api/client";
import type { OnboardingRow } from "@api/types";
import {
  Button, Callout, Dl, Field, inputCls, Panel, selectCls, Skeleton, StageRail, useToast, View,
} from "@ds/primitives";
import { useLeaveGuard } from "@shared/leave-guard";
import { LogoImage, LogoPicker, useStagedLogo, type LogoUpload } from "@shared/org-logo";
import {
  BLANK_EXPERTISE, BLANK_PROFILE, companyRows, draftFromPayload, expertiseRows, onboardingPayload,
  ProfileFields, termsRows, validateProfile,
  type ProfileDraft, type ProfileErrors, type ProfileKey, type ProfileKind, type ProfileValue,
} from "@shared/org-profile-form";

const STEPS = ["Organisation", "Registered address", "Plan and first user", "Review"] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// What each step asks, so Continue checks only what is on screen.
const STEP_FIELDS: Record<number, readonly ProfileKey[]> = {
  0: ["name", "legal_name", "website", "country", "founded_year", "description", "expertise"],
  1: ["city", "address_country"],
  2: [],
};

type ContactErrors = { contact_name?: string; contact_email?: string };

export function OnboardingNewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const stepTop = useRef<HTMLDivElement>(null);
  const stepChanged = useRef(false);
  const [kind, setKind] = useState<ProfileKind>("client");
  const [d, setD] = useState<ProfileDraft>(BLANK_PROFILE);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  // A new upload, or the one a returned request already carries.
  const [logo, setLogo] = useState<LogoUpload | null>(null);
  const [keptLogo, setKeptLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const existing = useQuery({
    queryKey: ["onboarding", id],
    queryFn: () => get<OnboardingRow>(`/onboarding/${id}`),
    enabled: !!id,
  });
  const keptPreview = useStagedLogo(id, keptLogo);

  // populate once, so typing is never overwritten by a refetch
  if (id && existing.data && !loaded) {
    const r = existing.data;
    setKind(r.target_org_kind === "tenant" ? "tenant" : "client");
    setD(draftFromPayload(r.proposed_name, r.payload ?? {}));
    setContactName(r.contact?.full_name ?? "");
    setContactEmail(r.contact?.email ?? "");
    const staged = r.payload?.logo_staging_key;
    setKeptLogo(typeof staged === "string" ? staged : null);
    setLoaded(true);
  }

  const onField = (k: ProfileKey, v: ProfileValue) => {
    setD((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _drop, ...rest }) => rest);
    if (error) setError(null);
  };

  // Unsaved work, measured against the form as it stood once ready.
  const snapshot = JSON.stringify([kind, d, contactName, contactEmail, logo?.key ?? null, keptLogo]);
  const [baseline, setBaseline] = useState<string | null>(null);
  const ready = !id || loaded;
  useEffect(() => {
    if (ready && baseline === null) setBaseline(snapshot);
  }, [ready, baseline, snapshot]);
  const guard = useLeaveGuard(baseline !== null && snapshot !== baseline);

  useLayoutEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    stepTop.current?.focus({ preventScroll: true });
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [step]);

  const logoKey = logo ? (logo.status === "done" ? logo.key : null) : keptLogo;

  const submit = useMutation({
    mutationFn: async () => {
      const payload = { ...onboardingPayload(d, kind), ...(logoKey ? { logo_staging_key: logoKey } : {}) };
      const contact = { full_name: contactName.trim(), email: contactEmail.trim() };
      if (id) {
        await patch(`/onboarding/${id}`, { proposed_name: d.name.trim(), payload, contact });
        return post<OnboardingRow>(`/onboarding/${id}/submit`);
      }
      return post<OnboardingRow>("/onboarding", {
        target_org_kind: kind,
        proposed_name: d.name.trim(),
        payload,
        contact,
        submit: true,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
      toast(
        id ? "Request resubmitted" : "Request raised",
        "It is in the onboarding queue. Approving it creates the organisation and emails the first user.",
        "success",
      );
      guard.release(); // saved: leaving now loses nothing
      navigate("/onboarding");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not raise the request"),
  });

  const checkStep = (): boolean => {
    const found = validateProfile(d, { required: true, only: STEP_FIELDS[step] ?? [] });
    const contactFound: ContactErrors = {};
    const blocking: string[] = [];
    if (step === 0) {
      if (logo?.status === "uploading") blocking.push("Wait for the logo to finish uploading.");
      if (logo?.status === "error") blocking.push("The logo did not upload. Choose it again or remove it.");
    }
    if (step === 2) {
      if (!contactName.trim()) contactFound.contact_name = "Who should be invited first?";
      if (!EMAIL.test(contactEmail.trim())) contactFound.contact_email = "Enter an email address.";
    }
    setErrors(found);
    setContactErrors(contactFound);
    const n = Object.keys(found).length + Object.keys(contactFound).length;
    if (n || blocking.length) {
      setError(blocking.join(" ") || (n === 1 ? "One field needs attention." : `${n} fields need attention.`));
      return false;
    }
    setError(null);
    return true;
  };

  const next = () => {
    if (!checkStep()) return;
    // The registered address is usually in the country the company is in.
    if (step === 0 && !d.address_country && d.country) setD((x) => ({ ...x, address_country: x.country }));
    stepChanged.current = true;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    stepChanged.current = true;
    setStep((s) => Math.max(s - 1, 0));
  };

  if (id && existing.isLoading) {
    return (
      <View title="Loading the request…">
        <Panel><Skeleton rows={6} label="Loading this onboarding request" /></Panel>
      </View>
    );
  }
  const editable = !id || ["draft", "changes_requested"].includes(existing.data?.status ?? "");
  const topKind = !id || ["client", "tenant"].includes(existing.data?.target_org_kind ?? "");
  if (id && (existing.isError || !editable || !topKind)) {
    return (
      <View title="This request cannot be edited">
        <Panel>
          <Callout tone="critical" title="Only a client or partner request that was sent back can be edited here">
            {existing.error instanceof Error
              ? existing.error.message
              : "It may already be in the queue, decided, or raised by a partner for its own network."}
          </Callout>
          <div className="btnrow"><Button onClick={() => navigate("/onboarding")}>Back to onboarding</Button></div>
        </Panel>
      </View>
    );
  }

  const returned = (existing.data?.approvals ?? []).filter((a) => a.decision === "changes_requested").slice(-1)[0];
  const isClient = kind === "client";

  return (
    <View
      title={id ? `Resubmit ${existing.data?.reference_code ?? "request"}` : "Onboard a client or partner"}
      sub="This raises a request in the onboarding queue. Approving it creates the organisation and invites its first user."
    >
      <div ref={stepTop} tabIndex={-1} style={{ outline: "none" }}>
        <Panel flush>
          <StageRail stages={STEPS} current={STEPS[step]!} />
        </Panel>
      </div>

      {returned?.reason && (
        <Callout tone="attention" title="Sent back for changes">{returned.reason}</Callout>
      )}

      <Panel>
        {step === 0 && (
          <>
            <div className="formgrid">
              <Field label="Kind" required span hint={id ? "Fixed once the request is raised." : undefined}>
                {(fid) => (
                  <select
                    id={fid}
                    className={selectCls}
                    value={kind}
                    disabled={!!id}
                    onChange={(e) => {
                      const k = e.target.value as ProfileKind;
                      setKind(k);
                      // The other kind's fields would be refused by the server.
                      setD((x) => ({
                        ...x, industry: "", hq: "", capabilities: "", dpa_signed: false,
                        expertise: BLANK_EXPERTISE,
                      }));
                    }}
                  >
                    <option value="client">Client — buys data</option>
                    <option value="tenant">Delivery partner — fulfils it</option>
                  </select>
                )}
              </Field>
            </div>
            <h3 className="eyebrow formsection">Company</h3>
            <ProfileFields section="company" d={d} kind={kind} errors={errors} onField={onField} ops required />
            {!isClient && (
              <>
                <h3 className="eyebrow formsection">Expertise</h3>
                <p className="small muted" style={{ marginTop: 0 }}>
                  Optional now; the partner can complete it from its own profile. Clients filter the
                  vendors directory by these.
                </p>
                <ProfileFields section="expertise" d={d} kind={kind} errors={errors} onField={onField} ops />
              </>
            )}
            <h3 className="eyebrow formsection">Logo</h3>
            <div className="logofield">
              {!logo && keptLogo && (
                <div className="logofield-current">
                  <LogoImage url={keptPreview.data?.url} name={d.name || "Logo"} size={56} />
                  <Button size="sm" variant="quiet" onClick={() => setKeptLogo(null)}>Remove logo</Button>
                </div>
              )}
              <LogoPicker value={logo} onChange={(v) => { setLogo(v); setError(null); }} label={keptLogo ? "Replace logo" : "Upload logo"} />
              <p className="small muted">Optional. Filed under the organisation when the request is approved.</p>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="muted small" style={{ marginTop: 0 }}>
              Where the company is legally registered. Shown on its profile to the organisations it works with.
            </p>
            <ProfileFields section="address" d={d} kind={kind} errors={errors} onField={onField} ops required />
          </>
        )}

        {step === 2 && (
          <>
            <ProfileFields section="terms" d={d} kind={kind} errors={errors} onField={onField} ops />
            <h3 className="eyebrow formsection">First user</h3>
            <div className="formgrid">
              <Field label="Full name" required error={contactErrors.contact_name} hint="Approval creates this person as the organisation's owner.">
                {(fid) => (
                  <input id={fid} className={inputCls} value={contactName} onChange={(e) => {
                    setContactName(e.target.value);
                    setContactErrors(({ contact_name: _drop, ...rest }) => rest);
                  }} />
                )}
              </Field>
              <Field label="Email" required error={contactErrors.contact_email} hint="The invitation goes here.">
                {(fid) => (
                  <input id={fid} type="email" className={inputCls} value={contactEmail} onChange={(e) => {
                    setContactEmail(e.target.value);
                    setContactErrors(({ contact_email: _drop, ...rest }) => rest);
                  }} />
                )}
              </Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="orghead">
              <LogoImage
                url={logo?.preview ?? keptPreview.data?.url}
                name={d.name || "?"}
                size={56}
              />
              <div>
                <b>{d.name.trim()}</b>
                <p className="small muted">{isClient ? "Client" : "Delivery partner"}</p>
              </div>
            </div>
            <Dl rows={[
              ...companyRows(d),
              ...(isClient ? [] : expertiseRows(d.expertise)),
              ...termsRows(d, kind),
              ["First user", `${contactName.trim()} · ${contactEmail.trim()}`],
            ]} />
          </>
        )}

        {error && <Callout tone="critical" title={error} />}
      </Panel>

      <div className="btnrow">
        {step > 0 && <Button onClick={back}>Back</Button>}
        <Button onClick={() => navigate("/onboarding")}>Cancel</Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={next}>Continue</Button>
        ) : (
          <Button variant="primary" onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Raising…" : id ? "Resubmit request" : "Raise request"}
          </Button>
        )}
      </div>

      {guard.dialog}
    </View>
  );
}
