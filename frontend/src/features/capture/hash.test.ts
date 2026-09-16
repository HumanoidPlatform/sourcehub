import { describe, expect, it } from "vitest";
import { sha256Hex } from "./hash";

describe("sha256Hex", () => {
  it("is the digest presign expects: 64 lowercase hex characters", async () => {
    // the well-known SHA-256 of "abc"
    await expect(sha256Hex(new Blob(["abc"]))).resolves.toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("hashes an empty file too", async () => {
    await expect(sha256Hex(new Blob([]))).resolves.toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});
