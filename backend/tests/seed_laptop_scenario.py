"""The laptop-operating video scenario, with values chosen to actually work.

    .venv/Scripts/python tests/seed_laptop_scenario.py photo1.jpg photo2.jpg

Publishes a video request carrying the client's own reference photos in the
`capture_examples` slot, awards it, breaks it into a task with a subject, and
assigns it to an existing crowd worker. Prints what to film and what to expect.

WHY THE SUBJECT IS WORDED THE WAY IT IS. ML Kit's base model knows 446 labels
and "Laptop" is not one of them; "Computer", "Desk", "Hand" and "Screenshot"
are. A task whose subject words are absent from that vocabulary scores zero on
every capture for ever — which is exactly what happened to the five pilot tasks
carrying domain "video" (see frontend subject-caution.test.tsx). So the domain
stays human-readable for the person reading it on the phone, and must_show
carries the words the labeller can actually match.

The reference photos are the real answer to that problem: they are labelled by
the same model, so whatever it calls a laptop becomes the basis for comparison
and nobody has to guess the vocabulary at all.

Needs the compose stack and the API on :8000. Re-runnable: each run publishes a
fresh request and task, so the one-open-assignment-per-worker rule never bites.
"""

import datetime as dt
import mimetypes
import os
import sys
from pathlib import Path

import httpx

B = "http://127.0.0.1:8000/api/v1"
PW = "SourceHub#2026"

# An existing worker with an accepted invitation. Inviting a new one needs the
# token out of the mailbox; reusing one that can already sign in skips all of it.
WORKER = os.environ.get("SEED_WORKER", "worker-02320f34-a@bengaluru.example")

DEST_LABEL = "Acme capture bucket"


def login(email: str) -> httpx.Client:
    r = httpx.post(f"{B}/auth/login", json={"email": email, "password": PW}, timeout=30)
    if r.status_code != 200:
        raise SystemExit(f"login failed for {email}: {r.status_code} {r.text}")
    return httpx.Client(
        base_url=B,
        headers={"Authorization": f"Bearer {r.json()['access_token']}"},
        timeout=60,
    )


def ok(msg: str) -> None:
    print(f"  ok  {msg}")  # ASCII only: the Windows console may not be UTF-8


def must(r: httpx.Response, what: str) -> dict:
    if r.status_code >= 300:
        raise SystemExit(f"{what} failed: {r.status_code} {r.text}")
    return r.json() if r.content else {}


photos = [Path(p) for p in sys.argv[1:]]
if not photos:
    raise SystemExit(__doc__)
for p in photos:
    if not p.is_file():
        raise SystemExit(f"not a file: {p}")
if len(photos) > 5:
    raise SystemExit("the phone labels at most 5 examples (capture/examples.ts MAX_EXAMPLES)")

client = login("client@acme.example")
northstar = login("partner@northstar.example")
agg = login("crowd@bengaluru.example")

# --- where delivered captures land -----------------------------------------
# A published request needs a destination that has actually been written to, so
# this comes first. Locally that is the same MinIO the compose stack runs, which
# still exercises the real path: resolve per contract, presign against that
# destination, stamp the asset with it. Reused by label across runs -- the label
# is unique per client and a second create would collide.
listed = client.get("/storage-targets")
existing = ([t for t in listed.json() if t.get("label") == DEST_LABEL]
            if listed.status_code == 200 and isinstance(listed.json(), list) else [])
if existing:
    dest = existing[0]
    ok(f"destination {dest['label']} reused")
else:
    dest = must(client.post("/storage-targets", json={
        "label": DEST_LABEL,
        "provider": "s3",
        "bucket": os.environ.get("STORAGE_BUCKET_ASSETS", "sourcehub-assets"),
        "endpoint": os.environ.get("STORAGE_ENDPOINT", "http://localhost:9000"),
        "key_prefix": "acme/",
        "secret": {
            "access_key_id": os.environ.get("STORAGE_ACCESS_KEY", "sourcehub"),
            "secret_access_key": os.environ.get("STORAGE_SECRET_KEY", "sourcehub_dev_password"),
        },
    }), "create destination")
    ok(f"destination {dest['label']} verified")

