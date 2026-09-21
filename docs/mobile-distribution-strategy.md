# Getting the phone app to workers — the strategy

*Agreed 19 September 2026. Companion documents:
[developer-accounts-guide.md](developer-accounts-guide.md) (for the people opening
the Google Play and Apple accounts) and [mobile-pilot-build-plan.md](mobile-pilot-build-plan.md) (the engineering work).*

## The decision

Two tracks run **in parallel**, because the slow one is paperwork and the fast one is code.

| Track | Who | What | How long |
|---|---|---|---|
| **1 · Google Play organisation account** | The organisation (admin / legal / finance) | Obtain a D-U-N-S number, open the Play Console account as an *organisation*, get it verified, invite the app team | **1–3 weeks**, almost all of it waiting |
| **2 · Pilot build through EAS** | The app team | Four code changes, then an installable Android APK that workers open from a link — no store account involved | **About 3 working days** |

Track 2 means the pilot does not wait for Track 1. When the Play account is verified, the same app moves onto
Google Play — internal testing first, then closed testing, then the public listing. iPhone comes after that, on
the same D-U-N-S number.

## Why an organisation account, not a personal one

- A personal account created since late 2023 must run a closed test with at least 12 testers for 14 days before
  it may publish anything. An organisation account is exempt.
- The account, and the signing identity of the app, must belong to the company — not to whichever person
  happened to register. The app's build project was in a personal Expo account; it was transferred to the
  organisation on 21 September 2026 (step 0 of the build plan), keeping its project id and its signing key.

## What "EAS preview build" means in practice

EAS is Expo's cloud build service. The `preview` profile in `mobile/eas.json` produces a signed Android **APK**
and a web page with an install link and QR code. A worker opens the link on their phone, downloads the file,
allows the install, and has the app. No Play account, no review, available minutes after the build finishes.

This is sideloading, and it has limits we accept for a pilot and would not accept for thousands of users:

- The worker must allow "install from unknown sources", and Play Protect may show a warning to tap through.
- The APK does not update itself. **Over-the-air updates cover everything written in JavaScript** — screens,
  wording, thresholds, most fixes — which is why they must be in the very first build. A change to native code
  (a new native module, an SDK upgrade) means sending workers a new APK to install over the old one.
- It is fine for tens to a couple of hundred known workers. It is not a public distribution channel.

## Two things that must be right from the first build

**1 · Over-the-air updates go in before anything is handed to a worker.** A build shipped without a
`runtimeVersion` can never receive an over-the-air fix for the life of that install. Adding it later does not
rescue phones already in the field.

**2 · One signing key, from the pilot APK through to Google Play.** Android only upgrades an app in place when
the new build is signed with the same key. If the Play version were signed differently from the pilot APK,
every pilot worker would have to *uninstall* before installing from Play — and uninstalling deletes any captures
that have not finished uploading, which is unpaid work lost. So:

- the build project now sits in an organisation-owned Expo account, so the key EAS generated belongs to the
  company rather than to one person. It moved by **transfer**, which keeps the existing key — had a new project
  been created instead, the new key would itself have forced the uninstall this section is about; and
- when the app is created in Play Console, we enrol in Play App Signing **using that same key** (Play's
  "use an existing key" option) instead of letting Google generate a new one.

With both in place a worker goes from the pilot APK to the Play version by simply installing the update.

## Order of events

1. **Today** — the organisation starts the D-U-N-S check (guide, step 1). The app team starts the build plan.
2. **About day 4** — pilot APK on workers' phones, talking HTTPS to the deployed platform, the privacy notice
   shown and accepted in the app, over-the-air updates proven. For the pilot the acceptance is kept on the
   phone and each aggregator holds a paper acknowledgement from its workers; the server-side record comes
   before closed testing.
3. **When the Play account is verified** — create the app in Play Console with the existing signing key, upload
   to *internal testing* (up to 100 testers, live within minutes, no review), move pilot workers across.
4. **When the pilot widens** — closed testing. This needs the store listing, the privacy policy URL and the
   Data safety form, and Google reviews it (allow several days the first time).
5. **Public** — promote to production with a staged rollout.
6. **iPhone, after Android** — the Apple Developer Program enrolment (organisation, US$99 a year, same D-U-N-S)
   is requested **now, alongside the Google Play account**, because it is paperwork with a long wait; both are
   covered by [developer-accounts-guide.md](developer-accounts-guide.md). The iPhone release itself still comes
   after Android: TestFlight for testers, then App Review. The app is invitation-only with no sign-up, so the review
   will need a working demo account and a note explaining the business model; Apple's unlisted distribution is
   worth considering.

## What is deliberately not part of this

Aggregator and worker earnings, background upload while the app is closed, resumable upload for large videos,
and crash reporting are all worth doing and none of them block the pilot. Crash reporting is the one to decide
before the *public* listing, because adding it afterwards means re-filing the Data safety declaration.
