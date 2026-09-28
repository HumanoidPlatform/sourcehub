# Demo feedback — the plan list

*DataMind360 · from the client demo · written 28 Sep 2026, status updated the same day. Each item: what was asked,
how the platform behaves today, what we will build, the rules, how we'll know it's done, and the decisions still
needed. Sizes are rough: S = days, M = 1–2 weeks, L = 2–4 weeks, XL = 4+ weeks.*

## At a glance

| # | Feature | Who it's for | Status | Size | Depends on |
|---|---|---|---|---|---|
| 1 | Detailed client/partner profile at onboarding, with logo | Platform admin, client, partner | **Done** (public profile). Owner-only editing (1a) requested; private details (1b) not started | M | — |
| 2 | **Vendors** tab for clients | Client | Not started | M | partner expertise fields |
| 3 | Flexible budget: total range **or** rate per unit | Client, partner | Not started | M | — |
| 4 | Bidding deadline, editable until award | Client, partner | **Done** | S–M | — |
| 5 | Private one-to-one Q&A / chat per RFP | Client, partner | Not started | L | — |
| 6 | Award one RFP to **several** partners, partial quantities | Client, partner | Not started | XL | 3 |
| 7 | Bulk-import crowd from Excel/CSV | Aggregator | Not started | M | — |
| 8 | Documents the crowd must e-sign before capture | Client, worker | Not started | L | — |
| 9 | Device requirements, validated at capture | Client, worker | Not started | M–L | — |

**Suggested order for what remains:**
1. Quick wins: 7 (4 is done).
2. The bidding model together: 3 + 6, then 2.
3. Crowd safeguards: 8, 9.
4. Chat: 5.

Items 3, 4, 5 and 6 all reshape bidding and awarding, so they are best designed together.

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

## 2 · "Vendors" tab for clients

**Asked:** a Vendors tab in the client workspace listing active vendors with name, website, experience and expertise.

**Today:**
- Clients have no way to browse partners. A client only sees partners who bid on its own RFPs or hold a contract with it, so a new client sees none.
- Partner profiles now have logo, website, size, founded year, address and description (item 1). There are still no structured expertise fields.
- The performance figures (on-time %, QA pass %, rating) are demo seed data; nothing calculates them.

**What we will build**
- A **Vendors** item in the client's sidebar, opening a directory of **active delivery partners**, as cards or a table:
  - logo, name, website, description (from item 1);
  - **experience** (years in business, projects completed on DataMind360);
  - **expertise** (new structured fields):
    - data types: image, video, audio, text;
    - domains, such as retail or automotive;
    - languages;
    - countries or regions served;
  - certifications (ISO 27001, SOC 2…);
  - rating (average of client ratings + count), plus on-time and QA-pass rates **calculated from real contracts**.
- **Search and filters:** expertise, data type, region, rating.
- **A vendor detail page** with the full public profile and past performance.

**Rules:**
- Only active delivery partners appear, never a partner's own network (aggregators, sponsors, crowd).
- No commercial or private fields.
- Ratings are shown as an aggregate.

**Done when:** a brand-new client sees every active partner with the fields above, can filter by expertise and region,
and sees no private data.

**Decisions needed:**
- Does "vendors" mean delivery partners only, or aggregators too?
- Should other clients' review comments be shown, or only the average?
- Should "Invite this vendor to bid" on an RFP come now or later?

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

**Decisions needed:**
- Is the per-unit budget one number or a range?
- For per-unit contracts, is the partner paid on **accepted units**, or a fixed total set at award?
- Which currencies do we support at launch?

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

## 5 · Private one-to-one Q&A and chat

**Asked:** before bidding, a partner can ask the client questions in a private chat no other partner can see. After a
bid, they can discuss the bid. The history stays until delivery.

**Today:**
- There is no messaging of any kind.
- A bid's "notes" field is never shown to the client.
- Notifications are one-way, and screens refresh on a timer.

**What we will build**
- **One conversation per RFP per partner,** between the client and that partner only:
  - before bidding: "Ask a question" on any RFP the partner can see;
  - after bidding: the same thread, shown beside that partner's bid;
  - after award: it continues through delivery, then becomes read-only. Nothing is deleted.
- The client sees all conversations on an RFP, with unread counts. A partner sees only its own.
- **Messages:** text, attachments, sender, time and read status.
- **Notifications:** a bell alert per message, and an email digest when a message stays unread.

**Rules:**
- **Blind bidding is preserved:** no partner ever sees another partner's thread.
- Messages cannot be edited or deleted.
- Aggregators and crowd are not part of the conversation.

**Done when:** two partners asking about the same RFP each see only their own thread, the client sees both, and the
thread survives bidding, award and delivery.

**Decisions needed:**
- Can the client **publish an answer to all partners** (a public clarification)?
- Can the client start a thread?
- Can Ops read threads in disputes?

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
- **Delivery and billing:** delivery is approved per partner, and invoices are raised per contract.

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

## 7 · Bulk-import the crowd from Excel/CSV

**Asked:** aggregators add their crowd in bulk from a spreadsheet, not one by one.

**Today:**
- The Roster page adds one worker at a time: name, optional email and phone, skills from a fixed list of 9, trained yes/no.
- A worker with an email gets an invitation.
- An email already used anywhere on the platform is refused.
- There is no import of any kind.

**What we will build**
- **Import crowd** on the Roster page:
  1. **Download a template** (Excel and CSV): name*, email, phone, skills, trained.
  2. **Upload** the filled file (CSV or XLSX, up to e.g. 1,000 rows).
  3. **Preview:** each row is marked ready, warning or error, with the reason:
     - missing name;
     - invalid email;
     - duplicate in the file;
     - email already registered;
     - unknown skill.
  4. **Import the valid rows.** Rows with an email get invitations; the rest become roster-only records.
  5. **Summary:** added, invited and skipped counts, with a downloadable error report.
- One bad row never blocks the rest, and re-uploading the same file adds nothing twice.
- Invitations are sent in batches, with a resend option.

**Done when:** a 500-row file imports in one go, bad rows are listed with reasons, invitations go out, and a second
upload of the same file adds nothing new.

**Decisions needed:**
- Is Excel/CSV enough? Reading lists out of Word or PDF is unreliable.
- What is the maximum number of rows per file?
- Should a phone number identify workers who have no email?

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
