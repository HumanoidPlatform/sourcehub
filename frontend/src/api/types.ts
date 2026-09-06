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
  spec: { format: string | null; quantity: string | null; quality: string | null };
  acceptance: string | null;
  people: {
    headcount: number;
    training: string | null;
    experience: string | null;
    certification: string | null;
  };
  budget_min: string | null;
  budget_max: string | null;
  currency: string;
  starts_on: string | null;
  delivery_due_on: string | null;
  created_at: string;
  proposals?: Proposal[];
  samples?: RequestSample[];
}

export interface RequestSample {
  id: string;
  request_id: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  uploaded_at: string;
}

export interface SamplePresign {
  storage_key: string;
  url: string;
  filename: string;
  content_type: string | null;
  expires_in: number;
}

export interface Proposal {
  id: string;
  reference_code: string;
  request_id: string;
  partner_org_id: string;
  partner_name?: string | null;
  partner_qa_pass_rate?: number | null;
  price: string;
  currency: string;
  duration_days: number;
  methodology: string;
  notes: string | null;
  status: string;
  submitted_at: string;
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
    capture_spec: Record<string, unknown>;
    target_unit: string | null;
    due_on: string | null;
    status: string;
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
