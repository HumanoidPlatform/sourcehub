"""ledger — double-entry accounting, invoices, escrow, fees and payouts.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

Money is written by the platform alone (RLS enforces it), so this module's
service opens a platform-scoped session internally for system-generated
financial records. ledger_entry is append-only; a correction is a reversing
transaction, never an edit.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal

from sqlalchemy import CHAR, Date, DateTime, ForeignKey, Numeric, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import InvoiceStatus, LedgerDirection, LedgerEntryType

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class LedgerAccount(Base):
    __tablename__ = "ledger_account"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organisation.id"))
    code: Mapped[str] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(CHAR(3), server_default=text("'USD'"))


class LedgerTransaction(Base):
    __tablename__ = "ledger_transaction"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    contract_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contract.id"))
    entry_type: Mapped[str] = mapped_column(LedgerEntryType)
    description: Mapped[str] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(CHAR(3), server_default=text("'USD'"))
    occurred_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class LedgerEntry(Base):
    __tablename__ = "ledger_entry"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ledger_transaction.id"))
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ledger_account.id"))
    direction: Mapped[str] = mapped_column(LedgerDirection)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))


class Invoice(Base):
    __tablename__ = "invoice"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    contract_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contract.id"))
    party_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    transaction_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ledger_transaction.id"))
    kind: Mapped[str] = mapped_column(Text)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(CHAR(3), server_default=text("'USD'"))
    status: Mapped[str] = mapped_column(InvoiceStatus, server_default=text("'pending'"))
    issued_on: Mapped[dt.date] = mapped_column(Date, server_default=text("current_date"))
    due_on: Mapped[dt.date | None] = mapped_column(Date)
    paid_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
