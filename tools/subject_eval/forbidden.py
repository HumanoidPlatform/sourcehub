"""Where should the CLIP must-not-show check warn?

    python forbidden.py [--model clip-b32]

The phone scores each must_not_show phrase the way it scores the subject
(clipSubject.ts forbiddenMargins): the phrase's similarity minus the closest
typical-mistake phrase that shares no word with it, less the one nearest it in
meaning, at the best of six views. This asks, for phrases the local set has
photos of, how often the margin catches those photos and how often it fires
on good photos of every subject, across candidate thresholds.

Writes out/forbidden.md in the data folder.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402
from evaluate import Model  # noqa: E402
from phone_rules import CLIP_IGNORE_NEAREST_NEGATIVES, words  # noqa: E402
from score_clip import MODELS, TEMPLATES  # noqa: E402

# must_not_show phrase -> the local set's group of photos that show it
PHRASES = {
    "selfie": "selfie",
    "screenshot": "screenshot",
    "pet": "pet",
    "finger over the lens": "finger",
}
THRESHOLDS = (0.0, 0.01, 0.02, 0.03, 0.04, 0.05)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", default="clip-b32")
    args = p.parse_args()
    root = data_dir()
    rows = [json.loads(ln) for ln in (root / "manifest.jsonl").read_text(encoding="utf-8").splitlines() if ln]
    neg = json.loads((root / "out" / args.model / "negatives_used.json").read_text(encoding="utf-8"))
    m = Model(root / "out" / args.model / "embeddings.npz", neg)

    import open_clip
    import torch

    name, pre = MODELS[args.model]
    model = open_clip.create_model_and_transforms(name, pretrained=pre)[0].eval()
    tok = open_clip.get_tokenizer(name)
    with torch.no_grad():
        def vec(phrase: str) -> np.ndarray:
            t = torch.nn.functional.normalize(model.encode_text(tok([x.format(phrase) for x in TEMPLATES])), dim=-1)
            return torch.nn.functional.normalize(t.mean(0), dim=-1).numpy()

        pv = {ph: vec(ph) for ph in PHRASES}

    def margin(img: np.ndarray, ph: str) -> float:
        v = pv[ph]
        mine = set(words(ph))
        keep = [i for i, w in enumerate(m.neg_words) if not (w & mine)]
        near = sorted(keep, key=lambda i: -float(m.neg[i] @ v))[:CLIP_IGNORE_NEAREST_NEGATIVES]
        keep = [i for i in keep if i not in near]
        return float((img[0] @ v - (img[0] @ m.neg[keep].T).max(-1)).max())

    photos = {r["file"]: r for r in rows if r["kind"] == "photo" and r["file"] in m.img}
    good = [f for f, r in photos.items() if r["outcome"] == "accepted"]
    out = [f"# CLIP must-not-show check ({args.model})", "",
           f"{len(good)} good photos (any subject); per phrase, the photos of that thing in the local set.", "",
           "| phrase | photos of it | " + " | ".join(f"caught / good flagged at {t:+.2f}" for t in THRESHOLDS) + " |",
           "|---|---|" + "---|" * len(THRESHOLDS)]
    flagged_any = {t: set() for t in THRESHOLDS}
    for ph, group in PHRASES.items():
        bad = [f for f, r in photos.items() if r.get("group") == group]
        bm = np.array([margin(m.img[f], ph) for f in bad])
        gm = np.array([margin(m.img[f], ph) for f in good])
        cells = []
        for t in THRESHOLDS:
            flagged_any[t] |= {f for f, x in zip(good, gm) if x >= t}
            cells.append(f"{(bm >= t).mean():.0%} / {(gm >= t).mean():.1%}")
        out.append(f"| {ph} | {len(bad)} | " + " | ".join(cells) + " |")
    out += ["", "Good photos flagged by at least one of the four phrases: " + ", ".join(
        f"{t:+.2f} -> {len(flagged_any[t]) / len(good):.1%}" for t in THRESHOLDS)]
    path = root / "out" / "forbidden.md"
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out))


if __name__ == "__main__":
    main()
