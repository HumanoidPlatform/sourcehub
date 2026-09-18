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

from sourcehub.api.deps import (
    Principal,
    TxRoute,
    get_principal,
    get_session,
    require_any_capability,
    require_capability,
)
from sourcehub.modules.identity import service as identity

router = APIRouter(route_class=TxRoute)

# Suspending is two things wearing one route: a tenant removing a supplier from its
# own network (network.manage), and Ops switching an account off (org.suspend).
#
# Reinstating is NOT symmetric, and the guards say so. RLS cannot tell who
# suspended a row — organisation_update (db/100_rls.sql:131) and
# organisation_update_network (db/110_auth_functions.sql:163) both admit the parent
# tenant — so a shared reinstate guard would let a tenant quietly reverse a
# suspension Ops applied for a compliance reason. Ops-only also restores exactly
# what was true before these routes existed: a tenant could remove a supplier from
# its network and never put it back.
_MAY_SUSPEND = require_any_capability("network.manage", "org.suspend")
_MAY_REINSTATE = require_capability("org.suspend")


OrgStatusFilter = Literal["active", "pending_approval", "suspended", "terminated", "any"]


class SuspendIn(BaseModel):
    reason: str = Field(min_length=3)


@router.get("/organisations")
async def list_organisations(
    kind: Literal["client", "tenant", "aggregator", "business", "sponsor"],
    status_filter: OrgStatusFilter = "active",
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """status_filter defaults to 'active' so existing callers are unchanged;
    'any' is what the operator console needs to see what it suspended."""
    return await identity.list_orgs_of_kind(
        session, kind, principal, None if status_filter == "any" else status_filter
    )


@router.get("/organisations/me")
async def my_organisation(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    org = await identity.get_org(session, principal.org_id, principal)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    return org


@router.get("/organisations/{org_id}")
async def get_organisation(
    org_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    org = await identity.get_org(session, org_id, principal)
    if org is None:
        # an RLS denial and a missing row answer identically — existence is
        # exactly what the policy hides
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    return org


async def _lifecycle(
    action: str, org_id: uuid.UUID, reason: str, principal: Principal, session: AsyncSession
):
    try:
        return await identity.set_org_lifecycle(session, principal, org_id, action, reason)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found") from None
    except identity.OrgLifecycleError as e:
        # 409, not 422: the request is well formed, the organisation is simply
        # not in a state where it means anything.
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None


@router.post("/organisations/{org_id}/suspend")
async def suspend_organisation(
    org_id: uuid.UUID,
    body: SuspendIn,
    principal: Principal = Depends(_MAY_SUSPEND),
    session: AsyncSession = Depends(get_session),
):
    """The prototype's 'remove from network'. A suspension, never a delete.

    Reachable by the parent tenant and by Ops; which row either can actually write
    is RLS's answer, not this guard's.
    """
    return await _lifecycle("suspend", org_id, body.reason, principal, session)


@router.post("/organisations/{org_id}/reinstate")
async def reinstate_organisation(
    org_id: uuid.UUID,
    body: SuspendIn,
    principal: Principal = Depends(_MAY_REINSTATE),
    session: AsyncSession = Depends(get_session),
):
    """The way back, and Ops-only — see the note on _MAY_REINSTATE.

    Without it a suspension was permanent: the account vanished from every list and
    its users could no longer sign in to ask why.
    """
    return await _lifecycle("reinstate", org_id, body.reason, principal, session)


# There is deliberately no /terminate.
#
# It was added alongside these two and removed before it ever shipped. The word
# promised a wind-up the platform cannot perform: nothing keys off 'terminated'
# anywhere, so it stopped no billing, released no escrow, started no retention
# clock and erased nothing — retention_policy, legal_hold and erasure_request have
# no backend references at all. What it did do was hand an irreversible,
# login-killing write to every role holding network.manage, because both UPDATE
# policies on organisation admit the parent tenant.
#
# org_status still declares 'terminated' and nothing writes it, exactly as before.
# Offboarding belongs with the compliance tables, as one decision about what ending
# a commercial relationship actually does.
