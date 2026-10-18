"""Pair captures with subjects, score them both ways, and report.

    python evaluate.py [--models clip-b32 pe-core-s16 ...] [--cross 3] [--boot 1000]

Truth is gate 1. A pair is POSITIVE when the capture was accepted and is
paired with its own task's subject; NEGATIVE when it was rejected as the wrong
subject (real), or when an accepted capture is paired with ANOTHER task's
subject that shares none of its words (made up: retakes never reach the
server, so real negatives are few). exclude_pairs.txt (asset_id,task_id per
line, in the data folder) removes made-up pairs that a look shows to match.

ML Kit is read from what the phone recorded (subject_measured), never re-run.
For a made-up pair the phone never scored that subject, so its answer there is
only whether the stored top-five label NAMES match it: yes/no, no score.

The CLIP score of a pair is the margin of the subject over the best negative
phrase, taking the best of the whole frame and its crops; a clip's is the mean
of its best three frames. A logistic regression over the margin features is
cross-validated by task, so no task is both trained and tested on.

Everything is reported for photos and clips separately, with 95% intervals
from resampling TASKS (captures of one task are not independent).
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402
from phone_rules import clip_passes, names_match, photo_passes, vocabularies, words  # noqa: E402

RNG_SEED = 20261017


# ---------------------------------------------------------------------------
# Pairs
# ---------------------------------------------------------------------------
def build_pairs(rows: list[dict], cross: int, exclude: set[tuple[str, str]]) -> list[dict]:
    subjects = {r["task_id"]: r["subject"] for r in rows}
    wanted = {t: vocabularies(s)[0] for t, s in subjects.items()}
    rng = random.Random(RNG_SEED)
    pairs = []
    for r in rows:
        if r["outcome"] in ("accepted", "rejected_subject"):
            pairs.append({**r, "pair_task": r["task_id"], "label": int(r["outcome"] == "accepted"),
                          "made_up": False})
        if r["outcome"] != "accepted" or cross <= 0:
            continue
        unrelated = [t for t in subjects if t != r["task_id"] and not (wanted[t] & wanted[r["task_id"]])
                     and (r["asset_id"], t) not in exclude]
        for t in rng.sample(unrelated, min(cross, len(unrelated))):
            pairs.append({**r, "pair_task": t, "label": 0, "made_up": True})
    return pairs


def mlkit(pair: dict, subjects: dict) -> tuple[float | None, int | None]:
    """(score, passes) from the phone's record; None where it cannot say."""
    m = pair["mlkit"]
    meas = m.get("measured")
    if m.get("unscored"):
        return None, None
    if pair["made_up"]:
        if not meas:
            return None, None
        return None, int(names_match(meas.get("labels") or [], subjects[pair["pair_task"]]))
    if meas is None:
        # an older build: only the warning tells us the verdict
        return None, int(not m.get("warned"))
    if pair["kind"] == "photo":
        s = float(meas.get("score") or 0)
        return s, int(photo_passes(s))
    s = float(meas.get("share") or 0)
    return s, int(clip_passes(int(meas.get("hits") or 0), int(meas.get("frames") or 0)))


