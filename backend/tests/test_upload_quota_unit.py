"""What holds a place in a crowd resource's share, and that a share has no
ceiling but the task's (modules/media/service.py, api/v1/delivery.py,
api/v1/media.py).

The phone counts ready captures plus its own queue (mobile batches.ts
remaining()). The server must not count more than that for long, or the two
disagree and the worker is refused with "two left" on screen and nothing to
remove. No database here: the SQL fragments and the request models are
asserted on; the flow itself is run against the local stack.

    pytest tests/test_upload_quota_unit.py
"""

from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal

import pytest
from pydantic import ValidationError

from sourcehub.api.v1.delivery import AssignmentIn, OfferIn
from sourcehub.api.v1.media import PresignIn
from sourcehub.modules.media import service as media


def test_a_place_is_held_by_delivered_or_in_flight_captures_only():
    assert "status IN ('pending','uploaded','ready')" in media.HELD_SQL
    # sent back for rework freed its place; a size mismatch never had one
    assert "'rejected'" not in media.HELD_SQL
    assert "'quarantined'" not in media.HELD_SQL
    # a presign the phone never followed up on stops counting after a day
    assert "status = 'pending' AND created_at < now() - interval '24 hours'" in media.HELD_SQL


def test_a_retry_after_quarantine_reuses_the_row():
    # otherwise the retry mints a second row and the first holds a place for ever
    assert "'quarantined'" in media.REUSABLE_SQL
    assert "'rejected'" not in media.REUSABLE_SQL


def test_a_share_has_no_ceiling_but_the_tasks_own():
    # the user's decision: a worker uploads whatever share they were given.
    # The 500-capture ceiling and everything that mirrored it are gone.
    assert not hasattr(media, "MAX_ASSETS_PER_ASSIGNMENT")
    AssignmentIn(worker_user_id=uuid.uuid4(), quantity=Decimal(1000))
    OfferIn(worker_limit=1, quantity=Decimal(1000))
    with pytest.raises(ValidationError):
        AssignmentIn(worker_user_id=uuid.uuid4(), quantity=Decimal(0))


def _presign(**over):
    base = {
        "filename": "a.mp4",
        "content_type": "video/mp4",
        "size_bytes": 1,
        "captured_at": dt.datetime.now(dt.UTC),
    }
    return PresignIn(**{**base, **over})


def test_a_capture_is_named_by_a_hash_or_by_the_phones_own_id():
    # an older build hashes the whole file and sends only that
    assert _presign(sha256="a" * 64).client_capture_id is None
    # a chunked upload sends no hash: the phone's outbox id names the row
    cid = uuid.uuid4()
    p = _presign(client_capture_id=cid, resumable=True)
    assert p.sha256 is None and p.client_capture_id == cid and p.resumable
    assert _presign(sha256="a" * 64).resumable is False
    with pytest.raises(ValidationError):
        _presign()
