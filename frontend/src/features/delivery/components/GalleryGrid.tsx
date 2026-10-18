// delivery/components — the capture gallery at scale (db/530): a window over
// pages of poster tiles, for the three review dialogs.
//
// AssetGallery mounts a tile per row, and each tile signs its own link. A
// delivery partner opening a 2,000-clip submission sent ~130 /url calls at
// once — six times the 20 connections the platform has — and left 2,000
// <video> elements in the page, each fetching a clip's header off a 1 GB
// original to draw a 76 px tile. Here instead:
//
// - the rows arrive in pages of 60 by cursor, scoped to the task, batch or
//   submission being judged, each ~300 B with its poster link already signed
//   on the server. Nothing is signed per tile;
// - only the rows near the screen exist in the page. The grid is padded to its
//   full height and the slice in view is rendered; a tile that scrolls away
//   unmounts, and its <img> goes with it;
// - a tile is an <img> on the poster, or a placeholder, never a <video>. The
//   clip loads in the preview, once, when it is opened;
// - a page's links are refreshed together two minutes before they expire,
//   timed from the oldest page in hand, and a verdict refetches the named
//   queries rather than everything.
//
// The windowing is hand-rolled (gallery-window.ts): tiles are a fixed 4:3 in
// a known number of columns, so a row's height is arithmetic. The
// {kind: "rows"} source wraps the legacy per-assignment array for the decide
// route that has no batch yet, and for tests.

import { useInfiniteQuery, useQuery, type InfiniteData } from "@tanstack/react-query";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { get } from "@api/client";
import type { AssetRow, GalleryPage, GalleryRow } from "@api/types";
import { Button, Empty } from "@ds/primitives";
import { assetStatus, statusMeta } from "@shared/status";
import { AssetPreview, BADGE, isVideo, RETAKE_REASONS, subjectCheck, type Mark } from "./AssetGallery";
import { galleryKeys, type GalleryKind } from "./gallery-keys";
import {
  ASSUMED_VIEWPORT, ASSUMED_WIDTH, columnsFor, GAP_DEFAULT, linkLife, offsetWithin, refetchIn,
  rowHeightFor, rowsFor, scrollParentOf, tileWidth, wantsNextPage, windowFor,
} from "./gallery-window";

const PAGE_SIZE = 60;
/** a broken poster asks for the pages again, but not more often than this */
const BROKEN_REFETCH_MS = 30_000;
/** and only from this long before the pages' links go stale: earlier, the
 *  link is good and the object behind it is what is broken */
const BROKEN_EARLY_MS = 60_000;

export type GallerySource =
  | { kind: GalleryKind; id: string; flagged?: boolean }
  /** the legacy array, already in hand; nothing is fetched for the tiles or the preview */
  | { kind: "rows"; rows: AssetRow[]; loading?: boolean };

interface GalleryProps {
  emptyTitle?: string;
  emptyHint?: string;
  /** The dialog's own rule for the mark a tile shows — an explicit mark, else
   *  the blanket retake. Absent everywhere but gate 1. */
  markOf?: (id: string) => Mark | undefined;
  /** null clears the mark on that capture */
  onMark?: (a: AssetRow, m: Mark | null) => void;
}

/** The capture grid behind every review: a paged source (task, batch or
 *  submission) or, for the legacy no-batch decide, the rows already loaded. */
export function GalleryGrid({ source, ...rest }: GalleryProps & { source: GallerySource }) {
  return source.kind === "rows"
    ? <RowsGallery rows={source.rows} loading={source.loading} {...rest} />
    : <PagedGallery kind={source.kind} id={source.id} flagged={!!source.flagged} {...rest} />;
}

/* --- the two sources, as one feed -------------------------------------------- */

/** What the window needs to know about where its rows come from. */
interface Feed {
  rows: GalleryRow[];
  /** every row the caller may see, from the first page; null when unknown */
  total: number | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetching: boolean;
  /** the next page; resolves with every row loaded once it is in */
  fetchMore: () => Promise<GalleryRow[]>;
  /** the pages again, with fresh links */
  refetch: () => void;
  /** when the loaded pages' links stop being trusted; null when the source
   *  has none to re-sign */
  linksStaleAt: number | null;
}

