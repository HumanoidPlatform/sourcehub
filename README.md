# SourceHub

A marketplace connecting clients who need real-world data — imagery, video, sensor readings, people-based field work — with delivery partners who fulfil it through their own networks of crowd aggregators, vendor businesses and equipment sponsors.

The design sources are in [docs/](docs/): `sourcehub-blueprint.html` (domain and architecture), `sourcehub-build-guide.html` (stack and RLS mechanics) and `sourcehub-app.html` (the clickable prototype, which remains **normative for state machines and design tokens**).

---

## Quick start

```bash
cp infra/.env.example    infra/.env
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env

make up          # or: docker compose -f infra/compose.yaml up -d

# the API (terminal 2)
cd backend
python -m venv .venv && .venv/Scripts/pip install -e .
.venv/Scripts/python -m uvicorn sourcehub.main:app --port 8000 --app-dir src

# the console (terminal 3)
cd frontend
npm install
npm run dev      # http://localhost:5173 — proxies /api to the API
```

First start takes a minute or two while images pull and `db/*.sql` applies.

```bash
make ps          # service status
make logs s=postgres
make psql        # psql as superuser
make down        # stop, keep data
make reset       # wipe and reapply db/*.sql
```

> `db/*.sql` runs **once**, when the volume is first created. Editing a file and restarting does nothing — use `make reset`.

### What is running

| Service | Port | Purpose |
|---|---|---|
| `postgres` | 5432 | The schema, and the tenancy boundary |
| `redis` | 6379 | Celery broker and cache |
| `minio` | 9000 / 9001 | Object storage for assets; console on 9001 |
| `mailpit` | 1025 / 8025 | Catches outbound mail — **UI at http://localhost:8025** |
| `pgadmin` | 5050 | Optional: `docker compose -f infra/compose.yaml --profile tools up -d` |

Mailpit is not optional in practice: onboarding issues an invitation token by email and the invitee sets their own password from that link.

### Seeded credentials

Local development only. Password for all: `SourceHub#2026`

| Login | Role |
|---|---|
| `admin@sourcehub.local` | Platform admin |
| `client@acme.example` | Client (CL-01) |
| `partner@northstar.example` | Delivery partner (TN-01) |
| `crowd@bengaluru.example` | Aggregator (AG-01) |
| `ops@vertex.example` | Business partner (BZ-01) |
| `ops@optigear.example` | Device sponsor (DS-01) |

---

## Repository layout

```
SourceHub/
├── backend/      Python 3.12 · FastAPI · SQLAlchemy 2.0 async · Celery
├── frontend/     React 18 · Vite · TypeScript · TanStack Query
├── db/           the SQL bootstrap — 14 files, 56 tables, 82 RLS policies
├── infra/        compose.yaml and the Azure Bicep that will replace it
├── docs/         blueprint, build guide, prototype
└── Makefile      the entire developer interface
```

### Two rules make this navigable

**1. Every backend domain module has the same small shape — files appear when needed.**

```
backend/src/sourcehub/modules/<module>/
    service.py    business rules — the ONLY public surface
    models.py     SQLAlchemy tables, private to this module
                  (absent where the module owns no ORM tables, e.g. audit)
```

Nine modules today: `identity` `onboarding` `marketplace` `delivery` `qa` `network` `ledger` `notify` `audit` — `ingest/` and the Celery `worker/` return with the media plane (milestone 3). Request/response schemas live beside their routers in `api/v1/`; capability checks are `require_capability()` in `api/deps.py`. A file earns its place by having code in it, and a module that outgrows this shape gets split, not restructured.

**2. Every frontend feature is one folder named after its backend module.**

```
frontend/src/features/<feature>/pages.tsx   the screens and their dialogs
frontend/src/shared/                        auth · rbac (can()) · status · format
frontend/src/design-system/                 tokens.css + components.css (ported
                                            verbatim) + primitives over the
                                            same class names
frontend/src/app/                           router · providers · shell · overview
```

A change spanning both halves touches two folders with one name. Screens
currently live in one `pages.tsx` per feature; they split into `components/`
when a feature outgrows a single file — the same split-don't-restructure rule
the backend modules follow.

### Boundaries are enforced, not agreed

[backend/.importlinter](backend/.importlinter) fails the build on a violation, so the layout is a lint rule rather than a convention:

```
sourcehub.api        routers, task definitions — no business rules
  ↓
sourcehub.modules    the domain
  ↓
sourcehub.platform   the adapters — the ONLY vendor-aware code
  ↓
sourcehub.db         session, base, model support
```

Two consequences worth knowing before your first PR:

- A domain module may **never** import `boto3`, `minio`, `azure`, or `smtplib`. It depends on a Protocol in `platform/`. That is what reduces the Azure migration to five adapter implementations and a connection-string change.
- `delivery/` may not import `marketplace/models`. It calls a function in `marketplace/service.py` or subscribes to an event.

### Environment files are per-area, never shared

| File | Read by | Contains |
|---|---|---|
| `infra/.env` | docker compose | Postgres/MinIO credentials, published ports |
| `backend/.env` | `config.py`, and nothing else | `DATABASE_URL`, `JWT_SECRET`, SMTP, storage keys |
| `frontend/.env` | the Vite build | `VITE_*` only |

This is a safety property. **Vite inlines every `VITE_`-prefixed variable into the JavaScript bundle it ships to the browser.** With one shared file, `JWT_SECRET` sitting two lines above a `VITE_` key is one careless prefix away from being served to every visitor. Separate files make that impossible — the frontend build never opens a file containing a secret.

---

## The database

56 tables, 82 RLS policies, applied in filename order:

