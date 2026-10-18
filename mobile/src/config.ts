// Every knob in one place. Caps mirror the server (modules/media/service.py);
// the server is the authority, these only save a doomed upload.

import * as Updates from "expo-updates";

const PROD = "https://datamind360.product.cosarathi.ai";
const DEV = "https://datamind360.product-dev.cosarathi.ai";

/** Builds on these channels talk to prod: 'staging' is the prod app
 *  (eas.json, profile staging), 'production' the store build. */
const PROD_CHANNELS = ["staging", "production"];

/** Where a worker's phone talks to. HTTPS only. Prod is named, dev is the
 *  default: the preview app talks to dev, and so does any build on a channel
 *  nobody listed, so a mislabelled build fills the dev database, not prod's.
 *  The channel is compiled into the binary, so an update published to
 *  'preview' can never move a dev phone to prod. Moving host is a change to
 *  one line here, delivered over the air. */
export const PRODUCTION_API_URL = PROD_CHANNELS.includes(Updates.channel ?? "") ? PROD : DEV;

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
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 600;
/** a fix looser than this is a cell tower, not a location — warn, don't block */
export const MAX_FIX_ACCURACY_M = 100;
/** How sure the labeller must be that the subject is IN the frame
 *  (qa_pipeline/subject/subject.ts). A presence floor, not a dominance one: other
 *  things in shot are ordinary and usually wanted, so this asks "is it there",
 *  never "is the picture mostly this". A starting point, to be set from gate-1
 *  verdicts once the pipeline records them. */
export const SUBJECT_OFF = 0.3;
/** How sure it must be that a must_not_show thing is in the frame before that
 *  is worth saying. Higher than the presence floor on purpose: the labeller now
 *  reports low-confidence guesses (see the patch on the native module below),
 *  and a prohibited thing should be clearly there before anyone is told about
 *  it. 0.5 is where ML Kit's own default sat, so it is an anchor rather than a
 *  fresh guess. */
export const SUBJECT_VETO = 0.5;
/** false = shadow mode: score and report, never ask the worker */
export const SUBJECT_DIALOG = true;
/** The CLIP subject check's pass mark (qa_pipeline/subject/clipSubject.ts, on
 *  trial in development builds): how much more a photo must look like its
 *  subject than like the closest typical mistake. -0.0013 is where the laptop
 *  evaluation (tools/subject_eval) warned on 10% of good photos and passed 2%
 *  of wrong ones; web photos, so provisional until set from phone captures. */
export const CLIP_SUBJECT_MIN_MARGIN = -0.0013;
/** The size photos are shrunk to before CLIP looks at them: wide enough that
 *  each quarter view is still the model's own 224 pixels. */
export const CLIP_IMAGE_WIDTH = 448;
/** How alike a capture and one of the client's example photos must look, to
 *  CLIP, for the examples to count as a match (cosine similarity, 0..1). Like
 *  the ML Kit example check it only rescues: the worker is asked when the
 *  words AND the examples miss. Set on the laptop test set (three examples per
 *  subject); provisional, like the margin above. */
export const CLIP_EXAMPLE_MIN_SIMILARITY = 0.74;
/** How much a capture must look like the client's own example photos
 *  (qa_pipeline/examples/examples.ts) before that stops counting against it.
 *
 *  SET FROM MEASUREMENTS, NOT FROM REASONING — and the reasoning was wrong.
 *  This was 0.15, on the argument that unrelated scenes "land near zero". They
 *  do not. Cosine over a SPARSE label vector is dominated by whichever few
 *  labels overlap, and ML Kit's generic ones (room, wall, furniture, product)
 *  overlap almost everything, so two four-label vectors sharing one generic
 *  term at high confidence land near 0.5 whatever the pictures show. A white
 *  wall scored 0.538 against photos of a laptop on a desk and was accepted.
 *
 *  The first three real clips, against two laptop examples:
 *      laptop, 20 s   0.815      laptop, short  0.765      white wall  0.538
 *  0.65 separates them with room either side. THREE CLIPS, ONE WALL, ONE DESK,
 *  ONE PHONE — revisit once there are a few dozen scores to put against real
 *  gate-1 verdicts.
 *
 *  Moving it this far on this little evidence is only safe because it never
 *  decides alone: the keep-or-retake prompt needs this AND the word check to
 *  miss (useCapture). A genuine capture scoring 0.6 still costs the worker
 *  nothing unless the words missed too. */