/** One page's request: limit, then after, then flagged, built with URLSearchParams. */
function pageUrl(kind: GalleryKind, id: string, flagged: boolean, after: string | null): string {
  const base = kind === "task" ? `/tasks/${id}/assets` : kind === "batch" ? `/batches/${id}/assets` : `/submissions/${id}/assets`;
  const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (after) qs.set("after", after);
  if (flagged) qs.set("flagged", "true");
  return `${base}?${qs}`;
}

/** A page as the query holds it: the wire page and the moment it arrived.
 *  Stamped in queryFn, never sent. react-query's own dataUpdatedAt is bumped
 *  by every fetchNextPage, so it is the newest page's arrival; a link's life
 *  runs from its own page's, and page one's would die before a timer set from
 *  page four's went off. */
type StoredPage = GalleryPage & { fetched_at: number };

// When the loaded pages' links stop being trusted: the oldest page's arrival
// plus the shortest life any page was signed for. Conservative where those
// are different pages, exact where the server signs every page alike, which
// it does. Undefined until a page is in. Page tests answer unknown GETs with
// [] or null, so a page is read defensively throughout.
function linksStaleAt(data: InfiniteData<StoredPage> | undefined): number | undefined {
  const pages = (data?.pages ?? []).filter((p) => typeof p?.fetched_at === "number");
  if (!pages.length) return undefined;
  const lives = pages.map((p) => p.expires_in).filter((x): x is number => typeof x === "number");
  return Math.min(...pages.map((p) => p.fetched_at)) + linkLife(lives.length ? Math.min(...lives) : undefined);
}

type PageQuery = { state: { dataUpdatedAt: number; data?: InfiniteData<StoredPage> } };

/** staleTime, from the pages. react-query counts it from dataUpdatedAt, the
 *  newest page's arrival, so it is the distance from there to the oldest
 *  page's links going stale — a remount past that refetches at once rather
 *  than painting dead posters. Zero once they have gone, never negative. */
export function pageStaleTime(q: PageQuery): number {
  const at = linksStaleAt(q.state.data);
  return at == null ? linkLife(undefined) : Math.max(0, at - q.state.dataUpdatedAt);
}

/** refetchInterval, from the pages: what is left until the oldest page's
 *  links go stale, so one timer re-signs every page, never a tile. With no
 *  page in there is nothing to re-sign; the interval is set again the moment
 *  one arrives. */
export function pageRefetchInterval(q: PageQuery): number {
  const at = linksStaleAt(q.state.data);
  return at == null ? linkLife(undefined) : refetchIn(at);
}

function PagedGallery({ kind, id, flagged, ...rest }: GalleryProps & { kind: GalleryKind; id: string; flagged: boolean }) {
  const q = useInfiniteQuery({
    queryKey: galleryKeys.pages(kind, id, flagged),
    queryFn: async ({ pageParam }): Promise<StoredPage> => {
      const page = await get<GalleryPage | AssetRow[]>(pageUrl(kind, id, flagged, pageParam));
      // An API from before db/530 ignores the page parameters and answers the
      // whole array. Read as a page that is an empty gallery, and a reviewer
      // was told "No captures yet" about a task with two thousand. It is the
      // console running ahead of its server, and it has to say so.
      if (Array.isArray(page)) {
        throw new Error("the server is older than this console and answered the whole list instead of a page");
      }
      return { ...page, fetched_at: Date.now() };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last?.has_more ? last.next_cursor : undefined),
    staleTime: pageStaleTime,
    refetchInterval: pageRefetchInterval,
  });
  const rows = useMemo(() => (q.data?.pages ?? []).flatMap((p) => p?.items ?? []), [q.data]);
  const { fetchNextPage, refetch } = q;
  // cancelRefetch: false — a second ask while one is in flight must join it,
  // not restart it, or a scroll during the fetch would never let it finish.
  const fetchMore = useCallback(async () => {
    const r = await fetchNextPage({ cancelRefetch: false });
    return (r.data?.pages ?? []).flatMap((p) => p?.items ?? []);
  }, [fetchNextPage]);
  const refetchPages = useCallback(() => void refetch(), [refetch]);
  const staleAt = useMemo(() => linksStaleAt(q.data) ?? null, [q.data]);
  const feed: Feed = {
    rows,
    total: q.data?.pages[0]?.total ?? null,
    loading: q.isPending,
    error: q.isError ? (q.error instanceof Error ? q.error.message : "The request failed.") : null,
    hasMore: !!q.hasNextPage,
    fetching: q.isFetchingNextPage,
    fetchMore,
    refetch: refetchPages,
    linksStaleAt: staleAt,
  };
  // Keyed by the source: a filter flip or another parent is a different list,
  // and the window's scroll offset and open preview must not outlive the one
  // they belonged to (an open id missing from the new list would read 0 of N).
  return <GalleryWindow key={`${kind}:${id}:${flagged}`} feed={feed} {...rest} />;
}

