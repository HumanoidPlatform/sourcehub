// marketplace — the request builder, requests, opportunities,
// proposal comparison and the award.

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, patch, post } from "@api/client";
import type {
  ClientProfile, Deidentification, LawfulBasis, LocationType, MinorsPolicy, Org,
  PeopleInFrame, PeopleRequirements, PermittedUse, Pricing, Proposal, Rfp,
  StorageTarget, TargetUnit, UseCase,
} from "@api/types";
import {
  Button, Callout, CheckGroup, DataTable, Dialog, Dl, Empty, Field, inputCls, Panel, Pill, RowMenu,
  selectCls, Skeleton, StageRail, TableWrap, TagInput, textareaCls, useToast, View,
} from "@ds/primitives";
import {
  CAPTURE_MEDIA, CATEGORY_MEDIA, DEIDENTIFICATION, labelOf, labelsOf, LAWFUL_BASES,
  LOCATION_TYPES, MINORS_POLICIES, PEOPLE_IN_FRAME, PERMITTED_USES, PRICING_BASES,
  REWORK_BEARERS, TARGET_UNITS, USE_CASES,
} from "./vocabularies";
import { useSession } from "@shared/auth";
import {
  fmtDate, fmtDateTime, fmtDateTimeZone, fmtUntil, isoToLocalInput, localInputToIso, mediaList,
  money, titleCase, utcDateOf,
} from "@shared/format";
import { bidText, describePricing, estimatedTotal, priceText, quantityWords, unitWords } from "@shared/pricing";
import {
  AttachmentList, AttachmentsField, attachmentPayload, fromServer, type AttachmentDraft,
} from "@shared/attachments";
import { useLeaveGuard } from "@shared/leave-guard";
import { useNow } from "@shared/now";
import { useThreads } from "@features/messages/hooks";
import { RequestThreadsPanel } from "@features/messages/request-threads";
import { threadFor } from "@features/messages/state";
import { OrgLogo } from "@shared/org-logo";
import { OrgProfileDialog } from "@shared/org-profile";
import { companyRows, draftFromOrg } from "@shared/org-profile-form";
import { ReasonDialog } from "@shared/reason-dialog";
import { countryLabel } from "@shared/countries";
import { languageLabel } from "@shared/languages";
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

// A bid's one price, read on the request's basis (db/320), formatted like every
// other figure in the console. The server's own sentence (price_text) is the
// fallback for a row that carries the basis but not the unit.
const proposalPriceText = (p: Proposal): string =>
  p.pricing_basis === "per_unit"
    ? p.pricing_unit
      ? `${money(p.price, p.currency)} per ${unitWords(p.pricing_unit, p.pricing_block)}`
      : p.price_text ?? money(p.price, p.currency)
    : money(p.price, p.currency);

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
  const now = useNow();
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
                // by what the whole job is worth: the estimate, whatever basis it was stated on
                sortBy: (r) => {
                  const total = r.pricing?.estimated_total ?? r.pricing?.amount;
                  return total == null ? null : Number(total);
                },
                cell: (r) => (
                  <span style={{ whiteSpace: "nowrap" }}>{describePricing(r.pricing)}</span>
                ),
              },
              {
                header: "Status",
                sortBy: (r) => status(r).label,
                cell: (r) => (
                  <>
                    <Pill tone={status(r).tone}>{status(r).label}</Pill>
                    {biddingClosed(r) && <> <Pill tone="attention">{r.proposal_count ? "Bidding closed" : "Closed · no proposals"}</Pill></>}
                  </>
                ),
              },
              {
                header: "Bids close",
                sortBy: (r) => r.proposals_close_at ?? null,
                cell: (r) => (
                  <span title={fmtDateTimeZone(r.proposals_close_at)}>
                    {!r.proposals_close_at ? "—" : biddingClosed(r) ? "Closed" : ["published", "proposals_received"].includes(r.status) ? fmtUntil(r.proposals_close_at, now) : fmtDate(r.proposals_close_at)}
                  </span>
                ),
              },
              // A closed window with nothing in it is the client's move:
              // extend it or let the request lapse.
              { header: "Waiting on", cell: (r) => (biddingClosed(r) ? "You" : waitingOn(status(r), "client")) },
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
  // db/340 people_requirements: optional, sent only as far as filled
  crew_training: string; crew_experience: string; crew_certification: string;
  // the budget as one amount on a basis (db/320). Per unit, the unit and the
  // quantity are the Scope step's target_unit and target_quantity: one answer,
  // given once; only the block and the amount are asked here.
  budget_disclosed: boolean; pricing_basis: string; pricing_block: string; budget_amount: string;
  pilot_required: boolean; pilot_quantity: string; pilot_due_on: string;
  starts_on: string; delivery_due_on: string;
  // a datetime-local value in the browser's zone; ISO only on the wire
  proposals_close_at: string;
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
  crew_training: "", crew_experience: "", crew_certification: "",
  budget_disclosed: true, pricing_basis: "total", pricing_block: "1000", budget_amount: "",
  pilot_required: false, pilot_quantity: "", pilot_due_on: "",
  starts_on: "", delivery_due_on: "",
  proposals_close_at: "",
  storage_target_id: "",
};

