"""Is the CLIP subject check too rigid? Variants of the phone's margin, scored
on the same pairs as evaluate.py, from the embeddings score_clip.py saved.

    python rigidity.py [--model clip-b32] [--subjects "running fan operation" "toy car"]

The phone's margin (clipSubject.ts marginOf) is: the MEAN similarity over the
subject's phrases, minus the BEST similarity over the negatives that share no
word with the subject, at the best of six views. Two things in it can make a
good photo fail for the subject's sake rather than the photo's:

  negatives  a negative that MEANS what the subject is ("grass" for a crop
             field) stays in when it shares no word, and the max lets that one
             phrase pull every photo of the subject down;
  phrases    every must_show phrase is averaged in, so a long list asks for
             all of it, strongly, at once.

Variants:  A  also drop negatives whose text vector is within tau of a subject
              phrase (the phone has both vectors already);
           B  score the phrases by their best rather than their mean;
           C  both.
Clips need clips: the local set has none, so the presence rule is not tested.
--subjects embeds new subjects' phrases (open_clip, the same model) and lists
the negatives nearest each, which is what A would drop.

Writes out/rigidity.md in the data folder.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402
from evaluate import Model, build_pairs, rates, threshold_for_fw  # noqa: E402
from phone_rules import vocabularies  # noqa: E402
from score_clip import TEMPLATES, negatives, subject_phrases  # noqa: E402

PHONE_THRESHOLD = -0.0013
TAUS = (0.75, 0.80, 0.85, 0.90)


def margin(m: Model, file: str, task: str, subject: dict, tau: float | None, phrases: str) -> float | None:
    """The phone's margin for a photo, with the two knobs. Photos only: one frame."""
    img = m.img.get(file)
    if img is None or task not in m.txt:
        return None
    sub = m.txt[task]  # (phrases, dim)
    vocab = vocabularies(subject)[0]
    keep = [i for i, w in enumerate(m.neg_words) if not (w & vocab)]
    if tau is not None and tau >= 1:  # rank: drop the k nearest
        near = sorted(keep, key=lambda i: -float((m.neg[i] @ sub.T).max()))[: int(tau)]
        keep = [i for i in keep if i not in near]
    elif tau is not None:
        keep = [i for i in keep if float((m.neg[i] @ sub.T).max()) < tau]
    s = img[0] @ sub.T  # (views, phrases)
    sim = s.mean(-1) if phrases == "mean" else s.max(-1)
    best_neg = (img[0] @ m.neg[keep].T).max(-1) if keep else np.full(len(s), -1.0)
    return float((sim - best_neg).max())


