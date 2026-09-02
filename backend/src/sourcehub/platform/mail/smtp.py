"""SMTP mail adapter. Points at Mailpit in development (localhost:1025).

smtplib is blocking, so sends run in a thread; the caller awaits a coroutine
either way, which is the Protocol every adapter honours. Failures are logged
and swallowed by the caller where mail is best-effort (an invitation email
failing must not roll back the approval that created the org — the invitation
can be re-sent; the org cannot be half-created).
"""

from __future__ import annotations

import asyncio
import smtplib
from email.message import EmailMessage

from sourcehub.config import settings


def _send_sync(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.send_message(msg)


async def send_mail(to: str, subject: str, body: str) -> None:
    await asyncio.to_thread(_send_sync, to, subject, body)
