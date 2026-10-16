"""db/520 lets a sponsor say what a device is and attach its photos and
documents; 0056 carries it.

What a reviewer cannot see from the diff:

  * the migration is the SQL file, verbatim, and it adds the enum value in a
    transaction of its own before the functions that name it;
  * the two attachment functions keep every branch they had, byte for byte;
  * a device's files are filed under equipment/{sponsor}/{DV-ref}/{slot}, and a
    client may not take the folder name;
  * a bad file anywhere in a save refuses the save before ANY file is moved —
    storage is outside the transaction, so a move cannot be rolled back;
  * calibration stays optional; details are trimmed, bounded and blank-is-null.

Scripts, pure rules and fakes only; no database or storage is opened.

    pytest tests/test_equipment_details_unit.py
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from sourcehub.api.security import AccessClaims
from sourcehub.api.v1.network import EquipmentIn, EquipmentPatchIn
from sourcehub.modules.attachments import folders
from sourcehub.modules.attachments import service as attachments
from sourcehub.modules.network import service as network

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "520_equipment_details.sql").read_text(encoding="utf-8")
VERSIONS = ROOT / "backend" / "migrations" / "versions"
MIGRATION_TEXT = (VERSIONS / "0056_equipment_details.py").read_text(encoding="utf-8")
DB095 = (ROOT / "db" / "095_attachments.sql").read_text(encoding="utf-8")
DB140 = (ROOT / "db" / "140_attachment_layout.sql").read_text(encoding="utf-8")
BUNDLE = ROOT / "infra" / "bundle_schema.sh"


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _body(sql: str, header: str) -> str:
    """The text between a function's opening $fn$ and its closing one."""
    start = sql.index(header)
    open_at = sql.index("$fn$", start) + len("$fn$")
    return sql[open_at:sql.index("$fn$", open_at)]


def _claims(**kw: Any) -> AccessClaims:
    base: dict[str, Any] = {
        "user_id": uuid.uuid4(), "full_name": "S", "email": "s@x.example",
        "org_id": uuid.uuid4(), "org_kind": "sponsor", "org_name": "Lumen Device Sponsors",
        "role": "sponsor", "scope": "owner", "capabilities": frozenset({"equipment.manage"}),
        "mfa_satisfied": True, "must_change_password": False,
    }
    return AccessClaims(**{**base, **kw})


