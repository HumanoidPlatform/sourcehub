"""The dataset catalogue, driven through the real API.

list (with a file count) -> upload a sample -> submit -> (refused: seller
publishes) -> Ops publishes -> public page (samples only, no storage keys) ->
public quote request -> a client asks for 500 of the files -> the two chat ->
seller quotes for 500 -> client accepts -> seller marks it paid, then delivered
-> another delivery partner buys the whole dataset the same way -> seller
withdraws the listing; agreed deals stand.

The files themselves change hands outside the platform: nothing here downloads
a dataset, only its sample.

Needs the compose stack and the API (E2E_API, default :8000), and platform
storage reachable from this process with the same settings the API uses. The
sample goes to catalogue/<dataset id>/samples/ and is deleted at the end.
Every step asserts, and every negative check must be REFUSED.
"""

import asyncio
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
partner_buyer = login("partner@northstar.example")
admin = login("admin@sourcehub.local")
public = httpx.Client(base_url=B, timeout=T)

# 1 — the seller starts a listing and says how many files it holds
r = seller.post("/catalogue/datasets", json={"title": f"E2E street scenes {uuid.uuid4().hex[:4]}",
                                             "category": "image", "file_count": 3000})
r.raise_for_status()
ds = r.json()
DID, SLUG = ds["id"], ds["slug"]
assert ds["file_count"] == 3000
ok("seller started a draft of 3,000 files", SLUG)

# 2 — one sample, straight to storage
SAMPLE = b"\xff\xd8\xff sample bytes " + os.urandom(16)
r = seller.post(f"/catalogue/datasets/{DID}/upload-urls", json={"files": [{"filename": "sample.jpg"}]})
r.raise_for_status()
slot = r.json()[0]
put = httpx.put(slot["url"], content=SAMPLE, headers={**slot["headers"], "Content-Type": "image/jpeg"}, timeout=T)
assert put.status_code in (200, 201), put.text
r = seller.post(f"/catalogue/datasets/{DID}/samples",
                json={"uploads": [{"key": slot["key"], "filename": "sample.jpg", "content_type": "image/jpeg"}]})
r.raise_for_status()
samples = r.json()["samples"]
assert [s["filename"] for s in samples] == ["sample.jpg"] and samples[0]["size_bytes"] == len(SAMPLE)
ok("one sample uploaded and recorded", f"{samples[0]['size_bytes']} B")

r = seller.post(f"/catalogue/datasets/{DID}/samples",
                json={"uploads": [{"key": "catalogue/someone-else/samples/x.jpg"}]})
refused(r, 409)
ok("a key outside the dataset is REFUSED")

# 3 — not ready: no summary, no terms
refused(seller.post(f"/catalogue/datasets/{DID}/submit"), 409)
ok("submitting an incomplete listing is REFUSED")
seller.patch(f"/catalogue/datasets/{DID}", json={
    "summary": "Street-level photos, test listing",
    "permitted_uses": ["model_training", "research"],
    "licence_terms": "[Seller's licence terms]",
    "indicative_price_text": "From USD [x] per 1,000 images",
}).raise_for_status()
r = seller.post(f"/catalogue/datasets/{DID}/submit")
r.raise_for_status()
assert r.json()["status"] == "in_review"
ok("seller described it and submitted", r.json()["status"])

# 4 — only Ops publishes, and what buyers read is fixed in review
refused(seller.post(f"/catalogue/datasets/{DID}/approve"), 403)
ok("seller publishing its own listing is REFUSED")
refused(seller.patch(f"/catalogue/datasets/{DID}", json={"title": "Sneaky edit"}), 409)
refused(seller.patch(f"/catalogue/datasets/{DID}", json={"file_count": 9999}), 409)
ok("editing the text or the count in review is REFUSED")
r = admin.post(f"/catalogue/datasets/{DID}/approve")
r.raise_for_status()
assert r.json()["status"] == "published"
ok("Ops published it")

