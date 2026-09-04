from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.db.models import Assignment, Task, User


async def mark_submitted(session: AsyncSession, user: User, task: Task) -> None:
    assignment = await session.scalar(
        select(Assignment).where(Assignment.user_id == user.id, Assignment.task_id == task.id)
    )
    if assignment is None:
        assignment = Assignment(user_id=user.id, task_id=task.id, status="submitted")
        session.add(assignment)
    else:
        assignment.status = "submitted"

