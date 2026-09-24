# End-to-end test runbook

*One manual pass over the whole product, written for the merge of 23 September 2026: the
clip QA pipeline (photos and video checked the same way, on the phone) and the
partner/aggregator bug fixes (crowd-resource wording, skills, offboarding, responses, bell
links). Follow it top to bottom; it takes 60–90 minutes. Re-run it after the next merge —
every check is written as **do this → expect exactly this**, so a change in wording is a
finding rather than a judgement call.*

---

## 1 · Before you start

### What is real, and what is not

**Nothing here is sandboxed.** The code is yours; everything it touches is production.

```
YOUR LAPTOP                                   REMOTE / SHARED
  console  npm run dev      :5173  ──┐
  (this branch)                      │
  API      uvicorn          :8000  ──┼────▶  Postgres on the VM  172.210.12.246/appdb
  (this branch)                      │        live data, Alembic 0021
                                     ├────▶  Gmail SMTP  as vaieoncosarathi@gmail.com
                                     └────▶  Azure Blob  cosarathistorage  (real bytes)

WORKER'S PHONE
  DataMind360 Capture (video)  ──────────▶  the VM's DEPLOYED API (9ce7d99 image)
                                              └──▶ the same Postgres, the same Blob
```

A task you create is the team's task. A clip you upload is production bytes. A mail you
send arrives in a real inbox — **only ever offer work to `vaishnavi.neela@gmail.com` or
`vaieoncosarathi@gmail.com`.**

### Two API processes, one database

Your laptop serves the console from this branch. The phone can only reach the VM's
deployed API: the address is compiled into the build (`mobile/src/config.ts`,
`ALLOW_SERVER_OVERRIDE = __DEV__`). That API is the **9ce7d99** image, so the phone is held
to its rules:

- **100 MB per video** (`media/service.py:52` at that commit). A 36 s 1080p clip is about
  60 MB; keep test clips short or presign answers 422.
- The clip fields (`min_duration_s`, `allow_library`, …) still reach the phone: they ride
  through `capture_spec` as jsonb extras.

### Known broken before you start — do not report it again

The database is **ahead** of that deployed API. Migration `0020` dropped
`crowd_worker.skill`, which 9ce7d99 still reads (`network/service.py:267`) and writes
(`api/v1/network.py:156`). So on **`cosarathi.eastus.cloudapp.azure.com`**, listing, adding
and inviting a crowd resource error. It clears the moment an api image built from this
branch is deployed. Capture is unaffected — no worker-facing endpoint reads that column —
so the phone parts below are valid.

### Bring it up

```powershell
git log --oneline -1          # expect this branch's merge commit
cd backend
$env:ENGAGEMENT_ENABLED="false"
.venv\Scripts\python -m uvicorn sourcehub.main:app --port 8000 --app-dir src
```

`ENGAGEMENT_ENABLED=false` matters: the reminder clock defaults to **on** (`config.py:61`)
and would mail real crowd resources 30 seconds after boot. Part F turns it on deliberately.

In a second terminal:

```powershell
cd frontend
npm run dev                   # http://localhost:5173, proxies /api to 127.0.0.1:8000
```

Leave `backend/.env` alone — it already points at the VM database, Gmail and Azure.

### The phone

Install the latest `video` build (it carries the in-app player), then open the app twice so
it picks up the JS updates published since:

```
https://expo.dev/artifacts/eas/emICStZLdatSdtaN19wRu5-BPim14jmEdSMm7sMocuw.apk
```

It installs beside the pilot app as **DataMind360 Capture (video)** — a different package,
so the team's pilot build is untouched.

### One thing about offer mail

`APP_BASE_URL` is `http://192.168.1.34:5173`, your laptop. The link inside an offer or
invitation mail therefore points at your dev console, and the phone must be on the same
Wi-Fi to open it. **The app has no offers screen** — an offer is accepted through that link
or not at all. Where the phone is only needed for capture, assign directly (A6) and skip
mail entirely.