# 5 — the public page
lst = public.get("/public/catalogue").json()
assert any(d["slug"] == SLUG and d["file_count"] == 3000 for d in lst)
pd = public.get(f"/public/catalogue/{SLUG}").json()
assert [s["filename"] for s in pd["samples"]] == ["sample.jpg"]
assert "storage_key" not in repr(pd)
got = httpx.get(pd["samples"][0]["url"], timeout=T)
assert got.status_code == 200 and got.content == SAMPLE
ok("public page shows the count and the sample, and it downloads", f"{len(lst)} on sale")

refused(public.post(f"/public/catalogue/{SLUG}/leads", json={
    "name": "A", "email": "someone@gmail.com", "company": "Lab", "intended_use": "ab"}), 422)
r = public.post(f"/public/catalogue/{SLUG}/leads", json={
    "name": "A Buyer", "email": "buyer@lab.example", "company": "Lab Co", "intended_use": "evaluation"})
assert r.status_code == 201, r.text
ok("an incomplete lead is REFUSED; a complete one was received")

# the request is the seller's: it reads and marks it; Ops only read; nobody else sees it
lead = next(x for x in seller.get("/catalogue/leads").json() if x["dataset_slug"] == SLUG)
assert lead["email"] == "buyer@lab.example" and lead["status"] == "new"
assert any(x["id"] == lead["id"] for x in admin.get("/catalogue/leads").json())
assert not any(x["id"] == lead["id"] for x in partner_buyer.get("/catalogue/leads").json())
refused(admin.patch(f"/catalogue/leads/{lead['id']}", json={"status": "closed"}), 403, 404)
refused(partner_buyer.patch(f"/catalogue/leads/{lead['id']}", json={"status": "closed"}), 404)
refused(admin.post(f"/catalogue/leads/{lead['id']}/replies", json={"body": "hi"}), 403)
r = seller.post(f"/catalogue/leads/{lead['id']}/replies", json={"body": "Yes: USD [x] for 500."})
assert r.status_code == 201, r.text
assert r.json()["reply_to"] == "partner@helix.example"
lead = next(x for x in seller.get("/catalogue/leads").json() if x["id"] == lead["id"])
assert lead["status"] == "contacted" and lead["reply_count"] == 1
seller.patch(f"/catalogue/leads/{lead['id']}", json={"status": "closed"}).raise_for_status()
refused(seller.post(f"/catalogue/leads/{lead['id']}/replies", json={"body": "again"}), 409)
ok("the seller sees the request and replies by email from the platform; Ops only read it;"
   " another seller sees nothing; a closed request takes no reply")

# 6 — a client asks for 500 of the 3,000, and the two agree in the chat
refused(buyer.post(f"/catalogue/datasets/{DID}/deals",
                   json={"intended_use": "train", "requested_quantity": 5000}), 409)
r = buyer.post(f"/catalogue/datasets/{DID}/deals", json={
    "intended_use": "train a detector", "requested_uses": ["model_training"],
    "requested_quantity": 500, "message": "Could we take 500, daytime only?"})
r.raise_for_status()
DEAL = r.json()["id"]
assert r.json()["requested_quantity"] == 500
refused(buyer.post(f"/catalogue/datasets/{DID}/deals", json={"intended_use": "again"}), 409)
ok("client asked for 500 files; more than the listing holds, or a second open request, is REFUSED")
refused(seller.post(f"/catalogue/datasets/{DID}/deals", json={"intended_use": "my own"}), 409)
refused(other.get(f"/catalogue/deals/{DEAL}"), 404)
refused(other.get(f"/catalogue/deals/{DEAL}/messages"), 404)
ok("the seller cannot buy its own; another client cannot see the deal or its chat")
seller.post(f"/catalogue/deals/{DEAL}/messages", json={"body": "Yes: 500 daytime shots. USD 5,000."}).raise_for_status()
buyer.post(f"/catalogue/deals/{DEAL}/messages", json={"body": "Agreed."}).raise_for_status()
msgs = buyer.get(f"/catalogue/deals/{DEAL}/messages").json()
assert [m["seq"] for m in msgs] == [1, 2, 3]
refused(admin.post(f"/catalogue/deals/{DEAL}/messages", json={"body": "hi"}), 403, 409)
ok("buyer and seller chatted; Ops cannot post", f"{len(msgs)} messages")

