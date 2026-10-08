# Staging on Azure Container Apps

**Dev** is the VM (`https://datamind360.centralindia.cloudapp.azure.com`, [README.md](README.md)).
**Staging** is two Azure Container Apps on the Azure database. Staging only ever receives what has
already run on dev, and every staging change is made by hand: there is no CI.

| Piece | Name | Notes |
|---|---|---|
| Resource group, region | `CosarathiData`, Central India | holds everything below |
| Database server | `cosarathidata` | Azure Database for PostgreSQL Flexible Server, PostgreSQL 18, Burstable B2s |
| Database | `appdb` | built from `build/schema.sql` + `build/seed.sql` (see "A managed database" in README.md) |
| Storage | account `cosarathistorage`, container `staging` | beside dev's `platform` container, same account key |
| Container Apps environment | `datamind360-staging-env` | Consumption |
| Web (console + proxy) | container app `datamind360-staging` | public HTTPS; image `jitendra1472/cosarathi:web-<sha>` |
| API | container app `datamind360-staging-api` | reachable only inside the environment; image `jitendra1472/cosarathi:api-<sha>` |

Passwords and keys live in your password manager and in the container apps' **Secrets**, never in this
repository and never in a plain environment variable.

## How the two apps find each other

The browser only ever talks to the web app. Its nginx serves the console and forwards `/api/` and
`/health` to the API app, exactly as on the VM, where it forwards to the `api` container. The web image
reads where the API is from four environment variables (`frontend/docker/40-sourcehub-config.sh`).
Their defaults are the VM's, so the VM sets none. Staging sets three:

| Variable | Staging value | Why |
|---|---|---|
| `API_UPSTREAM` | `http://datamind360-staging-api.internal.<DEFAULT_DOMAIN>` | the API app's private address |
| `API_HOST_HEADER` | `datamind360-staging-api.internal.<DEFAULT_DOMAIN>` | Container Apps picks the target app from the `Host` header |
| `REAL_IP_FROM` | `0.0.0.0/0` | the platform's proxy is the only way in, so the last `X-Forwarded-For` entry is the visitor |

`<DEFAULT_DOMAIN>` is the environment's **Default domain**, shown on its Overview page, for example
`happyhill-70162bb9.centralindia.azurecontainerapps.io`. It is known as soon as the environment
exists, before either app. The API app's Ingress page shows the same full address once it is created.