/** Why this bidding deadline cannot go live, or null.
 *
 * The same two rules the server applies (deadline_problem): in the future,
 * and on or before the delivery date MEASURED IN UTC — the database CHECK
 * compares in UTC, so a local evening west of Greenwich is already the next
 * day there. Saying so here keeps a 409 from being the first anyone hears. */
function deadlineProblem(local: string, deliveryDueOn: string | null, now: number = Date.now()): string | null {
  const iso = localInputToIso(local);
  if (!iso) return "Enter a date and time.";
  if (Date.parse(iso) <= now) return "Choose a time in the future.";
  if (deliveryDueOn && (utcDateOf(local) ?? "") > deliveryDueOn)
    return "On or before the delivery deadline (measured in UTC).";
  return null;
}

/** Published (or with bids in) but the window has shut: the state the stage
 *  rail does not show, because it is derived from the clock, not stored. */
function biddingClosed(r: Rfp): boolean {
  return ["published", "proposals_received"].includes(r.status) && !r.bidding_open;
}

/** A number field as the API wants it: absent rather than an empty string,
 *  because every one of these columns is nullable and `""` is not a number. */
const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));
/** Same for text, and for a select whose blank option means "not answered". */
const str = (v: string): string | null => (v.trim() === "" ? null : v.trim());
/** db/340 people_requirements from the form: only the answers given, or null. */
const crewOf = (d: { crew_training: string; crew_experience: string; crew_certification: string }):
  PeopleRequirements | null => {
  const out: PeopleRequirements = {};
  if (d.crew_training.trim()) out.training = d.crew_training.trim();
  if (d.crew_experience.trim()) out.experience = d.crew_experience.trim();
  if (d.crew_certification.trim()) out.certification = d.crew_certification.trim();
  return Object.keys(out).length ? out : null;
};
/** The crew requirements as rows, in a fixed order, only those given. */
const CREW_LABELS: [keyof PeopleRequirements, string][] = [
  ["training", "Training"], ["experience", "Experience"], ["certification", "Certification"],
];
const crewRows = (pr: PeopleRequirements | null | undefined): [string, string][] =>
  CREW_LABELS.filter(([k]) => pr?.[k]).map(([k, label]) => [label, pr?.[k] as string]);
/** "100 records by 15 Oct 2026": the pilot as partners read it. */
const pilotText = (r: Rfp): string =>
  `${r.pilot.quantity ?? "?"} ${unitLabel(r.spec.target_unit)}${r.pilot.due_on ? ` by ${fmtDate(r.pilot.due_on)}` : ""}`;
