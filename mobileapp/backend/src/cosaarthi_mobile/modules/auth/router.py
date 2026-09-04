from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.api.deps import CurrentUser, get_current_user
from cosaarthi_mobile.api.schemas import (
    ApiModel,
    AuthSessionOut,
    AuthUserOut,
    LoginIn,
    SignupIn,
    SwitchPersonaIn,
)
from cosaarthi_mobile.db.session import get_session
from cosaarthi_mobile.modules.auth import service

router = APIRouter(prefix="/auth", tags=["auth"])


class RefreshIn(ApiModel):
    refresh_token: str


class LogoutIn(ApiModel):
    refresh_token: str | None = None


@router.post("/signup", response_model=AuthSessionOut, response_model_by_alias=True)
async def signup(body: SignupIn, session: AsyncSession = Depends(get_session)):
    result = await service.signup(session, body)
    await session.commit()
    return result


@router.post("/login", response_model=AuthSessionOut, response_model_by_alias=True)
async def login(body: LoginIn, session: AsyncSession = Depends(get_session)):
    result = await service.login(session, str(body.email), body.password)
    await session.commit()
    return result


@router.post("/persona", response_model=AuthSessionOut, response_model_by_alias=True)
async def switch_persona(
    body: SwitchPersonaIn,
    current: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await service.switch_persona(session, current.user, body.persona)
    await session.commit()
    return result


@router.post("/refresh", response_model=AuthSessionOut, response_model_by_alias=True)
async def refresh(body: RefreshIn, session: AsyncSession = Depends(get_session)):
    result = await service.refresh(session, body.refresh_token)
    await session.commit()
    return result


@router.get("/me", response_model=AuthUserOut, response_model_by_alias=True)
async def me(current: CurrentUser = Depends(get_current_user)):
    return service.user_to_out(current.user, current.principal.persona)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: LogoutIn,
    current: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await service.logout(session, current.user.id, body.refresh_token)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
