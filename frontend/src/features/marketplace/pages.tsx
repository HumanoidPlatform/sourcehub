// marketplace — the request builder, requests, opportunities,
// proposal comparison and the award.

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, patch, post } from "@api/client";
import type {
  ClientProfile, Deidentification, LawfulBasis, LocationType, MinorsPolicy, Org,
  PeopleInFrame, PermittedUse, Proposal, Rfp,
  StorageTarget, TargetUnit, UseCase,
} from "@api/types";
import {
  Button, Callout, CheckGroup, DataTable, Dialog, Dl, Empty, Field, inputCls, Panel, Pill, RowMenu,
  selectCls, Skeleton, StageRail, TableWrap, TagInput, textareaCls, useToast, View,
} from "@ds/primitives";
import {
  CAPTURE_MEDIA, DEIDENTIFICATION, labelOf, labelsOf, LAWFUL_BASES, LOCATION_TYPES,
  MINORS_POLICIES, PEOPLE_IN_FRAME, PERMITTED_USES,
  REWORK_BEARERS, TARGET_UNITS, UNIT_IMPLIES_MEDIA, USE_CASES,
} from "./vocabularies";
import { useSession } from "@shared/auth";
import { fmtDate, fmtDateTime, mediaList, money, titleCase } from "@shared/format";
import {
  AttachmentList, AttachmentsField, attachmentPayload, fromServer, type AttachmentDraft,
} from "@shared/attachments";
import { useLeaveGuard } from "@shared/leave-guard";
import { OrgProfileDialog } from "@shared/org-profile";
import { ReasonDialog } from "@shared/reason-dialog";
import {
  LIFECYCLE, proposalStatus, requestStatus, statusMeta, waitingOn,
} from "@shared/status";

const CATEGORIES = [
  ["image", "Image"],
  ["video", "Video"],
  ["structured_data", "Structured data"],
  ["unstructured_data", "Unstructured data"],
  ["people_deliverable", "People-based deliverable"],
] as const;

const CATEGORY_UNITS: Record<string, TargetUnit> = {
  image: "records",
  video: "hours",
  structured_data: "records",
  unstructured_data: "records",
  people_deliverable: "records",
};

const unitForCategory = (category: string): TargetUnit => CATEGORY_UNITS[category] ?? "records";
const unitLabel = (unit: string | null | undefined): string =>
  unit === "records" ? "Units" : unit === "hours" || unit === "audio_hours" ? "Hours" : labelOf(TARGET_UNITS, unit);

const COUNTRY_LOCALES = [
  ["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"], ["AD", "Andorra"],
  ["AO", "Angola"], ["AR", "Argentina"], ["AM", "Armenia"], ["AU", "Australia"],
  ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BS", "Bahamas"], ["BH", "Bahrain"],
  ["BD", "Bangladesh"], ["BB", "Barbados"], ["BE", "Belgium"], ["BZ", "Belize"],
  ["BJ", "Benin"], ["BT", "Bhutan"], ["BO", "Bolivia"], ["BA", "Bosnia and Herzegovina"],
  ["BW", "Botswana"], ["BR", "Brazil"], ["BN", "Brunei"], ["BG", "Bulgaria"],
  ["BF", "Burkina Faso"], ["BI", "Burundi"], ["KH", "Cambodia"], ["CM", "Cameroon"],
  ["CA", "Canada"], ["CL", "Chile"], ["CN", "China"], ["CO", "Colombia"],
  ["CR", "Costa Rica"], ["CI", "Cote d'Ivoire"], ["HR", "Croatia"], ["CY", "Cyprus"],
  ["CZ", "Czechia"], ["DK", "Denmark"], ["DO", "Dominican Republic"], ["EC", "Ecuador"],
  ["EG", "Egypt"], ["SV", "El Salvador"], ["EE", "Estonia"], ["ET", "Ethiopia"],
  ["FI", "Finland"], ["FR", "France"], ["GE", "Georgia"], ["DE", "Germany"],
  ["GH", "Ghana"], ["GR", "Greece"], ["GT", "Guatemala"], ["HK", "Hong Kong"],
  ["HU", "Hungary"], ["IS", "Iceland"], ["IN", "India"], ["ID", "Indonesia"],
  ["IE", "Ireland"], ["IL", "Israel"], ["IT", "Italy"], ["JM", "Jamaica"],
  ["JP", "Japan"], ["JO", "Jordan"], ["KZ", "Kazakhstan"], ["KE", "Kenya"],
  ["KW", "Kuwait"], ["KG", "Kyrgyzstan"], ["LA", "Laos"], ["LV", "Latvia"],
  ["LB", "Lebanon"], ["LT", "Lithuania"], ["LU", "Luxembourg"], ["MY", "Malaysia"],
  ["MV", "Maldives"], ["MT", "Malta"], ["MU", "Mauritius"], ["MX", "Mexico"],
  ["MD", "Moldova"], ["MA", "Morocco"], ["MZ", "Mozambique"], ["MM", "Myanmar"],
  ["NP", "Nepal"], ["NL", "Netherlands"], ["NZ", "New Zealand"], ["NG", "Nigeria"],
  ["NO", "Norway"], ["OM", "Oman"], ["PK", "Pakistan"], ["PA", "Panama"],
  ["PE", "Peru"], ["PH", "Philippines"], ["PL", "Poland"], ["PT", "Portugal"],
  // RU was in COUNTRY_LANGUAGE_CODES but not here, so countryLabel fell through
  // to the raw code and the picker offered "RU - Russian" among a list of real
  // country names.
  ["QA", "Qatar"], ["RO", "Romania"], ["RU", "Russia"], ["RW", "Rwanda"], ["SA", "Saudi Arabia"],
  ["SN", "Senegal"], ["RS", "Serbia"], ["SG", "Singapore"], ["SK", "Slovakia"],
  ["SI", "Slovenia"], ["ZA", "South Africa"], ["KR", "South Korea"], ["ES", "Spain"],
  ["LK", "Sri Lanka"], ["SE", "Sweden"], ["CH", "Switzerland"], ["TW", "Taiwan"],
  ["TJ", "Tajikistan"], ["TZ", "Tanzania"], ["TH", "Thailand"], ["TR", "Turkey"],
  ["TM", "Turkmenistan"], ["UG", "Uganda"], ["UA", "Ukraine"], ["AE", "United Arab Emirates"],
  ["GB", "United Kingdom"], ["US", "United States"], ["UY", "Uruguay"], ["UZ", "Uzbekistan"],
  ["VE", "Venezuela"], ["VN", "Vietnam"], ["ZM", "Zambia"], ["ZW", "Zimbabwe"],
] as const;

function countryLabel(code: string): string {
  const found = COUNTRY_LOCALES.find(([value]) => value === code);
  return found ? found[1] : code;
}

const LANGUAGES = [
  ["eng", "English"], ["hin", "Hindi"], ["fr", "French"], ["spa", "Spanish"],
  ["ara", "Arabic"], ["ben", "Bengali"], ["cmn", "Mandarin Chinese"], ["por", "Portuguese"],
  ["rus", "Russian"], ["de", "German"], ["jpn", "Japanese"], ["kor", "Korean"],
  ["ind", "Indonesian"], ["msa", "Malay"], ["ita", "Italian"], ["tur", "Turkish"],
  ["vie", "Vietnamese"], ["tha", "Thai"], ["tam", "Tamil"], ["tel", "Telugu"],
  ["mar", "Marathi"], ["urd", "Urdu"], ["guj", "Gujarati"], ["kan", "Kannada"],
  ["pan", "Punjabi"], ["nld", "Dutch"], ["swe", "Swedish"], ["nor", "Norwegian"],
  ["dan", "Danish"], ["fin", "Finnish"], ["pol", "Polish"], ["ukr", "Ukrainian"],
  ["ell", "Greek"], ["heb", "Hebrew"],
] as const;

function languageLabel(code: string): string {
  const found = LANGUAGES.find(([value]) => value === code);
  return found ? found[1] : code;
}

function localeLabel(value: string): string {
  const [country, language] = value.split("-");
  if (!country || !language) return countryLabel(value.toUpperCase());
  return `${countryLabel(country.toUpperCase())} - ${languageLabel(language)}`;
}

const COUNTRY_LANGUAGE_CODES: Record<string, string[]> = {
  AE: ["ara", "eng"],
  AR: ["spa"],
  AT: ["de", "eng"],
  AU: ["eng"],
  BD: ["ben", "eng"],
  BE: ["nld", "fr", "de"],
  BR: ["por"],
  CA: ["eng", "fr"],
  CH: ["de", "fr", "ita"],
  CL: ["spa"],
  CN: ["cmn", "eng"],
  CO: ["spa"],
  DE: ["de", "eng"],
  DK: ["dan", "eng"],
  EG: ["ara", "eng"],
  ES: ["spa"],
  FI: ["fin", "swe", "eng"],
  FR: ["fr", "eng"],
  GB: ["eng"],
  GR: ["ell", "eng"],
  HK: ["cmn", "eng"],
  ID: ["ind", "eng"],
  IE: ["eng"],
  IL: ["heb", "ara", "eng"],
  IN: ["eng", "hin", "tel", "tam", "ben", "mar", "urd", "guj", "kan", "pan"],
  IT: ["ita", "eng"],
  JP: ["jpn", "eng"],
  KR: ["kor", "eng"],
  LK: ["tam", "eng"],
  MX: ["spa"],
  MY: ["msa", "eng", "cmn", "tam"],
  NG: ["eng"],
  NL: ["nld", "eng"],
  NO: ["nor", "eng"],
  NZ: ["eng"],
  PE: ["spa"],
  PH: ["eng"],
  PK: ["urd", "eng", "pan"],
  PL: ["pol", "eng"],
  PT: ["por", "eng"],
  QA: ["ara", "eng"],
  RU: ["rus", "eng"],
  SA: ["ara", "eng"],
  SE: ["swe", "eng"],
  SG: ["eng", "cmn", "msa", "tam"],
  TH: ["tha", "eng"],
  TR: ["tur", "eng"],
  TW: ["cmn", "eng"],
  UA: ["ukr", "rus", "eng"],
  US: ["eng", "spa"],
  VN: ["vie", "eng"],
  ZA: ["eng"],
};

const LOCALE_OPTIONS = Object.entries(COUNTRY_LANGUAGE_CODES).flatMap(([countryCode, languageCodes]) => {
  const country = countryLabel(countryCode);
  return languageCodes.map((languageCode) => {
    const language = languageLabel(languageCode);
    return {
    value: `${countryCode.toLowerCase()}-${languageCode}`,
    label: `${country} - ${language}`,
    search: `${country} ${language} ${countryCode.toLowerCase()}-${languageCode}`.toLowerCase(),
    };
  });
});

