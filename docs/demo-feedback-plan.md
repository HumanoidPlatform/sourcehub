# Demo feedback — the plan list

*DataMind360 · from the client demo · written 28 Sep 2026, status updated the same day. Each item: what was asked,
how the platform behaves today, what we will build, the rules, how we'll know it's done, and the decisions still
needed. Sizes are rough: S = days, M = 1–2 weeks, L = 2–4 weeks, XL = 4+ weeks.*

## At a glance

| # | Feature | Who it's for | Status | Size | Depends on |
|---|---|---|---|---|---|
| 1 | Detailed client/partner profile at onboarding, with logo | Platform admin, client, partner | **Done** (public profile). Owner-only editing (1a) requested; private details (1b) not started | M | — |
| 2 | **Vendors** tab for clients | Client | **Done** (invite to bid later) | M | — |
| 3 | Flexible budget: total **or** rate per unit | Client, partner | **Done** (one amount per basis, USD; see decisions below) | M | — |
| 4 | Bidding deadline, editable until award | Client, partner | **Done** | S–M | — |
| 5 | Private one-to-one Q&A / chat per RFP | Client, partner | **Done** (text; attachments later) | L | — |
| 6 | Award one RFP to **several** partners, partial quantities | Client, partner | Not started | XL | 3 |
| 7 | Bulk-import crowd from Excel/CSV | Aggregator | **Done** | M | — |
| 8 | Documents the crowd must e-sign before capture | Client, worker | Not started | L | — |
| 9 | Device requirements, validated at capture | Client, worker | Not started | M–L | — |

**Suggested order for what remains** (2, 4, 5 and 7 are done):
1. The bidding model together: 3 + 6.
2. Crowd safeguards: 8, 9.

Items 3 and 6 both reshape bidding and awarding, so they are best designed together; the deadline (4) and
the conversations (5) are built to survive that redesign (both key on the award, not on how it is decided).

---

## 1 · Detailed client/partner profile at onboarding — DONE (public part)

**Asked:** capture proper company details (website etc.) when a platform admin adds a client, and upload a logo.

**Built and verified** (migration `0025`, already applied to the VM database; images still to be built and deployed):
- **One JSON column, `organisation.public_profile`,** holding:
  - website, description, company size, founded year;
  - registered address;
  - the logo reference.

  The legal name uses the existing `legal_name` column.
- **Logo:** PNG, JPEG or WebP, up to 2 MB, stored in the platform's private Azure storage and shown through short-lived signed links.
- **Onboarding:** a 4-step page (organisation and logo → registered address → plan and first user → review).
  - Legal name, website, country and registered address are required.
  - Approval saves the profile and files the logo.
- **Editing after onboarding:**
  - Ops can edit any client or partner.
  - The org's owner or a manager edits their own from **Organisation profile** in the account menu. Members can only view.
  - Only Ops can change the name, legal name, country, plan, data residency and DPA status.
- **Who sees it:** everything in the public profile is visible to anyone who can already see the organisation. Examples:
  - partners reading an open RFP (the client panel on the RFP page and the "View client & RFP" dialog);
  - the client, reviewing a partner's bid.

  Plan, DPA and billing status are never shown to counterparties.

**1a · requested change, not yet made: owner-only editing**
- **Asked:** only Ops and the organisation's **owner** should edit the profile and logo. Managers should not.
- **Today:** the owner and managers can both edit.
- **The change:**
  - Backend: the editor rule in `modules/identity/service.py` (`_EDITOR_SCOPES`) allows the owner only.
  - Console: the **Edit profile** button (`canEditOrgProfile` in `shared/rbac/index.ts`) shows for the owner only.
  - Tests: a manager is refused.
- **Size:** S. No database change.

**1b · still open: the private part (not started)**
- **What:** billing address, tax/registration ID (GSTIN / VAT / EIN), business and billing contacts, and onboarding
  documents (KYB, DPA, tax form).
- **How:** these need their own table, visible only to Ops and the organisation itself. They must not go in `public_profile`.
- **Decisions needed:**
  - Which of these fields are needed now?
  - Which countries' tax formats should we validate?

---

## 2 · "Vendors" tab for clients — DONE

**Asked:** a Vendors tab in the client workspace listing active vendors with name, website, experience and expertise.

