# Opening the company's developer accounts — Google Play and the Apple App Store

> **Fill these in before sending** — replace each placeholder wherever it appears, or write it in by hand.
>
> | Placeholder | What goes there |
> |---|---|
> | `<org name>` | The company's legal name, exactly as on its registration documents |
> | `<developer name>` | The name the public should see under the app on Google Play |
> | `<email>` | The app team's email address — for questions, and to invite into both accounts |
> | `<contact name>` | The person in the app team to ask |
> | `<phone>` | That person's phone number |

**Who this is for:** the person in `<org name>` who will register the accounts — usually someone in
administration, finance or legal, with access to the company's registration documents. No technical knowledge
is needed.

**What we are asking:** to open two *developer accounts in the company's name* — one with Google, one with
Apple — so that our mobile app can be published for Android phones and for iPhones. The app team cannot do this
itself: both stores verify the legal organisation and the person registering it.

| | Google Play | Apple App Store |
|---|---|---|
| **Cost** | US$25, paid **once** | US$99 **every year** (charged in local currency) |
| **Needs a D-U-N-S number** | Yes | Yes — the same one |
| **Who must register** | A company representative | Someone with legal authority to sign for the company |
| **Your time** | About two hours | About two hours |
| **Elapsed time** | Usually 1 to 3 weeks | Usually 1 to 3 weeks |

Both applications wait on the same first step, the D-U-N-S number, and can then run **side by side**. Nearly all
of the elapsed time is waiting, so **please start step 1 as soon as possible**.

App team contact for any question on this page: **`<contact name>` — `<email>` — `<phone>`**

---

## Before anything else: do we already have these?

Ask IT, or whoever manages the company's websites and apps, three questions:

1. *Does the company already have a **D-U-N-S number**?* If yes, skip step 1.
2. *Does it already have a **Google Play Console** developer account?* If yes, only step A5 of Part A is needed.
3. *Is it already enrolled in the **Apple Developer Program**?* If yes, only step B5 of Part B is needed.

Steps A5 and B5 are where the account's owner invites the app team in.

---

## Step 1 — Get the company's D-U-N-S number *(once, for both stores — the long wait, start today)*

A D-U-N-S number is a free nine-digit identifier for a business, issued by Dun & Bradstreet. Google and Apple both
use it to confirm that the organisation is real, and both read the company's legal name and address from it.

1. **Check whether one already exists.** Many registered companies have one without knowing. Search for the
   company on Dun & Bradstreet's website for your country (in India, `dnb.co.in`), or ask the finance team —
   it sometimes appears on credit or supplier paperwork. Apple also offers a free look-up at
   `developer.apple.com/enroll/duns-lookup`, which finds an existing number or starts a free request.
2. **If there is none, request one.** It is free through Dun & Bradstreet's standard request or through Apple's
   look-up page above. You will be asked for the legal company name, registered address, phone number, the name
   of a director or owner, the type of business and the number of employees.
3. **Wait.** Allow anywhere from a few working days to about three weeks. Dun & Bradstreet offers a paid
   fast-track if we are in a hurry — please ask the app team before paying for it.
4. **Allow two or three more days** after the number arrives before using it. A brand-new number takes a short
   while to reach Google's and Apple's systems.

> **The detail that matters most:** the legal name and registered address in the D-U-N-S record must match the
> company's registration documents *exactly* — spelling, punctuation, "Pvt Ltd" versus "Private Limited". Both
> stores copy them from that record, and a mismatch is the most common reason an application gets stuck. If the
> existing record is out of date, ask Dun & Bradstreet to correct it **before** registering with either store.

## Step 2 — Gather these once, for both applications

- [ ] The D-U-N-S number
- [ ] Legal company name (`<org name>`) and registered address, exactly as in the D-U-N-S record
- [ ] The company's **website** address — it must be live, public, and clearly the company's own
- [ ] An **email address on the company's own domain** (not a free webmail address) and a **phone number** that
      may be shown to the public
