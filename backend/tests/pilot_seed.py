"""One command to get a phone ready for the pilot.

    .venv/Scripts/python tests/pilot_seed.py [worker-email] [worker-name]

Publishes a request, awards it to NorthStar, breaks it into a task for the
Bengaluru Crowd Collective with a target of 5 photos, invites a worker by
email, accepts the invitation through Mailpit with the demo password, and
assigns all 5 units to that worker. Prints the sign-in to type into the app.

Needs the compose stack (Postgres, MinIO, Mailpit) and the API on :8000.
Re-runnable: with no email argument each run invites a fresh worker; with an
email that already exists on the roster the same worker is reused.
"""

import datetime as dt
import re
import sys
import time
import os
import uuid

import httpx

B = "http://127.0.0.1:8000/api/v1"
MP = "http://localhost:8025/api/v1"
PW = "SourceHub#2026"


def login(email: str) -> httpx.Client:
    r = httpx.post(f"{B}/auth/login", json={"email": email, "password": PW})
    r.raise_for_status()
    return httpx.Client(base_url=B, headers={"Authorization": f"Bearer {r.json()['access_token']}"}, timeout=30)


def invitation_token(email: str) -> str:
    """The invitation lands in Mailpit; the newest message wins."""
    for _ in range(60):
        msgs = httpx.get(f"{MP}/search", params={"query": f"to:{email}"}).json()["messages"]
        if msgs:
            body = httpx.get(f"{MP}/message/{msgs[0]['ID']}").json()["Text"]
            m = re.search(r"token=([A-Za-z0-9_\-]+)", body)
            if m:
                return m.group(1)
        time.sleep(0.25)
    raise SystemExit(f"no invitation email for {email} in Mailpit (http://localhost:8025)")


def ok(msg: str) -> None:
    print(f"  ok  {msg}")  # ASCII only: the Windows console may not be UTF-8


email = sys.argv[1] if len(sys.argv) > 1 else f"priya.pilot-{uuid.uuid4().hex[:4]}@bengaluru.example"
name = sys.argv[2] if len(sys.argv) > 2 else "Priya Nair"

client = login("client@acme.example")
northstar = login("partner@northstar.example")
agg = login("crowd@bengaluru.example")

# --- the commercial half, straight through ---------------------------------
# The client says where captured data should be delivered.
#
# A published request needs a destination that has actually been written to, so
# this comes first. Locally the client's "own" bucket is the same MinIO the
# platform runs, reached with the dev credentials — which still exercises the
# real path end to end: resolve per contract, presign against that destination,
# stamp the asset with it.
dest = client.post("/storage-targets", json={
    "label": "Acme capture bucket",
    "provider": "s3",
    "bucket": os.environ.get("STORAGE_BUCKET_ASSETS", "sourcehub-assets"),
    "endpoint": os.environ.get("STORAGE_ENDPOINT", "http://localhost:9000"),
    "key_prefix": "acme/",
    "secret": {
        "access_key_id": os.environ.get("STORAGE_ACCESS_KEY", "sourcehub"),
        "secret_access_key": os.environ.get("STORAGE_SECRET_KEY", "sourcehub_dev_password"),
    },
})
assert dest.status_code == 201, dest.text
dest = dest.json()
ok(f"destination {dest['label']} verified")

req = client.post("/requests", json={
    "title": "Pilot: shelf imagery, aisle 1",
    "category": "image",
    "geography": "Bengaluru, one store",
    "spec_format": "JPEG from the capture app",
    "spec_quantity": "5 photos",
    "spec_quality": "Full shelf in frame, no glare",
    "acceptance": "Every photo shows the whole shelf; no shoppers in frame.",
    "compliance_notes": "No faces.",
    "budget_min": 500, "budget_max": 900,
    "starts_on": dt.date.today().isoformat(),
    "delivery_due_on": (dt.date.today() + dt.timedelta(days=14)).isoformat(),
    "storage_target_id": dest["id"],
    "publish": True,
})
req.raise_for_status()
req = req.json()
ok(f"request {req['reference_code']} published")

prop = northstar.post(f"/requests/{req['id']}/proposals", json={
    "price": 800, "duration_days": 7, "methodology": "Bengaluru crowd, capture app.",
})
prop.raise_for_status()
contract = client.post(f"/proposals/{prop.json()['id']}/award")
contract.raise_for_status()
contract = contract.json()
ok(f"awarded to NorthStar as {contract['reference_code']}")

ag1 = next(a for a in northstar.get("/organisations", params={"kind": "aggregator"}).json()
           if a["reference_code"] == "AG-01")
task = northstar.post(f"/contracts/{contract['id']}/tasks", json={
    "assignee_org_id": ag1["id"],
    "title": "Shelf photos, aisle 1",
    "target": "5 photos",
    "target_quantity": 5, "target_unit": "photos",
    "instructions": "Stand square to the shelf, full shelf in frame, landscape. No shoppers.",
    "capture_spec": {"media": "both", "require_gps": True, "notes": "Photos preferred; one short video is fine."},
    "due_on": (dt.date.today() + dt.timedelta(days=7)).isoformat(),
})
task.raise_for_status()
task = task.json()
ok(f"task {task['reference_code']} assigned to {ag1['name']} (target 5 photos)")

# --- the worker -------------------------------------------------------------
r = agg.post("/network/workers", json={"display_name": name, "email": email, "skill": "Shelf capture", "trained": True})
if r.status_code == 201:
    w = r.json()
    tok = invitation_token(email)
    httpx.post(f"{B}/auth/invitation/accept", json={"token": tok, "password": PW}).raise_for_status()
    ok(f"worker {w['reference_code']} invited and invitation accepted")
elif r.status_code == 409:
    w = next((x for x in agg.get("/network/workers").json() if (x.get("email") or "").lower() == email.lower()), None)
    if w is None:
        raise SystemExit(f"{email} exists as a user but is not on this roster; pick another email")
    if w["invitation_status"] != "accepted":
        agg.post(f"/network/workers/{w['id']}/resend-invitation").raise_for_status()
        tok = invitation_token(email)
        httpx.post(f"{B}/auth/invitation/accept", json={"token": tok, "password": PW}).raise_for_status()
    ok(f"worker {w['reference_code']} already on the roster, reused")
else:
    raise SystemExit(f"could not add the worker: {r.status_code} {r.text}")

a = agg.post(f"/tasks/{task['id']}/assignments", json={
    "worker_user_id": w["user_id"], "quantity": 5,
    "instructions": "Take 5 photos of the aisle-1 shelves. Full shelf in frame.",
})
a.raise_for_status()
ok("5 units assigned to the worker")

print(f"""
Sign in to the app on the phone with
    email     {email}
    password  {PW}

Console logins (password {PW}):
    aggregator  crowd@bengaluru.example     Tasks > Workers, Review
    partner     partner@northstar.example   QA and delivery, Contracts
    client      client@acme.example         Deliveries

Request {req['reference_code']}, contract {contract['reference_code']}, task {task['reference_code']}
""")