# --- the client's reference photos -------------------------------------------
# Three steps and no attach endpoint: the storage key is named on the parent
# save, and attaching MOVES the object out of staging, so a key is single-use.
#
# These always go to Azure Blob: platform_target() is hardcoded to it, with
# "no setting that points it anywhere else". So unlike captures, they cannot
# fall back to the local MinIO -- if the account key in backend/.env is stale,
# this half simply cannot run, and the task is still worth having without it.
attachments = []
blocked = ""
for p in photos:
    blob = p.read_bytes()
    ctype = mimetypes.guess_type(p.name)[0] or "image/jpeg"
    pre = must(client.post("/attachments/presign", json={
        "filename": p.name, "content_type": ctype, "size_bytes": len(blob),
    }), f"presign {p.name}")
    put = httpx.put(pre["url"], content=blob, headers=pre["headers"], timeout=120)
    if put.status_code not in (200, 201, 204):
        blocked = f"{put.status_code} {put.text[:200]}"
        print(f"  !!  example upload refused by storage: {blocked}")
        print("  !!  continuing WITHOUT capture examples -- see the note at the end")
        attachments = []
        break
    attachments.append({
        "storage_key": pre["storage_key"],
        "filename": pre["filename"],
        "content_type": ctype,
        "slot": "capture_examples",
    })
    ok(f"example {pre['filename']} uploaded ({len(blob) // 1024} KB)")

today = dt.date.today()

# --- the request --------------------------------------------------------------
# require_gps is deliberately absent. It is a BLOCK, and at a desk indoors the
# fix often fails -- the capture would be deleted before any QA check ran.
# max_tilt_deg 25 for the same reason: tilt blocks too, and 15 would throw away
# good handheld footage.
req = must(client.post("/requests", json={
    "title": f"Laptop operating - desk footage ({today.isoformat()})",
    "category": "video",
    "geography": "Bengaluru, one desk",
    "target_quantity": 3,
    "target_unit": "videos",
    "capture_spec": {
        "media": ["video"],
        "min_duration_s": 10,
        "max_duration_s": 45,
        "min_video_lines": 720,
        "orientation": "landscape",
        "max_tilt_deg": 25,
        "require_gps": False,
        "allow_library": False,
        "notes": "Hands on the keyboard, screen visible, desk around it.",
    },
    "quality_thresholds": {"min_pass_rate_pct": 90},
    "rejection_policy": {"max_retakes": 2, "rework_cost_bearer": "partner"},
    "objective": "Footage of a person operating a laptop, for an activity-recognition set.",
    "use_case": "ai_training",
    "countries": ["IN"],
    "lawful_basis": "not_personal_data",
    "permitted_uses": ["model_training"],
    "spec_quality": "Hands and screen both in frame, landscape, steady.",
    "acceptance": "The laptop is being operated and is plainly the subject of the clip.",
    "compliance_notes": "Hands are expected. No faces required or wanted.",
    "budget_min": 500, "budget_max": 900,
    "starts_on": today.isoformat(),
    "delivery_due_on": (today + dt.timedelta(days=14)).isoformat(),
    "storage_target_id": dest["id"],
    "attachments": attachments,
    "publish": True,
}), "publish request")
ok(f"request {req['reference_code']} published with {len(attachments)} capture examples")

prop = must(northstar.post(f"/requests/{req['id']}/proposals", json={
    "price": 800, "duration_days": 7,
    "methodology": "Bengaluru crowd, capture app, one desk.",
}), "propose")
contract = must(client.post(f"/proposals/{prop['id']}/award"), "award")
ok(f"awarded to NorthStar as {contract['reference_code']}")

