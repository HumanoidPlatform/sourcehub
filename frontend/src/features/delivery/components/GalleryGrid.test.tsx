// The capture gallery at scale (db/530). What is under test is the shape of
// the traffic: pages by cursor rather than every row, a slice of tiles rather
// than all of them, a poster <img> or a placeholder and never a <video>, one
// detail and one link when a capture is opened — and that the window stays
// honest when the preview opens above it and moves it.
//
// jsdom lays nothing out, so the grid falls back to its assumed geometry
// (948 px wide, 640 px of viewport: 11 columns, rows of ~67 px) and the rects
// the browser would report are stood in for below.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AssetRow, GalleryPage, GalleryRow } from "@api/types";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve([])),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
}));
vi.mock("@api/client", () => api);

import { fmtClock, GalleryGrid, pageRefetchInterval, pageStaleTime, type GallerySource } from "./GalleryGrid";
import { windowFor } from "./gallery-window";

const TOTAL = 240;
const PAGE = 60;

function row(i: number, over: Partial<GalleryRow> = {}): GalleryRow {
  return {
    id: `as${i}`, task_id: "t1", assignment_id: "a1", submission_id: null, batch_id: "b1", batch_no: 1,
    status: "ready", stage: "in_review", filename: `shelf-${i}.jpg`, mime_type: "image/jpeg", duration_s: null,
    captured_at: "2026-10-01T09:00:00Z", captured_by_name: "Sana Kulkarni", quarantine_reason: null,
    review_reason: null, review_label: null, badge: null, thumb_url: null, ...over,
  };
}

let rows: (i: number) => GalleryRow = (i) => row(i);

/** page n of the 240: 60 rows, a cursor while more follow, the total on the first */
function pageAt(n: number): GalleryPage {
  const start = n * PAGE;
  const more = start + PAGE < TOTAL;
  return {
    items: Array.from({ length: Math.min(PAGE, TOTAL - start) }, (_, k) => rows(start + k)),
    has_more: more,
    next_cursor: more ? `cur${n + 1}` : null,
    expires_in: 900,
    total: n === 0 ? TOTAL : null,
  };
}

function detail(id: string): AssetRow {
  return {
    id, task_id: "t1", assignment_id: "a1", submission_id: null, captured_by_user_id: "u1",
    captured_by_name: "Sana Kulkarni", filename: `${id}.jpg`, mime_type: "image/jpeg", size_bytes: 2_400_000,
    sha256: "a".repeat(64), etag: null, status: "ready", quarantine_reason: null,
    captured_at: "2026-10-01T09:00:00Z", captured_lat: null, captured_lon: null,
    uploaded_at: "2026-10-01T09:01:00Z", created_at: "2026-10-01T09:01:00Z",
  };
}

// A page the test can hold back, to catch the gallery between asking for it
// and having it.
let gate: Promise<void> | null = null;
let openGate: () => void = () => {};
// and a page it can refuse, as a saturated API would
let failing: number | null = null;
// and the whole array instead of a page, as an API from before db/530 answers
let legacyArray = false;

/** the task route, paged: ?limit=60, then &after=cur1, cur2, cur3 */
function serve(path: string): Promise<unknown> {
  const m = /^\/tasks\/t1\/assets\?(.*)$/.exec(path);
  if (m) {
    const after = new URLSearchParams(m[1]).get("after");
    const n = after ? Number(after.replace("cur", "")) : 0;
    if (legacyArray) return Promise.resolve([detail("as1")]);
    if (n === failing) return Promise.reject(new Error("502 Bad Gateway"));
    return n === 3 && gate ? gate.then(() => pageAt(3)) : Promise.resolve(pageAt(n));
  }
  if (/^\/assets\/[^/]+\/url$/.test(path)) {
    return Promise.resolve({ url: "blob:x", filename: "x", mime_type: "image/jpeg", expires_in: 900 });
  }
  if (path.startsWith("/assets/")) return Promise.resolve(detail(path.slice("/assets/".length)));
  return Promise.resolve([]);
}

let scroller: HTMLElement | null = null;
const PREVIEW_HEIGHT = 300;

function show(source: GallerySource = { kind: "task", id: "t1" }) {
  const r = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <div data-testid="scroller" style={{ overflowY: "auto", height: 480 }}>
        <GalleryGrid source={source} />
      </div>
    </QueryClientProvider>,
  );
  scroller = r.getByTestId("scroller");
  return r;
}

const tiles = () => screen.queryAllByRole("button", { name: /^shelf-/ });
const grid = () => screen.getByTestId("gallery-grid");
const position = () => screen.getByTestId("preview-position").textContent;

