"""Request dependencies: the authenticated principal, the org session, and can().

This file is the join between a bearer token and a database session with the
tenancy context pinned to it. Every protected route depends on it, and nothing
below the api/ layer is allowed to.

The capability check mirrors the prototype exactly:

    "The UI asks can('rfp.create') rather than checking the role directly, so a
     new role is a row in this table rather than a hunt through the views."

Same rule on the server: require_capability('proposal.accept'), never a role
name. The capability set is resolved by the database via
user_capabilities(user_id, org_id) and carried in the token.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Callable, Coroutine
from typing import Any

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.routing import APIRoute
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims, decode_access_token
from sourcehub.db.session import SessionLocal

bearer = HTTPBearer(auto_error=True)

# The principal IS the decoded access token. One definition, in security.py.
Principal = AccessClaims


def can(principal: Principal, capability: str) -> bool:
    return capability in principal.capabilities


async def get_principal(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> Principal:
    try:
        return decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


class TxRoute(APIRoute):
    """Commits the request's session BEFORE the response goes out.

    FastAPI runs yield-dependency teardown AFTER the response has been sent, so
    a commit left to teardown creates two failure modes we hit in testing: a
    late constraint error surfaces after a 2xx already went out (the client
    believes a write that rolled back), and a fast follow-up request races the
    previous commit and reads stale state. Committing in the route handler —
    after the endpoint returns, before serialisation — closes both. An
    exception path skips the commit; teardown then rolls back.
    """

    def get_route_handler(self):  # noqa: ANN201 — FastAPI signature
        original = super().get_route_handler()

        async def handler(request: Request) -> Response:
            response = await original(request)
            session: AsyncSession | None = getattr(request.state, "db_session", None)
            if session is not None and session.in_transaction():
                await session.commit()
            return response

        return handler


async def get_session(
    request: Request,
    principal: Principal = Depends(get_principal),
) -> AsyncIterator[AsyncSession]:
    """The org-scoped session for this request.

    Sets app.org_id, app.role and app.user_id before any query runs — which is
    what makes an unscoped query impossible to write by accident. Routes depend
    on this, never on SessionLocal, and every router using it must declare
    route_class=TxRoute so the commit lands before the response (see TxRoute).
    """
    session = SessionLocal()
    request.state.db_session = session
    try:
        # autobegin: this first execute opens the transaction the GUCs live in
        await session.execute(
            text(
                "SELECT set_config('app.org_id', :org, true), "
                "       set_config('app.role', :role, true), "
                "       set_config('app.user_id', :user, true)"
            ),
            {
                "org": str(principal.org_id),
                "role": principal.role,
                "user": str(principal.user_id),
            },
        )
        yield session
    finally:
        await session.close()  # rolls back anything TxRoute did not commit


def require_capability(
    capability: str,
) -> Callable[..., Coroutine[Any, Any, Principal]]:
    """Guard a route with a capability, not a role name.

    This decides whether the endpoint may be called at all; RLS decides what it
    can see once it is. The two are different layers on purpose.
    """

    async def _check(principal: Principal = Depends(get_principal)) -> Principal:
        if capability not in principal.capabilities:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires capability: {capability}",
            )
        return principal

    return _check


def require_any_capability(
    *capabilities: str,
) -> Callable[..., Coroutine[Any, Any, Principal]]:
    """Guard a route that two different roles reach by two different names.

    Suspension is the case this exists for. A tenant removing a supplier from
    its own network holds network.manage; Ops suspending an account holds
    org.suspend. One route, one service call, one RLS policy deciding which row
    each of them can actually touch — but require_capability takes a single
    code, so guarding on network.manage alone locked Ops out of the only
    suspension endpoint in the system while org.suspend sat in its token unused.

    Widening the guard does not widen reach: organisation_update still says
    is_platform_admin() OR id = current_org_id(), and the service still checks
    the transition. This decides only whether the call is admissible at all.
    """

    async def _check(principal: Principal = Depends(get_principal)) -> Principal:
        if principal.capabilities.isdisjoint(capabilities):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(sorted(capabilities))}",
            )
        return principal

    return _check


def require_mfa() -> Callable[..., Coroutine[Any, Any, Principal]]:
    """Enforce the second factor where permission.requires_mfa demands one.

    Enforcement is governed by settings.mfa_enforcement (off in development —
    TOTP enrolment is not built yet); the mfa flag in the token already encodes
    that decision, so this check stays honest either way.
    """

    async def _check(principal: Principal = Depends(get_principal)) -> Principal:
        if not principal.mfa_satisfied:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This action requires a second factor",
            )
        return principal

    return _check
