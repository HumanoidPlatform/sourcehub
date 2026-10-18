// The arithmetic of a chunked upload, pure and unit-tested: which byte range a
// part covers, what Google's Range header means, which parts are still to go,
// how far along the whole file is. Nothing here touches a file or the network
// (that is chunks.ts); the machine and the screens read these.
//
// Parts are numbered from 1, as S3 numbers them. Google counts bytes rather
// than parts, so for it a "part" is simply the next CHUNK_BYTES after what it
// says it holds.

export interface PartUrl {
  url: string;
  /** ms since epoch; the presign's expires_in, from when it was answered */
  expires_at: number;
}

export function partCount(size: number, chunk: number): number {
  return Math.max(1, Math.ceil(size / chunk));
}

/** [start, end) of part n, the last one short */
export function partRange(n: number, size: number, chunk: number): { start: number; end: number; length: number } {
  const start = (n - 1) * chunk;
  const end = Math.min(size, start + chunk);
  return { start, end, length: Math.max(0, end - start) };
}

/** Google's Content-Range for the bytes [start, end): inclusive last byte, then the total */
export function contentRangeFor(start: number, end: number, size: number): string {
  return `bytes ${start}-${end - 1}/${size}`;
}

/** Google's Content-Range for part n */
export function contentRange(n: number, size: number, chunk: number): string {
  const { start, end } = partRange(n, size, chunk);
  return contentRangeFor(start, end, size);
}

/** The bytes Google takes next: from exactly what it holds, one chunk long or
 *  to the end. A cut mid-chunk leaves Google holding a count that is not a
 *  chunk boundary (it keeps 256 KiB steps), and a range starting anywhere
 *  but there is refused — so the next chunk starts at bytesDone, never at
 *  the boundary of the part that contains it. */
export function gcsRange(bytesDone: number, size: number, chunk: number): { start: number; end: number; length: number } {
  const start = Math.max(0, Math.min(bytesDone, size));
  const end = Math.min(size, start + chunk);
  return { start, end, length: Math.max(0, end - start) };
}

/** Google's `Range: bytes=0-8388607` names the last byte it holds; one more is
 *  how many it has. Missing, or not from zero, reads as nothing held. */
export function bytesHeld(range: string | null | undefined): number {
  const m = /^bytes=0-(\d+)$/.exec((range ?? "").trim());
  return m ? Number(m[1]) + 1 : 0;
}

/** the part Google takes next, given how many bytes it holds */
export function nextGcsPart(bytesDone: number, chunk: number): number {
  return Math.floor(bytesDone / chunk) + 1;
}

export function parseParts(json: string | null | undefined): number[] {
  if (!json) return [];
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? v.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function parseUrls(json: string | null | undefined): Record<number, PartUrl> {
  if (!json) return {};
  try {
    const v: unknown = JSON.parse(json);
    return v && typeof v === "object" ? (v as Record<number, PartUrl>) : {};
  } catch {
    return {};
  }
}

/** the parts storage does not hold yet, in order */
export function missingParts(size: number, chunk: number, done: number[]): number[] {
  const have = new Set(done);
  const out: number[] = [];
  for (let n = 1; n <= partCount(size, chunk); n++) if (!have.has(n)) out.push(n);
  return out;
}

/** How much of the file storage holds, 0..1, from what it last said. For a
 *  file sent in one PUT this is 0 until it is confirmed: the in-flight
 *  fraction lives in upload/progress.ts, not here. */
export function completeFraction(row: {
  size: number;
  upload_protocol: string | null;
  chunk_size: number | null;
  bytes_done: number;
  parts_done: string | null;
}): number {
  if (!row.size || !row.chunk_size) return 0;
  const bytes =
    row.upload_protocol === "gcs"
      ? row.bytes_done
      : parseParts(row.parts_done).reduce((sum, n) => sum + partRange(n, row.size, row.chunk_size ?? row.size).length, 0);
  return Math.max(0, Math.min(1, bytes / row.size));
}