/** The slim row AssetGallery's tiles would have drawn from the full one. */
function toGalleryRow(a: AssetRow): GalleryRow {
  const c = subjectCheck(a);
  return {
    id: a.id, task_id: a.task_id, assignment_id: a.assignment_id, submission_id: a.submission_id,
    batch_id: a.batch_id ?? null, batch_no: a.batch_no ?? null, status: a.status, stage: a.stage ?? stageOf(a),
    filename: a.filename, mime_type: a.mime_type, duration_s: a.duration_s ?? null,
    captured_at: a.captured_at, captured_by_name: a.captured_by_name, quarantine_reason: a.quarantine_reason,
    review_reason: a.review_reason ?? null, review_label: a.review_label ?? null,
    badge: c ? { code: c.code, message: c.message, severity: c.severity } : null,
    thumb_url: null,
  };
}

/** What the server's stage() says of a row outside any batch, for a payload
 *  from before `stage` existed on AssetRow: the only path that lacks it. */
function stageOf(a: AssetRow): NonNullable<AssetRow["stage"]> {
  if (a.status === "rejected") return "rework";
  return a.status === "ready" ? "draft" : "uploading";
}

const noMore = async (): Promise<GalleryRow[]> => [];
const noop = () => {};

function RowsGallery({ rows: assets, loading, ...rest }: GalleryProps & { rows: AssetRow[]; loading?: boolean }) {
  const rows = useMemo(() => assets.map(toGalleryRow), [assets]);
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const feed: Feed = {
    rows, total: rows.length, loading: !!loading, error: null, hasMore: false, fetching: false,
    fetchMore: noMore, refetch: noop, linksStaleAt: null,
  };
  return <GalleryWindow feed={feed} known={(id) => byId.get(id)} {...rest} />;
}

/* --- the window --------------------------------------------------------------- */

const raf: (cb: () => void) => number =
  typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => window.setTimeout(cb, 16);
const unraf: (h: number) => void =
  typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : (h) => window.clearTimeout(h);

