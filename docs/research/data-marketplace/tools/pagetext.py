#!/usr/bin/env python3
"""Print the full visible text of a web page or PDF, as the quote checker will see it.

    python pagetext.py <url> [--from N] [--chars 40000] [--grep word]

WebFetch answers through a summarising model, which is fine for finding things and wrong for reading a
licence clause by clause. This prints the page's own text, so a quote copied from it will match. Long
documents: read them in slices with --from (a character offset) and --chars, or find the clause you
need with --grep (prints each match with 400 characters either side).

Uses the same fetcher and cache as quotecheck.py. The Wayback Machine is refused here as it is by
WebFetch; that block is deliberate.
"""
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import quotecheck  # noqa: E402


def main(argv):
    if not argv or argv[0].startswith("--"):
        print(__doc__)
        return 2
    url = argv[0]
    if urlparse(url).netloc.endswith("archive.org"):
        print("refused: the Wayback Machine is blocked for this research")
        return 2
    start = int(argv[argv.index("--from") + 1]) if "--from" in argv else 0
    size = int(argv[argv.index("--chars") + 1]) if "--chars" in argv else 40000
    body, ctype, error = quotecheck.fetch(url, "--refresh" in argv)
    if error or not body:
        print(f"fetch failed: {error or 'empty body'}")
        return 1
    visible, with_data, problem = quotecheck.page_texts(body, ctype, url)
    if problem:
        print(f"could not extract text: {problem}")
        return 1
    text = re.sub(r"[ \t\r\f\v]+", " ", visible)
    text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
    if len(text.split()) < quotecheck.MIN_TEXT_WORDS:
        data = re.sub(r"\s+", " ", with_data).strip()
        print(f"[visible text is almost empty ({len(text.split())} words); the page is rendered in the "
              f"browser. Showing text found in its embedded data instead — quotes from it check as "
              f"'exact_in_data'.]\n")
        text = data
    if "--grep" in argv:
        word = argv[argv.index("--grep") + 1]
        hits = [m.start() for m in re.finditer(re.escape(word), text, re.I)]
        print(f"[{len(text)} characters; {len(hits)} matches for {word!r}]")
        for pos in hits[:30]:
            print(f"\n--- at {pos} ---\n{text[max(0, pos - 400): pos + 400]}")
        return 0
    print(f"[{len(text)} characters; showing {start}-{min(start + size, len(text))}]\n")
    print(text[start:start + size])
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(sys.argv[1:]))
