"""audit — the activity trail. Read-only; writes happen inside services."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session
from sourcehub.modules.audit import service as audit

router = APIRouter(route_class=TxRoute)


@router.get("")
async def activity(
    scope_id: uuid.UUID | None = None,
    limit: int = 40,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    return await audit.list_activity(session, scope_id, min(limit, 100))
