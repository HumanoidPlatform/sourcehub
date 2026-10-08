"""catalogue_public — the dataset catalogue as anyone sees it, signed in or not.

Runs without an org context, like offers.py: the reads go through the
SECURITY DEFINER datahub_public_* functions, which answer for published
listings and their sample files only, and the one write — a quote request
from someone without an account — through datahub_lead_create(). So this
router has no TxRoute and no get_session; the service opens its own
transaction.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

from sourcehub.modules.catalogue import service as catalogue
from sourcehub.platform.ratelimit import RateLimiter

router = APIRouter()

# Five quote requests per address per hour, per API worker.
_leads = RateLimiter(limit=5, window_seconds=3600)

# Addresses that say nothing about a buyer's organisation. A dataset licence is
# a business purchase; Ops would have to ask again before replying to one.
_FREE_MAIL = frozenset(
    {
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "live.com",
        "icloud.com",
        "aol.com",
        "proton.me",
        "protonmail.com",
        "gmx.com",
        "mail.com",
        "yandex.com",
        "rediffmail.com",
    }
)


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    company: str = Field(min_length=1, max_length=200)
    intended_use: str = Field(min_length=3, max_length=2000)
    message: str | None = Field(default=None, max_length=4000)


@router.get("")
async def list_public() -> list[dict[str, Any]]:
    return await catalogue.public_list()


@router.get("/{slug}")
async def dataset_public(slug: str) -> dict[str, Any]:
    try:
        return await catalogue.public_dataset(slug)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dataset not found") from None


@router.post("/{slug}/leads", status_code=status.HTTP_201_CREATED)
async def create_lead(slug: str, body: LeadIn, request: Request) -> dict[str, str]:
    ip = request.client.host if request.client else "unknown"
    if not _leads.allow(ip):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many requests from here. Try again in an hour.",
        )
    domain = str(body.email).rsplit("@", 1)[-1].lower()
    if domain in _FREE_MAIL:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Use your work email address.")
    try:
        await catalogue.create_lead(
            slug,
            name=body.name,
            email=str(body.email),
            company=body.company,
            intended_use=body.intended_use,
            message=body.message,
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dataset not found") from None
    except catalogue.CatalogueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None
    return {"status": "received"}
