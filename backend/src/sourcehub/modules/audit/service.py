"""audit — the append-only, hash-chained event log.

Business rules, and the ONLY public surface of this module.

Every mutation in the system calls log() in the same transaction as its state
change, mirroring the prototype's rule that "every action writes to the audit
trail". The scope array carries every entity AND organisation the event
touches — scope is also the visibility key, so an event missing its org ids is
an event its participants cannot see.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def log(
    session: AsyncSession,
    event_type: str,
    summary: str,
    scope: list[uuid.UUID] | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    """Append one event. Actor comes from the session's own org context."""
    import json

    await session.execute(
        text(
            "SELECT write_audit_event(:etype, :summary, "
            "CAST(:scope AS uuid[]), CAST(:payload AS jsonb), NULL, NULL)"
        ),
        {
            "etype": event_type,
            "summary": summary,
            "scope": [str(s) for s in (scope or [])],
            "payload": json.dumps(payload or {}, default=str),
        },
    )


async def list_activity(
    session: AsyncSession,
    scope_id: uuid.UUID | None = None,
    limit: int = 40,
) -> list[dict[str, Any]]:
    """The activity feed. RLS trims it to what the caller may see; the optional
    scope_id narrows to one entity's trail (a contract page's audit panel)."""
    if scope_id is not None:
        stmt = text(
            "SELECT id, event_type, summary, scope, actor_org_id, occurred_at "
            "FROM audit_event WHERE :sid = ANY(scope) "
            "ORDER BY occurred_at DESC LIMIT :lim"
        )
        rows = (await session.execute(stmt, {"sid": scope_id, "lim": limit})).mappings().all()
    else:
        stmt = text(
            "SELECT id, event_type, summary, scope, actor_org_id, occurred_at "
            "FROM audit_event ORDER BY occurred_at DESC LIMIT :lim"
        )
        rows = (await session.execute(stmt, {"lim": limit})).mappings().all()
    return [dict(r) for r in rows]
