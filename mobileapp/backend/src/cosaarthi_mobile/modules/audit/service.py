from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.db.models import AuditEvent


async def record_event(
    session: AsyncSession,
    event_type: str,
    summary: str,
    actor_user_id: uuid.UUID | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    session.add(
        AuditEvent(
            actor_user_id=actor_user_id,
            event_type=event_type,
            payload=payload or {},
            summary=summary,
        )
    )

