---
name: DataMind360 console
description: The web console of DataMind360 by Cosarathi, a marketplace for custom and ready real-world data.
colors:
  datamind-blue: "#091cff"
  datamind-blue-hover: "#3a49ff"
  datamind-blue-tint: "#e6e8ff"
  datamind-blue-line: "#ced2ff"
  on-accent: "#ffffff"
  ground: "#f4f6f5"
  surface: "#ffffff"
  surface-2: "#eef1ef"
  surface-3: "#e6eae8"
  line: "#dde3e0"
  line-strong: "#818e8a"
  ink: "#0f1a1c"
  ink-2: "#3a4a4d"
  ink-3: "#5f7174"
  ink-4: "#8c9c9e"
  tone-neutral: "#5b6b6e"
  tone-neutral-bg: "#eceeed"
  tone-neutral-line: "#d3d9d7"
  tone-active: "#091cff"
  tone-active-bg: "#e6e8ff"
  tone-active-line: "#ced2ff"
  tone-attention: "#8f5000"
  tone-attention-bg: "#faeedb"
  tone-attention-line: "#e6cb9c"
  tone-success: "#1a6f45"
  tone-success-bg: "#e4f1ea"
  tone-success-line: "#a6d3bb"
  tone-critical: "#a9312a"
  tone-critical-bg: "#fbe9e7"
  tone-critical-line: "#eeb8b2"
  meter-track: "#e0e5e3"
  chart-grid: "#e6eae8"
  ground-dark: "#0d1315"
  surface-dark: "#141c1e"
  surface-2-dark: "#1a2427"
  surface-3-dark: "#213033"
  line-dark: "#253134"
  line-strong-dark: "#3a4d51"
  ink-dark: "#e8efed"
  ink-2-dark: "#b6c5c3"
  ink-3-dark: "#85989a"
  ink-4-dark: "#6b7d7f"
  datamind-blue-dark: "#9da4ff"
  datamind-blue-hover-dark: "#ced2ff"
  on-accent-dark: "#0f1a1c"
  datamind-blue-tint-dark: "#121c50"
  datamind-blue-line-dark: "#1f2a7a"
  tone-attention-dark: "#dda75a"
  tone-success-dark: "#59bd8a"
  tone-critical-dark: "#e58179"
typography:
  headline:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, -apple-system, Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title-small:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"cv05\" 1"
  body-small:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "10.5px"
    fontWeight: 500
    letterSpacing: "0.09em"
  figure:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "25px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
rounded:
  control: "4px"
  panel: "6px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "32px"
  button-primary:
    backgroundColor: "{colors.datamind-blue}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.datamind-blue-hover}"
    textColor: "{colors.on-accent}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.datamind-blue}"
    padding: "0 9px"
    height: "32px"
  button-small:
    padding: "0 9px"
    height: "26px"
  pill-active:
    backgroundColor: "{colors.tone-active-bg}"
    textColor: "{colors.tone-active}"
    rounded: "{rounded.pill}"
    padding: "2px 9px 2px 7px"
  pill-attention:
    backgroundColor: "{colors.tone-attention-bg}"
    textColor: "{colors.tone-attention}"
    rounded: "{rounded.pill}"
  pill-success:
    backgroundColor: "{colors.tone-success-bg}"
    textColor: "{colors.tone-success}"
    rounded: "{rounded.pill}"
  pill-critical:
    backgroundColor: "{colors.tone-critical-bg}"
    textColor: "{colors.tone-critical}"
    rounded: "{rounded.pill}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  table-header:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "9px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
    height: "32px"
  rail-item-current:
    backgroundColor: "{colors.datamind-blue-tint}"
    textColor: "{colors.datamind-blue}"
    rounded: "{rounded.control}"
    padding: "7px 10px"
---

# Design System: DataMind360 console

## Overview

**Creative North Star: "The Field Ledger"**

The console is a ledger of data work moving from the field to the client. It is a calm, exact record of who asked for what, who did it, what was accepted, what is owed, and whose move it is now. Every screen is an entry in that ledger: the facts lead, and the next step is never ambiguous. The mood is calm and exact. Colour is used to mean something (status, the one accent for action and place), never to decorate.

The system is flat and precise. Surfaces are white panels on a cool, faintly green neutral ground, separated by 1px hairlines. Corners are small (4px controls, 6px panels), and shadow belongs only to things that float above the page: popovers, toasts and dialogs. Type is IBM Plex Sans for reading and IBM Plex Mono for figures, codes and measurements. Density is that of a working tool, as much information as stays legible, rather than marketing air.

