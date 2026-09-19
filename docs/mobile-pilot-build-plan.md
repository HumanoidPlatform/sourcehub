# Pilot build through EAS — the engineering plan

*The work that lets a worker install the app from a link while the Google Play account is being set up. See
[mobile-distribution-strategy.md](mobile-distribution-strategy.md) for why.*

An EAS preview build already works today — `mobile/eas.json` has the profile. What it would produce is not fit
to hand to a worker, for four reasons verified in the tree:

| # | Problem today | Evidence |
|---|---|---|
| 1 | The API is plain HTTP. Passwords and tokens travel unencrypted, and so does the presigned storage URL — which is a write credential in itself ("no bearer, the URL is the credential") | `infra/deploy/docker-compose.yml`, `mobile/src/api/client.ts:8` |
| 2 | No over-the-air updates: every fix would mean sending every worker a new file to install | no `expo-updates`, no `runtimeVersion` in `mobile/app.json` |
| 3 | No profile sets the API address, so a build falls through to `http://192.168.1.20:8000` — a home router | `mobile/eas.json`, `mobile/src/config.ts:4` |
| 4 | The app says nothing about privacy while collecting precise location, photos of real places and people, and audio | no match for privacy / consent / terms anywhere in `mobile/src` |

About **3 working days**. Steps 1–4 are independent of each other; step 0 comes first and step 5 last.

---

## Before you start

- **The repository is ahead of the VM.** The VM runs build `6d961fd` with the database at migration `0014`.
  `0015_ops_onboarding` and `0016_email_is_taken` have since been merged. This plan adds no migration of its
  own, but deploying a newer API still means running those two first, with the one-line `docker run … alembic upgrade head`
  documented at the bottom of `infra/deploy/docker-compose.yml`. The laptop shares that database, so it needs
  the same code afterwards.
- **`npm install` in `mobile/`.** `@react-native-ml-kit/image-labeling` and `expo-dev-client` are declared in
  `package.json` and not installed locally.

## Step 0 — The build project must belong to the organisation *(half a day, mostly yours)*

`mobile/app.json` has `"owner": "vaishnavineela"` — a personal Expo account. EAS keeps the Android signing key
inside the project, so today the key that will sign the app belongs to one person.

1. Create an **Expo organisation** and add the team to it.
2. Transfer the project from the personal account (Expo dashboard → project → settings → transfer), or create a
   new project under the organisation and update `owner` and `extra.eas.projectId`.
3. `eas credentials` → confirm an Android keystore exists under the organisation, and **download a backup** to
   the company's password vault.

