"""qa — the partner's review queue and gate decisions."""

from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_session, require_capability
from sourcehub.modules.qa import service as qa

router = APIRouter(route_class=TxRoute)


class DecideIn(BaseModel):
    outcome: Literal["pass", "fail"]
    note: str | None = None
    sample_size: int | None = None
    sample_failed: int | None = None


@router.get("/queue")
async def review_queue(
    principal: Principal = Depends(require_capability("qa.review")),
    session: AsyncSession = Depends(get_session),
):
    return await qa.review_queue(session, principal)


@router.get("/gate1")
async def gate1_queue(
    principal: Principal = Depends(require_capability("qa.review.gate1")),
    session: AsyncSession = Depends(get_session),
):
    """The supplier's own queue: worker batches awaiting its verdict."""
    return await qa.gate1_queue(session, principal)


@router.post("/submissions/{submission_id}/decide")
async def decide(
    submission_id: uuid.UUID,
    body: DecideIn,
    principal: Principal = Depends(require_capability("qa.review")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await qa.decide(
            session, principal, submission_id, body.outcome, body.note,
            body.sample_size, body.sample_failed,
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Submission not found") from None
    except qa.QaError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
