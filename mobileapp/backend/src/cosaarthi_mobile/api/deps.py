from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from cosaarthi_mobile.api.security import AccessPrincipal, decode_access_token
from cosaarthi_mobile.db.models import Role, User
from cosaarthi_mobile.db.session import get_session

bearer = HTTPBearer(auto_error=True)


@dataclass(slots=True)
class CurrentUser:
    principal: AccessPrincipal
    user: User


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> CurrentUser:
    try:
        principal = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = await session.scalar(
        select(User)
        .options(
            selectinload(User.organization),
            selectinload(User.roles).selectinload(Role.permissions),
        )
        .where(User.id == principal.user_id)
    )
    if user is None or user.status != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User is not active")
    return CurrentUser(principal=principal, user=user)


def require_permission(permission: str):
    async def _check(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if permission not in current.principal.permissions:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires permission: {permission}")
        return current

    return _check