# ---------------------------------------------------------------------------
# CLIP features
# ---------------------------------------------------------------------------
class Model:
    def __init__(self, path: Path, neg_phrases: list[str]):
        z = np.load(path)
        self.scale = float(z["logit_scale"])
        self.img = {k[4:]: z[k].astype(np.float32) for k in z.files if k.startswith("img:")}
        self.txt = {k[4:]: z[k].astype(np.float32) for k in z.files if k.startswith("txt:")}
        self.neg = z["neg"].astype(np.float32)
        self.neg_words = [set(words(p)) for p in neg_phrases]

    def features(self, file: str, task_id: str, subject: dict) -> dict | None:
        img = self.img.get(file)
        if img is None or task_id not in self.txt:
            return None
        sub = self.txt[task_id]  # (phrases, dim)
        # a negative that names part of the subject would argue with it
        vocab = vocabularies(subject)[0]
        keep = [i for i, w in enumerate(self.neg_words) if not (w & vocab)]
        neg = self.neg[keep]
        s = img @ sub.T  # (frames, views, phrases)
        sim = s.mean(-1)  # all of the subject's phrases, averaged
        best_phrase = s.max(-1)
        n = img @ neg.T  # (frames, views, negs)
        best_neg = n.max(-1)
        margin = sim - best_neg
        logits = np.concatenate([sim[..., None], n], -1) * self.scale
        logits -= logits.max(-1, keepdims=True)
        share = np.exp(logits[..., 0]) / np.exp(logits).sum(-1)
        # per frame: whole frame (view 0) and the best of all views
        f_margin_full = margin[:, 0]
        f_margin_best = margin.max(1)
        f_share_best = share.max(1)
        f_phrase_best = best_phrase.max(1)
        order = np.argsort(-f_margin_best)[:3]  # a clip: its best three frames

        def agg(x):
            return float(x[order].mean())

        return {
            "margin": agg(f_margin_best),
            "margin_full": agg(f_margin_full),
            "share": agg(f_share_best),
            "phrase": agg(f_phrase_best),
        }


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
def rates(y: np.ndarray, passed: np.ndarray) -> tuple[float, float]:
    """(false-warning rate, false-pass rate)."""
    pos, neg = y == 1, y == 0
    fw = float((passed[pos] == 0).mean()) if pos.any() else float("nan")
    fp = float((passed[neg] == 1).mean()) if neg.any() else float("nan")
    return fw, fp


def threshold_for_fw(y: np.ndarray, score: np.ndarray, fw: float) -> float:
    """The threshold at which the share of positives below it is fw."""
    pos = np.sort(score[y == 1])
    if len(pos) == 0:
        return float("nan")
    k = int(np.floor(fw * len(pos)))
    return float(pos[min(k, len(pos) - 1)])


def threshold_for_fp(y: np.ndarray, score: np.ndarray, fp: float) -> float:
    neg = np.sort(score[y == 0])[::-1]
    if len(neg) == 0:
        return float("nan")
    k = int(np.floor(fp * len(neg)))
    return float(neg[k] + 1e-9) if k < len(neg) else float(neg[-1])


def auc(y: np.ndarray, s: np.ndarray) -> tuple[float, float]:
    from sklearn.metrics import average_precision_score, roc_auc_score

    if len(set(y.tolist())) < 2:
        return float("nan"), float("nan")
    return float(roc_auc_score(y, s)), float(average_precision_score(y, s))


def calibrated(pairs: list[dict], key: str) -> np.ndarray:
    """Out-of-fold probabilities from a logistic regression, grouped by task."""
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import GroupKFold, cross_val_predict

    X = np.array([[p[key]["margin"], p[key]["margin_full"], p[key]["share"], p[key]["phrase"]] for p in pairs])
    y = np.array([p["label"] for p in pairs])
    groups = np.array([p["task_id"] for p in pairs])
    k = min(5, len(set(groups)))
    if k < 2 or len(set(y.tolist())) < 2:
        return X[:, 0]
    return cross_val_predict(LogisticRegression(max_iter=1000), X, y, groups=groups,
                             cv=GroupKFold(n_splits=k), method="predict_proba")[:, 1]


def boot(pairs: list[dict], stat, n: int) -> tuple[float, float]:
    """95% interval of stat(pairs) over tasks resampled with replacement."""
    by_task: dict[str, list[dict]] = {}
    for p in pairs:
        by_task.setdefault(p["task_id"], []).append(p)
    tasks = list(by_task)
    rng = random.Random(RNG_SEED)
    vals = []
    for _ in range(n):
        sample = [p for t in rng.choices(tasks, k=len(tasks)) for p in by_task[t]]
        v = stat(sample)
        if v == v:  # not NaN
            vals.append(v)
    if not vals:
        return float("nan"), float("nan")
    return float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5))


def fmt(x: float) -> str:
    return "–" if x != x else f"{x:.3f}"


