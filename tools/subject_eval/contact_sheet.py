"""A page for checking the negatives by eye before trusting the numbers.

    python contact_sheet.py [--sample 60]

Writes out/contact_sheet.html in the data folder (never the repo): every
capture rejected as the wrong subject, with the reviewer's note — the reason
also covers wrong LOCATION, which is no failure of a subject check — and a
sample of made-up pairs. Anything that really does match goes in
exclude_pairs.txt (asset_id,task_id), and a location-only reject in
exclude_assets.txt; evaluate.py leaves both out.
"""

from __future__ import annotations

import argparse
import html
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402
from evaluate import RNG_SEED, build_pairs  # noqa: E402


def card(r: dict, subject: dict, note: str) -> str:
    src = (Path("..") / "files" / r["file"]).as_posix()
    media = (f'<video src="{src}" controls preload="metadata"></video>' if r["kind"] == "clip"
             else f'<img src="{src}" loading="lazy">')
    want = ", ".join([subject.get("domain", ""), *(subject.get("must_show") or [])])
    return (f'<figure>{media}<figcaption><b>{html.escape(want)}</b><br>{html.escape(note)}'
            f'<br><code>{r["asset_id"]}</code></figcaption></figure>')


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--sample", type=int, default=60)
    args = p.parse_args()
    root = data_dir()
    rows = [json.loads(ln) for ln in (root / "manifest.jsonl").read_text(encoding="utf-8").splitlines() if ln]
    subjects = {r["task_id"]: r["subject"] for r in rows}

    real = [r for r in rows if r["outcome"] == "rejected_subject"]
    made_up = [x for x in build_pairs(rows, 3, set()) if x["made_up"]]
    random.Random(RNG_SEED).shuffle(made_up)

    parts = ["<!doctype html><meta charset=utf-8><title>Subject negatives</title><style>"
             "body{font:14px system-ui;margin:16px}section{display:grid;"
             "grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}"
             "img,video{width:100%;height:180px;object-fit:cover;background:#ddd}"
             "figure{margin:0}code{font-size:11px}</style>",
             f"<h2>Rejected as wrong subject ({len(real)})</h2><p>Location-only rejects: put the asset id "
             "in exclude_assets.txt.</p><section>"]
    parts += [card(r, r["subject"], "note: " + (r.get("review_note") or "—")) for r in real]
    parts.append(f"</section><h2>Made-up negatives (sample of {min(args.sample, len(made_up))})</h2>"
                 "<p>The caption is the OTHER task's subject. If the capture does show it, add "
                 "<code>asset_id,task_id</code> to exclude_pairs.txt.</p><section>")
    for x in made_up[: args.sample]:
        parts.append(card(x, subjects[x["pair_task"]], f"paired task: {x['pair_task']}"))
    parts.append("</section>")
    out = root / "out" / "contact_sheet.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(parts), encoding="utf-8")
    print(f"contact sheet: {out}")


if __name__ == "__main__":
    main()