/** One line for the Review step. */
const crewText = (pr: PeopleRequirements | null): string =>
  crewRows(pr).map(([label, v]) => `${label}: ${v}`).join(" · ");
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
  const [showCrew, setShowCrew] = useState(false);
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
      crew_training: r.people_requirements?.training ?? "",
      crew_experience: r.people_requirements?.experience ?? "",
      crew_certification: r.people_requirements?.certification ?? "",
      budget_disclosed: r.budget_disclosed ?? true,
      pricing_basis: r.pricing?.basis ?? "total",
      pricing_block: String(r.pricing?.block ?? "1000"),
      budget_amount: r.pricing?.amount ?? "",
      pilot_required: !!r.pilot?.required,
      pilot_quantity: String(r.pilot?.quantity ?? ""),
      pilot_due_on: r.pilot?.due_on ?? "",
      starts_on: r.starts_on ?? "", delivery_due_on: r.delivery_due_on ?? "",
      proposals_close_at: isoToLocalInput(r.proposals_close_at),
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
    const pr = r.people_requirements;
    setShowCrew(!!(pr && (pr.training || pr.experience || pr.certification)));
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


  // The category states the medium: Image can only mean photographs, Video can
  // only mean clips. Asking for the media as well was the same answer typed
  // twice, and nothing made the two agree — so it is derived here and shown
  // rather than asked. The three non-visual categories imply nothing and get
  // neither a Media row nor capture detail; d.capture_media still carries
  // whatever a saved request held, so editing one does not silently clear it.
  const impliedMedia = CATEGORY_MEDIA[d.category];
  // Which capture fields can apply. Only read where impliedMedia exists.
  const chosenMedia = impliedMedia ?? d.capture_media;
  const wantsPhoto = chosenMedia.includes("photo");
  const wantsVideo = chosenMedia.includes("video");
  // "Something else" says nothing on its own, so the objective carries it.
  const otherUseCase = d.use_case === "other";

  // db/320: the budget as one amount on a basis. A per-unit price is quoted
  // against the Scope step's unit and quantity, which are shown here and not
  // asked again.
  const perUnit = d.pricing_basis === "per_unit";
  const budgetEstimate = estimatedTotal(
    d.pricing_basis, d.budget_amount || null, Number(d.pricing_block) || null,
    Number(d.target_quantity) || null,
  );
  const budgetText = priceText(
    d.pricing_basis, d.budget_amount || null, "USD", d.target_unit, Number(d.pricing_block) || null,
  ) ?? "Not stated";

  // Any attachment still in flight. Saving now would attach a key whose bytes
  // are not in storage yet, and the server would reject it as never uploaded.
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

        people_requirements: crewOf(d),

        budget_disclosed: d.budget_disclosed,
        // one amount on a basis (db/320). The unit and the quantity are the
        // Scope step's answers; the server clears all three on a total.
        pricing_basis: d.pricing_basis || "total",
        pricing_unit: perUnit ? str(d.target_unit) : null,
        pricing_block: perUnit ? num(d.pricing_block) : null,
        pricing_quantity: perUnit ? num(d.target_quantity) : null,
        budget_amount: d.budget_amount || null,
        pilot_required: d.pilot_required,
        // db/340: one json column, present exactly while a pilot is required
        pilot: d.pilot_required
          ? { quantity: num(d.pilot_quantity), due_on: d.pilot_due_on || null }
          : null,

        starts_on: d.starts_on || null,
        delivery_due_on: d.delivery_due_on || null,
        // null clears it: the server assigns this outright rather than
        // dropping it with the other omitted requirement fields
        proposals_close_at: localInputToIso(d.proposals_close_at),
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
      // request_pricing_shape: per unit needs a block and a quantity to price
      // against; the database says the same, but a person should hear it here.
      if (perUnit) {
        if (!(Number(d.pricing_block) >= 1)) f.pricing_block = "How many units does one price cover?";
        if (!(Number(d.target_quantity) > 0))
          blocking.push("A per-unit budget needs the quantity from the Scope step. Go back and set it.");
      }
      if (d.budget_amount && Number(d.budget_amount) < 0) f.budget_amount = "Not negative.";
      if (d.starts_on && d.delivery_due_on && d.delivery_due_on < d.starts_on)
        f.delivery_due_on = "On or after the start.";
      // Optional on a draft, checked when given; required to publish, below.
      if (d.proposals_close_at) {
        const p = deadlineProblem(d.proposals_close_at, d.delivery_due_on || null);
        if (p) f.proposals_close_at = p;
      }
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
    if (!d.proposals_close_at)
      problems.push("Say when bidding closes — partners need to know how long they have.");
    else {
      const p = deadlineProblem(d.proposals_close_at, d.delivery_due_on || null);
      if (p) problems.push(`Bids close on: ${p}`);
    }
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
            {impliedMedia && (
              // The category already answered this. Shown rather than hidden, so
              // the client can see what a crowd resource will be allowed to upload —
              // it is the same rule either way, just not asked twice.
              <Field label="Media" hint="Taken from the category above.">
                {() => (
                  <p className="small muted" style={{ margin: "6px 0 0" }}>
                    Crowd resources may upload{" "}
                    {impliedMedia.map((m: string) => labelOf(CAPTURE_MEDIA, m).toLowerCase()).join(" or ")} only.
                  </p>
                )}
              </Field>
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
            <label className="checkline span">
              <input type="checkbox" checked={showCrew} onChange={(e) => setShowCrew(e.target.checked)} />
              <span>
                Add crew requirements
                <span className="cl-sub">Training, experience or certification the people doing the work should have. Optional; partners see what you fill in.</span>
              </span>
            </label>
            {showCrew && (
              <>
                <Field label="Training" span hint="What the crew should have been trained in.">
                  {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.crew_training} onChange={set("crew_training")} placeholder="A two-hour session on the capture app and the screen-privacy rules." />}
                </Field>
                <Field label="Experience" span hint="Work the crew should have done before.">
                  {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.crew_experience} onChange={set("crew_experience")} placeholder="Comfortable with laptops, spreadsheets and code editors." />}
                </Field>
                <Field label="Certification" span hint="Any certificate or clearance required.">
                  {(id) => <textarea id={id} className={textareaCls} rows={2} value={d.crew_certification} onChange={set("crew_certification")} placeholder="None required." />}
                </Field>
              </>
            )}
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

            {impliedMedia && (
              // Nothing is filmed for a data or people-based deliverable, so
              // resolution, squareness and clip length are noise there.
              <>
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
            {/* db/320: one amount on a basis. Partners bid on the same basis,
                so the choice here is the shape of every bid and of the contract. */}
            <Field label="How is the budget stated?" span>
              {(id) => (
                <select id={id} className={selectCls} value={d.pricing_basis} onChange={set("pricing_basis")}>
                  {PRICING_BASES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              )}
            </Field>
            {!perUnit ? (
              <Field label="Budget (USD)" error={errOf("budget_amount")} hint="Leave blank to let partners propose a price.">
                {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_amount} onChange={set("budget_amount")} />}
              </Field>
            ) : (
              <>
                {/* The unit and the quantity were answered on the Scope step;
                    shown here so the rate reads in context, not asked twice. */}
                <Field label="Priced per" hint="The unit from the Scope step. Change it there.">
                  {(id) => <input id={id} className={inputCls} readOnly aria-readonly="true" tabIndex={-1} value={unitLabel(d.target_unit)} />}
                </Field>
                <Field label="Units expected in all" hint="The quantity from the Scope step. Change it there.">
                  {(id) => <input id={id} className={inputCls} readOnly aria-readonly="true" tabIndex={-1} value={d.target_quantity || "—"} />}
                </Field>
                <Field label="Units per price" required error={errOf("pricing_block")} hint="1, 100, 1,000 — how many one price covers.">
                  {(id) => <input id={id} className={inputCls} type="number" min={1} value={d.pricing_block} onChange={set("pricing_block")} />}
                </Field>
                <Field label={`Budget per ${unitWords(d.target_unit, Number(d.pricing_block) || null)} (USD)`} error={errOf("budget_amount")} hint="Leave blank to let partners propose a rate.">
                  {(id) => <input id={id} className={inputCls} type="number" min={0} value={d.budget_amount} onChange={set("budget_amount")} />}
                </Field>
                {budgetEstimate !== null && (
                  <p className="muted small" style={{ gridColumn: "1 / -1", margin: 0 }}>
                    ≈ {money(budgetEstimate)} for {quantityWords(d.target_quantity, d.target_unit)} in all.
                  </p>
                )}
              </>
            )}
            <label className="checkline span">
              <input type="checkbox" checked={!d.budget_disclosed} onChange={(e) => setD((x) => ({ ...x, budget_disclosed: !e.target.checked }))} />
              <span>
                Keep the budget to ourselves
                <span className="cl-sub">Bidders see the RFP and how it is priced, but not the amount. You still see it here.</span>
              </span>
            </label>
            <Field label="Project start">
              {(id) => <input id={id} className={inputCls} type="date" value={d.starts_on} onChange={set("starts_on")} />}
            </Field>
            <Field label="Delivery deadline" error={errOf("delivery_due_on")}>
              {(id) => <input id={id} className={inputCls} type="date" value={d.delivery_due_on} onChange={set("delivery_due_on")} />}
            </Field>
            <Field
              label="Bids close on"
              required
              span
              error={errOf("proposals_close_at")}
              hint="Partners cannot respond after this. Measured in UTC against the delivery date; you can change it until you award."
            >
              {(id) => <input id={id} className={inputCls} type="datetime-local" value={d.proposals_close_at} onChange={set("proposals_close_at")} />}
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
            ...(impliedMedia ? [["Media",
              impliedMedia.map((m: string) => labelOf(CAPTURE_MEDIA, m)).join(", ")] as Row] : []),
            ...(d.countries.length ? [["Location / Locale", d.countries.map(localeLabel).join(", ")] as Row] : []),
            ...(d.location_type
              ? [["Location Type", labelOf(LOCATION_TYPES, d.location_type as LocationType)] as Row] : []),
            ...(d.capture_notes ? [["Device Specifications", d.capture_notes] as Row] : []),
            ...(crewOf(d) ? [["Crew requirements", crewText(crewOf(d))] as Row] : []),
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
            ["Budget", `${budgetText}${d.budget_disclosed ? "" : " · withheld from bidders"}`],
            ["Timeline", `${fmtDate(d.starts_on || null)} → ${fmtDate(d.delivery_due_on || null)}`],
            ["Bids close", d.proposals_close_at ? fmtDateTimeZone(localInputToIso(d.proposals_close_at)) : "Not set"],
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
            unpublish it; after publishing, only the bidding deadline can be changed.
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
// The buyer as a partner sees it: who they are, and the public profile they
// chose to show the organisations they work with (db/230). The API has already
// withheld their plan and DPA (_may_see_commercials); nothing here is private.
// Shared by the RFP page and My Proposals, which used to list the same five
// rows twice and so both missed the profile when it arrived.
function ClientDetails({ o }: { o: Org }) {
  const cp = (o.profile ?? {}) as Partial<ClientProfile>;
  return (
    <>
      <div className="orghead">
        <OrgLogo orgId={o.id} version={o.logo_version} name={o.name} size={40} />
        <div>
          <b>{o.name}</b>
          <p className="small muted"><span className="id">{o.reference_code}</span></p>
        </div>
      </div>
      <Dl rows={[
        ...companyRows(draftFromOrg(o)),
        ["Industry", cp.industry ?? "—"],
        ["Client since", fmtDate(cp.since)],
      ]} />
    </>
  );
}

function ClientPanel({ name, q }: { name?: string | null; q: UseQueryResult<Org> }) {
  const o = q.data;
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
        <ClientDetails o={o} />
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
  const [changingDeadline, setChangingDeadline] = useState(false);
  // The conversation the client is reading; a bid row's Messages button and
  // a bell deep link both choose it, so the page owns it, not the panel.
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const now = useNow();

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => get<Rfp>(`/requests/${id}`),
    enabled: !!id,
  });
  // The client's bid rows show "Messages (n)" for a partner in conversation.
  // Same key as the panel below, which is the one that polls.
  const threads = useThreads(session.org_kind === "client" ? id : undefined, false);

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
  const open = ["published", "proposals_received"].includes(r.status);
  const closed = biddingClosed(r);
  // The one edit a live request allows (change_bidding_deadline). Its own
  // stored status: proposals_received is the same row with bids in.
  const canChangeDeadline = isClient && r.stored_status === "published";

  return (
    <View
      title={r.title}
      sub={<span className="id">{r.reference_code} · {titleCase(r.category)}</span>}
      actions={
        <>
          {isClient && r.status === "draft" && (
            <>
              <Link to={`/requests/${r.id}/edit`} className="btn">Edit</Link>
              {/* The server refuses a draft with no deadline; say so before
                  the dialog, not after it. */}
              <Button
                variant="primary"
                disabled={!r.proposals_close_at}
                title={r.proposals_close_at ? undefined : "Set when bidding closes (Edit) before publishing."}
                onClick={() => { setPublishError(null); setPublishing(true); }}
              >
                Publish
              </Button>
            </>
          )}
          {canChangeDeadline && (
            <Button onClick={() => setChangingDeadline(true)}>Change deadline</Button>
          )}
          {/* Once awarded this page becomes a read-only record with nothing
              pointing at the work it produced — the only way through was the
              rail. */}
          {isClient && ["accepted", "in_progress", "delivered", "completed"].includes(r.status) && (
            <Link to="/deliveries" className="btn" data-variant="primary">Review deliverables</Link>
          )}
          {session.org_kind === "tenant" && open && r.bidding_open && !alreadyMine && (
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
            // db/340: the crew requirements the client gave, each only when
            // filled, and the pilot, which bidders now see so they can price it.
            ...crewRows(r.people_requirements).map(([k, v]) => [k, v] as [string, React.ReactNode]),
            ...(r.pilot.required ? [["Pilot", pilotText(r)] as [string, React.ReactNode]] : []),
            // The amount comes back null to a bidder when the client withheld
            // it; the basis never does, so a partner still knows what to quote per.
            ["Budget", describePricing(r.pricing, { disclosed: r.budget_disclosed, withTotal: true })],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Bids close", r.proposals_close_at ? (
              <span key="bc">
                {fmtDateTimeZone(r.proposals_close_at)}
                {open && <span className="muted"> · {closed ? "closed" : fmtUntil(r.proposals_close_at, now)}</span>}
              </span>
            ) : "Not set — open until awarded"],
            ["Status", (
              <span key="s">
                <Pill tone={meta.tone}>{meta.label}</Pill>
                {closed && <> <Pill tone="attention">{proposals.length ? "Bidding closed" : "Bidding closed · no proposals"}</Pill></>}
              </span>
            )],
          ]} />
        </Panel>
      </div>

      <Panel
        title={isClient ? "Proposals" : "Your response"}
        sub={isClient ? "Competitors never see each other's bids — only you compare them." : undefined}
      >
        {!isClient && closed && (
          <Callout tone="neutral" title={`Bidding closed on ${fmtDateTimeZone(r.proposals_close_at)}`}>
            The client is reviewing the proposals received.
          </Callout>
        )}
        {proposals.length === 0 ? (
          <Empty
            title={isClient ? "No proposals yet" : "No response yet"}
            hint={
              r.status === "draft" ? "Publish the RFP first."
              : closed ? (isClient ? "Bidding closed with no proposals. Extend the deadline to reopen it." : "Bidding has closed.")
              : isClient ? "Partners have been notified."
              // a partner that asked but never bid keeps this page after the award
              : !open ? "This RFP has been awarded."
              : "Respond while the RFP is still open."
            }
          />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  {/* Both are the viewer's own when a partner reads this: RLS
                      returns exactly one proposal, theirs. A column headed
                      "Partner" under a panel headed "Your response" told them
                      their own name. */}
                  {isClient && <><th>Partner</th><th>Track record</th></>}
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
                        <td><BidderRecord p={p} /></td>
                      )}
                      <td className="num" style={{ whiteSpace: "nowrap" }}>{bidText(p.price, p.currency, r.pricing, true)}</td>
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
                          {(() => {
                            // Only a partner that has asked has a thread; the
                            // client cannot start one, so no button otherwise.
                            const t = threadFor(threads.data ?? [], p.partner_org_id);
                            return t && (
                              <Button
                                size="sm"
                                aria-label={`Messages with ${p.partner_name ?? "this partner"}${t.unread_count ? `, ${t.unread_count} unread` : ""}`}
                                onClick={() => {
                                  setSelectedThread(t.id);
                                  const el = document.getElementById("conversations");
                                  el?.scrollIntoView?.({ block: "start" });
                                  el?.focus();
                                }}
                              >
                                {t.unread_count ? `Messages (${t.unread_count})` : "Messages"}
                              </Button>
                            );
                          })()}
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

      <RequestThreadsPanel r={r} selected={selectedThread} onSelect={setSelectedThread} />

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
            unpublish it; after publishing, only the bidding deadline can be changed.
          </Callout>
          {publishError && <Callout tone="critical" title="Could not publish">{publishError}</Callout>}
        </Dialog>
      )}

      {awarding && (
        <Dialog
          title={`Award to ${awarding.partner_name}?`}
          sub={`${bidText(awarding.price, awarding.currency, r.pricing, true)} · ${awarding.duration_days} days`}
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
          <Callout tone="attention" title="Awarding opens a contract at this price">
            {/* This said "other proposals remain available, so you can award more
                partners" — the opposite of what award() does. It sets every other
                submitted bid to rejected and notifies each partner, and a second
                award is refused with "This request already has a contract". Saying
                otherwise at the moment of an irreversible decision is the worst
                place to be wrong. */}
            Every other proposal is automatically declined and its partner notified — a request
            has one contract. To turn a bid down before you decide, reject it on its own. No money
            moves now: the partner invoices work as it passes QA, and you mark each invoice paid.
          </Callout>
          {/* The failure used to toast from the far corner while this dialog
              stayed open with room to say it — every sibling dialog reports
              inline. */}
          {awardError && <Callout tone="critical" title="Could not award">{awardError}</Callout>}
        </Dialog>
      )}

      {changingDeadline && <DeadlineDialog r={r} onClose={() => setChangingDeadline(false)} />}
      {proposing && id && (
        <ProposeDialog requestId={id} title={r.title} pricing={r.pricing} onClose={() => setProposing(false)} />
      )}
    </View>
  );
}

