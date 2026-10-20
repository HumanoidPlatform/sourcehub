// The client's example photos, embedded by CLIP (clipSubject.ts).
//
// The camera screen calls warmClipExamples once the models are ready: each
// example is downloaded, shrunk, embedded whole and deleted — only its vector
// is kept, in memory, keyed by attachment id, so it is fetched once per app
// run. Nothing is kept on disk.
//
// Best-effort and silent. A worker in a basement with no signal must still be
// able to capture; an example that will not download is retried next time,
// and the capture records that it was not compared rather than pretending it
// matched.

import { get } from "@/api/client";
import type { Attachment } from "@/api/types";
import { deleteLocal, downloadToScratch } from "@/capture/files";
import { CLIP_IMAGE_WIDTH } from "@/config";
import { rgbaImage } from "@/qa_pipeline/clip/frames";
import { type ClipExample, type ClipExampleSet, embedWhole } from "@/qa_pipeline/subject/clipSubject";

/** The slot the console files client reference photos under. */
const SLOT = "capture_examples";

/** Enough to describe a job; past this the client is uploading an album, and a
 *  worker on a metered connection should not pay for it. */
const MAX_EXAMPLES = 5;

/** A 25 MB brief is a PDF or a RAW file, not a phone photo to compare against. */
const MAX_BYTES = 8 * 1024 * 1024;

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/** The example photos on a task worth comparing against: current versions,
 *  actual images, not enormous. A PDF of guidelines lives in the same slot
 *  family and there is nothing to compare in it. */
export function exampleImages(docs?: Attachment[] | null): Attachment[] {
  return (docs ?? [])
    .filter((a) => a.slot === SLOT)
    .filter((a) => a.is_current !== false)
    .filter((a) => (a.content_type ? a.content_type.startsWith("image/") : IMAGE_EXT.test(a.filename)))
    .filter((a) => a.size_bytes == null || a.size_bytes <= MAX_BYTES)
    .slice(0, MAX_EXAMPLES);
}

const cache = new Map<string, ClipExample>();

/** Embed every example of this task the phone has not embedded yet. */
export async function warmClipExamples(docs?: Attachment[] | null): Promise<void> {
  for (const a of exampleImages(docs)) {
    if (cache.has(a.id)) continue;
    let local: string | null = null;
    try {
      const { url } = await get<{ url: string }>(`/attachments/${a.id}/url`);
      local = await downloadToScratch(url, `${a.id}.clip.img`);
      const vec = await embedWhole(await rgbaImage(local, CLIP_IMAGE_WIDTH));
      if (vec) cache.set(a.id, { attachmentId: a.id, filename: a.filename, vec });
    } catch (e) {
      console.warn(`[clip] example ${a.filename} not embedded: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      await deleteLocal(local);
    }
  }
  const n = exampleImages(docs).filter((a) => cache.has(a.id)).length;
  if (n > 0) console.log(`[clip] ${n} example photo${n === 1 ? "" : "s"} ready`);
}

/** What the phone can compare a capture against right now. */
export function clipExampleSet(docs?: Attachment[] | null): ClipExampleSet {
  const wanted = exampleImages(docs);
  return {
    expected: wanted.length,
    ready: wanted.map((a) => cache.get(a.id)).filter((e): e is ClipExample => e != null),
  };
}
