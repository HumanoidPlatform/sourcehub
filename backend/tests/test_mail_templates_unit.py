"""Every platform e-mail is rendered from platform/mail/templates and carries
the brand.

What this file guards:

  * a title or a name that is somebody else's input reaching a mail client
    unescaped (the HTML part), or arriving escaped where a person reads it as
    text (the text part);
  * a link leaving its own line in the text part — the e2e harness reads the
    token from there, and so does a plain mail client;
  * a mail without the logo, the byline or the LinkedIn address, or with the
    address only inside an image a client may block;
  * a template without its text sibling or its builder, and an outbox row
    naming a template the dispatcher cannot render;
  * a subject changing by accident: the e2e harness matches them verbatim.

    pytest tests/test_mail_templates_unit.py
"""

from __future__ import annotations

import pytest

from sourcehub.config import LINKEDIN_URL, settings
from sourcehub.platform.mail import messages, render
from sourcehub.platform.mail.render import TEMPLATES, brand

LINK = "http://c/accept-invitation?token=abc123&x=1"
HOSTILE = "<script>alert(1)</script> & co"

CASES: dict[str, dict[str, object]] = {
    "rfp_published": {
        "recipient_name": HOSTILE,
        "recipient_org": "NorthStar & Co",
        "client_name": "Acme <Retail>",
        "ref": "RFP-0007",
        "title": "Shelf & price tags",
        "category": "Image",
        "quantity_text": "25,000 photos",
        "countries_text": "US, IN",
        "bids_close": "5 Oct 2026, 18:00 UTC",
        "delivery_due": "2026-12-01",
        "request_id": "11111111-1111-1111-1111-111111111111",
    },
    "rfp_awarded": {
        "recipient_name": HOSTILE,
        "recipient_org": "NorthStar & Co",
        "client_name": "Acme <Retail>",
        "request_ref": "RFP-0007",
        "title": "Shelf & price tags",
        "contract_ref": "CTR-0003",
        "price_text": "USD 2,900 per 1,000 photos",
        "contract_id": "22222222-2222-2222-2222-222222222222",
    },
    "task_ended": {
        "recipient_name": HOSTILE,
        "recipient_org": "NorthStar & Co",
        "headline": "Acme <Field> declined TSK-07 Shelf & price tags",
        "task_ref": "TSK-07",
        "title": "Shelf & price tags",
        "contract_ref": "CTR-0003",
        "what": "was declined",
        "reason": "No crowd in <Pune> this month",
        "path": "/contracts/22222222-2222-2222-2222-222222222222",
    },
    "contract_ended": {
        "recipient_name": HOSTILE,
        "recipient_org": "NorthStar & Co",
        "headline": "Acme <Retail> (the client) ended CTR-0003 Shelf & price tags",
        "contract_ref": "CTR-0003",
        "title": "Shelf & price tags",
        "reason": "Budget <withdrawn>",
        "detail": "Work that passed QA stays accepted & payable.",
        "path": "/contracts/22222222-2222-2222-2222-222222222222",
    },
    "password_reset": {"full_name": HOSTILE, "link": LINK},
    "member_invitation": {
        "full_name": "Asha",
        "org_name": HOSTILE,
        "inviter": "Ravi <x>",
        "link": LINK,
        "ttl_days": 14,
    },
    "onboarding_approved": {"full_name": "Asha", "org_name": HOSTILE, "link": LINK, "ttl_days": 14},
    "onboarding_reminder": {"org_name": HOSTILE, "link": LINK},
    "worker_invitation": {"full_name": "Asha", "org_name": HOSTILE, "link": LINK, "ttl_days": 14},
    "public_reply": {
        "body": "Yes & no\n<b>second line</b>",
        "sender_name": "Ravi",
        "org_name": HOSTILE,
        "dataset_title": "Sample <set>",
        "dataset_url": "http://c/datahub/public/sample",
    },
}

SUBJECTS = {
    "rfp_published": "New RFP: RFP-0007 Shelf & price tags",
    "rfp_awarded": "You won RFP-0007 Shelf & price tags",
    "task_ended": "TSK-07 Shelf & price tags was declined",
    "contract_ended": "CTR-0003 Shelf & price tags was ended",
    "password_reset": "Reset your DataMind360 password",
    "member_invitation": f"You're invited to DataMind360 — {HOSTILE}",
    "onboarding_approved": f"You're invited to DataMind360 — {HOSTILE}",
    "onboarding_reminder": f"Reminder: your DataMind360 invitation — {HOSTILE}",
    "worker_invitation": f"You're invited to DataMind360 — {HOSTILE}",
    "public_reply": "Re: your quote request for Sample <set>",
}


