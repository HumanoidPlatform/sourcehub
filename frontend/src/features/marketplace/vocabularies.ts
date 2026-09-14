// The controlled vocabularies a request is built from, with the words a person
// actually reads next to the values the database stores.
//
// One source for both. Every one of these lists is a CHECK constraint in
// db/040_marketplace.sql and a Literal in backend/src/sourcehub/api/v1/
// marketplace.py; building the selects from here is what stops the console
// offering a value that comes back as a 422, and the types in @api/types keep
// the two halves honest — a typo in a value fails `tsc`, not a save.
//
// Order is presentation order, not the constraint's. Where one option is the
// safe default for a client who has not thought about it yet, it comes first.

import type {
  Deidentification,
  LawfulBasis,
  LocationType,
  MinorsPolicy,
  PeopleInFrame,
  PermittedUse,
  PricingModel,
  ProposalRequirement,
  TargetUnit,
  UseCase,
} from "@api/types";

export type Choice<T> = { value: T; label: string; hint?: string };

export const USE_CASES: Choice<UseCase>[] = [
  { value: "ai_training", label: "Training an AI model" },
  { value: "market_research", label: "Market research" },
  { value: "audit_compliance", label: "Audit or compliance" },
  { value: "monitoring_evaluation", label: "Monitoring and evaluation" },
  { value: "other", label: "Something else" },
];

// Six of the eight the database permits. audio_clips and audio_hours are left
// out on purpose: the upload path accepts image and video extensions only
// (backend media/service.py:_safe_filename), so offering them would let a
// client commission work no worker could ever deliver.
//
// The CHECK constraint still allows all eight and labelOf() falls back to the
// raw value, so a request stored earlier with an audio unit still renders.
// Put them back the day audio capture exists.
export const TARGET_UNITS: Choice<TargetUnit>[] = [
  { value: "photos", label: "photos" },
  { value: "videos", label: "videos" },
  { value: "responses", label: "responses" },
  { value: "records", label: "records" },
  { value: "sites", label: "sites" },
  { value: "hours", label: "hours" },
];

/** Units that already name a medium.
 *
 * Where one does, asking for the media as well is the same answer typed twice
 * — "25,000 photos" cannot be anything but photographs. Where it does not,
 * media is a real question: 120 *sites* might be captured as either.
 */
export const UNIT_IMPLIES_MEDIA: Partial<Record<TargetUnit, string[]>> = {
  photos: ["photo"],
  videos: ["video"],
};

export const LOCATION_TYPES: Choice<LocationType>[] = [
  { value: "public_outdoor", label: "Public outdoor space" },
  { value: "retail_interior", label: "Inside a shop or mall" },
  { value: "private_premises", label: "Private premises" },
  { value: "residential", label: "Someone's home" },
];

export const PEOPLE_IN_FRAME: Choice<PeopleInFrame>[] = [
  { value: "none", label: "Nobody", hint: "Capture must not include people at all." },
  { value: "incidental", label: "Incidentally", hint: "Passers-by may appear; they are not the subject." },
  { value: "consented", label: "As subjects", hint: "People are the point, and each has consented." },
];

export const MINORS_POLICIES: Choice<MinorsPolicy>[] = [
  { value: "prohibited", label: "Not permitted" },
  { value: "with_parental_consent", label: "Only with parental consent" },
];

// The six GDPR Article 6 bases, plus the honest answer for material that is
// not personal data at all.
export const LAWFUL_BASES: Choice<LawfulBasis>[] = [
  { value: "not_personal_data", label: "No personal data involved" },
  { value: "consent", label: "Consent" },
  { value: "contract", label: "Performance of a contract" },
  { value: "legitimate_interest", label: "Legitimate interest" },
  { value: "legal_obligation", label: "Legal obligation" },
  { value: "public_task", label: "Public task" },
];

export const DEIDENTIFICATION: Choice<Deidentification>[] = [
  { value: "blur_faces", label: "Blur faces" },
  { value: "redact_plates", label: "Redact number plates" },
  { value: "strip_gps", label: "Strip GPS from files" },
];

export const PERMITTED_USES: Choice<PermittedUse>[] = [
  { value: "model_training", label: "Training a model" },
  { value: "internal_analysis", label: "Internal analysis" },
  { value: "research", label: "Research" },
  { value: "audit", label: "Audit" },
  { value: "publication", label: "Publication" },
];

export const PROPOSAL_REQUIREMENTS: Choice<ProposalRequirement>[] = [
  { value: "method_statement", label: "Method statement" },
  { value: "team_cv", label: "Team CVs" },
  { value: "sample_work", label: "Sample of previous work" },
  { value: "references", label: "References" },
  { value: "insurance", label: "Proof of insurance" },
  { value: "dpa_acceptance", label: "Signed data processing agreement" },
];

export const PRICING_MODELS: Choice<PricingModel>[] = [
  { value: "fixed", label: "Fixed price", hint: "One number for the whole job." },
  { value: "per_unit", label: "Per unit", hint: "Priced per photo, per site, per hour." },
  { value: "milestone", label: "By milestone", hint: "Staged payments against agreed points." },
  { value: "open", label: "Open", hint: "Let partners propose how to price it." },
];

// What a capture can be made of.
//
// Two values, not four, and the limit is real rather than cautious: the upload
// path accepts .jpg .jpeg .png .heic .webp as an image and .mp4 .mov as a
// video, and raises MediaInvalid on everything else
// (backend media/service.py:_safe_filename). A task now inherits this list
// from the request, so offering Audio or Document here would let a client
// specify work that no worker could ever upload — and they would find out in
// the field, not on this form.
//
// Widen this the day the capture pipeline grows a third kind, not before.
export const CAPTURE_MEDIA: Choice<string>[] = [
  { value: "photo", label: "Photo", hint: "JPEG, PNG, HEIC or WebP · up to 25 MB each" },
  { value: "video", label: "Video", hint: "MP4 or MOV · up to 100 MB each" },
];

export const REWORK_BEARERS: Choice<"partner" | "client" | "shared">[] = [
  { value: "partner", label: "The partner" },
  { value: "client", label: "Us" },
  { value: "shared", label: "Shared" },
];

/** The label for a stored value, falling back to the value so an older row
 *  whose vocabulary has since changed still renders as something readable. */
export function labelOf<T extends string>(choices: Choice<T>[], value: T | null | undefined): string {
  if (!value) return "—";
  return choices.find((c) => c.value === value)?.label ?? value;
}

/** Labels for a set, joined. Empty reads as an em dash, not "". */
export function labelsOf<T extends string>(choices: Choice<T>[], values: T[] | null | undefined): string {
  if (!values || values.length === 0) return "—";
  return values.map((v) => labelOf(choices, v)).join(", ");
}
