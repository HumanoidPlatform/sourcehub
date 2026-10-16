// Hand-written API shapes, kept to the fields the console renders.
// `make types` replaces this with generated definitions once the OpenAPI
// pipeline is wired; until then these mirror the routers by inspection.

export interface Org {
  id: string;
  reference_code: string;
  kind: string;
  name: string;
  status: string;
  parent_org_id: string | null;
  country: string | null;
  residency_region: string | null;
  billing_status: string | null;
  // Calculated for every kind (db/380): a delivery partner's from what its
  // clients scored it, a client's from its delivery partners, a supplier's
  // from its parent partner. null is "no ratings yet", never zero. A sponsor
  // is never rated.
  rating: number | null;
  rating_count: number;
  /** Delivery partners only: the figures every screen reads (db/260). */
  performance?: Performance;
  onboarded_at?: string | null;
  // Withheld from a counterparty alongside billing_status — why an account is
  // suspended is between it and the platform.
  suspended_at?: string | null;
  suspension_reason?: string | null;
  profile: Record<string, unknown>;
  // db/230. Everything in public_profile is visible to whoever may see the
  // organisation. The logo's storage key never leaves the server: logo_version
  // says whether there is one and when it last changed, and the image itself
  // comes from GET /organisations/{id}/logo-url.
  legal_name?: string | null;
  public_profile?: PublicProfile;
  logo_version?: string | null;
}

export interface Address {
  line1?: string;
  line2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
}

export interface PublicProfile {
  website?: string;
  description?: string;
  company_size?: string;
  founded_year?: number;
  registered_address?: Address;
  /** Delivery partners only. Absent until the partner declares any. */
  expertise?: Partial<Expertise>;
}

// What a delivery partner says it can do, from the curated lists in
// features/vendors/vocabularies.ts. A vendor row always carries all five lists.
export interface Expertise {
  data_types: string[];
  domains: string[];
  languages: string[];
  regions: string[];
  certifications: string[];
  other_certifications: string | null;
}

// A delivery partner's record, calculated from its contracts, its gate-2
// reviews and what its clients scored it. A percentage is null when there is
// nothing to divide by: "no completed work yet" is not "0%".
export interface Performance {
  contracts_completed: number;
  on_time_pct: number | null;
  /** Completed contracts the client never sent back. */
  accepted_first_time_pct: number | null;
  /** The partner's own gate 2, about its own suppliers. */
  qa_pass_pct: number | null;
  rating_avg: number | null;
  rating_count: number;
  /** GET /vendors/{id} only; 5 first. */
  rating_distribution?: { score: number; count: number }[];
}

// GET /vendors and GET /vendors/{id}: a delivery partner as the directory
// shows it. Never its plan, billing, suspension or legal name.
export interface Vendor {
  id: string;
  reference_code: string;
  name: string;
  country: string | null;
  hq: string | null;
  partner_since: string | null;
  fair_work_attested: boolean;
  website: string | null;
  description: string | null;
  company_size: string | null;
  founded_year: number | null;
  years_in_business: number | null;
  registered_address: Address | null;
  expertise: Expertise;
  logo_version: string | null;
  performance: Performance;
}

export interface VendorList {
  items: Vendor[];
}

// A delivery partner's profile (organisation.profile and its typed terms, db/280), as GET /organisations/{id} returns it. `plan` is deliberately
// absent: the API withholds it from anyone but Ops and the partner itself.
export interface TenantProfile {
  hq: string | null;
  capabilities: string | null;
  on_time_rate: number | null;
  qa_pass_rate: number | null;
  fair_work_attested: boolean;
  since: string | null;
}

// A client's profile (organisation.profile and its typed terms, db/280), as GET /organisations/{id} returns it. `plan`, `dpa_signed`
// and `dpa_signed_at` are deliberately absent: the API withholds the client's
// terms with the platform from anyone but Ops and the client itself.
export interface ClientProfile {
  industry: string | null;
  since: string | null;
}

