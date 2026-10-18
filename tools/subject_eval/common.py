"""Where the evaluation keeps its data: outside the repo, on this machine only.

Captures can show bystanders. They live under %LOCALAPPDATA%\\subject_eval
(or $SUBJECT_EVAL_DATA) and are deleted when the evaluation is done.
"""

from __future__ import annotations

import os
from pathlib import Path


def data_dir() -> Path:
    base = os.environ.get("SUBJECT_EVAL_DATA") or os.path.join(
        os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "subject_eval"
    )
    p = Path(base)
    p.mkdir(parents=True, exist_ok=True)
    return p
