"""ledger — double-entry accounting, invoices, escrow, fees and payouts.

Business rules, and the ONLY public surface of this module.

Money is written by the platform alone — the RLS write policies on invoice,
ledger_account, ledger_transaction and ledger_entry all demand platform_admin.
System-generated records (the award milestone, the release, the 9% fee) are
therefore written under a TEMPORARY platform context inside the caller's own
transaction: set_config is transaction-local, so the elevation and the business
change commit or roll back together, atomically. The elevation helper is
private to this module on purpose.

The flow mirrors the prototype exactly:
  award    -> milestone invoice to the client (50% by default), held in escrow
  approval -> every invoice on the contract paid; escrow released to the
              partner less the platform fee; fee invoiced to the partner, paid
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.api.security import AccessClaims
from sourcehub.modules.ledger.models import Invoice, LedgerAccount

TWO_PLACES = Decimal("0.01")


async def _elevate(session: AsyncSession) -> tuple[str, str]:
    """Swap the transaction's context to the platform. Returns what to restore."""
    prev = (
        await session.execute(
            text("SELECT current_setting('app.org_id', true), current_setting('app.role', true)")
        )
    ).one()
    await session.execute(
        text(
            "SELECT set_config('app.org_id', platform_org_id()::text, true), "
            "set_config('app.role', 'platform_admin', true)"
        )
    )
    return prev[0] or "", prev[1] or ""


async def _restore(session: AsyncSession, prev: tuple[str, str]) -> None:
    await session.execute(
        text("SELECT set_config('app.org_id', :o, true), set_config('app.role', :r, true)"),
        {"o": prev[0], "r": prev[1]},
    )


async def _account(session: AsyncSession, org_id: uuid.UUID | None, code: str) -> uuid.UUID:
    """Get-or-create a ledger account. Runs elevated."""
    found = (
        await session.execute(
            select(LedgerAccount.id).where(
                LedgerAccount.org_id.is_(None) if org_id is None else LedgerAccount.org_id == org_id,
                LedgerAccount.code == code,
            )
        )
    ).scalar_one_or_none()
    if found:
        return found
    return (
        await session.execute(
            text(
                "INSERT INTO ledger_account (org_id, code) VALUES (:org, :code) RETURNING id"
            ),
            {"org": org_id, "code": code},
        )
    ).scalar_one()


async def _transaction(
    session: AsyncSession,
    contract_id: uuid.UUID | None,
    entry_type: str,
    description: str,
    legs: list[tuple[uuid.UUID, str, Decimal]],  # (account, debit|credit, amount)
) -> uuid.UUID:
    tx_id = (
        await session.execute(
            text(
                "INSERT INTO ledger_transaction (contract_id, entry_type, description) "
                "VALUES (:c, :t, :d) RETURNING id"
            ),
            {"c": contract_id, "t": entry_type, "d": description},
        )
    ).scalar_one()
    for account_id, direction, amount in legs:
        await session.execute(
            text(
                "INSERT INTO ledger_entry (transaction_id, account_id, direction, amount) "
                "VALUES (:t, :a, :dir, :amt)"
            ),
            {"t": tx_id, "a": account_id, "dir": direction, "amt": amount},
        )
    return tx_id


async def _next_invoice_ref(session: AsyncSession) -> str:
    return (
        await session.execute(text("SELECT next_reference_code('INV','seq_ref_invoice')"))
    ).scalar_one()


# ---------------------------------------------------------------------------
# The two money moments
# ---------------------------------------------------------------------------

async def record_award(
    session: AsyncSession,
    contract_id: uuid.UUID,
    client_org_id: uuid.UUID,
    value: Decimal,
    milestone_pct: int,
) -> None:
    """Milestone 1 invoiced to the client and held in escrow."""
    amount = (value * milestone_pct / 100).quantize(TWO_PLACES)
    prev = await _elevate(session)
    try:
        receivable = await _account(session, client_org_id, "receivable")
        escrow = await _account(session, None, "escrow")
        tx = await _transaction(
            session, contract_id, "escrow_hold",
            f"Milestone 1 of 2 ({milestone_pct}%) held in escrow",
            [(receivable, "debit", amount), (escrow, "credit", amount)],
        )
        await session.execute(
            text(
                "INSERT INTO invoice (reference_code, contract_id, party_org_id, "
                "transaction_id, kind, amount, status) "
                "VALUES (:ref, :c, :p, :tx, :kind, :amt, 'pending')"
            ),
            {
                "ref": await _next_invoice_ref(session),
                "c": contract_id, "p": client_org_id, "tx": tx,
                "kind": f"Milestone 1 of 2", "amt": amount,
            },
        )
    finally:
        await _restore(session, prev)


