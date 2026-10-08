"""catalogue.sweep — the clock that copies relisted captures into platform storage.

Relisting a delivered contract (service.relist_on_delivery) records one
pending datahub_dataset_item per capture and copies nothing: a contract can hold
thousands of files and delivery is a click in the console. This pass does the
copying, a batch per owner per tick, server-side — the platform's Azure
account fetches a short-lived signed GET of the capture in the client's bucket
(storage.copy_between), so the bytes never pass through the API.

A copy that cannot be made is marked failed with the reason, and the owner
either retries it or removes it before submitting the listing. When an owner's
dataset has nothing left pending, the owner is told.

Same shape as marketplace.sweep: a task inside the API process, one org
session per owner, an advisory lock so one API worker does the work, and
`python -m sourcehub.modules.catalogue.sweep` for one pass by hand.
"""

from __future__ import annotations

import asyncio
import logging
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sourcehub.config import settings
from sourcehub.db.session import anonymous_session, org_session
from sourcehub.modules.notify import service as notifier
from sourcehub.modules.storage import service as storage_svc
from sourcehub.platform import storage
from sourcehub.platform.storage import StorageError

log = logging.getLogger(__name__)

FIRST_PASS_DELAY = 30


async def _copy_owner(session: AsyncSession, owner: uuid.UUID) -> tuple[int, int]:
    rows = (
        (
            await session.execute(
                text(
                    "SELECT id, dataset_id, storage_key, filename, source_storage_key, "
                    "       source_storage_target_id "
                    "FROM datahub_dataset_item WHERE owner_org_id = :o AND copy_status = 'pending' "
                    "ORDER BY created_at LIMIT :n FOR UPDATE SKIP LOCKED"
                ),
                {"o": owner, "n": settings.catalogue_copy_batch},
            )
        )
        .mappings()
        .all()
    )
    copied = failed = 0
    platform = storage.platform_target()
    touched: set[uuid.UUID] = set()
    for r in rows:
        touched.add(r["dataset_id"])
        error: str | None = None
        try:
            if not r["source_storage_key"]:
                raise StorageError("The original capture has no stored file.")
            src = await storage_svc.resolve_by_id(session, r["source_storage_target_id"])
            await storage.copy_between(
                src, r["source_storage_key"], platform, r["storage_key"], r["filename"]
            )
        except LookupError:
            # Azure says the same thing for a source that is gone and one it
            # cannot reach (a bucket on a private network), so say both.
            error = (
                "The original capture could not be read from the client's storage: "
                "it has been removed, or the storage is not reachable from the platform."
            )
        except (StorageError, storage_svc.StorageTargetError) as e:
            error = str(e)[:500]
        if error is None:
            copied += 1
            await session.execute(
                text(
                    "UPDATE datahub_dataset_item SET copy_status = 'copied', copy_error = NULL WHERE id = :id"
                ),
                {"id": r["id"]},
            )
        else:
            failed += 1
            await session.execute(
                text(
                    "UPDATE datahub_dataset_item SET copy_status = 'failed', copy_error = :e WHERE id = :id"
                ),
                {"e": error, "id": r["id"]},
            )
    for ds in touched:
        left = (
            (
                await session.execute(
                    text(
                        "SELECT count(*) FILTER (WHERE copy_status = 'pending') AS pending, "
                        "       count(*) FILTER (WHERE copy_status = 'failed') AS failed "
                        "FROM datahub_dataset_item WHERE dataset_id = :d"
                    ),
                    {"d": ds},
                )
            )
            .mappings()
            .one()
        )
        if left["pending"] == 0:
            title = (
                await session.execute(text("SELECT title FROM datahub_dataset WHERE id = :d"), {"d": ds})
            ).scalar_one()
            await notifier.notify(
                session,
                owner,
                f"The files for {title} are copied in"
                + (f"; {left['failed']} could not be copied" if left["failed"] else "")
                + ". Describe it, pick samples and submit it for review.",
                "catalogue_listing",
                {"id": str(ds)},
            )
    return copied, failed


async def run_pass() -> dict[str, int]:
    counts = {"owners": 0, "copied": 0, "failed": 0, "failed_owners": 0, "skipped": 0}
    async with anonymous_session() as lock:
        got = (
            await lock.execute(text("SELECT pg_try_advisory_xact_lock(hashtext('catalogue_copy'))"))
        ).scalar_one()
        if not got:
            counts["skipped"] = 1
            return counts
        owners = list((await lock.execute(text("SELECT datahub_copy_owners()"))).scalars().all())
        for owner in owners:
            counts["owners"] += 1
            try:
                # The role only matters to policies that test for 'platform_admin'
                # or 'worker'; this session is neither.
                async with org_session(owner, "catalogue_sweep") as s:
                    copied, failed = await _copy_owner(s, owner)
                    counts["copied"] += copied
                    counts["failed"] += failed
            except Exception:
                counts["failed_owners"] += 1
                log.exception("catalogue copy failed for owner %s", owner)
    if counts["copied"] or counts["failed"] or counts["failed_owners"]:
        log.info("catalogue copy: %s", counts)
    return counts


async def run_forever() -> None:
    """The loop the API starts at boot. Never raises."""
    await asyncio.sleep(FIRST_PASS_DELAY)
    while True:
        try:
            await run_pass()
        except Exception:
            log.exception("catalogue copy sweep failed")
        await asyncio.sleep(settings.catalogue_copy_tick_seconds)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
    print(asyncio.run(run_pass()))
