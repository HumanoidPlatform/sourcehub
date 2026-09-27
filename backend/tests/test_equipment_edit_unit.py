"""A sponsor can edit a device's details — and only its own, and only safely.

Before PATCH /network/equipment/{id} existed a sponsor could add a device and
change its status, and nothing else: a typo in the type, a fleet that grew from
40 to 60 units, a recalibration — all permanent. The endpoint is small; what
matters is the three properties a reviewer cannot see by reading a diff:

  * it is guarded on equipment.manage, like its two neighbours;
  * it loads the caller's OWN row, not just the id — set_equipment_status once
    loaded a foreign row through the SELECT policy, mutated it, wrote an audit
    line and returned success while equipment_write silently updated nothing;
  * total_units may not drop below what is out on loan. Nothing in the schema
    enforces that: check_loan_availability fires when a LOAN changes, not when
    a sponsor shrinks the fleet underneath live loans.

Asserted on the AST and on the router's dependency tree, never on file text —
in this repository four assertions have already been satisfied by comments.

    pytest tests/test_equipment_edit_unit.py
"""

from __future__ import annotations

import ast
import inspect
import re
from pathlib import Path

from fastapi.routing import APIRoute

from sourcehub.api.v1 import network as router_module
from sourcehub.modules.network import service

ROOT = Path(__file__).resolve().parents[2]
OVERVIEW = ROOT / "frontend" / "src" / "app" / "overview.tsx"

ROUTES = [r for r in router_module.router.routes if isinstance(r, APIRoute)]
PATCH = [r for r in ROUTES if "PATCH" in r.methods and r.path == "/equipment/{equipment_id}"]

TREE = ast.parse(inspect.getsource(service))


def _function(name: str) -> ast.AsyncFunctionDef:
    for node in ast.walk(TREE):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found in network/service.py")


UPDATE = _function("update_equipment")


def _closure_strings(fn) -> set[str]:
    """String constants captured by a dependency closure — how require_capability
    remembers which capability it checks."""
    out: set[str] = set()
    for cell in getattr(fn, "__closure__", None) or ():
        try:
            v = cell.cell_contents
        except ValueError:
            continue
        if isinstance(v, str):
            out.add(v)
        elif isinstance(v, (tuple, list, set, frozenset)):
            out |= {x for x in v if isinstance(x, str)}
    return out


# ---------------------------------------------------------------------------
# The route
# ---------------------------------------------------------------------------


def test_the_route_exists_once():
    assert len(PATCH) == 1, [f"{sorted(r.methods)} {r.path}" for r in ROUTES]


def test_the_route_is_guarded_on_equipment_manage():
    # Same guard as POST /equipment and POST …/status. A route copied without
    # its dependency would let any authenticated org PATCH by id; RLS would
    # then be the only thing standing, and RLS turns a foreign row into a
    # silent no-op, not a refusal.
    guards = PATCH[0].dependant.dependencies
    caps = set().union(*(_closure_strings(d.call) for d in guards))
    names = [getattr(d.call, "__qualname__", "") for d in guards]
    assert any("require_capability" in n for n in names), names
    assert "equipment.manage" in caps, caps


# ---------------------------------------------------------------------------
# The service
# ---------------------------------------------------------------------------


def test_it_loads_only_the_callers_own_row():
    wheres = [
        ast.unparse(n)
        for n in ast.walk(UPDATE)
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "where"
    ]
    assert wheres, "update_equipment must filter its select"
    assert any("sponsor_org_id" in w and "claims.org_id" in w for w in wheres), wheres


def test_a_miss_is_a_lookup_error():
    raises = [ast.unparse(n.exc) for n in ast.walk(UPDATE) if isinstance(n, ast.Raise) and n.exc]
    assert any("LookupError" in r for r in raises), raises


def test_units_cannot_drop_below_what_is_on_loan():
    """The guard the schema lacks. Asserted as: the on-loan count is actually
    queried, and an If comparing against it raises NetworkError."""
    calls = [ast.unparse(n) for n in ast.walk(UPDATE) if isinstance(n, ast.Call)]
    assert any("equipment_units_on_loan" in c for c in calls), "on-loan count is never queried"
    guarded = [
        node
        for node in ast.walk(UPDATE)
        if isinstance(node, ast.If)
        and "on_loan" in ast.unparse(node.test)
        and any(
            isinstance(r, ast.Raise) and r.exc is not None and "NetworkError" in ast.unparse(r.exc)
            for r in ast.walk(node)
        )
    ]
    assert guarded, "no If that compares total_units with the on-loan count and raises NetworkError"


def test_an_expiry_before_calibration_is_refused():
    guarded = [
        node
        for node in ast.walk(UPDATE)
        if isinstance(node, ast.If)
        and "expires" in ast.unparse(node.test)
        and "calibrated" in ast.unparse(node.test)
        and any(
            isinstance(r, ast.Raise) and r.exc is not None and "NetworkError" in ast.unparse(r.exc)
            for r in ast.walk(node)
        )
    ]
    assert guarded, "no If refusing calibration_expires_on < calibrated_on"


def test_only_the_four_detail_fields_are_editable():
    # setattr over caller-supplied keys is how status, sponsor_org_id or
    # deleted_at would become writable by accident. The whitelist is the floor.
    assert set(service._EDITABLE) == {
        "equipment_type",
        "total_units",
        "calibrated_on",
        "calibration_expires_on",
    }
    src = ast.unparse(UPDATE)
    assert "_EDITABLE" in src, "update_equipment must check changes against _EDITABLE"


def test_the_edit_is_audited_under_its_own_event():
    events = [
        n.args[1].value
        for n in ast.walk(UPDATE)
        if isinstance(n, ast.Call)
        and ast.unparse(n.func) == "audit.log"
        and len(n.args) > 1
        and isinstance(n.args[1], ast.Constant)
    ]
    assert events == ["equipment.updated"], events


# ---------------------------------------------------------------------------
# Cross-layer: the sponsor's activity feed must show it
# ---------------------------------------------------------------------------


def test_the_overview_feed_includes_the_new_event():
    """SPONSOR_ACTIVITY_TYPES is an allowlist; an event missing from it is
    written to the audit table and shown to nobody. Parsed out of the Set
    literal, not grepped from the file, so a comment cannot satisfy it."""
    text = OVERVIEW.read_text(encoding="utf-8")
    m = re.search(r"SPONSOR_ACTIVITY_TYPES = new Set\(\[(.*?)\]\)", text, re.S)
    assert m, "SPONSOR_ACTIVITY_TYPES literal not found"
    listed = set(re.findall(r'"([a-z._]+)"', m.group(1)))
    assert "equipment.updated" in listed, listed
    assert len(listed) >= 4, listed  # anti-vacuous: the set still holds the others


# ---------------------------------------------------------------------------
# equipment.status is no longer written by anything
# ---------------------------------------------------------------------------


def test_the_service_never_writes_equipment_status():
    """The column stays (no migration) but nothing may set it. The automatic
    in_use/available flips on approve and return were what silently overwrote a
    sponsor's own choice, and the control that made that choice is gone. Loan
    statuses share the word "returned", so it is deliberately not in this set."""
    writes = [
        ast.unparse(node)
        for node in ast.walk(TREE)
        if isinstance(node, ast.Assign)
        and any(isinstance(t, ast.Attribute) and t.attr == "status" for t in node.targets)
        and isinstance(node.value, ast.Constant)
        and node.value.value in {"available", "in_use", "maintenance", "retired"}
    ]
    assert not writes, f"the network service still writes equipment.status: {writes}"
