"""What a stored capture actually is, read from its own headers. Pure.

The phone is gate 0: it judges every capture before a byte leaves it. What it
reports is recorded, not trusted, and a modified app or the web console can
report anything. The facts a client is billed on or specified against — is
this a photo or a video, how big is the frame, how long does the clip run —
are in the file's first few kilobytes and its index, so confirm reads those
rather than believing the manifest.

No media library and no decoding: a handful of range reads per file whatever
its size. JPEG and PNG frame headers; ISO-BMFF (MP4, QuickTime .mov, 3GP,
HEIC) box headers, walked to the moov index wherever the muxer put it;
Matroska/WebM by its magic only. Everything else is "not recognised".

probe() never raises over the file's contents: anything it cannot follow
comes back as a note beginning "unreadable:", and the caller decides what an
unreadable fact costs. A failure of the read itself (storage) is not caught.
"""

from __future__ import annotations

import struct
from collections.abc import Awaitable, Callable, Iterator
from dataclasses import dataclass

Read = Callable[[int, int], Awaitable[bytes]]

_SNIFF_BYTES = 64 * 1024
# Bounds on what one probe may cost, whatever the file claims about itself.
_MAX_READS = 32
_MAX_READ_BYTES = 10 * 1024 * 1024
_MAX_MOOV_BYTES = 8 * 1024 * 1024
_MAX_BOXES = 512
# JPEG markers walked before the frame header; EXIF, ICC and maker notes sit
# in front of it and a phone can put a large thumbnail there.
_MAX_JPEG_SEGMENTS = 64
_MAX_JPEG_OFFSET = 2 * 1024 * 1024

# ftyp brands that are still images (HEIF/AVIF), not video
_IMAGE_BRANDS = {b"heic", b"heix", b"heim", b"heis", b"mif1", b"avif"}
# a QuickTime file older than ftyp starts straight into one of these
_QT_LEADING = {b"moov", b"mdat", b"wide", b"free", b"skip"}


@dataclass(frozen=True)
class Probe:
    kind: str | None  # "image" | "video" | None (not recognised)
    container: str | None  # jpeg png webp heic avif mp4 mov 3gp matroska
    width: int | None = None
    height: int | None = None
    duration_s: float | None = None
    note: str | None = None

    def facts(self) -> dict[str, object]:
        """What is kept on the asset row (metadata.probe)."""
        return {
            "container": self.container,
            "width": self.width,
            "height": self.height,
            "duration_s": self.duration_s,
            "note": self.note,
        }


class _Unreadable(Exception):  # noqa: N818 - a note, not an error the caller sees
    pass


class _Reader:
    """The caller's read, held to the budget, with the sniffed head cached."""

    def __init__(self, read: Read, size: int) -> None:
        self._read = read
        self.size = size
        self.head = b""
        self._reads = 0
        self._bytes = 0

    async def get(self, start: int, length: int) -> bytes:
        if start < 0 or length <= 0 or start >= self.size:
            raise _Unreadable("read past the end of the file")
        length = min(length, self.size - start)
        if start + length <= len(self.head):
            return self.head[start : start + length]
        self._reads += 1
        self._bytes += length
        if self._reads > _MAX_READS or self._bytes > _MAX_READ_BYTES:
            raise _Unreadable("read budget exceeded")
        data = await self._read(start, length)
        if len(data) < length:
            raise _Unreadable("file is shorter than its headers say")
        return data[:length]


def _u16(b: bytes, o: int) -> int:
    return int(struct.unpack_from(">H", b, o)[0])


def _u32(b: bytes, o: int) -> int:
    return int(struct.unpack_from(">I", b, o)[0])


def _u64(b: bytes, o: int) -> int:
    return int(struct.unpack_from(">Q", b, o)[0])


async def probe(read: Read, size: int) -> Probe:
    """Kind, container, frame size and running time of a stored file.

    read(start, length) returns those bytes of the object; size is what
    storage says it holds.
    """
    if size <= 0:
        return Probe(None, None, note="unreadable: empty file")
    r = _Reader(read, size)
    try:
        r.head = await r.get(0, _SNIFF_BYTES)
    except _Unreadable as e:
        return Probe(None, None, note=f"unreadable: {e}")
    h = r.head
    try:
        if h[:3] == b"\xff\xd8\xff":
            w, ht = await _jpeg_size(r)
            return Probe("image", "jpeg", w, ht)
        if h[:8] == b"\x89PNG\r\n\x1a\n":
            if h[12:16] != b"IHDR":
                raise _Unreadable("PNG without IHDR")
            return Probe("image", "png", _u32(h, 16), _u32(h, 20))
        if h[:4] == b"RIFF" and h[8:12] == b"WEBP":
            return Probe("image", "webp")
        if h[:4] == b"\x1a\x45\xdf\xa3":
            return Probe("video", "matroska")
        if h[4:8] == b"ftyp":
            brand = h[8:12]
            if brand in _IMAGE_BRANDS:
                return Probe("image", "avif" if brand == b"avif" else "heic")
            container = "mov" if brand == b"qt  " else "3gp" if brand[:2] == b"3g" else "mp4"
            return await _isobmff(r, container)
        if h[4:8] in _QT_LEADING:
            return await _isobmff(r, "mov")
    except _Unreadable as e:
        return Probe(*_kind_only(h), note=f"unreadable: {e}")
    except (struct.error, IndexError):
        return Probe(*_kind_only(h), note="unreadable: malformed headers")
    return Probe(None, None, note="unreadable: not a recognised photo or video format")