/* --- the bidding deadline, after publishing ------------------------------------- */
// The one edit a live request allows. Partners are pricing against the words
// of the RFP, and those stay fixed; the window is the client's to manage until
// the award. Setting a future time on a closed window reopens it.

function DeadlineDialog({ r, onClose }: { r: Rfp; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [value, setValue] = useState(isoToLocalInput(r.proposals_close_at));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reopens = !r.bidding_open;

  const change = useMutation({
    mutationFn: () =>
      patch<Rfp>(`/requests/${r.id}/bidding-deadline`, { proposals_close_at: localInputToIso(value) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["request", r.id] });
      void qc.invalidateQueries({ queryKey: ["requests"] });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      toast("Deadline updated", "Every partner has been told.", "success");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not change the deadline"),
  });

  const submit = () => {
    const p = deadlineProblem(value, r.delivery_due_on);
    if (p) return setFieldError(p);
    change.mutate();
  };

  return (
    <Dialog
      title="Change the bidding deadline"
      sub={<span className="id">{r.reference_code}</span>}
      busy={change.isPending}
      onClose={onClose}
      foot={
        <>
          <Button onClick={onClose} disabled={change.isPending}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={change.isPending || !value}>
            {change.isPending ? "Saving…" : "Save deadline"}
          </Button>
        </>
      }
    >
      {reopens && (
        <Callout tone="attention" title="Bidding is closed">
          A future time reopens it: every partner is told, and responses are accepted again.
        </Callout>
      )}
      <div className="formgrid">
        <Field
          label="Bids close on"
          required
          span
          error={fieldError}
          hint={`Every partner is notified of the change. In the future, and on or before the delivery deadline (${fmtDate(r.delivery_due_on)}), measured in UTC.`}
        >
          {(id) => (
            <input
              id={id}
              className={inputCls}
              type="datetime-local"
              value={value}
              onChange={(e) => { setValue(e.target.value); setFieldError(null); setError(null); }}
            />
          )}
        </Field>
      </div>
      {error && <Callout tone="critical" title="Could not change the deadline">{error}</Callout>}
    </Dialog>
  );
}

/* --- the partner behind a proposal -------------------------------------------- */

// What the bidder's record amounts to, beside its price. The same calculated
// figures its vendor page shows: what its clients decided first (the share of
// completed contracts never sent back), then what it says of its own
// suppliers at its own gate. A partner with no completed work is new, which
// is a different thing from a partner with a poor record.
export function BidderRecord({ p }: { p: Proposal }) {
  const first = p.partner_accepted_first_time;
  const qa = p.partner_qa_pass_rate;
  if (first == null && qa == null && !p.partner_rating_count) {
    return <span className="muted small">No completed work yet</span>;
  }
  return (
    // Words in the interface face, figures aligned: the column is read as a
    // sentence about the partner, where Price and Days beside it are numbers.
    <div className="trackrecord">
      <span>{first != null ? `${first}% accepted first time` : "—"}</span>
      <div className="cell-meta">
        {p.partner_rating != null && (
          <span>★ {p.partner_rating.toFixed(1)} ({p.partner_rating_count})</span>
        )}
        {qa != null && <span>{qa}% QA pass</span>}
      </div>
    </div>
  );
}

// A bidder is disclosed to the client it bids to and to nobody else — the
// database says so (org_visible_via_proposal, db/110_auth_functions.sql).
// The shared OrgProfileDialog asks for the org and lets a 404 mean "not
// yours to see"; the proposal seeds the name.
function PartnerProfileDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  return (
    <OrgProfileDialog
      orgId={proposal.partner_org_id}
      seedName={proposal.partner_name ?? "Delivery partner"}
      onClose={onClose}
    />
  );
}

