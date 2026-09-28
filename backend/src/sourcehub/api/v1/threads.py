"""threads — the private conversation between a client and one delivery partner."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import (
    Principal,
    TxRoute,
    get_principal,
    get_session,
    require_any_capability,
    require_capability,
)
from sourcehub.modules.threads import service as threads

router = APIRouter(route_class=TxRoute)


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=threads.MAX_BODY)

    @field_validator("body")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Write a message first.")
        return v


class ReadIn(BaseModel):
    """The newest message the reader rendered — the stamp is a message, never
    a clock (see threads.mark_read)."""

    last_seen_message_id: uuid.UUID


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


def _missing() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")


# Reading needs no capability: RLS returns the client every thread on its
# request, a partner its own, Ops all of them, and anyone else nothing — the
# same arrangement GET /requests/{id} relies on.


@router.get("/requests/{request_id}/threads")
async def list_threads(
    request_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return {"items": await threads.list_threads(session, principal, request_id)}
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found") from None


@router.post("/requests/{request_id}/threads", status_code=status.HTTP_201_CREATED)
async def open_thread(
    request_id: uuid.UUID,
    body: MessageIn,
    principal: Principal = Depends(require_capability("proposal.create")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    """A partner's first question. Opens its conversation on the request if
    there is none yet, then posts; a second call simply posts."""
    try:
        return await threads.open_thread(session, principal, request_id, body.body)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found") from None
    except threads.ThreadError as e:
        raise _conflict(e) from None


@router.get("/threads/{thread_id}")
async def get_thread(
    thread_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await threads.get_thread(session, principal, thread_id)
    except LookupError:
        raise _missing() from None


@router.get("/threads/{thread_id}/messages")
async def list_messages(
    thread_id: uuid.UUID,
    before: uuid.UUID | None = None,
    limit: int = Query(50, ge=1, le=100),
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        items, has_more = await threads.list_messages(
            session, principal, thread_id, limit=limit, before=before
        )
    except LookupError:
        raise _missing() from None
    return {"items": items, "has_more": has_more}


# Posting and stamping are for the two parties: proposal.create is the
# partner's, proposal.read the client's. Ops holds neither and is refused at
# the door; the INSERT policies refuse it again by name.


@router.post("/threads/{thread_id}/messages", status_code=status.HTTP_201_CREATED)
async def post_message(
    thread_id: uuid.UUID,
    body: MessageIn,
    principal: Principal = Depends(require_any_capability("proposal.create", "proposal.read")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await threads.post_message(session, principal, thread_id, body.body)
    except LookupError:
        raise _missing() from None
    except threads.ThreadError as e:
        raise _conflict(e) from None


@router.post("/threads/{thread_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    thread_id: uuid.UUID,
    body: ReadIn,
    principal: Principal = Depends(require_any_capability("proposal.create", "proposal.read")),
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await threads.mark_read(session, principal, thread_id, body.last_seen_message_id)
    except LookupError:
        raise _missing() from None
    except threads.ThreadError as e:
        raise _conflict(e) from None