def _kind_only(h: bytes) -> tuple[str | None, str | None]:
    """The kind the magic number alone gives, for a file whose deeper headers
    could not be followed."""
    if h[:3] == b"\xff\xd8\xff":
        return "image", "jpeg"
    if h[:8] == b"\x89PNG\r\n\x1a\n":
        return "image", "png"
    if h[4:8] == b"ftyp":
        if h[8:12] in _IMAGE_BRANDS:
            return "image", "heic"
        return "video", "mov" if h[8:12] == b"qt  " else "mp4"
    if h[4:8] in _QT_LEADING:
        return "video", "mov"
    return None, None


async def _jpeg_size(r: _Reader) -> tuple[int | None, int | None]:
    """Width and height from the first SOF marker."""
    pos = 2
    for _ in range(_MAX_JPEG_SEGMENTS):
        if pos > _MAX_JPEG_OFFSET:
            break
        hdr = await r.get(pos, 4)
        if hdr[0] != 0xFF:
            raise _Unreadable("JPEG marker expected")
        m = hdr[1]
        if m == 0xFF:  # fill byte
            pos += 1
            continue
        if m == 0x01 or 0xD0 <= m <= 0xD8:  # markers with no length
            pos += 2
            continue
        if m in (0xD9, 0xDA):  # end of image, start of scan: no frame header
            break
        seg = _u16(hdr, 2)
        if seg < 2:
            raise _Unreadable("JPEG segment length")
        if 0xC0 <= m <= 0xCF and m not in (0xC4, 0xC8, 0xCC):
            sof = await r.get(pos + 4, 5)
            return _u16(sof, 3), _u16(sof, 1)
        pos += 2 + seg
    return None, None


def _children(b: bytes, start: int, end: int) -> Iterator[tuple[bytes, int, int]]:
    """(type, body start, body end) of each box in b[start:end]."""
    pos = start
    n = 0
    while pos + 8 <= end:
        n += 1
        if n > _MAX_BOXES:
            raise _Unreadable("too many boxes")
        size = _u32(b, pos)
        typ = b[pos + 4 : pos + 8]
        head = 8
        if size == 1:
            size = _u64(b, pos + 8)
            head = 16
        elif size == 0:
            size = end - pos
        if size < head or pos + size > end:
            raise _Unreadable("box overruns its parent")
        yield typ, pos + head, pos + size
        pos += size


def _child(b: bytes, start: int, end: int, typ: bytes) -> tuple[int, int] | None:
    for t, s, e in _children(b, start, end):
        if t == typ:
            return s, e
    return None


async def _isobmff(r: _Reader, container: str) -> Probe:
    """Walk the top-level boxes to moov, then read running time and the
    video track's frame size from it."""
    pos = 0
    moov: tuple[int, int] | None = None
    for _ in range(_MAX_BOXES):
        if pos + 8 > r.size:
            break
        hdr = await r.get(pos, 16)
        size = _u32(hdr, 0)
        typ = hdr[4:8]
        head = 8
        if size == 1:
            if len(hdr) < 16:
                raise _Unreadable("truncated box header")
            size = _u64(hdr, 8)
            head = 16
        elif size == 0:
            size = r.size - pos
        if size < head or pos + size > r.size:
            raise _Unreadable("box overruns the file")
        if typ == b"moov":
            moov = (pos + head, pos + size)
            break
        pos += size
    if moov is None:
        raise _Unreadable("no moov index")
    start, end = moov
    if end - start > _MAX_MOOV_BYTES:
        raise _Unreadable("moov index too large")
    b = await r.get(start, end - start)
    n = len(b)

    mvhd = _child(b, 0, n, b"mvhd")
    if mvhd is None:
        raise _Unreadable("no mvhd")
    s, _ = mvhd
    if b[s] == 1:
        timescale, duration = _u32(b, s + 20), _u64(b, s + 24)
        unknown = 0xFFFFFFFFFFFFFFFF
    else:
        timescale, duration = _u32(b, s + 12), _u32(b, s + 16)
        unknown = 0xFFFFFFFF
    if duration in (0, unknown):
        # a fragmented file says its length in mvex/mehd, if anywhere
        duration = 0
        mvex = _child(b, 0, n, b"mvex")
        mehd = _child(b, mvex[0], mvex[1], b"mehd") if mvex else None
        if mehd is not None:
            ms = mehd[0]
            duration = _u64(b, ms + 4) if b[ms] == 1 else _u32(b, ms + 4)
    seconds = round(duration / timescale, 3) if timescale and duration else None

    width = height = None
    for typ, ts, te in _children(b, 0, n):
        if typ != b"trak":
            continue
        mdia = _child(b, ts, te, b"mdia")
        hdlr = _child(b, mdia[0], mdia[1], b"hdlr") if mdia else None
        if hdlr is None or b[hdlr[0] + 8 : hdlr[0] + 12] != b"vide":
            continue
        tkhd = _child(b, ts, te, b"tkhd")
        if tkhd is None:
            continue
        o = tkhd[0] + (88 if b[tkhd[0]] == 1 else 76)
        width, height = _u32(b, o) >> 16, _u32(b, o + 4) >> 16
        break
    note = None if seconds is not None else "unreadable: no running time in the index"
    return Probe("video", container, width or None, height or None, seconds, note)
