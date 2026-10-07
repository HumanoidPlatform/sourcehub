#!/usr/bin/env python3
"""Print a PDF's text, page by page, so a quote can be copied from it.

    python pdftext.py <path-or-url> [--pages 3-7]

The Read tool cannot render PDFs on this machine (no pdftoppm), and WebFetch cannot read their text.
This is the approved extractor. pypdf sometimes splits words ("wi th"); quotecheck.py tolerates that,
so copy the words as you would read them, not the broken spacing.
"""
import io
import logging
import re
import ssl
import sys
import urllib.request
from pathlib import Path

from pypdf import PdfReader

logging.getLogger("pypdf").setLevel(logging.ERROR)


def load(target):
    if not target.startswith(("http://", "https://")):
        return Path(target).read_bytes()
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        ctx = ssl.create_default_context()
    req = urllib.request.Request(target, headers={"User-Agent": "Mozilla/5.0 (research; pdftext.py)"})
    with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
        return resp.read()


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    first, last = 1, None
    if "--pages" in argv:
        spec = argv[argv.index("--pages") + 1]
        a, _, b = spec.partition("-")
        first, last = int(a), int(b or a)
    reader = PdfReader(io.BytesIO(load(argv[0])))
    last = min(last or len(reader.pages), len(reader.pages))
    print(f"[{len(reader.pages)} pages; showing {first}-{last}]")
    for n in range(first, last + 1):
        text = re.sub(r"[ \t]+", " ", reader.pages[n - 1].extract_text() or "")
        print(f"\n===== page {n} =====\n{text}")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(sys.argv[1:]))
