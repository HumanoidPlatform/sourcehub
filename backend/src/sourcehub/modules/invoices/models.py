"""invoices — a partner's claim for payment on a contract (db/320).

SQLAlchemy table. Nothing outside this module may import it —
import-linter's module-independence contract fails the build if it tries.

Mapped so Alembic's autogenerate knows the table exists; the service writes
and reads it through hand-written statements, because the database fills most
of a row itself (the insert trigger copies the parties, the currency and the
rate from the contract and prices the claim) and the application login may
UPDATE three columns only.
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal

from sqlalchemy import CHAR, DateTime, ForeignKey, Integer, Numeric, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import InvoiceStatus

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class Invoice(Base):
    __tablename__ = "invoice"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID
    )
    reference_code: Mapped[str] = mapped_column(Text, unique=True)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contract.id"))
    # copied from the contract by the insert trigger, never by the caller
    client_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    partner_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    currency: Mapped[str] = mapped_column(CHAR(3), server_default=text("'USD'"))
    # per-unit: the quantity claimed and the frozen rate; total: all NULL
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    unit: Mapped[str | None] = mapped_column(Text)
    block: Mapped[int | None] = mapped_column(Integer)
    rate: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    accepted_assets_at_issue: Mapped[int | None] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(InvoiceStatus, server_default=text("'issued'"))
    issued_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    issued_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    paid_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    paid_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    payment_reference: Mapped[str | None] = mapped_column(Text)
    acknowledged_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    acknowledged_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    withdrawn_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    withdrawn_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    withdrawn_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
