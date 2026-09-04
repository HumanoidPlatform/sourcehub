from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession


async def queue_for_review(_session: AsyncSession, _submission_id: str) -> None:
    """Placeholder for the mobile QA module; submissions are persisted now."""
    return None