# 7 — quote, accept, paid, delivered
refused(buyer.post(f"/catalogue/deals/{DEAL}/quote",
                   json={"amount": "1", "currency": "USD", "uses": ["model_training"]}), 403, 409)
r = seller.post(f"/catalogue/deals/{DEAL}/quote", json={
    "amount": "5000.00", "currency": "usd", "quantity": 500, "terms": "[Training only]", "uses": ["model_training"]})
r.raise_for_status()
assert r.json()["status"] == "quoted" and r.json()["quote_quantity"] == 500 and r.json()["currency"] == "USD"
ok("only the seller quotes", f"USD {r.json()['quote_amount']} for 500 files")
refused(seller.post(f"/catalogue/deals/{DEAL}/paid", json={}), 409)
r = buyer.post(f"/catalogue/deals/{DEAL}/accept")
r.raise_for_status()
assert r.json()["status"] == "accepted"
ok("marking paid before acceptance is REFUSED; the client accepted")
refused(seller.post(f"/catalogue/deals/{DEAL}/delivered"), 409)
refused(buyer.post(f"/catalogue/deals/{DEAL}/paid", json={}), 403, 409)
r = seller.post(f"/catalogue/deals/{DEAL}/paid", json={"invoice_number": "INV-E2E-1"})
r.raise_for_status()
assert r.json()["status"] == "paid" and r.json()["invoice_number"] == "INV-E2E-1"
r = seller.post(f"/catalogue/deals/{DEAL}/delivered")
r.raise_for_status()
assert r.json()["status"] == "delivered" and r.json()["delivered_at"]
ok("delivered before paid, or paid by the buyer, is REFUSED; the seller marked it paid, then delivered")

# 8 — another delivery partner buys the whole dataset the same way
r = partner_buyer.post(f"/catalogue/datasets/{DID}/deals",
                       json={"intended_use": "benchmark our QA", "requested_uses": ["research"]})
r.raise_for_status()
PDEAL = r.json()["id"]
assert r.json()["requested_quantity"] is None
seller.post(f"/catalogue/deals/{PDEAL}/quote", json={
    "amount": "12000.00", "currency": "USD", "uses": ["research"]}).raise_for_status()
partner_buyer.post(f"/catalogue/deals/{PDEAL}/accept").raise_for_status()
seller.post(f"/catalogue/deals/{PDEAL}/paid", json={}).raise_for_status()
r = seller.post(f"/catalogue/deals/{PDEAL}/delivered")
r.raise_for_status()
assert r.json()["status"] == "delivered" and r.json()["quote_quantity"] is None
ok("a delivery partner bought the whole dataset: asked, quoted, accepted, paid, delivered")

# 9 — listing a contract's captures is the partner's own call, on its own contract
refused(seller.post(f"/catalogue/contracts/{uuid.uuid4()}/list"), 404)
refused(buyer.post(f"/catalogue/contracts/{uuid.uuid4()}/list"), 404)
ok("listing an unknown or someone else's contract is NOT FOUND")

# 10 — off sale; agreed deals stand
r = seller.post(f"/catalogue/datasets/{DID}/withdraw", json={"reason": "end of the e2e run"})
r.raise_for_status()
assert not any(d["slug"] == SLUG for d in public.get("/public/catalogue").json())
assert buyer.get(f"/catalogue/deals/{DEAL}").json()["status"] == "delivered"
ok("seller withdrew the listing; it left the public page and the deals stand")

from sourcehub.platform import storage  # noqa: E402


async def _cleanup() -> None:
    await storage.delete(storage.platform_target(), slot["key"])

asyncio.run(_cleanup())
ok("deleted the uploaded sample from platform storage")
print("\nCATALOGUE LOOP OK")
