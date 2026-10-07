#!/usr/bin/env python3
"""Check every quote in the ledger against the page it is attributed to.

    python quotecheck.py [ledger files...] [--refresh]

No model is involved: each cited URL is fetched raw and the quote is string-matched against the page
text. That is the point. The agents that wrote the ledger read pages through a summarising fetcher, so
a second agent re-reading the same page inherits the same distortion; a byte comparison does not.

Results go to ../ledger/_quotecheck.json, keyed "<claim id>#<source index>" (or "#v<n>" for a
verifier's independent source), and render.py prints them beside each quote.

    exact          the quote is on the page
    exact_in_data  the quote is only in the page's embedded script data (a client-rendered page)
    exact_nospace  the quote matches once all spaces are removed (PDF text extraction splits words)
    fuzzy          most of the quote's word trigrams are there; read it yourself
    missing        the quote is not on the page
    js_empty       the page came back with almost no text; it is rendered in the browser
    pdf_unparsed   a PDF, and pypdf is not installed
    fetch_failed   the request failed; the HTTP status or error is recorded

Pages are cached in .cache/ so a re-run does not hit the sites again; --refresh ignores the cache.
"""
import concurrent.futures
import gzip
import hashlib
import html
import io
import json
import logging
import re
import ssl
import sys
import threading
import time
import urllib.error
import urllib.request
import zlib
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

TOOLS = Path(__file__).resolve().parent
LEDGER = TOOLS.parent / "ledger"
CACHE = TOOLS / ".cache"
OUT = LEDGER / "_quotecheck.json"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")
TIMEOUT = 30
FUZZY_PASS = 0.8
MIN_TEXT_WORDS = 40

_host_locks = defaultdict(threading.Lock)
logging.getLogger("pypdf").setLevel(logging.ERROR)

try:  # Windows Python often lacks intermediates that certifi carries
    import certifi
    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CONTEXT = ssl.create_default_context()


def fetch(url, refresh):
    """Return (body bytes or None, content type, error string or None)."""
    key = hashlib.sha1(url.encode("utf-8")).hexdigest()
    body_path, meta_path = CACHE / f"{key}.bin", CACHE / f"{key}.json"
    if not refresh and meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        return (body_path.read_bytes() if body_path.exists() else None), meta.get("ctype", ""), meta.get("error")

    body, ctype, error = None, "", None
    with _host_locks[urlparse(url).netloc]:
        time.sleep(0.4)
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9", "Accept-Encoding": "gzip, deflate"})
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=SSL_CONTEXT) as resp:
                body = resp.read()
                ctype = resp.headers.get("Content-Type", "")
                encoding = resp.headers.get("Content-Encoding", "")
                if encoding == "gzip":
                    body = gzip.decompress(body)
                elif encoding == "deflate":
                    body = zlib.decompress(body, -zlib.MAX_WBITS if body[:1] != b"\x78" else zlib.MAX_WBITS)
        except urllib.error.HTTPError as exc:
            error = f"HTTP {exc.code}"
        except Exception as exc:  # DNS, TLS, timeout, reset: all are "could not fetch"
            error = f"{type(exc).__name__}: {exc}"[:200]

    CACHE.mkdir(exist_ok=True)
    if body is not None:
        body_path.write_bytes(body)
    meta_path.write_text(json.dumps({"url": url, "ctype": ctype, "error": error}), encoding="utf-8")
    return body, ctype, error


def page_texts(body, ctype, url):
    """Return (visible text, text including script data, problem or None)."""
    if "pdf" in ctype.lower() or body[:5] == b"%PDF-" or urlparse(url).path.lower().endswith(".pdf"):
        try:
            from pypdf import PdfReader
        except ImportError:
            return "", "", "pdf_unparsed"
        try:
            text = " ".join((page.extract_text() or "") for page in PdfReader(io.BytesIO(body)).pages)
        except Exception:
            return "", "", "pdf_unparsed"
        return text, text, None

    match = re.search(r"charset=([\w-]+)", ctype, re.I)
    try:
        raw = body.decode(match.group(1) if match else "utf-8", errors="replace")
    except LookupError:
        raw = body.decode("utf-8", errors="replace")

    def strip_tags(markup):
        return html.unescape(re.sub(r"<[^>]+>", " ", markup))

    visible = re.sub(r"(?is)<(script|style|noscript|template)\b.*?</\1>", " ", raw)
    # Client-rendered pages carry their text as JSON inside <script>; keep a second view with it in.
    with_data = raw.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\n", " ").replace('\\"', '"')
    return strip_tags(visible), strip_tags(with_data), None


