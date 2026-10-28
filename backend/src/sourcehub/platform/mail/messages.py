"""The platform's e-mails, one builder each.

Builders are pure — no I/O, no session — so a module renders and then sends
through platform.mail.smtp exactly as before, and the outbox dispatcher
(modules/outbox) renders a stored row by template name through build().

Subjects live here, not in the templates: tests and the e2e harness match them
verbatim, and a subject must never pick up a template's whitespace. The two
mails whose wording depends on business rules (a task offer, an assignment
reminder) keep their subject and derived fields in their own modules
(delivery.offer_context, engage.assignment_reminder_context) and store them in
the outbox row's context; task_offer_mail and assignment_reminder_mail turn
that stored context back into a mail.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sourcehub.config import PRODUCT
from sourcehub.platform.mail.render import render

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping

Mail = tuple[str, str, str]  # (subject, text, html)


# ---------------------------------------------------------------------------
# Sent by the outbox: the RFP marketplace
# ---------------------------------------------------------------------------


def rfp_published(
    *,
    recipient_name: str,
    recipient_org: str,
    client_name: str,
    ref: str,
    title: str,
    category: str,
    quantity_text: str,
    countries_text: str,
    bids_close: str,
    delivery_due: str,
    request_id: str,
) -> Mail:
    text, html = render(
        "rfp_published",
        recipient_name=recipient_name,
        recipient_org=recipient_org,
        client_name=client_name,
        ref=ref,
        title=title,
        category=category,
        quantity_text=quantity_text,
        countries_text=countries_text,
        bids_close=bids_close,
        delivery_due=delivery_due,
        request_id=request_id,
    )
    return f"New RFP: {ref} {title}", text, html


def rfp_awarded(
    *,
    recipient_name: str,
    recipient_org: str,
    client_name: str,
    request_ref: str,
    title: str,
    contract_ref: str,
    price_text: str,
    contract_id: str,
) -> Mail:
    text, html = render(
        "rfp_awarded",
        recipient_name=recipient_name,
        recipient_org=recipient_org,
        client_name=client_name,
        request_ref=request_ref,
        title=title,
        contract_ref=contract_ref,
        price_text=price_text,
        contract_id=contract_id,
    )
    return f"You won {request_ref} {title}", text, html


def task_ended(
    *,
    recipient_name: str,
    recipient_org: str,
    headline: str,
    task_ref: str,
    title: str,
    contract_ref: str,
    what: str,
    reason: str,
    path: str,
) -> Mail:
    """A task ended before passing QA (db/600), told to the organisation on
    the other side: the partner when its supplier declined or handed it back,
    the supplier when the partner withdrew or moved it."""
    text, html = render(
        "task_ended",
        recipient_name=recipient_name,
        recipient_org=recipient_org,
        headline=headline,
        task_ref=task_ref,
        title=title,
        contract_ref=contract_ref,
        reason=reason,
        path=path,
    )
    return f"{task_ref} {title} {what}", text, html


def contract_ended(
    *,
    recipient_name: str,
    recipient_org: str,
    headline: str,
    contract_ref: str,
    title: str,
    reason: str,
    detail: str,
    path: str,
) -> Mail:
    """A contract was ended early (db/610), told to the parties that did not
    end it and to each supplier whose tasks ended with it. detail says what it
    means for this reader."""
    text, html = render(
        "contract_ended",
        recipient_name=recipient_name,
        recipient_org=recipient_org,
        headline=headline,
        contract_ref=contract_ref,
        reason=reason,
        detail=detail,
        path=path,
    )
    return f"{contract_ref} {title} was ended", text, html


# ---------------------------------------------------------------------------
# Sent inline by their modules: accounts and invitations
# ---------------------------------------------------------------------------


def password_reset(*, full_name: str, link: str) -> Mail:
    text, html = render("password_reset", full_name=full_name, link=link)
    return f"Reset your {PRODUCT} password", text, html


def member_invitation(
    *, full_name: str, org_name: str, inviter: str, link: str, ttl_days: int
) -> Mail:
    text, html = render(
        "member_invitation",
        full_name=full_name,
        org_name=org_name,
        inviter=inviter,
        link=link,
        ttl_days=ttl_days,
    )
    return f"You're invited to {PRODUCT} — {org_name}", text, html


def onboarding_approved(*, full_name: str, org_name: str, link: str, ttl_days: int) -> Mail:
    text, html = render(
        "onboarding_approved", full_name=full_name, org_name=org_name, link=link, ttl_days=ttl_days
    )
    return f"You're invited to {PRODUCT} — {org_name}", text, html


def onboarding_reminder(*, org_name: str, link: str) -> Mail:
    text, html = render("onboarding_reminder", org_name=org_name, link=link)
    return f"Reminder: your {PRODUCT} invitation — {org_name}", text, html


def worker_invitation(*, full_name: str, org_name: str, link: str, ttl_days: int) -> Mail:
    text, html = render(
        "worker_invitation", full_name=full_name, org_name=org_name, link=link, ttl_days=ttl_days
    )
    return f"You're invited to {PRODUCT} — {org_name}", text, html


# ---------------------------------------------------------------------------
# Rendering only: the module owns the subject and the derived fields
# ---------------------------------------------------------------------------


def task_offer(
    *,
    worker_name: str,
    org_name: str,
    task_ref: str,
    task_title: str,
    unit: str,
    quantity: int,
    places: str,
    due: str,
    by: str,
    instructions: str | None,
    accept_url: str,
    decline_url: str,
    lead: str | None = None,
) -> tuple[str, str]:
    """(text, html) of a task offer. Both links stand on their own lines in the
    text part and are buttons in the HTML part (delivery.offer_email)."""
    return render(
        "task_offer",
        worker_name=worker_name,
        org_name=org_name,
        task_ref=task_ref,
        task_title=task_title,
        unit=unit,
        quantity=quantity,
        places=places,
        due=due,
        by=by,
        instructions=instructions,
        accept_url=accept_url,
        decline_url=decline_url,
        lead=lead,
    )


def assignment_reminder(
    *,
    worker_name: str,
    org_name: str,
    title: str,
    unit: str,
    quantity: int,
    due: str,
    line: str,
    action: str,
) -> tuple[str, str]:
    """(text, html) of an assignment reminder (engage.assignment_reminder_email).
    No link: the work is in the app, not on a page."""
    return render(
        "assignment_reminder",
        worker_name=worker_name,
        org_name=org_name,
        title=title,
        unit=unit,
        quantity=quantity,
        due=due,
        line=line,
        action=action,
    )


# ---------------------------------------------------------------------------
# DataHub
# ---------------------------------------------------------------------------


def public_reply(
    *, body: str, sender_name: str, org_name: str, dataset_title: str, dataset_url: str
) -> Mail:
    """A seller's answer to a quote request from the public page, sent by the
    platform with Reply-To the seller (catalogue._email_public_reply)."""
    text, html = render(
        "public_reply",
        body=body,
        sender_name=sender_name,
        org_name=org_name,
        dataset_title=dataset_title,
        dataset_url=dataset_url,
    )
    return f"Re: your quote request for {dataset_title}", text, html


def task_offer_mail(*, subject: str, **fields: Any) -> Mail:
    """A task offer from its stored context: the subject and every rendered
    field were computed by delivery.offer_context() when the row was queued."""
    text, html = task_offer(**fields)
    return subject, text, html


def assignment_reminder_mail(*, subject: str, **fields: Any) -> Mail:
    """An assignment reminder from its stored context
    (engage.assignment_reminder_context())."""
    text, html = assignment_reminder(**fields)
    return subject, text, html


# ---------------------------------------------------------------------------
# The outbox's registry: every mail the platform sends
# ---------------------------------------------------------------------------

OUTBOX: dict[str, Callable[..., Mail]] = {
    "rfp_published": rfp_published,
    "rfp_awarded": rfp_awarded,
    "task_ended": task_ended,
    "contract_ended": contract_ended,
    "password_reset": password_reset,
    "member_invitation": member_invitation,
    "onboarding_approved": onboarding_approved,
    "onboarding_reminder": onboarding_reminder,
    "worker_invitation": worker_invitation,
    "task_offer": task_offer_mail,
    "assignment_reminder": assignment_reminder_mail,
    "public_reply": public_reply,
}


def build(template: str, context: Mapping[str, Any]) -> Mail:
    """A stored outbox row to a mail. KeyError for a template the dispatcher
    does not know; TypeError when the stored context does not fit its builder.
    The dispatcher marks either row failed with the reason."""
    return OUTBOX[template](**context)