**Why the full name.** nginx looks the upstream up itself and asks for the name literally. It ignores
the search suffixes in `/etc/resolv.conf` that let other programs use short names. Docker answers a
short name such as `api` directly, which is why the VM needs no setting. On Container Apps and
Kubernetes, only the fully qualified name is certain to resolve for nginx. Microsoft's
[Communicate between container apps](https://learn.microsoft.com/azure/container-apps/connect-apps)
documents the internal form `<app>.internal.<environment id>.<region>.azurecontainerapps.io`.

The fourth variable, `API_RESOLVER`, is read from the container's `/etc/resolv.conf`.

| Where | `API_UPSTREAM` | `API_HOST_HEADER` | `REAL_IP_FROM` |
|---|---|---|---|
| VM (dev) | not set, so `http://api:8000` | not set, so the browser's host | not set, so Docker's ranges |
| Container Apps (staging) | `http://datamind360-staging-api.internal.<DEFAULT_DOMAIN>` | the same name, without `http://` | `0.0.0.0/0` |
| Kubernetes (later) | `http://<api-service>.<namespace>.svc.cluster.local:8000` | not set | the ingress controller's pod range, or `0.0.0.0/0` |

## One-time setup (portal)

Before you start:
- **Images exist** for the commit: `api-<sha>` and `web-<sha>` are on Docker Hub, and the same tags
  already run on dev.
- **The database is loaded:** `appdb` is at the latest migration, and `sourcehub_app` has a password.

The steps below keep the portal's defaults wherever a value is not given.

### 1. A read-only Docker Hub token

The image repository is private, so Azure needs a login to pull it.
1. On hub.docker.com, go to **Account settings → Personal access tokens → Generate new token**.
2. Set access permissions to **Read-only**.
3. Copy the token into your password manager.

### 2. The `staging` storage container

1. In the portal, open **cosarathistorage → Data storage → Containers → + Container**.
2. Name it `staging`, with anonymous access level **Private**.

### 3. The environment

Search for **Container Apps Environments**, then **+ Create**.
- **Resource group:** `CosarathiData`.
- **Name:** `datamind360-staging-env`.
- **Region:** Central India.
- Keep the Consumption profile.
- **Monitoring:** create a new Log Analytics workspace, for example `datamind360-staging-logs`.
- **Networking:** keep the defaults. That means no virtual network, with public access enabled.

### 4. The web app (first, to learn its address)

Search for **Container Apps**, then **+ Create → Container App**.

**Basics:**

| Setting | Value |
|---|---|
| Name | `datamind360-staging` |
| Region | Central India |
| Environment | `datamind360-staging-env` |
| Deployment source | Container image |

**Container:**

| Setting | Value |
|---|---|
| Use quickstart image | untick |
| Name | `web` |
| Image source | Docker Hub or other registries, **Private** |
| Registry login server | `docker.io` |
| Registry user name | `jitendra1472` |
| Registry password | the token from step 1 |
| Image and tag | `jitendra1472/cosarathi:web-<sha>` |
| CPU and memory | 0.25 CPU, 0.5 Gi |
| Environment variable `API_UPSTREAM` | `http://datamind360-staging-api.internal.<DEFAULT_DOMAIN>` |
| Environment variable `API_HOST_HEADER` | `datamind360-staging-api.internal.<DEFAULT_DOMAIN>` |
| Environment variable `REAL_IP_FROM` | `0.0.0.0/0` |

`<DEFAULT_DOMAIN>` is the environment's Default domain from step 3. The API app doesn't exist yet,
which is fine, because its address is fixed by its name and the environment.

**Ingress:**

| Setting | Value |
|---|---|
| Ingress | Enabled |
| Traffic | **Accepting traffic from anywhere** |
| Type | HTTP |
| Target port | `80` |

Then **Review + create**.

When it is created:
1. Copy the **Application Url** from **Overview**, for example
   `https://datamind360-staging.<something>.centralindia.azurecontainerapps.io`. It is called
   `STAGING_URL` below.
2. Open **Application → Containers → Edit and deploy**, select `web`, and open **Health probes**:
   - **Liveness:** HTTP GET `/version.json`, port `80`.
   - **Readiness:** the same.
3. In the **Scale** tab, set min replicas `1` and max `1`.
4. **Create.** A new revision starts.

Until the API app exists, `/api/` answers 502. That is expected.

### 5. The API app

Create another Container App.

**Basics:** name it `datamind360-staging-api`, in the same environment and region.

**Container:**

| Setting | Value |
|---|---|
| Name | `api` |
| Image | `jitendra1472/cosarathi:api-<sha>`, same registry and login |
| CPU and memory | 0.5 CPU, 1 Gi |

Add these plain environment variables, all copied from the VM's `docker-compose.yml`:

| Name | Value |
|---|---|
| `PGSSLMODE` | `require` |
| `DB_POOL_SIZE` | `5` |
| `DB_MAX_OVERFLOW` | `5` |
| `STORAGE_ACCOUNT_NAME` | `cosarathistorage` |
| `STORAGE_CONTAINER` | `staging` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_STARTTLS` | `true` |
| `SMTP_USERNAME` | `vaieoncosarathi@gmail.com` |
| `SMTP_FROM` | `vaieoncosarathi@gmail.com` |
| `APP_BASE_URL` | `STAGING_URL` |
| `CORS_ALLOWED_ORIGINS` | `STAGING_URL` |
| `ENGAGEMENT_ENABLED` | `true` |
| `ENGAGEMENT_TICK_SECONDS` | `300` |
| `BIDDING_SWEEP_ENABLED` | `true` |
| `BIDDING_SWEEP_TICK_SECONDS` | `60` |

**Ingress:**

| Setting | Value |
|---|---|
| Ingress | Enabled |
| Traffic | **Limited to Container Apps Environment** |
| Type | HTTP |
| Target port | `8000` |

**Create.** This first revision cannot start yet, because the database address and the token secret
are still missing. That is expected. Then:

1. **Settings → Secrets → + Add.** Add four Container Apps secrets, using the helpers below:
   - `database-url`
   - `jwt-secret`
   - `storage-account-key`
   - `smtp-password`
2. **Settings → Ingress:** set **Insecure connections** to **Allowed**, then **Save**. The web app calls
   the API over plain HTTP. This is safe because nothing outside the environment can reach it.
3. **Application → Containers → Edit and deploy**, then select `api`:
   - **Environment variables:** add four with Source **Reference a secret**.

     | Name | Secret |
     |---|---|
     | `DATABASE_URL` | `database-url` |
     | `JWT_SECRET` | `jwt-secret` |
     | `STORAGE_ACCOUNT_KEY` | `storage-account-key` |
     | `SMTP_PASSWORD` | `smtp-password` |

   - **Health probes**, all HTTP GET on port `8000`:

     | Probe | Path | Settings |
     |---|---|---|
     | Liveness | `/health` | |
     | Readiness | `/ready` | |
     | Startup | `/health` | period 10 s, failure threshold 10 |

   - **Scale:** min `1`, max `1`. The reminder and deadline clocks run inside the API, so it must never
     scale to zero.
   - **Create.**

Clipboard helpers, run in PowerShell from the repository root. Each copies one value; paste it into
the secret and nothing is shown or saved:

```powershell
# database-url: built from infra/.env.azure, password URL-encoded
$e = @{}; Get-Content infra\.env.azure | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $e[$Matches[1]] = $Matches[2].Trim() } }
"postgresql+asyncpg://sourcehub_app:$([uri]::EscapeDataString($e.AZURE_PG_APP_PASSWORD))@$($e.AZURE_PG_HOST):5432/$($e.AZURE_PG_DATABASE)" | Set-Clipboard

