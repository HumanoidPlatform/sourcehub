"""ledger — invoices. Read-only to organisations; Ops reads everyone's."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_session, require_capability
from sourcehub.modules.ledger import service as ledger

router = APIRouter(route_class=TxRoute)


@router.get("/invoices")
async def invoices(
    principal: Principal = Depends(require_capability("invoice.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ledger.list_invoices(session)