def _mail(name: str) -> tuple[str, str, str]:
    subject, text, html = getattr(messages, name)(**CASES[name])
    return subject, text, html


# ---------------------------------------------------------------------------
# Escaping, links and the brand
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("name", sorted(CASES))
def test_html_escapes_every_field_and_text_never_does(name):
    _, text, html = _mail(name)
    assert "<script>" not in html and "&lt;script&gt;" in html, name
    assert "<script>" in text and "&lt;" not in text and "&amp;" not in text, name


@pytest.mark.parametrize("name", sorted(CASES))
def test_every_mail_carries_the_logo_the_byline_and_the_linkedin_address(name):
    _, text, html = _mail(name)
    assert "/brand/email-logo.png" in html and "/brand/linkedin.png" in html
    assert "by Cosarathi" in html
    # Linked from the mark AND written out: a client that blocks images still
    # shows where to find the company.
    assert f'href="{LINKEDIN_URL}"' in html
    assert f">{LINKEDIN_URL}</a>" in html
    assert LINKEDIN_URL in text
    assert "A Cosarathi product" in html and "A Cosarathi product" in text


@pytest.mark.parametrize("name", [n for n in sorted(CASES) if "link" in CASES[n]])
def test_the_link_stands_on_its_own_line_in_text_and_is_a_button_in_html(name):
    _, text, html = _mail(name)
    lines = [ln.strip() for ln in text.splitlines()]
    assert LINK in lines, text
    assert 'href="http://c/accept-invitation?token=abc123&amp;x=1"' in html


def test_the_rfp_mails_link_the_console_pages():
    base = settings.app_base_url.rstrip("/")
    _, text, html = _mail("rfp_published")
    url = f"{base}/requests/11111111-1111-1111-1111-111111111111"
    assert url in [ln.strip() for ln in text.splitlines()] and f'href="{url}"' in html
    for field in (
        "Acme <Retail>",
        "RFP-0007",
        "Shelf & price tags",
        "25,000 photos",
        "US, IN",
        "5 Oct 2026, 18:00 UTC",
        "2026-12-01",
        "NorthStar & Co",
    ):
        assert field in text, field
    _, text, html = _mail("rfp_awarded")
    url = f"{base}/contracts/22222222-2222-2222-2222-222222222222"
    assert url in [ln.strip() for ln in text.splitlines()] and f'href="{url}"' in html
    assert "CTR-0003" in text and "USD 2,900 per 1,000 photos" in text
    assert "Break the contract into tasks" in text


def test_the_task_ended_mail_says_who_why_and_links_the_page():
    base = settings.app_base_url.rstrip("/")
    _, text, html = _mail("task_ended")
    url = f"{base}/contracts/22222222-2222-2222-2222-222222222222"
    assert url in [ln.strip() for ln in text.splitlines()] and f'href="{url}"' in html
    assert "Acme <Field> declined TSK-07 Shelf & price tags." in text
    assert "No crowd in <Pune> this month" in text and "CTR-0003" in text
    assert "No crowd in &lt;Pune&gt; this month" in html


def test_the_contract_ended_mail_says_who_why_what_it_means_and_links_the_page():
    base = settings.app_base_url.rstrip("/")
    _, text, html = _mail("contract_ended")
    url = f"{base}/contracts/22222222-2222-2222-2222-222222222222"
    assert url in [ln.strip() for ln in text.splitlines()] and f'href="{url}"' in html
    assert "Acme <Retail> (the client) ended CTR-0003 Shelf & price tags." in text
    assert "Budget <withdrawn>" in text and "Budget &lt;withdrawn&gt;" in html
    assert "Work that passed QA stays accepted & payable." in text


@pytest.mark.parametrize("name", sorted(CASES))
def test_subjects_are_verbatim(name):
    assert _mail(name)[0] == SUBJECTS[name]


def test_the_image_addresses_follow_app_base_url(monkeypatch):
    monkeypatch.setattr(settings, "app_base_url", "https://console.example/")
    b = brand()
    assert b["logo_url"] == "https://console.example/brand/email-logo.png"
    assert b["linkedin_icon_url"] == "https://console.example/brand/linkedin.png"
    assert b["app_base_url"] == "https://console.example"
    assert b["linkedin_url"] == LINKEDIN_URL


# ---------------------------------------------------------------------------
# The folder and the registry
# ---------------------------------------------------------------------------


