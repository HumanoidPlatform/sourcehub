"""The pure parts of a task offer: the state a link is in, the email, the
multipart message. No database, no SMTP — the rest is driven by
tests/e2e_loop.py against the stack.

    pytest tests/test_task_offer_unit.py
"""

from __future__ import annotations

import datetime as dt

from sourcehub.modules.delivery import service as delivery
from sourcehub.platform.mail import smtp

NOW = dt.datetime(2026, 9, 16, 12, 0, tzinfo=dt.timezone.utc)


def row(**over):
    base = dict(
        response=None, offer_status="open", accepted_count=0, worker_limit=2,
        respond_by=NOW + dt.timedelta(days=1), task_status="assigned", grant_live=True,
    )
    base.update(over)
    return base


def test_state_open_by_default():
    assert delivery.offer_state(row(), NOW) == "open"


def test_state_each_reason():
    assert delivery.offer_state(row(response="declined"), NOW) == "responded"
    assert delivery.offer_state(row(offer_status="closed"), NOW) == "closed"
    assert delivery.offer_state(row(offer_status="filled"), NOW) == "filled"
    assert delivery.offer_state(row(accepted_count=2), NOW) == "filled"  # counter, even if status lags
    assert delivery.offer_state(row(respond_by=NOW - dt.timedelta(seconds=1)), NOW) == "expired"
    assert delivery.offer_state(row(task_status="submitted"), NOW) == "task_closed"
    assert delivery.offer_state(row(grant_live=False), NOW) == "not_a_worker"


def test_state_precedence_an_answer_wins_over_everything():
    r = row(response="accepted", offer_status="closed", accepted_count=2,
            respond_by=NOW - dt.timedelta(days=1), task_status="cancelled", grant_live=False)
    assert delivery.offer_state(r, NOW) == "responded"
    r["response"] = None
    assert delivery.offer_state(r, NOW) == "closed"
    r["offer_status"] = "open"
    assert delivery.offer_state(r, NOW) == "filled"
    r["accepted_count"] = 0
    assert delivery.offer_state(r, NOW) == "expired"
    r["respond_by"] = NOW + dt.timedelta(days=1)
    assert delivery.offer_state(r, NOW) == "task_closed"
    r["task_status"] = "in_progress"
    assert delivery.offer_state(r, NOW) == "not_a_worker"


def test_unavailable_error_carries_the_http_status():
    assert delivery.OfferUnavailableError("filled", "x").http_status == 410
    assert delivery.OfferUnavailableError("closed", "x").http_status == 410
    assert delivery.OfferUnavailableError("expired", "x").http_status == 410
    assert delivery.OfferUnavailableError("responded", "x").http_status == 409


def _mail(**over):
    kw = dict(
        worker_name="Priya", org_name="Bengaluru Crowd <b>", task_ref="TSK-07",
        task_title="<script>alert(1)</script> shelves", unit="photos", quantity=3,
        worker_limit=1, due_on=dt.date(2026, 10, 1), respond_by=NOW, instructions="No shoppers & no glare",
        accept_url="http://c/offer?token=abc&intent=accept",
        decline_url="http://c/offer?token=abc&intent=decline",
    )
    kw.update(over)
    return delivery._offer_email(**kw)


def test_email_text_part_has_both_links_on_their_own_lines():
    _, text, _ = _mail()
    lines = [ln.strip() for ln in text.splitlines()]
    assert "http://c/offer?token=abc&intent=accept" in lines
    assert "http://c/offer?token=abc&intent=decline" in lines
    assert "3 photos" in text and "1 place," in text and "No shoppers & no glare" in text


def test_email_html_escapes_every_field_and_links_the_buttons():
    _, _, html = _mail()
    assert "<script>" not in html and "&lt;script&gt;" in html
    assert "Bengaluru Crowd &lt;b&gt;" in html
    assert "No shoppers &amp; no glare" in html
    assert 'href="http://c/offer?token=abc&amp;intent=accept"' in html
    assert 'href="http://c/offer?token=abc&amp;intent=decline"' in html


def test_email_plural_and_optional_parts():
    subject, text, html = _mail(worker_limit=3, instructions=None, due_on=None)
    assert "3 places," in text
    assert "Instructions" not in text and "Instructions" not in html
    assert "not set" in text
    assert subject == "Bengaluru Crowd <b> is offering you a task — TSK-07 <script>alert(1)</script> shelves"


def test_message_is_multipart_alternative_text_first():
    msg = smtp._build("a@b.example", "Hi", "plain body", "<p>rich</p>")
    assert msg.get_content_type() == "multipart/alternative"
    parts = list(msg.iter_parts())
    assert [p.get_content_type() for p in parts] == ["text/plain", "text/html"]
    assert parts[0].get_content().strip() == "plain body"
    assert "<p>rich</p>" in parts[1].get_content()


def test_message_without_html_stays_plain():
    msg = smtp._build("a@b.example", "Hi", "plain body")
    assert msg.get_content_type() == "text/plain"
