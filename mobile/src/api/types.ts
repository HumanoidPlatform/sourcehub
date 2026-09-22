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

// Mirrors CaptureSpec in backend api/v1/marketplace.py. Two shapes are live:
// media has been a LIST since a task began inheriting the client's capture
// spec, and tasks created before that still carry a bare string. Typing it as
// the scalar alone is what silently locked a video task into photo mode, so
// both are declared and validation/rules.ts normalises them.
export interface CaptureSpec {
  media?: string | string[];
  /** seconds; the camera stops at max, rules.ts refuses outside the range */
  min_duration_s?: number | null;
  max_duration_s?: number;
  /** the short side of a clip's frame: 720, 1080, 2160 */
  min_video_lines?: number | null;
  /** a clip may be picked from the phone's gallery rather than recorded */
  allow_library?: boolean | null;
  require_gps?: boolean;
  min_megapixels?: number | null;
  orientation?: string | null;
  /** degrees of tilt tolerated; squareness to a vertical plane (wall, shelf) */
  max_tilt_deg?: number | null;
  languages?: string[];
  notes?: string;
  /** what a capture must show; validation/subject.ts checks photos and clips against it */
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

export type AssetStatus = "pending" | "uploaded" | "ready" | "quarantined" | "rejected" | "erased";

export interface AssetRow {
  id: string;
  assignment_id: string | null;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string;
  status: AssetStatus;
  quarantine_reason: string | null;
  captured_at: string | null;
  uploaded_at: string | null;
  created_at: string;
}

export interface Presign {
  asset_id: string;
  storage_key: string;
  url: string | null;
  method: "PUT";
  headers: Record<string, string>;
  expires_in: number;
  status: AssetStatus;
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
