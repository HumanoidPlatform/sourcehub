// Every knob for the browser upload path in one place. The caps mirror the
// server (backend modules/media/service.py) and the phone (mobile/src/config.ts);
// the server is the authority, these only save a doomed upload.

export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;
/** a fix looser than this is a cell tower, not a location — warn, don't block */
export const MAX_FIX_ACCURACY_M = 100;

/** re-presign when a signed URL has less than this left */
export const PRESIGN_SAFETY_MS = 60_000;
/** give up on a file after this many failed rounds */
export const MAX_ATTEMPTS = 8;

/** One file hashed at a time. file.arrayBuffer() on a 100 MB video is ~200 MB
 *  transient once the digest has its own copy; two at once is a tab crash on
 *  a modest laptop. Load-bearing — do not raise. */
export const HASH_SLOTS = 1;
/** Browsers allow six connections per host; three PUTs leave room for the API
 *  and the gallery's signed-URL fetches. */
export const NET_SLOTS = 3;
/** a PUT that has reported no progress for this long is abandoned and retried */
export const STALL_MS = 60_000;

/** The server's own extension lists (media/service.py IMAGE_EXTENSIONS and
 *  VIDEO_EXTENSIONS). Kind is decided by extension there too, never by
 *  content-type — "the extension is what we gate on". */
export const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".webp"] as const;
export const VIDEO_EXTENSIONS = [".mp4", ".mov"] as const;
export const ACCEPT = [...PHOTO_EXTENSIONS, ...VIDEO_EXTENSIONS].join(",");

/** the server's limits on what presign will take in `checks` */
export const MAX_CHECKS = 20;
export const MAX_CHECK_CODE = 40;
export const MAX_CHECK_MESSAGE = 300;
