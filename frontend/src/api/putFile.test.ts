import { afterEach, describe, expect, it, vi } from "vitest";
import { putFile } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const file = () => new File(["bytes"], "photo.jpg", { type: "image/jpeg" });

describe("putFile", () => {
  it("uploads directly to the signed URL with only the presigned headers", async () => {
    const photo = file();
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("PUT");
      expect(init?.body).toBe(photo);
      expect(init?.headers).toEqual({ "x-ms-blob-type": "BlockBlob" });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(putFile("https://storage.example/photo", photo, { "x-ms-blob-type": "BlockBlob" }))
      .resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("https://storage.example/photo", expect.objectContaining({
      method: "PUT",
      body: photo,
      headers: { "x-ms-blob-type": "BlockBlob" },
    }));
  });

  it("turns a stalled upload into a readable timeout instead of hanging forever", async () => {
    vi.useFakeTimers();
    const photo = file();
    vi.stubGlobal("fetch", vi.fn((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const e = new Error("aborted");
          e.name = "AbortError";
          reject(e);
        });
      }),
    ));

    const upload = expect(putFile("https://storage.example/photo", photo, {}, 500)).rejects.toMatchObject({
      status: 0,
      message: "Upload timed out — try the file again",
    });
    await vi.advanceTimersByTimeAsync(500);

    await upload;
  });
});