function scrollTo(top: number) {
  scroller!.scrollTop = top;
  fireEvent.scroll(scroller!);
}

beforeEach(() => {
  rows = (i) => row(i);
  gate = null;
  failing = null;
  legacyArray = false;
  scroller = null;
  api.get.mockReset().mockImplementation(serve);
  // Stand in for the browser's rects, which jsdom reports as zeros: the
  // scroller sits at the top of the viewport; the grid starts where the
  // scroller does, is pushed down by the preview when one is open, and moves
  // up as the scroller scrolls.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const top = this.getAttribute("data-testid") === "gallery-grid"
      ? (document.querySelector('[data-testid="gallery-preview"]') ? PREVIEW_HEIGHT : 0) - (scroller?.scrollTop ?? 0)
      : 0;
    return { x: 0, y: top, top, left: 0, right: 0, bottom: top, width: 0, height: 0, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("a window over pages", () => {
  it("says so when the server is older than this console and answers the whole list", async () => {
    legacyArray = true;
    show();
    await screen.findByText(/older than this console/);
    expect(screen.queryByText("No captures yet")).toBeNull();
  });

  it("mounts a slice of the 240, never all of them", async () => {
    show();
    await screen.findByRole("button", { name: /^shelf-0\.jpg/ });
    // one page of 60 cannot fill the viewport, so the next ones follow by cursor
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining("after=cur1")));
    expect(tiles().length).toBeGreaterThan(0);
    expect(tiles().length).toBeLessThan(TOTAL);
    expect(screen.queryByRole("button", { name: /^shelf-200\.jpg/ })).toBeNull();
    // and nothing asked for the whole array
    expect(api.get).not.toHaveBeenCalledWith("/tasks/t1/assets");
  });

  it("asks for the next page by cursor as the reviewer scrolls", async () => {
    show();
    await screen.findByRole("button", { name: /^shelf-0\.jpg/ });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining("after=cur2")));
    expect(api.get).not.toHaveBeenCalledWith(expect.stringContaining("after=cur3"));

    scrollTo(5000);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/tasks/t1/assets?limit=60&after=cur3"));
    // the first tile has left the page with the rows above the window
    await waitFor(() => expect(screen.queryByRole("button", { name: /^shelf-0\.jpg/ })).toBeNull());
    expect(grid().style.paddingTop).not.toBe("0px");
  });

  it("sends flagged as a filter on the page request", async () => {
    show({ kind: "task", id: "t1", flagged: true });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/tasks/t1/assets?limit=60&flagged=true"));
  });

  it("asks for a page that failed once, and again only when the reviewer retries", async () => {
    failing = 1;
    show();
    await screen.findByRole("button", { name: /^shelf-0\.jpg/ });
    await screen.findByText(/Could not load more/);
    const asks = () => api.get.mock.calls.filter(([p]) => p.includes("after=cur1")).length;
    // react-query keeps the pages and the cursor after a failure, so the
    // window is still at the loaded end: left to itself the fetch-ahead would
    // ask for the same page the moment the failed ask settled, and again, and
    // again — on a scroll too.
    await new Promise((r) => setTimeout(r, 100));
    scrollTo(300);
    await new Promise((r) => setTimeout(r, 50));
    expect(asks()).toBe(1);

    // the API is back: Retry asks once more, and the fetch-ahead goes on
    failing = null;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByText(/Could not load more/)).toBeNull());
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining("after=cur2")));
    expect(asks()).toBe(2);
  });
});