export interface Rfp {
  id: string;
  reference_code: string;
  client_org_id: string;
  /** Who raised it. Null when the reader may not see the buyer — db/180
   *  opens this while the request is live, Fix 9 once you have responded. */
  client_name?: string | null;
  title: string;
  category: string;
  status: string;
  proposal_count: number;
  compliance_notes: string | null;
  objective: string | null;
  use_case: UseCase | null;
  spec: {
    target_quantity: number | null;
    target_unit: TargetUnit | null;
    capture: CaptureSpec;
    countries: string[];
    location_type: LocationType | null;
  };
  acceptance: string | null;
  quality: { thresholds: QualityThresholds; rejection_policy: RejectionPolicy };
  compliance: {
    people_in_frame: PeopleInFrame | null;
    minors_policy: MinorsPolicy | null;
    deidentification: Deidentification[];
    regulations: string[];
    lawful_basis: LawfulBasis | null;
    permitted_uses: PermittedUse[];
    partner_reuse_allowed: boolean;
    biometric_processing: boolean;
  };
  /** db/340: the client's optional crew requirements; null when none were
   *  given, and each key present only when filled. Shown to partners. */
  people_requirements: PeopleRequirements | null;
  budget_disclosed: boolean;
  currency: string;
  /** The budget as one amount on a basis (db/320). amount and estimated_total
   *  come back null when budget_disclosed is false and you are not the client
   *  that raised it — the server withholds the figure, never the basis. */
  pricing: Pricing;
  /** db/340 folds the size and date into one json column; the shape returned
   *  is unchanged. quantity is in the request's target unit. */
  pilot: { required: boolean; quantity: number | null; due_on: string | null };
  proposals_close_at: string | null;
  /** Derived by the server from proposals_close_at and its clock, never
   *  stored: false once the window has shut. No deadline means open. */
  bidding_open: boolean;
  /** The row's own status, before proposals_received is derived from the
   *  bid count. The deadline can be changed only while this is published. */
  stored_status: string;
  starts_on: string | null;
  delivery_due_on: string | null;
  storage_target_id: string | null;
  created_at: string;
  proposals?: Proposal[];
  attachments?: Attachment[];
}

// Mirrors the CHECK constraints in db/040_marketplace.sql and the Literals in
// backend/src/sourcehub/api/v1/marketplace.py. The runtime lists the console
// builds its selects from live in features/marketplace/vocabularies.ts; these
// are the types over them, so a typo in either one fails the build.
export type UseCase =
  | "ai_training" | "market_research" | "audit_compliance"
  | "monitoring_evaluation" | "other";
export type TargetUnit =
  | "photos" | "videos" | "audio_clips" | "audio_hours"
  | "responses" | "records" | "sites" | "hours";
export type LocationType =
  | "public_outdoor" | "retail_interior" | "private_premises" | "residential";
export type PeopleInFrame = "none" | "incidental" | "consented";
export type MinorsPolicy = "prohibited" | "with_parental_consent";
export type LawfulBasis =
  | "consent" | "contract" | "legitimate_interest" | "public_task"
  | "legal_obligation" | "not_personal_data";
export type Deidentification = "blur_faces" | "redact_plates" | "strip_gps";
export type PermittedUse =
  | "model_training" | "internal_analysis" | "research" | "audit" | "publication";
export type PricingBasis = "total" | "per_unit";

/** How a request, a bid or a contract is priced (db/320): a whole amount, or an
 *  amount per `block` of `unit`. Money is a numeric string, never a float. */
export interface Pricing {
  basis: PricingBasis;
  unit: TargetUnit | null;
  block: number | null;
  /** How many units are expected in all; the estimate is amount × quantity / block. */
  quantity: number | null;
  amount: string | null;
  estimated_total: string | null;
  currency: string;
  /** The server's own sentence, e.g. "USD 500.00 per 1,000 photos"; null when withheld. */
  text: string | null;
}

// The five jsonb columns. Their shape was read off deployed rows, not from the
// DDL — the columns carry no CHECK — so every field is optional and unknown
// keys are preserved rather than dropped.
// Two shapes are live: media has been a LIST since a task began inheriting
// the client's capture spec, and requests created before that still carry a
// bare string. mediaList() in @shared/format reads both.
export interface CaptureSpec {
  media?: string | string[];
  languages?: string[];
  notes?: string | null;
  orientation?: string | null;
  require_gps?: boolean | null;
  min_megapixels?: number | null;
  /** degrees of tilt tolerated; squareness to a vertical plane (wall, shelf) */
  max_tilt_deg?: number | null;
  /** seconds; the phone refuses a clip outside the range before uploading,
   *  and stops recording at max */
  min_duration_s?: number | null;
  max_duration_s?: number | null;
  /** the short side of a clip's frame: 720, 1080, 2160 */
  min_video_lines?: number | null;
  /** a clip may be picked from the phone's gallery rather than recorded */
  allow_library?: boolean | null;
  /** what a capture must show; the phone's domain check reads it */
  subject?: SubjectSpec | null;
}
/** Short phrases, not sentences. The phone compares the labels it sees in a
 *  photo against these words and warns when nothing matches. */
