"""SMTP mail adapter — a local catcher in development, a real provider in the pilot.

One adapter covers both. What varies is configuration, not code:

    local catcher   host=localhost port=1025   no login, no TLS
    Gmail           host=smtp.gmail.com:587    STARTTLS + app password
    Gmail (SSL)     host=smtp.gmail.com:465    implicit TLS + app password

An empty smtp_username selects the unauthenticated path, which is what keeps a
developer with no mail account working exactly as before.

smtplib is blocking, so sends run in a thread; the caller awaits a coroutine
either way, which is the Protocol every adapter here honours.

Failures are raised as SMTPDeliveryError and swallowed by the callers where
mail is best-effort — an invitation email failing must not roll back the
approval that created the org, because the invitation can be re-sent and the
org cannot be half-created. That swallowing is why this module logs loudly on
the way out: a misconfigured provider is otherwise completely silent, and the
first sign of it is a person who never got their invitation.
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from collections.abc import Sequence
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

from sourcehub.config import settings

log = logging.getLogger(__name__)


class SMTPDeliveryError(OSError):
    """The message could not be handed to the mail server.

    Subclasses OSError so the existing best-effort callers keep catching it —
    they already treat a dead SMTP as non-fatal, and that contract is load
    bearing (see modules/network/service.py::_send_worker_invitation).

    Carries no password: the text is the server's own refusal.
    """


def _build(to: str, subject: str, body: str, html: str | None = None) -> EmailMessage:
    msg = EmailMessage()
    # Gmail rewrites From: to the authenticated mailbox regardless, so send
    # what it expects rather than a fiction it will overwrite.
    msg["From"] = formataddr((settings.smtp_from_name, settings.smtp_from))
    msg["To"] = to
    msg["Subject"] = subject
    # A Message-ID with a real domain keeps this out of the obvious spam
    # buckets; without one some providers generate a suspicious default.
    msg["Message-ID"] = make_msgid(domain=settings.smtp_from.rsplit("@", 1)[-1])
    msg.set_content(body)
    # Text first, HTML second: a client that renders HTML shows the buttons,
    # one that does not still has the links on their own lines.
    if html:
        msg.add_alternative(html, subtype="html")
    return msg


def _connect() -> smtplib.SMTP:
    """Open the right kind of connection for the configured provider."""
    timeout = settings.smtp_timeout_seconds
    if settings.smtp_ssl:
        return smtplib.SMTP_SSL(
            settings.smtp_host, settings.smtp_port,
            timeout=timeout, context=ssl.create_default_context(),
        )
    smtp = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=timeout)
    if settings.smtp_starttls:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()  # capabilities are re-read after the upgrade; AUTH appears here
    return smtp


def _open() -> smtplib.SMTP:
    """Connect and, when configured, log in. Failures become SMTPDeliveryError."""
    try:
        smtp = _connect()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password.get_secret_value())
        return smtp
    except smtplib.SMTPAuthenticationError as e:
        # The single most common misconfiguration, and the one whose default
        # message ("Username and Password not accepted") sends people to reset
        # an account password that was never the problem.
        log.error(
            "SMTP authentication refused by %s as %s. For Gmail this means an "
            "app password is required — an account password is always refused, "
            "and the app password is entered without its display spaces.",
            settings.smtp_host, settings.smtp_username,
        )
        raise SMTPDeliveryError(f"Mail server refused the login: {e.smtp_code}") from None
    except (smtplib.SMTPException, OSError) as e:
        log.error("SMTP connection to %s failed: %s", settings.smtp_host, type(e).__name__)
        raise SMTPDeliveryError(
            f"Could not send mail via {settings.smtp_host}: {type(e).__name__}"
        ) from None


def _send_sync(to: str, subject: str, body: str, html: str | None) -> None:
    msg = _build(to, subject, body, html)
    try:
        with _open() as smtp:
            smtp.send_message(msg)
    except SMTPDeliveryError:
        raise
    except (smtplib.SMTPException, OSError) as e:
        log.error("SMTP send to %s via %s failed: %s", to, settings.smtp_host, type(e).__name__)
        raise SMTPDeliveryError(
            f"Could not send mail via {settings.smtp_host}: {type(e).__name__}"
        ) from None
    log.info("sent %r to %s via %s", subject, to, settings.smtp_host)


Message = tuple[str, str, str, str | None]  # (to, subject, text, html)


def _send_many_sync(messages: Sequence[Message]) -> list[str | None]:
    """One connection for the whole batch. A message the server refuses is
    recorded against its slot and the batch carries on; a connection or login
    failure raises before anything is sent, and the caller marks every slot."""
    errors: list[str | None] = [None] * len(messages)
    with _open() as smtp:
        for i, (to, subject, body, html) in enumerate(messages):
            try:
                smtp.send_message(_build(to, subject, body, html))
            except (smtplib.SMTPException, OSError) as e:
                # the server's own refusal, never a credential
                errors[i] = f"{type(e).__name__}: {e}"[:300]
                log.error(
                    "SMTP send to %s via %s failed: %s", to, settings.smtp_host, type(e).__name__
                )
            else:
                log.info("sent %r to %s via %s", subject, to, settings.smtp_host)
    return errors


async def send_mail(to: str, subject: str, body: str, html: str | None = None) -> None:
    await asyncio.to_thread(_send_sync, to, subject, body, html)


async def send_many(messages: Sequence[Message]) -> list[str | None]:
    """Send a batch over one connection; returns one error string or None per
    message, in order. Raises SMTPDeliveryError only when nothing could be
    sent at all."""
    if not messages:
        return []
    return await asyncio.to_thread(_send_many_sync, messages)
