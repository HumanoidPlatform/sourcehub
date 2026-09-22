"""The subject profile a task carries for the phone's domain check, and the
scored device check the phone sends back. Pure — validation only.

    pytest tests/test_subject_spec.py
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from sourcehub.api.v1.delivery import SubjectIn
from sourcehub.api.v1.media import DeviceCheck


def test_subject_trims_and_drops_blank_phrases():
    s = SubjectIn(domain="retail shelf", must_show=[" shelf ", "", "price tags"], must_not_show=["  "])
    assert s.must_show == ["shelf", "price tags"]
    assert s.must_not_show == []
    assert s.labels == []


def test_subject_refuses_long_phrases_and_long_lists():
    with pytest.raises(ValidationError):
        SubjectIn(domain="x" * 81)
    with pytest.raises(ValidationError):
        SubjectIn(domain="shelf", must_show=["y" * 61])
    with pytest.raises(ValidationError):
        SubjectIn(domain="shelf", must_not_show=[f"w{i}" for i in range(13)])


def test_device_check_score_is_a_probability_and_detail_is_small():
    c = DeviceCheck(code="wrong_subject", severity="warn", message="m", score=0.12,
                    detail={"labels": ["Floor", "Hand"]})
    assert c.model_dump(exclude_none=True)["detail"] == {"labels": ["Floor", "Hand"]}
    assert "score" not in DeviceCheck(code="tilt", severity="warn", message="m").model_dump(exclude_none=True)
    with pytest.raises(ValidationError):
        DeviceCheck(code="wrong_subject", severity="warn", message="m", score=1.5)
    with pytest.raises(ValidationError):
        DeviceCheck(code="wrong_subject", severity="warn", message="m", detail={"labels": ["x" * 1100]})


def test_capture_spec_takes_a_clips_bounds_and_refuses_nonsense():
    from sourcehub.api.v1.marketplace import CaptureSpec

    s = CaptureSpec(media=["video"], min_duration_s=30, max_duration_s=120, min_video_lines=1080,
                    allow_library=True)
    assert (s.min_duration_s, s.max_duration_s, s.min_video_lines, s.allow_library) == (30, 120, 1080, True)
    # nothing said, nothing set: the phone falls back to its own caps
    assert CaptureSpec(media=["video"]).model_dump(exclude_none=True) == {"media": ["video"], "languages": []}
    with pytest.raises(ValidationError):
        CaptureSpec(min_duration_s=-1)
    with pytest.raises(ValidationError):
        CaptureSpec(max_duration_s=0)
    with pytest.raises(ValidationError):
        CaptureSpec(min_video_lines=0)


def test_presign_takes_a_clip_of_minutes_but_not_of_hours():
    from sourcehub.api.v1.media import PresignIn
    from sourcehub.modules.media.service import MAX_VIDEO_BYTES

    common = dict(filename="a.mp4", content_type="video/mp4", sha256="a" * 64,
                  captured_at="2026-09-22T10:00:00Z")
    assert PresignIn(size_bytes=900 * 1024 * 1024, **common).size_bytes == 900 * 1024 * 1024
    assert PresignIn(size_bytes=MAX_VIDEO_BYTES, **common).size_bytes == MAX_VIDEO_BYTES
    with pytest.raises(ValidationError):
        PresignIn(size_bytes=MAX_VIDEO_BYTES + 1, **common)