This must happen **before the first APK reaches a worker**. Android upgrades an app in place only when the
signing key matches, and that same key is later uploaded to Google Play (Play App Signing → "use an existing
key") so that pilot workers can move to the Play version without uninstalling. Uninstalling deletes captures
that have not finished uploading.

## Step 1 — HTTPS for the API *(1 day, mostly waiting for DNS)*

**A name for the VM.** Either a company domain with an A record pointing at `172.210.12.246`, or — free and
enough for the pilot — an Azure DNS label: portal → the VM's public IP → Configuration → *DNS name label*, which
gives `<label>.<region>.cloudapp.azure.com`. Let's Encrypt issues certificates for either. The address is
compiled into the app's JavaScript, so moving to a company domain later is an over-the-air update, not a new
build.

**Caddy in front, in `infra/deploy/docker-compose.yml`.**

- Add a `caddy` service: image `caddy:2`, ports `80:80` and `443:443`, a Caddyfile of two lines
  (`<domain> { reverse_proxy web:80 }`), and host volumes `/opt/stack/data/caddy/data` and `…/config`.
  **The data volume is not optional**: it holds the certificate, and Let's Encrypt rate-limits re-issuing. A
  container that loses it on every restart will lock itself out within a week.
- Remove `ports: "80:80"` from `web`. It becomes internal, like `api`. The `db` block stays untouched.
- `APP_BASE_URL` and `CORS_ALLOWED_ORIGINS` become `https://<domain>`, so emailed invitation and reset links
  are HTTPS too.
- Azure: open inbound **443**. Keep 80 open — Caddy needs it for the certificate challenge and redirects it to
  HTTPS.

**One regression to prevent.** `frontend/nginx.conf` deliberately sends `X-Forwarded-For $remote_addr`, because
a caller could otherwise choose the address recorded against a sign-in attempt, and a non-IP value returned 500
from the login endpoint. With Caddy in front, `$remote_addr` becomes Caddy's container address and every sign-in
would be recorded from it. Add to the nginx `server` block:

```nginx
set_real_ip_from 172.16.0.0/12;      # the Docker networks; only Caddy can reach this container
real_ip_header   X-Forwarded-For;
```

Caddy discards a client-supplied `X-Forwarded-For` by default and writes the true peer, so after this nginx sees
the real client and the existing `$remote_addr` lines stay correct. **Re-run the forged-header test** described
in `infra/deploy/README.md` afterwards — it is the proof.

**What else this fixes.** The crowd worker's browser upload, which silently does nothing today: browsers
withhold `crypto.subtle` from non-HTTPS pages and `frontend/src/features/capture/hash.ts` has no fallback.

## Step 2 — Over-the-air updates *(half a day)*

```sh
cd mobile
npx expo install expo-updates
eas update:configure          # writes updates.url and runtimeVersion into the app config
```

- `runtimeVersion: { "policy": "appVersion" }` — an update reaches only builds with the same `version`. **Rule
  to adopt:** bump `version` in the app config whenever native code changes (a new native module, an SDK
  upgrade, a permission). Forget it and an update built for new native code is delivered to old binaries.
- `mobile/eas.json`: `"channel": "preview"` on the preview profile and `"channel": "production"` on production.
- Day to day: `eas update --channel preview --message "what changed"`. The app fetches it on next launch and
  applies it on the launch after. A bad update is undone by republishing the previous one.

EAS Update's free tier covers a pilot of this size.

## Step 3 — The right server in every build, and nothing a tester's tool can be turned against *(half a day)*

- `mobile/eas.json`: `"env": { "EXPO_PUBLIC_API_URL": "https://<domain>" }` on `preview` and `production`.
  `development` keeps reading `mobile/.env`.
- `mobile/src/config.ts:4`: replace the LAN address in `DEFAULT_API_URL` with the HTTPS address. A fallback
  should be the real server, not somebody's router.
- **Cleartext only in development builds.** `mobile/app.json` sets `usesCleartextTraffic: true` and
  `NSAllowsArbitraryLoads: true` for every build. Convert to `app.config.ts` and apply both only when
  `process.env.EAS_BUILD_PROFILE === "development"`. A pilot build then refuses `http://` outright.
- **Hide the server override from pilot builds.** The "Server: … change" link on sign-in
  (`mobile/src/app/(auth)/sign-in.tsx:85`) and "Save address" in Settings
  (`mobile/src/app/(app)/settings.tsx:89`) are right for us and a phishing tool against a worker: `getBaseUrl()`
  prefers a saved override over everything else (`mobile/src/api/client.ts:28`), so anyone who talks a worker
  into changing it receives their password. Show both only when
  `process.env.EXPO_PUBLIC_ALLOW_SERVER_OVERRIDE === "1"`, set in `mobile/.env` and the `development` profile
  and nowhere else. An environment variable rather than a config flag, so it holds for over-the-air updates too.
  (An earlier draft allowed it in preview builds as well. Preview is now what real workers install, so it is
  development only.)
- Show the build in Settings — `expo-application`'s version and build number — so a worker can read out which
  build they have.

## Step 4 — The privacy notice *(half a day; the wording needs the organisation's approval)*

**Decision for the pilot: the notice is shown and accepted in the app, and the acceptance is kept on the phone
only. No new table, no endpoint, no migration.** Nothing forces a server-side record yet — a build installed from
a link is outside the stores' policies, and the pilot is 50–200 known workers recruited through aggregators. The
durable record for the pilot is on paper: **each aggregator has its workers acknowledge the same notice**, by
signed sheet or email, and keeps it. The server-side record is deferred to the Play stage and described at the
end of this document.

What cannot be deferred is telling the worker. The app collects precise location from people who are not
employees, on their own phones.

**The phone.**

- `mobile/src/app/(app)/_layout.tsx` already forces a screen before the app — the `must_change_password`
  redirect. Add the same one line for the notice: if the version accepted by this user is not the current
  `PRIVACY_NOTICE_VERSION`, redirect to `/consent`.
- New `mobile/src/app/(app)/consent.tsx`: the notice in plain words, a link to the full policy (opened with
  `expo-web-browser`, already installed), **I agree**, and **Not now** — which signs out. There is no third path.
- On agree: save `consent:<user_id>` through the existing `getKv` / `setKv` (`mobile/src/db/kv.ts`) as
  `{ document, version, accepted_at, app_version, platform }`. **Keep exactly that shape** — it is what the
  server will want later, so when the table arrives the app uploads the acceptance it already holds and nobody
  is asked twice. It works with no signal, so a worker in a basement is never blocked from starting a shift.
- Settings: a link to the policy and "accepted on <date>".
- Bumping `PRIVACY_NOTICE_VERSION` re-asks everyone. It arrives over the air.

**Known weakness, accepted for the pilot:** the only digital record is on the worker's phone. Uninstalling or
losing the phone loses it — which is what the aggregators' paper acknowledgement is for.

**The console.** A public `/privacy` page beside the other anonymous routes (`/login`, `/accept-invitation`,
`/reset-password`, `/offer` in `frontend/src/app/router.tsx`). This is the URL the notice links to, and later
the one the Play listing requires.

**Draft notice — for the organisation to correct and approve, not to ship as written:**

> **Before you start**
> Cosarathi Capture records the following while you work:
> - **Photos and videos you take in the app**, including sound when you record video. They may show people who
>   happen to be nearby.
> - **Your precise location at the moment of each capture**, and the time. Location is read only while you are
>   capturing, never in the background.
> - **Your name and email address**, and which assignments you worked on.
> - **How each capture was checked on this phone** — for example sharpness, tilt, and whether it appears to show
>   the right subject.
>
> Your captures go to the organisation that assigned you the work, to the delivery partner it works for, and to
> the client who ordered them. They are used to fulfil that order and to review and pay for your work.
> We keep them for **[retention period]**. To ask what we hold about you, or to ask for it to be deleted, write
> to **[contact email]**.
> Operated by **[legal company name, address]**. Full policy: **https://<domain>/privacy**

Two cautions about that text. It must not promise anything the platform does not do: **nothing deletes data
automatically today**, and the client-facing "strip GPS", "blur faces" and "redact plates" options are not
implemented — so the notice describes a contact route, not an automatic process. And a lawyer should read it
against India's DPDP Act 2023 before it is shown to a worker; the same conversation should confirm when that
Act's obligations become enforceable, because that date is the real deadline for the server-side record.

## Step 5 — Build, prove, distribute *(half a day)*

```sh
cd mobile
eas build --profile preview --platform android
```

EAS returns a page with an install link and a QR code. On **two or three real phones, off your Wi-Fi**:

1. Install from the link. Expect "allow installs from this source" and possibly a Play Protect warning.
2. Sign in, accept the notice, open an assignment, capture a photo and a video, watch them upload.
3. Confirm the subject check actually runs. In Expo Go it is skipped, so this is the first time ML Kit labels a
   real photo — look for a label list in the capture's checks, not an absent finding.
4. Change one visible word, `eas update --channel preview`, relaunch twice, see the change. **If over-the-air
   does not work now, it will not work in the field.**

Then send the link to the pilot workers with three lines of instruction: open the link on your phone, tap
Install and allow it, sign in with the email and password from your invitation.

Builds on the free EAS plan queue for a while and are limited per month. That is enough for a pilot; a paid
plan only buys a faster queue.

## Verification

| Step | Proof |
|---|---|
| 0 | `eas credentials` shows the keystore under the organisation; a backup is in the vault |
| 1 | `https://<domain>/health` answers with a valid certificate; `http://` redirects; a sign-in carrying `X-Forwarded-For: 203.0.113.77` is recorded from the real address, and a non-IP value returns 401, not 500; the browser worker upload now queues a file |
| 2 | A one-word update lands on an installed build with no reinstall |
| 3 | A fresh install on a phone off your network signs in with no manual server address; the pilot build shows no "change server" link; an `http://` address is refused |
| 4 | The notice appears once per user and version and cannot be skipped; accepting works with no signal; the saved record has all five fields; "Not now" signs out; each aggregator confirms it holds its workers' acknowledgements |
| All | `npx tsc --noEmit` and `npx jest` in `mobile/` (72 tests today), `pytest` in `backend/`, `npx tsc --noEmit` and `npx vitest run` in `frontend/` |

## Needs from the organisation

An Expo organisation account (step 0) · the domain, or the Azure DNS label, and the inbound 443 rule (step 1) ·
the legal name, contact address and retention period for the notice, approval of its wording, and the
aggregators' paper acknowledgements (step 4) ·
two or three phones for step 5.

## Afterwards, when the Play account is verified

Create the app with package `com.cosarathi.capture`, enrol in Play App Signing **with the existing key** from
step 0, `eas build --profile production` (an AAB, which is what Play requires), upload to internal testing, and
move the pilot workers across. They install the update over the pilot APK and lose nothing.

### The server-side consent record — deferred from step 4, due before closed testing

Once workers are many and not individually known, paper acknowledgements stop being practical and the record has
to live on the server. About one day:

- **Not `consent_artefact`.** That table (`db/050_delivery.sql:215`) is one row per *person photographed*, per
  contract — `contract_id` is required and the subject is pseudonymous. A worker accepting the app's notice
  happens before any contract exists and must name the user. Mixing the two would corrupt what that table means.
- `db/170_user_consent.sql` + the next Alembic revision, the same SQL in both as the house rule requires, and
  the file added to `infra/bundle_schema.sh`. (`0017` if nothing else lands first.)
- `user_consent (id, user_id, document, version, accepted_at, received_at, app_version, platform)`, append-only
  like the audit tables. Row-level security: a user reads and inserts their own rows; the platform admin reads all.
- `GET /api/v1/me/consents` and `POST /api/v1/me/consents`. The client's `accepted_at` is kept because acceptance
  may have happened offline — or weeks earlier, during the pilot — and the server records its own `received_at`
  beside it.
- The phone uploads the record it already holds from step 4 on the next successful request. No worker is asked
  again unless the notice version has changed.
