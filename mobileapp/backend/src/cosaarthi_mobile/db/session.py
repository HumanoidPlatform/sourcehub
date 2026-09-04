from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from cosaarthi_mobile.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    max_overflow=settings.db_max_overflow,
    pool_size=settings.db_pool_size,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session

