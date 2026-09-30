# Dark mode, and the rest of the rebrand

Written alongside the DataMind360 rebrand of the capture app (launcher icon, splash, accent).
**Nothing here has been built.** It is the scoped remainder, so the decision to schedule it is a
decision about time, not about discovery.

## What the rebrand already did

`mobile/`: the five icon PNGs regenerated from the brand SVGs by `docs/brand/make-icons.mjs`;
`C.accent` and `C.accentInk` teal → `#091CFF`; `C.ink` → the logo's own `#1D2031`;
`TONE_COLOR.active` → `#091CFF` on `#E6E8FF`; the lockup on the sign-in screen; splash `imageWidth`
76 → 200.

## The four shades with no home yet

The supplied ramp is `091CFF 3A49FF 6B77FF 9DA4FF CED2FF E6E8FF`. The phone uses two of them, because
`mobile/src/ui/index.tsx` opens by declaring the design has **"one accent colour"** and means it:
pressed and disabled states are opacity, not colour.

The other four are not spare — they are the *console's* shape. Its token layer already has exactly the
roles they fill:

The other four are the *console's* shape, and as of `0fc391a` ("blue shades of the platform") the
console has taken them.

---

## 1. The console — DONE by someone else, 2026-09-30

Landed in `0fc391a`, independently of this document and arriving at almost the same mapping:

| shade | console token | was |
|---|---|---|
| `#091cff` | `--accent` | `#0a6c60` petrol teal |
| `#3a49ff` | `--accent-hover` | `#085248` |
| `#ced2ff` | `--accent-line` | `#a9cfc8` |
| `#e6e8ff` | `--accent-tint` | `#e2efec` |
| `#9da4ff` | `--accent` (dark theme) | `#3fb8a6` |

It was done in the right order: `docs/sourcehub-app.html` — the file `tokens.css:5-16` declares
normative — was changed in the same commit, so the port did not drift further. `#9da4ff` for the dark
theme is the correct instinct: `#091cff` on a dark surface is too dense to read.

`#6b77ff` remains unused by either app.

**The `AssetGallery.tsx` bug is also gone.** It previously referenced `var(--bad, #B42318)` and
`var(--ok, #0E7C86)` — tokens that did not exist, so the hardcoded fallbacks rendered *always*, one of
them the mobile app's old teal. `0fc391a` removed them.

### Still outstanding in the console

- **Un-themed literals**: `AssetGallery.tsx` (`#5B6873`/`#B45309`, `#bbb`) and `delivery/pages.tsx:484`
  `#B45309`, which should be `--t-attention`. These stay light-theme values on a dark page.
- `rgba(9,17,18,.5)` appears twice (`components.css:437`, `:657`) and wants to be a `--scrim` token.
- **Four other prototypes still carry the old teal** — `sourcehub-schema.html`,
  `sourcehub-qa-pipeline.html`, `sourcehub-blueprint.html` and `sourcehub-build-guide.html` all still
  declare `--accent: #0a6c60` / `#43bcaa`, against `sourcehub-app.html`'s new `#091cff` / `#9da4ff`.
  Only the app prototype was updated. Since `tokens.css` names the prototypes as normative, the
  platform now has two contradictory sources of truth for its accent — which is the same drift that
  produced `#43bcaa` vs `#3fb8a6` in the first place.

---

## 2. Dark mode on the phone

The app is light-only **by construction**, in four places that must change together:

- `app.json` — `"userInterfaceStyle": "light"`
- `src/app/_layout.tsx:15` — `<StatusBar style="dark" />` hardcoded
- `src/ui/index.tsx` — `C` is one flat object
- `src/status.ts` — `TONE_COLOR` is one flat object

There is no `useColorScheme`, `Appearance`, `ThemeProvider` or `expo-system-ui` call anywhere in
`mobile/src` (`expo-system-ui` is a dependency but is never imported).

### The prerequisite: colour that is not in the palette

`C` and `TONE_COLOR` cannot be themed while ~23 lines hold colour outside them. These must move in
**first** — a theme switch cannot reach a literal.

