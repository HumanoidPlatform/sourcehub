"""notify — the bell: list, unread count, mark read."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session
from sourcehub.modules.notify import service as notify

router = APIRouter(route_class=TxRoute)


@router.get("")
async def list_notifications(
    limit: int = Query(30, ge=1, le=100),
    before: uuid.UUID | None = None,
    unread_only: bool = False,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """The bell calls this bare; the notifications page pages with `before`.

    One row beyond `limit` is read to learn whether there is another page,
    rather than counting the whole history on every call.
    """
    items = await notify.list_notifications(
        session, limit=limit + 1, before=before, unread_only=unread_only
    )
    return {
        "unread": await notify.unread_count(session),
        "items": items[:limit],
        "has_more": len(items) > limit,
    }


@router.post("/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    await notify.mark_read(session)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_one_read(
    notification_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    await notify.mark_read(session, notification_id)
