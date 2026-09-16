// Status vocabularies — ONE PER ENTITY, matching the database enums.
//
// Not one flat map. The prototype shares 28 status strings across every table
// and gives each a single owner, which is wrong where a value is reused:
// "submitted" is a proposal awaiting the CLIENT and a task awaiting the
// PARTNER's QA. db/001_conventions.sql splits these into per-entity enums;
// this file mirrors that split. Tones are the five in tokens.css.

export type Tone = "neutral" | "active" | "attention" | "success" | "critical";

export interface StatusMeta {
  label: string;
  tone: Tone;
  /** who must act next — drives the "Waiting on" column */
  owner: "client" | "partner" | "supplier" | "sponsor" | "ops" | null;
}

type StatusMap = Record<string, StatusMeta>;

export const requestStatus: StatusMap = {
  draft: { label: "Draft", tone: "neutral", owner: "client" },
  published: { label: "Published", tone: "active", owner: "partner" },
  proposals_received: { label: "Proposals received", tone: "attention", owner: "client" },
  accepted: { label: "Awarded", tone: "active", owner: "partner" },
  in_progress: { label: "In progress", tone: "active", owner: "partner" },
  delivered: { label: "Delivered", tone: "attention", owner: "client" },
  completed: { label: "Completed", tone: "success", owner: null },
  cancelled: { label: "Cancelled", tone: "neutral", owner: null },
};

export const proposalStatus: StatusMap = {
  submitted: { label: "Submitted", tone: "attention", owner: "client" },
  accepted: { label: "Accepted", tone: "success", owner: null },
  rejected: { label: "Rejected", tone: "critical", owner: null },
  withdrawn: { label: "Withdrawn", tone: "neutral", owner: null },
};

export const contractStatus: StatusMap = {
  active: { label: "Active", tone: "active", owner: "partner" },
  in_qa: { label: "In QA", tone: "attention", owner: "partner" },
  delivered: { label: "Delivered", tone: "attention", owner: "client" },
  completed: { label: "Completed", tone: "success", owner: null },
  disputed: { label: "Disputed", tone: "critical", owner: "ops" },
  cancelled: { label: "Cancelled", tone: "neutral", owner: null },
};

export const taskStatus: StatusMap = {
  assigned: { label: "Assigned", tone: "neutral", owner: "supplier" },
  in_progress: { label: "In progress", tone: "active", owner: "supplier" },
  submitted: { label: "Submitted", tone: "attention", owner: "partner" },
  qa_passed: { label: "QA passed", tone: "success", owner: null },
  qa_failed: { label: "QA failed", tone: "critical", owner: "supplier" },
  cancelled: { label: "Cancelled", tone: "neutral", owner: null },
};

export const loanStatus: StatusMap = {
  pending: { label: "Pending", tone: "attention", owner: "sponsor" },
  approved: { label: "Approved", tone: "success", owner: null },
  rejected: { label: "Rejected", tone: "critical", owner: null },
  issued: { label: "Issued", tone: "active", owner: null },
  returned: { label: "Returned", tone: "neutral", owner: null },
  overdue: { label: "Overdue", tone: "critical", owner: "supplier" },
};

export const equipmentStatus: StatusMap = {
  available: { label: "Available", tone: "success", owner: null },
  in_use: { label: "In use", tone: "active", owner: null },
  returned: { label: "Returned", tone: "neutral", owner: null },
  maintenance: { label: "Maintenance", tone: "critical", owner: null },
  retired: { label: "Retired", tone: "neutral", owner: null },
};

export const workerStatus: StatusMap = {
  on_shift: { label: "On shift", tone: "success", owner: null },
  on_break: { label: "On break", tone: "attention", owner: null },
  offboarded: { label: "Offboarded", tone: "neutral", owner: null },
};

export const assignmentStatus: StatusMap = {
  assigned: { label: "Assigned", tone: "neutral", owner: "supplier" },
  in_progress: { label: "In progress", tone: "active", owner: "supplier" },
  submitted: { label: "Awaiting review", tone: "attention", owner: "supplier" },
  accepted: { label: "Accepted", tone: "success", owner: null },
  rejected: { label: "Sent back", tone: "critical", owner: "supplier" },
  cancelled: { label: "Cancelled", tone: "neutral", owner: null },
};

export const offerStatus: StatusMap = {
  open: { label: "Open", tone: "active", owner: "supplier" },
  filled: { label: "Filled", tone: "success", owner: null },
  closed: { label: "Closed", tone: "neutral", owner: null },
  expired: { label: "Expired", tone: "neutral", owner: "supplier" },
};

export const invitationStatus: StatusMap = {
  none: { label: "No login", tone: "neutral", owner: null },
  pending: { label: "Invited", tone: "attention", owner: "supplier" },
  accepted: { label: "Signed up", tone: "success", owner: null },
  expired: { label: "Invitation expired", tone: "critical", owner: "supplier" },
};

export const assetStatus: StatusMap = {
  pending: { label: "Uploading", tone: "neutral", owner: "supplier" },
  uploaded: { label: "Uploaded", tone: "active", owner: null },
  ready: { label: "Ready", tone: "success", owner: null },
  quarantined: { label: "Quarantined", tone: "critical", owner: "supplier" },
  rejected: { label: "Discarded", tone: "neutral", owner: null },
  erased: { label: "Erased", tone: "neutral", owner: null },
};

export const invoiceStatus: StatusMap = {
  pending: { label: "Pending", tone: "attention", owner: "client" },
  paid: { label: "Paid", tone: "success", owner: null },
  overdue: { label: "Overdue", tone: "critical", owner: "client" },
  void: { label: "Void", tone: "neutral", owner: null },
};

export const onboardingStatus: StatusMap = {
  draft: { label: "Draft", tone: "neutral", owner: "partner" },
  submitted: { label: "Submitted", tone: "attention", owner: "ops" },
  under_review: { label: "Under review", tone: "attention", owner: "ops" },
  changes_requested: { label: "Changes requested", tone: "critical", owner: "partner" },
  approved: { label: "Approved", tone: "success", owner: null },
  rejected: { label: "Rejected", tone: "critical", owner: null },
  withdrawn: { label: "Withdrawn", tone: "neutral", owner: null },
  expired: { label: "Expired", tone: "neutral", owner: null },
};

export const orgStatus: StatusMap = {
  pending_approval: { label: "Pending approval", tone: "attention", owner: "ops" },
  active: { label: "Active", tone: "success", owner: null },
  suspended: { label: "Suspended", tone: "critical", owner: null },
  terminated: { label: "Terminated", tone: "neutral", owner: null },
};

export function statusMeta(map: StatusMap, value: string | null | undefined): StatusMeta {
  return (
    (value && map[value]) || { label: value ?? "—", tone: "neutral", owner: null }
  );
}

/** the prototype's "Waiting on" column, from the viewer's seat */
export function waitingOn(meta: StatusMeta, viewer: "client" | "partner" | "supplier" | "sponsor" | "ops"): string {
  if (!meta.owner) return "No one";
  if (meta.owner === viewer) return "You";
  return { client: "Client", partner: "Delivery partner", supplier: "Supplier", sponsor: "Device sponsor", ops: "Platform" }[
    meta.owner
  ];
}

/** the request lifecycle rail, in order */
export const LIFECYCLE = [
  "draft", "published", "proposals_received", "accepted", "in_progress", "delivered", "completed",
] as const;
