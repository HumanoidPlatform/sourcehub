"""infra/erd.py reads the whole of db/*.sql and gets the final shape of every table.

The generator is a small hand-rolled DDL reader, and the tables it draws are
reshaped by ALTER TABLE in later files (asset gains eleven columns across 120
and 210; crowd_worker loses `skill` for `skills` in 190). A diagram that showed
a table as its CREATE TABLE left it would be wrong in exactly the places that
changed most. So this checks the set: every table is grouped, every foreign key
resolves, and the ALTERs landed. Scripts only; no database is opened.

    pytest tests/test_erd_unit.py
"""

from __future__ import annotations

import importlib.util
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    from types import ModuleType

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "infra" / "erd.py"


def _load() -> ModuleType:
    spec = importlib.util.spec_from_file_location("erd", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["erd"] = module  # dataclasses resolve annotations through sys.modules
    spec.loader.exec_module(module)
    return module


erd = _load()


@pytest.fixture(scope="module")
def model() -> Any:
    return erd.build_model()


def test_every_table_is_read_and_grouped(model: Any) -> None:
    grouped = {t for _, _, _, names in erd.GROUPS for t in names}
    assert set(model.tables) == grouped
    # 59 before db/280 folded the five profile tables away, 54 before db/290
    # dropped the thirteen dormant tables with their enum and the four views,
    # 41 before db/310 folded qa_review_defect onto the verdict row
    assert len(model.tables) == 40
    assert len(model.enums) == 31
    assert sorted(model.views) == []


def test_alter_table_changes_landed(model) -> None:  # type: ignore[no-untyped-def]
    asset = model.tables["asset"]
    for col in ("task_id", "assignment_id", "storage_target_id", "review_note", "reviewed_by"):
        assert asset.has_column(col), col
    assert asset.column("submission_id").nullable  # 120 dropped NOT NULL
    assert not asset.column("task_id").nullable  # 120 set NOT NULL after backfill
    assert asset.pk == ["id", "created_at"]
    assert asset.partition_key == "created_at"

    worker = model.tables["crowd_worker"]
    assert worker.has_column("skills") and not worker.has_column("skill")
    assert worker.column("user_id").unique

    assert model.tables["qa_review"].column("submission_id").nullable
    assert model.tables["qa_review"].has_column("assignment_id")

    attachment = model.tables["attachment"]
    assert not attachment.column("doc_no").nullable  # 140: added, backfilled, then SET NOT NULL


def test_foreign_keys_resolve(model) -> None:  # type: ignore[no-untyped-def]
    fks = {(fk.table, tuple(fk.columns)): fk for fk in model.fks()}
    for (table, cols), fk in fks.items():
        target = model.tables[fk.ref_table]
        for c in fk.ref_columns:
            assert target.has_column(c), (table, cols, fk.ref_table, c)
    # added with ALTER TABLE ... ADD CONSTRAINT, not inline
    assert fks[("organisation", ("created_by",))].ref_table == "app_user"
    assert fks[("asset", ("equipment_id",))].on_delete == "set null"
    # inline, with an ON DELETE clause after the column
    assert fks[("user_session", ("user_id",))].on_delete == "cascade"
    # one-to-one: the award. The profile satellites were folded into
    # organisation (db/280), so DROP TABLE must have taken them out of the model.
    for dropped in (
        "client_profile",
        "tenant_profile",
        "aggregator_profile",
        "business_profile",
        "sponsor_profile",
    ):
        assert dropped not in model.tables, dropped
    assert model.tables["organisation"].has_column("profile")
    assert model.tables["contract"].fk_is_one_to_one(fks[("contract", ("request_id",))])
    assert not model.tables["task"].fk_is_one_to_one(fks[("task", ("contract_id",))])


def test_enum_values_follow_alter_type(model) -> None:  # type: ignore[no-untyped-def]
    assert model.enums["asset_status"].values == [
        "pending",
        "uploaded",
        "ready",
        "quarantined",
        "rejected",
        "erased",
    ]


def test_drawio_output_is_well_formed(model) -> None:  # type: ignore[no-untyped-def]
    root = ET.fromstring(erd.render_drawio(model, "test"))
    pages = root.findall("diagram")
    assert [p.get("name") for p in pages][:1] == ["Overview"]
    assert len(pages) == len(erd.GROUPS) + 2
    full = pages[-1]
    ids = {c.get("id") for c in full.iter("mxCell")}
    assert len(ids) == sum(1 for _ in full.iter("mxCell")), "duplicate cell ids"
    assert {f"t:{t}" for t in model.tables} <= ids
    edges = [c for c in full.iter("mxCell") if c.get("edge") == "1"]
    assert len(edges) == len(model.fks()) + len(erd.SOFT_LINKS)
    for e in edges:
        assert e.get("source") in ids and e.get("target") in ids


def test_dbml_output_names_every_table(model) -> None:  # type: ignore[no-untyped-def]
    text = erd.render_dbml(model, "test")
    for name in model.tables:
        assert f"Table {name} [" in text
    assert text.count("\nRef ") == len(model.fks())
    assert "Enum org_kind {" in text