**Decisions taken:** "vendors" means **delivery partners only** (aggregators, businesses, sponsors and the crowd
belong to a partner's network and stay invisible to clients); ratings are shown as an **average and a count**, never
the comments; **"Invite this vendor to bid"** comes later; the directory is **cards, with a table toggle**; the
calculated figures are the **one source everywhere** a partner's figures appear; expertise comes from **curated
lists**; both quality figures are shown — **"Accepted first time"** (the client's verdict) on the card, and the
partner's own **QA pass** on the vendor page.

**Built and verified** (migration `0029`, applied to the VM database on 30 Sep 2026; images still to be built
and deployed):
- **Vendors** in the client's sidebar, between Deliverables for Review and Billing. It lists every **active**
  delivery partner, whether or
  not the client has ever dealt with it. A suspended partner leaves the directory; a client that already has a bid or
  a contract with it keeps its view of that partner.
- **Each card:** logo, name, place and website; a two-line description; data types, domains, regions and
  certifications as chips; rating (stars, average and count), **On time** and **Accepted first time** with a bar each;
  years in business and projects completed here. A partner with no completed work says **"New on DataMind360"**
  instead of showing empty figures.
- **Search and filters:** free text (name, description, place), data type, domain, region, language, certification
  and minimum rating, plus four sort orders. A vendor must cover **everything** chosen. Active filters are chips that
  can be removed one by one or all at once, a count says how many match, and the filters live in the address bar so a
  filtered view can be bookmarked or sent to a colleague.
- **Table view** for comparing many vendors; the choice is remembered.
- **Vendor page:** header, about, expertise grouped by kind, performance (rating with how the scores were spread, on
  time, accepted first time, QA pass at the partner's own gate), company details, and **"Your work with this
  vendor"** — the client's own contracts and scores with it, and nobody else's.
- **Partners declare their expertise** in Edit profile (and Ops can at onboarding): data types, domains, regions,
  languages and certifications from fixed lists, and one free line for other certifications. Their own profile page
  prompts for it while it is empty and links to **"See how clients see you"**.
- **The figures are calculated, not entered.** Contracts completed; on time = completed contracts whose accepted
  delivery was on or before the date the client asked for; accepted first time = completed contracts never sent back;
  QA pass = the partner's gate-2 passes over passes and failures; rating = what the buyer of each contract scored it.
  A figure with nothing behind it is blank, never 0%. The seeded demo figures are no longer shown anywhere: the bid
  table, the partner profile dialog, the partner's own profile and Ops' accounts table all read the same numbers.

**Privacy, as built:** a partner's figures come from other clients' contracts, which the reader may not see, so the
database hands over **numbers only** — never a contract, a client, a comment or a date. A vendor row is assembled
key by key from what is public, so the plan, billing state, suspension reason, legal name and logo storage key are
never in it. Partners cannot browse the directory (a partner may open only its own page), and neither can
aggregators, businesses, sponsors or the crowd.

**Verified live** (local API and console on a scratch database, mail to a local catcher): the three partners filled
in their expertise; a **brand-new client**, onboarded and invited through the normal flow, saw all three with correct
figures and none of anyone's contracts or ratings; every response was checked key by key for private data; the bid
table, profile dialog and Ops' accounts table showed the same figures as the directory; a partner got "forbidden" on
the list and "not found" on a rival's page; suspending a partner removed it from the directory and reinstating it
brought it back.

**Still open:** "Invite this vendor to bid" from a vendor page; showing review comments; a Vendors view for Ops;
filtering on the server once the directory is large enough to need pages.

---

## 3 · Flexible budget: total range or rate per unit

**Asked:** clients choose between a total range for the RFP **or** a price per unit (e.g. $50 per 100 images, $50 per
5 hours of video).

**Today:**
- The RFP builder has a total budget min–max, labelled USD, and an option to keep it private.
- The database already has an unused "pricing model" field, and bids have unused unit-price fields.
- Currency is always USD.

**What we will build**
- A **Budget type** choice in the RFP builder:
  1. **Total budget:** a min–max range.
  2. **Rate per unit:** an amount (or min–max) **per N units**. The builder shows the **estimated total** (rate × quantity ÷ N).
- A **currency** picker (USD, INR, EUR, GBP…).
- "Keep budget private" still works for both types.
- Partners **bid in the same form**: a total price, or a unit rate. The platform shows the implied total.
- For per-unit RFPs, contract value = unit rate × awarded quantity (item 6).

**Rules:**
- The pricing unit must be one the RFP is measured in.
- A per-unit bid states its rate; the total is always calculated, never typed in.

**Done when:** a client can publish either budget type in any supported currency, partners bid in the matching form,
and client and partner see the same totals.

**Built (4 October 2026, `db/320` / migration 0035):** the budget is **one amount** on a basis — a total, or an
amount per N units (per 100 photos, per 1,000 records, per 10 hours of footage) with the quantity expected — and
"keep the budget private" hides the amount, never the basis. Partners bid one price on the client's basis and
see the total it implies; the award freezes the basis on the contract. Payment follows **accepted work**: once a
submission has passed gate 2 the partner raises an invoice (a quantity at the agreed rate, capped at the captures
accepted; or an amount on a fixed price, capped at the agreed total), the client marks it paid, the partner
acknowledges. There is no escrow and no platform fee any more. Currency stays USD for now, and a range was not
kept: one number is what partners can bid against.

---

## 4 · Bidding deadline, editable until award — DONE

**Asked:** an end date for bidding (separate from the delivery date), editable until the RFP is awarded.

**Decisions taken:** the client may award at any time, before or after the deadline; bids are binding once the
window shuts (no withdrawal or resubmission until it is reopened); RFPs published before this keep no deadline
and stay open until awarded; a background pass sends the notices.

**Built and verified** (migration `0026`, already applied to the VM database; images still to be built and deployed):
- **RFP builder:** a required **"Bids close on"** date and time. It must be in the future and on or before the
  delivery date (measured in UTC, as the database does). A draft can be saved without it; publishing cannot.
- **Partners** see the deadline with a countdown on Opportunities (soonest first) and on the RFP page. After it
  passes, the RFP leaves the board, **Respond** disappears, and the server refuses new bids, resubmissions and
  withdrawals with a clear message. The RFP itself stays visible to every partner.
- **Clients** see the deadline and a **"Bidding closed"** pill (or **"Bidding closed · no proposals"**) on the RFP
  and in their list. A **Change deadline** button lets them extend or shorten it until the award — never into the
  past. Extending a closed window reopens bidding. Every change tells every active partner and is audited.
- **Notices, in the app:** every partner is told when an RFP is published (this used to reach only partners the
  client already knew), when its deadline moves, a day before it closes (if they have not responded), and when
  it closes; the client is told it closed and how many proposals are waiting. A pass inside the API process
  sends these; the refusal itself is immediate on every bid.
- "Closed" is never stored — it is derived from the time — so nothing about who may see what changed.

**Still open:** email for these notices (in-app only for now); a partner's "Responses" page hides Withdraw once
the deadline has passed but does not yet show the deadline itself.

---

## 5 · Private one-to-one Q&A and chat — DONE

**Asked:** before bidding, a partner can ask the client questions in a private chat no other partner can see. After a
bid, they can discuss the bid. The history stays until delivery.

**Decisions taken:** only the **partner** starts a conversation (the client replies); no public "answer to all
partners"; **Ops** can read any conversation, read-only, and each read that shows new content is audited (visible to
Ops only); at award the other partners' conversations become read-only and the winner's continues until the delivery
is approved; **text only** for now (attachments are the follow-up); "read" means **seen by the other organisation**;
new messages arrive by polling (about every 10 seconds) while the conversation is open; one bell notification per
message, no email.

**Built and verified** (migration `0027`, already applied to the VM database; images still to be built and deployed):
- **One conversation per RFP per partner,** between the client and that partner only. The database itself decides who
  may read and write: a rival's conversation does not exist for a partner, Ops can read but never post, nothing can be
  edited or deleted, and no one can post once a conversation is closed.
- **Partner:** a **"Questions to the client"** panel on the RFP page. "Ask a question" opens the conversation with the
  first message, while the RFP is open for proposals (a passed bidding deadline does not stop questions; the award
  does). The conversation stays beside its response, and, for the winner, continues on the **contract page** — a
  winner that never asked before the award can start it there.
- **Client:** a **"Conversations"** panel on the RFP page listing every partner in conversation, with unread counts, the
  last line, and a "No response" mark for a partner that asked but never bid; each bid row gets a **Messages (n)**
  button that jumps to that partner's conversation. Replies go to one partner only.
- **Messages:** sender, organisation, time, and **Seen** once the other organisation has opened the conversation after
  it. A message is at most 4,000 characters.
- **Closing:** at award, every other partner's conversation becomes read-only ("The RFP was awarded to another
  partner.") and that partner is told; a partner that asked but never bid keeps sight of the RFP. When the client
  approves the delivery, the winner's conversation becomes read-only ("Delivery is complete."). Everything stays
  readable by both sides.
- **Bell:** one notification per message, opening the RFP with that conversation selected; opening the conversation
  clears them.
- **Activity:** opening and closing a conversation and each Ops read are recorded.

**Verified live:** NorthStar and Meridian asked on the same Acme RFP; each saw only its own conversation (the other's
returned "not found" even by id), Acme saw both with unread counts and answered each separately, "Seen" appeared on
the partner's message once Acme opened it; Ops read one conversation (one audit line, none for the repeat) and could
not post; Acme awarded NorthStar → Meridian's conversation read-only with the reason and a bell notice, NorthStar's
continued on the contract page; the completion close → NorthStar's read-only with "Delivery is complete."

**Still open:** attachments on messages; an inbox page listing all of one's conversations (today they are reached
from the RFP, the contract and the bell); if Ops reads should be visible to the two parties, add their organisations
to the audit scope.

---

## 6 · Award one RFP to several partners, with partial quantities

**Asked:** several partners can win one RFP, each bidding for part or all of the quantity. The bid states the quantity,
and it is visible who won.

**Today:**
- The database allows exactly **one contract per RFP**.
- Awarding one bid rejects all the others and closes the RFP.
- Bids carry no quantity.
- A partner gets one bid per RFP, and can't bid again after rejection.

**What we will build**
- **Bids include quantity** (up to the RFP total), plus a price (total or unit rate, per item 3) and a duration.
- **Awarding:** the client awards several bids, confirming the quantity for each. A meter shows "Awarded 600 of 1,000 · 400 remaining". Awards can never exceed the total.
- **Each award becomes its own contract.** Each winner splits only its own contract into tasks.
- **Remaining bids stay open** until the RFP is fully allocated or the client closes it. The rest are then declined, with a notification.
- **New RFP stages:** Open → Partially awarded → Fully awarded → In progress → Delivered → Completed, with progress rolled up across contracts.
- **Winners:** the client sees every winner and quantity; each winner sees its own award.
- **Delivery and billing:** delivery is approved per partner, and each partner raises its own invoices on its own contract (as item 3 already works today).

**Rules:**
- Total awarded ≤ the RFP quantity, enforced by the server even when two awards happen at once.
- A partial award of a total-price bid needs a pro-rated price. The simplest answer is that multi-winner RFPs take unit-rate bids.

**Done when:**
- A 1,000-unit RFP can be awarded 600 + 400 to two partners.
- Each partner gets its own contract.
- No one can over-award.
- The client sees one combined progress view.

**Decisions needed:**
- Can the client award **less** than a bid, and can the partner decline a reduced award?
- Should other partners see who won?
- Can partners who weren't chosen re-bid for the remainder?
- Is "multiple winners" chosen per RFP, or always on?

---

## 7 · Bulk-import the crowd from Excel/CSV — DONE

**Asked:** aggregators add their crowd in bulk from a spreadsheet, not one by one.

**Decisions taken:** CSV and Excel (.xlsx) only; up to 1,000 rows per file; a person is recognised by **email
only** — a row with no email is added every time it is uploaded, because nothing identifies it; invitations go out
during the import, in batches, and the roster's existing **Resend invite** covers any that fail.

**Built and verified** (no database change; images still to be built and deployed):
- **Import crowd** on the Roster page, in three steps:
  1. **Upload:** download a template (CSV or Excel) with the columns name*, email, phone, skills, trained and one
     example row; then pick the filled file. Column names are matched loosely (Full name, E-mail, Mobile…), skills
     may be written by label or code and separated by `;`, `|` or `/`, and trained accepts yes/no, true/false, 1/0.
     A file over 1,000 rows, or with no name column, is refused before anything is sent.
  2. **Preview:** every row is judged by the server before anything is written, with the reason on the row:
     **error** (not imported) for a missing name, an invalid email, a duplicate of an earlier row, or an email
     that belongs to someone else on the platform; **warning** (imported) for unknown skills dropped or no email
     ("added to the roster only, and cannot be offered work until invited"); **already on roster** (skipped).
     Counts at the top, a filter box, and **Import N crowd resources** for the ready and warning rows.
  3. **Import:** rows go in batches of 50 with a progress bar; each row is written on its own, so one bad row never
     spoils the rest; the summary shows invited, roster-only, not imported and invitations not sent, with a
     **Download error report** (CSV: row, name, email, reason). One activity line per batch.
- Rows with an email are invited exactly as a single **Add crowd resource** would be, and now a roster-only row keeps
  its phone number (adding one by one used to drop it).
- Uploading the same file again marks every email row **already on roster** and imports nothing for them.

**Verified live:** a 500-row check in one request with nothing written; a 60-row Excel file with six deliberate
faults → 56 imported (49 invited with working invitation links, 7 roster-only), 4 refused with reasons; the same
file again → 49 already on the roster, 0 ready.

**Still open:** a queued mailer if crowds grow past a few thousand (mail is sent inside the request today, so a very
large file takes a few minutes with the progress bar visible).

---

## 8 · Documents the crowd must e-sign before capture

**Asked:** the client uploads documents on the RFP (e.g. an NDA or a consent/release form) that workers must see and
digitally sign before accepting a task, whether it was offered by email or assigned directly.

**Today:**
- RFP documents reach workers **read-only**. Nothing can be signed.
- The emailed offer carries no documents.
- The only consent is a privacy notice, stored on the phone.

**What we will build**
- **RFP builder:** a new "Documents the crowd must sign" section, taking PDFs marked *signature required*.
- **Before taking the work:**
  - offered by email: the accept page shows each document; the worker signs, then accepts;
  - assigned directly: the app shows a *Sign documents* step, and **Start** stays locked until everything is signed.
- **Signature:** a drawn signature or typed name. The platform records who signed, which document version (with a file fingerprint) and when, and keeps a signed copy with a certificate.
- **Once per worker per RFP.** A new document version requires signing again.
- The client, partner and aggregator see **who has signed** and can download the signed copies.

**Rules:**
- No signature means no accept, no start and no captures, enforced by the server.
- Signed records are permanent.

**Done when:** a worker can't start or accept without signing, and the client can download a signature record for
every worker who captured data.

**Decisions needed:**
- **The legal level of signature** (needs a legal opinion). Either:
  - our own click-to-sign with an audit trail, or
  - an e-sign provider: Aadhaar eSign via Digio or Leegality, or DocuSign.
- Who may see signed documents?
- Must signing work offline on the phone?
- Do documents need to be available in local languages?

---

## 9 · Device requirements, validated at capture

**Asked:** the client states which devices must be used, and the platform checks this during capture.

**Today:**
- RFPs can set capture-quality rules: megapixels, video resolution, orientation, tilt, GPS, clip length, and whether gallery uploads are allowed. The phone enforces these.
- "Device specifications" is free text that nothing checks.
- The app never records which phone was used.
- The server re-checks only file type and size.

**What we will build**
- **Structured device requirements in the RFP builder:**
  - device type (smartphone, action cam, 360° camera, LiDAR, or sponsor equipment);
  - minimum Android/iOS version;
  - allowed or blocked brands and models;
  - minimum megapixels and video resolution;
  - LiDAR required;
  - GPS required.
- **Phone check before work starts:** the app compares the phone with the requirements. If they aren't met, the worker sees what's missing and cannot start.
- **Every capture records the device.** The server cross-checks it against the photo's own metadata and flags mismatches for QA.
- **Aggregators see each worker's device,** so they assign work only to eligible workers.
- **Web uploads** on RFPs with device requirements are blocked or flagged.
- Sponsor-equipment RFPs link each capture to the loaned device.

**Rules:**
- Device information is personal data, so the privacy notice must be updated.
- Phone-reported values can be faked, so server cross-checks and QA review are the backstop.

**Done when:** a phone that doesn't meet the rules cannot start work, every accepted capture shows its device, and
mismatches are flagged.

**Decisions needed:**
- Which requirements matter first?
- Should a mismatch be a hard block or a warning?
- Should web uploads be allowed on these RFPs?
- Is LiDAR detection (extra native work) needed now?

---

## Cross-cutting notes

- **3, 4, 5 and 6 are one redesign of bidding and awarding.** Multi-award (6) needs per-unit pricing (3). The
  deadline (4) locks at *full* award. The chat (5) is one thread per partner per RFP.
- **8 and 9 check at the same two moments:** accepting an offer and starting an assignment. Build the check once.
- **Privacy:** 1b, 8 and 9 add personal or commercial data. Each needs rules on who can see it, and 8 and 9 need an
  updated worker privacy notice.
- **Every change needs database updates,** written twice (schema file + migration), and tests, including tests that
  another organisation can't see the new data.
