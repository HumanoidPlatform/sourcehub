# Pilot handoff: the field half (workers, captures, the phone app)

Read this after cloning. It says what this push adds on top of the previous
one (`399af65`, "Ui related and profile changes"), what changed in the
database and whether your local database picks it up by itself, how to run
everything, and how to test the phone app.

The short version: **a fresh clone gets the full database automatically**;
**an existing clone must rebuild its database volume once**; the phone app is
a new folder (`mobile/`) with its own `npm install`.

---

## 1. What this push adds, compared to the previous one

| Area | Before (`399af65`) | Now |
|---|---|---|
| Crowd workers | roster rows with no login | real users with a `worker` role, invited by email from the roster, signing in to the phone app |
| Task breakdown | a task assigned to an aggregator organisation only | the aggregator splits a task among workers (`task_assignment`), with a countable target ("5 photos") |
| Captures | `asset` table existed in SQL with no code; suppliers typed an asset count | the phone uploads straight to MinIO on a presigned URL; the API confirms and records the manifest; counts are derived |
| QA | gate 2 (delivery partner) only | gate 1 (the aggregator reviews each worker's batch) plus gate 2; the task submission bundles accepted captures |
| Console | tasks, roster, gate-2 queue | invite workers, Workers dialog (assign, progress, gate 1), Review page, "Submit to partner", capture galleries on task detail, the QA dialog and the client's delivery drawer |
| Phone app | none | `mobile/`: Expo React Native app (sign in, assignments, camera, offline outbox, upload loop, submit) |
| Tests | 26-step e2e script | 57-step e2e script covering the worker flow and worker isolation; app unit tests (23) |

Size of the change: 24 files modified (about 1,800 lines added), 77 new files
(most of them the `mobile/` app).

### New and changed files worth knowing

```
db/120_workers_media.sql          the schema change (tables, columns, policies, functions)
db/905_seed_workers.sql           the worker role and six new capabilities
backend/migrations/versions/0003_workers_media.py   record of the same SQL (Alembic does not run yet)
backend/src/sourcehub/modules/media/               NEW module: presign, confirm, list, view URL
backend/src/sourcehub/api/v1/media.py              its router
backend/src/sourcehub/modules/delivery/service.py  assignments, bundling into submissions
backend/src/sourcehub/modules/network/service.py   invite_worker, resend, roster with login state
backend/src/sourcehub/modules/qa/service.py        gate 1 (decide_gate1, gate1_queue)
backend/src/sourcehub/platform/storage/minio_store.py  head(), inline view URLs
backend/tests/e2e_loop.py         extended end to end
backend/tests/pilot_seed.py       NEW: one command to seed a request, task, worker and assignment
frontend/src/features/delivery/components/AssetGallery.tsx   NEW
frontend/src/features/delivery/components/assignments.tsx    NEW
frontend/src/features/qa/pages.tsx                Gate1Page added
mobile/                           NEW: the worker app
README.md                         updated: database table, field-half section, phone setup
```

### New API endpoints

| Endpoint | Who | Purpose |
|---|---|---|
| `POST /network/workers` (with `email`) | aggregator | invite a worker; `POST /network/workers/{id}/resend-invitation` |
| `POST /tasks/{id}/assignments`, `GET /tasks/{id}/assignments` | aggregator (tenant reads) | split a task among workers |
| `GET /me/assignments` | worker | the phone's board |
| `POST /assignments/{id}/start`, `/submit` | worker | lifecycle |
| `POST /assignments/{id}/decide`, `/cancel`, `/reopen` | aggregator | gate 1 and control |
| `GET /qa/gate1` | aggregator | the gate-1 queue |
| `POST /assignments/{id}/assets/presign`, `POST /assets/{id}/confirm` | worker | the upload handshake |
| `GET /assignments/{id}/assets`, `GET /tasks/{id}/assets`, `GET /assets/{id}/url` | anyone the row is visible to | galleries |

`POST /tasks/{id}/submit` no longer requires `asset_count` when the task has
worker assignments; the count is derived from accepted captures. Tasks accept
`target_quantity`, `target_unit`, `instructions` and `capture_spec`.

---

## 2. Database changes, and whether they apply automatically

### What changed

- **New table** `task_assignment` (one worker's share of a task) and enum
  `assignment_status`.
- **New columns**: `task.target_quantity`, `target_unit`, `instructions`,
  `capture_spec`; `crowd_worker.user_id`, `email`, `phone`;
  `asset.task_id`, `assignment_id`, `captured_by_user_id`, `supplier_org_id`,
  `contract_id`, `uploaded_at` (and `asset.submission_id` is now nullable);
  `qa_review.assignment_id` (one of `submission_id` / `assignment_id`).
- **New enum value** `asset_status = 'uploaded'` (reserved, not written yet).
- **Policies**: the `asset` policies are replaced with column compares; 25
  RESTRICTIVE policies narrow a `worker` session to its own rows; RLS is
  forced on the `asset` and `audit_event` partitions.
- **Functions**: `is_worker()`, `worker_holds_assignment()`,
  `invite_worker()`; `write_audit_event()` now takes an advisory lock so
  concurrent commits cannot fork the hash chain.
- **Seed**: role `worker`; permissions `assignment.read`, `assignment.start`,
  `assignment.submit`, `asset.upload` (worker) and `assignment.assign`,
  `qa.review.gate1` (aggregator, business).

Totals now: 52 tables, 120 policies.

### Does it apply by itself?

The database is built from `db/*.sql` **once, when the Postgres volume is
first created** by Docker. Nothing else applies schema: the API does not run
migrations, and Alembic's environment is still a stub (the `0003` file is a
record for later).

- **Fresh clone, first `docker compose up`**: yes. Every file in `db/`,
  including `120_workers_media.sql` and `905_seed_workers.sql`, runs in
  filename order, and `910_seed_demo.sql` loads the demo organisations and
  users. Nothing to do.
- **You already ran the previous push on this machine**: no. Your volume was
  created before these files existed, and Docker will not re-run them.
  Rebuild it once (this **deletes local data**; it is all demo data):

  ```bash
  docker compose -f infra/compose.yaml down -v
  docker compose -f infra/compose.yaml up -d
  ```

  or `make reset` if you have `make`.

Check it took:

```bash
docker compose -f infra/compose.yaml exec postgres psql -U postgres -d sourcehub -c "select code from role where code='worker';"
```

One row means the new schema is in place. Zero rows means the old volume is
still there; run the rebuild above.

---

## 3. Running it locally

Prerequisites: Docker Desktop, Python 3.12, Node 20 or newer.

```bash
git clone <repo> && cd SourceHub
cp infra/.env.example    infra/.env
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env

docker compose -f infra/compose.yaml up -d      # Postgres (builds the schema), Redis, MinIO, Mailpit

cd backend
python -m venv .venv
.venv/Scripts/pip install -e .                   # Windows; on macOS/Linux: .venv/bin/pip
.venv/Scripts/python -m uvicorn sourcehub.main:app --port 8000 --app-dir src

# second terminal
cd frontend
npm install
npm run dev                                      # console at http://localhost:5173
```

Sign in with any demo account; the password for all of them is
`SourceHub#2026`:

| Login | Role |
|---|---|
| `client@acme.example` | client |
| `partner@northstar.example` | delivery partner (tenant) |
| `crowd@bengaluru.example` | aggregator |
| `admin@sourcehub.local` | platform admin |

Mailpit at http://localhost:8025 catches every email, including worker
invitations. MinIO's console is at http://localhost:9001 (`sourcehub` /
`sourcehub_dev_password`); captures land in the bucket `sourcehub-assets`.

