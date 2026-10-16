"""db/510 counts crowd work in the task's own unit; 0055 carries it.

One capture used to be one unit whatever the task said, so a share of hours
was done after as many clips of any length. A clip's running time is now kept
and checked, a share of hours may be a fraction, and units the capture app
cannot deliver are not given to the crowd.

Scripts and pure rules only; no database is opened.
"""

from __future__ import annotations

import re
import uuid
from decimal import Decimal
from pathlib import Path

import pytest

from sourcehub.modules.delivery import service as delivery
from sourcehub.modules.delivery.models import Task
from sourcehub.modules.invoices import service as invoices
from sourcehub.modules.marketplace import pricing
from sourcehub.modules.media import service as media

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "510_measured_units.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (ROOT / "backend" / "migrations" / "versions" / "0055_measured_units.py").read_text(
    encoding="utf-8"
)
BUNDLE = ROOT / "infra" / "bundle_schema.sh"


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _task(unit: str | None) -> Task:
    return Task(id=uuid.uuid4(), reference_code="TSK-9", target_unit=unit)


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0054():
    assert re.search(r'^revision = "0055"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0054"$', MIGRATION_TEXT, re.M)


def test_the_new_file_is_last_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m and m.group(1).split()[-1] == "510_measured_units"


def test_the_downgrade_refuses_fractions_and_puts_the_offer_lookup_back():
    down = _literal("_DOWN")
    assert down.index("trunc(quantity)") < down.index("TYPE integer")
    assert "quantity integer, instructions text" in down  # db/130's lookup, as it was
    for gone in ("DROP COLUMN duration_s", "DROP COLUMN unit_quantity", "DROP FUNCTION capture_units"):
        assert gone in down, gone


def test_legacy_hours_work_becomes_videos_before_the_guard_exists():
    # the guard refuses a unit change once work is handed out; the conversion
    # of work already handed out must run before it is created
    assert SQL_TEXT.index("SET target_unit = 'videos'") < SQL_TEXT.index("CREATE TRIGGER task_quantity_guard")
    # and the submissions are backfilled before the task's unit changes, so
    # clips delivered against hours stay unmeasured rather than counted
    assert SQL_TEXT.index("UPDATE submission s") < SQL_TEXT.index("UPDATE task t")


def test_capture_units_is_hours_for_hours_and_one_otherwise():
    fn = SQL_TEXT[SQL_TEXT.index("CREATE OR REPLACE FUNCTION capture_units("):]
    assert "WHEN p_unit IN ('hours', 'audio_hours') THEN coalesce(p_duration_s, 0) / 3600.0" in fn
    assert "ELSE 1 END" in fn


# ---------------------------------------------------------------------------
# The unit vocabulary
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("unit", ["photos", "videos", "records", "hours", None])
def test_the_crowd_can_deliver(unit):
    assert pricing.crowd_capturable(unit)


@pytest.mark.parametrize("unit", ["audio_clips", "audio_hours", "sites", "responses"])
def test_the_crowd_cannot_deliver(unit):
    assert not pricing.crowd_capturable(unit)


# ---------------------------------------------------------------------------
# The invoice cap
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("unit", ["photos", "videos", "records", "responses", "audio_clips"])
def test_a_counted_contract_is_capped_by_accepted_captures_whatever_else_was_delivered(unit):
    # hours is None: an unmeasured or other-unit submission on the contract
    # must not lift the cap, as it once did
    assert invoices.invoice_cap(unit, 100, None) == Decimal(100)
    assert invoices.invoice_cap(unit, 100, Decimal("2.5")) == Decimal(100)


def test_hours_are_capped_only_when_all_of_them_were_measured():
    assert invoices.invoice_cap("hours", 3, Decimal("1.25")) == Decimal("1.25")
    assert invoices.invoice_cap("hours", 3, None) is None


@pytest.mark.parametrize("unit", ["sites", "audio_hours", None])
def test_what_the_platform_cannot_count_is_never_capped(unit):
    # 3 summary files are not 3 sites
    assert invoices.invoice_cap(unit, 3, Decimal(3)) is None


