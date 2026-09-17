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