export interface SubjectSpec {
  domain: string;
  must_show: string[];
  must_not_show: string[];
  /** an explicit ML Kit vocabulary; usually empty */
  labels?: string[];
}
export interface PeopleRequirements {
  training?: string;
  experience?: string;
  certification?: string;
}
export interface QualityThresholds {
  min_pass_rate_pct?: number | null;
  qa_sample_pct_gate1?: number | null;
  qa_sample_pct_gate2?: number | null;
}
export interface RejectionPolicy {
  max_retakes?: number | null;
  retake_window_days?: number | null;
  rework_cost_bearer?: "partner" | "client" | "shared" | null;
  partial_acceptance_allowed?: boolean | null;
}
export interface Proposal {
  id: string;
  /** From /proposals/mine only: the RFP's bidding deadline, so a response on
   *  a closed RFP is not offered a Withdraw the server would refuse. */
  proposals_close_at?: string | null;
  reference_code: string;
  request_id: string;
  partner_org_id: string;
  partner_name?: string | null;
  // The bidder's calculated figures, the same ones its vendor page shows.
  partner_accepted_first_time?: number | null;
  partner_qa_pass_rate?: number | null;
  partner_rating?: number | null;
  partner_rating_count?: number;
  partner_contracts_completed?: number;
  /** One price on the request's basis: the whole price on a total, the price
   *  per block on per_unit. The three fields after it say which. */
  price: string;
  currency: string;
  pricing_basis?: PricingBasis | null;
  pricing_unit?: TargetUnit | null;
  pricing_block?: number | null;
  estimated_total?: string | null;
  price_text?: string | null;
  duration_days: number;
  methodology: string;
  notes: string | null;
  status: string;
  submitted_at: string;
  attachments?: Attachment[];
  request_title?: string;
  request_ref?: string;
  client_org_id?: string;
  client_name?: string | null;
}

export interface Progress {
  total: number;
  done: number;
  pct: number;
  assets_accepted: number;
  /** the same, in each task's own unit (db/510); hours delivered before it count 0 */
  units_accepted?: number;
  deliverable: boolean;
}

export interface Contract {
  id: string;
  reference_code: string;
  request_id: string;
  request_ref: string | null;
  title: string | null;
  client_org_id: string;
  client_name: string | null;
  partner_org_id: string;
  partner_name: string | null;
  /** The agreed amount on pricing.basis: the whole price, or the rate per block. */
  value: string;
  currency: string;
  status: string;
  /** The basis frozen at award (db/320); invoices are priced against it. */
  pricing: Pricing;
  /** Detail page only: what the partner has claimed, been paid, and is still owed. */
  invoicing?: ContractInvoicing;
  rubric_snapshot: Record<string, unknown> | null;
  delivery_due_on: string | null;
  started_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  progress: Progress;
  /** false: exclusive to the client. true: once approved, the partner may list the captures (db/350). */
  partner_reuse_allowed?: boolean;
  /** The partner's catalogue listing of these captures, once it chose to list them. */
  catalogue_dataset_id?: string | null;
  tasks?: Task[];
  ratings?: RatingRow[];
}

export interface Task {
  id: string;
  reference_code: string;
  contract_id: string;
  contract_ref: string | null;
  assignee_org_id: string;
  assignee_name: string | null;
  assignee_kind: string | null;
  title: string;
  target: string | null;
  target_quantity: number | null;
  target_unit: string | null;
  /** count: one capture is one unit; duration: clips add up their running time (db/510) */
  measure?: "count" | "duration";
  instructions: string | null;
  capture_spec: Record<string, unknown>;
  status: string;
  due_on: string | null;
  attachments?: Attachment[];
  // The client's guidelines, capture examples, acceptance and compliance
  // documents. Never the brief; the server drops compliance for a worker.
  client_documents?: Attachment[];
  last_submission: {
    id: string;
    attempt_no: number;
    status: string;
    supplier_note: string | null;
    asset_count: number;
    submitted_at: string | null;
  } | null;
  // worker assignments and captures rolled up; a client gets zeros for the
  // first (it never sees a roster) and real counts for the second
  assignment_summary: AssignmentSummary | null;
  asset_summary: AssetSummary | null;
  /** The partner's rating of this task's supplier, once given (db/380); null
   *  before, and null to the client, who may not read it. */
  supplier_rating?: RatingSummary | null;
}

/** A task put to the crowd at once; the first worker_limit accepts become assignments. */
export interface TaskOfferRecipient {
  id: string;
  worker_user_id: string;
  worker_name: string | null;
  worker_ref: string | null;
  email: string;
  sent_at: string | null;
  send_error: string | null;
  response: "accepted" | "declined" | null;
  responded_at: string | null;
  assignment_id: string | null;
  /** what the clock, or the aggregator by hand, has sent this recipient (oldest first) */
  reminders: Reminder[];
}

export interface Reminder {
  kind: "offer_nudge" | "offer_closing" | "assignment_start" | "assignment_due_soon" | "assignment_overdue" | "assignment_rework";
  step: number;
  sent_at: string | null;
  send_error: string | null;
  /** sent from the console rather than by the clock */
  manual: boolean;
}

export interface TaskOffer {
  id: string;
  task_id: string;
  status: "open" | "filled" | "closed";
  /** status, or "expired" when open past respond_by */
  effective_status: "open" | "filled" | "closed" | "expired";
  worker_limit: number;
  quantity: number;
  accepted_count: number;
  declined_count: number;
  pending_count: number;
  instructions: string | null;
  due_on: string | null;
  respond_by: string;
  created_at: string;
  closed_at: string | null;
  recipients: TaskOfferRecipient[];
}

