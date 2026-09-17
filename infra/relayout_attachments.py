"""Move attachments filed under the old layout into the new one. One-off.

    cd backend
    .venv/Scripts/python.exe ../infra/relayout_attachments.py            # dry run
    .venv/Scripts/python.exe ../infra/relayout_attachments.py --apply    # do it

Old:  {client}/{RFP}/{slot}/{original filename}[-{6 hex}]
New:  {client}/{RFP}/request|proposals/{bid}|tasks/{TSK}|qa/{TSK}/{slot}/
          {RFP}[_{scope}]_{slot}_{nn}_v{k}_{original name}

Needs migration 0013 applied first: it reads attachment.doc_no / version and the
four-column attachment_folder(). Nothing depends on running this — every read
goes through attachment.storage_key, so files at old keys keep opening — it
exists so the container is uniform for a person browsing it.

Per file: copy to the new key, point the row at it, then delete the old blob.
In that order, so a failure part-way leaves a duplicate, never a loss. Rows that
are already where they belong are skipped, so it is safe to run twice.

Connects with DATABASE_ADMIN_URL: the rows span every organisation, and RLS
would show an ordinary connection none of them.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(HERE, "..", "backend")
sys.path.insert(0, os.path.join(BACKEND, "src"))
os.chdir(BACKEND)  # config.py reads backend/.env relative to the working directory

import asyncpg  # noqa: E402

from sourcehub.config import settings  # noqa: E402
from sourcehub.modules.attachments import folders  # noqa: E402
from sourcehub.platform import storage  # noqa: E402


def _admin_dsn() -> str:
    url = settings.database_admin_url
    if not url:
        raise SystemExit("DATABASE_ADMIN_URL is not set in backend/.env")
    return url.replace("postgresql+asyncpg://", "postgresql://")


def _wanted(row: asyncpg.Record) -> str:
    client = folders._segment(row["client_name"] or "", fallback="Unnamed client")
    rfp = folders._segment(row["request_ref"], fallback="Unreferenced")
    filing = folders.Filing(
        base=f"{client}/{rfp}", rfp_ref=rfp,
        scope_ref=row["scope_ref"], scope_label=row["scope_label"],
    )
    name = folders.stored_name(
        rfp, row["scope_ref"], row["slot"], row["doc_no"], row["version"], row["filename"]
    )
    return f"{filing.base}/{folders.subfolder(row['entity_type'], filing, row['slot'])}/{name}"


async def main(apply: bool) -> int:
    target = storage.platform_target()
    db = await asyncpg.connect(_admin_dsn(), timeout=20)
    rows = await db.fetch(
        """
        SELECT a.id, a.entity_type::text AS entity_type, a.entity_id, a.slot, a.filename,
               a.storage_key, a.doc_no, a.version, a.deleted_at IS NOT NULL AS removed,
               f.client_name, f.request_ref, f.scope_ref, f.scope_label
        FROM   attachment a
        LEFT   JOIN LATERAL attachment_folder(a.entity_type, a.entity_id) f ON true
        ORDER  BY f.request_ref, a.entity_type, a.slot, a.doc_no, a.version
        """
    )
    moved = skipped = missing = orphaned = 0
    for r in rows:
        if not r["request_ref"] or (r["entity_type"] != "request" and not r["scope_ref"]):
            print(f"  ORPHAN  {r['storage_key']}  (no request behind this {r['entity_type']})")
            orphaned += 1
            continue
        new = _wanted(r)
        if new == r["storage_key"]:
            skipped += 1
            continue
        tag = " (removed row)" if r["removed"] else ""
        print(f"  {'MOVE ' if apply else 'WOULD'}   {r['storage_key']}\n       -> {new}{tag}")
        if not apply:
            moved += 1
            continue
        try:
            await storage.head(target, r["storage_key"])
        except LookupError:
            print("       !! source blob is not in storage; row left as it is")
            missing += 1
            continue
        final = await folders._vacant(target, new)
        await storage.copy(target, r["storage_key"], final)
        await db.execute("UPDATE attachment SET storage_key = $1 WHERE id = $2", final, r["id"])
        await storage.delete(target, r["storage_key"])
        moved += 1
    await db.close()
    verb = "moved" if apply else "to move"
    print(
        f"\n{moved} {verb} · {skipped} already in place · "
        f"{missing} missing in storage · {orphaned} orphaned"
    )
    if not apply and moved:
        print("dry run — nothing changed. Re-run with --apply.")
    return 0


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--apply", action="store_true", help="perform the moves (default is a dry run)")
    raise SystemExit(asyncio.run(main(p.parse_args().apply)))
