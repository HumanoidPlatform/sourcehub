"""Can ML Kit's labeller even NAME a subject? A static check, not a run.

    python mlkit_vocab.py

ML Kit's base image labeller answers from a fixed list of labels, published
at LABEL_MAP_URL. The phone passes a capture only when one of the labels it
returns shares a word with the subject (phone_rules.vocabularies, the same
matching as subject.ts). So a subject none of whose words is in any label can
NEVER pass on the phone, however plainly it is shown. This prints, per
scenario of local_set.py, the labels that could match and the subject words
that no label covers. It says nothing about how ACCURATE the labeller is:
that needs a phone.
"""

from __future__ import annotations

import html
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402
from local_set import SCENARIOS, UA  # noqa: E402
from phone_rules import vocabularies, words  # noqa: E402

LABEL_MAP_URL = "https://developers.google.com/ml-kit/vision/image-labeling/label-map"


def labels() -> list[str]:
    cache = data_dir() / "mlkit_labels.txt"
    if cache.exists():
        return cache.read_text(encoding="utf-8").splitlines()
    req = urllib.request.Request(LABEL_MAP_URL, headers={"User-Agent": UA})
    page = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
    # the map is a table of index | label rows
    cells = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", page, re.S)]
    out = [c for c in cells if c and not c.isdigit()]
    cache.write_text("\n".join(out), encoding="utf-8")
    return out


def main() -> None:
    names = labels()
    print(f"ML Kit base labels: {len(names)}\n")
    for key, (subject, _) in SCENARIOS.items():
        wanted, _ = vocabularies(subject)
        matching = [n for n in names if set(words(n)) & wanted]
        covered = {w for n in matching for w in words(n)} & wanted
        uncovered = sorted(wanted - covered)
        verdict = "CAN NEVER PASS" if not matching else "can pass"
        print(f"{key}: {verdict}")
        print(f"  subject words: {', '.join(sorted(wanted))}")
        print(f"  labels that can match: {', '.join(matching) or '—'}")
        print(f"  words no label covers: {', '.join(uncovered) or '—'}\n")


if __name__ == "__main__":
    main()
