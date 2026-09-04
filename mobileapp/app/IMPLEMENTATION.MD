# Cosaarthi — End-to-End Implementation Plan

A total review of the current build and a step-by-step, multi-pass plan to take Cosaarthi from a
working prototype-parity app to a **production-grade, next-generation AI-data platform with no
gaps**. Each pass is shippable, independently verified, and leaves nothing behind.

---

## 0. Honest current-state review (measured from the repo)

| Area | State today | Verdict |
|---|---|---|
| Web breadth | 9 personas · ~60 screens · 27 record-detail types · dashboards, studios, phone UI, command palette, copilot/settings/help | **Good breadth** |
| Web depth | studios (annotation/transcription/eval) are visual, not real editors; crowd phone is simulated; no responsive/mobile; no i18n | **Shallow in places** |
| API | 11 actions + generic create/update · 383 LOC · Express | **Thin; no validation** |
| Data | SQLite document store (`records` table), not normalized; no pagination/indexes | **Prototype-grade** |
| Auth | demo `x-user` headers; RBAC only via UI hiding, **not enforced server-side** | **Not production-safe** |
| Tests | **none committed** (verification was ad-hoc scripts) | **Critical gap** |
| Real-time | none (manual reload) | Missing |
| Storage | none (no object store for media/datasets/artifacts) | Missing |
| Payments / comms / RL sim / analytics | represented in UI, not functionally integrated | Missing |
| Deploy | single Node process; SQLite; no Docker/Postgres/CI | Prototype |

**Guiding correction for this plan:** every pass ends with *committed automated tests* (unit +
Playwright E2E with content assertions), a green typecheck/build, and a short demo script.
No pass is "done" on a renders-non-blank check.

---

## 1. Target — what "next-generation, no gaps" means

- **Every persona, every screen** works to production depth with real data, real actions, real validation.
- **Real tools**, not mock-ups: annotation canvas, transcription editor, model-eval, capture.
- **Agentic copilot** that plans and *executes* multi-step actions within RBAC.
- **Real-time** collaboration and live dashboards.
- **Real money & governance**: settlement waterfall with ledgers, tax docs, DSAR erasure over real storage, audit export.
- **Secure, multi-tenant, observable, containerized, tested, documented.**

---

## 2. Definition of Done (applies to every task)

1. TypeScript strict, `tsc --noEmit` clean (server + web).
2. Server logic covered by **unit tests** (Vitest); request bodies validated (zod).
3. User-facing flow covered by a **Playwright E2E** with *content assertions* (not render-only) and a *state-mutation* assertion where applicable.
4. RBAC: the action is authorized server-side for the intended roles and rejected for others (tested).
5. `npm run build` clean; runs in the Docker image.
6. Audit event written for every state change; activity visible in the record.
7. A one-paragraph demo script added to `docs/DEMOS.md`.

---

## 3. The passes (sequenced; each ~shippable)

### Pass 0 — Engineering foundation & test harness  *(unblocks everything)*
**Goal:** stop ad-hoc verification; make the repo CI-verifiable.
- Add **Vitest** (server unit) + **Playwright** (E2E) as committed dev-deps and `web/e2e/`, `server/test/`.
- Port the assertion-style browser tests already used into committed specs; add a DB-reset fixture.
- Add **zod** validation + centralized error handler + structured logging (pino) to the API.
- `.env` config (ports, DB, secrets); `docs/` skeleton (DOD, DEMOS, ARCHITECTURE, API).
- **GitHub Actions** CI: typecheck → unit → build → E2E on every push.
**Acceptance:** `npm test` runs unit + E2E green locally and in CI; every existing action has a validation schema + unit test.
**Est:** 1 pass.

### Pass 1 — Persistence backbone
**Goal:** real data layer that scales past a prototype.
- Introduce a **repository interface**; implement typed SQLite tables for hot entities (entity, user, project, initiative, rfp, invoice, dispute, worker, dataset) with indexes + FKs; keep the document store for long-tail.
- **Migrations** (idempotent) + seed; drop the "reset on boot" hack behind a flag.
- Collection endpoints gain **pagination, filter, sort**; the web `DataTable` consumes them.
- Provide a **Postgres/Drizzle** profile behind the same repository interface (prod).
**Acceptance:** migration + seed reproducible; list endpoints paginated & filtered (tested); swap SQLite↔Postgres via env with the same tests passing.

### Pass 2 — AuthN / AuthZ / multi-tenancy
**Goal:** production-safe access.
- Real auth (password or OIDC) with sessions/JWT + refresh; replace `x-user` headers.
- **RBAC middleware** enforcing per-role, per-resource, per-tenant scope server-side.
- Entity/role lifecycle persisted: invite → KYC state machine → approve → grant/revoke roles.
- Every request access-logged.
**Acceptance:** unauthorized/cross-tenant API calls rejected (tests); UI role-switch maps to real scoped sessions; grant/revoke persists and changes reachable screens.

