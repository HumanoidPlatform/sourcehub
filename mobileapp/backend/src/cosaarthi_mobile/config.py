from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "development"
    app_base_url: str = "http://127.0.0.1:8001"
    cors_allowed_origins: str = "*"

    database_url: str
    database_admin_url: str | None = None
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_echo: bool = False

    jwt_secret: SecretStr
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 30

    minio_endpoint: str = "127.0.0.1:59000"
    minio_public_endpoint: str = "127.0.0.1:59000"
    minio_secure: bool = False
    minio_public_secure: bool = False
    minio_access_key: str = "cosaarthi"
    minio_secret_key: SecretStr = SecretStr("cosaarthi_mobile_dev_password")
    minio_bucket_media: str = "cosaarthi-mobile-media"
    minio_region: str = "us-east-1"
    minio_presign_ttl_seconds: int = 900
    max_image_upload_bytes: int = 25 * 1024 * 1024

    dev_seed_email: str = "anita@crowd.in"
    dev_seed_password: SecretStr = SecretStr("Cosaarthi#2026")

    @property
    def cors_origins(self) -> list[str]:
        if self.cors_allowed_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