/** What a worker's offer link shows before they answer. */
export interface OfferPreview {
  state: "open" | "responded" | "closed" | "filled" | "expired" | "task_closed" | "not_a_worker";
  org_name: string;
  worker_name: string;
  worker_email: string;
  task: { reference_code: string; title: string; instructions: string | null; due_on: string | null; target_unit: string | null };
  quantity: number;
  instructions: string | null;
  due_on: string | null;
  respond_by: string;
  worker_limit: number;
  response: "accepted" | "declined" | null;
  responded_at: string | null;
}

export interface AssignmentSummary {
  total: number;
  assigned: number;
  in_progress: number;
  submitted: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  quantity_assigned: number;
}

export interface AssetSummary {
  pending: number;
  ready: number;
  quarantined: number;
  bundled: number;
  /** ready captures in the task's unit: hours of footage for hours */
  ready_units?: number;
}

export interface AssignmentAssets {
  pending: number;
  ready: number;
  quarantined: number;
  total: number;
}

// task_assignment — one worker's share of a task, as GET /tasks/{id}/assignments
// and GET /me/assignments return it.
export interface Assignment {
  id: string;
  task_id: string;
  contract_id: string;
  supplier_org_id: string;
  worker_user_id: string;
  worker_name: string | null;
  worker_ref: string | null;
  quantity: number;
  status: string;
  instructions: string | null;
  due_on: string | null;
  worker_note: string | null;
  decision_note: string | null;
  assigned_at: string;
  started_at: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  /** reminders sent to this worker about this assignment; 0 on a worker's own board */
  reminder_count: number;
  last_reminded_at: string | null;
  /** The supplier's rating of the crowd resource for this assignment (db/380);
   *  null before it is given, and null to the partner and the worker. */
  rating?: RatingSummary | null;
  assets: AssignmentAssets;
  /** The batch round trip (db/350): uploaded and not sent, with the reviewer,
   *  kept, and to be shot again. accepted against quantity is progress. */
  progress?: AssignmentProgress;
  batches?: Batch[];
  /** Taken off this worker; the rest went to reassigned_to. */
  revoked_at?: string | null;
  reassigned_to?: string | null;
  task: {
    id: string;
    reference_code: string;
    title: string;
    instructions: string | null;
    capture_spec: CaptureSpec;
    target_unit: string | null;
    due_on: string | null;
    status: string;
    // the coordinator's own files (a shot list, a site map) …
    attachments?: Attachment[];
    // … and the client's working documents, as on Task
    client_documents?: Attachment[];
  };
}

export interface AssignmentProgress {
  draft: number;
  in_review: number;
  accepted: number;
  rework: number;
  /** The same four in the task's unit (db/510): equal to the counts for a
   *  counted unit, hours of footage for hours. */
  draft_units?: number;
  in_review_units?: number;
  accepted_units?: number;
  rework_units?: number;
  measure?: "count" | "duration";
}

/** One send of a worker's captures. Answered on its own: everything in it is
 *  accepted unless marked to be shot again. */
export interface Batch {
  id: string;
  batch_no: number;
  status: "in_review" | "reviewed";
  submitted_at: string;
  worker_note: string | null;
  decided_at: string | null;
  decision_note: string | null;
  accepted_count: number;
  rework_count: number;
  items: number;
}

// GET /qa/gate1 — a worker batch awaiting the supplier's own verdict
export interface Gate1Row {
  batch_id: string;
  batch_no: number;
  /** what earlier batches of this assignment already had accepted */
  accepted_before: number;
  /** the worker was taken off the task; this batch was sent for them */
  revoked_at: string | null;
  assignment_id: string;
  task_id: string;
  task_ref: string;
  task_title: string;
  target_unit: string | null;
  worker_user_id: string;
  worker_name: string | null;
  worker_ref: string | null;
  quantity: number;
  worker_note: string | null;
  submitted_at: string;
  ready_assets: number;
  /** ready captures the worker's phone flagged as off-subject and they kept */
  off_subject: number;
  /** ready captures the phone could not check at all (no labeller, timeout,
   *  native error) — the reviewer is the first pair of eyes on these */
  unscored: number;
  /** what these captures were meant to satisfy. The reviewer used to judge
   *  frames without it: no subject, no orientation, no tilt tolerance on
   *  screen. Empty on a task created without a spec. */
  capture_spec: CaptureSpec;
  task_instructions: string | null;
}

