// SHA-256 of a picked file, as lowercase hex. The manifest the server records
// carries it, and presign is idempotent on it, so it must be computed before
// the first presign and never change.
//
// SubtleCrypto has no streaming digest, so the file is read into memory once —
// the same trade the phone makes. The caps in config.ts and HASH_SLOTS = 1
// keep that within reach of a modest laptop.

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i]!.toString(16).padStart(2, "0");
  return out;
}

export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return toHex(new Uint8Array(digest));
}
