# Read-only access for the Member level — deferred design

*Investigated and parked. The shipped behaviour is that `user_role_grant.scope` governs **people
management only**; a Member holds every product capability their role carries. This documents what it
would take to make Member read-only across the product, and the one finding that makes a naive
implementation dangerous. For what is already built, see `db/200_org_members.sql` and
`backend/src/sourcehub/modules/identity/members.py`.*

## What ships today

| | Member | Manager | Owner |
|---|:--:|:--:|:--:|
| Use the product (raise RFPs, award contracts, approve deliveries…) | ✅ | ✅ | ✅ |
| See the people list | ✅ | ✅ | ✅ |
| Invite a colleague / resend an invitation | ❌ | ✅ | ✅ |
| Change a Member's or Manager's access | ❌ | ✅ | ✅ |
| Change an Owner's access | ❌ | ❌ | ✅ |
| Remove a Member or Manager | ❌ | ✅ | ✅ |
| Remove an Owner | ❌ | ❌ | ✅ |
| Make someone an Owner | ❌ | ❌ | ✅ |

Capabilities come from the **role** (`user_capabilities`, `db/020_rbac.sql:141`) and there is exactly
one system role per organisation kind, so every Member of a client organisation holds the same 16
capabilities as its Owner. Scope adds the people-management gate on top
(`require_member_admin`, `backend/src/sourcehub/api/deps.py`) and subtracts nothing else.

---

## 1 · The showstopper: crowd resources are `scope = 'member'`

**A literal "Members get no write capabilities" rule stops every crowd resource capturing
anything.** This is the product's primary data path, and nothing about the requirement hints at it.

| Fact | Evidence |
|---|---|
| `invite_worker` grants crowd resources `scope = 'member'` | `db/190_worker_skills.sql:82` |
| The `worker` role holds three **writes** — `assignment.start`, `assignment.submit`, `asset.upload` — and one read, `assignment.read` | `db/905_seed_workers.sql:30` |
| Every crowd-resource grant on the pilot database is `worker` / `member` | audited 2026-09-25: 1 of 1 |

### The fix, and why it is not a special case

Exempt roles where **`applies_to_kind IS NULL`**. That is already the structural marker separating
workforce from staff: `worker` is the only role seeded that way, deliberately, so that both an
aggregator and a business partner can hold crowd resources (`db/905_seed_workers.sql:15`). Every
staff role names its kind — `platform_admin` is `'platform'`, `client` is `'client'`, and so on
(`db/900_seed.sql:79-85`).

So the discriminator needs no new column and no list of role codes to keep in step.

---

## 2 · The read-gap: three org kinds would be left with nothing useful

The permission vocabulary was designed as **"role = job"**, not "role × read/write". Removing writes
therefore does not leave a smaller version of each role — for some it leaves nothing.

What a Member would retain today, per organisation kind:

| Org kind | Retained | Usable? |
|---|---|---|
| Client | `rfp.read`, `proposal.read`, `contract.read`, `delivery.track`, `invoice.read`, `onboarding.read` | ✅ 6 |
| Delivery partner | `rfp.read.published`, `contract.read`, `delivery.track`, `invoice.read`, `equipment.read`, `onboarding.read` | ✅ 6 |
| Aggregator | `task.read` | ⚠️ cannot see the crowd roster or equipment |
| Business partner | `task.read` | ⚠️ same |
| **Device sponsor** | *(none)* | ❌ **empty pages** |

A sponsor holds `equipment.manage` and `equipment.decide` but no `equipment.read`
(`db/900_seed.sql`), so stripping writes leaves zero capabilities.

### What would close it

Two new read permissions, plus three wider grants of an existing one:

| Change | Why |
|---|---|
| **new** `user.read` (identity, read) → all six org roles | `GET /members` is guarded on `user.manage`, which is a **write**. Without this, a Member loses "See the people list" — contradicting the table above |
| **new** `roster.read` (network, read) → `aggregator` | An aggregator holds only `roster.manage`; without a read, a Member cannot see the crowd at all |
| `equipment.read` → `sponsor`, `aggregator`, `business` | They hold `equipment.manage` / `.decide` / `.request` and no read |

