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

# The user-facing names, in one place, mirroring frontend/src/shared/brand.tsx:
# PRODUCT is this application, COMPANY is who makes it. An email says the
# product ("your DataMind360 password"); the company belongs in a footer or a
# legal notice. Internal names (package, DB, buckets, storage keys) deliberately
# stay "sourcehub" — renaming those is a migration, not a rebrand.
PRODUCT = "DataMind360"
COMPANY = "Cosarathi"

# The phone app under the name a worker sees on their own phone TODAY; it
# becomes "DataMind360 Capture" with its next release. An email must name what
# they actually have installed, so this is not derived from PRODUCT.
CAPTURE_APP = "Cosarathi Capture"


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

    # --- Engagement clock ----------------------------------------------------
    # The reminder pass (modules/engage) runs inside the API process on this
    # cadence; an advisory lock lets only one uvicorn worker run it. Off for
    # tests and for a second deployment that must not send mail.
    engagement_enabled: bool = True
    engagement_tick_seconds: int = 300

    # --- Adapters ------------------------------------------------------------
    # These strings select an implementation in platform/, and nothing outside
    # platform/ imports a vendor SDK, so swapping one is a config change rather
    # than a migration.
    #
    # There is no storage_backend. The PLATFORM's own storage — attachments,
    # sample files, method statements, QA evidence — is Azure Blob and nothing
    # else, so there is nothing to select. A client's DELIVERY DESTINATION is a
    # separate thing entirely: S3/MinIO or Azure, the client's choice, stored
    # per row in storage_target with its own credential, and never configured
    # here. Confusing the two is what this setting used to invite.
    mail_backend: Literal["smtp", "azure_email"] = "smtp"
    auth_backend: Literal["database", "keycloak"] = "database"

    storage_presign_ttl_seconds: int = 900

    # --- Azure Blob — the platform's own storage -----------------------------
    # One container holds everything the platform owns, foldered by client and
    # RFP so it can be browsed by a person:
    #
    #   platform/Acme Retail Analytics/RFP-1001/compliance/dpa.pdf
    #   platform/_staging/{org}/{uuid}/…   uploads with no parent row yet
    #
    # Endpoint is normally left unset — the account URL is derived from the
    # name. Set it only for a custom domain or an emulator, and set the public
    # one only when a device must call a different host than the API does.
    storage_account_name: str = ""
    storage_account_key: SecretStr = SecretStr("")
    storage_container: str = "platform"
    storage_endpoint_azure: str | None = None
    storage_public_endpoint_azure: str | None = None

    # A real provider needs a login and an encrypted channel; a local catcher
    # needs neither. Both are the same adapter — leaving username blank is what
    # selects the unauthenticated path, so there is no second backend to pick.
    #
    # Gmail: smtp.gmail.com:587 with STARTTLS, and an APP PASSWORD as the
    # password — a Google account password is refused, and the app password is
    # entered without its display spaces. Gmail also rewrites From: to the
    # authenticated mailbox, so smtp_from must be that address or the header is
    # silently replaced.
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_from: str = "no-reply@sourcehub.local"
    smtp_from_name: str = PRODUCT
    smtp_username: str = ""
    smtp_password: SecretStr = SecretStr("")
    # STARTTLS on 587 (the usual), implicit TLS on 465. Both off for a local
    # catcher on 1025.
    smtp_starttls: bool = False
    smtp_ssl: bool = False
    smtp_timeout_seconds: int = 20

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
