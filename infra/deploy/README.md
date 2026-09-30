# Deploying to the VM

**One file.** `docker-compose.yml` goes to `~/stack/docker-compose.yml`, you
fill in six values, and you run `docker compose up -d`. There is nothing else
to copy and no separate env files.

Your `db` service in it is **identical to the one you have today** — same image,
volume, ports and password. Compose only recreates a container when its resolved
configuration changes, so the database container is never touched, never
restarts, and is never at risk. `api`, `web` and `caddy` are simply added beside it.

**The address is `https://datamind360.centralindia.cloudapp.azure.com`.** Caddy is the
front door: it gets and renews the certificate by itself, redirects `http://` to
`https://`, and forwards to `web`. Neither `web` nor `api` publishes a port.

## Build and push (on the laptop)

```powershell
$SHA = git rev-parse --short HEAD

docker build -f backend/Dockerfile  --target prod --build-arg BUILD_VERSION=$SHA -t <acct>/cosarathi:api-$SHA .
docker build -f frontend/Dockerfile --target prod --build-arg BUILD_VERSION=$SHA -t <acct>/cosarathi:web-$SHA frontend

docker login          # create the repository PRIVATE — the API image holds your source
docker push <acct>/cosarathi:api-$SHA
docker push <acct>/cosarathi:web-$SHA
```

The last word on each build line is the build context, and they differ on
purpose: `.` for the API because it needs `migrations/`, `frontend` for the
console. Both images live in one repository, told apart by the `api-` and
`web-` tags.

## Deploy (on the VM)

```sh
cd ~/stack
docker compose exec -T db pg_dump -U azureuser appdb | gzip > ~/appdb-before-deploy.sql.gz   # do not skip
cp docker-compose.yml docker-compose.yml.bak

# put the new file in place, then fill in the six CHANGEME values:
#   CHANGEME_ACCOUNT and CHANGEME_TAG   the image tags you just pushed (3 places)
#   CHANGEME_DB_PASSWORD               copy from docker-compose.yml.bak, unchanged
#   CHANGEME_DB_PASSWORD_URLENCODED    the same, with @ written as %40
#   CHANGEME_STORAGE_KEY               STORAGE_ACCOUNT_KEY from backend/.env
#   CHANGEME_SMTP_PASSWORD             SMTP_PASSWORD from backend/.env
#   CHANGEME_JWT_SECRET                openssl rand -hex 32

grep CHANGEME docker-compose.yml          # only the two lines in the comments should remain
docker compose config --quiet && echo OK  # catches a missed value before anything runs

sudo mkdir -p /opt/stack/data/caddy/data /opt/stack/data/caddy/config   # the certificate lives here

docker login                              # read-only access token, not your password
docker compose pull
docker compose up -d
docker compose ps                         # api, web, caddy up; db untouched
docker compose logs --tail 30 caddy       # look for "certificate obtained successfully"
curl -s https://datamind360.centralindia.cloudapp.azure.com/health
```

The first start takes up to a minute while Caddy obtains the certificate. If the
log shows a challenge failing, the usual causes are port 80 or 443 closed in the
Azure rules, or the DNS name not pointing at this VM. Do not restart it in a loop
while you investigate — Let's Encrypt rate-limits failed attempts.

The Azure inbound rules needed are **TCP 80 and TCP 443**. Port 80 must stay
open even though everything is served on 443: the certificate check arrives on
it, and Caddy answers everything else there with a redirect.

**The storage account needs a CORS rule for the console's origin** — every upload
(logos, RFP and proposal documents, task instructions, captures) goes from the
browser straight to Blob storage, and without the rule each one fails as
"Failed to fetch". On `cosarathistorage` → Blob service → Resource sharing
(CORS): allowed origin `https://datamind360.centralindia.cloudapp.azure.com`,
methods `GET, HEAD, PUT, OPTIONS`, allowed and exposed headers `*`, max age
`3600` (the rules for the dev origins and the old East US host sit beside it).
A new hostname means a new rule; the symptom is the same every time.

Five accounts still open with the password printed on the sign-in page. That was
accepted for team testing; change them before the address is given to anyone
outside the team.

**Updating:** change the two image tags, `docker compose pull`, `up -d`.
**Rolling back:** the same, with the previous tags.
**Schema changes:** the one-line `docker run … alembic upgrade head` at the bottom
of `docker-compose.yml`.

