"""invite_member must refuse out loud, and must never report a fault as success.

The bug this guards against shipped once. `except DBAPIError: return
{"invited": True}` meant inviting an address that already had an account —
normal to attempt, since app_user.email is unique platform-wide — reported
"Invitation sent", created nothing and sent no mail. A dropped connection would
have read the same way.

Asserted against the parsed function rather than the file's text: a string
search for `return {"invited": True}` would be satisfied by the legitimate one
at the end of the happy path, and defeated by any reformatting. The AST lets us
ask the precise question — does the exception handler have a path that returns
instead of raising?

    pytest tests/test_invite_member_refusals_unit.py
"""

from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SERVICE = ROOT / "backend" / "src" / "sourcehub" / "modules" / "identity" / "service.py"
SOURCE = SERVICE.read_text(encoding="utf-8")
TREE = ast.parse(SOURCE)


def _function(name: str) -> ast.AsyncFunctionDef:
    for node in ast.walk(TREE):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found in {SERVICE.name}")


INVITE = _function("invite_member")


def _handlers(fn: ast.AST) -> list[ast.ExceptHandler]:
    return [n for n in ast.walk(fn) if isinstance(n, ast.ExceptHandler)]


def test_invite_member_exists_and_is_parsed():
    # Anti-vacuous: every assertion below walks INVITE, so a rename that made
    # _function fail must fail loudly rather than leave this file passing.
    assert isinstance(INVITE, ast.AsyncFunctionDef)
    assert _handlers(INVITE), "no exception handler in invite_member"


def test_no_exception_handler_returns_instead_of_raising():
    """The regression guard. An unrecognised database error must propagate.

    Any `return` inside an `except` block here is the old bug: it converts a
    fault into a 202 the caller believes.
    """
    offenders = []
    for handler in _handlers(INVITE):
        for node in ast.walk(handler):
            if isinstance(node, ast.Return):
                offenders.append(ast.unparse(node))
    assert not offenders, (
        "invite_member's exception handler returns instead of raising, so a "
        f"database fault would be reported as success: {offenders}"
    )


def test_the_handler_ends_by_re_raising():
    """Not just 'no return' — there must be an unconditional bare `raise`.

    A handler that recognised three conditions and fell off the end would
    swallow everything else silently, which is the same defect wearing a
    different hat.
    """
    handler = _handlers(INVITE)[0]
    bare_raises = [
        n for n in handler.body if isinstance(n, ast.Raise) and n.exc is None
    ]
    assert bare_raises, "the handler must end with a bare `raise` for the unrecognised case"


def test_the_address_is_checked_before_the_write():
    """email_is_taken runs above RLS (db/160), which is the only way to see an
    address held by an organisation the caller cannot read. Without it the clash
    surfaces as a unique violation from inside invite_member — indistinguishable
    from a real fault, which is how it came to be swallowed.

    Asserted on CALL nodes, not on any string in the function. The first version
    of this searched every constant, and the docstring's own citation of
    db/160_email_is_taken.sql satisfied it — so deleting the call left the test
    green. A comment must never be able to satisfy an assertion about code.
    """
    calls = [
        ast.unparse(n)
        for n in ast.walk(INVITE)
        if isinstance(n, ast.Call) and "email_is_taken" in ast.unparse(n)
    ]
    assert calls, "invite_member must call email_is_taken before inserting"


def test_a_prior_member_skips_the_taken_check():
    """Rejoining must still work.

    A revoked ex-member's address IS taken — by themselves. Checking
    email_is_taken unconditionally would make re-inviting them impossible, and
    that path shares this code. The guard is that the check sits under a test
    for no prior grant.
    """
    assert "org_member_by_email" in SOURCE
    # The check must sit INSIDE a conditional — the branch for "no prior grant
    # in this organisation". Looking for it anywhere in the function would pass
    # even if it ran unconditionally, so this asks specifically whether some
    # `if` guards it.
    #
    # Note the docstring also contains the words "email_is_taken" (it cites
    # db/160), which is why this examines If bodies rather than the function
    # text — the first version of this test was satisfied by the prose.
    guarded = [
        ast.unparse(node.test)
        for node in ast.walk(INVITE)
        if isinstance(node, ast.If)
        and any("email_is_taken" in ast.unparse(stmt) for stmt in node.body)
    ]
    assert guarded, (
        "email_is_taken must be conditional on there being no prior grant, "
        "or a revoked ex-member can never rejoin"
    )
    # And that condition must be about the absence of a prior member.
    assert any("prior" in cond for cond in guarded), guarded


