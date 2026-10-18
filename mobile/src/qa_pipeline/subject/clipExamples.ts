// The client's example photos, embedded by CLIP (on trial; clipSubject.ts).
//
// The camera screen calls warmClipExamples once the models are ready: each
// example is downloaded, shrunk, embedded whole and deleted — only its vector
// is kept, in memory, keyed by attachment id, so it is fetched once per app
// run. The trial keeps nothing on disk; a released version would store the
// vectors beside the ML Kit labels (db/examples.ts).
//
// Best-effort and silent, like qa_pipeline/examples/load.ts: an example that
// will not download is retried next time, and the capture records that it was
// not compared rather than pretending it matched.

import { get } from "@/api/client";
import type { Attachment } from "@/api/types";
import { deleteLocal, downloadToScratch } from "@/capture/files";
import { CLIP_IMAGE_WIDTH } from "@/config";
import { rgbaImage } from "@/qa_pipeline/clip/frames";
import { exampleImages } from "@/qa_pipeline/examples/load";
import { type ClipExample, type ClipExampleSet, embedWhole } from "@/qa_pipeline/subject/clipSubject";

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
