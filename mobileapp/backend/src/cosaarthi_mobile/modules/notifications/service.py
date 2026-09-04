from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.api.schemas import NotificationOut
from cosaarthi_mobile.db.models import Notification


async def create_notification(
    session: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    body: str,
    tone: str = "info",
    deep_link: str | None = None,
) -> None:
    session.add(
        Notification(
            body=body,
            deep_link=deep_link,
            title=title,
            tone=tone,
            user_id=user_id,
        )
    )


def to_out(notification: Notification) -> NotificationOut:
    return NotificationOut(
        body=notification.body,
        created_at=notification.created_at,
        deep_link=notification.deep_link,
        id=notification.id,
        read=notification.read,
        title=notification.title,
        tone=notification.tone,
    )


async def list_notifications(session: AsyncSession, user_id: uuid.UUID) -> list[NotificationOut]:
    rows = (
        await session.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
    ).all()
    return [to_out(row) for row in rows]


async def mark_read(
    session: AsyncSession, user_id: uuid.UUID, notification_id: uuid.UUID
) -> NotificationOut | None:
    notification = await session.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    if notification is None:
        return None
    notification.read = True
    await session.flush()
    return to_out(notification)


async def mark_all_read(session: AsyncSession, user_id: uuid.UUID) -> list[NotificationOut]:
    rows = (
        await session.scalars(select(Notification).where(Notification.user_id == user_id))
    ).all()
    for row in rows:
        row.read = True
    await session.flush()
    return [to_out(row) for row in rows]
