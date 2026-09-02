"""identity — organisations, users, roles and grants.

List endpoints lean on RLS deliberately: /organisations?kind=aggregator returns
Ops every aggregator, a tenant its own network, and a client only suppliers
attached to its contracts — same query, three answers, zero WHERE clauses about
tenancy in application code.
"""

from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session, require_capability
from sourcehub.modules.identity import service as identity

router = APIRouter(route_class=TxRoute)


class SuspendIn(BaseModel):
    reason: str = Field(min_length=3)


@router.get("/organisations")
async def list_organisations(
    kind: Literal["client", "tenant", "aggregator", "business", "sponsor"],
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    return await identity.list_orgs_of_kind(session, kind)


@router.get("/organisations/me")
async def my_organisation(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    org = await identity.get_org(session, principal.org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    return org


@router.get("/organisations/{org_id}")
async def get_organisation(
    org_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    org = await identity.get_org(session, org_id)
    if org is None:
        # an RLS denial and a missing row answer identically — existence is
        # exactly what the policy hides
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    return org


@router.post("/organisations/{org_id}/suspend")
async def suspend_organisation(
    org_id: uuid.UUID,
    body: SuspendIn,
    principal: Principal = Depends(require_capability("network.manage")),
    session: AsyncSession = Depends(get_session),
):
    """The prototype's 'remove from network'. A suspension, never a delete —
    RLS limits it to the parent tenant (or Ops via org.suspend)."""
    try:
        return await identity.suspend_network_org(session, principal, org_id, body.reason)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found") from None
