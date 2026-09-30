"""vendors — the directory of delivery partners a client browses."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import (
    Principal,
    TxRoute,
    get_session,
    require_any_capability,
    require_capability,
)
from sourcehub.modules.identity import directory

router = APIRouter(route_class=TxRoute)

# The list is the directory, and the directory is the client's (and Ops').
_MAY_BROWSE = require_capability(directory.BROWSE)

# One vendor page is also how a partner sees itself as clients do, so the door
# admits profile.manage too. The service then lets such a caller through to its
# own organisation only; see directory.get_vendor.
_MAY_OPEN = require_any_capability(directory.BROWSE, "profile.manage")


@router.get("/vendors")
async def list_vendors(
    principal: Principal = Depends(_MAY_BROWSE),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    return {"items": await directory.list_vendors(session, principal)}


@router.get("/vendors/{org_id}")
async def get_vendor(
    org_id: uuid.UUID,
    principal: Principal = Depends(_MAY_OPEN),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await directory.get_vendor(session, principal, org_id)
    except LookupError:
        # Not listed, not a delivery partner, and not yours to open answer
        # identically: which of them it was is what the policy hides.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor not found") from None
