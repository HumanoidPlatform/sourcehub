"""attachments — files hung off a field.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.
"""

from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import AttachmentEntity

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class Attachment(Base):
    __tablename__ = "attachment"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID
    )

    entity_type: Mapped[str] = mapped_column(AttachmentEntity)
    # Deliberately not a foreign key: the parent is polymorphic, and the
    # parent's own RLS decides visibility through attachment_parent_visible().
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    slot: Mapped[str] = mapped_column(Text)

    owner_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))

    filename: Mapped[str] = mapped_column(Text)
    storage_key: Mapped[str] = mapped_column(Text, unique=True)
    content_type: Mapped[str | None] = mapped_column(Text)
    size_bytes: Mapped[int] = mapped_column(BigInteger)

    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    uploaded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
