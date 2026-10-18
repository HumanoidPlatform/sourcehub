// API shapes the app renders, mirrored from the console's types.ts and the
// routers in backend/src/sourcehub/api/v1.

export interface Session {
  access_token: string;
  refresh_token: string;
  user_id: string;
  full_name: string;
  email: string;
  org_id: string;
  org_kind: string;
  org_name: string;
  role: string;
  scope: string;
  capabilities: string[];
  must_change_password: boolean;
}

export interface OrgChoice {
  org_id: string;
  org_kind: string;
  org_name: string;
  reference_code: string;
  role_code: string;
}

export type AssignmentStatus =
  | "assigned"
  | "in_progress"
  | "submitted"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface AssignmentAssets {
  pending: number;
  ready: number;
  quarantined: number;
  total: number;
}

/** Where an assignment's captures stand in the batch round trip (db/350):
 *  uploaded but not sent, with the aggregator, kept, and to be shot again.
 *  accepted against quantity is the assignment's progress. */
export interface AssignmentProgress {
  draft: number;
  in_review: number;
  accepted: number;
  rework: number;
  /** The same four in the task's unit (db/510): equal to the counts for a
   *  counted unit, hours of footage for hours. Absent on an older API. */
  draft_units?: number;
  in_review_units?: number;
  accepted_units?: number;
  rework_units?: number;
  /** count: one capture is one unit; duration: clips add up their running time */
  measure?: "count" | "duration";
}

/** One send of captures for review. Each is answered on its own: everything
 *  in it is accepted unless the aggregator marked it to be shot again. */
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

// Mirrors CaptureSpec in backend api/v1/marketplace.py. Two shapes are live:
// media has been a LIST since a task began inheriting the client's capture
// spec, and tasks created before that still carry a bare string. Typing it as
// the scalar alone is what silently locked a video task into photo mode, so
// both are declared and qa_pipeline/rules/rules.ts normalises them.
export interface CaptureSpec {
  media?: string | string[];
  /** seconds; the camera stops at max, rules.ts refuses outside the range */
  min_duration_s?: number | null;
  max_duration_s?: number;
  /** the short side of a clip's frame: 720, 1080, 2160 */
  min_video_lines?: number | null;
  /** a clip may be picked from the phone's gallery rather than recorded */
  allow_library?: boolean | null;
  /** the phone this task demands, checked before it starts
   *  (qa_pipeline/device/device.ts): Android release, iOS major, GB of memory */
  min_android_version?: number | null;
  min_ios_version?: number | null;
  min_ram_gb?: number | null;
  require_gps?: boolean;
  min_megapixels?: number | null;
  orientation?: string | null;
  /** degrees of tilt tolerated; squareness to a vertical plane (wall, shelf) */
  max_tilt_deg?: number | null;
  languages?: string[];
  notes?: string;
  /** what a capture must show; qa_pipeline/subject/subject.ts checks photos and clips against it */
  subject?: SubjectSpec | null;
  [key: string]: unknown;
}

export interface SubjectSpec {
  domain: string;
  must_show: string[];
  must_not_show: string[];
  /** an explicit labeller vocabulary; when set it replaces domain + must_show */
  labels?: string[];
}

/** A file attached to a task or to the client's request. */
export interface Attachment {
  id: string;
  slot: string;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  doc_no?: number;
  version?: number;
  /** false on an earlier version of a document that has since been replaced */
  is_current?: boolean;
}

export interface Assignment {
  id: string;
  task_id: string;
  quantity: number;
  status: AssignmentStatus;
  instructions: string | null;
  due_on: string | null;
  worker_note: string | null;
  decision_note: string | null;
  assigned_at: string;
  started_at: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  assets: AssignmentAssets;
  /** Absent on an API from before batches. */
  progress?: AssignmentProgress;
  batches?: Batch[];
  /** Taken off this worker and given to someone else. What they had uploaded
   *  went for review; nothing more can be captured. */
  revoked_at?: string | null;
  task: {
    id: string;
    reference_code: string;
    title: string;
    instructions: string | null;
    capture_spec: CaptureSpec;
    target_unit: string | null;
    due_on: string | null;
    status: string;
    /** the coordinator's own files: a shot list, a site map */
    attachments?: Attachment[];
    /** the client's guidelines, capture examples and acceptance criteria.
     *  Which slots arrive is the server's decision, not the app's. */
    client_documents?: Attachment[];
  };
}

/** A task offered to this worker (backend delivery.my_offers). `id` is the
 *  recipient row — what the answer is posted to. `state` is the server's word
 *  for whether it can still be answered: open, or one of offers.ts
 *  OFFER_STATE_TEXT. */
export interface OfferRow {
  id: string;
  state: string;
  org_name: string;
  /** what accepting commits to, in the task's unit: captures, or hours */
  quantity: number;
  worker_limit: number;
  places_left: number;
  respond_by: string;
  due_on: string | null;
  instructions: string | null;
  response: "accepted" | "declined" | null;
  responded_at: string | null;
  /** the assignment an accept became */
  assignment_id: string | null;
  task: {
    id: string;
    reference_code: string;
    title: string;
    instructions: string | null;
    due_on: string | null;
    target_unit: string | null;
    capture_spec: CaptureSpec;
  };
}

export type AssetStatus ="pending" | "uploaded" | "ready" | "quarantined" | "rejected" | "erased";

export interface AssetRow {
  id: string;
  assignment_id: string | null;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  /** a clip's running time as the phone measured it; null for a photo */
  duration_s?: number | null;
  sha256: string;
  status: AssetStatus;
  quarantine_reason: string | null;
  captured_at: string | null;
  uploaded_at: string | null;
  created_at: string;
  /** The aggregator's verdict on THIS capture at gate 1. Set only on one sent
   *  back to be shot again, where status is "rejected". review_label is the
   *  reason as a person reads it. Absent on an older API. */
  review_reason?: string | null;
  review_label?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  /** The batch it went out in, and where it stands. "replaced": sent back and
   *  since retaken. Absent on an API from before batches. */
  batch_id?: string | null;
  batch_no?: number | null;
  replaces_asset_id?: string | null;
  stage?: AssetStage;
}

export type AssetStage = "uploading" | "draft" | "in_review" | "accepted" | "rework" | "replaced";

export interface Presign {
  asset_id: string;
  storage_key: string;
  url: string | null;
  /** RESUMABLE: no PUT URL; the file goes up in chunks as `upload` says */
  method: "PUT" | "RESUMABLE";
  headers: Record<string, string>;
  expires_in: number;
  status: AssetStatus;
  upload?: {
    protocol: "gcs" | "azure" | "s3";
    chunk_size: number;
    size: number;
    /** Google's session URL, which every chunk goes to; null for the other two */
    session_url: string | null;
  } | null;
}

export interface AssetUrl {
  url: string;
  filename: string | null;
  mime_type: string | null;
  expires_in: number;
}

export interface NotificationRow {
  id: string;
  body: string;
  link_page: string | null;
  link_params: Record<string, string>;
  read: boolean;
  created_at: string;
}
