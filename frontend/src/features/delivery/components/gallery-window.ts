// delivery/components — the arithmetic behind GalleryGrid's window, kept
// apart from the DOM so it can be tested as numbers (db/530).
//
// Tiles are a fixed 4:3 in a known number of columns, so a row's height is
// arithmetic: no measuring of tiles, no observer per tile, no library. The
// grid is padded to its full height and only the rows between `first` and
// `last` are rendered; what the scroll parent shows is read in its own
// coordinates, and the grid's offset inside it is measured on every scroll
// because the preview opens above the grid in the same container and moves
// it by up to 55 vh.

/** the tile's floor, as .assetgrid's minmax(76px, 1fr) */
export const TILE_MIN = 76;
/** .assetgrid's gap (--s-2), when the stylesheet cannot be read */
export const GAP_DEFAULT = 8;
/** rows rendered beyond the visible ones on each side */
export const OVERSCAN_ROWS = 2;
/** the next page is asked for when the window is this close to the end */
export const FETCH_AHEAD_ROWS = 4;
/** The wide dialog's body (980 px less its padding) and 64 vh of a 1000 px
 *  window. Used before the first measurement, and where nothing lays out
 *  (jsdom), so the first paint is already a window rather than nothing or
 *  everything. */
export const ASSUMED_WIDTH = 948;
export const ASSUMED_VIEWPORT = 640;

/** a page's links are refreshed together this long before they expire */
export const LINK_MARGIN_MS = 2 * 60_000;
/** and never more often than this, whatever the server says */
export const LINK_FLOOR_MS = 30_000;
/** what the server signs for when the page did not say */
const EXPIRES_DEFAULT_S = 900;

/** floor((width + gap) / (76 + gap)): the columns the CSS minmax(76px, 1fr) would
 *  lay out, computed here so JS and CSS agree on the count. */
export function columnsFor(width: number, gap: number): number {
  return Math.max(1, Math.floor((width + gap) / (TILE_MIN + gap)));
}

/** one tile's width once the columns share the width and the gaps between them */
export function tileWidth(width: number, cols: number, gap: number): number {
  return (width - gap * (cols - 1)) / cols;
}

/** row pitch: the tile's 4:3 height (border-box, so the 1 px border is inside) plus the gap */
export function rowHeightFor(tile: number, gap: number): number {
  return tile * 0.75 + gap;
}

/** how many rows `count` tiles make at `cols` across; 0 for none */
export function rowsFor(count: number, cols: number): number {
  return cols > 0 ? Math.ceil(count / cols) : 0;
}

export interface Window {
  /** first and last row rendered, inclusive; last < first when there is nothing */
  first: number;
  last: number;
  /** the rows not rendered, as padding, so the scrollbar is honest */
  padTop: number;
  padBottom: number;
}

/** Which rows to render.
 *
 *  `scrollTop` and `viewport` are the scroll parent's; `offset` is where the
 *  grid starts inside it. A grid that starts below the viewport's top has a
 *  negative visible top, which clamps to row 0 — opening the preview above the
 *  grid must never make row 0 disappear. At least one row is always rendered
 *  while there are rows, so the grid has a height and tiles to focus. */
export function windowFor(a: {
  scrollTop: number;
  offset: number;
  viewport: number;
  rowHeight: number;
  totalRows: number;
  overscan?: number;
}): Window {
  const overscan = a.overscan ?? OVERSCAN_ROWS;
  if (a.totalRows <= 0 || a.rowHeight <= 0) return { first: 0, last: -1, padTop: 0, padBottom: 0 };
  const top = a.scrollTop - a.offset;
  const firstVisible = Math.max(0, Math.floor(top / a.rowHeight));
  const lastVisible = Math.ceil((top + a.viewport) / a.rowHeight) - 1;
  const first = Math.max(0, Math.min(a.totalRows - 1, firstVisible - overscan));
  const last = Math.min(a.totalRows - 1, Math.max(first, lastVisible + overscan));
  return {
    first,
    last,
    padTop: first * a.rowHeight,
    padBottom: (a.totalRows - 1 - last) * a.rowHeight,
  };
}

/** whether the rendered window has come within FETCH_AHEAD_ROWS of the loaded end */
export function wantsNextPage(last: number, totalRows: number): boolean {
  return last >= totalRows - FETCH_AHEAD_ROWS;
}

/** The grid's top in the scroll parent's content coordinates: where its
 *  rect sits now, plus what has already scrolled past. Both rects are in
 *  viewport coordinates; for the window as scroll parent its top is 0. */
export function offsetWithin(gridTop: number, parentTop: number, scrollTop: number): number {
  return gridTop - parentTop + scrollTop;
}

/** The nearest ancestor that scrolls — .dialog-body in every dialog — or
 *  null when the window does. */
export function scrollParentOf(el: Element | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const overflow = getComputedStyle(p).overflowY;
    if (overflow === "auto" || overflow === "scroll") return p;
  }
  return null;
}

/** How long a page's links can be trusted from the moment they arrived. */
export function linkLife(expiresIn: number | null | undefined): number {
  return Math.max(LINK_FLOOR_MS, (expiresIn ?? EXPIRES_DEFAULT_S) * 1000 - LINK_MARGIN_MS);
}

/** When to re-sign the pages observed now: what is left until their links go
 *  stale, never under the floor. react-query starts the interval when the
 *  pages are observed, and again as each one arrives, not when the first was
 *  fetched — so this is measured from now to the moment handed in. */
export function refetchIn(linksStaleAt: number, now = Date.now()): number {
  return Math.max(LINK_FLOOR_MS, linksStaleAt - now);
}