export const EXAMPLE_OFF = 0.65;
/** What the patched labeller is told to report down to, for reference — the
 *  value itself lives in patches/@react-native-ml-kit+image-labeling+*.patch
 *  because the library exposes no way to pass it. ML Kit's own default of 0.5
 *  discards a label before this code can see it, which is how a laptop plainly
 *  in shot became "doesn't look like laptop": the evidence was thrown away one
 *  layer below every threshold here. */
export const SUBJECT_LABEL_FLOOR = 0.15;

// A clip is checked through sampled frames (qa_pipeline/clip/clip.ts,
// qa_pipeline/clip/frames.ts): one every FRAME_EVERY_S seconds, never fewer than MIN_FRAMES
// nor more than MAX_FRAMES, and the whole sampling gives up after
// FRAMES_BUDGET_MS so a long clip on a slow phone still gets an answer.
export const FRAME_EVERY_S = 5;
export const MIN_FRAMES = 3;
export const MAX_FRAMES = 40;
export const FRAMES_BUDGET_MS = 45_000;
/** Share of sampled frames the subject must APPEAR in for the clip to pass.
 *
 * This was 0.7, which is a purity requirement rather than a presence one: a
 * hand over the keyboard, a pan to the window, one blurred second — each is a
 * miss, and a clip plainly about its subject failed on the moments it was not
 * centre frame. A third of the sampled moments is enough to say the clip is
 * about the thing. Provisional, like SUBJECT_OFF, and for the same reason: it
 * should be measured against gate-1 verdicts rather than chosen. */
export const SUBJECT_FRAMES_MIN_SHARE = 0.3;
/** ...and at least this many frames, however few were sampled.
 *
 * ONE FRAME IS AN ACCIDENT; TWO IS A PATTERN. A 15-second clip yields three
 * samples, so the only shares available are 0, 0.33, 0.67 and 1 — and at that
 * granularity a 0.3 floor means ONE FRAME. A clip of a white wall passed as a
 * laptop on exactly that: two frames saw a wall, one caught the desk as the
 * phone moved, and 1/3 cleared the bar.
 *
 * The share is not the problem and raising it back towards 0.7 would bring
 * back the purity rule that started all of this — a clip failing because a
 * hand covered the subject for a moment. The count is what was missing.
 *
 * Applied as min(this, frames sampled): a clip that yielded a single frame has
 * no evidence either way, and demanding two of one would refuse work for the
 * phone's shortcoming rather than the worker's. */
export const MIN_SUBJECT_FRAMES = 2;
/** share of frames that are black or frozen: from here the clip is refused */
export const STILL_BLOCK_SHARE = 0.5;
/** and from here it is kept with a warning */
export const STILL_WARN_SHARE = 0.15;
/** mean grey (0..255) under which a 16×16 frame counts as black */
export const BLACK_MEAN = 16;
/** mean absolute grey difference under which two consecutive frames are the same picture */
export const FROZEN_DIFF = 2;

