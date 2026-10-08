"""The dataset catalogue, driven through the real API.

list -> upload -> samples -> submit -> (refused: seller publishes) -> Ops
publishes -> public page (samples only, no storage keys) -> public quote
request -> client browses (samples only) -> asks for a quote -> seller quotes
-> client accepts -> licence awaiting payment (files still closed) -> seller
marks paid -> manifest and every file open -> seller withdraws a file -> the
client is told.

Needs the compose stack and the API (E2E_API, default :8000). Uploads go to
the platform's own storage under catalogue/<dataset id>/, and are deleted at
the end. Every step asserts, and every negative check must be REFUSED.
"""

import asyncio
import hashlib
import os
import uuid

import httpx

B = os.environ.get("E2E_API", "http://127.0.0.1:8000/api/v1")
T = 60
PW = "SourceHub#2026"


def login(email: str) -> httpx.Client:
    r = httpx.post(f"{B}/auth/login", json={"email": email, "password": PW}, timeout=T)
    r.raise_for_status()
    tok = r.json()["access_token"]
    return httpx.Client(base_url=B, headers={"Authorization": f"Bearer {tok}"}, timeout=T)


step = 0


def ok(label: str, detail: str = "") -> None:
    global step
    step += 1
    print(f"  {step:2d}. {label}" + (f"  ->  {detail}" if detail else ""))


def refused(r: httpx.Response, *codes: int) -> None:
    assert r.status_code in codes, f"expected {codes}, got {r.status_code}: {r.text}"


seller = login("partner@helix.example")
buyer = login("client@acme.example")
other = login("client@voltra.example")
admin = login("admin@sourcehub.local")
public = httpx.Client(base_url=B, timeout=T)

# 1 — the seller starts a listing
r = seller.post("/catalogue/datasets", json={"title": f"E2E street scenes {uuid.uuid4().hex[:4]}",
                                             "category": "image"})
r.raise_for_status()
ds = r.json()
DID, SLUG = ds["id"], ds["slug"]
ok("seller started a draft", SLUG)

# 2 — two files, straight to storage
files = {"sample.jpg": b"\xff\xd8\xff sample bytes " + os.urandom(16),
         "full.jpg": b"\xff\xd8\xff full bytes " + os.urandom(16)}
r = seller.post(f"/catalogue/datasets/{DID}/upload-urls",
                json={"files": [{"filename": n} for n in files]})
r.raise_for_status()
uploads = []
for u in r.json():
    body = files[u["filename"]]
    put = httpx.put(u["url"], content=body, headers={**u["headers"], "Content-Type": "image/jpeg"},
                    timeout=T)
    assert put.status_code in (200, 201), put.text
    uploads.append({"key": u["key"], "filename": u["filename"], "content_type": "image/jpeg",
                    "sha256": hashlib.sha256(body).hexdigest()})
r = seller.post(f"/catalogue/datasets/{DID}/items", json={"uploads": uploads})
r.raise_for_status()
items = {i["filename"]: i for i in r.json()["items"]}
assert set(items) == set(files) and all(i["size_bytes"] for i in items.values())
ok("two files uploaded and recorded", ", ".join(f"{k} {v['size_bytes']} B" for k, v in items.items()))

# a key outside the dataset is refused
r = seller.post(f"/catalogue/datasets/{DID}/items",
                json={"uploads": [{"key": "catalogue/someone-else/v1/x.jpg"}]})
refused(r, 409)
ok("a key outside the dataset is REFUSED")

# 3 — not ready: no summary, no terms, no sample
refused(seller.post(f"/catalogue/datasets/{DID}/submit"), 409)
ok("submitting an incomplete listing is REFUSED")

seller.put(f"/catalogue/datasets/{DID}/samples",
           json={"item_ids": [items["sample.jpg"]["id"]]}).raise_for_status()
seller.patch(f"/catalogue/datasets/{DID}", json={
    "summary": "Street-level photos, test listing",
    "permitted_uses": ["model_training", "research"],
    "licence_terms": "[Seller's licence terms]",
    "indicative_price_text": "From USD [x] per 1,000 images",
}).raise_for_status()
r = seller.post(f"/catalogue/datasets/{DID}/submit")
r.raise_for_status()
assert r.json()["status"] == "in_review"
ok("seller picked a sample and submitted", r.json()["status"])

# 4 — only Ops publishes
refused(seller.post(f"/catalogue/datasets/{DID}/approve"), 403)
ok("seller publishing its own listing is REFUSED")
refused(seller.patch(f"/catalogue/datasets/{DID}", json={"title": "Sneaky edit"}), 409)
ok("editing a listing in review is REFUSED")
q = admin.get("/catalogue/review").json()
assert any(d["id"] == DID and d["status"] == "in_review" for d in q)
r = admin.post(f"/catalogue/datasets/{DID}/approve")
r.raise_for_status()
assert r.json()["status"] == "published" and r.json()["versions"][0]["status"] == "final"
ok("Ops published it; version 1 is final", f"{r.json()['versions'][0]['item_count']} files")

# 5 — the public page
lst = public.get("/public/catalogue").json()
assert any(d["slug"] == SLUG for d in lst)
pd = public.get(f"/public/catalogue/{SLUG}").json()
assert [s["filename"] for s in pd["samples"]] == ["sample.jpg"]
assert "storage_key" not in repr(pd) and "catalogue/" + DID not in repr(pd).replace(pd["samples"][0]["url"], "")
got = httpx.get(pd["samples"][0]["url"], timeout=T)
assert got.status_code == 200 and got.content == files["sample.jpg"]
ok("public page shows the sample only, and it downloads", f"{len(lst)} on sale")

