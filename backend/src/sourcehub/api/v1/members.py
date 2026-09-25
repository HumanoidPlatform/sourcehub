"""members — the people inside your own organisation.

Every mutating route here is guarded by require_member_admin, never a bare
require_capability, and that distinction is the whole point of the module.

Capabilities come from the ROLE (user_capabilities, db/020_rbac.sql:141) and
there is exactly one role per organisation kind, so every member of a client
org already holds user.invite, user.manage AND role.manage. Guarding these
routes on capability alone would let any colleague remove the person who
invited them. What separates them is user_role_grant.scope — the column
db/020_rbac.sql:39 was built for and nothing had ever read.

A test walks these routes' dependency trees and asserts that, because it is the
regression this feature is most likely to suffer six months from now: someone
adds a seventh route, copies the require_capability line from a neighbouring
module, and the scope gate quietly stops applying to it.
"""

from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import (
    Principal,
    TxRoute,
    get_session,
    require_capability,
    require_member_admin,
)
from sourcehub.modules.identity import service as identity

router = APIRouter(route_class=TxRoute)

Scope = Literal["owner", "manager", "member"]


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


def _not_found() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Not a member of this organisation")


@router.get("/members")
async def list_members(
    principal: Principal = Depends(require_capability("user.manage")),
    session: AsyncSession = Depends(get_session),
):
    """Read-only, so capability alone is enough: a member who can see the Team
    page but not change it is a reasonable thing to be, and RLS confines the
    rows either way."""
    return await identity.list_members(session, principal)


@router.get("/members/roles")
async def assignable_roles(
    principal: Principal = Depends(require_capability("user.manage")),
    session: AsyncSession = Depends(get_session),
):
    """The roles this organisation may grant — never a hard-coded list.

    platform_admin cannot appear for a non-platform organisation, by the same
    applies_to_kind rule db/200's trigger enforces at the schema. That matters:
    role.code reaches app.role, and is_platform_admin() is just
    current_setting('app.role') = 'platform_admin'.
    """
    return await identity.assignable_roles(session, principal)


class InviteIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    role_code: str = Field(min_length=1, max_length=60)
    scope: Scope = "member"


@router.post("/members", status_code=status.HTTP_202_ACCEPTED)
async def invite_member(
    body: InviteIn,
    principal: Principal = Depends(require_member_admin("user.invite")),
    session: AsyncSession = Depends(get_session),
):
    """202 when the person was added, 409 with a reason when they were not.

    This used to answer 202 whatever happened, so as not to confirm whether an
    address had an account. It meant inviting someone who already had one — a
    normal thing to attempt, since app_user.email is unique platform-wide —
    reported success, created nothing, and sent no mail.

    The refusal names the problem but never the organisation holding the
    address: that would make this form a directory of other tenants' staff. See
    identity.invite_member for the full reasoning.
    """
    try:
        return await identity.invite_member(
            session, principal,
            email=str(body.email), full_name=body.full_name,
            role_code=body.role_code, scope=body.scope,
        )
    except identity.MemberError as e:
        raise _conflict(e) from None


@router.post("/members/{user_id}/resend-invitation", status_code=status.HTTP_204_NO_CONTENT)
async def resend_invitation(
    user_id: uuid.UUID,
    principal: Principal = Depends(require_member_admin("user.invite")),
    session: AsyncSession = Depends(get_session),
):
    try:
        await identity.resend_member_invitation(session, principal, user_id)
    except LookupError:
        raise _not_found() from None
    except identity.MemberError as e:
        raise _conflict(e) from None


class MemberPatchIn(BaseModel):
    role_code: str | None = Field(default=None, max_length=60)
    scope: Scope | None = None


@router.patch("/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def change_member(
    user_id: uuid.UUID,
    body: MemberPatchIn,
    principal: Principal = Depends(require_member_admin("user.manage")),
    session: AsyncSession = Depends(get_session),
):
    """Role and scope in one route because they are one grant row, and changing
    a role is revoke-then-insert: doing them separately would need two
    transactions and could leave a member briefly ungranted.

    The capability split the seed already decided is honoured here: aggregator,
    business and sponsor hold user.manage but NOT role.manage
    (db/900_seed.sql:115-127), so they may change someone's access level and
    not their role. Promoting anyone to owner needs owner scope, checked in
    may_manage rather than here, so the rule has one home.
    """
    if body.role_code is None and body.scope is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to change")
    if body.role_code is not None and "role.manage" not in principal.capabilities:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Requires capability: role.manage"
        )
    try:
        await identity.change_member(
            session, principal, user_id, role_code=body.role_code, scope=body.scope
        )
    except LookupError:
        raise _not_found() from None
    except identity.MemberError as e:
        raise _conflict(e) from None


class RevokeIn(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


@router.post("/members/{user_id}/revoke", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_member(
    user_id: uuid.UUID,
    body: RevokeIn,
    principal: Principal = Depends(require_member_admin("user.manage")),
    session: AsyncSession = Depends(get_session),
):
    """Sets revoked_at and ends their sessions. Never deletes — revocation is a
    timestamp by design, so the trail outlives the person's access.

    Self-revoke is allowed and left to the owner invariant to refuse when it
    would empty the owner set. Impossible beats a special case for `target ==
    me`, which would also have to be duplicated in every future caller.
    """
    try:
        await identity.revoke_member(session, principal, user_id, body.reason)
    except LookupError:
        raise _not_found() from None
    except identity.MemberError as e:
        raise _conflict(e) from None
