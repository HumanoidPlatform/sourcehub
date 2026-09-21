"""Run one reminder pass now and say what it did.

    python -m sourcehub.modules.engage

The same pass the API runs on its timer, for a laptop against a local
database or a one-off inside the api container on the VM. It takes the same
advisory lock, so it waits for nothing and skips if a pass is under way.
"""

from __future__ import annotations

import asyncio
import logging

from sourcehub.modules.engage.service import run_pass

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
print(asyncio.run(run_pass()))
