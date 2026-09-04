from __future__ import annotations

import datetime as dt
import re
import uuid
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_email(value: str) -> str:
    email = value.strip().lower()
    if len(email) > 320 or not EMAIL_RE.fullmatch(email):
        raise ValueError("Enter a valid email")
    return email


def to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part[:1].upper() + part[1:] for part in tail)


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


Persona = Literal[
    "platform",
    "client",
    "tenant",
    "aggregator",
    "qa",
    "partner",
    "sponsor",
    "crowd",
    "ide",
    "builder",
]


class AuthUserOut(ApiModel):
    id: uuid.UUID
    name: str
    email: str
    phone: str
    locale: str
    persona: Persona
    available_personas: list[Persona]
    entity: dict[str, str]
    tenant: dict[str, str]
    permissions: list[str]
    certification_ids: list[str] = []

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return normalize_email(value)


class AuthSessionOut(ApiModel):
    access_token: str
    auth_mode: Literal["real"] = "real"
    refresh_token: str
    expires_at: dt.datetime
    session_version: int = 2
    user: AuthUserOut


class LoginIn(BaseModel):
    email: str
    password: str = Field(min_length=8)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return normalize_email(value)


class SignupIn(ApiModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str
    phone: str = Field(min_length=7, max_length=40)
    password: str = Field(min_length=10, max_length=256)
    terms_accepted: bool

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return normalize_email(value)


class SwitchPersonaIn(ApiModel):
    persona: Persona


class TaskOut(ApiModel):
    id: str
    title: str
    category: str | None = None
    project: str
    campaign_id: str | None = None
    location: str
    pay: float
    currency: Literal["INR", "USD"]
    estimated_minutes: int
    difficulty: str
    status: str
    task_type: str
    progress: float
    required_media: list[str]
    required_upload_count: int | None = None
    allowed_file_types: list[str] | None = None
    storage_bucket: str | None = None
    required_duration_ms: int | None = None
    certification_required: str | None = None
    distance_km: float | None = None
    slots_remaining: int
    due_at: dt.datetime
    checklist: list[str]
    description: str
    quality_bar: str


class HomeSummaryOut(ApiModel):
    available_count: int
    active_count: int
    queued_uploads: int
    today_earnings: float
    today_stats: dict[str, float | int]
    next_action: str
    readiness: list[dict[str, Any]]
    edge_pipeline: list[dict[str, Any]]


class NotificationOut(ApiModel):
    id: uuid.UUID
    title: str
    body: str
    created_at: dt.datetime
    read: bool
    tone: str
    deep_link: str | None = None


class PresignUploadIn(ApiModel):
    task_id: str
    kind: Literal["image", "video", "audio"]
    file_name: str
    mime_type: str
    size_bytes: int = Field(ge=1)
    idempotency_key: str = Field(min_length=8)


class PresignUploadOut(ApiModel):
    upload_id: uuid.UUID
    object_key: str
    upload_url: str
    expires_at: dt.datetime
    headers: dict[str, str]


class ConfirmUploadIn(ApiModel):
    upload_id: uuid.UUID
    task_id: str
    idempotency_key: str = Field(min_length=8)


class UploadMediaOut(ApiModel):
    status: str
    message: str
    object_key: str | None = None
    submission_id: str
    duplicate_score: float | None = None
    mock_qc_status: str | None = None
    preliminary_validation: dict[str, Any] | None = None
    protected_asset: dict[str, Any] | None = None


class CreateSubmissionIn(ApiModel):
    project_id: str | None = None
    campaign_id: str | None = None
    task_id: str
    type: str
    payload_ref: str
    meta: dict[str, Any]
    idempotency_key: str = Field(min_length=8)


class SubmissionOut(ApiModel):
    submission_id: str
    status: str
    message: str
