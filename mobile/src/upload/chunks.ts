// Moving one chunk of a file to storage. The arithmetic is in parts.ts; this
// is the file system and the network: read the part natively from its offset
// (only the chunk ever reaches JavaScript), stage it as a small file of its
// own in the cache, PUT that file with the headers the protocol wants, and
// delete it. The upload task is the legacy one, deliberately: it answers with
// whatever status storage gave, and Google's "more to come" is a 308 that the
// newer task would read as a failure.

import * as Crypto from "expo-crypto";
import { Directory, File, FileMode, Paths } from "expo-file-system";
import * as Legacy from "expo-file-system/legacy";
import { PUT_STALL_MS } from "@/config";
import { contentRangeFor } from "./parts";

export type Protocol = "gcs" | "azure" | "s3";

export interface ChunkAnswer {
  status: number;
  headers: Record<string, string>;
  body: string | null;
}

const chunkDir = () => new Directory(Paths.cache, "chunks");

export interface ByteRange {
  start: number;
  end: number;
  length: number;
}

/** the bytes [start, start+length) of the file, read from the offset; the handle is closed either way */
export function readRange(uri: string, { start, length }: Pick<ByteRange, "start" | "length">): Uint8Array<ArrayBuffer> {
  const handle = new File(uri).open(FileMode.ReadOnly);
  try {
    handle.offset = start;
    return handle.readBytes(length);
  } finally {
    handle.close();
  }
}

/** The chunk as its own file in the cache, which the upload task takes whole.
 *  The cache, not documents: the OS may reclaim it, and nothing is lost if it
 *  does — the part is read again from the capture. */
export function stagePart(id: string, n: number, bytes: Uint8Array): File {
  const dir = chunkDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const f = new File(dir, `${id}-${n}.part`);
  f.create({ overwrite: true, intermediates: true });
  f.write(bytes);
  return f;
}

export function dropPart(f: File): void {
  try {
    if (f.exists) f.delete();
  } catch {
    // already gone; the cache is the OS's to clear anyway
  }
}

/** base64 MD5 of the bytes: what S3 and Azure verify a part against */
export async function md5Base64(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.MD5, bytes));
  let bin = "";
  for (let i = 0; i < digest.length; i++) bin += String.fromCharCode(digest[i]!);
  return globalThis.btoa(bin);
}

/** The headers a chunk goes up with. Google wants to know which bytes these
 *  are; Azure and S3 want a digest, and refuse the part if the bytes that
 *  arrive do not match it — the one check a chunk gets in transit. */
export async function partHeaders(
  protocol: Protocol,
  range: Pick<ByteRange, "start" | "end">,
  size: number,
  bytes: Uint8Array<ArrayBuffer>,
  contentType: string,
): Promise<Record<string, string>> {
  if (protocol === "gcs") return { "Content-Type": contentType, "Content-Range": contentRangeFor(range.start, range.end, size) };
  return { "Content-Type": contentType, "Content-MD5": await md5Base64(bytes) };
}

/** PUT the staged chunk. The status comes back whatever it is; machine.ts
 *  chunkOutcome() reads it. A transfer with no progress for PUT_STALL_MS is
 *  cancelled and answers 0, so it is retried like any other network failure
 *  rather than holding its lane open. */
export async function sendPart(
  file: File,
  url: string,
  headers: Record<string, string>,
  onProgress: (fraction: number) => void,
): Promise<ChunkAnswer> {
  let task: Legacy.UploadTask | null = null;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  const arm = () => {
    if (watchdog) clearTimeout(watchdog);
    watchdog = setTimeout(() => void task?.cancelAsync().catch(() => undefined), PUT_STALL_MS);
  };
  task = Legacy.createUploadTask(
    url,
    file.uri,
    { httpMethod: "PUT", uploadType: Legacy.FileSystemUploadType.BINARY_CONTENT, headers },
    (p) => {
      arm();
      onProgress(p.totalBytesSent / Math.max(1, p.totalBytesExpectedToSend));
    },
  );
  arm();
  try {
    const r = await task.uploadAsync();
    return { status: r?.status ?? 0, headers: r?.headers ?? {}, body: r?.body ?? null };
  } finally {
    if (watchdog) clearTimeout(watchdog);
  }
}