# jwt-secret: a new random one, 32 bytes as hex. Staging must never share dev's.
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join '' | Set-Clipboard

# storage-account-key, then smtp-password: the same values dev uses, from backend\.env
(Select-String -Path backend\.env -Pattern '^STORAGE_ACCOUNT_KEY=(.*)$').Matches[0].Groups[1].Value.Trim('"') | Set-Clipboard
(Select-String -Path backend\.env -Pattern '^SMTP_PASSWORD=(.*)$').Matches[0].Groups[1].Value.Trim('"') | Set-Clipboard
```

### 6. Storage CORS for the staging address

Uploads go from the browser straight to Blob storage, so the account must allow the staging origin.
1. Open **cosarathistorage → Settings → Resource sharing (CORS) → Blob service**.
2. Keep the existing rows, and add one:

   | Setting | Value |
   |---|---|
   | Allowed origins | `STAGING_URL` |
   | Allowed methods | GET, HEAD, PUT, OPTIONS |
   | Allowed headers | `*` |
   | Exposed headers | `*` |
   | Max age | `3600` |

3. **Save.**

### 7. First sign-in

1. Open `STAGING_URL` and sign in as `admin@sourcehub.local` with the seeded password.
2. The console insists on a new password straight away. Set a strong one and store it.
3. Onboard organisations from there. Their invitation emails link to `STAGING_URL`.

**If something is off:**
- **Log stream:** open **Monitoring → Log stream** on either app. The web app prints one line at start:
  `/api/ -> http://datamind360-staging-api.internal.<DEFAULT_DOMAIN> …`.