### Sign-ins

| Role | Email | Password |
|---|---|---|
| Client | `client@acme.example` | `SourceHub#2026` |
| Delivery partner | `partner@northstar.example` | `SourceHub#2026` |
| Aggregator | `crowd@bengaluru.example` | `SourceHub#2026` |
| Crowd resource (phone) | `vaieoncosarathi@gmail.com` | the pilot password |

The console keeps one session: sign out between roles.

---

## 2 · Part A — the marketplace loop

Sign in as the **client**.

**A1 · Raise a video request.** Requests → New request. Title `E2E <today>`, unit
**videos**, quantity 3. Tick **Add capture detail**.

→ *Expect:* **Minimum megapixels is absent** and the video fields are shown — Shortest
clip, Longest clip, Video size, "Allow clips from the phone's gallery". Switch the unit to
`photos` and back: megapixels returns, the video fields vanish, and back again.

Fill in: Shortest `10`, Longest `45`, Video size **At least 720p**, tick the gallery box,
Orientation **Landscape**, Maximum tilt `15`. Publish. Note the RFP code.

**A2 · The partner reads it.** Sign out, sign in as the **delivery partner**.

→ *Expect:* the left nav says **Responses**, not Proposals. On Opportunities, the row's end
button reads **Opportunity details**, not Brief.

Open the request.

→ *Expect:* a **Client** panel naming Acme (or "Buyer not disclosed — …" if the request is
not open to the market). The proposals table shows **Price, Days, Methodology, Status
only** — no Partner column showing you your own name, no QA track record column, no
"Lowest price" chip.

**A3 · Respond.** Click **Respond**.

→ *Expect:* the dialog is titled **RFP response**; the long field is **How you will do the
work**; the attachments field is **RFP response documents** and its hint begins "Up to 10
files".

Attach **two files at once** (any PDFs; make one a `.pptx`).

→ *Expect:* both reach **done** — neither sticks on "uploading" — and the submit button
enables. Send. Toast: **Response sent**.

**A4 · Award.** Back as the **client**, open the request, award that response. A contract
appears.

**A5 · Assign a task.** As the **partner**, open the contract → Assign a task.

→ *Expect:* **Assign to** sits directly under Task title, not at the bottom. With the title
empty, hovering the disabled button says **"Name the task and choose a supplier"**; fill
only the title and it says **"Choose a supplier"**.

Title `E2E clips`; subject **`retail shelf`**, must show `shelf, products`, must not show
`person, selfie`; assign to **Bengaluru Crowd Collective**. Assign.

→ *Expect:* the task detail lists the inherited clip settings (10–45 s, 720p, gallery
allowed) and the subject row.

**A6 · Put it on the phone.** Sign in as the **aggregator**. Tasks.

→ *Expect:* the new task is at the **top** (newest first). The column and row button read
**Crowd**, not Workers.

Open **Crowd** on that task → Assign.

→ *Expect:* the dialog is **Assign a crowd resource**, the field is **Crowd resource**, the
placeholder is **"Choose a crowd resource…"**, and each line shows that person's skill
*labels* with no stray separator when they have none.

Assign 3 units to **vaishu2** — an assignment, not an offer, so no mail, and it reaches the
phone within 30 seconds.

---

## 3 · Part B — the crowd roster

Still the **aggregator**. Crowd page.

**B1 · Wording.** → *Expect:* the primary button is **Add crowd resource**, the table column
is **Skills**, and nothing on the page says "worker".

**B2 · Add with skills.** Click it.

→ *Expect:* the dialog is **Add a crowd resource** and Skills is a **checkbox group of
nine** (Shelf capture, Retail audit, Street imagery, Field survey, Household survey, Voice
capture, Transcription, Night driving, Drone operation) — not a text box.

Add `E2E Tester` with **Shelf capture + Night driving**, no email. → *Expect:* the row
shows both labels, comma-joined.

