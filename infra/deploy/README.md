# Deploying to the VM

**One file.** `docker-compose.yml` goes to `~/stack/docker-compose.yml`, you
fill in six values, and you run `docker compose up -d`. There is nothing else
to copy and no separate env files.

Your `db` service in it is **identical to the one you have today** — same image,
volume, ports and password. Compose only recreates a container when its resolved
configuration changes, so the database container is never touched, never
restarts, and is never at risk. `api` and `web` are simply added beside it.

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

docker login                              # read-only access token, not your password
docker compose pull
docker compose up -d
docker compose ps                         # api and web created; db untouched
curl -s localhost/health
```

Then add the Azure inbound rule for **TCP 80**, with Source set to **My IP
address** rather than Any — five accounts still open with the password printed
on the sign-in page, so the port rule is what contains that.

**Updating:** change the two image tags, `docker compose pull`, `up -d`.
**Rolling back:** the same, with the previous tags.
**Schema changes:** `docker compose run --rm migrate` — a verified no-op today.

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

## Known, and deliberate

- **Plain HTTP.** Passwords and tokens travel unencrypted.
- **The crowd worker's browser upload does not work.** Browsers withhold
  `crypto.subtle` from non-HTTPS origins and the hashing code has no fallback,
  so the worker picks files and nothing happens, with no error shown. The phone
  app is unaffected (it is native); client and partner document uploads are
  unaffected (they do not hash). HTTPS fixes this at the root.
- **Five accounts keep the published demo password**, including the platform
  admin. The scoped port rule above is what contains it.
- **`/docs` is public** on the API.
- **Laptop and VM share `appdb`.**
