"""modules/media/probe.py and storage read_range: what confirm reads from the
stored file instead of believing the manifest.

What this file guards:

  * a clip's running time read wrongly — an hours task is billed on it;
  * the moov index missed when the muxer put it at the end, behind an mdat
    too big for a 32-bit size (every Android phone, any long clip);
  * a photo's frame size missed behind a large EXIF block;
  * one file costing more than a handful of reads, or a hostile file making
    probe raise rather than say it could not read it;
  * an adapter's read_range asking storage for the wrong bytes.

Fixtures are built byte by byte here; no binary files are committed.

    pytest tests/test_media_probe_unit.py
"""

from __future__ import annotations

import struct
from types import SimpleNamespace

import pytest

from sourcehub.modules.media.probe import probe
from sourcehub.platform import storage
from sourcehub.platform.storage import azure_store, gcs_store, s3_store
from sourcehub.platform.storage.types import StorageTarget


# ---------------------------------------------------------------------------
# Byte builders
# ---------------------------------------------------------------------------
def box(typ: bytes, body: bytes = b"") -> bytes:
    return struct.pack(">I", 8 + len(body)) + typ + body


def ftyp(brand: bytes) -> bytes:
    return box(b"ftyp", brand + b"\0\0\0\0" + brand + b"isom")


def mvhd(timescale: int, duration: int, version: int = 0) -> bytes:
    if version == 1:
        body = b"\x01\0\0\0" + b"\0" * 16 + struct.pack(">IQ", timescale, duration)
    else:
        body = b"\0\0\0\0" + b"\0" * 8 + struct.pack(">II", timescale, duration)
    return box(b"mvhd", body + b"\0" * 80)


def trak(handler: bytes, width: int = 0, height: int = 0, version: int = 0) -> bytes:
    head = b"\x01\0\0\x07" + b"\0" * 32 if version == 1 else b"\0\0\0\x07" + b"\0" * 20
    tkhd = box(b"tkhd", head + b"\0" * 52 + struct.pack(">II", width << 16, height << 16))
    hdlr = box(b"hdlr", b"\0" * 8 + handler + b"\0" * 12 + b"\0")
    return box(b"trak", tkhd + box(b"mdia", box(b"mdhd", b"\0" * 24) + hdlr))


def moov(*children: bytes) -> bytes:
    return box(b"moov", b"".join(children))


def video_moov(seconds: float, w: int = 1920, h: int = 1080, version: int = 0) -> bytes:
    return moov(
        mvhd(1000, int(seconds * 1000), version),
        trak(b"soun"),
        trak(b"vide", w, h, version),
    )


class Sparse:
    """A file of `size` bytes, zeros except where parts say; counts reads."""

    def __init__(self, size: int, parts: dict[int, bytes]) -> None:
        self.size, self.parts, self.reads = size, parts, []

    async def read(self, start: int, length: int) -> bytes:
        self.reads.append((start, length))
        end = min(start + length, self.size)
        out = bytearray(end - start)
        for off, data in self.parts.items():
            lo, hi = max(off, start), min(off + len(data), end)
            if lo < hi:
                out[lo - start : hi - start] = data[lo - off : hi - off]
        return bytes(out)


def whole(data: bytes) -> Sparse:
    return Sparse(len(data), {0: data})


async def run(f: Sparse):
    return await probe(f.read, f.size)


# ---------------------------------------------------------------------------
# Video
# ---------------------------------------------------------------------------
async def test_mp4_with_the_index_up_front():
    data = ftyp(b"isom") + video_moov(42.5) + box(b"mdat", b"\0" * 1000)
    p = await run(whole(data))
    assert (p.kind, p.container, p.duration_s, p.width, p.height, p.note) == (
        "video", "mp4", 42.5, 1920, 1080, None,
    )


