"""confirm_asset holding the stored file to the task (media.judge_capture).

The phone is gate 0 and judges the picture. What confirm adds is the handful
of facts a client is specified against and billed on, read from the file
rather than the manifest: is it the kind it says, is its frame big enough,
and how long does it really run. This file guards:

  * hours billed on a claimed length — the file's own length must replace it;
  * a clip outside the task's bounds, or one after a share already met,
    reaching the aggregator as ready;
  * a renamed file (an .mp4 called .jpg) passing as the kind its name says;
  * an unreadable length blocking a photo or count task, where nothing is
    billed on it — it is refused only on hours.

conftest.py's database fixtures raise NotImplementedError, so the session is
a script answering each statement confirm runs, and storage is faked.

    pytest tests/test_confirm_verification_unit.py
"""

from __future__ import annotations

import json
import uuid
from decimal import Decimal
from types import SimpleNamespace

import pytest

from sourcehub.modules.media import service as media
from sourcehub.modules.media.probe import Probe
from sourcehub.modules.storage import service as storage_svc
from sourcehub.platform import storage
from sourcehub.platform.storage.types import ObjectStat
from test_media_probe_unit import ftyp, jpeg, video_moov

SPEC = {"media": ["video"], "min_duration_s": 10, "max_duration_s": 60}


def video(seconds: float | None, w: int | None = 1920, h: int | None = 1080) -> Probe:
    return Probe("video", "mp4", w, h, seconds)


# ---------------------------------------------------------------------------
# The rule, pure
# ---------------------------------------------------------------------------
def test_the_files_length_replaces_the_claim():
    why, dur, checks = media.judge_capture("video", video(42.0), SPEC, "videos", 30.0)
    assert why is None and dur == Decimal("42.0")
    assert checks == [{
        "code": "duration_measured", "severity": "info", "message": "The file runs 42 s.",
        "detail": {"claimed": 30.0, "measured": 42.0},
    }]


def test_a_clip_outside_the_tasks_bounds_is_quarantined_on_its_real_length():
    # the phone said 30 s; the file runs 95
    why, dur, _ = media.judge_capture("video", video(95.0), SPEC, "videos", 30.0)
    assert why == "This task takes clips of at most 60 seconds." and dur is None
    why, _, _ = media.judge_capture("video", video(3.0), SPEC, "videos", 30.0)
    assert why == "This task takes clips of at least 10 seconds."
    why, _, _ = media.judge_capture("video", video(700.0), {"media": ["video"]}, "hours", 30.0)
    assert why == "A clip runs between 0 and 600 seconds."


def test_an_unreadable_length_blocks_only_where_it_is_billed_on():
    webm = Probe("video", "matroska")
    why, dur, checks = media.judge_capture("video", webm, {"media": ["video"]}, "hours", 30.0)
    assert why is not None and "hours of footage" in why and dur is None
    why, dur, checks = media.judge_capture("video", webm, {"media": ["video"]}, "videos", 30.0)
    assert why is None and dur is None, "the claimed length is kept"
    assert [c["code"] for c in checks] == ["duration_unverified"]


def test_a_file_is_the_kind_its_bytes_say():
    why, _, _ = media.judge_capture("image", video(5.0), {}, "photos", None)
    assert why == "The file is a video, not the photo its name says."
    junk = Probe(None, None, note="unreadable: x")
    why, _, _ = media.judge_capture("image", junk, {}, None, None)
    assert why == "The file is not a photo or video this platform can read."
    # a kind the task stopped taking since the presign
    why, _, _ = media.judge_capture("video", video(20.0), {"media": ["photo"]}, None, 20.0)
    assert why == "This task takes image captures; that file is a video."