**B3 · Edit skills.** Open that person.

→ *Expect:* an **Edit skills** button; it swaps the footer to Cancel / **Save skills**.
Untick one and Save → the row updates. Reopen, change something, **Cancel** → nothing
changed.

**B4 · Offboarding asks first.** Click **Offboard** on `E2E Tester`.

→ *Expect:* a dialog **"Offboard E2E Tester?"** saying it **cannot be undone**, that they
lose capture-app access at next sign-in, and that the same email cannot be re-invited.
Cancel → the row is unchanged.

→ *Expect:* the **Break / On shift** toggle beside it is still one click, no dialog.

**B5 · Network copy.** Network page, Aggregators tab.

→ *Expect:* the button reads **Onboard an aggregator**. Switch to Business partners → it
reads **Onboard a business partner** and the dialog it opens carries the same words (it
used to say "Request a new business"). Submit one → toast **Sent for approval**.

---

## 4 · Part C — the phone

Sign in on the phone as **vaishu2**, open the `E2E clips` assignment, Start.

→ *Expect:* the "What to capture" card names the subject and the requirements card lists
the clip bounds. The camera opens in **video** mode with a **Gallery** chip, and the hint
reads **"Tap to start, tap again to stop · 10–45 s"**.

| # | Do | Expect |
|---|---|---|
| C1 | Hold the phone **portrait** (the task wants landscape) | amber **"Turn the phone landscape to record."** before you start |
| C2 | Start recording anyway, stay portrait | the line turns **red** and stays: *"Still portrait — turn the phone landscape or this clip will be refused."* Turn the phone → it goes at once |
| C3 | Record ~12 s landscape but tipped well past 15° | red *"Hold the phone square — 21° off; this clip will be refused."* while recording; the level bar reads amber |
| C4 | Record 5 s (under the 10 s floor) | refused before any upload: *"This task asks for clips of at least 10 s; that one is 5 s."* The counter does not advance |
| C5 | Record 12 s with the lens covered | refused: *"The clip is dark in N of M frames — was the lens covered?"* |
| C6 | Record 12 s of the floor or a blank wall | **Checking clip…** appears at once, then counts *3/7*; then the dialog **"Doesn't look like retail shelf"** naming how many frames matched. Any other finding is on screen **behind** the dialog, not after it |
| C7 | Tap **Keep** | the clip is queued and the amber block lists each finding **on its own line** |
| C8 | Record 12 s of an actual shelf, landscape and square | green **"Looks like retail shelf."**, no refusal |
| C9 | Tip the phone briefly mid-clip, straighten, stop | **kept** — one wobble does not refuse it (the check takes the median over the clip) |
| C10 | Tap **Gallery** and pick a clip | it goes through the same checks; one outside 10–45 s is refused the same way |
| C11 | Look at the capture grid | each clip shows **a still from itself** with ▶ over it, not a grey box |
| C12 | Tap a clip | it **plays in the app**, full screen, controls and sound; Close returns |
| C13 | **Is the picture upright?** | the open question — a landscape-held clip should play landscape. Record the answer |
| C14 | Wait for the uploads | tiles reach **ready** and the counter matches |

A clip over ~100 MB refused at upload is the deployed 9ce7d99 API, not a regression — §1.

---

## 5 · Part D — review

Back on the laptop as the **aggregator**; on the phone, submit the batch.

**D1 · Gate 1 queue.** Review page.

→ *Expect:* the columns read **Crowd resource** and **Their note**. The batch carrying the
off-subject clip sorts **above** clean ones and its Phone check cell reads *"N may be
off-subject"*.

**D2 · The captures.** Open the batch.

→ *Expect:* each tile carries at most one badge — **subject?** (amber), **dark** (amber),
**still** (amber) or **unchecked** (grey). Open one: the preview plays the clip and the
**Phone check** rows list every finding with its score.

**D3 · Reject with a note.** Reject the batch, note `E2E rework`.