// asset — one capture, as GET /tasks/{id}/assets and GET /assignments/{id}/assets return it
export interface AssetRow {
  id: string;
  task_id: string;
  assignment_id: string | null;
  submission_id: string | null;
  captured_by_user_id: string | null;
  captured_by_name: string | null;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  /** a clip's running time as the capturing device measured it; null for a photo */
  duration_s?: number | null;
  sha256: string;
  etag: string | null;
  status: string;
  quarantine_reason: string | null;
  captured_at: string | null;
  captured_lat: string | null;
  captured_lon: string | null;
  uploaded_at: string | null;
  created_at: string;
  /** what the phone noticed before queueing the file; recorded, not trusted.
   *  Optional: test fixtures and older rows may lack it. */
  device_checks?: DeviceCheck[];
  /** the aggregator's verdict on THIS capture at gate 1. Set only on one sent
   *  back to be shot again, where status is "rejected". review_label is the
   *  defect code as a person reads it. */
  review_reason?: string | null;
  review_label?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  /** the batch it was sent in, and where it stands (db/350) */
  batch_id?: string | null;
  batch_no?: number | null;
  replaces_asset_id?: string | null;
  stage?: "uploading" | "draft" | "in_review" | "accepted" | "rework" | "replaced";
}

// What the phone found before queueing a capture, and what the console found
// before uploading one. Mirrors api/v1/media.py DeviceCheck: recorded on the
// asset, not acted on.
export interface DeviceCheck {
  code: string;
  /** "info" is a measurement and nothing more: it decides nothing, the worker is
   *  never shown it, and no count or queue reads it. Squareness arrives this way
   *  (tilt_measured) -- a reading inside the client's tolerance used to be
   *  discarded, so no reviewer had ever seen a tilt figure. */
  severity: "block" | "warn" | "info";
  message: string;
  /** a scored check (wrong_subject, black, frozen) says how sure it was, 0..1 */
  score?: number;
  /** wrong_subject on a clip adds frames/hits; black and frozen add frames/share */
  detail?: { labels?: string[]; hit?: string[]; veto?: string[]; frames?: number; hits?: number; share?: number } & Record<string, unknown>;
}

export interface AssetUrl {
  url: string;
  filename: string | null;
  mime_type: string | null;
  expires_in: number;
}

// POST /assignments/{id}/assets/presign. A repeat for the same sha256 returns
// the same asset with a fresh URL; status "ready" means the server already
// holds the bytes and the PUT is skipped.
export interface Presign {
  asset_id: string;
  storage_key: string;
  url: string | null;
  method: "PUT";
  headers: Record<string, string>;
  expires_in: number;
  status: string;
}

export interface QaQueueRow {
  submission_id: string;
  attempt_no: number;
  asset_count: number;
  supplier_note: string | null;
  submitted_at: string;
  task_id: string;
  task_ref: string;
  task_title: string;
  target: string | null;
  contract_id: string;
  contract_ref: string;
  supplier_name: string;
}

export interface EquipmentRow {
  id: string;
  reference_code: string;
  equipment_type: string;
  total_units: number;
  calibrated_on: string | null;
  calibration_expires_on: string | null;
  sponsor_org_id: string;
  sponsor_name: string;
  units_on_loan: number;
  units_available: number;
  /** db/520: which device it is and where it is kept; null when not given. */
  make: string | null;
  model: string | null;
  location: string | null;
  /** Labelled details a borrower asks about, label → text ({"Resolution": "4K"}). */
  specifications: Record<string, string>;
  /** Photos (slot "photos") and documentation (slot "documentation"). */
  attachments: Attachment[];
  /** The first photo, signed for the list to draw beside the row; short-lived.
   *  Absent when the device has no photo. */
  photo_url?: string | null;
}

export interface LoanRow {
  id: string;
  reference_code: string;
  units: number;
  status: string;
  needed_by: string | null;
  note: string | null;
  decision_reason: string | null;
  equipment_type: string;
  equipment_ref: string;
  sponsor_name: string;
  requester_name: string;
  task_ref: string | null;
}

// Mirrors the Literal in backend/api/v1/network.py and the CHECK in
// db/190_worker_skills.sql. A typo here fails tsc, not a save.
export type Skill =
  | "street_imagery" | "night_driving" | "shelf_capture"
  | "drone_operation" | "retail_audit" | "field_survey"
  | "transcription" | "voice_capture" | "household_survey";

/** How much authority someone has over OTHER people in their organisation.
 *  Orthogonal to the role, which says what they can do with the product. */
export type MemberScope = "owner" | "manager" | "member";

/** A colleague in your own organisation. GET /members. */
export interface MemberRow {
  user_id: string;
  full_name: string;
  email: string;
  scope: MemberScope;
  role_code: string;
  role_name: string;
  granted_at: string;
  // No "none" case, unlike WorkerRow: a member always has a login, because the
  // grant and the invitation are created together.
  invitation_status: "pending" | "accepted" | "expired";
}

/** A role this organisation may actually grant. GET /members/roles. */
export interface AssignableRole {
  code: string;
  name: string;
}