**Genuinely need theming:**

| file | what |
|---|---|
| `src/ui/index.tsx` | style `meter` `#E7ECF0` (track — in neither palette); `offline` `#FBF0DA` and `offlineText` `#9A6210` (both re-typed by hand instead of read from `TONE_COLOR.attention`) |
| `src/components/Gallery.tsx` | `:230` `#E7ECF0` (second copy of the meter track); `:235` `rgba(194,65,12,.85)` — that is `C.danger` re-encoded by hand; `:236` `rgba(154,98,16,.85)` — that is `TONE_COLOR.attention.fg` re-encoded by hand |

Those four duplications are worth collapsing whether or not dark mode ever happens.

**Deliberately stay literal:** the camera overlays in `src/app/(app)/assignments/[id]/capture.tsx`
(`:442`–`:461`) and `src/components/Player.tsx` (`:43`–`:48`) are white-on-black **over live video and
video playback**, not over app chrome. They are correct in any theme and must not be themed. One
exception: `capture.tsx:459` `shutterVideo: "#E03B24"` is a one-off red found nowhere else in the app
and should be `C.danger`.

Button text `"#fff"` (`ui/index.tsx` `Button`, two sites) is correct as a literal: it is white because
it sits on `C.accent` and `C.danger`, both of which stay dark in either theme (8.01:1 and better).

### Then the split

`C` → `{ light: {...}, dark: {...} }` behind a `useTheme()` hook, same for `TONE_COLOR`. Note `s` (the
`StyleSheet.create` at the bottom of `ui/index.tsx`) closes over `C` at module load — it has to become
a factory memoised per scheme, which is the single largest mechanical change in the job.

### The splash trap

**Do not add a `dark` block to `expo-splash-screen` while `userInterfaceStyle` is `"light"`.** Android
selects the dark splash through `values-night`, which follows the **system** theme, not the app's
declared style — a phone in dark mode would show a dark splash handing off to a light app. The plugin
does support it (`expo-splash-screen/plugin/build/types.d.ts:18,31`); it only becomes safe once
`userInterfaceStyle` is gone.

`DataMind360_Light_Logo.svg` is the asset for it — identical geometry, white wordmark instead of
`#1D2031`. `docs/brand/make-icons.mjs` needs one more output and a `splash.dark.image` key.

---

## 3. iOS icons

`ios.icon` accepts `{ light, dark, tinted }` (confirmed: `@expo/config-types` `IOSIcons`), and Expo SDK
57 supports it. Only `--platform android` is built today, so this is free to defer — but the artwork
costs nothing once the generator exists: `dark` is the mark on `#1D2031`, `tinted` is the existing
monochrome silhouette.

Android has **no** light/dark icon. Its only theme response is the monochrome layer, which the rebrand
already filled correctly.

---

## 4. Emails

No logo, no brand colour, no shared layout. The primary CTA is `#1f6f43` — a fourth green that is
neither the console accent, nor `--t-success`, nor the brand blue. Body text is generic `#1c1c1c`/`#666`.
The wrapper `<div>` and `<tr>` styles are copy-pasted verbatim between
`backend/src/sourcehub/modules/delivery/service.py:1294-1326` and `modules/engage/service.py:271-285`;
a third email would be a third copy.

Smallest useful step: one `_shell(title, body)` helper in `platform/mail/`, brand blue CTA, and the
lockup as a hosted `<img>`. Worth doing when a third email is written, not before.

---

## Suggested order

1. The two `AssetGallery.tsx` token bugs — small, and wrong today regardless of theming.
2. Console accent: prototype first, then re-port `tokens.css`, fixing the `#43bcaa`/`#3fb8a6` drift.
3. Mobile: collapse the four duplicated literals into the palettes.
4. Mobile: split `C`/`TONE_COLOR`, `useTheme()`, `s` as a factory, drop `userInterfaceStyle`, make
   `StatusBar` follow the scheme, add the dark splash.
5. iOS icon variants, next time iOS is built.
6. Emails, next time one is written.

Steps 1–2 are independently useful and do not depend on 3–4.
