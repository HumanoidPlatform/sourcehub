// SHA-256 of a local file, as hex. The manifest the server records carries
// it, and presign is idempotent on it, so it must be computed before the
// first presign and never change.
//
// expo-crypto has no streaming digest, so the file is read into memory once.
// The caps in config.ts keep that within reach of a mid-range phone.
//
// The native digest takes a TYPED ARRAY. On iOS expo-crypto has no async
// variant, and its synchronous binding rejects a bare ArrayBuffer with an
// argument-conversion error — which is exactly what an earlier version of
// this file passed. The bytes are handed over as the file API returns them.

import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import * as Legacy from "expo-file-system/legacy";

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i]!.toString(16).padStart(2, "0");
  return out;
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = globalThis.atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function sha256Hex(uri: string): Promise<string> {
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = await new File(uri).bytes();
  } catch {
    // older runtimes: the legacy API reads base64, decoded here
    const b64 = await Legacy.readAsStringAsync(uri, { encoding: Legacy.EncodingType.Base64 });
    bytes = base64ToBytes(b64);
  }
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  return toHex(new Uint8Array(digest));
}
