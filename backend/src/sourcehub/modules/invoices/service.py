"""invoices — a partner's claim for payment on a contract.

Business rules, and the ONLY public surface of this module.

The platform moves no money (db/320). It records that the partner raised an
invoice once some of its work had passed gate 2, that the client marked it
paid, and that the partner acknowledged the payment — or withdrew an unpaid
invoice. Three things the database does so this module cannot get them wrong:

  * the insert trigger copies the parties, the currency and the rate from the
    contract and prices a per-unit claim, so a caller cannot forge any of them;
  * the transition trigger allows exactly three moves, each by one party, and
    stamps them itself;
  * the application login may UPDATE status, payment_reference and
    withdrawn_reason only.

So every move here is one conditional UPDATE gated on the state it leaves —
never read-then-write — and a refusal from the trigger (a race, or a caller
the pre-checks did not catch) arrives as a DBAPIError and leaves as a 409.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.audit import service as audit
from sourcehub.modules.marketplace import pricing
from sourcehub.modules.notify import service as notifier


class InvoiceError(Exception):
    pass


_INVOICEABLE = ("active", "delivered", "completed")

_SELECT = """
    SELECT i.*, c.reference_code AS contract_ref, c.request_id,
           r.title AS request_title,
           cl.name AS client_name, pt.name AS partner_name
    FROM   invoice i
    JOIN   contract c ON c.id = i.contract_id
    LEFT   JOIN request r ON r.id = c.request_id
    LEFT   JOIN organisation cl ON cl.id = i.client_org_id
    LEFT   JOIN organisation pt ON pt.id = i.partner_org_id
