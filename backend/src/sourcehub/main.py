"""FastAPI application factory and router registration.

The entry layer and nothing else: no business rules live in this file or in
anything under api/. Routers call a module's service.py, which is that module's
only public surface.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sourcehub.config import PRODUCT, settings


def _configure_logging() -> None:
    """Honour LOG_LEVEL for our own loggers.

    uvicorn configures only its own ('uvicorn', 'uvicorn.error',
    'uvicorn.access') and leaves the root logger untouched, so without this
    every logging call under sourcehub.* is discarded. That is not cosmetic:
    outbound mail is best-effort by design — a dead SMTP must not roll back the
    approval that created an organisation — which makes a log line the only
    evidence that an invitation was never delivered. Silent by default is the
    one thing that must not be true of it.
    """
    root = logging.getLogger("sourcehub")
    if root.handlers:  # reload under --reload calls create_app again
        return
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(levelname)s [%(name)s] %(message)s"))
    root.addHandler(handler)
    root.setLevel(settings.log_level.upper())
    root.propagate = False


@contextlib.asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    """The engagement clock (modules/engage) runs as a task in this process.
    Every uvicorn worker starts one; the advisory lock inside the pass lets
    only one of them do the work on any tick."""
    from sourcehub.modules.engage import service as engage

    clock = asyncio.create_task(engage.run_forever()) if settings.engagement_enabled else None
    try:
        yield
    finally:
        if clock is not None:
            clock.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await clock


def create_app() -> FastAPI:
    _configure_logging()
    app = FastAPI(
        title=f"{PRODUCT} API",
        version="0.1.0",
        description=(
            "A marketplace connecting clients who need real-world data with "
            "delivery partners who fulfil it through their own networks."
        ),
        lifespan=_lifespan,
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
        offers, onboarding, overview, qa, storage,
    )

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(identity.router, prefix="/api/v1", tags=["identity"])
    app.include_router(onboarding.router, prefix="/api/v1/onboarding", tags=["onboarding"])
    app.include_router(notify.router, prefix="/api/v1/notifications", tags=["notify"])
    app.include_router(audit.router, prefix="/api/v1/activity", tags=["audit"])
    app.include_router(overview.router, prefix="/api/v1", tags=["overview"])
    app.include_router(marketplace.router, prefix="/api/v1", tags=["marketplace"])
    app.include_router(delivery.router, prefix="/api/v1", tags=["delivery"])
    app.include_router(media.router, prefix="/api/v1", tags=["media"])
    app.include_router(qa.router, prefix="/api/v1/qa", tags=["qa"])
    app.include_router(network.router, prefix="/api/v1/network", tags=["network"])
    app.include_router(ledger.router, prefix="/api/v1", tags=["ledger"])
    app.include_router(storage.router, prefix="/api/v1", tags=["storage"])
    app.include_router(attachments.router, prefix="/api/v1", tags=["attachments"])
    app.include_router(offers.router, prefix="/api/v1/offers", tags=["offers"])

    @app.get("/health", tags=["ops"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