function CountryLocaleCombobox({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const selected = new Set(value);
  const query = draft.trim().toLowerCase();
  const options = (query
    ? LOCALE_OPTIONS.filter((o) => !selected.has(o.value) && o.search.includes(query))
    : LOCALE_OPTIONS.filter((o) => !selected.has(o.value)).slice(0, 8)
  ).slice(0, 12);

  const matchLocale = (raw: string) => {
    const lower = raw.trim().toLowerCase();
    return LOCALE_OPTIONS.find(
      (o) =>
        o.value === lower ||
        o.label.toLowerCase() === lower ||
        `${o.label} (${o.value})`.toLowerCase() === lower,
    );
  };

  const addLocale = (locale: { value: string; label: string }) => {
    if (selected.has(locale.value)) return;
    onChange([...value, locale.value]);
    setDraft("");
    setOpen(false);
  };

  const commit = () => {
    const match = matchLocale(draft);
    if (match) addLocale(match);
    else setDraft("");
    setOpen(false);
  };

  const listId = `${id ?? "country-locale"}-options`;

  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
          {value.map((locale) => (
            <span className="chip" key={locale}>
              {localeLabel(locale)}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== locale))}
                aria-label={`Remove ${localeLabel(locale)}`}
                style={{ border: 0, background: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          className={inputCls}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          value={draft}
          placeholder="Search country, language, or code"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft("");
              setOpen(false);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
        />
        {open && options.length > 0 && (
          <div
            id={listId}
            role="listbox"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 4px)",
              zIndex: 80,
              maxHeight: 220,
              overflowY: "auto",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-control)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-overlay)",
            }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                className="btn"
                data-variant="quiet"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addLocale(o);
                }}
                style={{ width: "100%", justifyContent: "space-between", border: 0, borderRadius: 0 }}
              >
                <span>{o.label}</span>
                <span className="muted small">{o.value}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- client: requests list -------------------------------------------------- */

