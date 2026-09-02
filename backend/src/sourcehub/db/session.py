"""The session factory, and the org context that makes RLS work.

There is deliberately no way to get a session except through org_session().
That is what makes forgetting the tenancy context impossible rather than
merely discouraged.

Three details decide whether row-level security works or quietly does nothing
(sourcehub-build-guide.html, "Data layer and row-level security"):

  1. The application must connect as a role that is neither the table owner nor
     holds BYPASSRLS. DATABASE_URL points at sourcehub_app for exactly this
     reason. An app connecting as postgres has RLS enabled and entirely
     ineffective — the most common way this control fails silently.
  2. SET LOCAL only lasts a transaction, so every session opens one before
     setting the org context.
  3. current_setting(..., true) with the missing-ok flag, so an unset context
     returns NULL and every policy fails closed rather than raising.

Point 2 is why this is a transaction-scoped context manager and not a
connection-scoped one.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from sourcehub.config import settings

engine = create_async_engine(
    settings.database_url,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    echo=settings.db_echo,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def org_session(
    org_id: UUID | str,
    role: str,
    user_id: UUID | str | None = None,
) -> AsyncIterator[AsyncSession]:
    """Open a transaction and pin the tenancy context to it.

    Every query in the application runs inside one of these. The three GUCs set
    here are read by every RLS policy in db/100_rls.sql:

        app.org_id   the account and network axes
        app.role     'platform_admin' is the only value that widens visibility
        app.user_id  self-access on app_user, user_session, user_token, user_mfa

    Args:
        org_id: The organisation this session acts as. One session, one org —
            a user holding grants in several organisations opens one session
            per organisation.
        role: The system role code for this grant. Only 'platform_admin' is
            load-bearing in the policies; the rest is carried for auditing.
        user_id: The acting user, where one exists.
    """
    async with SessionLocal() as session:
        async with session.begin():  # SET LOCAL needs a transaction
            await session.execute(
                text(
                    "SELECT set_config('app.org_id',  :org,  true), "
                    "       set_config('app.role',    :role, true), "
                    "       set_config('app.user_id', :user, true)"
                ),
                {
                    "org": str(org_id),
                    "role": role,
                    "user": str(user_id) if user_id else "",
                },
            )
            yield session


@asynccontextmanager
async def anonymous_session() -> AsyncIterator[AsyncSession]:
    """A session with NO org context, for the login path only.

    Every RLS-protected table returns zero rows here, which is correct: at this
    point in the request we do not yet know who is asking. The credential check
    goes through the SECURITY DEFINER functions authenticate_lookup() and
    record_login_attempt() — the one sanctioned way to read app_user without a
    context, and deliberately incapable of enumerating anything.

    Do not add convenience queries to this. If something needs it, it needs an
    org context instead.
    """
    async with SessionLocal() as session:
        async with session.begin():
            yield session