def test_every_template_has_a_text_sibling_and_a_builder():
    names = render.template_names()
    assert names == sorted(
        [
            "assignment_reminder",
            "contract_ended",
            "member_invitation",
            "onboarding_approved",
            "onboarding_reminder",
            "password_reset",
            "public_reply",
            "rfp_awarded",
            "rfp_published",
            "task_ended",
            "task_offer",
            "worker_invitation",
        ]
    )
    for n in names:
        assert (TEMPLATES / f"{n}.txt").exists(), n
        assert callable(getattr(messages, n)), n
    assert (TEMPLATES / "base.html").exists()
    # db/490: every mail is an outbox row, so every template has a registered builder
    assert set(messages.OUTBOX) == set(names)


def test_build_renders_a_stored_row_and_refuses_what_it_cannot():
    subject, text, html = messages.build("rfp_awarded", CASES["rfp_awarded"])
    assert subject == SUBJECTS["rfp_awarded"] and "CTR-0003" in text and "CTR-0003" in html
    with pytest.raises(KeyError):
        messages.build("no_such_mail", {})
    with pytest.raises(TypeError):
        messages.build("rfp_awarded", {"bogus": 1})


def test_build_renders_the_two_module_owned_mails_from_their_stored_context():
    subject, text, html = messages.build(
        "task_offer",
        {
            "subject": "Crowd is offering you a task — TSK-07 Shelves",
            "worker_name": "Priya",
            "org_name": "Crowd",
            "task_ref": "TSK-07",
            "task_title": "Shelves",
            "unit": "photos",
            "quantity": 3,
            "places": "1 place",
            "due": "2026-10-01",
            "by": "01 Oct 2026, 12:00 UTC",
            "instructions": None,
            "accept_url": "http://a",
            "decline_url": "http://d",
            "lead": None,
        },
    )
    assert subject == "Crowd is offering you a task — TSK-07 Shelves"
    assert "http://a" in [ln.strip() for ln in text.splitlines()] and ">Accept</a>" in html
    subject, text, html = messages.build(
        "assignment_reminder",
        {
            "subject": "Reminder: TASK-042 Shelves is waiting for you to start",
            "worker_name": "Asha",
            "org_name": "Field Co",
            "title": "TASK-042 Shelves",
            "unit": "photos",
            "quantity": 20,
            "due": "not set",
            "line": "You accepted this task 3 days ago.",
            "action": "start it",
        },
    )
    assert subject.startswith("Reminder:") and "start it" in text and "<strong>You accepted" in html


# ---------------------------------------------------------------------------
# The two mails whose modules own the subject
# ---------------------------------------------------------------------------


def test_task_offer_renders_the_same_facts_as_before():
    text, html = messages.task_offer(
        worker_name="Priya",
        org_name="Bengaluru Crowd <b>",
        task_ref="TSK-07",
        task_title="<script>alert(1)</script> shelves",
        unit="photos",
        quantity=3,
        places="1 place",
        due="2026-10-01",
        by="01 Oct 2026, 12:00 UTC",
        instructions="No shoppers & no glare",
        accept_url="http://c/offer?token=abc&intent=accept",
        decline_url="http://c/offer?token=abc&intent=decline",
    )
    lines = [ln.strip() for ln in text.splitlines()]
    assert "http://c/offer?token=abc&intent=accept" in lines
    assert "http://c/offer?token=abc&intent=decline" in lines
    assert "3 photos" in text and "1 place," in text and "No shoppers & no glare" in text
    assert "<script>" not in html and "&lt;script&gt;" in html
    assert 'href="http://c/offer?token=abc&amp;intent=accept"' in html
    assert ">Accept</a>" in html and ">Decline</a>" in html
    text, html = messages.task_offer(
        worker_name="Priya",
        org_name="Crowd",
        task_ref="TSK-07",
        task_title="Shelves",
        unit="photos",
        quantity=3,
        places="3 places",
        due="not set",
        by="x",
        instructions=None,
        accept_url="http://a",
        decline_url="http://d",
        lead="Last call.",
    )
    assert "Instructions" not in text and "Instructions" not in html
    assert "Last call." in text and "<strong>Last call.</strong>" in html


def test_assignment_reminder_renders_the_line_and_the_app():
    line = "You accepted this task 3 days ago and have not started it yet."
    text, html = messages.assignment_reminder(
        worker_name="Asha",
        org_name="Field Co <north>",
        title="TASK-042 Shelf & price tags",
        unit="photos",
        quantity=20,
        due="not set",
        line=line,
        action="start it",
    )
    assert line in text and f"<strong>{line}</strong>" in html
    assert "Cosarathi Capture" in text and "start it" in text
    assert "Shelf &amp; price tags" in html and "Field Co &lt;north&gt;" in html