describe("what a tile is", () => {
  it("draws a poster-less clip as a placeholder with its length, never a <video>", async () => {
    rows = (i) => row(i, { filename: `clip-${i}.mp4`, mime_type: "video/mp4", duration_s: 95 });
    const { container } = show();
    await screen.findByRole("button", { name: /^clip-0\.mp4/ });
    expect(screen.getAllByText("1:35").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("video")).toHaveLength(0);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("draws the poster as an <img>, never a <video>, and asks for no link of its own", async () => {
    rows = (i) => row(i, {
      filename: `clip-${i}.mp4`, mime_type: "video/mp4", duration_s: 95, thumb_url: `https://bucket/clip-${i}.thumb.jpg`,
    });
    const { container } = show();
    await screen.findByRole("button", { name: /^clip-0\.mp4/ });
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://bucket/clip-0.thumb.jpg");
    expect(container.querySelectorAll("video")).toHaveLength(0);
    expect(api.get.mock.calls.some(([p]) => p.endsWith("/url"))).toBe(false);
  });

  it("formats a running time", () => {
    expect(fmtClock(95)).toBe("1:35");
    expect(fmtClock(5)).toBe("0:05");
    expect(fmtClock(3725)).toBe("1:02:05");
  });
});

describe("a poster that will not load", () => {
  const signed = (sig: string) => (i: number) => row(i, { thumb_url: `https://bucket/shelf-${i}.thumb.jpg?sig=${sig}` });
  /** how often the first page was asked for: once to load, once more per re-sign */
  const firstPageAsks = () => api.get.mock.calls.filter(([p]) => p === "/tasks/t1/assets?limit=60").length;

  it("leaves the placeholder and asks for nothing while the page's links are fresh", async () => {
    rows = signed("old");
    show();
    const tile = await screen.findByRole("button", { name: /^shelf-0\.jpg/ });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining("after=cur2")));
    // The links are good for fifteen minutes and the page has just arrived,
    // so the object itself is the problem — corrupt, or never finished
    // uploading — and no re-sign would bring it back. Asking for every loaded
    // page again for it would re-sign hundreds of links that are fine.
    fireEvent.error(tile.querySelector("img")!);
    await waitFor(() => expect(tile.querySelector("img")).toBeNull());
    await new Promise((r) => setTimeout(r, 50));
    expect(firstPageAsks()).toBe(1);
  });

  it("brings a poster back when the pages are re-signed, in the same tile, once the links have aged", async () => {
    // the clock, not the timers: the pages are stamped with Date.now() as
    // they arrive, and the question is what a broken poster does later
    vi.useFakeTimers({ toFake: ["Date"] });
    rows = signed("old");
    show();
    const tile = await screen.findByRole("button", { name: /^shelf-0\.jpg/ });
    const next = await screen.findByRole("button", { name: /^shelf-1\.jpg/ });
    const img = tile.querySelector("img")!;
    expect(img.getAttribute("src")).toContain("sig=old");
    // Fourteen minutes on: the links were signed for fifteen and the pages are
    // a minute from their two-minute margin, so a poster failing now is
    // plausibly a dead link. The tile falls back to its placeholder and asks
    // for the pages again — once, however many tiles fail together. They come
    // back with fresh links, and this same tile — same key, same position —
    // must draw its new one, not stay grey.
    vi.setSystemTime(Date.now() + 14 * 60_000);
    rows = signed("new");
    fireEvent.error(img);
    fireEvent.error(next.querySelector("img")!);
    await waitFor(() => expect(tile.querySelector("img")).toBeNull());
    await waitFor(() => expect(tile.querySelector("img")?.getAttribute("src")).toContain("sig=new"));
    expect(firstPageAsks()).toBe(2);
  });
});

describe("links by page", () => {
  // The pages as the query holds them: the wire page plus the moment it
  // arrived. dataUpdatedAt is the newest page's, as react-query keeps it.
  const held = (...pages: { fetched_at: number; expires_in: number }[]) => ({
    state: {
      dataUpdatedAt: Math.max(...pages.map((p) => p.fetched_at)),
      data: { pages: pages.map((p, n) => ({ ...pageAt(n), ...p })), pageParams: pages.map((_, n) => (n ? `cur${n}` : null)) },
    },
  });

  it("keeps a page fresh for its links' life less two minutes, floor 30 s", () => {
    const now = Date.now();
    expect(pageStaleTime(held({ fetched_at: now, expires_in: 900 }))).toBe(13 * 60_000);
    expect(pageStaleTime(held({ fetched_at: now, expires_in: 60 }))).toBe(30_000);
    // Page one came in five minutes before page two. react-query counts
    // staleness from page two's arrival, so the time left is page one's:
    // eight minutes, not thirteen — or page one's links would die first.
    expect(pageStaleTime(held({ fetched_at: now - 5 * 60_000, expires_in: 900 }, { fetched_at: now, expires_in: 900 })))
      .toBe(8 * 60_000);
    // and the shortest life any page was given is the one that counts
    expect(pageStaleTime(held({ fetched_at: now - 60_000, expires_in: 900 }, { fetched_at: now, expires_in: 300 })))
      .toBe(2 * 60_000);
  });

  it("re-signs the pages at the end of the oldest one's life", () => {
    const now = Date.now();
    const left = pageRefetchInterval(held({ fetched_at: now, expires_in: 900 }));
    expect(left).toBeGreaterThan(13 * 60_000 - 1_000);
    expect(left).toBeLessThanOrEqual(13 * 60_000);
    // the timer runs from page one's arrival, not page two's
    const older = pageRefetchInterval(held({ fetched_at: now - 5 * 60_000, expires_in: 900 }, { fetched_at: now, expires_in: 900 }));
    expect(older).toBeGreaterThan(8 * 60_000 - 1_000);
    expect(older).toBeLessThanOrEqual(8 * 60_000);
  });
});

