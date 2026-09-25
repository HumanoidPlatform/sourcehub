"""Who may administer whom, exhaustively.

may_manage is the rule most likely to be got subtly wrong later, and it is the
only thing standing between "a colleague you invited" and "a colleague who can
remove you". It is pure, so every combination is cheap to assert — all 36 are
covered here rather than a sampled few.

The two that matter most are the manager rules. Without them a manager could
promote themselves by proxy: grant a confederate 'owner', then be promoted
back.

    pytest tests/test_member_scope_unit.py
"""

from __future__ import annotations

import itertools

import pytest

from sourcehub.modules.identity.members import (
    RANK,
    SCOPES,
    describe_refusal,
    is_admin_scope,
    may_manage,
)


def test_the_three_scopes_match_the_database_enum():
    # grant_scope is ('owner','manager','member') in db/001_conventions.sql:33.
    # A fourth value added there without adding it here would silently rank as
    # unknown and be refused everywhere.
    assert SCOPES == ("owner", "manager", "member")
    assert RANK["owner"] < RANK["manager"] < RANK["member"]


def test_a_member_may_manage_nobody():
    # The whole point of the feature's guard. Every member of a client org
    # holds user.manage from the role, so if this ever returns True the
    # capability check alone is what is left.
    for target, new_scope in itertools.product(SCOPES, (None, *SCOPES)):
        assert may_manage("member", target, new_scope) is False
    assert is_admin_scope("member") is False


def test_an_owner_may_manage_anyone_and_set_any_scope():
    for target, new_scope in itertools.product(SCOPES, (None, *SCOPES)):
        assert may_manage("owner", target, new_scope) is True


def test_a_manager_may_not_touch_an_owner():
    # Lockout path: a manager demoting or revoking the last owner.
    for new_scope in (None, *SCOPES):
        assert may_manage("manager", "owner", new_scope) is False


def test_a_manager_may_not_create_an_owner():
    # Self-promotion by proxy.
    for target in ("manager", "member"):
        assert may_manage("manager", target, "owner") is False


def test_a_manager_may_manage_peers_and_members():
    for target in ("manager", "member"):
        assert may_manage("manager", target, None) is True
        assert may_manage("manager", target, "manager") is True
        assert may_manage("manager", target, "member") is True


@pytest.mark.parametrize("bogus", ["", "admin", "Owner", "OWNER", "wizard", "root"])
def test_an_unrecognised_scope_is_refused_never_ranked(bogus: str):
    # Scope arrives from a JWT claim. Treating an unknown value as permissive
    # would make a forged or stale token MORE powerful than a real one.
    assert may_manage(bogus, "member") is False
    assert may_manage("owner", bogus) is False
    assert may_manage("owner", "member", bogus) is False


def test_every_refusal_carries_a_sentence_and_every_pass_carries_none():
    # A bare 403 on a Team page is indistinguishable from a bug, so anything
    # refused must be able to say why.
    for actor, target, new_scope in itertools.product(SCOPES, SCOPES, (None, *SCOPES)):
        allowed = may_manage(actor, target, new_scope)
        reason = describe_refusal(actor, target, new_scope)
        assert bool(reason) is not allowed, (actor, target, new_scope, reason)
