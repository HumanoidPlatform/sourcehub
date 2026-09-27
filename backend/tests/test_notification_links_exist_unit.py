"""Every notification the API sends must lead somewhere in the console.

A notification carries a deep link as two free-text columns — notification.
link_page and link_params (db/090_notify_audit.sql). There is no CHECK on
link_page, no enum, no Pydantic model: I grepped. The vocabulary exists in
exactly one place, the switch in frontend/src/shared/notifications.ts, and the
backend writes bare string literals into it from 26 call sites.

So the failure mode is silent in both directions:

  * a page the switch does not know falls to `default: return null`, and the row
    renders as an unclickable <div> (Shell.tsx) that is never even marked read.
    This has already shipped three times — gate1, onboarding and network, the
    last of which meant the moment a delivery partner's network grew was the one
    row in its bell that did nothing.
  * a page the switch DOES know, but which belongs to another persona, navigates
    confidently to the wrong screen. That is the bug this file was written for:
    request_loan tagged the sponsor's loan alert "requests", the client's RFP
    list, so a device sponsor was shown an empty RFP page offering to publish
    one. The destination it wanted, "loans", was already in the switch and had
    never been emitted by anything.

This is the same stand-in that test_frontend_calls_exist_unit.py is for routes,
and it lives here for the same reason: the frontend mocks @api/client and the
backend never sees the console, so nothing else compares the two halves.

Call sites are read via the AST, so a link_page named in a comment cannot
satisfy anything. The floors at the bottom exist because the cheapest way for
this file to pass is for an extractor to return nothing.

    pytest tests/test_notification_links_exist_unit.py
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend" / "src" / "sourcehub"
SWITCH = ROOT / "frontend" / "src" / "shared" / "notifications.ts"

# Pages the backend emits that the console deliberately does not route. Each
# needs a reason, and each is checked below to still be emitted — a stale
# allowlist is how a guard like this quietly stops guarding.
NOT_ROUTED_ON_PURPOSE = {
    "assignment": (
        "Handled only by the phone app (mobile/src/app/(app)/notifications.tsx). "
        "Capture happens on the phone; the console has no assignment page, so a "
        "crowd resource signing in here sees an inert row. Known and accepted."
    ),
}


def _notify_sites() -> list[tuple[str, int, str | None]]:
    """(file, line, link_page) for every notify(...) call in the backend.

    link_page is the 4th positional argument at every existing site; the keyword
    form is read too so a future caller that spells it out is still seen. None
    means the call passes no page at all, i.e. deliberately no link.
    """
    out: list[tuple[str, int, str | None]] = []
    for path in sorted(BACKEND.rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            name = (
                node.func.attr if isinstance(node.func, ast.Attribute)
                else getattr(node.func, "id", None)
            )
            if name != "notify":
                continue
            page = None
            if len(node.args) >= 4 and isinstance(node.args[3], ast.Constant):
                page = node.args[3].value
            for kw in node.keywords:
                if kw.arg == "link_page" and isinstance(kw.value, ast.Constant):
                    page = kw.value.value
            out.append((str(path.relative_to(BACKEND)).replace("\\", "/"), node.lineno, page))
    return out


SITES = _notify_sites()
EMITTED = {p for _, _, p in SITES if p}


def _routed_pages() -> set[str]:
    """The case labels in notificationHref, comments stripped.

    Stripped because the file is heavily commented and several comments quote
    page names in prose — including the ones describing this very class of bug.
    """
    text = SWITCH.read_text(encoding="utf-8")
    code = "\n".join(l for l in text.splitlines() if not l.strip().startswith("//"))
    return set(re.findall(r'case\s+"([^"]+)"\s*:', code))


ROUTED = _routed_pages()


# ---------------------------------------------------------------------------
# Anti-vacuous. Both extractors above are regex/AST over other people's files;
# if either silently returns nothing, every assertion below passes.
# ---------------------------------------------------------------------------

def test_the_call_sites_were_actually_found():
    assert len(SITES) >= 20, f"only {len(SITES)} notify() call sites found — extractor broken?"
    assert len(EMITTED) >= 10, f"only {len(EMITTED)} distinct link_page values — extractor broken?"


def test_the_switch_was_actually_parsed():
    assert len(ROUTED) >= 14, f"only {len(ROUTED)} cases parsed from {SWITCH.name} — regex broken?"
    # A page that is certainly there. If this fails the file moved or changed shape.
    assert "contracts" in ROUTED


# ---------------------------------------------------------------------------
# The invariant
# ---------------------------------------------------------------------------

def test_every_emitted_page_is_routed_by_the_console():
    unrouted = sorted(EMITTED - ROUTED - set(NOT_ROUTED_ON_PURPOSE))
    assert not unrouted, (
        "these link_page values are sent by the API but have no case in "
        f"{SWITCH.name}, so the notification renders as an unclickable row: "
        f"{unrouted}. Add a case, or add it to NOT_ROUTED_ON_PURPOSE with a reason."
    )


def test_the_allowlist_has_not_gone_stale():
    # An entry for a page nobody emits any more is dead weight that would also
    # mask a real regression if that name came back.
    for page in NOT_ROUTED_ON_PURPOSE:
        assert page in EMITTED, (
            f"{page!r} is allowlisted as unrouted but nothing emits it any more — "
            "remove the entry"
        )
        assert page not in ROUTED, (
            f"{page!r} is allowlisted as unrouted but the console now routes it — "
            "remove the entry"
        )


def test_every_allowlisted_page_says_why():
    for page, reason in NOT_ROUTED_ON_PURPOSE.items():
        assert len(reason) > 40, f"{page} needs a real reason, not {reason!r}"


# ---------------------------------------------------------------------------
# The specific bug: a device sponsor's loan alert
# ---------------------------------------------------------------------------

def test_the_loan_request_alert_points_at_the_sponsors_queue():
    """request_loan notifies the SPONSOR, whose queue is /loans.

    It used to send "requests" — the client's RFP list — so the sponsor landed
    on a screen offering to publish an RFP, empty because RLS returns them none.
    Asserted on the call site rather than on a grep of the file, because the
    fix's own comment mentions both words.
    """
    network = [s for s in SITES if s[0] == "modules/network/service.py"]
    assert network, "no notify() calls found in the network module"
    pages = {p for _, _, p in network}
    assert "loans" in pages, (
        f"the loan request alert must send link_page 'loans'; found {sorted(pages)}"
    )
    assert "requests" not in pages, (
        "'requests' is the client's RFP list — a device sponsor sent there gets "
        "an empty page with a New RFP button"
    )


def test_nothing_in_the_backend_emits_the_rfp_list_any_more():
    # "requests" remains a valid case for a client, but after the fix no producer
    # exists. If one appears, it should be a deliberate choice by someone who has
    # read why this test is here.
    senders = [f"{f}:{ln}" for f, ln, p in SITES if p == "requests"]
    assert not senders, (
        f"link_page 'requests' is emitted at {senders}. That is the client's RFP "
        "list; check the recipient is a client org and not a sponsor or partner."
    )


def test_links_that_go_nowhere_stay_deliberate():
    """A notify() with no link_page renders as an inert row too.

    Exactly one is intentional: engage/service.py's task offer, which tells the
    worker to answer via the links in their email. A second one appearing should
    be a decision, not a default.
    """
    linkless = [f"{f}:{ln}" for f, ln, p in SITES if p is None]
    assert len(linkless) <= 1, (
        f"{len(linkless)} notify() calls pass no link_page, so each renders as an "
        f"unclickable row: {linkless}. Give it a page, or extend this bound with "
        "a note saying why the row needs no destination."
    )
