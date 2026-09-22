// The names, in one place — the phone's copy of frontend/src/shared/brand.tsx.
//
// PRODUCT is the platform this app belongs to; APP_NAME is this app. The
// company appears only where someone needs to know who stands behind it.
//
// app.json carries the same APP_NAME as a literal (a static JSON file cannot
// import this), in expo.name and in the two permission prompts. Change them
// together.
//
// What is deliberately NOT renamed, because none of it is visible and all of it
// is identity or state:
//
//   * android.package / ios.bundleIdentifier (com.cosarathi.capture) — a new id
//     is a NEW app: it installs beside the old one, with none of its captures;
//   * slug, the EAS projectId and the updates URL — the project this builds as;
//   * the "cosarathi" URL scheme — cosarathi://server still opens the server
//     screen for whoever has that shortcut written down;
//   * the SQLite file cosarathi-capture.db (src/db/index.ts) — renaming it
//     would open a fresh, empty outbox on every phone that already has one and
//     abandon captures waiting to upload.

export const PRODUCT = "DataMind360";
export const COMPANY = "Cosarathi";

/** This app, as it is labelled on a crowd resource's phone. */
export const APP_NAME = `${PRODUCT} Capture`;

/** As the logo itself puts it. */
export const BYLINE = `A ${COMPANY} product`;

/** The role code the server sends, as a person should read it.
 *
 *  The phone's copy of WORKSPACE in frontend/src/app/shell/Shell.tsx. The KEYS
 *  are the server's role codes and must not change — `worker` is what is_worker()
 *  reads out of app.role, and every restrictive RLS policy turns on it. Only the
 *  labels are ours to write.
 *
 *  Settings used to print `Role: {session.role}` raw, so the one place this app
 *  named the reader's role said "worker" in the server's own vocabulary. */
export const ROLE_LABEL: Record<string, string> = {
  worker: "Crowd resource",
  aggregator: "Aggregator",
  tenant: "Delivery partner",
  business: "Business partner",
  client: "Client",
  sponsor: "Device sponsor",
  platform_admin: "Platform operations",
};