The values in `frontend/src/design-system/tokens.css` and `components.css` were ported unchanged from the clickable prototype (`docs/sourcehub-app.html`), which the project declares normative for tokens. A durable change to this system is made there too, or the divergence is recorded here.

**Key Characteristics:**
- Flat panels, hairline borders, small radii; shadow only for floating layers.
- One accent, the DataMind360 blue, for action, focus and the current place.
- Five status tones (neutral, active, attention, success, critical), separate from the accent.
- Plex Sans for words, Plex Mono for numbers, codes and labels.
- Three themes handled: explicit light, explicit dark, and the system default.

## Colors

A restrained palette: cool green-grey neutrals, one saturated blue, and a five-tone status vocabulary measured for contrast.

### Primary
- **DataMind Blue** (#091cff): the accent, from the UX team's ramp of 30 Sep 2026. Primary buttons, links, the current rail item, focus rings, meters and the active status. White on it is 8.0:1. In dark themes it becomes **Pale DataMind Blue** (#9da4ff), 7.5:1 on the dark surface. Hover goes one step lighter (#3a49ff); tint (#e6e8ff) and line (#ced2ff) mark selected and current states.

### Neutral
- **Field Ground** (#f4f6f5): the page behind everything, cool and faintly green rather than pure grey.
- **Sheet White** (#ffffff): panels, inputs, the rail and the topbar.
- **Ledger Grey 2 and 3** (#eef1ef, #e6eae8): table headers, panel feet, chips, hover rows and skeletons.
- **Hairline** (#dde3e0): every divider and panel border.
- **Field Edge** (#818e8a): input borders, 3.4:1 on white, the minimum that marks a box as a field (WCAG 1.4.11).
- **Ink** (#0f1a1c), **Ink 2** (#3a4a4d), **Ink 3** (#5f7174), **Ink 4** (#8c9c9e): text from primary to faint. Ink 3 is 5.1:1 on white and 4.5:1 on Ledger Grey 2, so it is the lightest colour allowed for small text; Ink 4 is for glyphs and placeholders of decoration only.

### Status tones
Each tone has a foreground, a background and a line: neutral (#5b6b6e), active (#091cff), attention (#8f5000), success (#1a6f45), critical (#a9312a). The tones are deliberately distinct from the accent's role.
- **Attention** means waiting on a human decision.
- **Critical** means terminal-bad or a breach.
- **Active** means progressing, with no one blocked.

### Named Rules
**The Paint Only Rule.** Tokens are paint. Status meaning lives in the per-entity status maps (`src/shared/status/`), which follow the database, never in a colour chosen on a screen.

**The One Accent Rule.** The blue marks action, focus and place. A second accent colour is never introduced; emphasis comes from weight, size or position.

## Typography

**Body Font:** IBM Plex Sans (with Segoe UI, system-ui, Helvetica, Arial)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, Cascadia Mono, Consolas)

**Character:** a sober, engineered sans for reading and a mono for anything counted, coded or measured. Both come from the same family, so they share proportions.

### Hierarchy
- **Headline** (600, 22px, 1.25): the page title (h1), one per view.
- **Title** (600, 17px, 1.3): panel and dialog titles (h2).
- **Title small** (600, 14px, 1.35): sub-sections and card names (h3).
- **Body** (400, 14px, 1.5, `cv05`): running text. Page subtitles are 13px in Ink 3, at most 78ch.
- **Body small** (12.5px): meta lines, hints, breadcrumbs and secondary cells.
- **Table body** (13.5px): every data table.
- **Figure** (Mono 500, 25px, -0.02em, tabular): metric values.
- **Label** (Mono 500, 10.5px, +0.09em, uppercase): metric labels ("eyebrow") and table headers (10.5px, +0.07em).

### Named Rules
**The Mono Means Measured Rule.** Mono is for figures, references, dates and codes, never for prose.

## Layout

The app is a two-column grid: a 264px rail and the main column, with a 56px sticky topbar. The view is capped at 1440px, padded 24px (16px at 840px and below), and stacks its parts with a 16px gap. Spacing follows a 4px scale: 4, 8, 12, 16, 24, 32, 48.

Content grids: `g2`, `g3`, `g4` and `g-main` (1.7fr / 1fr).
- At 1240px and below, `g4` becomes 2 columns and `g-main` 1.
- At 980px and below, `g3` becomes 2 and forms go to 1 column.
- At 840px and below, the rail becomes an off-canvas drawer with a scrim, and every grid becomes one column.

Tables scroll horizontally inside their panel (`.tablewrap`).

## Elevation & Depth

Flat by default. Depth is tonal layering: the ground, white panels and Ledger Grey bands are separated by 1px hairlines. Shadow is reserved for layers that float.

### Shadow Vocabulary
- **Pop** (`box-shadow: 0 4px 12px rgba(15,26,28,.10), 0 1px 3px rgba(15,26,28,.08)`): popovers, menus, toasts and tooltips.
- **Overlay** (`box-shadow: 0 24px 48px -12px rgba(15,26,28,.28), 0 0 0 1px var(--line)`): dialogs, the command palette and the phone-width rail drawer.

### Named Rules
**The Only What Floats Rule.** A surface casts a shadow only when it sits above the page. Cards and panels at rest stay flat; hover strengthens a border, never adds a shadow.

## Shapes

- **Radii:** control 4px (buttons, inputs, chips, callouts), panel 6px (panels, metric cards, dialogs), pill 999px (status pills, tallies, avatars).
- **Borders:** 1px everywhere. Input borders use Field Edge so the box reads as a field.
- **Status pills:** a 5px dot drawn in the tone's own colour.

## Components

- **Buttons:**
  - Default: white, hairline border; hover goes to Ledger Grey with a stronger border.
  - Primary: DataMind Blue with white text. Success is solid green. Danger is a critical outline. Quiet is accent text without a border.
  - 32px high, 13px semibold. The small size is 26px.
  - Disabled at 45% opacity.
- **Pills and chips:** a status pill in one of five tones, 11.5px semibold, with a dot. Chips are 4px-radius tags on Ledger Grey.
- **Panels:** a white panel with a 6px radius and a hairline. The head holds a title, subtitle and actions; the body is padded 16px or flush for tables; the foot is on Ledger Grey.
- **Metrics:** a panel with a mono label, a 25px mono figure and a 12px foot line.
- **Tables:**
  - Sticky Ledger Grey header in uppercase mono.
  - 13.5px rows padded 11px by 16px, divided by hairlines.
  - Tappable rows highlight on hover. Sort arrows appear on hover and focus, and turn accent when sorted.
  - Row actions sit right-aligned in the last column.
- **Inputs:** 32px high, Field Edge border. Focus shows an accent border plus a 3px blue-tint ring. Invalid is critical. Disabled is Ledger Grey with Ink 3 text.
- **Tabs:** 13px semibold in Ink 3. The selected tab is accent with a 2px underline (`[role=tab][aria-selected=true]`).
- **Segmented control:** bordered buttons; the pressed one is blue tint with accent text (`[aria-pressed=true]`).
- **Rail:** labelled items at 13.5px. The current item is blue tint with accent text and weight 600. Tallies are mono pills.
- **Callouts:** a tone-coloured box with a title line.
- **Toasts:** float bottom right with the pop shadow.
- **Lifecycle stage rail:** numbered nodes joined by a track. Done stages and the current stage turn accent; the current node has a 4px tint halo.
- **Empty state:** a centred title and body with a glyph circle.
- **Skeleton:** shimmer bars while data loads.
- **Focus:** a 2px DataMind Blue outline, offset 2px, on every interactive element.

## Do's and Don'ts

- **Do** keep every new screen inside these tokens; make durable changes in `tokens.css` / `components.css` and the prototype together.
- **Do** say whose move it is on every record, with one shared rule (`src/shared/status`).
- **Do** use Ink 3 as the lightest colour for small text, and keep body text at 4.5:1 or better in all three themes.
- **Don't** add shadows to resting panels, gradients, glass, or a second accent colour.
- **Don't** set prose in mono, or use mono as decoration.
- **Don't** show internal codes or raw event types where a person must recognise something; titles lead and references follow.

### Pending approval: refinements from the critique of 16 Oct 2026

These are proposed, not yet the system. They take effect only once the page designs are approved, and then also go into the prototype.
- **Type floor:** labels and table headers rise from 10.5px to 12px; ids, hints and chart axes rise from 11.5px to 12px. The detector found these below the readable floor about 89 times, from two declarations.
- **Tables:** the row-action column stays visible (sticky right), low-priority columns hide below 1280px, and rows stack into labelled cards at 840px and below. Identifier cells lose the chip look.
- **Tabs:** the current tab of a segmented control is styled for `aria-current` and `aria-selected`, not only `aria-pressed`.
- **Toast tone bar:** the 3px coloured left edge on toasts breaks the side-stripe ban. Proposed replacement: the tone carried by a leading status dot and the border colour.