function GalleryWindow({
  feed,
  known,
  markOf,
  onMark,
  emptyTitle = "No captures yet",
  emptyHint,
}: GalleryProps & {
  feed: Feed;
  /** the full row without a fetch, when the source already holds it */
  known?: (id: string) => AssetRow | undefined;
}) {
  const { rows, total } = feed;
  const gridRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // What was measured, and what the scroll parent shows. Null measurements
  // fall back to the assumed geometry until something lays out.
  const [geom, setGeom] = useState<{ width: number | null; viewport: number | null; gap: number }>({
    width: null, viewport: null, gap: GAP_DEFAULT,
  });
  const [view, setView] = useState({ scrollTop: 0, offset: 0 });
  // The open capture by id, not by element or index: a tile that has scrolled
  // out of the rendered window is gone from the page, but the preview and the
  // arrow keys must go on working on it.
  const [openId, setOpenId] = useState<string | null>(null);

  const width = geom.width ?? ASSUMED_WIDTH;
  const viewport = geom.viewport ?? ASSUMED_VIEWPORT;
  const cols = columnsFor(width, geom.gap);
  const rowHeight = rowHeightFor(tileWidth(width, cols, geom.gap), geom.gap);
  const totalRows = rowsFor(rows.length, cols);
  const win = windowFor({ scrollTop: view.scrollTop, offset: view.offset, viewport, rowHeight, totalRows });
  const slice = rows.slice(win.first * cols, (win.last + 1) * cols);

  // Read the geometry: the grid's width for the columns, the scroll parent's
  // height and position for the window, and the grid's offset inside it —
  // re-read on every scroll because the preview above moves the grid.
  const measure = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const parent = scrollParentOf(grid);
    const parentTop = parent ? parent.getBoundingClientRect().top : 0;
    const scrollTop = parent ? parent.scrollTop : window.scrollY;
    const vp = parent ? parent.clientHeight : window.innerHeight;
    const w = grid.clientWidth;
    const gapPx = parseFloat(getComputedStyle(grid).columnGap);
    const offset = offsetWithin(grid.getBoundingClientRect().top, parentTop, scrollTop);
    setGeom((g) => {
      const next = { width: w > 0 ? w : null, viewport: vp > 0 ? vp : null, gap: Number.isFinite(gapPx) ? gapPx : GAP_DEFAULT };
      return g.width === next.width && g.viewport === next.viewport && g.gap === next.gap ? g : next;
    });
    setView((v) => (v.scrollTop === scrollTop && v.offset === offset ? v : { scrollTop, offset }));
  }, []);

  const hasGrid = rows.length > 0;
  const isOpen = openId != null;
  useLayoutEffect(() => {
    measure();
    const grid = gridRef.current;
    if (!grid) return;
    const parent = scrollParentOf(grid);
    const target: EventTarget = parent ?? window;
    let frame = 0;
    const later = () => {
      if (frame) return;
      frame = raf(() => {
        frame = 0;
        measure();
      });
    };
    target.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
    // The grid for its width, the parent for its height, and the preview
    // because it grows when its picture arrives and pushes the grid down.
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(later);
      ro.observe(grid);
      if (parent) ro.observe(parent);
      if (previewRef.current) ro.observe(previewRef.current);
    }
    return () => {
      target.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
      ro?.disconnect();
      if (frame) unraf(frame);
    };
  }, [measure, hasGrid, isOpen]);

  // The next page, when the window is near the end of what is loaded. One
  // ask at a time: a scroll during the fetch must not start another. And none
  // after a failure: react-query keeps the pages and the cursor when the next
  // page fails, so the window is still at the loaded end and would ask for
  // the same page the moment the failed ask settled — a tight loop against an
  // API that has just said no. The reviewer retries from the line under the
  // grid, or the next re-sign of the pages clears the error.
  const fetchMoreRef = useRef(feed.fetchMore);
  fetchMoreRef.current = feed.fetchMore;
  const asking = useRef(false);
  useEffect(() => {
    if (!feed.hasMore || feed.fetching || feed.loading || feed.error || asking.current) return;
    if (!wantsNextPage(win.last, totalRows)) return;
    asking.current = true;
    void fetchMoreRef.current().finally(() => {
      asking.current = false;
    });
  }, [feed.hasMore, feed.fetching, feed.loading, feed.error, win.last, totalRows]);

  // A poster that would not load. The tile draws the placeholder; here, when
  // the pages' links are old enough that a dead one is the likely cause, the
  // pages are asked for once, so the rest of its tiles are re-signed together.
  // A poster failing while the links are fresh is the object itself — corrupt,
  // or never finished uploading — and no re-sign brings it back: one such tile
  // used to refetch every loaded page every 30 s for as long as it was on the
  // screen. The rows source has no links, so nothing is asked for there.
  const lastRefetch = useRef(0);
  const refetchRef = useRef(feed.refetch);
  refetchRef.current = feed.refetch;
  const staleAtRef = useRef(feed.linksStaleAt);
  staleAtRef.current = feed.linksStaleAt;
  const onBroken = useCallback(() => {
    const staleAt = staleAtRef.current;
    if (staleAt == null) return;
    const now = Date.now();
    if (now < staleAt - BROKEN_EARLY_MS) return;
    if (now - lastRefetch.current < BROKEN_REFETCH_MS) return;
    lastRefetch.current = now;
    refetchRef.current();
  }, []);

  // Walk the gallery from the keyboard, as AssetGallery does. Past the loaded
  // pages the next one is fetched and then opened; the position reads against
  // the server's total, so "61 of 240" is right before page two is in.
  const at = openId ? rows.findIndex((r) => r.id === openId) : -1;
  const of = total ?? rows.length;
  const step = async (by: number) => {
    if (at < 0) return;
    const to = at + by;
    if (to < 0 || (total != null && to >= total)) return;
    const here = rows[to];
    if (here) {
      setOpenId(here.id);
      return;
    }
    if (!feed.hasMore) return;
    const next = (await fetchMoreRef.current())[to];
    if (next) setOpenId(next.id);
  };
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // Not while they are in the reason picker or typing a note — there the
      // arrows belong to the control. Escape stays the Dialog's.
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      e.preventDefault();
      void stepRef.current(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (feed.loading) return <p className="muted small">Loading captures…</p>;
  if (feed.error && rows.length === 0) {
    return <p className="small" style={{ color: "var(--t-critical)" }}>Could not load the captures: {feed.error}</p>;
  }
  if (rows.length === 0) return <Empty title={emptyTitle} hint={emptyHint} />;
  return (
    <div>
      {openId && (
        <div ref={previewRef} data-testid="gallery-preview">
          <PreviewFor
            id={openId}
            known={known?.(openId)}
            mark={markOf?.(openId)}
            onMark={onMark}
            onClose={() => setOpenId(null)}
            position={{ at: at + 1, of }}
            onStep={(by) => void step(by)}
          />
        </div>
      )}
      {/* gridTemplateColumns inline from the same `cols` the window used, so
          CSS and arithmetic cannot disagree about where row n starts. */}
      <div
        ref={gridRef}
        className="assetgrid"
        data-windowed=""
        data-testid="gallery-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          paddingTop: win.padTop,
          paddingBottom: win.padBottom,
        }}
      >
        {slice.map((row) => (
          <Tile
            key={row.id}
            row={row}
            selected={row.id === openId}
            mark={markOf?.(row.id)}
            onOpen={(id) => setOpenId(openId === id ? null : id)}
            onBroken={onBroken}
          />
        ))}
      </div>
      {(feed.hasMore || feed.fetching || feed.error) && (
        <p className="small muted" style={{ marginTop: 6 }} data-testid="gallery-more">
          {feed.error ? (
            <>
              Could not load more: {feed.error}{" "}
              {/* The next page again — or, with every page in, the pages
                  again: then it was a re-sign that failed, not a page. */}
              <Button
                size="sm"
                disabled={feed.fetching}
                onClick={() => {
                  if (feed.hasMore) void feed.fetchMore();
                  else feed.refetch();
                }}
              >
                Retry
              </Button>
            </>
          ) : `${rows.length} of ${total ?? "…"} loaded${feed.fetching ? " · loading more…" : ""}`}
        </p>
      )}
    </div>
  );
}