// Image quality (qa_pipeline/blur, qa_pipeline/exposure): every photo, and
// every sampled frame of a clip, is shrunk to QUALITY_WIDTH pixels wide and
// read as grey. Big enough for an edge to survive, small enough that a frame
// costs one resize and a few milliseconds of arithmetic.
export const QUALITY_WIDTH = 320;
/** Sharpness (variance of the Laplacian in the sharpest tiles, at
 *  QUALITY_WIDTH) under which a capture is soft: kept, with a warning.
 *
 *  Calibrated on the scikit-image sample photos (October 2026) put through the
 *  phone's own resize, defocused with a Gaussian of σ = a share of the width:
 *  sharp photos measured 424–7100; σ 0.4% (visibly soft) 23–107; σ 0.8%
 *  (clearly out of focus) 6–14. 60 sits far below every sharp photo and
 *  catches the softer half of the visibly-soft ones. Provisional, like
 *  SUBJECT_OFF: every capture records its sharpness (quality_measured) so this
 *  can be moved on gate-1 evidence rather than sample images. */
export const BLUR_WARN = 60;
/** ...and under which a PHOTO is clearly out of focus and refused — but only
 *  when it still has the contrast of a real scene (BLUR_MIN_CONTRAST). On the
 *  samples every σ 0.8% photo of a real scene fell under 15 and no sharp one
 *  came near. Clips are never refused for blur: a pan blurs frames on purpose. */
export const BLUR_BLOCK = 15;
/** Grey standard deviation (0..255) a photo needs before blur can refuse it.
 *  A plain wall is smooth because the wall is; and fine texture (grass,
 *  gravel, small print) loses its contrast when defocused, so a blurred one
 *  falls under this and is warned about rather than refused. */
export const BLUR_MIN_CONTRAST = 20;
/** below this a frame is featureless (black, a lens cap, a blank wall) and
 *  says nothing about focus */
export const FEATURELESS_CONTRAST = 8;
/** share of a clip's judged frames that must be soft before it is warned about */
export const BLUR_FRAMES_WARN_SHARE = 0.5;
/** Mean grey under which a capture is too dark, over which too bright.
 *
 *  On the same samples: correctly exposed photos averaged 61–172 with almost
 *  nothing blown out; two stops under, 15–42 (all caught at 45); pushed 1.6×
 *  brighter, 7–58% of pixels blown to white. A white page or wall shot
 *  normally can sit near the bright line, which is one reason exposure only
 *  ever warns. */
export const DARK_MEAN = 45;
export const BRIGHT_MEAN = 215;
/** share of pixels crushed to black (≤5) or blown to white (≥250) that
 *  also counts as badly exposed, whatever the mean */
export const CRUSHED_SHARE = 0.5;
export const CLIPPED_SHARE = 0.25;
/** share of a clip's frames (black frames aside) that must be badly exposed
 *  before it is warned about */
export const EXPOSURE_FRAMES_WARN_SHARE = 0.5;

/** how often the app re-asks the server while in the foreground */
export const POLL_MS = 30_000;
/** re-presign when a signed URL has less than this left */
export const PRESIGN_SAFETY_MS = 60_000;
/** give up on a capture after this many failed rounds */
export const MAX_ATTEMPTS = 8;
/** a PUT with no progress for this long is cancelled and retried (upload/uploader.ts) */
export const PUT_STALL_MS = 60_000;
/** One chunk of a resumable upload, and the size above which a file is sent in
 *  chunks rather than one PUT (upload/chunks.ts). Mirrors the server's
 *  CHUNK_BYTES (platform/storage/types.py): a multiple of 256 KiB for Google,
 *  above S3's 5 MiB minimum. Also the most of a file ever read into memory —
 *  a file this size or smaller is hashed whole, a bigger one never is. */
export const CHUNK_BYTES = 8 * 1024 * 1024;
/** Parts of one chunked upload in flight at once, by connection. Google takes
 *  its chunks one after another; Azure and S3 take parts in any order. */
export const PARTS_IN_FLIGHT_WIFI = 3;
export const PARTS_IN_FLIGHT_CELL = 1;
/** Signed part URLs are fetched this many at a time (upload/chunks.ts) */
export const PART_URL_BATCH = 8;
/** under this much free space the camera says so (assignments/[id]/capture.tsx) */
export const LOW_STORAGE_BYTES = 500 * 1024 * 1024;
