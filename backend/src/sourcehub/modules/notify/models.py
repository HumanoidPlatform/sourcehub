"""notify — in-app messages, email, webhooks and digests.

SQLAlchemy tables. Nothing outside this module may import them —
import-linter's module-independence contract fails the build if it tries.

A notification carries a deep link (page + params) so it can take you to the
thing it is about — kept from the prototype, where every notification does.
"""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from sourcehub.db.base import Base
from sourcehub.db.types import NotificationChannel

UTCNOW = text("now()")
GEN_UUID = text("gen_random_uuid()")


class Notification(Base):
    __tablename__ = "notification"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=GEN_UUID)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisation.id"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_user.id"))
    channel: Mapped[str] = mapped_column(NotificationChannel, server_default=text("'in_app'"))
    body: Mapped[str] = mapped_column(Text)
    link_page: Mapped[str | None] = mapped_column(Text)
    link_params: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    read_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    failed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    failure_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=UTCNOW)
