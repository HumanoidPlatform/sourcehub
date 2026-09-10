"""Reusable column types — chiefly the bridge to the database's enum types.

Every enum below already exists in Postgres (db/001_conventions.sql). The
models must therefore reference them with create_type=False: the database owns
the type, the ORM merely speaks it. Values are repeated here so a typo in
application code fails locally instead of as a database error.
"""

from __future__ import annotations

from sqlalchemy.dialects.postgresql import ENUM


def db_enum(name: str, *values: str) -> ENUM:
    return ENUM(*values, name=name, create_type=False)


OrgKind = db_enum("org_kind", "client", "tenant", "aggregator", "business", "sponsor", "platform")
OrgStatus = db_enum("org_status", "pending_approval", "active", "suspended", "terminated")
BillingStatus = db_enum("billing_status", "current", "overdue", "suspended")
UserStatus = db_enum("user_status", "invited", "active", "suspended", "locked", "deactivated")
UserTokenPurpose = db_enum("user_token_purpose", "password_reset", "email_verification")
GrantScope = db_enum("grant_scope", "owner", "manager", "member")

OnboardingStatus = db_enum(
    "onboarding_status",
    "draft", "submitted", "under_review", "changes_requested",
    "approved", "rejected", "withdrawn", "expired",
)
ApprovalDecision = db_enum("approval_decision", "approved", "rejected", "changes_requested")
OnboardingDocumentKind = db_enum(
    "onboarding_document_kind", "kyb", "dpa", "tax_form", "fair_work_attestation", "insurance", "other"
)

StorageProvider = db_enum("storage_provider", "s3", "gcs", "azure_blob")

RequestCategory = db_enum(
    "request_category", "image", "video", "structured_data", "unstructured_data", "people_deliverable"
)
RequestStatus = db_enum(
    "request_status",
    "draft", "published", "proposals_received", "accepted",
    "in_progress", "delivered", "completed", "cancelled",
)
ProposalStatus = db_enum("proposal_status", "submitted", "accepted", "rejected", "withdrawn")

ContractStatus = db_enum(
    "contract_status", "active", "in_qa", "delivered", "completed", "disputed", "cancelled"
)
TaskStatus = db_enum(
    "task_status", "assigned", "in_progress", "submitted", "qa_passed", "qa_failed", "cancelled"
)
SubmissionStatus = db_enum(
    "submission_status", "open", "submitted", "under_review", "accepted", "rejected", "superseded"
)
AssetStatus = db_enum(
    "asset_status", "pending", "uploaded", "ready", "quarantined", "rejected", "erased"
)
AssignmentStatus = db_enum(
    "assignment_status", "assigned", "in_progress", "submitted", "accepted", "rejected", "cancelled"
)
RedactionState = db_enum(
    "redaction_state", "not_required", "device_redacted", "verified", "failed_verification"
)

QaGate = db_enum("qa_gate", "gate1_supplier", "gate2_partner", "gate3_client")
QaOutcome = db_enum("qa_outcome", "pass", "fail", "waived")

EquipmentStatus = db_enum(
    "equipment_status", "available", "in_use", "returned", "maintenance", "retired"
)
LoanStatus = db_enum("loan_status", "pending", "approved", "rejected", "issued", "returned", "overdue")
WorkerStatus = db_enum("worker_status", "on_shift", "on_break", "offboarded")

LedgerEntryType = db_enum(
    "ledger_entry_type",
    "invoice", "escrow_hold", "escrow_release", "platform_fee", "payout", "refund", "adjustment",
)
LedgerDirection = db_enum("ledger_direction", "debit", "credit")
InvoiceStatus = db_enum("invoice_status", "pending", "paid", "overdue", "void")

NotificationChannel = db_enum("notification_channel", "in_app", "email", "webhook")
