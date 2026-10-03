"""push — the phone registers, and forgets, the token it receives pushes on."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session
from sourcehub.modules.push import service as push

router = APIRouter(route_class=TxRoute)

# Expo's token format. db/300's set_push_token checks the same.
TOKEN = r"^Expo(nent)?PushToken\[.+\]$"


class PushToken(BaseModel):
    token: str = Field(pattern=TOKEN, max_length=256)


@router.put("/me/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def register_push_token(
    body: PushToken,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """Called by the app after sign-in, and again whenever Expo issues the
    phone a new token. Takes the token from anyone else who held it."""
    await push.set_token(session, body.token)


@router.delete("/me/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def forget_push_token(
    body: PushToken,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """Sign-out. Names the token so that signing out of an old phone does not
    silence the one the worker uses now."""
    await push.unset_token(session, body.token)
