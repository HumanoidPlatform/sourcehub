# Publishing the phone app — for the team

*The app is **DataMind360 Capture**, the Android app crowd workers use to capture photos and video. Its build
project lives in the Expo organisation `jituexpo2026s-team` as `@jituexpo2026s-team/cosarathi-capture`, so
anyone in the organisation can build it and ship updates to it. Before 21 September 2026 it sat in one person's
personal account and only they could.*

**Read the two rules at the bottom before your first build.** Both of them, if broken, cost a field worker
their unsent work — not just an awkward release.

---

## Getting access, once

1. Accept the emailed invitation to the Expo organisation. Ask for the **Developer** role: it is the least role
   that can build, publish updates and manage credentials.
2. Install the CLI and sign in as **yourself** — there is no shared login and no shared token:

   ```sh
   npm install -g eas-cli
   eas login
   eas whoami          # your username
   ```

3. Check you can see the project:

   ```sh
   cd mobile
   eas project:info
   # fullName  @jituexpo2026s-team/cosarathi-capture
   # ID        5fa7e6c0-abcf-46e0-9837-d66e5046badc
   ```

   If it says your account "does not match owner specified in the `owner` field", your checkout is out of date —
   `git pull`. Do not edit `owner` to your own name.

---

## Which of the two things you are doing

| | **An over-the-air update** | **A new build** |
|---|---|---|
| Ships | JavaScript, styles, images | the whole app, including native code |
| Reaches people | in seconds, on next launch | only by installing a new APK |
| Use it for | copy, layout, logic, bug fixes | a new native module, an Expo SDK upgrade, a new permission, a changed app icon or name |
| Command | `eas update` | `eas build` |

If you are unsure, ask: *did I add or change anything native?* `npx expo install <package>` that has native code
counts. `npm install` of a pure-JavaScript package does not.

---

## Shipping an over-the-air update

```sh
cd mobile
npm run typecheck && npm test     # do not skip; there is no CI to catch you
eas update --channel preview --message "what changed, in plain words"
```

- `--channel preview` reaches everyone holding a pilot APK. `production` is for the Play Store release.
- The phone fetches the update on next launch and applies it on the launch **after** that. Not instant on the
  device, even though publishing is.
- **Undoing a bad update:** republish the previous one. `eas update:list` shows what went out; there is no
  "delete" that reaches phones already holding it.

## Making a new build

```sh
cd mobile
eas build --platform android --profile preview
```

- `preview` produces a signed APK with an install page and a QR code — what pilot workers install.
- The **direct APK link** is what you share (`expo.dev/artifacts/eas/….apk`). The build *page*
  (`expo.dev/accounts/…`) is only visible to organisation members; anyone else sees an empty page. This has
  already caught people out.
- The free plan gives the whole organisation **15 Android builds a month**, on the slow queue. It is shared, so
  do not burn them casually — most changes are an update, not a build.
- Version codes come from EAS (`appVersionSource: "remote"` in `eas.json`), so two people cannot collide.

---

## The two rules

### 1. Never regenerate the Android signing key

Android installs an update over an existing app **only** when both are signed with the same key. EAS keeps that
key inside the project, and it is the same key that will be registered with Google Play.

If the key is replaced, every worker must uninstall before installing again — and **uninstalling deletes
captures that have not finished uploading**. That is a worker's unpaid work, gone.

So: if `eas credentials` ever offers to generate a new keystore, **stop and ask**. There is one key, it is
backed up in the company vault, and it does not change. Nothing in normal work requires touching it.

### 2. Think before bumping `version`

`mobile/app.json` sets `runtimeVersion: { "policy": "appVersion" }`, which means **an update only reaches builds
with the same `version` string**.

- Changing JavaScript only? **Leave `version` alone** and publish an update. Bump it and the update silently
  reaches nobody, because no installed build matches the new runtime version any more.
- Changing native code? **Bump `version` and make a new build.** Skip the bump and an update built for new
  native code is delivered to old binaries that do not contain it — which crashes them on launch.

The clip checks (September 2026) were such a change — `expo-video-thumbnails`, `expo-image-manipulator` and
`expo-image-picker` are native — so `version` went from `0.1.0` to `0.2.0`. Phones on the `0.1.0` build keep
receiving `0.1.0` updates until they install the `0.2.0` APK; nothing published for `0.2.0` reaches them.

Same rule stated once more, because it is the one people get wrong: `version` tracks *native* compatibility, not
"how much changed".

---

## Before you touch anything, know where you are pointing

`mobile/src/config.ts` pins the server to `https://datamind360.centralindia.cloudapp.azure.com` for every build except
`development`, and `app.config.js` strips cleartext-HTTP permission from preview and production builds. A
preview APK cannot be pointed at a laptop, by design. For local work use the `development` profile and
`npx expo start --dev-client`.

## If something goes wrong

| What you see | What it means |
|---|---|
| `does not match owner specified in the "owner" field` | Your checkout predates the move to the organisation. `git pull`. |
| The project is not found at all | You are logged in as the wrong account, or your invitation is not accepted yet. `eas whoami`. |
| An update published but no phone has it | Wrong channel, or `version` was bumped so no installed build matches. Check `eas update:list`. |
| A tester cannot open the install link | You sent the build *page*, not the APK link. Send `expo.dev/artifacts/eas/….apk`. |
| A tester cannot install the APK | Normal for any app outside the Play Store: Chrome warns, and Android asks them to allow installs from that browser. It goes away once we are on Play. |

Related: [mobile-pilot-build-plan.md](mobile-pilot-build-plan.md) (how the pilot was set up),
[mobile-distribution-strategy.md](mobile-distribution-strategy.md) (why sideloading now and Play later),
[developer-accounts-guide.md](developer-accounts-guide.md) (the Play and Apple accounts — separate from Expo).