def ci(lo_hi: tuple[float, float]) -> str:
    return f"[{fmt(lo_hi[0])}, {fmt(lo_hi[1])}]"


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
def section(title: str, pairs: list[dict], models: list[str], n_boot: int) -> list[str]:
    out = [f"### {title}", ""]
    if not pairs:
        return out + ["No pairs.", ""]
    y = np.array([p["label"] for p in pairs])
    out.append(f"{len(pairs)} pairs: {int(y.sum())} positive, {int((1 - y).sum())} negative "
               f"({sum(p['made_up'] for p in pairs)} made up), {len({p['task_id'] for p in pairs})} tasks.")
    out.append("")
    known = [p for p in pairs if p["mk_pass"] is not None]
    if known:
        yk = np.array([p["label"] for p in known])
        mk = np.array([p["mk_pass"] for p in known])
        mk_fw, mk_fp = rates(yk, mk)
        out.append(f"ML Kit as the phone decides ({len(known)} pairs it answered): "
                   f"false warnings {fmt(mk_fw)}, false passes {fmt(mk_fp)}.")
    else:
        # the local set: ML Kit runs only on a phone, so CLIP is judged on every pair
        known = pairs
        mk_fw = mk_fp = float("nan")
        out.append("ML Kit was not run on these pairs.")
    scored = [p for p in known if p["mk_score"] is not None]
    if scored:
        r, pr = auc(np.array([p["label"] for p in scored]), np.array([p["mk_score"] for p in scored]))
        out.append(f"ML Kit score, where it has one ({len(scored)} pairs): ROC-AUC {fmt(r)}, PR-AUC {fmt(pr)}.")
    out.append("")
    out.append("| model | ROC-AUC (95% CI) | PR-AUC | calibrated ROC-AUC | false passes at ML Kit's "
               "false-warning rate | false warnings at ML Kit's false-pass rate |")
    out.append("|---|---|---|---|---|---|")
    for m in models:
        mp = [p for p in known if p.get(m)]
        if not mp:
            continue
        ym = np.array([p["label"] for p in mp])
        sm = np.array([p[m]["margin"] for p in mp])
        r, pr = auc(ym, sm)
        r_ci = boot(mp, lambda ps: auc(np.array([q["label"] for q in ps]),
                                       np.array([q[m]["margin"] for q in ps]))[0], n_boot)
        cal = calibrated(mp, m)
        rc, _ = auc(ym, cal)
        nan = float("nan")
        t1 = threshold_for_fw(ym, sm, mk_fw) if mk_fw == mk_fw else nan
        fp_at = rates(ym, (sm >= t1).astype(int))[1] if t1 == t1 else nan
        t2 = threshold_for_fp(ym, sm, mk_fp) if mk_fp == mk_fp else nan
        fw_at = rates(ym, (sm >= t2).astype(int))[0] if t2 == t2 else nan
        out.append(f"| {m} | {fmt(r)} {ci(r_ci)} | {fmt(pr)} | {fmt(rc)} | {fmt(fp_at)} (ML Kit {fmt(mk_fp)}) "
                   f"| {fmt(fw_at)} (ML Kit {fmt(mk_fw)}) |")
        for target in (0.05, 0.10):
            t = threshold_for_fw(ym, sm, target)
            fw, fp = rates(ym, (sm >= t).astype(int))
            out.append(f"|  ↳ margin ≥ {t:.4f} | false warnings {fmt(fw)} | false passes {fmt(fp)} | | | |")
    out.append("")
    return out


