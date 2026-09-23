"""The prototype's full transaction loop, driven through the real API.

publish -> propose (x2) -> award -> assign -> loan -> submit -> QA fail ->
resubmit -> QA pass -> [invite worker -> assign units -> capture straight to
storage -> gate 1 -> bundle -> gate 2] -> deliver -> approve+rate -> money settles.

Needs the compose stack (Postgres, MinIO, Mailpit) and the API on :8000.

Every step asserts, and every negative check must be REFUSED.
"""

import os

import httpx

B = "http://127.0.0.1:8000/api/v1"
# httpx defaults to 5s, which is fine against a local stack and not against a
# database on a remote VM: argon2id hashing plus the round trip puts a single
# login at about that. The per-session clients below already pass 30; these are
# the calls made before there is a session to hang it on.
T = 60
PW = "SourceHub#2026"


def login(email: str) -> httpx.Client:
    r = httpx.post(f"{B}/auth/login", json={"email": email, "password": PW}, timeout=T)
    r.raise_for_status()
    tok = r.json()["access_token"]
    c = httpx.Client(base_url=B, headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    c.org_name = r.json()["org_name"]
    return c


step = 0
def ok(label: str, detail: str = ""):
    global step
    step += 1
    print(f"  {step:2d}. {label}" + (f"  ->  {detail}" if detail else ""))


client = login("client@acme.example")
northstar = login("partner@northstar.example")
meridian = login("partner@meridian.example")
agg = login("crowd@bengaluru.example")
sponsor = login("ops@optigear.example")
admin = login("admin@sourcehub.local")

# 0 — the client says where captured data should be delivered.
#
# A published request needs a destination that has actually been written to, so
# this comes first. Locally the client's "own" bucket is the same MinIO the
# platform runs, reached with the dev credentials — which still exercises the
# real path end to end: resolve per contract, presign against that destination,
# stamp the asset with it.
#
# Reused if it is already there. A destination is unique per client by name, so
# a second run of this script would otherwise collide with its own first run.
DEST_LABEL = "Acme capture bucket"
dest = next(
    (t for t in client.get("/storage-targets").json() if t["label"] == DEST_LABEL), None
)
if dest is None:
    # Azure Blob, because storage_target_azure_only says a client destination
    # can be nothing else. There is no MinIO fallback: the constraint is the
    # point, and a loop that exercised a provider the platform refuses would
    # be testing a path no client can take.
    account = os.environ.get("STORAGE_ACCOUNT_NAME", "")
    key = os.environ.get("STORAGE_ACCOUNT_KEY", "")
    if not account or not key:
        raise SystemExit(
            "This loop delivers to a real Azure container. Set STORAGE_ACCOUNT_NAME "
            "and STORAGE_ACCOUNT_KEY (backend/.env is read by the API, not by this "
            "script — export them, or run with them in the environment)."
        )
    made = client.post("/storage-targets", json={
        "label": DEST_LABEL,
        "provider": "azure_blob",
        "bucket": os.environ.get("STORAGE_CONTAINER", "platform"),
        "key_prefix": "e2e/",
        "secret": {"account_name": account, "account_key": key},
    })
    assert made.status_code == 201, made.text
    dest = made.json()
ok("client names a destination", f"{dest['label']} -> {dest['bucket']}/{dest['key_prefix']}")

# 1 — client publishes a request
r = client.post("/requests", json={
    "title": "Retail shelf imagery across 12 metro markets",
    "category": "image",
    "geography": "United States - 12 metro areas",
    "target_quantity": 25000,
    "target_unit": "photos",
    "capture_spec": {"media": ["photo"], "min_megapixels": 12, "require_gps": True},
    "objective": "Train a shelf-recognition model across our top 12 markets.",
    "use_case": "ai_training",
    "countries": ["US"],
    "location_type": "retail_interior",
    "people_in_frame": "none",
    "lawful_basis": "not_personal_data",
    "permitted_uses": ["model_training"],
    "spec_quality": "Sharp, no glare, full shelf in frame",
    "acceptance": "95% or better pass on the blur check; 5% manual audit",
    "compliance_notes": "No shoppers or faces in frame.",
    "people_headcount": 180,
    "budget_min": 60000, "budget_max": 85000,
    "starts_on": "2026-09-07", "delivery_due_on": "2026-11-15",
    "storage_target_id": dest["id"],
    "publish": True,
})
assert r.status_code == 201, r.text
req = r.json()
ok("client publishes", f"{req['reference_code']} {req['status']}")

# 2 — both tenants see it and bid
opps = northstar.get("/opportunities").json()
assert any(o["id"] == req["id"] for o in opps), "tenant cannot see the opportunity"
ok("tenant sees opportunity", f"{len(opps)} open")

p1 = northstar.post(f"/requests/{req['id']}/proposals", json={
    "price": 72500, "duration_days": 64,
    "methodology": "820-strong Bengaluru crowd plus Vertex crews for flagship stores.",
    "notes": "Can start 3 days after award.",
})
assert p1.status_code == 201, p1.text
p1 = p1.json()
ok("NorthStar proposes", f"{p1['reference_code']} at {p1['price']}")

p2 = meridian.post(f"/requests/{req['id']}/proposals", json={
    "price": 81000, "duration_days": 70,
    "methodology": "Manila field ops with certified shelf auditors.",
}).json()
ok("Meridian proposes", f"{p2['reference_code']} at {p2['price']}")

# negative: a tenant must never see a competitor's bid
seen = northstar.get(f"/requests/{req['id']}").json()["proposals"]
assert all(x["partner_org_id"] != p2["partner_org_id"] for x in seen), "COMPETITOR BID LEAKED"
ok("competitor's bid invisible to rival", f"NorthStar sees {len(seen)} proposal(s)")

# client sees both
seen = client.get(f"/requests/{req['id']}").json()
assert len(seen["proposals"]) == 2 and seen["status"] == "proposals_received"
ok("client compares both", f"status={seen['status']}")

# 3 — award to NorthStar
r = client.post(f"/proposals/{p1['id']}/award")
assert r.status_code == 200, r.text
contract = r.json()
assert contract["status"] == "active"
ok("awarded", f"{contract['reference_code']} value {contract['value']}")

# sibling auto-rejected
mine = meridian.get("/proposals/mine").json()
assert mine[0]["status"] == "rejected"
ok("rival auto-rejected and notified")

# milestone invoice exists, pending, 50%
inv = client.get("/invoices").json()
assert any(i["kind"].startswith("Milestone") and i["status"] == "pending" for i in inv), inv
ok("milestone invoice raised", f"{inv[0]['kind']} {inv[0]['amount']} {inv[0]['status']}")

# 3b — the partner can now see its counterparty, but not its counterparty's terms.
#
# The award above is what makes the client visible to northstar at all
# (org_visible_via_contract, db/100_rls.sql). RLS decides WHICH organisations come
# back; it says nothing about which columns. GET /organisations/{id} withholds the
# plan, the DPA and the billing status from anyone but Ops and the org itself — and
# the LIST used to hand all three to every authenticated caller, because it never
# passed claims down to the redaction.
COMMERCIAL = ("plan", "dpa_signed", "dpa_signed_at")

seen = northstar.get("/organisations", params={"kind": "client"}).json()
acme = next(o for o in seen if o["reference_code"] == "CL-01")
assert "billing_status" not in acme, acme
assert not (set(acme["profile"]) & set(COMMERCIAL)), acme["profile"]
ok("partner sees the client, not its commercials", f"profile keys={sorted(acme['profile'])}")

# ...and Ops still sees all of it, or the redaction has simply broken the screen.
as_ops = next(o for o in admin.get("/organisations", params={"kind": "client"}).json()
              if o["reference_code"] == "CL-01")
assert "billing_status" in as_ops, as_ops
assert "plan" in as_ops["profile"], as_ops["profile"]
ok("Ops still sees the commercials", f"plan={as_ops['profile']['plan']}")

# the org the caller owns is its own business, listed or not
own = next(o for o in client.get("/organisations", params={"kind": "client"}).json()
           if o["reference_code"] == "CL-01")
assert "billing_status" in own and "plan" in own["profile"], own
ok("a client still sees its own commercials")

# 4 — partner breaks the contract into a task for its aggregator
aggs = northstar.get("/organisations", params={"kind": "aggregator"}).json()
ag1 = next(a for a in aggs if a["reference_code"] == "AG-01")
r = northstar.post(f"/contracts/{contract['id']}/tasks", json={
    "assignee_org_id": ag1["id"],
    "title": "Metro shelf capture, wave 1",
    "target": "12,500 images",
    "due_on": "2026-10-04",
    "subject": {"domain": "retail shelf", "must_show": ["shelf", "products", "price tags"],
                "must_not_show": ["person", "selfie", "screenshot"]},
})
assert r.status_code == 201, r.text
task = r.json()
ok("task assigned to aggregator", f"{task['reference_code']} -> {task['assignee_name']}")
# the subject is merged INTO the inherited spec; it must not replace it
assert task["capture_spec"]["subject"]["domain"] == "retail shelf", task["capture_spec"]
assert task["capture_spec"]["media"] == ["photo"] and task["capture_spec"]["require_gps"] is True, task["capture_spec"]
ok("task carries the subject and still the client's media/gps answers")

# negative: Meridian must not be able to assign into NorthStar's contract
r = meridian.post(f"/contracts/{contract['id']}/tasks", json={
    "assignee_org_id": ag1["id"], "title": "hijack"})
assert r.status_code in (404, 409), f"RIVAL COULD TOUCH CONTRACT: {r.status_code}"
ok("rival cannot assign into the contract", f"HTTP {r.status_code}")

# 5 — the aggregator borrows helmet cameras
equipment = agg.get("/network/equipment").json()
helmet = next(e for e in equipment if "Helmet" in e["equipment_type"])
# earlier runs leave their loans open; the sponsor takes the cameras back first
for prior in sponsor.get("/network/loans").json():
    if prior["equipment_ref"] == helmet["reference_code"] and prior["status"] in ("approved", "issued", "overdue"):
        sponsor.post(f"/network/loans/{prior['id']}/decide", json={"decision": "returned"})
r = agg.post("/network/loans", json={
    "equipment_id": helmet["id"], "units": 40,
    "needed_by": "2026-09-05", "task_id": task["id"],
    "note": "Shelf capture, 8-week loan.",
})
assert r.status_code == 201, r.text
loan = r.json()
ok("loan requested", f"{loan['reference_code']} 40 units")

r = sponsor.post(f"/network/loans/{loan['id']}/decide", json={"decision": "approved"})
assert r.status_code == 200, r.text
ok("sponsor approves loan")

# negative: over-lending must be refused by the stock trigger
r = agg.post("/network/loans", json={"equipment_id": helmet["id"], "units": 999})
lid = r.json()["id"]
r = sponsor.post(f"/network/loans/{lid}/decide", json={"decision": "approved"})
assert r.status_code == 409, f"OVER-LEND ALLOWED: {r.status_code} {r.text}"
ok("over-lending refused", r.json()["detail"][:60])

# 6 — start, submit; partner fails it; resubmit; partner passes
agg.post(f"/tasks/{task['id']}/start")
r = agg.post(f"/tasks/{task['id']}/submit", json={
    "asset_count": 34, "note": "Rain hit 6 of 8 nights; coverage complete."})
assert r.status_code == 200, r.text
ok("supplier submits attempt 1", "34 assets")

queue = northstar.get("/qa/queue").json()
assert len(queue) == 1
sub_id = queue[0]["submission_id"]

# blank rejection must be refused
r = northstar.post(f"/qa/submissions/{sub_id}/decide", json={"outcome": "fail"})
assert r.status_code == 409
ok("blank QA rejection refused")

r = northstar.post(f"/qa/submissions/{sub_id}/decide", json={
    "outcome": "fail", "note": "Glare on 12 frames; reshoot aisles 3-5."})
assert r.status_code == 200, r.text
ok("QA fails attempt 1 with a note")

r = agg.post(f"/tasks/{task['id']}/submit", json={
    "asset_count": 36, "note": "Aisles 3-5 reshot with polarising filters."})
assert r.status_code == 200, r.text
ok("supplier resubmits attempt 2", "36 assets")

sub2 = northstar.get("/qa/queue").json()[0]["submission_id"]
r = northstar.post(f"/qa/submissions/{sub2}/decide", json={"outcome": "pass", "note": "Clean."})
assert r.status_code == 200 and r.json()["task_status"] == "qa_passed"
ok("QA passes attempt 2")

# both attempts survive in the trail
reviews = northstar.get(f"/tasks/{task['id']}/reviews").json()
assert len(reviews) == 2, reviews
ok("both attempts kept in the trail", f"{len(reviews)} reviews")

# 6b — the field half: a second task, split among crowd workers on the phone.
#      Task 1 above keeps the legacy path (a supplier states its own count);
#      task 2 runs the worker flow: invite -> assign -> capture -> gate 1 ->
#      bundle -> gate 2. Every negative check must be REFUSED.
import datetime as dt
import hashlib
import re
import time
import uuid

MP = "http://localhost:8025/api/v1"


def invitation_token(email: str) -> str:
    return mail_token(email, "invited")


def mail_token(email: str, subject_contains: str) -> str:
    """A link token, read from a LOCAL MAIL CATCHER.

    The token exists in exactly two places: the hash in `invitation`, and the
    link in the recipient's mailbox. There is no third copy to look up, which
    is the point of it.

    So this only works while the API is pointed at a local catcher that exposes
    the messages over HTTP. With a real provider configured (SMTP_HOST=
    smtp.gmail.com and an app password) the mail leaves the machine and this
    cannot see it — run the script against a catcher, or drive the invitation
    by hand from the address it was sent to.
    """
    for _ in range(60):
        msgs = httpx.get(f"{MP}/search", params={"query": f"to:{email}"}).json()["messages"]
        msgs = [m for m in msgs if subject_contains.lower() in m["Subject"].lower()]
        if msgs:
            body = httpx.get(f"{MP}/message/{msgs[0]['ID']}").json()["Text"]
            m = re.search(r"token=([A-Za-z0-9_\-]+)", body)
            if m:
                return m.group(1)
        time.sleep(0.25)
    raise AssertionError(
        f"No mail matching {subject_contains!r} for {email} at the local catcher ({MP}). "
        "A real SMTP_HOST means the mail left the machine and cannot be read back."
    )


def invite_and_login(name: str, email: str):
    r = agg.post("/network/workers", json={
        "display_name": name, "email": email, "skills": ["shelf_capture"], "trained": True})
    assert r.status_code == 201, r.text
    w = r.json()
    assert w["invitation_status"] == "pending" and w["user_id"], w
    tok = invitation_token(email)
    r = httpx.post(f"{B}/auth/invitation/accept", json={"token": tok, "password": PW},
                   timeout=T)
    assert r.status_code == 204, r.text
    return w, login(email)


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def capture(worker, assignment_id, name, blob, *, claim=None):
    """presign -> PUT straight to storage -> confirm. Returns (presign, asset)."""
    r = worker.post(f"/assignments/{assignment_id}/assets/presign", json={
        "filename": name, "content_type": "image/jpeg", "size_bytes": claim or len(blob),
        "sha256": hashlib.sha256(blob).hexdigest(), "captured_at": now_iso(),
        "lat": 12.9716, "lon": 77.5946})
    assert r.status_code == 200, r.text
    p = r.json()
    put = httpx.put(p["url"], content=blob, headers=p["headers"], timeout=30)
    # 201 is Azure: a block blob PUT answers Created where S3 and MinIO answer
    # 200. The destination is Azure now, so all three stay accepted rather than
    # pinning the test to one provider's choice of success code.
    assert put.status_code in (200, 201, 204), \
        f"PUT to storage failed: {put.status_code} {put.text}"
    r = worker.post(f"/assets/{p['asset_id']}/confirm")
    assert r.status_code == 200, r.text
    return p, r.json()


suffix = uuid.uuid4().hex[:8]
w1_email = f"worker-{suffix}-a@bengaluru.example"
w2_email = f"worker-{suffix}-b@bengaluru.example"

r = northstar.post(f"/contracts/{contract['id']}/tasks", json={
    "assignee_org_id": ag1["id"],
    "title": "Metro shelf capture, wave 2",
    "target": "4 photos", "target_quantity": 4, "target_unit": "photos",
    "instructions": "Full shelf in frame, no shoppers, landscape.",
    "capture_spec": {"media": "photo", "require_gps": True},
    "due_on": "2026-10-11",
})
assert r.status_code == 201, r.text
task2 = r.json()
assert task2["target_quantity"] == 4 and task2["assignment_summary"]["total"] == 0, task2
ok("second task, countable", f"{task2['reference_code']} target {task2['target_quantity']} {task2['target_unit']}")

w1, worker1 = invite_and_login("Priya Nair", w1_email)
ok("worker invited by email, accepted, signed in", w1["reference_code"])

r = agg.post("/network/workers", json={"display_name": "Duplicate", "email": w1_email})
assert r.status_code == 409, f"DUPLICATE EMAIL ACCEPTED: {r.status_code} {r.text}"
ok("duplicate worker email refused")

me = worker1.get("/auth/me").json()
assert me["role"] == "worker", me
assert "asset.upload" in me["capabilities"] and "task.submit" not in me["capabilities"], me
ok("worker role carries only worker capabilities", f"{len(me['capabilities'])} capabilities")

roster = agg.get("/network/workers").json()
assert next(w for w in roster if w["id"] == w1["id"])["invitation_status"] == "accepted", roster
r = agg.post(f"/network/workers/{w1['id']}/resend-invitation")
assert r.status_code == 409, f"RESENT AN ACCEPTED INVITATION: {r.status_code}"
ok("roster shows the invitation accepted; resend refused")

r = agg.post(f"/tasks/{task2['id']}/assignments", json={
    "worker_user_id": w1["user_id"], "quantity": 3, "instructions": "Aisles 1-2."})
assert r.status_code == 201, r.text
a1 = r.json()
assert a1["status"] == "assigned" and a1["assets"]["total"] == 0 and a1["worker_name"] == "Priya Nair", a1
ok("aggregator assigns 3 units to the worker", a1["task"]["reference_code"])

w2, worker2 = invite_and_login("Sana Kulkarni", w2_email)
r = agg.post(f"/tasks/{task2['id']}/assignments", json={"worker_user_id": w2["user_id"], "quantity": 2})
assert r.status_code == 409, f"OVER-ASSIGNMENT ALLOWED: {r.status_code} {r.text}"
ok("assigning beyond the task target refused", r.json()["detail"][:52])

delhi = login("crowd@delhi.example")
r = delhi.post(f"/tasks/{task2['id']}/assignments", json={"worker_user_id": w1["user_id"], "quantity": 1})
assert r.status_code == 404, f"RIVAL AGGREGATOR COULD ASSIGN: {r.status_code} {r.text}"
ok("rival aggregator cannot see the task", f"HTTP {r.status_code}")

mine = worker1.get("/me/assignments").json()
assert len(mine) == 1 and mine[0]["id"] == a1["id"] and mine[0]["status"] == "assigned", mine
ok("worker sees exactly their own assignment", mine[0]["task"]["title"])

r = worker1.post(f"/assignments/{a1['id']}/submit", json={})
assert r.status_code == 409, r.text
ok("submit before start refused")

r = worker1.post(f"/assignments/{a1['id']}/start")
assert r.status_code == 200 and r.json()["status"] == "in_progress", r.text
t2 = next(t for t in agg.get("/tasks").json() if t["id"] == task2["id"])
assert t2["status"] == "in_progress", t2
ok("worker starts; the task moves to in progress")

blob1 = b"\xff\xd8\xff" + b"shelf-01" * 512
blob2 = b"\xff\xd8\xff" + b"shelf-02" * 700
p1a, row1 = capture(worker1, a1["id"], "shelf-01.jpg", blob1)
assert row1["status"] == "ready" and row1["size_bytes"] == len(blob1) and row1["etag"], row1
p1b, row2 = capture(worker1, a1["id"], "shelf-02.jpg", blob2)
assert row2["status"] == "ready", row2
ok("two photos presigned, PUT straight to storage, confirmed ready")

r = worker1.post(f"/assignments/{a1['id']}/assets/presign", json={
    "filename": "shelf-01.jpg", "content_type": "image/jpeg", "size_bytes": len(blob1),
    "sha256": hashlib.sha256(blob1).hexdigest(), "captured_at": now_iso()})
assert r.status_code == 200 and r.json()["asset_id"] == p1a["asset_id"], r.text
assert r.json()["status"] == "ready" and r.json()["url"] is None
ok("re-presigning the same file returns the same asset, no duplicate")

r = worker1.post(f"/assignments/{a1['id']}/assets/presign", json={
    "filename": "shelf-03.jpg", "content_type": "image/jpeg", "size_bytes": 10,
    "sha256": "0" * 64, "captured_at": now_iso()})
assert r.status_code == 200, r.text
stranded = r.json()["asset_id"]
r = worker1.post(f"/assets/{stranded}/confirm")
assert r.status_code == 409, f"CONFIRMED WITHOUT AN UPLOAD: {r.status_code} {r.text}"
ok("confirm before upload refused")

# That presign holds a slot: the quota counts what has been claimed, not only
# what arrived. Taking the bad shot back is the worker's own escape hatch, and
# without it the assignment is full at three with two usable photos.
r = worker1.delete(f"/assets/{stranded}")
assert r.status_code == 204, f"COULD NOT DISCARD A STRANDED CAPTURE: {r.status_code} {r.text}"
ok("a presigned-but-never-uploaded capture can be discarded")

r = worker1.post(f"/assignments/{a1['id']}/assets/presign", json={
    "filename": "payload.exe", "content_type": "application/octet-stream", "size_bytes": 10,
    "sha256": "1" * 64, "captured_at": now_iso()})
assert r.status_code == 422, f"NON-MEDIA FILE ACCEPTED: {r.status_code} {r.text}"
ok("non-media file refused")

blob3 = b"\xff\xd8\xff" + b"shelf-lie" * 300
_, lie = capture(worker1, a1["id"], "shelf-lie.jpg", blob3, claim=len(blob3) + 5)
assert lie["status"] == "quarantined", lie
ok("size mismatch quarantined, not trusted", lie["quarantine_reason"][:44])

# A quarantined shot still occupies one of the three the worker promised, so
# the way out is the same as in the field: throw it away and take it again.
r = worker1.delete(f"/assets/{lie['id']}")
assert r.status_code == 204, f"COULD NOT DISCARD A QUARANTINED CAPTURE: {r.status_code} {r.text}"
blob4 = b"\xff\xd8\xff" + b"shelf-retake" * 300
_, retake = capture(worker1, a1["id"], "shelf-03-retake.jpg", blob4)
assert retake["status"] == "ready", retake
ok("quarantined shot discarded and retaken", "3 ready")

r = worker1.post(f"/assignments/{a1['id']}/submit", json={"note": "Aisles 1-2 done."})
assert r.status_code == 200 and r.json()["status"] == "submitted", r.text
assert r.json()["assets"]["ready"] == 3, r.json()["assets"]
ok("worker submits the assignment", "3 ready")

r = worker1.post(f"/tasks/{task2['id']}/submit", json={})
assert r.status_code == 403, f"WORKER COULD SUBMIT THE TASK: {r.status_code}"
ok("worker cannot submit the task itself", f"HTTP {r.status_code}")

assert worker2.get("/me/assignments").json() == []
for path in (f"/assignments/{a1['id']}", f"/assignments/{a1['id']}/assets",
             f"/assets/{p1a['asset_id']}/url", f"/contracts/{contract['id']}",
             f"/tasks/{task2['id']}/assets"):
    r = worker2.get(path)
    assert r.status_code == 404, f"WORKER ISOLATION LEAK on {path}: {r.status_code}"
for path in ("/contracts", "/tasks"):
    assert worker2.get(path).status_code == 403, path
assert worker2.post(f"/assignments/{a1['id']}/start").status_code == 404
ok("a sibling worker sees none of it")

bell = worker1.get("/notifications").json()["items"]
assert bell and all(n["link_page"] == "assignment" for n in bell), bell
ok("worker's bell carries only rows addressed to them", f"{len(bell)} item(s)")

q = [x for x in agg.get("/qa/gate1").json() if x["assignment_id"] == a1["id"]]
assert len(q) == 1 and q[0]["ready_assets"] == 3, q
ok("gate-1 queue shows the batch", f"{q[0]['worker_name']}, {q[0]['ready_assets']} ready")

r = agg.post(f"/assignments/{a1['id']}/decide", json={"outcome": "reject"})
assert r.status_code == 409, r.text
ok("blank gate-1 rejection refused")

r = agg.post(f"/tasks/{task2['id']}/submit", json={})
assert r.status_code == 409, f"TASK SUBMITTED WITH AN OPEN ASSIGNMENT: {r.status_code} {r.text}"
ok("task cannot go to the partner before gate 1", r.json()["detail"][:40])

r = agg.post(f"/assignments/{a1['id']}/decide", json={
    "outcome": "reject", "note": "Retake 2 with less glare."})
assert r.status_code == 200 and r.json()["assignment_status"] == "rejected", r.text
mine = worker1.get("/me/assignments").json()[0]
assert mine["status"] == "rejected" and "glare" in mine["decision_note"], mine
ok("gate 1 rejects with a note the worker can read")

assert worker1.post(f"/assignments/{a1['id']}/start").json()["status"] == "in_progress"
# Rework replaces a shot, it does not add a fourth: the assignment is still for
# three. The glary one goes, then the retake takes its place.
r = worker1.delete(f"/assets/{p1a['asset_id']}")
assert r.status_code == 204, f"COULD NOT DISCARD DURING REWORK: {r.status_code} {r.text}"
capture(worker1, a1["id"], "shelf-04.jpg", b"\xff\xd8\xff" + b"shelf-04" * 400)
r = worker1.post(f"/assignments/{a1['id']}/submit", json={"note": "Retaken."})
assert r.status_code == 200 and r.json()["assets"]["ready"] == 3, r.text
ok("worker reworks and resubmits", "3 ready")

r = agg.post(f"/assignments/{a1['id']}/decide", json={"outcome": "accept"})
assert r.status_code == 200 and r.json()["assignment_status"] == "accepted", r.text
ok("gate 1 accepts")

r = agg.post(f"/tasks/{task2['id']}/submit", json={"note": "Wave 2 complete."})
assert r.status_code == 200, r.text
assert r.json()["last_submission"]["asset_count"] == 3, r.json()["last_submission"]
ok("aggregator bundles the accepted captures into the submission", "asset_count 3, derived")

assets = northstar.get(f"/tasks/{task2['id']}/assets").json()
assert len(assets) == 3 and all(a["status"] == "ready" for a in assets), assets
# The retake, not the first shot: that one was discarded during rework above.
url = northstar.get(f"/assets/{retake['id']}/url").json()["url"]
got = httpx.get(url, timeout=30)
assert got.status_code == 200 and got.content == blob4, got.status_code
ok("partner views the originals through a signed inline URL", f"{len(got.content)} bytes match")

sub3 = next(x for x in northstar.get("/qa/queue").json() if x["task_id"] == task2["id"])
assert sub3["asset_count"] == 3, sub3
r = northstar.post(f"/qa/submissions/{sub3['submission_id']}/decide",
                   json={"outcome": "pass", "note": "Clean."})
assert r.status_code == 200 and r.json()["task_status"] == "qa_passed", r.text
ok("gate 2 passes the bundled submission")

gates = [x["gate"] for x in northstar.get(f"/tasks/{task2['id']}/reviews").json()]
assert gates.count("gate1_supplier") == 2 and gates.count("gate2_partner") == 1, gates
ok("trail holds both gate-1 verdicts and the gate-2 pass")

assert client.get(f"/tasks/{task2['id']}/assignments").json() == []
assert len(client.get(f"/tasks/{task2['id']}/assets").json()) == 3
ok("client sees the captures but never the roster")


# 6c — the offer path: the task put to the whole crowd by email, first come
#      first served. Every accept must become an ordinary assignment; every
#      accept past the limit must be REFUSED with "closed".
from concurrent.futures import ThreadPoolExecutor

w3_email = f"worker-{suffix}-c@bengaluru.example"
w3, worker3 = invite_and_login("Arjun Rao", w3_email)
crowd = [w1["user_id"], w2["user_id"], w3["user_id"]]


def new_task(title: str, target: int) -> dict:
    r = northstar.post(f"/contracts/{contract['id']}/tasks", json={
        "assignee_org_id": ag1["id"], "title": title,
        "target": f"{target} photos", "target_quantity": target, "target_unit": "photos",
        "instructions": "Full shelf in frame.", "due_on": "2026-10-11",
    })
    assert r.status_code == 201, r.text
    return r.json()


def offer_token(email: str) -> str:
    return mail_token(email, "offering you a task")


def preview(tok: str) -> httpx.Response:
    return httpx.get(f"{B}/offers/{tok}", timeout=T)


def respond(tok: str, action: str) -> httpx.Response:
    return httpx.post(f"{B}/offers/{tok}/respond", json={"action": action}, timeout=T)


task3 = new_task("Metro shelf capture, wave 3", 6)

r = agg.post(f"/tasks/{task3['id']}/offers", json={
    "worker_limit": 4, "quantity": 2, "recipient_user_ids": crowd})
assert r.status_code == 409, f"OVER-BUDGET OFFER ACCEPTED: {r.status_code} {r.text}"
ok("offer beyond the task target refused", r.json()["detail"][:60])

r = agg.post(f"/tasks/{task3['id']}/offers", json={
    "worker_limit": 1, "quantity": 2, "recipient_user_ids": crowd,
    "respond_by": "2020-01-01T00:00:00Z"})
assert r.status_code == 409, f"PAST RESPOND-BY ACCEPTED: {r.status_code}"
ok("offer with a respond-by in the past refused")

r = delhi.post(f"/tasks/{task3['id']}/offers", json={"worker_limit": 1, "quantity": 1})
assert r.status_code == 404, f"RIVAL AGGREGATOR COULD OFFER: {r.status_code} {r.text}"
ok("rival aggregator cannot offer the task", f"HTTP {r.status_code}")

r = agg.post(f"/tasks/{task3['id']}/offers", json={
    "worker_limit": 2, "quantity": 2, "recipient_user_ids": crowd,
    "instructions": "Aisles 3-4, landscape."})
assert r.status_code == 201, r.text
offer = r.json()
assert offer["status"] == "open" and offer["worker_limit"] == 2 and offer["accepted_count"] == 0, offer
assert len(offer["recipients"]) == 3 and all(x["sent_at"] and not x["send_error"] for x in offer["recipients"]), offer
assert "token" not in r.text, "TOKEN LEAKED IN THE RESPONSE"
ok("task offered to 3 workers for 2 places", f"{offer['worker_limit']} x {offer['quantity']} photos, all emailed")

r = agg.post(f"/tasks/{task3['id']}/offers", json={"worker_limit": 1, "quantity": 1})
assert r.status_code == 409, f"SECOND OPEN OFFER ALLOWED: {r.status_code} {r.text}"
ok("a second open offer on the same task refused")

t1, t2, t3 = (offer_token(e) for e in (w1_email, w2_email, w3_email))
pv = preview(t2)
assert pv.status_code == 200 and pv.json()["state"] == "open", pv.text
assert pv.json()["task"]["reference_code"] == task3["reference_code"] and pv.json()["quantity"] == 2, pv.text
assert preview(t2).json() == pv.json()
ok("worker's link previews the offer, twice, with no side effect", pv.json()["state"])

r = respond(t2, "decline")
assert r.status_code == 200 and r.json()["state"] == "declined", r.text
r = respond(t2, "decline")
assert r.status_code == 409, f"SECOND ANSWER ACCEPTED: {r.status_code} {r.text}"
assert preview(t2).json()["state"] == "responded"
ok("worker 2 declines; a second answer refused")

r = respond(t1, "accept")
assert r.status_code == 200 and r.json()["state"] == "accepted" and r.json()["assignment_id"], r.text
a3 = r.json()["assignment_id"]
mine = worker1.get("/me/assignments").json()
m3 = next(a for a in mine if a["id"] == a3)
assert m3["status"] == "assigned" and m3["quantity"] == 2 and m3["task"]["id"] == task3["id"], m3
assert m3["instructions"] == "Aisles 3-4, landscape.", m3
ok("worker 1 accepts; the assignment is on their board", m3["task"]["reference_code"])

o = agg.get(f"/tasks/{task3['id']}/offers").json()[0]
assert o["accepted_count"] == 1 and o["declined_count"] == 1 and o["pending_count"] == 1 and o["status"] == "open", o
ok("aggregator sees 1 accepted, 1 declined, 1 waiting")

r = respond(t1, "accept")
assert r.status_code == 409, f"DOUBLE ACCEPT: {r.status_code} {r.text}"
ok("worker 1 clicking again refused")

r = respond(t3, "accept")
assert r.status_code == 200, r.text
o = agg.get(f"/tasks/{task3['id']}/offers").json()[0]
assert o["status"] == "filled" and o["accepted_count"] == 2 and o["closed_at"], o
assert len([a for a in agg.get(f"/tasks/{task3['id']}/assignments").json() if a["status"] != "cancelled"]) == 2
ok("worker 3 takes the last place; the offer is filled")

for tok in ("nonsense", t1[:-4] + "xxxx"):
    assert preview(tok).status_code == 404 and respond(tok, "accept").status_code == 404
r = httpx.post(f"{B}/offers/{t1}/respond", json={"action": "maybe"}, timeout=T)
assert r.status_code == 422, r.status_code
ok("unknown tokens 404, an unknown action 422")

# the race: three accepts for one place, at once
task4 = new_task("Metro shelf capture, wave 4", 2)
r = agg.post(f"/tasks/{task4['id']}/offers", json={
    "worker_limit": 1, "quantity": 2, "recipient_user_ids": crowd})
assert r.status_code == 201, r.text
toks = [offer_token(e) for e in (w1_email, w2_email, w3_email)]
with ThreadPoolExecutor(max_workers=3) as ex:
    results = list(ex.map(lambda t: respond(t, "accept"), toks))
codes = sorted(x.status_code for x in results)
assert codes == [200, 410, 410], f"RACE BROKE THE LIMIT: {codes} {[x.text for x in results]}"
assert all("closed" in x.text for x in results if x.status_code == 410), [x.text for x in results]
o = agg.get(f"/tasks/{task4['id']}/offers").json()[0]
assert o["accepted_count"] == 1 and o["status"] == "filled", o
assert len([a for a in agg.get(f"/tasks/{task4['id']}/assignments").json() if a["status"] != "cancelled"]) == 1
ok("three simultaneous accepts for one place: exactly one wins", f"{codes}")

# closing by hand
task5 = new_task("Metro shelf capture, wave 5", 2)
r = agg.post(f"/tasks/{task5['id']}/offers", json={
    "worker_limit": 1, "quantity": 2, "recipient_user_ids": [w2["user_id"], w3["user_id"]]})
assert r.status_code == 201, r.text
o5 = r.json()
t2b, t3b = (offer_token(e) for e in (w2_email, w3_email))
r = agg.post(f"/offers/{o5['id']}/close")
assert r.status_code == 200 and r.json()["status"] == "closed", r.text
r = agg.post(f"/offers/{o5['id']}/close")
assert r.status_code == 409, r.text
r = respond(t2b, "accept")
assert r.status_code == 410 and "closed" in r.text, r.text
assert preview(t2b).json()["state"] == "closed"
ok("aggregator closes the offer; a late accept is told the task is closed")

# a worker offboarded after the mail went out cannot take the place
r = agg.post(f"/tasks/{task5['id']}/offers", json={
    "worker_limit": 1, "quantity": 2, "recipient_user_ids": [w3["user_id"]]})
assert r.status_code == 201, r.text
t3c = offer_token(w3_email)
r = agg.post(f"/network/workers/{w3['id']}/status", json={"status": "offboarded"})
assert r.status_code == 204, r.text
assert preview(t3c).json()["state"] == "not_a_worker"
r = respond(t3c, "accept")
assert r.status_code == 409, f"OFFBOARDED WORKER ACCEPTED: {r.status_code} {r.text}"
o = agg.get(f"/tasks/{task5['id']}/offers").json()[0]
assert o["recipients"][0]["response"] is None and o["accepted_count"] == 0, o
ok("offboarded worker's accept refused; the place stays open")

assert client.get(f"/tasks/{task3['id']}/offers").status_code in (403, 404)
assert delhi.get(f"/tasks/{task3['id']}/offers").status_code == 404
ok("neither the client nor a rival can see who was asked")


# 7 — deliver; premature approval must fail first
r = client.post(f"/contracts/{contract['id']}/approve", json={"score": 5, "comment": "premature"})
assert r.status_code == 409
ok("client cannot approve before delivery")

r = northstar.post(f"/contracts/{contract['id']}/deliver")
assert r.status_code == 200 and r.json()["status"] == "delivered", r.text
ok("partner delivers")

# 8 — client approves with a rating
r = client.post(f"/contracts/{contract['id']}/approve", json={
    "score": 5, "comment": "Delivered ahead of schedule; consent tracking flawless."})
assert r.status_code == 200 and r.json()["status"] == "completed", r.text
ok("client approves and rates", "contract completed")

# 9 — money settled
inv = northstar.get("/invoices").json()
fee = next(i for i in inv if "fee" in i["kind"].lower())
assert fee["status"] == "paid"
ok("platform fee invoiced to partner", f"{fee['kind']} {fee['amount']}")

inv = client.get("/invoices").json()
assert all(i["status"] == "paid" for i in inv if i["contract_id"] == contract["id"])
ok("client invoices settled")

# 10 — the whole story is in the audit trail
acts = admin.get("/activity", params={"limit": 100}).json()
kinds = {a["event_type"] for a in acts}
expect = {"request.published", "proposal.submitted", "contract.awarded", "task.assigned",
          "loan.requested", "loan.state_changed", "submission.received", "review.recorded",
          "contract.delivered", "contract.accepted",
          "worker.invited", "assignment.created", "assignment.started", "assignment.submitted",
          "offer.created", "offer.accepted", "offer.declined", "offer.closed"}
missing = expect - kinds
assert not missing, f"missing audit events: {missing}"
ok("audit trail complete", f"{len(acts)} events, all {len(expect)} kinds present")

print(f"\nALL {step} STEPS PASSED — the full transaction loop works end to end.")
