"""Mail rendering: every platform e-mail comes from one template folder.

templates/<name>.txt and templates/<name>.html are rendered with the same
context. The text part is what a plain client shows and what the e2e harness
reads links from, so every link stands on its own line there. The HTML part
extends base.html, which carries the DataMind360 logo, the "by Cosarathi"
byline and the LinkedIn mark with the company page's address under it.

Autoescaping is decided by extension: .html escapes every interpolated value
(a title is somebody else's input), .txt never does (an & in a title must stay
an & where a person reads it as text).

The folder is read from disk beside this file, never through importlib: the
production image copies src/ as a tree and runs it from PYTHONPATH, so there is
no installed distribution to ask.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from sourcehub.config import CAPTURE_APP, COMPANY, LINKEDIN_URL, PRODUCT, settings

TEMPLATES = Path(__file__).with_name("templates")

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES)),
    autoescape=select_autoescape(
        enabled_extensions=("html",), disabled_extensions=("txt",), default=False
    ),
    trim_blocks=True,
    lstrip_blocks=True,
)


def brand() -> dict[str, str]:
    """What every template may assume: the names, the console's address, and
    the two images nginx serves from frontend/public/brand/."""
    base = settings.app_base_url.rstrip("/")
    return {
        "product": PRODUCT,
        "company": COMPANY,
        "capture_app": CAPTURE_APP,
        "app_base_url": base,
        "logo_url": f"{base}/brand/email-logo.png",
        "linkedin_url": LINKEDIN_URL,
        "linkedin_icon_url": f"{base}/brand/linkedin.png",
    }


def render(name: str, **ctx: Any) -> tuple[str, str]:
    """(text, html) for templates/<name>.txt and templates/<name>.html."""
    context = {**brand(), **ctx}
    text = _env.get_template(f"{name}.txt").render(context)
    html = _env.get_template(f"{name}.html").render(context)
    return text, html


def template_names() -> list[str]:
    """The mails that exist: every <name>.html that is not a layout partial."""
    return sorted(p.stem for p in TEMPLATES.glob("*.html") if not p.stem.startswith(("_", "base")))
