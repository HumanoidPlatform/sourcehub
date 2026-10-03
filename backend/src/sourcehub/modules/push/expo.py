"""The Expo push service, and nothing else.

One call: send() posts up to 100 messages and returns Expo's ticket for each,
in the same order. A ticket says whether Expo accepted the message, not that
the phone showed it; Expo hands it to FCM, which delivers it.

A request Expo refuses as a whole (down, rate-limited, bad access token)
raises ExpoUnavailableError, and the caller leaves those rows waiting for the next
pass. A message it refuses on its own comes back as an error ticket.
"""

from __future__ import annotations

from typing import Any

import httpx

from sourcehub.config import settings

BATCH = 100  # Expo's limit per request
TIMEOUT_SECONDS = 10


class ExpoUnavailableError(Exception):
    """The whole request failed; nothing in it was accepted."""


async def send(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not messages:
        return []
    if len(messages) > BATCH:
        raise ValueError(f"at most {BATCH} messages per request")
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    token = settings.expo_access_token.get_secret_value()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            r = await client.post(settings.expo_push_url, json=messages, headers=headers)
    except httpx.HTTPError as exc:
        raise ExpoUnavailableError(f"{type(exc).__name__}: {exc}") from exc
    if r.status_code != 200:
        raise ExpoUnavailableError(f"HTTP {r.status_code}: {r.text[:300]}")
    tickets = r.json().get("data")
    if not isinstance(tickets, list) or len(tickets) != len(messages):
        raise ExpoUnavailableError(f"unexpected answer: {r.text[:300]}")
    return tickets
