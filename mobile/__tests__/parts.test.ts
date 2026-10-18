import {
  bytesHeld,
  completeFraction,
  contentRange,
  contentRangeFor,
  gcsRange,
  missingParts,
  nextGcsPart,
  parseParts,
  parseUrls,
  partCount,
  partRange,
} from "../src/upload/parts";

const CHUNK = 8 * 1024 * 1024;
const SIZE = 3 * CHUNK + 5; // four parts, the last five bytes long

describe("parts of a chunked upload", () => {
  it("counts parts, the last one short", () => {
    expect(partCount(SIZE, CHUNK)).toBe(4);
    expect(partCount(CHUNK, CHUNK)).toBe(1);
    expect(partCount(1, CHUNK)).toBe(1);
    expect(partRange(1, SIZE, CHUNK)).toEqual({ start: 0, end: CHUNK, length: CHUNK });
    expect(partRange(4, SIZE, CHUNK)).toEqual({ start: 3 * CHUNK, end: SIZE, length: 5 });
  });

  it("writes Google's Content-Range with an inclusive last byte", () => {
    expect(contentRange(1, SIZE, CHUNK)).toBe(`bytes 0-${CHUNK - 1}/${SIZE}`);
    expect(contentRange(4, SIZE, CHUNK)).toBe(`bytes ${3 * CHUNK}-${SIZE - 1}/${SIZE}`);
  });

  it("reads Google's Range as a count of bytes held", () => {
    expect(bytesHeld(`bytes=0-${CHUNK - 1}`)).toBe(CHUNK);
    expect(bytesHeld("bytes=0-0")).toBe(1);
    expect(bytesHeld(undefined)).toBe(0);
    expect(bytesHeld("bytes=5-9")).toBe(0);
    expect(nextGcsPart(0, CHUNK)).toBe(1);
    expect(nextGcsPart(2 * CHUNK, CHUNK)).toBe(3);
  });

  it("sends Google the next chunk from exactly the byte it holds, not from a part boundary", () => {
    // a cut mid-chunk leaves Google holding 256 KiB steps; re-sending from
    // the part's start is a range it refuses, and the clip was marked failed
    const held = CHUNK + 256 * 1024;
    expect(gcsRange(held, SIZE, CHUNK)).toEqual({ start: held, end: held + CHUNK, length: CHUNK });
    expect(contentRangeFor(held, held + CHUNK, SIZE)).toBe(`bytes ${held}-${held + CHUNK - 1}/${SIZE}`);
    // aligned, the range is the part itself
    expect(gcsRange(2 * CHUNK, SIZE, CHUNK)).toEqual(partRange(3, SIZE, CHUNK));
    // the tail is short, and nothing is asked past the end
    expect(gcsRange(3 * CHUNK + 2, SIZE, CHUNK)).toEqual({ start: 3 * CHUNK + 2, end: SIZE, length: 3 });
    expect(gcsRange(SIZE, SIZE, CHUNK).length).toBe(0);
  });

  it("lists the parts storage lacks, in order, and tolerates bad JSON", () => {
    expect(missingParts(SIZE, CHUNK, [1, 3])).toEqual([2, 4]);
    expect(missingParts(SIZE, CHUNK, [1, 2, 3, 4])).toEqual([]);
    expect(parseParts("[3,1]")).toEqual([3, 1]);
    expect(parseParts("nonsense")).toEqual([]);
    expect(parseParts(null)).toEqual([]);
    expect(parseUrls('{"2":{"url":"u","expires_at":5}}')).toEqual({ 2: { url: "u", expires_at: 5 } });
    expect(parseUrls("{")).toEqual({});
  });

  it("says how much of the file storage holds", () => {
    const gcs = { size: SIZE, upload_protocol: "gcs", chunk_size: CHUNK, bytes_done: 2 * CHUNK, parts_done: null };
    expect(completeFraction(gcs)).toBeCloseTo((2 * CHUNK) / SIZE);
    const s3 = { size: SIZE, upload_protocol: "s3", chunk_size: CHUNK, bytes_done: 0, parts_done: "[1,4]" };
    expect(completeFraction(s3)).toBeCloseTo((CHUNK + 5) / SIZE);
    expect(completeFraction({ size: 10, upload_protocol: null, chunk_size: null, bytes_done: 0, parts_done: null })).toBe(0);
  });
});