refused(public.post(f"/public/catalogue/{SLUG}/leads", json={
    "name": "A", "email": "someone@gmail.com", "company": "Lab", "intended_use": "eval"}), 422)
ok("a public quote request from a free-mail address is REFUSED")
r = public.post(f"/public/catalogue/{SLUG}/leads", json={
    "name": "A Buyer", "email": "buyer@lab.example", "company": "Lab Co", "intended_use": "evaluation"})
assert r.status_code == 201, r.text
assert any(l["dataset_slug"] == SLUG for l in admin.get("/catalogue/leads").json())
ok("a public quote request reached Ops")

# 6 — a client browses: samples only
d = buyer.get(f"/catalogue/datasets/by-slug/{SLUG}").json()
assert [i["filename"] for i in d["items"]] == ["sample.jpg"], d["items"]
refused(buyer.get(f"/catalogue/items/{items['full.jpg']['id']}/url"), 404)
ok("client sees the sample; the full file is NOT FOUND to it")

# 7 — quote, accept, pay
r = buyer.post(f"/catalogue/datasets/{DID}/deals",
               json={"intended_use": "train a detector", "requested_uses": ["model_training"]})
r.raise_for_status()
DEAL = r.json()["id"]
refused(buyer.post(f"/catalogue/datasets/{DID}/deals",
                   json={"intended_use": "again", "requested_uses": []}), 409)
ok("client asked for a quote; a second open request is REFUSED")
refused(seller.post(f"/catalogue/datasets/{DID}/deals",
                    json={"intended_use": "my own", "requested_uses": []}), 403)
refused(other.get(f"/catalogue/deals/{DEAL}"), 404)
ok("the seller cannot buy; another client cannot see the deal")
# A client holds catalogue.quote too (it may sell its own exclusive data), so
# this is refused by the service and the trigger, not the capability.
refused(buyer.post(f"/catalogue/deals/{DEAL}/quote",
                   json={"amount": "1", "currency": "USD", "uses": ["model_training"]}), 403, 409)
r = seller.post(f"/catalogue/deals/{DEAL}/quote", json={
    "amount": "5000.00", "currency": "usd", "terms": "[Training only]", "uses": ["model_training"]})
r.raise_for_status()
assert r.json()["status"] == "quoted" and r.json()["currency"] == "USD"
ok("only the seller quotes", f"{r.json()['currency']} {r.json()['quote_amount']}")
r = buyer.post(f"/catalogue/deals/{DEAL}/accept")
r.raise_for_status()
LIC = r.json()["licence_id"]
lic = buyer.get(f"/catalogue/licences/{LIC}").json()
assert lic["status"] == "awaiting_payment" and lic["amount"] == "5000.00"
refused(buyer.get(f"/catalogue/licences/{LIC}/manifest"), 409)
refused(buyer.post(f"/catalogue/licences/{LIC}/paid", json={}), 403, 409)
ok("client accepted; licence awaits payment and the files stay closed")
r = seller.post(f"/catalogue/licences/{LIC}/paid", json={"invoice_number": "INV-E2E-1"})
r.raise_for_status()
assert r.json()["status"] == "active"
man = buyer.get(f"/catalogue/licences/{LIC}/manifest")
man.raise_for_status()
rows = man.text.strip().splitlines()
assert len(rows) == 3 and hashlib.sha256(files["full.jpg"]).hexdigest() in man.text
full = buyer.get(f"/catalogue/items/{items['full.jpg']['id']}/url")
full.raise_for_status()
assert httpx.get(full.json()["url"], timeout=T).content == files["full.jpg"]
ok("seller marked it paid; manifest and every file open to the client", f"{len(rows) - 1} files")

# 8 — a file comes out of a sold version
r = seller.post(f"/catalogue/items/{items['full.jpg']['id']}/withdraw",
                json={"reason": "the person shown asked"})
r.raise_for_status()
refused(buyer.get(f"/catalogue/items/{items['full.jpg']['id']}/url"), 409)
lic = buyer.get(f"/catalogue/licences/{LIC}").json()
assert lic["withdrawn_count"] == 1 and lic["withdrawn_items"][0]["filename"] == "full.jpg"
bell = buyer.get("/notifications").json()
assert any("withdrawn" in (n.get("body") or "") for n in (bell if isinstance(bell, list) else bell.get("items", [])))
ok("seller withdrew a sold file; the client is told and the link closes")

# 9 — take the listing off sale and clean up the blobs this run wrote
r = seller.post(f"/catalogue/datasets/{DID}/withdraw", json={"reason": "end of the e2e run"})
r.raise_for_status()
assert not any(d["slug"] == SLUG for d in public.get("/public/catalogue").json())
assert buyer.get(f"/catalogue/licences/{LIC}").json()["status"] == "active"
ok("seller withdrew the listing; it left the public page and the licence stands")

from sourcehub.platform import storage  # noqa: E402

async def _cleanup() -> None:
    t = storage.platform_target()
    for u in uploads:
        await storage.delete(t, u["key"])

asyncio.run(_cleanup())
ok("deleted the uploaded test files from platform storage")
print("\nCATALOGUE LOOP OK")
