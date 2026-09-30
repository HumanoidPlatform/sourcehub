"""Refuse to serve through a database login that row-level security does not bind.

Row-level security is the tenancy boundary: every policy compares a row with
the organisation the request declared (db/session.py). PostgreSQL applies it
to a login only if that login is not a superuser, does not hold BYPASSRLS, and
does not own the tables, because an owner is exempt from its own table's
policies (so is any role that inherits the owner's privileges).

Until db/270 the schema also marked every table FORCE ROW LEVEL SECURITY, which
binds the owner too: a second fence against DATABASE_URL pointing at the owner.
FORCE had to go, because on a managed server (Azure, AWS, Google) there is no
superuser and the SECURITY DEFINER helpers need the owner's exemption (db/270
explains). This check is what replaces that fence.

Pointed at the admin login, the API would otherwise serve every organisation
every row, with nothing failing anywhere. So it checks the login it was given
before it serves anything (main.py's lifespan) and on every readiness probe
(GET /ready).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

import asyncpg
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from sourcehub.db.session import anonymous_session

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

# What "the database did not answer" looks like: a refused or timed-out socket,
# a TLS failure (an OSError), or the server refusing the connection itself (a
# wrong database name or password). asyncpg raises the last kind as its own
# exceptions, not through SQLAlchemy, because they happen while connecting.
# Never includes UnsafeDatabaseLoginError: that is a RuntimeError on purpose.
UNREACHABLE: tuple[type[BaseException], ...] = (
    OSError,
    TimeoutError,
    SQLAlchemyError,
    asyncpg.PostgresError,
    asyncpg.InterfaceError,
)

# pg_has_role(..., 'USAGE') is true for the owner itself and for any role that
# inherits the owner's privileges, which is exactly the set PostgreSQL exempts.
LOGIN_CHECK = text(
    "SELECT r.rolname, r.rolsuper, r.rolbypassrls, "
    "       EXISTS (SELECT 1 "
    "               FROM   pg_class c "
    "               JOIN   pg_namespace n ON n.oid = c.relnamespace "
    "               WHERE  n.nspname = 'public' "
    "                 AND  c.relkind IN ('r', 'p') "
    "                 AND  pg_has_role(r.oid, c.relowner, 'USAGE')) AS owns_tables "
    "FROM   pg_roles r "
    "WHERE  r.rolname = current_user"
)


class UnsafeDatabaseLoginError(RuntimeError):
    """DATABASE_URL names a login that row-level security does not bind."""


@dataclass(frozen=True)
class LoginCheck:
    login: str
    superuser: bool
    bypasses_rls: bool
    owns_tables: bool

    @property
    def problems(self) -> list[str]:
        found = []
        if self.superuser:
            found.append("is a superuser")
        if self.bypasses_rls:
            found.append("holds BYPASSRLS")
        if self.owns_tables:
            found.append("owns the tables (or inherits from the role that does)")
        return found

    @property
    def safe(self) -> bool:
        return not self.problems

    def message(self) -> str:
        return (
            f"DATABASE_URL connects as {self.login!r}, which {' and '.join(self.problems)}. "
            "Row-level security does not apply to it, so every organisation would see "
            "every other organisation's rows. Point DATABASE_URL at sourcehub_app; the "
            "owner login is for migrations only (DATABASE_ADMIN_URL)."
        )


async def check_login(session: AsyncSession) -> LoginCheck:
    """What the database says about the login this session connected as."""
    row = (await session.execute(LOGIN_CHECK)).one()
    return LoginCheck(
        login=row.rolname,
        superuser=bool(row.rolsuper),
        bypasses_rls=bool(row.rolbypassrls),
        owns_tables=bool(row.owns_tables),
    )


async def assert_safe_login() -> LoginCheck:
    """Raise UnsafeDatabaseLoginError if the configured login is not bound by RLS."""
    async with anonymous_session() as session:
        found = await check_login(session)
    if not found.safe:
        raise UnsafeDatabaseLoginError(found.message())
    return found
