"""Which of a request's documents travel with a task.

Access is db/150's job (an aggregator gets four slots, a worker three, and only
for work that has come down to them) and is checked against a real database.
What is unit-testable here is the one rule the service owns: the brief never
rides along, whoever is asking — a partner's session can read it, and a task
must still describe the same set of documents to everyone.
"""

from sourcehub.modules.delivery.service import WORKING_SLOTS, working_documents


def _doc(slot: str, doc_no: int = 1, version: int = 1) -> dict:
    return {"slot": slot, "doc_no": doc_no, "version": version, "filename": f"{slot}-{doc_no}-v{version}"}


def test_the_brief_never_travels_with_a_task():
    rows = [_doc("brief"), _doc("guidelines"), _doc("acceptance")]
    assert [r["slot"] for r in working_documents(rows)] == ["guidelines", "acceptance"]


def test_brief_is_not_a_working_slot():
    # The commercial terms. If this ever fails, read db/150 before "fixing" it.
    assert "brief" not in WORKING_SLOTS


def test_slots_come_back_most_useful_first_not_alphabetical():
    # list_for orders by slot name, which would put acceptance first and the
    # field guidelines last — backwards for someone about to go and capture.
    rows = [_doc("acceptance"), _doc("capture_examples"), _doc("compliance"), _doc("guidelines")]
    assert [r["slot"] for r in working_documents(rows)] == [
        "guidelines", "capture_examples", "acceptance", "compliance",
    ]


def test_order_within_a_slot_is_preserved():
    # list_for gives document order, newest version first; the console's
    # "v2 · 1 earlier" grouping depends on that surviving.
    rows = [
        _doc("guidelines", 1, 2), _doc("guidelines", 1, 1), _doc("guidelines", 2, 1),
        _doc("acceptance", 1, 1),
    ]
    got = [(r["slot"], r["doc_no"], r["version"]) for r in working_documents(rows)]
    assert got == [
        ("guidelines", 1, 2), ("guidelines", 1, 1), ("guidelines", 2, 1), ("acceptance", 1, 1),
    ]


def test_an_unknown_slot_is_dropped_not_passed_through():
    # A slot added to the intake form later must be opted in here deliberately.
    assert working_documents([_doc("pricing_annex"), _doc("guidelines")]) == [_doc("guidelines")]


def test_nothing_in_nothing_out():
    assert working_documents([]) == []