async def test_android_mp4_with_the_index_behind_a_64_bit_mdat():
    # 5 GiB of footage: the mdat's size does not fit 32 bits, and moov is last
    mdat_len = 5 * 1024**3
    head = ftyp(b"mp42") + struct.pack(">I", 1) + b"mdat" + struct.pack(">Q", mdat_len)
    tail = video_moov(312.25, 1080, 1920)
    at = len(head) - 16 + mdat_len
    f = Sparse(at + len(tail), {0: head, at: tail})
    p = await run(f)
    assert (p.duration_s, p.width, p.height) == (312.25, 1080, 1920)
    assert len(f.reads) <= 4, "a few small reads, whatever the size of the file"
    assert sum(n for _, n in f.reads) < 128 * 1024


async def test_iphone_quicktime_mov_and_version_1_headers():
    data = ftyp(b"qt  ") + box(b"wide") + box(b"mdat", b"\0" * 64) + video_moov(7.0, version=1)
    p = await run(whole(data))
    assert (p.kind, p.container, p.duration_s, p.width) == ("video", "mov", 7.0, 1920)


async def test_a_fragmented_file_says_its_length_in_mehd():
    mehd = box(b"mehd", b"\0\0\0\0" + struct.pack(">I", 90_000))
    data = ftyp(b"iso5") + moov(mvhd(1000, 0), trak(b"vide", 1280, 720), box(b"mvex", mehd))
    data += box(b"moof") + box(b"mdat")
    p = await run(whole(data))
    assert (p.duration_s, p.height) == (90.0, 720)

    # without mehd the length is unknown, and says so
    data = ftyp(b"iso5") + moov(mvhd(1000, 0), trak(b"vide", 1280, 720))
    p = await run(whole(data))
    assert p.kind == "video" and p.duration_s is None and p.note.startswith("unreadable")


async def test_webm_is_a_video_of_unknown_length():
    p = await run(whole(b"\x1a\x45\xdf\xa3" + b"\0" * 100))
    assert (p.kind, p.container, p.duration_s) == ("video", "matroska", None)


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------
def jpeg(w: int, h: int, exif_segments: int = 0) -> bytes:
    app1 = b"\xff\xe1" + struct.pack(">H", 65535) + b"\0" * 65533
    sof = b"\xff\xc0" + struct.pack(">HBHHB", 17, 8, h, w, 3) + b"\0" * 9
    return b"\xff\xd8" + app1 * exif_segments + sof + b"\xff\xda\0\x02" + b"\0" * 50 + b"\xff\xd9"


async def test_jpeg_frame_size_even_behind_a_large_exif_block():
    p = await run(whole(jpeg(4032, 3024)))
    assert (p.kind, p.container, p.width, p.height) == ("image", "jpeg", 4032, 3024)
    f = whole(jpeg(4000, 3000, exif_segments=3))  # SOF ~192 KiB in
    p = await run(f)
    assert (p.width, p.height) == (4000, 3000)
    assert len(f.reads) <= 8


async def test_png_heic_and_webp():
    png = b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + struct.pack(">II", 640, 480)
    p = await run(whole(png + b"\0" * 20))
    assert (p.kind, p.container, p.width, p.height) == ("image", "png", 640, 480)
    p = await run(whole(ftyp(b"heic") + b"\0" * 64))
    assert (p.kind, p.container, p.width) == ("image", "heic", None)
    p = await run(whole(b"RIFF\0\0\0\0WEBPVP8 " + b"\0" * 64))
    assert (p.kind, p.container) == ("image", "webp")


# ---------------------------------------------------------------------------
# Hostile and broken files: a note, never an exception
# ---------------------------------------------------------------------------
async def test_garbage_truncation_and_lies_come_back_as_unreadable():
    p = await run(whole(b"#!/bin/sh\necho hello\n"))
    assert p.kind is None and p.note.startswith("unreadable")

    # a moov that claims more bytes than the file holds
    data = ftyp(b"isom") + struct.pack(">I", 10_000) + b"moov" + b"\0" * 100
    p = await run(whole(data))
    assert (p.kind, p.duration_s) == ("video", None) and "overruns" in p.note

    # a JPEG cut off before its frame header
    p = await run(whole(jpeg(100, 100, exif_segments=2)[:70_000]))
    assert p.kind == "image" and p.width is None and p.note.startswith("unreadable")

    p = await probe(whole(b"").read, 0)
    assert p.kind is None


