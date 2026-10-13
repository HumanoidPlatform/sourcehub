"""A small in-process rate limiter, for the few routes that need no session.

The public catalogue takes a quote request from anyone. Without a limit that
form is a way to fill Ops' bell and the lead table from a script. This counts
attempts per key in a sliding window, in memory: each API worker counts on its
own, so the effective limit is the limit times the number of workers, which is
fine for this purpose and needs no shared store.
"""

from __future__ import annotations

import time
from collections import deque


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float, max_keys: int = 10_000) -> None:
        self.limit = limit
        self.window = window_seconds
        self.max_keys = max_keys
        self._hits: dict[str, deque[float]] = {}

    def allow(self, key: str, now: float | None = None) -> bool:
        """Record an attempt by `key`; False if it is over the limit."""
        now = time.monotonic() if now is None else now
        if len(self._hits) > self.max_keys:
            self._evict(now)
        q = self._hits.setdefault(key, deque())
        while q and now - q[0] >= self.window:
            q.popleft()
        if len(q) >= self.limit:
            return False
        q.append(now)
        return True

    def _evict(self, now: float) -> None:
        stale = [k for k, q in self._hits.items() if not q or now - q[-1] >= self.window]
        for k in stale:
            del self._hits[k]
        if len(self._hits) > self.max_keys:
            # Still full of live keys: drop the oldest half rather than grow.
            for k in sorted(self._hits, key=lambda k: self._hits[k][-1])[: len(self._hits) // 2]:
                del self._hits[k]