**Do not take a schema version from this file.** It has been wrong twice, and the
chain moves faster than the prose. Read both ends yourself. What the database is
at:

```sh
docker compose exec -T db psql -U azureuser -d appdb -c "select version_num from alembic_version;"
```

and what the image you are about to deploy carries:

```sh
docker run --rm <the new api image> alembic heads
```

Different answers mean there is a migration to run.
`backend/tests/test_migration_chain_unit.py` guards the chain between them against
gaps and against two revisions claiming the same id — which has happened, and which
Alembic cannot even report properly when it does.

Order matters, and not in the obvious direction. A revision that only adds things
leaves the image currently serving unaffected — but the new image generally
**requires** what it adds, so the migration goes first. And those revisions exist
only *inside the new image*: the build serving now has never heard of them, so it
cannot run them. Hence the sequence — push the images, migrate from a one-off
container **of the new image**, then swap the tags.

To go back: `alembic downgrade` to the version you read at the start, then restore
the previous image tags. Where a downgrade has to undo a value the application
wrote, it does that before dropping the column the value lived in, so nothing is
left pointing at something that has gone.

Restarting `api` also restarts the engagement reminder clock —
`ENGAGEMENT_ENABLED` is `"true"` here (line 116) — and its first pass runs thirty
seconds after start-up and mails **real** crowd resources. Long-standing
behaviour rather than anything new, but it is a reason not to deploy in the
minutes before a demo.

## A managed database: Azure, AWS, Google

The VM's database runs everything as a superuser. A managed server (Azure
Database for PostgreSQL Flexible Server, AWS RDS, Google Cloud SQL) gives you an
admin login that is **not** a superuser, and the schema is built to work there
from `db/270_managed_postgres.sql` on. `sh infra/verify_owner_model.sh` proves
it on a laptop before you touch a real server.

**Two logins, never more.**

| Login | Used by | Can |
|---|---|---|
| the provider's admin (the one you created with the server) | applying the schema, every migration | owns every table; row-level security does not bind it |
| `sourcehub_app` | the API, and nothing else | read and write rows; row-level security checks it on every query |

The API refuses to start through the admin (or any superuser or `BYPASSRLS`
login), and Alembic refuses to migrate through anything but the owner. `GET
/ready` on the API names the problem if the login is wrong.

**Once, on a new server.**

1. In the provider's console: allow the extensions PGCRYPTO, CITEXT, PG_TRGM and
   BTREE_GIN (Azure: server parameter `azure.extensions`); add your IP to the
   firewall; keep "require secure connection" on; leave PgBouncer off for now.
   Set backup retention to at least 14 days.
2. In pgAdmin or DBeaver, as the admin, with SSL mode `require`: create the
   database `appdb` (owner: the admin), connect to it, and run
   `infra/db/managed_setup.sql` (DBeaver: Execute SQL Script, Alt+X). The last
   two result grids should show `sourcehub_app` able to sign in,
   `sourcehub_readonly` not, and the four extensions.
3. Give `sourcehub_app` a password (pgAdmin: Login/Group Roles → sourcehub_app →
   Properties → Definition). Keep it and the admin password in a password
   manager, never in this repository.
4. Load the schema **as the admin**, with psql, one statement at a time. Build
   the two files first (Git Bash: `sh infra/bundle_schema.sh`, or `make bundle`).
   The local Postgres container has psql 16, and it prompts for the password:

   ```powershell
   docker cp build/schema.sql sourcehub-postgres:/tmp/schema.sql
   docker cp build/seed.sql   sourcehub-postgres:/tmp/seed.sql
   $DB = "host=<server>.postgres.database.azure.com port=5432 dbname=appdb user=<admin> sslmode=require"
   docker exec -it sourcehub-postgres psql $DB -v ON_ERROR_STOP=1 -f /tmp/schema.sql
   docker exec -it sourcehub-postgres psql $DB -v ON_ERROR_STOP=1 -f /tmp/seed.sql
   ```

   Never apply `db/910_seed_demo.sql` or `infra/seed_identity.sql` to a real
   database.
5. Record the schema version, from the same commit as the images, with the
   admin's URL (a `@` in the password is written `%40`):

   ```powershell
   cd backend
   $env:PGSSLMODE = "require"
   $env:DATABASE_ADMIN_URL = "postgresql+asyncpg://<admin>:<password>@<server>.postgres.database.azure.com:5432/appdb"
   $env:DATABASE_URL = $env:DATABASE_ADMIN_URL; $env:JWT_SECRET = "unused"   # the config layer insists
   .venv\Scripts\python -m alembic stamp head
   Remove-Item Env:DATABASE_ADMIN_URL, Env:DATABASE_URL, Env:JWT_SECRET, Env:PGSSLMODE
   ```

