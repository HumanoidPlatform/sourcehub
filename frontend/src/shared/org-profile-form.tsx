// An organisation's profile as a form: the fields, their rules, and the two
// bodies the server takes — a whole onboarding payload, or a PATCH of only what
// changed.
//
// One module for three screens (the onboarding page, Ops' account page, and an
// organisation's own profile page) because they ask the same questions and must
// send the same keys. The keys are the server's: modules/identity/
// profile_schema.py refuses anything it does not know, so a key invented here
// is an error on save rather than a value quietly thrown away.

import type { ReactNode } from "react";
import type { Address, Expertise, Org, PublicProfile } from "@api/types";
import { CheckGroup, Field, inputCls, selectCls, textareaCls } from "@ds/primitives";
import { PRODUCT } from "@shared/brand";
import { COUNTRY_NAMES } from "@shared/countries";
import {
  EXPERTISE_KEYS, EXPERTISE_LABEL, EXPERTISE_MAX, expertiseLabel, optionsOf,
  OTHER_CERTIFICATIONS_MAX, type ExpertiseKey,
} from "@shared/expertise";
import { PickList } from "@shared/pick-list";

export type ProfileKind = "client" | "tenant";

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1001-5000", "5000+"] as const;
const RESIDENCIES = ["US", "EU", "APAC"] as const;

/** What a delivery partner says it can do. The five lists hold codes from
 *  shared/expertise.ts; the line is free text for what they do not name. */
export interface ExpertiseDraft {
  data_types: string[];
  domains: string[];
  regions: string[];
  languages: string[];
  certifications: string[];
  other_certifications: string;
}

export const BLANK_EXPERTISE: ExpertiseDraft = {
  data_types: [], domains: [], regions: [], languages: [], certifications: [],
  other_certifications: "",
};

export interface ProfileDraft {
  name: string;
  legal_name: string;
  website: string;
  description: string;
  company_size: string;
  founded_year: string;
  country: string;
  // registered_address, flattened so one setter serves every box
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  address_country: string;
  // the kind's own profile
  industry: string;
  hq: string;
  capabilities: string;
  plan: string;
  residency_region: string;
  dpa_signed: boolean;
  // delivery partners only; a client's stays blank and is never sent
  expertise: ExpertiseDraft;
}

export type ProfileKey = keyof ProfileDraft;
export type ProfileValue = string | boolean | ExpertiseDraft;
export type ProfileErrors = Partial<Record<ProfileKey, string>>;

export const BLANK_PROFILE: ProfileDraft = {
  name: "", legal_name: "", website: "", description: "", company_size: "", founded_year: "",
  country: "", line1: "", line2: "", city: "", region: "", postal_code: "", address_country: "",
  industry: "", hq: "", capabilities: "", plan: "", residency_region: "", dpa_signed: false,
  expertise: BLANK_EXPERTISE,
};

// The account's identity and its terms with the platform. Mirrors OPS_ONLY in
// modules/identity/profile_schema.py; the server refuses these from anyone
// else, so the form shows them locked rather than letting a save fail.
export const OPS_ONLY: ReadonlySet<ProfileKey> = new Set<ProfileKey>([
  "name", "legal_name", "country", "plan", "residency_region", "dpa_signed",
]);

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export function expertiseDraft(e: Partial<Expertise> | null | undefined): ExpertiseDraft {
  return {
    data_types: list(e?.data_types),
    domains: list(e?.domains),
    regions: list(e?.regions),
    languages: list(e?.languages),
    certifications: list(e?.certifications),
    other_certifications: str(e?.other_certifications),
  };
}

function fromPublic(pp: PublicProfile | undefined): Partial<ProfileDraft> {
  const a = pp?.registered_address;
  return {
    expertise: expertiseDraft(pp?.expertise),
    website: str(pp?.website),
    description: str(pp?.description),
    company_size: str(pp?.company_size),
    founded_year: str(pp?.founded_year),
    line1: str(a?.line1), line2: str(a?.line2), city: str(a?.city), region: str(a?.region),
    postal_code: str(a?.postal_code), address_country: str(a?.country),
  };
}

