"""invoices — raised by the partner, paid by the client, acknowledged by the partner."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.deps import Principal, TxRoute, get_session, require_capability
from sourcehub.modules.invoices import service as invoices

router = APIRouter(route_class=TxRoute)

InvoiceStatus = Literal["issued", "paid", "acknowledged", "withdrawn"]


class InvoiceIn(BaseModel):
    """Per-unit contract: a quantity, priced at the agreed rate. Fixed-price
    contract: an amount. The service refuses the other combination with a
    sentence that says which this contract takes."""

    quantity: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    note: str | None = Field(default=None, max_length=2000)


class PayIn(BaseModel):
    payment_reference: str | None = Field(default=None, max_length=200)


class WithdrawIn(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


def _conflict(e: Exception) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get("/invoices")
async def list_invoices(
    contract_id: uuid.UUID | None = Query(default=None),
    status_filter: InvoiceStatus | None = Query(default=None, alias="status"),
    principal: Principal = Depends(require_capability("invoice.read")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await invoices.list_invoices(session, contract_id=contract_id, status=status_filter)


@router.post("/contracts/{contract_id}/invoices", status_code=status.HTTP_201_CREATED)
async def raise_invoice(
    contract_id: uuid.UUID,
    body: InvoiceIn,
    principal: Principal = Depends(require_capability("invoice.raise")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    """The partner claims payment for work that has passed gate 2."""
    try:
        return await invoices.raise_invoice(
            session, principal, contract_id, body.quantity, body.amount, body.note
        )
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found") from None
    except invoices.InvoiceError as e:
        raise _conflict(e) from None


@router.post("/invoices/{invoice_id}/pay")
async def mark_paid(
    invoice_id: uuid.UUID,
    body: PayIn,
    principal: Principal = Depends(require_capability("invoice.pay")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    """The client records that it has paid — invoice.pay carries requires_mfa,
    honoured whenever enforcement is on."""
    try:
        return await invoices.mark_paid(session, principal, invoice_id, body.payment_reference)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found") from None
    except invoices.InvoiceError as e:
        raise _conflict(e) from None


@router.post("/invoices/{invoice_id}/acknowledge")
async def acknowledge(
    invoice_id: uuid.UUID,
    principal: Principal = Depends(require_capability("invoice.acknowledge")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        return await invoices.acknowledge(session, principal, invoice_id)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found") from None
    except invoices.InvoiceError as e:
        raise _conflict(e) from None


@router.post("/invoices/{invoice_id}/withdraw")
async def withdraw(
    invoice_id: uuid.UUID,
    body: WithdrawIn,
    principal: Principal = Depends(require_capability("invoice.acknowledge")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    """The partner takes back an unpaid invoice. invoice.acknowledge covers it:
    both are the partner closing its own claim, one way or the other."""
    try:
        return await invoices.withdraw(session, principal, invoice_id, body.reason)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found") from None
    except invoices.InvoiceError as e:
        raise _conflict(e) from None