# ---------------------------------------------------------------------------
# The two files stay one change
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0055():
    assert re.search(r'^revision = "0056"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0055"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_510_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE.read_text(encoding="utf-8"), re.M)
    assert m
    files = m.group(1).split()
    assert files.index("520_equipment_details") == files.index("510_measured_units") + 1


def test_the_enum_value_is_added_first_and_committed_on_its_own():
    # Postgres refuses a new enum value in the transaction that added it, and
    # both functions name 'equipment'.
    first = SQL_TEXT.index("ADD VALUE IF NOT EXISTS 'equipment'")
    assert first < SQL_TEXT.index("ALTER TABLE equipment")
    assert first < SQL_TEXT.index("FUNCTION attachment_parent_visible")
    assert first < SQL_TEXT.index("FUNCTION attachment_folder")
    start, end = MIGRATION_TEXT.index("def upgrade"), MIGRATION_TEXT.index("def downgrade")
    upgrade = MIGRATION_TEXT[start:end]
    assert "autocommit_block" in upgrade and '"ADD VALUE" in stmt' in upgrade


def test_the_downgrade_refuses_while_details_or_files_exist_then_restores():
    down = _literal("_DOWN")
    guard = down.index("RAISE EXCEPTION")
    assert guard < down.index("CREATE OR REPLACE FUNCTION attachment_parent_visible")
    assert "entity_type = 'equipment'" in down
    for gone in ("DROP COLUMN specifications", "DROP COLUMN location", "DROP COLUMN model",
                 "DROP COLUMN make"):
        assert gone in down, gone
    # db/095's and db/140's bodies, exactly
    assert _body(down, "FUNCTION attachment_parent_visible") == _body(
        DB095, "FUNCTION attachment_parent_visible"
    )
    old_folder = _body(DB140, "CREATE FUNCTION attachment_folder")
    assert _body(down, "FUNCTION attachment_folder") == old_folder


def test_the_visibility_function_keeps_every_branch_it_had():
    old = _body(DB095, "FUNCTION attachment_parent_visible")
    new = _body(SQL_TEXT, "FUNCTION attachment_parent_visible")
    for line in old.splitlines():
        assert line in new.splitlines(), line
    assert "WHEN 'equipment' THEN EXISTS (SELECT 1 FROM equipment" in new
    # invoker rights: equipment's own policies decide who sees a device's files
    header = SQL_TEXT[SQL_TEXT.index("FUNCTION attachment_parent_visible"):]
    assert "SECURITY INVOKER" in header[:header.index("$fn$")]


def test_the_folder_function_is_db140_with_an_equipment_branch_in_front():
    new = _body(SQL_TEXT, "FUNCTION attachment_folder")
    old = _body(DB140, "CREATE FUNCTION attachment_folder")
    assert new.endswith(old), "db/140's body must survive unchanged after the UNION ALL"
    assert "UNION ALL" in new[: len(new) - len(old)]
    assert "JOIN   organisation o ON o.id = e.sponsor_org_id" in new


def test_the_columns_are_bounded_in_the_database_too():
    for col in ("make", "model", "location"):
        assert f"CHECK (char_length(btrim({col})) BETWEEN 1 AND 200)" in SQL_TEXT, col
    assert "jsonb_typeof(specifications) = 'object'" in SQL_TEXT


# ---------------------------------------------------------------------------
# What a sponsor may say about a device
# ---------------------------------------------------------------------------
def test_a_blank_detail_is_null_and_spaces_collapse():
    assert network.clean_detail("make", "   ") is None
    assert network.clean_detail("make", None) is None
    assert network.clean_detail("model", "  HERO12   Black ") == "HERO12 Black"


def test_a_detail_is_at_most_200_characters():
    assert network.clean_detail("location", "x" * 200) == "x" * 200
    with pytest.raises(network.NetworkInvalid):
        network.clean_detail("location", "x" * 201)


def test_specifications_are_trimmed_and_empty_values_dropped():
    got = network.clean_specifications({" Resolution ": " 4K ", "Power": "  ", "Storage": "256 GB"})
    assert got == {"Resolution": "4K", "Storage": "256 GB"}


@pytest.mark.parametrize(
    "bad",
    [
        {f"Label {i}": "v" for i in range(21)},  # too many
        {"x" * 61: "v"},  # label too long
        {"Resolution": "x" * 201},  # value too long
        {"Power": "5 V", "power": "12 V"},  # one label twice
        {"": "4K"},  # value with no label
        {"Year": 2024},  # not text
        ["Resolution", "4K"],  # not a map
    ],
)
def test_specifications_outside_the_rules_are_refused(bad: Any):
    with pytest.raises(network.NetworkInvalid):
        network.clean_specifications(bad)


def test_the_invalid_refusals_are_still_network_errors():
    # routes catch NetworkInvalid (422) before NetworkError (409)
    assert issubclass(network.NetworkInvalid, network.NetworkError)


def test_calibration_is_optional_on_create():
    body = EquipmentIn(equipment_type="Helmet camera", total_units=3)
    assert body.calibrated_on is None and body.calibration_expires_on is None
    assert body.specifications == {} and body.attachments == []


def test_the_create_body_refuses_a_bad_details_map_with_a_422_shape():
    with pytest.raises(ValidationError):
        EquipmentIn(equipment_type="Helmet camera", total_units=3, specifications={"x" * 61: "v"})
    with pytest.raises(ValidationError):
        EquipmentIn(equipment_type="Helmet camera", total_units=3, make="m" * 201)


def test_at_most_twenty_files_ride_on_one_save():
    item = {"storage_key": "_staging/o/u/a.jpg", "filename": "a.jpg", "slot": "photos"}
    with pytest.raises(ValidationError):
        EquipmentPatchIn(attachments=[item] * 21)
    assert len(EquipmentPatchIn(attachments=[item] * 20).attachments) == 20


def test_the_patch_body_says_which_fields_were_sent():
    body = EquipmentPatchIn(make=None, specifications={"Year": "2024"})
    assert body.model_fields_set == {"make", "specifications"}


# ---------------------------------------------------------------------------
# Where a device's files are filed
# ---------------------------------------------------------------------------
class _Rows:
    def __init__(self, row: dict[str, Any] | None = None, rows: list[Any] | None = None):
        self._row = row
        self._rows = rows or []

    def mappings(self) -> _Rows:
        return self

    def one_or_none(self) -> dict[str, Any] | None:
        return self._row

    def all(self) -> list[Any]:
        return self._rows


class _FolderSession:
    def __init__(self, row: dict[str, Any]):
        self.row = row

    async def execute(self, *_a: Any, **_k: Any) -> _Rows:
        return _Rows(self.row)


async def test_a_device_is_filed_under_equipment_its_sponsor_and_its_code():
    s = _FolderSession(
        {"client_name": "Lumen Device Sponsors", "request_ref": "DV-07",
         "scope_ref": None, "scope_label": None}
    )
    filing = await folders.folder_for(s, "equipment", uuid.uuid4())  # type: ignore[arg-type]
    assert filing.base == "equipment/Lumen Device Sponsors/DV-07"
    assert folders.subfolder("equipment", filing, "photos") == "photos"
    name = folders.stored_name(filing.rfp_ref, filing.scope_ref, "photos", 1, 1, "front.jpg")
    assert name == "DV-07_photos_01_v1_front.jpg"


async def test_a_client_cannot_take_the_equipment_folder_name():
    s = _FolderSession(
        {"client_name": "Equipment", "request_ref": "RFP-1001",
         "scope_ref": None, "scope_label": None}
    )
    with pytest.raises(ValueError):
        await folders.folder_for(s, "request", uuid.uuid4())  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# A bad file refuses the save before any file is moved
# ---------------------------------------------------------------------------
class _AttachSession:
    """Answers the advisory lock, the numbering read and the insert."""

    def __init__(self) -> None:
        self.inserted = 0

    async def execute(self, statement: Any, params: dict[str, Any] | None = None) -> _Rows:
        sql = str(statement)
        if sql.startswith("INSERT INTO attachment"):
            self.inserted += 1
            return _Rows({"id": uuid.uuid4(), "slot": params["s"] if params else None})
        return _Rows(None, [])


@pytest.fixture
def staged(monkeypatch: pytest.MonkeyPatch) -> list[tuple[str, str]]:
    """Fake storage: every staged key exists and is small; moves are recorded."""
    from sourcehub.platform import storage

    moves: list[tuple[str, str]] = []

    async def stat(_t: Any, _key: str) -> tuple[int, str]:
        return 1024, "application/octet-stream"

    async def move_into(_t: Any, staged_key: str, final: str) -> str:
        moves.append((staged_key, final))
        return final

    async def folder_for(_s: Any, _t: str, _id: uuid.UUID) -> folders.Filing:
        return folders.Filing(
            base="equipment/Lumen Device Sponsors/DV-07", rfp_ref="DV-07",
            scope_ref=None, scope_label=None,
        )

    monkeypatch.setattr(storage, "platform_target", lambda: object())
    monkeypatch.setattr(storage, "stat", stat)
    monkeypatch.setattr(folders, "move_into", move_into)
    monkeypatch.setattr(folders, "folder_for", folder_for)
    return moves


def _item(claims: AccessClaims, filename: str, slot: str) -> dict[str, Any]:
    return {
        "storage_key": folders.staging_key(claims.org_id, filename),
        "filename": filename, "content_type": None, "slot": slot,
    }


@pytest.mark.parametrize(
    ("filename", "slot"),
    [
        ("manual.pdf", "photos"),  # a photo must be a picture
        ("front.jpg", "receipts"),  # a device has two fields, not any
        ("clip.mp4", "documentation"),  # documentation is documents
    ],
)
async def test_a_bad_last_file_moves_nothing(
    staged: list[tuple[str, str]], filename: str, slot: str
):
    claims = _claims()
    session = _AttachSession()
    items = [_item(claims, "front.jpg", "photos"), _item(claims, "spec.pdf", "documentation"),
             _item(claims, filename, slot)]
    with pytest.raises(attachments.AttachmentError):
        await attachments.attach(
            session, claims, entity_type="equipment", entity_id=uuid.uuid4(), items=items,  # type: ignore[arg-type]
        )
    assert staged == [], "a file was moved before the save was refused"
    assert session.inserted == 0


async def test_the_same_staged_file_twice_moves_nothing(staged: list[tuple[str, str]]):
    claims = _claims()
    one = _item(claims, "front.jpg", "photos")
    with pytest.raises(attachments.AttachmentError):
        await attachments.attach(
            _AttachSession(), claims, entity_type="equipment", entity_id=uuid.uuid4(),  # type: ignore[arg-type]
            items=[one, dict(one)],
        )
    assert staged == []


async def test_good_files_are_filed_under_the_device(staged: list[tuple[str, str]]):
    claims = _claims()
    session = _AttachSession()
    out = await attachments.attach(
        session, claims, entity_type="equipment", entity_id=uuid.uuid4(),  # type: ignore[arg-type]
        items=[_item(claims, "front.jpg", "photos"), _item(claims, "Manual.pdf", "documentation")],
    )
    assert len(out) == 2 and session.inserted == 2
    assert [final for _, final in staged] == [
        "equipment/Lumen Device Sponsors/DV-07/photos/DV-07_photos_01_v1_front.jpg",
        "equipment/Lumen Device Sponsors/DV-07/documentation/DV-07_documentation_01_v1_Manual.pdf",
    ]


async def test_other_parents_keep_their_open_slots(staged: list[tuple[str, str]], monkeypatch):
    # The fixed slots are the device's alone; a request still names its own.
    claims = _claims(org_kind="client")
    out = await attachments.attach(
        _AttachSession(), claims, entity_type="request", entity_id=uuid.uuid4(),  # type: ignore[arg-type]
        items=[_item(claims, "brief.pdf", "brief")],
    )
    assert len(out) == 1


async def test_a_file_from_another_organisation_is_refused(staged: list[tuple[str, str]]):
    claims = _claims()
    foreign = _item(_claims(), "front.jpg", "photos")
    with pytest.raises(attachments.AttachmentError):
        await attachments.attach(
            _AttachSession(), claims, entity_type="equipment", entity_id=uuid.uuid4(),  # type: ignore[arg-type]
            items=[foreign],
        )
    assert staged == []


# ---------------------------------------------------------------------------
# The picture beside each device in a list
# ---------------------------------------------------------------------------
class _PreviewSession:
    def __init__(self, rows: list[dict[str, Any]]):
        self.rows = rows
        self.sql = ""

    async def execute(self, statement: Any, _params: dict[str, Any] | None = None) -> _Rows:
        self.sql = str(statement)
        return _Rows(None, self.rows)


async def test_each_device_gets_its_first_photo_signed_inline(monkeypatch: pytest.MonkeyPatch):
    from sourcehub.platform import storage

    a, b = uuid.uuid4(), uuid.uuid4()
    signed: list[tuple[str, bool]] = []

    async def presign_get(_t: Any, key: str, _name: str, inline: bool = False) -> str:
        signed.append((key, inline))
        return f"https://store.example/{key}"

    monkeypatch.setattr(storage, "platform_target", lambda: object())
    monkeypatch.setattr(storage, "presign_get", presign_get)
    s = _PreviewSession([
        {"entity_id": a, "storage_key": "equipment/S/DV-01/photos/DV-01_photos_01_v1_front.jpg",
         "filename": "front.jpg"},
        {"entity_id": b, "storage_key": "equipment/S/DV-02/photos/DV-02_photos_01_v2_top.png",
         "filename": "top.png"},
    ])
    got = await attachments.preview_urls(s, "equipment", [a, b], "photos")  # type: ignore[arg-type]
    assert got == {
        a: "https://store.example/equipment/S/DV-01/photos/DV-01_photos_01_v1_front.jpg",
        b: "https://store.example/equipment/S/DV-02/photos/DV-02_photos_01_v2_top.png",
    }
    assert all(inline for _, inline in signed), "a thumbnail is shown, not downloaded"
    # one row per device: its first document, newest version, live only
    assert "DISTINCT ON (entity_id)" in s.sql and "ORDER BY entity_id, doc_no, version DESC" in s.sql
    assert "deleted_at IS NULL" in s.sql


async def test_a_signature_that_fails_costs_one_picture_not_the_list(monkeypatch: pytest.MonkeyPatch):
    from sourcehub.platform import storage

    a, b = uuid.uuid4(), uuid.uuid4()

    async def presign_get(_t: Any, key: str, _name: str, inline: bool = False) -> str:
        if "DV-01" in key:
            raise storage.StorageError("signing refused")
        return "https://store.example/ok"

    monkeypatch.setattr(storage, "platform_target", lambda: object())
    monkeypatch.setattr(storage, "presign_get", presign_get)
    s = _PreviewSession([
        {"entity_id": a, "storage_key": "x/DV-01/a.jpg", "filename": "a.jpg"},
        {"entity_id": b, "storage_key": "x/DV-02/b.jpg", "filename": "b.jpg"},
    ])
    got = await attachments.preview_urls(s, "equipment", [a, b], "photos")  # type: ignore[arg-type]
    assert got == {b: "https://store.example/ok"}


async def test_no_devices_means_no_query():
    s = _PreviewSession([])
    assert await attachments.preview_urls(s, "equipment", [], "photos") == {}  # type: ignore[arg-type]
    assert s.sql == ""