### Pass 3 — Demand side to production depth (Client + Builder)
- **Client:** editable 13-section SOW RFP builder (persisted, versioned) → publish → scored proposals → award → initiative with locked commercials/§6/§7 cascading into projects; deliveries acceptance with manifest hash verification → milestone invoice; payments.
- **Builder:** Data Marketplace with faceted search/filter/pagination; license → Data Hub with lineage; Ingest (upload → storage → enhancement job); GenAI Studio jobs with progress + artifacts; Billing/credits **ledger**.
**Acceptance:** E2E — publish RFP → propose (tenant) → award → project appears; license a dataset into the hub; run a GenAI job to completion producing an artifact.

### Pass 4 — Supply side to production depth (Tenant, Aggregator, Partner, Sponsor)
- **Tenant:** initiative/project lifecycle; 8-step wizard fully persisted; certification lifecycle (create→publish→holders→revoke→recert); QA queues + adjudication; safety campaigns (create → run harness sim → coverage matrix → ship-gate); supply-network tree management; delivery packaging; settlement waterfall.
- **Aggregator:** network build; comms with real send + receipts; calls (schedule → minutes → action items) ; **alert-rule engine** with SLA timers + escalation.
- **Partner:** inbox commitments; crowd roster + invite + KYC; cert management; kit requests; progress; payouts.
- **Sponsor:** inventory with serials; kit builder; agreements; custody chain; shipment status machine; earnings.
**Acceptance:** full job-work lifecycle E2E across all four roles; cross-role state ripple verified (commit → tenant/aggregator see it; escalation fires and escalates on SLA).

### Pass 5 — Crowd work surfaces as real tools  *(beyond prototype)*
- **Crowd mobile → responsive PWA:** capture flow (camera or realistic sim), device-pairing model, **offline queue + sync**, wallet ledger, KYC.
- **Annotation Studio:** real canvas — draw/move/resize boxes, polygons, keypoints; keyboard shortcuts; ontology; persist annotations to a dataset; **IAA vs gold**; consensus/review.
- **Transcription Studio:** real audio player + waveform + segment editor + timestamps; **WER vs gold** on submit.
- **Model-Eval + Red-Team Studios:** persisted SxS/rubric judgments, gold-seeding, rater metrics; cert-gated red-team authoring with encrypted payloads, adjudication, enforced wellness.
**Acceptance:** annotations persist & score; transcripts submit with WER; judgments recorded; every output posts to the worker's earnings ledger.

### Pass 6 — Agentic Copilot  *(next-gen)*
- Copilot that **plans and executes** multi-step actions through the API action layer (tool-calling), scoped by RBAC, with **confirmation gates** for side-effectful ops and a full activity trail.
- Retrieval over live platform state; NL → action.
- Pluggable LLM; deterministic stub for offline/CI.
**Acceptance:** "award RFP-2031 to the top proposal and create the Karnataka project" executes end-to-end with confirmation + audit (tested against the stub).

### Pass 7 — Real-time, notifications & comms
- **WebSocket/SSE**: live notifications, escalation feed, QA queue, dashboard tiles update without refresh.
- Notification persistence, read state, digests.
- Comms adapters: email (SMTP/provider), WhatsApp/SMS (provider), templated, with delivery receipts.
**Acceptance:** a mutation by one role appears live in another's session (tested with two clients); a notification email is delivered via the sandbox provider.

### Pass 8 — Artifacts, storage, RL & synthetic
- **Object storage** (S3-compatible / MinIO) for media, audio, datasets, model artifacts; signed URLs.
- Dataset artifacts with versioning + datasheets + export to S3/HF; **lineage graph** view.
- **RL Environments**: runnable Gymnasium-style env service (simulated FinSim), verifiers, RLVR training-run tracker, testbed report artifacts.
- Synthetic-data + pre-annotation jobs producing real artifacts routed to the hub.
**Acceptance:** upload → annotate → export a dataset artifact; run an env eval producing a downloadable report.

### Pass 9 — Money, governance, compliance, trust
- **Settlement:** country accounts, gateway **adapters** (UPI/PIX/GCash/SEPA/ACH stubs), escrow/holdback, waterfall execution with **ledger entries** to every tier, tax docs (TDS/1099) + invoice PDFs.
- **Governance:** DSAR automation with **real erasure across storage** + dataset re-versioning; consent ledger; retention jobs; EU AI Act risk register; SOC2/ISO evidence; **signed audit-export bundle**.
**Acceptance:** invoice paid → waterfall posts ledger entries to all tiers; DSAR erasure verifiably removes artifacts & re-versions the dataset; audit bundle exports and validates.