### Prove it works in 30 seconds

```bash
cd backend
.venv/Scripts/python tests/e2e_loop.py           # 57 steps, all must pass
```

This drives the whole flow through the API: publish, bid, award, assign,
invite a worker, upload two captures to MinIO, gate 1, bundle, gate 2,
deliver, approve, ledger. It needs the stack and the API running.

To get a ready-made assignment for a phone (or for poking the API by hand):

```bash
.venv/Scripts/python tests/pilot_seed.py         # prints a worker email; password SourceHub#2026
```

---

## 4. The phone app (`mobile/`)

It is a separate project with its own dependencies:

```bash
cd mobile
npm install
npm run typecheck && npm test                    # 23 tests
```

To run it on a phone, the phone must reach **your PC's** API and MinIO. Two
settings carry your machine's Wi-Fi address (find it with `ipconfig` or
`ifconfig`):

1. `backend/.env`: `STORAGE_ENDPOINT=http://<your-wifi-ip>:9000`, then restart
   the API with `--host 0.0.0.0`. Presigned upload URLs embed and sign this
   host, so `localhost` can never work from a phone.
2. `mobile/.env` (copy from `mobile/.env.example`):
   `EXPO_PUBLIC_API_URL=http://<your-wifi-ip>:8000`.

Then:

```bash
cd mobile
npx expo start                                   # prints a QR code
```

- **Android**: install *Expo Go* from the Play Store and scan the QR.
- **iPhone**: install *Expo Go*, run `npx expo login` on the PC and sign in to
  Expo Go with the same (free) account, then the project appears under
  *Development servers*. Apple requires this pairing.
- **Windows firewall**: allow inbound TCP 8000, 9000 and 8081 (an admin
  PowerShell: `netsh advfirewall firewall add rule name="SourceHub 8000" dir=in action=allow protocol=TCP localport=8000`, and the same for 9000 and 8081).
  A quick check from the phone's browser: `http://<your-wifi-ip>:8000/health`
  must answer before the app will.

Sign in on the phone with the worker that `pilot_seed.py` printed, or invite
one from the console's Crowd roster (the invitation lands in Mailpit; open
the link on the PC to set the password). The full step-by-step phone test is
in `README.md` under "Running the pilot with a phone", and `mobile/README.md`
explains how uploads work.

---

## 5. Known limitations in this push

- Ingest is synchronous: the API confirms an upload by asking MinIO for size
  and etag. No checksum verification, malware scan, thumbnails or automated
  checks yet; that is the Celery worker pool, still to come.
- No push notifications; the app polls every 30 seconds and on foreground.
- Uploads run only while the app is open; leaving it pauses them. Uninstalling
  the app deletes captures not yet uploaded (Settings shows how many).
- Alembic does not run (`migrations/env.py` is a stub); `db/*.sql` is the
  only way schema reaches a database, which is why an existing volume must be
  rebuilt.
- The console has no ESLint config (`npm run lint` fails); `npm run typecheck`
  and `npm run build` are the checks that matter.
- Not committed on purpose: `backend/.env`, `mobile/.env`, `frontend/.env`
  (all git-ignored). Each teammate creates their own from the `.example` files.
