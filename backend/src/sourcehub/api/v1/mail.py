"""mail — the platform mail log, for operations.

Every e-mail the platform sends is a mail_outbox row (db/480, db/490) that the
outbox clock sends. These routes read that table through its definer functions:
today's counts, the list with its failures and reasons, and a re-send of a
failed mail. Capabilities mail.read and mail.resend; the database refuses
anyone but the platform role as well.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_session, require_capability
from sourcehub.modules.outbox import service as outbox

router = APIRouter(route_class=TxRoute)


@router.get("/stats")
async def stats(
    principal: Principal = Depends(require_capability("mail.read")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    return await outbox.stats(session)


@router.get("")
async def log(
    status_filter: str = Query("failed", alias="status"),
    limit: int = Query(30, ge=1, le=100),
    before: dt.datetime | None = None,
    principal: Principal = Depends(require_capability("mail.read")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    try:
        return await outbox.log_rows(session, status_filter, limit, before)
    except outbox.OutboxError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.post("/{mail_id}/resend", status_code=status.HTTP_201_CREATED)
async def resend(
    mail_id: uuid.UUID,
    principal: Principal = Depends(require_capability("mail.resend")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    try:
        new_id = await outbox.resend(session, principal, mail_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No such mail") from None
    except outbox.OutboxError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
    return {"id": str(new_id)}
