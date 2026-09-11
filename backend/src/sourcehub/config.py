"""Settings. The ONLY place in the codebase that reads the environment.

Everything else takes settings as an argument or imports `settings` from here.
A module that calls os.environ directly is a bug: it becomes untestable and it
hides a deployment requirement from anyone reading config.

Reads backend/.env. Compose values live in infra/.env and browser-visible
config in frontend/.env — three files, each owned by the thing that reads it.
Vite inlines every VITE_-prefixed variable into the bundle it ships, so keeping
this file's secrets out of the frontend's is a safety boundary, not tidiness.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# The user-facing brand, in one place. Internal names (package, DB, buckets,
# storage keys) deliberately stay "sourcehub" — renaming those is a migration,
# not a rebrand.
BRAND = "Cosarathi"
BRAND_FULL = "Cosarathi Data Platform"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Database ------------------------------------------------------------
    # Points at sourcehub_app, never at postgres. A superuser bypasses RLS
    # unconditionally; see db/session.py.
    database_url: str
    database_admin_url: str | None = None  # migrations and the isolation tests
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_echo: bool = False

    # --- Redis and Celery ----------------------------------------------------
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # --- Adapters ------------------------------------------------------------
    # These three strings select an implementation in platform/. Changing
    # storage_backend to "azure_blob" is the whole of the storage migration,
    # provided nothing outside platform/ imports a vendor SDK.
    storage_backend: Literal["minio", "azure_blob"] = "minio"
    mail_backend: Literal["smtp", "azure_email"] = "smtp"
    auth_backend: Literal["database", "keycloak"] = "database"

    # Two addresses, because one setting was doing two jobs that pull apart.
    #
    #   storage_endpoint        where the API itself connects — HEAD, stat, the
    #                           destination probe. localhost is right here, and
    #                           it never changes when the machine moves network.
    #   storage_public_endpoint what gets baked into a presigned URL, because a
    #                           phone cannot resolve localhost. Only whatever
    #                           opens the link needs to reach it; the API never
    #                           does, now that signing makes no network call.
    #
    # Unset falls back to storage_endpoint, which is correct for a deployment
    # where both sides see the same address.
    storage_endpoint: str = "http://localhost:9000"
    storage_public_endpoint: str | None = None
    # Passing a region is what stops the SDK issuing a live GetBucketLocation
    # before it will sign anything — see minio/api.py:486. us-east-1 is MinIO's
    # own default and the correct value for it.
    storage_region: str = "us-east-1"
    storage_access_key: str = ""
    storage_secret_key: SecretStr = SecretStr("")
    storage_bucket_assets: str = "sourcehub-assets"
    storage_bucket_documents: str = "sourcehub-documents"
    storage_bucket_bundles: str = "sourcehub-bundles"
    storage_presign_ttl_seconds: int = 900

    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_from: str = "no-reply@sourcehub.local"

    # --- Authentication ------------------------------------------------------
    jwt_secret: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    password_hash_algo: Literal["argon2id", "bcrypt"] = "argon2id"
    login_lock_threshold: int = 5
    login_lock_minutes: int = 15
    invitation_ttl_days: int = 14
    # MFA is designed in (permission.requires_mfa) but TOTP enrolment is not
    # built yet; enforcement stays off in development so the money flows work.
    mfa_enforcement: bool = False
    # Base URL used in invitation and reset emails.
    app_base_url: str = "http://localhost:5173"

    # --- HTTP ----------------------------------------------------------------
    # Comma-separated in the env file; pydantic-settings would demand JSON for a
    # typed list, and nobody writes JSON in an .env by hand.
    cors_allowed_origins: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    # --- Observability -------------------------------------------------------
    log_level: str = "INFO"
    log_format: Literal["console", "json"] = "console"
    otel_enabled: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
