"""How a task list is ordered, and for whom. No database — tasks_stmt is a
pure query builder, so the ORDER BY can be read straight off the compiled SQL.

    pytest tests/test_task_order_unit.py
"""

from __future__ import annotations

import uuid

from sourcehub.modules.delivery import service as delivery

ORG = uuid.UUID("f367972a-7e46-4e65-a5f6-b323ec8fb8b7")
CONTRACT = uuid.UUID("1465e835-139d-4efa-8fe7-c9776b3fe3fe")


def sql(**kw) -> str:
    return " ".join(str(delivery.tasks_stmt(**kw)).split())


def order_by(**kw) -> str:
    s = sql(**kw)
    return s[s.index("ORDER BY") :] if "ORDER BY" in s else ""


# --- the bug: a supplier's own worklist ------------------------------------

def test_supplier_worklist_puts_the_newest_task_first():
    # Bug 31. Ascending put the task that just landed at the bottom, under
    # every finished task of the past week.
    assert "task.created_at DESC" in order_by(org_id=ORG, mine_only=True)


def test_supplier_worklist_breaks_ties_on_the_reference():
    # Two tasks assigned in the same second is ordinary — one call per aisle,
    # and TSK-08/TSK-09 on the pilot data share a created_at exactly. Without
    # a second key their order is whatever the planner returns.
    clause = order_by(org_id=ORG, mine_only=True)
    assert "task.reference_code DESC" in clause
    assert clause.index("created_at") < clause.index("reference_code")


# --- the half that must NOT move -------------------------------------------

def test_a_contracts_breakdown_stays_oldest_first():
    # The partner reads this as a numbered sequence, TSK-01 upward. Bug 31 was
    # scoped to the supplier's list and must not have reversed this one.
    assert "DESC" not in order_by(contract_id=CONTRACT)


def test_the_default_list_stays_oldest_first():
    assert "DESC" not in order_by()


# --- the extraction did not drop a filter ----------------------------------
# tasks_stmt was split out of list_tasks so the ordering could be tested at
# all. That moved the WHERE clauses too, and nothing else in the suite would
# notice if one had gone missing.

def test_mine_only_scopes_to_the_callers_org():
    assert "task.assignee_org_id =" in sql(org_id=ORG, mine_only=True)


def test_without_mine_only_there_is_no_org_filter():
    # "task.assignee_org_id =", not the bare name: it is a model column and so
    # appears in the SELECT list of every one of these statements.
    assert "task.assignee_org_id =" not in sql(contract_id=CONTRACT)


def test_contract_id_scopes_to_the_contract():
    assert "task.contract_id =" in sql(contract_id=CONTRACT)


def test_deleted_tasks_are_always_excluded():
    for kw in ({}, {"org_id": ORG, "mine_only": True}, {"contract_id": CONTRACT}):
        assert "task.deleted_at IS NULL" in sql(**kw)
