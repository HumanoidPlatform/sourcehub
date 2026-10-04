"""How a budget, a bid and a contract are priced: one amount on a basis.

db/320. A request states its budget as a total, or as an amount per block of
some unit ("USD 500 per 1,000 photos"); a bid is one price on that basis; the
award freezes the basis on the contract; an invoice is priced against it.

Pure functions over plain values, shared by marketplace (request and bid),
delivery (contract), invoices and overview. No table knowledge here: that is
why a module other than marketplace may import it under the module-independence
contract, which forbids only models.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

TWO_PLACES = Decimal("0.01")

# singular, plural — the request's target_unit vocabulary (db/040), as a
# person would read it after "per"
UNIT_WORDS: dict[str, tuple[str, str]] = {
    "photos": ("photo", "photos"),
    "videos": ("video", "videos"),
    "audio_clips": ("audio clip", "audio clips"),
    "audio_hours": ("hour of audio", "hours of audio"),
    "responses": ("response", "responses"),
    "records": ("record", "records"),
    "sites": ("site", "sites"),
    "hours": ("hour of footage", "hours of footage"),
}

# Units a quantity can be fractional in. Everything else is counted whole, and
# the insert trigger refuses a fraction of a photo (db/320).
FRACTIONAL_UNITS = frozenset({"hours", "audio_hours"})

# Units the platform can count: every accepted capture is one of these. An
# invoice for them is capped at what gate 2 has accepted; hours and sites are
# never measured server-side, so the client checks those against the delivery.
COUNTED_UNITS = frozenset({"photos", "videos", "audio_clips", "records", "responses"})


def _dec(value: Any) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal(str(value))


def line_amount(quantity: Any, rate: Any, block: int) -> Decimal:
    """What a quantity costs at a per-block rate.

    Multiply before divide, round half up to two places: the same arithmetic,
    in the same order, as the invoice_before_insert trigger, so the figure the
    API shows before the insert is the figure the database stores.
    """
    return (_dec(quantity) * _dec(rate) / Decimal(block)).quantize(
        TWO_PLACES, rounding=ROUND_HALF_UP
    )


def estimated_total(
    basis: str, amount: Any, block: int | None, quantity: int | None
) -> Decimal | None:
    """The whole deal implied by an amount on a basis; None when it cannot be known."""
    if amount is None:
        return None
    if basis == "total":
        return _dec(amount).quantize(TWO_PLACES)
    if not block or not quantity:
        return None
    return line_amount(quantity, amount, block)


def unit_words(unit: str | None, block: int | None) -> str:
    """'1,000 photos', 'photo', '10 hours of footage'."""
    singular, plural = UNIT_WORDS.get(unit or "", (unit or "unit", unit or "units"))
    if block in (None, 1):
        return singular
    return f"{block:,} {plural}"


def quantity_text(quantity: Any, unit: str | None) -> str:
    """'39 photos', '1 photo', '2.5 hours of footage'."""
    q = _dec(quantity)
    shown = f"{q:,.0f}" if q == q.to_integral_value() else f"{q.normalize():,f}"
    singular, plural = UNIT_WORDS.get(unit or "", (unit or "unit", unit or "units"))
    return f"{shown} {singular if q == 1 else plural}"


def price_text(
    basis: str, amount: Any, currency: str, unit: str | None, block: int | None
) -> str | None:
    """'USD 72,500.00' or 'USD 500.00 per 1,000 photos'; None when no amount."""
    if amount is None:
        return None
    head = f"{currency} {_dec(amount):,.2f}"
    if basis != "per_unit":
        return head
    return f"{head} per {unit_words(unit, block)}"


def view(
    basis: str,
    unit: str | None,
    block: int | None,
    quantity: int | None,
    amount: Any,
    currency: str,
) -> dict[str, Any]:
    """The pricing block every response carries for a request, bid or contract.

    Money travels as strings: FastAPI would encode a Decimal as a JSON float,
    and the console's own type file says money must never do that.
    """
    total = estimated_total(basis, amount, block, quantity)
    return {
        "basis": basis,
        "unit": unit,
        "block": block,
        "quantity": quantity,
        "amount": None if amount is None else f"{_dec(amount):.2f}",
        "estimated_total": None if total is None else f"{total:.2f}",
        "currency": currency,
        "text": price_text(basis, amount, currency, unit, block),
    }