### Pass 10 — Hardening & launch
- **Responsive/mobile** for all consoles; **a11y** WCAG-AA audit + fixes; **i18n** framework + 3 locales.
- **Performance**: indexes, code-splitting, caching, load test.
- **Security**: validation everywhere, rate limiting, secrets, dependency + SAST scan, threat model.
- **Observability**: metrics, tracing, error tracking, health/readiness.
- **Deploy**: Docker Compose (web + api + Postgres + MinIO), CI/CD, staging/prod, backups.
- **Docs**: OpenAPI, SDK, runbooks, onboarding.
**Acceptance:** containerized stack stands up; load + a11y + security gates pass in CI; OpenAPI published.

---

## 4. Persona coverage matrix (so nothing is skipped)

Target depth per screen — `F` fully-functional w/ persistence & tests, `∆` deepen this pass.

| Persona | Screens (all must reach F) |
|---|---|
| Platform | Overview, Entities&Roles(∆P2), Taxonomy, Catalog, Revenue, Data Hub Gov, Marketplace Supply, Trust/DSAR(∆P9), Accounts(∆P9), Invoices/Settlements(∆P9), Audit, Disputes |
| Client | Overview, RFPs/SOW(∆P3), Initiatives, Deliveries(∆P3), Invoices(∆P3) |
| Tenant | Overview, Marketplace, Initiatives, Projects, Wizard(∆P4), Certifications(∆P4), QA(∆P4), Safety Campaigns(∆P4/P8), Supply Network(∆P4), Deliveries, Payments(∆P9), Publish, Disputes |
| Aggregator | Portfolio, Partner Network, Comms(∆P7), Calls(∆P4), Alerts/Escalations(∆P4/P7), Earnings |
| Partner | Inbox, Crowd Roster(∆P4), Certifications, Kits, Progress, Payouts |
| Sponsor | Overview, Inventory(∆P4), Kit Builder, Connections, Custody, Earnings |
| Crowd | Mobile app → PWA(∆P5): Home, Work(capture/annotate/transcribe/survey/rate), Devices, Learn, Wallet |
| Crowd IDE | Workbench, Annotation Studio(∆P5), Transcription Studio(∆P5), Model-Eval(∆P5), Red-Team(∆P5), Capture Review, Appeals, Earnings, Disputes |
| Builder | Overview, Marketplace(∆P3), Data Hub, Ingest(∆P3/P8), GenAI Studio(∆P3/P8), RL Env(∆P8), AI Workbench, Agent Workbench, Pipelines, Registry, Dev/API, Billing(∆P3/P9) |

Record-detail depth already exists for all 27 object types (Pass done); each pass keeps their tabs/actions in sync with new backend capability.

---

## 5. Cross-cutting workstreams (threaded through every pass)

- **Testing:** unit (Vitest) + E2E (Playwright, content + mutation assertions) committed per feature; coverage target ≥ 70% server logic.
- **Validation & errors:** zod on all inputs; typed error responses; user-friendly toasts.
- **Accessibility:** keyboard, ARIA, focus management, contrast (audited in P10, respected throughout).
- **Design system:** keep the indigo/violet tokens; extract shared components; Storybook (P10).
- **Docs:** ARCHITECTURE, API (OpenAPI), DEMOS updated each pass.

---

## 6. Sequencing & dependencies

```
P0 (tests/CI) ─┬─> P1 (data) ─┬─> P2 (auth/RBAC) ─┬─> P3 (demand) ─┐
               │              │                    ├─> P4 (supply) ─┼─> P6 (agentic copilot)
               │              │                    │                ├─> P7 (real-time/comms)
               │              └────────────────────┘                │
               └─> P5 (crowd tools) depends on P1 + storage(P8 early split)
P8 (storage/RL) can start after P1; needed by P5 (media) & P9 (artifacts)
P9 (money/governance) after P3+P4+P8
P10 (hardening/launch) last, but a11y/security respected throughout
```
Recommended order: **P0 → P1 → P2 → P8(storage core) → P3 → P4 → P5 → P6 → P7 → P9 → P10.**

---

## 7. Tracking checklist

- [ ] P0 Foundation & tests/CI
- [ ] P1 Persistence backbone (typed tables, migrations, pagination, Postgres profile)
- [ ] P2 Auth + RBAC + tenancy
- [ ] P3 Demand side (Client + Builder) to F
- [ ] P4 Supply side (Tenant/Aggregator/Partner/Sponsor) to F
- [ ] P5 Crowd tools real (PWA capture, annotation/transcription/eval/red-team editors)
- [ ] P6 Agentic copilot (plan + execute + confirm + audit)
- [ ] P7 Real-time + notifications + comms adapters
- [ ] P8 Object storage + dataset artifacts + RL env sim + synthetic
- [ ] P9 Settlement ledgers + tax docs + DSAR erasure + audit export
- [ ] P10 Responsive + a11y + i18n + perf + security + observability + Docker/CI-CD + docs

---

## 8. How each pass will be delivered & proven

Every pass ships as: code + committed unit/E2E tests + green CI + updated docs + a demo script,
and I will report results honestly (pass/fail counts, and anything deferred), never a
render-only "done". If a pass is too large for one increment, it is split and the checklist
above is updated — nothing is dropped.