export interface WorkerRow {
  id: string;
  reference_code: string;
  display_name: string;
  // never null — absence is [], the way every text[] column in this schema
  // represents it, so no reader needs a nullish branch
  skills: Skill[];
  status: string;
  trained: boolean;
  // what this supplier rated the person over their accepted assignments
  // (db/380); null until the first one, and null to the partner, who may not
  // read them
  rating: number | null;
  rating_count: number;
  // a roster row with a login: invited by email, signs in to the capture app
  email: string | null;
  phone: string | null;
  user_id: string | null;
  invitation_status: "none" | "pending" | "accepted" | "expired";
  open_assignments: number;
}

export interface ContractInvoicing {
  invoiced_total: string;
  paid_total: string;
  outstanding_total: string;
  invoiced_quantity: string;
  count: number;
}

export type InvoiceStatus = "issued" | "paid" | "acknowledged" | "withdrawn";

/** A partner's claim for payment on a contract (db/320). Raised by the partner
 *  once some work has passed gate 2, marked paid by the client, acknowledged
 *  by the partner; an unpaid one may be withdrawn. The platform moves no money. */
export interface InvoiceRow {
  id: string;
  reference_code: string;
  /** null on a dataset deal's invoice (db/450) */
  contract_id: string | null;
  contract_ref: string | null;
  /** the dataset deal this invoice bills, instead of a contract */
  deal_id: string | null;
  dataset_title: string | null;
  request_id: string | null;
  request_title: string | null;
  client_org_id: string;
  client_name: string | null;
  partner_org_id: string;
  partner_name: string | null;
  currency: string;
  /** per-unit contract: the quantity claimed at the frozen rate; null on a total */
  quantity: string | null;
  unit: string | null;
  block: number | null;
  rate: string | null;
  amount: string;
  /** "39 photos at USD 2,900.00 per 1,000 photos", or null on a total */
  line_text: string | null;
  accepted_assets_at_issue: number | null;
  note: string | null;
  status: InvoiceStatus;
  issued_at: string;
  issued_by: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_reference: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  withdrawn_at: string | null;
  withdrawn_by: string | null;
  withdrawn_reason: string | null;
}

export interface OnboardingRow {
  id: string;
  reference_code: string;
  target_org_kind: string;
  proposed_name: string;
  requester_org_id: string;
  parent_org_id: string | null;
  payload: Record<string, unknown>;
  contact: { full_name?: string; email?: string; phone?: string };
  status: string;
  submitted_at: string | null;
  decided_at: string | null;
  created_org_id: string | null;
  created_at: string;
  /** Only on the answer to an approval: what could not be applied, such as a
   *  logo whose upload had gone missing. The organisation exists regardless. */
  warnings?: string[];
  /** The latest Ops decision on the request, as a list of zero or one entry. A
   *  submitted or withdrawn request that carries one was returned for changes. */
  approvals?: {
    decision: string;
    reason: string | null;
    approver_role: string;
    decided_at: string;
  }[];
}

export interface ActivityRow {
  id: number;
  event_type: string;
  summary: string;
  scope: string[];
  actor_org_id: string | null;
  occurred_at: string;
}

/** One UTC day of the mail log (db/490 mail_stats). */
export interface MailDay {
  day: string;
  sent: number;
  failed: number;
}

/** The Ops Mail page's tiles and chart. `since` is 00:00 UTC of today. */
export interface MailStats {
  since: string;
  sent_today: number;
  failed_today: number;
  waiting: number;
  /** of the waiting, how many a temporary refusal has deferred (db/500) */
  retrying: number;
  /** failed in the last 30 days and not re-sent */
  failed_open: number;
  days: MailDay[];
}

/** One platform e-mail as the Ops mail log lists it (db/490 mail_log). Never
 *  carries the mail's content: an unsent invitation's token is in there. */
export interface MailRow {
  id: string;
  created_at: string;
  to_email: string;
  to_name: string;
  template: string;
  label: string;
  entity_type: string | null;
  entity_id: string | null;
  org_name: string | null;
  /** "retrying": still waiting, after a temporary refusal (db/500) */
  state: "queued" | "retrying" | "sent" | "failed";
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  resent_from: string | null;
  resent_to: string | null;
  /** failed, content still held, link still alive, not yet re-sent */
  can_resend: boolean;
  /** how many times a temporary refusal deferred it, when it is tried next,
   *  and the latest refusal */
  attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
}

/** The four directions a rating goes (db/380_ratings.sql). */
export type RatingKind = "client_partner" | "partner_client" | "partner_supplier" | "supplier_worker";

/** One rating, as a party to it (or operations) reads it. */
export interface RatingRow {
  id: string;
  kind: RatingKind;
  contract_id: string;
  task_id: string | null;
  assignment_id: string | null;
  from_org_id: string;
  to_org_id: string | null;
  to_user_id: string | null;
  score: number;
  comment: string;
  created_at: string;
  from_name: string;
  to_name: string | null;
}

