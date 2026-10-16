"""SMTP mail adapter — a local catcher in development, a real provider in the pilot.

One adapter covers both. What varies is configuration, not code:

    local catcher   host=localhost port=1025   no login, no TLS
    Gmail           host=smtp.gmail.com:587    STARTTLS + app password
    Gmail (SSL)     host=smtp.gmail.com:465    implicit TLS + app password

An empty smtp_username selects the unauthenticated path, which is what keeps a
developer with no mail account working exactly as before.

smtplib is blocking, so sends run in a thread; the caller awaits a coroutine
either way, which is the Protocol every adapter here honours.

Failures are raised as SMTPDeliveryError. Since db/490 the one caller is the
outbox dispatcher (modules/outbox): a message the server refuses marks its
row failed with the server's words, and a connection or login failure leaves
every row waiting for the next pass. The Ops mail log shows both, which is why
this module still logs loudly on the way out — a misconfigured provider is
otherwise silent until somebody notices the queue.
"""

from __future__ import annotations

import asyncio
import logging
import re
import smtplib
import ssl
from collections.abc import Sequence
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from typing import NamedTuple

from sourcehub.config import settings

log = logging.getLogger(__name__)


class SMTPDeliveryError(OSError):
    """The message could not be handed to the mail server.

    Subclasses OSError so the dispatcher's one `except OSError` covers it —
    rows left waiting rather than failed (modules/outbox/service.py::run_pass).

    Carries no password: the text is the server's own refusal.
    """


def _one_line(value: str) -> str:
    """A header value on one line. Subjects carry titles and Reply-To a
    person's name, all somebody's input; a CR or LF in a header is refused by
    the email package (and would be header injection if it were not)."""
    return " ".join(value.split())


# One mailbox: no list, no display name, no quoting or domain literal. The
# platform's addresses are validated the same way where they are typed in; this
# guards the ones that are not (an onboarding contact) and stops a stored
# "a@x.co, b@y.co" from mailing two people.
_PLAIN_ADDRESS = re.compile(r'[^@\s,;:<>()\[\]"\\]+@[^@\s,;:<>()\[\]"\\]+')


def _plain_address(to: str) -> str:
    to = to.strip()
    if not _PLAIN_ADDRESS.fullmatch(to):
        raise ValueError("not one plain e-mail address")
    return to


def _build(
    to: str, subject: str, body: str, html: str | None = None, reply_to: str | None = None
) -> EmailMessage:
    msg = EmailMessage()
    # Gmail rewrites From: to the authenticated mailbox regardless, so send
    # what it expects rather than a fiction it will overwrite.
    msg["From"] = formataddr((settings.smtp_from_name, settings.smtp_from))
    msg["To"] = to = _plain_address(to)
    if str(msg["To"]) != to:  # the email package rewrote it ("a@x..co" becomes "<>")
        raise ValueError("not one plain e-mail address")
    msg["Subject"] = _one_line(subject)
    # Sent by the platform for someone else (a seller answering a quote
    # request): the answer goes to them, not to the platform mailbox.
    if reply_to:
        msg["Reply-To"] = _one_line(reply_to)
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
            settings.smtp_host,
            settings.smtp_port,
            timeout=timeout,
            context=ssl.create_default_context(),
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
            settings.smtp_host,
            settings.smtp_username,
        )
        raise SMTPDeliveryError(f"Mail server refused the login: {e.smtp_code}") from None
    except (smtplib.SMTPException, OSError) as e:
        log.error("SMTP connection to %s failed: %s", settings.smtp_host, type(e).__name__)
        raise SMTPDeliveryError(
            f"Could not send mail via {settings.smtp_host}: {type(e).__name__}"
        ) from None


def _send_sync(
    to: str, subject: str, body: str, html: str | None, reply_to: str | None = None
) -> None:
    msg = _build(to, subject, body, html, reply_to)
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


Message = tuple[str, str, str, str | None, str | None]  # (to, subject, text, html, reply_to)


class SendError(NamedTuple):
    """Why one message of a batch did not go, and whether trying again later
    can help. `text` is the server's own answer (never a credential).
    `tried` is False for a message the batch never reached because the
    connection closed before it: the caller leaves it waiting, uncounted."""

    text: str
    temporary: bool
    tried: bool = True


NOT_TRIED = SendError("not tried: the connection closed earlier in the batch", True, False)

