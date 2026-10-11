"""Google Cloud Storage as a destination (db/370 + 0040) and as the platform's own storage.

The two files stay one change (verbatim); the CHECK admits 'gcs' going up and refuses
it again coming down, but only after a guard that changes nothing while a gcs row
exists; the API, the service and the façade agree on the three providers; a gcs key is
checked for shape and never echoed; and STORAGE_PROVIDER picks the platform's storage,
refusing at boot to run on GCS without a bucket.
"""

from __future__ import annotations

import ast
import json
import re
from pathlib import Path
from typing import Any, get_args

import pytest
from pydantic import ValidationError

from sourcehub import config
from sourcehub.api.v1.storage import TargetIn
from sourcehub.modules.storage import service
from sourcehub.platform import storage

ROOT = Path(__file__).resolve().parents[2]
SQL_TEXT = (ROOT / "db" / "370_gcs_destinations.sql").read_text(encoding="utf-8")
MIGRATION = ROOT / "backend" / "migrations" / "versions" / "0040_gcs_destinations.py"
MIGRATION_TEXT = MIGRATION.read_text(
    encoding="utf-8"
)
BUNDLE = (ROOT / "infra" / "bundle_schema.sh").read_text(encoding="utf-8")


def _literal(name: str) -> str:
    m = re.search(rf'{name} = """(.*?)"""', MIGRATION_TEXT, re.S)
    assert m, f"no {name} literal"
    return m.group(1)


def _statements(ddl: str) -> list[str]:
    ns: dict[str, Any] = {}
    tree = ast.parse(MIGRATION_TEXT)
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_statements")
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "0040", "exec"), ns)
    return ns["_statements"](ddl)


# ---------------------------------------------------------------------------
# db/370 and migration 0040
# ---------------------------------------------------------------------------
def test_the_migration_carries_the_sql_verbatim():
    assert _literal("_UP") == "\n" + SQL_TEXT


def test_the_migration_follows_0039():
    assert re.search(r'^revision = "0040"$', MIGRATION_TEXT, re.M)
    assert re.search(r'^down_revision = "0039"$', MIGRATION_TEXT, re.M)


def test_the_new_file_follows_360_in_the_bundle():
    m = re.search(r'^STRUCTURE="([^"]*)"', BUNDLE, re.M)
    assert m
    listed = m.group(1).split()
    at = listed.index("370_gcs_destinations")
    assert listed[at - 1] == "360_quality_and_compliance"
    assert all(int(name[:3]) > 370 for name in listed[at + 1 :])


def test_no_comment_line_ends_a_statement():
    for label, text in (("db/370", SQL_TEXT), ("_DOWN", _literal("_DOWN"))):
        for n, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("--"):
                assert not line.rstrip().endswith(";"), f"{label} line {n}: {line}"


def test_up_admits_gcs_and_down_refuses_it_again():
    up = " ".join(_statements(_literal("_UP")))
    assert "CHECK (provider IN ('s3', 'gcs', 'azure_blob'))" in up
    down = _statements(_literal("_DOWN"))
    assert "CHECK (provider IN ('s3','azure_blob'))" in down[-1]


def test_the_downgrade_guard_runs_first_and_changes_nothing():
    down = _statements(_literal("_DOWN"))
    guard = next(s for s in down if "DO $fn$" in s)
    assert down.index(guard) == 0
    assert "RAISE EXCEPTION" in guard and "provider = 'gcs'" in guard
    assert "ALTER" not in guard
    for stmt in down:
        assert stmt.count("$fn$") in (0, 2), stmt[:120]


def test_upgrade_and_downgrade_run_their_literals_unconditionally():
    tree = ast.parse(MIGRATION_TEXT)
    for fn, literal in (("upgrade", "_UP"), ("downgrade", "_DOWN")):
        body = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == fn)
        loop = body.body[0]
        assert isinstance(loop, ast.For), f"{fn}() must run its statements unconditionally"
        assert literal in {n.id for n in ast.walk(loop.iter) if isinstance(n, ast.Name)}


