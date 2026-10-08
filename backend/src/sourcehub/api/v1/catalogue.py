"""catalogue — datasets for sale: listing, review, quotes, licences, downloads.

RLS decides what each caller sees; capabilities decide which calls they may
make; the triggers in db/350 decide which moves are possible. See
modules/catalogue/service.py.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from pydantic import AwareDatetime, BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import (
    Principal,
    TxRoute,
    get_principal,
    get_session,
    require_any_capability,
    require_capability,
)
from sourcehub.modules.catalogue import service as catalogue

router = APIRouter(route_class=TxRoute)

# db/350 CHECK constraints, transcribed, so a bad value is a 422 naming the
# field rather than a 500 out of Postgres.
PermittedUse = Literal["model_training", "internal_analysis", "research", "audit", "publication"]
Category = Literal["image", "video", "structured_data", "unstructured_data", "people_deliverable"]
LeadStatus = Literal["new", "contacted", "closed"]


class DatasetIn(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    summary: str | None = Field(default=None, max_length=400)
    description: str | None = Field(default=None, max_length=20000)
    category: Category | None = None
    use_cases: list[str] | None = Field(default=None, max_length=20)
    regions: list[str] | None = Field(default=None, max_length=60)
    languages: list[str] | None = Field(default=None, max_length=40)
    permitted_uses: list[PermittedUse] | None = None
    licence_terms: str | None = Field(default=None, max_length=20000)
    indicative_price_text: str | None = Field(default=None, max_length=200)


class FileIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)


class UploadUrlsIn(BaseModel):
    files: list[FileIn] = Field(max_length=catalogue.MAX_UPLOADS_PER_CALL)


class UploadedIn(BaseModel):
    key: str = Field(min_length=1, max_length=1024)
    filename: str | None = Field(default=None, max_length=255)
    content_type: str | None = Field(default=None, max_length=200)
    sha256: str | None = Field(default=None, max_length=64)


class ConfirmIn(BaseModel):
    uploads: list[UploadedIn] = Field(max_length=catalogue.MAX_UPLOADS_PER_CALL)


class SamplesIn(BaseModel):
    item_ids: list[uuid.UUID] = Field(max_length=catalogue.MAX_SAMPLES)


class ReasonIn(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class NoteIn(BaseModel):
    note: str | None = Field(default=None, max_length=2000)


class QuoteRequestIn(BaseModel):
    intended_use: str = Field(min_length=3, max_length=2000)
    requested_uses: list[PermittedUse] = Field(default_factory=list)
    message: str | None = Field(default=None, max_length=4000)


class QuoteIn(BaseModel):
    amount: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    currency: str = Field(pattern=r"^[A-Za-z]{3}$")
    terms: str | None = Field(default=None, max_length=20000)
    uses: list[PermittedUse] = Field(min_length=1)


class PaidIn(BaseModel):
    invoice_number: str | None = Field(default=None, max_length=100)


class LeadStatusIn(BaseModel):
    status: LeadStatus


class ConsentIn(BaseModel):
    document: Literal["worker_privacy_notice"]
    version: int = Field(ge=1)
    accepted_at: AwareDatetime | None = None
    app_version: str | None = Field(default=None, max_length=50)
    platform: str | None = Field(default=None, max_length=20)


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


def _not_found(what: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, f"{what} not found")


# ---------------------------------------------------------------------------
# Browsing
# ---------------------------------------------------------------------------


@router.get("/catalogue/datasets")
async def list_published(
    q: str | None = Query(default=None, max_length=200),
    category: Category | None = Query(default=None),
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.list_published(session, principal, q=q, category=category)


@router.get("/catalogue/datasets/by-slug/{slug}")
async def dataset_by_slug(
    slug: str,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.dataset_by_slug(session, principal, slug)
    except LookupError:
        raise _not_found("Dataset") from None


@router.get("/catalogue/datasets/{dataset_id}")
async def dataset_detail(
    dataset_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.dataset_detail(session, principal, dataset_id)
    except LookupError:
        raise _not_found("Dataset") from None


@router.get("/catalogue/items/{item_id}/url")
async def item_url(
    item_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.item_url(session, principal, item_id)
    except LookupError:
        raise _not_found("File") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


# ---------------------------------------------------------------------------
# Listing — the owner
# ---------------------------------------------------------------------------


@router.get("/catalogue/mine")
async def my_datasets(
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.my_datasets(session, principal)


@router.post("/catalogue/datasets", status_code=status.HTTP_201_CREATED)
async def create_dataset(
    body: DatasetIn,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.create_dataset(session, principal, body.model_dump())
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.patch("/catalogue/datasets/{dataset_id}")
async def update_dataset(
    dataset_id: uuid.UUID,
    body: DatasetIn,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.update_dataset(
            session, principal, dataset_id, body.model_dump(exclude_unset=True)
        )
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/datasets/{dataset_id}/upload-urls")
async def upload_urls(
    dataset_id: uuid.UUID,
    body: UploadUrlsIn,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    try:
        return await catalogue.upload_urls(
            session, principal, dataset_id, [f.model_dump() for f in body.files]
        )
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/datasets/{dataset_id}/items")
async def confirm_uploads(
    dataset_id: uuid.UUID,
    body: ConfirmIn,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.confirm_uploads(
            session, principal, dataset_id, [u.model_dump() for u in body.uploads]
        )
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.delete("/catalogue/datasets/{dataset_id}/items/{item_id}")
async def remove_item(
    dataset_id: uuid.UUID,
    item_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.remove_item(session, principal, dataset_id, item_id)
    except LookupError:
        raise _not_found("File") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.put("/catalogue/datasets/{dataset_id}/samples")
async def set_samples(
    dataset_id: uuid.UUID,
    body: SamplesIn,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.set_samples(session, principal, dataset_id, body.item_ids)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/datasets/{dataset_id}/retry-copies")
async def retry_copies(
    dataset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.retry_copies(session, principal, dataset_id)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/datasets/{dataset_id}/submit")
async def submit(
    dataset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.submit(session, principal, dataset_id)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/datasets/{dataset_id}/pull-back")
async def pull_back(
    dataset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.pull_back(session, principal, dataset_id)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/datasets/{dataset_id}/withdraw")
async def withdraw_dataset(
    dataset_id: uuid.UUID,
    body: ReasonIn,
    principal: Principal = Depends(require_any_capability("catalogue.list", "catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.withdraw_dataset(session, principal, dataset_id, body.reason)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/items/{item_id}/withdraw")
async def withdraw_item(
    item_id: uuid.UUID,
    body: ReasonIn,
    principal: Principal = Depends(require_any_capability("catalogue.list", "catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.withdraw_item(session, principal, item_id, body.reason)
    except LookupError:
        raise _not_found("File") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


# ---------------------------------------------------------------------------
# Review — operations
# ---------------------------------------------------------------------------


@router.get("/catalogue/review")
async def review_queue(
    principal: Principal = Depends(require_capability("catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.review_queue(session, principal)


@router.post("/catalogue/datasets/{dataset_id}/approve")
async def approve(
    dataset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.approve(session, principal, dataset_id)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/datasets/{dataset_id}/reject")
async def reject(
    dataset_id: uuid.UUID,
    body: ReasonIn,
    principal: Principal = Depends(require_capability("catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.reject(session, principal, dataset_id, body.reason)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.get("/catalogue/leads")
async def list_leads(
    principal: Principal = Depends(require_capability("catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.list_leads(session)


@router.patch("/catalogue/leads/{lead_id}")
async def set_lead_status(
    lead_id: uuid.UUID,
    body: LeadStatusIn,
    principal: Principal = Depends(require_capability("catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.set_lead_status(session, principal, lead_id, body.status)
    except LookupError:
        raise _not_found("Lead") from None


# ---------------------------------------------------------------------------
# Deals
# ---------------------------------------------------------------------------


@router.get("/catalogue/deals")
async def list_deals(
    principal: Principal = Depends(
        require_any_capability("catalogue.buy", "catalogue.quote", "catalogue.review")
    ),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.list_deals(session, principal)


@router.get("/catalogue/deals/{deal_id}")
async def get_deal(
    deal_id: uuid.UUID,
    principal: Principal = Depends(
        require_any_capability("catalogue.buy", "catalogue.quote", "catalogue.review")
    ),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.get_deal(session, principal, deal_id)
    except LookupError:
        raise _not_found("Quote") from None


@router.post("/catalogue/datasets/{dataset_id}/deals", status_code=status.HTTP_201_CREATED)
async def request_quote(
    dataset_id: uuid.UUID,
    body: QuoteRequestIn,
    principal: Principal = Depends(require_capability("catalogue.buy")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.request_quote(
            session,
            principal,
            dataset_id,
            intended_use=body.intended_use,
            requested_uses=list(body.requested_uses),
            message=body.message,
        )
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/deals/{deal_id}/quote")
async def quote(
    deal_id: uuid.UUID,
    body: QuoteIn,
    principal: Principal = Depends(require_capability("catalogue.quote")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.quote(
            session,
            principal,
            deal_id,
            amount=body.amount,
            currency=body.currency,
            terms=body.terms,
            uses=list(body.uses),
        )
    except LookupError:
        raise _not_found("Quote") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/deals/{deal_id}/decline")
async def decline(
    deal_id: uuid.UUID,
    body: NoteIn,
    principal: Principal = Depends(require_capability("catalogue.quote")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.decline(session, principal, deal_id, body.note)
    except LookupError:
        raise _not_found("Quote") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/deals/{deal_id}/withdraw")
async def withdraw_request(
    deal_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.buy")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.withdraw_request(session, principal, deal_id)
    except LookupError:
        raise _not_found("Quote") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/deals/{deal_id}/accept")
async def accept(
    deal_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.buy")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.accept(session, principal, deal_id)
    except LookupError:
        raise _not_found("Quote") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


# ---------------------------------------------------------------------------
# Licences
# ---------------------------------------------------------------------------


@router.get("/catalogue/licences")
async def list_licences(
    principal: Principal = Depends(
        require_any_capability("catalogue.buy", "catalogue.quote", "catalogue.review")
    ),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.list_licences(session, principal)


@router.get("/catalogue/licences/{licence_id}")
async def get_licence(
    licence_id: uuid.UUID,
    principal: Principal = Depends(
        require_any_capability("catalogue.buy", "catalogue.quote", "catalogue.review")
    ),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.get_licence(session, principal, licence_id)
    except LookupError:
        raise _not_found("Licence") from None


@router.get("/catalogue/licences/{licence_id}/manifest", response_class=PlainTextResponse)
async def manifest(
    licence_id: uuid.UUID,
    principal: Principal = Depends(
        require_any_capability("catalogue.buy", "catalogue.quote", "catalogue.review")
    ),
    session: AsyncSession = Depends(get_session),
) -> PlainTextResponse:
    try:
        body = await catalogue.manifest_csv(session, principal, licence_id)
    except LookupError:
        raise _not_found("Licence") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None
    return PlainTextResponse(
        body,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="licence-{licence_id}.csv"'},
    )


@router.post("/catalogue/licences/{licence_id}/paid")
async def mark_paid(
    licence_id: uuid.UUID,
    body: PaidIn,
    principal: Principal = Depends(require_capability("catalogue.quote")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.mark_paid(session, principal, licence_id, body.invoice_number)
    except LookupError:
        raise _not_found("Licence") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.post("/catalogue/licences/{licence_id}/revoke")
async def revoke(
    licence_id: uuid.UUID,
    body: ReasonIn,
    principal: Principal = Depends(require_any_capability("catalogue.quote", "catalogue.review")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.revoke(session, principal, licence_id, body.reason)
    except LookupError:
        raise _not_found("Licence") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


# ---------------------------------------------------------------------------
# Notices the signed-in person accepted (the phone keeps its own copy too)
# ---------------------------------------------------------------------------


@router.get("/me/consents")
async def my_consents(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    return await catalogue.my_consents(session, principal)


@router.post("/me/consents")
async def record_consent(
    body: ConsentIn,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.record_consent(
            session,
            principal,
            document=body.document,
            version=body.version,
            accepted_at=body.accepted_at,
            app_version=body.app_version,
            platform=body.platform,
        )
    except catalogue.CatalogueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None