# Gmail's daily-limit status, at the start of a line of the answer (smtplib
# strips the "550-" of each line). Anchored so that "5.4.5" inside an IP
# address ("blocked [185.4.5.12]") is not mistaken for it.
_GMAIL_QUOTA = re.compile(r"^\s*5\.4\.5(?![\d.])", re.MULTILINE)


def _is_temporary(code: int, answer: bytes | str) -> bool:
    """SMTP says so in the code: 4xx is "not now", 5xx is "no". One 5xx is
    temporary in practice: Gmail's 550 5.4.5, the daily sending limit, which
    lifts within the day."""
    text = answer.decode(errors="replace") if isinstance(answer, bytes) else str(answer)
    return 400 <= code < 500 or bool(_GMAIL_QUOTA.search(text))


def classify(e: BaseException) -> SendError:
    """One refused message, as a SendError. Temporary: a 4xx answer, Gmail's
    quota, or a connection that dropped part-way through the batch. Permanent:
    any other refusal, and a message that could not be built."""
    text = f"{type(e).__name__}: {e}"[:300]
    if isinstance(e, smtplib.SMTPRecipientsRefused):
        answers = list(e.recipients.values())
        return SendError(text, bool(answers) and all(_is_temporary(c, m) for c, m in answers))
    if isinstance(e, smtplib.SMTPResponseException):
        return SendError(text, _is_temporary(e.smtp_code, e.smtp_error))
    if isinstance(e, smtplib.SMTPServerDisconnected):
        return SendError(text, True)
    if isinstance(e, smtplib.SMTPException):
        return SendError(text, False)
    if isinstance(e, OSError):  # a socket timeout or reset mid-batch
        return SendError(text, True)
    return SendError(text, False)


def _closed(smtp: smtplib.SMTP) -> bool:
    """smtplib drops its socket when the server hangs up (a 421) or the line
    fails; every later command would only raise "please run connect() first"."""
    return getattr(smtp, "sock", True) is None


def _send_many_sync(messages: Sequence[Message]) -> list[SendError | None]:
    """One connection for the whole batch. A message the server refuses — or
    one that cannot even be built — is recorded against its own slot and the
    batch carries on; a connection or login failure raises before anything is
    sent, and the caller leaves every slot waiting. When the server hangs up
    part-way, the slots after the one it hung up on are NOT_TRIED: they were
    never offered, so they wait for the next pass without counting a try.

    Once the loop has run, the slots are the truth: a QUIT the server answers
    badly, or a connection that drops on the way out, must not turn messages
    that were delivered into "nothing was sent" — the outbox would send them
    all again on the next pass."""
    errors: list[SendError | None] = [None] * len(messages)
    smtp = _open()
    try:
        for i, (to, subject, body, html, reply_to) in enumerate(messages):
            try:
                msg = _build(to, subject, body, html, reply_to)
            except Exception as e:  # the email package raises more than ValueError
                # a message that cannot be built never will be: this row, for good
                errors[i] = SendError(f"{type(e).__name__}: {e}"[:300], False)
                log.error("mail to %s cannot be built: %s", to, type(e).__name__)
                continue
            try:
                smtp.send_message(msg)
            except (smtplib.SMTPException, OSError) as e:
                # the server's own refusal (never a credential): this row, not
                # the batch, and the caller decides from `temporary` whether to
                # try again
                err = errors[i] = classify(e)
                log.error(
                    "SMTP send to %s via %s failed (%s): %s",
                    to,
                    settings.smtp_host,
                    "temporary" if err.temporary else "permanent",
                    type(e).__name__,
                )
                if _closed(smtp):
                    errors[i + 1 :] = [NOT_TRIED] * (len(messages) - i - 1)
                    log.warning(
                        "SMTP connection to %s closed mid-batch; %d mails wait for the next pass",
                        settings.smtp_host,
                        len(messages) - i - 1,
                    )
                    break
            else:
                log.info("sent %r to %s via %s", subject, to, settings.smtp_host)
    finally:
        try:
            smtp.quit()
        except (smtplib.SMTPException, OSError):
            smtp.close()
    return errors


async def send_mail(
    to: str, subject: str, body: str, html: str | None = None, reply_to: str | None = None
) -> None:
    await asyncio.to_thread(_send_sync, to, subject, body, html, reply_to)


async def send_many(messages: Sequence[Message]) -> list[SendError | None]:
    """Send a batch over one connection; returns one SendError or None per
    message, in order. Raises SMTPDeliveryError only when nothing could be
    sent at all."""
    if not messages:
        return []
    return await asyncio.to_thread(_send_many_sync, messages)