- **Revisions:** open **Application → Revisions and replicas**. It shows whether a revision is Running
  and Healthy.
- **`/api/` answers 502:**
  - check that the API revision is healthy;
  - check that insecure connections are allowed on its ingress;
  - check the two `API_*` values on the web app. Each must be the API app's full internal name,
    exactly as its Ingress page shows it (with `http://` for `API_UPSTREAM` only). The usual cause is a
    short name: the app name alone, without `.internal.` and the domain.
- **The API answers 404 to the web app:** the `Host` sent does not match the API app's name.
  `API_HOST_HEADER` is wrong.

## Updating staging by hand

Only after the same commit has passed on dev: images on the VM, the migration on the VM database, and
the sanity checks.

1. **Does the release carry a migration?** Compare `version_num` in `appdb`'s `alembic_version` (in
   pgAdmin) with the highest file number in `backend/migrations/versions` at that commit.
2. **If it does, migrate the staging database first.** Do this as the admin, from the repository at
   that commit. Your IP must be in the server's firewall. The password is typed at a prompt, never
   stored:

   ```powershell
   cd backend
   $sec = Read-Host "Azure admin password" -AsSecureString
   $pw  = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
   $env:DATABASE_ADMIN_URL = "postgresql+asyncpg://<admin>:$([uri]::EscapeDataString($pw))@cosarathidata.postgres.database.azure.com:5432/appdb"
   $env:PGSSLMODE = "require"
   .venv\Scripts\python -c "from sourcehub.config import settings; print('target:', settings.database_admin_url.split('@')[1])"
   .venv\Scripts\python -m alembic current
   .venv\Scripts\python -m alembic upgrade head
   Remove-Item Env:DATABASE_ADMIN_URL, Env:PGSSLMODE; Remove-Variable pw, sec
   ```

   - The `target:` line must name `cosarathidata`. If it names the VM, stop.
   - Alembic's preflight refuses a login that does not own the tables.
   - **Migration 0035 drops the escrow ledger and refuses while it holds rows.** Dump the four tables
     into the release's rollback folder first, then run the upgrade with the operator flag — the API
     must be stopped for this one, because old images fail on the new schema and new ones on the old:

     ```powershell
     pg_dump --data-only -t invoice -t ledger_account -t ledger_transaction -t ledger_entry "$($env:DATABASE_ADMIN_URL -replace '\+asyncpg','')" > ledger-before-0035.sql
     .venv\Scripts\python -m alembic -x old_billing_dumped=yes upgrade head
     ```

     Everyone signs in again afterwards: the new invoice capabilities travel in the token.
   - **Migration 0036 folds `onboarding_approval` onto the request.** No flag: the latest decision of every
     request is copied onto `onboarding_request` (`decided_at`, `decided_by`, `decision_reason`) and the
     migration refuses to drop the table unless every decided request got it; the downgrade turns it back
     into one row per request. The dump below, with the audit log, is where the earlier decisions of a
     request that was returned and then decided again survive. Still not zero-downtime — old images read the dropped table on the
     onboarding pages and new ones read the new column — so it runs in the same stopped-API window as
     0035, after a `pg_dump --data-only -t onboarding_approval` into the rollback folder. A data-only
     restore of `onboarding_request` from a dump taken afterwards must first have the owner run
     `ALTER TABLE onboarding_request DISABLE TRIGGER onboarding_request_transition` (and enable it again),
     as for `invoice` and its insert trigger: the trigger refuses rows that arrive already decided.
   - **Migration 0037 drops seven unused `request` columns and folds the people and pilot columns into
     two jsonb columns** (`people_requirements`, `pilot`). No flag: it refuses to run, changing nothing,
     if a column it drops holds anything but its empty value or the old server placeholder, and the
     downgrade brings the twelve columns back. Not zero-downtime — every request read names its columns —
     so it runs in the stopped-API window with images built from the same commit, after a readable copy
     of the twelve columns goes into the rollback folder:

     ```powershell
     psql "$($env:DATABASE_ADMIN_URL -replace '\+asyncpg','')" -c "\copy (SELECT id, reference_code, geography, spec_quality, sampling_frame, people_headcount, people_training, people_experience, people_certification, residency_region, contact_user_id, proposal_requirements, pilot_quantity, pilot_due_on FROM request) TO 'request-columns-before-0037.csv' CSV HEADER"
     ```
   - Staging runs PostgreSQL 18 and dev runs 16, so a migration that does more than add things is worth
     a trial run on a `postgres:18` scratch container first.
   - Note the time before you start. Azure can restore the server to any point in its backup retention.