def test_the_refusal_names_no_organisation_or_role():
    """Existence is a small leak; membership is not.

    Saying WHICH organisation holds an address would turn this form into a
    directory of other tenants' staff — the thing db/160_email_is_taken.sql's
    header refuses to do. The message must be a plain literal with nothing
    interpolated into it.
    """
    literals = [
        n.value for n in ast.walk(INVITE)
        if isinstance(n, ast.Constant) and isinstance(n.value, str)
        and "already belongs to someone" in n.value
    ]
    assert literals, "the platform-clash message is missing"
    for text in literals:
        assert "on the platform" in text
        for leak in ("org_name", "organisation }", "{org", "role_code", "{role"):
            assert leak not in text, f"the refusal must not name {leak}"
    # And it must not be built by an f-string, which is how an org name would
    # get in later.
    joined = [
        ast.unparse(n) for n in ast.walk(INVITE)
        if isinstance(n, ast.JoinedStr) and "already belongs to someone" in ast.unparse(n)
    ]
    assert not joined, "the platform-clash message must stay a plain literal"


def test_the_return_says_whether_mail_was_sent():
    # The console distinguishes "Invitation sent" from "Colleague added" by
    # this. Hard-coding True would make a rejoining colleague who already has a
    # password appear to have been emailed a link they never received.
    returns = [
        ast.unparse(n) for n in ast.walk(INVITE)
        if isinstance(n, ast.Return) and n.value is not None
    ]
    assert any("invitation_sent" in r for r in returns), (
        f"invite_member must report whether an invitation was actually sent: {returns}"
    )


# ---------------------------------------------------------------------------
# _assert_owner_reachable must convert the owner violation, not just relocate it.
#
# SET CONSTRAINTS ... IMMEDIATE makes Postgres run the queued deferred check
# DURING that statement, so a genuine violation raises from that line. The first
# version left it bare, and the sole-owner cases the function exists to explain
# returned 500 anyway — the error had been moved inside the transaction and still
# nobody caught it. The only test guarding it grepped for the SQL string, which
# stayed true the whole time.
# ---------------------------------------------------------------------------

ASSERT_OWNER = _function("_assert_owner_reachable")


def _set_constraints_call(fn: ast.AST) -> ast.Call:
    for node in ast.walk(fn):
        if isinstance(node, ast.Call) and "SET CONSTRAINTS" in ast.unparse(node):
            return node
    raise AssertionError("no SET CONSTRAINTS call in _assert_owner_reachable")


def test_the_set_constraints_call_is_inside_a_try():
    """The whole point. Outside a try, the violation is an uncaught
    IntegrityError and the caller gets a 500."""
    call = _set_constraints_call(ASSERT_OWNER)
    guarded = [
        t for t in ast.walk(ASSERT_OWNER)
        if isinstance(t, ast.Try)
        and any(call is n for stmt in t.body for n in ast.walk(stmt))
    ]
    assert guarded, (
        "SET CONSTRAINTS must sit inside a try: Postgres runs the deferred check "
        "during that statement, so a violation raises there and nothing below it runs"
    )


def test_the_handler_converts_the_owner_violation():
    # Asserted on the string compared against, not on the message returned: a
    # handler that raised MemberError for everything would also satisfy a check
    # for the friendly text.
    call = _set_constraints_call(ASSERT_OWNER)
    tries = [
        t for t in ast.walk(ASSERT_OWNER)
        if isinstance(t, ast.Try)
        and any(call is n for stmt in t.body for n in ast.walk(stmt))
    ]
    handlers = [h for t in tries for h in t.handlers]
    assert handlers, "the try must have an except clause"
    joined = " ".join(ast.unparse(h) for h in handlers)
    assert "must keep at least one owner" in joined, (
        "the handler must recognise the owner violation specifically"
    )
    assert "MemberError" in joined, "it must be converted to a MemberError the route maps to 409"


def test_that_handler_re_raises_anything_else():
    # Without a bare raise, a connection fault or any other constraint would be
    # swallowed — the same defect invite_member had.
    call = _set_constraints_call(ASSERT_OWNER)
    tries = [
        t for t in ast.walk(ASSERT_OWNER)
        if isinstance(t, ast.Try)
        and any(call is n for stmt in t.body for n in ast.walk(stmt))
    ]
    bare = [
        n for t in tries for h in t.handlers for n in ast.walk(h)
        if isinstance(n, ast.Raise) and n.exc is None
    ]
    assert bare, "the handler must end with a bare `raise` for anything it does not recognise"


def test_the_friendly_count_still_exists_after_it():
    # The trigger counts 'invited' owners; login() admits only active/locked. So
    # an org whose last owner never accepted passes the trigger and still cannot
    # be administered — which is what this second check is for.
    src = ast.unparse(ASSERT_OWNER)
    assert "'active','locked'" in src.replace(" ", "") or "active" in src
    assert "no owner who can sign in" in src
