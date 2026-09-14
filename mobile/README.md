# Cosarathi Capture

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
npx expo start                                 # scan the QR with Expo Go on the same Wi-Fi
```

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

## Building an installable pilot APK

```bash
npm install -g eas-cli && eas login
eas build -p android --profile preview         # internal distribution, .apk
```

`eas.json` is not committed yet; `eas build:configure` creates it. Expo Go is
enough for the first days of the pilot.
