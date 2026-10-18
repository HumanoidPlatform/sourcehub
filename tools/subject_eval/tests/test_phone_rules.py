"""The Python port agrees with the phone: cases copied from
mobile/__tests__/subject.test.ts and mobile/__tests__/clip.test.ts."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from phone_rules import (  # noqa: E402
    MAX_FRAMES,
    MIN_FRAMES,
    SUBJECT_OFF,
    clip_passes,
    frame_times,
    names_match,
    photo_passes,
    score_subject,
    words,
)

SHELF = {
    "domain": "retail shelf",
    "must_show": ["supermarket shelf", "products", "price tags"],
    "must_not_show": ["person", "selfie", "screenshot"],
}
LAPTOP = {"domain": "laptop", "must_show": [], "must_not_show": ["laptop bag"]}


def test_words():
    assert words("Price tags") == ["price", "tag"]
    assert words("shelves") == ["shelf"]
    assert words("a photo of the Groceries") == ["photo", "grocery"]
    assert words("glass") == ["glass"]


def test_best_matching_label():
    r = score_subject([("Shelf", 0.91), ("Supermarket", 0.8), ("Floor", 0.3)], SHELF)
    assert r.score == pytest.approx(0.91)
    assert r.hit == ["Shelf", "Supermarket"] and r.veto == []
    assert r.seen == ["Shelf", "Supermarket", "Floor"]


def test_a_dog_scores_nothing():
    r = score_subject([("Dog", 0.97), ("Grass", 0.6)], SHELF)
    assert r.score == 0 and r.hit == []


def test_forbidden_is_its_own_answer():
    r = score_subject([("Shelf", 0.7), ("Person", 0.9)], SHELF)
    assert r.score == pytest.approx(0.7) and r.forbidden == pytest.approx(0.9)
    assert r.veto == ["Person"]


def test_a_wanted_word_cannot_forbid():
    r = score_subject([("Laptop", 0.8)], LAPTOP)
    assert r.score == pytest.approx(0.8) and r.veto == [] and r.forbidden == 0
    r = score_subject([("Laptop", 0.8), ("Bag", 0.6)], LAPTOP)
    assert r.veto == ["Bag"] and r.forbidden == pytest.approx(0.6)


def test_explicit_vocabulary_replaces_the_profile():
    strict = {**SHELF, "labels": ["Bottle"]}
    assert score_subject([("Shelf", 0.9)], strict).score == 0
    assert score_subject([("Bottle", 0.6)], strict).score == pytest.approx(0.6)


def test_five_seen_best_first():
    many = [("A", 0.1), ("B", 0.9), ("C", 0.5), ("D", 0.7), ("E", 0.3), ("F", 0.2)]
    assert score_subject(many, SHELF).seen == ["B", "D", "C", "E", "F"]


def test_decisions():
    assert photo_passes(SUBJECT_OFF) and not photo_passes(SUBJECT_OFF - 0.01)
    assert clip_passes(3, 4) and clip_passes(1, 1)
    assert not clip_passes(1, 4)  # one frame is not two
    assert not clip_passes(2, 10)  # 20% is under the 30% share
    assert not clip_passes(0, 0)


def test_names_match():
    assert names_match(["Shelf", "Floor"], SHELF)
    assert not names_match(["Dog"], SHELF)


def test_frame_times():
    t = frame_times(7)
    assert len(t) == MIN_FRAMES and t[0] > 0 and t[-1] < 7
    t = frame_times(60)
    assert len(t) == 12 and t[0] == pytest.approx(0.25) and t[-1] == pytest.approx(59.75)
    assert len(frame_times(600)) == MAX_FRAMES and len(frame_times(3600)) == MAX_FRAMES
    assert len(frame_times(0.3)) == 1
    assert frame_times(0) == [0]
    t = frame_times(1.2)
    assert len(set(t)) == len(t)