/* --- the preview over a paged row ------------------------------------------- */

function PreviewFor({
  id,
  known,
  mark,
  onMark,
  onClose,
  position,
  onStep,
}: {
  id: string;
  known?: AssetRow;
  mark?: Mark;
  onMark?: (a: AssetRow, m: Mark | null) => void;
  onClose: () => void;
  position: { at: number; of: number };
  onStep: (by: number) => void;
}) {
  // The full row — size, checksum, coordinates, every phone check — is
  // fetched for the one capture being looked at, never for a tile.
  const detail = useQuery({
    queryKey: galleryKeys.asset(id),
    queryFn: () => get<AssetRow>(`/assets/${id}`),
    enabled: !known,
    staleTime: 60_000,
  });
  const asset = known ?? detail.data;
  if (!asset) {
    return (
      <div className="btnrow" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span className="small muted">
          {detail.isError ? "Could not load this capture." : `Loading capture ${position.at} of ${position.of}…`}
        </span>
        <Button size="sm" onClick={onClose}>Close preview</Button>
      </div>
    );
  }
  return (
    <AssetPreview asset={asset} mark={mark} onMark={onMark} onClose={onClose} position={position} onStep={onStep} />
  );
}

/* --- one tile ------------------------------------------------------------------ */

/** 95 → "1:35"; an hour and more → "1:02:05" */
export function fmtClock(seconds: number): string {
  const t = Math.max(0, Math.round(seconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s).padStart(2, "0")}`;
}

const reasonLabel = (code: string | null | undefined): string =>
  RETAKE_REASONS.find(([v]) => v === code)?.[1] ?? code ?? "";

function Tile({
  row,
  selected,
  mark,
  onOpen,
  onBroken,
}: {
  row: GalleryRow;
  selected: boolean;
  mark?: Mark;
  onOpen: (id: string) => void;
  onBroken: () => void;
}) {
  // A capture the aggregator sent back is still viewable by the supplier's own
  // people — the worker has to see which frame to shoot again.
  const viewable = row.status === "ready" || row.status === "rejected";
  const meta = statusMeta(assetStatus, row.status);
  const label = row.filename ?? row.id.slice(0, 8);
  const clip = isVideo(row);
  // The poster link that would not load. Keyed by the link, not a flag: when
  // the page is re-signed the same tile is handed a fresh thumb_url under the
  // same key, and that alone must bring the picture back.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const broken = brokenUrl === row.thumb_url;
  const badge = row.badge ? BADGE[row.badge.code] : undefined;
  return (
    <div
      className="asset"
      role={viewable ? "button" : undefined}
      tabIndex={viewable ? 0 : -1}
      aria-label={`${label}, ${meta.label}`}
      aria-pressed={viewable ? selected : undefined}
      title={viewable ? label : `${label} — ${meta.label}${row.quarantine_reason ? `: ${row.quarantine_reason}` : ""}`}
      onClick={() => viewable && onOpen(row.id)}
      onKeyDown={(e) => {
        if (viewable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(row.id);
        }
      }}
      style={{
        overflow: "hidden", cursor: viewable ? "pointer" : "default",
        outline: selected ? "2px solid var(--accent)" : undefined,
        opacity: viewable ? 1 : 0.6,
      }}
    >
      {row.thumb_url && !broken ? (
        // The poster the phone uploaded beside the capture, ~30 KB. The tile
        // itself is the button and carries the label, so the picture says
        // nothing twice.
        <img
          src={row.thumb_url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => {
            setBrokenUrl(row.thumb_url);
            onBroken();
          }}
        />
      ) : (
        // No poster yet — captures from before the phone made them, console
        // uploads, or a link that died. The glyph says what kind of thing it
        // is; the duration and the status say the rest.
        <span className="muted" aria-hidden style={{ fontSize: 18 }}>
          {clip ? "▶" : viewable ? "◻" : "◌"}
        </span>
      )}
      {clip && row.duration_s != null && <span className="dur">{fmtClock(row.duration_s)}</span>}
      {mark && (
        // The reviewer's own mark, over everything else on the tile: it is the
        // thing they are keeping track of as they work down the batch.
        <span
          className="tag"
          aria-hidden
          title={mark.outcome === "retake" ? `Retake — ${reasonLabel(mark.reason)}` : "Keep"}
          style={{
            top: 3, right: 3, bottom: "auto", left: "auto",
            background: mark.outcome === "retake" ? "var(--t-critical)" : "var(--accent)",
          }}
        >
          {mark.outcome === "retake" ? "✗" : "✓"}
        </span>
      )}
      <span className="tag">{meta.label}</span>
      {row.badge && (
        // Amber: the phone thought this showed the wrong thing and the worker
        // kept it anyway, or a clip stood still or went dark for part of its
        // length. Grey: the phone could not look at all. Either way a hint for
        // the reviewer's eye, not a verdict.
        <span
          className="tag"
          title={row.badge.message}
          style={{ top: 3, left: 3, bottom: "auto", background: badge?.tone === "grey" ? "#5B6873" : "#B45309" }}
        >
          {badge?.text ?? row.badge.code}
        </span>
      )}
    </div>
  );
}
