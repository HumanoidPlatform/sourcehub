from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.api.schemas import TaskOut
from cosaarthi_mobile.db.models import Assignment, Task, User


def task_to_out(task: Task, status: str | None = None) -> TaskOut:
    return TaskOut(
        allowed_file_types=task.allowed_file_types,
        campaign_id=task.campaign_id,
        category=task.category,
        certification_required=task.certification_required,
        checklist=task.checklist,
        currency=task.currency,  # type: ignore[arg-type]
        description=task.description,
        difficulty=task.difficulty,
        distance_km=float(task.distance_km) if task.distance_km is not None else None,
        due_at=task.due_at,
        estimated_minutes=task.estimated_minutes,
        id=task.task_code,
        location=task.location,
        pay=float(task.pay),
        progress=task.progress / 100,
        project=task.project,
        quality_bar=task.quality_bar,
        required_duration_ms=task.required_duration_ms,
        required_media=task.required_media,
        required_upload_count=task.required_upload_count,
        slots_remaining=task.slots_remaining,
        status=status or task.status,
        storage_bucket=task.storage_bucket,
        task_type=task.task_type,
        title=task.title,
    )


async def get_task_by_code(session: AsyncSession, task_code: str) -> Task | None:
    return await session.scalar(select(Task).where(Task.task_code == task_code))


async def get_available_tasks(session: AsyncSession, user: User) -> list[TaskOut]:
    assigned_task_ids = select(Assignment.task_id).where(Assignment.user_id == user.id)
    tasks = (
        await session.scalars(
            select(Task)
            .where(Task.status == "available")
            .where(Task.id.not_in(assigned_task_ids))
            .order_by(Task.due_at.asc())
        )
    ).all()
    return [task_to_out(task, "available") for task in tasks]


async def get_my_tasks(session: AsyncSession, user: User) -> list[TaskOut]:
    rows = (
        await session.execute(
            select(Assignment, Task)
            .join(Task, Task.id == Assignment.task_id)
            .where(Assignment.user_id == user.id)
            .order_by(Assignment.updated_at.desc())
        )
    ).all()
    return [task_to_out(task, assignment.status) for assignment, task in rows]


async def get_task_for_user(session: AsyncSession, user: User, task_code: str) -> TaskOut | None:
    task = await get_task_by_code(session, task_code)
    if task is None:
        return None
    assignment = await session.scalar(
        select(Assignment).where(Assignment.task_id == task.id, Assignment.user_id == user.id)
    )
    return task_to_out(task, assignment.status if assignment else "available")


async def start_task(session: AsyncSession, user: User, task_code: str) -> TaskOut | None:
    task = await get_task_by_code(session, task_code)
    if task is None:
        return None
    assignment = await session.scalar(
        select(Assignment).where(Assignment.task_id == task.id, Assignment.user_id == user.id)
    )
    if assignment is None:
        assignment = Assignment(task_id=task.id, user_id=user.id, status="in_progress")
        session.add(assignment)
    else:
        assignment.status = "in_progress"
    await session.flush()
    return task_to_out(task, assignment.status)


async def task_uuid_for_code(session: AsyncSession, task_code: str) -> uuid.UUID | None:
    task = await get_task_by_code(session, task_code)
    return task.id if task else None

