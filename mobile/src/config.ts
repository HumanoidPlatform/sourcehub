// Every knob in one place. Caps mirror the server (modules/media/service.py);
// the server is the authority, these only save a doomed upload.

/** Where a worker's phone talks to. HTTPS only. Moving to a company domain
 *  later is a change to this one line, delivered over the air. */
export const PRODUCTION_API_URL = "https://cosarathi.eastus.cloudapp.azure.com";

/** Only a development bundle may be pointed somewhere else.
 *
 * In a build a worker installs, a changeable server address is a phishing
 * tool: whoever talks them into changing it receives their password. So the
 * "change server" link, the Settings field and any saved override all answer
 * to this one flag.
 *
 * __DEV__ rather than an EXPO_PUBLIC_ variable, deliberately. `eas update`
 * bundles on the developer's machine with that machine's .env, so an env flag
 * would let one careless publish re-open the screen — or re-point the API — on
 * every pilot phone. __DEV__ is false in every bundle that is not served live
 * by Metro, however it was produced. */
export const ALLOW_SERVER_OVERRIDE = __DEV__;

/** Development reads mobile/.env so a laptop on the desk still works; anything
 *  a worker runs ignores the environment entirely, for the reason above. */
export const DEFAULT_API_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL
  : PRODUCTION_API_URL;

export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;
/** a fix looser than this is a cell tower, not a location — warn, don't block */
export const MAX_FIX_ACCURACY_M = 100;
/** subject score (validation/subject.ts) under which a photo probably shows
 *  the wrong thing; a starting point, to be set from gate-1 verdicts */
export const SUBJECT_OFF = 0.3;
/** false = shadow mode: score and report, never ask the worker */
export const SUBJECT_DIALOG = true;

/** how often the app re-asks the server while in the foreground */
export const POLL_MS = 30_000;
/** re-presign when a signed URL has less than this left */
export const PRESIGN_SAFETY_MS = 60_000;
/** give up on a capture after this many failed rounds */
export const MAX_ATTEMPTS = 8;
