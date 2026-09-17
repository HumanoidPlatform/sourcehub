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
  rating: string | null;
  profile: Record<string, unknown>;
}

// tenant_profile, as GET /organisations/{id} returns it. `plan` is deliberately
// absent: the API withholds it from anyone but Ops and the partner itself.
export interface TenantProfile {
  hq: string | null;
  capabilities: string | null;
  on_time_rate: number | null;
  qa_pass_rate: number | null;
  fair_work_attested: boolean;
  since: string | null;
}

// client_profile, as GET /organisations/{id} returns it. `plan`, `dpa_signed`
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
  title: string;
  category: string;
  status: string;
  proposal_count: number;
  geography: string | null;
  compliance_notes: string | null;
  objective: string | null;
  use_case: UseCase | null;
  spec: {
    quality: string | null;
    target_quantity: number | null;
    target_unit: TargetUnit | null;
    capture: CaptureSpec;
    countries: string[];
    location_type: LocationType | null;
    sampling_frame: SamplingFrame;
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
  people: {
    headcount: number;
    training: string | null;
    experience: string | null;
    certification: string | null;
  };
  pricing_model_requested: PricingModel;
  budget_disclosed: boolean;
  // null when budget_disclosed is false and you are not the client that
  // raised it — the server withholds the range rather than the flag.
  budget_min: string | null;
  budget_max: string | null;
  currency: string;
  milestones: Milestone[];
  pilot: { required: boolean; quantity: number | null; due_on: string | null };
  proposal_requirements: ProposalRequirement[];
  proposals_close_at: string | null;
  contact_user_id: string | null;
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
export type ProposalRequirement =
  | "method_statement" | "team_cv" | "sample_work"
  | "insurance" | "dpa_acceptance" | "references";
export type PricingModel = "fixed" | "per_unit" | "milestone" | "open";

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
  /** seconds; the phone caps the recording, the console checks the file */
  max_duration_s?: number | null;
}
export interface Quota { label: string; quantity: number }
export interface SamplingFrame {
  subject_type?: string | null;
  site_count?: number | null;
  quotas?: Quota[];
  conditions?: string[];
  exclusions?: string[];
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
// INFERRED, not recovered: milestones is jsonb that no row anywhere populates.
export interface Milestone { label: string; amount?: string | null; due_on?: string | null }

export interface Proposal {
  id: string;
  reference_code: string;
  request_id: string;
  partner_org_id: string;
  partner_name?: string | null;
  partner_qa_pass_rate?: number | null;
  price: string;
  currency: string;
  unit: string | null;
  unit_price: string | null;
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
  value: string;
  currency: string;
  status: string;
  milestone_pct: number;
  platform_fee_pct: string;
  rubric_snapshot: Record<string, unknown> | null;
  delivery_due_on: string | null;
  started_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  progress: Progress;
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
  assets: AssignmentAssets;
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

// GET /qa/gate1 — a worker batch awaiting the supplier's own verdict
export interface Gate1Row {
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
  sha256: string;
  etag: string | null;
  status: string;
  quarantine_reason: string | null;
  captured_at: string | null;
  captured_lat: string | null;
  captured_lon: string | null;
  uploaded_at: string | null;
  created_at: string;
}

export interface AssetUrl {
  url: string;
  filename: string | null;
  mime_type: string | null;
  expires_in: number;
}

// What the phone found before queueing a capture, and now what the console
// found before uploading one. api/v1/media.py DeviceCheck: recorded on the
// asset, not acted on.
export interface DeviceCheck {
  code: string;
  severity: "block" | "warn";
  message: string;
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
  status: string;
  calibrated_on: string | null;
  calibration_expires_on: string | null;
  sponsor_org_id: string;
  sponsor_name: string;
  units_on_loan: number;
  units_available: number;
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

export interface WorkerRow {
  id: string;
  reference_code: string;
  display_name: string;
  skill: string | null;
  status: string;
  trained: boolean;
  rating: string | null;
  // a roster row with a login: invited by email, signs in to the capture app
  email: string | null;
  phone: string | null;
  user_id: string | null;
  invitation_status: "none" | "pending" | "accepted" | "expired";
  open_assignments: number;
}

export interface InvoiceRow {
  id: string;
  reference_code: string;
  kind: string;
  amount: string;
  currency: string;
  status: string;
  issued_on: string;
  paid_at: string | null;
  contract_id: string | null;
  contract_ref: string | null;
  party_org_id: string;
  party_name: string | null;
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
  approvals?: {
    step: number;
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

export interface RatingRow {
  id: string;
  contract_id: string;
  score: number;
  comment: string;
  created_at: string;
  from_name: string;
  to_name: string;
}

/** Where a client's captured data is delivered.

    The credential is never in this shape — the API leaves it out of the query
    that builds a response, so there is nothing here to leak. */
export interface StorageTarget {
  id: string;
  owner_org_id: string;
  label: string;
  // The client's own storage. gcs is in the database enum and is not
  // supported — see storage_target_provider_supported in db/035_storage.sql.
  provider: "s3" | "azure_blob";
  // S3 only; null on an Azure container, which has no region to sign for.
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
  entity_type: "request" | "proposal" | "task" | "qa_review";
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
