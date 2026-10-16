"""catalogue — datasets for sale: listing, samples, review, quotes and the deal chat.

RLS decides what each caller sees; capabilities decide which calls they may
make; the triggers in db/390 and db/420 decide which moves are possible. The
files of a dataset change hands outside the platform. See
modules/catalogue/service.py.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import (
    Principal,
    TxRoute,
    get_session,
    require_any_capability,
    require_capability,
)
from sourcehub.modules.catalogue import service as catalogue

router = APIRouter(route_class=TxRoute)

# db/390 CHECK constraints, transcribed, so a bad value is a 422 naming the
# field rather than a 500 out of Postgres.
PermittedUse = Literal["model_training", "internal_analysis", "research", "audit", "publication"]
Category = Literal["image", "video", "structured_data", "unstructured_data", "people_deliverable"]


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
    # what the listing says it holds; a contract listing's is counted, not typed
    file_count: int | None = Field(default=None, ge=0, le=100_000_000)
    total_bytes: int | None = Field(default=None, ge=0)


class FileIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)


class UploadUrlsIn(BaseModel):
    files: list[FileIn] = Field(max_length=catalogue.MAX_UPLOADS_PER_CALL)


class UploadedIn(BaseModel):
    key: str = Field(min_length=1, max_length=1024)
    filename: str | None = Field(default=None, max_length=255)
    content_type: str | None = Field(default=None, max_length=200)


class ConfirmIn(BaseModel):
    uploads: list[UploadedIn] = Field(max_length=catalogue.MAX_UPLOADS_PER_CALL)


class PickIn(BaseModel):
    asset_ids: list[uuid.UUID] = Field(max_length=catalogue.MAX_SAMPLES)


class ReasonIn(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class NoteIn(BaseModel):
    note: str | None = Field(default=None, max_length=2000)


class QuoteRequestIn(BaseModel):
    intended_use: str = Field(min_length=3, max_length=2000)
    requested_uses: list[PermittedUse] = Field(default_factory=list)
    # how many files the buyer wants; none means the whole dataset
    requested_quantity: int | None = Field(default=None, gt=0)
    message: str | None = Field(default=None, max_length=4000)


class QuoteIn(BaseModel):
    # above zero: the accepted quote becomes an invoice (db/450)
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    currency: str = Field(pattern=r"^[A-Za-z]{3}$")
    # how many files the quote covers, as agreed in the chat; none = all
    quantity: int | None = Field(default=None, gt=0)
    terms: str | None = Field(default=None, max_length=20000)
    uses: list[PermittedUse] = Field(min_length=1)


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=catalogue.MAX_MESSAGE)


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


def _not_found(what: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, f"{what} not found")


# ---------------------------------------------------------------------------
# Browsing
# ---------------------------------------------------------------------------

# Anyone with a part in the catalogue browses it; an aggregator has none
# (0048), so it is refused here as everywhere else in the catalogue.
_BROWSERS = ("catalogue.buy", "catalogue.list", "catalogue.quote", "catalogue.review")


@router.get("/catalogue/datasets")
async def list_published(
    q: str | None = Query(default=None, max_length=200),
    category: Category | None = Query(default=None),
    principal: Principal = Depends(require_any_capability(*_BROWSERS)),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.list_published(session, principal, q=q, category=category)


@router.get("/catalogue/datasets/by-slug/{slug}")
async def dataset_by_slug(
    slug: str,
    principal: Principal = Depends(require_any_capability(*_BROWSERS)),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.dataset_by_slug(session, principal, slug)
    except LookupError:
        raise _not_found("Dataset") from None


@router.get("/catalogue/datasets/{dataset_id}")
async def dataset_detail(
    dataset_id: uuid.UUID,
    principal: Principal = Depends(require_any_capability(*_BROWSERS)),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.dataset_detail(session, principal, dataset_id)
    except LookupError:
        raise _not_found("Dataset") from None


@router.get("/catalogue/samples/{sample_id}/url")
async def sample_url(
    sample_id: uuid.UUID,
    principal: Principal = Depends(require_any_capability(*_BROWSERS)),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.sample_url(session, principal, sample_id)
    except LookupError:
        raise _not_found("Sample") from None
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


@router.post("/catalogue/contracts/{contract_id}/list")
async def list_contract(
    contract_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    """The partner lists the captures of an approved, non-exclusive contract."""
    try:
        return {"dataset_id": await catalogue.relist_contract(session, principal, contract_id)}
    except LookupError:
        raise _not_found("Contract") from None
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


@router.post("/catalogue/datasets/{dataset_id}/samples")
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


@router.delete("/catalogue/datasets/{dataset_id}/samples/{sample_id}")
async def remove_sample(
    dataset_id: uuid.UUID,
    sample_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.remove_sample(session, principal, dataset_id, sample_id)
    except LookupError:
        raise _not_found("Sample") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.get("/catalogue/datasets/{dataset_id}/captures")
async def contract_captures(
    dataset_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    try:
        return await catalogue.contract_captures(session, principal, dataset_id)
    except LookupError:
        raise _not_found("Dataset") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.put("/catalogue/datasets/{dataset_id}/picked-samples")
async def pick_samples(
    dataset_id: uuid.UUID,
    body: PickIn,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.pick_samples(session, principal, dataset_id, body.asset_ids)
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


class SubmitIn(BaseModel):
    # the seller's declaration: rights and consents held, description accurate,
    # no restricted category without approval (Terms §4.4, §8.2)
    attest: bool = False


@router.post("/catalogue/datasets/{dataset_id}/submit")
async def submit(
    dataset_id: uuid.UUID,
    body: SubmitIn | None = None,
    principal: Principal = Depends(require_capability("catalogue.list")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.submit(session, principal, dataset_id, bool(body and body.attest))
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


# ---------------------------------------------------------------------------
# Deals and their chat
# ---------------------------------------------------------------------------

_DEAL_READERS = ("catalogue.buy", "catalogue.quote", "catalogue.review")


@router.get("/catalogue/deals")
async def list_deals(
    principal: Principal = Depends(require_any_capability(*_DEAL_READERS)),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await catalogue.list_deals(session, principal)


@router.get("/catalogue/deals/{deal_id}")
async def get_deal(
    deal_id: uuid.UUID,
    principal: Principal = Depends(require_any_capability(*_DEAL_READERS)),
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
            requested_quantity=body.requested_quantity,
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
            quantity=body.quantity,
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


@router.post("/catalogue/deals/{deal_id}/delivered")
async def mark_delivered(
    deal_id: uuid.UUID,
    principal: Principal = Depends(require_capability("catalogue.quote")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.mark_delivered(session, principal, deal_id)
    except LookupError:
        raise _not_found("Quote") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None


@router.get("/catalogue/deals/{deal_id}/messages")
async def list_messages(
    deal_id: uuid.UUID,
    principal: Principal = Depends(require_any_capability(*_DEAL_READERS)),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    try:
        return await catalogue.list_messages(session, principal, deal_id)
    except LookupError:
        raise _not_found("Quote") from None


@router.post("/catalogue/deals/{deal_id}/messages", status_code=status.HTTP_201_CREATED)
async def post_message(
    deal_id: uuid.UUID,
    body: MessageIn,
    principal: Principal = Depends(require_any_capability("catalogue.buy", "catalogue.quote")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await catalogue.post_message(session, principal, deal_id, body.body)
    except LookupError:
        raise _not_found("Quote") from None
    except catalogue.CatalogueError as e:
        raise _conflict(e) from None
