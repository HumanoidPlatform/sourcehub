from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from cosaarthi_mobile.db.models import Role, User


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(
        select(User)
        .options(
            selectinload(User.organization),
            selectinload(User.roles).selectinload(Role.permissions),
        )
        .where(User.email == email.lower())
    )
