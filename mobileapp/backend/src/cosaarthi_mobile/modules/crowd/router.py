from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.api.deps import CurrentUser, get_current_user, require_permission
from cosaarthi_mobile.api.schemas import (
    ConfirmUploadIn,
    CreateSubmissionIn,
    HomeSummaryOut,
    NotificationOut,
    PresignUploadIn,
    PresignUploadOut,
    SubmissionOut,
    TaskOut,
    UploadMediaOut,
)
from cosaarthi_mobile.db.session import get_session
from cosaarthi_mobile.modules.assets import service as assets
from cosaarthi_mobile.modules.crowd import service as crowd
from cosaarthi_mobile.modules.notifications import service as notifications
from cosaarthi_mobile.modules.submissions import service as submissions
from cosaarthi_mobile.modules.tasks import service as tasks

router = APIRouter(tags=["crowd"])


@router.get("/mobile/crowd/home", response_model=HomeSummaryOut, response_model_by_alias=True)
async def home(
    current: CurrentUser = Depends(require_permission("work:read")),
    session: AsyncSession = Depends(get_session),
):
    return await crowd.home_summary(session, current.user)


@router.get(
    "/mobile/crowd/tasks/available",
    response_model=list[TaskOut],
    response_model_by_alias=True,
)
async def available_tasks(
    current: CurrentUser = Depends(require_permission("work:read")),
    session: AsyncSession = Depends(get_session),
):
    return await tasks.get_available_tasks(session, current.user)


@router.get("/mobile/crowd/tasks/mine", response_model=list[TaskOut], response_model_by_alias=True)
async def my_tasks(
    current: CurrentUser = Depends(require_permission("work:read")),
    session: AsyncSession = Depends(get_session),
):
    return await tasks.get_my_tasks(session, current.user)


@router.get("/mobile/crowd/tasks/{task_id}", response_model=TaskOut, response_model_by_alias=True)
async def task_detail(
    task_id: str,
    current: CurrentUser = Depends(require_permission("work:read")),
    session: AsyncSession = Depends(get_session),
):
    task = await tasks.get_task_for_user(session, current.user, task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return task


@router.post(
    "/mobile/crowd/tasks/{task_id}/start",
    response_model=TaskOut,
    response_model_by_alias=True,
)
async def start_task(
    task_id: str,
    current: CurrentUser = Depends(require_permission("task:start")),
    session: AsyncSession = Depends(get_session),
):
    task = await tasks.start_task(session, current.user, task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    await session.commit()
    return task


@router.get(
    "/mobile/crowd/notifications",
    response_model=list[NotificationOut],
    response_model_by_alias=True,
)
async def list_notifications(
    current: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await notifications.list_notifications(session, current.user.id)


@router.post(
    "/mobile/crowd/notifications/{notification_id}/read",
    response_model=NotificationOut,
    response_model_by_alias=True,
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    notification = await notifications.mark_read(session, current.user.id, notification_id)
    if notification is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    await session.commit()
    return notification


@router.post(
    "/mobile/crowd/notifications/read-all",
    response_model=list[NotificationOut],
    response_model_by_alias=True,
)
async def mark_all_notifications_read(
    current: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = await notifications.mark_all_read(session, current.user.id)
    await session.commit()
    return rows


@router.get("/mobile/crowd/certifications")
async def certifications(current: CurrentUser = Depends(get_current_user)):
    return []


@router.get("/mobile/crowd/learning")
async def learning(current: CurrentUser = Depends(get_current_user)):
    return []


@router.get("/mobile/crowd/kit")
async def kit(current: CurrentUser = Depends(get_current_user)):
    return {
        "acceptedAt": None,
        "custodyStatus": "assigned",
        "devices": [],
        "kitId": f"kit-{current.user.id}",
        "kitName": "Cosaarthi mobile kit",
        "warnings": [],
    }


@router.get("/mobile/crowd/wallet")
async def wallet(current: CurrentUser = Depends(get_current_user)):
    return {
        "balance": 0,
        "byJobType": [],
        "currency": "INR",
        "ledger": [],
        "lifetime": 0,
        "pending": 0,
        "weekEarnings": 0,
        "withdrawals": [],
    }


@router.get("/mobile/crowd/appeals")
async def appeals(current: CurrentUser = Depends(get_current_user)):
    return []


@router.post(
    "/mobile/crowd/uploads/presign",
    response_model=PresignUploadOut,
    response_model_by_alias=True,
)
async def presign_upload(
    body: PresignUploadIn,
    current: CurrentUser = Depends(require_permission("upload:create")),
    session: AsyncSession = Depends(get_session),
):
    result = await assets.presign_upload(session, current.user, body)
    await session.commit()
    return result


@router.post(
    "/mobile/crowd/uploads/confirm",
    response_model=UploadMediaOut,
    response_model_by_alias=True,
)
async def confirm_upload(
    body: ConfirmUploadIn,
    current: CurrentUser = Depends(require_permission("upload:create")),
    session: AsyncSession = Depends(get_session),
):
    result = await assets.confirm_upload(session, current.user, body)
    await session.commit()
    return result


@router.post(
    "/actions/submission.create",
    response_model=SubmissionOut,
    response_model_by_alias=True,
)
async def create_submission(
    body: CreateSubmissionIn,
    current: CurrentUser = Depends(require_permission("submission:create")),
    session: AsyncSession = Depends(get_session),
):
    result = await submissions.create_submission(session, current.user, body)
    await session.commit()
    return result


@router.post("/actions/wallet.withdraw")
async def withdraw_wallet(current: CurrentUser = Depends(get_current_user)):
    return {
        "message": "Wallet withdrawals are not enabled in the mobile local backend.",
        "status": "failed",
        "withdrawalId": "local-withdraw-disabled",
    }


@router.post("/actions/submission.appeal")
async def create_appeal(current: CurrentUser = Depends(get_current_user)):
    return {
        "appealId": "local-appeal-placeholder",
        "message": "Appeals are not enabled in the mobile local backend yet.",
        "state": "open",
    }


@router.post("/actions/submissions/{submission_id}/accept")
async def accept_submission(
    submission_id: str,
    current: CurrentUser = Depends(get_current_user),
):
    return {
        "adminOriginalExportAvailable": False,
        "kind": "image",
        "message": "Watermarking is not required for this local image submission.",
        "privateOriginalStored": False,
        "submissionId": submission_id,
        "watermarkStatus": "NOT_REQUIRED",
    }
