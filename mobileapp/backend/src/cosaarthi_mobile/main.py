from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from cosaarthi_mobile.config import settings
from cosaarthi_mobile.db.session import SessionLocal
from cosaarthi_mobile.modules.auth.router import router as auth_router
from cosaarthi_mobile.modules.crowd.router import router as crowd_router
from cosaarthi_mobile.modules.storage.service import ensure_bucket


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await ensure_bucket()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Cosaarthi Data Platform Mobile API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(crowd_router, prefix="/api/v1")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/ready")
    async def ready() -> dict[str, str]:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        await ensure_bucket()
        return {"database": "ok", "minio": "ok", "status": "ok"}

    return app


app = create_app()

