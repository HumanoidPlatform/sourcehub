"""The client's privacy terms reach the work: delivery.privacy_terms and create_task,
migration 0061, the coordinates withheld from the client on a strip-GPS task, and
the DataHub resale rules (delivery.resale_block, permitted uses).

What this file guards, in the order it would hurt:

  * a task losing or overriding its client's privacy terms: they are merged
    last in create_task, always from the request, never from the partner;
  * the tasks that already existed carrying a different shape from the new
    ones: the migration's SQL and privacy_terms must build the same object;
  * a stripped-GPS task handing the client a location anyway;
  * captures of people, or for biometric processing, being resold;
  * a resold listing offering a use the client's request did not permit.

    pytest tests/test_task_privacy_unit.py
"""

from __future__ import annotations

import inspect
import re
from pathlib import Path

import pytest

from sourcehub.modules.catalogue import service as catalogue
from sourcehub.modules.delivery import service as delivery
from sourcehub.modules.media import service as media

ROOT = Path(__file__).resolve().parents[2]
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0061_task_privacy.py"
).read_text(encoding="utf-8")
SEED = (ROOT / "db" / "900_seed.sql").read_text(encoding="utf-8")
KEYS = ("people_in_frame", "minors_policy", "deidentification", "lawful_basis", "regulations",
        "biometric_processing")


# ---------------------------------------------------------------------------
# privacy_terms: the six that bind the work, always all present
# ---------------------------------------------------------------------------
def test_privacy_terms_carries_the_six_and_nothing_else():
    cc = {
        "people_in_frame": "none", "minors_policy": "prohibited",
        "deidentification": ["blur_faces", "strip_gps"], "lawful_basis": "consent",
        "regulations": ["DPDP"], "biometric_processing": True,
        # the rest of consent_and_compliance stays with the client and partner
        "compliance_notes": "x", "permitted_uses": ["audit"], "partner_reuse_allowed": True,
    }
    assert delivery.privacy_terms(cc) == {
        "people_in_frame": "none", "minors_policy": "prohibited",
        "deidentification": ["blur_faces", "strip_gps"], "lawful_basis": "consent",
        "regulations": ["DPDP"], "biometric_processing": True,
    }
    assert tuple(delivery.privacy_terms(cc)) == KEYS


@pytest.mark.parametrize("cc", [None, {}, {"deidentification": None, "regulations": None}])
def test_a_request_that_said_nothing_reads_as_nothing_stated(cc):
    assert delivery.privacy_terms(cc) == {
        "people_in_frame": None, "minors_policy": None, "deidentification": [],
        "lawful_basis": None, "regulations": [], "biometric_processing": False,
    }


def test_create_task_merges_the_terms_last_and_from_the_request():
    src = inspect.getsource(delivery.create_task)
    # read every time, from the request, beside what the task inherits
    assert "r.capture_spec, r.target_unit, r.consent_and_compliance" in src
    assert "if not capture_spec or target_unit is None:\n        wanted" not in src
    merged = src.index('"privacy": privacy_terms(wanted["consent_and_compliance"]')
    # after the subject, so nothing the partner sends can stand in for them
    assert merged > src.index('"subject": subject}')
    assert merged < src.index("capture_spec=capture_spec or {}")


# ---------------------------------------------------------------------------
# Migration 0061: the same object for the tasks that already existed
# ---------------------------------------------------------------------------
def test_the_migration_follows_0060():
    assert re.search(r'^revision = "0061"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0060"$', MIGRATION_TEXT, re.M)


def test_the_backfill_builds_the_shape_privacy_terms_builds():
    backfill = MIGRATION_TEXT[MIGRATION_TEXT.index("_BACKFILL"):MIGRATION_TEXT.index("def upgrade")]
    # each key opens its own line; the value beside it may quote the same name
    inner = backfill.split("'privacy', jsonb_build_object(", 1)[1]
    built = re.findall(r"^\s+'(\w+)',", inner, re.M)
    assert tuple(built) == KEYS
    # arrays absent or JSON null read as [], the flag as false, as in Python
    assert "jsonb_typeof(r.consent_and_compliance -> '{k}') = 'array'" in MIGRATION_TEXT
    flag = "coalesce((r.consent_and_compliance ->> 'biometric_processing')::boolean, false)"
    assert flag in backfill
    assert "FROM contract c\n  JOIN request r ON r.id = c.request_id" in backfill