"""


def _money(value: Any) -> str | None:
    return None if value is None else f"{Decimal(str(value)):.2f}"


def _row(m: Any) -> dict[str, Any]:
    """The invoice as the API returns it. Money travels as strings (see
    pricing.view)."""
    return {
        "id": m["id"],
        "reference_code": m["reference_code"],
        "contract_id": m["contract_id"],
        "contract_ref": m.get("contract_ref"),
        "request_id": m.get("request_id"),
        "request_title": m.get("request_title"),
        "client_org_id": m["client_org_id"],
        "client_name": m.get("client_name"),
        "partner_org_id": m["partner_org_id"],
        "partner_name": m.get("partner_name"),
        "currency": m["currency"],
        "quantity": _money(m["quantity"]),
        "unit": m["unit"],
        "block": m["block"],
        "rate": _money(m["rate"]),
        "amount": _money(m["amount"]),
        "line_text": (
            f"{pricing.quantity_text(m['quantity'], m['unit'])} at "
            f"{pricing.price_text('per_unit', m['rate'], m['currency'], m['unit'], m['block'])}"
            if m["quantity"] is not None else None
        ),
        "accepted_assets_at_issue": m["accepted_assets_at_issue"],
        "note": m["note"],
        "status": m["status"],
        "issued_at": m["issued_at"],
        "issued_by": m["issued_by"],
        "paid_at": m["paid_at"],
        "paid_by": m["paid_by"],
        "payment_reference": m["payment_reference"],
        "acknowledged_at": m["acknowledged_at"],
        "acknowledged_by": m["acknowledged_by"],
        "withdrawn_at": m["withdrawn_at"],
        "withdrawn_by": m["withdrawn_by"],
        "withdrawn_reason": m["withdrawn_reason"],
    }


async def _fetch(session: AsyncSession, invoice_id: uuid.UUID) -> Any:
    m = (
        await session.execute(text(_SELECT + " WHERE i.id = :id"), {"id": invoice_id})
    ).mappings().one_or_none()
    if m is None:
        raise LookupError("invoice not found")
    return m


async def _contract(session: AsyncSession, contract_id: uuid.UUID) -> Any:
    m = (
        await session.execute(
            text(
                "SELECT c.id, c.reference_code, c.request_id, c.status, c.client_org_id, "
                "       c.partner_org_id, c.value, c.currency, c.pricing_basis, "
                "       c.pricing_unit, c.pricing_block, c.pricing_quantity "
                "FROM contract c WHERE c.id = :id AND c.deleted_at IS NULL"
            ),
            {"id": contract_id},
        )
    ).mappings().one_or_none()
    if m is None:
        raise LookupError("contract not found")
    return m


async def accepted_assets(session: AsyncSession, contract_id: uuid.UUID) -> tuple[int, int]:
    """(captures accepted at gate 2, submissions that passed) on a contract.

    The same rule progress_of uses: the asset_count of every submission with
    status = 'accepted'. A qa_passed task cannot be reopened and 'superseded'
    is never written, so this only ever grows.
    """
    m = (
        await session.execute(
            text(
                "SELECT coalesce(sum(s.asset_count), 0) AS assets, count(*) AS passed "
                "FROM submission s JOIN task t ON t.id = s.task_id "
                "WHERE t.contract_id = :cid AND t.deleted_at IS NULL AND s.status = 'accepted'"
            ),
            {"cid": contract_id},
        )
    ).mappings().one()
    return int(m["assets"]), int(m["passed"])


async def contract_totals(session: AsyncSession, contract_id: uuid.UUID) -> dict[str, Any]:
    """What has been claimed, paid and is still open on a contract, for its
    detail page. Withdrawn invoices count for nothing."""
    m = (
        await session.execute(
            text(
                "SELECT coalesce(sum(amount) FILTER (WHERE status <> 'withdrawn'), 0) AS invoiced, "
                "       coalesce(sum(amount) FILTER (WHERE status IN ('paid','acknowledged')), 0)"
                "         AS paid, "
                "       coalesce(sum(amount) FILTER (WHERE status = 'issued'), 0) AS outstanding, "
                "       coalesce(sum(quantity) FILTER (WHERE status <> 'withdrawn'), 0)"
                "         AS quantity, "
                "       count(*) FILTER (WHERE status <> 'withdrawn') AS n "
                "FROM invoice WHERE contract_id = :cid"
            ),
            {"cid": contract_id},
        )
    ).mappings().one()
    return {
        "invoiced_total": _money(m["invoiced"]),
        "paid_total": _money(m["paid"]),
        "outstanding_total": _money(m["outstanding"]),
        "invoiced_quantity": _money(m["quantity"]),
        "count": int(m["n"]),
    }


# ---------------------------------------------------------------------------
# Raise
# ---------------------------------------------------------------------------

async def raise_invoice(
    session: AsyncSession,
    claims: AccessClaims,
    contract_id: uuid.UUID,
    quantity: Decimal | None,
    amount: Decimal | None,
    note: str | None,
) -> dict[str, Any]:
    """The partner claims payment for work that has passed its own gate.

    Per-unit contract: a quantity, priced at the frozen rate; for a counted unit
    it is capped at the captures gate 2 has accepted less what is already
    invoiced. Total contract: an amount, capped so the invoices never exceed the
    agreed value. Either way nothing can be raised until at least one submission
    on the contract has been accepted — an invoice follows the work.
    """
    c = await _contract(session, contract_id)
    if c["partner_org_id"] != claims.org_id:
        raise InvoiceError("Only the delivering partner raises an invoice on a contract.")
    if c["status"] not in _INVOICEABLE:
        raise InvoiceError(f"A {c['status']} contract cannot be invoiced.")

    # One raise at a time per contract, for the rest of the transaction: the
    # caps below are read-then-write, and two concurrent claims could otherwise
    # both pass them. The same advisory-lock shape the bidding window uses —
    # FOR UPDATE on the contract would need a privilege the partner holds, but
    # the lock needs none and serialises exactly what matters.
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))"),
        {"k": f"invoice:{contract_id}"},
    )
    assets, passed = await accepted_assets(session, contract_id)
    if passed == 0:
        raise InvoiceError(
            "Nothing on this contract has passed QA yet. An invoice follows the work."
        )
    so_far = await contract_totals(session, contract_id)
    invoiced_amount = Decimal(so_far["invoiced_total"] or "0")
    invoiced_quantity = Decimal(so_far["invoiced_quantity"] or "0")
    currency = c["currency"]

    if c["pricing_basis"] == "per_unit":
        if quantity is None:
            raise InvoiceError(
                f"{c['reference_code']} is priced per "
                f"{pricing.unit_words(c['pricing_unit'], c['pricing_block'])}: state the quantity."
            )
        if amount is not None:
            raise InvoiceError("On a per-unit contract the amount follows from the quantity.")
        whole = quantity == quantity.to_integral_value()
        if c["pricing_unit"] not in pricing.FRACTIONAL_UNITS and not whole:
            raise InvoiceError(
                f"{c['reference_code']} is counted in whole "
                f"{pricing.unit_words(c['pricing_unit'], 2).split(' ', 1)[1]}."
            )
        if c["pricing_unit"] in pricing.COUNTED_UNITS and quantity + invoiced_quantity > assets:
            raise InvoiceError(
                f"Gate 2 has accepted {assets} and {invoiced_quantity:.0f} are already invoiced, "
                f"so at most {max(assets - int(invoiced_quantity), 0)} can be invoiced now."
            )
        amount = pricing.line_amount(quantity, c["value"], c["pricing_block"])
        if amount <= 0:
            raise InvoiceError("That quantity rounds to nothing at the agreed rate.")
    else:
        if amount is None:
            raise InvoiceError(f"{c['reference_code']} is a fixed price: state the amount.")
        if quantity is not None:
            raise InvoiceError("A fixed-price contract is invoiced by amount, not quantity.")
        if amount + invoiced_amount > Decimal(str(c["value"])):
            left = Decimal(str(c["value"])) - invoiced_amount
            raise InvoiceError(
                f"{currency} {invoiced_amount:,.2f} of {Decimal(str(c['value'])):,.2f} is already "
                f"invoiced, so at most {currency} {left:,.2f} can be invoiced now."
            )

    ref = (
        await session.execute(text("SELECT next_reference_code('INV','seq_ref_invoice')"))
    ).scalar_one()
    try:
        # client_org_id, partner_org_id, currency, unit, block, rate and (per
        # unit) amount are the trigger's to fill; NOT NULL is checked after it.
        m = (
            await session.execute(
                text(
                    "INSERT INTO invoice (reference_code, contract_id, quantity, amount, note, "
                    "                     accepted_assets_at_issue) "
                    "VALUES (:ref, :cid, :quantity, :amount, :note, :assets) RETURNING *"
                ),
                {
                    "ref": ref, "cid": contract_id, "quantity": quantity, "amount": amount,
                    "note": (note or "").strip() or None, "assets": assets,
                },
            )
        ).mappings().one()
    except DBAPIError as e:
        raise InvoiceError(_reason(e)) from None

    amount_text = f"{currency} {Decimal(str(m['amount'])):,.2f}"
    await notifier.notify(
        session, c["client_org_id"],
        f"Invoice {ref} for {amount_text} was raised on {c['reference_code']}.",
        "billing", {"id": str(m["id"])},
    )
    await audit.log(
        session, "invoice.raised",
        f"Raised {ref} on {c['reference_code']} for {amount_text}",
        [m["id"], c["id"], c["request_id"], c["client_org_id"], c["partner_org_id"]],
        {"quantity": None if quantity is None else str(quantity), "accepted_assets": assets},
    )
    return _row(await _fetch(session, m["id"]))


# ---------------------------------------------------------------------------
# The three moves
# ---------------------------------------------------------------------------

async def _move(
    session: AsyncSession, invoice_id: uuid.UUID, frm: str, to: str, extra: dict[str, Any],
) -> Any:
    """One UPDATE gated on the state it leaves. Zero rows means somebody else
    moved it first; the trigger's refusal means the pre-checks were wrong."""
    sets = ", ".join(["status = :to"] + [f"{k} = :{k}" for k in extra])
    try:
        m = (
            await session.execute(
                text(
                    f"UPDATE invoice SET {sets} WHERE id = :id AND status = '{frm}' RETURNING id"
                ),
                {"to": to, "id": invoice_id, **extra},
            )
        ).mappings().one_or_none()
    except DBAPIError as e:
        raise InvoiceError(_reason(e)) from None
    if m is None:
        raise InvoiceError(f"This invoice is no longer {frm}.")
    return await _fetch(session, invoice_id)


