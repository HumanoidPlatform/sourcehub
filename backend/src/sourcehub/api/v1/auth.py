"""auth — login, refresh, logout, invitation acceptance, password reset.

Runs without an org context: authentication happens before one exists. Every
anonymous step goes through a SECURITY DEFINER function rather than reading
RLS-protected tables directly. The only other router like it is offers.py, a
worker answering a task offer from a link.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from sourcehub.api.deps import Principal, get_principal
from sourcehub.api.security import issue_access_token
from sourcehub.modules.identity import service as identity

router = APIRouter()


# ---------------------------------------------------------------------------
# Shapes
# ---------------------------------------------------------------------------

class LoginIn(BaseModel):
    email: str
    password: str
    org_id: uuid.UUID | None = None


class OrgChoiceOut(BaseModel):
    org_id: uuid.UUID
    org_kind: str
    org_name: str
    reference_code: str
    role_code: str


class SessionOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: uuid.UUID
    full_name: str
    email: str
    org_id: uuid.UUID
    org_kind: str
    org_name: str
    role: str
    scope: str
    capabilities: list[str]
    must_change_password: bool


class ChooseOrgOut(BaseModel):
    choose_org: bool = True
    organisations: list[OrgChoiceOut]


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(BaseModel):
    refresh_token: str | None = None
    everywhere: bool = False


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10)


class InvitationAcceptIn(BaseModel):
    token: str
    password: str = Field(min_length=10)


class ResetRequestIn(BaseModel):
    email: str


class ResetConfirmIn(BaseModel):
    token: str
    password: str = Field(min_length=10)


def _session_out(result: identity.LoginSuccess) -> SessionOut:
    c = result.claims
    return SessionOut(
        access_token=issue_access_token(c),
        refresh_token=result.refresh_token_raw,
        user_id=c.user_id,
        full_name=c.full_name,
        email=c.email,
        org_id=c.org_id,
        org_kind=c.org_kind,
        org_name=c.org_name,
        role=c.role,
        scope=c.scope,
        capabilities=sorted(c.capabilities),
        must_change_password=c.must_change_password,
    )


def _client_meta(request: Request) -> tuple[str | None, str | None]:
    ip = request.client.host if request.client else None
    return ip, request.headers.get("user-agent")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/login", response_model=SessionOut | ChooseOrgOut)
async def login(body: LoginIn, request: Request):
    ip, ua = _client_meta(request)
    try:
        result = await identity.login(body.email, body.password, body.org_id, ip, ua)
    except identity.AuthError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, e.public_message) from None
    if isinstance(result, list):
        return ChooseOrgOut(
            organisations=[
                OrgChoiceOut(
                    org_id=o.org_id,
                    org_kind=o.org_kind,
                    org_name=o.org_name,
                    reference_code=o.reference_code,
                    role_code=o.role_code,
                )
                for o in result
            ]
        )
    return _session_out(result)


@router.post("/refresh", response_model=SessionOut)
async def refresh(body: RefreshIn, request: Request):
    ip, ua = _client_meta(request)
    try:
        result = await identity.refresh(body.refresh_token, ip, ua)
    except identity.AuthError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, e.public_message) from None
    return _session_out(result)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: LogoutIn, principal: Principal = Depends(get_principal)):
    await identity.logout(principal, body.refresh_token, body.everywhere)


@router.get("/me", response_model=SessionOut, response_model_exclude={"access_token", "refresh_token"})
async def me(principal: Principal = Depends(get_principal)):
    return SessionOut(
        access_token="",
        refresh_token="",
        user_id=principal.user_id,
        full_name=principal.full_name,
        email=principal.email,
        org_id=principal.org_id,
        org_kind=principal.org_kind,
        org_name=principal.org_name,
        role=principal.role,
        scope=principal.scope,
        capabilities=sorted(principal.capabilities),
        must_change_password=principal.must_change_password,
    )


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(body: ChangePasswordIn, principal: Principal = Depends(get_principal)):
    try:
        await identity.change_password(principal, body.current_password, body.new_password)
    except identity.AuthError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.public_message) from None


@router.get("/invitation/{token}")
async def invitation_preview(token: str):
    """What the invitee sees before setting a password: which org, which role,
    whether the link is still valid. Nothing more."""
    row = await identity.invitation_preview(token)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation not found")
    valid = row["accepted_at"] is None and row["revoked_at"] is None
    return {
        "email": row["email"],
        "org_name": row["org_name"],
        "role_code": row["role_code"],
        "expires_at": row["expires_at"],
        "valid": valid,
        "already_accepted": row["accepted_at"] is not None,
    }


@router.post("/invitation/accept", status_code=status.HTTP_204_NO_CONTENT)
async def invitation_accept(body: InvitationAcceptIn):
    try:
        await identity.invitation_accept(body.token, body.password)
    except Exception:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Invitation is invalid, expired or already used"
        ) from None


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
async def password_reset_request(body: ResetRequestIn, request: Request):
    ip, _ = _client_meta(request)
    await identity.request_password_reset(body.email, ip)
    return {"detail": "If that address exists, a reset link is on its way."}


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def password_reset_confirm(body: ResetConfirmIn):
    try:
        await identity.confirm_password_reset(body.token, body.password)
    except Exception:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Reset link is invalid, expired or already used"
        ) from None