def test_frame_size_against_the_spec_with_the_phones_slack():
    spec = {"media": ["photo"], "min_megapixels": 12}
    photo = Probe("image", "jpeg", 4000, 2999)  # 11.996 MP: a 12 MP sensor
    assert media.judge_capture("image", photo, spec, "photos", None)[0] is None
    small = Probe("image", "jpeg", 1920, 1080)
    why, _, _ = media.judge_capture("image", small, spec, "photos", None)
    assert why == "This task asks for 12 megapixels; that capture is 2.1."
    heic = Probe("image", "heic")
    why, _, checks = media.judge_capture("image", heic, spec, "photos", None)
    assert why is None and [c["code"] for c in checks] == ["resolution_unverified"]

    lines = {**SPEC, "min_video_lines": 1080}
    why, _, _ = media.judge_capture("video", video(20.0, 1280, 720), lines, "videos", 20.0)
    assert why == "This task asks for 1080p video; that clip is 720p."
    # portrait is fine: the short side is what counts
    assert media.judge_capture("video", video(20.0, 1080, 1920), lines, "videos", 20.0)[0] is None
    # no floor asked for, nothing said about the frame
    checks = media.judge_capture("video", video(20.0, None, None), SPEC, "videos", 20.0)[2]
    assert [c["code"] for c in checks] == ["duration_measured"]


# ---------------------------------------------------------------------------
# The flow: confirm reads the file, writes what it found
# ---------------------------------------------------------------------------
class Script:
    """Answers each statement confirm runs; records what ran."""

    def __init__(self, asset: dict, assignment: dict, held_units: str = "0") -> None:
        self.asset, self.assignment, self.held_units, self.ran = asset, assignment, held_units, []

    async def execute(self, stmt, params=None):
        sql = str(stmt)
        self.ran.append((sql, params))
        if sql.startswith("SELECT id, assignment_id"):
            row = self.asset
        elif "FROM task_assignment ta JOIN task" in sql:
            row = self.assignment
        elif "capture_units" in sql:
            row = {"n": 1, "units": Decimal(self.held_units)}
        else:
            row = None
        return SimpleNamespace(
            mappings=lambda: SimpleNamespace(one_or_none=lambda: row, one=lambda: row)
        )

    def update(self) -> tuple[str, dict]:
        return next((s, p) for s, p in self.ran if s.startswith("UPDATE asset SET status"))


def _asset(name: str, kind: str, size: int, duration: float | None = None) -> dict:
    return {
        "id": uuid.uuid4(), "assignment_id": uuid.uuid4(), "storage_key": f"acme/{name}",
        "filename": name, "size_bytes": size, "status": "pending", "storage_target_id": None,
        "mime_type": "video/mp4", "upload_session": None,
        "duration_s": None if duration is None else Decimal(str(duration)),
        "metadata": {"claimed_size": size, "kind": kind, "upload": "single"},
    }


def _stored(monkeypatch, data: bytes) -> None:
    async def head(t, key):
        return ObjectStat(size=len(data), content_type="video/mp4", etag="e", checksum=None)

    async def read_range(t, key, start, length):
        return data[start : start + length]

    async def resolve(session, target_id):
        return SimpleNamespace(provider="s3")

    async def found(session, asset_id):
        return {}

    monkeypatch.setattr(storage, "head", head)
    monkeypatch.setattr(storage, "read_range", read_range)
    monkeypatch.setattr(storage_svc, "resolve_by_id", resolve)
    monkeypatch.setattr(media, "_get_asset", found)


def _assignment(unit: str, quantity: int | None = None, spec: dict | None = None) -> dict:
    return {"status": "in_progress", "quantity": quantity, "target_unit": unit,
            "capture_spec": spec or {"media": ["video"]}}


ME = SimpleNamespace(user_id=uuid.uuid4())


async def test_an_hours_clip_is_stored_at_the_length_the_file_runs(monkeypatch):
    clip = ftyp(b"isom") + video_moov(42.0) + b"\0\0\0\x08mdat"
    _stored(monkeypatch, clip)
    s = Script(_asset("c.mp4", "video", len(clip), duration=30.0), _assignment("hours", 2))
    await media.confirm_asset(s, ME, uuid.uuid4())
    sql, p = s.update()
    assert "status = 'ready'" in sql and float(p["dur"]) == 42.0
    assert json.loads(p["extra"])["probe"]["duration_s"] == 42.0
    assert json.loads(p["found"])["server"][0]["detail"] == {"claimed": 30.0, "measured": 42.0}