describe("opening a capture", () => {
  it("fetches the one row and the one link, and no other link", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: /^shelf-1\.jpg/ }));
    expect(await screen.findByTestId("preview-position")).toBeTruthy();
    const calls = api.get.mock.calls.map(([p]) => p);
    expect(calls.filter((p) => p === "/assets/as1")).toHaveLength(1);
    expect(calls.filter((p) => p === "/assets/as1/url")).toHaveLength(1);
    expect(calls.filter((p) => p.endsWith("/url"))).toHaveLength(1);
  });

  it("steps with the arrow keys against the server's total", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: /^shelf-0\.jpg/ }));
    await screen.findByTestId("preview-position");
    expect(position()).toBe("1 of 240");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await waitFor(() => expect(position()).toBe("2 of 240"));
  });

  it("keeps row 0 first and the top padding at 0 when the preview opens above the grid", async () => {
    show();
    await screen.findByRole("button", { name: /^shelf-0\.jpg/ });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining("after=cur2")));
    // a few rows in: row 0 has left the page
    scrollTo(400);
    await waitFor(() => expect(screen.queryByRole("button", { name: /^shelf-0\.jpg/ })).toBeNull());
    expect(grid().style.paddingTop).not.toBe("0px");
    const before = tiles()[0]!.getAttribute("aria-label")!;
    expect(before).not.toMatch(/^shelf-0\.jpg/);

    // Open what is in view. The preview mounts above the grid and pushes it
    // down by its own height, so what the scroller shows is the top of the
    // grid again: the window must be re-measured, not left where it was.
    fireEvent.click(tiles()[0]!);
    await screen.findByTestId("preview-position");
    await waitFor(() => expect(grid().style.paddingTop).toBe("0px"));
    expect(tiles()[0]!.getAttribute("aria-label")).toMatch(/^shelf-0\.jpg/);
  });

  it("still steps when the open tile has scrolled out of the rendered window", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: /^shelf-0\.jpg/ }));
    await screen.findByTestId("preview-position");
    expect(position()).toBe("1 of 240");

    scrollTo(1500);
    await waitFor(() => expect(screen.queryByRole("button", { name: /^shelf-0\.jpg/ })).toBeNull());
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await waitFor(() => expect(position()).toBe("2 of 240"));
  });

  it("waits for the next page to step past what is loaded", async () => {
    gate = new Promise((r) => { openGate = r; });
    show();
    await screen.findByRole("button", { name: /^shelf-0\.jpg/ });
    // near the end of the three pages in hand: the fourth is asked for and held
    scrollTo(1050);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining("after=cur3")));
    fireEvent.click(await screen.findByRole("button", { name: /^shelf-179\.jpg/ }));
    await screen.findByTestId("preview-position");
    expect(position()).toBe("180 of 240");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    // nothing to show yet: the page is still on its way
    expect(position()).toBe("180 of 240");
    openGate();
    await waitFor(() => expect(position()).toBe("181 of 240"));
  });
});

describe("the window arithmetic", () => {
  it("clamps to row 0 while the grid starts below the viewport, and pads the rest", () => {
    // the grid begins 300 px down, 100 scrolled: 400 px of grid are in view
    const w = windowFor({ scrollTop: 100, offset: 300, viewport: 600, rowHeight: 100, totalRows: 50 });
    expect(w.first).toBe(0);
    expect(w.padTop).toBe(0);
    expect(w.last).toBe(5);
    expect(w.padBottom).toBe(44 * 100);
  });

  it("renders the rows around the scroll position with two of overscan each side", () => {
    const w = windowFor({ scrollTop: 1000, offset: 0, viewport: 600, rowHeight: 100, totalRows: 50 });
    expect([w.first, w.last]).toEqual([8, 17]);
    expect(w.padTop).toBe(800);
    expect(w.padBottom).toBe(32 * 100);
  });

  it("renders nothing for no rows", () => {
    expect(windowFor({ scrollTop: 0, offset: 0, viewport: 600, rowHeight: 100, totalRows: 0 }))
      .toEqual({ first: 0, last: -1, padTop: 0, padBottom: 0 });
  });
});
