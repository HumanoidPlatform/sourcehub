"""terms — the Onboarding Terms & Conditions (db/470).

Anyone may read the version in effect, signed in or not: the /terms page and
the invitation page show it before there is an account. Accepting it is the
one thing a signed-in person can do while it is due, so that route stands on
get_principal_pending_terms rather than get_principal. The service opens its
own transaction (as auth.py's do), so there is no TxRoute and no get_session.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from sourcehub.api.deps import Principal, get_principal_pending_terms
from sourcehub.modules.identity import service as identity

router = APIRouter()


class AcceptIn(BaseModel):
    version: str = Field(min_length=1, max_length=20)


@router.get("/public/terms")
async def current_terms() -> dict[str, Any]:
    terms = await identity.current_terms()
    if terms is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No Terms are in effect")
    return terms


@router.post("/terms/accept", status_code=status.HTTP_204_NO_CONTENT)
async def accept(
    body: AcceptIn,
    request: Request,
    principal: Principal = Depends(get_principal_pending_terms),
) -> None:
    """Record the acceptance. The caller then refreshes its session, and the
    new token no longer says the Terms are due."""
    ip = request.client.host if request.client else None
    try:
        await identity.accept_terms(principal, body.version, ip, request.headers.get("user-agent"))
    except identity.TermsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
