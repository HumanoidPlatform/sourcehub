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
from alembic.runtime.migration import MigrationContext
from sqlalchemy import pool, text
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
from sourcehub.modules.invoices import models as _invoices  # noqa: F401
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

    db/*.sql builds 41 tables; Base.metadata describes the subset the ORM
    actually maps — this project reaches for text() SQL freely, and a module
    "owns no ORM tables" wherever it has no models.py (README). Autogenerate
    reads that difference as "these tables were deleted" and proposes DROP for
    every one of them: a probe run once generated 23 drop_table calls,
    audit_event_default among them.

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


_OWNERSHIP_CHECK = text(
    "SELECT r.rolname, r.rolsuper OR r.rolbypassrls AS exempt, "
    "       (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
    "        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') "
    "          AND c.relowner <> r.oid) AS foreign_tables, "
    "       (SELECT string_agg(DISTINCT pg_get_userbyid(c.relowner), ', ') "
    "        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
    "        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') "
    "          AND c.relowner <> r.oid) AS other_owners, "
    "       (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
    "        WHERE n.nspname = 'public' AND c.relforcerowsecurity) AS forced_tables "
    "FROM pg_roles r WHERE r.rolname = current_user"
)


def _preflight(connection: Connection) -> None:
    """Refuse to migrate through a login that would build a broken schema.

    Two ways a migration goes wrong without any error of its own:

    * Run by a login that does not own the tables, it creates tables that
      login owns. db/000's default privileges belong to the original owner,
      so the API gets no rights on them — "permission denied" in production,
      nothing here. Owning is exact: a login that merely inherits the owner's
      rights still creates tables in its own name.
    * Run by an owner that FORCE binds, which on a managed server (no
      superuser, no BYPASSRLS) is every owner before db/270, each UPDATE or
      DELETE in a data step sees only the rows its (empty) tenancy context
      allows and changes nothing. The one migration safe to run there is 0030,
      which removes FORCE, so only a database at 0029 is let through.
    """
    row = connection.execute(_OWNERSHIP_CHECK).one()
    if row.foreign_tables:
        raise RuntimeError(
            f"DATABASE_ADMIN_URL connects as {row.rolname!r}, but {row.foreign_tables} "
            f"table(s) in public belong to {row.other_owners}. Run migrations as the login "
            "that owns the tables (the one that applied the schema bundle); a different "
            "login would create tables the API has no rights on."
        )
    if row.forced_tables and not row.exempt:
        current = MigrationContext.configure(connection).get_current_revision()
        if current != "0029":
            raise RuntimeError(
                f"{row.forced_tables} table(s) still FORCE row-level security and "
                f"{row.rolname!r} is neither a superuser nor BYPASSRLS, so data steps "
                f"would silently change nothing. The database is at {current!r}; bring it "
                "to 0029 on a server where the owner is a superuser, then upgrade here "
                "(0030 removes FORCE). See db/270_managed_postgres.sql."
            )


def _operator_flags(connection: Connection) -> None:
    """Session settings a migration may ask the operator for.

    db/320 drops the escrow ledger, which on dev and staging holds rows. Its
    guard refuses to run while they exist unless the session carries
    sourcehub.old_billing_dumped = 'yes' — the operator's statement that the
    rows are in the rollback folder. Passed as `alembic -x old_billing_dumped=yes
    upgrade head`. A plain SET is session-wide, so it outlives the implicit
    transaction this statement opens and reaches the migration's own.
    """
    flags = context.get_x_argument(as_dictionary=True)
    if flags.get("old_billing_dumped") == "yes":
        connection.execute(text("SET sourcehub.old_billing_dumped = 'yes'"))
        connection.commit()


def _run(connection: Connection) -> None:
    try:
        _preflight(connection)
        _operator_flags(connection)
    finally:
        # The checks only read, but reading began a transaction. End it, so
        # Alembic begins its own: one left open here would be taken over by the
        # migration and rolled back when the connection closes, silently.
        connection.rollback()
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