- [ ] A company document: certificate of incorporation, GST registration, or similar
- [ ] Government photo ID of the person registering
- [ ] A company card for the fees: US$25 for Google, US$99 for Apple
- [ ] For Apple: the name of the person who has **legal authority to sign agreements for the company**

---

# Part A — Google Play *(Android phones)*

## A1 — Create a company Google account to own it

The developer account will belong to whichever Google account registers it, so it must not be anyone's personal
account.

- Create or choose a **company-controlled address** on the company's own domain — ideally a shared mailbox, such
  as one named "mobile" or "apps", that more than one person can read.
- Turn on **2-Step Verification** for it. Google requires this.
- Make sure the recovery phone and recovery email also belong to the company, not to one employee.

## A2 — Register

1. Signed in with the company Google account from A1, go to **`play.google.com/console/signup`**.
2. When asked what kind of account, choose **"An organisation"** — not "Yourself". This matters: personal
   accounts have to run a two-week test programme before they may publish anything, and organisation accounts
   do not.
3. Enter the **D-U-N-S number**. Google fills in the company name and address from it. Check them.
4. Choose the **developer name**. This is the name the public sees on the Play Store under the app. Please use:
   **`<developer name>`**
5. Fill in the organisation and contact details, and verify the email and phone with the codes Google sends.
6. Accept the developer agreement and pay the US$25 registration fee.

## A3 — Verification

Google will then ask you to prove two things: that the **person** registering is real, and that the
**organisation** is real. Expect to upload the government ID and the company document from step 2. Google may
also ask you to confirm that the company owns its website — if so, send that request to IT or to the app team;
it takes a few minutes for whoever manages the site.

Verification usually takes a few days. Google emails the account's address with the result or with questions,
so **please watch that mailbox** — an unanswered question is the second most common reason for delay.

## A4 — What the public will see on Google Play

The developer name, the company's legal name and address, a contact email, and the website. Assume anything
Google labels "public" is public, and use company contact details rather than a personal phone number or address.

## A5 — Give the app team access

Once the account is verified:

1. In Play Console, open **Users and permissions** → **Invite new users**.
2. Invite: **`<email>`**
3. Give them **Admin** permission for now. It can be narrowed to just this app once the app exists.

The account stays the company's; the app team's permission can be withdrawn at any time.

---

# Part B — Apple App Store *(iPhones)*

Apple's membership is called the **Apple Developer Program**. It is a yearly subscription, not a one-off fee.

## B1 — Decide who enrols

Apple requires the person who enrols to have the **legal authority to bind the company to agreements**: the
owner or founder, a director or member of the executive team, or an employee who has been given that authority by
one of them. Apple checks this — usually by email, sometimes by phoning the person or a senior contact they name.

That person becomes the **Account Holder**. There is exactly one, only they can accept Apple's agreements, and
the role can be transferred later if they change job.

## B2 — Create a company Apple Account to own it

An Apple Account is what Apple used to call an Apple ID.

- Create it at `account.apple.com` using the enrolling person's **real legal name** (Apple rejects team or
  department names here) and an **email address on the company's own domain**. Apple expects a work address, not
  free webmail, and a mismatch between the email's domain and the company's website is a common cause of delay.
- Turn on **two-factor authentication**. Apple requires it. This needs a phone number, and works most smoothly
  when the account is signed in on an iPhone, iPad or Mac.
- Use a phone number the company will keep. If it is one person's mobile, record that fact, so that the account
  can be recovered when that person leaves.

## B3 — Enrol

1. Go to **`developer.apple.com/programs/enroll`** and sign in with the Apple Account from B2. (Apple may instead
   direct you to its **Apple Developer app** on an iPhone, iPad or Mac; in some countries that is the required
   route, and it includes a photo-ID check. Follow whichever Apple offers.)
2. For the entity type, choose **"Company / Organization"** — not "Individual". An individual enrolment would
   publish the app under one person's name and cannot be shared with a team.
3. Enter the legal entity name `<org name>`, the **D-U-N-S number**, the company's address, phone number and
   **website**. The name must be the legal entity itself — not a brand, trading name or branch.
4. Confirm that you have the authority to sign, or name the senior person who can confirm it, with their work
   email and phone number.
