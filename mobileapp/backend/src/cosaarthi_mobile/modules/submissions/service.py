from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.api.schemas import CreateSubmissionIn, SubmissionOut
from cosaarthi_mobile.db.models import Asset, Submission, User
from cosaarthi_mobile.modules.assignments.service import mark_submitted
from cosaarthi_mobile.modules.audit.service import record_event
from cosaarthi_mobile.modules.notifications.service import create_notification
from cosaarthi_mobile.modules.tasks.service import get_task_by_code


async def create_submission(
    session: AsyncSession, user: User, body: CreateSubmissionIn
) -> SubmissionOut:
    existing = await session.scalar(
        select(Submission).where(
            Submission.user_id == user.id,
            Submission.idempotency_key == body.idempotency_key,
        )
    )
    if existing:
        return SubmissionOut(
            message="Submission already recorded for this idempotency key.",
            status=existing.status,
            submission_id=existing.submission_code,
        )

    task = await get_task_by_code(session, body.task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    object_keys = body.meta.get("objectKeys")
    required_upload_count = task.required_upload_count
    if required_upload_count and required_upload_count > 0:
        if not isinstance(object_keys, list) or len(object_keys) != required_upload_count:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Upload all {required_upload_count} photos before submitting",
            )
        uploaded_count = (
            await session.scalar(
                select(func.count(Asset.id))
                .where(
                    Asset.user_id == user.id,
                    Asset.task_id == task.id,
                    Asset.object_key.in_(object_keys),
                    Asset.status == "uploaded",
                )
            )
        )
        if uploaded_count != required_upload_count:
            raise HTTPException(status.HTTP_409_CONFLICT, "One or more uploaded assets are missing")

    submission = Submission(
        idempotency_key=body.idempotency_key,
        meta=body.meta,
        payload_ref=body.payload_ref,
        status="processing",
        submission_code=f"sub-{body.idempotency_key[:24]}",
        task_id=task.id,
        type=body.type,
        user_id=user.id,
    )
    session.add(submission)
    await session.flush()

    if isinstance(object_keys, list):
        assets = (
            await session.scalars(
                select(Asset).where(
                    Asset.user_id == user.id,
                    Asset.task_id == task.id,
                    Asset.object_key.in_(object_keys),
                    Asset.status == "uploaded",
                )
            )
        ).all()
        for asset in assets:
            asset.submission_id = submission.id

    await mark_submitted(session, user, task)
    await create_notification(
        session,
        user.id,
        "Submission received",
        f"{task.title} is queued for QA review.",
        tone="success",
        deep_link="/uploads",
    )
    await record_event(
        session,
        "submission.created",
        f"{user.email} submitted {task.task_code}",
        actor_user_id=user.id,
        payload={"taskId": task.task_code, "submissionId": submission.submission_code},
    )
    return SubmissionOut(
        message="Submission received and queued for QA review.",
        status=submission.status,
        submission_id=submission.submission_code,
    )