def test_the_backfill_holds_off_updated_at_and_the_downgrade_takes_it_back():
    up = MIGRATION_TEXT[MIGRATION_TEXT.index("def upgrade"):MIGRATION_TEXT.index("def downgrade")]
    down = MIGRATION_TEXT[MIGRATION_TEXT.index("def downgrade"):]
    for part in (up, down):
        held = part.index("DISABLE TRIGGER task_updated_at")
        assert held < part.index("ENABLE TRIGGER task_updated_at")
    assert "capture_spec - 'privacy'" in down


def test_a_reviewer_can_name_a_person_in_frame():
    row = r"'person_in_frame', 'Person or child in frame',\s+'compliance', false"
    assert re.search(r"\(" + row + r"\)", SEED)
    assert re.search(r"VALUES \(" + row + r"\) ", MIGRATION_TEXT)
    assert "ON CONFLICT (code) DO NOTHING" in MIGRATION_TEXT
    # a code a review already cited is retired, never deleted out from under it
    assert "q.defects ? 'person_in_frame'" in MIGRATION_TEXT


# ---------------------------------------------------------------------------
# strip_gps: the client never reads where a capture was taken
# ---------------------------------------------------------------------------
def test_a_stripped_task_withholds_the_location_from_the_client():
    cols = media._ASSET_COLUMNS
    assert cols.count(media._LOCATION_WITHHELD) == 2
    assert "THEN NULL ELSE a.captured_lat END AS captured_lat" in cols
    assert "THEN NULL ELSE a.captured_lon END AS captured_lon" in cols
    rule = media._LOCATION_WITHHELD
    assert "ct.client_org_id = current_org_id()" in rule
    assert "@> '[\"strip_gps\"]'::jsonb" in rule
    # and the location is never selected bare beside it
    assert "a.captured_lat," not in cols and "a.captured_lon," not in cols


# ---------------------------------------------------------------------------
# DataHub: what may be resold, and for what
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    ("consent", "blocked"),
    [
        ({"people_in_frame": "none"}, None),
        ({"people_in_frame": "none", "biometric_processing": False}, None),
        ({"people_in_frame": "incidental"}, "has people in frame"),
        ({"people_in_frame": "consented"}, "has people in frame"),
        ({"people_in_frame": None}, "does not say"),
        ({}, "does not say"),
        (None, "does not say"),
        ({"people_in_frame": "none", "biometric_processing": True}, "biometric processing"),
    ],
)
def test_resale_block(consent, blocked):
    got = delivery.resale_block(consent)
    if blocked is None:
        assert got is None
    else:
        assert got and blocked in got


def test_relisting_checks_the_privacy_terms_after_exclusivity():
    src = inspect.getsource(catalogue.relist_contract)
    assert "r.consent_and_compliance AS consent" in src
    # one rule, the one the contract page states (delivery.resale_block)
    checked = src.index("delivery.resale_block(req[\"consent\"])")
    assert src.index("partner_reuse_allowed\"]:") < checked


def test_a_contract_listing_offers_only_what_the_request_permits():
    upd = inspect.getsource(catalogue.update_dataset)
    assert 'k == "permitted_uses" and m["source"] == "contract"' in upd
    assert "_rfp_permitted_uses(session, m[\"contract_id\"])" in upd
    ready = inspect.getsource(catalogue._readiness)
    assert "permitted no uses, so its captures cannot be offered" in ready
    assert "Offer only what the client's request permits" in ready
    detail = inspect.getsource(catalogue.dataset_detail)
    assert 'd["allowed_permitted_uses"]' in detail


def test_the_contract_says_why_it_cannot_be_relisted():
    src = inspect.getsource(delivery._contract_row)
    assert "r.consent_and_compliance AS consent" in src
    assert '"resale_blocked_reason"' in src
    assert 'resale_block(names.get("consent"))' in src
