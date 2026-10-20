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

A file up to 8 MB goes up in one PUT, hashed whole first. Anything bigger is
sent in 8 MB chunks against a session storage keeps (a Google resumable
session, Azure uncommitted blocks, an S3 multipart upload), with the phone's
own capture id naming the file instead of a hash (`src/upload/chunks.ts`,
`src/upload/parts.ts`). After a cut, an app restart or the network returning,
the phone asks storage what it already holds and continues from there; at
most one chunk is re-sent. S3 and Azure verify each chunk's digest; confirm
checks the size on every provider.

Two lanes run at once: one takes the oldest row, the other the smallest, so
a long clip never holds up the photos behind it. On Android a foreground
service with a progress notification keeps the loop running when the phone
is locked or the worker switches apps (`src/upload/service.ts`, registered
by `plugins/withUploadService.js`). The loop takes it the moment a step
begins while the app is in front, the only time Android allows that, lets it
go when the queue cannot move (offline, signed out, a 401) so the phone is
not kept awake for nothing, and takes it afresh each time the app is opened;
Android 15 allows it six hours a day, after which uploads wait for the app
to be opened. On iOS the screen stays awake while a lane is uploading
instead.

A poor connection never fails a capture: the row waits with backoff, four
seconds doubling to five minutes, for as long as the app runs, and the tile
says "Retrying in …". Only a definitive refusal, or a storage link refused
eight times in a row, parks a capture as failed. A request with no answer in
30 s and a transfer with no progress for 60 s count as network failures. A
401 stops the loop and leaves the queue for the next sign-in. Discarding a
capture also frees its place on the server (`src/upload/drop.ts`), and the
camera stops at the share's quantity; there is no other ceiling on what a
worker uploads.

## Checks

```bash
npm run typecheck
npm test
```

## The subject check

A task can carry a *subject* (`capture_spec.subject`, typed by the aggregator
when assigning: "retail shelf — must show shelf, products, price tags — must
not show person, selfie, screenshot"). The worker reads it on the assignment
screen; after each photo the phone compares it with those words using CLIP
(ViT-B/32, on the device through react-native-executorch;
`src/qa_pipeline/subject/clipSubject.ts`). It replaced ML Kit's image labeller,
whose fixed vocabulary could not name most subjects; ML Kit still runs the face
and text checks. A miss asks the worker to keep or retake. It never deletes
anything by itself, and the finding (`wrong_subject`, with the margin)
travels with the upload for the reviewer, as does `subject_clip_measured`
whether it passed or not. A must-not-show phrase that clearly shows is a
`forbidden_subject` warning for the reviewer only. A photo that passes shows a
green *Looks like …* line in the viewfinder.

The models (~600 MB, fp32) download once, starting when the worker opens an
assignment; a line in the viewfinder says how far along that is. Until they
are ready — or in a build without the native module, or after a native error —
the capture is kept with a `subject_unscored` warning that names the reason,
so the reviewer at gate 1 sees *unchecked* rather than a silent pass. A
failed download is retried the next time an assignment or the camera opens.
`CLIP_SUBJECT_MIN_MARGIN`, `CLIP_IGNORE_NEAREST_NEGATIVES` and
`CLIP_FORBIDDEN_MIN_MARGIN` in `src/config.ts` are its cuts, each documented
with the evaluation that set it (`tools/subject_eval`); `SUBJECT_DIALOG` is the
shadow switch. The client's example photos are embedded too
(`src/qa_pipeline/subject/clipExamples.ts`): every capture records how alike it
looks (`subject_clip_examples`), and the worker is asked only when the subject
words AND the examples miss (`CLIP_EXAMPLE_MIN_SIMILARITY`). Development builds
also show the last shot's scores in the viewfinder, and Metro logs `[clip] …`.

A clip gets the same treatment through its frames (`src/validation/clip.ts`,
`src/capture/frames.ts`): one frame every five seconds, three to forty of
them, inside a 45-second budget. CLIP scores each frame like a photo, and the
clip's margin is the mean of its best three frames; the camera is closed while
it runs, to keep the memory for the check. The same frames, shrunk to 16×16, tell a dark clip (refused past half its
frames) from a still one (a warning — a tripod shot looks the same as a
stalled encoder). Before any of that, `rules.ts` refuses a clip outside the
task's `min_duration_s`–`max_duration_s`, below its `min_video_lines`, or the
wrong way up. The phone itself is held to the task's own device requirements
(`min_android_version`, `min_ios_version`, `min_ram_gb`, from the RFP's Device
Specifications; `qa_pipeline/device/device.ts`), and to nothing else: there is
no platform floor, and a task that names none asks nothing of any phone. On the
offer and assignment screens a shortfall is a warning that names it, so the
worker learns before travelling, and they may still accept and start. At the
shutter the same shortfall refuses the capture, like a photo under the task's
megapixels, so nothing is sent that would be sent back.

**Offers.** A task the aggregator broadcasts ("Offer to crowd") appears under
*Offered to you* at the top of the board, and the push opens it. The offer screen
(`app/(app)/offers/[id].tsx`) shows the brief — amount, due date, instructions,
subject, requirement chips — runs the same device check as an assignment, and has
Accept and Decline (backend `GET /me/offers`, `POST /me/offers/{id}/respond`).
Accepting lands on the new assignment; a place someone else took first comes back
as the server's reason, not a silent failure. A task with `allow_library` shows a *Gallery* chip so a clip the
phone already holds can be sent; it goes through every check the same way.
The viewfinder reads *Checking clip… 12/40* while the frames run.

## Building the app

`patches/expo-camera+57.0.4.patch` is applied by `npm install` (the `postinstall`
script). It adds three lines to expo-camera's Android view so a video recording
follows how the phone is held: upstream rotates stills with the device but not
the video use case, and with this app locked to portrait every clip came out
tagged portrait, sideways for the reviewer. Drop the patch when an expo-camera
changelog says video `targetRotation` follows orientation on Android; until
then, after `npx expo install expo-camera` to a newer version, check that
`npx patch-package` still applies (it names the version in the file).


```bash
npm install -g eas-cli && eas login
eas build -p android --profile development    # dev client: Expo Go's role, plus native modules
eas build -p android --profile preview        # internal distribution, .apk
```

Install the development build on the phone, then `npx expo start --dev-client`
and open the app; it connects to the same Metro server Expo Go did.
