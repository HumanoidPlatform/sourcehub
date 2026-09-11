"""attachments — presign, download and discard.

Attaching is not here. A file becomes an attachment as part of saving the thing
it belongs to — a request, a bid, a task, a QA verdict — so each of those
services calls attachments.attach() inside its own transaction, having already
decided the caller may write that parent. A general-purpose "attach anything to
anything" route would have to re-derive all four of those rules.

The RLS'd select is the whole access check on read: a file is visible to
whoever can see the thing it hangs off.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_principal, get_session
from sourcehub.modules.attachments import service as attachments
from sourcehub.platform.storage import StorageError

router = APIRouter(route_class=TxRoute)


class PresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str | None = None
    size_bytes: int = Field(gt=0, le=25 * 1024 * 1024)


class AttachmentIn(BaseModel):
    """One uploaded object, named on the save that attaches it.

    Shared by every request body that can carry attachments, so the four
    surfaces cannot drift into four subtly different shapes. No size here:
    the recorded size is read back from storage, never taken on trust.
    """

    storage_key: str = Field(min_length=1, max_length=512)
    filename: str = Field(min_length=1, max_length=255)
    content_type: str | None = None
    slot: str = Field(min_length=1, max_length=40)


def _map(e: Exception) -> HTTPException:
    if isinstance(e, LookupError):
        return HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    # Storage being unreachable is not the caller's mistake, and it used to
    # escape as a raw 500 with a stack trace.
    if isinstance(e, StorageError):
        return HTTPException(status.HTTP_502_BAD_GATEWAY, str(e))
    return HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))


@router.post("/attachments/presign")
async def presign(
    body: PresignIn,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """Mint a one-object upload URL under the caller's own org prefix.

    Deliberately gated on being signed in and nothing more: the key is scoped
    to the caller's organisation, and an object nobody ever attaches is an
    orphan in the documents bucket, not an escalation.
    """
    try:
        return await attachments.presign_upload(
            session, principal,
            filename=body.filename, content_type=body.content_type, size_bytes=body.size_bytes,
        )
    except (attachments.AttachmentError, StorageError) as e:
        raise _map(e) from None


@router.get("/attachments/{attachment_id}/url")
async def download(
    attachment_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await attachments.download_url(session, attachment_id)
    except (LookupError, StorageError) as e:
        raise _map(e) from None


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def discard(
    attachment_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    """Remove a file the caller's own organisation attached."""
    try:
        await attachments.discard(session, principal, attachment_id)
    except LookupError as e:
        raise _map(e) from None