export function RequestsPage() {
  const requests = useQuery({ queryKey: ["requests"], queryFn: () => get<Rfp[]>("/requests") });
  const rows = requests.data ?? [];
  const status = (r: Rfp) => statusMeta(requestStatus, r.status);
  const newRequest = <Link to="/requests/new" className="btn" data-variant="primary">New RFP</Link>;
  return (
    <View
      title="RFPs"
      sub="Every RFP you have drafted, published or seen through to completion."
      actions={newRequest}
    >
      <Panel>
        {requests.isLoading ? (
          // Without this the empty state rendered while the query was in
          // flight — "No requests yet" to a client who has ten.
          <Skeleton rows={5} label="Loading your RFPs" />
        ) : rows.length === 0 ? (
          <Empty title="No RFPs yet" hint="Publish one and every delivery partner is notified." action={newRequest} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            filter={{
              label: "Filter RFPs",
              placeholder: "Filter by title or reference…",
              text: (r) => `${r.title} ${r.reference_code}`,
            }}
            columns={[
              { header: "Reference", cell: (r) => r.reference_code, sortBy: (r) => r.reference_code, className: "id" },
              { header: "Title", cell: (r) => r.title, sortBy: (r) => r.title, className: "cell-primary" },
              { header: "Category", cell: (r) => titleCase(r.category), sortBy: (r) => r.category },
              {
                header: "Budget",
                className: "num",
                // by the top of the range: what the client is prepared to spend
                sortBy: (r) => {
                  const top = r.budget_max ?? r.budget_min;
                  return top === null ? null : Number(top);
                },
                cell: (r) => (
                  <span style={{ whiteSpace: "nowrap" }}>{money(r.budget_min)} – {money(r.budget_max)}</span>
                ),
              },
              {
                header: "Status",
                sortBy: (r) => status(r).label,
                cell: (r) => <Pill tone={status(r).tone}>{status(r).label}</Pill>,
              },
              { header: "Waiting on", cell: (r) => waitingOn(status(r), "client") },
              { header: "Proposals", cell: (r) => r.proposal_count, sortBy: (r) => r.proposal_count, className: "num" },
              {
                header: "Actions",
                hideHeader: true,
                className: "right",
                cell: (r) => (
                  <div className="rowactions">
                    {r.status === "draft" && (
                      <Link className="btn" data-size="sm" to={`/requests/${r.id}/edit`}>Edit</Link>
                    )}
                    <Link className="btn" data-size="sm" to={`/requests/${r.id}`}>Open</Link>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Panel>
    </View>
  );
}

/* --- client: the request builder -------------------------------------------- */

// Privacy is its own step rather than a few fields tacked onto Specification.
// Whether people are in frame, whether minors may be, and on what lawful basis
// are the questions that decide whether the work can be done at all, and a
// client who is not made to stop and answer them will not.
// Three steps, not eight. The old shape asked forty-five questions, four of
// which blocked publishing and twenty-six of which nothing read — long enough
// to irritate and permissive enough to publish a brief saying "To be agreed"
// where the quantity should be.
//
// What replaces the length is depth on demand: the privacy block appears only
// when someone is in frame, the capture detail only when asked for, and a
// client who already wrote a spec attaches it instead of retyping it.
type Row = [string, React.ReactNode];

const STEPS = ["Scope", "Guidelines", "Budget and Timelines", "Review"] as const;

// The jsonb columns are flattened into prefixed scalar fields here and
// reassembled on save. Nested state would mean a bespoke setter per key, and
// `set()` below is what keeps forty fields to one line each.
interface Draft {
  title: string; category: string; compliance_notes: string;
  objective: string; use_case: string;
  target_quantity: string; target_unit: string; location_type: string;
  countries: string[];
  capture_media: string[]; capture_notes: string;
  capture_require_gps: boolean; capture_orientation: string; capture_min_megapixels: string;
  capture_max_tilt_deg: string;
  capture_min_duration_s: string; capture_max_duration_s: string; capture_min_video_lines: string;
  capture_allow_library: boolean;
  acceptance: string; qt_min_pass_rate_pct: string;
  rp_max_retakes: string; rp_retake_window_days: string;
  rp_rework_cost_bearer: string; rp_partial_acceptance_allowed: boolean;
  people_in_frame: string; minors_policy: string;
  deidentification: Deidentification[]; regulations: string[];
  lawful_basis: string; permitted_uses: PermittedUse[];
  partner_reuse_allowed: boolean; biometric_processing: boolean;
  people_headcount: string;
  budget_disclosed: boolean; budget_min: string; budget_max: string;
  pilot_required: boolean; pilot_quantity: string; pilot_due_on: string;
  starts_on: string; delivery_due_on: string;
  storage_target_id: string;
}

const BLANK: Draft = {
  title: "", category: "image", compliance_notes: "",
  objective: "", use_case: "",
  target_quantity: "", target_unit: "records", location_type: "",
  countries: [],
  capture_media: [], capture_notes: "",
  capture_require_gps: false, capture_orientation: "", capture_min_megapixels: "",
  capture_max_tilt_deg: "",
  capture_min_duration_s: "", capture_max_duration_s: "", capture_min_video_lines: "",
  capture_allow_library: false,
  acceptance: "", qt_min_pass_rate_pct: "",
  rp_max_retakes: "", rp_retake_window_days: "",
  rp_rework_cost_bearer: "", rp_partial_acceptance_allowed: false,
  people_in_frame: "", minors_policy: "",
  deidentification: [], regulations: [],
  lawful_basis: "", permitted_uses: [],
  partner_reuse_allowed: false, biometric_processing: false,
  people_headcount: "",
  budget_disclosed: true, budget_min: "", budget_max: "",
  pilot_required: false, pilot_quantity: "", pilot_due_on: "",
  starts_on: "", delivery_due_on: "",
  storage_target_id: "",
};

/** A number field as the API wants it: absent rather than an empty string,
 *  because every one of these columns is nullable and `""` is not a number. */
const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));
/** Same for text, and for a select whose blank option means "not answered". */
const str = (v: string): string | null => (v.trim() === "" ? null : v.trim());
/** Drops keys the client never filled, so an untouched jsonb block is saved as
 *  {} rather than as an object full of nulls. */
const compact = <T extends Record<string, unknown>>(o: T): T | null => {
  const kept = Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && !v.length)),
  );
  return Object.keys(kept).length ? (kept as T) : null;
};

// Doubles as the draft editor: with an :id in the path it loads that draft and
// PATCHes instead of POSTing. Same fields, same validation — a second form for
// editing would be the same form, drifting.
export function RequestNewPage() {
  const { id } = useParams();
  const [step, setStep] = useState(0);
  const stepTopRef = useRef<HTMLDivElement>(null);
  const stepChanged = useRef(false);
  const [d, setD] = useState<Draft>(BLANK);
  const [error, setError] = useState<string | null>(null);
  // What the person is being told, per field. Set by Continue, cleared the
  // moment they edit the offending field (see `set` below).
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof Draft, string>>>({});
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Kept out of Draft because these are uploads, not form values: they
  // exist in storage before the request row does. captureExamples is what
  // the old request_sample table held — reference material a partner reads
  // while deciding whether to bid.
  const [briefFiles, setBriefFiles] = useState<AttachmentDraft[]>([]);
  const [complianceFiles, setComplianceFiles] = useState<AttachmentDraft[]>([]);
  const [acceptanceFiles, setAcceptanceFiles] = useState<AttachmentDraft[]>([]);
  const [captureExamples, setCaptureExamples] = useState<AttachmentDraft[]>([]);
  const [guidelineFiles, setGuidelineFiles] = useState<AttachmentDraft[]>([]);
  // Reveals. Not part of Draft: they are about what this person is being
  // shown, not about the request. A draft reopened later works them out from
  // the values that were actually saved.
  const [showCapture, setShowCapture] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const targets = useTargets();
  const targetIsVerified = (tid: string) =>
    !!(targets.data ?? []).find((t) => t.id === tid)?.verified_at;
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const existing = useQuery({
    queryKey: ["request", id],
    queryFn: () => get<Rfp>(`/requests/${id}`),
    enabled: !!id,
  });

  // populate once, so typing is never overwritten by a refetch
  if (id && existing.data && !loaded) {
    const r = existing.data;
    const cap = r.spec?.capture ?? {};
    const qt = r.quality?.thresholds ?? {};
    const rp = r.quality?.rejection_policy ?? {};
    const co = r.compliance;
    setD({
      title: r.title ?? "", category: r.category ?? "image",
      compliance_notes: r.compliance_notes ?? "",
      objective: r.objective ?? "", use_case: r.use_case ?? "",
      acceptance: r.acceptance ?? "",
      target_quantity: String(r.spec?.target_quantity ?? ""),
      target_unit: r.spec?.target_unit ?? unitForCategory(r.category ?? "image"),
      location_type: r.spec?.location_type ?? "",
      countries: r.spec?.countries ?? [],
      capture_media: mediaList(cap), capture_notes: cap.notes ?? "",
      capture_require_gps: !!cap.require_gps,
      capture_orientation: cap.orientation ?? "",
      capture_min_megapixels: String(cap.min_megapixels ?? ""),
      capture_max_tilt_deg: String(cap.max_tilt_deg ?? ""),
      capture_min_duration_s: String(cap.min_duration_s ?? ""),
      capture_max_duration_s: String(cap.max_duration_s ?? ""),
      capture_min_video_lines: String(cap.min_video_lines ?? ""),
      capture_allow_library: !!cap.allow_library,
      qt_min_pass_rate_pct: String(qt.min_pass_rate_pct ?? ""),
      rp_max_retakes: String(rp.max_retakes ?? ""),
      rp_retake_window_days: String(rp.retake_window_days ?? ""),
      rp_rework_cost_bearer: rp.rework_cost_bearer ?? "",
      rp_partial_acceptance_allowed: !!rp.partial_acceptance_allowed,
      people_in_frame: co?.people_in_frame ?? "", minors_policy: co?.minors_policy ?? "",
      deidentification: co?.deidentification ?? [], regulations: co?.regulations ?? [],
      lawful_basis: co?.lawful_basis ?? "", permitted_uses: co?.permitted_uses ?? [],
      partner_reuse_allowed: !!co?.partner_reuse_allowed,
      biometric_processing: !!co?.biometric_processing,
      people_headcount: String(r.people?.headcount ?? ""),
      budget_disclosed: r.budget_disclosed ?? true,
      budget_min: r.budget_min ?? "", budget_max: r.budget_max ?? "",
      pilot_required: !!r.pilot?.required,
      pilot_quantity: String(r.pilot?.quantity ?? ""),
      pilot_due_on: r.pilot?.due_on ?? "",
      starts_on: r.starts_on ?? "", delivery_due_on: r.delivery_due_on ?? "",
      storage_target_id: r.storage_target_id ?? "",
    });
    const files = r.attachments ?? [];
    setBriefFiles(fromServer(files.filter((a) => a.slot === "brief")));
    setComplianceFiles(fromServer(files.filter((a) => a.slot === "compliance")));
    setAcceptanceFiles(fromServer(files.filter((a) => a.slot === "acceptance")));
    setCaptureExamples(fromServer(files.filter((a) => a.slot === "capture_examples")));
    setGuidelineFiles(fromServer(files.filter((a) => a.slot === "guidelines")));
    // Reopen a draft with its optional blocks already open if they hold
    // anything. Collapsing a section that has content in it reads as data loss.
    setShowCapture(!!(cap.min_megapixels || cap.orientation || cap.max_tilt_deg || cap.require_gps || cap.notes
      || cap.min_duration_s || cap.max_duration_s || cap.min_video_lines || cap.allow_library));
    setShowRejection(Object.values(rp).some((v) => v !== null && v !== undefined && v !== false));
    setLoaded(true);
  }

  const set = (k: keyof Draft) => (e: { target: { value: string } }) =>
    // Clear the banner as soon as the person acts on it. It used to survive
    // until the next Continue, so a corrected field sat under a stale error.
    setD((x) => {
      if (error) setError(null);
      if (fieldErr[k]) setFieldErr(({ [k]: _drop, ...rest }) => rest);
      return { ...x, [k]: e.target.value };
    });

  const setCategory = (e: { target: { value: string } }) => {
    const category = e.target.value;
    setD((x) => {
      if (error) setError(null);
      if (fieldErr.category) setFieldErr(({ category: _drop, ...rest }) => rest);
      return { ...x, category, target_unit: unitForCategory(category) };
    });
  };


  // Any attachment still in flight. Saving now would attach a key whose bytes
  // are not in storage yet, and the server would reject it as never uploaded.
  // A unit like "photos" states the medium; "sites" does not. Where it does,
  // the Media control is not shown and this is what gets saved instead — the
  // client's own capture_media is left untouched so switching sites -> photos
  // -> sites does not lose their selection.
  const impliedMedia = UNIT_IMPLIES_MEDIA[d.target_unit as TargetUnit];
  // Which capture fields can apply. Nothing chosen yet shows them all.
  const chosenMedia = impliedMedia ?? d.capture_media;
  const wantsPhoto = chosenMedia.length === 0 || chosenMedia.includes("photo");
  const wantsVideo = chosenMedia.length === 0 || chosenMedia.includes("video");
  // "Something else" says nothing on its own, so the objective carries it.
  const otherUseCase = d.use_case === "other";

  const allFiles = [
    ...briefFiles, ...complianceFiles, ...acceptanceFiles, ...captureExamples, ...guidelineFiles,
  ];
  const uploading = allFiles.some((a) => a.status === "uploading");

  // Unsaved work, measured against the form as it stood once ready: blank for a
  // new request, the saved draft once it has loaded for an edit. Only what
  // would be saved counts — not the step or which sections are open.
  const snapshot = JSON.stringify([
    d, briefFiles, complianceFiles, acceptanceFiles, captureExamples, guidelineFiles,
  ]);
  const [baseline, setBaseline] = useState<string | null>(null);
  const ready = !id || loaded;
  useEffect(() => {
    if (ready && baseline === null) setBaseline(snapshot);
  }, [ready, baseline, snapshot]);
  const guard = useLeaveGuard(baseline !== null && snapshot !== baseline);

  const save = useMutation({
    mutationFn: async (publish: boolean) => {
      const body = {
        title: d.title,
        category: d.category,
        compliance_notes: str(d.compliance_notes),

        objective: str(d.objective),
        use_case: str(d.use_case),
        target_quantity: num(d.target_quantity),
        target_unit: str(d.target_unit),
        location_type: str(d.location_type),
        countries: d.countries,
        capture_spec: compact({
          media: impliedMedia ?? d.capture_media,
          notes: str(d.capture_notes),
          orientation: str(d.capture_orientation),
          require_gps: d.capture_require_gps || null,
          min_megapixels: num(d.capture_min_megapixels),
          max_tilt_deg: num(d.capture_max_tilt_deg),
          min_duration_s: num(d.capture_min_duration_s),
          max_duration_s: num(d.capture_max_duration_s),
          min_video_lines: num(d.capture_min_video_lines),
          allow_library: d.capture_allow_library || null,
        }),

        acceptance: str(d.acceptance),
        quality_thresholds: compact({
          min_pass_rate_pct: num(d.qt_min_pass_rate_pct),
        }),
        rejection_policy: compact({
          max_retakes: num(d.rp_max_retakes),
          retake_window_days: num(d.rp_retake_window_days),
          rework_cost_bearer: str(d.rp_rework_cost_bearer),
          partial_acceptance_allowed: d.rp_partial_acceptance_allowed || null,
        }),

        people_in_frame: str(d.people_in_frame),
        minors_policy: str(d.minors_policy),
        deidentification: d.deidentification,
        regulations: d.regulations,
        lawful_basis: str(d.lawful_basis),
        permitted_uses: d.permitted_uses,
        partner_reuse_allowed: d.partner_reuse_allowed,
        biometric_processing: d.biometric_processing,

        people_headcount: Number(d.people_headcount) || 0,

        budget_disclosed: d.budget_disclosed,
        budget_min: d.budget_min || null,
        budget_max: d.budget_max || null,
        pilot_required: d.pilot_required,
        pilot_quantity: d.pilot_required ? num(d.pilot_quantity) : null,
        pilot_due_on: d.pilot_due_on || null,

        starts_on: d.starts_on || null,
        delivery_due_on: d.delivery_due_on || null,
        storage_target_id: d.storage_target_id || null,
        attachments: [
          ...attachmentPayload(briefFiles, "brief"),
          ...attachmentPayload(complianceFiles, "compliance"),
          ...attachmentPayload(acceptanceFiles, "acceptance"),
          ...attachmentPayload(captureExamples, "capture_examples"),
          ...attachmentPayload(guidelineFiles, "guidelines"),
        ],
        publish,
      };
      if (!id) return post<Rfp>("/requests", body);

      // PATCH cannot publish. The router drops `publish` from the body and
      // update_request never reads it, so the old single call saved the draft,
      // left it a draft, notified nobody — and still toasted "published". Save
      // first, then publish through the endpoint that actually does it, which
      // is also the one that checks the destination is reachable.
      const saved = await patch<Rfp>(`/requests/${id}`, body);
      return publish ? await post<Rfp>(`/requests/${id}/publish`) : saved;
    },
    onSuccess: (r, publish) => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
      // The detail page we are about to land on reads this key, and with a
      // 15s staleTime it would otherwise render what the request said before
      // the edit.
      void qc.invalidateQueries({ queryKey: ["request", r.id] });
      toast(
        publish ? "RFP published" : id ? "Draft updated" : "Draft saved",
        publish
          ? "Every delivery partner can bid on it now."
          : `${r.reference_code} is waiting in your RFPs.`,
        "success",
      );
      guard.release(); // saved: leaving now loses nothing
      navigate(`/requests/${r.id}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  // Problems keyed by the field they belong to, not a list of sentences.
  //
  // The old shape space-joined every problem into one Callout — "Give the
  // request a title. Say how much you need. Wait for the compliance
  // attachment." — leaving the client to work out which control each clause
  // meant. Field already takes an `error` prop and .field[data-invalid]
  // already reddens the control; nothing had ever passed one.
  //
  // `blocking` is for problems that belong to no single field, which is only
  // ever an upload still in flight.
  type Problems = { fields: Partial<Record<keyof Draft, string>>; blocking: string[] };

  const validateStep = (): Problems => {
    const f: Partial<Record<keyof Draft, string>> = {};
    const blocking: string[] = [];

    if (step === 0) {
      if (!d.title.trim()) f.title = "Give the RFP a title.";
      else if (d.title.trim().length < 3) f.title = "At least three characters.";
      if (!d.category.trim()) f.category = "Choose a category.";
      if (otherUseCase && !d.objective.trim())
        f.objective = "Say what it is for — \u201cSomething else\u201d on its own tells a partner nothing.";
      if (!d.target_quantity.trim())
        f.target_quantity = "Partners cannot price a blank quantity.";
      else if (Number(d.target_quantity) <= 0)
        f.target_quantity = "More than zero.";
      if ([...briefFiles, ...captureExamples, ...guidelineFiles].some((a) => a.status === "uploading"))
        blocking.push("Wait for the reference files to finish uploading.");
    }

    if (step === 1) {
      if ([...complianceFiles, ...acceptanceFiles].some((a) => a.status === "uploading"))
        blocking.push("Wait for the attachments to finish uploading.");
    }

    if (step === 2) {
      if (d.budget_min && d.budget_max && Number(d.budget_max) < Number(d.budget_min))
        f.budget_max = "At least the minimum.";
      if (d.starts_on && d.delivery_due_on && d.delivery_due_on < d.starts_on)
        f.delivery_due_on = "On or after the start.";
      // A pilot nobody sized is not a pilot — request_pilot_shape says the
      // same in the database, but a person should hear it here.
      if (d.pilot_required && !d.pilot_quantity.trim())
        f.pilot_quantity = "Say how large the pilot should be.";
    }
    // The destination is deliberately unchecked. A draft may be saved without
    // one — the API says so in as many words — and blocking Continue left no
    // route to a save button. It is enforced at publish, below.
    return { fields: f, blocking };
  };

  // What publishing needs that a draft does not. Checked before the confirm
  // dialog opens, so a request cannot get six steps in and fail on the server.
  const publishProblems = (): string[] => {
    const problems: string[] = [];
    if (!d.title.trim()) problems.push("Give the RFP a title.");
    if (d.title.trim().length < 3) problems.push("The title needs at least three characters.");
    if (!d.target_quantity.trim())
      problems.push("Say how much you need — partners cannot price a blank quantity.");
    if (d.pilot_required && !d.pilot_quantity.trim())
      problems.push("Say how large the pilot should be.");
    if (!d.storage_target_id) problems.push("Choose where captured data should be delivered.");
    else if (!targetIsVerified(d.storage_target_id))
      problems.push("Test the connection to your delivery destination first.");
    if (allFiles.some((a) => a.status === "uploading"))
      problems.push("Wait for the attachments to finish uploading.");
    return problems;
  };

  const errOf = (k: keyof Draft) => fieldErr[k] ?? null;

  useLayoutEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    const top = stepTopRef.current;
    const scrollToTop = () => {
      top?.focus({ preventScroll: true });
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        window.scrollTo(0, 0);
      }
    };
    scrollToTop();
    const frame = window.requestAnimationFrame(scrollToTop);
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const next = () => {
    const { fields, blocking } = validateStep();
    setFieldErr(fields);
    const count = Object.keys(fields).length;
    if (count || blocking.length) {
      // The banner names the shape of the problem; the fields themselves say
      // what is wrong with each. Repeating every sentence up here is what made
      // the old one a wall of text.
      return setError(blocking.join(" ") || (count === 1
        ? "One field needs attention."
        : `${count} fields need attention.`));
    }
    setError(null);
    stepChanged.current = true;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const askToPublish = () => {
    const problems = publishProblems();
    if (problems.length) return setError(problems.join(" "));
    setError(null);
    setConfirming(true);
  };

  // Editing shows a fully interactive blank form until the GET lands, and the
  // hydration above then replaces the whole draft — so anything typed in that
  // window was silently discarded.
  if (id && existing.isLoading) {
    return (
      <View title="Loading the draft…">
        <Panel><Skeleton rows={6} label="Loading this RFP" /></Panel>
      </View>
    );
  }
  if (id && existing.isError) {
    return (
      <View title="RFP not found">
        <Panel>
          <Callout tone="critical" title="This RFP could not be opened">
            It may have been published already, or belong to another organisation.
            Only a draft can be edited.
          </Callout>
          <div className="btnrow"><Button onClick={() => navigate("/requests")}>Back to RFPs</Button></div>
        </Panel>
      </View>
    );
  }

  return (
    <View
      title={id ? `Edit ${existing.data?.reference_code ?? "draft"}` : "New RFP"}
      sub="The defaults are honest — anything you skip is marked 'to be agreed', never hidden."
    >
      {/* The chip that used to live here was aria-hidden, so the only progress
          affordance on the page was invisible to assistive tech. The rail is
          what the prototype had, and this file already renders one. */}
      <div ref={stepTopRef} tabIndex={-1} style={{ outline: "none" }}>
        <Panel flush>
          <StageRail stages={STEPS} current={STEPS[step]!} />
        </Panel>
      </div>
      <Panel>
        {step === 0 && (
          <div className="formgrid">
            <Field label="RFP title" required span error={errOf("title")}>
              {(id) => <input id={id} className={inputCls} value={d.title} onChange={set("title")} placeholder="Retail shelf imagery across 12 metro markets" />}
            </Field>
            <Field label="Category / Content Type" required error={errOf("category")}>
              {(id) => (
                <select id={id} className={selectCls} value={d.category} onChange={setCategory}>
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Quantity" required error={errOf("target_quantity")}>
              {(id) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    id={id}
                    className={inputCls}
                    type="number"
                    min={1}
                    value={d.target_quantity}
                    onChange={set("target_quantity")}
                    placeholder="25000"
                    style={{ minWidth: 0 }}
                  />
                  <span className="small muted" style={{ flex: "none" }}>{unitLabel(d.target_unit)}</span>
                </div>
              )}
            </Field>
            {impliedMedia ? (
              // The unit already answered this. Shown rather than hidden, so
              // the client can see what a crowd resource will be allowed to upload —
              // it is the same rule either way, just not asked twice.
              <Field label="Media" hint="Taken from the unit above.">
                {() => (
                  <p className="small muted" style={{ margin: "6px 0 0" }}>
                    Crowd resources may upload{" "}
                    {impliedMedia.map((m: string) => labelOf(CAPTURE_MEDIA, m).toLowerCase()).join(" or ")} only.
                  </p>
                )}
              </Field>
            ) : (
              <CheckGroup
                label="Media"
                options={CAPTURE_MEDIA}
                value={d.capture_media}
                onChange={(v) => setD((x) => ({ ...x, capture_media: v }))}
                hint="What the capture app will let them upload. Leave both unticked and anything visual is accepted."
                columns={2}
              />
            )}
            <Field label="Location / Locale">
              {(id) => (
                <CountryLocaleCombobox
                  id={id}
                  value={d.countries}
                  onChange={(countries) => setD((x) => ({ ...x, countries }))}
                />
              )}
            </Field>
            <Field label="Location Type" hint="The kind of place, not the address.">
              {(id) => (
                <select id={id} className={selectCls} value={d.location_type} onChange={set("location_type")}>
                  <option value="">Not specified</option>
                  {LOCATION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
            </Field>
            <Field
              label="Device Specifications"
              span
              hint="Optional device type, model, OS/version, or special hardware requirements."
            >
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.capture_notes} onChange={set("capture_notes")} placeholder="Android 12+, LiDAR-capable phone, calibrated camera, or other hardware needs." />}
            </Field>
            <Field label="Purpose" hint="Shapes what a partner has to agree to downstream.">
              {(id) => (
                <select id={id} className={selectCls} value={d.use_case} onChange={set("use_case")}>
                  <option value="">Not specified</option>
                  {USE_CASES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
            </Field>
            <Field
              label="Project Objective"
              span
              required={otherUseCase}
              error={errOf("objective")}
              hint={otherUseCase
                ? "You picked \u201cSomething else\u201d. Say what, so a partner knows what they are bidding on."
                : "One sentence. It is the first thing a partner reads."}
            >
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.objective} onChange={set("objective")} placeholder="Train a shelf-recognition model across our top 12 markets." />}
            </Field>

            <label className="checkline span">
              <input type="checkbox" checked={showCapture} onChange={(e) => setShowCapture(e.target.checked)} />
              <span>
                Add capture detail
                <span className="cl-sub">Resolution, orientation, squareness, whether a GPS fix is required; a clip's length and size.</span>
              </span>
            </label>
            {showCapture && (
              <>
                {wantsPhoto && (
                  <Field label="Minimum megapixels" hint="Blank for no floor.">
                    {(id) => <input id={id} className={inputCls} type="number" min={0} step="0.1" value={d.capture_min_megapixels} onChange={set("capture_min_megapixels")} placeholder="12" />}
                  </Field>
                )}
                <Field label="Orientation">
                  {(id) => (
                    <select id={id} className={selectCls} value={d.capture_orientation} onChange={set("capture_orientation")}>
                      <option value="">Either</option>
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                    </select>
                  )}
                </Field>
                <Field
                  label="Maximum tilt"
                  hint="Degrees off square. For wall and shelf work — blank for overhead or tabletop."
                >
                  {(id) => <input id={id} className={inputCls} type="number" min={0} max={45} step="1" value={d.capture_max_tilt_deg} onChange={set("capture_max_tilt_deg")} placeholder="10" />}
                </Field>
                <label className="checkline span">
                  <input type="checkbox" checked={d.capture_require_gps} onChange={(e) => setD((x) => ({ ...x, capture_require_gps: e.target.checked }))} />
                  <span>
                    Require a GPS fix on every capture
                    <span className="cl-sub">Rejects anything taken with location switched off.</span>
                  </span>
                </label>
                {/* Video only. The phone refuses a clip outside these before it uploads
                    a byte; the camera stops recording at the maximum. */}
                {wantsVideo && (
                  <>
                    <Field label="Shortest clip" hint="Seconds. Blank for no minimum.">
                      {(id) => <input id={id} className={inputCls} type="number" min={0} step="1" value={d.capture_min_duration_s} onChange={set("capture_min_duration_s")} placeholder="30" />}
                    </Field>
                    <Field label="Longest clip" hint="Seconds, up to 600. The camera stops there.">
                      {(id) => <input id={id} className={inputCls} type="number" min={1} max={600} step="1" value={d.capture_max_duration_s} onChange={set("capture_max_duration_s")} placeholder="120" />}
                    </Field>
                    <Field label="Video size" hint="The short side of the frame, whichever way the phone is held.">
                      {(id) => (
                        <select id={id} className={selectCls} value={d.capture_min_video_lines} onChange={set("capture_min_video_lines")}>
                          <option value="">Any</option>
                          <option value="720">At least 720p</option>
                          <option value="1080">At least 1080p</option>
                          <option value="2160">At least 2160p (4K)</option>
                        </select>
                      )}
                    </Field>
                    <label className="checkline span">
                      <input type="checkbox" checked={d.capture_allow_library} onChange={(e) => setD((x) => ({ ...x, capture_allow_library: e.target.checked }))} />
                      <span>
                        Allow clips from the phone's gallery
                        <span className="cl-sub">Otherwise every clip is recorded in the app, where it was and when it says.</span>
                      </span>
                    </label>
                  </>
                )}
              </>
            )}

            <AttachmentsField
              label="Already written a spec?"
              span
              hint="Attach it and skip the typing — a document carries far more than this form asks for, and every bidder can read it. PDF, Word, Excel or a zip, up to 25 MB."
              items={briefFiles}
              onChange={setBriefFiles}
            />
            <AttachmentsField
              label="Capture examples"
              span
              hint="What good looks like — reference shots, a style guide."
              items={captureExamples}
              onChange={setCaptureExamples}
            />
            <AttachmentsField
              label="Guidelines"
              span
              hint="Site-access rules, a shot list, anything a crowd resource in the field needs."
              items={guidelineFiles}
              onChange={setGuidelineFiles}
            />
          </div>
        )}
        {step === 1 && (
          <div className="formgrid">
            <Field label="Acceptance criteria" span hint="Frozen into the contract at award — disputes are arbitrated against exactly these words.">
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.acceptance} onChange={set("acceptance")} placeholder="95% or better pass on the automated blur check; 5% manual audit sample" />}
            </Field>
            <Field label="Pass rate required (%)" hint="Below this the batch is rejected rather than part-accepted.">
              {(id) => <input id={id} className={inputCls} type="number" min={0} max={100} step="0.1" value={d.qt_min_pass_rate_pct} onChange={set("qt_min_pass_rate_pct")} placeholder="95" />}
            </Field>
            <Field label="Compliance notes" span hint="Also copied onto the contract. Site permissions, anything a crew must be told.">
              {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.compliance_notes} onChange={set("compliance_notes")} placeholder="No shoppers or faces in frame. Store permission letter attached." />}
            </Field>

            <Field label="Are people in frame?" span hint="Everything below follows from this one answer.">
              {(id) => (
                <select id={id} className={selectCls} value={d.people_in_frame} onChange={set("people_in_frame")}>
                  <option value="">Not specified</option>
                  {PEOPLE_IN_FRAME.map((o) => <option key={o.value} value={o.value}>{o.label} — {o.hint}</option>)}
                </select>
              )}
            </Field>

            {d.people_in_frame !== "" && d.people_in_frame !== "none" && (
              <>
                <Callout tone="attention" title="These answers reach the people doing the work">
                  A partner reads them on the brief before bidding. Getting them wrong
                  pushes the judgement onto whoever is holding the camera.
                </Callout>
                <Field label="Children">
                  {(id) => (
                    <select id={id} className={selectCls} value={d.minors_policy} onChange={set("minors_policy")}>
                      <option value="">Not specified</option>
                      {MINORS_POLICIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="Lawful basis" hint="Under GDPR Article 6, or the honest answer that none applies.">
                  {(id) => (
                    <select id={id} className={selectCls} value={d.lawful_basis} onChange={set("lawful_basis")}>
                      <option value="">Not specified</option>
                      {LAWFUL_BASES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </Field>
                <CheckGroup
                  label="De-identification required"
                  options={DEIDENTIFICATION}
                  value={d.deidentification}
                  onChange={(v) => setD((x) => ({ ...x, deidentification: v }))}
                  hint="Applied before the data reaches you."
                  columns={3}
                />
                <CheckGroup
                  label="What the data may be used for"
                  options={PERMITTED_USES}
                  value={d.permitted_uses}
                  onChange={(v) => setD((x) => ({ ...x, permitted_uses: v }))}
                  hint="Anything not ticked is off-limits, including to you."
                  columns={3}
                />
                <Field label="Regulations that apply" span hint="GDPR, DPDP, CCPA — whatever governs this. Enter or comma to add.">
                  {(id) => (
                    <TagInput
                      id={id}
                      value={d.regulations}
                      onChange={(v) => setD((x) => ({ ...x, regulations: v }))}
                      placeholder="GDPR"
                    />
                  )}
                </Field>
                <label className="checkline span">
                  <input type="checkbox" checked={d.biometric_processing} onChange={(e) => setD((x) => ({ ...x, biometric_processing: e.target.checked }))} />
                  <span>
                    This involves biometric processing
                    <span className="cl-sub">Faces, voices or gait used to identify a person. A stricter regime applies.</span>
                  </span>
                </label>
              </>
            )}

            <label className="checkline span">
              <input type="checkbox" checked={d.partner_reuse_allowed} onChange={(e) => setD((x) => ({ ...x, partner_reuse_allowed: e.target.checked }))} />
              <span>
                The partner may reuse this data
                <span className="cl-sub">Off means they collect it for you and keep no rights to it.</span>
              </span>
            </label>

            <label className="checkline span">
              <input type="checkbox" checked={showRejection} onChange={(e) => setShowRejection(e.target.checked)} />
              <span>
                Set a rejection policy
                <span className="cl-sub">Retakes, who bears rework, whether a partial batch is acceptable.</span>
              </span>
            </label>
            {showRejection && (
              <>
                <Field label="Retakes allowed" hint="Per rejected capture.">
                  {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.rp_max_retakes} onChange={set("rp_max_retakes")} placeholder="2" />}
                </Field>
                <Field label="Retake window (days)">
                  {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.rp_retake_window_days} onChange={set("rp_retake_window_days")} placeholder="7" />}
                </Field>
                <Field label="Who bears rework cost">
                  {(id) => (
                    <select id={id} className={selectCls} value={d.rp_rework_cost_bearer} onChange={set("rp_rework_cost_bearer")}>
                      <option value="">To be agreed</option>
                      {REWORK_BEARERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </Field>
                <label className="checkline span">
                  <input type="checkbox" checked={d.rp_partial_acceptance_allowed} onChange={(e) => setD((x) => ({ ...x, rp_partial_acceptance_allowed: e.target.checked }))} />
                  <span>
                    Accept a partial batch
                    <span className="cl-sub">Take and pay for what passed instead of returning the lot.</span>
                  </span>
                </label>
              </>
            )}

            <AttachmentsField
              label="Compliance documents"
              span
              hint="A DPA, site-access rules, a privacy notice. Partners read these while bidding."
              items={complianceFiles}
              onChange={setComplianceFiles}
            />
            <AttachmentsField
              label="Acceptance documents"
              span
              hint="A rubric, a spec sheet, a worked example of a pass and a fail."
              items={acceptanceFiles}
              onChange={setAcceptanceFiles}
            />
          </div>
        )}
        {step === 2 && (
          <div className="formgrid">
            <Field label="Budget minimum (USD)">
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_min} onChange={set("budget_min")} />}
            </Field>
            <Field label="Budget maximum (USD)" error={errOf("budget_max")}>
              {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_max} onChange={set("budget_max")} />}
            </Field>
            <label className="checkline span">
              <input type="checkbox" checked={!d.budget_disclosed} onChange={(e) => setD((x) => ({ ...x, budget_disclosed: !e.target.checked }))} />
              <span>
                Keep the budget to ourselves
                <span className="cl-sub">Bidders see the RFP but not the range. You still see it here.</span>
              </span>
            </label>
            <Field label="Project start">
              {(id) => <input id={id} className={inputCls} type="date" value={d.starts_on} onChange={set("starts_on")} />}
            </Field>
            <Field label="Delivery deadline" error={errOf("delivery_due_on")}>
              {(id) => <input id={id} className={inputCls} type="date" value={d.delivery_due_on} onChange={set("delivery_due_on")} />}
            </Field>

            <label className="checkline span">
              <input type="checkbox" checked={d.pilot_required} onChange={(e) => setD((x) => ({ ...x, pilot_required: e.target.checked }))} />
              <span>
                Start with a paid pilot
                <span className="cl-sub">A small first batch, accepted before the rest proceeds.</span>
              </span>
            </label>
            {d.pilot_required && (
              <>
                <Field label="Pilot size" required error={errOf("pilot_quantity")} hint={`In ${unitLabel(d.target_unit)}.`}>
                  {(id) => <input id={id} className={inputCls} type="number" min={1} value={d.pilot_quantity} onChange={set("pilot_quantity")} placeholder="500" />}
                </Field>
                <Field label="Pilot due">
                  {(id) => <input id={id} className={inputCls} type="date" value={d.pilot_due_on} onChange={set("pilot_due_on")} />}
                </Field>
              </>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <DestinationStep
                value={d.storage_target_id}
                onChange={(v) => setD((x) => ({ ...x, storage_target_id: v }))}
              />
            </div>
          </div>
        )}
        {step === 3 && (
          // Only what was actually answered. The old review listed 33 rows
          // whether or not they held anything, so "To be agreed" appeared
          // sixteen times and the few real answers were lost among them.
          <Dl rows={[
            ["Title", d.title || "—"],
            ["Category", titleCase(d.category)],
            ...(d.objective ? [["Objective", d.objective] as Row] : []),
            ...(d.use_case ? [["Purpose", labelOf(USE_CASES, d.use_case as UseCase)] as Row] : []),
            ["Quantity", d.target_quantity
              ? `${d.target_quantity} ${unitLabel(d.target_unit)}`
              : "To be agreed"],
            ["Media", d.capture_media.length
              ? d.capture_media.map((m) => labelOf(CAPTURE_MEDIA, m)).join(", ")
              : "Anything visual"],
            ...(d.countries.length ? [["Location / Locale", d.countries.map(localeLabel).join(", ")] as Row] : []),
            ...(d.location_type
              ? [["Location Type", labelOf(LOCATION_TYPES, d.location_type as LocationType)] as Row] : []),
            ...(d.capture_notes ? [["Device Specifications", d.capture_notes] as Row] : []),
            ["Acceptance", d.acceptance || "Client review on delivery"],
            ...(d.qt_min_pass_rate_pct
              ? [["Pass rate", `${d.qt_min_pass_rate_pct}%`] as Row] : []),
            ...(d.compliance_notes ? [["Compliance", d.compliance_notes] as Row] : []),
            ["People in frame", labelOf(PEOPLE_IN_FRAME, d.people_in_frame as PeopleInFrame)],
            ...(d.people_in_frame && d.people_in_frame !== "none" ? [
              ["Children", labelOf(MINORS_POLICIES, d.minors_policy as MinorsPolicy)] as Row,
              ["Lawful basis", labelOf(LAWFUL_BASES, d.lawful_basis as LawfulBasis)] as Row,
              ["De-identification", labelsOf(DEIDENTIFICATION, d.deidentification)] as Row,
              ["Permitted uses", labelsOf(PERMITTED_USES, d.permitted_uses)] as Row,
              ...(d.regulations.length ? [["Regulations", d.regulations.join(", ")] as Row] : []),
              ...(d.biometric_processing ? [["Biometric processing", "Yes"] as Row] : []),
            ] : []),
            ["Partner may reuse the data", d.partner_reuse_allowed ? "Yes" : "No"],
            ["Budget", d.budget_disclosed
              ? `${money(d.budget_min || null)} – ${money(d.budget_max || null)}`
              : `${money(d.budget_min || null)} – ${money(d.budget_max || null)} · withheld from bidders`],
            ["Timeline", `${fmtDate(d.starts_on || null)} → ${fmtDate(d.delivery_due_on || null)}`],
            ...(d.pilot_required ? [["Pilot", `${d.pilot_quantity || "?"} ${unitLabel(d.target_unit)}${d.pilot_due_on ? ` by ${fmtDate(d.pilot_due_on)}` : ""}`] as Row] : []),
            ...(allFiles.length
              ? [["Attached", allFiles.map((f) => f.filename).join(", ")] as Row] : []),
            ["Delivered to", <DestinationSummary key="dest" id={d.storage_target_id} />],
          ]} />
        )}
        {error && <Callout tone="critical" title={error} />}
      </Panel>
      <div className="btnrow">
        {step > 0 && <Button onClick={() => { setError(null); stepChanged.current = true; setStep((s) => s - 1); }}>Back</Button>}
        {/* Available on every step, not just the last. Everything typed lives
            in component state with no autosave and no exit control, so hiding
            the only save behind five Continues meant clicking "Requests" in
            the rail silently destroyed the lot. */}
        <Button
          onClick={() => save.mutate(false)}
          disabled={save.isPending || uploading}
        >
          {save.isPending && !confirming ? "Saving…" : "Save as draft"}
        </Button>
        {step < STEPS.length - 1 && <Button variant="primary" onClick={next}>Continue</Button>}
        {step === STEPS.length - 1 && (
          <Button
            variant="primary"
            onClick={askToPublish}
            disabled={save.isPending || uploading}
          >
            Publish to partners
          </Button>
        )}
      </div>

      {guard.dialog}

      {confirming && (
        <Dialog
          title="Publish to partners?"
          sub={d.title}
          busy={save.isPending}
          onClose={() => setConfirming(false)}
          foot={
            <>
              <Button onClick={() => setConfirming(false)} disabled={save.isPending}>Cancel</Button>
              <Button variant="primary" onClick={() => save.mutate(true)} disabled={save.isPending}>
                {save.isPending ? "Publishing…" : "Publish"}
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Every delivery partner is notified, and this cannot be undone">
            Partners start pricing against the words in this RFP. There is no way to
            unpublish it or edit it afterwards — only to see it through or let it lapse.
          </Callout>
        </Dialog>
      )}
    </View>
  );
}

/* --- where captured data is delivered ---------------------------------------
 *
 * The client supplies the bucket, so the credential is never taken on trust:
 * it is tested against the real endpoint before it can be saved, and a request
 * cannot be published until that test has passed. The alternative is finding
 * out a key is wrong when a crowd resource is standing in a shop with a capture that
 * will never upload.
 *
 * Which fields appear depends on the provider, because the two do not take the
 * same kind of credential.
 *
 * This is the CLIENT's own storage, and theirs to choose. SourceHub's own
 * container — where attachments and capture examples go — is Azure, fixed, and
 * never appears in this form.
 */

const PROVIDERS = [
  ["azure_blob", "Azure Blob Storage"],
  ["s3", "S3-compatible — AWS, MinIO, R2, Wasabi, GCS interop"],
] as const;

function useTargets() {
  return useQuery({
    queryKey: ["storage-targets"],
    queryFn: () => get<StorageTarget[]>("/storage-targets"),
  });
}

function describeTarget(t: StorageTarget): string {
  const where = t.key_prefix ? `${t.bucket}/${t.key_prefix}` : t.bucket;
  // Region only ever reads as noise on Azure, where there isn't one.
  return `${where}${t.region ? ` · ${t.region}` : ""}`;
}

function DestinationSummary({ id }: { id: string }) {
  const targets = useTargets();
  // Without the loading branch this said "Not chosen" for a destination the
  // builder had just refused to let the client past without.
  if (targets.isLoading) return <>Loading…</>;
  const t = (targets.data ?? []).find((x) => x.id === id);
  if (!t) return <>Not chosen</>;
  return <>{t.label} — {describeTarget(t)}</>;
}

// POST /storage-targets/{id}/verify has existed since destinations shipped and
// nothing called it, so a destination whose credential had been revoked showed
// a red pill with no way to re-test — the only escape was creating a duplicate.
function RetestButton({ target }: { target: StorageTarget }) {
  const qc = useQueryClient();
  const toast = useToast();
  const verify = useMutation({
    mutationFn: () => post<StorageTarget>(`/storage-targets/${target.id}/verify`),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: ["storage-targets"] });
      toast("Destination reachable", `Wrote and read back a test file in ${t.bucket}.`, "success");
    },
    onError: (e) => {
      void qc.invalidateQueries({ queryKey: ["storage-targets"] });
      toast("Still not reachable", e instanceof Error ? e.message : "The test failed.", "critical");
    },
  });
  return (
    <Button size="sm" onClick={() => verify.mutate()} disabled={verify.isPending}>
      {verify.isPending ? "Testing…" : "Test again"}
    </Button>
  );
}

function DestinationStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const targets = useTargets();
  const [adding, setAdding] = useState(false);
  const rows = targets.data ?? [];

  return (
    <div className="col">
      <p className="muted">
        Captured data is written straight to your own storage. SourceHub signs each upload
        and keeps no copy.
      </p>

      {targets.isLoading && <Skeleton rows={3} label="Loading your destinations" />}

      {/* A client without storage.manage gets a 403 here. Saying so beats an
          empty step that reads as "you have none" and invites a duplicate. */}
      {targets.isError && (
        <Callout tone="critical" title="Could not load your destinations">
          {targets.error instanceof Error ? targets.error.message : "Try again in a moment."}
          {" "}You can still save this as a draft and choose a destination later.
        </Callout>
      )}

      {rows.length > 0 && (
        <TableWrap>
        <table>
          <thead>
            <tr>
              <th style={{ width: "2.5rem" }}><span className="sr">Use this destination</span></th>
              <th>Destination</th>
              <th>Where</th>
              <th>Tested</th>
              <th className="right"><span className="sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <input
                    type="radio"
                    name="destination"
                    checked={value === t.id}
                    onChange={() => onChange(t.id)}
                    aria-label={`Deliver to ${t.label}`}
                  />
                </td>
                <td>
                  <strong>{t.label}</strong>
                  <div className="small muted">{PROVIDERS.find(([v]) => v === t.provider)?.[1]}</div>
                </td>
                <td>{describeTarget(t)}</td>
                <td>
                  {t.verified_at
                    ? <Pill tone="success">Reachable</Pill>
                    : <Pill tone="critical">Not reachable</Pill>}
                  {!t.verified_at && t.verify_error && (
                    <div className="small muted">{t.verify_error}</div>
                  )}
                </td>
                <td className="right"><div className="rowactions"><RetestButton target={t} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        </TableWrap>
      )}

      {!adding && (
        <div className="btnrow">
          <Button onClick={() => setAdding(true)}>
            {rows.length ? "Add another destination" : "Add a destination"}
          </Button>
        </div>
      )}

      {adding && (
        <NewDestination
          onCancel={() => setAdding(false)}
          onCreated={(t) => { setAdding(false); onChange(t.id); }}
        />
      )}
    </div>
  );
}

function NewDestination({
  onCancel, onCreated,
}: { onCancel: () => void; onCreated: (t: StorageTarget) => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    label: "", provider: "azure_blob", bucket: "", endpoint: "", region: "", key_prefix: "",
    access_key_id: "", secret_access_key: "",
    account_name: "", account_key: "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const secretFor = (): Record<string, string> =>
    f.provider === "azure_blob"
      ? { account_name: f.account_name, account_key: f.account_key }
      : { access_key_id: f.access_key_id, secret_access_key: f.secret_access_key };

  // One button, and it does both. There is no reason to save a destination
  // that has not been proved to work.
  const create = useMutation({
    mutationFn: () => post<StorageTarget>("/storage-targets", {
      label: f.label,
      provider: f.provider,
      bucket: f.bucket,
      endpoint: f.endpoint || null,
      region: f.region || null,
      key_prefix: f.key_prefix || null,
      secret: secretFor(),
    }),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: ["storage-targets"] });
      toast("Destination ready", `Wrote and read back a test file in ${t.bucket}.`, "success");
      onCreated(t);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not reach that storage"),
  });

  return (
    <Panel title="Add a destination">
      <div className="formgrid">
        <Field label="Name" required span>
          {(id) => <input id={id} className={inputCls} value={f.label} onChange={set("label")} placeholder="Field capture, Mumbai" />}
        </Field>
        <Field label="Provider" required>
          {(id) => (
            <select id={id} className={inputCls} value={f.provider} onChange={set("provider")}>
              {PROVIDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
        </Field>
        <Field label={f.provider === "azure_blob" ? "Container" : "Bucket"} required>
          {(id) => <input id={id} className={inputCls} value={f.bucket} onChange={set("bucket")} placeholder="acme-field-capture" />}
        </Field>

        {f.provider === "s3" && (
          <>
            <Field label="Region">
              {(id) => <input id={id} className={inputCls} value={f.region} onChange={set("region")} placeholder="ap-south-1 — required outside us-east-1" />}
            </Field>
            <Field label="Endpoint">
              {(id) => <input id={id} className={inputCls} value={f.endpoint} onChange={set("endpoint")} placeholder="Blank for AWS; set it for MinIO, R2 or GCS interop" />}
            </Field>
            <Field label="Access key ID" required>
              {(id) => <input id={id} className={inputCls} value={f.access_key_id} onChange={set("access_key_id")} autoComplete="off" />}
            </Field>
            <Field label="Secret access key" required>
              {(id) => <input id={id} type="password" className={inputCls} value={f.secret_access_key} onChange={set("secret_access_key")} autoComplete="off" />}
            </Field>
          </>
        )}

        {f.provider === "azure_blob" && (
          <>
            <Field label="Account name" required>
              {(id) => <input id={id} className={inputCls} value={f.account_name} onChange={set("account_name")} placeholder="acmefieldcapture" />}
            </Field>
            <Field label="Account key" required>
              {(id) => <input id={id} type="password" className={inputCls} value={f.account_key} onChange={set("account_key")} autoComplete="off" />}
            </Field>
          </>
        )}

        <Field label="Folder" span>
          {(id) => <input id={id} className={inputCls} value={f.key_prefix} onChange={set("key_prefix")} placeholder="Optional — captures are written under this prefix, e.g. sourcehub/" />}
        </Field>
      </div>

      {error && (
        <Callout tone="critical" title="That storage could not be used">{error}</Callout>
      )}

      <div className="btnrow">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={() => { setError(null); create.mutate(); }} disabled={create.isPending}>
          {create.isPending ? "Testing the connection…" : "Test and save"}
        </Button>
      </div>
    </Panel>
  );
}

/** Who is buying, on the brief where the bid decision is made.
 *  The same rows ClientAndRequestDialog shows on the Responses page — that one
 *  answers the question after the bid, this one before it. Name comes from the
 *  request itself so the panel is never empty while the profile loads. */
function ClientPanel({ name, q }: { name?: string | null; q: UseQueryResult<Org> }) {
  const o = q.data;
  const cp = (o?.profile ?? {}) as Partial<ClientProfile>;
  return (
    <Panel title="Client" sub="Who raised this request">
      {!o && !name && !q.isLoading ? (
        // Name first, profile second: a refused /organisations read still leaves
        // the name the request carried, and naming the buyer is the whole point.
        <Callout tone="neutral" title="Buyer not disclosed">
          This client is visible while their request is open to the market, and to
          any partner that has responded to it.
        </Callout>
      ) : !o ? (
        <Dl rows={[["Name", name ?? "…"]]} />
      ) : (
        <Dl rows={[
          ["Name", o.name],
          ["Reference", o.reference_code],
          ["Country", o.country ?? "—"],
          ["Industry", cp.industry ?? "—"],
          ["Client since", fmtDate(cp.since)],
        ]} />
      )}
    </Panel>
  );
}

/* --- request detail: brief + proposal comparison + award --------------------- */

export function RequestDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const [awarding, setAwarding] = useState<Proposal | null>(null);
  const [rejecting, setRejecting] = useState<Proposal | null>(null);
  const [viewing, setViewing] = useState<Proposal | null>(null);
  const [proposing, setProposing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [awardError, setAwardError] = useState<string | null>(null);

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => get<Rfp>(`/requests/${id}`),
    enabled: !!id,
  });

  // Who is buying. db/180 opens this to a tenant while the request is open,
  // and Fix 9 keeps it open to one that has bid; either way RLS decides, and a
  // 404 simply means the panel says so. A client is not shown its own name.
  const buyerId = request.data?.client_org_id;
  const buyer = useQuery({
    queryKey: ["org", buyerId],
    queryFn: () => get<Org>(`/organisations/${buyerId}`),
    enabled: !!buyerId && session.org_kind !== "client",
    retry: false,
  });

  const publish = useMutation({
    mutationFn: () => post<Rfp>(`/requests/${id}/publish`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["request", id] });
      // The list caches for 15s and used to keep showing Draft after this.
      void qc.invalidateQueries({ queryKey: ["requests"] });
      setPublishing(false);
      toast("Published", "Every delivery partner can bid on it now.", "success");
    },
    // There was no onError at all, so a refused publish — an unreachable
    // destination, a request already published — failed in total silence.
    onError: (e) => setPublishError(e instanceof Error ? e.message : "Could not publish"),
  });

  const award = useMutation({
    mutationFn: (proposalId: string) => post<{ id: string; reference_code: string }>(`/proposals/${proposalId}/award`),
    onSuccess: (c) => {
      toast("Contract awarded", `${c.reference_code} is open.`, "success");
      setAwarding(null);
      void qc.invalidateQueries({ queryKey: ["request", id] });
      void qc.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (e) => setAwardError(e instanceof Error ? e.message : "The award was refused."),
  });

  // No hold: there is no such state. proposal_status is
  // ('submitted','accepted','rejected','withdrawn') and nothing writes a fifth,
  // so a Hold button could only ever 404. Rejecting is the real decision.
  const rejectProposal = useMutation({
    mutationFn: ({ proposalId, reason }: { proposalId: string; reason: string }) =>
      post<Proposal>(`/proposals/${proposalId}/reject`, { reason }),
    onSuccess: () => {
      toast("Proposal rejected", "The partner has been notified.", "success");
      void qc.invalidateQueries({ queryKey: ["request", id] });
      void qc.invalidateQueries({ queryKey: ["requests"] });
    },
    // ReasonDialog keeps itself open and shows a refusal inline, so this must
    // NOT also toast — its own header comment says so. mutateAsync rejecting is
    // what the dialog reads.
  });

  const r = request.data;
  if (!r) return <View title="RFP">{request.isError ? <Callout tone="critical" title="Not found or not yours to see" /> : <p className="muted">Loading…</p>}</View>;

  const meta = statusMeta(requestStatus, r.status);
  const docs = r.attachments ?? [];
  // The client's own written spec. The intake form promises "every bidder can
  // read it" — and until now this page never showed it to anyone.
  const briefDocs = docs.filter((a) => a.slot === "brief");
  const complianceDocs = docs.filter((a) => a.slot === "compliance");
  const acceptanceDocs = docs.filter((a) => a.slot === "acceptance");
  // What request_sample used to hold. Both are the brief's reference material,
  // readable by every bidder, so they belong beside the specification.
  const captureExampleDocs = docs.filter((a) => a.slot === "capture_examples");
  const guidelineDocs = docs.filter((a) => a.slot === "guidelines");
  const isClient = session.org_kind === "client";
  const proposals = r.proposals ?? [];
  // Only badge an outright winner. On a tie every tied bid gets the chip,
  // which is the opposite of a comparison aid.
  const prices = proposals.map((p) => Number(p.price));
  const days = proposals.map((p) => p.duration_days);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const minDays = days.length ? Math.min(...days) : null;
  const lowest = prices.filter((x) => x === minPrice).length === 1 ? minPrice : null;
  const fastest = days.filter((x) => x === minDays).length === 1 ? minDays : null;
  // "submitted" only: proposal_status has no held state, so listing one here
  // gated the buttons on a value the server can never send.
  const canManageProposal = (p: Proposal) => isClient && p.status === "submitted";
  // a withdrawn bid does not count: the partner may propose again, and the
  // server revives that row rather than refusing (submit_proposal).
  const alreadyMine = proposals.some(
    (p) => p.partner_org_id === session.org_id && p.status !== "withdrawn",
  );

  return (
    <View
      title={r.title}
      sub={<span className="id">{r.reference_code} · {titleCase(r.category)}</span>}
      actions={
        <>
          {isClient && r.status === "draft" && (
            <>
              <Link to={`/requests/${r.id}/edit`} className="btn">Edit</Link>
              <Button variant="primary" onClick={() => { setPublishError(null); setPublishing(true); }}>
                Publish
              </Button>
            </>
          )}
          {/* Once awarded this page becomes a read-only record with nothing
              pointing at the work it produced — the only way through was the
              rail. */}
          {isClient && ["accepted", "in_progress", "delivered", "completed"].includes(r.status) && (
            <Link to="/deliveries" className="btn" data-variant="primary">Review deliverables</Link>
          )}
          {session.org_kind === "tenant" && ["published", "proposals_received"].includes(r.status) && !alreadyMine && (
            <Button variant="primary" onClick={() => setProposing(true)}>Respond</Button>
          )}
        </>
      }
    >
      {/* Labelled, not raw: the rail used to read "accepted" while the pill
          beside it read "Awarded" — two names for one state on one screen. */}
      <Panel>
        <StageRail
          stages={LIFECYCLE}
          current={r.status}
          label={(s) => requestStatus[s]?.label ?? s.replace(/_/g, " ")}
        />
      </Panel>

      <div className="g2">
        {!isClient && <ClientPanel name={r.client_name} q={buyer} />}
        <Panel title="Specification">
          <Dl rows={[
            ["Objective", r.objective ?? "—"],
            ["Purpose", labelOf(USE_CASES, r.use_case)],
            ["Quantity", r.spec.target_quantity
              ? `${r.spec.target_quantity} ${unitLabel(r.spec.target_unit)}`
              : "—"],
            ["Media", mediaList(r.spec.capture).length
              ? mediaList(r.spec.capture).map((m) => labelOf(CAPTURE_MEDIA, m)).join(", ")
              : "—"],
            ...(r.spec.capture.min_megapixels
              ? [["Minimum resolution", `${r.spec.capture.min_megapixels} MP`] as [string, React.ReactNode]]
              : []),
            ...(r.spec.capture.max_tilt_deg
              ? [["Squareness", `Within ${r.spec.capture.max_tilt_deg}° of square`] as [string, React.ReactNode]]
              : []),
            ...(r.spec.capture.min_duration_s || r.spec.capture.max_duration_s
              ? [["Clip length", `${r.spec.capture.min_duration_s ?? 0}–${r.spec.capture.max_duration_s ?? 600} s`] as [string, React.ReactNode]]
              : []),
            ...(r.spec.capture.min_video_lines
              ? [["Video size", `At least ${r.spec.capture.min_video_lines}p`] as [string, React.ReactNode]]
              : []),
            ...(r.spec.capture.allow_library
              ? [["Gallery", "Clips may be picked from the phone's gallery"] as [string, React.ReactNode]]
              : []),
            ...(r.spec.capture.require_gps
              ? [["GPS", "A fix is required on every capture"] as [string, React.ReactNode]]
              : []),
            ...(r.spec.capture.notes
              ? [["Device Specifications", r.spec.capture.notes] as [string, React.ReactNode]]
              : []),
            // One row about place, not four. This panel used to carry
            // "Location" (which was the GPS flag), "Where", "Countries" and
            // "Geography" — two near-identical labels for different things
            // plus a prose restatement of both.
            ["Where", [
              r.spec.countries.length ? r.spec.countries.map(localeLabel).join(", ") : null,
              r.spec.location_type ? labelOf(LOCATION_TYPES, r.spec.location_type) : null,
            ].filter(Boolean).join(" · ") || "—"],
            ...(briefDocs.length
              ? [["Brief", <AttachmentList key="br" items={briefDocs} />] as [string, React.ReactNode]]
              : []),
            ...(captureExampleDocs.length
              ? [["Capture examples", <AttachmentList key="ce" items={captureExampleDocs} />] as [string, React.ReactNode]]
              : []),
            ...(guidelineDocs.length
              ? [["Guidelines", <AttachmentList key="gl" items={guidelineDocs} />] as [string, React.ReactNode]]
              : []),
            ["Quality bar", r.spec.quality ?? "—"],
            ...(r.quality.thresholds.min_pass_rate_pct
              ? [["Pass rate required", `${r.quality.thresholds.min_pass_rate_pct}%`] as [string, React.ReactNode]]
              : []),
            ["Acceptance", r.acceptance ?? "—"],
            // Shown under the prose they belong to rather than in a panel of
            // their own: a rubric is part of the acceptance criteria, not a
            // separate topic. A field with no files renders no row.
            ...(acceptanceDocs.length
              ? [["Acceptance documents", <AttachmentList key="ad" items={acceptanceDocs} />] as [string, React.ReactNode]]
              : []),
            ["Compliance", r.compliance_notes ?? "—"],
            ...(complianceDocs.length
              ? [["Compliance documents", <AttachmentList key="cd" items={complianceDocs} />] as [string, React.ReactNode]]
              : []),
          ]} />
        </Panel>

        {/* The compliance answers, on the page a partner reads BEFORE bidding.
            They used to exist only on the client's own review screen and in a
            dialog off My Proposals — so the party bound by the consent rules
            could not read them while deciding whether to take the work. */}
        <Panel
          title="Consent and permitted use"
          sub="What a crew is bound by. Agreed at award and carried into the contract."
        >
          <Dl rows={[
            ["People in frame", labelOf(PEOPLE_IN_FRAME, r.compliance.people_in_frame)],
            ...(r.compliance.people_in_frame && r.compliance.people_in_frame !== "none" ? [
              ["Children", labelOf(MINORS_POLICIES, r.compliance.minors_policy)] as [string, React.ReactNode],
              ["Lawful basis", labelOf(LAWFUL_BASES, r.compliance.lawful_basis)] as [string, React.ReactNode],
              ["De-identification required", labelsOf(DEIDENTIFICATION, r.compliance.deidentification)] as [string, React.ReactNode],
              ...(r.compliance.biometric_processing
                ? [["Biometric processing", "Yes — a stricter regime applies"] as [string, React.ReactNode]]
                : []),
            ] : []),
            ["Permitted uses", labelsOf(PERMITTED_USES, r.compliance.permitted_uses)],
            ...(r.compliance.regulations.length
              ? [["Regulations", r.compliance.regulations.join(", ")] as [string, React.ReactNode]]
              : []),
            ["Partner may reuse the data", r.compliance.partner_reuse_allowed ? "Yes" : "No"],
          ]} />
        </Panel>
        <Panel title="People, budget and timeline">
          <Dl rows={[
            // Only when it was actually asked for. The builder's "People needed"
            // input was removed in 9417b35 but the field is still posted, so
            // every RFP raised since reads headcount 0 — and a flat
            // "People needed: 0" asserts an answer nobody was given the chance
            // to give. Shown when there is a real number, omitted when there
            // is not; restoring the input would bring the row straight back.
            ...(r.people.headcount > 0
              ? [["People needed", String(r.people.headcount)] as [string, React.ReactNode]]
              : []),
            ["Budget", `${money(r.budget_min)} – ${money(r.budget_max)}`],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Status", <Pill key="s" tone={meta.tone}>{meta.label}</Pill>],
          ]} />
        </Panel>
      </div>

      <Panel
        title={isClient ? "Proposals" : "Your response"}
        sub={isClient ? "Competitors never see each other's bids — only you compare them." : undefined}
      >
        {proposals.length === 0 ? (
          <Empty title={isClient ? "No proposals yet" : "No response yet"} hint={r.status === "draft" ? "Publish the RFP first." : isClient ? "Partners have been notified." : "Respond while the RFP is still open."} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  {/* Both are the viewer's own when a partner reads this: RLS
                      returns exactly one proposal, theirs. A column headed
                      "Partner" under a panel headed "Your response" told them
                      their own name. */}
                  {isClient && <><th>Partner</th><th>QA track record</th></>}
                  <th>Price</th><th>Days</th>
                  <th>Methodology</th><th>Status</th>{isClient && <th />}
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const pm = statusMeta(proposalStatus, p.status);
                  return (
                    <tr key={p.id}>
                      {isClient && (
                        <td className="cell-primary">
                          {p.partner_name ?? "—"}
                          {/* comparison, not decoration: meaningless to a sole bid. */}
                          {proposals.length > 1 && (
                            <div className="cell-meta">
                              {Number(p.price) === lowest && <span className="chip">Lowest price</span>}{" "}
                              {p.duration_days === fastest && <span className="chip">Fastest</span>}
                            </div>
                          )}
                        </td>
                      )}
                      {isClient && (
                        <td className="num">{p.partner_qa_pass_rate != null ? `${p.partner_qa_pass_rate}% QA pass` : "—"}</td>
                      )}
                      <td className="num">{money(p.price)}</td>
                      <td className="num">{p.duration_days}</td>
                      <td style={{ maxWidth: 380 }}>
                        {p.methodology}
                        {/* The document the summary stands for. Only this
                            client can open it — a rival gets a 404. */}
                        {(p.attachments ?? []).length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <AttachmentList items={p.attachments ?? []} />
                          </div>
                        )}
                      </td>
                      <td><Pill tone={pm.tone}>{pm.label}</Pill></td>
                      {isClient && (
                        <td className="right"><div className="rowactions">
                          <Button size="sm" onClick={() => setViewing(p)}>Profile</Button>
                          {canManageProposal(p) && (
                            <Button size="sm" variant="danger" onClick={() => setRejecting(p)}>Reject</Button>
                          )}
                          {canManageProposal(p) && (
                            <Button size="sm" variant="primary" onClick={() => setAwarding(p)}>Award</Button>
                          )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {viewing && <PartnerProfileDialog proposal={viewing} onClose={() => setViewing(null)} />}
      {rejecting && (
        <ReasonDialog
          title={`Reject ${rejecting.partner_name ?? "this proposal"}`}
          warning="The partner is notified and the proposal can no longer be awarded."
          confirmLabel="Reject"
          onConfirm={(reason) => rejectProposal.mutateAsync({ proposalId: rejecting.id, reason })}
          onClose={() => setRejecting(null)}
        />
      )}

      {publishing && (
        <Dialog
          title="Publish to partners?"
          sub={r.reference_code}
          busy={publish.isPending}
          onClose={() => setPublishing(false)}
          foot={
            <>
              <Button onClick={() => setPublishing(false)} disabled={publish.isPending}>Cancel</Button>
              <Button variant="primary" onClick={() => publish.mutate()} disabled={publish.isPending}>
                {publish.isPending ? "Publishing…" : "Publish"}
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Every delivery partner is notified, and this cannot be undone">
            Partners start pricing against the words in this RFP. There is no way to
            unpublish it or edit it afterwards — only to see it through or let it lapse.
          </Callout>
          {publishError && <Callout tone="critical" title="Could not publish">{publishError}</Callout>}
        </Dialog>
      )}

      {awarding && (
        <Dialog
          title={`Award to ${awarding.partner_name}?`}
          sub={`${money(awarding.price)} · ${awarding.duration_days} days`}
          busy={award.isPending}
          onClose={() => setAwarding(null)}
          foot={
            <>
              <Button onClick={() => setAwarding(null)} disabled={award.isPending}>Cancel</Button>
              <Button variant="primary" onClick={() => { setAwardError(null); award.mutate(awarding.id); }} disabled={award.isPending}>
                {award.isPending ? "Awarding…" : "Award contract"}
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Awarding opens a contract and invoices milestone 1">
            {/* This said "other proposals remain available, so you can award more
                partners" — the opposite of what award() does. It sets every other
                submitted bid to rejected and notifies each partner, and a second
                award is refused with "This request already has a contract". Saying
                otherwise at the moment of an irreversible decision is the worst
                place to be wrong. */}
            Every other proposal is automatically declined and its partner notified — a request
            has one contract. To turn a bid down before you decide, reject it on its own. Half the
            value is invoiced to you and held in escrow until you approve the delivery.
          </Callout>
          {/* The failure used to toast from the far corner while this dialog
              stayed open with room to say it — every sibling dialog reports
              inline. */}
          {awardError && <Callout tone="critical" title="Could not award">{awardError}</Callout>}
        </Dialog>
      )}

      {proposing && id && (
        <ProposeDialog requestId={id} title={r.title} onClose={() => setProposing(false)} />
      )}
    </View>
  );
}

/* --- the partner behind a proposal -------------------------------------------- */

// A bidder is disclosed to the client it bids to and to nobody else — the
// database says so (org_visible_via_proposal, db/110_auth_functions.sql).
// The shared OrgProfileDialog asks for the org and lets a 404 mean "not
// yours to see"; the proposal seeds the name and QA rate.
function PartnerProfileDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  return (
    <OrgProfileDialog
      orgId={proposal.partner_org_id}
      seedName={proposal.partner_name ?? "Delivery partner"}
      seedQa={proposal.partner_qa_pass_rate}
      onClose={onClose}
    />
  );
}

/* --- tenant: opportunities + propose ----------------------------------------- */

function ProposeDialog({ requestId, title, onClose }: { requestId: string; title: string; onClose: () => void }) {
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [methodology, setMethodology] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<AttachmentDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: () =>
      post(`/requests/${requestId}/proposals`, {
        price: Number(price),
        duration_days: Number(days),
        methodology,
        notes: notes || null,
        attachments: attachmentPayload(files, "methodology"),
      }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast("Response sent", "The client has been notified.", "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <Dialog
      title="RFP response"
      sub={title}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={
              submit.isPending || !price || !days || !methodology.trim() ||
              files.some((f) => f.status === "uploading")
            }
            onClick={() => {
              // the backend requires a real methodology (min 10 chars) — say so
              // instead of silently disabling the button
              if (methodology.trim().length < 10) {
                setError("Say how you will do the work, in at least 10 characters — it is the main thing the client compares.");
                return;
              }
              setError(null);
              submit.mutate();
            }}
          >
            Send response
          </Button>
        </>
      }
    >
      <div className="formgrid">
        <Field label="Price (USD)" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />}
        </Field>
        <Field label="Delivery time (days)" required>
          {(id) => <input id={id} className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />}
        </Field>
        {/* Labelled by what to write, not by the column it lands in. As
            "Methodology" it drew a storage account name, "See attached." and
            this very hint pasted back — three of the first six bids. */}
        <Field label="How you will do the work" required span
          hint="Who captures, where, and over how long. This is what the client compares bids on, and it cannot be changed after you send it."
          error={methodology.trim() && methodology.trim().length < 10 ? "A few words more — 10 characters minimum." : null}>
          {(id) => <textarea id={id} className={textareaCls} rows={4} value={methodology} onChange={(e) => setMethodology(e.target.value)} />}
        </Field>
        <AttachmentsField
          label="RFP response documents"
          span
          max={10}
          // The count and the formats are stated because nothing else says
          // them: the button reads "Attach a file" and the picker simply
          // stops accepting once it is full. Partners were asking whether
          // they had to zip everything into one file.
          hint="Up to 10 files — a method statement, a capability deck, CVs, insurance. PDF, Word, PowerPoint, Excel, images or a zip, 25 MB each. Only this client sees them."
          items={files}
          onChange={setFiles}
        />
        <Field label="Notes" span>
          {(id) => <textarea id={id} className={textareaCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </div>
      {error && <Callout tone="critical" title={error} />}
    </Dialog>
  );
}

export function OpportunitiesPage() {
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => get<Rfp[]>("/opportunities") });
  return (
    <View title="Opportunities" sub="Published RFPs you can still bid on. First proposal in moves it to 'proposals received'.">
      <Panel>
        {(opps.data ?? []).length === 0 ? (
          <Empty title="Nothing open right now" hint="You are notified the moment a client publishes." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Title</th><th>Category</th><th>Budget</th><th>Delivery</th><th /></tr></thead>
              <tbody>
                {(opps.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="id">{r.reference_code}</td>
                    <td className="cell-primary">{r.title}</td>
                    <td>{titleCase(r.category)}</td>
                    <td className="num">{money(r.budget_min)} – {money(r.budget_max)}</td>
                    <td className="num">{fmtDate(r.delivery_due_on)}</td>
                    {/* Not "Brief": that is one of five document slots on the
                        page this opens, and the page carries the whole
                        specification, the terms and the button to bid. */}
                    <td className="right"><div className="rowactions"><Link className="btn" data-size="sm" to={`/requests/${r.id}`}>Opportunity details</Link></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </View>
  );
}

function ProposalDetailDialog({ p, onClose }: { p: Proposal; onClose: () => void }) {
  const pm = statusMeta(proposalStatus, p.status);
  return (
    <Dialog
      title={p.request_title ?? p.request_ref ?? "Response"}
      sub={<span className="id">{p.reference_code}</span>}
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Dl rows={[
        ["RFP", <Link key="r" to={`/requests/${p.request_id}`}>{p.request_title ?? p.request_ref ?? "Open RFP"}</Link>],
        ["Price", `${money(p.price, p.currency)}`],
        ["Delivery time", `${p.duration_days} days`],
        ["How you will do the work", p.methodology],
        ...((p.attachments ?? []).length
          ? [["Supporting document", <AttachmentList key="m" items={p.attachments ?? []} />] as [string, React.ReactNode]]
          : []),
        ["Notes", p.notes ?? "—"],
        ["Status", <Pill key="s" tone={pm.tone}>{pm.label}</Pill>],
        ["Submitted", fmtDateTime(p.submitted_at)],
      ]} />
    </Dialog>
  );
}

export function MyProposalsPage() {
  const navigate = useNavigate();
  const [viewing, setViewing] = useState<Proposal | null>(null);
  const [viewingBrief, setViewingBrief] = useState<Proposal | null>(null);
  const mine = useQuery({ queryKey: ["proposals-mine"], queryFn: () => get<Proposal[]>("/proposals/mine") });
  const withdraw = useMutation({
    mutationFn: (pid: string) => post(`/proposals/${pid}/withdraw`),
  });
  const qc = useQueryClient();
  const wins = useMemo(
    () => (mine.data ?? []).filter((p) => p.status === "accepted").length,
    [mine.data],
  );
  return (
    <View title="Responses" sub={`${mine.data?.length ?? 0} sent · ${wins} won`}>
      <Panel>
        {(mine.data ?? []).length === 0 ? (
          <Empty title="No responses yet" hint="Open an opportunity and respond." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>RFP</th><th>Price</th><th>Days</th><th>Status</th><th /></tr></thead>
              <tbody>
                {(mine.data ?? []).map((p) => {
                  const pm = statusMeta(proposalStatus, p.status);
                  return (
                    <tr key={p.id} className="tap" onClick={() => setViewing(p)}>
                      <td className="id">{p.reference_code}</td>
                      <td className="cell-primary">{p.request_title ?? p.request_ref}</td>
                      <td className="num">{money(p.price)}</td>
                      <td className="num">{p.duration_days}</td>
                      <td><Pill tone={pm.tone}>{pm.label}</Pill></td>
                      <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                        <RowMenu
                          label={`Actions for ${p.reference_code}`}
                          items={[
                            { label: "View response", onSelect: () => setViewing(p) },
                            { label: "View client & RFP", onSelect: () => setViewingBrief(p) },
                            ...(p.status === "withdrawn"
                              ? [{ label: "Respond again", onSelect: () => navigate(`/requests/${p.request_id}`) }]
                              : []),
                            ...(p.status === "submitted"
                              ? [{
                                  label: "Withdraw",
                                  tone: "danger" as const,
                                  onSelect: () => withdraw.mutate(p.id, {
                                    onSuccess: () => void qc.invalidateQueries({ queryKey: ["proposals-mine"] }),
                                  }),
                                }]
                              : []),
                          ]}
                        />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
      {viewing && <ProposalDetailDialog p={viewing} onClose={() => setViewing(null)} />}
      {viewingBrief && (
        <ClientAndRequestDialog proposal={viewingBrief} onClose={() => setViewingBrief(null)} />
      )}
    </View>
  );
}

/* --- the client and the RFP behind one of my proposals ------------------------ */
// Distinct from ProposalDetailDialog above, which shows the bid's own terms:
// this answers "who is buying, and what did they actually ask for".

// Two independent reads, both arbitrated by RLS: request_select_bidder keeps the
// RFP visible to whoever bid on it, and Fix 9 makes the buyer visible the same
// way. Either can 404, and a 404 means exactly "not yours to see".
function ClientAndRequestDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const rfp = useQuery({
    queryKey: ["request", proposal.request_id],
    queryFn: () => get<Rfp>(`/requests/${proposal.request_id}`),
  });
  const client = useQuery({
    queryKey: ["org", proposal.client_org_id],
    queryFn: () => get<Org>(`/organisations/${proposal.client_org_id}`),
    enabled: !!proposal.client_org_id,
  });

  const r = rfp.data;
  const o = client.data;
  const cp = (o?.profile ?? {}) as Partial<ClientProfile>;
  const pm = statusMeta(proposalStatus, proposal.status);

  return (
    <Dialog
      title={proposal.request_title ?? proposal.request_ref ?? "Request"}
      sub={
        <>
          <span className="id">{proposal.reference_code}</span>
          {" · "}{money(proposal.price)} · {proposal.duration_days} days{" "}
          <Pill tone={pm.tone}>{pm.label}</Pill>
        </>
      }
      onClose={onClose}
      foot={<Button onClick={onClose}>Close</Button>}
    >
      <Panel title="Client">
        {client.isError ? (
          <Callout tone="critical" title="Client not available">
            A buyer is visible to you through your response. If it has been withdrawn from the
            record, so has your view of them.
          </Callout>
        ) : !o ? (
          <p className="muted">Loading…</p>
        ) : (
          <Dl rows={[
            ["Name", o.name],
            ["Reference", o.reference_code],
            ["Country", o.country ?? "—"],
            ["Industry", cp.industry ?? "—"],
            ["Client since", fmtDate(cp.since)],
          ]} />
        )}
      </Panel>

      <Panel title="The RFP">
        {rfp.isError ? (
          <Callout tone="critical" title="RFP not available" />
        ) : !r ? (
          <p className="muted">Loading…</p>
        ) : (
          <Dl rows={[
            ["Reference", r.reference_code],
            ["Category", titleCase(r.category)],
            ["Objective", r.objective ?? "—"],
            ["Quantity", r.spec.target_quantity
              ? `${r.spec.target_quantity} ${unitLabel(r.spec.target_unit)}`
              : "—"],
            ["Quality bar", r.spec.quality ?? "—"],
            ["Acceptance", r.acceptance ?? "—"],
            ["Lawful basis", labelOf(LAWFUL_BASES, r.compliance.lawful_basis)],
            ["People in frame", labelOf(PEOPLE_IN_FRAME, r.compliance.people_in_frame)],
            // budget_min and budget_max come back null when the client chose
            // not to disclose them, so this renders the withholding honestly
            // rather than showing an empty range as if none were set.
            ["Budget", r.budget_disclosed
              ? `${money(r.budget_min)} – ${money(r.budget_max)}`
              : "Not disclosed"],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Geography", r.geography ?? "—"],
            ["Compliance", r.compliance_notes ?? "—"],
          ]} />
        )}
      </Panel>
    </Dialog>
  );
}