/** A rating of one piece of work, on that work's own row. */
export interface RatingSummary {
  score: number;
  comment: string;
  created_at: string;
}

/** Where a client's captured data is delivered.

    The credential is never in this shape — the API leaves it out of the query
    that builds a response, so there is nothing here to leak. */
export interface StorageTarget {
  id: string;
  owner_org_id: string;
  label: string;
  // The client's own storage: storage_target_provider_supported in
  // db/370_gcs_destinations.sql lists the same three.
  provider: "s3" | "gcs" | "azure_blob";
  // S3 only; null on Azure and Google Cloud Storage, which sign for no region.
  region: string | null;
  endpoint: string | null;
  bucket: string;
  key_prefix: string;
  /** null until a write-read-delete probe has actually succeeded */
  verified_at: string | null;
  verify_error: string | null;
  created_at: string;
  updated_at: string;
}

/** A file hung off a field — a request's compliance notes, a bid's
    methodology, a task's instructions, a QA verdict's evidence. */
export interface Attachment {
  id: string;
  entity_type: "request" | "proposal" | "task" | "qa_review" | "equipment";
  entity_id: string;
  /** Which field it belongs to: compliance, acceptance, methodology, … */
  slot: string;
  owner_org_id: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  uploaded_at: string;
  /** Which document in the slot (1, 2, …) and which version of it. The same
   *  filename uploaded again is the next version; every version is kept.
   *  Optional only so a list still renders against an API that predates them. */
  doc_no?: number;
  version?: number;
  /** the newest live version of its document */
  is_current?: boolean;
}

/** One row of the bell. `link_page` is the backend's page vocabulary;
 *  shared/notifications translates it into a route. */
export interface NotificationRow {
  id: string;
  body: string;
  link_page: string | null;
  link_params?: Record<string, string> | null;
  read: boolean;
  created_at: string;
}

/** GET /notifications. `has_more` says whether `before=<last id>` has more. */
export interface NotificationPage {
  unread: number;
  items: NotificationRow[];
  has_more?: boolean;
}

/* --- conversations (features/messages) -------------------------------------
   One private thread per RFP per delivery partner, between the client and that
   partner only. Read state is per ORGANISATION: the two stamps are the newest
   message number each side has opened the thread after, and `unread_count`
   is the other side's messages above the caller's own stamp. */

export interface Thread {
  id: string;
  request_id: string;
  request_ref: string | null;
  request_title: string | null;
  client_org_id: string;
  client_org_name: string | null;
  partner_org_id: string;
  partner_org_name: string | null;
  created_at: string;
  closed_at: string | null;
  /** why it is read-only: the losers' at award, the winner's at completion */
  closed_reason: "awarded_elsewhere" | "contract_completed" | null;
  closed_message: string | null;
  message_count: number;
  /** the newest message's number; 0 when there are none */
  last_seq: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  client_read_seq: number;
  partner_read_seq: number;
  unread_count: number;
}

export interface ThreadMessage {
  id: string;
  thread_id: string;
  /** 1, 2, 3… within the thread — the page cursor and the read stamp */
  seq: number;
  sender_org_id: string;
  sender_user_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}

/** GET /requests/{id}/threads: all of them for the client and Ops, its own for a partner. */
export interface ThreadList {
  items: Thread[];
}

/** GET /threads/{id}/messages: newest first; `before=<oldest id>` pages back. */
export interface ThreadMessagePage {
  items: ThreadMessage[];
  has_more: boolean;
}

/* --- overview --------------------------------------------------------------
   GET /overview. One call behind the client's landing page: the aggregates the
   list endpoints cannot answer cheaply, already scoped to the caller's org by
   RLS. Money arrives as a string for the same reason it does on Contract —
   it is numeric(14,2) and must not round-trip through a float. */

export interface OverviewAttention {
  kind: "publish_draft" | "review_proposals" | "approve_delivery";
  entity_id: string;
  reference_code: string;
  title: string | null;
  count: number;
  due_on: string | null;
}

export interface OverviewDelivery {
  contract_id: string;
  reference_code: string;
  partner_name: string | null;
  value: string;
  currency: string;
  status: string;
  delivery_due_on: string | null;
  total: number;
  done: number;
  pct: number;
  assets_accepted: number;
}

export interface Overview {
  generated_at: string;
  requests: { by_status: Record<string, number>; total: number };
  deliveries: OverviewDelivery[];
  /** Live contracts only — see money.committed. */
  delivery: { live: number; tasks_total: number; tasks_done: number; pct: number };
  money: {
    /** Estimated value of contracts still in flight. NOT lifetime contracted value. */
    committed: string;
    /** What partners have invoiced so far, withdrawn ones excluded. */
    invoiced: string;
    /** Marked paid or acknowledged. */
    paid: string;
    /** Issued and awaiting payment. */
    outstanding: string;
    currency: string;
  };
  captures: { accepted: number; days: number; series: { day: string; count: number }[] };
  attention: OverviewAttention[];
}