# ---------------------------------------------------------------------------
# The three layers agree on the providers
# ---------------------------------------------------------------------------
def test_api_service_and_facade_list_the_same_three_providers():
    api = set(get_args(TargetIn.model_fields["provider"].annotation))
    assert api == {"s3", "gcs", "azure_blob"}
    assert set(service.SUPPORTED_PROVIDERS) == api
    assert set(storage._PACKAGES) == api


def test_a_gcs_destination_is_accepted_by_the_api():
    body = TargetIn(label="Field captures", provider="gcs", bucket="acme-captures",
                    secret={"service_account_json": "{}"})
    assert body.provider == "gcs"


def _key(**over: Any) -> str:
    info = {"type": "service_account", "client_email": "u@p.iam.gserviceaccount.com",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIsecret\n-----END PRIVATE KEY-----\n"}
    info.update(over)
    return json.dumps(info)


@pytest.mark.parametrize(
    ("secret", "message"),
    [
        ({}, "Google Cloud Storage needs service_account_json"),
        ({"service_account_json": "   "}, "Google Cloud Storage needs service_account_json"),
        ({"service_account_json": "{oops"}, "not valid JSON"),
        ({"service_account_json": _key(type="authorized_user")}, "not a service account key"),
        ({"service_account_json": _key(private_key="")}, "missing its client_email or private_key"),
    ],
)
def test_a_gcs_key_is_checked_for_shape_and_never_echoed(secret, message):
    with pytest.raises(service.StorageTargetError, match=message) as e:
        service._check_secret("gcs", secret)
    assert "MIIsecret" not in str(e.value)


def test_a_well_formed_gcs_key_passes_the_shape_check():
    service._check_secret("gcs", {"service_account_json": _key()})
    service._check_secret("gcs", {"service_account_json": json.loads(_key())})


# ---------------------------------------------------------------------------
# STORAGE_PROVIDER picks the platform's own storage
# ---------------------------------------------------------------------------
def test_the_platform_stays_on_azure_by_default(monkeypatch):
    monkeypatch.setattr(storage.settings, "storage_provider", "azure_blob")
    t = storage.platform_target()
    assert t.provider == "azure_blob"
    assert set(t.secret) == {"account_name", "account_key"}


def test_the_platform_on_gcs_signs_keylessly_by_default(monkeypatch):
    monkeypatch.setattr(storage.settings, "storage_provider", "gcs")
    monkeypatch.setattr(storage.settings, "storage_gcs_bucket", "dm360-prod-files")
    monkeypatch.setattr(storage.settings, "storage_gcs_service_account_json", config.SecretStr(""))
    t = storage.platform_target()
    got = (t.provider, t.bucket, t.key_prefix, dict(t.secret))
    assert got == ("gcs", "dm360-prod-files", "", {})


def test_the_platform_on_gcs_can_carry_a_key(monkeypatch):
    monkeypatch.setattr(storage.settings, "storage_provider", "gcs")
    monkeypatch.setattr(storage.settings, "storage_gcs_bucket", "dm360-dev-files")
    key = config.SecretStr(_key())
    monkeypatch.setattr(storage.settings, "storage_gcs_service_account_json", key)
    t = storage.platform_target()
    assert t.secret == {"service_account_json": _key()}
    assert "MIIsecret" not in repr(t)


def test_gcs_without_a_bucket_refuses_to_boot():
    with pytest.raises(ValidationError, match="STORAGE_PROVIDER=gcs needs STORAGE_GCS_BUCKET"):
        config.Settings(database_url="postgresql+asyncpg://x/y", jwt_secret="x",  # type: ignore[arg-type]
                        storage_provider="gcs", storage_gcs_bucket="  ")
    ok = config.Settings(database_url="postgresql+asyncpg://x/y", jwt_secret="x",  # type: ignore[arg-type]
                         storage_provider="gcs", storage_gcs_bucket="dm360-prod-files")
    assert ok.storage_provider == "gcs"
