"""Every e-mail the platform sends is an outbox row, queued in the deciding
transaction (db/490). Read off the modules' ASTs, as test_roster_import_unit
does, so a future `send_mail` slipping back into a request handler fails here.

    pytest tests/test_mail_callsites_unit.py
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[1] / "src" / "sourcehub"
MODULES = ("identity", "onboarding", "network", "delivery", "engage", "catalogue", "marketplace")


def _tree(module: str) -> ast.Module:
    return ast.parse((SRC / "modules" / module / "service.py").read_text(encoding="utf-8"))


def _text(module: str) -> str:
    return (SRC / "modules" / module / "service.py").read_text(encoding="utf-8")


def _function(tree: ast.AST, name: str) -> ast.FunctionDef | ast.AsyncFunctionDef:
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name == name:
            return node
    raise AssertionError(f"{name} not found")


def _calls(fn: ast.AST) -> set[str]:
    out: set[str] = set()
    for node in ast.walk(fn):
        if isinstance(node, ast.Call):
            f = node.func
            out.add(f.attr if isinstance(f, ast.Attribute) else getattr(f, "id", ""))
    return out


def _strings(fn: ast.AST) -> list[str]:
    return [
        n.value for n in ast.walk(fn) if isinstance(n, ast.Constant) and isinstance(n.value, str)
    ]


def _imports_smtp(text: str) -> bool:
    """The adapter import, in either spelling: `from sourcehub.platform.mail.smtp import ...`
    or `from sourcehub.platform.mail import ..., smtp`."""
    return bool(
        re.search(r"from sourcehub\.platform\.mail(\.smtp import|\s+import\s+[^\n]*\bsmtp\b)", text)
    )


# ---------------------------------------------------------------------------
# Nothing in the domain talks to the mail server
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("module", MODULES)
def test_no_domain_module_sends_mail_directly(module):
    assert not _imports_smtp(_text(module)), module
    calls = _calls(_tree(module))
    assert "send_mail" not in calls and "send_many" not in calls, module


def test_only_the_outbox_imports_the_mail_adapter():
    users = sorted(
        p.relative_to(SRC).as_posix()
        for p in (SRC / "modules").rglob("*.py")
        if _imports_smtp(p.read_text(encoding="utf-8"))
    )
    assert users == ["modules/outbox/service.py"]


# ---------------------------------------------------------------------------
# Each trigger queues a row, in its own transaction
# ---------------------------------------------------------------------------

QUEUES = {
    "identity": ["request_password_reset", "_queue_member_invitation"],
    "onboarding": ["_approve", "resend_invitation"],
    "network": ["_queue_worker_invitation"],
    "delivery": ["create_offer"],
    "engage": ["_send"],
    "catalogue": ["_email_public_reply"],
}


@pytest.mark.parametrize(("module", "fn"), [(m, f) for m, fs in QUEUES.items() for f in fs])
def test_the_trigger_queues_one_address(module, fn):
    assert "enqueue_to" in _calls(_function(_tree(module), fn)), (module, fn)


def test_the_rfp_mails_fan_out_through_the_organisation_form():
    tree = _tree("marketplace")
    for fn in ("_announce_publish", "award"):
        assert "enqueue" in _calls(_function(tree, fn))


@pytest.mark.parametrize(
    ("module", "caller", "helper"),
    [
        ("identity", "invite_member", "_queue_member_invitation"),
        ("identity", "resend_member_invitation", "_queue_member_invitation"),
        ("network", "invite_worker", "_queue_worker_invitation"),
        ("network", "import_rows", "_queue_worker_invitation"),
        ("network", "resend_worker_invitation", "_queue_worker_invitation"),
    ],
)
def test_every_invitation_path_uses_the_queueing_helper(module, caller, helper):
    assert helper in _calls(_function(_tree(module), caller)), (caller, helper)


def test_a_password_reset_is_queued_inside_the_token_transaction():
    fn = _function(_tree("identity"), "request_password_reset")
    inside = [
        n
        for w in ast.walk(fn)
        if isinstance(w, ast.AsyncWith)
        for n in ast.walk(w)
        if isinstance(n, ast.Call)
    ]
    names = {
        c.func.attr if isinstance(c.func, ast.Attribute) else getattr(c.func, "id", "")
        for c in inside
    }
    assert "enqueue_to" in names
    assert "password_reset_create" in " ".join(_strings(fn))


def test_token_mails_are_scrubbed_once_sent_and_cannot_be_resent_after_their_link_dies():
    for module, fn in (
        ("identity", "request_password_reset"),
        ("identity", "_queue_member_invitation"),
        ("onboarding", "_approve"),
        ("onboarding", "resend_invitation"),
        ("network", "_queue_worker_invitation"),
        ("delivery", "create_offer"),
    ):
        src = ast.get_source_segment(_text(module), _function(_tree(module), fn)) or ""
        assert "scrub=True" in src and "resend_until=" in src, (module, fn)


def test_the_offer_lets_the_outbox_record_delivery():
    tree = _tree("delivery")
    fn = _function(tree, "create_offer")
    assigned = {
        t.attr
        for n in ast.walk(fn)
        if isinstance(n, ast.Assign)
        for t in n.targets
        if isinstance(t, ast.Attribute)
    }
    assert "sent_at" not in assigned and "send_error" not in assigned
    with pytest.raises(AssertionError):
        _function(tree, "_send_offer_emails")
    assert "task_offer_recipient" in _strings(fn)
    # the mail is rendered from the stored context later; the subject travels with it
    ctx = _function(tree, "offer_context")
    assert "subject" in " ".join(_strings(ctx))


def test_reminders_are_recorded_before_they_are_queued():
    fn = _function(_tree("engage"), "_send")
    sql = " ".join(_strings(fn))
    assert "INSERT INTO engagement_reminder" in sql and "RETURNING id" in sql
    assert ":sent_at" not in sql and ":err" not in sql
    assert "enqueue_to" in _calls(fn) and "engagement_reminder" in _strings(fn)


def test_a_public_reply_is_recorded_whether_or_not_the_mail_leaves():
    tree = _tree("catalogue")
    fn = _function(tree, "_email_public_reply")
    assert not any(isinstance(n, ast.Raise) for n in ast.walk(fn))
    assert "catalogue.deal.emailed" in _strings(fn)
    assert "reply_to=" in (ast.get_source_segment(_text("catalogue"), fn) or "")
    msg = _function(tree, "_message")
    assert "email_status" in _strings(msg) and "email_reason" in _strings(msg)
    listing = _function(tree, "list_messages")
    assert "mail_status('datahub_deal_message', m.id)" in " ".join(_strings(listing))


def test_the_roster_import_no_longer_reports_delivery_it_cannot_know():
    text = _text("network")
    assert "invitation_failures" not in text and "invitation_error" not in text
