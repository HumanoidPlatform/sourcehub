"""The phone's subject check and frame sampling, ported from TypeScript.

mobile/src/qa_pipeline/subject/subject.ts (words, scoreSubject, the photo and
clip decisions) and mobile/src/qa_pipeline/clip/clip.ts (frameTimes), with the
thresholds from mobile/src/config.ts. tests/test_phone_rules.py holds this to
the phone's own unit-test cases; change the two together.

Pure: no model, no database, no files.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# mobile/src/config.ts
SUBJECT_OFF = 0.3
SUBJECT_VETO = 0.5
SUBJECT_FRAMES_MIN_SHARE = 0.3
MIN_SUBJECT_FRAMES = 2
FRAME_EVERY_S = 5
MIN_FRAMES = 3
MAX_FRAMES = 40
# CLIP: the negatives nearest the subject in meaning that the phone ignores
# (config.ts CLIP_IGNORE_NEAREST_NEGATIVES, clipSubject.ts withoutNearest)
CLIP_IGNORE_NEAREST_NEGATIVES = 1

_STOP = {"a", "an", "the", "of", "with", "and", "or", "in", "on", "at", "no", "not"}


def words(phrase: str) -> list[str]:
    """'Price tags' -> ['price', 'tag']; 'shelves' -> ['shelf']."""
    out = []
    for w in re.split(r"[^a-z]+", phrase.lower()):
        if len(w) < 3 or w in _STOP:
            continue
        if w.endswith("ves"):
            w = w[:-3] + "f"
        elif w.endswith("ies"):
            w = w[:-3] + "y"
        elif not w.endswith("ss") and w.endswith("s"):
            w = w[:-1]
        out.append(w)
    return out


def _matches(label: str, vocabulary: set[str]) -> bool:
    return any(w in vocabulary for w in words(label))


def vocabularies(subject: dict) -> tuple[set[str], set[str]]:
    """(wanted, forbidden) word sets, as scoreSubject builds them."""
    labels = subject.get("labels") or []
    phrases = labels if labels else [subject.get("domain", ""), *(subject.get("must_show") or [])]
    wanted = {w for p in phrases for w in words(p)}
    forbidden = {w for p in (subject.get("must_not_show") or []) for w in words(p)} - wanted
    return wanted, forbidden


@dataclass
class SubjectScore:
    score: float
    forbidden: float
    hit: list[str] = field(default_factory=list)
    veto: list[str] = field(default_factory=list)
    seen: list[str] = field(default_factory=list)


def score_subject(labels: list[tuple[str, float]], subject: dict) -> SubjectScore:
    wanted, forbidden = vocabularies(subject)
    ordered = sorted(labels, key=lambda l: -l[1])  # stable, as Array.sort is
    hit = [l for l in ordered if _matches(l[0], wanted)]
    veto = [l for l in ordered if _matches(l[0], forbidden)]
    return SubjectScore(
        score=hit[0][1] if hit else 0.0,
        forbidden=veto[0][1] if veto else 0.0,
        hit=[l[0] for l in hit],
        veto=[l[0] for l in veto],
        seen=[l[0] for l in ordered[:5]],
    )


def photo_passes(score: float) -> bool:
    """subjectFinding returns null (no warning) at or above SUBJECT_OFF."""
    return score >= SUBJECT_OFF


def clip_passes(hits: int, frames: int) -> bool:
    """framesFinding returns null when enough sampled frames showed the subject."""
    share = hits / frames if frames else 0.0
    return hits >= min(MIN_SUBJECT_FRAMES, frames) and share >= SUBJECT_FRAMES_MIN_SHARE


def names_match(label_names: list[str], subject: dict) -> bool:
    """Would any of these label NAMES count as the subject? The stored record
    keeps the top five names without confidences, so for a subject the phone
    never scored this is all that can be asked of it."""
    wanted, _ = vocabularies(subject)
    return any(_matches(n, wanted) for n in label_names)


def frame_times(duration_s: float) -> list[float]:
    """Where the phone samples a clip, in seconds from the start."""
    d = max(0.0, duration_s)
    n = min(MAX_FRAMES, max(MIN_FRAMES, int(d // FRAME_EVERY_S)))
    first = min(0.25, d / 2)
    last = max(first, d - 0.25)
    times = [round(first + (last - first) * i / (n - 1), 3) for i in range(n)]
    out: list[float] = []
    for i, t in enumerate(times):
        # the phone compares with the previous SAMPLE, kept or not
        if i == 0 or t - times[i - 1] >= 0.5:
            out.append(t)
    return out