/* --- tenant: opportunities + propose ----------------------------------------- */

function ProposeDialog({ requestId, title, pricing, onClose }: {
  requestId: string; title: string; pricing: Pricing | null | undefined; onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  // One price on the client's basis (db/320): the whole job, or per block.
  const perUnit = pricing?.basis === "per_unit";
  const implied = perUnit && price ? estimatedTotal("per_unit", price, pricing?.block, pricing?.quantity) : null;
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
        <Field
          label={perUnit ? `Price per ${unitWords(pricing?.unit, pricing?.block)} (USD)` : "Price (USD)"}
          required
          hint={perUnit
            ? `The client asked for a rate per ${unitWords(pricing?.unit, pricing?.block)} and expects ${quantityWords(pricing?.quantity, pricing?.unit)} in all${implied !== null ? ` — your bid implies ≈ ${money(implied)}` : ""}.`
            : "One price for the whole job."}
        >
          {(id) => <input id={id} className={inputCls} type="number" min={0.01} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} />}
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
  const now = useNow();
  // Soonest deadline first; a request with none (open until awarded) last.
  const rows = [...(opps.data ?? [])].sort(
    (a, b) =>
      (a.proposals_close_at ? Date.parse(a.proposals_close_at) : Infinity)
      - (b.proposals_close_at ? Date.parse(b.proposals_close_at) : Infinity),
  );
  return (
    <View title="Opportunities" sub="Published RFPs you can still bid on, soonest deadline first.">
      <Panel>
        {rows.length === 0 ? (
          <Empty title="Nothing open right now" hint="You are notified the moment a client publishes." />
        ) : (
          <TableWrap>
            <table>
              <thead><tr><th>Reference</th><th>Title</th><th>Category</th><th>Budget</th><th>Bids close</th><th>Delivery</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="id">{r.reference_code}</td>
                    <td className="cell-primary">{r.title}</td>
                    <td>{titleCase(r.category)}</td>
                    <td className="num">{describePricing(r.pricing, { disclosed: r.budget_disclosed })}</td>
                    <td className="num" title={fmtDateTimeZone(r.proposals_close_at)}>
                      {r.proposals_close_at ? fmtUntil(r.proposals_close_at, now) : "Open until awarded"}
                    </td>
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
        ["Price", proposalPriceText(p)],
        ...(p.pricing_basis === "per_unit" && p.estimated_total
          ? [["Implied total", `≈ ${money(p.estimated_total, p.currency)}`] as [string, React.ReactNode]]
          : []),
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
  const toast = useToast();
  const now = useNow();
  const [withdrawing, setWithdrawing] = useState<Proposal | null>(null);
  // Binding once the window shuts (withdraw_proposal): no button for a refusal.
  const canWithdraw = (p: Proposal) =>
    p.status === "submitted" && !(p.proposals_close_at && Date.parse(p.proposals_close_at) <= now);
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
                      <td className="num" style={{ whiteSpace: "nowrap" }}>{proposalPriceText(p)}</td>
                      <td className="num">{p.duration_days}</td>
                      <td><Pill tone={pm.tone}>{pm.label}</Pill></td>
                      <td className="right" onClick={(e) => e.stopPropagation()}><div className="rowactions">
                        <RowMenu
                          label={`Actions for ${p.reference_code}`}
                          items={[
                            { label: "View response", onSelect: () => setViewing(p) },
                            { label: "View client & RFP", onSelect: () => setViewingBrief(p) },
                            // the RFP page scrolls to the partner's own thread for any ?thread=
                            { label: "Messages", onSelect: () => navigate(`/requests/${p.request_id}?thread=mine`) },
                            ...(p.status === "withdrawn"
                              ? [{ label: "Respond again", onSelect: () => navigate(`/requests/${p.request_id}`) }]
                              : []),
                            ...(canWithdraw(p)
                              ? [{ label: "Withdraw", tone: "danger" as const, onSelect: () => setWithdrawing(p) }]
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
      {withdrawing && (
        <Dialog
          title={`Withdraw ${withdrawing.reference_code}?`}
          sub={withdrawing.request_title ?? withdrawing.request_ref ?? ""}
          busy={withdraw.isPending}
          onClose={() => setWithdrawing(null)}
          foot={
            <>
              <Button onClick={() => setWithdrawing(null)} disabled={withdraw.isPending}>Keep it</Button>
              <Button
                variant="danger"
                disabled={withdraw.isPending}
                onClick={() => withdraw.mutate(withdrawing.id, {
                  onSuccess: () => {
                    void qc.invalidateQueries({ queryKey: ["proposals-mine"] });
                    toast("Response withdrawn", "You can respond again while the RFP is open.", "neutral");
                    setWithdrawing(null);
                  },
                  // It used to fail in silence: a refusal never reached the screen.
                  onError: (e) => toast("Could not withdraw", e instanceof Error ? e.message : "", "critical"),
                })}
              >
                {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
              </Button>
            </>
          }
        >
          <Callout tone="attention" title="Bids are binding once bidding closes">
            You can respond again while the RFP is still open. After its deadline a submitted
            response stays in until the client decides.
          </Callout>
        </Dialog>
      )}
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
  const pm = statusMeta(proposalStatus, proposal.status);

  return (
    <Dialog
      title={proposal.request_title ?? proposal.request_ref ?? "Request"}
      sub={
        <>
          <span className="id">{proposal.reference_code}</span>
          {" · "}{proposalPriceText(proposal)} · {proposal.duration_days} days{" "}
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
          <ClientDetails o={o} />
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
            ["Acceptance", r.acceptance ?? "—"],
            ["Lawful basis", labelOf(LAWFUL_BASES, r.compliance.lawful_basis)],
            ["People in frame", labelOf(PEOPLE_IN_FRAME, r.compliance.people_in_frame)],
            // The amount comes back null when the client chose not to disclose
            // it, so this renders the withholding honestly rather than showing
            // an empty figure as if none were set.
            ["Budget", describePricing(r.pricing, { disclosed: r.budget_disclosed, withTotal: true })],
            ["Timeline", `${fmtDate(r.starts_on)} → ${fmtDate(r.delivery_due_on)}`],
            ["Bids close", r.proposals_close_at
              ? `${fmtDateTimeZone(r.proposals_close_at)}${biddingClosed(r) ? " · closed" : ""}`
              : "Open until awarded"],
            ...(r.pilot.required ? [["Pilot", pilotText(r)] as [string, string]] : []),
            ...crewRows(r.people_requirements),
            ["Compliance", r.compliance_notes ?? "—"],
          ]} />
        )}
      </Panel>
    </Dialog>
  );
}
