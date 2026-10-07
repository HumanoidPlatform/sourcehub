#!/usr/bin/env python3
"""Check that every claim a report cites exists in the ledger.

    python citecheck.py ../decisions.md [../README.md ...]

A citation is `<slug> c123` or `<slug> v001`, optionally followed by more ids or ranges for the same
platform (`aws-data-exchange c002, c021–c024`). Bare ids with no platform before them are counted but
cannot be resolved, and are listed so they can be given a platform.
"""
import json
import re
import sys
from pathlib import Path

LEDGER = Path(__file__).resolve().parent.parent / "ledger"
ALIASES = {"getty": "getty-images", "adobe": "adobe-stock", "ibm": "ibm-diversity-in-faces",
           "hf": "hugging-face-hub", "korea": "korea-ai-hub", "dataseeds": "dataseeds-ai",
           "bee": "bee-maps", "defined": "defined-ai", "pixta": "pixta-ai", "snowflake": "snowflake-marketplace"}


def known_ids():
    ids = set()
    for p in LEDGER.glob("*.json"):
        if p.name.startswith("_"):
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        for c in (d.get("claims") or []) + (d.get("missed") or []):
            ids.add(c["id"])
    return ids


def expand(slug, ids_text):
    out = []
    for m in re.finditer(r"([cv])(\d{3})(?:\s*[–-]\s*[cv]?(\d{3}))?", ids_text):
        kind, a, b = m.group(1), int(m.group(2)), m.group(3)
        for n in range(a, (int(b) if b else a) + 1):
            out.append(f"{slug}-{kind}{n:03d}")
    return out


def main(paths):
    ids = known_ids()
    slugs = {i.rsplit("-", 1)[0] for i in ids}
    cited, missing, unresolved = 0, [], 0
    pattern = re.compile(r"\b([a-z][a-z0-9-]+)\s+((?:[cv]\d{3}(?:\s*[–-]\s*[cv]?\d{3})?(?:,\s*)?)+)")
    for path in paths:
        text = Path(path).read_text(encoding="utf-8")
        for m in pattern.finditer(text):
            slug = ALIASES.get(m.group(1), m.group(1))
            if slug not in slugs:
                continue
            for cid in expand(slug, m.group(2)):
                cited += 1
                if cid not in ids:
                    missing.append((path, cid))
        unresolved += len(re.findall(r"\(c\d{3}", text))
    print(f"{cited} citations resolved to a platform; {len(missing)} not found in the ledger; "
          f"{unresolved} bare '(cNNN' citations rely on the platform named in the sentence")
    for path, cid in missing:
        print(f"  MISSING {cid}  in {Path(path).name}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