async def test_a_file_of_endless_boxes_runs_out_of_budget_not_time():
    mb = 1024 * 1024
    parts = {0: ftyp(b"isom")}
    off = len(parts[0])
    for _ in range(200):  # 200 one-megabyte free boxes, no moov
        parts[off] = struct.pack(">I", mb) + b"free"
        off += mb
    f = Sparse(off, parts)
    p = await run(f)
    assert p.note.startswith("unreadable") and len(f.reads) <= 33


# ---------------------------------------------------------------------------
# read_range on each adapter: the right bytes asked for, misses mapped
# ---------------------------------------------------------------------------
async def test_s3_read_range_asks_for_the_window_and_releases_the_connection(monkeypatch):
    from minio.error import S3Error

    seen: dict = {}

    class Resp:
        def read(self):
            return b"abc"

        def close(self):
            seen["closed"] = True

        def release_conn(self):
            seen["released"] = True

    class Fake:
        def get_object(self, bucket, key, offset=0, length=0):
            if key == "missing":
                raise S3Error(
                    response=None, code="NoSuchKey", message="m", resource="r",
                    request_id="q", host_id="h",
                )
            seen.update(bucket=bucket, key=key, offset=offset, length=length)
            return Resp()

    monkeypatch.setattr(s3_store, "_client", lambda t, *, signing: Fake())
    t = StorageTarget(provider="s3", bucket="acme", secret={}, endpoint="http://minio:9000")
    assert await storage.read_range(t, "k.mp4", 100, 3) == b"abc"
    assert seen == {
        "bucket": "acme", "key": "k.mp4", "offset": 100, "length": 3,
        "closed": True, "released": True,
    }
    with pytest.raises(LookupError):
        await storage.read_range(t, "missing", 0, 1)


async def test_azure_read_range_downloads_only_the_window(monkeypatch):
    from azure.core.exceptions import ResourceNotFoundError

    seen: dict = {}

    class Blob:
        def __init__(self, key):
            self.key = key

        def download_blob(self, offset=None, length=None):
            if self.key == "missing":
                raise ResourceNotFoundError("BlobNotFound")
            seen.update(offset=offset, length=length)
            return SimpleNamespace(readall=lambda: b"xyz")

    service = SimpleNamespace(get_blob_client=lambda c, k: Blob(k))
    monkeypatch.setattr(azure_store, "_service", lambda t: service)
    t = StorageTarget(provider="azure_blob", bucket="captures", secret={})
    assert await storage.read_range(t, "k", 64, 3) == b"xyz"
    assert seen == {"offset": 64, "length": 3}
    with pytest.raises(LookupError):
        await storage.read_range(t, "missing", 0, 1)


async def test_gcs_read_range_uses_an_inclusive_end_and_fails_fast(monkeypatch):
    from google.api_core.exceptions import NotFound

    seen: dict = {}

    class Blob:
        def __init__(self, key):
            self.key = key

        def download_as_bytes(self, **kw):
            if self.key == "missing":
                raise NotFound("No such object: b/missing")
            seen.update(kw)
            return b"12345"

    class Client:
        def bucket(self, name):
            return SimpleNamespace(blob=lambda key: Blob(key))

    monkeypatch.setattr(gcs_store, "_client", lambda t: (Client(), None))
    t = StorageTarget(provider="gcs", bucket="dm360-dev-client-acme", secret={})
    assert await storage.read_range(t, "k", 10, 5) == b"12345"
    assert (seen["start"], seen["end"], seen["retry"]) == (10, 14, None)
    with pytest.raises(LookupError):
        await storage.read_range(t, "missing", 0, 1)