async def test_a_clip_after_a_met_share_is_quarantined_on_real_lengths(monkeypatch):
    # the other clips claimed a second each at presign; read back, they hold
    # the whole two hours already
    clip = ftyp(b"isom") + video_moov(300.0) + b"\0\0\0\x08mdat"
    _stored(monkeypatch, clip)
    s = Script(
        _asset("c.mp4", "video", len(clip), duration=1.0), _assignment("hours", 2), "2.0000"
    )
    await media.confirm_asset(s, ME, uuid.uuid4())
    sql, p = s.update()
    assert "status = 'quarantined'" in sql
    assert p["why"] == (
        "This assignment is for 2 hours of footage and already has 2 h of footage. "
        "Remove a clip before adding another."
    )
    held_sql, held_params = next((q, v) for q, v in s.ran if "capture_units" in q)
    assert "id IS DISTINCT FROM" in held_sql and held_params["x"] is not None

    # one short of the share: the clip that crosses the line is taken
    s = Script(
        _asset("c.mp4", "video", len(clip), duration=1.0), _assignment("hours", 2), "1.9000"
    )
    await media.confirm_asset(s, ME, uuid.uuid4())
    assert "status = 'ready'" in s.update()[0]


async def test_a_renamed_file_is_quarantined_with_a_reason_the_worker_can_read(monkeypatch):
    clip = ftyp(b"isom") + video_moov(20.0) + b"\0\0\0\x08mdat"
    _stored(monkeypatch, clip)
    photos = _assignment("photos", spec={"media": ["photo"]})
    s = Script(_asset("p.jpg", "image", len(clip)), photos)
    await media.confirm_asset(s, ME, uuid.uuid4())
    sql, p = s.update()
    assert "status = 'quarantined'" in sql
    assert p["why"] == "The file is a video, not the photo its name says."


async def test_a_photo_task_takes_a_real_photo(monkeypatch):
    photo = jpeg(4032, 3024)
    _stored(monkeypatch, photo)
    spec = {"media": ["photo"], "min_megapixels": 12}
    s = Script(_asset("p.jpg", "image", len(photo)), _assignment("photos", 10, spec))
    await media.confirm_asset(s, ME, uuid.uuid4())
    sql, p = s.update()
    assert "status = 'ready'" in sql and p["dur"] is None
    assert json.loads(p["extra"])["probe"]["width"] == 4032
    assert not any("capture_units" in q for q, _ in s.ran), "a photo task is not re-counted"


async def test_a_size_mismatch_is_quarantined_before_any_bytes_are_read(monkeypatch):
    _stored(monkeypatch, b"x" * 100)

    async def never(*a, **k):
        raise AssertionError("read_range after a size mismatch")

    monkeypatch.setattr(storage, "read_range", never)
    s = Script(_asset("c.mp4", "video", 999), _assignment("videos"))
    await media.confirm_asset(s, ME, uuid.uuid4())
    assert s.update()[1]["why"].startswith("size mismatch")


async def test_a_file_gone_between_head_and_read_is_not_uploaded_yet(monkeypatch):
    clip = ftyp(b"isom") + video_moov(20.0)
    _stored(monkeypatch, clip)

    async def gone(*a, **k):
        raise LookupError("k")

    monkeypatch.setattr(storage, "read_range", gone)
    s = Script(_asset("c.mp4", "video", len(clip)), _assignment("videos"))
    with pytest.raises(media.MediaError, match="not uploaded yet"):
        await media.confirm_asset(s, ME, uuid.uuid4())


def test_the_asset_listing_shows_what_the_server_found():
    row = dict.fromkeys((
        "id", "task_id", "assignment_id", "submission_id", "captured_by_user_id",
        "captured_by_name", "filename", "mime_type", "size_bytes", "duration_s", "sha256",
        "etag", "status", "quarantine_reason", "captured_at", "captured_lat", "captured_lon",
        "uploaded_at", "created_at", "review_reason", "review_label", "review_note",
        "reviewed_at", "batch_id", "batch_no", "batch_status", "replaces_asset_id", "replaced",
    ))
    row.update(
        status="ready", replaced=False,
        check_results={"device": [], "server": [{"code": "duration_measured"}]},
        metadata={"probe": {"width": 1920, "height": 1080}},
    )
    d = media._asset_dict(row)
    assert (d["width"], d["height"]) == (1920, 1080)
    assert d["server_checks"] == [{"code": "duration_measured"}]
    assert "metadata" not in d
