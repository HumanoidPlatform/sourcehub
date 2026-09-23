"""The backend says "crowd resource" to a person, and "worker" to the database.

The copy is spread across five service modules with no shared vocabulary file,
so nothing but a test keeps it consistent — the next error message someone adds
will say "worker" unless something objects.

This walks the Python AST and looks only at string *literals*, so comments,
docstrings and identifiers are out of scope by construction. Identifier strings
that must keep the word — `worker_user_id`, `r.code = 'worker'`, SQL, route
paths — are allow-listed explicitly and each one says why.

    pytest tests/test_crowd_resource_copy_unit.py
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src" / "sourcehub"

FILES = [
    SRC / "api" / "v1" / "network.py",
    SRC / "api" / "v1" / "delivery.py",
    SRC / "api" / "v1" / "qa.py",
    SRC / "modules" / "network" / "service.py",
    SRC / "modules" / "delivery" / "service.py",
    SRC / "modules" / "engage" / "service.py",
    SRC / "modules" / "qa" / "service.py",
    SRC / "modules" / "media" / "service.py",
]

SAYS_WORKER = re.compile(r"\bworkers?\b", re.IGNORECASE)

# Every one of these is an identifier, not something a person reads.
ALLOWED = (
    "worker_user_id", "worker_name", "worker_ref", "worker_note",
    "worker_limit", "worker_email", "worker_id",          # JSON + SQL column names
    "crowd_worker",                                        # the table
    "invite_worker", "is_worker", "worker_holds_assignment",  # SQL functions
    "worker_status",                                       # the enum type
    "not_a_worker",                                        # an offer-state enum value
    "/workers",                                            # the route path
    "'worker'", '"worker"',                                # the role code in SQL and comparisons
    "worker.invited", "worker.invitation_resent",          # append-only audit event types
    "worker.updated", "worker.offboarded",
    "seq_ref_worker",
    "uvicorn worker",                                      # a process, not a person
)


def literals(path: Path):
    """Every string constant in the file, with its line. Docstrings excluded —
    ast.get_docstring's node is a Constant too, so they are filtered by value
    identity against each scope's docstring."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    docstrings = set()
    for node in ast.walk(tree):
        if isinstance(node, (ast.Module, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            d = ast.get_docstring(node, clean=False)
            if d is not None:
                docstrings.add(d)
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            if node.value in docstrings:
                continue
            yield node.lineno, node.value


def offenders(path: Path) -> list[str]:
    out = []
    for line, text in literals(path):
        if not SAYS_WORKER.search(text):
            continue
        if any(a in text for a in ALLOWED):
            continue
        out.append(f"{path.name}:{line}  {text[:88]!r}")
    return out


def test_no_user_facing_string_says_worker():
    found = [o for f in FILES for o in offenders(f)]
    assert not found, "these strings still say 'worker' to a person:\n  " + "\n  ".join(found)


def test_the_role_code_is_untouched():
    # The whole point of the allow-list. If this ever fails, the change was not
    # a rename — is_worker() would return false for a real crowd resource and
    # every restrictive `NOT is_worker() OR ...` policy would open.
    delivery = (SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8")
    assert "r.code = 'worker'" in delivery
    engage = (SRC / "modules" / "engage" / "service.py").read_text(encoding="utf-8")
    assert "rl.code = 'worker'" in engage


def test_the_routes_and_json_keys_are_untouched():
    network = (SRC / "api" / "v1" / "network.py").read_text(encoding="utf-8")
    assert '"/workers"' in network
    assert '"/workers/{worker_id}"' in network
    delivery = (SRC / "modules" / "delivery" / "service.py").read_text(encoding="utf-8")
    for key in ("worker_user_id", "worker_name", "worker_ref", "worker_limit"):
        assert key in delivery, key


def test_the_seed_renames_the_label_but_not_the_code():
    seed = (SRC.parents[2] / "db" / "905_seed_workers.sql").read_text(encoding="utf-8")
    assert "('worker', 'Crowd resource'" in seed
    assert "'Field worker'" not in seed