export function draftFromOrg(o: Org): ProfileDraft {
  const p = o.profile ?? {};
  return {
    ...BLANK_PROFILE,
    ...fromPublic(o.public_profile),
    name: o.name,
    legal_name: str(o.legal_name),
    country: str(o.country),
    residency_region: str(o.residency_region),
    industry: str(p.industry),
    hq: str(p.hq),
    capabilities: str(p.capabilities),
    plan: str(p.plan),
    dpa_signed: p.dpa_signed === true,
  };
}

/** An onboarding request's payload, back into the form. */
export function draftFromPayload(name: string, payload: Record<string, unknown>): ProfileDraft {
  return {
    ...BLANK_PROFILE,
    ...fromPublic(payload as PublicProfile),
    name,
    legal_name: str(payload.legal_name),
    country: str(payload.country),
    residency_region: str(payload.residency_region),
    industry: str(payload.industry),
    hq: str(payload.hq),
    capabilities: str(payload.capabilities),
    plan: str(payload.plan),
    dpa_signed: payload.dpa_signed === true,
  };
}

// The server's rule, loosely: a host with a dot and no "@" (that is an email
// address). A bare "acme.com" is fine; the server adds https://.
const WEBSITE = /^(https?:\/\/)?[^\s/.?#@]+\.[^\s/?#@]+([/?#]\S*)?$/i;

const hasAddress = (d: ProfileDraft) =>
  [d.line1, d.line2, d.city, d.region, d.postal_code, d.address_country].some((v) => v.trim());

export function validateProfile(
  d: ProfileDraft,
  { required, only }: { required: boolean; only?: readonly ProfileKey[] },
): ProfileErrors {
  const e: ProfileErrors = {};
  if (!d.name.trim()) e.name = "Name the organisation.";
  else if (d.name.trim().length < 2) e.name = "At least two characters.";
  if (required && !d.legal_name.trim()) e.legal_name = "The registered legal name is needed.";
  if (!d.website.trim()) {
    if (required) e.website = "Add the company website.";
  } else if (!WEBSITE.test(d.website.trim())) {
    e.website = "Enter a web address such as https://example.com";
  }
  if (required && !d.country.trim()) e.country = "Choose the country.";
  if (d.founded_year.trim()) {
    const y = Number(d.founded_year);
    if (!Number.isInteger(y) || y < 1800 || y > new Date().getFullYear())
      e.founded_year = `A year between 1800 and ${new Date().getFullYear()}.`;
  }
  if (d.description.length > 1000) e.description = "Keep it under 1,000 characters.";
  // The controls stop at the limit; this is for a draft that arrived over it.
  for (const k of EXPERTISE_KEYS) {
    if (d.expertise[k].length > EXPERTISE_MAX[k]) {
      e.expertise = `List at most ${EXPERTISE_MAX[k]} ${EXPERTISE_LABEL[k].toLowerCase()}.`;
    }
  }
  if (d.expertise.other_certifications.trim().length > OTHER_CERTIFICATIONS_MAX) {
    e.expertise = `Keep other certifications under ${OTHER_CERTIFICATIONS_MAX} characters.`;
  }
  // An address is optional when editing, but half an address is not an address.
  if (required || hasAddress(d)) {
    if (!d.city.trim()) e.city = "The city is needed.";
    if (!d.address_country.trim()) e.address_country = "Choose the country.";
  }
  if (!only) return e;
  return Object.fromEntries(Object.entries(e).filter(([k]) => only.includes(k as ProfileKey)));
}

const orNull = (v: string) => (v.trim() ? v.trim() : null);

function address(d: ProfileDraft): Address | null {
  if (!hasAddress(d)) return null;
  const a: Record<string, string> = { city: d.city.trim(), country: d.address_country.trim() };
  for (const k of ["line1", "line2", "region", "postal_code"] as const) {
    if (d[k].trim()) a[k] = d[k].trim();
  }
  return a as unknown as Address;
}

export const hasExpertise = (e: ExpertiseDraft) =>
  EXPERTISE_KEYS.some((k) => e[k].length > 0) || !!e.other_certifications.trim();

/** Expertise as the server stores it: whole, or not at all. The five lists are
 *  one statement about the company, so they are sent together, and a partner
 *  that has unticked everything has no expertise key rather than five empty
 *  lists. */
function expertiseBody(e: ExpertiseDraft): Record<string, unknown> | null {
  if (!hasExpertise(e)) return null;
  const other = e.other_certifications.trim();
  return {
    ...Object.fromEntries(EXPERTISE_KEYS.map((k) => [k, e[k]])),
    ...(other ? { other_certifications: other } : {}),
  };
}

/** Every key the server stores for this kind, in its shape. */
function body(d: ProfileDraft, kind: ProfileKind): Record<string, unknown> {
  return {
    legal_name: orNull(d.legal_name),
    website: orNull(d.website),
    description: orNull(d.description),
    company_size: orNull(d.company_size),
    founded_year: d.founded_year.trim() ? Number(d.founded_year) : null,
    registered_address: address(d),
    country: orNull(d.country),
    plan: orNull(d.plan),
    residency_region: orNull(d.residency_region),
    ...(kind === "client"
      ? { industry: orNull(d.industry), dpa_signed: d.dpa_signed }
      // expertise is a partner's; the server refuses it from a client
      : { hq: orNull(d.hq), capabilities: orNull(d.capabilities), expertise: expertiseBody(d.expertise) }),
  };
}

/** An onboarding request's payload. A new request has nothing to clear, so
 *  empty fields are left out rather than sent as null. */
export function onboardingPayload(d: ProfileDraft, kind: ProfileKind): Record<string, unknown> {
  return Object.fromEntries(Object.entries(body(d, kind)).filter(([, v]) => v !== null && v !== false));
}

/** PATCH /organisations/{id}: only what changed, and only what this editor may
 *  change. A cleared field is sent as null, which the server reads as "remove". */
export function profilePatch(
  before: ProfileDraft,
  after: ProfileDraft,
  kind: ProfileKind,
  { ops }: { ops: boolean },
): Record<string, unknown> {
  const a: Record<string, unknown> = { ...body(before, kind), name: orNull(before.name) };
  const b: Record<string, unknown> = { ...body(after, kind), name: orNull(after.name) };
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(b)) {
    if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
    if (!ops && OPS_ONLY.has(k as ProfileKey)) continue;
    out[k] = b[k];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reading it back
// ---------------------------------------------------------------------------

export function formatAddress(a: Address | null | undefined): string {
  if (!a) return "";
  return [a.line1, a.line2, a.city, [a.region, a.postal_code].filter(Boolean).join(" "), a.country]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function websiteLink(url: string): ReactNode {
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  // Someone else's site: a new tab, and no window.opener handed to it.
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {href.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
    </a>
  );
}

const dash = (v: string) => (v.trim() ? v : "—");

/** The company, as anyone who may see the organisation sees it. */
export function companyRows(d: ProfileDraft): [string, ReactNode][] {
  const addr = address(d);
  return [
    ["Legal name", dash(d.legal_name)],
    ["Website", d.website.trim() ? websiteLink(d.website.trim()) : "—"],
    ["Country", dash(d.country)],
    ["Company size", d.company_size ? `${d.company_size} people` : "—"],
    ["Founded", dash(d.founded_year)],
    ["Registered address", addr ? formatAddress(addr) : "—"],
    ["About", d.description.trim() ? <span style={{ whiteSpace: "pre-wrap" }}>{d.description.trim()}</span> : "—"],
  ];
}

/** What a partner says it can do, one row per list that has anything in it. */
export function expertiseRows(e: ExpertiseDraft): [string, ReactNode][] {
  const rows: [string, ReactNode][] = EXPERTISE_KEYS.filter((k) => e[k].length > 0).map((k) => [
    EXPERTISE_LABEL[k],
    e[k].map((v) => expertiseLabel(k, v)).join(", "),
  ]);
  if (e.other_certifications.trim()) rows.push(["Other certifications", e.other_certifications.trim()]);
  return rows;
}

/** The kind's own fields and the account's terms, for the onboarding review
 *  and the decision dialog. Established accounts use kindRows() instead. */
export function termsRows(d: ProfileDraft, kind: ProfileKind): [string, ReactNode][] {
  return [
    ...(kind === "client"
      ? ([["Industry", dash(d.industry)]] as [string, ReactNode][])
      : ([["Headquarters", dash(d.hq)], ["Capabilities", dash(d.capabilities)]] as [string, ReactNode][])),
    ["Plan", dash(d.plan)],
    ["Data residency", dash(d.residency_region)],
    ...(kind === "client" ? ([["DPA", d.dpa_signed ? "Signed" : "Not signed"]] as [string, ReactNode][]) : []),
  ];
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

export type ProfileSection = "company" | "address" | "terms" | "expertise";

const LOCKED_HINT = `Only ${PRODUCT} can change this. Contact your account manager.`;

export function ProfileFields({
  section,
  d,
  kind,
  errors,
  onField,
  ops,
  required,
}: {
  section: ProfileSection;
  d: ProfileDraft;
  kind: ProfileKind;
  errors: ProfileErrors;
  onField: (k: ProfileKey, v: ProfileValue) => void;
  /** Ops edits everything; anyone else sees OPS_ONLY fields locked. */
  ops: boolean;
  /** Onboarding: the core fields are required to submit. */
  required?: boolean;
}) {
  const locked = (k: ProfileKey) => !ops && OPS_ONLY.has(k);
  const hint = (k: ProfileKey, h?: string) => (locked(k) ? LOCKED_HINT : h);
  const text = (k: ProfileKey, props: Record<string, unknown> = {}) => (id: string) => (
    <input
      id={id}
      className={inputCls}
      value={d[k] as string}
      disabled={locked(k)}
      onChange={(e) => onField(k, e.target.value)}
      {...props}
    />
  );
  const countrySelect = (k: ProfileKey) => (id: string) => (
    <select id={id} className={selectCls} value={d[k] as string} disabled={locked(k)} onChange={(e) => onField(k, e.target.value)}>
      <option value="">Choose…</option>
      {/* An account onboarded before the list existed may hold a free-text
          country; keep it selectable rather than silently blanking it. */}
      {(d[k] as string) && !COUNTRY_NAMES.includes(d[k] as string) && (
        <option value={d[k] as string}>{d[k] as string}</option>
      )}
      {COUNTRY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );

  if (section === "company") {
    const isClient = kind === "client";
    return (
      <div className="formgrid">
        <Field label="Organisation name" required span error={errors.name} hint={hint("name", "How the organisation appears across the platform.")}>
          {text("name", { placeholder: isClient ? "Meridian Grocery Group" : "Harbour Field Services" })}
        </Field>
        <Field label="Legal name" required={required} error={errors.legal_name} hint={hint("legal_name", "As registered, for contracts and invoices.")}>
          {text("legal_name")}
        </Field>
        <Field label="Website" required={required} error={errors.website} hint="The company's main site.">
          {text("website", { type: "url", inputMode: "url", placeholder: "https://example.com" })}
        </Field>
        <Field label="Country" required={required} error={errors.country} hint={hint("country")}>
          {countrySelect("country")}
        </Field>
        <Field label={isClient ? "Industry" : "Headquarters"} error={errors[isClient ? "industry" : "hq"]}>
          {text(isClient ? "industry" : "hq", { placeholder: isClient ? "Retail" : "Pune, India" })}
        </Field>
        <Field label="Company size" error={errors.company_size}>
          {(id) => (
            <select id={id} className={selectCls} value={d.company_size} onChange={(e) => onField("company_size", e.target.value)}>
              <option value="">Not stated</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} people</option>)}
            </select>
          )}
        </Field>
        <Field label="Founded" error={errors.founded_year} hint="Year">
          {text("founded_year", { inputMode: "numeric", maxLength: 4, placeholder: "2012" })}
        </Field>
        {!isClient && (
          <Field label="Capabilities" span error={errors.capabilities} hint="What this partner can deliver, shown on its profile.">
            {text("capabilities")}
          </Field>
        )}
        <Field label="About" span error={errors.description} hint="A few sentences on what the company does. Visible to its counterparties.">
          {(id) => (
            <textarea id={id} className={textareaCls} rows={3} maxLength={1000} value={d.description} onChange={(e) => onField("description", e.target.value)} />
          )}
        </Field>
      </div>
    );
  }

  if (section === "expertise") {
    const e = d.expertise;
    const set = (k: ExpertiseKey, next: string[]) => {
      // a tick past the limit is not taken, and the hint says what the limit is
      if (next.length > EXPERTISE_MAX[k] && next.length > e[k].length) return;
      onField("expertise", { ...e, [k]: next });
    };
    const limit = (k: ExpertiseKey) => `Up to ${EXPERTISE_MAX[k]}.`;
    return (
      <div className="formgrid">
        <CheckGroup
          label="Data types"
          hint="What this partner captures or prepares."
          columns={3}
          options={optionsOf("data_types")}
          value={e.data_types}
          onChange={(next) => set("data_types", next)}
        />
        <CheckGroup
          label="Domains"
          hint={`The industries it has worked in. ${limit("domains")}`}
          columns={3}
          options={optionsOf("domains")}
          value={e.domains}
          onChange={(next) => set("domains", next)}
        />
        <PickList
          label="Regions"
          hint={`The countries it can collect in. ${limit("regions")}`}
          placeholder="Add a country…"
          options={optionsOf("regions")}
          max={EXPERTISE_MAX.regions}
          value={e.regions}
          onChange={(next) => set("regions", next)}
        />
        <PickList
          label="Languages"
          hint="The languages its people work in."
          placeholder="Add a language…"
          options={optionsOf("languages")}
          max={EXPERTISE_MAX.languages}
          value={e.languages}
          onChange={(next) => set("languages", next)}
        />
        <CheckGroup
          label="Certifications"
          hint="Held by the company today."
          columns={3}
          options={optionsOf("certifications")}
          value={e.certifications}
          onChange={(next) => set("certifications", next)}
        />
        <Field label="Other certifications" span error={errors.expertise} hint="One line, for what the list does not name.">
          {(id) => (
            <input
              id={id}
              className={inputCls}
              maxLength={OTHER_CERTIFICATIONS_MAX}
              value={e.other_certifications}
              placeholder="TISAX, ISO 22301"
              onChange={(ev) => onField("expertise", { ...e, other_certifications: ev.target.value })}
            />
          )}
        </Field>
      </div>
    );
  }

  if (section === "address") {
    return (
      <div className="formgrid">
        <Field label="Address line 1" span error={errors.line1}>
          {text("line1", { autoComplete: "address-line1" })}
        </Field>
        <Field label="Address line 2" span error={errors.line2}>
          {text("line2", { autoComplete: "address-line2" })}
        </Field>
        <Field label="City" required={required || hasAddress(d)} error={errors.city}>
          {text("city", { autoComplete: "address-level2" })}
        </Field>
        <Field label="State or region" error={errors.region}>
          {text("region", { autoComplete: "address-level1" })}
        </Field>
        <Field label="Postal code" error={errors.postal_code}>
          {text("postal_code", { autoComplete: "postal-code" })}
        </Field>
        <Field label="Country" required={required || hasAddress(d)} error={errors.address_country}>
          {countrySelect("address_country")}
        </Field>
      </div>
    );
  }

  return (
    <div className="formgrid">
      <Field label="Plan" error={errors.plan} hint={hint("plan", kind === "client" ? "Enterprise or Growth" : "Partner Pro or Partner Starter")}>
        {text("plan")}
      </Field>
      <Field label="Data residency" error={errors.residency_region} hint={hint("residency_region", "Pins where captured data is stored.")}>
        {(id) => (
          <select id={id} className={selectCls} value={d.residency_region} disabled={locked("residency_region")} onChange={(e) => onField("residency_region", e.target.value)}>
            <option value="">Not set</option>
            {RESIDENCIES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </Field>
      {kind === "client" && (
        <label className="checkline span">
          <input type="checkbox" checked={d.dpa_signed} disabled={locked("dpa_signed")} onChange={(e) => onField("dpa_signed", e.target.checked)} />
          <span>
            The client has signed the data processing agreement
            <span className="cl-sub">{locked("dpa_signed") ? LOCKED_HINT : "Recorded with today's date."}</span>
          </span>
        </label>
      )}
    </div>
  );
}
