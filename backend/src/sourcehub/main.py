"""FastAPI application factory and router registration.

The entry layer and nothing else: no business rules live in this file or in
anything under api/. Routers call a module's service.py, which is that module's
only public surface.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sourcehub.config import BRAND_FULL, settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{BRAND_FULL} API",
        version="0.1.0",
        description=(
            "A marketplace connecting clients who need real-world data with "
            "delivery partners who fulfil it through their own networks."
        ),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Object storage being unreachable is an upstream failure, not a bad
    # request — and it can surface from any route that presigns, attaches or
    # confirms a file. Handled once here rather than in each of them, because
    # the route that gets forgotten is the one that returns a stack trace.
    from fastapi import Request
    from fastapi.responses import JSONResponse

    from sourcehub.platform.storage import StorageError

    async def _storage_unavailable(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=502, content={"detail": str(exc)})

    app.add_exception_handler(StorageError, _storage_unavailable)

    from sourcehub.api.v1 import (
        attachments, audit, auth, delivery, identity, ledger, marketplace, media, network, notify,
        onboarding, qa, storage,
    )

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(identity.router, prefix="/api/v1", tags=["identity"])
    app.include_router(onboarding.router, prefix="/api/v1/onboarding", tags=["onboarding"])
    app.include_router(notify.router, prefix="/api/v1/notifications", tags=["notify"])
    app.include_router(audit.router, prefix="/api/v1/activity", tags=["audit"])
    app.include_router(marketplace.router, prefix="/api/v1", tags=["marketplace"])
    app.include_router(delivery.router, prefix="/api/v1", tags=["delivery"])
    app.include_router(media.router, prefix="/api/v1", tags=["media"])
    app.include_router(qa.router, prefix="/api/v1/qa", tags=["qa"])
    app.include_router(network.router, prefix="/api/v1/network", tags=["network"])
    app.include_router(ledger.router, prefix="/api/v1", tags=["ledger"])
    app.include_router(storage.router, prefix="/api/v1", tags=["storage"])
    app.include_router(attachments.router, prefix="/api/v1", tags=["attachments"])

    @app.get("/health", tags=["ops"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
