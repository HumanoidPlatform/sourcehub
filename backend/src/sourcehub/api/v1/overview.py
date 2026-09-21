"""overview — one call behind a landing page.

Gated on delivery.track, which the seed already grants to the client and the
delivery partner (db/900_seed.sql) and which no route has ever required. The
capability was written for exactly this and has been dead since; using it means
this endpoint ships without touching the permission matrix.

Only the client shape exists today. The other workspaces get an honest 404
rather than a client-shaped answer computed from rows that mean something else
to them — a tenant sees every published RFP on the platform, so "requests by
stage" would be a number about the marketplace, not about their business.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_session, require_capability
from sourcehub.modules.overview import service as overview

router = APIRouter(route_class=TxRoute)


@router.get("/overview")
async def get_overview(
    principal: Principal = Depends(require_capability("delivery.track")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    if principal.org_kind != "client":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No overview for this workspace yet",
        )
    return await overview.client_overview(session)