# ---------------------------------------------------------------------------
# A clip's running time
# ---------------------------------------------------------------------------
def test_an_hours_task_takes_videos_only():
    assert media._allowed_kinds({}, "hours") == {"video"}
    assert media._allowed_kinds({"media": ["photo", "video"]}, "hours") == {"image", "video"}  # explicit wins


def test_a_clip_on_an_hours_task_must_say_how_long_it_runs():
    with pytest.raises(media.MediaInvalid, match="Update the app"):
        media.checked_duration("video", None, {}, "hours")


def test_a_clip_elsewhere_may_come_without_a_length_and_a_photo_has_none():
    assert media.checked_duration("video", None, {}, "videos") is None
    assert media.checked_duration("image", 12.0, {}, "hours") is None


def test_the_spec_bounds_hold_with_a_second_of_slack():
    spec = {"min_duration_s": 10, "max_duration_s": 30}
    assert media.checked_duration("video", 9.5, spec, "hours") == Decimal("9.5")
    assert media.checked_duration("video", 30.8, spec, "hours") == Decimal("30.8")
    with pytest.raises(media.MediaInvalid, match="at least 10"):
        media.checked_duration("video", 8.0, spec, "hours")
    with pytest.raises(media.MediaInvalid, match="at most 30"):
        media.checked_duration("video", 32.0, spec, "hours")


def test_no_clip_runs_past_ten_minutes():
    with pytest.raises(media.MediaInvalid):
        media.checked_duration("video", 700.0, {}, "hours")
    assert media.checked_duration("video", 600.4, {}, "hours") == Decimal("600")


def test_hours_read_as_hours_and_minutes():
    assert media.hours_text(Decimal("0.75")) == "45 min"
    assert media.hours_text(Decimal("1.5")) == "1 h 30 min"
    assert media.hours_text(2) == "2 h"


def test_stage_counts_carry_units_beside_the_counts():
    for k in media.STAGES:
        assert f"AS {k}_units" in media.STAGE_COUNTS
    assert "capture_units(tu.target_unit, s.duration_s)" in media.STAGE_COUNTS
    assert ":a" in media.STAGE_COUNTS


# ---------------------------------------------------------------------------
# A crowd share
# ---------------------------------------------------------------------------
def test_a_share_of_hours_may_be_a_fraction():
    assert delivery._check_crowd_quantity(_task("hours"), Decimal("1.5")) == Decimal("1.5")


def test_a_counted_share_is_whole():
    with pytest.raises(delivery.DeliveryError, match="whole photos"):
        delivery._check_crowd_quantity(_task("photos"), Decimal("2.5"))
    assert delivery._check_crowd_quantity(_task("photos"), 3) == 3


def test_a_share_has_two_places_at_most():
    with pytest.raises(delivery.DeliveryError, match="two decimal places"):
        delivery._check_crowd_quantity(_task("hours"), Decimal("0.125"))


@pytest.mark.parametrize("unit", ["sites", "audio_hours", "responses"])
def test_units_the_app_cannot_deliver_are_not_given_to_the_crowd(unit):
    with pytest.raises(delivery.DeliveryError, match="capture app cannot deliver"):
        delivery._check_crowd_quantity(_task(unit), 1)


def test_a_kept_share_is_rounded_up_never_down():
    assert delivery._share(Decimal("0.0033")) == Decimal("0.01")
    assert delivery._share(Decimal("2")) == Decimal("2.00")


def test_quantities_leave_as_integers_when_whole():
    assert delivery.qty(Decimal("3.00")) == 3 and isinstance(delivery.qty(Decimal("3.00")), int)
    assert delivery.qty(Decimal("1.50")) == 1.5
    assert delivery.qty(None) is None


def test_shares_read_in_words():
    assert delivery.units_text(Decimal("1.5"), "hours") == "1.5 hours of footage"
    assert delivery.units_text(1, "photos") == "1 photo"
    assert delivery.units_text(4, None) == "4 units"
