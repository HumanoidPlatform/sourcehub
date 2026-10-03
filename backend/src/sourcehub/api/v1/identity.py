"""identity — organisations, users, roles and grants.

List endpoints lean on RLS deliberately: /organisations?kind=aggregator returns
Ops every aggregator, a tenant its own network, and a client only suppliers
attached to its contracts — same query, three answers, zero WHERE clauses about
tenancy in application code.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any, Literal

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

# runtime import: FastAPI reads the body model off the annotation
from sourcehub.modules.identity.profile_schema import OrgProfilePatch  # noqa: TC001

if TYPE_CHECKING:
    from collections.abc import Awaitable

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


# Editing a profile is also two parties on one route: Ops through org.update,
# an organisation's own owner or manager through profile.manage. The service
# decides which fields each may change and whether the caller's grant scope
# lets them edit at all; organisation_update decides whose row.
_MAY_EDIT_PROFILE = require_any_capability("profile.manage", "org.update")


class SuspendIn(BaseModel):
    reason: str = Field(min_length=3)


class LogoIn(BaseModel):
    storage_key: str = Field(min_length=1, max_length=1024)


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
# clock and erased nothing — the compliance tables the blueprint sketched never
# reached code, and db/290 dropped them. What it did do was hand an irreversible,
# login-killing write to every role holding network.manage, because both UPDATE
# policies on organisation admit the parent tenant.
#
# org_status still declares 'terminated' and nothing writes it, exactly as before.
# Offboarding belongs with retention and erasure, as one decision about what ending
# a commercial relationship actually does.


# ---------------------------------------------------------------------------
# Profile and logo
# ---------------------------------------------------------------------------


async def _profile_call(coro: Awaitable[dict[str, Any]]) -> dict[str, Any]:
    try:
        return await coro
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found") from None
    # Order matters: the forbidden error subclasses the base one.
    except identity.ProfileForbiddenError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e)) from None
    except identity.ProfileError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.patch("/organisations/{org_id}")
async def update_organisation_profile(
    org_id: uuid.UUID,
    body: OrgProfilePatch,
    principal: Principal = Depends(_MAY_EDIT_PROFILE),
    session: AsyncSession = Depends(get_session),
):
    """Change the fields the body names. An explicit null clears one."""
    return await _profile_call(identity.update_org_profile(session, principal, org_id, body))


@router.put("/organisations/{org_id}/logo")
async def set_organisation_logo(
    org_id: uuid.UUID,
    body: LogoIn,
    principal: Principal = Depends(_MAY_EDIT_PROFILE),
    session: AsyncSession = Depends(get_session),
):
    """File an image uploaded through /attachments/presign as the logo."""
    return await _profile_call(identity.set_org_logo(session, principal, org_id, body.storage_key))


@router.delete("/organisations/{org_id}/logo")
async def clear_organisation_logo(
    org_id: uuid.UUID,
    principal: Principal = Depends(_MAY_EDIT_PROFILE),
    session: AsyncSession = Depends(get_session),
):
    return await _profile_call(identity.clear_org_logo(session, principal, org_id))


@router.get("/organisations/{org_id}/logo-url")
async def organisation_logo_url(
    org_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """JSON {url}, not a redirect: a 307 would carry the Authorization header
    to storage (the same reasoning as /assets/{id}/url). Whoever may see the
    organisation may see its logo; the RLS'd read is the check."""
    try:
        return await identity.org_logo_url(session, org_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No logo") from None