3. **Then the API.** Open `datamind360-staging-api → Application → Containers → Edit and deploy`, set
   the image tag to `api-<sha>`, and **Create**. Wait until the new revision is Running and Healthy.
4. **Then the web app,** the same way with `web-<sha>`.
5. **Check:**
   - `STAGING_URL/version.json` shows the new SHA;
   - you can sign in;
   - both log streams are quiet.

The same updates from the command line, if you prefer:

```powershell
az containerapp update -g CosarathiData -n datamind360-staging-api --image jitendra1472/cosarathi:api-<sha>
az containerapp update -g CosarathiData -n datamind360-staging     --image jitendra1472/cosarathi:web-<sha>
```

**Rollback:**
- **Images:** deploy the previous tag the same way. It takes about a minute.
- **The database:** use `alembic downgrade <previous>` only when that migration's downgrade is safe for
  the data it holds. Otherwise restore the server to the time you noted.

## Rotating a secret

- **The `sourcehub_app` password:** change it in pgAdmin, update the `database-url` secret, then
  restart the API revision.
- **The JWT secret:** a new value signs every staging user out.
- **The storage key or the Gmail app password:** these are shared with dev. Rotate both environments
  together.

## Moving to Kubernetes later

The same two images run unchanged. Only the wiring is Kubernetes'.

- **API:**
  - A Deployment behind a Service of type ClusterIP on port `8000`, so it is never public.
  - Its environment is exactly staging's: the plain values in a ConfigMap, and `DATABASE_URL`,
    `JWT_SECRET`, `STORAGE_ACCOUNT_KEY` and `SMTP_PASSWORD` in a Secret.
  - Probes, all on port `8000`: liveness `/health`, readiness `/ready`, startup `/health`.
  - The reminder and deadline clocks run inside every API replica. Database advisory locks keep that
    safe, but keep at least one replica running.
- **Web:**
  - A Deployment and Service on port `80`, probed on `/version.json`.
  - `API_UPSTREAM` is `http://<api-service>.<namespace>.svc.cluster.local:8000`. It must be the full
    name, because nginx ignores the cluster's search domains.
  - Leave `API_HOST_HEADER` unset: a Kubernetes Service does not route by host.
  - Set `REAL_IP_FROM` to the ingress controller's pod range. Use `0.0.0.0/0` only if nothing but the
    ingress can reach the web pods.
- **Ingress:**
  - Send the public host to the web Service.
  - Optionally add a path rule sending `/api` and `/health` straight to the API Service. The web
    container's own forwarding then simply goes unused. No image changes either way.
- **Migrations:** run `alembic upgrade head` with the API image as a one-off Job, with
  `DATABASE_ADMIN_URL` from its own Secret, before rolling the Deployments. Or run it by hand from a
  laptop, as for staging.
- **Connections:** each API replica opens up to `DB_POOL_SIZE + DB_MAX_OVERFLOW` per worker, and the
  image runs two workers. Keep replicas × 2 × 10 well under the database's `max_connections`, which is
  429 on `cosarathidata` today.

## What staging is not (yet)

- **No phone app.** The capture app talks to dev only.
- **No custom domain.** The address is Azure's own, with Azure's certificate.
- **One replica of each app, and no autoscaling.**
- **No CI.** Every change follows "Updating staging by hand" above.