# --- the task -----------------------------------------------------------------
ag1 = next(a for a in must(northstar.get("/organisations", params={"kind": "aggregator"}), "orgs")
           if a["reference_code"] == "AG-01")
task = must(northstar.post(f"/contracts/{contract['id']}/tasks", json={
    "assignee_org_id": ag1["id"],
    "title": f"Laptop operating clips ({today.isoformat()})",
    "target": "3 videos",
    "target_quantity": 3,          # without this, assigning a worker is refused
    "target_unit": "videos",
    "instructions": "Hold the phone landscape. Film 15-20 seconds of the laptop "
                    "being used: hands on the keyboard, screen visible, desk around it. "
                    "Other things in shot are fine and wanted.",
    "due_on": (today + dt.timedelta(days=7)).isoformat(),
    "subject": {
        # Human-readable for the worker; "laptop" matches no ML Kit label, so it
        # contributes nothing to the score and is here to be read, not matched.
        "domain": "laptop being operated",
        # These three ARE in the 446-label vocabulary. This is what the word
        # check actually runs on.
        "must_show": ["computer", "desk", "hand"],
        # A genuine failure mode that the labeller can name: a screen recording
        # instead of a filmed laptop. NOT "person" -- a laptop being operated
        # has one by definition, and forbidding them would fire on every good
        # capture.
        "must_not_show": ["screenshot"],
    },
}), "create task")
ok(f"task {task['reference_code']} created for {ag1['name']}")

# --- the worker ---------------------------------------------------------------
w = next((x for x in must(agg.get("/network/workers"), "roster")
          if (x.get("email") or "").lower() == WORKER.lower()), None)
if w is None:
    raise SystemExit(f"{WORKER} is not on the AG-01 roster; set SEED_WORKER to one that is")
if not w.get("user_id"):
    raise SystemExit(f"{WORKER} has no user account, so nothing can be assigned to it")

must(agg.post(f"/tasks/{task['id']}/assignments", json={
    "worker_user_id": w["user_id"], "quantity": 3,
    "instructions": "Three clips of the laptop in use.",
}), "assign worker")
ok(f"3 units assigned to {w['display_name']}")

if blocked:
    print(f"""
  !!  NO CAPTURE EXAMPLES ON THIS REQUEST.
  !!
  !!  Azure refused the upload: {blocked}
  !!
  !!  Capture examples are stored by platform_target(), which is hardcoded to
  !!  Azure Blob -- they cannot use the local MinIO. The account key in
  !!  backend/.env (account 'cosarathistorage') is well formed but rejected,
  !!  which means it is the wrong key: replace STORAGE_ACCOUNT_KEY with the
  !!  current one from the portal and re-run this script.
  !!
  !!  Everything else below still works. What you CANNOT test without the
  !!  examples: the example-match score, and the AND rule, which needs both
  !!  checks -- so the keep-or-retake prompt will follow the word check alone,
  !!  exactly as it did before this work.
""")

print(f"""
Sign in on the phone as
    email     {WORKER}
    password  {PW}

Open the assignment ONCE WHILE ONLINE before filming -- that is when the
reference photos download and get labelled. Then:

  1  Hands on the keyboard, clutter in shot, ~20s, phone LANDSCAPE
     -> expect NO prompt. This is the original complaint, passing.
  2  The ceiling, ~15s
     -> expect the keep-or-retake prompt (both checks low).
  3  A closed laptop across a dim room
     -> expect NO prompt: the word check hits, the examples miss. The AND rule.
  4  As 1 but held PORTRAIT   -> blocked and deleted, refusal recorded.
  5  A 5-second clip          -> blocked on duration.

Then in the console (crowd@bengaluru.example) open Review > the batch > a clip.
Under "Measured" expect the example match, the tilt reading and the device.

Request {req['reference_code']}  contract {contract['reference_code']}  task {task['reference_code']}
""")
