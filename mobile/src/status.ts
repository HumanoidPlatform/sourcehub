// Labels and tones per status, mirroring the console's shared/status.

export type Tone = "neutral" | "active" | "attention" | "success" | "critical";

export const TONE_COLOR: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: "#5B6873", bg: "#EDF1F4" },
  active: { fg: "#0B5F67", bg: "#E1F0F1" },
  attention: { fg: "#9A6210", bg: "#FBF0DA" },
  success: { fg: "#1F7A4D", bg: "#E3F3EA" },
  critical: { fg: "#C2410C", bg: "#FCE8DF" },
};

export interface Meta {
  label: string;
  tone: Tone;
}

export const assignmentStatus: Record<string, Meta> = {
  assigned: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "active" },
  submitted: { label: "Awaiting review", tone: "attention" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Needs rework", tone: "critical" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const captureStatus: Record<string, Meta> = {
  captured: { label: "Saved", tone: "neutral" },
  presigned: { label: "Queued", tone: "neutral" },
  uploading: { label: "Uploading", tone: "active" },
  uploaded: { label: "Confirming", tone: "active" },
  confirmed: { label: "Uploaded", tone: "success" },
  failed: { label: "Failed", tone: "critical" },
};

export const assetStatus: Record<string, Meta> = {
  pending: { label: "Waiting", tone: "neutral" },
  uploaded: { label: "Uploaded", tone: "active" },
  ready: { label: "Ready", tone: "success" },
  quarantined: { label: "Rejected", tone: "critical" },
  rejected: { label: "Discarded", tone: "neutral" },
  erased: { label: "Erased", tone: "neutral" },
};

export function meta(map: Record<string, Meta>, value: string | null | undefined): Meta {
  return (value && map[value]) || { label: value ?? "—", tone: "neutral" };
}

/** the order sections appear in on the board: what needs the worker first */
export const SECTION_ORDER = ["rejected", "in_progress", "assigned", "submitted", "accepted"] as const;

/** Why a capture was refused, in the words a worker reads. Keys are the codes
 *  from validation/rules.ts; an unknown one falls back to the raw code so a
 *  new rule still renders as something rather than nothing. */
export const rejectionLabel: Record<string, string> = {
  media_kind: "wrong kind of capture",
  size: "file too large",
  resolution: "below the resolution asked for",
  orientation: "wrong orientation",
  tilt: "beyond the tilt allowed",
  gps_missing: "no GPS fix",
  duration: "wrong length of clip",
  video_lines: "below the video size asked for",
  unreadable: "clip could not be read",
  black: "clip was dark",
  wrong_subject: "retaken: didn't show the subject",
  subject_unscored: "subject not checked on the phone",
};
