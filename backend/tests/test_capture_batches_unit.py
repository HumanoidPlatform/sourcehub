"""Capture batches: db/340, migration 0037, and the stage a capture is in.

What this file guards:

  * a capture reading as the wrong stage — accepted work shown as something
    the worker can delete, or rework hidden once a retake replaces it;
  * the migration drifting from the SQL file, or the bundle forgetting it;
  * a worker being able to answer their own batch, or the API deleting one.

The flow itself (send part, keep capturing, answer per batch, retake,
reassign) needs a database and storage; it was run end to end against the
local compose stack.

    pytest tests/test_capture_batches_unit.py
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from sourcehub.modules.media.service import STAGE_COUNTS, stage

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "340_capture_batches.sql").read_text(encoding="utf-8")
MIGRATION_TEXT = (
    ROOT / "backend" / "migrations" / "versions" / "0037_capture_batches.py"
).read_text(encoding="utf-8")
BUNDLE = (ROOT / "infra" / "bundle_schema.sh").read_text(encoding="utf-8")


@pytest.mark.parametrize(
    ("status", "batch_status", "replaced", "want"),
    [
        ("ready", None, False, "draft"),
        ("ready", "in_review", False, "in_review"),
        ("ready", "reviewed", False, "accepted"),
        ("rejected", "reviewed", False, "rework"),
        ("rejected", "reviewed", True, "replaced"),
        # sent back again after a gate-2 reopen put the batch back in review
        ("rejected", "in_review", False, "rework"),
        ("pending", None, False, "uploading"),
        ("quarantined", None, False, "uploading"),
    ],
)
def test_each_capture_has_one_stage(status, batch_status, replaced, want):
    assert stage(status, batch_status, replaced) == want


def test_the_counts_agree_with_the_stages():
    # A retake that is alive answers the rework, so the rework count must ask
    # the same question stage() is given as `replaced`.
    assert "r.replaces_asset_id = s.id" in STAGE_COUNTS
    assert "r.status <> 'erased'" in STAGE_COUNTS
    assert ":a" in STAGE_COUNTS


def test_the_migration_carries_the_sql_verbatim():
    m = re.search(r'_UP = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m and m.group(1) == "\n" + SQL_TEXT


def test_the_migration_follows_0036_and_the_bundle_lists_the_file():
    assert re.search(r'^revision = "0037"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0036"$', MIGRATION_TEXT, re.M)
    assert "330_onboarding_decisions 340_capture_batches" in BUNDLE


def test_only_the_supplier_answers_a_batch_and_none_is_deleted():
    assert "NOT is_worker() AND (is_platform_admin() OR supplier_org_id = current_org_id())" in (
        SQL_TEXT
    )
    assert "REVOKE ALL ON capture_batch FROM sourcehub_app" in SQL_TEXT
    assert "GRANT SELECT, INSERT ON capture_batch TO sourcehub_app" in SQL_TEXT
    assert "DELETE" not in SQL_TEXT.split("REVOKE ALL ON capture_batch")[1].split(";")[1]
    # a worker may only open a batch for review, never write a decided one
    assert "worker_user_id = current_user_id() AND status = 'in_review'" in SQL_TEXT


def test_rls_is_enabled_not_forced():
    assert "ALTER TABLE capture_batch ENABLE ROW LEVEL SECURITY" in SQL_TEXT
    assert "FORCE  ROW LEVEL" not in SQL_TEXT and "FORCE ROW LEVEL" not in SQL_TEXT


def test_nothing_is_left_submitted_or_rejected():
    assert re.search(
        r"UPDATE task_assignment SET status = 'in_progress'\s+"
        r"WHERE status IN \('submitted', 'rejected'\);",
        SQL_TEXT,
    )
