"""What an aggregator's per-capture marks amount to, before anything is written.

Gate 1 used to be one verdict for a whole batch: nine good frames and one bad
one meant sending back all ten and the worker re-shooting the lot. A mark says
"this frame again", and its effect is asset.status = 'rejected' — the value
that makes ready_count stop counting it, so the existing submit gate forces the
retake, and attach_to_submission stop bundling it, so it never reaches the
delivery partner.

plan_marks is the judgement with the database taken out: it reads the marks
against the batch as it stands and refuses everything refusable before a row is
touched. The writing half is exercised against a live stack by
tests/e2e_loop.py.

    pytest tests/test_gate1_marks_unit.py
"""

from __future__ import annotations

import uuid

import pytest

from sourcehub.modules.qa.service import QaError, decide_batch, expand_all_retake, plan_marks

CODES = {"blur", "wrong_subject", "occlusion", "other"}

A, B, C = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
BATCH = {A: "ready", B: "ready", C: "ready"}


def mark(asset_id: uuid.UUID, outcome: str = "retake", **over) -> dict:
    base = {"asset_id": asset_id, "outcome": outcome, "reason": None, "note": None}
    if outcome == "retake" and "reason" not in over:
        base["reason"] = "blur"
    base.update(over)
    return base


# --- what gets written -------------------------------------------------------

def test_the_marked_frames_are_listed_with_their_reason_and_words():
    plan = plan_marks(
        [mark(A, reason="blur", note="  the whole shelf is soft  "), mark(B, "keep")],
        BATCH, CODES,
    )
    assert plan.retake == [(A, "blur", "the whole shelf is soft")]
    assert plan.restore == []


def test_reasons_are_counted_for_the_rollup():
    plan = plan_marks(
        [mark(A, reason="blur"), mark(B, reason="blur"), mark(C, reason="wrong_subject")],
        BATCH, CODES,
    )
    assert plan.tally == {"blur": 2, "wrong_subject": 1}


def test_keeping_the_frames_that_passed_writes_nothing():
    plan = plan_marks([mark(A, "keep"), mark(B, "keep")], BATCH, CODES)
    assert (plan.retake, plan.restore, plan.tally) == ([], [], {})


def test_a_blank_note_is_no_note_rather_than_an_empty_string():
    plan = plan_marks([mark(A, note="   ")], BATCH, CODES)
    assert plan.retake == [(A, "blur", None)]


def test_the_last_word_wins_when_one_frame_is_marked_twice():
    plan = plan_marks([mark(A, reason="blur"), mark(A, "keep")], BATCH, CODES)
    assert plan.retake == []


# --- changing your mind ------------------------------------------------------

def test_keeping_a_frame_sent_back_earlier_puts_it_back():
    plan = plan_marks([mark(A, "keep")], {A: "rejected"}, CODES)
    assert plan.restore == [A]


def test_a_frame_already_sent_back_can_be_sent_back_again_with_a_new_reason():
    plan = plan_marks([mark(A, reason="wrong_subject")], {A: "rejected"}, CODES)
    assert plan.retake == [(A, "wrong_subject", None)]


# --- what is refused ---------------------------------------------------------

def test_a_retake_without_a_reason_is_refused():
    # The worker has to know what to change; a blank mark is a blank rejection.
    with pytest.raises(QaError, match="why"):
        plan_marks([mark(A, reason=None)], BATCH, CODES)
    with pytest.raises(QaError, match="why"):
        plan_marks([mark(A, reason="   ")], BATCH, CODES)


def test_a_reason_the_platform_does_not_know_is_refused():
    with pytest.raises(QaError, match="rubbish"):
        plan_marks([mark(A, reason="rubbish")], BATCH, CODES)


def test_a_capture_from_another_batch_is_refused():
    with pytest.raises(QaError, match="not in this batch"):
        plan_marks([mark(uuid.uuid4())], BATCH, CODES)


@pytest.mark.parametrize("status", ["pending", "uploaded", "quarantined", "erased"])
def test_only_a_capture_the_worker_actually_submitted_can_be_marked(status):
    # A half-uploaded or quarantined file never became part of the batch, so
    # there is nothing for the reviewer to judge.
    with pytest.raises(QaError, match=status):
        plan_marks([mark(A)], {A: status}, CODES)


# --- "mark all to retake", expanded on the server -----------------------------

def test_every_ready_or_rejected_capture_is_marked_and_nothing_else():
    known = {A: "ready", B: "rejected", C: "pending", uuid.uuid4(): "quarantined",
             uuid.uuid4(): "erased"}
    got = expand_all_retake([], known, {"reason": "blur", "note": "  soft focus  "})
    assert sorted(str(m["asset_id"]) for m in got) == sorted(map(str, (A, B)))
    assert all(m == {"asset_id": m["asset_id"], "outcome": "retake", "reason": "blur",
                     "note": "soft focus"} for m in got)
    # and the plan reads it as any other set of marks
    plan = plan_marks(got, known, CODES)
    assert sorted(map(str, (a for a, _, _ in plan.retake))) == sorted(map(str, (A, B)))
    assert plan.tally == {"blur": 2}


def test_an_explicit_keep_survives_the_blanket():
    # The explicit marks come last, and plan_marks gives the last word to the
    # last mark: Keep on B beats the blanket on B.
    got = expand_all_retake([mark(B, "keep")], BATCH, {"reason": "blur"})
    assert [m["asset_id"] for m in got][-1] == B and len(got) == 3
    plan = plan_marks(got, BATCH, CODES)
    assert sorted(map(str, (a for a, _, _ in plan.retake))) == sorted(map(str, (A, C)))
    assert plan.tally == {"blur": 2}


def test_an_explicit_mark_keeps_its_own_reason_over_the_blanket():
    got = expand_all_retake([mark(A, reason="wrong_subject")], BATCH, {"reason": "blur"})
    plan = plan_marks(got, BATCH, CODES)
    assert {a: r for a, r, _ in plan.retake} == {A: "wrong_subject", B: "blur", C: "blur"}


def test_a_blank_blanket_note_is_no_note():
    got = expand_all_retake([], {A: "ready"}, {"reason": "blur", "note": "   "})
    assert got == [{"asset_id": A, "outcome": "retake", "reason": "blur", "note": None}]


def test_without_a_blanket_the_marks_pass_through_untouched():
    marks = [mark(A), mark(B, "keep")]
    got = expand_all_retake(marks, BATCH, None)
    assert got == marks and got is not marks


def test_a_blanket_without_a_reason_is_refused_like_any_other_retake():
    with pytest.raises(QaError, match="why"):
        plan_marks(expand_all_retake([], BATCH, {"reason": "  "}), BATCH, CODES)


def test_a_blanket_reason_the_platform_does_not_know_is_refused():
    with pytest.raises(QaError, match="rubbish"):
        plan_marks(expand_all_retake([], BATCH, {"reason": "rubbish"}), BATCH, CODES)


async def test_accept_with_a_blanket_is_refused_before_anything_is_read():
    # Marking every capture to be shot again is a send-back by definition; the
    # refusal comes before the batch is even looked up, so no session is needed.
    with pytest.raises(QaError, match="reject"):
        await decide_batch(None, None, uuid.uuid4(), "accept", None, [], {"reason": "blur"})  # type: ignore[arg-type]
