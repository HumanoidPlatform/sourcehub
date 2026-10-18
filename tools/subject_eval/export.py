"""Export captures and their gate-1 outcomes for the subject evaluation.

Self-contained on purpose: it runs wherever the sourcehub package and the
database are, which in practice is the VM's api container (the database port
is not published, so a laptop cannot reach it). See README.md for the exact
commands. Wherever it runs:

    python export.py --counts-only           # aggregate counts, nothing saved
    python export.py --out /tmp/subject_eval # manifest.jsonl + files/

Reads through DATABASE_ADMIN_URL (the app role's row-level security would
hide most captures) inside a READ ONLY transaction: nothing is written to the
database. Files are fetched through short-lived signed links, checked against
asset.sha256 and written only under --out. Neither the database address nor
any link is printed or stored.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import sys
from collections import Counter
from pathlib import Path

_SQL = """
SELECT a.id, a.task_id, a.mime_type, a.duration_s, a.status::text AS status,
       a.review_reason, a.review_note, a.storage_key, a.storage_target_id,
       a.filename, a.sha256, a.check_results, a.created_at,
       b.status::text AS batch_status,
       t.reference_code, t.target_unit, t.capture_spec -> 'subject' AS subject
FROM asset a
JOIN task t ON t.id = a.task_id
LEFT JOIN capture_batch b ON b.id = a.batch_id
WHERE a.deleted_at IS NULL AND a.erased_at IS NULL
  AND a.status IN ('ready', 'rejected')
"""

_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/heic": ".heic", "video/mp4": ".mp4",
        "video/quicktime": ".mov"}


def outcome(row: dict) -> str:
    """Gate 1's verdict on one capture, as far as the record can say."""
    if row["status"] == "ready":
        return "accepted" if row["batch_status"] == "reviewed" else "undecided"
    return "rejected_subject" if row["review_reason"] == "wrong_subject" else "rejected_other"


def mlkit(check_results: dict | None) -> dict:
    """What the phone's labeller recorded about this capture."""
    device = (check_results or {}).get("device") or []
    codes = {c.get("code"): c for c in device if isinstance(c, dict)}
    measured = codes.get("subject_measured")
    return {
        "measured": measured.get("detail") if measured else None,
        "warned": "wrong_subject" in codes,
        "forbidden_warned": "forbidden_subject" in codes,
        "unscored": (codes["subject_unscored"].get("detail") or {}).get("reason")
        if "subject_unscored" in codes else None,
    }


def kind(mime: str | None) -> str:
    return "clip" if (mime or "").startswith("video/") else "photo"


async def _read_only(session) -> None:
    from sqlalchemy import text

    await session.execute(text("SET TRANSACTION READ ONLY"))


async def _rows(session) -> list[dict]:
    from sqlalchemy import text

    await _read_only(session)
    return [dict(r) for r in (await session.execute(text(_SQL))).mappings().all()]


def _usable(row: dict) -> bool:
    s = row["subject"]
    return bool(s and s.get("domain")) and row["outcome"] in ("accepted", "rejected_subject")


def _counts(rows: list[dict]) -> None:
    c = Counter((r["outcome"], r["kind"]) for r in rows)
    print("captures by gate-1 outcome and kind:")
    for (o, k), n in sorted(c.items()):
        print(f"  {o:17} {k:5} {n}")
    usable = [r for r in rows if _usable(r)]
    print(f"usable (has a subject, accepted or rejected as wrong subject): {len(usable)}")
    print(f"  tasks: {len({r['task_id'] for r in usable})}"
          f"  accepted tasks: {len({r['task_id'] for r in usable if r['outcome'] == 'accepted'})}")
    print(f"  with subject_measured: {sum(1 for r in usable if r['mlkit']['measured'])}")
    print(f"  unscored on the phone: {sum(1 for r in usable if r['mlkit']['unscored'])}")
    print(f"  ML Kit warned wrong_subject: {sum(1 for r in usable if r['mlkit']['warned'])}")
    no_subject = sum(1 for r in rows if not (r["subject"] and r["subject"].get("domain")))
    print(f"no subject on the task (left out): {no_subject}")


async def _download(engine, rows: list[dict], files: Path) -> None:
    import httpx
    from sqlalchemy.ext.asyncio import AsyncSession

    from sourcehub.modules.storage import service as storage_svc
    from sourcehub.platform import storage

    files.mkdir(parents=True, exist_ok=True)
    ok = bad = failed = 0
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as http:
        async with AsyncSession(engine) as session, session.begin():
            await _read_only(session)
            for r in rows:
                dest = files / (str(r["id"]) + _EXT.get(r["mime_type"] or "", ".bin"))
                if dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest() == r["sha256"]:
                    ok += 1
                    r["file"] = dest.name
                    continue
                try:
                    target = await storage_svc.resolve_by_id(session, r["storage_target_id"])
                    url = await storage.presign_get(target, r["storage_key"], r["filename"] or dest.name)
                    resp = await http.get(url)
                    resp.raise_for_status()
                except Exception as e:  # noqa: BLE001
                    failed += 1
                    # the error class only: a message may carry the signed link
                    print(f"  {r['id']}: could not fetch ({type(e).__name__})")
                    continue
                if hashlib.sha256(resp.content).hexdigest() != r["sha256"]:
                    bad += 1
                    print(f"  {r['id']}: sha256 differs, not kept")
                    continue
                dest.write_bytes(resp.content)
                r["file"] = dest.name
                ok += 1
    print(f"files: {ok} ok, {bad} hash mismatch, {failed} failed")


async def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--counts-only", action="store_true")
    p.add_argument("--platform-provider", choices=["gcs", "azure_blob"],
                   help="where captures with no client destination were stored, if not STORAGE_PROVIDER")
    p.add_argument("--limit", type=int, help="download at most this many (a trial run)")
    p.add_argument("--out", type=Path, help="where manifest.jsonl and files/ go")
    args = p.parse_args()
    if args.platform_provider:
        os.environ["STORAGE_PROVIDER"] = args.platform_provider

    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

    from sourcehub.config import get_settings

    url = get_settings().database_admin_url
    if not url:
        sys.exit("DATABASE_ADMIN_URL is not set in backend/.env")
    engine = create_async_engine(url)
    async with AsyncSession(engine) as session, session.begin():
        rows = await _rows(session)
    for r in rows:
        r["outcome"] = outcome(r)
        r["kind"] = kind(r["mime_type"])
        r["mlkit"] = mlkit(r["check_results"])
    _counts(rows)
    if args.counts_only:
        await engine.dispose()
        return

    if not args.out:
        sys.exit("--out is required unless --counts-only")
    usable = [r for r in rows if _usable(r)][: args.limit]
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    await _download(engine, usable, out / "files")
    await engine.dispose()
    with (out / "manifest.jsonl").open("w", encoding="utf-8") as f:
        for r in usable:
            if not r.get("file"):
                continue
            f.write(json.dumps({
                "asset_id": str(r["id"]), "task_id": str(r["task_id"]), "task": r["reference_code"],
                "kind": r["kind"], "mime_type": r["mime_type"],
                "duration_s": float(r["duration_s"]) if r["duration_s"] is not None else None,
                "outcome": r["outcome"], "review_note": r["review_note"],
                "subject": r["subject"], "mlkit": r["mlkit"], "file": r["file"],
            }) + "\n")
    print(f"manifest: {out / 'manifest.jsonl'}")


if __name__ == "__main__":
    asyncio.run(main())