→ *Expect:* toast **"Sent back to the crowd resource"**. On the phone the assignment
returns to work with the note visible.

**D4 · Rework and accept.** On the phone remove the bad clip, shoot a good one, resubmit.
Accept the batch.

**D5 · Gate 2.** As the **partner**, submit the task to the client; pass it at gate 2.

→ *Expect:* the task reaches **qa_passed** and the review trail lists both gates with their
notes.

---

## 6 · Part E — regressions elsewhere

| # | Do | Expect |
|---|---|---|
| E1 | A photo task on the phone | unchanged: single shot, the subject dialog where a subject is set, no clip banners |
| E2 | Bell → a "new task" notification | opens the **task detail dialog** for that task (`/tasks?task=…`); closing drops the query so Back does not reopen it; clicking the same one twice works |
| E3 | Bell → a gate-1 notification | goes to **/review** (it used to be a dead item) |
| E4 | A client profile viewed by the partner | **no DPA row at all** when the field is withheld — it must not claim "Not signed" |
| E5 | Contract → task breakdown | still **oldest first** (TSK-01 upward), while the supplier's own list is newest first |
| E6 | Phone → Settings | the footer reads **Role: Crowd resource**, not `Role: worker` |
| E7 | Add an 11th file to a response | refused with a message naming the limit; the 10 already there are untouched |

---

## 7 · Part F — reminders (optional; sends real mail)

Only with the team's two addresses on the offer. Stop the API and restart it **without**
`ENGAGEMENT_ENABLED=false`, then watch the log 30 seconds later.

→ *Expect:* `engagement pass: {...}` and one mail per due reminder. In the console, the
task's **Crowd** dialog shows the campaign funnel, `reminded ×n` pills and **Remind the
silent**; pressing it twice within an hour is refused with a readable message.

Turn it off again afterwards.

---

## 8 · Results

| Check | Pass / Fail / Not run | Note |
|---|---|---|
| A1 capture fields follow the media | | |
| A2 Responses, Opportunity details, Client panel | | |
| A3 RFP response, two files at once | | |
| A5 Assign dialog order and tooltip | | |
| A6 Crowd wording, newest first | | |
| B2–B3 skills add and edit | | |
| B4 offboard confirmation | | |
| B5 onboard copy | | |
| C1–C3 live orientation and tilt | | |
| C4–C5 duration and dark refusals | | |
| C6–C8 subject over frames | | |
| C10 gallery pick | | |
| C11–C12 poster and player | | |
| **C13 landscape clip plays upright** | | |
| D1–D2 gate 1 queue and badges | | |
| D3–D5 reject, rework, accept, gate 2 | | |
| E1–E7 regressions | | |

Record alongside: the **APK build id** (`eas build:list --platform android --limit 1`), the
**update group id** (`eas update:list --branch video`) and the git commit. A failure that
cannot be tied to a bundle cannot be chased.

---

## 9 · If something fails

- **A console string is wrong** — the strings live with the feature:
  `features/network/pages.tsx` (roster, onboarding), `features/marketplace/pages.tsx`
  (requests, responses), `features/qa/pages.tsx` (gate 1),
  `features/delivery/components/assignments.tsx` (the crowd dialogs).
- **A phone check misbehaves** — the rules are pure and unit-tested:
  `mobile/src/validation/rules.ts` (length, frame size, orientation, tilt, GPS),
  `clip.ts` (dark, frozen, frame times), `subject.ts` (labels, share of frames). Run
  `npx jest` before touching the screen.
- **A clip will not upload** — check its size against the 100 MB cap of the deployed API,
  then the assignment's status: only `in_progress` takes uploads.
- **The roster errors on the live site** — expected until an api image from this branch is
  deployed (§1); not a new bug.
- **Roll the phone back** — `eas update:list --branch video` shows the history; republish
  the previous bundle, or reinstall the APK to return to what it shipped with.
