// Fetching and labelling the client's example photos.
//
// Runs when a worker opens an assignment, never at the shutter. Each example
// is downloaded once, labelled once, and the image is deleted immediately —
// only the label list is kept (db/examples.ts). A task with three examples
// costs a few hundred kilobytes of data, once, and a few hundred bytes of
// storage for ever after.
//
// Everything here is best-effort and silent. A worker in a basement with no
// signal must still be able to capture; they simply get the word check alone,
// and the capture records that the examples were not consulted rather than
// pretending they matched.

import { get } from "@/api/client";
import type { Attachment } from "@/api/types";
import { labelledExamples, loadExampleLabels, saveExampleLabels } from "@/db/examples";
import type { ExampleSet } from "@/validation/examples";
import { labelImage } from "@/validation/subject";
import { deleteLocal, downloadToScratch } from "./files";

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
 *  family and the labeller has nothing to say about it. */
export function exampleImages(docs?: Attachment[] | null): Attachment[] {
  return (docs ?? [])
    .filter((a) => a.slot === SLOT)
    .filter((a) => a.is_current !== false)
    .filter((a) => (a.content_type ? a.content_type.startsWith("image/") : IMAGE_EXT.test(a.filename)))
    .filter((a) => a.size_bytes == null || a.size_bytes <= MAX_BYTES)
    .slice(0, MAX_EXAMPLES);
}

/** Download and label any example this phone has not seen before.
 *
 *  Returns quietly on any failure. The caller is a screen that has other work
 *  to do, and there is nothing a worker could usefully be told about a
 *  reference photo that would not download. */
export async function refreshExamples(taskId: string, docs?: Attachment[] | null): Promise<void> {
  const wanted = exampleImages(docs);
  if (wanted.length === 0) return;
  const have = await labelledExamples(wanted.map((a) => a.id));
  for (const a of wanted) {
    if (have.has(a.id)) continue;
    let local: string | null = null;
    try {
      const { url } = await get<{ url: string }>(`/attachments/${a.id}/url`);
      local = await downloadToScratch(url, `${a.id}.img`);
      const seen = await labelImage(local);
      // A labeller that cannot answer is not recorded: leaving the row absent
      // means the next time the screen opens — after a build, on a better
      // connection — it tries again. A stored empty list would look like an
      // example with nothing in it and would quietly score every capture zero.
      if ("labels" in seen && seen.labels.length > 0) {
        await saveExampleLabels(taskId, a.id, a.filename, seen.labels);
      }
    } catch {
      // offline, expired link, unreadable file: try again next time
    } finally {
      await deleteLocal(local);
    }
  }
}

/** What the phone can compare a capture against right now.
 *
 *  `expected` is what the task carries, `ready` is what was actually fetched
 *  and labelled. The gap between them is the thing that must never be silent:
 *  a capture compared against nothing is not a capture that matched. */
export async function loadExamples(docs?: Attachment[] | null): Promise<ExampleSet> {
  const wanted = exampleImages(docs);
  if (wanted.length === 0) return { expected: 0, ready: [] };
  const ready = await loadExampleLabels(wanted.map((a) => a.id));
  return { expected: wanted.length, ready };
}
