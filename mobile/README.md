# DataMind360 Capture

The crowd worker's app. A worker signs in with the email and password from
their invitation, sees the units their aggregator assigned to them, captures
photos and video, and submits. Files go straight from the phone to object
storage on a presigned URL; the API only ever sees the manifest.

Expo SDK 57 · React Native · TypeScript · expo-router.

## Run it against the local stack

The phone must reach two addresses on the dev machine: the API on 8000 and
MinIO on 9000. Both are signed into the URLs the server hands out, so
`localhost` never works from a phone.

```bash
# on the dev machine
ipconfig                                       # Wi-Fi IPv4, e.g. 192.168.1.20
# backend/.env → STORAGE_ENDPOINT=http://192.168.1.20:9000
cd backend && .venv/Scripts/python -m uvicorn sourcehub.main:app --host 0.0.0.0 --port 8000 --app-dir src
# allow inbound TCP 8000 and 9000 on the private network profile of the firewall

cd mobile
cp .env.example .env                           # EXPO_PUBLIC_API_URL=http://192.168.1.20:8000
npm install
npx expo start --go                            # QR for Expo Go, on the same Wi-Fi
```

**Scan it from inside Expo Go**, not with the phone's camera. The QR holds an
`exp://` address, which Android's camera and Google Lens cannot open — they say
"no usable data found". iOS's camera does handle it. Expo Go's own scanner, or
"Enter URL manually" with `exp://<your-Wi-Fi-IPv4>:8081`, always works.

`--go` matters: `expo-dev-client` is a dependency, so a bare `npx expo start`
offers a development build instead and prints a `cosarathi://…` QR that only an
installed development build can open. Press `s` in the terminal to switch
between the two at any time.

The API must be reachable from the phone, which means binding it to every
interface — `--host 0.0.0.0` above, not the default localhost — and allowing
inbound TCP 8000 and 8081 through the firewall.

From the phone's browser, `http://192.168.1.20:8000/health` must answer
before the app will. The address can also be changed on the sign-in screen.

A worker gets their login from the aggregator's Crowd roster (add with an
email). The invitation is emailed through the configured SMTP provider; open
the link to set the password. `APP_BASE_URL` in `backend/.env` must be an
address the phone can reach, not `localhost`.

## How uploads work

Every capture becomes a row in a SQLite outbox (`src/db/outbox.ts`) and a
file in the app's private directory. The upload loop (`src/upload/uploader.ts`)
runs while the app is open and connected and moves each row through

    captured → presigned → uploading → uploaded → confirmed

by hashing the file, asking the API for a presigned PUT, uploading the bytes
to storage, and asking the API to confirm. The transitions are a pure state
machine (`src/upload/machine.ts`, unit-tested) so the rules for retries,
expired links and give-ups are in one place. Airplane mode is fine: captures
wait; reconnecting resumes them. Uninstalling the app deletes captures that
have not been uploaded, which is why Settings shows how many are queued.

## Checks

```bash
npm run typecheck
npm test
```

## The subject check

A task can carry a *subject* (`capture_spec.subject`, typed by the aggregator
when assigning: "retail shelf — must show shelf, products, price tags — must
not show person, selfie, screenshot"). The worker reads it on the assignment
screen; after each photo the phone asks Google ML Kit's on-device image
labeller what it sees and scores the labels against those words
(`src/validation/subject.ts`). A low score asks the worker to keep or retake.
It never deletes anything by itself, and the finding (`wrong_subject`, with
score and labels) travels with the upload for the reviewer.

The labeller is a native module, so it works in a **development build**, not
in Expo Go. Wherever it cannot answer — Expo Go, an APK built without it, a
native error, or a first run slower than six seconds — the capture is kept
with a `subject_unscored` warning that names the reason, so the reviewer at
gate 1 sees *unchecked* rather than a silent pass. A photo that passes shows a
green *Looks like …* line in the viewfinder. `EXPO_PUBLIC_SUBJECT_STUB` in
`.env` fakes the labels for trying the dialog in Expo Go. `SUBJECT_OFF` and
`SUBJECT_DIALOG` in `src/config.ts` are the cut and the shadow switch.

## Building the app

```bash
npm install -g eas-cli && eas login
eas build -p android --profile development    # dev client: Expo Go's role, plus native modules
eas build -p android --profile preview        # internal distribution, .apk
```

Install the development build on the phone, then `npx expo start --dev-client`
and open the app; it connects to the same Metro server Expo Go did.
