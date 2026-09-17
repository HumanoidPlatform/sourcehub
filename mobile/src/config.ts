// Every knob in one place. Caps mirror the server (modules/media/service.py);
// the server is the authority, these only save a doomed upload.

export const DEFAULT_API_URL = "http://192.168.1.20:8000";

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
