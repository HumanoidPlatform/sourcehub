"""storage — client-supplied destinations for captured data.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import StorageProvider

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class StorageTargetRow(Base):
    __tablename__ = "storage_target"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID
    )
    owner_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))

    label: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(StorageProvider)
    endpoint: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)
    bucket: Mapped[str] = mapped_column(Text)
    key_prefix: Mapped[str] = mapped_column(Text, server_default=text("''"))

    # The credential, in the shape its provider expects. Never selected into a
    # response: see _row() in service.py, which lists columns explicitly.
    secret: Mapped[dict[str, Any]] = mapped_column(JSONB)

    verified_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    verify_error: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
