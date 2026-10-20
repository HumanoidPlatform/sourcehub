// The startup sweep, on a fake file system: it removes old files nothing
// points at, and never a file a row still needs or one too new to judge.

const NOW = 1_700_000_000_000;
const OLD = (NOW - 60 * 60_000) / 1000; // an hour ago, in seconds
const NEW = (NOW - 60_000) / 1000; // a minute ago

const mockTree: Record<string, { dir?: string[]; mtime?: number }> = {};
const mockDeleted: string[] = [];
const mockKeep = new Set<string>();

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///docs/",
  cacheDirectory: "file:///cache/",
  getInfoAsync: async (uri: string) => {
    const n = mockTree[uri];
    if (!n) return { exists: false };
    return n.dir ? { exists: true, isDirectory: true } : { exists: true, isDirectory: false, modificationTime: n.mtime };
  },
  readDirectoryAsync: async (uri: string) => mockTree[uri]?.dir ?? [],
  deleteAsync: async (uri: string) => {
    mockDeleted.push(uri);
  },
}));

jest.mock("../src/db/outbox", () => ({ localUris: async () => mockKeep }));

import { sweepOrphans } from "../src/capture/sweep";

beforeEach(() => {
  for (const k of Object.keys(mockTree)) delete mockTree[k];
  mockDeleted.length = 0;
  mockKeep.clear();
});

it("deletes old orphans and stale chunks, keeps queued and fresh files", async () => {
  Object.assign(mockTree, {
    "file:///docs/captures/": { dir: ["a1"] },
    // a listing names the folder without its slash; the walk goes in with one
    "file:///docs/captures/a1": { dir: [] },
    "file:///docs/captures/a1/": { dir: ["queued.mp4", "orphan.mp4", "checking.mp4"] },
    "file:///docs/captures/a1/queued.mp4": { mtime: OLD },
    "file:///docs/captures/a1/orphan.mp4": { mtime: OLD },
    "file:///docs/captures/a1/checking.mp4": { mtime: NEW },
    "file:///cache/chunks/": { dir: ["x-1.part"] },
    "file:///cache/chunks/x-1.part": { mtime: OLD },
  });
  // the row spells the path without the scheme: it still protects the file
  mockKeep.add("/docs/captures/a1/queued.mp4");

  expect(await sweepOrphans(NOW)).toBe(2);
  expect(mockDeleted.sort()).toEqual(["file:///cache/chunks/x-1.part", "file:///docs/captures/a1/orphan.mp4"]);
});

it("does nothing when there is no captures folder", async () => {
  expect(await sweepOrphans(NOW)).toBe(0);
});