async def mark_paid(
    session: AsyncSession, claims: AccessClaims, invoice_id: uuid.UUID,
    payment_reference: str | None,
) -> dict[str, Any]:
    """The client says it has paid. Optionally with the reference its bank gave."""
    i = await _fetch(session, invoice_id)
    if i["client_org_id"] != claims.org_id:
        raise InvoiceError("Only the client marks an invoice as paid.")
    if i["status"] != "issued":
        raise InvoiceError(f"A {i['status']} invoice cannot be marked paid.")
    # mark_paid: UPDATE … WHERE id = :id AND status = 'issued'
    m = await _move(
        session, invoice_id, "issued", "paid",
        {"payment_reference": (payment_reference or "").strip() or None},
    )
    await notifier.notify(
        session, m["partner_org_id"],
        f"{m['reference_code']} was marked paid by {m['client_name'] or 'the client'}. "
        "Acknowledge it once the money has arrived.",
        "billing", {"id": str(m["id"])},
    )
    await audit.log(
        session, "invoice.paid",
        f"Marked {m['reference_code']} paid"
        + (f" (reference {m['payment_reference']})" if m["payment_reference"] else ""),
        [m["id"], m["contract_id"], m["request_id"], m["client_org_id"], m["partner_org_id"]],
    )
    return _row(m)


