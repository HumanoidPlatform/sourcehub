// The regression that would have caught the iPhone failure: expo-crypto's
// native digest takes a typed array, and an ArrayBuffer makes it throw.

const mockDigest = jest.fn(async (_alg: string, data: unknown) => {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("Argument of type ArrayBuffer cannot be converted to TypedArray");
  }
  return new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer;
});
const mockBytes = jest.fn(async () => new Uint8Array([1, 2, 3]));
const mockReadAsString = jest.fn(async () => "AQID"); // base64 of [1, 2, 3]

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digest: (alg: string, data: unknown) => mockDigest(alg, data),
}));
jest.mock("expo-file-system", () => ({
  File: class {
    constructor(_uri: string) {}
    bytes() {
      return mockBytes();
    }
  },
}));
jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: (uri: string, opts: unknown) => mockReadAsString(uri, opts),
  EncodingType: { Base64: "base64" },
}));

import { sha256Hex } from "../src/upload/hash";

describe("sha256Hex", () => {
  beforeEach(() => {
    mockDigest.mockClear();
    mockBytes.mockClear();
    mockReadAsString.mockClear();
  });

  it("hands the native digest a typed array, never a bare buffer", async () => {
    await expect(sha256Hex("file:///captures/a.jpg")).resolves.toBe("deadbeef");
    expect(mockDigest).toHaveBeenCalledTimes(1);
    expect(mockDigest.mock.calls[0]![1]).toBeInstanceOf(Uint8Array);
    expect(mockReadAsString).not.toHaveBeenCalled();
  });

  it("falls back to the legacy base64 read when the file API fails", async () => {
    mockBytes.mockRejectedValueOnce(new Error("unsupported"));
    await expect(sha256Hex("file:///captures/b.jpg")).resolves.toBe("deadbeef");
    expect(mockReadAsString).toHaveBeenCalledTimes(1);
    const data = mockDigest.mock.calls[0]![1] as Uint8Array;
    expect(Array.from(data)).toEqual([1, 2, 3]);
  });
});