| File | Contents |
|---|---|
| `000_extensions.sql` | pgcrypto, citext, pg_trgm, btree_gin; the `sourcehub_app` role |
| `001_conventions.sql` | Per-entity enums, session-context helpers, reference-code sequences |
| `010_identity.sql` | `organisation`, five profiles, `app_user`, sessions, tokens, MFA |
| `020_rbac.sql` | `permission`, `role`, `role_permission`, `user_role_grant` |
| `030_onboarding.sql` | Requests, the approval chain, invitations, the approval transaction |
| `040_marketplace.sql` | `request`, `proposal` |
| `050_delivery.sql` | `contract`, `task`, `submission`, `asset` (partitioned) |
| `060_qa.sql` | Rubrics, sampling plans, gold sets, `qa_review`, defect taxonomy |
| `070_network.sql` | `equipment`, `loan`, `crowd_worker`, `rating` |
| `080_ledger.sql` | Double-entry ledger, invoices, balance views |
| `090_notify_audit.sql` | Hash-chained `audit_event`, outbox, notifications, retention |
| `100_rls.sql` | Every policy, hand-written |
| `900_seed.sql` | Permissions, system roles, the platform org, the first admin |
| `910_seed_demo.sql` | The prototype's data — **delete before any real deployment** |

### Login and roles are data

The API checks capabilities, never role names — the prototype's own instinct (`can('rfp.create')`). Three functions do the work:

```sql
SELECT * FROM user_organisations(:user_id);          -- which orgs may I sign in to?
SELECT * FROM user_capabilities(:user_id, :org_id);  -- what may I do there?
SELECT user_requires_mfa(:user_id, :org_id);         -- do I need a second factor?
```

Adding a role is an `INSERT`. No code change.

### Every query runs inside an org context

```sql
BEGIN;
SET LOCAL app.org_id  = '<uuid>';
SET LOCAL app.user_id = '<uuid>';
SET LOCAL app.role    = 'tenant';    -- or 'platform_admin'
COMMIT;
```

`SET LOCAL` needs a transaction — which is why [db/session.py](backend/src/sourcehub/db/session.py) exposes `org_session()` and nothing else. With no context set, every protected table returns **zero rows**.

**The application connects as `sourcehub_app`, never as `postgres`.** A superuser bypasses RLS unconditionally, which would leave every policy enabled and entirely ineffective.

### Two tenancy axes

- **Account axis** — one client from another, one partner from another.
- **Network axis** — an aggregator belongs to exactly one tenant and is invisible to every other tenant, including one bidding on the same request.

Verified: TN-01 sees 7 organisations (itself + its 6 suppliers), TN-02 sees 4. Neither sees the other's network.

### Onboarding

Platform Admin onboards clients and tenants directly. A tenant *requests* an aggregator, business or sponsor, and Ops approves:

```
tenant files onboarding_request (submitted)
  → Ops queue
  → changes_requested → tenant resubmits (new approval row, same request)
  → rejected (reason required) → terminal
  → approved → ONE transaction creates organisation + profile
               + first app_user (invited, no password) + owner grant
               + invitation + approval record
```

`approve_onboarding_request()` runs with the **caller's** rights, so RLS applies inside it. A tenant calling it fails on `organisation_insert`.

---

## Verifying

```bash
# fail-closed: no context, no rows
docker compose -f infra/compose.yaml exec \
  -e PGPASSWORD=sourcehub_app_dev_password postgres \
  psql -U sourcehub_app -d sourcehub -tAc "SELECT count(*) FROM organisation;"
# -> 0

# the six-file rule holds
ls backend/src/sourcehub/modules/*/

# boundaries are actually wired up — add a cross-module model import,
# then confirm this fails
make lint
```

Run isolation checks as `sourcehub_app`. Running them as `postgres` proves nothing.

---

## The application

Backend: FastAPI over the schema, one router per module, every route inside an
org-scoped transaction (`org_session`) so RLS always applies, and the commit
lands **before** the response (`TxRoute`) so a constraint failure can never
hide behind a 2xx. Capabilities are checked by code (`require_capability`),
rows by the database.

Frontend: React 18 + Vite + TanStack Query. The prototype's CSS is ported
verbatim (`tokens.css`, `components.css`) and the React components render over
the same class names. Six personas, each with its own navigation and overview;
the status vocabulary is per-entity, matching the database enums.

Verified end to end through the API (scratch script, 26 steps, all green):

```
publish → 2 proposals → competitor isolation → award (sibling auto-rejected,
milestone invoiced into escrow) → task assigned → equipment loan approved
(over-lend refused by the stock trigger) → submit → QA fail with note →
resubmit → QA pass (both attempts kept) → deliver → client approves + rates →
invoices settle, 9% fee booked, ledger_imbalance = 0 rows → 10 audit event
kinds on the hash chain
```

And the onboarding loop: tenant request → Ops queue → approve → org + profile +
invited user + emailed invitation (Mailpit) → invitee sets password → signs in
with the right capability set. A tenant deciding its own request is refused by
RLS, not by an if-statement.

## Still deliberately out

- **The media plane** (milestone 3): uploads, checksums, transcodes, automated
  checks. Submissions carry an asset count, exactly as the prototype did.
- **TOTP enrolment**: `permission.requires_mfa` is live data and the check is
  wired (`require_mfa`), but enforcement ships off (`MFA_ENFORCEMENT=false`)
  until enrolment exists.
- **Payment rails** (milestone 4): the double-entry ledger stands in for the
  PSP; escrow is rows, not money.
- **Automated test suites**: the isolation and e2e checks ran as scripts during
  the build; porting them into `backend/tests/` is the next task.
- `db/910_seed_demo.sql` must be deleted before any deployment carrying real
  data.
