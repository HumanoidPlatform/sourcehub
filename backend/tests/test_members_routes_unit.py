"""Every route that CHANGES a membership must carry the scope gate.

This is the regression the feature is most likely to suffer later, and it is
invisible in review: someone adds a seventh route, copies the
`require_capability` line from a neighbouring module, and the scope gate
quietly stops applying to it. Nothing fails. The route works. It is simply open
to every member of the organisation.

It is open to them because capabilities come from the ROLE
(user_capabilities, db/020_rbac.sql:141) and there is one role per
organisation kind — so every member of a client org holds user.invite,
user.manage and role.manage already. require_capability cannot distinguish
them; only user_role_grant.scope can, and only require_member_admin reads it.

Read-only routes are deliberately exempt: seeing the Team page without being
able to change it is a reasonable thing to be, and RLS confines the rows.

    pytest tests/test_members_routes_unit.py
"""

from __future__ import annotations

from fastapi.routing import APIRoute

from sourcehub.api.deps import TxRoute
from sourcehub.api.v1 import members

MUTATING = {"POST", "PATCH", "PUT", "DELETE"}

ROUTES = [r for r in members.router.routes if isinstance(r, APIRoute)]


def _guards(route: APIRoute) -> list[str]:
    return [
        getattr(d.call, "__qualname__", "")
        for d in route.dependant.dependencies
    ]


def test_there_are_routes_to_check():
    # Anti-vacuous. Every assertion below iterates ROUTES, so an import that
    # silently yielded nothing would make this file pass while testing air.
    assert len(ROUTES) >= 6, ROUTES
    assert any(m in MUTATING for r in ROUTES for m in r.methods), "no mutating routes found"


def test_every_mutating_route_carries_the_scope_gate():
    offenders = [
        f"{sorted(r.methods)} {r.path}"
        for r in ROUTES
        if r.methods & MUTATING
        and not any("require_member_admin" in g for g in _guards(r))
    ]
    assert not offenders, (
        "these routes change membership but are guarded on capability alone, "
        f"which every member of the organisation already holds: {offenders}"
    )


def test_no_mutating_route_is_guarded_on_capability_alone():
    # require_member_admin checks the capability itself, so a route carrying
    # both is not wrong — but a route carrying ONLY require_capability is the
    # exact mistake this file exists to catch.
    for r in ROUTES:
        if not (r.methods & MUTATING):
            continue
        guards = _guards(r)
        assert not (
            any("require_capability" in g for g in guards)
            and not any("require_member_admin" in g for g in guards)
        ), f"{sorted(r.methods)} {r.path} is capability-only"


def test_the_read_routes_exist_and_stay_read_only():
    # If these ever gain a mutating method they must gain the gate too; this
    # pins the split so the exemption above cannot quietly widen.
    read_paths = {r.path for r in ROUTES if r.methods == {"GET"}}
    assert "/members" in read_paths
    assert "/members/roles" in read_paths


def test_the_router_commits_before_the_response():
    # Without TxRoute the commit lands in teardown, after the response has been
    # sent — so a late constraint error surfaces behind a 2xx the client has
    # already believed. The owner invariant is exactly such an error.
    assert members.router.route_class is TxRoute


def test_promoting_to_owner_is_not_reachable_without_owner_scope():
    # may_manage owns this rule; the route must not re-implement a weaker
    # version of it. Asserted at the source so a second copy cannot drift.
    from sourcehub.modules.identity.members import may_manage

    assert may_manage("manager", "member", "owner") is False
    assert may_manage("owner", "member", "owner") is True