def breakdown(pairs: list[dict], m: str, fw: float = 0.10) -> tuple[list[str], float]:
    """What passes, by kind of image and by scenario, at the threshold that
    flags `fw` of the good captures. The local set only: it names its groups."""
    mp = [p for p in pairs if p.get(m)]
    y = np.array([p["label"] for p in mp])
    s = np.array([p[m]["margin"] for p in mp])
    t = threshold_for_fw(y, s, fw)
    out = [f"### {m}: what passes at margin ≥ {t:.4f} (flags {fw:.0%} of good captures)", "",
           "| image | truth | pairs | passed |", "|---|---|---|---|"]
    groups: dict[str, list[dict]] = {}
    for p in mp:
        g = "other scenario's subject" if p["made_up"] else p.get("group", "?")
        groups.setdefault(g, []).append(p)
    for g, ps in sorted(groups.items(), key=lambda kv: (-kv[1][0]["label"], kv[0])):
        passed = sum(p[m]["margin"] >= t for p in ps)
        truth = "good" if ps[0]["label"] else "wrong"
        out.append(f"| {g} | {truth} | {len(ps)} | {passed} ({passed / len(ps):.0%}) |")
    out += ["", "| scenario | ROC-AUC | good passed | wrong passed |", "|---|---|---|---|"]
    for task in sorted({p["pair_task"] for p in mp}):
        ps = [p for p in mp if p["pair_task"] == task]
        yt = np.array([p["label"] for p in ps])
        st = np.array([p[m]["margin"] for p in ps])
        good, bad = st[yt == 1], st[yt == 0]
        out.append(f"| {task} | {fmt(auc(yt, st)[0])} | {int((good >= t).sum())}/{len(good)} "
                   f"| {int((bad >= t).sum())}/{len(bad)} |")
    return out + [""], t


def verdict_sheet(pairs: list[dict], models: list[str], thresholds: dict[str, float], path: Path) -> None:
    """Every image against its own scenario, with each model's verdict."""
    import html

    own = [p for p in pairs if not p["made_up"]]
    cells = []
    for p in sorted(own, key=lambda p: (p["pair_task"], -p["label"], p.get("group", ""))):
        verdicts = []
        for m in models:
            f = p.get(m)
            if not f or m not in thresholds:
                continue
            ok = f["margin"] >= thresholds[m]
            right = ok == bool(p["label"])
            verdicts.append(f'<span class="{"r" if right else "w"}">{m}: {"pass" if ok else "warn"} '
                            f'({f["margin"]:+.3f})</span>')
        src = (Path("..") / "files" / p["file"]).as_posix()
        cells.append(f'<figure><img src="{src}" loading="lazy"><figcaption><b>{html.escape(p["pair_task"])}</b> · '
                     f'{html.escape(p.get("group", ""))} · {"good" if p["label"] else "wrong"}<br>'
                     + "<br>".join(verdicts) + "</figcaption></figure>")
    path.write_text(
        "<!doctype html><meta charset=utf-8><title>Subject verdicts</title><style>body{font:13px system-ui;"
        "margin:16px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}"
        "img{width:100%;height:160px;object-fit:cover;background:#ddd}figure{margin:0}.r{color:#0a7a32}"
        ".w{color:#c0262d;font-weight:600}</style><p>Green: the verdict matches the truth. Red: it does not."
        "</p><main>" + "".join(cells) + "</main>", encoding="utf-8")


