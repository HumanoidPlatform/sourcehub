"""The flat capture name: one file per capture, straight under the client's
prefix, with the segregation the folders used to carry moved into the name.

Pure — no database, no storage — so it runs anywhere pytest does.
"""

from __future__ import annotations

import uuid

import pytest

from sourcehub.modules.media.service import MediaError, _capture_name

WORKER_USER = uuid.UUID("11111111-2222-3333-4444-555555555555")
ASSET = uuid.UUID("ef051366-5e28-496c-8de5-c9d6957669b9")


def _name(**over: object) -> str:
    args: dict[str, object] = {
        "contract_ref": "CTR-05", "task_ref": "TSK-06", "aggregator_ref": "AG-04",
        "worker_ref": "WKR-13", "worker_user_id": WORKER_USER, "asset_id": ASSET, "ext": "jpg",
    }
    args.update(over)
    return _capture_name(**args)  # type: ignore[arg-type]


def test_the_documented_example():
    assert _name() == "CTR-05_TSK-06_AG-04_WKR-13_ef051366.jpg"


def test_every_field_comes_back_out_of_a_split():
    stem, ext = _name(ext="mp4").rsplit(".", 1)
    assert ext == "mp4"
    assert stem.split("_") == ["CTR-05", "TSK-06", "AG-04", "WKR-13", "ef051366"]


def test_a_worker_with_no_roster_row_gets_a_user_id_fragment():
    assert _name(worker_ref=None) == "CTR-05_TSK-06_AG-04_U-11111111_ef051366.jpg"


def test_the_extension_is_normalised_but_kept():
    assert _name(ext=".JPG").endswith("_ef051366.jpg")
    assert _name(ext="mov").endswith("_ef051366.mov")


def test_a_separator_inside_a_field_cannot_break_the_split():
    # Reference codes never carry '_', but the name must stay parseable even
    # if one ever did.
    name = _name(task_ref="TSK_06")
    assert name.rsplit(".", 1)[0].split("_") == ["CTR-05", "TSK-06", "AG-04", "WKR-13", "ef051366"]


@pytest.mark.parametrize("field", ["contract_ref", "task_ref", "aggregator_ref"])
def test_a_missing_reference_code_refuses_rather_than_minting_a_half_name(field: str):
    with pytest.raises(MediaError) as e:
        _name(**{field: None})
    assert field.split("_")[0] in str(e.value)


def test_two_captures_differ_only_by_the_asset_fragment():
    other = uuid.UUID("0446999a-fea7-4fb1-aa37-15f39529e759")
    a, b = _name(), _name(asset_id=other)
    assert a.rsplit("_", 1)[0] == b.rsplit("_", 1)[0]
    assert a != b
