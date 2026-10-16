# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

DataMind360 Capture (`mobile/`, Expo, package `com.cosarathi.capture`). The EAS build profiles produce Android builds only. An iOS bundle identifier is configured, but no iOS build exists. Shared product truth (marketplace, roles, positioning, terminology, accessibility) lives in the root `PRODUCT.md`; this file adds what is specific to the phone.

## Users

Crowd workers: the crowd resources of an aggregator organisation. They receive task offers and assignments from their coordinator (the aggregator), capture photos or video to the task's specification, and send their work in batches for review. The crowd workers are the only role that is never asked to accept the platform Terms; they accept the app's privacy notice instead.

## Product Purpose

Let a worker capture exactly what the task asks for, first time, wherever they are: on-device checks catch a bad shot while it can still be retaken, nothing captured is lost while offline, and the worker always knows what is left to do and what came back for a retake.

## Operating Context

- Captures happen on location: shop aisles, shelves, streets and premises named by the task.
- The connection may drop; captures are stored on the phone and upload when it returns.
- Work arrives as assignments or as offers to accept within a respond-by time.
- Captures are checked on the device before upload: blur, exposure, tilt, faces, text, subject, GPS.
- The coordinator reviews each batch: it accepts the captures, or marks some for a retake with a reason.
- Since 6aebf37 a task may be counted in hours of footage: clips are measured by running time, and a share may be a fraction of an hour.
- Push notifications announce offers, reminders and send-backs.

## Capabilities and Constraints

- Builds: `runtimeVersion` policy `appVersion`. A native module added to the app requires a new build and a version bump, so that over-the-air updates never reach a build without it. Version 0.4.0 is planned for `expo-haptics` and `@expo/vector-icons`.
- The server address is fixed per build channel. Only a development bundle may point elsewhere.
- Terminology for workers: one name for the person who assigns and reviews their work, "your coordinator". "Retake" means a person asked for it again; "Refused" means a check refused it.

## Brand Commitments

None declared binding. The app uses the DataMind360 name and blue (`#091CFF`), shared with the console.

## Evidence on Hand

Dev data only. No field studies or usage analytics are on hand. Claims about workers' devices, conditions or success rates must not be invented.

## Product Principles

1. **Right first time.** Problems are caught while the worker can still fix them, in plain words.
2. **Nothing is lost.** Every capture is visibly safe on the phone until it has uploaded.
3. **Always know what is left.** Progress is counted in the task's own unit, at the moment it matters.
4. **One hand, one glance.** Big targets, high contrast, one clear next action.

## Accessibility & Inclusion

WCAG 2.2 AA, as the root record states, applied to a native app:
- screen-reader labels, roles and states on every control;
- text that scales with the system font size;
- touch targets of at least 48dp, Android's guidance, above WCAG's 24px minimum;
- contrast that holds over a bright camera image.