def dropped(m: Model, task: str, subject: dict, neg: list[str], tau: float) -> list[str]:
    sub = m.txt[task]
    vocab = vocabularies(subject)[0]
    return [p for i, (p, w) in enumerate(zip(neg, m.neg_words))
            if not (w & vocab) and float((m.neg[i] @ sub.T).max()) >= tau]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", default="clip-b32")
    p.add_argument("--subjects", nargs="*", default=[], help="new subjects to check text-side")
    args = p.parse_args()

    root = data_dir()
    rows = [json.loads(ln) for ln in (root / "manifest.jsonl").read_text(encoding="utf-8").splitlines() if ln]
    subjects = {r["task_id"]: r["subject"] for r in rows}
    neg = json.loads((root / "out" / args.model / "negatives_used.json").read_text(encoding="utf-8"))
    m = Model(root / "out" / args.model / "embeddings.npz", neg)

    # the real pairs only (evaluate.py's first section): no made-up negatives
    pairs = [q for q in build_pairs(rows, 0, set()) if q["kind"] == "photo"]

    variants = [("word filter only (the phone before this change)", None, "mean")]
    variants += [(f"A: semantic filter, tau {t}", t, "mean") for t in TAUS]
    variants += [(f"D: drop the {k} nearest negative{'s' if k > 1 else ''}", k, "mean") for k in (1, 2, 3)]
    variants += [("B: best phrase", None, "max")]
    variants += [(f"C: A tau {t} + B", t, "max") for t in TAUS]

    out = [f"# Is the CLIP subject check too rigid? ({args.model})", "",
           f"{len(pairs)} real photo pairs ({sum(q['label'] for q in pairs)} good, "
           f"{sum(1 - q['label'] for q in pairs)} wrong), {len(subjects)} subjects. "
           "False warning = a good photo the check would question; false pass = a wrong one it lets through.", "",
           f"| variant | AUC | false warnings at {PHONE_THRESHOLD} | false passes at {PHONE_THRESHOLD} "
           "| threshold for 10% false warnings | false passes there | worst subject, good passed at that threshold |",
           "|---|---|---|---|---|---|---|"]
    from sklearn.metrics import roc_auc_score

    detail: dict[str, dict] = {}
    for name, tau, ph in variants:
        sc = np.array([margin(m, q["file"], q["pair_task"], subjects[q["pair_task"]], tau, ph) for q in pairs], float)
        y = np.array([q["label"] for q in pairs])
        ok = ~np.isnan(sc)
        y, sc, ps = y[ok], sc[ok], [q for q, k in zip(pairs, ok) if k]
        fw0, fp0 = rates(y, (sc >= PHONE_THRESHOLD).astype(int))
        t10 = threshold_for_fw(y, sc, 0.10)
        _, fp10 = rates(y, (sc >= t10).astype(int))
        per = {}
        for task in subjects:
            idx = [i for i, q in enumerate(ps) if q["pair_task"] == task]
            good = [i for i in idx if y[i] == 1]
            bad = [i for i in idx if y[i] == 0]
            per[task] = (sum(sc[i] >= t10 for i in good), len(good), sum(sc[i] >= t10 for i in bad), len(bad))
        worst = min((v[0] / v[1], k) for k, v in per.items() if v[1])
        detail[name] = per
        out.append(f"| {name} | {roc_auc_score(y, sc):.3f} | {fw0:.3f} | {fp0:.3f} | {t10:+.4f} | {fp10:.3f} "
                   f"| {worst[1]} {per[worst[1]][0]}/{per[worst[1]][1]} |")

    out += ["", "## Per subject, at each variant's 10%-false-warning threshold (good passed / wrong passed)", "",
            "| subject | " + " | ".join(n for n, _, _ in variants) + " |",
            "|---|" + "---|" * len(variants)]
    for task in subjects:
        cells = []
        for n, _, _ in variants:
            g, gn, b, bn = detail[n][task]
            cells.append(f"{g}/{gn} · {b}/{bn}")
        out.append(f"| {task} | " + " | ".join(cells) + " |")

    out += ["", "## What the semantic filter drops (shares no word with the subject, but means something close)", ""]
    for k in (1, 2, 3):
        out.append(f"- **{k} nearest:** " + "; ".join(
            f"{task}: {', '.join(neg[i] for i in sorted([i for i, w in enumerate(m.neg_words) if not (w & vocabularies(s)[0])], key=lambda i: -float((m.neg[i] @ m.txt[task].T).max()))[:k])}"
            for task, s in subjects.items()))
    for t in TAUS:
        out.append(f"- **tau {t}:** " + "; ".join(
            f"{task}: {', '.join(dropped(m, task, s, neg, t)) or '—'}" for task, s in subjects.items()))

    if args.subjects:
        out += ["", "## New subjects, text side: the negatives nearest each", "",
                "Cosine between the subject's text vector and each negative's (same templates). "
                "The word filter drops a negative only when it shares a word.", ""]
        import open_clip
        import torch

        from score_clip import MODELS

        name, pre = MODELS[args.model]
        model, _, _ = open_clip.create_model_and_transforms(name, pretrained=pre)
        tok = open_clip.get_tokenizer(name)
        model.eval()
        with torch.no_grad():
            def vec(phrase: str) -> np.ndarray:
                t = torch.nn.functional.normalize(model.encode_text(tok([x.format(phrase) for x in TEMPLATES])), dim=-1)
                return torch.nn.functional.normalize(t.mean(0), dim=-1).numpy()

            negs = negatives()
            nv = np.stack([vec(n) for n in negs])
            for subj in args.subjects:
                vocab = vocabularies({"domain": subj, "must_show": [], "must_not_show": []})[0]
                kept = [i for i, w in enumerate(m.neg_words) if not (w & vocab)]
                cos = nv @ vec(subj)
                top = sorted(kept, key=lambda i: -cos[i])[:6]
                out.append(f"- **{subj}**: " + ", ".join(f"{negs[i]} {cos[i]:.2f}" for i in top)
                           + f" (word filter drops: {', '.join(negs[i] for i in range(len(negs)) if i not in kept) or 'none'})")

    path = root / "out" / "rigidity.md"
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out))
    print(f"\n-> {path}")


if __name__ == "__main__":
    main()