Result: Client and Delivery partner get 7 capabilities, Aggregator 4, Business 3, Sponsor 2 —
every kind usable.

---

## 3 · The implementation is one predicate

Add `permission.is_write boolean NOT NULL DEFAULT true` and classify the 13 existing reads.
`DEFAULT true` is the safe direction: a permission added later is a write until someone says
otherwise. The precedent for a per-permission behavioural flag is `permission.requires_mfa`, which
is exactly this shape.

Then filter inside `user_capabilities` (`db/020_rbac.sql:141`):

```sql
    AND  (g.scope <> 'member'          -- owners and managers: unchanged
          OR r.applies_to_kind IS NULL -- workforce, not staff: unchanged
          OR NOT p.is_write)           -- a staff member reads only
```

Everything downstream inherits it — the JWT (`api/security.py`), `can()` in the console
(`frontend/src/shared/rbac/index.ts`) and `require_capability` in the API. Putting it here rather
than in `resolve_claims` keeps authorisation in the database with the rest of it, and means no caller
can forget the rule.

The reads to classify: `activity.read`, `assignment.read`, `contract.read`, `delivery.track`,
`task.read`, `account.read`, `billing.read`, `invoice.read`, `proposal.read`, `rfp.read`,
`rfp.read.published`, `equipment.read`, `onboarding.read`.

House rules apply: written twice verbatim as `db/NNN_*.sql` plus an Alembic revision, added
explicitly to `infra/bundle_schema.sh`, one statement per `op.execute`, `$fn$` delimiters only.

---

## 4 · The console is the larger half

The console decides what to show from **`session.org_kind` in 9 places and `can()` in 3**. A
read-only Member would see every write button and receive a 403 on click.

Action gates to convert; `org_kind` stays where it drives **layout** (column sets, labels such as
"Engagements" vs "Tasks"), which is correct use:

| File | Action → capability |
|---|---|
| `frontend/src/features/marketplace/pages.tsx` | New request → `rfp.create`; Publish → `rfp.publish`; Award / Reject → `proposal.accept`; Respond → `proposal.create`; storage targets → `storage.manage` |
| `frontend/src/features/delivery/pages.tsx` | Assign task → `task.create`; Deliver to client → `contract.deliver`; Approve delivery → `contract.approve`; Start / Submit → `task.start` / `task.submit` |
| `frontend/src/features/network/pages.tsx` | Add crowd resource, Offboard, Edit skills → `roster.manage`; loan decisions → `equipment.decide`; inventory → `equipment.manage`; request → `equipment.request` |

Navigation entries need no change: a Member may open a page and read it.

---

## 5 · Tests that would have to exist

The first is the one that matters. It must fail if anyone removes the `applies_to_kind IS NULL`
clause, because that clause is all that stands between this change and a dead capture pipeline.

- **Worker exemption** — a `worker` / `member` grant still resolves all four of
  `assignment.read`, `assignment.start`, `assignment.submit`, `asset.upload`.
- `user_capabilities` returns no `is_write` permission for a staff `member` grant, per org kind.
- Owners and Managers keep their full set, unchanged.
- `is_write` is `false` on exactly the classified reads and `true` on every other permission, so
  adding a permission without classifying it fails the test.
- Console: each major page rendered with a `member` session shows no write buttons, **and** the same
  page with an `owner` session does — so the test cannot pass by rendering nothing.

---

## 6 · Live impact, at time of writing

Audited against the pilot database on 2026-09-25:

- Every staff grant is `owner`, except one `client` / `manager`.
- The only `member` grant on the platform is the single crowd resource — which this design exempts.

So the change would affect **no current user**, and could be applied before the console work lands:
the API would simply be stricter than the UI for a tier nobody occupies yet.

---

## Why it was deferred

The current three-tier model is accepted behaviour, and the product need it answers — an invited
colleague who can look but not act — has no user waiting on it. The work is real: a schema change,
two new permissions, a widened grant set, and roughly a dozen console gates converted from org kind
to capability. Worth doing deliberately rather than as an addition to the user-management feature.