def disagreements(pairs: list[dict], m: str, k: int = 15) -> list[str]:
    """Own-task pairs where CLIP and ML Kit disagree, the human verdict decides who was right."""
    own = [p for p in pairs if not p["made_up"] and p.get(m) and p["mk_pass"] is not None]
    if not own:
        return []
    ms = np.array([p[m]["margin"] for p in own])
    t = float(np.median(ms))
    rows = []
    for p in own:
        clip_pass = int(p[m]["margin"] >= t)
        if clip_pass != p["mk_pass"]:
            right = "CLIP" if clip_pass == p["label"] else "ML Kit"
            rows.append((abs(p[m]["margin"] - t), p, clip_pass, right))
    rows.sort(key=lambda x: -x[0])
    out = [f"### Biggest disagreements ({m}, threshold at the median margin, own-task pairs)", "",
           "| asset | task | kind | gate 1 | ML Kit | CLIP margin | right |", "|---|---|---|---|---|---|---|"]
    for _, p, cp, right in rows[:k]:
        out.append(f"| {p['asset_id']} | {p['task']} | {p['kind']} | {'accepted' if p['label'] else 'rejected'} "
                   f"| {'pass' if p['mk_pass'] else 'warn'} | {p[m]['margin']:.4f} | {right} |")
    tally = {"CLIP": sum(r[3] == "CLIP" for r in rows), "ML Kit": sum(r[3] == "ML Kit" for r in rows)}
    out += ["", f"Of {len(rows)} disagreements, CLIP was right on {tally['CLIP']}, ML Kit on {tally['ML Kit']}.", ""]
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--models", nargs="*", default=None, help="default: every model scored")
    p.add_argument("--cross", type=int, default=3, help="made-up negatives per accepted capture")
    p.add_argument("--boot", type=int, default=1000)
    args = p.parse_args()

    root = data_dir()
    rows = [json.loads(ln) for ln in (root / "manifest.jsonl").read_text(encoding="utf-8").splitlines() if ln]

    def listed(name: str) -> list[list[str]]:
        f = root / name
        if not f.exists():
            return []
        return [ln.strip().split(",") for ln in f.read_text().splitlines() if ln.strip() and not ln.startswith("#")]

    # location-only rejects, found on the contact sheet: not a subject failure
    rows = [r for r in rows if r["asset_id"] not in {x[0] for x in listed("exclude_assets.txt")}]
    subjects = {r["task_id"]: r["subject"] for r in rows}
    exclude = {(x[0], x[1]) for x in listed("exclude_pairs.txt") if len(x) >= 2}

    models = args.models or sorted(d.name for d in (root / "out").iterdir() if (d / "embeddings.npz").exists())
    loaded = {}
    for m in models:
        neg = json.loads((root / "out" / m / "negatives_used.json").read_text(encoding="utf-8"))
        loaded[m] = Model(root / "out" / m / "embeddings.npz", neg)

    pairs = build_pairs(rows, args.cross, exclude)
    for pr in pairs:
        pr["mk_score"], pr["mk_pass"] = mlkit(pr, subjects)
        for m, model in loaded.items():
            pr[m] = model.features(pr["file"], pr["pair_task"], subjects[pr["pair_task"]])

    lines = ["# Subject check: CLIP vs ML Kit on gate-1 outcomes", "",
             f"{len(rows)} captures from {len(subjects)} tasks; models: {', '.join(models)}; "
             f"{args.cross} made-up negatives per accepted capture; {args.boot} task resamples.", "",
             "False warning = an accepted capture the check would flag. False pass = an off-subject "
             "capture it would let through. CLIP thresholds are set to match ML Kit's rate on the "
             "other error, so each column compares like with like.", ""]
    for kind in ("photo", "clip"):
        lines += [f"## {kind.capitalize()}s", ""]
        kp = [x for x in pairs if x["kind"] == kind]
        lines += section("Real outcomes only (accepted vs rejected as wrong subject)",
                         [x for x in kp if not x["made_up"]], models, args.boot)
        lines += section("With made-up negatives (ML Kit answered from label names only)", kp, models, args.boot)
        if any("group" in x for x in kp):
            thresholds = {}
            for m in models:
                part, thresholds[m] = breakdown(kp, m)
                lines += part
            verdict_sheet(kp, models, thresholds, root / "out" / f"verdicts_{kind}.html")
        for m in models:
            lines += disagreements(kp, m)
    unscored = sum(1 for r in rows if r["mlkit"].get("unscored"))
    lines += ["## Caveats", "",
              f"- {unscored} captures were never scored on the phone and are left out of ML Kit's figures.",
              "- 'Wrong subject' at gate 1 also means wrong location; those rejects were checked by eye.",
              "- Retaken captures never reach the server, so most negatives are made up.",
              "- The subject is the task's current one, not necessarily the one at capture time.",
              "- Desktop scores, not phone speed: the same exported model must be checked on a phone.", ""]
    out = root / "out" / "report.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    (root / "out" / "pairs.jsonl").write_text(
        "\n".join(json.dumps({k: v for k, v in pr.items() if k not in ("subject", "mlkit", "review_note")})
                  for pr in pairs), encoding="utf-8")
    print(f"report: {out}")


if __name__ == "__main__":
    main()
