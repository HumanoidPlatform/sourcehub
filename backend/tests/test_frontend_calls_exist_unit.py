"""Every endpoint the console calls must exist in the API.

Commit aa97507 shipped a Hold button and a Reject button on the client's
proposal screen. Neither POST /proposals/{id}/hold nor .../reject existed, so
both 404'd the moment a client used them, and nothing in either test suite
noticed: the frontend mocks @api/client, and the backend never sees the console.

That blind spot is structural — the two halves are tested in isolation and the
OpenAPI pipeline that would tie them together is unbuilt (frontend/src/api/
generated/ is an empty directory). This is the cheap stand-in: read the URLs the
console actually calls and check them against the routes the app registers.

    pytest tests/test_frontend_calls_exist_unit.py
"""

from __future__ import annotations

import re
from pathlib import Path

from sourcehub.main import app

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "frontend" / "src"

# get<T>(`/x/${id}`) · post("/x", body) · patch('/x') · del(`/x`)
#
# All three quote styles: roughly half the calls need no interpolation and are
# written as plain strings, and a backtick-only scan silently skipped them —
# including /network/workers, the roster's own fetch.
CALL = re.compile(r"\b(?:get|post|patch|del)\s*(?:<[^>]*>)?\s*\(\s*([`'\"])([^`'\"]+)\1")

# Interpolations, and the literal path params FastAPI declares, both collapse to
# one token so "/proposals/${id}/reject" matches "/proposals/{proposal_id}/reject".
INTERP = re.compile(r"\$\{[^}]*\}")
PARAM = re.compile(r"\{[^}]*\}")


def canon(url: str) -> str:
    url = url.split("?", 1)[0]
    url = INTERP.sub("{x}", url)
    url = PARAM.sub("{x}", url)
    return "/" + url.strip("/")


def registered() -> set[str]:
    """From the OpenAPI schema, not app.routes.

    The routers are included through a _IncludedRouter wrapper whose .path is
    None, so walking app.routes finds nothing and this whole test would pass
    against an empty set — vacuously green, which is worse than absent.
    """
    schema = app.openapi()
    out = {canon(p[len("/api/v1") :]) for p in schema["paths"] if p.startswith("/api/v1/")}
    assert out, "no /api/v1 paths in the OpenAPI schema — the scan is broken, not the code"
    return out


def called() -> tuple[set[str], int]:
    """Literal template URLs the console calls, and how many were skipped.

    A URL built from a variable cannot be resolved statically. Those are counted
    and reported rather than quietly dropped — a silent skip would make this
    test look more complete than it is.
    """
    urls, skipped = set(), 0
    for f in WEB.rglob("*.ts*"):
        if ".test." in f.name:
            continue
        for _quote, raw in CALL.findall(f.read_text(encoding="utf-8")):
            path = raw.split("?", 1)[0].rstrip("/")
            # The last segment is the action. Where that is itself a variable —
            # `/organisations/${id}/${action}` with action suspend|reinstate, or
            # `/assignments/${id}/${v.action}` with cancel|reopen — no static
            # read can know which route is meant. Counted, not guessed at, and
            # not reported as missing: that would be a false alarm forever.
            if not path.startswith("/") or INTERP.search(path.rsplit("/", 1)[-1]):
                skipped += 1
                continue
            urls.add(canon(raw))
    return urls, skipped


def test_every_url_the_console_calls_is_a_real_route():
    urls, _ = called()
    have = registered()
    missing = sorted(u for u in urls if u not in have)
    assert not missing, (
        "the console calls endpoints the API does not serve:\n  "
        + "\n  ".join(missing)
        + "\n\nEither build the route or remove the call — a button that 404s is worse "
        "than no button."
    )


def test_the_scan_actually_found_the_console():
    # Guard against the scan silently matching nothing and passing vacuously,
    # which is the failure mode that makes a sweep like this worthless.
    urls, skipped = called()
    # A floor, not a pin: the point is to catch the regex silently matching
    # nothing after a refactor, not to break whenever a screen gains a call.
    assert len(urls) >= 25, f"only found {len(urls)} URLs — the regex probably stopped matching"
    assert skipped < len(urls), f"{skipped} dynamic vs {len(urls)} literal — too many unresolved"
    # Anchors: real calls from three different features, so a regex that matched
    # only one shape would still fail here.
    for anchor in ("/proposals/{x}/reject", "/network/workers", "/requests/{x}/publish"):
        assert anchor in urls, f"expected to find {anchor}"


def test_the_two_endpoints_that_prompted_this_are_settled():
    have = registered()
    assert "/proposals/{x}/reject" in have, "reject was meant to be built"
    assert "/proposals/{x}/hold" not in have, "hold was meant to be removed, not built"
    urls, _ = called()
    assert "/proposals/{x}/hold" not in urls, "the console still calls hold"
