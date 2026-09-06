"""Alembic environment.

Reads DATABASE_ADMIN_URL from config, not sqlalchemy.url in the ini: the app
role has no DDL rights, so migrations connect as the owner.

Async, because asyncpg is the only driver this project installs. Alembic's
migration context is synchronous, so the online path opens an async connection
and hands it to run_sync() — the standard async template, no sync driver and no
second URL to keep in step.

Autogenerate sees target_metadata, which means it sees TABLES ONLY. Every RLS
policy, SECURITY DEFINER function, trigger, partition and grant in db/*.sql is
invisible to it. That is why `make revision` prints its warning: a revision
touching a table with policies must carry them, hand-written.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig
from typing import TYPE_CHECKING

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

if TYPE_CHECKING:
    from sqlalchemy.engine import Connection

from sourcehub.config import settings
from sourcehub.db.base import Base

# Importing every models module for its side effect: each one registers its
# tables on Base.metadata. A module missing here is a table autogenerate would
# propose DROPping, so this list is load-bearing, not decorative.
from sourcehub.modules.delivery import models as _delivery  # noqa: F401
from sourcehub.modules.identity import models as _identity  # noqa: F401
from sourcehub.modules.ledger import models as _ledger  # noqa: F401
from sourcehub.modules.marketplace import models as _marketplace  # noqa: F401
from sourcehub.modules.network import models as _network  # noqa: F401
from sourcehub.modules.notify import models as _notify  # noqa: F401
from sourcehub.modules.onboarding import models as _onboarding  # noqa: F401
from sourcehub.modules.qa import models as _qa  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _include_object(obj, name, type_, reflected, compare_to):
    """Keep autogenerate away from the tables the ORM does not model.

    db/*.sql builds 56 tables; Base.metadata describes the subset the ORM
    actually maps — this project reaches for text() SQL freely, and a module
    "owns no ORM tables" wherever it has no models.py (README). Autogenerate
    reads that difference as "these tables were deleted" and proposes DROP for
    every one of them: a probe run generated 23 drop_table calls, including
    audit_event_default and the whole qa rubric set.

    So a reflected object whose table the metadata does not know is not drift,
    it is simply out of scope.
    """
    table = name if type_ == "table" else getattr(getattr(obj, "table", None), "name", None)
    return not (reflected and table is not None and table not in target_metadata.tables)


def _admin_url() -> str:
    url = settings.database_admin_url
    if not url:
        raise RuntimeError(
            "DATABASE_ADMIN_URL is not set in backend/.env. Migrations run as the "
            "database owner; DATABASE_URL points at sourcehub_app, which has no "
            "DDL rights by design."
        )
    return url


def run_migrations_offline() -> None:
    """Emit SQL to stdout instead of running it — `alembic upgrade head --sql`."""
    context.configure(
        url=_admin_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=_include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def _run(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        include_object=_include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


async def _run_async() -> None:
    engine = async_engine_from_config(
        {"sqlalchemy.url": _admin_url()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with engine.connect() as connection:
        await connection.run_sync(_run)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(_run_async())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