async def acknowledge(
    session: AsyncSession, claims: AccessClaims, invoice_id: uuid.UUID
) -> dict[str, Any]:
    """The partner confirms the money arrived. The invoice is settled."""
    i = await _fetch(session, invoice_id)
    if i["partner_org_id"] != claims.org_id:
        raise InvoiceError("Only the partner that raised an invoice acknowledges its payment.")
    if i["status"] != "paid":
        raise InvoiceError(f"A {i['status']} invoice cannot be acknowledged.")
    # acknowledge: UPDATE … WHERE id = :id AND status = 'paid'
    m = await _move(session, invoice_id, "paid", "acknowledged", {})
    await notifier.notify(
        session, m["client_org_id"],
        f"{m['partner_name'] or 'The partner'} acknowledged payment of {m['reference_code']}.",
        "billing", {"id": str(m["id"])},
    )
    await audit.log(
        session, "invoice.acknowledged",
        f"Acknowledged payment of {m['reference_code']}",
        [m["id"], m["contract_id"], m["request_id"], m["client_org_id"], m["partner_org_id"]],
    )
    return _row(m)


async def withdraw(
    session: AsyncSession, claims: AccessClaims, invoice_id: uuid.UUID, reason: str | None
) -> dict[str, Any]:
    """The partner takes back an invoice the client has not yet paid. A
    withdrawn invoice counts for nothing; raise another."""
    i = await _fetch(session, invoice_id)
    if i["partner_org_id"] != claims.org_id:
        raise InvoiceError("Only the partner that raised an invoice withdraws it.")
    if i["status"] != "issued":
        raise InvoiceError(f"A {i['status']} invoice cannot be withdrawn.")
    # withdraw: UPDATE … WHERE id = :id AND status = 'issued'
    m = await _move(
        session, invoice_id, "issued", "withdrawn",
        {"withdrawn_reason": (reason or "").strip() or None},
    )
    await notifier.notify(
        session, m["client_org_id"],
        f"{m['reference_code']} was withdrawn"
        + (f": {m['withdrawn_reason']}" if m["withdrawn_reason"] else "."),
        "billing", {"id": str(m["id"])},
    )
    await audit.log(
        session, "invoice.withdrawn",
        f"Withdrew {m['reference_code']}"
        + (f": {m['withdrawn_reason']}" if m["withdrawn_reason"] else ""),
        [m["id"], m["contract_id"], m["request_id"], m["client_org_id"], m["partner_org_id"]],
    )
    return _row(m)


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

async def list_invoices(
    session: AsyncSession,
    contract_id: uuid.UUID | None = None,
    status: str | None = None,
) -> list[dict[str, Any]]:
    """RLS scopes the rows: a client sees the invoices on its contracts, a
    partner the ones it raised, Ops everything."""
    where = []
    params: dict[str, Any] = {}
    if contract_id is not None:
        where.append("i.contract_id = :cid")
        params["cid"] = contract_id
    if status is not None:
        where.append("i.status = :status")
        params["status"] = status
    q = _SELECT + (" WHERE " + " AND ".join(where) if where else "")
    q += " ORDER BY i.issued_at DESC, i.created_at DESC"
    rows = (await session.execute(text(q), params)).mappings().all()
    return [_row(r) for r in rows]


def _reason(e: DBAPIError) -> str:
    """The trigger's own sentence, without the driver's framing."""
    msg = str(getattr(e, "orig", e))
    for prefix in ("invoice ", "invoice:"):
        at = msg.find(prefix)
        if at >= 0:
            return msg[at:].split("\n", 1)[0].strip()
    return "The database refused the change."
