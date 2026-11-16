"""A capture on a task whose request asked for de-identification is taken only if
the phone says it cleaned it: media.required_deidentification, the presign guard
(DeidentificationRequired, 428), asset.redaction, and the API field.

What this file guards, in the order it would hurt:

  * an uncleaned file getting a URL into the client's bucket: the guard must run
    before anything is minted, and fail closed unless the switch is turned off;
  * the phone being unable to tell this refusal from one it cannot act on: it
    is its own status, 428, never the 422 every other refusal is;
  * a cleaned capture not saying so: asset.redaction and check_results carry it.

    pytest tests/test_device_deidentification_unit.py
"""

from __future__ import annotations

import inspect

import pytest
from pydantic import ValidationError

from sourcehub.api.v1 import media as media_api
from sourcehub.config import Settings
from sourcehub.modules.media import service as media


@pytest.mark.parametrize(
    ("spec", "asked"),
    [
        (None, []),
        ({}, []),
        ({"privacy": None}, []),
        ({"privacy": {"deidentification": []}}, []),
        ({"privacy": {"deidentification": None}}, []),
        ({"privacy": {"deidentification": "blur_faces"}}, []),
        (
            {"privacy": {"deidentification": ["blur_faces", "strip_gps"]}},
            ["blur_faces", "strip_gps"],
        ),
    ],
)
def test_required_deidentification(spec, asked):
    assert media.required_deidentification(spec) == asked


def test_the_refusal_is_a_media_refusal_with_its_own_status():
    e = media.DeidentificationRequired("x")
    assert isinstance(e, media.MediaInvalid)
    assert media_api._map(e).status_code == 428
    # every other refusal keeps its 422
    assert media_api._map(media.MediaInvalid("y")).status_code == 422


def test_the_guard_runs_before_any_url_is_minted_and_fails_closed():
    src = inspect.getsource(media.presign_capture)
    guard = src.index("raise DeidentificationRequired(")
    assert "asked and deidentified is None and settings.require_device_deidentification" in src
    # nothing reaches storage before it
    assert guard < src.index("storage_svc.resolve_for_contract")
    assert guard < src.index("storage.presign_put")
    assert Settings.model_fields["require_device_deidentification"].default is True


def test_a_cleaned_capture_says_so():
    src = inspect.getsource(media.presign_capture)
    assert '"device_redacted" if asked and deidentified is not None else "not_required"' in src
    assert "CAST(:redaction AS redaction_state)" in src
    assert '{"deidentified": deidentified} if deidentified else {}' in src
    read = '"redaction": r.get("redaction") or "not_required"'
    assert read in inspect.getsource(media._asset_dict)
    assert "a.redaction" in media._ASSET_COLUMNS


def test_the_api_takes_the_phones_account_of_what_it_removed():
    base = {
        "filename": "a.jpg", "content_type": "image/jpeg", "size_bytes": 10,
        "client_capture_id": "6f1c1f0a-6c39-4d3f-9f55-2a1a3b9f0d11",
        "captured_at": "2026-10-22T10:00:00Z",
    }
    assert media_api.PresignIn(**base).deidentified is None
    body = media_api.PresignIn(
        **base, deidentified={"version": 1, "faces": 2, "plates": 1, "metadata_stripped": True}
    )
    assert body.deidentified is not None
    assert body.deidentified.model_dump() == {
        "version": 1, "faces": 2, "plates": 1, "frames": None, "metadata_stripped": True,
    }
    with pytest.raises(ValidationError):
        media_api.PresignIn(**base, deidentified={"version": 0, "faces": 0, "plates": 0,
                                                   "metadata_stripped": True})
    with pytest.raises(ValidationError):
        media_api.PresignIn(**base, deidentified={"version": 1, "faces": -1, "plates": 0,
                                                   "metadata_stripped": True})
    src = inspect.getsource(media_api.presign)
    assert "deidentified=body.deidentified.model_dump() if body.deidentified else None" in src
