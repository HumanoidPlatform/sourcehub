"""offers — a worker answering a task offer from their email.

Runs without an org context, like auth: the worker holds a link, not a
session. The token resolves through the SECURITY DEFINER task_offer_lookup()
and the service opens its own transaction for the write, so this router has
no TxRoute and no get_session.

GET is a preview and changes nothing — mail scanners follow links. Only the
POST answers.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from sourcehub.modules.delivery import service as delivery

router = APIRouter()


class RespondIn(BaseModel):
    action: Literal["accept", "decline"]


@router.get("/{token}")
async def preview(token: str):
    try:
        return await delivery.preview_offer(token)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offer not found") from None


@router.post("/{token}/respond")
async def respond(token: str, body: RespondIn):
    try:
        return await delivery.respond_to_offer(token, body.action)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offer not found") from None
    except delivery.OfferUnavailableError as e:
        raise HTTPException(e.http_status, str(e)) from None
    except delivery.DeliveryError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
