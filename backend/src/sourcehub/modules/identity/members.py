"""Who may administer whom, inside one organisation.

A pure module on purpose: these are the rules most likely to be got subtly
wrong, and keeping them free of a session means they can be tested exhaustively
without a database — which matters here, because conftest.py's live-Postgres
fixtures all raise NotImplementedError today.

The rules answer a question the ROLE cannot. Capabilities come from the role
(user_capabilities, db/020_rbac.sql:141) and there is exactly one role per
organisation kind, so every member of a client org holds user.invite,
user.manage and role.manage alike. What separates a person who may remove
colleagues from one who may not is user_role_grant.scope — the column
db/020_rbac.sql:39 describes and nothing has ever read.
"""

from __future__ import annotations

# Ordered, most powerful first. Order is load-bearing: RANK below turns it into
# the comparison the rules are written in terms of.
SCOPES: tuple[str, ...] = ("owner", "manager", "member")
RANK = {s: i for i, s in enumerate(SCOPES)}


def is_admin_scope(scope: str) -> bool:
    """May this person administer other people at all?"""
    return scope in ("owner", "manager")


def may_manage(actor: str, target: str, new_scope: str | None = None) -> bool:
    """May `actor` act on a member at `target` scope, optionally setting it to
    `new_scope`?

        owner    may act on anyone,          and may set any scope
        manager  may act on manager/member,  and may set manager/member
        member   may act on nobody

    A manager cannot touch an owner and cannot mint one. Without the second
    half, a manager could promote themselves by proxy: grant a confederate
    'owner', then be promoted back. Both halves are needed and both are tested.

    An unknown scope string is refused rather than ranked. Scope arrives from a
    JWT claim, so treating an unrecognised value as permissive would make a
    forged or stale token more powerful than a real one, not less.
    """
    if actor not in RANK or target not in RANK:
        return False
    if not is_admin_scope(actor):
        return False
    # Equal rank is allowed — a manager may act on another manager — so this is
    # "not strictly more powerful than me", not "strictly less".
    if RANK[target] < RANK[actor]:
        return False
    if new_scope is not None:
        if new_scope not in RANK:
            return False
        if RANK[new_scope] < RANK[actor]:
            return False
    return True


def describe_refusal(actor: str, target: str, new_scope: str | None = None) -> str:
    """The sentence the API returns when may_manage says no.

    Written for the person reading it, not the developer: it says which rule
    stopped them, because "forbidden" on a Team page is indistinguishable from
    a bug.
    """
    if actor not in RANK:
        return "Your access level does not allow managing people."
    if not is_admin_scope(actor):
        return "Only an owner or manager may manage people."
    if target not in RANK:
        return "That person's access level is not recognised."
    if RANK[target] < RANK[actor]:
        return "A manager cannot change an owner. Ask an owner to do it."
    if new_scope is not None and (new_scope not in RANK or RANK[new_scope] < RANK[actor]):
        return "A manager cannot make someone an owner. Ask an owner to do it."
    return ""
