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

from pydantic import SecretStr, model_validator
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

# The company's page, linked from the footer of every e-mail
# (platform/mail/templates/base.html) under the LinkedIn mark.
LINKEDIN_URL = "https://www.linkedin.com/company/cosarathi-ai/"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Database ------------------------------------------------------------
    # Points at sourcehub_app, never at postgres or a managed server's admin
    # login: a superuser or the tables' owner is not bound by RLS, and the API
    # refuses to start through one (sourcehub.db.guard). TLS for a managed
    # server: set PGSSLMODE=require in the environment, which both the API and
    # the migration tools honour.
    database_url: str
    # The tables' owner. Migrations only (migrations/env.py checks it owns them).
    database_admin_url: str | None = None
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_echo: bool = False
    # False behind a transaction-mode pooler (Azure's built-in PgBouncer on port
    # 6432, Supabase, Neon), which hands each transaction to whichever server
    # connection is free: a statement prepared on one is missing on the next.
    # Migrations never go through a pooler; DATABASE_ADMIN_URL stays on 5432.
    db_prepared_statements: bool = True

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

    # --- Bidding-deadline sweep ---------------------------------------------
    # The pass (modules/marketplace/sweep) that tells a client its bidding
    # window has closed, tells the bidders, and reminds the rest a day before.
    # Its own switch, not the engagement clock's: it sends no mail, so the
    # reason for turning that one off does not apply, and a minute is the
    # right cadence for a deadline where five is right for a nudge.
    bidding_sweep_enabled: bool = True
    bidding_sweep_tick_seconds: int = 60

    # --- Catalogue copy sweep -----------------------------------------------
    # The pass (modules/catalogue/sweep) that copies relisted captures out of
    # a client's bucket into platform storage. Its own switch: it reads client
    # storage and writes the platform's, which a laptop pointed at a shared
    # database should not do on its own.
    catalogue_copy_enabled: bool = True
    catalogue_copy_tick_seconds: int = 60
    catalogue_copy_batch: int = 20

    # --- Mail outbox ---------------------------------------------------------
    # The pass (modules/outbox) that sends every e-mail the platform writes:
    # resets, invitations, task offers, reminders, DataHub replies, and the RFP
    # mails to every active partner. Rows are written in the deciding
    # transaction (db/470, db/480) and sent after it commits, as push does for
    # phones. Its own switch: on a laptop whose DATABASE_URL is a shared
    # database it would mail real people. Five seconds, because a person is
    # waiting for a reset or an invitation. Addresses on reserved domains
    # (.example, .test, .invalid, .localhost, .local) are marked failed rather
    # than handed to a real provider; a local catcher wants them, so the laptop
    # env turns that skip off. Retention: sent rows are purged after 30 days,
    # failed ones after 90, once an hour.
    mail_outbox_enabled: bool = True
    mail_outbox_tick_seconds: int = 5
    mail_outbox_batch: int = 50
    mail_outbox_skip_reserved_domains: bool = True
    mail_outbox_keep_sent_days: int = 30
    mail_outbox_keep_failed_days: int = 90

    # --- Push dispatcher -----------------------------------------------------
    # The pass (modules/push) that sends a worker's bell rows to their phone
    # through the Expo push service, after the transaction that wrote them has
    # committed. Its own switch: on a laptop whose DATABASE_URL is a shared
    # database it would light up real workers' phones. Seconds, not minutes:
    # a push is only useful while the news is fresh.
    push_enabled: bool = True
    push_tick_seconds: int = 5
    expo_push_url: str = "https://exp.host/--/api/v2/push/send"
    # Required once "enhanced push security" is on in the Expo project, which
    # it should be: without it anyone holding a token can push to that phone.
    expo_access_token: SecretStr = SecretStr("")

    # --- Adapters ------------------------------------------------------------
    # These strings select an implementation in platform/, and nothing outside
    # platform/ imports a vendor SDK, so swapping one is a config change rather
    # than a migration.
    #
    # The PLATFORM's own storage — attachments, sample files, method
    # statements, QA evidence, logos — is one bucket or container chosen by
    # storage_provider below. A client's DELIVERY DESTINATION is a separate
    # thing entirely: S3/MinIO, Azure or Google Cloud Storage, the client's
    # choice, stored per row in storage_target with its own credential, and
    # never configured here.
    mail_backend: Literal["smtp", "azure_email"] = "smtp"
    auth_backend: Literal["database", "keycloak"] = "database"

    storage_presign_ttl_seconds: int = 900

    # Where the platform's own files live. Objects carry no provider stamp, so
    # changing this on a deployment that already holds files strands them —
    # pick it when an environment is built and leave it. Azure Blob (or Azurite
    # on a laptop) is the default; Google Cloud deployments use "gcs".
    storage_provider: Literal["azure_blob", "gcs"] = "azure_blob"

    # --- Google Cloud Storage — the platform's own storage on GCP -----------
    # The bucket holds the same layout as the Azure container. With no key
    # set, URLs are signed keylessly by the VM's service account through IAM
    # signBlob (it needs Service Account Token Creator on itself); a key is
    # for running the platform on GCS from anywhere else.
    storage_gcs_bucket: str = ""
    storage_gcs_service_account_json: SecretStr = SecretStr("")

    # --- Azure Blob — the platform's own storage when storage_provider is
    # azure_blob (the default, and Azurite on a laptop) ------------------------
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

    @model_validator(mode="after")
    def _platform_storage_is_complete(self) -> Settings:
        # Fail at boot, not on the first upload a client makes.
        if self.storage_provider == "gcs" and not self.storage_gcs_bucket.strip():
            raise ValueError("STORAGE_PROVIDER=gcs needs STORAGE_GCS_BUCKET.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