5. Submit. **Do not expect to pay yet** — payment comes after Apple's check.

## B4 — Verification, agreement and payment

1. Apple reviews the application and may email or phone to verify the details in B3. Please answer promptly, and
   tell the named senior contact to expect the call.
2. When Apple approves, it emails a link. The Account Holder signs in, **accepts the Apple Developer Program
   License Agreement**, and pays **US$99** (shown in local currency) by card.
3. The membership is normally active within a day or two of payment.

Our app is free to download, so **no bank or tax forms are needed**. If App Store Connect asks about a "Paid
Apps" agreement, leave it.

## B5 — Give the app team access

1. Go to **`appstoreconnect.apple.com`** → **Users and Access** → the **+** button.
2. Invite: **`<email>`**
3. Role: **Admin**. If a box labelled **"Access to Certificates, Identifiers & Profiles"** is shown, tick it —
   the app team needs it to prepare the app for upload.

The account stays the company's, and this permission can be withdrawn at any time. The Account Holder role stays
with the company's person.

## B6 — Two things that are different from Google

- **The name the public sees cannot be chosen.** For a company, the App Store shows the **legal entity name from
  the D-U-N-S record** — that is, `<org name>` — as the seller. It may therefore differ from `<developer name>`
  on Google Play. This is normal.
- **It must be renewed every year.** If the US$99 renewal is missed, the app is **removed from the App Store**
  until it is paid. Please put the renewal date in the finance calendar and turn on auto-renew if Apple offers
  it. Apple also revises its agreement from time to time; **only the Account Holder can accept the new version**,
  and uploads are blocked until they do — so that mailbox needs to be watched as well.

---

## What to send back to the app team

- [ ] The D-U-N-S number
- [ ] Google: confirmation that the account is verified, and the exact developer name that was registered
- [ ] Google: confirmation that the invitation in A5 has been sent
- [ ] Apple: confirmation that the membership is active, the exact legal entity name shown, and the renewal date
- [ ] Apple: confirmation that the invitation in B5 has been sent
- [ ] Who inside the company owns each account from now on, in case that person changes role

Please **do not** send passwords or verification codes to anyone, including the app team. The invitations in
A5 and B5 are all the access we need.

## If it gets stuck

| What you see | What to do |
|---|---|
| Either store rejects the company name or address | It differs from the D-U-N-S record. Have Dun & Bradstreet correct the record, then try again. |
| "D-U-N-S number not found" | A new number takes a few days to reach Google and Apple. Wait two or three days and retry. |
| Google rejects the document | Upload a clearer scan, and check it shows the same legal name and address as the D-U-N-S record. |
| Apple says it cannot verify your authority | Name a director or owner as the contact in B3, with their work email and phone, and let them know Apple will call. |
| Apple questions the email address or website | The email's domain, the website and the legal entity must belong together: use an address on the company's own domain, and a live website that names the company. |
| No word for over a week | Look in the account's mailbox, including spam, for a question. Then use the help option inside Play Console, or Apple's developer support contact page. |
| A screen looks different from this guide | Both stores change their wording from time to time. Follow what the screen says, and tell the app team what differed. |

## Checklist

**Both stores**

- [ ] Asked IT whether a D-U-N-S number or either account already exists
- [ ] D-U-N-S number obtained; name and address match the registration documents exactly
- [ ] Documents and details from step 2 gathered

**Google Play**

- [ ] Company Google account created, 2-Step Verification on
- [ ] Registered as **an organisation**, developer name `<developer name>`, US$25 paid
- [ ] Identity and organisation verified
- [ ] `<email>` invited as Admin

**Apple**

- [ ] Person with legal authority chosen as Account Holder
- [ ] Company Apple Account created, two-factor authentication on
- [ ] Enrolled as **Company / Organization** with the D-U-N-S number
- [ ] Apple's verification answered; agreement accepted; US$99 paid
- [ ] `<email>` invited as Admin, with access to Certificates, Identifiers & Profiles
- [ ] Renewal date in the finance calendar

**Finally**

- [ ] Everything under "What to send back to the app team" sent to `<email>`
