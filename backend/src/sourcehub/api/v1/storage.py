"""storage — the client's delivery destinations.

Every route here is the client's own: RLS scopes storage_target to its owning
organisation, so a partner asking for one by id gets a 404 rather than a 403 —
existence is exactly what the policy hides.

Nothing in this module returns the credential. The service leaves it out of the
SELECT, so there is no response shape it could leak through.
"""

from __future__ import annotations

import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_session, require_capability
from sourcehub.modules.storage import service as storage

router = APIRouter(route_class=TxRoute)


class TargetIn(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    # The client's own storage, their choice. 'gcs' is in the enum and is not
    # supported — see storage_target_provider_supported in db/035_storage.sql.
    provider: Literal["s3", "azure_blob"]
    bucket: str = Field(min_length=1, max_length=255)
    # Shape depends on the provider; the service validates the keys it needs.
    #   s3          access_key_id, secret_access_key
    #   azure_blob  account_name, account_key
    secret: dict[str, Any]
    endpoint: str | None = Field(default=None, max_length=255)
    # S3 only, and not optional in practice for a bucket outside us-east-1:
    # without it SigV4 signs for the wrong region and the service refuses.
    region: str | None = Field(default=None, max_length=64)
    key_prefix: str | None = Field(default=None, max_length=200)


class TargetPatchIn(BaseModel):
    """Rename, or rotate the credential. Location is fixed once work exists."""

    label: str | None = Field(default=None, min_length=1, max_length=120)
    secret: dict[str, Any] | None = None


def _map(e: Exception) -> HTTPException:
    if isinstance(e, LookupError):
        return HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))


@router.get("/storage-targets")
async def list_targets(
    principal: Principal = Depends(require_capability("storage.manage")),
    session: AsyncSession = Depends(get_session),
):
    return await storage.list_targets(session, principal)


@router.post("/storage-targets", status_code=status.HTTP_201_CREATED)
async def create_target(
    body: TargetIn,
    principal: Principal = Depends(require_capability("storage.manage")),
    session: AsyncSession = Depends(get_session),
):
    """Probe the destination, then save it. A destination that cannot be
    written to is refused here rather than discovered by a worker in the
    field."""
    try:
        return await storage.create_target(
            session, principal,
            label=body.label, provider=body.provider, bucket=body.bucket,
            secret=body.secret, endpoint=body.endpoint, region=body.region,
            key_prefix=body.key_prefix,
        )
    except (LookupError, storage.StorageTargetError) as e:
        raise _map(e) from None


@router.get("/storage-targets/{target_id}")
async def get_target(
    target_id: uuid.UUID,
    principal: Principal = Depends(require_capability("storage.manage")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await storage.get_target(session, target_id)
    except LookupError as e:
        raise _map(e) from None


@router.patch("/storage-targets/{target_id}")
async def update_target(
    target_id: uuid.UUID,
    body: TargetPatchIn,
    principal: Principal = Depends(require_capability("storage.manage")),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await storage.update_target(
            session, principal, target_id, label=body.label, secret=body.secret
        )
    except (LookupError, storage.StorageTargetError) as e:
        raise _map(e) from None


@router.post("/storage-targets/{target_id}/verify")
async def verify_target(
    target_id: uuid.UUID,
    principal: Principal = Depends(require_capability("storage.manage")),
    session: AsyncSession = Depends(get_session),
):
    """Write, read back and clean up a probe object."""
    try:
        return await storage.verify_target(session, principal, target_id)
    except (LookupError, storage.StorageTargetError) as e:
        raise _map(e) from None