/* --- DataHub, the data marketplace (db/390 + db/420, api/v1/catalogue.py) ---
 * A listing shows the dataset, how many files it holds and a few samples. The
 * buyer and seller agree the quantity and price in the deal's chat; the files
 * change hands outside the platform. */

export type DatasetStatus = "draft" | "in_review" | "published" | "rejected" | "withdrawn";
export type DealStatus = "requested" | "quoted" | "accepted" | "paid" | "delivered" | "declined" | "withdrawn";

/** One of the few files shown on a listing. */
export interface DatasetSample {
  id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  /** owner and operations only */
  copy_status?: "pending" | "copied" | "failed";
  copy_error?: string | null;
  /** a contract listing's sample: the capture it was copied from */
  source_asset_id?: string | null;
}

/** An accepted capture of a contract listing, offered to its owner as a sample. */
export interface ContractCapture {
  asset_id: string;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  captured_at: string | null;
  /** a short-lived preview into the client's bucket; null when it cannot be reached */
  url: string | null;
  picked: boolean;
}

export interface Dataset {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  use_cases: string[];
  regions: string[];
  languages: string[];
  permitted_uses: PermittedUse[];
  licence_terms: string | null;
  indicative_price_text: string | null;
  /** how many files the dataset holds; counted for a contract listing */
  file_count: number;
  total_bytes: number | null;
  sample_count: number;
  source: "upload" | "contract";
  status: DatasetStatus;
  owner_org_id: string;
  owner_name: string;
  published_at: string | null;
  withdrawn_at: string | null;
  withdrawn_reason: string | null;
  is_owner: boolean;
  // owner and operations only
  contract_id?: string | null;
  submitted_at?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // the seller's declaration on its last submission (db/470)
  rights_attested_at?: string | null;
  rights_attested_by_name?: string | null;
  // my listings
  pending_copies?: number;
  open_requests?: number;
  // detail view
  samples?: DatasetSample[];
  my_deal?: { id: string; status: DealStatus } | null;
}

/** A quote request, then the agreement: the accepted deal is the contract. */
export interface DatasetDeal {
  id: string;
  dataset_id: string;
  dataset_title: string;
  dataset_slug: string;
  /** what the listing holds */
  file_count: number;
  /** null on a request from the public page */
  buyer_org_id: string | null;
  /** the buyer organisation, or the visitor's organisation on a public request */
  buyer_name: string | null;
  /** account: asked in the console; public: asked on the public page, answered by email (db/440) */
  channel: "account" | "public";
  contact_name: string | null;
  contact_email: string | null;
  contact_company: string | null;
  seller_org_id: string;
  seller_name: string | null;
  intended_use: string;
  requested_uses: PermittedUse[];
  /** how many files the buyer asked for; null = the whole dataset */
  requested_quantity: number | null;
  message: string | null;
  status: DealStatus;
  quote_amount: string | null;
  currency: string | null;
  quote_terms: string | null;
  quote_uses: PermittedUse[];
  /** how many files the quote covers; null = the whole dataset */
  quote_quantity: number | null;
  quoted_at: string | null;
  decided_at: string | null;
  decision_note: string | null;
  invoice_number: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  /** issued by the platform when the buyer accepts (db/450) */
  invoice_id: string | null;
  invoice_reference: string | null;
  invoice_status: "issued" | "paid" | "acknowledged" | "withdrawn" | null;
  invoice_payment_reference: string | null;
  my_side: "buyer" | "seller" | "operations";
}

export interface DealMessage {
  id: string;
  seq: number;
  sender_org_id: string;
  sender_name: string;
  body: string;
  /** set when the message was emailed to a public request's visitor */
  emailed_to: string | null;
  /** db/490: what became of that e-mail — queued in the deal's transaction,
   *  sent by the clock, or failed with the server's reason; null when the
   *  message was never mailed or its record has been purged */
  email_status: "queued" | "sent" | "failed" | null;
  email_reason: string | null;
  created_at: string;
  mine: boolean;
}

/** What the DataHub public page returns: no ids, no storage, no internals. */
export interface PublicDataset {
  slug: string;
  title: string;
  summary: string | null;
  description?: string | null;
  category: string | null;
  use_cases: string[];
  regions: string[];
  languages: string[];
  permitted_uses: PermittedUse[];
  licence_terms?: string | null;
  indicative_price_text: string | null;
  seller_name: string;
  source?: "upload" | "contract";
  file_count: number;
  total_bytes: number | null;
  sample_count?: number;
  published_at: string | null;
  samples?: { id: string; filename: string; mime_type: string | null; size_bytes: number | null; url: string }[];
}

export interface UploadSlot {
  filename: string;
  key: string;
  url: string;
  headers: Record<string, string>;
}