def norm(text):
    text = text.lower()
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'), (" ", " ")):
        text = text.replace(a, b)
    # \W is Unicode-aware, so Japanese, Korean and Chinese text survives; an ASCII-only class turned
    # every CJK quote into an empty string that could never match.
    return re.sub(r"[\W_]+", " ", text).strip()


def trigram_share(quote_words, page_norm):
    if len(quote_words) < 3:
        return 0.0
    grams = [" ".join(quote_words[i:i + 3]) for i in range(len(quote_words) - 2)]
    return sum(1 for g in grams if g in page_norm) / len(grams)


def judge(quote, body, ctype, error, url):
    if error:
        return {"status": "fetch_failed", "detail": error}
    if not body:
        return {"status": "fetch_failed", "detail": "empty body"}
    visible, with_data, problem = page_texts(body, ctype, url)
    if problem:
        return {"status": problem}
    nq, nv, nd = norm(quote), norm(visible), norm(with_data)
    if nq and nq in nv:
        return {"status": "exact"}
    if nq and nq in nd:
        return {"status": "exact_in_data"}
    # PDF extraction splits words ("wi th"); compare with every space removed, for quotes long enough
    # that a match cannot be an accident.
    squashed = nq.replace(" ", "")
    if len(squashed) >= 20 and squashed in nv.replace(" ", ""):
        return {"status": "exact_nospace"}
    if len(nv.split()) < MIN_TEXT_WORDS and len(nd.split()) < MIN_TEXT_WORDS * 5:
        return {"status": "js_empty"}
    score = max(trigram_share(nq.split(), nv), trigram_share(nq.split(), nd))
    return {"status": "fuzzy" if score >= FUZZY_PASS else "missing", "score": round(score, 2)}


def collect(path):
    """Yield (key, url, quote) for every quote in one ledger file."""
    d = json.loads(path.read_text(encoding="utf-8"))
    for claim in (d.get("claims") or []) + (d.get("missed") or []):
        for i, src in enumerate(claim.get("sources") or []):
            yield f"{claim.get('id')}#{i}", src.get("url"), src.get("quote")
    for n, verdict in enumerate(d.get("verdicts") or []):
        src = verdict.get("independent_source")
        if src:
            yield f"{verdict.get('claim_id')}#v{n}", src.get("url"), src.get("quote")


def main(argv):
    refresh = "--refresh" in argv
    paths = [Path(a) for a in argv if not a.startswith("--")]
    paths = paths or sorted(p for p in LEDGER.glob("*.json") if not p.name.startswith("_"))

    items = []  # (file name, key, url, quote)
    for path in paths:
        try:
            items += [(path.name, *item) for item in collect(path)]
        except ValueError as exc:
            print(f"skipped (not JSON): {path.name}: {exc}", file=sys.stderr)

    urls = sorted({url for _f, _k, url, _q in items if url})
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        fetched = dict(zip(urls, pool.map(lambda u: fetch(u, refresh), urls)))

    results = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    per_file = defaultdict(Counter)
    for name, key, url, quote in items:
        if not url or not quote:
            result = {"status": "missing", "detail": "no url or no quote"}
        else:
            result = judge(quote, *fetched[url], url)
        result["url"] = url
        results[key] = result
        per_file[name][result["status"]] += 1

    OUT.write_text(json.dumps(results, indent=1, sort_keys=True), encoding="utf-8")

    order = ["exact", "exact_in_data", "exact_nospace", "fuzzy", "missing", "js_empty", "pdf_unparsed", "fetch_failed"]
    print(f"{'file':44} " + " ".join(f"{s:>13}" for s in order))
    total = Counter()
    for name in sorted(per_file):
        total += per_file[name]
        print(f"{name[:44]:44} " + " ".join(f"{per_file[name][s]:>13}" for s in order))
    print(f"{'TOTAL':44} " + " ".join(f"{total[s]:>13}" for s in order))
    checked = sum(total[s] for s in ("exact", "exact_in_data", "exact_nospace", "fuzzy", "missing"))
    if checked:
        passed = total["exact"] + total["exact_in_data"] + total["exact_nospace"] + total["fuzzy"]
        print(f"\n{passed} of {checked} checkable quotes found on their page ({passed / checked:.0%}); "
              f"{sum(total.values()) - checked} could not be checked mechanically.")
    for name, key, url, _q in items:
        if results[key]["status"] == "missing":
            print(f"  MISSING {key}  {url}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
