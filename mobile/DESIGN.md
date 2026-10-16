---
name: DataMind360 Capture
description: The crowd worker's phone app of DataMind360, for capturing real-world data to a task's specification.
colors:
  datamind-blue: "#091CFF"
  background: "#F3F5F7"
  surface: "#FFFFFF"
  ink: "#1D2031"
  muted: "#5B6873"
  line: "#D5DCE3"
  danger: "#C2410C"
  tone-neutral: "#5B6873"
  tone-neutral-bg: "#EDF1F4"
  tone-active: "#091CFF"
  tone-active-bg: "#E6E8FF"
  tone-attention: "#9A6210"
  tone-attention-bg: "#FBF0DA"
  tone-success: "#1F7A4D"
  tone-success-bg: "#E3F3EA"
  tone-critical: "#C2410C"
  tone-critical-bg: "#FCE8DF"
  meter-track: "#E7ECF0"
  camera-scrim: "rgba(0,0,0,0.55)"
  record-red: "#E03B24"
typography:
  headline:
    fontFamily: "system default (Roboto on Android)"
    fontSize: "22px"
    fontWeight: 700
  title:
    fontFamily: "system default"
    fontSize: "17px"
    fontWeight: 700
  body:
    fontFamily: "system default"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "21px"
  button:
    fontFamily: "system default"
    fontSize: "16px"
    fontWeight: 600
  muted:
    fontFamily: "system default"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "system default"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.5px"
rounded:
  pill: "6px"
  input: "8px"
  button: "10px"
  card: "12px"
spacing:
  screen: "16px"
  card: "14px"
  stack: "12px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "48px"
  button-primary:
    backgroundColor: "{colors.datamind-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "14px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "12px"
  pill:
    rounded: "{rounded.pill}"
    padding: "3px 8px"
---

# Design System: DataMind360 Capture

## Overview

**Creative North Star: "The Field Ledger", carried into the aisle**

The phone app is the field end of the console's ledger: the place where an entry starts. It is used one-handed, standing in a shop aisle or a street, often in bright light and on a patchy connection. So it is deliberately plain: big targets, high contrast, one accent colour, and one clear next action per screen. The mood matches the console, calm and exact, but the scale is larger and the words are plainer.

The kit lives in `mobile/src/ui/index.tsx` (tokens `C`, primitives and the stylesheet `s`) and `mobile/src/status.ts` (`TONE_COLOR` and the status labels). The camera screen draws its own overlay over the live image.

**Key Characteristics:**
- Light theme only (`userInterfaceStyle: "light"`), locked to portrait.
- Every screen has one primary action; buttons are at least 48dp high.
- Five status tones shared with the console, drawn as uppercase pills.
- Progress is a thick meter split by stage.

## Colors

The neutrals are slightly blue-grey, the blue is the console's accent, and the tones are the same pass/warn/fail vocabulary as the console.

### Primary
- **DataMind Blue** (#091CFF): primary buttons, links, the active tone and the progress fill; 8.0:1 on white.

### Neutral
- **Aisle Background** (#F3F5F7): the screen ground.
- **Card White** (#FFFFFF): cards, inputs and default buttons.
- **Ink** (#1D2031): text.
- **Muted** (#5B6873): secondary text; labels are 5.6:1 on white.
- **Line** (#D5DCE3): card and input borders.
- **Danger** (#C2410C): destructive buttons and error banners.

### Status tones
- Neutral #5B6873 on #EDF1F4.
- Active #091CFF on #E6E8FF.
- Attention #9A6210 on #FBF0DA.
- Success #1F7A4D on #E3F3EA.
- Critical #C2410C on #FCE8DF.

### Camera overlay
- Black scrims at 55-60% opacity carry white text over the live image.
- Recording is the shutter's red, #E03B24.

## Typography

The system font (Roboto on Android), so text follows the phone's own font size setting.

- **Headline:** 700, 22.
- **Title:** 700, 17.
- **Body:** 15/21.
- **Button:** 600, 16.
- **Muted:** 13.
- **Label:** 600, 12, uppercase, +0.5.
- **Codes:** monospace, 12.

## Layout

- Screens pad 16dp and scroll.
- Cards stack with a 12dp gap.
- The assignment screen leads with the status card: a big number, a progress meter and the primary action. Sections follow, and fold.
- The camera fills the screen:
  - counter and controls at the top;
  - level and warnings in the middle band;
  - clock, notice and shutter at the bottom.

## Elevation & Depth

Flat. Cards are separated from the ground by a hairline. No shadows; the camera overlay uses dark scrims instead of depth.

## Shapes

- **Radii:** pill 6, input 8, button 10, card 12.
- **Meters:** 8dp high, radius 4.
- **Shutter:** a 76dp circle; 60dp rounded square while recording.

## Components

- **Button:** default, primary, danger and quiet variants. At least 48dp high. Disabled at 45% opacity. The label is the accessible name.
- **Card:** a white, bordered card with 14dp padding.
- **Pill:** status in uppercase 12/700 on the tone background.
- **Meter:** a stage-split progress bar: accepted, in review, retake, not sent.
- **Callout:** a toned box with a title.
- **Offline banner:** attention colours, under the status bar.
- **Field:** a label above a 16dp-text input.
- **Gallery tile:** a photo or poster frame, with a status tag and a remove control.

## Do's and Don'ts

- **Do** keep one primary action per screen, at the thumb's end of the card.
- **Do** keep every overlay message readable over a white and a black image.
- **Don't** use colour alone for a state; pair it with words.
- **Don't** add a dark theme or landscape layout without designing the camera for it.

### Pending approval: refinements from the critique of 16 Oct 2026

These are proposed, not yet the system. They take effect once the page designs are approved.
- **Strong warning colour.** The too-tilted level and the too-short clock are drawn in the attention background, which almost vanishes in daylight; white text on it is about 1.1:1. Add a strong amber with dark text for warnings over the camera.
- **Icons.** Ionicons from `@expo/vector-icons` replace the Unicode glyphs (◔ ⚙ ▾ ▶ × ◌).
- **Touch targets.** At least 48dp everywhere, including the bell, settings, camera chips, tile remove and the retake button.
- **Text floor.** 12sp, including gallery tile status and errors (now 9-11), which move below the image.
- **Feedback.** Haptics (`expo-haptics`): a light tick when a shot is kept, a warning buzz when one is refused.
- **Side stripe.** The callout's 3dp coloured left edge breaks the side-stripe ban. The tone moves to the background and border.
- **Critical text contrast.** Critical text on its tint is #C2410C on #FCE8DF, 4.4:1, just under AA for the 12sp pills. Darken the critical text to #B43C0B: 4.9:1 on the tint and 5.9:1 on white. Found by the detector run on the page designs.
