from __future__ import annotations

from pydantic import SecretStr

from sourcehub.config import settings
from sourcehub.modules.storage import service as storage_service
from sourcehub.platform import storage


def _gcs_settings(monkeypatch) -> None:
    monkeypatch.setattr(settings, "storage_provider", "gcs")
    monkeypatch.setattr(settings, "storage_gcs_bucket", "datamind360-dev-files")
    monkeypatch.setattr(settings, "storage_gcs_project", None)
    monkeypatch.setattr(settings, "storage_gcs_credentials_json", SecretStr(""))
    monkeypatch.setattr(settings, "storage_capture_prefix", "captures/")


def test_platform_target_uses_the_configured_gcs_bucket(monkeypatch):
    _gcs_settings(monkeypatch)

    target = storage.platform_target()

    assert target.provider == "gcs"
    assert target.bucket == "datamind360-dev-files"
    assert target.key_prefix == ""


def test_capture_default_maps_photos_under_the_capture_prefix(monkeypatch):
    _gcs_settings(monkeypatch)

    target = storage_service.capture_default()

    assert target.provider == "gcs"
    assert target.bucket == "datamind360-dev-files"
    assert target.key("CTR-05_TSK-06_AG-04_WKR-13_ef051366.jpg") == (
        "captures/CTR-05_TSK-06_AG-04_WKR-13_ef051366.jpg"
    )
