"""notify — in-app messages, email, webhooks and digests.

Business rules, and the ONLY public surface of this module.

notify() is called by other modules in the same transaction as the change it
announces, exactly as the prototype pairs every mutation with a notification.
Each carries a deep link so the bell can take the reader to the thing itself.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.modules.notify.models import Notification


async def notify(
    session: AsyncSession,
    org_id: uuid.UUID,
    body: str,
    link_page: str | None = None,
    link_params: dict[str, Any] | None = None,
    user_id: uuid.UUID | None = None,
) -> None:
    """Core INSERT, deliberately without RETURNING.

    The ORM (and even a Core insert, for a table whose PK has a
    server default) emits INSERT ... RETURNING id for the server-generated
    PK, and under RLS a RETURNING row must also pass the SELECT policy — which
    a notification addressed to ANOTHER org never can for the sender. The
    failure then surfaces at COMMIT, after the response has gone out, and the
    whole transaction rolls back silently. A plain INSERT needs only the
    WITH CHECK, which any authenticated org passes.

    user_id addresses one person rather than the whole organisation: a field
    worker's bell shows only rows addressed to them.
    """
    import json

    await session.execute(
        text(
            "INSERT INTO notification (org_id, user_id, body, link_page, link_params) "
            "VALUES (:org, :user, :body, :page, CAST(:params AS jsonb))"
        ),
        {"org": org_id, "user": user_id, "body": body, "page": link_page,
         "params": json.dumps(link_params or {}, default=str)},
    )


async def list_notifications(session: AsyncSession, limit: int = 30) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(Notification).order_by(Notification.created_at.desc()).limit(limit)
        )
    ).scalars()
    return [
        {
            "id": n.id,
            "body": n.body,
            "link_page": n.link_page,
            "link_params": n.link_params,
            "read": n.read_at is not None,
            "created_at": n.created_at,
        }
        for n in rows
    ]


async def unread_count(session: AsyncSession) -> int:
    return (
        await session.execute(
            select(func.count()).select_from(Notification).where(Notification.read_at.is_(None))
        )
    ).scalar_one()


async def mark_read(session: AsyncSession, notification_id: uuid.UUID | None = None) -> None:
    """One notification, or — with no id — the whole bell."""
    stmt = (
        update(Notification)
        .where(Notification.read_at.is_(None))
        .values(read_at=dt.datetime.now(dt.timezone.utc))
    )
    if notification_id is not None:
        stmt = stmt.where(Notification.id == notification_id)
    await session.execute(stmt)
