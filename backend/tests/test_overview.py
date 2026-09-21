"""The client landing page's arithmetic.

Which rows reach this code is db/100_rls.sql's job and is checked against a
real database; the SQL itself was reconciled against live pilot data. What is
unit-testable here is what the module then does with those rows, and two of
those rules exist because the page they replaced got them wrong:

  * "Committed" counts work still in flight. The old page summed every
    contract ever signed under the same word, so it disagreed with Billing.
  * A contract nobody has broken into tasks yet is 0%, not a crash.
"""

from decimal import Decimal

from sourcehub.modules.overview.service import build_overview


def _req(status: str, ref: str = "RFP-1001", proposals: int = 0, **kw) -> dict:
    return {
        "id": f"id-{ref}",
        "reference_code": ref,
        "title": f"Title for {ref}",
        "stored_status": kw.get("stored_status", status),
        "proposals_close_at": kw.get("proposals_close_at"),
        "delivery_due_on": kw.get("delivery_due_on"),
        "proposal_count": proposals,
        "status": status,
    }


def _contract(ref: str, status: str, value: str, total: int, done: int, assets: int = 0) -> dict:
    return {
        "id": f"id-{ref}",
        "reference_code": ref,
        "value": Decimal(value),
        "currency": "USD",
        "partner_name": "NorthStar Delivery Partners",
        "delivery_due_on": None,
        "total": total,
        "done": done,
        "status": status,
        "assets_accepted": assets,
    }


def _build(requests=None, contracts=None, invoices=None, captures=None, days=30):
    return build_overview(requests or [], contracts or [], invoices or [], captures or [], days)


# --- requests -----------------------------------------------------------------

def test_every_stage_is_present_even_at_zero():
    # The console draws a row per stage; a missing key would read as a crash,
    # not as "none yet".
    d = _build(requests=[_req("draft")])
    assert d["requests"]["by_status"]["completed"] == 0
    assert d["requests"]["by_status"]["draft"] == 1
    assert d["requests"]["total"] == 1


def test_requests_are_counted_by_the_status_the_console_shows():
    # in_progress is derived from the contract, not stored on the request.
    d = _build(requests=[
        _req("in_progress"), _req("in_progress", "RFP-1002"), _req("draft", "RFP-1003"),
    ])
    assert d["requests"]["by_status"]["in_progress"] == 2
    assert d["requests"]["by_status"]["draft"] == 1


# --- money --------------------------------------------------------------------

def test_committed_is_work_in_flight_not_lifetime_value():
    # The bug this replaced: the old landing page summed completed contracts
    # too, so "Committed spend" only ever went up.
    d = _build(contracts=[
        _contract("CTR-01", "active", "100.00", 4, 1),
        _contract("CTR-03", "completed", "80.00", 1, 1),
    ])
    assert d["money"]["committed"] == "100.00"


def test_paid_and_outstanding_come_from_invoices_not_contract_value():
    d = _build(
        contracts=[_contract("CTR-01", "active", "12000.00", 2, 0)],
        invoices=[
            {"status": "paid", "n": 2, "amount": Decimal("80.00")},
            {"status": "pending", "n": 3, "amount": Decimal("6000.00")},
            {"status": "overdue", "n": 1, "amount": Decimal("96.50")},
            {"status": "void", "n": 1, "amount": Decimal("999.00")},
        ],
    )
    assert d["money"]["paid"] == "80.00"
    # overdue is still owed; void is not money.
    assert d["money"]["outstanding"] == "6096.50"


def test_a_client_with_nothing_gets_zeros_and_a_currency():
    d = _build()
    assert d["money"] == {
        "committed": "0.00",
        "paid": "0.00",
        "outstanding": "0.00",
        "currency": "USD",
    }
    assert d["delivery"]["pct"] == 0
    assert d["captures"]["accepted"] == 0
    assert d["attention"] == []


# --- delivery -----------------------------------------------------------------

def test_progress_counts_only_live_contracts():
    # A finished contract's tasks would otherwise flatter the percentage for
    # ever, and the tile says "in delivery".
    d = _build(contracts=[
        _contract("CTR-01", "active", "100.00", 4, 1),
        _contract("CTR-03", "completed", "80.00", 1, 1),
    ])
    assert d["delivery"] == {"live": 1, "tasks_total": 4, "tasks_done": 1, "pct": 25}


def test_a_contract_with_no_tasks_is_zero_percent_not_a_division_by_zero():
    d = _build(contracts=[_contract("CTR-05", "active", "12000.00", 0, 0)])
    assert d["deliveries"][0]["pct"] == 0
    assert d["delivery"]["pct"] == 0


def test_captures_accepted_spans_every_contract_including_finished_ones():
    # Unlike money: a capture the client has already accepted is theirs
    # whether or not the contract is closed.
    d = _build(contracts=[
        _contract("CTR-01", "active", "100.00", 4, 1, assets=50),
        _contract("CTR-03", "completed", "80.00", 1, 1, assets=2),
    ])
    assert d["captures"]["accepted"] == 52


def test_in_qa_counts_as_live():
    d = _build(contracts=[_contract("CTR-02", "in_qa", "13.00", 2, 0)])
    assert d["delivery"]["live"] == 1
    assert d["money"]["committed"] == "13.00"


# --- the queue ----------------------------------------------------------------

def test_attention_lists_the_three_things_only_a_client_can_do():
    d = _build(
        requests=[
            _req("draft", "RFP-1004"),
            _req("proposals_received", "RFP-1007", proposals=3),
            _req("in_progress", "RFP-1001"),
            _req("completed", "RFP-1000"),
        ],
        contracts=[
            _contract("CTR-06", "delivered", "500.00", 2, 2),
            _contract("CTR-01", "active", "100.00", 4, 1),
        ],
    )
    assert [(a["kind"], a["reference_code"], a["count"]) for a in d["attention"]] == [
        ("publish_draft", "RFP-1004", 0),
        ("review_proposals", "RFP-1007", 3),
        ("approve_delivery", "CTR-06", 0),
    ]


def test_work_in_flight_is_not_waiting_on_the_client():
    # The whole point of the panel: if it lists things the client cannot act
    # on, they stop reading it.
    d = _build(
        requests=[_req("in_progress"), _req("published", "RFP-1008"), _req("accepted", "RFP-1009")],
        contracts=[_contract("CTR-01", "active", "100.00", 4, 1)],
    )
    assert d["attention"] == []


# --- captures -----------------------------------------------------------------

def test_the_capture_series_is_passed_through_with_its_window():
    d = _build(
        captures=[{"day": "2026-09-15", "n": 52}, {"day": "2026-09-17", "n": 29}],
        days=30,
    )
    assert d["captures"]["days"] == 30
    assert d["captures"]["series"] == [
        {"day": "2026-09-15", "count": 52},
        {"day": "2026-09-17", "count": 29},
    ]


def test_money_stays_exact_all_the_way_to_the_wire():
    # FastAPI encodes a Decimal as a JSON float, so numeric(14,2) left alone
    # reaches the browser through binary floating point. types.ts says money
    # must not do that, so the endpoint hands over strings.
    d = _build(
        contracts=[_contract("CTR-01", "active", "12000.10", 2, 0)],
        invoices=[{"status": "pending", "n": 1, "amount": Decimal("6096.50")}],
    )
    assert d["money"]["committed"] == "12000.10"
    assert d["money"]["outstanding"] == "6096.50"
    assert d["deliveries"][0]["value"] == "12000.10"
    assert all(isinstance(v, str) for v in d["money"].values())
