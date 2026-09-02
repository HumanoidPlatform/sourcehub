"""The prototype's full transaction loop, driven through the real API.

publish -> propose (x2) -> award -> assign -> loan -> submit -> QA fail ->
resubmit -> QA pass -> deliver -> approve+rate -> money settles.

Every step asserts, and every negative check must be REFUSED.
"""

import httpx

B = "http://127.0.0.1:8000/api/v1"
PW = "SourceHub#2026"


def login(email: str) -> httpx.Client:
    r = httpx.post(f"{B}/auth/login", json={"email": email, "password": PW})
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

# 1 — client publishes a request
r = client.post("/requests", json={
    "title": "Retail shelf imagery across 12 metro markets",
    "category": "image",
    "geography": "United States - 12 metro areas",
    "spec_format": "JPEG, minimum 12MP",
    "spec_quantity": "25,000 images",
    "spec_quality": "Sharp, no glare, full shelf in frame",
    "acceptance": "95% or better pass on the blur check; 5% manual audit",
    "compliance_notes": "No shoppers or faces in frame.",
    "people_headcount": 180,
    "budget_min": 60000, "budget_max": 85000,
    "starts_on": "2026-09-07", "delivery_due_on": "2026-11-15",
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

# 4 — partner breaks the contract into a task for its aggregator
aggs = northstar.get("/organisations", params={"kind": "aggregator"}).json()
ag1 = next(a for a in aggs if a["reference_code"] == "AG-01")
r = northstar.post(f"/contracts/{contract['id']}/tasks", json={
    "assignee_org_id": ag1["id"],
    "title": "Metro shelf capture, wave 1",
    "target": "12,500 images",
    "due_on": "2026-10-04",
})
assert r.status_code == 201, r.text
task = r.json()
ok("task assigned to aggregator", f"{task['reference_code']} -> {task['assignee_name']}")

# negative: Meridian must not be able to assign into NorthStar's contract
r = meridian.post(f"/contracts/{contract['id']}/tasks", json={
    "assignee_org_id": ag1["id"], "title": "hijack"})
assert r.status_code in (404, 409), f"RIVAL COULD TOUCH CONTRACT: {r.status_code}"
ok("rival cannot assign into the contract", f"HTTP {r.status_code}")

# 5 — the aggregator borrows helmet cameras
equipment = agg.get("/network/equipment").json()
helmet = next(e for e in equipment if "Helmet" in e["equipment_type"])
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
acts = admin.get("/activity").json()
kinds = {a["event_type"] for a in acts}
expect = {"request.published", "proposal.submitted", "contract.awarded", "task.assigned",
          "loan.requested", "loan.state_changed", "submission.received", "review.recorded",
          "contract.delivered", "contract.accepted"}
missing = expect - kinds
assert not missing, f"missing audit events: {missing}"
ok("audit trail complete", f"{len(acts)} events, all {len(expect)} kinds present")

print(f"\nALL {step} STEPS PASSED — the full transaction loop works end to end.")
