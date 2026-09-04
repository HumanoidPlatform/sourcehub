from __future__ import annotations

import datetime as dt
import uuid
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from cosaarthi_mobile.api.schemas import (
    AuthSessionOut,
    AuthUserOut,
    CreateSubmissionIn,
    LoginIn,
    SignupIn,
    SwitchPersonaIn,
)
from cosaarthi_mobile.modules.roles.service import available_personas, primary_persona
from cosaarthi_mobile.modules.submissions import service as submissions_service


def test_signup_accepts_mobile_camel_case_payload() -> None:
    parsed = SignupIn.model_validate(
        {
            "email": "new.worker@cosaarthi.example",
            "firstName": "New",
            "lastName": "Worker",
            "password": "Cosaarthi#2026",
            "phone": "+91 90000 11111",
            "termsAccepted": True,
        }
    )

    assert parsed.first_name == "New"
    assert parsed.terms_accepted is True


def test_login_accepts_required_local_development_email() -> None:
    parsed = LoginIn.model_validate(
        {"email": "Platform@Cosaarthi.Local", "password": "Cosaarthi#2026"}
    )

    assert parsed.email == "platform@cosaarthi.local"


def test_auth_session_serializes_mobile_camel_case() -> None:
    user = AuthUserOut(
        available_personas=["crowd"],
        certification_ids=[],
        email="anita@crowd.in",
        entity={"id": "worker-1", "name": "Anita Rao", "type": "crowd_pool"},
        id=uuid.uuid4(),
        locale="en-IN",
        name="Anita Rao",
        permissions=["work:read"],
        persona="crowd",
        phone="+91 90000 7007",
        tenant={"id": "org-1", "name": "Cosaarthi Crowd"},
    )
    session = AuthSessionOut(
        access_token="access",
        expires_at=dt.datetime.now(dt.UTC),
        refresh_token="refresh",
        user=user,
    )

    data = session.model_dump(mode="json", by_alias=True)

    assert data["accessToken"] == "access"
    assert data["refreshToken"] == "refresh"
    assert data["sessionVersion"] == 2
    assert data["user"]["availablePersonas"] == ["crowd"]


def test_switch_persona_accepts_assigned_persona_payload() -> None:
    parsed = SwitchPersonaIn.model_validate({"persona": "aggregator"})

    assert parsed.persona == "aggregator"


def test_role_codes_map_to_mobile_personas_in_product_order() -> None:
    user = SimpleNamespace(
        roles=[
            SimpleNamespace(code="qa", permissions=[]),
            SimpleNamespace(code="crowd_worker", permissions=[]),
            SimpleNamespace(code="tenant", permissions=[]),
            SimpleNamespace(code="aggregator", permissions=[]),
        ]
    )

    assert available_personas(user) == ["tenant", "aggregator", "qa", "crowd"]
    assert primary_persona(user) == "tenant"


@pytest.mark.asyncio
async def test_submission_requires_task_required_upload_count(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task = SimpleNamespace(
        id=uuid.uuid4(),
        required_upload_count=3,
        task_code="TASK-MINIO-3",
        title="Upload 3 Photos",
    )
    user = SimpleNamespace(id=uuid.uuid4(), email="anita@crowd.in")
    body = CreateSubmissionIn.model_validate(
        {
            "idempotencyKey": "final-two-keys",
            "meta": {"objectKeys": ["one", "two"]},
            "payloadRef": "minio://cosaarthi-mobile-media/TASK-MINIO-3",
            "projectId": "MinIO Upload Reliability Test",
            "taskId": "TASK-MINIO-3",
            "type": "capture",
        }
    )

    class FakeSession:
        async def scalar(self, _statement: object) -> object | None:
            return None

    async def get_task_by_code(_session: object, _task_id: str) -> object:
        return task

    monkeypatch.setattr(submissions_service, "get_task_by_code", get_task_by_code)

    with pytest.raises(HTTPException) as exc_info:
        await submissions_service.create_submission(FakeSession(), user, body)

    assert exc_info.value.status_code == 409
    assert "Upload all 3 photos" in exc_info.value.detail


@pytest.mark.asyncio
async def test_minio_submission_rejects_missing_uploaded_assets(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task = SimpleNamespace(
        id=uuid.uuid4(),
        required_upload_count=3,
        task_code="TASK-MINIO-3",
        title="Upload 3 Photos",
    )
    user = SimpleNamespace(id=uuid.uuid4(), email="anita@crowd.in")
    body = CreateSubmissionIn.model_validate(
        {
            "idempotencyKey": "final-three-keys",
            "meta": {"objectKeys": ["one", "two", "three"]},
            "payloadRef": "minio://cosaarthi-mobile-media/TASK-MINIO-3",
            "projectId": "MinIO Upload Reliability Test",
            "taskId": "TASK-MINIO-3",
            "type": "capture",
        }
    )

    class FakeSession:
        def __init__(self) -> None:
            self.scalar_calls = 0

        async def scalar(self, _statement: object) -> object | None:
            self.scalar_calls += 1
            return None if self.scalar_calls == 1 else 2

    async def get_task_by_code(_session: object, _task_id: str) -> object:
        return task

    monkeypatch.setattr(submissions_service, "get_task_by_code", get_task_by_code)

    with pytest.raises(HTTPException) as exc_info:
        await submissions_service.create_submission(FakeSession(), user, body)

    assert exc_info.value.status_code == 409
    assert "uploaded assets are missing" in exc_info.value.detail