async def record_completion(
    session: AsyncSession,
    contract_id: uuid.UUID,
    client_org_id: uuid.UUID,
    partner_org_id: uuid.UUID,
    value: Decimal,
    milestone_pct: int,
    fee_pct: Decimal,
) -> Decimal:
    """The client approved. Three balanced transactions:

      1. the remaining milestone falls due and joins escrow
      2. the client's payment settles the receivable in full
      3. escrow empties: partner is owed value minus fee, the fee is income

    After which: receivable 0, escrow 0, cash +value, partner payable value-fee,
    fee_income +fee — and ledger_imbalance stays empty, which the reconciliation
    view asserts. Returns the fee for the caller's messaging.
    """
    fee = (value * fee_pct / 100).quantize(TWO_PLACES)
    milestone1 = (value * milestone_pct / 100).quantize(TWO_PLACES)
    remainder = value - milestone1

    prev = await _elevate(session)
    try:
        receivable = await _account(session, client_org_id, "receivable")
        payable = await _account(session, partner_org_id, "payable")
        escrow = await _account(session, None, "escrow")
        cash = await _account(session, None, "cash")
        fee_income = await _account(session, None, "fee_income")

        if remainder > 0:
            await _transaction(
                session, contract_id, "escrow_hold",
                "Milestone 2 of 2 due on delivery approval",
                [(receivable, "debit", remainder), (escrow, "credit", remainder)],
            )
        await _transaction(
            session, contract_id, "invoice",
            "Contract value settled by the client",
            [(cash, "debit", value), (receivable, "credit", value)],
        )
        await _transaction(
            session, contract_id, "escrow_release",
            f"Escrow released: partner paid less the {fee_pct:g}% platform fee",
            [
                (escrow, "debit", value),
                (payable, "credit", value - fee),
                (fee_income, "credit", fee),
            ],
        )

        # every open invoice on the contract is settled by the approval
        await session.execute(
            update(Invoice)
            .where(Invoice.contract_id == contract_id, Invoice.status == "pending")
            .values(status="paid", paid_at=dt.datetime.now(dt.timezone.utc))
        )
        # the prototype raises a paid fee invoice against the partner
        await session.execute(
            text(
                "INSERT INTO invoice (reference_code, contract_id, party_org_id, kind, "
                "amount, status, paid_at) "
                "VALUES (:ref, :c, :p, :kind, :amt, 'paid', now())"
            ),
            {
                "ref": await _next_invoice_ref(session),
                "c": contract_id, "p": partner_org_id,
                "kind": f"Platform fee, {fee_pct:g}%", "amt": fee,
            },
        )
        return fee
    finally:
        await _restore(session, prev)


# ---------------------------------------------------------------------------
# Reads
# ---------------------------------------------------------------------------

async def list_invoices(session: AsyncSession) -> list[dict[str, Any]]:
    """An org reads its own invoices; Ops reads everyone's. RLS decides."""
    rows = (
        await session.execute(
            text(
                "SELECT i.id, i.reference_code, i.kind, i.amount, i.currency, i.status, "
                "       i.issued_on, i.paid_at, i.contract_id, i.party_org_id, "
                "       c.reference_code AS contract_ref, o.name AS party_name "
                "FROM invoice i "
                "LEFT JOIN contract c ON c.id = i.contract_id "
                "LEFT JOIN organisation o ON o.id = i.party_org_id "
                "WHERE i.deleted_at IS NULL ORDER BY i.issued_on DESC, i.created_at DESC"
            )
        )
    ).mappings().all()
    return [dict(r) for r in rows]