6. Sign in to the console as `admin@sourcehub.local` and change its password
   straight away.

**The API's settings.** `DATABASE_URL` names `sourcehub_app`;
`DATABASE_ADMIN_URL` names the admin (migrations only); `PGSSLMODE=require` in
the environment gives both TLS. `ENGAGEMENT_ENABLED` stays `false` until this is
the only live instance, or the reminder pass mails real crowd resources from
two places. Give the instance its own storage container in `STORAGE_CONTAINER`,
and add its web address to the storage account's CORS rule.

**Later.**

- **Upgrades** run `alembic upgrade head` as the admin, before the new images
  take traffic, exactly as on the VM.
- **More traffic:** turn on the built-in PgBouncer, point `DATABASE_URL` at port
  6432 and set `DB_PREPARED_STATEMENTS=false`. `DATABASE_ADMIN_URL` stays on
  5432.
- **Another provider:** the same six steps in its console. Only step 1 differs.
- **Moving data between providers:** `pg_dump -Fc --no-owner` (keep the
  privileges), then `pg_restore --no-owner` as the new admin, after steps 1–3.
  The dump holds client storage credentials in plain text: delete it afterwards.

**The VM and migration 0030.** 0030 is the migration behind all of this. On the
VM it changes nothing anyone can see (its owner is a superuser, which FORCE
never bound), and it fixes two things that would bite there too: reference
codes past 99 (the 100th crowd resource could not be invited) and the
partitions that ran out on 2027-01-01. Apply it with the usual one-liner.

## Keep secrets out of the repo

The copy on the VM holds real passwords. **The copy in this repository must keep
its CHANGEME markers** — the repo has a GitHub remote and 5432 answers from the
public internet. Edit on the VM, never here.

A `$` in any value must be written `$$`, or compose eats it and the value is
silently truncated. Nothing in today's values contains one.

## What was tested before this was handed over

Run locally against a Postgres started from the *old* file, then upgraded with
this one — the same sequence the VM will go through:

- **The database container was not recreated.** Same container id, restart
  count 0, and a marker row written beforehand was still there. Only `api` and
  `web` were created.
- Sign-in works **through nginx**, with the API connecting as `sourcehub_app`,
  so row-level security is active. The console and `/health` answer on port 80.
- The API is genuinely unpublished — only `web` has a host port.
- Every inline setting arrives intact: the 88-character storage key and the
  64-character JWT secret are not truncated, and `SMTP_PORT`/`SMTP_STARTTLS`
  override the defaults correctly.
- `migrate` against the real VM database: **no-op, exit 0**. (An earlier draft
  failed here — the service was missing two settings `config.py` requires
  before it will load at all. Fixed and re-tested.)
- A caller **cannot forge the address recorded against a sign-in**: nginx
  asserts the real peer. Before that fix a request carrying
  `X-Forwarded-For: 203.0.113.77` was recorded from that address, and a non-IP
  value returned 500 from the login endpoint.
- **The same holds with Caddy in front.** Run locally as Caddy → nginx → API:
  a sign-in is recorded from the real caller, not from Caddy's container
  address; the forged header is ignored; the malformed one returns 401. This
  depends on the `set_real_ip_from` lines in `frontend/nginx.conf` — without
  them every sign-in would be recorded from Caddy. What could not be tested
  locally is the certificate itself: that only happens on the VM, with the real
  name.

## Known, and deliberate

- **`web` must never be published directly again.** `frontend/nginx.conf` now
  trusts `X-Forwarded-For` from the private Docker ranges, which is safe only
  while Caddy is the sole thing that can reach it.
- **Five accounts keep the published demo password**, including the platform
  admin. The scoped port rule above is what contains it.
- **`/docs` is public** on the API.
- **The laptop can no longer reach `appdb`.** It could once. The VM has moved to
  `20.204.106.170` and its 5432 is deliberately unpublished, so development runs
  against the local compose database instead and `backend/.env` still names a dead
  address. To reach the live database, go through the VM:
  `docker compose exec -T db psql -U azureuser -d appdb`.
