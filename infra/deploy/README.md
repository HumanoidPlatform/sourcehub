# Deploying to the VM

**One file.** `docker-compose.yml` goes to `~/stack/docker-compose.yml`, you
fill in six values, and you run `docker compose up -d`. There is nothing else
to copy and no separate env files.

Your `db` service in it is **identical to the one you have today** — same image,
volume, ports and password. Compose only recreates a container when its resolved
configuration changes, so the database container is never touched, never
restarts, and is never at risk. `api`, `web` and `caddy` are simply added beside it.

**The address is `https://cosarathi.eastus.cloudapp.azure.com`.** Caddy is the
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
curl -s https://cosarathi.eastus.cloudapp.azure.com/health
```

The first start takes up to a minute while Caddy obtains the certificate. If the
log shows a challenge failing, the usual causes are port 80 or 443 closed in the
Azure rules, or the DNS name not pointing at this VM. Do not restart it in a loop
while you investigate — Let's Encrypt rate-limits failed attempts.

The Azure inbound rules needed are **TCP 80 and TCP 443**. Port 80 must stay
open even though everything is served on 443: the certificate check arrives on
it, and Caddy answers everything else there with a redirect.

Five accounts still open with the password printed on the sign-in page. That was
accepted for team testing; change them before the address is given to anyone
outside the team.

**Updating:** change the two image tags, `docker compose pull`, `up -d`.
**Rolling back:** the same, with the previous tags.
**Schema changes:** the one-line `docker run … alembic upgrade head` at the bottom
of `docker-compose.yml`. The live database is at `0016`; the repository is at
`0018` (`0017` renames the operator organisation, `0018` adds
`engagement_reminder` and `engagement_orgs()` for the reminder clock). Run the
migration **before** starting an api image that carries the clock: its first
pass, thirty seconds after start-up, reads the new table and would log a
failure every five minutes until the table exists.

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
- **Laptop and VM share `appdb`.**
