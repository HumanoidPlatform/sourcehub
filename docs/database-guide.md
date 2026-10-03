# The database and storage layer — as built

*Written 20 September 2026 from the code, not from the design. The original design is
[sourcehub-schema.html](sourcehub-schema.html); it predates storage destinations, attachments, field workers and
task offers, so where the two differ, this file describes what the code does today.*

**Read this if** you are new to the project and the number of tables looks alarming. It answers four questions:
what is each table for, which ones are actually used, how does a job move through them, and what stops a user
doing something they should not.

Contents: [1 The short answer](#1-the-short-answer) · [2 The map](#2-the-map--eight-groups) ·
[3 One job, start to finish](#3-one-job-start-to-finish) · [4 Status values and who may change them](#4-status-values-and-who-may-change-them) ·
[5 How the flow is controlled](#5-how-the-flow-is-controlled--four-layers) · [6 The storage layer](#6-the-storage-layer) ·
[7 Known gaps](#7-known-gaps) · [8 Tables that were removed](#8-tables-that-were-removed)

---

## 1. The short answer

There are **41 tables** (plus `alembic_version`, which is migration bookkeeping), and **every one is in
use**: backend code reads or writes it. Each holds a different real-world thing — a company, a person, a bid,
a contract, a photo, a payment — and merging them would make the access rules harder, not simpler.

It was not always so. The original blueprint created fifteen tables ahead of the features they were for.
Two of them (`defect_code`, `qa_review_defect`) have since come into use; the other thirteen were still empty
on 3 October 2026 and [`290_dormant_objects.sql`](../db/290_dormant_objects.sql) dropped them, as
[`280_organisation_profile.sql`](../db/280_organisation_profile.sql) had folded the five per-kind profile
tables into `organisation` just before. [Section 8](#8-tables-that-were-removed) says what they were.

Where things are defined:

| What | Where |
|---|---|
| Tables, types, functions, policies | [`db/*.sql`](../db/), numbered in load order |
| The same SQL as migrations, verbatim | [`backend/migrations/versions/`](../backend/migrations/versions/) |
| ORM models | `backend/src/sourcehub/modules/<module>/models.py` |
| Everything that changes a row | `backend/src/sourcehub/modules/<module>/service.py` |
| Session and tenancy plumbing | [`backend/src/sourcehub/db/session.py`](../backend/src/sourcehub/db/session.py), [`api/deps.py`](../backend/src/sourcehub/api/deps.py) |
| Object storage adapters | [`backend/src/sourcehub/platform/storage/`](../backend/src/sourcehub/platform/storage/) |
| ER diagram (draw.io + DBML) | `make erd` → `build/erd/`, generated from `db/*.sql` by [`infra/erd.py`](../infra/erd.py); open the `.drawio` in draw.io, paste the `.dbml` into dbdiagram.io |

House rule: a schema change is written **twice, word for word** — once in a `db/NNN_*.sql` file (for a fresh
build) and once in an Alembic migration (for an existing database).

To see how many rows each table holds in a given database (an estimate, but instant):

```sql
SELECT relname AS table, n_live_tup AS rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
```

---

## 2. The map — eight groups

### A. Who — organisations, people and access · [`010_identity.sql`](../db/010_identity.sql), [`020_rbac.sql`](../db/020_rbac.sql), [`030_onboarding.sql`](../db/030_onboarding.sql)

| Table | One row is |
|---|---|
| `organisation` | One company of any kind. `kind` says which: `client`, `tenant` (a delivery partner), `aggregator`, `business`, `sponsor`, or `platform` (us). `parent_org_id` ties a supplier to the partner that brought it on; a CHECK makes it mandatory for suppliers and forbidden for everyone else. `public_profile` ([`230_org_public_profile.sql`](../db/230_org_public_profile.sql)) is one jsonb object holding what a client or partner shows the organisations it works with: website, description, size, founded year, registered address, and the logo's storage key (never returned by the API). Its audience is whoever `organisation_select` lets see the row, so **nothing private goes in it**. For a delivery partner it also holds `expertise` ([`260_vendor_directory.sql`](../db/260_vendor_directory.sql)): five lists of codes from fixed vocabularies (data types, domains, regions, languages, certifications) and one free line, validated by the API and checked by the database to be an object. `legal_name` is set by Ops. `rating` is a seed-era column that nothing updates; a partner's rating is calculated (see `partner_performance()` in section 5). |
| `organisation.profile`, `plan`, `dpa_signed`, `dpa_signed_at`, `fair_work_attested` | The columns only that kind of company has, kept on the organisation row since [`280_organisation_profile.sql`](../db/280_organisation_profile.sql): the descriptors (industry; headquarters and capabilities; crowd size, region and focus; specialty and capacity; sponsor contact) in the `profile` JSON, validated per kind in `profile_schema.py`, and the typed terms beside it. They replaced five `*_profile` satellite tables, which carried their own copy of every visibility policy while nothing filtered or sorted on their columns. A counterparty never sees `plan` or the DPA: the API strips them, as it strips `billing_status`. |
| `app_user` | One person: email, password hash, lockout counters. **No organisation column, on purpose** — a person is not a member of anything until a grant says so. |
| `user_role_grant` | "This person holds this role in this organisation." This row is what turns a person into someone who can sign in. Revoked with `revoked_at`, never deleted, so "who could do what, and when" survives. |
| `role`, `permission`, `role_permission` | The capability matrix, as data. Roles are per persona; permissions are codes such as `proposal.accept`; the third table joins them. Adding a role is an INSERT, not a code change. `permission.requires_mfa` marks the ones that move money or approve a delivery. |
| `user_session` | One sign-in: the **hash** of the refresh token, and which organisation that session is for. |
| `login_attempt` | Every sign-in attempt, success or failure. Drives the lockout after repeated failures. |
| `user_password_history` | Old password hashes, so a password cannot be reused. |
| `user_token` | Password-reset links (hash, single use, expiring). Written only through database functions, never directly. |
| `invitation` | The emailed "set your password" link for a new user. Hash only; the invitee sets their own password, so no administrator ever knows it. |

### B. Joining the platform · [`030_onboarding.sql`](../db/030_onboarding.sql)

| Table | One row is |
|---|---|
| `onboarding_request` | An application to add a company. Ops adds clients and delivery partners; a delivery partner asks for an aggregator, business or sponsor under itself, and Ops approves. |
| `onboarding_approval` | One decision on a request. Append-only, so a request that went back for changes keeps the reason. Only Ops may insert — this is the single rule that stops a partner approving its own network. |

### C. Marketplace · [`035_storage.sql`](../db/035_storage.sql), [`040_marketplace.sql`](../db/040_marketplace.sql)

| Table | One row is |
|---|---|
| `storage_target` | A client's **own** bucket or container: provider, bucket, prefix, and the credential. It is a separate table — not columns on `request` — because every bidding partner can read a published request, and a credential cannot sit on a row they can read. |
| `request` | The RFP: what is wanted, how much, by when, the privacy rules, and which `storage_target` the captures go to. `proposals_close_at` is the bidding deadline, required to publish and changeable by the client until the award ([`240_bidding_deadline.sql`](../db/240_bidding_deadline.sql)); "closed" is never stored but derived from it at read time. `closed_at` and `bidding_reminder_sent_at` are the sweep's stamps for the notices it has sent, cleared when the client moves the deadline later. |
| `proposal` | One partner's bid on one request. |
| `rfp_thread` | One private conversation per request per delivery partner, between the client and that partner only ([`250_rfp_threads.sql`](../db/250_rfp_threads.sql)). Opened by the partner while the request is published (or, as the winner, during delivery); closed by the client's own actions — `awarded_elsewhere` for the losers at award, `contract_completed` for the winner at approval — and a closed thread never reopens. Blind bidding holds because the policies admit only the two parties (and Ops, read-only): a rival's thread does not exist for a partner. |
| `rfp_message` | One message in a thread, numbered `seq` 1, 2, 3… under the thread's advisory lock. Append-only at every layer: no UPDATE or DELETE policy, no grant, and rewrite rules that turn either into nothing. `sender_name` is a snapshot because the other organisation cannot read `app_user`. |
| `rfp_thread_read` | One last-read `seq` per organisation per thread. "Seen" and unread counts are computed from it; it is a separate table so both parties can stamp without holding the thread's client-only UPDATE policy. |

### D. Delivery and capture · [`050_delivery.sql`](../db/050_delivery.sql), [`120_workers_media.sql`](../db/120_workers_media.sql), [`130_task_offers.sql`](../db/130_task_offers.sql), [`170_engagement.sql`](../db/170_engagement.sql), [`095_attachments.sql`](../db/095_attachments.sql)

| Table | One row is |
|---|---|
| `contract` | The award. Carries both parties, the value, a **snapshot of the rubric**, and the **storage destination copied from the request** — so the client editing the request later cannot move work already under way. |
| `task` | A slice of a contract given to **one supplier organisation**. Never spans suppliers. |
| `task_offer` | "N places are open on this task" — sent to several workers at once. |
| `task_offer_recipient` | One emailed offer link (hash), and that worker's answer. |
| `task_assignment` | One **worker's** share of a task: how many items, and how far along. |
| `engagement_reminder` | One reminder sent to a worker about an offer they have not answered or an assignment they have not moved — by the clock (`modules/engage`, every five minutes) or by the aggregator from the console. The clock's rows are unique per (subject, kind, step), which is what makes a repeated pass harmless. |
| `asset` | **One captured photo or video**: storage key, sha256, size, status, who captured it. The bytes are never in the database. Partitioned by `created_at` because it is expected to be the largest table by far. |
| `submission` | One **attempt** at handing a finished task to the partner. A reworked task has several; every one is kept. |
| `attachment` | Every document file in the product — on a request, a proposal, a task or a review. One table for all four parents; `entity_type` + `entity_id` + `slot` say where it belongs, and `doc_no` + `version` keep every revision. |

### E. Quality checks · [`060_qa.sql`](../db/060_qa.sql)

| Table | One row is |
|---|---|
| `qa_review` | One verdict at one gate. Gate 1 (the aggregator) reviews an **assignment**; gate 2 (the partner) reviews a **submission**. Append-only: a changed mind is a second row. A `fail` must carry a note — enforced by the database. |
| `defect_code` | The defect vocabulary (blur, occlusion, tilt…), seeded. A gate-1 reviewer picks from it when sending a capture back, and the phone shows the worker the code's label. |
| `qa_review_defect` | Which defect codes a failing review cited, and how many captures each affected. |

### F. Supplier network · [`070_network.sql`](../db/070_network.sql)

| Table | One row is |
|---|---|
| `crowd_worker` | One person on an aggregator's roster. `user_id` links to `app_user` when that person can sign in to the phone app. |
| `equipment` | A sponsor's equipment type and how many units exist. |
| `loan` | A request to borrow units. A trigger refuses an approval that would lend more than exist, or lend equipment whose calibration has expired. |
| `rating` | One party's rating of the other on a contract, written when the client accepts delivery. |

### G. Money · [`080_ledger.sql`](../db/080_ledger.sql)

| Table | One row is |
|---|---|
| `ledger_account` | One account for one organisation and purpose (receivable, payable, escrow, fee income, cash). `org_id` NULL means platform-internal. |
| `ledger_transaction` | One money movement, as a group of entries. |
| `ledger_entry` | One leg: a debit or a credit, always a positive amount. Append-only. **A deferred trigger refuses to commit a transaction whose debits and credits differ.** |
| `invoice` | The document a party receives. A projection over the ledger; the money itself is in `ledger_entry`. |

Real double-entry is used because of escrow: on award, half is invoiced and *held*; it belongs to neither party
until the client accepts. A single amount column cannot say that.

### H. Record-keeping and compliance · [`090_notify_audit.sql`](../db/090_notify_audit.sql)

| Table | One row is |
|---|---|
| `audit_event` | One line of the audit log. Each row stores a hash that covers the previous row's hash, so editing or deleting any row breaks every hash after it. Partitioned by time, append-only. |
| `notification` | One bell notification, for a whole organisation or one person, with a deep link. |

There are no views. The four the blueprint added ran with their owner's rights, which put them outside
row-level security, and no code read them; [`290_dormant_objects.sql`](../db/290_dormant_objects.sql) dropped
them. A view added in future must be declared `WITH (security_invoker = true)`.

---

## 3. One job, start to finish

Which table gets a row at each step.

1. **A company joins.** `onboarding_request` → Ops approves → the function `approve_onboarding_request()` creates,
   in one transaction: `organisation` (with its kind's profile columns), the first `app_user` (status `invited`, no password), a
   `user_role_grant`, an `invitation`, and an `onboarding_approval`. For a client or partner the same transaction
   then writes `legal_name` and `public_profile`, and files the uploaded logo under `orgs/{id}/logo/`
   (`identity.apply_onboarding_profile`). The invitee sets a password from the link.
2. **The client prepares.** Saves a `storage_target` — the API writes, reads and deletes a probe file before it
   accepts it. Drafts a `request`, uploads documents (`attachment`). **Publishing requires a verified destination.**
3. **Partners bid.** Each inserts one `proposal` (a unique index allows only one live bid per partner per request)
   with optional documents (`attachment`). Only while the window is open: `submit_proposal` and
   `withdraw_proposal` compare `proposals_close_at` with the clock and refuse after it. Every active partner
   hears about the request through `active_tenant_ids()`, a definer function, and the client may move the
   deadline (`change_bidding_deadline`) until the award. A pass in the API process
   (`modules/marketplace/sweep`) tells the client and the bidders when the window shuts and reminds the rest
   a day before; `bidding_sweep_orgs()` is how it finds the clients with a window due.
4. **The client awards.** In one transaction: the winning `proposal` → `accepted`, the rest → `rejected`,
   `request` → `accepted`, a `contract` is created (rubric snapshot and destination copied in), and the ledger
   writes the first milestone — `ledger_transaction` + `ledger_entry` + `invoice`.
5. **The partner splits the work** into `task` rows, each for one aggregator or business in its own network.
6. **The aggregator staffs each task.** Either assigns workers directly (`task_assignment`), or sends a
   `task_offer` with one `task_offer_recipient` per worker; each accepted link becomes a `task_assignment`.
7. **Workers capture.** Each photo is one `asset` row — `pending` when the upload link is issued, `ready` once the
   server has confirmed the object exists with the right size (see [section 6](#6-the-storage-layer)).
8. **Gate 1.** The worker submits the assignment; the aggregator accepts or rejects it — a `qa_review` row with
   `gate1_supplier`. A rejection needs a note and sends the assignment back.
9. **The task is submitted.** A `submission` row is created and every `ready` asset of an `accepted` assignment is
   stamped with its id.
10. **Gate 2.** The partner passes or fails the submission — a `qa_review` row with `gate2_partner`. The task
    becomes `qa_passed` or `qa_failed`. A failed task reopens; the next attempt is a **new** `submission` row.
11. **Delivery.** When every task on the contract is `qa_passed`, the partner marks the `contract` `delivered`.
12. **Acceptance.** The client approves: `contract` → `completed`, a `rating` is written, and the ledger releases
    the held money, takes the platform fee, and marks the `invoice` rows `paid`. Or the client disputes with a
    reason, and the contract returns to `active`.

Nearly every step also writes one `audit_event` and one or more `notification` rows.

---

## 4. Status values and who may change them

**The database restricts the *values* (every status is an enum). It does not police the *moves*.** There is no
status-transition trigger anywhere. Every move below is guarded in Python, in the service function named.

| Table | Values | Moves, and where they are made |
|---|---|---|
| `request` | `draft` `published` `proposals_received` `accepted` `in_progress` `delivered` `completed` `cancelled` | `draft → published` in `publish_request`; `published → accepted` in `award` ([marketplace/service.py](../backend/src/sourcehub/modules/marketplace/service.py)). **Everything after `accepted` is not stored** — it is derived from the contract's status when the request is read, and "bidding closed" is derived from `proposals_close_at` the same way. Only a `draft` can be edited; a `published` request allows one change, its bidding deadline. |
| `proposal` | `submitted` `accepted` `rejected` `withdrawn` | `submit_proposal`, `withdraw_proposal`, `award` (same file). A withdrawn bid can be revived by submitting again. |
| `rfp_thread` | open, or closed with `awarded_elsewhere` / `contract_completed` | `close_for_award` from `award`, `close_for_completion` from `approve_delivery` ([threads/service.py](../backend/src/sourcehub/modules/threads/service.py)). The close is the only update the table allows, and a trigger refuses reopening. |
| `contract` | `active` `in_qa` `delivered` `completed` `disputed` `cancelled` | `active → delivered` in `deliver_contract` (partner only, every task passed); `delivered → completed` in `approve_delivery` and `delivered → active` in `dispute_delivery` (client only) ([delivery/service.py](../backend/src/sourcehub/modules/delivery/service.py)). `in_qa` is shown in the console but derived, never stored. |
| `task` | `assigned` `in_progress` `submitted` `qa_passed` `qa_failed` `cancelled` | `start_task`, `submit_task` (delivery); `qa_passed` / `qa_failed` in `decide` ([qa/service.py](../backend/src/sourcehub/modules/qa/service.py)). The first worker to start an assignment also moves the task to `in_progress`. |
| `task_offer` | `open` `filled` `closed` | `create_offer`, `close_offer`, `respond_to_offer` (delivery). **`expired` is computed from `respond_by`, never stored** — the reminder clock (engage) reads it the same way and flips nothing. |
| `task_assignment` | `assigned` `in_progress` `submitted` `accepted` `rejected` `cancelled` | `start_assignment`, `submit_assignment`, `cancel_assignment`, `reopen_assignment` (delivery); `accepted` / `rejected` in `decide_gate1` (qa). Reopening is only allowed while the parent task is `qa_failed`. |
| `asset` | `pending` `uploaded` `ready` `quarantined` `rejected` `erased` | `pending` in `presign_capture`; `ready` or `quarantined` in `confirm_asset` ([media/service.py](../backend/src/sourcehub/modules/media/service.py)). |
| `submission` | `open` `submitted` `under_review` `accepted` `rejected` `superseded` | created as `submitted` in `submit_task`; closed by `decide` (qa). |
| `onboarding_request` | `draft` `submitted` `under_review` `changes_requested` `approved` `rejected` `withdrawn` `expired` | [onboarding/service.py](../backend/src/sourcehub/modules/onboarding/service.py); `approved` is set inside the database function, which locks the row and refuses anything not `submitted` or `under_review`. |
| `invoice` | `pending` `paid` `overdue` `void` | `record_award`, `record_completion` ([ledger/service.py](../backend/src/sourcehub/modules/ledger/service.py)) — reached only from award and acceptance, never from a route of their own. |

**Declared but never written by any code:** `request.cancelled`, `contract.disputed` and `contract.cancelled`
(a dispute returns the contract to `active`), `task.cancelled`, `submission.open` / `under_review` / `superseded`, `asset.uploaded` (reserved for asynchronous verification),
`asset.rejected` / `erased`, `qa_review` gate `gate3_client`, `organisation.terminated`,
`onboarding_request.under_review` / `expired`, `invoice.overdue` / `void`.

---

## 5. How the flow is controlled — four layers

A request passes through all four. Each one assumes the one above it might fail.

### Layer 1 — the route asks for a capability

Every route declares the permission it needs with `require_capability("proposal.accept")`
(the newest is `vendor.read`, held by clients and Ops, which opens the vendors directory)
([api/deps.py](../backend/src/sourcehub/api/deps.py)). The user's permissions come from
`user_role_grant → role → role_permission → permission`, are read once at sign-in through the database function
`user_capabilities()`, and travel in the access token.

### Layer 2 — the service checks who and when

This is the state machine. Each service function checks **ownership** (is this your organisation's contract?)
and the **current status** (is it `delivered`?) before it changes anything, and then writes the audit event.
See [section 4](#4-status-values-and-who-may-change-them).

### Layer 3 — row-level security decides which rows exist for you

Defined in [`100_rls.sql`](../db/100_rls.sql), with later additions in `110`, `120`, `130` and `150`. Roughly 140
policies across 43 tables.

**How it works.** The API connects as the role `sourcehub_app`, which owns nothing and cannot bypass policies.
At the start of every request it sets three transaction-local values — `app.org_id`, `app.user_id`, `app.role` —
in `get_session()` ([api/deps.py](../backend/src/sourcehub/api/deps.py)) or `org_session()`
([db/session.py](../backend/src/sourcehub/db/session.py)). Policies read them through `current_org_id()`,
`current_user_id()`, `is_platform_admin()` and `is_worker()`. **If they are not set, every policy sees NULL and
returns nothing** — it fails closed. Row-level security is enabled on every protected table, and on each
partition of `asset` and `audit_event` separately.

**ENABLE, never FORCE.** Row-level security binds every login except a superuser, a login with `BYPASSRLS`,
and the tables' owner. The "doors through the wall" below rely on that last exemption: they run as the owner
precisely so they can read across organisations. Until [`270_managed_postgres.sql`](../db/270_managed_postgres.sql)
every table was also marked `FORCE`, which binds the owner too. Where the owner was a superuser (the compose
container, the VM) that changed nothing. On a managed server (Azure Flexible Server, AWS RDS, Google Cloud
SQL) nobody is a superuser, the owner is the provider's admin login, and `FORCE` would blind every one of those
functions: no sign-in, a forked audit chain, empty vendor figures, all without an error. 270 removes `FORCE`
everywhere and a unit test refuses it in any later file.

What `FORCE` protected against, the API connecting as the owner, is refused twice instead: the API will not
start through a superuser, a `BYPASSRLS` login or the tables' owner (`sourcehub.db.guard`, also behind
`GET /ready`), and Alembic will not migrate through a login that does not own the tables
([migrations/env.py](../backend/migrations/env.py)). So there are two logins and only two: the owner, for
building and migrating, and `sourcehub_app`, for the API. `sourcehub_readonly` exists for reporting; on a
managed server [`infra/db/managed_setup.sql`](../infra/db/managed_setup.sql) creates it with sign-in switched off.

Only two role values change what a policy decides: `platform_admin` and `worker`. Everything else is decided by
**which organisation you are**.

**Who sees what, hop by hop:**

| Hop | What opens | What makes it work |
|---|---|---|
| Client → all delivery partners | A `request` that is `published` is visible to **every** organisation of kind `tenant`. This is the open marketplace, and the broadest read rule in the schema. | `request_select` + `current_org_kind()` |
| Client → every delivery partner | A client reads the organisation row (profile included) of every **active** delivery partner, dealt with or not: the vendors directory. Delivery partners only, never a partner's network; a suspended partner drops out. The mirror of the hop above, in the other direction. | `organisation_select_directory` in [`260_vendor_directory.sql`](../db/260_vendor_directory.sql) |
| Bidder ↔ client | Bidding discloses each side's organisation and profile to the other. A bidder keeps sight of the request afterwards, win or lose. A bidder **never** sees a competitor's proposal. | `org_visible_via_proposal()`, `org_visible_via_my_proposal()`, `request_has_my_proposal()` |
| Partner → aggregator | The supplier holding a `task` sees that task and its `contract`. It does **not** see the `request` row. | `task_select`, `contract_select`, `contract_is_visible()` |
| Aggregator → worker | A worker's session carries the **aggregator's** organisation id. Restrictive policies then narrow it to the worker's own assignments, the tasks behind them, their own captures and their own notifications. Thirteen tables are closed to workers outright — contracts, requests, proposals, invoices, the audit log, storage destinations and more. | `worker_holds_assignment()`, the `*_worker_*` policies in [`120_workers_media.sql`](../db/120_workers_media.sql) |
| Client's documents → the field | Aggregators and workers can read the request's `guidelines`, `capture_examples` and `acceptance` files; aggregators also `compliance`. **Never the `brief`** (commercial terms), and never the request row itself. | `attachment_select_downstream`, `request_shared_downstream()` in [`150_downstream_documents.sql`](../db/150_downstream_documents.sql) |
| Never | A client never sees a roster or an assignment. A partner never sees a client's bucket or credential. | absence of any policy that would allow it |

**The doors through the wall.** Some moments have no organisation context yet, or need one fact from a row the
caller must not be able to read. Those go through about thirty `SECURITY DEFINER` functions (the newest are `active_tenant_ids()` and `bidding_sweep_orgs()` in [`240_bidding_deadline.sql`](../db/240_bidding_deadline.sql): a client's announcements reach every partner through the first, and the deadline sweep asks the second which clients have a window due, then acts under each one's own context — the same shape as the reminder pass and `engagement_orgs()`) — each answers one
narrow question and is executable only by `sourcehub_app`:

| Moment | Functions |
|---|---|
| Sign-in, before any context exists | `authenticate_lookup()`, `record_login_attempt()`, `user_organisations()`, `session_lookup()` |
| Anonymous links | `invitation_lookup()` / `invitation_accept()`, `password_reset_create()` / `password_reset_consume()`, `task_offer_lookup()` |
| A worker uploading into a bucket it cannot read | `storage_destination_for_contract()`, `storage_destination_by_id()` — the only two that return a credential |
| Building a storage path from names the caller cannot see | `attachment_folder()` |
| "Is this email already used?" without revealing by whom | `email_is_taken()` |
| Integrity that must see every row | `write_audit_event()`, `assert_ledger_balanced()` |
| A partner's record, made of contracts the reader may not see | `partner_performance(uuid[])` — contracts completed, on-time %, accepted-first-time %, gate-2 pass %, and the rating as an average, a count and a count per score. **Numbers only**: never a contract, a client, a comment or a date. A percentage is NULL when there is nothing to divide by. Answers for delivery partners, to a session acting as an organisation, never to a crowd session. It is the one source of these figures for every screen ([identity/directory.py](../backend/src/sourcehub/modules/identity/directory.py)). |

### Layer 4 — the database refuses what should never exist

| Mechanism | Examples |
|---|---|
| Unique partial indexes — the "only one" rules | one accepted proposal per request · one live bid per partner per request · one open offer per task · one open assignment per worker per task · one live grant of a role per user per organisation · email unique among non-deleted users |
| CHECK constraints | a supplier must have a parent organisation · an active user must have a credential · a failed review, a rejected assignment, a rejected loan and a non-approval must each carry a written reason · an offer's `accepted_count` can never exceed `worker_limit` · an approved onboarding request must name what it created · a review has exactly one subject (assignment *or* submission) · file size limits per attachment slot |
| Triggers — only two do real work | `ledger_entry_balanced` (debits = credits, checked at commit) · `loan_availability` (stock and calibration). Every other trigger just maintains `updated_at`. |
| Append-only tables | `audit_event`, `qa_review`, `ledger_entry` — rules turn UPDATE and DELETE into no-ops. Note they are **silently ignored**, not raised as errors. |
| The audit hash chain | `write_audit_event()` takes an advisory lock, reads the previous row's hash, and stores `sha256(previous hash + this event)`. There is no job yet that walks the chain to check it. |
| Row locks where races matter | approving an onboarding request · accepting an invitation · consuming a reset link · accepting an offer (`FOR UPDATE` on the offer serialises the race for the last place) |

---

## 6. The storage layer

**The database never holds file bytes — only keys.** There are two separate storages:

| | Platform storage | Client destination |
|---|---|---|
| Holds | every `attachment` (briefs, guidelines, examples, method statements, task instructions) | every captured `asset` |
| Where | one Azure Blob container, configured in settings (`STORAGE_*`) | one `storage_target` row per destination — Azure Blob or any S3-compatible store |
| Credential | environment variable | `storage_target.secret` (JSON, **stored unencrypted**) |
| Code | `platform_target()` in [platform/storage/\_\_init\_\_.py](../backend/src/sourcehub/platform/storage/__init__.py) | [modules/storage/service.py](../backend/src/sourcehub/modules/storage/service.py) |

There is no local-disk backend. `gcs` exists in the enum but is refused by a CHECK and has no adapter.

### How a destination is chosen

`request.storage_target_id` → checked `verified` at publish → re-probed at award → **copied onto the contract** →
resolved for the worker through `storage_destination_for_contract()` → **stamped on each `asset` row** at upload.
Viewing later resolves by the id on the asset, so an old link never depends on where the request points today.
An asset with no destination id lives in platform storage (contracts older than the feature). A destination's
location cannot be edited after creation — only its label and credential — because assets point at it.

### Captured media

One flat, self-describing name under the client's prefix, **minted by the server** — a phone never chooses where
bytes land (`_capture_name` in [media/service.py](../backend/src/sourcehub/modules/media/service.py)):

```
{prefix}CTR-05_TSK-06_AG-04_WKR-13_ef051366.jpg
        contract · task · aggregator · worker · first 8 hex of the asset id
```

1. **`presign_capture`** — checks the assignment is the caller's and `in_progress`, the file kind matches the
   task, size limits (25 MB image, 100 MB video), and the count against the assignment's quantity. Inserts the
   `asset` row as `pending`, then returns a signed upload URL valid for 15 minutes (a SAS token on Azure, a
   presigned PUT on S3). Retrying the same file (same assignment + sha256) reuses the row.
2. **The phone uploads straight to storage.** The bytes never pass through the API.
3. **`confirm_asset`** — the server asks storage for the object and compares the size: match → `ready`;
   mismatch → `quarantined` with the reason.
4. **`attach_to_submission`** — when the task is submitted, every `ready` asset of an `accepted` assignment gets
   the submission's id.

Viewing: `asset_view_url` runs an ordinary SELECT — row-level security *is* the access check — then returns a
short-lived signed URL.

### Attachments

A real folder tree in the platform container
([attachments/folders.py](../backend/src/sourcehub/modules/attachments/folders.py)):

```
{Client name}/{RFP-1001}/request/{slot}/
{Client name}/{RFP-1001}/proposals/{PRO-03 TN-01 Partner name}/{slot}/
{Client name}/{RFP-1001}/tasks/{TSK-02}/{slot}/
{Client name}/{RFP-1001}/qa/{TSK-02}/{slot}/

file name:  {RFP}[_{scope}]_{slot}_{nn}_v{k}_{original name}
```

A file is first uploaded to `_staging/{org}/{uuid}/{name}`, because the parent row often does not exist yet.
When the parent is saved, `attach()` reads the real size from storage, takes an advisory lock per parent and slot,
assigns `doc_no` and `version` (same file name again = next version; a new name = next document; numbers are
never reused), copies the object into place, deletes the staged copy, and inserts the row. At most five
documents per slot.

### Nothing deletes bytes

"Delete" on an asset or an attachment only sets `deleted_at`; the object stays in storage. Abandoned uploads under
`_staging/` are never swept. `storage_target` has no delete path at all. Any clean-up today would have to be a
lifecycle rule on the storage account.

---

## 7. Known gaps

Facts, not opinions. Each is small on its own; together they are the to-do list for this layer.

1. **Retention and erasure are not implemented.** The worker privacy notice promises **90 days**; nothing
   enforces it, and no code deletes a file ([section 6](#nothing-deletes-bytes)). The blueprint's tables for
   this (`retention_policy`, `legal_hold`, `erasure_request`, `consent_artefact`) never reached code and were
   dropped by [`290_dormant_objects.sql`](../db/290_dormant_objects.sql); the feature starts from a fresh
   design when it comes. The request form also offers `strip_gps`, `blur_faces` and `redact_plates`, which are
   stored and not yet acted on.
2. **Six tables have no row-level security:** `permission`, `role_permission`, `defect_code` (shared
   vocabulary — intended), and `login_attempt`, `user_password_history`, `qa_review_defect`. The two that matter
   are `login_attempt` (every email that ever tried to sign in) and `user_password_history` (hashes). No route
   exposes them, but the database itself would not stop the application role reading them.
3. **`storage_target.secret` is stored as given.** Access to the database is access to every client's storage
   credential. The code compensates by never selecting the column into a response and redacting it from logs.
4. **A comment describes a trigger that does not exist.** [`050_delivery.sql`](../db/050_delivery.sql) says a
   trigger keeps `request.status` and `contract.status` consistent. There is none: the request's later statuses
   are derived in Python when it is read. Also undefended by the database, despite comments: a proposal being
   immutable once submitted, and the contract's rubric snapshot and destination never changing after award.
5. **`updated_at` is not maintained on `asset`** (no trigger); the media service sets it by hand where it
   matters.
6. **Several statuses are declared and never written** — listed at the end of [section 4](#4-status-values-and-who-may-change-them).
   They are harmless, but a report that filters on them will always be empty.
7. **Redis and Celery are configured, but nothing uses them.** Email is sent inside the request, and no job
   runs on a clock (which is why offer expiry is computed, not stored). The outbox table the blueprint planned
   for a background worker never reached code and went with 290.

*On 20 September 2026 the pilot database was one migration behind the repository (`0016`; the repository has
`0017`, a rename of the platform organisation). Migrations are not run by the container start-up — they are a
one-off `alembic upgrade head`, see [infra/deploy/README.md](../infra/deploy/README.md).*

---

## 8. Tables that were removed

Two files took the schema from fifty-nine tables to forty-one. Their `CREATE` statements remain in the
earlier `db/*.sql` files and in git; both migrations (`0031`, `0032`) have a downgrade that brings everything
back, and both were proven on scratch copies before they ran anywhere else.

**[`280_organisation_profile.sql`](../db/280_organisation_profile.sql) — five tables folded in.**
`client_profile`, `tenant_profile`, `aggregator_profile`, `business_profile` and `sponsor_profile` were 1:1
satellites of `organisation`. Nothing filtered or sorted on their columns, every widening of organisation
visibility needed a matching policy on each of them (fourteen in all, already drifting), and the API
flattened them into one `profile` object anyway. Their values live on the organisation row now: see
`organisation.profile` and the four typed columns in [section 2](#2-the-map--eight-groups).

**[`290_dormant_objects.sql`](../db/290_dormant_objects.sql) — thirteen tables dropped.** Created from the
blueprint and never reached by code; every one was empty on every database (`retention_policy` held one
seeded default nothing read). Six had no row-level security at all.

| Table | What it was meant for | What is used instead today |
|---|---|---|
| `user_mfa` | TOTP second factor | the check exists (`require_mfa()` in `api/deps.py`, `permission.requires_mfa`) but is switched off (`mfa_enforcement = false`); it never read this table |
| `onboarding_document` | KYB / DPA / tax uploads at onboarding | nothing |
| `proposal_resource` | naming the suppliers on a bid | the bid's methodology text |
| `consent_artefact` | consent from photographed people | nothing — see [gap 1](#7-known-gaps) |
| `rubric`, `rubric_rule`, `sampling_plan` | versioned, machine-checkable acceptance rules | `contract.rubric_snapshot` (JSON) |
| `gold_set`, `gold_set_item` | scoring reviewers against known answers | nothing |
| `event_outbox` | reliable hand-off to a background worker | work done inline in the request |
| `retention_policy`, `legal_hold`, `erasure_request` | data retention, holds and erasure | nothing — see [gap 1](#7-known-gaps) |

With them went `qa_review.sampling_plan_id` (always NULL), the enum `onboarding_document_kind` (only
`onboarding_document` used it), two functions nothing called (`current_app_role()`, whose job
`is_platform_admin()` does, and `org_in_vendor_directory()`, whose only caller left with 280), and the four
views. The file refuses to run if any of the thirteen tables holds a row, so it cannot drop data silently.

When one of these features is finally built, it gets a new `db/*.sql` file and a fresh design, with row-level
security from the first line.
