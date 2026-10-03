"""Run one push pass now and say what it did.

    python -m sourcehub.modules.push

The same pass the API runs on its timer. It takes the same advisory lock, so
it skips if a pass is under way.
"""

from __future__ import annotations

import asyncio
import logging

from sourcehub.modules.push.service import run_pass

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
print(asyncio.run(run_pass()))
