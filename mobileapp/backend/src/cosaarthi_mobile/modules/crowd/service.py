from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from cosaarthi_mobile.api.schemas import HomeSummaryOut
from cosaarthi_mobile.db.models import User
from cosaarthi_mobile.modules.tasks.service import get_available_tasks, get_my_tasks


async def home_summary(session: AsyncSession, user: User) -> HomeSummaryOut:
    available = await get_available_tasks(session, user)
    mine = await get_my_tasks(session, user)
    return HomeSummaryOut(
        active_count=len(mine),
        available_count=len(available),
        edge_pipeline=[
            {
                "detail": "Direct-to-MinIO upload is configured by the mobile backend.",
                "id": "upload-sync",
                "label": "Upload sync",
                "status": "ready",
            },
            {
                "detail": "PostgreSQL records upload, submission and QA metadata.",
                "id": "server-qc",
                "label": "Server QA",
                "status": "idle",
            },
        ],
        next_action="Open a MinIO photo verification task and complete the required uploads.",
        queued_uploads=0,
        readiness=[
            {
                "detail": "This mobile session has a valid access token.",
                "id": "device_attestation",
                "label": "Device attestation",
                "mandatory": True,
                "status": "pass",
            },
            {
                "detail": "SQLite queue is available for retryable uploads.",
                "id": "storage",
                "label": "Upload queue",
                "mandatory": True,
                "status": "pass",
            },
        ],
        today_earnings=0,
        today_stats={"clipsCompleted": 0, "earnings": 0, "labelsCompleted": 0, "unitsCompleted": 0},
    )
