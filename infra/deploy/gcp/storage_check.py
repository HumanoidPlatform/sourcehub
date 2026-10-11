"""Go-live check for the platform's storage, run INSIDE the api container on a GCP VM.

The contract tests in backend/tests/test_storage_adapters.py, without pytest, so
it runs in the prod image as it is, with the VM's own keyless signing:

    docker compose --env-file stack.env exec -T api python - < storage_check.py

It writes only under _staging/storage-check/<uuid>/ and deletes what it writes.
Every line says PASS or FAIL; the exit code is the number of failures.
"""

from __future__ import annotations

import asyncio
import sys
import uuid

import httpx

from sourcehub.config import settings
from sourcehub.platform import storage

BODY = b"datamind360 storage check\n" * 16
FAILS = 0


def report(ok: bool, what: str, detail: str = "") -> None:
    global FAILS
    FAILS += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'}  {what}" + (f"  ({detail})" if detail else ""))


async def put(t: storage.StorageTarget, key: str, content_type: str) -> int:
    url, headers = await storage.presign_put(t, key)
    async with httpx.AsyncClient(timeout=30) as http:
        r = await http.put(url, content=BODY, headers={"Content-Type": content_type, **headers})
    return r.status_code


async def main() -> int:
    t = storage.platform_target()
    print(f"platform storage: provider={t.provider} bucket={t.bucket} "
          f"signing={'key' if t.secret else 'keyless'}")
    folder = f"_staging/storage-check/{uuid.uuid4()}"
    name = "my report #2 (final).pdf"
    key, odd, copied = f"{folder}/{name}", f"{folder}/दुकान शेल्फ़ फ़ोटो.jpg", f"{folder}/copied/{name}"

    try:
        await storage.verify(t)
        report(True, "verify: write, read back, sign, delete")
    except Exception as e:  # noqa: BLE001
        report(False, "verify", str(e))
        return FAILS

    status = await put(t, key, "application/pdf")
    report(status in (200, 201), "presigned PUT from outside the API", f"HTTP {status}")
    size, ctype = await storage.stat(t, key)
    report(size == len(BODY) and ctype == "application/pdf", "stored size and type", f"{size} {ctype}")

    url = await storage.presign_get(t, key, name)
    async with httpx.AsyncClient(timeout=30) as http:
        got = await http.get(url)
    report(got.status_code == 200 and got.content == BODY, "presigned GET returns the bytes", f"HTTP {got.status_code}")
    report(name in got.headers.get("content-disposition", ""), "download keeps the filename",
           got.headers.get("content-disposition", ""))

    status = await put(t, odd, "image/jpeg")
    report(status in (200, 201), "a non-ASCII object name signs and uploads", f"HTTP {status}")

    await storage.copy(t, key, copied)
    report((await storage.head(t, copied)).size == len(BODY), "server-side copy")

    for k in (key, odd, copied):
        await storage.delete(t, k)
    try:
        await storage.head(t, key)
        report(False, "deleted object is gone")
    except LookupError:
        report(True, "deleted object is gone (LookupError)")
    await storage.delete(t, key)
    report(True, "deleting what is already gone succeeds")
    return FAILS


if __name__ == "__main__":
    if settings.storage_provider != "gcs":
        print("STORAGE_PROVIDER is not gcs here; this check is for the Google Cloud VMs.")
    sys.exit(asyncio.run(main()))
